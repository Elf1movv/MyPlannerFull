import React, { useRef, useState } from 'react';
import { THEME } from '../../constants/theme.js';
import GoalItem from './GoalItem.jsx';

export default function GoalsList({ goals, period, lang, onDelete, onSetStatus, onUpdateText, onReorder }) {
  const dragIdx = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  const handleDragStart = (i) => (e) => {
    dragIdx.current = i;
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (i) => (e) => {
    e.preventDefault();
    setDragOver(i);
  };
  const handleDrop = (i) => (e) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) { setDragOver(null); return; }
    const reordered = [...goals];
    const [moved] = reordered.splice(dragIdx.current, 1);
    reordered.splice(i, 0, moved);
    onReorder(period, reordered);
    dragIdx.current = null; setDragOver(null);
  };
  const handleDragEnd = () => { dragIdx.current = null; setDragOver(null); };

  return (
    <div>
      {goals.map((g, i) => (
        <div key={g.id}
          style={{ opacity: dragOver === i ? 0.5 : 1, borderTop: dragOver === i ? `2px solid ${THEME.sunsetApricot}` : "2px solid transparent", transition:"border-color 0.1s" }}>
          <GoalItem
            goal={g} period={period}
            onDelete={onDelete} onSetStatus={onSetStatus} onUpdateText={onUpdateText}
            dragHandlers={{
              onDragStart: handleDragStart(i),
              onDragOver: handleDragOver(i),
              onDrop: handleDrop(i),
              onDragEnd: handleDragEnd,
            }}
          />
        </div>
      ))}
    </div>
  );
}
