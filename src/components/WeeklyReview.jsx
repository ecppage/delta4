import { useState, useMemo } from 'react';
import { calcDelta, getCat, addDays, today, fromKey, getOccurrences, startOfWeek, fmtDate, CATS } from '../lib/useTasks.js';

export default function WeeklyReview({ tasks, completions, getTasksForRange, isComplete, onBack, onSetTopTask }) {
  const t = today();
  const currentWeekStart = startOfWeek(t);

  // Allow navigating between weeks
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = addDays(currentWeekStart, weekOffset * 7);
  const weekEnd = addDays(weekStart, 6);

  const isCurrentWeek = weekOffset === 0;
  const isPast = weekOffset < 0;

  // Gather all tasks in this week's range
  const weekTasks = useMemo(() => getTasksForRange(weekStart, weekEnd), [getTasksForRange, weekStart, weekEnd]);
  const completedTasks = useMemo(() => weekTasks.filter(t => isComplete(t.id, t.occDate)), [weekTasks, isComplete]);

  // Stats
  const totalPlanned = weekTasks.length;
  const totalCompleted = completedTasks.length;
  const deltaPlanned = Math.round(weekTasks.reduce((s, t) => s + calcDelta(t.st, t.lt), 0) * 10) / 10;
  const deltaEarned = Math.round(completedTasks.reduce((s, t) => s + calcDelta(t.st, t.lt), 0) * 10) / 10;
  const completionRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

  // Top completed task by delta
  const topTask = completedTasks.length > 0
    ? completedTasks.reduce((best, t) => calcDelta(t.st, t.lt) > calcDelta(best.st, best.lt) ? t : best)
    : null;

  // Category breakdown
  const catBreakdown = useMemo(() => {
    const map = {};
    weekTasks.forEach(t => {
      if (!map[t.category]) map[t.category] = { planned: 0, done: 0, deltaPlanned: 0, deltaEarned: 0 };
      map[t.category].planned++;
      map[t.category].deltaPlanned += calcDelta(t.st, t.lt);
      if (isComplete(t.id, t.occDate)) {
        map[t.category].done++;
        map[t.category].deltaEarned += calcDelta(t.st, t.lt);
      }
    });
    return Object.entries(map).sort((a, b) => b[1].deltaEarned - a[1].deltaEarned);
  }, [weekTasks, isComplete]);

  // Daily breakdown for the week
  const dailyBreakdown = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i);
      const dayTasks = getTasksForRange(d, d);
      const done = dayTasks.filter(t => isComplete(t.id, d));
      return {
        date: d,
        label: fromKey(d).toLocaleDateString('en-US', { weekday: 'short' }),
        num: fromKey(d).getDate(),
        planned: dayTasks.length,
        completed: done.length,
        delta: dayTasks.reduce((s, t) => s + calcDelta(t.st, t.lt), 0),
        earned: done.reduce((s, t) => s + calcDelta(t.st, t.lt), 0),
      };
    });
  }, [weekStart, getTasksForRange, isComplete]);

  const maxDayDelta = Math.max(...dailyBreakdown.map(d => d.delta), 1);

  // Top category by earned delta
  const topCategory = catBreakdown.length > 0 ? getCat(catBreakdown[0][0]) : null;

  // Insight generation
  const insight = useMemo(() => {
    if (totalPlanned === 0) return 'No tasks planned this week. Add some high-delta tasks to get started.';
    if (completionRate >= 80 && deltaEarned >= 20) return 'Outstanding week. You executed on high-impact work consistently.';
    if (completionRate >= 80) return 'Strong execution rate. Consider raising the delta bar \u2014 are you working on hard-enough problems?';
    if (deltaEarned >= 20) return 'High delta output despite incomplete tasks. You\u2019re picking the right work \u2014 now finish more of it.';

    const adminTasks = weekTasks.filter(t => t.category === 'admin');
    const adminRatio = adminTasks.length / totalPlanned;
    if (adminRatio > 0.4) return 'Over 40% of your week went to admin. Block time for revenue and growth tasks.';

    return 'Solid week. Look at which categories earned the most delta and double down there next week.';
  }, [totalPlanned, completionRate, deltaEarned, weekTasks]);

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <button onClick={onBack} style={S.backBtn}>&larr; Back</button>
        <span style={S.title}>Weekly Review</span>
        <div />
      </div>

      {/* Week navigator */}
      <div style={S.weekNav}>
        <button onClick={() => setWeekOffset(o => o - 1)} style={S.navArrow}>&lsaquo;</button>
        <span style={S.weekLabel}>
          {fmtDate(weekStart)} &mdash; {fmtDate(weekEnd)}
          {isCurrentWeek && <span style={S.currentBadge}>This week</span>}
        </span>
        <button onClick={() => setWeekOffset(o => Math.min(o + 1, 0))} style={{ ...S.navArrow, opacity: isCurrentWeek ? 0.3 : 1 }}>&rsaquo;</button>
      </div>

      {/* Headline stats */}
      <div style={S.scoreStrip}>
        <div style={S.scoreCol}>
          <div style={{ ...S.scoreNum, color: '#E8B931' }}>{deltaEarned}</div>
          <div style={S.scoreLbl}>&Delta; Earned</div>
        </div>
        <div style={S.divider} />
        <div style={S.scoreCol}>
          <div style={{ ...S.scoreNum, color: '#4CAF50' }}>{completionRate}%</div>
          <div style={S.scoreLbl}>Completed</div>
        </div>
        <div style={S.divider} />
        <div style={S.scoreCol}>
          <div style={S.scoreNum}>{totalCompleted}/{totalPlanned}</div>
          <div style={S.scoreLbl}>Tasks</div>
        </div>
      </div>

      {/* Insight card */}
      <div style={S.insightCard}>
        <div style={S.insightLabel}>Weekly Insight</div>
        <div style={S.insightText}>{insight}</div>
      </div>

      {/* Daily bar chart */}
      <div style={S.chartBox}>
        <div style={S.chartLabel}>Daily Delta &mdash; Planned vs Earned</div>
        <div style={S.chartRow}>
          {dailyBreakdown.map((d, i) => (
            <div key={i} style={S.chartCol}>
              <div style={S.chartBarWrap}>
                <div style={{ ...S.chartBarBg, height: `${(d.delta / maxDayDelta) * 72}px` }}>
                  <div style={{ ...S.chartBarFg, height: d.delta > 0 ? `${(d.earned / d.delta) * 100}%` : '0' }} />
                </div>
              </div>
              <div style={{ ...S.chartDayLbl, color: d.date === t ? '#E8B931' : '#555' }}>{d.label}</div>
              <div style={S.chartDayNum}>{d.num}</div>
            </div>
          ))}
        </div>
        <div style={S.chartLegend}>
          <span><span style={{ ...S.legendDot, background: '#21262D' }} />Planned</span>
          <span><span style={{ ...S.legendDot, background: '#E8B931' }} />Earned</span>
        </div>
      </div>

      {/* Top task */}
      {topTask && (
        <div style={S.chartBox}>
          <div style={S.chartLabel}>Top Task This Week</div>
          <div style={S.topTaskRow}>
            <span style={{ ...S.catPill, background: getCat(topTask.category).color + '22', color: getCat(topTask.category).color }}>
              {getCat(topTask.category).icon} {getCat(topTask.category).label}
            </span>
            <span style={S.topTaskTitle}>{topTask.title}</span>
            <span style={S.topTaskDelta}>&Delta;{calcDelta(topTask.st, topTask.lt)}</span>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      <div style={S.chartBox}>
        <div style={S.chartLabel}>By Category</div>
        {catBreakdown.length === 0 && <div style={S.empty}>No data for this week</div>}
        {catBreakdown.map(([catId, data]) => {
          const cat = getCat(catId);
          const pct = data.planned > 0 ? Math.round((data.done / data.planned) * 100) : 0;
          return (
            <div key={catId} style={S.catRow}>
              <span style={S.catIcon}>{cat.icon}</span>
              <span style={S.catName}>{cat.label}</span>
              <span style={S.catCount}>{data.done}/{data.planned}</span>
              <div style={S.catBar}>
                <div style={{ ...S.catBarFill, width: `${pct}%`, background: cat.color }} />
              </div>
              <span style={{ ...S.catDelta, color: cat.color }}>&Delta;{Math.round(data.deltaEarned * 10) / 10}</span>
            </div>
          );
        })}
      </div>

      {/* Next week prompt */}
      {(isPast || isCurrentWeek) && (
        <div style={S.promptBox}>
          <div style={S.promptLabel}>Looking ahead</div>
          <div style={S.promptText}>What's your #1 high-delta task for next week?</div>
          <div style={S.promptHint}>Focus on the one thing that compounds most.</div>
        </div>
      )}
    </div>
  );
}

const S = {
  wrap: { padding: '16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  title: { fontSize: '16px', fontWeight: 600, color: '#E6EDF3' },
  backBtn: { background: 'none', border: 'none', color: '#8B9DAF', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },

  weekNav: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' },
  navArrow: { background: 'none', border: '1px solid #21262D', borderRadius: '6px', color: '#8B9DAF', fontSize: '18px', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" },
  weekLabel: { fontSize: '14px', fontWeight: 600, color: '#E6EDF3', display: 'flex', alignItems: 'center', gap: '8px' },
  currentBadge: { fontSize: '10px', background: '#E8B93122', color: '#E8B931', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 },

  scoreStrip: { display: 'flex', alignItems: 'center', background: '#161B22', borderRadius: '12px', padding: '16px', marginBottom: '12px', border: '1px solid #21262D' },
  scoreCol: { flex: 1, textAlign: 'center' },
  scoreNum: { fontFamily: "'DM Mono', monospace", fontSize: '24px', fontWeight: 700, color: '#E6EDF3' },
  scoreLbl: { fontSize: '10px', color: '#8B9DAF', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '2px' },
  divider: { width: '1px', height: '32px', background: '#21262D' },

  insightCard: { background: '#161B22', borderRadius: '12px', padding: '16px', border: '1px solid #E8B93133', marginBottom: '12px' },
  insightLabel: { fontSize: '10px', color: '#E8B931', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '6px' },
  insightText: { fontSize: '14px', color: '#E6EDF3', lineHeight: 1.5 },

  chartBox: { background: '#161B22', borderRadius: '12px', padding: '14px', border: '1px solid #21262D', marginBottom: '12px' },
  chartLabel: { fontSize: '12px', fontWeight: 600, color: '#8B9DAF', marginBottom: '12px' },
  chartRow: { display: 'flex', alignItems: 'flex-end', gap: '6px', height: '100px' },
  chartCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  chartBarWrap: { flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', height: '72px' },
  chartBarBg: { width: '100%', maxWidth: '24px', margin: '0 auto', background: '#21262D', borderRadius: '3px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' },
  chartBarFg: { width: '100%', background: 'linear-gradient(to top, #E8B931, #D4A017)', borderRadius: '3px' },
  chartDayLbl: { fontSize: '10px', color: '#555', marginTop: '4px', fontWeight: 600 },
  chartDayNum: { fontSize: '9px', color: '#555' },
  chartLegend: { display: 'flex', gap: '14px', justifyContent: 'center', marginTop: '10px', fontSize: '10px', color: '#8B9DAF' },
  legendDot: { display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', marginRight: '4px', verticalAlign: 'middle' },

  topTaskRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  catPill: { fontSize: '10px', padding: '2px 8px', borderRadius: '5px', fontWeight: 500, whiteSpace: 'nowrap' },
  topTaskTitle: { flex: 1, fontSize: '14px', fontWeight: 500, color: '#E6EDF3' },
  topTaskDelta: { fontFamily: "'DM Mono', monospace", fontSize: '14px', fontWeight: 700, color: '#E8B931' },

  catRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid #21262D' },
  catIcon: { fontSize: '14px' },
  catName: { fontSize: '12px', fontWeight: 500, color: '#E6EDF3', minWidth: '60px' },
  catCount: { fontSize: '11px', color: '#8B9DAF', minWidth: '30px' },
  catBar: { flex: 1, height: '6px', background: '#21262D', borderRadius: '3px', overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: '3px', transition: 'width 0.3s' },
  catDelta: { fontFamily: "'DM Mono', monospace", fontSize: '12px', fontWeight: 600, minWidth: '40px', textAlign: 'right' },

  promptBox: { background: '#161B22', borderRadius: '12px', padding: '20px', border: '1px dashed #E8B93144', textAlign: 'center', marginTop: '4px' },
  promptLabel: { fontSize: '10px', color: '#E8B931', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, marginBottom: '8px' },
  promptText: { fontSize: '16px', fontWeight: 600, color: '#E6EDF3', marginBottom: '4px' },
  promptHint: { fontSize: '13px', color: '#8B9DAF' },

  empty: { fontSize: '13px', color: '#555', textAlign: 'center', padding: '16px' },
};
