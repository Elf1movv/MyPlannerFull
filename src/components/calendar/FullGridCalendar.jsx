import React, { useState } from 'react';
import { THEME, BLOCK_COLORS } from '../../constants/theme.js';
import { LANG } from '../../constants/lang.js';
import { getLocalToday, getDateKey } from '../../utils/date.js';
import { calcPct } from '../../utils/data.js';

export default function FullGridCalendar({ appData, lang, onSelectDay, selectedDay }) {
  const L = LANG[lang];
  const [vd, setVd] = useState(() => new Date());
  const yr = vd.getFullYear(), mo = vd.getMonth();
  const first = new Date(yr, mo, 1), last = new Date(yr, mo+1, 0);
  const startDow = (first.getDay() + 6) % 7;
  const totalCells = Math.ceil((startDow + last.getDate()) / 7) * 7;

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const dn = i - startDow + 1;
    const inMonth = dn >= 1 && dn <= last.getDate();
    const key = inMonth ? getDateKey(new Date(yr, mo, dn)) : null;
    const dayBlocks = key ? appData.days[key]?.blocks : null;
    const tasks = dayBlocks ? dayBlocks.flatMap(b => b.tasks) : [];
    const p = tasks.length ? Math.round((tasks.filter(t => t.status==="done").length / tasks.length)*100) : null;
    cells.push({ key, dn: inMonth ? dn : null, p, isToday: key===getLocalToday(), isFuture: key>getLocalToday(), isSelected: key===selectedDay, tasks: tasks.slice(0,4), inMonth });
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i+7));

  return (
    <div style={{ background:"rgba(255,255,255,0.55)", borderRadius:16, border:"1px solid rgba(255,255,255,0.7)", backdropFilter:"none", overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.5)" }}>
        <button onClick={()=>setVd(new Date(yr,mo-1,1))} style={{ border:"1px solid rgba(255,255,255,0.7)", borderRadius:8, background:"rgba(255,255,255,0.5)", padding:"4px 14px", cursor:"pointer", fontSize:18, color:THEME.text }}>‹</button>
        <span style={{ fontSize:16, fontWeight:700, color:THEME.text }}>{L.months[mo]} {yr}</span>
        <button onClick={()=>setVd(new Date(yr,mo+1,1))} style={{ border:"1px solid rgba(255,255,255,0.7)", borderRadius:8, background:"rgba(255,255,255,0.5)", padding:"4px 14px", cursor:"pointer", fontSize:18, color:THEME.text }}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"1px solid rgba(255,255,255,0.4)" }}>
        {L.days.map(d => (
          <div key={d} style={{ padding:"8px 4px", textAlign:"center", fontSize:11, fontWeight:600, color:THEME.textLight, letterSpacing:0.5 }}>{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom: wi<weeks.length-1 ? "1px solid rgba(255,255,255,0.3)" : "none", minHeight:100 }}>
          {week.map((cell, ci) => {
            const blockColors = cell.key && appData.days[cell.key]?.blocks
              ? appData.days[cell.key].blocks.map(b => (BLOCK_COLORS.find(c=>c.id===b.colorId)||BLOCK_COLORS[0]).accent)
              : [];
            return (
              <div key={ci}
                onClick={() => cell.key && onSelectDay(cell.key)}
                style={{
                  padding:"6px 8px", borderLeft: ci>0 ? "1px solid rgba(255,255,255,0.3)" : "none",
                  background: cell.isSelected ? "rgba(255,176,124,0.2)" : cell.isToday ? "rgba(255,240,220,0.5)" : "transparent",
                  cursor: cell.key ? "pointer" : "default", minHeight:90, position:"relative",
                  transition:"background 0.15s",
                }}>
                <div style={{ marginBottom:4 }}>
                  <span style={{
                    fontSize:13, fontWeight: cell.isToday ? 700 : 400,
                    color: cell.isToday ? "#fff" : cell.inMonth ? THEME.text : THEME.textLight,
                    display:"inline-flex", alignItems:"center", justifyContent:"center",
                    width: cell.isToday ? 24 : "auto", height: cell.isToday ? 24 : "auto",
                    borderRadius: cell.isToday ? "50%" : 0,
                    background: cell.isToday ? THEME.sunsetApricot : "transparent",
                  }}>{cell.dn || ""}</span>
                </div>
                {cell.tasks.map((task, ti) => {
                  const bColor = blockColors[ti] || "#B4B2A9";
                  return (
                    <div key={ti} style={{
                      fontSize:10, padding:"2px 6px", borderRadius:4, marginBottom:2,
                      background: task.status==="done" ? `${bColor}30` : `${bColor}18`,
                      borderLeft: `2.5px solid ${bColor}`,
                      color: THEME.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                      textDecoration: task.status==="done" ? "line-through" : "none",
                      opacity: task.status==="done" ? 0.6 : 1,
                    }}>
                      {task.names[lang] || task.names.ru}
                    </div>
                  );
                })}
                {cell.key && appData.days[cell.key]?.blocks?.flatMap(b=>b.tasks).length > 4 && (
                  <div style={{ fontSize:9, color:THEME.textLight, marginTop:2 }}>
                    +{appData.days[cell.key].blocks.flatMap(b=>b.tasks).length - 4} {lang==="ru"?"ещё":"more"}
                  </div>
                )}
                {cell.p !== null && (
                  <div style={{ position:"absolute", top:5, right:5, width:6, height:6, borderRadius:"50%", background: cell.p===100?"#1D9E75":cell.p>50?"#D4A017":"#D4537E" }}/>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Minimal Calendar ─────────────────────────────────────────────────
