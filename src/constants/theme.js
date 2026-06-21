export const THEME = {
  mistBlue:       '#DDF2FF',
  skyBlue:        '#BFE7FF',
  softAqua:       '#C9F0EE',
  warmCream:      '#FFF5EE',
  peachGlow:      '#FFD2B8',
  sunsetApricot:  '#FFB07C',
  sunsetDeep:     '#FF8C42',
  text:           '#2D4A6B',
  textLight:      '#7BA3C4',
};

export const BLOCK_COLORS = [
  { id: 'amber',    bg: 'rgba(255,248,230,0.85)', accent: '#D4A017', text: '#7A5A00' },
  { id: 'teal',     bg: 'rgba(230,247,244,0.85)', accent: '#1D9E75', text: '#085041' },
  { id: 'blue',     bg: 'rgba(235,244,253,0.85)', accent: '#378ADD', text: '#0C447C' },
  { id: 'pink',     bg: 'rgba(251,240,244,0.85)', accent: '#D4537E', text: '#72243E' },
  { id: 'purple',   bg: 'rgba(239,238,253,0.85)', accent: '#7F77DD', text: '#3C3489' },
  { id: 'peach',    bg: 'rgba(255,240,230,0.85)', accent: '#FF8C42', text: '#7A3A00' },
  { id: 'red',      bg: 'rgba(255,235,235,0.85)', accent: '#E53935', text: '#7A0000' },
  { id: 'crimson',  bg: 'rgba(252,232,240,0.85)', accent: '#C2185B', text: '#6A0030' },
  { id: 'indigo',   bg: 'rgba(232,234,252,0.85)', accent: '#3949AB', text: '#0D1A6E' },
  { id: 'cyan',     bg: 'rgba(224,247,252,0.85)', accent: '#00ACC1', text: '#005662' },
  { id: 'lime',     bg: 'rgba(240,252,224,0.85)', accent: '#7CB342', text: '#2E5A00' },
  { id: 'green',    bg: 'rgba(230,250,235,0.85)', accent: '#2E7D32', text: '#0A3D0C' },
  { id: 'olive',    bg: 'rgba(245,248,220,0.85)', accent: '#9E9D24', text: '#4A4800' },
  { id: 'brown',    bg: 'rgba(245,238,230,0.85)', accent: '#6D4C41', text: '#3E1F10' },
  { id: 'slate',    bg: 'rgba(235,240,245,0.85)', accent: '#546E7A', text: '#1E3640' },
  { id: 'rose',     bg: 'rgba(255,238,242,0.85)', accent: '#E91E63', text: '#7A0030' },
  { id: 'violet',   bg: 'rgba(243,232,255,0.85)', accent: '#9C27B0', text: '#4A006A' },
  { id: 'sky',      bg: 'rgba(224,242,255,0.85)', accent: '#0288D1', text: '#014B7A' },
  { id: 'mint',     bg: 'rgba(224,252,244,0.85)', accent: '#00897B', text: '#004D40' },
  { id: 'coral',    bg: 'rgba(255,236,230,0.85)', accent: '#FF5722', text: '#7A2000' },
  { id: 'gold',     bg: 'rgba(255,248,220,0.85)', accent: '#F9A825', text: '#7A5000' },
  { id: 'lavender', bg: 'rgba(243,238,255,0.85)', accent: '#7B1FA2', text: '#3A005A' },
  { id: 'gray',     bg: 'rgba(245,245,245,0.85)', accent: '#757575', text: '#333333' },
  { id: 'charcoal', bg: 'rgba(235,237,240,0.85)', accent: '#37474F', text: '#101D22' },
];

export const BG_ANIM_STYLE = `
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
  [draggable="true"] { will-change: transform; }
  @media (prefers-reduced-motion: reduce) {
    .animated-bg { animation: none; background-position: 0% 50%; }
    [style*="animation"] { animation: none !important; }
  }
`;

export const AUTH_CSS = `
  .auth-stage { position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
    background: linear-gradient(125deg,#DBEAFB 0%,#E6F5ED 30%,#FCF7E2 60%,#FDEAE0 100%);
    font-family:'DM Sans',system-ui,sans-serif; }
  .auth-card { background:#fff; border-radius:24px; padding:40px 36px; width:100%; max-width:380px;
    box-shadow:0 26px 64px rgba(58,72,98,0.16); }
  .auth-logo { width:52px; height:52px; background:#FF8C42; border-radius:16px; display:flex;
    align-items:center; justify-content:center; margin:0 auto 20px; color:#fff; font-size:24px; }
  .auth-title { font-size:26px; font-weight:700; color:#2D4A6B; text-align:center; margin:0 0 6px; }
  .auth-sub { font-size:13.5px; color:#9AAAB8; text-align:center; margin:0 0 28px; }
  .auth-tabs { display:flex; gap:3px; background:rgba(45,74,107,0.07); border-radius:30px;
    padding:3px; margin-bottom:24px; }
  .auth-tab { flex:1; padding:8px; border:0; border-radius:24px; background:transparent;
    font-size:13.5px; font-weight:600; color:#9AAAB8; cursor:pointer; font-family:inherit; transition:0.15s; }
  .auth-tab.on { background:#fff; color:#2D4A6B; box-shadow:0 2px 8px rgba(45,74,107,0.12); }
  .auth-field { width:100%; box-sizing:border-box; border:1.5px solid #E8EEF4; border-radius:12px;
    padding:12px 14px; font-size:14px; font-family:inherit; outline:none; margin-bottom:12px;
    transition:border-color 0.15s; color:#2D4A6B; }
  .auth-field:focus { border-color:#FF8C42; }
  .auth-btn { width:100%; padding:13px; border:0; border-radius:12px;
    background:linear-gradient(135deg,#FFB07C,#FF8C42); color:#fff; font-size:15px;
    font-weight:700; cursor:pointer; font-family:inherit; margin-top:4px;
    box-shadow:0 8px 20px rgba(255,140,66,0.35); transition:0.15s; }
  .auth-btn:hover { transform:translateY(-1px); box-shadow:0 12px 26px rgba(255,140,66,0.42); }
  .auth-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
  .auth-err { font-size:12.5px; color:#EE5B52; text-align:center; margin-top:8px; font-weight:500; }
  .auth-ok  { font-size:12.5px; color:#4FB07A; text-align:center; margin-top:8px; font-weight:500; }
`;
