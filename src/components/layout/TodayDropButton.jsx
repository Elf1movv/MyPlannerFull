import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { THEME } from '../../constants/theme.js';

export default function TodayDropButton({ tab, todayMode, lang, L, showTodayDrop, setShowTodayDrop, setTab, setTodayMode, setGoalsPeriod, tabStyle }) {
  const btnRef = useRef(null);
  const [rect, setRect] = useState(null);

  const handleClick = () => {
    if (tab !== "today") {
      setTab("today");
      setShowTodayDrop(false);
    } else {
      if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
      setShowTodayDrop(d => !d);
    }
  };

  const label = todayMode==="day" ? L.today : todayMode==="month" ? (lang==="ru"?"Месяц":"Month") : (lang==="ru"?"Год":"Year");

  return (
    <div style={{ position:"relative" }}>
      <button ref={btnRef} onClick={handleClick}
        style={{ ...tabStyle("today"), display:"flex", alignItems:"center", gap:5 }}>
        {label}
        <span style={{ fontSize:9, opacity:0.6 }}>▾</span>
      </button>
      {showTodayDrop && rect && createPortal(
        <>
          <div
            style={{ position:"fixed", inset:0, zIndex:9998 }}
            onClick={() => setShowTodayDrop(false)}
          />
          <div
            data-today-drop
            style={{
              position:"fixed",
              top: rect.bottom + 8,
              left: rect.left,
              zIndex:9999,
              background:"rgba(255,255,255,0.97)",
              backdropFilter:"blur(12px)",
              borderRadius:14,
              border:"1px solid rgba(255,255,255,0.8)",
              boxShadow:"0 8px 32px rgba(0,0,0,0.15)",
              minWidth:190,
            }}>
            {[
              ["day",   lang==="ru"?"📅 Сегодня":"📅 Today"],
              ["month", lang==="ru"?"🎯 Цели месяца":"🎯 Month goals"],
              ["year",  lang==="ru"?"🏆 Цели года":"🏆 Year goals"],
            ].map(([m, lbl]) => (
              <div key={m}
                onClick={() => { setTodayMode(m); setShowTodayDrop(false); if (m !== "day") setGoalsPeriod(m); }}
                style={{ padding:"11px 16px", fontSize:13, cursor:"pointer",
                  color: todayMode===m ? THEME.sunsetDeep : THEME.text,
                  background: todayMode===m ? "rgba(255,176,124,0.1)" : "transparent",
                  fontWeight: todayMode===m ? 600 : 400,
                  borderRadius: m==="day" ? "14px 14px 0 0" : m==="year" ? "0 0 14px 14px" : "0",
                  transition:"background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = todayMode===m ? "rgba(255,176,124,0.15)" : "rgba(0,0,0,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = todayMode===m ? "rgba(255,176,124,0.1)" : "transparent"}>
                {lbl}
              </div>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
