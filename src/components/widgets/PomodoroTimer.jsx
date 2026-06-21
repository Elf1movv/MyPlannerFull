import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function PomodoroTimer({ lang }) {
  const WORK_MIN = 25, BREAK_MIN = 5;
  const [phase, setPhase]       = useState("work");
  const [seconds, setSeconds]   = useState(WORK_MIN * 60);
  const [running, setRunning]   = useState(false);
  const [open, setOpen]         = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef             = useRef(null);

  const total = phase === "work" ? WORK_MIN * 60 : BREAK_MIN * 60;
  const pct   = ((total - seconds) / total) * 100;
  const mm    = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss    = String(seconds % 60).padStart(2, "0");

  const accent = phase === "work" ? "#FF8C42" : "#1D9E75";
  const label  = phase === "work" ? (lang==="ru"?"Фокус":"Focus") : (lang==="ru"?"Перерыв":"Break");

  const beep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = phase === "work" ? 880 : 440;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(); osc.stop(ctx.currentTime + 0.8);
    } catch {}
  };

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          beep();
          if (phase === "work") {
            setSessions(n => n + 1);
            setPhase("break");
            setSeconds(BREAK_MIN * 60);
          } else {
            setPhase("work");
            setSeconds(WORK_MIN * 60);
          }
          return s;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, phase]);

  const reset = () => {
    setRunning(false);
    setPhase("work");
    setSeconds(WORK_MIN * 60);
  };

  const widget = (
    <div style={{
      position: "fixed", bottom: 88, right: 24, zIndex: 7980,
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
      padding: "10px 16px 10px 14px",
      display: "flex", alignItems: "center", gap: 12,
      minWidth: 148,
      userSelect: "none",
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: accent,
        flexShrink: 0,
        boxShadow: running ? `0 0 0 3px ${accent}33` : "none",
        transition: "box-shadow 0.3s",
      }}/>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#9AAAB8", letterSpacing: 0.8, textTransform: "uppercase", lineHeight: 1 }}>
          {lang === "ru" ? "Помодоро" : "Pomodoro"}
        </div>
        <div style={{
          fontSize: 26, fontWeight: 700, color: "#2D4A6B",
          fontFamily: "'DM Sans', sans-serif", lineHeight: 1.15,
          letterSpacing: -0.5,
        }}>
          {mm}:{ss}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button onClick={() => setRunning(r => !r)} title={running ? "Пауза" : "Старт"}
          style={{
            width: 32, height: 32, borderRadius: "50%", border: "none",
            background: running ? "#FFF0E8" : `linear-gradient(135deg, #FFB07C, #FF8C42)`,
            color: running ? "#FF8C42" : "#fff",
            fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: running ? "none" : "0 2px 8px rgba(255,140,66,0.35)",
            transition: "all 0.15s",
          }}>
          {running ? "⏸" : "▶"}
        </button>
        <button onClick={reset} title="Сброс"
          style={{
            width: 28, height: 28, borderRadius: "50%", border: "1px solid #E8EEF4",
            background: "#F7FAFC",
            color: "#9AAAB8", fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
          ↺
        </button>
      </div>
    </div>
  );

  const floatBtn = (
    <button onClick={() => setOpen(o => !o)}
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 8000,
        width: 52, height: 52, borderRadius: "50%",
        background: open
          ? `linear-gradient(135deg, #FF8C42, #FFB07C)`
          : `linear-gradient(135deg, #FFB07C, #FF8C42)`,
        border: "none", cursor: "pointer",
        boxShadow: "0 4px 18px rgba(255,140,66,0.40)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22,
        transform: open ? "scale(1.08) rotate(10deg)" : "scale(1)",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}>
      🍅
    </button>
  );

  const expandedPanel = open && createPortal(
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 7990 }} onClick={() => setOpen(false)}/>
      <div style={{
        position: "fixed", bottom: 155, right: 24, zIndex: 7991,
        background: "rgba(255,255,255,0.98)",
        borderRadius: 20,
        border: "1px solid rgba(232,238,244,0.8)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
        padding: "18px 20px",
        minWidth: 220,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#2D4A6B" }}>
            {lang === "ru" ? "Помодоро" : "Pomodoro"}
          </span>
          <span style={{ fontSize: 11, color: "#9AAAB8" }}>
            🔥 {sessions} {lang === "ru" ? "сессий" : "sessions"}
          </span>
        </div>

        {(() => {
          const r = 54, cx = 70, cy = 70;
          const circ = 2 * Math.PI * r;
          const dash = circ * (1 - pct / 100);
          return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <svg width={140} height={140} viewBox="0 0 140 140">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={8}/>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke={accent} strokeWidth={8}
                  strokeDasharray={circ} strokeDashoffset={dash}
                  strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
                  style={{ transition: "stroke-dashoffset 0.9s linear" }}/>
                <text x={cx} y={cy-8} textAnchor="middle" fontSize={26} fontWeight={700} fill="#2D4A6B" fontFamily="'DM Sans',sans-serif">{mm}:{ss}</text>
                <text x={cx} y={cy+14} textAnchor="middle" fontSize={11} fill="#9AAAB8" fontFamily="'DM Sans',sans-serif">{label}</text>
              </svg>
            </div>
          );
        })()}

        <div style={{ display: "flex", gap: 6, margin: "10px 0 0", justifyContent: "center" }}>
          {["work", "break"].map(p => (
            <div key={p} style={{
              height: 3, flex: 1, borderRadius: 2,
              background: phase === p ? accent : "rgba(200,200,200,0.3)",
              transition: "background 0.3s",
            }}/>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={() => setRunning(r => !r)}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 12, border: "none",
              background: `linear-gradient(135deg, ${accent}, ${phase === "work" ? "#FFB07C" : "#3DBE8A"})`,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: `0 4px 14px ${accent}55`,
            }}>
            {running ? (lang === "ru" ? "⏸ Пауза" : "⏸ Pause") : (lang === "ru" ? "▶ Старт" : "▶ Start")}
          </button>
          <button onClick={reset}
            style={{
              padding: "9px 14px", borderRadius: 12,
              border: "1px solid rgba(200,200,200,0.4)",
              background: "rgba(255,255,255,0.4)", color: "#9AAAB8",
              fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            }}>
            ↺
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "#9AAAB8" }}>
          {lang === "ru"
            ? `${sessions * WORK_MIN} мин фокуса сегодня`
            : `${sessions * WORK_MIN} min focused today`}
        </div>
      </div>
    </>,
    document.body
  );

  return (
    <>
      {floatBtn}
      {expandedPanel}
    </>
  );
}

// ── Main App ────────────────────────────────────────────────────────
