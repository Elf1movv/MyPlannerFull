import { supabase } from './supabase';

// ── BLOCKS ───────────────────────────────────────────────────────────

export async function fetchBlocks(userId) {
  try {
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('user_id', userId)
      .order('position');
    if (error) { console.warn('fetchBlocks error:', error); return null; }
    return data;
  } catch (e) { console.warn('fetchBlocks failed:', e); return null; }
}

export async function upsertBlock(block) {
  try {
    const { error } = await supabase
      .from('blocks')
      .upsert(block, { onConflict: 'id' });
    if (error) console.warn('upsertBlock error:', error);
  } catch (e) { console.warn('upsertBlock failed:', e); }
}

export async function deleteBlock(blockId) {
  try {
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', blockId);
    if (error) console.warn('deleteBlock error:', error);
  } catch (e) { console.warn('deleteBlock failed:', e); }
}

// ── TASKS ────────────────────────────────────────────────────────────

export async function fetchTasks(userId, dateFrom, dateTo) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('date', dateFrom)
      .lte('date', dateTo)
      .order('position');
    if (error) { console.warn('fetchTasks error:', error); return null; }
    return data;
  } catch (e) { console.warn('fetchTasks failed:', e); return null; }
}

export async function upsertTask(task) {
  try {
    const { error } = await supabase
      .from('tasks')
      .upsert(task, { onConflict: 'id' });
    if (error) console.warn('upsertTask error:', error);
  } catch (e) { console.warn('upsertTask failed:', e); }
}

export async function deleteTask(taskId) {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    if (error) console.warn('deleteTask error:', error);
  } catch (e) { console.warn('deleteTask failed:', e); }
}

export async function deleteTasksByBlock(blockId) {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('block_id', blockId);
    if (error) console.warn('deleteTasksByBlock error:', error);
  } catch (e) { console.warn('deleteTasksByBlock failed:', e); }
}

// ── HABITS ───────────────────────────────────────────────────────────

export async function fetchHabits(userId) {
  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('position');
    if (error) { console.warn('fetchHabits error:', error); return null; }
    return data;
  } catch (e) { console.warn('fetchHabits failed:', e); return null; }
}

export async function upsertHabit(habit) {
  try {
    const { error } = await supabase
      .from('habits')
      .upsert(habit, { onConflict: 'id' });
    if (error) console.warn('upsertHabit error:', error);
  } catch (e) { console.warn('upsertHabit failed:', e); }
}

export async function deleteHabit(habitId) {
  try {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId);
    if (error) console.warn('deleteHabit error:', error);
  } catch (e) { console.warn('deleteHabit failed:', e); }
}

// ── HABIT LOG ────────────────────────────────────────────────────────

export async function fetchHabitLog(userId, dateFrom, dateTo) {
  try {
    const { data, error } = await supabase
      .from('habit_log')
      .select('*')
      .eq('user_id', userId)
      .gte('date', dateFrom)
      .lte('date', dateTo);
    if (error) { console.warn('fetchHabitLog error:', error); return null; }
    return data;
  } catch (e) { console.warn('fetchHabitLog failed:', e); return null; }
}

export async function toggleHabitLog(userId, habitId, date, done) {
  try {
    const { error } = await supabase
      .from('habit_log')
      .upsert(
        { user_id: userId, habit_id: habitId, date, done },
        { onConflict: 'habit_id,date' }
      );
    if (error) console.warn('toggleHabitLog error:', error);
  } catch (e) { console.warn('toggleHabitLog failed:', e); }
}

// ── GOALS ────────────────────────────────────────────────────────────

export async function fetchGoals(userId) {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('position');
    if (error) { console.warn('fetchGoals error:', error); return null; }
    return data;
  } catch (e) { console.warn('fetchGoals failed:', e); return null; }
}

export async function upsertGoal(goal) {
  try {
    const { error } = await supabase
      .from('goals')
      .upsert(goal, { onConflict: 'id' });
    if (error) console.warn('upsertGoal error:', error);
  } catch (e) { console.warn('upsertGoal failed:', e); }
}

export async function deleteGoal(goalId) {
  try {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);
    if (error) console.warn('deleteGoal error:', error);
  } catch (e) { console.warn('deleteGoal failed:', e); }
}

// ── EVENTS ───────────────────────────────────────────────────────────

export async function fetchEvents(userId) {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('date');
    if (error) { console.warn('fetchEvents error:', error); return null; }
    return data;
  } catch (e) { console.warn('fetchEvents failed:', e); return null; }
}

export async function upsertEvent(event) {
  try {
    const { error } = await supabase
      .from('events')
      .upsert(event, { onConflict: 'id' });
    if (error) console.warn('upsertEvent error:', error);
  } catch (e) { console.warn('upsertEvent failed:', e); }
}

export async function deleteEvent(eventId) {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);
    if (error) console.warn('deleteEvent error:', error);
  } catch (e) { console.warn('deleteEvent failed:', e); }
}

// ── SETTINGS ─────────────────────────────────────────────────────────

export async function fetchSettings(userId) {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) { console.warn('fetchSettings error:', error); return null; }
    return data;
  } catch (e) { console.warn('fetchSettings failed:', e); return null; }
}

export async function saveSettings(userId, lang) {
  try {
    const { error } = await supabase
      .from('user_settings')
      .upsert(
        { user_id: userId, lang },
        { onConflict: 'user_id' }
      );
    if (error) console.warn('saveSettings error:', error);
  } catch (e) { console.warn('saveSettings failed:', e); }
}

// ── DATA MAPPERS ─────────────────────────────────────────────────────
// Собираем данные из нормализованных таблиц в структуру appData.days

export function buildDaysFromDB(blocks, tasks) {
  // blocks: [{id, name_ru, name_en, color_id, pinned, position, ...}]
  // tasks:  [{id, block_id, date, name_ru, name_en, status, type, routine, ...}]
  const days = {};

  // Группируем задачи по дате, затем по block_id
  const tasksByDate = {};
  for (const task of tasks) {
    if (!tasksByDate[task.date]) tasksByDate[task.date] = {};
    if (!tasksByDate[task.date][task.block_id]) tasksByDate[task.date][task.block_id] = [];
    tasksByDate[task.date][task.block_id].push(task);
  }

  // Собираем все уникальные даты из задач
  const datesWithTasks = new Set(Object.keys(tasksByDate));

  // Для каждой даты строим структуру блоков
  for (const date of datesWithTasks) {
    const tasksByBlock = tasksByDate[date];
    const dateBlocks = [];

    for (const block of blocks) {
      const blockTaskRows = tasksByBlock[block.id] || [];
      const blockTasks = blockTaskRows.map(t => ({
        id: t.id,
        names: { ru: t.name_ru, en: t.name_en },
        status: t.status,
        type: t.type,
        routine: t.routine,
        routineLabel: t.routine_label,
        routineDays: t.routine_days,
        position: t.position,
      }));

      // Включаем блок в день только если у него есть задачи на эту дату
      if (blockTasks.length > 0) {
        dateBlocks.push({
          id: block.id,
          colorId: block.color_id,
          names: { ru: block.name_ru, en: block.name_en },
          pinned: block.pinned,
          position: block.position,
          tasks: blockTasks.sort((a, b) => a.position - b.position),
        });
      }
    }

    days[date] = { blocks: dateBlocks.sort((a, b) => a.position - b.position) };
  }

  return days;
}

/**
 * Строит «скелет» блоков для сегодняшнего дня из таблицы blocks (без задач).
 * Используется когда у пользователя есть блоки в БД, но задач на сегодня ещё нет.
 * Это позволяет applyNewDay корректно перенести рутины.
 */
export function buildBlockSkeletonsFromDB(blocks) {
  return blocks.map(block => ({
    id: block.id,
    colorId: block.color_id,
    names: { ru: block.name_ru, en: block.name_en },
    pinned: block.pinned,
    position: block.position,
    tasks: [],
  })).sort((a, b) => a.position - b.position);
}

export function buildHabitLogFromDB(habitLogRows) {
  // habitLogRows: [{habit_id, date, done}, ...]
  // → { "2025-06-13": { "h1": true, "h2": false } }
  const log = {};
  for (const row of habitLogRows) {
    if (!log[row.date]) log[row.date] = {};
    log[row.date][row.habit_id] = row.done;
  }
  return log;
}

export function buildGoalsFromDB(goalsRows) {
  // goalsRows: [{id, period, text, status, position}, ...]
  // → { "2025-06": [{id, text, status}], "2025": [{id, text, status}] }
  const goals = {};
  for (const row of goalsRows) {
    if (!goals[row.period]) goals[row.period] = [];
    goals[row.period].push({ id: row.id, text: row.text, status: row.status, position: row.position });
  }
  // Сортируем внутри каждого периода
  for (const period of Object.keys(goals)) {
    goals[period].sort((a, b) => a.position - b.position);
  }
  return goals;
}

export function buildHabitsFromDB(habitsRows) {
  // habitsRows: [{id, name_ru, name_en, color, position}, ...]
  // → [{id, names: {ru, en}, color}]
  return habitsRows.map(h => ({
    id: h.id,
    names: { ru: h.name_ru, en: h.name_en },
    color: h.color,
    position: h.position,
  })).sort((a, b) => a.position - b.position);
}

export function buildEventsFromDB(eventsRows) {
  // eventsRows: [{id, date, title, time, description, urgency}, ...]
  return eventsRows.map(e => ({
    id: e.id,
    date: e.date,
    title: e.title,
    time: e.time,
    desc: e.description,
    urgency: e.urgency,
  }));
}

// ── DB MAPPERS (appData → DB row) ────────────────────────────────────

export function blockToRow(block, userId, position) {
  return {
    id: block.id,
    user_id: userId,
    name_ru: block.names?.ru || '',
    name_en: block.names?.en || '',
    color_id: block.colorId || 'amber',
    pinned: block.pinned || false,
    position: position ?? block.position ?? 0,
  };
}

export function taskToRow(task, blockId, date, userId, position) {
  return {
    id: task.id,
    user_id: userId,
    block_id: blockId,
    date: date,
    name_ru: task.names?.ru || '',
    name_en: task.names?.en || '',
    status: task.status || 'pending',
    type: task.type || 'daily',
    routine: task.routine || false,
    routine_label: task.routineLabel || null,
    routine_days: task.routineDays || null,
    position: position ?? task.position ?? 0,
  };
}

export function habitToRow(habit, userId, position) {
  return {
    id: habit.id,
    user_id: userId,
    name_ru: habit.names?.ru || '',
    name_en: habit.names?.en || '',
    color: habit.color || '#378ADD',
    position: position ?? habit.position ?? 0,
  };
}

export function goalToRow(goal, period, userId, position) {
  return {
    id: goal.id,
    user_id: userId,
    period: period,
    text: goal.text || '',
    status: goal.status || 'pending',
    position: position ?? goal.position ?? 0,
  };
}

export function eventToRow(event, userId) {
  return {
    id: event.id,
    user_id: userId,
    date: event.date,
    title: event.title || '',
    time: event.time || '',
    description: event.desc || '',
    urgency: event.urgency || 'normal',
  };
}
