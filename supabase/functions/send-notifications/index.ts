// Supabase Edge Function — called by QStash CRON every 5 minutes.
// Sends push notifications for any dose reminders due in the current window.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

webpush.setVapidDetails(
  "https://jmitsuominor-ux.github.io/peptide-reference/",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

function isDueToday(entry: Record<string, unknown>, localDow: number): boolean {
  const freq = entry.frequency as string;
  if (freq === "as_needed") return false;
  if (freq === "daily") return true;
  const days = entry.days_of_week as number[] | null;
  return Array.isArray(days) && days.includes(localDow);
}

Deno.serve(async (req: Request) => {
  // Verify caller is our QStash CRON (or cron-job.org)
  if (CRON_SECRET && req.headers.get("Authorization") !== `Bearer ${CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const nowUtc = new Date();
  console.log(`Run: ${nowUtc.toISOString()}`);

  const { data: subs, error: subsErr } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("is_active", true);

  if (subsErr) {
    console.error("Subs error:", subsErr.message);
    return new Response("DB error", { status: 500 });
  }

  const validSubs = (subs ?? []).filter((s) => {
    if (typeof s.subscription !== "string") return false;
    try { return !!(JSON.parse(s.subscription).endpoint); } catch { return false; }
  });

  console.log(`${validSubs.length} valid subscription(s)`);

  // Window: [-6 min, +5 min] from now — covers the 5-min CRON interval with a small buffer
  const LOOKBACK = 6;
  const WINDOW = 5;

  for (const sub of validSubs) {
    const subscriptionObj = JSON.parse(sub.subscription);
    const localNow = new Date(nowUtc.getTime() - sub.timezone_offset * 60 * 1000);
    const localHour = localNow.getUTCHours();
    const localMinute = localNow.getUTCMinutes();
    const localDow = localNow.getUTCDay();
    const localDate = `${localNow.getUTCFullYear()}-${
      String(localNow.getUTCMonth() + 1).padStart(2, "0")}-${
      String(localNow.getUTCDate()).padStart(2, "0")}`;

    const { data: entries } = await supabase
      .from("schedule_entries")
      .select("id, compound_name, dose, reminder_time, reminder_time_2, frequency, days_of_week, schedules!inner(is_active)")
      .eq("user_id", sub.user_id)
      .eq("is_active", true)
      .eq("schedules.is_active", true);

    if (!entries?.length) continue;

    const nowTotalMin = localHour * 60 + localMinute;
    type Slot = { entry: typeof entries[0]; reminder_time: string; slot: number };
    const slots: Slot[] = [];

    for (const e of entries) {
      if (!isDueToday(e, localDow)) continue;
      for (const [idx, rt] of ([e.reminder_time || "20:00", e.reminder_time_2] as (string | null)[]).entries()) {
        if (!rt) continue;
        const [h, m] = rt.split(":").map(Number);
        const rem = h * 60 + m;
        if (rem >= nowTotalMin - LOOKBACK && rem < nowTotalMin + WINDOW) {
          slots.push({ entry: e, reminder_time: rt, slot: idx + 1 });
        }
      }
    }

    if (!slots.length) continue;

    const { data: alreadySent } = await supabase
      .from("notification_log")
      .select("entry_id, reminder_slot")
      .eq("user_id", sub.user_id)
      .eq("sent_date", localDate);

    const sentSet = new Set((alreadySent ?? []).map((r) => `${r.entry_id}:${r.reminder_slot ?? 1}`));
    const toSend = slots.filter((s) => !sentSet.has(`${s.entry.id}:${s.slot}`));
    if (!toSend.length) continue;

    const groups: Record<string, Slot[]> = {};
    toSend.forEach((s) => { (groups[s.reminder_time] ??= []).push(s); });

    for (const [time, groupSlots] of Object.entries(groups)) {
      const doses = groupSlots.map((s) => `${s.entry.compound_name}: ${s.entry.dose}`).join(" · ");
      try {
        await webpush.sendNotification(subscriptionObj, JSON.stringify({
          title: "Time for your peptides 💉",
          body: doses,
          tag: `peptideref-${localDate}-${time.replace(":", "")}`,
        }));
        await supabase.from("notification_log").insert(
          groupSlots.map((s) => ({
            user_id: sub.user_id,
            entry_id: s.entry.id,
            sent_date: localDate,
            reminder_slot: s.slot,
          })),
        );
        console.log(`✅ ${sub.user_id}: ${doses}`);
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        console.error(`❌ Push failed [${e.statusCode}]: ${e.message}`);
        if (e.statusCode === 410) {
          await supabase.from("push_subscriptions")
            .update({ is_active: false })
            .eq("user_id", sub.user_id);
        }
      }
    }
  }

  return new Response("OK", { status: 200 });
});
