import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { THEME } from '../../constants/theme.js';
import { getLocalToday } from '../../utils/date.js';

export default function EventModal({ event, onSave, onClose, lang }) {
  const [title, setTitle]     = useState(event?.title || "");
  const [date, setDate]       = useState(event?.date || getLocalToday());
  const [time, setTime]       = useState(event?.time || "");
  const [desc, setDesc]       = useState(event?.desc || "");
  const [urgency, setUrgency] = useState(event?.urgency || "normal");

  const save = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), date, time, desc, urgency });
  };

  const inp = { border:"1px solid rgba(200,200,200,0.5)", borderRadius:10, padding:"8px 12px", fontSize:13, fontFamily:"inherit", outline:"none", background:"rgba(255,255,255,0.8)", width:"100%", boxSizing:"border-box" };

  return createPortal(
    <>
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.25)", zIndex:9000, backdropFilter:"none" }} onClick={onClose}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:9001, background:"rgba(255,255,255,0.97)", backdropFilter:"blur(20px)", borderRadius:24, padding:"32px 32px", width:380, boxShadow:"0 24px 80px rgba(0,0,0,0.15)", border:"1px solid rgba(255,255,255,0.9)" }}>
        <div style={{ fontSize:16, fontWeight:700, color:THEME.text, marginBottom:20 }}>
          {event ? (lang==="ru"?"Редактировать событие":"Edit event") : (lang==="ru"?"Новое событие":"New event")}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder={lang==="ru"?"Название *":"Title *"} style={inp} autoFocus/>
          <div style={{ display:"flex", gap:10 }}>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ ...inp, flex:1 }}/>
            <input type="time" value={time} onChange={e=>setTime(e.target.value)} style={{ ...inp, flex:1 }}/>
          </div>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder={lang==="ru"?"Описание (необязательно)":"Description (optional)"} rows={2}
            style={{ ...inp, resize:"none", lineHeight:1.5 }}/>
          <div>
            <div style={{ fontSize:11, color:THEME.textLight, marginBottom:8, letterSpacing:0.5, textTransform:"uppercase" }}>{lang==="ru"?"Важность":"Priority"}</div>
            <div style={{ display:"flex", gap:6 }}>
              {Object.entries(URGENCY_COLORS).map(([key, val]) => (
                <button key={key} onClick={()=>setUrgency(key)}
                  style={{ flex:1, padding:"6px 0", borderRadius:10, border:`1.5px solid ${urgency===key?val.dot:"rgba(200,200,200,0.4)"}`, background:urgency===key?val.bg:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:11, fontFamily:"inherit", color:urgency===key?val.dot:THEME.textLight, fontWeight:urgency===key?600:400, transition:"all 0.15s" }}>
                  {lang==="ru"?val.label:key}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, marginTop:20 }}>
          <button onClick={save}
            style={{ flex:1, padding:"10px 0", borderRadius:12, border:"none", background:`linear-gradient(135deg,${THEME.sunsetApricot},${THEME.sunsetDeep})`, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            {lang==="ru"?"Сохранить":"Save"}
          </button>
          <button onClick={onClose}
            style={{ padding:"10px 16px", borderRadius:12, border:"1px solid rgba(200,200,200,0.4)", background:"rgba(255,255,255,0.4)", color:THEME.textLight, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            {lang==="ru"?"Отмена":"Cancel"}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
