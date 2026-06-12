// Runs on GitHub Actions cron — queries Supabase for due reminders and sends push notifications.
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function isDueToday(entry, localDow) {
  const freq = entry.frequency;
  if (freq === 'as_needed') return false;
  if (freq === 'daily') return true;
  const days = entry.days_of_week;
  return Array.isArray(days) && days.includes(localDow);
}

async function main() {
  const nowUtc = new Date();

  // Get all active push subscriptions
  const { data: subs, error: subsErr } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('is_active', true);

  if (subsErr) { console.error('Failed to load subscriptions:', subsErr.message); process.exit(1); }
  if (!subs?.length) { console.log('No active subscriptions'); return; }

  console.log(`Processing ${subs.length} subscriptions`);

  for (const sub of subs) {
    // Convert UTC to user's local time using their stored timezone offset (minutes behind UTC)
    const localNow = new Date(nowUtc.getTime() - sub.timezone_offset * 60 * 1000);
    const localHour = localNow.getUTCHours();
    const localMinute = localNow.getUTCMinutes();
    const localDow = localNow.getUTCDay();
    const localDate = localNow.toISOString().split('T')[0];

    // Load this user's active schedule entries (with schedule active check)
    const { data: entries } = await supabase
      .from('schedule_entries')
      .select('id, compound_name, dose, reminder_time, frequency, days_of_week, schedules!inner(is_active)')
      .eq('user_id', sub.user_id)
      .eq('is_active', true)
      .eq('schedules.is_active', true);

    if (!entries?.length) continue;

    // Find entries whose reminder_time falls within a 15-minute window of now
    const WINDOW = 15;
    const nowTotalMin = localHour * 60 + localMinute;
    const due = entries.filter(e => {
      if (!isDueToday(e, localDow)) return false;
      const [h, m] = (e.reminder_time || '20:00').split(':').map(Number);
      const entryMin = h * 60 + m;
      return entryMin >= nowTotalMin && entryMin < nowTotalMin + WINDOW;
    });

    if (!due.length) continue;

    // Deduplicate against already-sent today (prevents double-fire if Actions runs twice in window)
    const entryIds = due.map(e => e.id);
    const { data: alreadySent } = await supabase
      .from('notification_log')
      .select('entry_id')
      .eq('user_id', sub.user_id)
      .eq('sent_date', localDate)
      .in('entry_id', entryIds);

    const sentSet = new Set((alreadySent || []).map(r => r.entry_id));
    const toSend = due.filter(e => !sentSet.has(e.id));
    if (!toSend.length) continue;

    // Group by reminder_time so we send one notification per time slot
    const groups = {};
    toSend.forEach(e => {
      const key = e.reminder_time || '20:00';
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });

    for (const [time, groupEntries] of Object.entries(groups)) {
      const names = groupEntries.map(e => e.compound_name).join(', ');
      const doses = groupEntries.map(e => `${e.compound_name}: ${e.dose}`).join(' · ');
      const payload = JSON.stringify({
        title: `Time for your peptides 💉`,
        body: doses,
        tag: `peptideref-${localDate}-${time.replace(':', '')}`,
      });

      try {
        await webpush.sendNotification(sub.subscription, payload);
        console.log(`Sent to user ${sub.user_id}: ${names}`);

        // Log so we don't resend
        await supabase.from('notification_log').insert(
          groupEntries.map(e => ({ user_id: sub.user_id, entry_id: e.id, sent_date: localDate }))
        );
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired — deactivate
          await supabase.from('push_subscriptions').update({ is_active: false }).eq('id', sub.id);
          console.log(`Deactivated expired subscription for user ${sub.user_id}`);
        } else {
          console.error(`Push failed for user ${sub.user_id}:`, err.message);
        }
      }
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
