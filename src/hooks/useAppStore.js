import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase }            from '../lib/supabase.js';
import * as db                 from '../lib/db.js';
import { subscribeToUserData } from '../lib/realtime.js';
import { getLocalToday, localDateStr } from '../utils/date.js';
import { uid, loadAppData, applyNewDay, buildNewDay } from '../utils/data.js';

/**
 * Центральный хук приложения.
 * Инкапсулирует весь стейт, синхронизацию с БД и Realtime.
 * Возвращает данные и handlers для передачи в компоненты через props.
 */
export function useAppStore() {
  // ── State ──────────────────────────────────────────────────────────
  const [user,           setUser]           = useState(null);
  const [authLoading,    setAuthLoading]    = useState(true);
  const [appData,        setAppData]        = useState(loadAppData);
  const [lang,           setLang]           = useState('ru');
  const [tab,            setTab]            = useState('today');
  const [todayMode,      setTodayMode]      = useState('day');
  const [goalsPeriod,    setGoalsPeriod]    = useState('month');
  const [showTodayDrop,  setShowTodayDrop]  = useState(false);
  const [habitPeriod,    setHabitPeriod]    = useState('week');
  const [selectedDay,    setSelectedDay]    = useState(getLocalToday);
  const [calView,        setCalView]        = useState('mini');
  const [syncing,        setSyncing]        = useState(false);
  const [lastSync,       setLastSync]       = useState(null);
  const [isOnline,       setIsOnline]       = useState(navigator.onLine);
  const [previewBlocks,  setPreviewBlocks]  = useState(null);

  // ── Refs ───────────────────────────────────────────────────────────
  const userRef               = useRef(null);
  const unsubscribeRealtimeRef = useRef(null);
  // Флаг: игнорировать RT INSERT если сами только что записали (5 сек)
  const realtimeIgnoreUntil   = useRef(0);
  const isLangFromDB          = useRef(false);

  // ── Helpers ────────────────────────────────────────────────────────
  /** Ставим флаг что следующие RT-события — наши собственные */
  const markOwnWrite = useCallback(() => {
    realtimeIgnoreUntil.current = Date.now() + 5000;
  }, []);

  const isOwnWrite = () => Date.now() < realtimeIgnoreUntil.current;

  /** Обновляет blocks конкретного дня через functional update */
  const updateDay = useCallback((dateKey, updater) => {
    setAppData(d => ({
      ...d,
      days: {
        ...d.days,
        [dateKey]: {
          ...d.days[dateKey],
          blocks: updater(d.days[dateKey]?.blocks || []),
        },
      },
    }));
  }, []);

  // ── Auth ────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      userRef.current = u;
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      userRef.current = u;
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Online / Offline ────────────────────────────────────────────────
  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online',  on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // ── localStorage persistence ────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('dailyplanner_v3', JSON.stringify(appData));
  }, [appData]);

  // ── Date rollover (проверяем каждую минуту) ─────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const today = getLocalToday();
      setAppData(d => d.lastDate !== today ? applyNewDay(d, today) : d);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Apply new-day on startup ────────────────────────────────────────
  useEffect(() => {
    setAppData(d => applyNewDay(d, getLocalToday()));
  }, []);

  // ── Sync lang → DB (не перезаписываем то что только прочитали) ──────
  useEffect(() => {
    if (isLangFromDB.current) {
      isLangFromDB.current = false;
      return;
    }
    if (userRef.current?.id) {
      db.saveSettings(userRef.current.id, lang);
    }
  }, [lang]);

  // ── Load from DB + Realtime on login ───────────────────────────────
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    (async () => {
      setSyncing(true);
      const today    = getLocalToday();
      const dateFrom = localDateStr(new Date(Date.now() - 90 * 86_400_000));
      const dateTo   = localDateStr(new Date(Date.now() + 30 * 86_400_000));

      const [
        blocksRows, tasksRows, habitsRows,
        habitLogRows, goalsRows, eventsRows, settingsRow,
      ] = await Promise.all([
        db.fetchBlocks(user.id),
        db.fetchTasks(user.id, dateFrom, dateTo),
        db.fetchHabits(user.id),
        db.fetchHabitLog(user.id, dateFrom, today),
        db.fetchGoals(user.id),
        db.fetchEvents(user.id),
        db.fetchSettings(user.id),
      ]);

      if (cancelled) return;

      const hasAnyCloudData =
        (blocksRows?.length   > 0) || (tasksRows?.length    > 0) ||
        (habitsRows?.length   > 0) || (habitLogRows?.length  > 0) ||
        (goalsRows?.length    > 0) || (eventsRows?.length    > 0);

      if (hasAnyCloudData) {
        const cloudDays = db.buildDaysFromDB(blocksRows || [], tasksRows || []);

        // Скелет блоков для сегодня если задач ещё нет —
        // нужен чтобы applyNewDay правильно перенёс рутины
        if (!cloudDays[today] && blocksRows?.length > 0) {
          cloudDays[today] = { blocks: db.buildBlockSkeletonsFromDB(blocksRows) };
        }

        setAppData(local => applyNewDay({
          ...local,
          days:     { ...local.days, ...cloudDays },
          habits:   db.buildHabitsFromDB(habitsRows   || []),
          habitLog: db.buildHabitLogFromDB(habitLogRows || []),
          goals:    db.buildGoalsFromDB(goalsRows      || []),
          events:   db.buildEventsFromDB(eventsRows    || []),
          lastDate: today,
        }, today));
      } else {
        setAppData(local => applyNewDay(local, today));
      }

      if (settingsRow?.lang) {
        isLangFromDB.current = true;
        setLang(settingsRow.lang);
      }

      setSyncing(false);
      setLastSync(new Date());

      // ── Realtime ─────────────────────────────────────────────────
      if (unsubscribeRealtimeRef.current) unsubscribeRealtimeRef.current();

      unsubscribeRealtimeRef.current = subscribeToUserData(user.id, {

        onBlocksChange: ({ eventType, new: row, old: oldRow }) => {
          setAppData(d => {
            const days = { ...d.days };
            if (eventType === 'DELETE') {
              Object.keys(days).forEach(date => {
                days[date] = {
                  ...days[date],
                  blocks: (days[date]?.blocks || []).filter(b => b.id !== oldRow.id),
                };
              });
            } else if (eventType === 'INSERT') {
              const t = getLocalToday();
              const exists = (days[t]?.blocks || []).some(b => b.id === row.id);
              if (!exists && !isOwnWrite()) {
                const newBlock = {
                  id: row.id, colorId: row.color_id,
                  names: { ru: row.name_ru, en: row.name_en },
                  pinned: row.pinned, position: row.position, tasks: [],
                };
                days[t] = {
                  ...days[t],
                  blocks: [...(days[t]?.blocks || []), newBlock]
                    .sort((a, b) => a.position - b.position),
                };
              }
            } else {
              // UPDATE — обновляем во ВСЕХ днях (важно для pinned)
              Object.keys(days).forEach(date => {
                days[date] = {
                  ...days[date],
                  blocks: (days[date]?.blocks || []).map(b =>
                    b.id === row.id
                      ? { ...b, colorId: row.color_id,
                          names: { ru: row.name_ru, en: row.name_en },
                          pinned: row.pinned, position: row.position }
                      : b),
                };
              });
            }
            return { ...d, days };
          });
        },

        onTasksChange: ({ eventType, new: row, old: oldRow }) => {
          setAppData(d => {
            const days = { ...d.days };
            if (eventType === 'DELETE') {
              Object.keys(days).forEach(date => {
                days[date] = {
                  ...days[date],
                  blocks: (days[date]?.blocks || []).map(b => ({
                    ...b,
                    tasks: b.tasks.filter(t => t.id !== oldRow.id),
                  })),
                };
              });
            } else {
              const date    = row.date;
              const existing = days[date] || { blocks: [] };
              let blocks    = existing.blocks;

              if (!blocks.some(b => b.id === row.block_id)) {
                let meta = null;
                for (const dd of Object.values(days)) {
                  meta = (dd?.blocks || []).find(b => b.id === row.block_id);
                  if (meta) break;
                }
                if (!meta && !isOwnWrite()) {
                  meta = {
                    id: row.block_id, colorId: 'amber',
                    names: { ru: 'Блок', en: 'Block' },
                    pinned: false, position: blocks.length,
                  };
                }
                if (meta) blocks = [...blocks, { ...meta, tasks: [] }];
              }

              const taskData = {
                id: row.id,
                names: { ru: row.name_ru, en: row.name_en },
                status: row.status, type: row.type,
                routine: row.routine,
                routineLabel: row.routine_label,
                routineDays:  row.routine_days,
                position: row.position,
              };

              blocks = blocks.map(b => {
                if (b.id !== row.block_id) return b;
                const exists = b.tasks.some(t => t.id === row.id);
                if (eventType === 'INSERT') {
                  return exists ? b : { ...b, tasks: [...b.tasks, taskData] };
                }
                return {
                  ...b,
                  tasks: exists
                    ? b.tasks.map(t => t.id === row.id ? taskData : t)
                    : b.tasks,
                };
              });

              days[date] = { ...existing, blocks };
            }
            return { ...d, days };
          });
        },

        onHabitsChange: ({ eventType, new: row, old: oldRow }) => {
          setAppData(d => {
            let habits = d.habits || [];
            if (eventType === 'DELETE') {
              habits = habits.filter(h => h.id !== oldRow.id);
            } else if (eventType === 'INSERT') {
              if (!habits.some(h => h.id === row.id)) {
                habits = [...habits, {
                  id: row.id,
                  names: { ru: row.name_ru, en: row.name_en },
                  color: row.color, position: row.position,
                }];
              }
            } else {
              habits = habits.map(h =>
                h.id === row.id
                  ? { ...h, names: { ru: row.name_ru, en: row.name_en },
                      color: row.color, position: row.position }
                  : h);
            }
            return { ...d, habits };
          });
        },

        onHabitLogChange: ({ new: row }) => {
          if (!row) return;
          setAppData(d => ({
            ...d,
            habitLog: {
              ...d.habitLog,
              [row.date]: {
                ...(d.habitLog[row.date] || {}),
                [row.habit_id]: row.done,
              },
            },
          }));
        },

        onGoalsChange: ({ eventType, new: row, old: oldRow }) => {
          setAppData(d => {
            const goals = { ...d.goals };
            if (eventType === 'DELETE') {
              Object.keys(goals).forEach(p => {
                goals[p] = goals[p].filter(g => g.id !== oldRow.id);
              });
            } else if (eventType === 'INSERT') {
              const list = goals[row.period] || [];
              if (!list.some(g => g.id === row.id)) {
                goals[row.period] = [
                  ...list,
                  { id: row.id, text: row.text, status: row.status, position: row.position },
                ];
              }
            } else {
              if (goals[row.period]) {
                goals[row.period] = goals[row.period].map(g =>
                  g.id === row.id
                    ? { ...g, text: row.text, status: row.status, position: row.position }
                    : g);
              }
            }
            return { ...d, goals };
          });
        },

        onEventsChange: ({ eventType, new: row, old: oldRow }) => {
          setAppData(d => {
            let events = d.events || [];
            if (eventType === 'DELETE') {
              events = events.filter(e => e.id !== oldRow.id);
            } else if (eventType === 'INSERT') {
              if (!events.some(e => e.id === row.id)) {
                events = [...events, {
                  id: row.id, date: row.date, title: row.title,
                  time: row.time, desc: row.description, urgency: row.urgency,
                }];
              }
            } else {
              events = events.map(e =>
                e.id === row.id
                  ? { ...e, date: row.date, title: row.title,
                      time: row.time, desc: row.description, urgency: row.urgency }
                  : e);
            }
            return { ...d, events };
          });
        },
      });
    })();

    return () => {
      cancelled = true;
      if (unsubscribeRealtimeRef.current) unsubscribeRealtimeRef.current();
    };
  }, [user]);

  // ── Computed values ─────────────────────────────────────────────────
  const today            = getLocalToday();
  const isToday          = selectedDay === today;
  const isFuture         = selectedDay > today;
  const isPast           = selectedDay < today;
  const isEditable       = isToday || isFuture;
  const isStatusEditable = isPast;
  const currentBlocks    = isFuture
    ? (previewBlocks ?? appData.days[selectedDay]?.blocks ?? [])
    : (appData.days[selectedDay]?.blocks || []);

  const handleSelectDay = useCallback((day) => {
    setSelectedDay(day);
    const t = getLocalToday();
    if (day > t) {
      setPreviewBlocks(buildNewDay(appData.days[t]?.blocks || [], day));
    } else {
      setPreviewBlocks(null);
    }
  }, [appData]);

  // ── BLOCK HANDLERS ─────────────────────────────────────────────────
  const hUpdateBlock = useCallback((bid, patch) => {
    const dateKey = getLocalToday();
    markOwnWrite();

    if (bid === '__add__') {
      updateDay(dateKey, blocks => {
        const newBlock = { ...patch, tasks: [] };
        db.upsertBlock(db.blockToRow(newBlock, userRef.current?.id, blocks.length));
        return [...blocks, newBlock];
      });
      return;
    }

    // Обновляем во ВСЕХ днях — критично для pinned
    setAppData(d => {
      const days = { ...d.days };
      let updatedBlock = null;
      let updatedIdx   = -1;

      Object.keys(days).forEach(date => {
        const blocks = (days[date]?.blocks || []).map((b, i) => {
          if (b.id !== bid) return b;
          const updated = { ...b, ...patch };
          if (date === dateKey) { updatedBlock = updated; updatedIdx = i; }
          return updated;
        });
        days[date] = { ...days[date], blocks };
      });

      if (updatedBlock && updatedIdx !== -1) {
        db.upsertBlock(db.blockToRow(updatedBlock, userRef.current?.id, updatedIdx));
      }
      return { ...d, days };
    });
  }, [updateDay, markOwnWrite]);

  const hDeleteBlock = useCallback((bid) => {
    markOwnWrite();
    setAppData(d => {
      const days = { ...d.days };
      Object.keys(days).forEach(date => {
        days[date] = {
          ...days[date],
          blocks: (days[date]?.blocks || []).filter(b => b.id !== bid),
        };
      });
      return { ...d, days };
    });
    db.deleteBlock(bid);
    db.deleteTasksByBlock(bid);
  }, [markOwnWrite]);

  // ── TASK HANDLERS ──────────────────────────────────────────────────
  const hAddTask = useCallback((bid, task) => {
    markOwnWrite();
    updateDay(selectedDay, blocks => {
      const updated  = blocks.map(b => b.id === bid ? { ...b, tasks: [...b.tasks, task] } : b);
      const block    = updated.find(b => b.id === bid);
      const position = block ? block.tasks.length - 1 : 0;
      db.upsertTask(db.taskToRow(task, bid, selectedDay, userRef.current?.id, position));
      return updated;
    });
  }, [selectedDay, updateDay, markOwnWrite]);

  const hDeleteTask = useCallback((bid, tid) => {
    markOwnWrite();
    updateDay(selectedDay, blocks =>
      blocks.map(b => b.id === bid
        ? { ...b, tasks: b.tasks.filter(t => t.id !== tid) }
        : b));
    db.deleteTask(tid);
  }, [selectedDay, updateDay, markOwnWrite]);

  const hSetStatus = useCallback((bid, tid, status) => {
    markOwnWrite();
    updateDay(selectedDay, blocks => {
      const updated = blocks.map(b => b.id === bid
        ? { ...b, tasks: b.tasks.map(t => t.id === tid ? { ...t, status } : t) }
        : b);
      const block = updated.find(b => b.id === bid);
      const idx   = block?.tasks.findIndex(t => t.id === tid) ?? -1;
      if (block && idx !== -1)
        db.upsertTask(db.taskToRow(block.tasks[idx], bid, selectedDay, userRef.current?.id, idx));
      return updated;
    });
  }, [selectedDay, updateDay, markOwnWrite]);

  const hUpdateTaskName = useCallback((bid, tid, name) => {
    markOwnWrite();
    updateDay(selectedDay, blocks => {
      const updated = blocks.map(b => b.id === bid
        ? { ...b, tasks: b.tasks.map(t =>
            t.id === tid ? { ...t, names: { ...t.names, [lang]: name } } : t) }
        : b);
      const block = updated.find(b => b.id === bid);
      const idx   = block?.tasks.findIndex(t => t.id === tid) ?? -1;
      if (block && idx !== -1)
        db.upsertTask(db.taskToRow(block.tasks[idx], bid, selectedDay, userRef.current?.id, idx));
      return updated;
    });
  }, [selectedDay, lang, updateDay, markOwnWrite]);

  const hToggleRoutine = useCallback((bid, tid) => {
    markOwnWrite();
    setAppData(d => {
      const dateKey   = selectedDay;
      const dayBlocks = (d.days[dateKey]?.blocks || []).map(b => b.id === bid
        ? { ...b, tasks: b.tasks.map(t =>
            t.id === tid ? { ...t, routine: !t.routine } : t) }
        : b);
      const block = dayBlocks.find(b => b.id === bid);
      const idx   = block?.tasks.findIndex(t => t.id === tid) ?? -1;
      if (block && idx !== -1)
        db.upsertTask(db.taskToRow(block.tasks[idx], bid, dateKey, userRef.current?.id, idx));

      const t       = getLocalToday();
      const newDays = { ...d.days, [dateKey]: { ...d.days[dateKey], blocks: dayBlocks } };
      Object.keys(newDays).forEach(k => { if (k > t) newDays[k] = { blocks: [] }; });
      return { ...d, days: newDays };
    });
  }, [selectedDay, markOwnWrite]);

  const hUpdateRoutineLabel = useCallback((bid, tid, label) => {
    markOwnWrite();
    updateDay(selectedDay, blocks => {
      const updated = blocks.map(b => b.id === bid
        ? { ...b, tasks: b.tasks.map(t =>
            t.id === tid ? { ...t, routineLabel: label } : t) }
        : b);
      const block = updated.find(b => b.id === bid);
      const idx   = block?.tasks.findIndex(t => t.id === tid) ?? -1;
      if (block && idx !== -1)
        db.upsertTask(db.taskToRow(block.tasks[idx], bid, selectedDay, userRef.current?.id, idx));
      return updated;
    });
  }, [selectedDay, updateDay, markOwnWrite]);

  const hUpdateRoutineDays = useCallback((bid, tid, routineDays) => {
    markOwnWrite();
    setAppData(d => {
      const dateKey   = selectedDay;
      const dayBlocks = (d.days[dateKey]?.blocks || []).map(b => b.id === bid
        ? { ...b, tasks: b.tasks.map(t =>
            t.id === tid ? { ...t, routineDays } : t) }
        : b);
      const block = dayBlocks.find(b => b.id === bid);
      const idx   = block?.tasks.findIndex(t => t.id === tid) ?? -1;
      if (block && idx !== -1)
        db.upsertTask(db.taskToRow(block.tasks[idx], bid, dateKey, userRef.current?.id, idx));

      const t       = getLocalToday();
      const newDays = { ...d.days, [dateKey]: { ...d.days[dateKey], blocks: dayBlocks } };
      Object.keys(newDays).forEach(k => { if (k > t) newDays[k] = { blocks: [] }; });
      return { ...d, days: newDays };
    });
  }, [selectedDay, markOwnWrite]);

  const hUpdateBacklog = useCallback((updates) => {
    setAppData(d => ({ ...d, backlog: { ...d.backlog, ...updates } }));
  }, []);

  const hReorder = useCallback((newBlocks) => {
    updateDay(selectedDay, () => newBlocks);
    newBlocks.forEach((block, idx) => {
      db.upsertBlock(db.blockToRow(block, userRef.current?.id, idx));
    });
  }, [selectedDay, updateDay]);

  // ── GOAL HANDLERS ──────────────────────────────────────────────────
  const hAddGoal = useCallback((period, text) => {
    const newGoal = { id: uid(), text, status: 'pending' };
    markOwnWrite();
    setAppData(d => {
      const list = d.goals?.[period] || [];
      db.upsertGoal(db.goalToRow(newGoal, period, userRef.current?.id, list.length));
      return { ...d, goals: { ...d.goals, [period]: [...list, newGoal] } };
    });
  }, [markOwnWrite]);

  const hDeleteGoal = useCallback((period, id) => {
    markOwnWrite();
    setAppData(d => ({
      ...d,
      goals: { ...d.goals, [period]: (d.goals?.[period] || []).filter(g => g.id !== id) },
    }));
    db.deleteGoal(id);
  }, [markOwnWrite]);

  const hSetGoalStatus = useCallback((period, id, status) => {
    setAppData(d => {
      const list = d.goals?.[period] || [];
      const idx  = list.findIndex(g => g.id === id);
      if (idx !== -1)
        db.upsertGoal(db.goalToRow({ ...list[idx], status }, period, userRef.current?.id, idx));
      return {
        ...d,
        goals: { ...d.goals, [period]: list.map(g => g.id === id ? { ...g, status } : g) },
      };
    });
  }, []);

  const hUpdateGoalText = useCallback((period, id, text) => {
    setAppData(d => {
      const list = d.goals?.[period] || [];
      const idx  = list.findIndex(g => g.id === id);
      if (idx !== -1)
        db.upsertGoal(db.goalToRow({ ...list[idx], text }, period, userRef.current?.id, idx));
      return {
        ...d,
        goals: { ...d.goals, [period]: list.map(g => g.id === id ? { ...g, text } : g) },
      };
    });
  }, []);

  const hReorderGoals = useCallback((period, newGoals) => {
    setAppData(d => ({ ...d, goals: { ...d.goals, [period]: newGoals } }));
    newGoals.forEach((goal, idx) =>
      db.upsertGoal(db.goalToRow(goal, period, userRef.current?.id, idx)));
  }, []);

  // ── HABIT HANDLERS ─────────────────────────────────────────────────
  const hToggleHabit = useCallback((dayKey, habitId) => {
    setAppData(d => {
      const dayLog  = d.habitLog[dayKey] || {};
      const newDone = !dayLog[habitId];
      db.toggleHabitLog(userRef.current?.id, habitId, dayKey, newDone);
      return {
        ...d,
        habitLog: { ...d.habitLog, [dayKey]: { ...dayLog, [habitId]: newDone } },
      };
    });
  }, []);

  const hAddHabit = useCallback((habit) => {
    markOwnWrite();
    setAppData(d => {
      const habits = [...(d.habits || []), habit];
      db.upsertHabit(db.habitToRow(habit, userRef.current?.id, habits.length - 1));
      return { ...d, habits };
    });
  }, [markOwnWrite]);

  const hDeleteHabit = useCallback((id) => {
    markOwnWrite();
    setAppData(d => ({ ...d, habits: (d.habits || []).filter(h => h.id !== id) }));
    db.deleteHabit(id);
  }, [markOwnWrite]);

  const hRenameHabit = useCallback((id, names) => {
    setAppData(d => {
      const habits = (d.habits || []).map(h => h.id === id ? { ...h, names } : h);
      const idx    = habits.findIndex(h => h.id === id);
      if (idx !== -1)
        db.upsertHabit(db.habitToRow(habits[idx], userRef.current?.id, idx));
      return { ...d, habits };
    });
  }, []);

  // ── EVENT HANDLERS ─────────────────────────────────────────────────
  const hAddEvent = useCallback((evt) => {
    const newEvt = { id: uid(), ...evt };
    markOwnWrite();
    setAppData(d => ({ ...d, events: [...(d.events || []), newEvt] }));
    db.upsertEvent(db.eventToRow(newEvt, userRef.current?.id));
  }, [markOwnWrite]);

  const hDeleteEvent = useCallback((id) => {
    markOwnWrite();
    setAppData(d => ({ ...d, events: (d.events || []).filter(e => e.id !== id) }));
    db.deleteEvent(id);
  }, [markOwnWrite]);

  const hUpdateEvent = useCallback((id, patch) => {
    markOwnWrite();
    setAppData(d => {
      const events = (d.events || []).map(e => e.id === id ? { ...e, ...patch } : e);
      const event  = events.find(e => e.id === id);
      if (event) db.upsertEvent(db.eventToRow(event, userRef.current?.id));
      return { ...d, events };
    });
  }, [markOwnWrite]);

  // ── Export / Import ────────────────────────────────────────────────
  const exportData = useCallback(() => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' })
    );
    a.download = `planner-${getLocalToday()}.json`;
    a.click();
  }, [appData]);

  const importData = useCallback((e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      try { setAppData(JSON.parse(ev.target.result)); } catch {}
    };
    r.readAsText(f);
  }, []);

  const signOut = useCallback(async () => {
    if (unsubscribeRealtimeRef.current) unsubscribeRealtimeRef.current();
    await supabase.auth.signOut();
    localStorage.removeItem('dailyplanner_v3');
  }, []);

  // ── Return ─────────────────────────────────────────────────────────
  return {
    // Auth
    user, authLoading,
    setUser,
    signOut,

    // Data
    appData, setAppData,
    lang, setLang,

    // UI state
    tab, setTab,
    todayMode, setTodayMode,
    goalsPeriod, setGoalsPeriod,
    showTodayDrop, setShowTodayDrop,
    habitPeriod, setHabitPeriod,
    selectedDay, handleSelectDay,
    calView, setCalView,
    syncing, lastSync, isOnline,

    // Computed
    today, isToday, isFuture, isPast,
    isEditable, isStatusEditable,
    currentBlocks,

    // Block handlers
    hUpdateBlock, hDeleteBlock, hReorder,

    // Task handlers
    hAddTask, hDeleteTask, hSetStatus,
    hUpdateTaskName, hToggleRoutine,
    hUpdateRoutineLabel, hUpdateRoutineDays,
    hUpdateBacklog,

    // Goal handlers
    hAddGoal, hDeleteGoal, hSetGoalStatus,
    hUpdateGoalText, hReorderGoals,

    // Habit handlers
    hToggleHabit, hAddHabit, hDeleteHabit, hRenameHabit,

    // Event handlers
    hAddEvent, hDeleteEvent, hUpdateEvent,

    // Utils
    exportData, importData,
  };
}
