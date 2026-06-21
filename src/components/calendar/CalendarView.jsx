import React, { useState } from 'react';
import { LANG } from '../../constants/lang.js';
import { getLocalToday, getDateKey } from '../../utils/date.js';
import { calcPct } from '../../utils/data.js';

export default function CalendarView({ appData, lang, selectedDay, onSelectDay }) {
  const L = LANG[lang];
  const [vd, setVd] = useState(() => new Date());
  const yr = vd.getFullYear(), mo = vd.getMonth();
  const first = new Date(yr, mo, 1), last = new Date(yr, mo+1, 0);
  const startDow = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < Math.ceil((startDow + last.getDate())/7)*7; i++) {
    const dn = i - startDow + 1;
    if (dn < 1 || dn > last.getDate()) { cells.push(null); continue; }
    const key = getDateKey(new Date(yr, mo, dn));
    const p = appData.days[key] ? calcPct(appData.days[key].blocks) : null;
    cells.push({ key, dn, p, isToday:key===getLocalToday(), isFuture:key>getLocalToday(), isSelected:key===selectedDay });
  }
  return (
    <div className="cal-mini">
      <div className="cal-mini-hd">
        <button className="cal-nav" onClick={()=>setVd(new Date(yr,mo-1,1))}>
          <svg viewBox="0 0 20 20" fill="none"><path d="M12.5 15l-5-5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <b>{L.months[mo]} {yr}</b>
        <button className="cal-nav" onClick={()=>setVd(new Date(yr,mo+1,1))}>
          <svg viewBox="0 0 20 20" fill="none"><path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
      <div className="cal-wd-row">
        {L.days.map(d => <span key={d}>{d}</span>)}
      </div>
      <div className="cal-days">
        {cells.map((cell,i) => {
          if (!cell) return <div key={i} className="cal-day empty"/>;
          const hasTasks = cell.p !== null;
          return (
            <div key={cell.key} onClick={()=>onSelectDay(cell.key)}
              className={"cal-day" + (cell.isToday?" today":"") + (cell.isSelected?" sel":"") + (cell.key<getLocalToday()&&!cell.isToday?" past":"")}>
              {hasTasks && !cell.isToday && <div className="tdot"/>}
              <span className="dn">{cell.dn}</span>
              {cell.isToday && <span className="sub">{lang==="ru"?"сег.":"today"}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Quick Links ───────────────────────────────────────────────────────
const DEFAULT_LINKS = [
  { id:"l1", label:"YouTube", icon:"▶️", url:"https://youtube.com" },
  { id:"l2", label:"Gmail", icon:"📧", url:"https://mail.google.com" },
  { id:"l3", label:"Notion", icon:"📝", url:"https://notion.so" },
];
