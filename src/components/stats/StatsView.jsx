import React from 'react';
import { THEME, BLOCK_COLORS } from '../../constants/theme.js';
import { LANG }                from '../../constants/lang.js';
import { getLocalToday, getDateKey } from '../../utils/date.js';
import { calcPct }             from '../../utils/data.js';
import HabitAreaChart          from '../ui/HabitAreaChart.jsx';

export default function StatsView({ appData, lang }) {
  const L   = LANG[lang];
  const now = new Date();

  const todayKey    = getLocalToday();
  const todayBlocks = appData.days[todayKey]?.blocks || [];
  const todayPct    = calcPct(todayBlocks);

  const weekData = (() => {
    const dow = (now.getDay() + 6) % 7;
    return L.days.map((label, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - dow + i);
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
      res.push({ label: `${lang === 'ru' ? 'Н' : 'W'}${w + 1}`, pct: cnt ? Math.round(tot / cnt) : 0 });
    }
    return res;
  })();

  const yearData = L.monthsShort.map((label, m) => {
    let tot = 0, cnt = 0;
    const daysInMonth = new Date(now.getFullYear(), m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const b = appData.days[key]?.blocks;
      if (b) { tot += calcPct(b); cnt++; }
    }
    return { label, pct: cnt ? Math.round(tot / cnt) : 0 };
  });

  const wAvg = Math.round(weekData.reduce((a, d)  => a + d.pct, 0) / 7);
  const mAvg = Math.round(monthData.reduce((a, d) => a + d.pct, 0) / monthData.length);
  const yAvg = Math.round(yearData.reduce((a, d)  => a + d.pct, 0) / 12);

  const weekLabels  = lang === 'ru'
    ? ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
    : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const monthLabels = lang === 'ru' ? ['Н1','Н2','Н3','Н4'] : ['W1','W2','W3','W4'];
  const yearLabels  = lang === 'ru'
    ? ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']
    : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Кольца прогресса */}
      <div className="st-card">
        <div className="st-rings">
          {[
            [todayPct, L.dayProgress],
            [wAvg,     L.weekProgress],
            [mAvg,     L.monthProgress],
            [yAvg,     L.yearProgress],
          ].map(([pct, label]) => {
            const r   = 46;
            const c   = 2 * Math.PI * r;
            const off = c * (1 - pct / 100);
            return (
              <div key={label} className="st-ring">
                <svg className="st-ring-svg" viewBox="0 0 104 104">
                  <circle className="st-ring-track" cx="52" cy="52" r={r} />
                  {pct > 0 && (
                    <circle className="st-ring-fill" cx="52" cy="52" r={r}
                      strokeDasharray={c} strokeDashoffset={off} />
                  )}
                  <text className="st-ring-pct" x="52" y="52"
                    dominantBaseline="central" textAnchor="middle">{pct}%</text>
                </svg>
                <span className="st-ring-label">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Графики по периодам */}
      {[
        [weekData,  L.weekProgress,  weekLabels],
        [monthData, L.monthProgress, monthLabels],
        [yearData,  L.yearProgress,  yearLabels],
      ].map(([data, label, xlabels]) => (
        <div key={label} className="st-card">
          <p className="st-card-title">{label}</p>
          <HabitAreaChart
            data={data.map((v, i) => ({ val: v, label: xlabels[i] }))}
            color="#5B9BE8"
          />
          <div className="st-chart-xlabels">
            {xlabels.map((l, i) => <span key={i}>{l}</span>)}
          </div>
        </div>
      ))}

      {/* По блокам */}
      <div className="st-card">
        <p className="st-card-title">{L.byBlock}</p>
        {todayBlocks.map(block => {
          const col = BLOCK_COLORS.find(c => c.id === block.colorId) || BLOCK_COLORS[0];
          const bp  = calcPct([block]);
          return (
            <div key={block.id} className="st-brow">
              <span className="st-brow-name">
                <span className="st-brow-dot" style={{ background: col.accent }} />
                {block.names[lang] || block.names.ru}
              </span>
              <span className={'st-brow-pct' + (bp === 0 ? ' zero' : '')}>{bp}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
