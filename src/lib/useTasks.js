import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase.js';

// ─── Delta Calc (must match DB generated column) ───
export function calcDelta(st, lt) {
  return Math.round((st * 0.4 + lt * 0.6) * 10) / 10;
}

// ─── Date Helpers ───
export function toKey(d) {
  if (!(d instanceof Date)) return d;
  // Use local date, not UTC — avoids timezone shift where today() returns tomorrow
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function fromKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
export function today() { return toKey(new Date()); }
export function addDays(k, n) { const d = fromKey(k); d.setDate(d.getDate() + n); return toKey(d); }
export function startOfWeek(k) { const d = fromKey(k); d.setDate(d.getDate() - d.getDay() + 1); return toKey(d); }
export function fmtDate(k) { return fromKey(k).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
export function fmtMonthYear(k) { return fromKey(k).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); }
export function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
export function monthName(k) { return fromKey(k).toLocaleDateString('en-US', { month: 'long' }); }
export function shortDay(k) { return fromKey(k).toLocaleDateString('en-US', { weekday: 'short' }); }

// ─── Categories ───
export const CATS = [
  { id: 'revenue', label: 'Revenue', icon: '\u{1F4B0}', color: '#E8B931' },
  { id: 'growth', label: 'Growth', icon: '\u{1F4C8}', color: '#4CAF50' },
  { id: 'systems', label: 'Systems', icon: '\u2699\uFE0F', color: '#7B8CDE' },
  { id: 'personal', label: 'Personal', icon: '\u{1F3E0}', color: '#E07B5B' },
  { id: 'learn', label: 'Learn', icon: '\u{1F4DA}', color: '#9C6ADE' },
  { id: 'admin', label: 'Admin', icon: '\u{1F4CB}', color: '#8B9DAF' },
];
export function getCat(id) { return CATS.find(c => c.id === id) || CATS[0]; }

export const RECURRENCE_OPTIONS = [
  { id: 'none', label: 'One-time' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Every 2 weeks' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
];

// ─── Recurrence Engine ───
export function getOccurrences(task, rangeStart, rangeEnd) {
  if (!task.recurrence || task.recurrence === 'none') {
    if (task.date >= rangeStart && task.date <= rangeEnd) return [task.date];
    return [];
  }
  const dates = [];
  let cursor = task.date;
  const end = task.recurrence_end || rangeEnd;
  const finalEnd = end < rangeEnd ? end : rangeEnd;
  let safety = 0;
  while (cursor <= finalEnd && safety < 400) {
    if (cursor >= rangeStart) dates.push(cursor);
    switch (task.recurrence) {
      case 'daily': cursor = addDays(cursor, 1); break;
      case 'weekdays': {
        let next = addDays(cursor, 1);
        while (fromKey(next).getDay() === 0 || fromKey(next).getDay() === 6) next = addDays(next, 1);
        cursor = next; break;
      }
      case 'weekly': cursor = addDays(cursor, 7); break;
      case 'biweekly': cursor = addDays(cursor, 14); break;
      case 'monthly': {
        const d = fromKey(cursor); d.setMonth(d.getMonth() + 1); cursor = toKey(d); break;
      }
      case 'quarterly': {
        const d = fromKey(cursor); d.setMonth(d.getMonth() + 3); cursor = toKey(d); break;
      }
      default: cursor = addDays(cursor, 1);
    }
    safety++;
  }
  return dates;
}

// ─── Main Data Hook ───
export function useTasks(userId) {
  const [tasks, setTasks] = useState([]);
  const [completions, setCompletions] = useState({}); // { "taskId:date": true }
  const [loaded, setLoaded] = useState(false);

  // ── Load tasks + completions from Supabase ──
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      const [tasksRes, compRes] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', userId).eq('is_deleted', false).order('created_at'),
        supabase.from('completions').select('*').eq('user_id', userId),
      ]);

      if (cancelled) return;

      if (tasksRes.data) {
        // Normalize date fields to YYYY-MM-DD strings
        setTasks(tasksRes.data.map(t => ({
          ...t,
          date: t.date?.split('T')[0] || today(),
          recurrence_end: t.recurrence_end?.split('T')[0] || '',
        })));
      }

      if (compRes.data) {
        const map = {};
        compRes.data.forEach(c => {
          map[`${c.task_id}:${c.completed_date.split('T')[0]}`] = c.id;
        });
        setCompletions(map);
      }

      setLoaded(true);
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  // ── Add task ──
  const addTask = useCallback(async (taskData) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: taskData.title,
        category: taskData.category,
        st: taskData.st,
        lt: taskData.lt,
        date: taskData.date,
        duration: taskData.duration || null,
        recurrence: taskData.recurrence || 'none',
        recurrence_end: taskData.recurrence_end || null,
      })
      .select()
      .single();

    if (data) {
      setTasks(prev => [...prev, {
        ...data,
        date: data.date?.split('T')[0],
        recurrence_end: data.recurrence_end?.split('T')[0] || '',
      }]);
    }
    return { data, error };
  }, [userId]);

  // ── Update task ──
  const updateTask = useCallback(async (taskData) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: taskData.title,
        category: taskData.category,
        st: taskData.st,
        lt: taskData.lt,
        date: taskData.date,
        duration: taskData.duration || null,
        recurrence: taskData.recurrence || 'none',
        recurrence_end: taskData.recurrence_end || null,
      })
      .eq('id', taskData.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (data) {
      setTasks(prev => prev.map(t => t.id === data.id ? {
        ...data,
        date: data.date?.split('T')[0],
        recurrence_end: data.recurrence_end?.split('T')[0] || '',
      } : t));
    }
    return { data, error };
  }, [userId]);

  // ── Soft-delete task ──
  const deleteTask = useCallback(async (taskId) => {
    await supabase
      .from('tasks')
      .update({ is_deleted: true })
      .eq('id', taskId)
      .eq('user_id', userId);

    setTasks(prev => prev.filter(t => t.id !== taskId));
    // Remove related completions from local state
    setCompletions(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (k.startsWith(taskId + ':')) delete next[k];
      });
      return next;
    });
  }, [userId]);

  // ── Toggle completion ──
  const toggleComplete = useCallback(async (taskId, date) => {
    const key = `${taskId}:${date}`;
    const existing = completions[key];

    if (existing) {
      // Un-complete: delete the completion record
      await supabase.from('completions').delete().eq('id', existing);
      setCompletions(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      // Complete: find the task to get delta
      const task = tasks.find(t => t.id === taskId);
      const delta = task ? calcDelta(task.st, task.lt) : 0;

      const { data } = await supabase
        .from('completions')
        .insert({
          user_id: userId,
          task_id: taskId,
          completed_date: date,
          delta_earned: delta,
        })
        .select()
        .single();

      if (data) {
        setCompletions(prev => ({ ...prev, [key]: data.id }));
      }
    }
  }, [userId, completions, tasks]);

  // ── Check completion ──
  const isComplete = useCallback((taskId, date) => {
    return !!completions[`${taskId}:${date}`];
  }, [completions]);

  // ── Get tasks for a single date (with carry-over of unfinished past tasks) ──
  const getTasksForDate = useCallback((date) => {
    const items = [];
    const todayKey = today();
    const seen = new Set(); // prevent duplicates

    tasks.forEach(task => {
      // Normal recurrence / scheduled check for this date
      const occs = getOccurrences(task, date, date);
      let scheduledToday = false;
      if (occs.length > 0) {
        items.push({ ...task, occDate: date });
        seen.add(task.id);
        scheduledToday = true;
      }

      // Only carry forward when viewing today or future (not browsing past dates)
      if (date < todayKey) return;

      if (!task.recurrence || task.recurrence === 'none') {
        // One-time task: carry over if its date is past and it was never completed
        if (task.date < date && !completions[`${task.id}:${task.date}`] && !seen.has(task.id)) {
          items.push({ ...task, occDate: date, carriedOver: true, originalDate: task.date });
          seen.add(task.id);
        }
      } else {
        // Recurring task: carry over the most recent missed occurrence from the past
        // But skip if this task already has a scheduled occurrence for today
        if (scheduledToday) return;
        const yesterday = addDays(todayKey, -1);
        if (task.date > yesterday) return; // no past occurrences possible
        const lookback = addDays(todayKey, -30); // check up to 30 days back
        const rangeStart = task.date > lookback ? task.date : lookback;
        const pastOccs = getOccurrences(task, rangeStart, yesterday);
        // Walk backwards to find the latest incomplete occurrence
        for (let i = pastOccs.length - 1; i >= 0; i--) {
          if (!completions[`${task.id}:${pastOccs[i]}`]) {
            if (!seen.has(task.id)) {
              items.push({ ...task, occDate: date, carriedOver: true, originalDate: pastOccs[i] });
              seen.add(task.id);
            }
            break;
          }
        }
      }
    });

    return items.sort((a, b) => calcDelta(b.st, b.lt) - calcDelta(a.st, a.lt));
  }, [tasks, completions]);

  // ── Get tasks for a date range ──
  const getTasksForRange = useCallback((start, end) => {
    const items = [];
    tasks.forEach(task => {
      const occs = getOccurrences(task, start, end);
      occs.forEach(d => items.push({ ...task, occDate: d }));
    });
    return items;
  }, [tasks]);

  return {
    tasks,
    completions,
    loaded,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    isComplete,
    getTasksForDate,
    getTasksForRange,
  };
}
