import React, { useState, useEffect } from 'react';

export default function EditableTitle({ value, onChange, style = {} }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value);

  useEffect(() => { setVal(value); }, [value]);

  if (editing) {
    return (
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => { onChange(val); setEditing(false); }}
        onKeyDown={e => {
          if (e.key === 'Enter')  { onChange(val); setEditing(false); }
          if (e.key === 'Escape') { setEditing(false); }
        }}
        style={{
          ...style,
          border: 'none',
          borderBottom: '1.5px solid #888780',
          background: 'transparent',
          outline: 'none',
          width: '100%',
          padding: '0 0 1px',
          fontFamily: 'inherit',
        }}
      />
    );
  }

  return (
    <span onClick={() => setEditing(true)} style={{ ...style, cursor: 'text' }}>
      {value || '—'}
    </span>
  );
}
