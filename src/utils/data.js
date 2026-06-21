import { getLocalToday } from './date.js';
import { DEFAULT_BLOCKS, DEFAULT_HABITS, DATA_VERSION } from '../constants/defaults.js';

/** Генерирует уникальный ID */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Процент выполненных задач в массиве блоков */
export function calcPct(blocks) {
  const all = (blocks || []).flatMap(b => b.tasks || []);
  if (!all.length) return 0;
  return Math.round((all.filter(t => t.status === 'done').length / all.length) * 100);
}

/** Убирает дубликаты по id */
export function dedupeById(arr) {
  const seen = new Set();
  return arr.filter(x => {
    if (!x?.id || seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
}

/**
 * Строит блоки нового дня из блоков предыдущего:
 * - берёт рутинные задачи подходящего дня недели
 * - включает pinned блоки (даже без задач)
 */
export function buildNewDay(prevBlocks, dateStr) {
  const dow = dateStr
    ? new Date(dateStr + 'T12:00:00').getDay()
    : new Date().getDay();

  return prevBlocks.map(block => {
    const routineTasks = block.tasks
      .filter(t => {
        if (!t.routine) return false;
        if (!t.routineDays || t.routineDays.length === 0) return true;
        return t.routineDays.includes(dow);
      })
      .map(t => ({ ...t, id: uid(), status: 'pending' }));

    if (routineTasks.length > 0 || block.pinned) {
      return { ...block, tasks: routineTasks };
    }
    return null;
  }).filter(Boolean);
}

/**
 * Ищет последний прошлый день с рутинными задачами
 * — используется как источник для buildNewDay
 */
export function findRoutineSource(days, today) {
  const td = today || getLocalToday();
  const past = Object.keys(days)
    .filter(k => k < td && !days[k]?.compressed)
    .sort()
    .reverse();

  for (const key of past) {
    const blocks = days[key]?.blocks || [];
    if (blocks.some(b => b.tasks?.some(t => t.routine))) return blocks;
  }
  return null;
}

/**
 * Применяет логику нового дня к appData:
 * - если день сменился — переносит рутины из последнего дня с ними
 * - если сегодня уже есть реальные задачи — не трогает
 */
export function applyNewDay(data, today) {
  const td = today || getLocalToday();
  const last = data.lastDate;
  const todayData = data.days[td];
  const todayBlocks = todayData?.blocks || [];
  const todayHasRoutines  = todayBlocks.some(b => b.tasks?.some(t => t.routine));
  const todayHasRealTasks = todayBlocks.some(b => b.tasks?.some(t => !t.routine));

  // День не менялся
  if (!last || last === td) {
    if (!todayData) {
      return { ...data, days: { ...data.days, [td]: { blocks: DEFAULT_BLOCKS() } }, lastDate: td };
    }
    return { ...data, lastDate: td };
  }

  // День сменился — строим новый день из источника рутин
  const routineSource  = findRoutineSource(data.days, td) || DEFAULT_BLOCKS();
  const routineBlocks  = buildNewDay(routineSource, td);

  if (!todayData) {
    return { ...data, days: { ...data.days, [td]: { blocks: routineBlocks } }, lastDate: td };
  }

  // Сегодня уже есть реальные (не-рутинные) задачи — не трогаем
  if (todayHasRealTasks) {
    return { ...data, lastDate: td };
  }

  // Рутин ещё нет — добавляем
  if (!todayHasRoutines && routineBlocks.length > 0) {
    const existingIds = new Set(todayBlocks.map(b => b.id));
    const toAdd = routineBlocks.filter(b => !existingIds.has(b.id));
    return {
      ...data,
      days: { ...data.days, [td]: { blocks: [...todayBlocks, ...toAdd] } },
      lastDate: td,
    };
  }

  return { ...data, lastDate: td };
}

/** Загружает данные из localStorage или возвращает дефолт */
export function loadAppData() {
  const today = getLocalToday();
  try {
    const raw = localStorage.getItem('dailyplanner_v3');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.version) parsed.version = DATA_VERSION;
      return parsed;
    }
  } catch {}
  return {
    version:  DATA_VERSION,
    days:     { [today]: { blocks: DEFAULT_BLOCKS() } },
    habits:   DEFAULT_HABITS(),
    habitLog: {},
    goals:    {},
    events:   [],
    lastDate: today,
  };
}

/** Имена дней недели для DOW индекса (0=Вс) */
export const DOW_NAMES_RU = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
export const DOW_NAMES_EN = ['Su','Mo','Tu','We','Th','Fr','Sa'];
