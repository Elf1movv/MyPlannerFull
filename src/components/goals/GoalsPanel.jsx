import React, { useState } from 'react';
import { THEME } from '../../constants/theme.js';
import { uid } from '../../utils/data.js';
import MonthGoalsCard from './MonthGoalsCard.jsx';
import GoalsList from './GoalsList.jsx';

export default function GoalsPanel({ mode, goalsPeriod, setGoalsPeriod, goals, lang, onAdd, onDelete, onSetStatus, onUpdateText, onReorder }) {
  const now = new Date();
  const year = now.getFullYear();
  const curMonth = now.getMonth();

  const isYearView = goalsPeriod === "year";
  const yearKey = String(year);
  const yearGoals = goals[yearKey] || [];
  const [addingYear, setAddingYear] = useState(false);
  const [newYearText, setNewYearText] = useState("");

  const addYearGoal = () => {
    if (!newYearText.trim()) return;
    onAdd(yearKey, newYearText.trim());
    setNewYearText(""); setAddingYear(false);
  };

  return (
    <div>
      <div style={{ display:"flex", gap:3, marginBottom:24, background:"rgba(255,255,255,0.35)", borderRadius:20, padding:3, width:"fit-content", backdropFilter:"none" }}>
        <button onClick={()=>setGoalsPeriod("month")}
          style={{ padding:"5px 18px", borderRadius:18, border:"none", cursor:"pointer", fontSize:12, fontWeight:500, fontFamily:"inherit", background:!isYearView?"rgba(255,255,255,0.9)":"transparent", color:!isYearView?THEME.text:THEME.textLight, transition:"all 0.2s" }}>
          {lang==="ru"?"🎯 Текущий месяц":"🎯 This month"}
        </button>
        <button onClick={()=>setGoalsPeriod("year")}
          style={{ padding:"5px 18px", borderRadius:18, border:"none", cursor:"pointer", fontSize:12, fontWeight:500, fontFamily:"inherit", background:isYearView?"rgba(255,255,255,0.9)":"transparent", color:isYearView?THEME.text:THEME.textLight, transition:"all 0.2s" }}>
          {lang==="ru"?"🏆 Весь год":"🏆 Full year"}
        </button>
      </div>

      {!isYearView && (
        <MonthGoalsCard
          monthIdx={curMonth} year={year} goals={goals} lang={lang}
          onAdd={onAdd} onDelete={onDelete} onSetStatus={onSetStatus} onUpdateText={onUpdateText} onReorder={onReorder}
        />
      )}

      {isYearView && (
        <div>
          <div className="gl-card" style={{ marginBottom:24, borderColor:"rgba(255,176,124,0.3)" }}>
            <div className="gl-card-head">
              <span style={{ fontSize:22 }}>🏆</span>
              <span className="gl-card-h">{lang==="ru"?`Цели ${year} года`:`Goals for ${year}`}</span>
              {yearGoals.length > 0 && (
                <span className="gl-pct-top" style={{ color:"#FF8C42" }}>
                  {yearGoals.filter(g=>g.status==="done").length} из {yearGoals.length}
                </span>
              )}
            </div>
            {yearGoals.length === 0 && !addingYear && (
              <p className="gl-card-hint">{lang==="ru"?"Добавьте главные цели на год":"Add your main goals for the year"}</p>
            )}
            <div className="gl-list">
              <GoalsList goals={yearGoals} period={yearKey} lang={lang}
                onDelete={onDelete} onSetStatus={onSetStatus} onUpdateText={onUpdateText} onReorder={onReorder}/>
            </div>
            {addingYear ? (
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <input autoFocus value={newYearText} onChange={e=>setNewYearText(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter")addYearGoal(); if(e.key==="Escape"){setAddingYear(false);setNewYearText("");} }}
                  placeholder={lang==="ru"?"Новая цель на год...":"New year goal..."}
                  style={{ flex:1, border:"1px solid #E8EEF4", borderRadius:10, padding:"7px 12px", fontSize:13, fontFamily:"inherit", outline:"none", background:"#F7FAFC" }}/>
                <button onClick={addYearGoal}
                  style={{ padding:"7px 16px", borderRadius:10, border:"none", background:"#FF8C42", color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
                  {lang==="ru"?"Добавить":"Add"}
                </button>
                <button onClick={()=>{setAddingYear(false);setNewYearText("");}}
                  style={{ padding:"7px 10px", borderRadius:10, border:"1px solid #E8EEF4", background:"#fff", color:"#9AAAB8", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                  {lang==="ru"?"Отмена":"Cancel"}
                </button>
              </div>
            ) : (
              <button className="gl-add orange" onClick={()=>setAddingYear(true)} style={{ marginTop:4 }}>
                + {lang==="ru"?"Добавить цель года":"Add year goal"}
              </button>
            )}
          </div>

          <div className="gl-mgrid">
            {Array.from({length:12},(_,i)=>i).map(m => (
              <MonthGoalsCard key={m}
                monthIdx={m} year={year} goals={goals} lang={lang}
                onAdd={onAdd} onDelete={onDelete} onSetStatus={onSetStatus} onUpdateText={onUpdateText} onReorder={onReorder}
                compact={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Today Dropdown Button ────────────────────────────────────────────
