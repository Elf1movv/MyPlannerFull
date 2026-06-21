import React, { useState } from 'react';
import { THEME } from '../../constants/theme.js';
import { LANG } from '../../constants/lang.js';
import { uid } from '../../utils/data.js';
import { getLocalToday, getDateKey } from '../../utils/date.js';
import EditableTitle from '../ui/EditableTitle.jsx';
import HabitAreaChart from '../ui/HabitAreaChart.jsx';

export default function HabitGrid({ habits, habitLog, lang, period, onToggle, onAddHabit, onDeleteHabit, onRenameHabit }) {
  const L = LANG[lang];
  const [addingHabit, setAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitColor, setNewHabitColor] = useState("#378ADD");
  const now = new Date();
  const HABIT_COLORS = [
    "#378ADD","#1D9E75","#FF8C42","#D4537E","#7F77DD","#D4A017",
    "#E53935","#C2185B","#3949AB","#00ACC1","#7CB342","#2E7D32",
    "#9C27B0","#0288D1","#00897B","#FF5722","#F9A825","#546E7A",
    "#6D4C41","#E91E63","#7B1FA2","#37474F","#9E9D24","#FF7043",
  ];

  const getWeekDays = () => {
    const dow = (now.getDay() + 6) % 7;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - dow + i); return getDateKey(d);
    });
  };
  const getMonthDays = () => {
    const yr = now.getFullYear(), mo = now.getMonth();
    const dim = new Date(yr, mo+1, 0).getDate();
    return Array.from({ length: dim }, (_, i) =>
      `${yr}-${String(mo+1).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`
    );
  };
  const getMonthPct = (habitId, monthIdx) => {
    const yr = now.getFullYear();
    const dim = new Date(yr, monthIdx+1, 0).getDate();
    let done = 0;
    for (let d = 1; d <= dim; d++) {
      const key = `${yr}-${String(monthIdx+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      if (habitLog[key]?.[habitId]) done++;
    }
    return { done, total: dim };
  };
  const getStreak = (habitId) => {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 366; i++) {
      if (habitLog[getDateKey(d)]?.[habitId]) { streak++; d.setDate(d.getDate()-1); } else break;
    }
    return streak;
  };

  const getCombinedChartData = () => {
    if (period === "week") {
      return getWeekDays().map((dk, i) => ({
        val: habits.filter(h => habitLog[dk]?.[h.id]).length,
        label: L.days[i],
      }));
    }
    if (period === "month") {
      return getMonthDays().map(dk => {
        const d = new Date(dk + "T12:00:00");
        return {
          val: habits.filter(h => habitLog[dk]?.[h.id]).length,
          label: String(d.getDate()),
        };
      });
    }
    return Array.from({ length: 12 }, (_, m) => {
      const totals = habits.map(h => getMonthPct(h.id, m));
      const totalDone = totals.reduce((a, t) => a + t.done, 0);
      return { val: totalDone, label: L.monthsShort[m] };
    });
  };

  const days = period === "week" ? getWeekDays() : period === "month" ? getMonthDays() : Array.from({length:12},(_,m)=>m);
  const dayLabels = period === "week"
    ? days.map((_, i) => L.days[i])
    : period === "month"
      ? days.map(k => { const d = new Date(k+"T12:00:00"); return String(d.getDate()); })
      : L.monthsShort;

  const totalDone = period !== "year"
    ? habits.reduce((s, h) => s + days.filter(dk => habitLog[dk]?.[h.id]).length, 0)
    : 0;
  const totalPossible = period !== "year" ? habits.length * days.length : 0;
  const combinedData = getCombinedChartData();
  const [chartColor, setChartColor] = useState("#378ADD");
  const CHART_COLORS = ["#378ADD","#1D9E75","#FF8C42","#D4537E","#7F77DD","#D4A017","#E53935","#00ACC1","#9C27B0","#FF5722","#7CB342","#F9A825"];

  return (
    <div className="hb-card">
      <div className="hb-card-hd">
        <div className="hb-card-ic">
          <svg viewBox="0 0 24 24" fill="none"><path d="M19 12a7 7 0 01-12 5M5 12a7 7 0 0112-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M17 3v4h-4M7 21v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <span className="hb-card-title">{L.habits}</span>
        <button className="hb-card-link">{L.habitsGrid}</button>
      </div>

      <div style={{ overflowX:"auto" }}>
        <div className={"htable " + period}>
          <div className="corner"/>
          {dayLabels.map((l, i) => (
            <div key={i} className="col-hd">{l}</div>
          ))}

          {habits.map(habit => {
            const streak = getStreak(habit.id);
            return (
              <React.Fragment key={habit.id}>
                <div className="h-row" style={{ gridColumn:1 }}>
                  <div className="h-dot" style={{ background: habit.color }}/>
                  <EditableTitle value={habit.names[lang]||habit.names.ru}
                    onChange={n => onRenameHabit(habit.id, {...habit.names, [lang]:n})}
                    style={{ fontSize:14.5, color:"#2D4A6B", fontWeight:600, flex:1, minWidth:0 }}/>
                  {streak > 0 && <span style={{ fontSize:11, color:habit.color, fontWeight:600, whiteSpace:"nowrap" }}>🔥{streak}</span>}
                  <button className="h-del" onClick={() => onDeleteHabit(habit.id)}>
                    <svg viewBox="0 0 20 20" fill="none"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>
                  </button>
                </div>
                {days.map((dayKey, ci) => {
                  if (period === "year") {
                    const { done, total } = getMonthPct(habit.id, dayKey);
                    const pct = total ? Math.round((done/total)*100) : 0;
                    return (
                      <div key={ci} className={"hcell" + (pct>0?" done":"")}
                        style={{ "--cc": habit.color, background: pct>0 ? habit.color : "rgba(255,255,255,0.45)", borderColor: habit.color }}
                        title={pct + "%"}>
                      </div>
                    );
                  }
                  const isDone = habitLog[dayKey]?.[habit.id] || false;
                  const isFuture = dayKey > getLocalToday();
                  return (
                    <div key={ci}
                      onClick={() => !isFuture && onToggle(dayKey, habit.id)}
                      className={"hcell" + (isDone?" done":"") + (isFuture?" future":"") + (dayKey===getLocalToday()?" today":"")}
                      style={{ "--cc": habit.color, background: isDone ? habit.color : "rgba(255,255,255,0.45)", borderColor: dayKey===getLocalToday() ? habit.color : "rgba(45,74,107,0.12)" }}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>

        {addingHabit ? (
          <div className="hb-form">
            <input autoFocus value={newHabitName} onChange={e=>setNewHabitName(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Escape")setAddingHabit(false); }}
              placeholder={L.newHabit}/>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {HABIT_COLORS.map(c=>(
                <div key={c} onClick={()=>setNewHabitColor(c)}
                  style={{ width:20, height:20, borderRadius:"50%", background:c, cursor:"pointer", border:newHabitColor===c?"3px solid #2D4A6B":"3px solid transparent", boxSizing:"border-box" }}/>
              ))}
            </div>
            <button onClick={()=>{ if(!newHabitName.trim())return; onAddHabit({id:uid(),names:{ru:newHabitName,en:newHabitName},color:newHabitColor}); setNewHabitName(""); setAddingHabit(false); }}
              style={{ padding:"7px 14px", borderRadius:10, border:"none", background:"#FF8C42", color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>{L.save}</button>
            <button onClick={()=>setAddingHabit(false)}
              style={{ padding:"7px 11px", borderRadius:10, border:"1px solid #E8EEF4", background:"#fff", color:"#9AAAB8", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>{L.cancel}</button>
          </div>
        ) : (
          <button className="add-habit" onClick={()=>setAddingHabit(true)}>
            {L.addHabit}
          </button>
        )}
      </div>

      {habits.length > 0 && (
        <div className="hb-prog">
          <div className="hb-prog-hd">
            <b>{lang==="ru" ? "Общий прогресс привычек" : "Total habit progress"}</b>
            <div className="hb-prog-dots">
              {CHART_COLORS.map(c => (
                <span key={c} onClick={() => setChartColor(c)}
                  className={chartColor===c?"sel":""}
                  style={{ background:c }}/>
              ))}
            </div>
          </div>
          <HabitAreaChart data={combinedData} color={chartColor}/>
          {totalPossible > 0 && (
            <div className="chart-foot">
              {lang==="ru"?"Выполнено":"Completed"}: {totalDone} из {totalPossible} ({Math.round(totalDone/totalPossible*100)}%)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Weather Widget ──────────────────────────────────────────────────
const CITIES = [
  { ru:"Авто (геолокация)", en:"Auto (geolocation)", id:"auto" },
  { ru:"Москва", en:"Moscow", id:"moscow", lat:55.75, lon:37.62 },
  { ru:"Санкт-Петербург", en:"St. Petersburg", id:"spb", lat:59.93, lon:30.32 },
  { ru:"Калининград", en:"Kaliningrad", id:"kaliningrad", lat:54.71, lon:20.51 },
  { ru:"Челябинск", en:"Chelyabinsk", id:"chelyabinsk", lat:55.16, lon:61.40 },
  { ru:"Новосибирск", en:"Novosibirsk", id:"novosibirsk", lat:54.99, lon:82.90 },
  { ru:"Екатеринбург", en:"Yekaterinburg", id:"ekb", lat:56.84, lon:60.60 },
  { ru:"Казань", en:"Kazan", id:"kazan", lat:55.79, lon:49.12 },
  { ru:"Краснодар", en:"Krasnodar", id:"krasnodar", lat:45.04, lon:38.98 },
  { ru:"Сочи", en:"Sochi", id:"sochi", lat:43.60, lon:39.73 },
];

const WX_ICONS = {0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",48:"🌫️",51:"🌦️",53:"🌦️",55:"🌧️",61:"🌧️",63:"🌧️",65:"🌧️",71:"🌨️",73:"🌨️",75:"❄️",80:"🌦️",81:"🌧️",82:"⛈️",95:"⛈️",96:"⛈️",99:"⛈️"};
