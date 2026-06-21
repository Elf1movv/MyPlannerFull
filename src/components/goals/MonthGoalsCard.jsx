import React, { useState } from 'react';
import { uid } from '../../utils/data.js';
import { getLocalToday } from '../../utils/date.js';
import GoalsList from './GoalsList.jsx';

export default function MonthGoalsCard({ monthIdx, year, goals, lang, onAdd, onDelete, onSetStatus, onUpdateText, onReorder, compact=false }) {
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const period = `${year}-${String(monthIdx+1).padStart(2,"0")}`;
  const monthGoals = goals[period] || [];
  const color = MONTH_COLORS[monthIdx];
  const name = lang==="ru" ? MONTH_NAMES_RU[monthIdx] : MONTH_NAMES_EN[monthIdx];
  const done = monthGoals.filter(g=>g.status==="done").length;
  const pct = monthGoals.length ? Math.round(done/monthGoals.length*100) : 0;

  const addGoal = () => {
    if (!newText.trim()) return;
    onAdd(period, newText.trim());
    setNewText(""); setAdding(false);
  };

  const isPastMonth = (() => {
    const now = new Date();
    const curPeriod = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    return period < curPeriod;
  })();

  if (compact) {
    const unclosed = monthGoals.filter(g => g.status === "pending").length;
    const now2 = new Date();
    const isCurrentMonth = monthIdx === now2.getMonth() && year === now2.getFullYear();
    return (
      <div className={"gl-mcard" + (isCurrentMonth?" current":"") + (isPastMonth?" past":"")}>
        {unclosed > 0 && isPastMonth && <div className="gl-mbadge">{unclosed}</div>}
        {monthGoals.length > 0 && <div className="gl-mpct">{pct}%</div>}
        <div className="gl-mcard-hd">
          <div className="gl-mdot" style={{ background: color }}/>
          <span className="gl-mname">{name}</span>
        </div>
        <div className="gl-mgoals">
          {monthGoals.slice(0,3).map(g => (
            <div key={g.id} className={"gl-mgoal" + (g.status==="done"?" done":g.status==="failed"?" failed":"")}
              onClick={()=>onSetStatus(period, g.id, g.status==="done"?"pending":"done")}>
              <div className="gl-mg-chk">
                {g.status==="done" && <svg viewBox="0 0 12 12" fill="none" width={10} height={10}><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>}
              </div>
              <span className="gl-mg-text">{g.text}</span>
            </div>
          ))}
          {monthGoals.length > 3 && <span style={{ fontSize:10, color:"#9AAAB8" }}>+{monthGoals.length-3} {lang==="ru"?"ещё":"more"}</span>}
        </div>
        {!isPastMonth && (
          <button className="gl-madd" onClick={()=>setAdding(a=>!a)} style={{ marginTop:8 }}>
            + {lang==="ru"?"цель":"goal"}
          </button>
        )}
        {adding && (
          <input autoFocus value={newText} onChange={e=>setNewText(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter")addGoal(); if(e.key==="Escape")setAdding(false); }}
            onBlur={()=>{ if(newText.trim())addGoal(); else setAdding(false); }}
            placeholder={lang==="ru"?"Новая цель...":"New goal..."}
            style={{ width:"100%", boxSizing:"border-box", border:"1px solid #E8EEF4", borderRadius:8, padding:"5px 8px", fontSize:12, fontFamily:"inherit", outline:"none", background:"#F7FAFC", marginTop:6 }}/>
        )}
      </div>
    );
  }

  return (
    <div className="gl-card month-card" style={{ borderColor: color + "45" }}>
      {monthGoals.length > 0 && <div className="gl-badge">{monthGoals.length}</div>}
      <div className="gl-card-head">
        <div className="gl-cdot" style={{ background: color }}/>
        <span className="gl-card-h">{name} {year}</span>
        {monthGoals.length > 0 && <span className="gl-pct-top">{done} из {monthGoals.length} · {pct}%</span>}
      </div>
      {monthGoals.length === 0 && !adding && (
        <p className="gl-card-hint">{lang==="ru"?"Добавьте цели на этот месяц":"Add goals for this month"}</p>
      )}
      <div className="gl-list">
        <GoalsList goals={monthGoals} period={period} lang={lang}
          onDelete={onDelete} onSetStatus={onSetStatus} onUpdateText={onUpdateText} onReorder={onReorder}/>
      </div>
      {adding ? (
        <div style={{ display:"flex", gap:8, marginTop:8 }}>
          <input autoFocus value={newText} onChange={e=>setNewText(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter")addGoal(); if(e.key==="Escape"){setAdding(false);setNewText("");} }}
            placeholder={lang==="ru"?"Новая цель...":"New goal..."}
            style={{ flex:1, border:"1px solid #E8EEF4", borderRadius:10, padding:"7px 12px", fontSize:13, fontFamily:"inherit", outline:"none", background:"#F7FAFC" }}/>
          <button onClick={addGoal}
            style={{ padding:"7px 16px", borderRadius:10, border:"none", background:color, color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
            {lang==="ru"?"Добавить":"Add"}
          </button>
          <button onClick={()=>{setAdding(false);setNewText("");}}
            style={{ padding:"7px 10px", borderRadius:10, border:"1px solid #E8EEF4", background:"#fff", color:"#9AAAB8", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
            {lang==="ru"?"Отмена":"Cancel"}
          </button>
        </div>
      ) : (
        <button className="gl-add" onClick={()=>setAdding(true)}>
          + {lang==="ru"?"Добавить цель":"Add goal"}
        </button>
      )}
    </div>
  );
}
