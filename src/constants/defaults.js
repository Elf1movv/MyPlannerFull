
export const DATA_VERSION = 4;

export const DEFAULT_BLOCKS = () => ([
  {
    id: 'morning', colorId: 'amber',
    names: { ru: 'Утро', en: 'Morning' },
    pinned: false,
    tasks: [
      { id: 't1', names: { ru: 'Зарядка 20 мин', en: 'Exercise 20 min' }, status: 'pending', type: 'daily', routine: true },
      { id: 't2', names: { ru: 'Медитация', en: 'Meditation' },           status: 'pending', type: 'daily', routine: true },
    ],
  },
  {
    id: 'work', colorId: 'blue',
    names: { ru: 'Работа', en: 'Work' },
    pinned: false,
    tasks: [
      { id: 't4', names: { ru: 'Проверить почту', en: 'Check email' },  status: 'pending', type: 'daily',  routine: true  },
      { id: 't5', names: { ru: 'Написать отчёт',  en: 'Write report' }, status: 'pending', type: 'weekly', routine: false },
    ],
  },
]);

export const DEFAULT_HABITS = () => ([
  { id: 'h1', names: { ru: 'Выпить 2л воды',          en: 'Drink 2L water' },         color: '#378ADD' },
  { id: 'h2', names: { ru: 'Без соцсетей до 12:00',   en: 'No social media till noon' }, color: '#1D9E75' },
  { id: 'h3', names: { ru: 'Ранний подъём',            en: 'Early rise' },              color: '#FF8C42' },
]);
