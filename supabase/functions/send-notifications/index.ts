// Supabase Edge Function — called by QStash CRON every 5 minutes.
// Sends push notifications for any dose reminders due in the current window.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const VAPID_PUBLIC_KEY = (Deno.env.get("VAPID_PUBLIC_KEY") ?? "").trim();
const VAPID_PRIVATE_KEY = (Deno.env.get("VAPID_PRIVATE_KEY") ?? "").trim();
const VAPID_SUBJECT = "https://jmitsuominor-ux.github.io/peptide-reference/";

console.log(`[init] pub=${VAPID_PUBLIC_KEY.length}c priv=${VAPID_PRIVATE_KEY.length}c`);

// ── Helpers ───────────────────────────────────────────────────────────────────

function isDueToday(entry: Record<string, unknown>, localDow: number): boolean {
  const freq = entry.frequency as string;
  if (freq === "as_needed") return false;
  if (freq === "daily") return true;
  const days = entry.days_of_week as number[] | null;
  return Array.isArray(days) && days.includes(localDow);
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (_req: Request) => {
  const nowUtc = new Date();
  console.log(`[run] ${nowUtc.toISOString()}`);

  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error("[fatal] VAPID keys missing");
      return new Response("VAPID keys not configured", { status: 500 });
    }

    // Set VAPID details inside handler so env vars are guaranteed available
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const { data: subs, error: subsErr } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("is_active", true);

    if (subsErr) {
      console.error("[db]", subsErr.message);
      return new Response("DB error: " + subsErr.message, { status: 500 });
    }

    const validSubs = (subs ?? []).filter((s) => {
      if (typeof s.subscription !== "string") return false;
      try {
        const p = JSON.parse(s.subscription);
        return !!p.endpoint && !!p.keys?.p256dh && !!p.keys?.auth;
      } catch { return false; }
    });
    console.log(`[subs] valid: ${validSubs.length}`);

    const LOOKBACK = 6;
    const WINDOW = 5;
    let totalSent = 0;

    for (const sub of validSubs) {
      const subscriptionObj = JSON.parse(sub.subscription);
      const localNow = new Date(nowUtc.getTime() - sub.timezone_offset * 60 * 1000);
      const localHour = localNow.getUTCHours();
      const localMinute = localNow.getUTCMinutes();
      const localDow = localNow.getUTCDay();
      const localDate = `${localNow.getUTCFullYear()}-${
        String(localNow.getUTCMonth() + 1).padStart(2, "0")}-${
        String(localNow.getUTCDate()).padStart(2, "0")}`;
      console.log(
        `[user] ${sub.user_id} tz=${sub.timezone_offset} local=${
          String(localHour).padStart(2, "0")}:${String(localMinute).padStart(2, "0")} dow=${localDow} date=${localDate}`,
      );

      const { data: entries, error: entErr } = await supabase
        .from("schedule_entries")
        .select(
          "id, compound_name, dose, reminder_time, reminder_time_2, frequency, days_of_week, schedules!inner(is_active)",
        )
        .eq("user_id", sub.user_id)
        .eq("is_active", true)
        .eq("schedules.is_active", true);

      if (entErr) {
        console.log(`[user] ${sub.user_id} entries error: ${entErr.message}`);
        continue;
      }
      console.log(`[user] ${sub.user_id} entries: ${entries?.length ?? 0}`);
      if (!entries?.length) continue;

      const nowTotalMin = localHour * 60 + localMinute;
      type Slot = { entry: typeof entries[0]; reminder_time: string; slot: number };
      const slots: Slot[] = [];

      for (const e of entries) {
        if (!isDueToday(e, localDow)) {
          console.log(`[entry] ${e.compound_name}: not due today (freq=${e.frequency} days=${JSON.stringify(e.days_of_week)})`);
          continue;
        }
        for (
          const [idx, rt] of (
            [e.reminder_time || "20:00", e.reminder_time_2] as (string | null)[]
          ).entries()
        ) {
          if (!rt) continue;
          const [h, m] = rt.split(":").map(Number);
          const rem = h * 60 + m;
          const inWindow = rem >= nowTotalMin - LOOKBACK && rem < nowTotalMin + WINDOW;
          console.log(
            `[entry] ${e.compound_name} slot${idx + 1} @${rt}(${rem}) window=[${nowTotalMin - LOOKBACK},${nowTotalMin + WINDOW}) in=${inWindow}`,
          );
          if (inWindow) slots.push({ entry: e, reminder_time: rt, slot: idx + 1 });
        }
      }

      if (!slots.length) {
        console.log(`[user] ${sub.user_id}: no slots in current window`);
        continue;
      }

      const { data: alreadySent } = await supabase
        .from("notification_log")
        .select("entry_id, reminder_slot")
        .eq("user_id", sub.user_id)
        .eq("sent_date", localDate);

      const sentSet = new Set((alreadySent ?? []).map((r) => `${r.entry_id}:${r.reminder_slot ?? 1}`));
      const toSend = slots.filter((s) => !sentSet.has(`${s.entry.id}:${s.slot}`));
      if (!toSend.length) {
        console.log(`[user] ${sub.user_id}: all due slots already sent today`);
        continue;
      }

      const groups: Record<string, Slot[]> = {};
      toSend.forEach((s) => { (groups[s.reminder_time] ??= []).push(s); });

      for (const [time, groupSlots] of Object.entries(groups)) {
        const doses = groupSlots.map((s) => `${s.entry.compound_name}: ${s.entry.dose}`).join(" · ");
        try {
          console.log(`[push] → ${doses}`);
          await webpush.sendNotification(
            subscriptionObj,
            JSON.stringify({
              title: "Time for your peptides 💉",
              body: doses,
              tag: `peptideref-${localDate}-${time.replace(":", "")}`,
            }),
          );
          await supabase.from("notification_log").insert(
            groupSlots.map((s) => ({
              user_id: sub.user_id,
              entry_id: s.entry.id,
              sent_date: localDate,
              reminder_slot: s.slot,
            })),
          );
          console.log(`[push] ✅ sent+logged`);
          totalSent++;
        } catch (err: unknown) {
          const e = err as { statusCode?: number; body?: string; message?: string };
          console.error(`[push] ❌ statusCode=${e.statusCode} body=${e.body} msg=${e.message}`);
          if (e.statusCode === 410) {
            await supabase.from("push_subscriptions")
              .update({ is_active: false })
              .eq("user_id", sub.user_id);
            console.log(`[push] 410 — subscription marked inactive`);
          }
        }
      }
    }

    console.log(`[done] sent=${totalSent}`);
    return new Response(`OK sent=${totalSent}`, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? `${err.message}\n${(err as Error).stack}` : String(err);
    console.error(`[fatal] ${msg}`);
    return new Response(`Error: ${msg}`, { status: 500 });
  }
});
