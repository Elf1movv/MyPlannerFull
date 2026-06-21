import React, { useState } from 'react';
import { THEME } from '../../constants/theme.js';
import { LANG } from '../../constants/lang.js';
import { uid } from '../../utils/data.js';
import { getLocalToday } from '../../utils/date.js';
import EditableTitle from '../ui/EditableTitle.jsx';

export default function BacklogPanel({ backlog, lang, onUpdate }) {
  const L = LANG[lang];
  const [open, setOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(false);
  const [title, setTitle] = useState(backlog?.title || (lang==="ru"?"📋 Backlog":"📋 Backlog"));
  const [addingItem, setAddingItem] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const items = backlog?.items || [];

  const save = (updates) => onUpdate({ title, items, ...updates });

  const addItem = () => {
    if (!newName.trim()) return;
    const item = { id: uid(), name: newName.trim(), desc: newDesc.trim(), done: false, createdAt: getLocalToday() };
    save({ items: [...items, item] });
    setNewName(""); setNewDesc(""); setAddingItem(false);
  };

  const toggleDone = (id) => save({ items: items.map(it => it.id===id ? {...it, done:!it.done} : it) });
  const deleteItem = (id) => save({ items: items.filter(it => it.id!==id) });
  const updateItem = (id, patch) => save({ items: items.map(it => it.id===id ? {...it,...patch} : it) });

  return (
    <div style={{ background:"rgba(255,255,255,0.55)", borderRadius:16, border:"1px solid rgba(255,255,255,0.7)", backdropFilter:"none", marginTop:16, overflow:"hidden" }}>
      <div onClick={()=>setOpen(o=>!o)}
        style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:10, cursor:"pointer", userSelect:"none" }}>
        <span style={{ fontSize:16, transition:"transform 0.2s", display:"inline-block", transform: open?"rotate(90deg)":"rotate(0deg)" }}>▶</span>
        {editTitle ? (
          <input autoFocus value={title}
            onChange={e=>setTitle(e.target.value)}
            onBlur={()=>{ save({title}); setEditTitle(false); }}
            onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Escape"){ save({title}); setEditTitle(false); } }}
            onClick={e=>e.stopPropagation()}
            style={{ fontSize:14, fontWeight:600, border:"none", borderBottom:"1.5px solid #888780", background:"transparent", outline:"none", color:THEME.text, fontFamily:"inherit", flex:1 }}
          />
        ) : (
          <span style={{ fontSize:14, fontWeight:600, color:THEME.text, flex:1 }}>{title}</span>
        )}
        <span style={{ fontSize:11, color:THEME.textLight }}>{items.filter(i=>!i.done).length} {lang==="ru"?"задач":"tasks"}</span>
        <button onClick={e=>{ e.stopPropagation(); setEditTitle(true); }}
          style={{ border:"none", background:"transparent", fontSize:13, cursor:"pointer", color:THEME.textLight, padding:"0 4px" }} title={lang==="ru"?"Переименовать":"Rename"}>✏️</button>
      </div>

      {open && (
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.5)", padding:"10px 18px 16px" }}>
          {items.length===0 && !addingItem && (
            <div style={{ fontSize:13, color:THEME.textLight, fontStyle:"italic", padding:"8px 0" }}>
              {lang==="ru"?"Пусто. Добавьте задачи на будущее.":"Empty. Add tasks for later."}
            </div>
          )}
          {items.map(item => (
            <div key={item.id} style={{ marginBottom:6 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.4)" }}>
                <button onClick={()=>toggleDone(item.id)}
                  style={{ width:20,height:20,borderRadius:"50%",border:`1.5px solid ${item.done?"#1D9E75":"rgba(200,200,200,0.8)"}`,background:item.done?"#1D9E75":"rgba(255,255,255,0.6)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  {item.done&&<span style={{ color:"#fff",fontSize:10,fontWeight:700 }}>✓</span>}
                </button>
                <div style={{ flex:1, minWidth:0 }}>
                  <EditableTitle value={item.name} onChange={v=>updateItem(item.id,{name:v})}
                    style={{ fontSize:13, color:item.done?THEME.textLight:THEME.text, textDecoration:item.done?"line-through":"none" }}/>
                </div>
                <button onClick={()=>setExpandedId(expandedId===item.id?null:item.id)}
                  style={{ fontSize:11, border:"1px solid rgba(200,200,200,0.4)", borderRadius:8, background:"rgba(255,255,255,0.4)", color:THEME.textLight, cursor:"pointer", padding:"2px 8px", fontFamily:"inherit" }}>
                  {item.desc ? "📝" : "+"}{lang==="ru"?" описание":" desc"}
                </button>
                <button onClick={()=>deleteItem(item.id)}
                  style={{ border:"none",background:"transparent",color:"#D3D1C7",cursor:"pointer",fontSize:14,padding:"0 2px",flexShrink:0 }}>×</button>
              </div>
              {expandedId===item.id && (
                <div style={{ padding:"8px 0 4px 28px" }}>
                  <textarea
                    value={item.desc||""}
                    onChange={e=>updateItem(item.id,{desc:e.target.value})}
                    placeholder={lang==="ru"?"Описание, ссылка или заметка...":"Description, link or note..."}
                    rows={3}
                    style={{ width:"100%", boxSizing:"border-box", border:"1px solid rgba(200,200,200,0.5)", borderRadius:10, padding:"8px 10px", fontSize:12, fontFamily:"inherit", background:"rgba(255,255,255,0.65)", outline:"none", resize:"vertical", color:THEME.text, lineHeight:1.5 }}
                  />
                  {item.desc && item.desc.match(/https?:\/\/\S+/) && (
                    <a href={item.desc.match(/https?:\/\/\S+/)[0]} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:11, color:"#378ADD", textDecoration:"underline", display:"block", marginTop:4 }}>
                      🔗 {item.desc.match(/https?:\/\/\S+/)[0].slice(0,50)}...
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}

          {addingItem ? (
            <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:6 }}>
              <input autoFocus value={newName} onChange={e=>setNewName(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter")addItem(); if(e.key==="Escape")setAddingItem(false); }}
                placeholder={lang==="ru"?"Название задачи...":"Task name..."}
                style={{ border:"1px solid rgba(200,200,200,0.5)", borderRadius:10, padding:"7px 10px", fontSize:13, fontFamily:"inherit", outline:"none", background:"rgba(255,255,255,0.65)" }}/>
              <textarea value={newDesc} onChange={e=>setNewDesc(e.target.value)}
                placeholder={lang==="ru"?"Описание или ссылка (необязательно)...":"Description or link (optional)..."}
                rows={2}
                style={{ border:"1px solid rgba(200,200,200,0.5)", borderRadius:10, padding:"7px 10px", fontSize:12, fontFamily:"inherit", outline:"none", background:"rgba(255,255,255,0.65)", resize:"vertical" }}/>
              <div style={{ display:"flex", gap:7 }}>
                <button onClick={addItem} style={{ padding:"6px 16px", borderRadius:8, border:"none", background:THEME.sunsetApricot, color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>{L.save}</button>
                <button onClick={()=>setAddingItem(false)} style={{ padding:"6px 10px", borderRadius:8, border:"1px solid rgba(200,200,200,0.4)", background:"rgba(255,255,255,0.4)", color:THEME.textLight, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>{L.cancel}</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setAddingItem(true)}
              style={{ fontSize:12, color:THEME.textLight, background:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit", padding:"8px 0", marginTop:4 }}>
              + {lang==="ru"?"Добавить задачу":"Add task"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Block Color Picker ───────────────────────────────────────────────
