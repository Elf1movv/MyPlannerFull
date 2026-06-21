import React, { useState } from 'react';
import { THEME } from '../../constants/theme.js';
import EventModal from './EventModal.jsx';

export default function CalAddEventBtn({ date, lang, onAdd }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <button onClick={() => setShow(true)}
        style={{ fontSize:11, padding:"2px 10px", borderRadius:10, border:`1px solid ${THEME.sunsetApricot}`, background:"rgba(255,176,124,0.15)", color:THEME.sunsetDeep, cursor:"pointer", fontFamily:"inherit", fontWeight:500 }}>
        + {lang==="ru"?"Событие":"Event"}
      </button>
      {show && (
        <EventModal lang={lang} event={{ date }}
          onClose={() => setShow(false)}
          onSave={(data) => { onAdd(data); setShow(false); }}
        />
      )}
    </>
  );
}

// ── Events Panel & Modal ─────────────────────────────────────────────
const URGENCY_COLORS = {
  normal:  { bg:"rgba(191,231,255,0.5)", border:"rgba(191,231,255,0.8)", dot:"#5B9BD5", label:"Обычное" },
  urgent:  { bg:"rgba(255,220,180,0.5)", border:"rgba(255,176,124,0.8)", dot:"#FF8C42", label:"Срочное" },
  critical:{ bg:"rgba(255,180,180,0.5)", border:"rgba(226,75,74,0.6)",   dot:"#E24B4A", label:"Критичное" },
};
