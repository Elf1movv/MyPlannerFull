import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

// ── Supabase Sync ───────────────────────────────────────────────────
const SUPABASE_URL = "https://mahvuymxoddkiquhcngx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haHZ1eW14b2Rka2lxdWhjbmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzMwMzksImV4cCI6MjA5NDc0OTAzOX0.ZTAVqbUI5ihqbSWnIx8f9TWo6aN8uZHLXBYnr_kwK8Q";

async function sbFetch(method, body) {
  const opts = {
    method,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json",
      "Prefer": method === "POST" ? "resolution=merge-duplicates" : "",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const url = SUPABASE_URL + "/rest/v1/planner_data?id=eq.main";
  const r = await fetch(url, opts);
  if (method === "GET") return r.json();
  return r.ok;
}

async function loadFromCloud() {
  try {
    const rows = await sbFetch("GET");
    if (rows && rows.length > 0) {
      const d = rows[0].data;
      if (d && Object.keys(d).length > 0) return d;
    }
  } catch(e) { console.warn("Cloud load failed:", e); }
  return null;
}

async function saveToCloud(data) {
  try {
    await sbFetch("POST", [{ id: "main", data, updated_at: new Date().toISOString() }]);
  } catch(e) { console.warn("Cloud save failed:", e); }
}

async function getCloudTimestamp() {
  try {
    const rows = await sbFetch("GET");
    if (rows && rows.length > 0) return rows[0].updated_at;
  } catch(e) {}
  return null;
}


// ── Constants ───────────────────────────────────────────────────────
const CORRECT_PASSWORD = "2104";
const DATA_VERSION = 4; // bump when data structure changes

// ── Use LOCAL date (not UTC) to avoid timezone bugs ─────────────────
function getLocalToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
// NOTE: TODAY is a function call result used at module load time for defaults only.
// All runtime comparisons must call getLocalToday() directly.
const TODAY = getLocalToday();

// ── Better uid — timestamp + random to avoid collisions ─────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function localDateStr(d) {
  // Always use LOCAL date, never UTC — fixes timezone off-by-one bugs
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
}
function getDateKey(d) {
  if (d instanceof Date) return localDateStr(d);
  return d; // already a string
}

function getPast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i); return getDateKey(d);
  });
}
function getPast30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 29 + i); return getDateKey(d);
  });
}

// ── Theme colors ────────────────────────────────────────────────────
const THEME = {
  mistBlue: "#DDF2FF",
  skyBlue: "#BFE7FF",
  softAqua: "#C9F0EE",
  warmCream: "#FFF5EE",
  peachGlow: "#FFD2B8",
  sunsetApricot: "#FFB07C",
  sunsetDeep: "#FF8C42",
  text: "#2D4A6B",
  textLight: "#7BA3C4",
};

const BG_GRADIENT = `linear-gradient(135deg, ${THEME.skyBlue} 0%, ${THEME.warmCream} 50%, ${THEME.peachGlow} 100%)`;

// Animated background CSS — GPU optimised
const BG_ANIM_STYLE = `
  @keyframes bgShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .animated-bg {
    background: linear-gradient(135deg,
      #BFE7FF, #C9F0EE, #FFF5EE, #FFD2B8, #E8F4FF, #D4F0E8
    );
    background-size: 300% 300%;
    animation: bgShift 55s ease infinite;
    will-change: background-position;
  }
  /* Perf hints */
  [draggable="true"] { will-change: transform; }
  @media (prefers-reduced-motion: reduce) {
    .animated-bg { animation: none; background-position: 0% 50%; }
    [style*="animation"] { animation: none !important; }
  }
`;
// ── Login Screen CSS ────────────────────────────────────────────────
const LOGIN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');

  .lg-stage { position:fixed; inset:0; overflow:hidden; font-family:'DM Sans','Manrope',system-ui,sans-serif; color:#2D4A6B; }
  .lg-bg { position:absolute; inset:0; z-index:0;
    background:linear-gradient(120deg,#D6E8FA 0%,#E4F4EC 30%,#FBF6E0 60%,#FCE7DB 100%);
    background-size:200% 200%; animation:lgBgFlow 30s ease-in-out infinite; }
  @keyframes lgBgFlow{0%{background-position:0% 35%}50%{background-position:100% 65%}100%{background-position:0% 35%}}
  .lg-blob { position:absolute; border-radius:50%; filter:blur(60px); opacity:.5; }
  .lg-blob.b1{width:520px;height:520px;background:#FBD7C4;right:-80px;top:-60px;}
  .lg-blob.b2{width:460px;height:460px;background:#FAF0CF;left:6%;bottom:-120px;opacity:.45;}
  .lg-blob.b3{width:380px;height:380px;background:#BBD9F5;right:18%;bottom:6%;opacity:.32;}

  .lg-brand { position:absolute; z-index:6; top:26px; left:30px;
    font-family:'Comfortaa',sans-serif; font-weight:700; font-size:23px;
    color:#FF8C42; letter-spacing:-.01em; }

  /* theme switch bottom-right */
  .lg-switch { position:absolute; z-index:6; bottom:24px; right:24px; display:flex;
    gap:3px; padding:4px; border-radius:30px;
    background:rgba(255,255,255,.62); backdrop-filter:blur(8px);
    box-shadow:0 4px 14px rgba(60,72,98,.10); }
  .lg-sw { width:34px; height:34px; border:0; border-radius:24px; background:transparent;
    color:#9AAAB8; display:flex; align-items:center; justify-content:center;
    padding:8px; transition:.16s; cursor:pointer; }
  .lg-sw:hover { color:#5E7691; }
  .lg-sw.on { background:#FF8C42; color:#fff;
    box-shadow:0 4px 11px rgba(255,140,66,0.42); }
  .lg-sw svg { width:100%; height:100%; }

  /* layout — quote & stats: aside centered in left half, card in right */
  .lg-row { position:absolute; inset:0; z-index:2; display:flex; align-items:center; }
  .lg-row.split { padding:0 max(5vw,60px); gap:0; justify-content:space-between; }
  .lg-row.center { justify-content:center; }

  /* aside takes left half, centers content within it */
  .lg-aside-wrap { flex:1 1 0; display:flex; align-items:center; justify-content:center; padding:0 40px 0 0; }
  .lg-aside { max-width:560px; width:100%; }

  /* quote aside */
  .lg-q-mark { font-family:'Comfortaa',sans-serif; font-size:64px; font-weight:700;
    line-height:0; height:30px; display:block; color:rgba(255,140,66,.55); }
  .lg-q-text { font-family:'Comfortaa',sans-serif; font-size:36px; font-weight:700;
    line-height:1.32; color:#2D4A6B; margin:18px 0 26px; max-width:560px;
    letter-spacing:-.01em; }
  .lg-q-author { font-size:14px; color:#9AAAB8; font-weight:500; }
  .lg-q-date { font-size:13px; color:#9AAAB8; margin-top:18px; }

  /* stats aside */
  .lg-s-label { font-size:13px; font-weight:700; letter-spacing:.12em;
    text-transform:uppercase; color:#9AAAB8; }
  .lg-s-title { font-family:'Comfortaa',sans-serif; font-size:36px; font-weight:700;
    color:#2D4A6B; margin:12px 0 28px; line-height:1.25; letter-spacing:-.01em; }
  .lg-s-tile { display:flex; align-items:center; gap:16px;
    background:rgba(255,255,255,.5); backdrop-filter:blur(6px);
    border-radius:18px; padding:18px 22px; max-width:420px;
    box-shadow:0 6px 18px rgba(60,72,98,.07); }
  .lg-s-tile b { font-size:17px; font-weight:700; color:#2D4A6B; display:block; }
  .lg-s-tile span { font-size:13px; color:#9AAAB8; font-weight:500; }
  .lg-s-note { font-size:13.5px; font-style:italic; color:#9AAAB8; margin-top:18px; }

  /* anim blobs inside aside */
  .lg-anim { position:relative; width:100%; height:200px; }
  .lg-anim-blob { position:absolute; border-radius:50%; filter:blur(28px); }
  @keyframes lgDrift1{0%,100%{transform:translate(0,0)}50%{transform:translate(18px,-22px)}}
  @keyframes lgDrift2{0%,100%{transform:translate(0,0)}50%{transform:translate(-14px,20px)}}
  @keyframes lgDrift3{0%,100%{transform:translate(0,0)}50%{transform:translate(20px,14px)}}

  /* card */
  .lg-card-zone { flex:0 0 auto; display:flex; justify-content:center; }
  .lg-card { width:300px; background:#fff; border-radius:24px; padding:36px 34px 32px;
    box-shadow:0 26px 64px rgba(58,72,98,.17),0 5px 16px rgba(58,72,98,.07);
    border:1px solid rgba(255,255,255,.85);
    display:flex; flex-direction:column; align-items:center; cursor:text; }
  .lg-stage.is-shake .lg-card { animation:lgShake .42s cubic-bezier(.36,.07,.19,.97); }
  @keyframes lgShake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-9px)}40%,60%{transform:translateX(9px)}}
  .lg-card-title { font-family:'Comfortaa',sans-serif; font-size:42px; font-weight:700;
    color:#2D4A6B; line-height:1; margin:0; letter-spacing:-.02em; }
  .lg-card-title-ex { font-style:italic; display:inline-block; transform:skewX(-12deg); }
  .lg-card-sub { font-size:13px; color:#9AAAB8; font-weight:500; margin:10px 0 22px; text-align:center; }

  /* pin field */
  .lg-pin-field { position:relative; width:200px; height:56px; border-radius:14px; background:#fff;
    border:2px solid #FBD7C4; display:flex; align-items:center; justify-content:center; gap:14px;
    cursor:text; transition:border-color .18s, box-shadow .18s; }
  .lg-pin-field:focus-within { border-color:#FF8C42; box-shadow:0 0 0 4px rgba(255,140,66,.14); }
  .lg-pin-field.err { border-color:#EE5B52; box-shadow:0 0 0 4px rgba(238,91,82,.13); }
  .lg-pin-bullet { width:9px; height:9px; border-radius:50%; background:#2D4A6B; display:block; }
  .lg-pin-bullet.err { background:#EE5B52; }
  .lg-pin-empty { width:9px; height:9px; border-radius:50%; background:rgba(45,74,107,.18); display:block; }
  .lg-pin-caret { width:2px; height:22px; background:#FF8C42; border-radius:2px; display:block;
    animation:lgBlink 1.1s steps(1) infinite; }
  @keyframes lgBlink{0%,50%{opacity:1}51%,100%{opacity:0}}

  .lg-err-txt { height:16px; font-size:12.5px; font-weight:600; color:#EE5B52;
    margin-top:10px; opacity:0; transition:opacity .2s; }
  .lg-stage.is-error .lg-err-txt { opacity:1; }

  .lg-enter { margin-top:14px; width:200px; height:48px; border:0; border-radius:14px;
    color:#fff; font-size:15px; font-weight:700; font-family:inherit; cursor:pointer;
    background:linear-gradient(180deg,#FFA45C,#FF8C42);
    box-shadow:0 10px 22px rgba(255,140,66,.38),inset 0 1px 0 rgba(255,255,255,.35);
    display:flex; align-items:center; justify-content:center; gap:8px; transition:.16s; }
  .lg-enter:hover { transform:translateY(-2px); box-shadow:0 14px 28px rgba(255,140,66,.46),inset 0 1px 0 rgba(255,255,255,.35); }
  .lg-enter:active { transform:translateY(0); }

  /* success overlay */
  .lg-success { position:absolute; inset:0; z-index:10; display:flex;
    flex-direction:column; align-items:center; justify-content:center; gap:16px;
    opacity:0; pointer-events:none; transition:opacity .5s; }
  .lg-stage.is-success .lg-success { opacity:1; pointer-events:auto; }
  .lg-stage.is-success .lg-row { opacity:0; transition:opacity .3s; }
  .lg-success h2 { font-family:'Comfortaa',sans-serif; font-size:32px; color:#2D4A6B; margin:0; }
  .lg-success p { font-size:15px; color:#9AAAB8; margin:0; }
  .lg-sun { width:64px; height:64px; color:#FF8C42; animation:lgSpinSun 9s linear infinite; }
  @keyframes lgSpinSun{to{transform:rotate(360deg)}}

  /* caption */
  .lg-caption { position:absolute; z-index:6; bottom:20px; left:50%; transform:translateX(-50%);
    font-size:12px; color:#9AAAB8; font-weight:500; white-space:nowrap; }
`;

// ── Login Icons ──────────────────────────────────────────────────────
const LG_ICON = {
  quote: (p={}) => <svg viewBox="0 0 20 20" fill="currentColor" {...p}><path d="M4 11.5c0-3 1.8-5.2 4.4-6l.6 1.4C7.4 7.5 6.4 8.7 6.3 10c.2-.1.5-.2.9-.2 1.2 0 2.1.9 2.1 2.2 0 1.3-1 2.3-2.4 2.3C5.2 14.3 4 13 4 11.5zm6.7 0c0-3 1.8-5.2 4.4-6l.6 1.4c-1.6.6-2.6 1.8-2.7 3.1.2-.1.5-.2.9-.2 1.2 0 2.1.9 2.1 2.2 0 1.3-1 2.3-2.4 2.3-1.7 0-2.9-1.3-2.9-2.8z"/></svg>,
  spark: (p={}) => <svg viewBox="0 0 20 20" fill="currentColor" {...p}><path d="M10 2l1.4 4.2L15.6 7l-3.4 2.6 1.2 4.3L10 11.4 6.6 13.9l1.2-4.3L4.4 7l4.2-.8L10 2z"/><circle cx="15.5" cy="14.5" r="1.4"/><circle cx="4.8" cy="13.8" r="1"/></svg>,
  stats: (p={}) => <svg viewBox="0 0 20 20" fill="none" {...p}><rect x="3" y="11" width="3.4" height="6" rx="1.2" fill="currentColor"/><rect x="8.3" y="7" width="3.4" height="10" rx="1.2" fill="currentColor"/><rect x="13.6" y="4" width="3.4" height="13" rx="1.2" fill="currentColor"/></svg>,
  back: (p={}) => <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M9.5 7L5 12l4.5 5M5 12h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  sun: (p={}) => <svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="4.4" fill="currentColor"/><g stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5M18.7 5.3l-1.7 1.7M7 17l-1.7 1.7M18.7 18.7L17 17M7 7L5.3 5.3"/></g></svg>,
};

const LG_QUOTES = [
  { t: 'Делай сегодня то, что другие не хотят, — завтра будешь жить так, как другие не могут.', a: '— Джерри Райс' },
  { t: 'Дисциплина — это мост между целями и их достижением.', a: '— Джим Рон' },
  { t: 'Маленькие шаги каждый день приводят к большим переменам.', a: '— Народная мудрость' },
  { t: 'Лучшее время начать было вчера. Следующее лучшее — сейчас.', a: '— Китайская пословица' },
  { t: 'Ты не обязан быть великим, чтобы начать. Но ты должен начать, чтобы стать великим.', a: '— Зиг Зиглар' },
  { t: 'Победитель — это просто мечтатель, который не сдался.', a: '— Нельсон Мандела' },
];

// ── Login: Pin Dots ──────────────────────────────────────────────────
function LgPinDots({ len, error }) {
  return (
    <div className="lg-dots">
      {[0,1,2,3].map(i => (
        <span key={i} className={'lg-dot' + (i < len ? ' fill' : '')}/>
      ))}
    </div>
  );
}

// ── Login: Keypad ────────────────────────────────────────────────────
function LgKeypad({ onKey, pressed }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','back'];
  return (
    <div className="lg-keypad">
      {keys.map((k,i) => {
        if (k === '') return <span key={i} className="lg-key ghost"/>;
        if (k === 'back') return (
          <button key={i} className={'lg-key act' + (pressed==='back' ? ' press' : '')}
            onClick={() => onKey('back')}>
            {LG_ICON.back({ width:20, height:20 })}
          </button>
        );
        return (
          <button key={i} className={'lg-key' + (pressed===k ? ' press' : '')}
            onClick={() => onKey(k)}>{k}</button>
        );
      })}
    </div>
  );
}

// ── Login: Card (center piece) ───────────────────────────────────────
function LgCard({ pin, error, onSubmit, onKey }) {
  const inputRef = useRef(null);
  return (
    <div className="lg-card-zone">
      <div className="lg-card" onClick={() => inputRef.current?.focus()}>
        <h1 className="lg-card-title">Мой день</h1>
        <p className="lg-card-sub">Твоя личная система жизни</p>

        {/* Pin field */}
        <div className={'lg-pin-field' + (error ? ' err' : '')}>
          {[0,1,2,3].map(i => {
            const filled = i < pin.length;
            const isActive = i === pin.length;
            return (
              <span key={i}>
                {filled
                  ? <span className={'lg-pin-bullet' + (error ? ' err' : '')}/>
                  : isActive
                    ? <span className="lg-pin-caret"/>
                    : <span className="lg-pin-empty"/>
                }
              </span>
            );
          })}
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={e => {
              const v = e.target.value.replace(/\D/g,'');
              if (v.length <= 4) {
                // simulate key presses
                if (v.length > pin.length) onKey(v[v.length-1]);
                else if (v.length < pin.length) onKey('back');
              }
            }}
            autoFocus
            style={{ position:'absolute', inset:0, opacity:0, border:0, background:'transparent', cursor:'text', fontSize:16 }}
          />
        </div>

        <div className="lg-err-txt">Неверный пин-код</div>

        <button className="lg-enter" onClick={onSubmit}>
          Войти
          <svg viewBox="0 0 24 24" fill="none" width={18} height={18}><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── Login: Aside Quote ───────────────────────────────────────────────
function LgAsideQuote() {
  const q = LG_QUOTES[new Date().getDate() % LG_QUOTES.length];
  const d = new Date();
  const days = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  return (
    <div className="lg-aside">
      <span className="lg-q-mark">&ldquo;</span>
      <p className="lg-q-text">{q.t}</p>
      <span className="lg-q-author">{q.a}</span>
      <p className="lg-q-date">{days[d.getDay()]}, {d.getDate()} {months[d.getMonth()]}</p>
    </div>
  );
}

// ── Login: Aside Anim (decorative background blobs) ─────────────────
function LgAsideAnim() {
  return (
    <>
      {[
        { w:90,h:90,l:'12%',t:'20%',bg:'#BBD9F5',anim:'lgDrift1 7s ease-in-out infinite' },
        { w:70,h:70,l:'30%',t:'60%',bg:'#FBD7C4',anim:'lgDrift2 9s ease-in-out infinite' },
        { w:110,h:110,l:'20%',t:'40%',bg:'#BFE6D2',anim:'lgDrift3 10s ease-in-out infinite' },
        { w:55,h:55,l:'38%',t:'15%',bg:'#FAF0CF',anim:'lgDrift1 6s ease-in-out infinite' },
      ].map((b,i) => (
        <div key={i} style={{
          position:'absolute', width:b.w, height:b.h, left:b.l, top:b.t,
          borderRadius:'50%', background:b.bg, filter:'blur(28px)',
          animation:b.anim, zIndex:1,
        }}/>
      ))}
    </>
  );
}

// ── Login: Aside Stats ───────────────────────────────────────────────
function LgAsideStats() {
  const data = (() => { try { const r=localStorage.getItem("dailyplanner_v3"); return r?JSON.parse(r):null; } catch{return null;} })();
  const yesterday = (() => { const d=new Date(); d.setDate(d.getDate()-1); return localDateStr(d); })();
  const yBlocks = data?.days?.[yesterday]?.blocks || [];
  const yTasks = yBlocks.flatMap(b=>b.tasks);
  const yDone = yTasks.filter(t=>t.status==="done").length;
  const yTotal = yTasks.length;
  const yPct = yTotal>0 ? Math.round(yDone/yTotal*100) : 0;
  const habits = data?.habits || [];
  const habitLog = data?.habitLog || {};
  let maxStreak = 0;
  habits.forEach(h => {
    let s=0; const d=new Date();
    for(let i=0;i<60;i++){
      if(habitLog[localDateStr(d)]?.[h.id]){s++;d.setDate(d.getDate()-1);}else break;
    }
    if(s>maxStreak) maxStreak=s;
  });
  const goodDays = Array.from({length:7},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-i);
    const bl=data?.days?.[localDateStr(d)]?.blocks||[];
    const t=bl.flatMap(b=>b.tasks);
    return t.length>0&&t.filter(t=>t.status==="done").length/t.length>=0.8;
  }).filter(Boolean).length;

  return (
    <div className="lg-aside">
      <div className="lg-s-label">Твой прогресс</div>
      <div className="lg-s-title">
        {yPct===100?"Идеальный день! 🏆":yPct>=70?"Отличный результат! 🔥":yPct>=40?"Хороший задел 👍":"Продолжай в том же духе 💪"}
      </div>
      <div className="lg-s-tile" style={{ marginBottom:12 }}>
        <span style={{ fontSize:28 }}>⭐</span>
        <div>
          <b>{yDone}/{yTotal} задач вчера</b>
          <span>{yPct}% выполнено</span>
        </div>
      </div>
      <div className="lg-s-tile" style={{ marginBottom:12 }}>
        <span style={{ fontSize:28 }}>🔥</span>
        <div>
          <b>{maxStreak} дней серия</b>
          <span>лучшая активная привычка</span>
        </div>
      </div>
      <div className="lg-s-tile">
        <span style={{ fontSize:28 }}>📅</span>
        <div>
          <b>{goodDays} из 7 дней</b>
          <span>выполнено на 80%+</span>
        </div>
      </div>
    </div>
  );
}

// ── Password Screen ──────────────────────────────────────────────────
function PasswordScreen({ onUnlock }) {
  const [pin, setPin]         = useState('');
  const [error, setError]     = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake]     = useState(false);
  const [theme, setTheme]     = useState(() => localStorage.getItem("login_theme") || "quote");
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const after = (ms, fn) => { const t = setTimeout(fn, ms); timers.current.push(t); };

  const handleSubmit = useCallback(() => {
    if (success) return;
    if (pin === CORRECT_PASSWORD) {
      setSuccess(true);
      after(1400, () => { localStorage.setItem("planner_auth","1"); onUnlock(); });
    } else {
      setShake(true); setError(true); setPin('');
      after(420, () => setShake(false));
      after(1500, () => setError(false));
    }
  }, [pin, success, onUnlock]);

  const handleKey = useCallback((k) => {
    if (success) return;
    if (k === 'back') { setError(false); setPin(p => p.slice(0,-1)); return; }
    setError(false);
    setPin(prev => {
      if (prev.length >= 4) return prev;
      const next = prev + k;
      if (next.length === 4) {
        after(120, () => {
          if (next === CORRECT_PASSWORD) {
            setSuccess(true);
            after(1400, () => { localStorage.setItem("planner_auth","1"); onUnlock(); });
          } else {
            setShake(true); setError(true);
            after(420, () => { setPin(''); setShake(false); });
            after(1500, () => setError(false));
          }
        });
      }
      return next;
    });
  }, [success, onUnlock]);

  // Physical keyboard
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Enter') handleSubmit();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleSubmit]);

  const stageCls = 'lg-stage'
    + (error ? ' is-error' : '')
    + (shake ? ' is-shake' : '')
    + (success ? ' is-success' : '');

  const THEMES = [
    { id:'quote', icon: LG_ICON.quote },
    { id:'anim',  icon: LG_ICON.spark },
    { id:'stats', icon: LG_ICON.stats },
  ];

  const isCenter = theme === 'anim';

  return (
    <div className={stageCls}>
      <style>{LOGIN_CSS}</style>
      <div className="lg-bg"/>
      <div className="lg-blob b1"/>
      <div className="lg-blob b2"/>
      <div className="lg-blob b3"/>
      <div className="lg-brand">Мой планер</div>

      {/* Main row */}
      <div className={'lg-row ' + (isCenter ? 'center' : 'split')}>
        {!isCenter && (
          <div className="lg-aside-wrap">
            {theme === 'quote' && <LgAsideQuote/>}
            {theme === 'stats' && <LgAsideStats/>}
          </div>
        )}
        {isCenter && <LgAsideAnim/>}
        <div style={{ flexShrink:0, paddingRight: isCenter ? 0 : 'max(5vw,60px)' }}>
          <LgCard pin={pin} error={error} onKey={handleKey} onSubmit={handleSubmit}/>
        </div>
      </div>

      {/* Success overlay */}
      <div className="lg-success">
        <svg className="lg-sun" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4.4" fill="#FF8C42"/>
          <g stroke="#FF8C42" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5M18.7 5.3l-1.7 1.7M7 17l-1.7 1.7M18.7 18.7L17 17M7 7L5.3 5.3"/>
          </g>
        </svg>
        <h2>С возвращением!</h2>
        <p>Хорошего и продуктивного дня ✨</p>
      </div>

      {/* Theme switch */}
      <div className="lg-switch">
        {THEMES.map(t => (
          <button key={t.id} className={'lg-sw' + (theme===t.id ? ' on' : '')}
            onClick={() => { setTheme(t.id); localStorage.setItem("login_theme", t.id); }}>
            {t.icon({ width:18, height:18 })}
          </button>
        ))}
      </div>


    </div>
  );
}

// ── Language ────────────────────────────────────────────────────────
const LANG = {
  ru: {
    title: "Мой день", today: "Сегодня", calendar: "Календарь", stats: "Статистика", habits: "Привычки",
    addBlock: "Добавить блок", addTask: "Добавить задачу", addHabit: "Добавить привычку",
    newBlock: "Новый блок", newTask: "Новая задача", newHabit: "Новая привычка",
    done: "Выполнено", failed: "Провалено", routine: "Рутина", routineHint: "Повторяется каждый день",
    deleteBlock: "Удалить блок", deleteTask: "Удалить задачу",
    noTasks: "Нет задач. Добавьте первую.", tasksOf: "задач", blockColor: "Цвет блока",
    cancel: "Отмена", save: "Сохранить", export: "Экспорт", import: "Импорт",
    dayProgress: "Прогресс дня", weekProgress: "Прогресс недели", monthProgress: "Прогресс месяца", yearProgress: "Прогресс года",
    newDay: "Новый день! 🌅", newDayMsg: "Рутинные задачи перенесены. Отличного дня!", startDay: "Начать день 🚀",
    todayBadge: "Сегодня", planningBadge: "Планирование", historyBadge: "История",
    days: ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"],
    months: ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"],
    monthsShort: ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"],
    byBlock: "По блокам (сегодня)", streak: "дней подряд", habitsGrid: "Сетка привычек",
    week: "Нед.", month: "Мес.", year: "Год",
  },
  en: {
    title: "My Day", today: "Today", calendar: "Calendar", stats: "Stats", habits: "Habits",
    addBlock: "Add block", addTask: "Add task", addHabit: "Add habit",
    newBlock: "New block", newTask: "New task", newHabit: "New habit",
    done: "Done", failed: "Failed", routine: "Routine", routineHint: "Repeats every day",
    deleteBlock: "Delete block", deleteTask: "Delete task",
    noTasks: "No tasks yet. Add your first.", tasksOf: "tasks", blockColor: "Block color",
    cancel: "Cancel", save: "Save", export: "Export", import: "Import",
    dayProgress: "Day progress", weekProgress: "Week progress", monthProgress: "Month progress", yearProgress: "Year progress",
    newDay: "New day! 🌅", newDayMsg: "Routine tasks carried over. Have a great day!", startDay: "Start day 🚀",
    todayBadge: "Today", planningBadge: "Planning", historyBadge: "History",
    days: ["Mo","Tu","We","Th","Fr","Sa","Su"],
    months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
    monthsShort: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    byBlock: "By block (today)", streak: "day streak", habitsGrid: "Habit grid",
    week: "Week", month: "Month", year: "Year",
  }
};

const BLOCK_COLORS = [
  { id:"amber",    bg:"rgba(255,248,230,0.85)", accent:"#D4A017", text:"#7A5A00" },
  { id:"teal",     bg:"rgba(230,247,244,0.85)", accent:"#1D9E75", text:"#085041" },
  { id:"blue",     bg:"rgba(235,244,253,0.85)", accent:"#378ADD", text:"#0C447C" },
  { id:"pink",     bg:"rgba(251,240,244,0.85)", accent:"#D4537E", text:"#72243E" },
  { id:"purple",   bg:"rgba(239,238,253,0.85)", accent:"#7F77DD", text:"#3C3489" },
  { id:"peach",    bg:"rgba(255,240,230,0.85)", accent:"#FF8C42", text:"#7A3A00" },
  { id:"red",      bg:"rgba(255,235,235,0.85)", accent:"#E53935", text:"#7A0000" },
  { id:"crimson",  bg:"rgba(252,232,240,0.85)", accent:"#C2185B", text:"#6A0030" },
  { id:"indigo",   bg:"rgba(232,234,252,0.85)", accent:"#3949AB", text:"#0D1A6E" },
  { id:"cyan",     bg:"rgba(224,247,252,0.85)", accent:"#00ACC1", text:"#005662" },
  { id:"lime",     bg:"rgba(240,252,224,0.85)", accent:"#7CB342", text:"#2E5A00" },
  { id:"green",    bg:"rgba(230,250,235,0.85)", accent:"#2E7D32", text:"#0A3D0C" },
  { id:"olive",    bg:"rgba(245,248,220,0.85)", accent:"#9E9D24", text:"#4A4800" },
  { id:"brown",    bg:"rgba(245,238,230,0.85)", accent:"#6D4C41", text:"#3E1F10" },
  { id:"slate",    bg:"rgba(235,240,245,0.85)", accent:"#546E7A", text:"#1E3640" },
  { id:"rose",     bg:"rgba(255,238,242,0.85)", accent:"#E91E63", text:"#7A0030" },
  { id:"violet",   bg:"rgba(243,232,255,0.85)", accent:"#9C27B0", text:"#4A006A" },
  { id:"sky",      bg:"rgba(224,242,255,0.85)", accent:"#0288D1", text:"#014B7A" },
  { id:"mint",     bg:"rgba(224,252,244,0.85)", accent:"#00897B", text:"#004D40" },
  { id:"coral",    bg:"rgba(255,236,230,0.85)", accent:"#FF5722", text:"#7A2000" },
  { id:"gold",     bg:"rgba(255,248,220,0.85)", accent:"#F9A825", text:"#7A5000" },
  { id:"lavender", bg:"rgba(243,238,255,0.85)", accent:"#7B1FA2", text:"#3A005A" },
  { id:"gray",     bg:"rgba(245,245,245,0.85)", accent:"#757575", text:"#333333" },
  { id:"charcoal", bg:"rgba(235,237,240,0.85)", accent:"#37474F", text:"#101D22" },
];

const DEFAULT_BLOCKS = () => ([
  { id:"morning", colorId:"amber", names:{ru:"Утро",en:"Morning"}, tasks:[
    { id:"t1", names:{ru:"Зарядка 20 мин",en:"Exercise 20 min"}, status:"pending", type:"daily", routine:true },
    { id:"t2", names:{ru:"Медитация",en:"Meditation"}, status:"pending", type:"daily", routine:true },
  ]},
  { id:"work", colorId:"blue", names:{ru:"Работа",en:"Work"}, tasks:[
    { id:"t4", names:{ru:"Проверить почту",en:"Check email"}, status:"pending", type:"daily", routine:true },
    { id:"t5", names:{ru:"Написать отчёт",en:"Write report"}, status:"pending", type:"weekly", routine:false },
  ]},
]);

const DEFAULT_HABITS = () => ([
  { id:"h1", names:{ru:"Выпить 2л воды",en:"Drink 2L water"}, color:"#378ADD" },
  { id:"h2", names:{ru:"Без соцсетей до 12:00",en:"No social media till noon"}, color:"#1D9E75" },
  { id:"h3", names:{ru:"Ранний подъём",en:"Early rise"}, color:"#FF8C42" },
]);

function loadAppData() {
  try {
    const raw = localStorage.getItem("dailyplanner_v3");
    if (raw) {
      const parsed = JSON.parse(raw);
      // Add version if missing (migration from older versions)
      if (!parsed.version) parsed.version = DATA_VERSION;
      return parsed;
    }
  } catch {}
  return {
    version: DATA_VERSION,
    days: { [TODAY]: { blocks: DEFAULT_BLOCKS() } },
    habits: DEFAULT_HABITS(),
    habitLog: {},
    goals: {},
    events: [],
    lastDate: TODAY
  };
}

// ── Offline queue — store pending saves when offline ─────────────────
const OFFLINE_QUEUE_KEY = "planner_offline_queue";
function getOfflineQueue() {
  try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]"); } catch { return []; }
}
function setOfflineQueue(q) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q));
}
function enqueueOfflineSave(data) {
  const q = [{ data, ts: new Date().toISOString() }]; // keep only latest
  setOfflineQueue(q);
}
async function flushOfflineQueue() {
  const q = getOfflineQueue();
  if (!q.length) return;
  try {
    const last = q[q.length - 1];
    await saveToCloud(last.data);
    setOfflineQueue([]);
  } catch {}
}

// ── Auto-cleanup: compress days older than 90 days ───────────────────
function calcPct(blocks) {
  const all = (blocks || []).flatMap(b => b.tasks || []);
  if (!all.length) return 0;
  return Math.round((all.filter(t => t.status === "done").length / all.length) * 100);
}

// ── Auto-cleanup disabled — preserving full history ──────────────────
function compressOldDays(days) {
  return days; // Keep all data intact
}

const DOW_NAMES_RU = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
const DOW_NAMES_EN = ["Su","Mo","Tu","We","Th","Fr","Sa"];
// routineDays: array of 0-6 (0=Sun). Empty/undefined = every day.

function buildNewDay(prevBlocks, dateStr) {
  const dow = dateStr
    ? (new Date(dateStr + "T12:00:00")).getDay()
    : new Date().getDay();
  return prevBlocks.map(block => {
    const routineTasks = block.tasks.filter(t => {
      if (!t.routine) return false;
      if (!t.routineDays || t.routineDays.length === 0) return true;
      return t.routineDays.includes(dow);
    }).map(t => ({ ...t, id: uid(), status: "pending" }));

    // Include block if: has routine tasks OR is pinned
    if (routineTasks.length > 0 || block.pinned) {
      return { ...block, id: block.id, tasks: routineTasks };
    }
    return null;
  }).filter(Boolean);
}

// Find most recent past day that has routine tasks — use as template source
function findRoutineSource(days, today) {
  const td = today || getLocalToday();
  const past = Object.keys(days).filter(k => k < td && !days[k]?.compressed).sort().reverse();
  for (const key of past) {
    const blocks = days[key]?.blocks || [];
    if (blocks.some(b => b.tasks?.some(t => t.routine))) return blocks;
  }
  return null;
}


function dayBgColor(p) {
  if (p === null) return "rgba(255,255,255,0.4)";
  if (p === 0) return "rgba(240,239,232,0.6)";
  if (p < 40) return "rgba(252,235,235,0.8)";
  if (p < 70) return "rgba(255,248,230,0.8)";
  if (p < 100) return "rgba(230,247,244,0.8)";
  return "#1D9E75";
}
function dayFgColor(p) {
  if (p === null || p === 0) return "#B4B2A9";
  if (p < 40) return "#A32D2D";
  if (p < 70) return "#7A5A00";
  if (p < 100) return "#085041";
  return "#fff";
}

// ── Editable Title ──────────────────────────────────────────────────
function EditableTitle({ value, onChange, style = {} }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  useEffect(() => { setVal(value); }, [value]);
  if (editing) return (
    <input autoFocus value={val} onChange={e => setVal(e.target.value)}
      onBlur={() => { onChange(val); setEditing(false); }}
      onKeyDown={e => { if (e.key === "Enter") { onChange(val); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
      style={{ ...style, border: "none", borderBottom: "1.5px solid #888780", background: "transparent", outline: "none", width: "100%", padding: "0 0 1px", fontFamily: "inherit" }} />
  );
  return <span onClick={() => setEditing(true)} style={{ ...style, cursor: "text" }}>{value || "—"}</span>;
}

// ── Circle Progress ─────────────────────────────────────────────────
function CircleProgress({ pct: p, size = 80, stroke = 6, color = "#1D9E75", label, sublabel }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r, offset = circ - (p / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      {label && <div style={{ textAlign: "center", marginTop: -4 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: THEME.text }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11, color: THEME.textLight }}>{sublabel}</div>}
      </div>}
    </div>
  );
}

// ── Bar Chart ───────────────────────────────────────────────────────
function BarChart({ data, color = "#378ADD" }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, padding: "0 4px" }}>
      {data.map((d, i) => {
        const p = d.pct !== undefined ? d.pct : (d.total ? Math.round((d.done / d.total) * 100) : 0);
        const h = Math.round((p / 100) * 64) + 4;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: "100%", height: h, borderRadius: 4, background: p > 0 ? color : "rgba(255,255,255,0.4)", opacity: p === 0 ? 0.5 : 1, transition: "height 0.5s ease" }} title={`${p}%`} />
            <span style={{ fontSize: 10, color: THEME.textLight }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Habit Area Chart (combined, all habits summed) ──────────────────
function HabitAreaChart({ data, color }) {
  const W = 580, H = 130, PAD = { t: 16, r: 16, b: 28, l: 40 };
  const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
  const n = data.length;
  if (n === 0) return null;
  const maxVal = Math.max(...data.map(d => d.val), 1);
  const pts = data.map((d, i) => ({
    x: PAD.l + (n > 1 ? (i / (n-1)) * iw : iw/2),
    y: PAD.t + ih - (d.val / maxVal) * ih,
    val: d.val, label: d.label,
  }));
  const pathD = pts.map((p, i) => `${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD = pathD + ` L${pts[pts.length-1].x.toFixed(1)},${(PAD.t+ih)} L${pts[0].x.toFixed(1)},${(PAD.t+ih)} Z`;
  const gridVals = [0, Math.round(maxVal*0.33), Math.round(maxVal*0.66), maxVal];
  const showEvery = n > 20 ? Math.ceil(n/14) : 1;
  return (
    <div style={{ overflowX:"auto", marginTop:8 }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block", minWidth:280 }}>
        <defs>
          <linearGradient id="habGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28"/>
            <stop offset="100%" stopColor={color} stopOpacity="0.03"/>
          </linearGradient>
        </defs>
        {gridVals.map((g,i) => {
          const y = g === 0 ? PAD.t+ih : PAD.t + ih - (g/maxVal)*ih;
          return (
            <g key={i}>
              <line x1={PAD.l} y1={y} x2={PAD.l+iw} y2={y} stroke="rgba(180,180,180,0.18)" strokeWidth="1"/>
              <text x={PAD.l-5} y={y+4} textAnchor="end" fontSize="9" fill="rgba(123,163,196,0.75)">{g}</text>
            </g>
          );
        })}
        <path d={areaD} fill="url(#habGrad)"/>
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={p.val > 0 ? 4 : 3} fill={p.val > 0 ? color : "rgba(180,180,180,0.5)"} stroke="white" strokeWidth="1.5"/>
            {i % showEvery === 0 && (
              <text x={p.x} y={H-4} textAnchor="middle" fontSize="9" fill="rgba(123,163,196,0.85)">{p.label}</text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Habit Grid ──────────────────────────────────────────────────────
function HabitGrid({ habits, habitLog, lang, period, onToggle, onAddHabit, onDeleteHabit, onRenameHabit }) {
  const L = LANG[lang];
  const [addingHabit, setAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitColor, setNewHabitColor] = useState("#378ADD");
  const now = new Date();
  const HABIT_COLORS = [
    "#378ADD","#1D9E75","#FF8C42","#D4537E","#7F77DD","#D4A017",
    "#E53935","#C2185B","#3949AB","#00ACC1","#7CB342","#2E7D32",
    "#9C27B0","#0288D1","#00897B","#FF5722","#F9A825","#546E7A",
    "#6D4C41","#E91E63","#7B1FA2","#37474F","#9E9D24","#FF7043",
  ];

  const getWeekDays = () => {
    const dow = (now.getDay() + 6) % 7;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - dow + i); return getDateKey(d);
    });
  };
  const getMonthDays = () => {
    const yr = now.getFullYear(), mo = now.getMonth();
    const dim = new Date(yr, mo+1, 0).getDate();
    return Array.from({ length: dim }, (_, i) =>
      `${yr}-${String(mo+1).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`
    );
  };
  const getMonthPct = (habitId, monthIdx) => {
    const yr = now.getFullYear();
    const dim = new Date(yr, monthIdx+1, 0).getDate();
    let done = 0;
    for (let d = 1; d <= dim; d++) {
      const key = `${yr}-${String(monthIdx+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      if (habitLog[key]?.[habitId]) done++;
    }
    return { done, total: dim };
  };
  const getStreak = (habitId) => {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 366; i++) {
      if (habitLog[getDateKey(d)]?.[habitId]) { streak++; d.setDate(d.getDate()-1); } else break;
    }
    return streak;
  };

  // ── Combined chart data: sum of all habits per day/week/month ──
  const getCombinedChartData = () => {
    if (period === "week") {
      return getWeekDays().map((dk, i) => ({
        val: habits.filter(h => habitLog[dk]?.[h.id]).length,
        label: L.days[i],
      }));
    }
    if (period === "month") {
      // per-day for 30 days
      return getMonthDays().map(dk => {
        const d = new Date(dk + "T12:00:00");
        return {
          val: habits.filter(h => habitLog[dk]?.[h.id]).length,
          label: String(d.getDate()),
        };
      });
    }
    // year: per month, count avg done per day * days
    return Array.from({ length: 12 }, (_, m) => {
      const totals = habits.map(h => getMonthPct(h.id, m));
      const totalDone = totals.reduce((a, t) => a + t.done, 0);
      return { val: totalDone, label: L.monthsShort[m] };
    });
  };

  const days = period === "week" ? getWeekDays() : period === "month" ? getMonthDays() : Array.from({length:12},(_,m)=>m);
  const dayLabels = period === "week"
    ? days.map((_, i) => L.days[i])
    : period === "month"
      ? days.map(k => { const d = new Date(k+"T12:00:00"); return String(d.getDate()); })
      : L.monthsShort;

  const totalDone = period !== "year"
    ? habits.reduce((s, h) => s + days.filter(dk => habitLog[dk]?.[h.id]).length, 0)
    : 0;
  const totalPossible = period !== "year" ? habits.length * days.length : 0;
  const combinedData = getCombinedChartData();
  const [chartColor, setChartColor] = useState("#378ADD");
  const CHART_COLORS = ["#378ADD","#1D9E75","#FF8C42","#D4537E","#7F77DD","#D4A017","#E53935","#00ACC1","#9C27B0","#FF5722","#7CB342","#F9A825"];

  return (
    <div style={{ background:"rgba(255,255,255,0.55)", borderRadius:20, border:"1px solid rgba(255,255,255,0.7)", backdropFilter:"none", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"16px 20px 12px", borderBottom:"1px solid rgba(255,255,255,0.5)", display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:18 }}>🔄</span>
        <span style={{ fontSize:15, fontWeight:700, color:THEME.text, flex:1 }}>{L.habits}</span>
        <span style={{ fontSize:12, color:THEME.textLight }}>{L.habitsGrid}</span>
      </div>

      <div style={{ padding:"12px 20px", overflowX:"auto" }}>
        {/* Column headers */}
        <div style={{ display:"grid", gridTemplateColumns:`180px repeat(${days.length}, 1fr)`, gap:3, marginBottom:4, minWidth: period==="month" ? 860 : "auto" }}>
          <div/>
          {dayLabels.map((l, i) => (
            <div key={i} style={{ textAlign:"center", fontSize: period==="month"?9:10, color:THEME.textLight, fontWeight:500, padding:"2px 0" }}>{l}</div>
          ))}
        </div>

        {/* Habit rows */}
        {habits.map(habit => {
          const streak = getStreak(habit.id);
          return (
            <div key={habit.id} style={{ display:"grid", gridTemplateColumns:`180px repeat(${days.length}, 1fr)`, gap:3, marginBottom:5, minWidth: period==="month" ? 860 : "auto", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, paddingRight:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:habit.color, flexShrink:0 }}/>
                <EditableTitle value={habit.names[lang]||habit.names.ru}
                  onChange={n => onRenameHabit(habit.id, {...habit.names, [lang]:n})}
                  style={{ fontSize:12, color:THEME.text, fontWeight:500, flex:1, minWidth:0, whiteSpace:"normal", wordBreak:"break-word" }}/>
                {streak > 0 && <span style={{ fontSize:10, color:habit.color, fontWeight:600, whiteSpace:"nowrap" }}>🔥{streak}</span>}
                <button onClick={() => onDeleteHabit(habit.id)} style={{ border:"none", background:"transparent", color:"#D3D1C7", cursor:"pointer", fontSize:13, padding:0, flexShrink:0 }}>×</button>
              </div>
              {days.map((dayKey, ci) => {
                if (period === "year") {
                  const { done, total } = getMonthPct(habit.id, dayKey);
                  const pct = total ? Math.round((done/total)*100) : 0;
                  return (
                    <div key={ci} style={{ aspectRatio:"1", borderRadius:5, background: pct>0 ? habit.color+Math.round(pct*2.55).toString(16).padStart(2,"0") : "rgba(255,255,255,0.4)", border:"1px solid rgba(255,255,255,0.6)", display:"flex", alignItems:"center", justifyContent:"center" }} title={`${pct}%`}>
                      <span style={{ fontSize:9, color: pct>60?"#fff":THEME.textLight }}>{pct>0?`${pct}%`:""}</span>
                    </div>
                  );
                }
                const isDone = habitLog[dayKey]?.[habit.id] || false;
                const isFuture = dayKey > TODAY;
                return (
                  <div key={ci}
                    onClick={() => !isFuture && onToggle(dayKey, habit.id)}
                    style={{
                      aspectRatio:"1", borderRadius:5, cursor: isFuture?"default":"pointer",
                      background: isDone ? habit.color : "rgba(255,255,255,0.4)",
                      border: dayKey===TODAY ? `2px solid ${habit.color}` : "1px solid rgba(255,255,255,0.6)",
                      display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s",
                    }}>
                    {isDone && <span style={{ color:"#fff", fontSize: period==="month"?8:11, fontWeight:700 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Add habit */}
        {addingHabit ? (
          <div style={{ padding:"10px 0", display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            <input autoFocus value={newHabitName} onChange={e=>setNewHabitName(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Escape")setAddingHabit(false); }}
              placeholder={L.newHabit}
              style={{ flex:1, minWidth:120, border:"1px solid rgba(255,255,255,0.7)", borderRadius:8, padding:"6px 10px", fontSize:13, fontFamily:"inherit", outline:"none", background:"rgba(255,255,255,0.6)" }}/>
            <div style={{ display:"flex", gap:5 }}>
              {HABIT_COLORS.map(c=>(
                <div key={c} onClick={()=>setNewHabitColor(c)}
                  style={{ width:20, height:20, borderRadius:"50%", background:c, cursor:"pointer", border:newHabitColor===c?"3px solid #1a1a18":"3px solid transparent", boxSizing:"border-box" }}/>
              ))}
            </div>
            <button onClick={()=>{ if(!newHabitName.trim())return; onAddHabit({id:uid(),names:{ru:newHabitName,en:newHabitName},color:newHabitColor}); setNewHabitName(""); setAddingHabit(false); }}
              style={{ padding:"5px 12px", borderRadius:8, border:"none", background:THEME.sunsetApricot, color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>{L.save}</button>
            <button onClick={()=>setAddingHabit(false)}
              style={{ padding:"5px 9px", borderRadius:8, border:"1px solid rgba(255,255,255,0.6)", background:"rgba(255,255,255,0.4)", color:THEME.textLight, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>{L.cancel}</button>
          </div>
        ) : (
          <button onClick={()=>setAddingHabit(true)}
            style={{ fontSize:12, color:THEME.textLight, background:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit", padding:"8px 0" }}>
            + {L.addHabit}
          </button>
        )}
      </div>

      {/* Combined progress chart — under all habits */}
      {habits.length > 0 && (
        <div style={{ padding:"0 20px 20px", borderTop:"1px solid rgba(255,255,255,0.4)", paddingTop:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, color:THEME.textLight, fontWeight:500 }}>
              {lang==="ru" ? "Общий прогресс привычек" : "Total habit progress"}
            </span>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {CHART_COLORS.map(c => (
                <div key={c} onClick={() => setChartColor(c)}
                  style={{ width:16, height:16, borderRadius:"50%", background:c, cursor:"pointer", border: chartColor===c ? "2.5px solid #1a1a18" : "2px solid transparent", boxSizing:"border-box", transition:"border 0.15s" }}/>
              ))}
            </div>
          </div>
          <HabitAreaChart data={combinedData} color={chartColor}/>
          {totalPossible > 0 && (
            <div style={{ fontSize:11, color:THEME.textLight, marginTop:4 }}>
              {lang==="ru"?"Выполнено":"Completed"}: {totalDone}/{totalPossible} ({Math.round(totalDone/totalPossible*100)}%)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Weather Widget ──────────────────────────────────────────────────
const CITIES = [
  { ru:"Авто (геолокация)", en:"Auto (geolocation)", id:"auto" },
  { ru:"Москва", en:"Moscow", id:"moscow", lat:55.75, lon:37.62 },
  { ru:"Санкт-Петербург", en:"St. Petersburg", id:"spb", lat:59.93, lon:30.32 },
  { ru:"Калининград", en:"Kaliningrad", id:"kaliningrad", lat:54.71, lon:20.51 },
  { ru:"Челябинск", en:"Chelyabinsk", id:"chelyabinsk", lat:55.16, lon:61.40 },
  { ru:"Новосибирск", en:"Novosibirsk", id:"novosibirsk", lat:54.99, lon:82.90 },
  { ru:"Екатеринбург", en:"Yekaterinburg", id:"ekb", lat:56.84, lon:60.60 },
  { ru:"Казань", en:"Kazan", id:"kazan", lat:55.79, lon:49.12 },
  { ru:"Краснодар", en:"Krasnodar", id:"krasnodar", lat:45.04, lon:38.98 },
  { ru:"Сочи", en:"Sochi", id:"sochi", lat:43.60, lon:39.73 },
];

const WX_ICONS = {0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",48:"🌫️",51:"🌦️",53:"🌦️",55:"🌧️",61:"🌧️",63:"🌧️",65:"🌧️",71:"🌨️",73:"🌨️",75:"❄️",80:"🌦️",81:"🌧️",82:"⛈️",95:"⛈️",96:"⛈️",99:"⛈️"};

function WeatherWidget({ lang }) {
  const [weather, setWeather] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [cityId, setCityId] = useState(() => localStorage.getItem("wx_city") || "auto");

  const fetchWeather = (lat, lon) => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
      .then(r => r.json())
      .then(d => {
        const code = d.current_weather?.weathercode;
        const temp = Math.round(d.current_weather?.temperature);
        setWeather({ temp, icon: WX_ICONS[code] || "🌡️", lat, lon });
      }).catch(() => {});
  };

  useEffect(() => {
    const city = CITIES.find(c => c.id === cityId);
    if (!city || city.id === "auto") {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
          () => fetchWeather(55.75, 37.62) // fallback Moscow
        );
      }
    } else {
      fetchWeather(city.lat, city.lon);
    }
  }, [cityId]);

  const selectCity = (id) => {
    setCityId(id);
    localStorage.setItem("wx_city", id);
    setShowPicker(false);
  };

  const city = CITIES.find(c => c.id === cityId);
  const cityName = city ? (lang === "ru" ? city.ru : city.en) : "";
  const tempStr = weather ? (weather.temp > 0 ? `+${weather.temp}` : `${weather.temp}`) + "°C" : "...";
  const wxUrl = weather ? `https://open-meteo.com/en/docs#latitude=${weather.lat}&longitude=${weather.lon}` : "#";

  return (
    <div style={{ position:"relative", display:"flex", alignItems:"center", gap:4 }}>
      <a href={wxUrl} target="_blank" rel="noopener noreferrer"
        style={{ fontSize:12, color:THEME.textLight, textDecoration:"none", display:"flex", alignItems:"center", gap:3, padding:"2px 8px", borderRadius:10, background:"rgba(255,255,255,0.4)", border:"1px solid rgba(255,255,255,0.6)", cursor:"pointer", transition:"all 0.15s" }}
        title={lang==="ru"?"Открыть погоду":"Open weather"}>
        {weather ? <>{weather.icon} <strong style={{ color:THEME.text }}>{tempStr}</strong></> : "🌡️..."}
      </a>
      <button onClick={() => setShowPicker(p => !p)}
        style={{ fontSize:11, color:THEME.textLight, background:"rgba(255,255,255,0.4)", border:"1px solid rgba(255,255,255,0.6)", borderRadius:10, padding:"2px 8px", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
        📍 {city ? (lang==="ru" ? city.ru.split(" ")[0] : city.en.split(" ")[0]) : ""}
      </button>
      {showPicker && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, zIndex:200, background:"rgba(255,255,255,0.95)", backdropFilter:"none", borderRadius:14, border:"1px solid rgba(255,255,255,0.8)", boxShadow:"0 8px 32px rgba(0,0,0,0.12)", minWidth:200, overflow:"hidden" }}>
          {CITIES.map(c => (
            <div key={c.id} onClick={() => selectCity(c.id)}
              style={{ padding:"9px 14px", fontSize:12, cursor:"pointer", color: cityId===c.id ? THEME.sunsetDeep : THEME.text, background: cityId===c.id ? "rgba(255,176,124,0.15)" : "transparent", fontWeight: cityId===c.id ? 600 : 400, transition:"background 0.1s" }}>
              {lang==="ru" ? c.ru : c.en}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Routine Label (editable) ─────────────────────────────────────────
function RoutineLabel({ task, onToggle, onChangeLabel, onChangeDays, lang }) {
  const [editing, setEditing]   = useState(false);
  const [val, setVal]           = useState(task.routineLabel || "🔄 Рутина");
  const [showDays, setShowDays] = useState(false);
  const [popupPos, setPopupPos] = useState({ top:0, left:0 });
  const daysRef = useRef(null);
  const isOn = task.routine;
  const days = lang === "ru" ? DOW_NAMES_RU : DOW_NAMES_EN;
  const selected = task.routineDays || [];
  const allDays  = selected.length === 0;

  const toggleDay = (d) => {
    let next;
    if (allDays) {
      next = [0,1,2,3,4,5,6].filter(x => x !== d);
    } else if (selected.includes(d)) {
      next = selected.filter(x => x !== d);
      if (next.length === 7) next = [];
    } else {
      next = [...selected, d];
      if (next.length === 7) next = [];
    }
    onChangeDays(next);
  };

  const daysLabel = allDays
    ? (lang==="ru" ? "каждый день" : "every day")
    : selected.sort((a,b)=>a-b).map(d => days[d]).join(", ");

  const openDays = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupPos({ top: rect.bottom + 6, left: rect.left });
    setShowDays(s => !s);
  };

  return (
    <div style={{ display:"flex", gap:2, flexShrink:0, alignItems:"center" }}>
      {/* Toggle routine on/off */}
      <button onClick={onToggle}
        style={{ fontSize:10, padding:"2px 7px", borderRadius:10,
          border:`1px solid ${isOn?"#1D9E75":"rgba(200,200,200,0.6)"}`,
          background:isOn?"rgba(230,247,244,0.8)":"rgba(255,255,255,0.4)",
          color:isOn?"#085041":THEME.textLight, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
        {task.routineLabel || (lang==="ru" ? "🔄 Рутина" : "🔄 Routine")}
      </button>

      {isOn && !editing && (
        <>
          <button ref={daysRef} onClick={openDays}
            title={lang==="ru"?"Выбрать дни":"Select days"}
            style={{ fontSize:9, padding:"2px 6px", borderRadius:8,
              border:"1px solid rgba(29,158,117,0.4)", background:"rgba(230,247,244,0.6)",
              color:"#085041", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
            {allDays ? "∞" : selected.sort((a,b)=>a-b).map(d=>days[d]).join(" ")}
          </button>
          <button onClick={()=>setEditing(true)}
            style={{ fontSize:9, padding:"1px 4px", borderRadius:6,
              border:"1px solid rgba(200,200,200,0.4)", background:"rgba(255,255,255,0.4)",
              color:THEME.textLight, cursor:"pointer", fontFamily:"inherit" }}>✏️</button>
        </>
      )}

      {isOn && editing && (
        <input autoFocus value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={() => { onChangeLabel(val); setEditing(false); }}
          onKeyDown={e => { if(e.key==="Enter"||e.key==="Escape"){ onChangeLabel(val); setEditing(false); } }}
          style={{ fontSize:10, width:90, border:"1px solid #1D9E75", borderRadius:10,
            padding:"2px 7px", fontFamily:"inherit", outline:"none", background:"rgba(230,247,244,0.9)" }}
        />
      )}

      {/* Days popup via portal */}
      {isOn && showDays && createPortal(
        <>
          <div style={{ position:"fixed", inset:0, zIndex:8000 }} onClick={()=>setShowDays(false)}/>
          <div style={{
            position:"fixed", top:popupPos.top, left:popupPos.left, zIndex:8001,
            background:"rgba(255,255,255,0.99)", borderRadius:14,
            border:"1px solid rgba(200,200,200,0.4)", boxShadow:"0 8px 32px rgba(0,0,0,0.15)",
            padding:"12px 14px", minWidth:210,
          }}>
            <div style={{ fontSize:11, color:THEME.textLight, marginBottom:8, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>
              {lang==="ru"?"Повторять в дни:":"Repeat on:"}
            </div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
              {[1,2,3,4,5,6,0].map(d => {
                const isSel = allDays || selected.includes(d);
                return (
                  <button key={d} onClick={()=>toggleDay(d)}
                    style={{ width:34, height:30, borderRadius:8,
                      border:`1.5px solid ${isSel?"#1D9E75":"rgba(200,200,200,0.5)"}`,
                      background:isSel?"rgba(230,247,244,0.9)":"rgba(255,255,255,0.5)",
                      color:isSel?"#085041":THEME.textLight, cursor:"pointer", fontFamily:"inherit",
                      fontSize:11, fontWeight:isSel?600:400, transition:"all 0.12s" }}>
                    {days[d]}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize:10, color:THEME.textLight, borderTop:"1px solid rgba(200,200,200,0.3)", paddingTop:8, marginBottom:8 }}>
              {lang==="ru"?"Выбрано:":"Selected:"} <b>{daysLabel}</b>
            </div>
            <button onClick={()=>setShowDays(false)}
              style={{ width:"100%", padding:"6px 0", borderRadius:8, border:"none",
                background:`linear-gradient(135deg,${THEME.sunsetApricot},${THEME.sunsetDeep})`,
                color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
              {lang==="ru"?"Готово":"Done"}
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// ── Backlog (collapsible, no date) ───────────────────────────────────
function BacklogPanel({ backlog, lang, onUpdate }) {
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
    const item = { id: uid(), name: newName.trim(), desc: newDesc.trim(), done: false, createdAt: TODAY };
    save({ items: [...items, item] });
    setNewName(""); setNewDesc(""); setAddingItem(false);
  };

  const toggleDone = (id) => save({ items: items.map(it => it.id===id ? {...it, done:!it.done} : it) });
  const deleteItem = (id) => save({ items: items.filter(it => it.id!==id) });
  const updateItem = (id, patch) => save({ items: items.map(it => it.id===id ? {...it,...patch} : it) });

  return (
    <div style={{ background:"rgba(255,255,255,0.55)", borderRadius:16, border:"1px solid rgba(255,255,255,0.7)", backdropFilter:"none", marginTop:16, overflow:"hidden" }}>
      {/* Header - clickable to toggle */}
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

      {/* Body */}
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
                {/* Checkbox */}
                <button onClick={()=>toggleDone(item.id)}
                  style={{ width:20,height:20,borderRadius:"50%",border:`1.5px solid ${item.done?"#1D9E75":"rgba(200,200,200,0.8)"}`,background:item.done?"#1D9E75":"rgba(255,255,255,0.6)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  {item.done&&<span style={{ color:"#fff",fontSize:10,fontWeight:700 }}>✓</span>}
                </button>
                {/* Name */}
                <div style={{ flex:1, minWidth:0 }}>
                  <EditableTitle value={item.name} onChange={v=>updateItem(item.id,{name:v})}
                    style={{ fontSize:13, color:item.done?THEME.textLight:THEME.text, textDecoration:item.done?"line-through":"none" }}/>
                </div>
                {/* Expand desc */}
                <button onClick={()=>setExpandedId(expandedId===item.id?null:item.id)}
                  style={{ fontSize:11, border:"1px solid rgba(200,200,200,0.4)", borderRadius:8, background:"rgba(255,255,255,0.4)", color:THEME.textLight, cursor:"pointer", padding:"2px 8px", fontFamily:"inherit" }}>
                  {item.desc ? "📝" : "+"}{lang==="ru"?" описание":" desc"}
                </button>
                <button onClick={()=>deleteItem(item.id)}
                  style={{ border:"none",background:"transparent",color:"#D3D1C7",cursor:"pointer",fontSize:14,padding:"0 2px",flexShrink:0 }}>×</button>
              </div>
              {/* Description / link area */}
              {expandedId===item.id && (
                <div style={{ padding:"8px 0 4px 28px" }}>
                  <textarea
                    value={item.desc||""}
                    onChange={e=>updateItem(item.id,{desc:e.target.value})}
                    placeholder={lang==="ru"?"Описание, ссылка или заметка...":"Description, link or note..."}
                    rows={3}
                    style={{ width:"100%", boxSizing:"border-box", border:"1px solid rgba(200,200,200,0.5)", borderRadius:10, padding:"8px 10px", fontSize:12, fontFamily:"inherit", background:"rgba(255,255,255,0.65)", outline:"none", resize:"vertical", color:THEME.text, lineHeight:1.5 }}
                  />
                  {/* Auto-detect links */}
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

          {/* Add item */}
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

// ── Draggable Block List ────────────────────────────────────────────
// ── Block Color Picker (inline, no portal needed) ───────────────────
function BlockColorPicker({ currentId, onChange }) {
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

function DraggableBlocks({ blocks, lang, isEditable, isStatusEditable, onUpdateBlock, onDeleteBlock, onAddTask, onDeleteTask, onSetTaskStatus, onUpdateTaskName, onToggleRoutine, onUpdateRoutineLabel, onUpdateRoutineDays, onReorder }) {
  const L = LANG[lang];
  const dragIdx = useRef(null);       // block drag
  const taskDrag = useRef(null);      // { blockId, taskIdx }
  const [dragOver, setDragOver] = useState(null);
  const [taskDragOver, setTaskDragOver] = useState(null); // { blockId, taskIdx }
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
      {/* Day progress v17 */}
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

      {/* Blocks */}
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
              {/* Block header v17 */}
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
              {/* Progress stripe v17 */}
              <div className="v17-stripe" style={{ background: "rgba(45,74,107,0.06)" }}>
                <div style={{ height:"100%", width: bp + "%", background: col.accent, transition:"width 0.5s ease" }}/>
              </div>
              {/* Tasks v17 */}
              <div className="v17-block-body">
                {block.tasks.length === 0 && <div style={{ padding:"10px 8px", fontSize:13, color:"#9AAAB8", fontStyle:"italic" }}>{L.noTasks}</div>}
                {block.tasks.map((task, taskIdx) => {
                  const s = sc[task.status];
                  const tdo = taskDragOver?.blockId===block.id && taskDragOver?.taskIdx===taskIdx;
                  const isDone = task.status === "done";
                  const isFail = task.status === "failed";
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

        {/* Add block v17 */}
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
function FullGridCalendar({ appData, lang, onSelectDay, selectedDay }) {
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
    cells.push({ key, dn: inMonth ? dn : null, p, isToday: key===TODAY, isFuture: key>TODAY, isSelected: key===selectedDay, tasks: tasks.slice(0,4), inMonth });
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i+7));

  return (
    <div style={{ background:"rgba(255,255,255,0.55)", borderRadius:16, border:"1px solid rgba(255,255,255,0.7)", backdropFilter:"none", overflow:"hidden" }}>
      {/* Month nav */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.5)" }}>
        <button onClick={()=>setVd(new Date(yr,mo-1,1))} style={{ border:"1px solid rgba(255,255,255,0.7)", borderRadius:8, background:"rgba(255,255,255,0.5)", padding:"4px 14px", cursor:"pointer", fontSize:18, color:THEME.text }}>‹</button>
        <span style={{ fontSize:16, fontWeight:700, color:THEME.text }}>{L.months[mo]} {yr}</span>
        <button onClick={()=>setVd(new Date(yr,mo+1,1))} style={{ border:"1px solid rgba(255,255,255,0.7)", borderRadius:8, background:"rgba(255,255,255,0.5)", padding:"4px 14px", cursor:"pointer", fontSize:18, color:THEME.text }}>›</button>
      </div>
      {/* Day headers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"1px solid rgba(255,255,255,0.4)" }}>
        {L.days.map(d => (
          <div key={d} style={{ padding:"8px 4px", textAlign:"center", fontSize:11, fontWeight:600, color:THEME.textLight, letterSpacing:0.5 }}>{d}</div>
        ))}
      </div>
      {/* Weeks */}
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
                {/* Day number */}
                <div style={{ marginBottom:4 }}>
                  <span style={{
                    fontSize:13, fontWeight: cell.isToday ? 700 : 400,
                    color: cell.isToday ? THEME.sunsetDeep : cell.inMonth ? THEME.text : THEME.textLight,
                    display:"inline-flex", alignItems:"center", justifyContent:"center",
                    width: cell.isToday ? 24 : "auto", height: cell.isToday ? 24 : "auto",
                    borderRadius: cell.isToday ? "50%" : 0,
                    background: cell.isToday ? THEME.sunsetApricot : "transparent",
                    color: cell.isToday ? "#fff" : cell.inMonth ? THEME.text : THEME.textLight,
                  }}>{cell.dn || ""}</span>
                </div>
                {/* Task pills */}
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
                {/* More indicator */}
                {cell.key && appData.days[cell.key]?.blocks?.flatMap(b=>b.tasks).length > 4 && (
                  <div style={{ fontSize:9, color:THEME.textLight, marginTop:2 }}>
                    +{appData.days[cell.key].blocks.flatMap(b=>b.tasks).length - 4} {lang==="ru"?"ещё":"more"}
                  </div>
                )}
                {/* Progress dot */}
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
function CalendarView({ appData, lang, selectedDay, onSelectDay }) {
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
    cells.push({ key, dn, p, isToday:key===TODAY, isFuture:key>TODAY, isSelected:key===selectedDay });
  }
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <button onClick={()=>setVd(new Date(yr,mo-1,1))} style={{ border:"1px solid rgba(255,255,255,0.7)",borderRadius:8,background:"rgba(255,255,255,0.5)",padding:"4px 14px",cursor:"pointer",fontSize:18,color:THEME.text }}>‹</button>
        <span style={{ fontSize:15,fontWeight:600,color:THEME.text }}>{L.months[mo]} {yr}</span>
        <button onClick={()=>setVd(new Date(yr,mo+1,1))} style={{ border:"1px solid rgba(255,255,255,0.7)",borderRadius:8,background:"rgba(255,255,255,0.5)",padding:"4px 14px",cursor:"pointer",fontSize:18,color:THEME.text }}>›</button>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4 }}>
        {L.days.map(d=><div key={d} style={{ textAlign:"center",fontSize:11,color:THEME.textLight,fontWeight:500,padding:"4px 0" }}>{d}</div>)}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3 }}>
        {cells.map((cell,i)=>{
          if(!cell) return <div key={i}/>;
          const bg=cell.isSelected?"#1a1a18":cell.p!==null?dayBgColor(cell.p):"rgba(255,255,255,0.4)";
          const fg=cell.isSelected?"#fff":cell.p!==null?dayFgColor(cell.p):THEME.textLight;
          return (
            <div key={cell.key} onClick={()=>onSelectDay(cell.key)}
              style={{ aspectRatio:"1",borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",background:bg,border:cell.isToday&&!cell.isSelected?`2px solid ${THEME.sunsetApricot}`:"1px solid rgba(255,255,255,0.6)",transition:"all 0.15s" }}>
              <span style={{ fontSize:12,fontWeight:cell.isToday?600:400,color:fg }}>{cell.dn}</span>
              {cell.p!==null&&!cell.isSelected&&<span style={{ fontSize:8,color:fg,opacity:0.8 }}>{cell.p}%</span>}
              {cell.isFuture&&cell.p===null&&<span style={{ fontSize:9,color:"rgba(200,200,200,0.8)" }}>＋</span>}
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

function QuickLinks({ lang }) {
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
          {/* Links list */}
          <div style={{ padding:"8px 0" }}>
            {links.map(link => (
              <div key={link.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", transition:"background 0.1s" }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,176,124,0.08)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                {/* Icon picker */}
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
          {/* Add new */}
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
          {/* Edit toggle */}
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
  "#5B9BD5","#4A90D9","#3A7BC8","#2E86AB", // Jan-Apr холодные
  "#4CAF7D","#43A868","#3D9E5A",            // May-Jul переход
  "#F4A261","#E76F51","#E63946",            // Aug-Oct теплые
  "#C1121F","#9D0208",                      // Nov-Dec горячие
];
const MONTH_NAMES_RU = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const MONTH_NAMES_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function GoalItem({ goal, period, onDelete, onSetStatus, onUpdateText, dragHandlers }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(goal.text);
  const isDone = goal.status === "done";
  const isFail = goal.status === "failed";

  return (
    <div
      draggable
      {...dragHandlers}
      style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.4)", cursor:"grab", userSelect:"none", transition:"opacity 0.15s" }}>
      {/* Drag handle */}
      <span style={{ color:"#D3D1C7", fontSize:14, paddingTop:3, flexShrink:0, cursor:"grab" }}>⠿</span>
      {/* Status buttons */}
      <div style={{ display:"flex", gap:4, flexShrink:0, paddingTop:2 }}>
        <button onClick={e=>{ e.stopPropagation(); onSetStatus(period, goal.id, isDone?"pending":"done"); }}
          title="Выполнено"
          style={{ width:22, height:22, borderRadius:"50%", border:`1.5px solid ${isDone?"#1D9E75":"rgba(200,200,200,0.6)"}`, background:isDone?"#1D9E75":"rgba(255,255,255,0.6)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {isDone && <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>✓</span>}
        </button>
        <button onClick={e=>{ e.stopPropagation(); onSetStatus(period, goal.id, isFail?"pending":"failed"); }}
          title="Провалено"
          style={{ width:22, height:22, borderRadius:"50%", border:`1.5px solid ${isFail?"#E24B4A":"rgba(200,200,200,0.6)"}`, background:isFail?"#E24B4A":"rgba(255,255,255,0.6)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {isFail && <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>✕</span>}
        </button>
      </div>
      {/* Text */}
      <div style={{ flex:1, minWidth:0 }}>
        {editing ? (
          <input autoFocus value={val} onChange={e=>setVal(e.target.value)}
            onBlur={()=>{ onUpdateText(period,goal.id,val); setEditing(false); }}
            onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Escape"){ onUpdateText(period,goal.id,val); setEditing(false); } }}
            style={{ width:"100%", boxSizing:"border-box", border:"none", borderBottom:"1.5px solid #888", background:"transparent", outline:"none", fontSize:14, fontFamily:"inherit", color:THEME.text, padding:"0 0 2px" }}/>
        ) : (
          <span onClick={()=>setEditing(true)} style={{ fontSize:14, color: isDone?THEME.textLight:isFail?"#A32D2D":THEME.text, textDecoration:isDone?"line-through":isFail?"line-through":"none", cursor:"text", lineHeight:1.5 }}>
            {goal.text}
          </span>
        )}
      </div>
      <button onClick={e=>{ e.stopPropagation(); onDelete(period, goal.id); }}
        style={{ border:"none", background:"transparent", color:"#D3D1C7", cursor:"pointer", fontSize:16, padding:"0 2px", flexShrink:0 }}>×</button>
    </div>
  );
}

function GoalsList({ goals, period, lang, onDelete, onSetStatus, onUpdateText, onReorder }) {
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

function MonthGoalsCard({ monthIdx, year, goals, lang, onAdd, onDelete, onSetStatus, onUpdateText, onReorder, compact=false }) {
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const period = `${year}-${String(monthIdx+1).padStart(2,"0")}`;
  const monthGoals = goals[period] || [];
  const color = MONTH_COLORS[monthIdx];
  const name = lang==="ru" ? MONTH_NAMES_RU[monthIdx] : MONTH_NAMES_EN[monthIdx];
  const done = monthGoals.filter(g=>g.status==="done").length;
  const pct = monthGoals.length ? Math.round(done/monthGoals.length*100) : 0;

  const addGoal = () => {
    if (!newText.trim()) return;
    onAdd(period, newText.trim());
    setNewText(""); setAdding(false);
  };

  const isPastMonth = (() => {
    const now = new Date();
    const curPeriod = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    return period < curPeriod;
  })();

  if (compact) {
    const unclosed = monthGoals.filter(g => g.status === "pending").length;
    return (
      <div style={{ background:"rgba(255,255,255,0.55)", border:`2px solid ${isPastMonth && unclosed > 0 ? "rgba(226,75,74,0.3)" : color+"30"}`, borderRadius:16, padding:"16px 18px", backdropFilter:"none", minHeight:120, position:"relative" }}>
        {/* Past month with unclosed goals badge */}
        {isPastMonth && unclosed > 0 && (
          <div style={{ position:"absolute", top:-6, right:-6, width:18, height:18, borderRadius:"50%", background:"#E24B4A", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"#fff", fontSize:10, fontWeight:700 }}>{unclosed}</span>
          </div>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:color, flexShrink:0 }}/>
          <span style={{ fontSize:13, fontWeight:600, color:THEME.text, flex:1 }}>{name}</span>
          {monthGoals.length > 0 && <span style={{ fontSize:11, color:color, fontWeight:600 }}>{pct}%</span>}
        </div>
        {monthGoals.length > 0 && (
          <div style={{ height:3, background:"rgba(255,255,255,0.5)", borderRadius:2, overflow:"hidden", marginBottom:8 }}>
            <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:2, transition:"width 0.5s" }}/>
          </div>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:8 }}>
          {monthGoals.slice(0,3).map(g => (
            <div key={g.id} style={{ display:"flex", alignItems:"center", gap:6 }}>
              {/* Allow status toggle on past months too */}
              <button onClick={()=>onSetStatus(period, g.id, g.status==="done"?"pending":"done")}
                style={{ width:12, height:12, borderRadius:"50%", flexShrink:0, border:`1.5px solid ${g.status==="done"?"#1D9E75":g.status==="failed"?"#E24B4A":color}`, background:g.status==="done"?"#1D9E75":g.status==="failed"?"#E24B4A":"transparent", cursor:"pointer", padding:0 }}/>
              <span style={{ fontSize:11, color: g.status==="done"?THEME.textLight:THEME.text, textDecoration:g.status!=="pending"?"line-through":"none", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.text}</span>
              {isPastMonth && g.status==="pending" && (
                <button onClick={()=>onSetStatus(period, g.id, "failed")}
                  title="Не выполнено"
                  style={{ width:12, height:12, borderRadius:"50%", border:"1.5px solid #E24B4A", background:"transparent", cursor:"pointer", padding:0, flexShrink:0 }}/>
              )}
            </div>
          ))}
          {monthGoals.length > 3 && <span style={{ fontSize:10, color:THEME.textLight }}>+{monthGoals.length-3} {lang==="ru"?"ещё":"more"}</span>}
        </div>
        {!isPastMonth && (
          <button onClick={()=>setAdding(a=>!a)}
            style={{ fontSize:11, color:color, background:"transparent", border:`1px dashed ${color}80`, borderRadius:8, cursor:"pointer", padding:"3px 10px", fontFamily:"inherit" }}>
            + {lang==="ru"?"цель":"goal"}
          </button>
        )}
        {adding && (
          <div style={{ marginTop:8 }}>
            <input autoFocus value={newText} onChange={e=>setNewText(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter")addGoal(); if(e.key==="Escape")setAdding(false); }}
              onBlur={()=>{ if(newText.trim())addGoal(); else setAdding(false); }}
              placeholder={lang==="ru"?"Новая цель...":"New goal..."}
              style={{ width:"100%", boxSizing:"border-box", border:"1px solid rgba(200,200,200,0.5)", borderRadius:8, padding:"5px 8px", fontSize:12, fontFamily:"inherit", outline:"none", background:"rgba(255,255,255,0.8)" }}/>
          </div>
        )}
      </div>
    );
  }

  // Full card for single month view
  return (
    <div style={{ background:"rgba(255,255,255,0.55)", border:`2px solid ${color}40`, borderRadius:20, padding:"22px 24px", backdropFilter:"none" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
        <div style={{ width:12, height:12, borderRadius:"50%", background:color }}/>
        <span style={{ fontSize:17, fontWeight:700, color:THEME.text }}>{name} {year}</span>
        {monthGoals.length > 0 && (
          <span style={{ fontSize:12, color:color, fontWeight:600, marginLeft:"auto" }}>{done}/{monthGoals.length} · {pct}%</span>
        )}
      </div>
      {monthGoals.length > 0 && (
        <div style={{ height:4, background:"rgba(255,255,255,0.5)", borderRadius:3, overflow:"hidden", marginBottom:16 }}>
          <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:3, transition:"width 0.5s" }}/>
        </div>
      )}
      <div style={{ marginBottom:8 }}>
        <GoalsList goals={monthGoals} period={period} lang={lang}
          onDelete={onDelete} onSetStatus={onSetStatus} onUpdateText={onUpdateText} onReorder={onReorder}/>
        {monthGoals.length === 0 && !adding && (
          <div style={{ fontSize:13, color:THEME.textLight, fontStyle:"italic", padding:"8px 0" }}>
            {lang==="ru"?"Добавьте цели на этот месяц":"Add goals for this month"}
          </div>
        )}
      </div>
      {adding ? (
        <div style={{ display:"flex", gap:8, marginTop:8 }}>
          <input autoFocus value={newText} onChange={e=>setNewText(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter")addGoal(); if(e.key==="Escape"){setAdding(false);setNewText("");} }}
            placeholder={lang==="ru"?"Новая цель...":"New goal..."}
            style={{ flex:1, border:"1px solid rgba(200,200,200,0.5)", borderRadius:10, padding:"7px 12px", fontSize:13, fontFamily:"inherit", outline:"none", background:"rgba(255,255,255,0.8)" }}/>
          <button onClick={addGoal}
            style={{ padding:"6px 16px", borderRadius:10, border:"none", background:color, color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
            {lang==="ru"?"Добавить":"Add"}
          </button>
          <button onClick={()=>{setAdding(false);setNewText("");}}
            style={{ padding:"6px 10px", borderRadius:10, border:"1px solid rgba(200,200,200,0.4)", background:"rgba(255,255,255,0.4)", color:THEME.textLight, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
            {lang==="ru"?"Отмена":"Cancel"}
          </button>
        </div>
      ) : (
        <button onClick={()=>setAdding(true)}
          style={{ fontSize:13, color:color, background:"transparent", border:`1px dashed ${color}80`, borderRadius:10, cursor:"pointer", padding:"6px 16px", fontFamily:"inherit", marginTop:4 }}>
          + {lang==="ru"?"Добавить цель":"Add goal"}
        </button>
      )}
    </div>
  );
}

function GoalsPanel({ mode, goalsPeriod, setGoalsPeriod, goals, lang, onAdd, onDelete, onSetStatus, onUpdateText, onReorder }) {
  const now = new Date();
  const year = now.getFullYear();
  const curMonth = now.getMonth(); // 0-indexed

  const isYearView = goalsPeriod === "year";

  // Year goals period key
  const yearKey = String(year);
  const yearGoals = goals[yearKey] || [];
  const [addingYear, setAddingYear] = useState(false);
  const [newYearText, setNewYearText] = useState("");

  const addYearGoal = () => {
    if (!newYearText.trim()) return;
    onAdd(yearKey, newYearText.trim());
    setNewYearText(""); setAddingYear(false);
  };

  return (
    <div>
      {/* Toggle: Месяц / Год */}
      <div style={{ display:"flex", gap:3, marginBottom:24, background:"rgba(255,255,255,0.35)", borderRadius:20, padding:3, width:"fit-content", backdropFilter:"none" }}>
        <button onClick={()=>setGoalsPeriod("month")}
          style={{ padding:"5px 18px", borderRadius:18, border:"none", cursor:"pointer", fontSize:12, fontWeight:500, fontFamily:"inherit", background:!isYearView?"rgba(255,255,255,0.9)":"transparent", color:!isYearView?THEME.text:THEME.textLight, transition:"all 0.2s" }}>
          {lang==="ru"?"🎯 Текущий месяц":"🎯 This month"}
        </button>
        <button onClick={()=>setGoalsPeriod("year")}
          style={{ padding:"5px 18px", borderRadius:18, border:"none", cursor:"pointer", fontSize:12, fontWeight:500, fontFamily:"inherit", background:isYearView?"rgba(255,255,255,0.9)":"transparent", color:isYearView?THEME.text:THEME.textLight, transition:"all 0.2s" }}>
          {lang==="ru"?"🏆 Весь год":"🏆 Full year"}
        </button>
      </div>

      {/* МЕСЯЦ — полный вид текущего месяца */}
      {!isYearView && (
        <MonthGoalsCard
          monthIdx={curMonth} year={year} goals={goals} lang={lang}
          onAdd={onAdd} onDelete={onDelete} onSetStatus={onSetStatus} onUpdateText={onUpdateText} onReorder={onReorder}
        />
      )}

      {/* ГОД — сетка 12 месяцев + общие цели года */}
      {isYearView && (
        <div>
          {/* Цели года */}
          <div style={{ background:"rgba(255,255,255,0.55)", border:"2px solid rgba(255,176,124,0.3)", borderRadius:20, padding:"20px 24px", backdropFilter:"none", marginBottom:24 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <span style={{ fontSize:22 }}>🏆</span>
              <span style={{ fontSize:16, fontWeight:700, color:THEME.text }}>{lang==="ru"?`Цели ${year} года`:`Goals for ${year}`}</span>
              {yearGoals.length > 0 && (
                <span style={{ fontSize:12, color:THEME.sunsetDeep, fontWeight:600, marginLeft:"auto" }}>
                  {yearGoals.filter(g=>g.status==="done").length}/{yearGoals.length}
                </span>
              )}
            </div>
            <GoalsList goals={yearGoals} period={yearKey} lang={lang}
              onDelete={onDelete} onSetStatus={onSetStatus} onUpdateText={onUpdateText} onReorder={onReorder}/>
            {yearGoals.length === 0 && !addingYear && (
              <div style={{ fontSize:13, color:THEME.textLight, fontStyle:"italic", padding:"4px 0 8px" }}>
                {lang==="ru"?"Добавьте главные цели на год":"Add your main goals for the year"}
              </div>
            )}
            {addingYear ? (
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <input autoFocus value={newYearText} onChange={e=>setNewYearText(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter")addYearGoal(); if(e.key==="Escape"){setAddingYear(false);setNewYearText("");} }}
                  placeholder={lang==="ru"?"Новая цель на год...":"New year goal..."}
                  style={{ flex:1, border:"1px solid rgba(200,200,200,0.5)", borderRadius:10, padding:"7px 12px", fontSize:13, fontFamily:"inherit", outline:"none", background:"rgba(255,255,255,0.8)" }}/>
                <button onClick={addYearGoal}
                  style={{ padding:"6px 16px", borderRadius:10, border:"none", background:THEME.sunsetApricot, color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
                  {lang==="ru"?"Добавить":"Add"}
                </button>
                <button onClick={()=>{setAddingYear(false);setNewYearText("");}}
                  style={{ padding:"6px 10px", borderRadius:10, border:"1px solid rgba(200,200,200,0.4)", background:"rgba(255,255,255,0.4)", color:THEME.textLight, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                  {lang==="ru"?"Отмена":"Cancel"}
                </button>
              </div>
            ) : (
              <button onClick={()=>setAddingYear(true)}
                style={{ fontSize:13, color:THEME.sunsetDeep, background:"transparent", border:`1px dashed rgba(255,140,66,0.5)`, borderRadius:10, cursor:"pointer", padding:"5px 14px", fontFamily:"inherit", marginTop:4 }}>
                + {lang==="ru"?"Добавить цель года":"Add year goal"}
              </button>
            )}
          </div>

          {/* Сетка 12 месяцев */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:14 }}>
            {Array.from({length:12},(_,i)=>i).map(m => (
              <MonthGoalsCard key={m}
                monthIdx={m} year={year} goals={goals} lang={lang}
                onAdd={onAdd} onDelete={onDelete} onSetStatus={onSetStatus} onUpdateText={onUpdateText} onReorder={onReorder}
                compact={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Today Dropdown Button (portal-based to avoid clipping) ──────────
function TodayDropButton({ tab, todayMode, lang, L, showTodayDrop, setShowTodayDrop, setTab, setTodayMode, setGoalsPeriod, tabStyle }) {
  const btnRef = useRef(null);
  const [rect, setRect] = useState(null);

  const handleClick = () => {
    if (tab !== "today") {
      // First click — just switch to today tab, no dropdown
      setTab("today");
      setShowTodayDrop(false);
    } else {
      // Already on today — toggle dropdown
      if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
      setShowTodayDrop(d => !d);
    }
  };

  const label = todayMode==="day" ? L.today : todayMode==="month" ? (lang==="ru"?"Месяц":"Month") : (lang==="ru"?"Год":"Year");

  return (
    <div style={{ position:"relative" }}>
      <button ref={btnRef} onClick={handleClick}
        style={{ ...tabStyle("today"), display:"flex", alignItems:"center", gap:5 }}>
        {label}
        <span style={{ fontSize:9, opacity:0.6 }}>▾</span>
      </button>
      {showTodayDrop && rect && createPortal(
        <>
          {/* Прозрачный оверлей — клик вне закрывает */}
          <div
            style={{ position:"fixed", inset:0, zIndex:9998 }}
            onClick={() => setShowTodayDrop(false)}
          />
          <div
            data-today-drop
            style={{
              position:"fixed",
              top: rect.bottom + 8,
              left: rect.left,
              zIndex:9999,
              background:"rgba(255,255,255,0.97)",
              backdropFilter:"blur(12px)",
              borderRadius:14,
              border:"1px solid rgba(255,255,255,0.8)",
              boxShadow:"0 8px 32px rgba(0,0,0,0.15)",
              minWidth:190,
            }}>
            {[
              ["day",   lang==="ru"?"📅 Сегодня":"📅 Today"],
              ["month", lang==="ru"?"🎯 Цели месяца":"🎯 Month goals"],
              ["year",  lang==="ru"?"🏆 Цели года":"🏆 Year goals"],
            ].map(([m, lbl]) => (
              <div key={m}
                onClick={() => { setTodayMode(m); setShowTodayDrop(false); if (m !== "day") setGoalsPeriod(m); }}
                style={{ padding:"11px 16px", fontSize:13, cursor:"pointer",
                  color: todayMode===m ? THEME.sunsetDeep : THEME.text,
                  background: todayMode===m ? "rgba(255,176,124,0.1)" : "transparent",
                  fontWeight: todayMode===m ? 600 : 400,
                  borderRadius: m==="day" ? "14px 14px 0 0" : m==="year" ? "0 0 14px 14px" : "0",
                  transition:"background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = todayMode===m ? "rgba(255,176,124,0.15)" : "rgba(0,0,0,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = todayMode===m ? "rgba(255,176,124,0.1)" : "transparent"}>
                {lbl}
              </div>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// Small inline button to add event from calendar
function CalAddEventBtn({ date, lang, onAdd }) {
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

function EventModal({ event, onSave, onClose, lang }) {
  const [title, setTitle]     = useState(event?.title || "");
  const [date, setDate]       = useState(event?.date || TODAY);
  const [time, setTime]       = useState(event?.time || "");
  const [desc, setDesc]       = useState(event?.desc || "");
  const [urgency, setUrgency] = useState(event?.urgency || "normal");

  const save = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), date, time, desc, urgency });
  };

  const inp = { border:"1px solid rgba(200,200,200,0.5)", borderRadius:10, padding:"8px 12px", fontSize:13, fontFamily:"inherit", outline:"none", background:"rgba(255,255,255,0.8)", width:"100%", boxSizing:"border-box" };

  return createPortal(
    <>
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.25)", zIndex:9000, backdropFilter:"none" }} onClick={onClose}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:9001, background:"rgba(255,255,255,0.97)", backdropFilter:"blur(20px)", borderRadius:24, padding:"32px 32px", width:380, boxShadow:"0 24px 80px rgba(0,0,0,0.15)", border:"1px solid rgba(255,255,255,0.9)" }}>
        <div style={{ fontSize:16, fontWeight:700, color:THEME.text, marginBottom:20 }}>
          {event ? (lang==="ru"?"Редактировать событие":"Edit event") : (lang==="ru"?"Новое событие":"New event")}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder={lang==="ru"?"Название *":"Title *"} style={inp} autoFocus/>
          <div style={{ display:"flex", gap:10 }}>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ ...inp, flex:1 }}/>
            <input type="time" value={time} onChange={e=>setTime(e.target.value)} style={{ ...inp, flex:1 }}/>
          </div>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder={lang==="ru"?"Описание (необязательно)":"Description (optional)"} rows={2}
            style={{ ...inp, resize:"none", lineHeight:1.5 }}/>
          {/* Urgency */}
          <div>
            <div style={{ fontSize:11, color:THEME.textLight, marginBottom:8, letterSpacing:0.5, textTransform:"uppercase" }}>{lang==="ru"?"Важность":"Priority"}</div>
            <div style={{ display:"flex", gap:6 }}>
              {Object.entries(URGENCY_COLORS).map(([key, val]) => (
                <button key={key} onClick={()=>setUrgency(key)}
                  style={{ flex:1, padding:"6px 0", borderRadius:10, border:`1.5px solid ${urgency===key?val.dot:"rgba(200,200,200,0.4)"}`, background:urgency===key?val.bg:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:11, fontFamily:"inherit", color:urgency===key?val.dot:THEME.textLight, fontWeight:urgency===key?600:400, transition:"all 0.15s" }}>
                  {lang==="ru"?val.label:key}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, marginTop:20 }}>
          <button onClick={save}
            style={{ flex:1, padding:"10px 0", borderRadius:12, border:"none", background:`linear-gradient(135deg,${THEME.sunsetApricot},${THEME.sunsetDeep})`, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            {lang==="ru"?"Сохранить":"Save"}
          </button>
          <button onClick={onClose}
            style={{ padding:"10px 16px", borderRadius:12, border:"1px solid rgba(200,200,200,0.4)", background:"rgba(255,255,255,0.4)", color:THEME.textLight, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            {lang==="ru"?"Отмена":"Cancel"}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

function EventsPanel({ events, lang, onAdd, onDelete, onUpdate }) {
  const [showModal, setShowModal]     = useState(false);
  const [editEvent, setEditEvent]     = useState(null);
  const [initDate, setInitDate]       = useState(null);

  // Sort: future & today first by date+time, then past
  const now = new Date();
  const todayStr = TODAY;

  const sorted = [...(events || [])]
    .filter(e => e.date >= todayStr)
    .sort((a, b) => {
      const da = a.date + (a.time ? "T"+a.time : "T23:59");
      const db = b.date + (b.time ? "T"+b.time : "T23:59");
      return da.localeCompare(db);
    });

  const formatEvtDate = (date, time) => {
    const d = new Date(date + "T12:00:00");
    const isToday = date === todayStr;
    const isTomorrow = (() => { const t = new Date(); t.setDate(t.getDate()+1); return date === localDateStr(t); })();
    const dayLabel = isToday ? (lang==="ru"?"Сегодня":"Today")
      : isTomorrow ? (lang==="ru"?"Завтра":"Tomorrow")
      : `${d.getDate()} ${["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"][d.getMonth()]}`;
    return time ? `${dayLabel}, ${time}` : dayLabel;
  };

  const daysUntil = (date) => {
    const d = new Date(date + "T12:00:00");
    const diff = Math.ceil((d - new Date(todayStr + "T12:00:00")) / 86400000);
    return diff;
  };

  const openAdd = (date) => { setInitDate(date || null); setEditEvent(null); setShowModal(true); };
  const openEdit = (evt) => { setEditEvent(evt); setInitDate(null); setShowModal(true); };

  return (
    <div style={{ width:260, flexShrink:0, position:"sticky", top:80, alignSelf:"flex-start", maxHeight:"calc(100vh - 110px)", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:600, color:THEME.text }}>
          {lang==="ru"?"📅 Предстоящие":"📅 Upcoming"}
        </span>
        <button onClick={() => openAdd(null)}
          style={{ width:26, height:26, borderRadius:"50%", border:"none", background:`linear-gradient(135deg,${THEME.sunsetApricot},${THEME.sunsetDeep})`, color:"#fff", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(255,140,66,0.4)" }}>
          +
        </button>
      </div>

      {/* Events list */}
      <div style={{ overflowY:"auto", display:"flex", flexDirection:"column", gap:8, paddingRight:4 }}>
        {sorted.length === 0 && (
          <div style={{ background:"rgba(255,255,255,0.45)", borderRadius:14, padding:"20px 16px", textAlign:"center", border:"1px solid rgba(255,255,255,0.7)" }}>
            <div style={{ fontSize:24, marginBottom:8 }}>🗓</div>
            <div style={{ fontSize:12, color:THEME.textLight, lineHeight:1.5 }}>
              {lang==="ru"?"Нет предстоящих событий\nНажмите + чтобы добавить":"No upcoming events\nPress + to add"}
            </div>
          </div>
        )}
        {sorted.map(evt => {
          const urg = URGENCY_COLORS[evt.urgency] || URGENCY_COLORS.normal;
          const days = daysUntil(evt.date);
          const isToday = days === 0;
          const isTomorrow = days === 1;
          const isUrgentSoon = days <= 2 && evt.urgency !== "normal";
          return (
            <div key={evt.id}
              style={{ background:urg.bg, border:`1px solid ${urg.border}`, borderRadius:14, padding:"11px 13px", cursor:"pointer", transition:"transform 0.1s, box-shadow 0.1s", position:"relative" }}
              onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}
              onClick={() => openEdit(evt)}>
              {/* Urgency dot */}
              <div style={{ position:"absolute", top:11, right:11, width:7, height:7, borderRadius:"50%", background:urg.dot }}/>
              {/* Days badge */}
              {(isToday || isTomorrow || isUrgentSoon) && (
                <div style={{ display:"inline-block", fontSize:9, fontWeight:700, letterSpacing:0.5, color:urg.dot, background:"rgba(255,255,255,0.6)", borderRadius:6, padding:"1px 6px", marginBottom:5, textTransform:"uppercase" }}>
                  {isToday ? (lang==="ru"?"Сегодня!":"Today!") : isTomorrow ? (lang==="ru"?"Завтра":"Tomorrow") : `${days}д`}
                </div>
              )}
              <div style={{ fontSize:13, fontWeight:600, color:THEME.text, marginBottom:3, paddingRight:14, lineHeight:1.3 }}>{evt.title}</div>
              <div style={{ fontSize:11, color:THEME.textLight }}>{formatEvtDate(evt.date, evt.time)}</div>
              {evt.desc && <div style={{ fontSize:11, color:THEME.textLight, marginTop:4, lineHeight:1.4, opacity:0.8 }}>{evt.desc}</div>}
              {/* Delete */}
              <button onClick={e=>{ e.stopPropagation(); onDelete(evt.id); }}
                style={{ position:"absolute", bottom:8, right:10, border:"none", background:"transparent", color:"rgba(150,150,150,0.6)", cursor:"pointer", fontSize:14, padding:0, lineHeight:1 }}>×</button>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <EventModal
          event={editEvent}
          lang={lang}
          onClose={() => { setShowModal(false); setEditEvent(null); }}
          onSave={(data) => {
            if (editEvent) { onUpdate(editEvent.id, data); }
            else { onAdd({ ...data, date: initDate || data.date }); }
            setShowModal(false); setEditEvent(null);
          }}
        />
      )}
    </div>
  );
}

// ── Helper: deduplicate array by id ──────────────────────────────────
function dedupeById(arr) {
  const seen = new Set();
  return arr.filter(x => { if (!x?.id || seen.has(x.id)) return false; seen.add(x.id); return true; });
}

// ── Apply new-day routine logic to any appData object ───────────────
function applyNewDay(data, today) {
  const td = today || getLocalToday();
  const last = data.lastDate;
  const todayData = data.days[td];
  const todayBlocks = todayData?.blocks || [];
  const todayHasRoutines = todayBlocks.some(b => b.tasks?.some(t => t.routine));
  const todayHasRealTasks = todayBlocks.some(b => b.tasks?.some(t => !t.routine));

  if (!last || last === td) {
    if (!todayData) {
      return { ...data, days: { ...data.days, [td]: { blocks: DEFAULT_BLOCKS() } }, lastDate: td };
    }
    return { ...data, lastDate: td };
  }

  const routineSource = findRoutineSource(data.days, td) || DEFAULT_BLOCKS();
  const routineBlocks = buildNewDay(routineSource, td);

  if (!todayData) {
    return { ...data, days: { ...data.days, [td]: { blocks: routineBlocks } }, lastDate: td };
  }
  if (todayHasRealTasks) {
    return { ...data, lastDate: td };
  }
  if (!todayHasRoutines && routineBlocks.length > 0) {
    const existingIds = new Set(todayBlocks.map(b => b.id));
    const toAdd = routineBlocks.filter(b => !existingIds.has(b.id));
    return { ...data, days: { ...data.days, [td]: { blocks: [...todayBlocks, ...toAdd] } }, lastDate: td };
  }
  return { ...data, lastDate: td };
}

// ── Pomodoro Timer ───────────────────────────────────────────────────
function PomodoroTimer({ lang }) {
  const WORK_MIN = 25, BREAK_MIN = 5;
  const [phase, setPhase]       = useState("work"); // "work" | "break"
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

  // ── Compact widget (always visible) ──
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
      {/* Phase indicator dot */}
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
      {/* Controls */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {/* Play/Pause */}
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
        {/* Reset */}
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

  // ── Floating 🍅 button ──
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

  // ── Expanded panel (opens above widget) ──
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
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#2D4A6B" }}>
            {lang === "ru" ? "Помодоро" : "Pomodoro"}
          </span>
          <span style={{ fontSize: 11, color: "#9AAAB8" }}>
            🔥 {sessions} {lang === "ru" ? "сессий" : "sessions"}
          </span>
        </div>

        {/* Ring timer */}
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

        {/* Phase dots */}
        <div style={{ display: "flex", gap: 6, margin: "10px 0 0", justifyContent: "center" }}>
          {["work", "break"].map(p => (
            <div key={p} style={{
              height: 3, flex: 1, borderRadius: 2,
              background: phase === p ? accent : "rgba(200,200,200,0.3)",
              transition: "background 0.3s",
            }}/>
          ))}
        </div>

        {/* Controls */}
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
      {widget}
      {floatBtn}
      {expandedPanel}
    </>
  );
}

// ── Main App ────────────────────────────────────────────────────────
// Мой Планер v16.1
export default function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem("planner_auth") === "1");
  const [lang, setLang] = useState("ru");
  const [appData, setAppData] = useState(loadAppData);
  const [tab, setTab] = useState("today");
  const [todayMode, setTodayMode] = useState("day"); // "day" | "month" | "year"
  const [goalsPeriod, setGoalsPeriod] = useState("month"); // for goals view: "month" | "year"
  const [showTodayDrop, setShowTodayDrop] = useState(false);
  const [habitPeriod, setHabitPeriod] = useState("week");
  const [selectedDay, setSelectedDay] = useState(TODAY);
  const [showNewDayModal, setShowNewDayModal] = useState(false);
  const [calView, setCalView] = useState("mini"); // "mini" | "grid"

  const L = LANG[lang];

  // Cloud sync state
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlinePending, setOfflinePending] = useState(false);
  const saveTimer = useRef(null);
  const isFirstLoad = useRef(true);
  const localSaveTime = useRef(null);
  const latestData = useRef(null);

  // Keep latestData ref current for async closures
  useEffect(() => { latestData.current = appData; }, [appData]);

  // Track online/offline
  useEffect(() => {
    const goOnline = async () => {
      setIsOnline(true);
      setOfflinePending(false);
      await flushOfflineQueue();
      // Re-save latest data now that we're back online
      if (latestData.current && !isFirstLoad.current) {
        const toSave = { ...latestData.current, days: compressOldDays(latestData.current.days) };
        await saveToCloud(toSave);
        setLastSync(new Date());
      }
    };
    const goOffline = () => { setIsOnline(false); };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Save to localStorage immediately; debounce cloud save 2s
  useEffect(() => {
    localStorage.setItem("dailyplanner_v3", JSON.stringify(appData));
    if (isFirstLoad.current) return;
    localSaveTime.current = new Date();
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const toSave = { ...latestData.current, days: compressOldDays(latestData.current.days) };
      if (navigator.onLine) {
        setSyncing(true);
        await saveToCloud(toSave);
        setSyncing(false);
        setLastSync(new Date());
        setOfflinePending(false);
      } else {
        enqueueOfflineSave(toSave);
        setOfflinePending(true);
      }
    }, 2000);
  }, [appData]);

  // On mount: load from cloud, merge intelligently — runs once
  useEffect(() => {
    (async () => {
      setSyncing(true);
      if (navigator.onLine) await flushOfflineQueue();
      const cloudData = navigator.onLine ? await loadFromCloud() : null;
      const today = getLocalToday();

      setAppData(local => {
        let base = local;
        if (cloudData && cloudData.lastDate) {
          const localV = local.version || 0;
          const cloudV = cloudData.version || 0;
          const localTodayBlocks = local.days[today]?.blocks || [];
          const cloudTodayBlocks = cloudData.days?.[today]?.blocks || [];
          const countReal = blocks => blocks.flatMap(b => b.tasks||[]).filter(t=>!t.routine).length;
          const localCount = countReal(localTodayBlocks);
          const cloudCount = countReal(cloudTodayBlocks);

          base = {
            ...( cloudV >= localV ? cloudData : local ),
            version: Math.max(localV, cloudV, DATA_VERSION),
            goals: { ...(cloudData.goals||{}), ...(local.goals||{}) },
            events: dedupeById([...(cloudData.events||[]), ...(local.events||[])]),
            habitLog: { ...(cloudData.habitLog||{}), ...(local.habitLog||{}) },
            days: {
              ...(cloudV >= localV ? cloudData.days : local.days),
              [today]: localCount >= cloudCount
                ? (local.days[today] || cloudData.days?.[today])
                : (cloudData.days?.[today] || local.days[today])
            }
          };
        }
        return applyNewDay(base, today);
      });

      setSyncing(false);
      setLastSync(new Date());
      setTimeout(() => { isFirstLoad.current = false; }, 600);
    })();
  }, []);

  // Poll every 90s — single GET includes updated_at, no double fetch
  useEffect(() => {
    const id = setInterval(async () => {
      if (isFirstLoad.current || !navigator.onLine || document.hidden) return;
      try {
        const rows = await sbFetch("GET");
        if (!rows?.length) return;
        const cloudUpdated = rows[0]?.updated_at;
        const localSaved = localSaveTime.current;
        if (!cloudUpdated || !localSaved) return;
        const cloudTime = new Date(cloudUpdated);
        // Only pull if cloud is newer AND we haven't saved in last 10s
        if (cloudTime > localSaved && (Date.now() - localSaved.getTime()) > 10000) {
          const cloudData = rows[0].data;
          if (!cloudData) return;
          const today = getLocalToday();
          setAppData(d => {
            const localToday = d.days[today];
            const localHasWork = localToday?.blocks?.some(b => b.tasks?.some(t=>!t.routine));
            const merged = applyNewDay({
              ...cloudData,
              goals: { ...(cloudData.goals||{}), ...(d.goals||{}) },
              events: dedupeById([...(cloudData.events||[]), ...(d.events||[])]),
              habitLog: { ...(cloudData.habitLog||{}), ...(d.habitLog||{}) },
            }, today);
            return localHasWork
              ? { ...merged, days: { ...merged.days, [today]: localToday } }
              : merged;
          });
          setLastSync(new Date());
        }
      } catch {}
    }, 90000);
    return () => clearInterval(id);
  }, []); // stable — never recreates

  // Re-check date every minute (tab open overnight)
  useEffect(() => {
    const id = setInterval(() => {
      const today = getLocalToday();
      setAppData(d => d.lastDate !== today ? applyNewDay(d, today) : d);
    }, 60000);
    return () => clearInterval(id);
  }, []);

  // Startup: apply new-day to local before cloud loads
  useEffect(() => {
    setAppData(d => applyNewDay(d, getLocalToday()));
  }, []);

  const updateDay = useCallback((dateKey, updater) => {
    setAppData(d => ({ ...d, days: { ...d.days, [dateKey]: { ...d.days[dateKey], blocks: updater(d.days[dateKey]?.blocks || []) } } }));
  }, []);

  const [previewBlocks, setPreviewBlocks] = useState(null); // future day preview — NOT saved

  const handleSelectDay = useCallback((day) => {
    setSelectedDay(day);
    const today = getLocalToday();
    if (day > today) {
      const sourceBlocks = appData.days[today]?.blocks || [];
      const preview = buildNewDay(sourceBlocks, day);
      setPreviewBlocks(preview);
    } else {
      setPreviewBlocks(null);
    }
  }, [appData]);

  // currentBlocks: for future days show preview, for others show saved data
  const today = getLocalToday();
  const isToday = selectedDay === today;
  const isFuture = selectedDay > today;
  const isPast = selectedDay < today;
  const isEditable = isToday || isFuture;
  const isStatusEditable = isPast;
  const currentBlocks = isFuture
    ? (previewBlocks ?? appData.days[selectedDay]?.blocks ?? [])
    : (appData.days[selectedDay]?.blocks || []);

  const hUpdateBlock   = useCallback((bid, patch) => updateDay(selectedDay, blocks => blocks.map(b => b.id === bid ? { ...b, ...patch } : b)), [selectedDay, updateDay]);
  const hDeleteBlock   = useCallback((bid) => updateDay(selectedDay, blocks => blocks.filter(b => b.id !== bid)), [selectedDay, updateDay]);
  const hAddTask       = useCallback((bid, task) => updateDay(selectedDay, blocks => blocks.map(b => b.id === bid ? { ...b, tasks: [...b.tasks, task] } : b)), [selectedDay, updateDay]);
  const hDeleteTask    = useCallback((bid, tid) => updateDay(selectedDay, blocks => blocks.map(b => b.id === bid ? { ...b, tasks: b.tasks.filter(t => t.id !== tid) } : b)), [selectedDay, updateDay]);
  const hSetStatus     = useCallback((bid, tid, status) => updateDay(selectedDay, blocks => blocks.map(b => b.id === bid ? { ...b, tasks: b.tasks.map(t => t.id === tid ? { ...t, status } : t) } : b)), [selectedDay, updateDay]);
  const hUpdateName    = useCallback((bid, tid, name) => updateDay(selectedDay, blocks => blocks.map(b => b.id === bid ? { ...b, tasks: b.tasks.map(t => t.id === tid ? { ...t, names: { ...t.names, [lang]: name } } : t) } : b)), [selectedDay, lang, updateDay]);
  const hToggleRoutine = useCallback((bid, tid) => {
    updateDay(selectedDay, blocks => blocks.map(b => b.id === bid ? { ...b, tasks: b.tasks.map(t => t.id === tid ? { ...t, routine: !t.routine } : t) } : b));
    // Clean up future days so they get fresh routines when arrived
    setAppData(d => {
      const futureDays = Object.keys(d.days).filter(k => k > TODAY);
      const cleaned = {};
      futureDays.forEach(k => { cleaned[k] = { blocks: [] }; });
      return { ...d, days: { ...d.days, ...cleaned } };
    });
  }, [selectedDay, updateDay]);

  const hUpdateRoutineLabel = useCallback((bid, tid, label) => updateDay(selectedDay, blocks => blocks.map(b => b.id === bid ? { ...b, tasks: b.tasks.map(t => t.id === tid ? { ...t, routineLabel: label } : t) } : b)), [selectedDay, updateDay]);

  const hUpdateRoutineDays = useCallback((bid, tid, days) => {
    updateDay(selectedDay, blocks => blocks.map(b => b.id === bid ? { ...b, tasks: b.tasks.map(t => t.id === tid ? { ...t, routineDays: days } : t) } : b));
    // Clean up future days so they get updated routine schedule
    setAppData(d => {
      const futureDays = Object.keys(d.days).filter(k => k > TODAY);
      const cleaned = {};
      futureDays.forEach(k => { cleaned[k] = { blocks: [] }; });
      return { ...d, days: { ...d.days, ...cleaned } };
    });
  }, [selectedDay, updateDay]);
  const hUpdateBacklog = useCallback((updates) => setAppData(d => ({ ...d, backlog: { ...d.backlog, ...updates } })), []);
  const hReorder = useCallback((newBlocks) => updateDay(selectedDay, () => newBlocks), [selectedDay, updateDay]);

  // Goals helpers
  const getGoals = useCallback((period) => {
    // period: "YYYY-MM" for month or "YYYY" for year
    return appData.goals?.[period] || [];
  }, [appData.goals]);

  const hAddGoal = useCallback((period, text) => {
    setAppData(d => ({
      ...d,
      goals: {
        ...d.goals,
        [period]: [...(d.goals?.[period] || []), { id: uid(), text, status: "pending" }]
      }
    }));
  }, []);

  const hDeleteGoal = useCallback((period, id) => {
    setAppData(d => ({
      ...d,
      goals: { ...d.goals, [period]: (d.goals?.[period] || []).filter(g => g.id !== id) }
    }));
  }, []);

  const hSetGoalStatus = useCallback((period, id, status) => {
    setAppData(d => ({
      ...d,
      goals: { ...d.goals, [period]: (d.goals?.[period] || []).map(g => g.id === id ? { ...g, status } : g) }
    }));
  }, []);

  const hUpdateGoalText = useCallback((period, id, text) => {
    setAppData(d => ({
      ...d,
      goals: { ...d.goals, [period]: (d.goals?.[period] || []).map(g => g.id === id ? { ...g, text } : g) }
    }));
  }, []);

  const hReorderGoals = useCallback((period, newGoals) => {
    setAppData(d => ({ ...d, goals: { ...d.goals, [period]: newGoals } }));
  }, []);

  // Habits
  const hToggleHabit = useCallback((dayKey, habitId) => {
    setAppData(d => {
      const log = { ...d.habitLog };
      if (!log[dayKey]) log[dayKey] = {};
      log[dayKey] = { ...log[dayKey], [habitId]: !log[dayKey][habitId] };
      return { ...d, habitLog: log };
    });
  }, []);
  const hAddHabit = useCallback((habit) => {
    setAppData(d => ({ ...d, habits: [...(d.habits || []), habit] }));
  }, []);
  const hDeleteHabit = useCallback((id) => {
    setAppData(d => ({ ...d, habits: (d.habits || []).filter(h => h.id !== id) }));
  }, []);
  const hRenameHabit = useCallback((id, names) => {
    setAppData(d => ({ ...d, habits: (d.habits || []).map(h => h.id === id ? { ...h, names } : h) }));
  }, []);

  // Stats
  const now = new Date();
  const todayBlocks = appData.days[TODAY]?.blocks || [];
  const todayPct = calcPct(todayBlocks);
  const weekData = (() => {
    const dow = (now.getDay() + 6) % 7;
    return L.days.map((label, i) => {
      const d = new Date(now); d.setDate(now.getDate() - dow + i);
      const b = appData.days[getDateKey(d)]?.blocks;
      return { label, pct: b ? calcPct(b) : 0 };
    });
  })();
  const monthData = (() => {
    const res = [];
    for (let w = 0; w < 4; w++) {
      let tot = 0, cnt = 0;
      for (let d = 0; d < 7; d++) {
        const day = new Date(now.getFullYear(), now.getMonth(), 1 + w * 7 + d);
        if (day.getMonth() !== now.getMonth()) continue;
        const b = appData.days[getDateKey(day)]?.blocks;
        if (b) { tot += calcPct(b); cnt++; }
      }
      res.push({ label: `${lang==="ru"?"Н":"W"}${w + 1}`, pct: cnt ? Math.round(tot / cnt) : 0 });
    }
    return res;
  })();
  const yearData = L.monthsShort.map((label, m) => {
    let tot = 0, cnt = 0;
    const days = new Date(now.getFullYear(), m + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const key = `${now.getFullYear()}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const b = appData.days[key]?.blocks;
      if (b) { tot += calcPct(b); cnt++; }
    }
    return { label, pct: cnt ? Math.round(tot / cnt) : 0 };
  });
  const wAvg = Math.round(weekData.reduce((a, d) => a + d.pct, 0) / 7);
  const mAvg = Math.round(monthData.reduce((a, d) => a + d.pct, 0) / monthData.length);
  const yAvg = Math.round(yearData.reduce((a, d) => a + d.pct, 0) / 12);

  const formatDate = (key) => {
    const d = new Date(key + "T12:00:00");
    return lang === "ru"
      ? `${d.getDate()} ${["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"][d.getMonth()]}`
      : `${L.monthsShort[d.getMonth()]} ${d.getDate()}`;
  };

  const exportData = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(appData, null, 2)], { type: "application/json" }));
    a.download = `planner-${TODAY}.json`; a.click();
  };
  const importData = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => { try { setAppData(JSON.parse(ev.target.result)); } catch {} }; r.readAsText(f);
  };

  const tabStyle = t => ({
    padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
    background: tab === t ? "rgba(255,255,255,0.9)" : "transparent",
    color: tab === t ? THEME.text : THEME.textLight,
    transition: "all 0.2s", fontFamily: "inherit",
    boxShadow: tab === t ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
  });

  // Dynamic header title
  const headerTitle = tab === "habits"
    ? (lang === "ru" ? "Мои привычки" : "My Habits")
    : tab === "calendar"
    ? (lang === "ru" ? "Мой календарь" : "My Calendar")
    : tab === "stats"
    ? (lang === "ru" ? "Моя статистика" : "My Stats")
    : L.title; // "Мой день"

  // Events handlers
  const hAddEvent = useCallback((evt) => {
    setAppData(d => ({ ...d, events: [...(d.events || []), { id: uid(), ...evt }] }));
  }, []);
  const hDeleteEvent = useCallback((id) => {
    setAppData(d => ({ ...d, events: (d.events || []).filter(e => e.id !== id) }));
  }, []);
  const hUpdateEvent = useCallback((id, patch) => {
    setAppData(d => ({ ...d, events: (d.events || []).map(e => e.id === id ? { ...e, ...patch } : e) }));
  }, []);

  if (!authed) return <PasswordScreen onUnlock={() => setAuthed(true)} />;

  return (
    <div className="animated-bg" style={{ minHeight: "100vh", fontFamily: "'DM Sans','Helvetica Neue',Arial,sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
      <style>{BG_ANIM_STYLE}</style>

      {/* New day modal */}
      {showNewDayModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.2)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"none" }}>
          <div style={{ background:"rgba(255,255,255,0.85)",backdropFilter:"blur(16px)",borderRadius:24,padding:"40px 36px",width:340,textAlign:"center",border:"1px solid rgba(255,255,255,0.8)",boxShadow:"0 16px 60px rgba(0,0,0,0.12)" }}>
            <div style={{ fontSize:40,marginBottom:12 }}>🌅</div>
            <div style={{ fontSize:18,fontWeight:700,color:THEME.text,marginBottom:8 }}>{L.newDay}</div>
            <div style={{ fontSize:13,color:THEME.textLight,marginBottom:24,lineHeight:1.6 }}>{L.newDayMsg}</div>
            <button onClick={()=>setShowNewDayModal(false)} style={{ padding:"10px 28px",borderRadius:12,border:"none",background:`linear-gradient(135deg, ${THEME.sunsetApricot}, ${THEME.sunsetDeep})`,color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px rgba(255,140,66,0.35)" }}>{L.startDay}</button>
          </div>
        </div>
      )}

      {/* Header v17 */}
      <header className="v17-header">
        <div className="v17-brand">
          <div className="v17-logo">
            <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2"/><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div className="v17-brand-title">{headerTitle}</div>
            <span className="v17-brand-date">{formatDate(TODAY)}</span>
          </div>
        </div>
        <div className="v17-weather-pill"><WeatherWidget lang={lang}/></div>
        {!isOnline && <span style={{ fontSize:11, color:"#E24B4A", fontWeight:600 }}>📵 Офлайн</span>}
        {isOnline && syncing && <span className="v17-sync-ok v17-sync-ing">☁ Синхронизация...</span>}
        {isOnline && !syncing && lastSync && <span className="v17-sync-ok">✓ Синхронизировано</span>}
        <div className="v17-actions">
          <div className="v17-lang-sw">
            {["ru","en"].map(l=>(
              <button key={l} className={lang===l?"on":""} onClick={()=>setLang(l)}>{l.toUpperCase()}</button>
            ))}
          </div>
          <QuickLinks lang={lang}/>
          <button className="v17-hbtn" onClick={exportData}>↑ {L.export}</button>
          <label className="v17-hbtn" style={{ cursor:"pointer" }}>
            ↓ {L.import}<input type="file" accept=".json" onChange={importData} style={{ display:"none" }}/>
          </label>
        </div>
      </header>

      <main style={{ maxWidth:1200,margin:"0 auto",padding:"22px 24px 80px" }}>
        {/* Tabs v17 */}
        <div className="v17-tabs">
          <TodayDropButton
            data-today-drop
            tab={tab} todayMode={todayMode} lang={lang} L={L}
            showTodayDrop={showTodayDrop}
            setShowTodayDrop={setShowTodayDrop}
            setTab={setTab}
            setTodayMode={setTodayMode}
            setGoalsPeriod={setGoalsPeriod}
            tabStyle={t => ({ padding:"8px 18px", borderRadius:30, border:"none", cursor:"pointer", fontSize:14, fontWeight:tab===t?700:600, background:tab===t?"#fff":"transparent", color:tab===t?"#2D4A6B":"#9AAAB8", transition:"all 0.16s", fontFamily:"inherit", boxShadow:tab===t?"0 3px 10px rgba(45,74,107,0.12)":"none" })}
          />
          {[["habits",L.habits],["calendar",L.calendar],["stats",L.stats]].map(([t,label])=>(
            <button key={t} className={"v17-tab"+(tab===t?" on":"")} onClick={()=>{ setTab(t); setShowTodayDrop(false); }}>{label}</button>
          ))}
        </div>

        {/* TODAY — день */}
        {tab === "today" && todayMode === "day" && (
          <div style={{ display:"flex", gap:24, alignItems:"flex-start" }}>
            <div style={{ flex:1, minWidth:0 }}>
              <DraggableBlocks
                blocks={appData.days[TODAY]?.blocks || []} lang={lang} isEditable={true}
                onUpdateBlock={hUpdateBlock} onDeleteBlock={hDeleteBlock} onAddTask={hAddTask}
                onDeleteTask={hDeleteTask} onSetTaskStatus={hSetStatus} onUpdateTaskName={hUpdateName}
                onToggleRoutine={hToggleRoutine} onUpdateRoutineLabel={hUpdateRoutineLabel} onUpdateRoutineDays={hUpdateRoutineDays} onReorder={hReorder}
              />
            </div>
            <EventsPanel
              events={appData.events || []}
              lang={lang}
              onAdd={hAddEvent}
              onDelete={hDeleteEvent}
              onUpdate={hUpdateEvent}
            />
          </div>
        )}

        {/* TODAY — цели месяца или года */}
        {tab === "today" && (todayMode === "month" || todayMode === "year") && (
          <GoalsPanel
            mode={todayMode}
            goalsPeriod={goalsPeriod}
            setGoalsPeriod={setGoalsPeriod}
            goals={appData.goals || {}}
            lang={lang}
            onAdd={hAddGoal}
            onDelete={hDeleteGoal}
            onSetStatus={hSetGoalStatus}
            onUpdateText={hUpdateGoalText}
            onReorder={hReorderGoals}
          />
        )}

        {/* HABITS */}
        {tab === "habits" && (
          <div>
            {/* Period selector */}
            <div style={{ display:"flex",gap:3,marginBottom:20,background:"rgba(255,255,255,0.35)",borderRadius:20,padding:3,width:"fit-content",backdropFilter:"none" }}>
              {[["week",L.week],["month",L.month],["year",L.year]].map(([p,label])=>(
                <button key={p} onClick={()=>setHabitPeriod(p)}
                  style={{ padding:"5px 16px",borderRadius:18,border:"none",cursor:"pointer",fontSize:12,fontWeight:500,background:habitPeriod===p?"rgba(255,255,255,0.9)":"transparent",color:habitPeriod===p?THEME.text:THEME.textLight,transition:"all 0.2s",fontFamily:"inherit" }}>
                  {label}
                </button>
              ))}
            </div>
            <HabitGrid
              habits={appData.habits || []} habitLog={appData.habitLog || {}} lang={lang} period={habitPeriod}
              onToggle={hToggleHabit} onAddHabit={hAddHabit} onDeleteHabit={hDeleteHabit} onRenameHabit={hRenameHabit}
            />
          </div>
        )}

        {/* CALENDAR */}
        {tab === "calendar" && (
          <div>
            {/* View toggle */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
              <div style={{ display:"flex", background:"rgba(255,255,255,0.35)", borderRadius:20, padding:3, gap:2, backdropFilter:"none" }}>
                <button onClick={()=>setCalView("mini")}
                  style={{ padding:"5px 16px", borderRadius:18, border:"none", cursor:"pointer", fontSize:12, fontWeight:500, fontFamily:"inherit", background:calView==="mini"?"rgba(255,255,255,0.9)":"transparent", color:calView==="mini"?THEME.text:THEME.textLight, transition:"all 0.2s" }}>
                  {lang==="ru"?"Компактный":"Compact"}
                </button>
                <button onClick={()=>setCalView("grid")}
                  style={{ padding:"5px 16px", borderRadius:18, border:"none", cursor:"pointer", fontSize:12, fontWeight:500, fontFamily:"inherit", background:calView==="grid"?"rgba(255,255,255,0.9)":"transparent", color:calView==="grid"?THEME.text:THEME.textLight, transition:"all 0.2s" }}>
                  {lang==="ru"?"Полный":"Full grid"}
                </button>
              </div>
            </div>

            {/* MINI view */}
            {calView === "mini" && (
              <div style={{ display:"grid", gridTemplateColumns:"360px 1fr", gap:20, alignItems:"start" }}>
                <div style={{ background:"rgba(255,255,255,0.55)", border:"1px solid rgba(255,255,255,0.7)", borderRadius:16, padding:22, position:"sticky", top:78, backdropFilter:"none" }}>
                  <CalendarView appData={appData} lang={lang} selectedDay={selectedDay} onSelectDay={handleSelectDay}/>
                </div>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                    <span style={{ fontSize:15, fontWeight:600, color:THEME.text }}>{formatDate(selectedDay)}</span>
                    <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:isToday?"rgba(255,245,238,0.8)":isFuture?"rgba(235,244,253,0.8)":"rgba(245,244,240,0.8)", color:isToday?THEME.sunsetDeep:isFuture?"#0C447C":THEME.textLight }}>
                      {isToday?L.todayBadge:isFuture?L.planningBadge:L.historyBadge}
                    </span>
                    {isFuture && (
                      <CalAddEventBtn date={selectedDay} lang={lang} onAdd={hAddEvent}/>
                    )}
                  </div>
                  <DraggableBlocks
                    blocks={currentBlocks} lang={lang} isEditable={isEditable} isStatusEditable={isStatusEditable}
                    onUpdateBlock={hUpdateBlock} onDeleteBlock={hDeleteBlock} onAddTask={hAddTask}
                    onDeleteTask={hDeleteTask} onSetTaskStatus={hSetStatus} onUpdateTaskName={hUpdateName}
                    onToggleRoutine={hToggleRoutine} onUpdateRoutineLabel={hUpdateRoutineLabel} onUpdateRoutineDays={hUpdateRoutineDays} onReorder={hReorder}
                  />
                  <BacklogPanel backlog={appData.backlog} lang={lang} onUpdate={hUpdateBacklog}/>
                </div>
              </div>
            )}

            {/* FULL GRID view */}
            {calView === "grid" && (
              <div>
                <FullGridCalendar appData={appData} lang={lang} selectedDay={selectedDay} onSelectDay={handleSelectDay}/>
                {/* Day detail below when a day is selected */}
                {selectedDay && (
                  <div style={{ marginTop:20 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                      <span style={{ fontSize:15, fontWeight:600, color:THEME.text }}>{formatDate(selectedDay)}</span>
                      <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:isToday?"rgba(255,245,238,0.8)":isFuture?"rgba(235,244,253,0.8)":"rgba(245,244,240,0.8)", color:isToday?THEME.sunsetDeep:isFuture?"#0C447C":THEME.textLight }}>
                        {isToday?L.todayBadge:isFuture?L.planningBadge:L.historyBadge}
                      </span>
                    </div>
                    <DraggableBlocks
                      blocks={currentBlocks} lang={lang} isEditable={isEditable} isStatusEditable={isStatusEditable}
                      onUpdateBlock={hUpdateBlock} onDeleteBlock={hDeleteBlock} onAddTask={hAddTask}
                      onDeleteTask={hDeleteTask} onSetTaskStatus={hSetStatus} onUpdateTaskName={hUpdateName}
                      onToggleRoutine={hToggleRoutine} onUpdateRoutineLabel={hUpdateRoutineLabel} onUpdateRoutineDays={hUpdateRoutineDays} onReorder={hReorder}
                    />
                    <BacklogPanel backlog={appData.backlog} lang={lang} onUpdate={hUpdateBacklog}/>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STATS */}
        {tab === "stats" && (
          <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
            <div style={{ background:"rgba(255,255,255,0.55)",border:"1px solid rgba(255,255,255,0.7)",borderRadius:16,padding:22,display:"flex",gap:28,justifyContent:"center",flexWrap:"wrap",backdropFilter:"none" }}>
              <CircleProgress pct={todayPct} size={88} color={THEME.skyBlue} label={`${todayPct}%`} sublabel={L.dayProgress}/>
              <CircleProgress pct={wAvg} size={88} color="#7F77DD" label={`${wAvg}%`} sublabel={L.weekProgress}/>
              <CircleProgress pct={mAvg} size={88} color="#1D9E75" label={`${mAvg}%`} sublabel={L.monthProgress}/>
              <CircleProgress pct={yAvg} size={88} color={THEME.sunsetApricot} label={`${yAvg}%`} sublabel={L.yearProgress}/>
            </div>
            {[[weekData,"#7F77DD",L.weekProgress],[monthData,"#1D9E75",L.monthProgress],[yearData,THEME.sunsetApricot,L.yearProgress]].map(([data,color,label])=>(
              <div key={label} style={{ background:"rgba(255,255,255,0.55)",border:"1px solid rgba(255,255,255,0.7)",borderRadius:16,padding:22,backdropFilter:"none" }}>
                <div style={{ fontSize:13,color:THEME.textLight,marginBottom:14 }}>{label}</div>
                <BarChart data={data} color={color}/>
              </div>
            ))}
            <div style={{ background:"rgba(255,255,255,0.55)",border:"1px solid rgba(255,255,255,0.7)",borderRadius:16,padding:22,backdropFilter:"none" }}>
              <div style={{ fontSize:13,color:THEME.textLight,marginBottom:14 }}>{L.byBlock}</div>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {todayBlocks.map(block=>{
                  const col = BLOCK_COLORS.find(c=>c.id===block.colorId)||BLOCK_COLORS[0];
                  const bp = calcPct([block]);
                  return (
                    <div key={block.id}>
                      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                        <span style={{ fontSize:13,color:THEME.text }}>{block.names[lang]||block.names.ru}</span>
                        <span style={{ fontSize:13,fontWeight:500,color:col.accent }}>{bp}%</span>
                      </div>
                      <div style={{ height:5,background:"rgba(255,255,255,0.4)",borderRadius:4,overflow:"hidden" }}>
                        <div style={{ height:"100%",width:`${bp}%`,background:col.accent,borderRadius:4,transition:"width 0.5s ease" }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
      <PomodoroTimer lang={lang}/>
    </div>
  );
}
// build 1780652733