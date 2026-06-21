import React, { useState, useRef } from 'react';
import { THEME, BLOCK_COLORS } from '../../constants/theme.js';
import { LANG } from '../../constants/lang.js';
import { uid } from '../../utils/data.js';
import EditableTitle from '../ui/EditableTitle.jsx';
import BlockColorPicker from './BlockColorPicker.jsx';
import RoutineLabel from './RoutineLabel.jsx';

export default function DraggableBlocks({ blocks, lang, isEditable, isStatusEditable, onUpdateBlock, onDeleteBlock, onAddTask, onDeleteTask, onSetTaskStatus, onUpdateTaskName, onToggleRoutine, onUpdateRoutineLabel, onUpdateRoutineDays, onReorder }) {
  const L = LANG[lang];
  const dragIdx = useRef(null);
  const taskDrag = useRef(null);
  const [dragOver, setDragOver] = useState(null);
  const [taskDragOver, setTaskDragOver] = useState(null);
  const [addingTask, setAddingTask] = useState(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskType, setNewTaskType] = useState("daily");
  const [addingBlock, setAddingBlock] = useState(false);
  const [newBlockName, setNewBlockName] = useState("");
  const [newBlockColor, setNewBlockColor] = useState("amber");

  const sc = {
    done:    { bg:"rgba(232,245,240,0.8)", c:"#0F6E56", b:"#9FE1CB" },
    failed:  { bg:"rgba(252,235,235,0.8)", c:"#A32D2D", b:"#F7C1C1" },
    pending: { bg:"rgba(245,244,240,0.8)", c:"#444441", b:"#D3D1C7" },
  };

  const allT = blocks.flatMap(b => b.tasks);
  const doneT = allT.filter(t => t.status === "done");
  const dp = allT.length ? Math.round((doneT.length / allT.length) * 100) : 0;
  const dpMsg = dp >= 80 ? "Отличное начало! 🔥" : dp >= 40 ? "Хороший темп 👍" : dp > 0 ? "Продолжай!" : "Начни день продуктивно";

  return (
    <div>
      <div className="v17-progress">
        <div className="v17-prog-top">
          <div>
            <div className="v17-prog-title">{L.dayProgress}</div>
            <div className="v17-prog-msg">{dpMsg}</div>
          </div>
          <div className="v17-prog-pct">{dp}<span>%</span></div>
        </div>
        <div className="v17-bar"><div className="v17-bar-fill" style={{ width: dp + "%" }}/></div>
        <div className="v17-prog-count">{doneT.length} из {allT.length} {L.tasksOf}</div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {blocks.map((block, idx) => {
          const col = BLOCK_COLORS.find(c => c.id === block.colorId) || BLOCK_COLORS[0];
          const bd = block.tasks.filter(t => t.status === "done").length;
          const bp = block.tasks.length ? Math.round((bd / block.tasks.length) * 100) : 0;
          return (
            <div key={block.id}
              draggable={isEditable}
              onDragStart={() => { dragIdx.current = idx; }}
              onDragOver={e => { e.preventDefault(); setDragOver(idx); }}
              onDragEnd={() => { setDragOver(null); dragIdx.current = null; }}
              onDrop={() => {
                if (dragIdx.current !== null && dragIdx.current !== idx) {
                  const reordered = [...blocks];
                  const [moved] = reordered.splice(dragIdx.current, 1);
                  reordered.splice(idx, 0, moved);
                  onReorder(reordered);
                }
                setDragOver(null);
              }}
              className="v17-block"
              style={{
                outline: dragOver === idx ? "2px solid " + col.accent : "none",
                opacity: dragIdx.current === idx ? 0.5 : 1,
                cursor: isEditable ? "grab" : "default",
              }}>
              <div className="v17-block-head">
                {isEditable && <span style={{ color:"#C8BFB0", fontSize:14, cursor:"grab", userSelect:"none" }}>⠿</span>}
                <div className="v17-block-chip" style={{ background: col.bg }}>
                  <div className="v17-block-dot" style={{ background: col.accent }}/>
                  <span className="v17-block-name">
                    {isEditable
                      ? <EditableTitle value={block.names[lang]||block.names.ru} onChange={n=>onUpdateBlock(block.id,{names:{...block.names,[lang]:n}})} style={{ fontSize:16, fontWeight:700, color:"#2D4A6B" }}/>
                      : block.names[lang]||block.names.ru}
                  </span>
                </div>
                <span className="v17-block-count">{bd} из {block.tasks.length} · {bp}%</span>
                <div className="v17-block-acts">
                  {isEditable && (
                    <>
                      <button className={"v17-block-act" + (block.pinned ? " pinned" : "")}
                        onClick={() => onUpdateBlock(block.id, { pinned: !block.pinned })}
                        title={block.pinned ? "Открепить" : "Закрепить"}>
                        📌
                      </button>
                      <BlockColorPicker currentId={block.colorId} onChange={cid => onUpdateBlock(block.id, { colorId: cid })}/>
                      <button className="v17-block-act del" onClick={()=>onDeleteBlock(block.id)} style={{ fontSize:16 }}>×</button>
                    </>
                  )}
                </div>
              </div>
              <div className="v17-stripe" style={{ background: "rgba(45,74,107,0.06)" }}>
                <div style={{ height:"100%", width: bp + "%", background: col.accent, transition:"width 0.5s ease" }}/>
              </div>
              <div className="v17-block-body">
                {block.tasks.length === 0 && <div style={{ padding:"10px 8px", fontSize:13, color:"#9AAAB8", fontStyle:"italic" }}>{L.noTasks}</div>}
                {block.tasks.map((task, taskIdx) => {
                  const s = sc[task.status];
                  const tdo = taskDragOver?.blockId===block.id && taskDragOver?.taskIdx===taskIdx;
                  return (
                    <div key={task.id}
                      draggable={isEditable}
                      onDragStart={e => { e.stopPropagation(); taskDrag.current = { blockId:block.id, taskIdx }; }}
                      onDragOver={e => { e.preventDefault(); e.stopPropagation(); setTaskDragOver({blockId:block.id,taskIdx}); }}
                      onDragEnd={e => { e.stopPropagation(); taskDrag.current=null; setTaskDragOver(null); }}
                      onDrop={e => {
                        e.preventDefault(); e.stopPropagation();
                        if (!taskDrag.current) return;
                        const { blockId: srcBid, taskIdx: srcIdx } = taskDrag.current;
                        if (srcBid === block.id && srcIdx !== taskIdx) {
                          const newTasks = [...block.tasks];
                          const [moved] = newTasks.splice(srcIdx, 1);
                          newTasks.splice(taskIdx, 0, moved);
                          onUpdateBlock(block.id, { tasks: newTasks });
                        }
                        taskDrag.current = null; setTaskDragOver(null);
                      }}
                      className="v17-task"
                      style={{
                        borderTop: tdo ? "2px solid " + col.accent : "2px solid transparent",
                        cursor: isEditable ? "grab" : "default",
                      }}>
                      {isEditable && <span style={{ color:"#C8BFB0", fontSize:12, cursor:"grab", userSelect:"none", flexShrink:0 }}>⠿</span>}
                      {(isEditable || isStatusEditable) ? (
                        <>
                          <button className={"v17-chk" + (task.status==="done" ? " done" : "")}
                            onClick={()=>onSetTaskStatus(block.id,task.id,task.status==="done"?"pending":"done")}>
                            {task.status==="done" && "✓"}
                          </button>
                          <button className={"v17-chk" + (task.status==="failed" ? " fail" : "")}
                            onClick={()=>onSetTaskStatus(block.id,task.id,task.status==="failed"?"pending":"failed")}>
                            {task.status==="failed" && "✕"}
                          </button>
                        </>
                      ) : (
                        <div className={"v17-chk" + (task.status==="done" ? " done" : task.status==="failed" ? " fail" : "")}>
                          {task.status==="done" && "✓"}{task.status==="failed" && "✕"}
                        </div>
                      )}
                      <div className={"v17-task-name" + (task.status==="done" ? " done" : task.status==="failed" ? " fail" : "")}>
                        {isEditable
                          ? <EditableTitle value={task.names[lang]||task.names.ru} onChange={n=>onUpdateTaskName(block.id,task.id,n)} style={{ fontSize:14.5, fontWeight:500 }}/>
                          : task.names[lang]||task.names.ru}
                      </div>
                      <div className="v17-task-meta">
                        {isEditable && (
                          <RoutineLabel task={task}
                            onToggle={()=>onToggleRoutine(block.id,task.id)}
                            onChangeLabel={(lbl)=>onUpdateRoutineLabel(block.id,task.id,lbl)}
                            onChangeDays={(days)=>onUpdateRoutineDays(block.id,task.id,days)}
                            lang={lang}/>
                        )}
                        {!isEditable && task.routine && <span className="v17-tag-r">🔄 {task.routineLabel||"Рутина"}</span>}
                        <span className="v17-tag-t">
                          {task.type==="daily"?(lang==="ru"?"день":"daily"):task.type==="weekly"?(lang==="ru"?"нед.":"week"):task.type==="monthly"?(lang==="ru"?"мес.":"month"):(lang==="ru"?"год":"year")}
                        </span>
                        {isEditable && <button className="v17-t-del" onClick={()=>onDeleteTask(block.id,task.id)}>×</button>}
                      </div>
                    </div>
                  );
                })}
                {isEditable && (addingTask === block.id ? (
                  <div style={{ padding:"9px 8px", display:"flex", gap:7, alignItems:"center", flexWrap:"wrap" }}>
                    <input autoFocus value={newTaskName} onChange={e=>setNewTaskName(e.target.value)}
                      onKeyDown={e=>{ if(e.key==="Enter"&&newTaskName.trim()){ onAddTask(block.id,{id:uid(),names:{ru:newTaskName,en:newTaskName},status:"pending",type:newTaskType,routine:false}); setNewTaskName(""); setAddingTask(null); } if(e.key==="Escape")setAddingTask(null); }}
                      placeholder={L.newTask}
                      style={{ flex:1,minWidth:100,border:"1px solid #E8EEF4",borderRadius:10,padding:"7px 11px",fontSize:13,fontFamily:"inherit",outline:"none",background:"#F7FAFC" }}/>
                    <select value={newTaskType} onChange={e=>setNewTaskType(e.target.value)}
                      style={{ border:"1px solid #E8EEF4",borderRadius:10,padding:"7px",fontSize:11,fontFamily:"inherit",background:"#F7FAFC",outline:"none" }}>
                      <option value="daily">{lang==="ru"?"Ежедн.":"Daily"}</option>
                      <option value="weekly">{lang==="ru"?"Еженед.":"Weekly"}</option>
                      <option value="monthly">{lang==="ru"?"Ежемес.":"Monthly"}</option>
                      <option value="yearly">{lang==="ru"?"Год":"Year"}</option>
                    </select>
                    <button onClick={()=>{ if(!newTaskName.trim())return; onAddTask(block.id,{id:uid(),names:{ru:newTaskName,en:newTaskName},status:"pending",type:newTaskType,routine:false}); setNewTaskName(""); setAddingTask(null); }}
                      style={{ padding:"7px 14px",borderRadius:10,border:"none",background:"#FF8C42",color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>{L.save}</button>
                    <button onClick={()=>setAddingTask(null)}
                      style={{ padding:"7px 11px",borderRadius:10,border:"1px solid #E8EEF4",background:"#fff",color:"#9AAAB8",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>{L.cancel}</button>
                  </div>
                ) : (
                  <button className="v17-add-task" onClick={()=>{ setAddingTask(block.id); setNewTaskName(""); }}>
                    {L.addTask}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {isEditable && (addingBlock ? (
          <div style={{ background:"#fff",border:"1px solid #E8EEF4",borderRadius:24,padding:20 }}>
            <input autoFocus value={newBlockName} onChange={e=>setNewBlockName(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Escape")setAddingBlock(false); }}
              placeholder={L.newBlock}
              style={{ width:"100%",boxSizing:"border-box",border:"1px solid #E8EEF4",borderRadius:12,padding:"9px 13px",fontSize:14,fontFamily:"inherit",outline:"none",background:"#F7FAFC",marginBottom:13 }}/>
            <div style={{ display:"flex",gap:7,marginBottom:13,flexWrap:"wrap",alignItems:"center" }}>
              <span style={{ fontSize:12,color:"#9AAAB8" }}>{L.blockColor}:</span>
              {BLOCK_COLORS.map(c=>(
                <div key={c.id} onClick={()=>setNewBlockColor(c.id)}
                  style={{ width:22,height:22,borderRadius:"50%",background:c.accent,cursor:"pointer",border:newBlockColor===c.id?"3px solid #2D4A6B":"3px solid transparent",boxSizing:"border-box",transition:"border 0.15s" }}/>
              ))}
            </div>
            <div style={{ display:"flex",gap:7 }}>
              <button onClick={()=>{ if(!newBlockName.trim())return; onUpdateBlock("__add__",{id:uid(),colorId:newBlockColor,names:{ru:newBlockName,en:newBlockName},tasks:[]}); setNewBlockName(""); setAddingBlock(false); }}
                style={{ padding:"8px 18px",borderRadius:12,border:"none",background:"#FF8C42",color:"#fff",fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>{L.save}</button>
              <button onClick={()=>setAddingBlock(false)}
                style={{ padding:"8px 14px",borderRadius:12,border:"1px solid #E8EEF4",background:"#fff",color:"#9AAAB8",fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>{L.cancel}</button>
            </div>
          </div>
        ) : (
          <button className="v17-add-block" onClick={()=>setAddingBlock(true)}>
            {L.addBlock}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Full Grid Calendar ──────────────────────────────────────────────
