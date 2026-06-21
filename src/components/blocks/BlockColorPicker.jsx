import React, { useState } from 'react';
import { BLOCK_COLORS } from '../../constants/theme.js';

export default function BlockColorPicker({ currentId, onChange }) {
  const [open, setOpen] = useState(false);
  const col = BLOCK_COLORS.find(c => c.id === currentId) || BLOCK_COLORS[0];
  return (
    <div style={{ position:"relative" }}>
      <button onClick={() => setOpen(o => !o)}
        title="Сменить цвет"
        style={{ width:18, height:18, borderRadius:"50%", background:col.accent, border:"2px solid rgba(255,255,255,0.8)", cursor:"pointer", flexShrink:0, transition:"transform 0.15s", transform: open?"scale(1.2)":"scale(1)" }}/>
      {open && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:7000 }} onClick={() => setOpen(false)}/>
          <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, zIndex:7001, background:"rgba(255,255,255,0.98)", borderRadius:12, border:"1px solid rgba(200,200,200,0.3)", boxShadow:"0 8px 24px rgba(0,0,0,0.12)", padding:"10px 12px", display:"flex", gap:8, flexWrap:"wrap", width:148 }}>
            {BLOCK_COLORS.map(c => (
              <button key={c.id} onClick={() => { onChange(c.id); setOpen(false); }}
                title={c.id}
                style={{ width:24, height:24, borderRadius:"50%", background:c.accent, border: currentId===c.id ? "2.5px solid #333" : "2px solid rgba(255,255,255,0.8)", cursor:"pointer", transition:"transform 0.1s", transform: currentId===c.id?"scale(1.2)":"scale(1)" }}/>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Draggable Blocks ─────────────────────────────────────────────────
