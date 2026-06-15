import { supabase } from './supabase';

/**
 * Подписывается на изменения всех таблиц пользователя через Supabase Realtime.
 * Возвращает функцию unsubscribe() для отписки.
 *
 * callbacks: {
 *   onBlocksChange(payload),
 *   onTasksChange(payload),
 *   onHabitsChange(payload),
 *   onHabitLogChange(payload),
 *   onGoalsChange(payload),
 *   onEventsChange(payload),
 * }
 */
export function subscribeToUserData(userId, callbacks) {
  const {
    onBlocksChange,
    onTasksChange,
    onHabitsChange,
    onHabitLogChange,
    onGoalsChange,
    onEventsChange,
  } = callbacks;

  const channel = supabase
    .channel(`user-data-${userId}`)

    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'blocks',
      filter: `user_id=eq.${userId}`,
    }, (payload) => onBlocksChange?.(payload))

    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'tasks',
      filter: `user_id=eq.${userId}`,
    }, (payload) => onTasksChange?.(payload))

    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'habits',
      filter: `user_id=eq.${userId}`,
    }, (payload) => onHabitsChange?.(payload))

    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'habit_log',
      filter: `user_id=eq.${userId}`,
    }, (payload) => onHabitLogChange?.(payload))

    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'goals',
      filter: `user_id=eq.${userId}`,
    }, (payload) => onGoalsChange?.(payload))

    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'events',
      filter: `user_id=eq.${userId}`,
    }, (payload) => onEventsChange?.(payload))

    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] subscribed for user', userId);
      } else if (status === 'CHANNEL_ERROR') {
        console.warn('[Realtime] channel error for user', userId);
      }
    });

  // Возвращаем функцию отписки
  return () => {
    supabase.removeChannel(channel);
  };
}
