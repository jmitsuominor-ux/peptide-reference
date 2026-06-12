// Runs on GitHub Actions cron — queries Supabase for due reminders and sends push notifications.
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const TEST_MODE = process.env.TEST_MODE === 'true';

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
  console.log(`\n=== PeptideRef Push Notification Run ===`);
  console.log(`UTC time: ${nowUtc.toISOString()}`);
  console.log(`Test mode: ${TEST_MODE}`);

  // Get all active push subscriptions
  const { data: subs, error: subsErr } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('is_active', true);

  if (subsErr) { console.error('Failed to load subscriptions:', subsErr.message); process.exit(1); }
  if (!subs?.length) { console.log('No active subscriptions found in push_subscriptions table.'); return; }

  console.log(`Found ${subs.length} active subscription(s)`);

  for (const sub of subs) {
    // Convert UTC to user's local time using their stored timezone offset (minutes behind UTC)
    const localNow = new Date(nowUtc.getTime() - sub.timezone_offset * 60 * 1000);
    const localHour = localNow.getUTCHours();
    const localMinute = localNow.getUTCMinutes();
    const localDow = localNow.getUTCDay();
    const localDate = localNow.toISOString().split('T')[0];
    const localTimeStr = `${String(localHour).padStart(2,'0')}:${String(localMinute).padStart(2,'0')}`;

    console.log(`\nUser ${sub.user_id}: tz_offset=${sub.timezone_offset} → local time ${localTimeStr} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][localDow]})`);

    if (TEST_MODE) {
      // In test mode, send a test ping immediately regardless of schedule
      const payload = JSON.stringify({
        title: '💉 PeptideRef Test',
        body: `Notifications are working! Local time: ${localTimeStr}`,
        tag: `peptideref-test-${Date.now()}`,
      });
      try {
        await webpush.sendNotification(sub.subscription, payload);
        console.log(`  ✅ Test notification sent to user ${sub.user_id}`);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').update({ is_active: false }).eq('id', sub.id);
          console.log(`  ❌ Subscription expired/invalid (${err.statusCode}) — deactivated for user ${sub.user_id}`);
        } else {
          console.error(`  ❌ Push failed for user ${sub.user_id}: [${err.statusCode}] ${err.message}`);
        }
      }
      continue;
    }

    // Load this user's active schedule entries (with schedule active check)
    const { data: entries, error: entErr } = await supabase
      .from('schedule_entries')
      .select('id, compound_name, dose, reminder_time, reminder_time_2, frequency, days_of_week, schedules!inner(is_active)')
      .eq('user_id', sub.user_id)
      .eq('is_active', true)
      .eq('schedules.is_active', true);

    if (entErr) { console.log(`  Error loading entries: ${entErr.message}`); continue; }
    if (!entries?.length) { console.log(`  No active schedule entries for this user`); continue; }

    console.log(`  ${entries.length} active schedule entries`);

    // Expand entries with reminder_time_2 into separate slots
    const WINDOW = 15;
    const nowTotalMin = localHour * 60 + localMinute;
    const slots = [];
    entries.forEach(e => {
      if (!isDueToday(e, localDow)) return;
      [e.reminder_time || '20:00', e.reminder_time_2].filter(Boolean).forEach((rt, slotIdx) => {
        const [h, m] = rt.split(':').map(Number);
        const entryMin = h * 60 + m;
        const inWindow = entryMin >= nowTotalMin && entryMin < nowTotalMin + WINDOW;
        console.log(`    ${e.compound_name} slot${slotIdx+1}: reminder=${rt} (${entryMin}min) | window=${nowTotalMin}-${nowTotalMin+WINDOW} | inWindow=${inWindow}`);
        if (inWindow) slots.push({ entry: e, reminder_time: rt, slot: slotIdx + 1 });
      });
    });

    if (!slots.length) { console.log(`  No entries due in current 15-min window`); continue; }

    console.log(`  ${slots.length} slot(s) due now`);

    // Deduplicate: check which (entry_id, slot) combos were already sent today
    const { data: alreadySent } = await supabase
      .from('notification_log')
      .select('entry_id, reminder_slot')
      .eq('user_id', sub.user_id)
      .eq('sent_date', localDate);

    const sentSet = new Set((alreadySent || []).map(r => `${r.entry_id}:${r.reminder_slot ?? 1}`));
    const toSend = slots.filter(s => !sentSet.has(`${s.entry.id}:${s.slot}`));
    if (!toSend.length) { console.log(`  All due slots already notified today`); continue; }

    // Group by reminder_time
    const groups = {};
    toSend.forEach(s => {
      if (!groups[s.reminder_time]) groups[s.reminder_time] = [];
      groups[s.reminder_time].push(s);
    });

    for (const [time, groupSlots] of Object.entries(groups)) {
      const doses = groupSlots.map(s => `${s.entry.compound_name}: ${s.entry.dose}`).join(' · ');
      const payload = JSON.stringify({
        title: `Time for your peptides 💉`,
        body: doses,
        tag: `peptideref-${localDate}-${time.replace(':', '')}`,
      });

      try {
        await webpush.sendNotification(sub.subscription, payload);
        console.log(`  ✅ Sent: ${doses}`);

        await supabase.from('notification_log').insert(
          groupSlots.map(s => ({ user_id: sub.user_id, entry_id: s.entry.id, sent_date: localDate, reminder_slot: s.slot }))
        );
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').update({ is_active: false }).eq('id', sub.id);
          console.log(`  ❌ Subscription expired (${err.statusCode}) — deactivated`);
        } else {
          console.error(`  ❌ Push failed [${err.statusCode}]: ${err.message}`);
        }
      }
    }
  }

  console.log('\n=== Done ===');
}

main().catch(err => { console.error(err); process.exit(1); });
