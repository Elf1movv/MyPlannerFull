import React, { useState } from 'react';
import { THEME } from '../../constants/theme.js';
import EditableTitle from '../ui/EditableTitle.jsx';

export default function GoalItem({ goal, period, onDelete, onSetStatus, onUpdateText, dragHandlers }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(goal.text);
  const isDone = goal.status === "done";
  const isFail = goal.status === "failed";

  return (
    <div
      draggable
      {...dragHandlers}
      style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.4)", cursor:"grab", userSelect:"none", transition:"opacity 0.15s" }}>
      <span style={{ color:"#D3D1C7", fontSize:14, paddingTop:3, flexShrink:0, cursor:"grab" }}>⠿</span>
      <div style={{ display:"flex", gap:4, flexShrink:0, paddingTop:2 }}>
        <button onClick={e=>{ e.stopPropagation(); onSetStatus(period, goal.id, isDone?"pending":"done"); }}
          title="Выполнено"
          style={{ width:22, height:22, borderRadius:"50%", border:`1.5px solid ${isDone?"#1D9E75":"rgba(200,200,200,0.6)"}`, background:isDone?"#1D9E75":"rgba(255,255,255,0.6)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {isDone && <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>✓</span>}
        </button>
        <button onClick={e=>{ e.stopPropagation(); onSetStatus(period, goal.id, isFail?"pending":"failed"); }}
          title="Провалено"
          style={{ width:22, height:22, borderRadius:"50%", border:`1.5px solid ${isFail?"#E24B4A":"rgba(200,200,200,0.6)"}`, background:isFail?"#E24B4A":"rgba(255,255,255,0.6)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {isFail && <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>✕</span>}
        </button>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        {editing ? (
          <input autoFocus value={val} onChange={e=>setVal(e.target.value)}
            onBlur={()=>{ onUpdateText(period,goal.id,val); setEditing(false); }}
            onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Escape"){ onUpdateText(period,goal.id,val); setEditing(false); } }}
            style={{ width:"100%", boxSizing:"border-box", border:"none", borderBottom:"1.5px solid #888", background:"transparent", outline:"none", fontSize:14, fontFamily:"inherit", color:THEME.text, padding:"0 0 2px" }}/>
        ) : (
          <span onClick={()=>setEditing(true)} style={{ fontSize:14, color: isDone?THEME.textLight:isFail?"#A32D2D":THEME.text, textDecoration:isDone?"line-through":isFail?"line-through":"none", cursor:"text", lineHeight:1.5 }}>
            {goal.text}
          </span>
        )}
      </div>
      <button onClick={e=>{ e.stopPropagation(); onDelete(period, goal.id); }}
        style={{ border:"none", background:"transparent", color:"#D3D1C7", cursor:"pointer", fontSize:16, padding:"0 2px", flexShrink:0 }}>×</button>
    </div>
  );
}
