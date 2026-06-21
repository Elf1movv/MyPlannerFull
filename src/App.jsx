import React from 'react';

import { useAppStore }    from './hooks/useAppStore.js';
import { LANG }           from './constants/lang.js';
import { THEME, BG_ANIM_STYLE } from './constants/theme.js';
import { formatDateLabel } from './utils/date.js';

// Components
import AuthScreen       from './components/auth/AuthScreen.jsx';
import DraggableBlocks  from './components/blocks/DraggableBlocks.jsx';
import HabitGrid        from './components/habits/HabitGrid.jsx';
import CalendarView     from './components/calendar/CalendarView.jsx';
import FullGridCalendar from './components/calendar/FullGridCalendar.jsx';
import GoalsPanel       from './components/goals/GoalsPanel.jsx';
import EventsPanel      from './components/events/EventsPanel.jsx';
import CalAddEventBtn   from './components/events/CalAddEventBtn.jsx';
import StatsView        from './components/stats/StatsView.jsx';
import BacklogPanel     from './components/widgets/BacklogPanel.jsx';
import WeatherWidget    from './components/widgets/WeatherWidget.jsx';
import QuickLinks       from './components/widgets/QuickLinks.jsx';
import PomodoroTimer    from './components/widgets/PomodoroTimer.jsx';
import TodayDropButton  from './components/layout/TodayDropButton.jsx';

export default function App() {
  const store = useAppStore();
  const {
    user, authLoading, setUser, signOut,
    appData, lang, setLang,
    tab, setTab,
    todayMode, setTodayMode,
    goalsPeriod, setGoalsPeriod,
    showTodayDrop, setShowTodayDrop,
    habitPeriod, setHabitPeriod,
    selectedDay, handleSelectDay,
    calView, setCalView,
    syncing, lastSync, isOnline,
    today, isToday, isFuture, isPast,
    isEditable, isStatusEditable, currentBlocks,
    hUpdateBlock, hDeleteBlock, hReorder,
    hAddTask, hDeleteTask, hSetStatus,
    hUpdateTaskName, hToggleRoutine,
    hUpdateRoutineLabel, hUpdateRoutineDays, hUpdateBacklog,
    hAddGoal, hDeleteGoal, hSetGoalStatus, hUpdateGoalText, hReorderGoals,
    hToggleHabit, hAddHabit, hDeleteHabit, hRenameHabit,
    hAddEvent, hDeleteEvent, hUpdateEvent,
    exportData, importData,
  } = store;

  const L = LANG[lang];

  const formatDate = (key) => formatDateLabel(key, lang, L.monthsShort);

  const headerTitle =
    tab === 'habits'   ? (lang === 'ru' ? 'Мои привычки'   : 'My Habits')   :
    tab === 'calendar' ? (lang === 'ru' ? 'Мой календарь'  : 'My Calendar') :
    tab === 'stats'    ? (lang === 'ru' ? 'Моя статистика' : 'My Stats')    :
    L.title;

  const tabStyle = t => ({
    padding: '8px 18px', borderRadius: 30, border: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: tab === t ? 700 : 600,
    background: tab === t ? '#fff' : 'transparent',
    color: tab === t ? '#2D4A6B' : '#9AAAB8',
    transition: 'all 0.16s', fontFamily: 'inherit',
    boxShadow: tab === t ? '0 3px 10px rgba(45,74,107,0.12)' : 'none',
  });

  // Общий набор props для DraggableBlocks (не дублируем)
  const blockProps = {
    lang, isEditable, isStatusEditable,
    onUpdateBlock: hUpdateBlock,   onDeleteBlock:  hDeleteBlock,
    onAddTask:     hAddTask,       onDeleteTask:   hDeleteTask,
    onSetTaskStatus: hSetStatus,   onUpdateTaskName: hUpdateTaskName,
    onToggleRoutine: hToggleRoutine,
    onUpdateRoutineLabel: hUpdateRoutineLabel,
    onUpdateRoutineDays:  hUpdateRoutineDays,
    onReorder: hReorder,
  };

  // ── Guards ─────────────────────────────────────────────────────────
  if (authLoading) return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(125deg,#DBEAFB 0%,#E6F5ED 30%,#FCF7E2 60%,#FDEAE0 100%)',
    }}>
      <div style={{ fontSize: 32 }}>⌛</div>
    </div>
  );

  if (!user) return (
    <AuthScreen onAuth={u => { setUser(u); }} />
  );

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="animated-bg" style={{ minHeight: '100vh', fontFamily: "'DM Sans','Helvetica Neue',Arial,sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
      <style>{BG_ANIM_STYLE}</style>

      {/* ── Header ── */}
      <header className="v17-header">
        <div className="v17-brand">
          <div className="v17-logo">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
              <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="v17-brand-title">{headerTitle}</div>
            <span className="v17-brand-date">{formatDate(today)}</span>
          </div>
        </div>

        <div className="v17-weather-pill">
          <WeatherWidget lang={lang} />
        </div>

        {!isOnline && (
          <span style={{ fontSize: 11, color: '#E24B4A', fontWeight: 600 }}>📵 Офлайн</span>
        )}
        {isOnline && syncing && (
          <span className="v17-sync-ok v17-sync-ing">☁ Синхронизация...</span>
        )}
        {isOnline && !syncing && lastSync && (
          <span className="v17-sync-ok">✓ Синхронизировано</span>
        )}

        <div className="v17-actions">
          <div className="v17-lang-sw">
            {['ru', 'en'].map(l => (
              <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <QuickLinks lang={lang} />
          <button className="v17-hbtn" onClick={exportData}>↑ {L.export}</button>
          <button className="v17-hbtn" onClick={signOut}
            style={{ color: '#EE5B52', borderColor: 'rgba(238,91,82,0.3)' }}>
            ⎋ {lang === 'ru' ? 'Выйти' : 'Sign out'}
          </button>
          <label className="v17-hbtn" style={{ cursor: 'pointer' }}>
            ↓ {L.import}
            <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
          </label>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '22px 24px 80px' }}>

        {/* Tabs */}
        <div className="v17-tabs">
          <TodayDropButton
            tab={tab} todayMode={todayMode} lang={lang} L={L}
            showTodayDrop={showTodayDrop} setShowTodayDrop={setShowTodayDrop}
            setTab={setTab} setTodayMode={setTodayMode}
            setGoalsPeriod={setGoalsPeriod} tabStyle={tabStyle}
          />
          {[['habits', L.habits], ['calendar', L.calendar], ['stats', L.stats]].map(([t, label]) => (
            <button key={t} className={'v17-tab' + (tab === t ? ' on' : '')}
              onClick={() => { setTab(t); setShowTodayDrop(false); }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── TODAY: day view ── */}
        {tab === 'today' && todayMode === 'day' && (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <DraggableBlocks
                blocks={appData.days[today]?.blocks || []}
                {...blockProps}
                isEditable={true}
                isStatusEditable={false}
              />
            </div>
            <EventsPanel
              events={appData.events || []} lang={lang}
              onAdd={hAddEvent} onDelete={hDeleteEvent} onUpdate={hUpdateEvent}
            />
          </div>
        )}

        {/* ── TODAY: goals ── */}
        {tab === 'today' && (todayMode === 'month' || todayMode === 'year') && (
          <GoalsPanel
            mode={todayMode} goalsPeriod={goalsPeriod} setGoalsPeriod={setGoalsPeriod}
            goals={appData.goals || {}} lang={lang}
            onAdd={hAddGoal} onDelete={hDeleteGoal}
            onSetStatus={hSetGoalStatus} onUpdateText={hUpdateGoalText}
            onReorder={hReorderGoals}
          />
        )}

        {/* ── HABITS ── */}
        {tab === 'habits' && (
          <div>
            <div style={{
              display: 'flex', gap: 3, marginBottom: 20,
              background: 'rgba(255,255,255,0.35)', borderRadius: 20, padding: 3, width: 'fit-content',
            }}>
              {[['week', L.week], ['month', L.month], ['year', L.year]].map(([p, label]) => (
                <button key={p} onClick={() => setHabitPeriod(p)}
                  style={{
                    padding: '5px 16px', borderRadius: 18, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
                    background: habitPeriod === p ? 'rgba(255,255,255,0.9)' : 'transparent',
                    color: habitPeriod === p ? THEME.text : THEME.textLight, transition: 'all 0.2s',
                  }}>
                  {label}
                </button>
              ))}
            </div>
            <HabitGrid
              habits={appData.habits || []} habitLog={appData.habitLog || {}}
              lang={lang} period={habitPeriod}
              onToggle={hToggleHabit} onAddHabit={hAddHabit}
              onDeleteHabit={hDeleteHabit} onRenameHabit={hRenameHabit}
            />
          </div>
        )}

        {/* ── CALENDAR ── */}
        {tab === 'calendar' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                display: 'flex', background: 'rgba(255,255,255,0.35)',
                borderRadius: 20, padding: 3, gap: 2,
              }}>
                {[['mini', lang === 'ru' ? 'Компактный' : 'Compact'],
                  ['grid', lang === 'ru' ? 'Полный'     : 'Full grid']].map(([v, label]) => (
                  <button key={v} onClick={() => setCalView(v)}
                    style={{
                      padding: '5px 16px', borderRadius: 18, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
                      background: calView === v ? 'rgba(255,255,255,0.9)' : 'transparent',
                      color: calView === v ? THEME.text : THEME.textLight, transition: 'all 0.2s',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {calView === 'mini' && (
              <div className="cal-compact">
                <div style={{
                  background: 'rgba(255,255,255,0.9)', borderRadius: 22,
                  border: '1px solid rgba(255,255,255,0.7)',
                  boxShadow: '0 18px 50px rgba(58,72,98,0.10)', position: 'sticky', top: 78,
                }}>
                  <CalendarView
                    appData={appData} lang={lang}
                    selectedDay={selectedDay} onSelectDay={handleSelectDay}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: THEME.text }}>
                      {formatDate(selectedDay)}
                    </span>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 10,
                      background: isToday ? 'rgba(255,245,238,0.8)' : isFuture ? 'rgba(235,244,253,0.8)' : 'rgba(245,244,240,0.8)',
                      color: isToday ? THEME.sunsetDeep : isFuture ? '#0C447C' : THEME.textLight,
                    }}>
                      {isToday ? L.todayBadge : isFuture ? L.planningBadge : L.historyBadge}
                    </span>
                    {isFuture && (
                      <CalAddEventBtn date={selectedDay} lang={lang} onAdd={hAddEvent} />
                    )}
                  </div>
                  <DraggableBlocks blocks={currentBlocks} {...blockProps} />
                  <BacklogPanel backlog={appData.backlog} lang={lang} onUpdate={hUpdateBacklog} />
                </div>
              </div>
            )}

            {calView === 'grid' && (
              <div>
                <FullGridCalendar
                  appData={appData} lang={lang}
                  selectedDay={selectedDay} onSelectDay={handleSelectDay}
                />
                {selectedDay && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: THEME.text }}>
                        {formatDate(selectedDay)}
                      </span>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 10,
                        background: isToday ? 'rgba(255,245,238,0.8)' : isFuture ? 'rgba(235,244,253,0.8)' : 'rgba(245,244,240,0.8)',
                        color: isToday ? THEME.sunsetDeep : isFuture ? '#0C447C' : THEME.textLight,
                      }}>
                        {isToday ? L.todayBadge : isFuture ? L.planningBadge : L.historyBadge}
                      </span>
                    </div>
                    <DraggableBlocks blocks={currentBlocks} {...blockProps} />
                    <BacklogPanel backlog={appData.backlog} lang={lang} onUpdate={hUpdateBacklog} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STATS ── */}
        {tab === 'stats' && (
          <StatsView appData={appData} lang={lang} />
        )}
      </main>

      <PomodoroTimer lang={lang} />
    </div>
  );
}
