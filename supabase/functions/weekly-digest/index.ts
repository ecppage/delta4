// Delta4 Weekly Digest — Supabase Edge Function
// Triggered via Supabase cron (pg_cron) every Sunday at 9am
//
// Setup:
//   1. Deploy: supabase functions deploy weekly-digest
//   2. Set secret: supabase secrets set RESEND_API_KEY=re_xxxxx
//   3. Add cron in SQL Editor:
//      select cron.schedule('weekly-digest', '0 9 * * 0',
//        $$select net.http_post(
//          url := 'https://YOUR_PROJECT.supabase.co/functions/v1/weekly-digest',
//          headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
//        )$$
//      );

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function toKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return toKey(d);
}

function calcDelta(st: number, lt: number): number {
  return Math.round((st * 0.4 + lt * 0.6) * 10) / 10;
}

Deno.serve(async (req) => {
  try {
    // Calculate week range (Monday to Sunday of the past week)
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const sundayOffset = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const thisWeekEnd = toKey(now);
    const thisWeekStart = addDays(thisWeekEnd, -6);

    // Get all users with weekly email enabled
    const { data: profiles, error: profileErr } = await supabase
      .from("profiles")
      .select("id, email, display_name")
      .eq("weekly_email_enabled", true);

    if (profileErr || !profiles) {
      return new Response(JSON.stringify({ error: "Failed to fetch profiles" }), { status: 500 });
    }

    let sent = 0;
    let errors = 0;

    for (const profile of profiles) {
      try {
        // Get tasks for this user in the week range
        const { data: tasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", profile.id)
          .eq("is_deleted", false);

        // Get completions for this week
        const { data: completions } = await supabase
          .from("completions")
          .select("*")
          .eq("user_id", profile.id)
          .gte("completed_date", thisWeekStart)
          .lte("completed_date", thisWeekEnd);

        const completedSet = new Set(
          (completions || []).map((c: any) => `${c.task_id}:${c.completed_date.split("T")[0]}`)
        );

        // Calculate stats
        const totalCompleted = completions?.length || 0;
        const deltaEarned = Math.round(
          (completions || []).reduce((s: number, c: any) => s + Number(c.delta_earned), 0) * 10
        ) / 10;

        // Get total planned tasks (simplified — count tasks with dates in range)
        let planned = 0;
        let deltaPlanned = 0;
        (tasks || []).forEach((t: any) => {
          const taskDate = t.date?.split("T")[0];
          if (taskDate >= thisWeekStart && taskDate <= thisWeekEnd) {
            planned++;
            deltaPlanned += calcDelta(t.st, t.lt);
          }
        });

        // Top completed task
        let topTask = null;
        let topDelta = 0;
        (completions || []).forEach((c: any) => {
          const task = (tasks || []).find((t: any) => t.id === c.task_id);
          if (task) {
            const d = calcDelta(task.st, task.lt);
            if (d > topDelta) {
              topDelta = d;
              topTask = task;
            }
          }
        });

        // Category breakdown
        const catMap: Record<string, { done: number; delta: number }> = {};
        (completions || []).forEach((c: any) => {
          const task = (tasks || []).find((t: any) => t.id === c.task_id);
          if (task) {
            if (!catMap[task.category]) catMap[task.category] = { done: 0, delta: 0 };
            catMap[task.category].done++;
            catMap[task.category].delta += Number(c.delta_earned);
          }
        });

        const completionRate = planned > 0 ? Math.round((totalCompleted / planned) * 100) : 0;
        const topCat = Object.entries(catMap).sort((a, b) => b[1].delta - a[1].delta)[0];

        // Save weekly snapshot
        await supabase.from("weekly_snapshots").upsert({
          user_id: profile.id,
          week_start: thisWeekStart,
          week_end: thisWeekEnd,
          tasks_planned: planned,
          tasks_completed: totalCompleted,
          delta_planned: Math.round(deltaPlanned * 10) / 10,
          delta_earned: deltaEarned,
          top_category: topCat ? topCat[0] : null,
          top_task_title: topTask?.title || null,
          top_task_delta: topDelta || null,
          category_breakdown: catMap,
        }, { onConflict: "user_id,week_start" });

        // Send email via Resend
        if (RESEND_API_KEY && totalCompleted > 0) {
          const catEmoji: Record<string, string> = {
            revenue: "\u{1F4B0}", growth: "\u{1F4C8}", systems: "\u2699\uFE0F",
            network: "\u{1F91D}", learn: "\u{1F4DA}", admin: "\u{1F4CB}",
          };

          const catRows = Object.entries(catMap)
            .sort((a, b) => b[1].delta - a[1].delta)
            .map(([id, data]) => `<tr><td style="padding:6px 12px">${catEmoji[id] || ""} ${id}</td><td style="padding:6px 12px;text-align:right">${data.done} tasks</td><td style="padding:6px 12px;text-align:right;color:#E8B931;font-weight:600">\u0394${Math.round(data.delta * 10) / 10}</td></tr>`)
            .join("");

          const html = `
          <div style="max-width:480px;margin:0 auto;font-family:-apple-system,sans-serif;background:#0D1117;color:#E6EDF3;padding:32px;border-radius:16px">
            <div style="text-align:center;margin-bottom:24px">
              <span style="font-size:32px;font-weight:700;color:#E8B931">\u0394</span>
              <span style="font-size:20px;font-weight:700;margin-left:8px">Delta4</span>
            </div>
            <h2 style="text-align:center;margin:0 0 4px;font-size:18px">Your Week in Review</h2>
            <p style="text-align:center;color:#8B9DAF;font-size:13px;margin:0 0 24px">${thisWeekStart} \u2014 ${thisWeekEnd}</p>

            <div style="display:flex;gap:12px;margin-bottom:24px">
              <div style="flex:1;background:#161B22;border-radius:10px;padding:16px;text-align:center;border:1px solid #21262D">
                <div style="font-size:28px;font-weight:700;color:#E8B931">${deltaEarned}</div>
                <div style="font-size:11px;color:#8B9DAF;text-transform:uppercase">\u0394 Earned</div>
              </div>
              <div style="flex:1;background:#161B22;border-radius:10px;padding:16px;text-align:center;border:1px solid #21262D">
                <div style="font-size:28px;font-weight:700;color:#4CAF50">${completionRate}%</div>
                <div style="font-size:11px;color:#8B9DAF;text-transform:uppercase">Completion</div>
              </div>
              <div style="flex:1;background:#161B22;border-radius:10px;padding:16px;text-align:center;border:1px solid #21262D">
                <div style="font-size:28px;font-weight:700">${totalCompleted}</div>
                <div style="font-size:11px;color:#8B9DAF;text-transform:uppercase">Tasks Done</div>
              </div>
            </div>

            ${topTask ? `
            <div style="background:#161B22;border-radius:10px;padding:16px;margin-bottom:16px;border:1px solid #21262D">
              <div style="font-size:11px;color:#E8B931;text-transform:uppercase;font-weight:600;margin-bottom:6px">Top Task</div>
              <div style="font-size:15px;font-weight:500">${topTask.title}</div>
              <div style="font-size:13px;color:#E8B931;margin-top:4px">\u0394${topDelta}</div>
            </div>` : ""}

            ${catRows ? `
            <div style="background:#161B22;border-radius:10px;padding:16px;margin-bottom:16px;border:1px solid #21262D">
              <div style="font-size:11px;color:#8B9DAF;text-transform:uppercase;font-weight:600;margin-bottom:8px">By Category</div>
              <table style="width:100%;font-size:13px">${catRows}</table>
            </div>` : ""}

            <div style="text-align:center;margin-top:24px">
              <a href="${SUPABASE_URL.replace('.supabase.co', '.vercel.app')}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#E8B931,#D4A017);color:#0D1117;font-weight:700;border-radius:8px;text-decoration:none;font-size:14px">Open Delta4 \u2192</a>
            </div>
            <p style="text-align:center;color:#555;font-size:11px;margin-top:16px">You're receiving this because you have weekly digests enabled in Delta4.</p>
          </div>`;

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Delta4 <digest@delta4.app>",
              to: [profile.email],
              subject: `Your Week: \u0394${deltaEarned} earned, ${totalCompleted} tasks completed`,
              html,
            }),
          });

          sent++;
        }
      } catch (e) {
        console.error(`Error for user ${profile.id}:`, e);
        errors++;
      }
    }

    return new Response(JSON.stringify({ sent, errors, total: profiles.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
