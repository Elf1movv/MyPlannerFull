import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { THEME } from '../../constants/theme.js';

export default function RoutineLabel({ task, onToggle, onChangeLabel, onChangeDays, lang }) {
  const [editing, setEditing]   = useState(false);
  const [val, setVal]           = useState(task.routineLabel || "🔄 Рутина");
  const [showDays, setShowDays] = useState(false);
  const [popupPos, setPopupPos] = useState({ top:0, left:0 });
  const daysRef = useRef(null);
  const isOn = task.routine;
  const days = lang === "ru" ? DOW_NAMES_RU : DOW_NAMES_EN;
  const selected = task.routineDays || [];
  const allDays  = selected.length === 0;

  const toggleDay = (d) => {
    let next;
    if (allDays) {
      next = [0,1,2,3,4,5,6].filter(x => x !== d);
    } else if (selected.includes(d)) {
      next = selected.filter(x => x !== d);
      if (next.length === 7) next = [];
    } else {
      next = [...selected, d];
      if (next.length === 7) next = [];
    }
    onChangeDays(next);
  };

  const daysLabel = allDays
    ? (lang==="ru" ? "каждый день" : "every day")
    : selected.sort((a,b)=>a-b).map(d => days[d]).join(", ");

  const openDays = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupPos({ top: rect.bottom + 6, left: rect.left });
    setShowDays(s => !s);
  };

  return (
    <div style={{ display:"flex", gap:2, flexShrink:0, alignItems:"center" }}>
      <button onClick={onToggle}
        style={{ fontSize:10, padding:"2px 7px", borderRadius:10,
          border:`1px solid ${isOn?"#1D9E75":"rgba(200,200,200,0.6)"}`,
          background:isOn?"rgba(230,247,244,0.8)":"rgba(255,255,255,0.4)",
          color:isOn?"#085041":THEME.textLight, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
        {task.routineLabel || (lang==="ru" ? "🔄 Рутина" : "🔄 Routine")}
      </button>

      {isOn && !editing && (
        <>
          <button ref={daysRef} onClick={openDays}
            title={lang==="ru"?"Выбрать дни":"Select days"}
            style={{ fontSize:9, padding:"2px 6px", borderRadius:8,
              border:"1px solid rgba(29,158,117,0.4)", background:"rgba(230,247,244,0.6)",
              color:"#085041", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
            {allDays ? "∞" : selected.sort((a,b)=>a-b).map(d=>days[d]).join(" ")}
          </button>
          <button onClick={()=>setEditing(true)}
            style={{ fontSize:9, padding:"1px 4px", borderRadius:6,
              border:"1px solid rgba(200,200,200,0.4)", background:"rgba(255,255,255,0.4)",
              color:THEME.textLight, cursor:"pointer", fontFamily:"inherit" }}>✏️</button>
        </>
      )}

      {isOn && editing && (
        <input autoFocus value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={() => { onChangeLabel(val); setEditing(false); }}
          onKeyDown={e => { if(e.key==="Enter"||e.key==="Escape"){ onChangeLabel(val); setEditing(false); } }}
          style={{ fontSize:10, width:90, border:"1px solid #1D9E75", borderRadius:10,
            padding:"2px 7px", fontFamily:"inherit", outline:"none", background:"rgba(230,247,244,0.9)" }}
        />
      )}

      {isOn && showDays && createPortal(
        <>
          <div style={{ position:"fixed", inset:0, zIndex:8000 }} onClick={()=>setShowDays(false)}/>
          <div style={{
            position:"fixed", top:popupPos.top, left:popupPos.left, zIndex:8001,
            background:"rgba(255,255,255,0.99)", borderRadius:14,
            border:"1px solid rgba(200,200,200,0.4)", boxShadow:"0 8px 32px rgba(0,0,0,0.15)",
            padding:"12px 14px", minWidth:210,
          }}>
            <div style={{ fontSize:11, color:THEME.textLight, marginBottom:8, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>
              {lang==="ru"?"Повторять в дни:":"Repeat on:"}
            </div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
              {[1,2,3,4,5,6,0].map(d => {
                const isSel = allDays || selected.includes(d);
                return (
                  <button key={d} onClick={()=>toggleDay(d)}
                    style={{ width:34, height:30, borderRadius:8,
                      border:`1.5px solid ${isSel?"#1D9E75":"rgba(200,200,200,0.5)"}`,
                      background:isSel?"rgba(230,247,244,0.9)":"rgba(255,255,255,0.5)",
                      color:isSel?"#085041":THEME.textLight, cursor:"pointer", fontFamily:"inherit",
                      fontSize:11, fontWeight:isSel?600:400, transition:"all 0.12s" }}>
                    {days[d]}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize:10, color:THEME.textLight, borderTop:"1px solid rgba(200,200,200,0.3)", paddingTop:8, marginBottom:8 }}>
              {lang==="ru"?"Выбрано:":"Selected:"} <b>{daysLabel}</b>
            </div>
            <button onClick={()=>setShowDays(false)}
              style={{ width:"100%", padding:"6px 0", borderRadius:8, border:"none",
                background:`linear-gradient(135deg,${THEME.sunsetApricot},${THEME.sunsetDeep})`,
                color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
              {lang==="ru"?"Готово":"Done"}
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// ── Backlog Panel ────────────────────────────────────────────────────
