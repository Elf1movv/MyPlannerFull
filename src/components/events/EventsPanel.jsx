import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { THEME } from '../../constants/theme.js';
import { getLocalToday, localDateStr } from '../../utils/date.js';
import EventModal from './EventModal.jsx';

export default function EventsPanel({ events, lang, onAdd, onDelete, onUpdate }) {
  const [showModal, setShowModal]     = useState(false);
  const [editEvent, setEditEvent]     = useState(null);
  const [initDate, setInitDate]       = useState(null);

  const todayStr = getLocalToday();

  const sorted = [...(events || [])]
    .filter(e => e.date >= todayStr)
    .sort((a, b) => {
      const da = a.date + (a.time ? "T"+a.time : "T23:59");
      const db = b.date + (b.time ? "T"+b.time : "T23:59");
      return da.localeCompare(db);
    });

  const formatEvtDate = (date, time) => {
    const d = new Date(date + "T12:00:00");
    const isToday = date === todayStr;
    const isTomorrow = (() => { const t = new Date(); t.setDate(t.getDate()+1); return date === localDateStr(t); })();
    const dayLabel = isToday ? (lang==="ru"?"Сегодня":"Today")
      : isTomorrow ? (lang==="ru"?"Завтра":"Tomorrow")
      : `${d.getDate()} ${["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"][d.getMonth()]}`;
    return time ? `${dayLabel}, ${time}` : dayLabel;
  };

  const daysUntil = (date) => {
    const d = new Date(date + "T12:00:00");
    const diff = Math.ceil((d - new Date(todayStr + "T12:00:00")) / 86400000);
    return diff;
  };

  const openAdd = (date) => { setInitDate(date || null); setEditEvent(null); setShowModal(true); };
  const openEdit = (evt) => { setEditEvent(evt); setInitDate(null); setShowModal(true); };

  return (
    <div style={{ width:260, flexShrink:0, position:"sticky", top:80, alignSelf:"flex-start", maxHeight:"calc(100vh - 110px)", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:600, color:THEME.text }}>
          {lang==="ru"?"📅 Предстоящие":"📅 Upcoming"}
        </span>
        <button onClick={() => openAdd(null)}
          style={{ width:26, height:26, borderRadius:"50%", border:"none", background:`linear-gradient(135deg,${THEME.sunsetApricot},${THEME.sunsetDeep})`, color:"#fff", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(255,140,66,0.4)" }}>
          +
        </button>
      </div>

      <div style={{ overflowY:"auto", display:"flex", flexDirection:"column", gap:8, paddingRight:4 }}>
        {sorted.length === 0 && (
          <div style={{ background:"rgba(255,255,255,0.45)", borderRadius:14, padding:"20px 16px", textAlign:"center", border:"1px solid rgba(255,255,255,0.7)" }}>
            <div style={{ fontSize:24, marginBottom:8 }}>🗓</div>
            <div style={{ fontSize:12, color:THEME.textLight, lineHeight:1.5 }}>
              {lang==="ru"?"Нет предстоящих событий\nНажмите + чтобы добавить":"No upcoming events\nPress + to add"}
            </div>
          </div>
        )}
        {sorted.map(evt => {
          const urg = URGENCY_COLORS[evt.urgency] || URGENCY_COLORS.normal;
          const days = daysUntil(evt.date);
          const isToday = days === 0;
          const isTomorrow = days === 1;
          const isUrgentSoon = days <= 2 && evt.urgency !== "normal";
          return (
            <div key={evt.id}
              style={{ background:urg.bg, border:`1px solid ${urg.border}`, borderRadius:14, padding:"11px 13px", cursor:"pointer", transition:"transform 0.1s, box-shadow 0.1s", position:"relative" }}
              onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}
              onClick={() => openEdit(evt)}>
              <div style={{ position:"absolute", top:11, right:11, width:7, height:7, borderRadius:"50%", background:urg.dot }}/>
              {(isToday || isTomorrow || isUrgentSoon) && (
                <div style={{ display:"inline-block", fontSize:9, fontWeight:700, letterSpacing:0.5, color:urg.dot, background:"rgba(255,255,255,0.6)", borderRadius:6, padding:"1px 6px", marginBottom:5, textTransform:"uppercase" }}>
                  {isToday ? (lang==="ru"?"Сегодня!":"Today!") : isTomorrow ? (lang==="ru"?"Завтра":"Tomorrow") : `${days}д`}
                </div>
              )}
              <div style={{ fontSize:13, fontWeight:600, color:THEME.text, marginBottom:3, paddingRight:14, lineHeight:1.3 }}>{evt.title}</div>
              <div style={{ fontSize:11, color:THEME.textLight }}>{formatEvtDate(evt.date, evt.time)}</div>
              {evt.desc && <div style={{ fontSize:11, color:THEME.textLight, marginTop:4, lineHeight:1.4, opacity:0.8 }}>{evt.desc}</div>}
              <button onClick={e=>{ e.stopPropagation(); onDelete(evt.id); }}
                style={{ position:"absolute", bottom:8, right:10, border:"none", background:"transparent", color:"rgba(150,150,150,0.6)", cursor:"pointer", fontSize:14, padding:0, lineHeight:1 }}>×</button>
            </div>
          );
        })}
      </div>

      {showModal && (
        <EventModal
          event={editEvent}
          lang={lang}
          onClose={() => { setShowModal(false); setEditEvent(null); }}
          onSave={(data) => {
            if (editEvent) { onUpdate(editEvent.id, data); }
            else { onAdd({ ...data, date: initDate || data.date }); }
            setShowModal(false); setEditEvent(null);
          }}
        />
      )}
    </div>
  );
}

// ── Pomodoro Timer ───────────────────────────────────────────────────
