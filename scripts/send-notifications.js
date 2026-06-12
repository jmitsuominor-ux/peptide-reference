// Runs on GitHub Actions cron — queries Supabase for due reminders and sends push notifications via OneSignal.
const { createClient } = require('@supabase/supabase-js');

const TEST_MODE = process.env.TEST_MODE === 'true';
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function sendPush(subscriptionId, title, body, tag) {
  const res = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${ONESIGNAL_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_subscription_uuids: [subscriptionId],
      contents: { en: body },
      headings: { en: title },
      web_push_topic: tag,
    }),
  });
  const data = await res.json();
  if (data.errors?.length) throw new Error(data.errors.join(', '));
  return data;
}

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

  const { data: subs, error: subsErr } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('is_active', true);

  if (subsErr) { console.error('Failed to load subscriptions:', subsErr.message); process.exit(1); }
  if (!subs?.length) { console.log('No active subscriptions found.'); return; }

  // Only process OneSignal subscription UUIDs (strings), skip legacy raw push subscription objects
  const validSubs = subs.filter(s => typeof s.subscription === 'string' && s.subscription.length > 10);
  console.log(`Found ${validSubs.length} valid subscription(s) (${subs.length} total)`);

  for (const sub of validSubs) {
    const localNow = new Date(nowUtc.getTime() - sub.timezone_offset * 60 * 1000);
    const localHour = localNow.getUTCHours();
    const localMinute = localNow.getUTCMinutes();
    const localDow = localNow.getUTCDay();
    const localDate = localNow.toISOString().split('T')[0];
    const localTimeStr = `${String(localHour).padStart(2,'0')}:${String(localMinute).padStart(2,'0')}`;

    console.log(`\nUser ${sub.user_id}: tz_offset=${sub.timezone_offset} → local time ${localTimeStr} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][localDow]})`);

    if (TEST_MODE) {
      try {
        await sendPush(sub.subscription, '💉 PeptideRef Test', `Notifications are working! Local time: ${localTimeStr}`, `peptideref-test-${Date.now()}`);
        console.log(`  ✅ Test notification sent`);
      } catch (err) {
        console.error(`  ❌ Push failed: ${err.message}`);
      }
      continue;
    }

    const { data: entries, error: entErr } = await supabase
      .from('schedule_entries')
      .select('id, compound_name, dose, reminder_time, reminder_time_2, frequency, days_of_week, schedules!inner(is_active)')
      .eq('user_id', sub.user_id)
      .eq('is_active', true)
      .eq('schedules.is_active', true);

    if (entErr) { console.log(`  Error loading entries: ${entErr.message}`); continue; }
    if (!entries?.length) { console.log(`  No active schedule entries`); continue; }

    const WINDOW = 15;
    const nowTotalMin = localHour * 60 + localMinute;
    const slots = [];
    entries.forEach(e => {
      if (!isDueToday(e, localDow)) return;
      [e.reminder_time || '20:00', e.reminder_time_2].filter(Boolean).forEach((rt, slotIdx) => {
        const [h, m] = rt.split(':').map(Number);
        const inWindow = (h * 60 + m) >= nowTotalMin && (h * 60 + m) < nowTotalMin + WINDOW;
        if (inWindow) slots.push({ entry: e, reminder_time: rt, slot: slotIdx + 1 });
      });
    });

    if (!slots.length) { console.log(`  No entries due in current 15-min window`); continue; }

    const { data: alreadySent } = await supabase
      .from('notification_log').select('entry_id, reminder_slot')
      .eq('user_id', sub.user_id).eq('sent_date', localDate);
    const sentSet = new Set((alreadySent || []).map(r => `${r.entry_id}:${r.reminder_slot ?? 1}`));
    const toSend = slots.filter(s => !sentSet.has(`${s.entry.id}:${s.slot}`));
    if (!toSend.length) { console.log(`  All due slots already notified today`); continue; }

    const groups = {};
    toSend.forEach(s => { (groups[s.reminder_time] = groups[s.reminder_time] || []).push(s); });

    for (const [time, groupSlots] of Object.entries(groups)) {
      const doses = groupSlots.map(s => `${s.entry.compound_name}: ${s.entry.dose}`).join(' · ');
      try {
        await sendPush(sub.subscription, `Time for your peptides 💉`, doses, `peptideref-${localDate}-${time.replace(':', '')}`);
        console.log(`  ✅ Sent: ${doses}`);
        await supabase.from('notification_log').insert(
          groupSlots.map(s => ({ user_id: sub.user_id, entry_id: s.entry.id, sent_date: localDate, reminder_slot: s.slot }))
        );
      } catch (err) {
        console.error(`  ❌ Push failed: ${err.message}`);
      }
    }
  }

  console.log('\n=== Done ===');
}

main().catch(err => { console.error(err); process.exit(1); });
