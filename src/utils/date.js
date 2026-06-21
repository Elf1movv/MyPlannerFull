/** Возвращает сегодняшнюю дату в локальном часовом поясе как YYYY-MM-DD */
export function getLocalToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Date → YYYY-MM-DD в локальном часовом поясе */
export function localDateStr(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/** Date или строка → YYYY-MM-DD */
export function getDateKey(d) {
  return d instanceof Date ? localDateStr(d) : d;
}

/** Форматирует дату для отображения */
export function formatDateLabel(key, lang, monthsShort) {
  const d = new Date(key + 'T12:00:00');
  const months = lang === 'ru'
    ? ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
    : monthsShort;
  return lang === 'ru'
    ? `${d.getDate()} ${months[d.getMonth()]}`
    : `${monthsShort[d.getMonth()]} ${d.getDate()}`;
}
