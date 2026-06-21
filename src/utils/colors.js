/** Цвет фона ячейки календаря по проценту выполнения */
export function dayBgColor(p) {
  if (p === null)  return 'rgba(255,255,255,0.4)';
  if (p === 0)     return 'rgba(240,239,232,0.6)';
  if (p < 40)      return 'rgba(252,235,235,0.8)';
  if (p < 70)      return 'rgba(255,248,230,0.8)';
  if (p < 100)     return 'rgba(230,247,244,0.8)';
  return '#1D9E75';
}

/** Цвет текста ячейки календаря по проценту выполнения */
export function dayFgColor(p) {
  if (p === null || p === 0) return '#B4B2A9';
  if (p < 40)  return '#A32D2D';
  if (p < 70)  return '#7A5A00';
  if (p < 100) return '#085041';
  return '#fff';
}
