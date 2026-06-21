import React, { useState } from 'react';
import { THEME } from '../../constants/theme.js';
import { uid } from '../../utils/data.js';

export default function QuickLinks({ lang }) {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("quick_links")) || DEFAULT_LINKS; } catch { return DEFAULT_LINKS; }
  });
  const [editing, setEditing] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newIcon, setNewIcon] = useState("🔗");
  const ICON_OPTIONS = ["🔗","⭐","📌","📝","💼","🎯","📊","🎵","🎮","📱","💻","🌐","📚","🛒","🏠","✉️","📷","🔔","💡","🚀","❤️","🔥","⚡","🌟"];

  const save = (updated) => {
    setLinks(updated);
    localStorage.setItem("quick_links", JSON.stringify(updated));
  };
  const addLink = () => {
    if (!newLabel.trim() || !newUrl.trim()) return;
    const url = newUrl.startsWith("http") ? newUrl : "https://" + newUrl;
    save([...links, { id: uid(), label: newLabel, icon: newIcon, url }]);
    setNewLabel(""); setNewUrl(""); setNewIcon("🔗");
  };
  const deleteLink = (id) => save(links.filter(l => l.id !== id));
  const updateLink = (id, patch) => save(links.map(l => l.id===id ? {...l,...patch} : l));

  return (
    <div style={{ position:"relative" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ padding:"4px 11px", border:"1px solid rgba(255,255,255,0.6)", borderRadius:8, background: open ? "rgba(255,176,124,0.2)" : "rgba(255,255,255,0.4)", color:THEME.text, fontSize:11, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:4 }}>
        🔗 {lang==="ru" ? "Ссылки" : "Links"} ▾
      </button>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", right:0, zIndex:300, background:"rgba(255,255,255,0.97)", backdropFilter:"none", borderRadius:16, border:"1px solid rgba(255,255,255,0.8)", boxShadow:"0 8px 40px rgba(0,0,0,0.12)", minWidth:260, overflow:"hidden" }}>
          <div style={{ padding:"8px 0" }}>
            {links.map(link => (
              <div key={link.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", transition:"background 0.1s" }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,176,124,0.08)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{ position:"relative" }}>
                  <span style={{ fontSize:18, cursor:"pointer" }} title="Нажми чтобы сменить иконку"
                    onClick={() => {
                      const cur = ICON_OPTIONS.indexOf(link.icon);
                      updateLink(link.id, { icon: ICON_OPTIONS[(cur+1) % ICON_OPTIONS.length] });
                    }}>{link.icon}</span>
                </div>
                <a href={link.url} target="_blank" rel="noopener noreferrer"
                  style={{ flex:1, fontSize:13, color:THEME.text, textDecoration:"none", fontWeight:500 }}>
                  {link.label}
                </a>
                {editing && (
                  <button onClick={() => deleteLink(link.id)}
                    style={{ border:"none", background:"transparent", color:"#D4537E", cursor:"pointer", fontSize:14, padding:"0 2px" }}>×</button>
                )}
              </div>
            ))}
          </div>
          {editing && (
            <div style={{ padding:"10px 14px", borderTop:"1px solid rgba(200,200,200,0.2)" }}>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                {ICON_OPTIONS.map(ic => (
                  <span key={ic} onClick={() => setNewIcon(ic)}
                    style={{ fontSize:16, cursor:"pointer", padding:"2px", borderRadius:6, background: newIcon===ic ? "rgba(255,176,124,0.3)" : "transparent" }}>
                    {ic}
                  </span>
                ))}
              </div>
              <input value={newLabel} onChange={e=>setNewLabel(e.target.value)}
                placeholder={lang==="ru"?"Название":"Name"}
                style={{ width:"100%", boxSizing:"border-box", border:"1px solid rgba(200,200,200,0.4)", borderRadius:8, padding:"5px 8px", fontSize:12, fontFamily:"inherit", outline:"none", marginBottom:5, background:"rgba(255,255,255,0.7)" }}/>
              <input value={newUrl} onChange={e=>setNewUrl(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&addLink()}
                placeholder="https://..."
                style={{ width:"100%", boxSizing:"border-box", border:"1px solid rgba(200,200,200,0.4)", borderRadius:8, padding:"5px 8px", fontSize:12, fontFamily:"inherit", outline:"none", marginBottom:8, background:"rgba(255,255,255,0.7)" }}/>
              <button onClick={addLink}
                style={{ padding:"5px 14px", borderRadius:8, border:"none", background:THEME.sunsetApricot, color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                {lang==="ru"?"Добавить":"Add"}
              </button>
            </div>
          )}
          <div style={{ padding:"8px 14px", borderTop:"1px solid rgba(200,200,200,0.15)", display:"flex", justifyContent:"flex-end" }}>
            <button onClick={() => setEditing(e => !e)}
              style={{ fontSize:11, color:THEME.textLight, background:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
              {editing ? (lang==="ru"?"✓ Готово":"✓ Done") : (lang==="ru"?"✏️ Редактировать":"✏️ Edit")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Goals Panel ──────────────────────────────────────────────────────
const MONTH_COLORS = [
  "#5B9BD5","#4A90D9","#3A7BC8","#2E86AB",
  "#4CAF7D","#43A868","#3D9E5A",
  "#F4A261","#E76F51","#E63946",
  "#C1121F","#9D0208",
];
const MONTH_NAMES_RU = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const MONTH_NAMES_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
