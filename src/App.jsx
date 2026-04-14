import { useState, useCallback } from 'react';
import { useAuth } from './lib/useAuth.js';
import { useTasks, calcDelta, today, addDays, fromKey, toKey, startOfWeek, fmtDate, fmtMonthYear, daysInMonth, shortDay, getCat, CATS, RECURRENCE_OPTIONS, getOccurrences } from './lib/useTasks.js';
import AuthScreen from './components/AuthScreen.jsx';
import WeeklyReview from './components/WeeklyReview.jsx';
import LandingPage from './components/LandingPage.jsx';

/* ═══════════════════════════════════════════
   DELTA4 MVP — Supabase-backed Calendar App
   ═══════════════════════════════════════════ */

export default function App() {
  const { user, profile, loading: authLoading, signInWithMagicLink, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (authLoading) {
    return <div style={S.loadWrap}><div style={S.loadPulse}>&Delta;</div></div>;
  }

  if (!user) {
    if (showAuth) {
      return <AuthScreen onSignIn={signInWithMagicLink} onBack={() => setShowAuth(false)} />;
    }
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  return <Delta4App userId={user.id} profile={profile} onSignOut={signOut} />;
}

// ─── Main App (post-auth) ───
function Delta4App({ userId, profile, onSignOut }) {
  const {
    tasks, completions, loaded,
    addTask, updateTask, deleteTask, toggleComplete, isComplete,
    getTasksForDate, getTasksForRange,
  } = useTasks(userId);

  const [view, setView] = useState('day');
  const [focusDate, setFocusDate] = useState(today());
  const [editTask, setEditTask] = useState(null);
  const [editDate, setEditDate] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const openEditor = (task, date) => {
    setEditTask(task || null);
    setEditDate(date || focusDate);
    setView('edit');
  };

  const handleSaveTask = async (taskData) => {
    if (editTask) {
      await updateTask({ ...taskData, id: editTask.id });
    } else {
      await addTask(taskData);
    }
    setView('day');
    setEditTask(null);
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTask(taskId);
    setView('day');
    setEditTask(null);
  };

  if (!loaded) {
    return <div style={S.loadWrap}><div style={S.loadPulse}>&Delta;</div></div>;
  }

  const nav = { view, setView, focusDate, setFocusDate };

  return (
    <div style={S.root}>
      <div style={S.shell}>
        <Header
          nav={nav}
          onAdd={() => openEditor(null, focusDate)}
          profile={profile}
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          onSignOut={onSignOut}
        />

        {view === 'day' && (
          <DayView
            date={focusDate}
            tasks={getTasksForDate(focusDate)}
            isComplete={isComplete}
            onToggle={toggleComplete}
            onEdit={(t) => openEditor(t)}
            onAdd={() => openEditor(null, focusDate)}
            setFocusDate={setFocusDate}
          />
        )}
        {view === 'week' && (
          <WeekView
            date={focusDate}
            getTasksForDate={getTasksForDate}
            isComplete={isComplete}
            onToggle={toggleComplete}
            onDayClick={(d) => { setFocusDate(d); setView('day'); }}
            onAdd={(d) => openEditor(null, d)}
          />
        )}
        {view === 'month' && (
          <MonthView
            date={focusDate}
            getTasksForDate={getTasksForDate}
            isComplete={isComplete}
            onDayClick={(d) => { setFocusDate(d); setView('day'); }}
            setFocusDate={setFocusDate}
          />
        )}
        {view === 'year' && (
          <YearView
            date={focusDate}
            tasks={tasks}
            completions={completions}
            getTasksForRange={getTasksForRange}
            isComplete={isComplete}
            onMonthClick={(d) => { setFocusDate(d); setView('month'); }}
            setFocusDate={setFocusDate}
          />
        )}
        {view === 'edit' && (
          <TaskEditor
            task={editTask}
            defaultDate={editDate || focusDate}
            onSave={handleSaveTask}
            onCancel={() => { setView('day'); setEditTask(null); }}
            onDelete={editTask ? () => handleDeleteTask(editTask.id) : null}
          />
        )}
        {view === 'analytics' && (
          <AnalyticsView
            tasks={tasks}
            completions={completions}
            getTasksForRange={getTasksForRange}
            isComplete={isComplete}
            onBack={() => setView('day')}
          />
        )}
        {view === 'weekly-review' && (
          <WeeklyReview
            tasks={tasks}
            completions={completions}
            getTasksForRange={getTasksForRange}
            isComplete={isComplete}
            onBack={() => setView('day')}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// HEADER + NAV
// ═══════════════════════════════════════════
function Header({ nav, onAdd, profile, showMenu, setShowMenu, onSignOut }) {
  const { view, setView, focusDate, setFocusDate } = nav;
  const views = ['day', 'week', 'month', 'year'];
  const isCalView = views.includes(view);

  const goToday = () => setFocusDate(today());
  const goPrev = () => {
    if (view === 'day') setFocusDate(addDays(focusDate, -1));
    else if (view === 'week') setFocusDate(addDays(focusDate, -7));
    else if (view === 'month') { const d = fromKey(focusDate); d.setMonth(d.getMonth() - 1); setFocusDate(toKey(d)); }
    else if (view === 'year') { const d = fromKey(focusDate); d.setFullYear(d.getFullYear() - 1); setFocusDate(toKey(d)); }
  };
  const goNext = () => {
    if (view === 'day') setFocusDate(addDays(focusDate, 1));
    else if (view === 'week') setFocusDate(addDays(focusDate, 7));
    else if (view === 'month') { const d = fromKey(focusDate); d.setMonth(d.getMonth() + 1); setFocusDate(toKey(d)); }
    else if (view === 'year') { const d = fromKey(focusDate); d.setFullYear(d.getFullYear() + 1); setFocusDate(toKey(d)); }
  };

  let title = '';
  if (view === 'day') title = fmtDate(focusDate);
  else if (view === 'week') title = `Week of ${fmtDate(startOfWeek(focusDate))}`;
  else if (view === 'month') title = fmtMonthYear(focusDate);
  else if (view === 'year') title = fromKey(focusDate).getFullYear().toString();

  return (
    <div style={S.headerWrap}>
      <div style={S.headerTop}>
        <div style={S.logoRow}>
          <span style={S.logoMark}>&Delta;</span>
          <span style={S.logoText}>Delta4</span>
        </div>
        <div style={S.headerActions}>
          <button onClick={() => setView('weekly-review')} style={S.iconBtn} title="Weekly Review">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button onClick={() => setView('analytics')} style={S.iconBtn} title="Analytics">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="10" width="3" height="8" rx="1" fill="currentColor" opacity=".4" />
              <rect x="7" y="6" width="3" height="12" rx="1" fill="currentColor" opacity=".6" />
              <rect x="12" y="3" width="3" height="15" rx="1" fill="currentColor" opacity=".8" />
              <rect x="17" y="1" width="3" height="17" rx="1" fill="currentColor" />
            </svg>
          </button>
          <button onClick={onAdd} style={S.addBtn}>+ New</button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowMenu(!showMenu)} style={S.avatarBtn}>
              {(profile?.display_name || '?')[0].toUpperCase()}
            </button>
            {showMenu && (
              <div style={S.menuDrop}>
                <div style={S.menuEmail}>{profile?.email}</div>
                <button onClick={onSignOut} style={S.menuItem}>Sign out</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isCalView && (
        <>
          <div style={S.viewTabs}>
            {views.map(v => (
              <button key={v} onClick={() => setView(v)} style={{ ...S.viewTab, ...(view === v ? S.viewTabActive : {}) }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <div style={S.navRow}>
            <button onClick={goPrev} style={S.navArrow}>&lsaquo;</button>
            <button onClick={goToday} style={S.todayBtn}>Today</button>
            <span style={S.navTitle}>{title}</span>
            <button onClick={goNext} style={S.navArrow}>&rsaquo;</button>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// DAY VIEW
// ═══════════════════════════════════════════
function DayView({ date, tasks, isComplete, onToggle, onEdit, onAdd, setFocusDate }) {
  // For carried-over tasks, use their original date as the completion key
  const compDate = (t) => t.carriedOver ? t.originalDate : date;
  const active = tasks.filter(t => !isComplete(t.id, compDate(t)));
  const completed = tasks.filter(t => isComplete(t.id, compDate(t)));
  const pendingDelta = Math.round(active.reduce((s, t) => s + calcDelta(t.st, t.lt), 0) * 10) / 10;
  const earnedDelta = Math.round(completed.reduce((s, t) => s + calcDelta(t.st, t.lt), 0) * 10) / 10;

  return (
    <div style={S.viewPad}>
      <div style={S.scoreStrip}>
        <div style={S.scoreCol}>
          <div style={S.scoreNum}>{pendingDelta}</div>
          <div style={S.scoreLbl}>Pending &Delta;</div>
        </div>
        <div style={S.scoreDivider} />
        <div style={S.scoreCol}>
          <div style={{ ...S.scoreNum, color: '#4CAF50' }}>{earnedDelta}</div>
          <div style={S.scoreLbl}>Earned &Delta;</div>
        </div>
        <div style={S.scoreDivider} />
        <div style={S.scoreCol}>
          <div style={S.scoreNum}>{tasks.length}</div>
          <div style={S.scoreLbl}>Tasks</div>
        </div>
      </div>

      {active.length === 0 && completed.length === 0 ? (
        <div style={S.empty}>
          <div style={S.emptyIcon}>&Delta;</div>
          <div style={S.emptyTitle}>No tasks for this day</div>
          <div style={S.emptySub}>Add your first high-delta task.</div>
          <button onClick={onAdd} style={S.emptyBtn}>+ Add Task</button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <div style={S.sectionHead}>
                <span style={S.sectionLabel}>To Do</span>
                <span style={S.badge}>{active.length}</span>
              </div>
              {active.map(task => (
                <TaskRow key={task.id + compDate(task)} task={task} date={compDate(task)} done={false} onToggle={onToggle} onEdit={onEdit} />
              ))}
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <div style={S.sectionHead}>
                <span style={S.sectionLabel}>Completed</span>
                <span style={S.badge}>{completed.length}</span>
              </div>
              {completed.map(task => (
                <TaskRow key={task.id + compDate(task)} task={task} date={compDate(task)} done={true} onToggle={onToggle} onEdit={onEdit} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// TASK ROW
// ═══════════════════════════════════════════
function TaskRow({ task, date, done, onToggle, onEdit }) {
  const delta = calcDelta(task.st, task.lt);
  const cat = getCat(task.category);
  const isHigh = delta >= 7;
  const isMed = delta >= 4;

  return (
    <div style={{ ...S.taskRow, opacity: done ? 0.5 : 1, borderLeft: `3px solid ${isHigh ? '#E8B931' : isMed ? '#7B8CDE' : '#21262D'}` }}>
      <div
        onClick={() => onToggle(task.id, date)}
        style={{ ...S.check, background: done ? '#4CAF50' : 'transparent', borderColor: done ? '#4CAF50' : '#3a3f4a' }}
      >
        {done ? '\u2713' : ''}
      </div>
      <div style={S.taskBody} onClick={() => onEdit(task)}>
        <div style={{ ...S.taskTitleRow, textDecoration: done ? 'line-through' : 'none', fontSize: '14px', fontWeight: 500 }}>{task.title}</div>
        <div style={S.taskMetaRow}>
          <span style={{ ...S.catPill, background: cat.color + '22', color: cat.color }}>{cat.icon} {cat.label}</span>
          {task.recurrence && task.recurrence !== 'none' && <span style={S.recurPill}>{task.recurrence}</span>}
          {task.duration && <span style={S.durPill}>{task.duration}m</span>}
          {task.carriedOver && <span style={S.carryPill}>from {fmtDate(task.originalDate)}</span>}
        </div>
      </div>
      <div style={{
        ...S.deltaPill,
        background: isHigh ? 'linear-gradient(135deg, #E8B931, #D4A017)' : isMed ? 'linear-gradient(135deg, #7B8CDE, #5A6BBE)' : '#1C2333',
        color: isHigh || isMed ? '#fff' : '#8B9DAF',
      }}>
        &Delta;{delta}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// WEEK VIEW
// ═══════════════════════════════════════════
function WeekView({ date, getTasksForDate, isComplete, onToggle, onDayClick, onAdd }) {
  const ws = startOfWeek(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const t = today();

  return (
    <div style={S.viewPad}>
      {days.map(d => {
        const tasks = getTasksForDate(d);
        const completed = tasks.filter(t => isComplete(t.id, d));
        const delta = Math.round(tasks.reduce((s, t) => s + calcDelta(t.st, t.lt), 0) * 10) / 10;
        const earned = Math.round(completed.reduce((s, t) => s + calcDelta(t.st, t.lt), 0) * 10) / 10;
        const isToday = d === t;

        return (
          <div key={d} style={{ ...S.weekDay, ...(isToday ? S.weekDayToday : {}) }}>
            <div style={S.weekDayHeader} onClick={() => onDayClick(d)}>
              <div style={S.weekDayLeft}>
                <span style={{ ...S.weekDayName, color: isToday ? '#E8B931' : '#8B9DAF' }}>{shortDay(d)}</span>
                <span style={{ ...S.weekDayNum, color: isToday ? '#E8B931' : '#E6EDF3' }}>{fromKey(d).getDate()}</span>
              </div>
              <div style={S.weekDayRight}>
                {earned > 0 && <span style={S.weekDoneDelta}>&check;{earned}</span>}
                <span style={S.weekDelta}>&Delta;{delta}</span>
                <span style={S.weekTaskCount}>{tasks.length} tasks</span>
              </div>
            </div>
            {tasks.slice(0, 3).map(task => {
              const cat = getCat(task.category);
              const done = isComplete(task.id, d);
              return (
                <div key={task.id} style={{ ...S.weekTaskPill, opacity: done ? 0.4 : 1 }} onClick={() => onDayClick(d)}>
                  <div style={{ ...S.weekTaskDot, background: cat.color }} />
                  <span style={S.weekTaskText}>{task.title}</span>
                  <span style={S.weekTaskDelta}>&Delta;{calcDelta(task.st, task.lt)}</span>
                </div>
              );
            })}
            {tasks.length > 3 && <div style={S.weekMore}>+{tasks.length - 3} more</div>}
            <button onClick={() => onAdd(d)} style={S.weekAddBtn}>+</button>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
// MONTH VIEW
// ═══════════════════════════════════════════
function MonthView({ date, getTasksForDate, isComplete, onDayClick, setFocusDate }) {
  const d = fromKey(date);
  const year = d.getFullYear();
  const month = d.getMonth();
  const numDays = daysInMonth(year, month);
  const firstDow = new Date(year, month, 1).getDay();
  const t = today();
  const dows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let i = 1; i <= numDays; i++) cells.push(i);

  return (
    <div style={S.viewPad}>
      <div style={S.monthGrid}>
        {dows.map(dw => <div key={dw} style={S.monthDow}>{dw}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} style={S.monthCell} />;
          const dk = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const tasks = getTasksForDate(dk);
          const done = tasks.filter(t => isComplete(t.id, dk));
          const isToday = dk === t;
          return (
            <div key={dk} onClick={() => onDayClick(dk)} style={{
              ...S.monthCell, ...S.monthCellActive,
              background: isToday ? '#E8B93110' : tasks.length > 0 ? '#161B22' : 'transparent',
              border: isToday ? '1px solid #E8B93144' : '1px solid transparent',
            }}>
              <div style={{ ...S.monthCellNum, color: isToday ? '#E8B931' : '#E6EDF3' }}>{day}</div>
              {tasks.length > 0 && (
                <div style={S.monthDots}>
                  {tasks.slice(0, 4).map((t, j) => (
                    <div key={j} style={{ ...S.monthDot, background: getCat(t.category).color, opacity: isComplete(t.id, dk) ? 0.3 : 1 }} />
                  ))}
                </div>
              )}
              {done.length > 0 && done.length === tasks.length && <div style={S.monthCheck}>&check;</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// YEAR VIEW
// ═══════════════════════════════════════════
function YearView({ date, tasks, completions, getTasksForRange, isComplete, onMonthClick, setFocusDate }) {
  const year = fromKey(date).getFullYear();
  const t = today();

  const months = Array.from({ length: 12 }, (_, i) => {
    const start = `${year}-${String(i + 1).padStart(2, '0')}-01`;
    const end = `${year}-${String(i + 1).padStart(2, '0')}-${String(daysInMonth(year, i)).padStart(2, '0')}`;
    const monthTasks = getTasksForRange(start, end);
    const done = monthTasks.filter(t => isComplete(t.id, t.occDate));
    const delta = monthTasks.reduce((s, t) => s + calcDelta(t.st, t.lt), 0);
    const earned = done.reduce((s, t) => s + calcDelta(t.st, t.lt), 0);
    const isCurrent = fromKey(t).getFullYear() === year && fromKey(t).getMonth() === i;
    return { month: i, start, name: new Date(year, i).toLocaleDateString('en-US', { month: 'short' }), delta, earned, tasks: monthTasks.length, done: done.length, isCurrent };
  });

  const maxDelta = Math.max(...months.map(m => m.delta), 1);
  const totalEarned = Math.round(months.reduce((s, m) => s + m.earned, 0));
  const totalTasks = months.reduce((s, m) => s + m.tasks, 0);
  const totalDone = months.reduce((s, m) => s + m.done, 0);

  return (
    <div style={S.viewPad}>
      <div style={S.scoreStrip}>
        <div style={S.scoreCol}>
          <div style={S.scoreNum}>{totalEarned}</div>
          <div style={S.scoreLbl}>&Delta; Earned ({year})</div>
        </div>
        <div style={S.scoreDivider} />
        <div style={S.scoreCol}>
          <div style={{ ...S.scoreNum, color: '#4CAF50' }}>{totalDone}/{totalTasks}</div>
          <div style={S.scoreLbl}>Completed</div>
        </div>
      </div>
      <div style={S.yearGrid}>
        {months.map(m => (
          <div key={m.month} onClick={() => onMonthClick(m.start)} style={{ ...S.yearCard, ...(m.isCurrent ? S.yearCardCurrent : {}) }}>
            <div style={S.yearMonth}>{m.name}</div>
            <div style={S.yearBar}>
              <div style={{ ...S.yearBarTrack, height: '50px' }}>
                <div style={{ ...S.yearBarFill, height: `${(m.delta / maxDelta) * 100}%` }} />
              </div>
            </div>
            <div style={S.yearDelta}>&Delta;{Math.round(m.earned)}</div>
            {m.tasks > 0 && <div style={S.yearRate}>{Math.round((m.done / m.tasks) * 100)}%</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// TASK EDITOR
// ═══════════════════════════════════════════
function TaskEditor({ task, defaultDate, onSave, onCancel, onDelete }) {
  const isEdit = !!task;
  const [title, setTitle] = useState(task?.title || '');
  const [category, setCategory] = useState(task?.category || 'revenue');
  const [st, setSt] = useState(task?.st || 5);
  const [lt, setLt] = useState(task?.lt || 5);
  const [duration, setDuration] = useState(task?.duration?.toString() || '');
  const [date, setDate] = useState(task?.date || defaultDate);
  const [recurrence, setRecurrence] = useState(task?.recurrence || 'none');
  const [recurrenceEnd, setRecurrenceEnd] = useState(task?.recurrence_end || '');

  const delta = calcDelta(st, lt);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      category,
      st,
      lt,
      date,
      duration: duration ? parseInt(duration) : null,
      recurrence,
      recurrence_end: recurrenceEnd || null,
    });
  };

  return (
    <div style={S.editor}>
      <div style={S.editorHead}>
        <button onClick={onCancel} style={S.backBtn}>&larr; Back</button>
        <span style={S.editorTitle}>{isEdit ? 'Edit Task' : 'New Task'}</span>
        {onDelete && <button onClick={onDelete} style={S.delBtn}>Delete</button>}
      </div>

      <div style={S.deltaPreview}>
        <div style={S.deltaLbl}>Delta Score</div>
        <div style={{ ...S.deltaVal, color: delta >= 7 ? '#E8B931' : delta >= 4 ? '#7B8CDE' : '#8B9DAF' }}>&Delta;{delta}</div>
        <div style={S.deltaHint}>
          {delta >= 7 ? 'High leverage \u2014 do this first' : delta >= 4 ? 'Solid impact \u2014 worth your time' : 'Low delta \u2014 defer or delegate'}
        </div>
      </div>

      <div style={S.field}>
        <label style={S.fieldLbl}>What's the task?</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Email 5 prospects from conference" style={S.input} autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()} />
      </div>

      <div style={S.field}>
        <label style={S.fieldLbl}>Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...S.input, width: '180px' }} />
      </div>

      <div style={S.field}>
        <label style={S.fieldLbl}>Repeats</label>
        <div style={S.recGrid}>
          {RECURRENCE_OPTIONS.map(r => (
            <button key={r.id} onClick={() => setRecurrence(r.id)} style={{
              ...S.recOpt,
              background: recurrence === r.id ? '#E8B93122' : 'transparent',
              borderColor: recurrence === r.id ? '#E8B931' : '#21262D',
              color: recurrence === r.id ? '#E8B931' : '#8B9DAF',
            }}>{r.label}</button>
          ))}
        </div>
      </div>

      {recurrence !== 'none' && (
        <div style={S.field}>
          <label style={S.fieldLbl}>Repeat until</label>
          <input type="date" value={recurrenceEnd} onChange={e => setRecurrenceEnd(e.target.value)} style={{ ...S.input, width: '180px' }} />
        </div>
      )}

      <div style={S.field}>
        <label style={S.fieldLbl}>Category</label>
        <div style={S.catGrid}>
          {CATS.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)} style={{
              ...S.catOpt,
              background: category === c.id ? c.color + '22' : 'transparent',
              borderColor: category === c.id ? c.color : '#21262D',
              color: category === c.id ? c.color : '#8B9DAF',
            }}>{c.icon} {c.label}</button>
          ))}
        </div>
      </div>

      <div style={S.field}>
        <label style={S.fieldLbl}>Estimated time (minutes)</label>
        <input value={duration} onChange={e => setDuration(e.target.value.replace(/\D/g, ''))} placeholder="30" style={{ ...S.input, width: '120px' }} inputMode="numeric" />
      </div>

      <div style={S.field}>
        <label style={S.fieldLbl}>Short-term payoff <span style={S.fieldHint}>&mdash; results in 1-7 days (40%)</span></label>
        <div style={S.sliderRow}>
          <input type="range" min="1" max="10" value={st} onChange={e => setSt(+e.target.value)} style={S.slider} />
          <span style={{ ...S.sliderVal, color: '#E07B5B' }}>{st}</span>
        </div>
      </div>

      <div style={S.field}>
        <label style={S.fieldLbl}>Long-term compounding <span style={S.fieldHint}>&mdash; lasting value (60%)</span></label>
        <div style={S.sliderRow}>
          <input type="range" min="1" max="10" value={lt} onChange={e => setLt(+e.target.value)} style={S.slider} />
          <span style={{ ...S.sliderVal, color: '#4CAF50' }}>{lt}</span>
        </div>
      </div>

      <button onClick={handleSave} disabled={!title.trim()} style={{ ...S.saveBtn, opacity: title.trim() ? 1 : 0.4 }}>
        {isEdit ? 'Update Task' : 'Add Task'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════
function AnalyticsView({ tasks, completions, getTasksForRange, isComplete, onBack }) {
  const t = today();
  const last30Start = addDays(t, -29);
  const allRecent = getTasksForRange(last30Start, t);
  const completed = allRecent.filter(tk => isComplete(tk.id, tk.occDate));
  const earnedDelta = completed.reduce((s, tk) => s + calcDelta(tk.st, tk.lt), 0);
  const rate = allRecent.length > 0 ? Math.round((completed.length / allRecent.length) * 100) : 0;

  const days14 = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(t, -(13 - i));
    const dayTasks = getTasksForRange(d, d);
    const done = dayTasks.filter(tk => isComplete(tk.id, d));
    return {
      date: d, total: dayTasks.length, done: done.length,
      delta: dayTasks.reduce((s, tk) => s + calcDelta(tk.st, tk.lt), 0),
      earned: done.reduce((s, tk) => s + calcDelta(tk.st, tk.lt), 0),
    };
  });
  const maxDayDelta = Math.max(...days14.map(d => d.delta), 1);

  const catMap = {};
  allRecent.forEach(tk => {
    if (!catMap[tk.category]) catMap[tk.category] = { total: 0, done: 0, delta: 0, earned: 0 };
    catMap[tk.category].total++;
    catMap[tk.category].delta += calcDelta(tk.st, tk.lt);
    if (isComplete(tk.id, tk.occDate)) {
      catMap[tk.category].done++;
      catMap[tk.category].earned += calcDelta(tk.st, tk.lt);
    }
  });

  return (
    <div style={S.editor}>
      <div style={S.editorHead}>
        <button onClick={onBack} style={S.backBtn}>&larr; Back</button>
        <span style={S.editorTitle}>Analytics</span>
        <div />
      </div>

      <div style={S.scoreStrip}>
        <div style={S.scoreCol}>
          <div style={S.scoreNum}>{allRecent.length}</div>
          <div style={S.scoreLbl}>Tasks (30d)</div>
        </div>
        <div style={S.scoreDivider} />
        <div style={S.scoreCol}>
          <div style={{ ...S.scoreNum, color: '#4CAF50' }}>{Math.round(earnedDelta)}</div>
          <div style={S.scoreLbl}>&Delta; Earned</div>
        </div>
        <div style={S.scoreDivider} />
        <div style={S.scoreCol}>
          <div style={S.scoreNum}>{rate}%</div>
          <div style={S.scoreLbl}>Completion</div>
        </div>
      </div>

      <div style={S.chartBox}>
        <div style={S.chartLabel}>Last 14 Days &mdash; Delta Planned vs Earned</div>
        <div style={S.chartRow}>
          {days14.map((d, i) => (
            <div key={i} style={S.chartCol}>
              <div style={S.chartBarWrap}>
                <div style={{ ...S.chartBarBg, height: `${(d.delta / maxDayDelta) * 80}px` }}>
                  <div style={{ ...S.chartBarFg, height: d.delta > 0 ? `${(d.earned / d.delta) * 100}%` : '0' }} />
                </div>
              </div>
              <div style={S.chartDayLbl}>{fromKey(d.date).getDate()}</div>
            </div>
          ))}
        </div>
        <div style={S.chartLegend}>
          <span><span style={{ ...S.legendDot, background: '#21262D' }} />Planned</span>
          <span><span style={{ ...S.legendDot, background: '#E8B931' }} />Earned</span>
        </div>
      </div>

      <div style={S.chartBox}>
        <div style={S.chartLabel}>By Category (30 days)</div>
        {Object.entries(catMap).map(([id, data]) => {
          const cat = getCat(id);
          return (
            <div key={id} style={S.catStatRow}>
              <span style={S.catStatIcon}>{cat.icon}</span>
              <span style={S.catStatName}>{cat.label}</span>
              <span style={S.catStatCount}>{data.done}/{data.total}</span>
              <span style={{ ...S.catStatDelta, color: cat.color }}>&Delta;{Math.round(data.earned)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════
const S = {
  root: { minHeight: '100vh', background: '#0D1117', fontFamily: "'DM Sans', -apple-system, sans-serif", color: '#E6EDF3', display: 'flex', justifyContent: 'center' },
  shell: { width: '100%', maxWidth: '520px', minHeight: '100vh', position: 'relative', paddingBottom: '40px' },
  loadWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0D1117' },
  loadPulse: { fontSize: '48px', fontFamily: "'DM Mono', monospace", color: '#E8B931' },

  headerWrap: { position: 'sticky', top: 0, zIndex: 10, background: '#0D1117', borderBottom: '1px solid #161B22', paddingBottom: '8px' },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 8px' },
  logoRow: { display: 'flex', alignItems: 'center', gap: '7px' },
  logoMark: { fontFamily: "'DM Mono', monospace", fontSize: '22px', fontWeight: 700, color: '#E8B931' },
  logoText: { fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px' },
  headerActions: { display: 'flex', gap: '8px', alignItems: 'center' },
  iconBtn: { background: 'none', border: 'none', color: '#8B9DAF', cursor: 'pointer', padding: '6px' },
  addBtn: { background: 'linear-gradient(135deg, #E8B931, #D4A017)', color: '#0D1117', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  avatarBtn: { width: '28px', height: '28px', borderRadius: '50%', background: '#161B22', border: '1px solid #21262D', color: '#E8B931', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" },
  menuDrop: { position: 'absolute', top: '36px', right: 0, background: '#161B22', border: '1px solid #21262D', borderRadius: '8px', padding: '8px 0', minWidth: '180px', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' },
  menuEmail: { padding: '8px 16px', fontSize: '12px', color: '#8B9DAF', borderBottom: '1px solid #21262D' },
  menuItem: { display: 'block', width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: '#E6EDF3', fontSize: '13px', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif" },

  viewTabs: { display: 'flex', gap: '2px', padding: '0 16px', marginBottom: '6px' },
  viewTab: { flex: 1, padding: '6px', background: 'transparent', border: 'none', borderRadius: '6px', color: '#8B9DAF', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'center' },
  viewTabActive: { background: '#161B22', color: '#E8B931', fontWeight: 600 },

  navRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', overflow: 'visible' },
  navArrow: { background: 'none', border: '1px solid #21262D', borderRadius: '6px', color: '#8B9DAF', fontSize: '18px', cursor: 'pointer', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 },
  todayBtn: { background: '#161B22', border: '1px solid #21262D', borderRadius: '6px', color: '#8B9DAF', fontSize: '11px', padding: '4px 10px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  navTitle: { flex: 1, textAlign: 'center', fontSize: '14px', fontWeight: 600 },

  scoreStrip: { display: 'flex', alignItems: 'center', background: '#161B22', borderRadius: '12px', padding: '14px', margin: '12px 0', border: '1px solid #21262D' },
  scoreCol: { flex: 1, textAlign: 'center' },
  scoreNum: { fontFamily: "'DM Mono', monospace", fontSize: '22px', fontWeight: 700, color: '#E8B931' },
  scoreLbl: { fontSize: '10px', color: '#8B9DAF', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '2px' },
  scoreDivider: { width: '1px', height: '32px', background: '#21262D', margin: '0 6px' },

  viewPad: { padding: '8px 16px' },
  sectionHead: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0 6px' },
  sectionLabel: { fontSize: '12px', fontWeight: 600, color: '#8B9DAF', textTransform: 'uppercase', letterSpacing: '0.4px' },
  badge: { background: '#21262D', color: '#8B9DAF', fontSize: '10px', padding: '1px 7px', borderRadius: '10px' },

  empty: { textAlign: 'center', padding: '40px 16px' },
  emptyIcon: { fontFamily: "'DM Mono', monospace", fontSize: '44px', color: '#21262D', marginBottom: '10px' },
  emptyTitle: { fontSize: '17px', fontWeight: 600, marginBottom: '4px' },
  emptySub: { fontSize: '13px', color: '#8B9DAF', marginBottom: '16px' },
  emptyBtn: { background: '#161B22', border: '1px solid #21262D', borderRadius: '8px', color: '#E8B931', padding: '8px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },

  taskRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#161B22', borderRadius: '10px', marginBottom: '6px', border: '1px solid #21262D' },
  check: { width: '22px', height: '22px', borderRadius: '6px', border: '2px solid #3a3f4a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff', cursor: 'pointer', flexShrink: 0 },
  taskBody: { flex: 1, cursor: 'pointer', minWidth: 0 },
  taskTitleRow: { marginBottom: '4px' },
  taskMetaRow: { display: 'flex', gap: '5px', flexWrap: 'wrap' },
  catPill: { fontSize: '10px', padding: '1px 7px', borderRadius: '5px', fontWeight: 500 },
  recurPill: { fontSize: '10px', padding: '1px 7px', borderRadius: '5px', background: '#E8B93115', color: '#E8B931' },
  durPill: { fontSize: '10px', padding: '1px 7px', borderRadius: '5px', background: '#21262D', color: '#8B9DAF' },
  carryPill: { fontSize: '10px', padding: '1px 7px', borderRadius: '5px', background: '#E07B5B15', color: '#E07B5B', fontStyle: 'italic' },
  deltaPill: { fontFamily: "'DM Mono', monospace", fontSize: '12px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', flexShrink: 0 },

  weekDay: { background: '#161B22', borderRadius: '10px', padding: '10px 12px', marginBottom: '6px', border: '1px solid #21262D' },
  weekDayToday: { border: '1px solid #E8B93144' },
  weekDayHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', cursor: 'pointer' },
  weekDayLeft: { display: 'flex', alignItems: 'baseline', gap: '6px' },
  weekDayName: { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' },
  weekDayNum: { fontSize: '18px', fontWeight: 700, fontFamily: "'DM Mono', monospace" },
  weekDayRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  weekDelta: { fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#E8B931', fontWeight: 600 },
  weekDoneDelta: { fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#4CAF50' },
  weekTaskCount: { fontSize: '11px', color: '#8B9DAF' },
  weekTaskPill: { display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0', cursor: 'pointer' },
  weekTaskDot: { width: '6px', height: '6px', borderRadius: '3px', flexShrink: 0 },
  weekTaskText: { fontSize: '12px', color: '#ccc', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  weekTaskDelta: { fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#8B9DAF' },
  weekMore: { fontSize: '11px', color: '#8B9DAF', padding: '2px 0', cursor: 'pointer' },
  weekAddBtn: { background: 'none', border: '1px dashed #21262D', borderRadius: '6px', color: '#8B9DAF', width: '100%', padding: '4px', fontSize: '14px', cursor: 'pointer', marginTop: '4px', fontFamily: "'DM Sans', sans-serif" },

  monthGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' },
  monthDow: { fontSize: '10px', color: '#555', textAlign: 'center', padding: '4px 0', fontWeight: 600 },
  monthCell: { aspectRatio: '1', padding: '3px', borderRadius: '6px', position: 'relative', minHeight: '42px' },
  monthCellActive: { cursor: 'pointer' },
  monthCellNum: { fontSize: '11px', fontWeight: 600, textAlign: 'center' },
  monthDots: { display: 'flex', gap: '2px', justifyContent: 'center', marginTop: '2px', flexWrap: 'wrap' },
  monthDot: { width: '4px', height: '4px', borderRadius: '2px' },
  monthCheck: { position: 'absolute', top: '2px', right: '3px', fontSize: '8px', color: '#4CAF50' },

  yearGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' },
  yearCard: { background: '#161B22', borderRadius: '10px', padding: '10px 8px', textAlign: 'center', border: '1px solid #21262D', cursor: 'pointer' },
  yearCardCurrent: { border: '1px solid #E8B93144' },
  yearMonth: { fontSize: '12px', fontWeight: 600, marginBottom: '6px' },
  yearBar: { display: 'flex', justifyContent: 'center', marginBottom: '4px', height: '50px', alignItems: 'flex-end' },
  yearBarTrack: { width: '16px', background: '#21262D', borderRadius: '3px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', height: '50px' },
  yearBarFill: { width: '100%', background: 'linear-gradient(to top, #E8B931, #D4A017)', borderRadius: '3px' },
  yearDelta: { fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#E8B931' },
  yearRate: { fontSize: '10px', color: '#4CAF50', marginTop: '2px' },

  editor: { padding: '16px' },
  editorHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  editorTitle: { fontSize: '16px', fontWeight: 600 },
  backBtn: { background: 'none', border: 'none', color: '#8B9DAF', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  delBtn: { background: 'none', border: 'none', color: '#E07B5B', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },

  deltaPreview: { textAlign: 'center', padding: '16px', marginBottom: '16px', background: '#161B22', borderRadius: '12px', border: '1px solid #21262D' },
  deltaLbl: { fontSize: '10px', color: '#8B9DAF', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' },
  deltaVal: { fontFamily: "'DM Mono', monospace", fontSize: '38px', fontWeight: 700, lineHeight: 1.1 },
  deltaHint: { fontSize: '12px', color: '#8B9DAF', marginTop: '4px' },

  field: { marginBottom: '16px' },
  fieldLbl: { fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block' },
  fieldHint: { fontWeight: 400, color: '#8B9DAF' },
  input: { width: '100%', padding: '10px 12px', background: '#161B22', border: '1px solid #21262D', borderRadius: '8px', color: '#E6EDF3', fontSize: '14px', outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' },
  catGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' },
  catOpt: { padding: '6px 8px', borderRadius: '6px', border: '1px solid #21262D', fontSize: '11px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  recGrid: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  recOpt: { padding: '5px 10px', borderRadius: '6px', border: '1px solid #21262D', fontSize: '11px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  sliderRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  slider: { flex: 1, height: '6px', WebkitAppearance: 'none', appearance: 'none', background: '#21262D', borderRadius: '3px', outline: 'none', accentColor: '#E8B931' },
  sliderVal: { fontFamily: "'DM Mono', monospace", fontSize: '18px', fontWeight: 700, minWidth: '24px', textAlign: 'right' },
  saveBtn: { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #E8B931, #D4A017)', border: 'none', borderRadius: '10px', color: '#0D1117', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginTop: '8px' },

  chartBox: { background: '#161B22', borderRadius: '12px', padding: '14px', border: '1px solid #21262D', marginBottom: '12px' },
  chartLabel: { fontSize: '12px', fontWeight: 600, color: '#8B9DAF', marginBottom: '12px' },
  chartRow: { display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px' },
  chartCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  chartBarWrap: { flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', height: '80px' },
  chartBarBg: { width: '100%', maxWidth: '20px', margin: '0 auto', background: '#21262D', borderRadius: '3px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' },
  chartBarFg: { width: '100%', background: 'linear-gradient(to top, #E8B931, #D4A017)', borderRadius: '3px' },
  chartDayLbl: { fontSize: '9px', color: '#555', marginTop: '4px' },
  chartLegend: { display: 'flex', gap: '14px', justifyContent: 'center', marginTop: '10px', fontSize: '10px', color: '#8B9DAF' },
  legendDot: { display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', marginRight: '4px', verticalAlign: 'middle' },

  catStatRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: '1px solid #21262D' },
  catStatIcon: { fontSize: '14px' },
  catStatName: { flex: 1, fontSize: '12px', fontWeight: 500 },
  catStatCount: { fontSize: '11px', color: '#8B9DAF' },
  catStatDelta: { fontFamily: "'DM Mono', monospace", fontSize: '12px', fontWeight: 600, minWidth: '40px', textAlign: 'right' },
};
