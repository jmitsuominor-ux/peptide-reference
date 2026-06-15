import { supabase } from './supabase-client.js';
import { currentUser, signOut } from './auth.js';
import { STACKS, PEPTIDES } from './utils.js';

// ─── Frequency helpers ────────────────────────────────────
function parseFrequency(txt) {
  const s = (txt || '').toLowerCase();
  if (s.includes('as-needed') || s.includes('as needed')) return 'as_needed';
  if (s.includes('once weekly') || s.includes('once per week') || (s.includes('weekly') && !s.includes('2x') && !s.includes('3x'))) return 'weekly';
  if (s.includes('3x') || s.includes('three times')) return 'three_weekly';
  if (s.includes('2x') || s.includes('twice') || s.includes('two times')) return 'twice_weekly';
  return 'daily';
}

function defaultDays(freq) {
  if (freq === 'twice_weekly')  return [1, 4]; // Mon, Thu
  if (freq === 'three_weekly')  return [1, 3, 5]; // Mon, Wed, Fri
  if (freq === 'weekly')        return [1]; // Mon
  return null;
}

function parseReminderTime(txt) {
  const s = (txt || '').toLowerCase();
  if (s.includes('before bed') || s.includes('bedtime') || s.includes('evening') || s.includes('night')) return '21:00';
  if (s.includes('am') || s.includes('morning')) return '08:00';
  if (s.includes('midday') || s.includes('noon')) return '12:00';
  if (s.includes('pre-workout') || s.includes('post-workout')) return '17:00';
  return '20:00';
}

function isDueToday(entry) {
  if (entry.frequency === 'as_needed') return false;
  if (entry.frequency === 'daily') return true;
  const dow = new Date().getDay();
  return (entry.days_of_week || []).includes(dow);
}

function daysBetween(dateStr) {
  const start = new Date(dateStr);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.floor((today - start) / 86400000) + 1;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function freqLabel(freq, days) {
  if (freq === 'daily') return 'Daily';
  if (freq === 'as_needed') return 'As needed';
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const d = (days || []).map(i => dayNames[i]).join(', ');
  return d || freq;
}

// ─── Supabase CRUD ────────────────────────────────────────
export async function createProtocol(stackIdx, tier, overrides = {}) {
  const stack = STACKS[parseInt(stackIdx)];
  if (!stack || !currentUser) throw new Error('Invalid stack or not signed in');

  const { data: sched, error: sErr } = await supabase
    .from('schedules')
    .insert({
      user_id: currentUser.id,
      name: stack.name,
      stack_name: stack.name,
      tier,
      start_date: todayStr(),
      cycle_weeks: parseInt(stack.cycle) || 12,
    })
    .select().single();
  if (sErr) throw sErr;

  const entries = stack.peptides.map(p => {
    const freq = parseFrequency(p.schedule || '');
    const ov = overrides[p.name] || {};
    return {
      schedule_id: sched.id,
      user_id: currentUser.id,
      compound_name: p.name,
      dose: p[tier] || p.mid,
      schedule_text: p.schedule || '',
      frequency: freq,
      days_of_week: ov.daysOfWeek !== undefined ? ov.daysOfWeek : defaultDays(freq),
      reminder_time: ov.reminderTime || parseReminderTime(p.schedule || ''),
      reminder_time_2: ov.reminderTime2 || null,
    };
  });

  const { error: eErr } = await supabase.from('schedule_entries').insert(entries);
  if (eErr) throw eErr;
  return sched;
}

async function createCustomProtocol(name, compounds) {
  if (!currentUser) throw new Error('Not signed in');
  const { data: sched, error: sErr } = await supabase
    .from('schedules')
    .insert({
      user_id: currentUser.id,
      name: name || 'Custom Protocol',
      stack_name: null,
      tier: 'mid',
      start_date: todayStr(),
      cycle_weeks: 12,
    })
    .select().single();
  if (sErr) throw sErr;

  const entries = compounds.map(c => ({
    schedule_id: sched.id,
    user_id: currentUser.id,
    compound_name: c.name,
    dose: `${c.dose} ${c.unit}`,
    schedule_text: c.freq,
    frequency: c.freq,
    days_of_week: (c.freq !== 'daily' && c.freq !== 'as_needed') ? c.days : null,
    reminder_time: c.reminderTime || '20:00',
    reminder_time_2: c.reminderTime2 || null,
  }));

  const { error: eErr } = await supabase.from('schedule_entries').insert(entries);
  if (eErr) throw eErr;
  return sched;
}

async function loadTodayData() {
  const [entriesRes, logsRes] = await Promise.all([
    supabase
      .from('schedule_entries')
      .select('*, schedules!inner(name, stack_name, start_date, is_active)')
      .eq('user_id', currentUser.id)
      .eq('is_active', true)
      .eq('schedules.is_active', true),
    supabase
      .from('injection_log')
      .select('entry_id, slot')
      .eq('user_id', currentUser.id)
      .eq('scheduled_for', todayStr()),
  ]);
  const entries = (entriesRes.data || []).filter(isDueToday);
  const loggedIds = new Set((logsRes.data || []).map(l => `${l.entry_id}:${l.slot ?? 1}`));
  return { entries, loggedIds };
}

async function loadProtocols() {
  const { data, error } = await supabase
    .from('schedules')
    .select('*, schedule_entries(compound_name, frequency, dose, is_active)')
    .eq('user_id', currentUser.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function logInjection(entryId, compoundName, dose, slot = 1) {
  const { error } = await supabase.from('injection_log').insert({
    user_id: currentUser.id,
    entry_id: entryId,
    compound_name: compoundName,
    dose,
    scheduled_for: todayStr(),
    slot,
  });
  if (error) throw error;
}

export async function unlogInjection(entryId, slot = 1) {
  const { error } = await supabase
    .from('injection_log')
    .delete()
    .eq('user_id', currentUser.id)
    .eq('entry_id', entryId)
    .eq('scheduled_for', todayStr())
    .eq('slot', slot);
  if (error) throw error;
}

export async function endProtocol(scheduleId) {
  const { error } = await supabase
    .from('schedules')
    .update({ is_active: false })
    .eq('id', scheduleId)
    .eq('user_id', currentUser.id);
  if (error) throw error;
}

export async function deleteProtocol(scheduleId) {
  // Delete entries first, then the schedule
  await supabase.from('injection_log').delete().eq('user_id', currentUser.id)
    .in('entry_id', (await supabase.from('schedule_entries').select('id').eq('schedule_id', scheduleId)).data?.map(e => e.id) || []);
  await supabase.from('schedule_entries').delete().eq('schedule_id', scheduleId).eq('user_id', currentUser.id);
  const { error } = await supabase.from('schedules').delete().eq('id', scheduleId).eq('user_id', currentUser.id);
  if (error) throw error;
}

// ─── Rendering ────────────────────────────────────────────
export async function renderSchedulePage() {
  const authDiv  = document.getElementById('schedAuth');
  const mainDiv  = document.getElementById('schedMain');
  if (!authDiv || !mainDiv) return;

  if (!currentUser) {
    authDiv.style.display  = '';
    mainDiv.style.display  = 'none';
    renderAuthPrompt();
    return;
  }

  authDiv.style.display = 'none';
  mainDiv.style.display = '';
  await refreshScheduleMain();
}

function renderAuthPrompt() {
  const el = document.getElementById('schedAuth');
  el.innerHTML = `
    <div class="clin-header" style="margin-bottom:12px;">
      <div>
        <div class="ch-title">My Schedule</div>
        <div class="ch-sub">Track injections · Log doses · Stay on protocol</div>
      </div>
      <div class="ch-badge">SCHEDULE</div>
    </div>
    <div class="sched-hero">
      <div class="sched-hero-icon">🔔</div>
      <div class="sched-hero-title">Track Your Protocol</div>
      <div class="sched-hero-sub">Create an account to save your injection schedule, log your doses, and track your cycle progress.</div>
      <button class="calc-btn" onclick="openAuthModal('signup')">Create Free Account</button>
      <div style="margin-top:10px;">
        <button class="sched-text-btn" onclick="openAuthModal('signin')">Already have an account? Sign in</button>
      </div>
    </div>
  `;
}

const VAPID_PUBLIC_KEY = 'BK6F1yxg0-NkYEsy9p-Z5eoNAyZZzBOeB8iOb-qC_TAPEG7rDyKz3nwTpT5USmPYqXK370iA1jljYULoZ7QMTVI';

function _urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function _getPushReg() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  return navigator.serviceWorker.getRegistration('/peptide-reference/');
}

async function getSubscriptionStatus() {
  try {
    if (Notification?.permission === 'denied') return 'denied';
    const reg = await _getPushReg();
    if (!reg) return 'unsupported';
    const sub = await reg.pushManager.getSubscription();
    return sub ? 'subscribed' : 'default';
  } catch {
    return 'unsupported';
  }
}

async function refreshScheduleMain() {
  const mainDiv = document.getElementById('schedMain');
  const status = await getSubscriptionStatus();
  const notifHtml = status === 'subscribed'
    ? `<span style="color:var(--green);font-weight:600;">✅ Reminders on</span> — you'll be notified at each dose time. <button class="sched-text-btn" style="font-size:11px;padding:3px 8px;border:1px solid var(--border2);border-radius:6px;background:var(--bg2);margin-left:6px;" onclick="enableReminders()">Re-enable</button>`
    : status === 'denied'
    ? `<span style="color:var(--text3);">Notifications blocked — allow them in browser/OS settings to enable reminders.</span>`
    : status === 'unsupported'
    ? `<span style="color:var(--text3);">Push notifications not supported. On iPhone, add this page to your Home Screen first.</span>`
    : `<button class="sched-text-btn" style="font-size:13px;padding:6px 14px;border:1px solid var(--border2);border-radius:8px;background:var(--bg2);" onclick="enableReminders()">🔔 Enable Reminders</button><span style="color:var(--text3);font-size:12px;margin-left:8px;">Get notified at each dose time</span>`;
  mainDiv.innerHTML = `
    <div class="clin-header" style="margin-bottom:12px;">
      <div>
        <div class="ch-title">My Schedule</div>
        <div class="ch-sub" style="font-family:'IBM Plex Mono',monospace;">${currentUser.email}</div>
      </div>
      <button class="sched-signout-btn" onclick="schedSignOut()">Sign out</button>
    </div>
    <div id="schedTodaySection"></div>
    <div id="schedProtosSection"></div>
    <button class="sched-add-btn" onclick="openAddProtoModal()">＋ Add Protocol</button>
    <div class="disclaimer" style="margin-top:12px;">
      <strong>Reminders:</strong> ${notifHtml}
    </div>
  `;
  await Promise.all([renderToday(), renderProtocols()]);
}

export async function enableReminders() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications not supported.\n\nMake sure you are using the Home Screen app (not Safari).');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { await refreshScheduleMain(); return; }

    const reg = await navigator.serviceWorker.ready;
    let sub;
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: _urlB64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    } catch (_keyErr) {
      // Key mismatch from old subscription — unsubscribe then retry
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: _urlB64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const tzOffset = new Date().getTimezoneOffset();
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: currentUser.id,
      subscription: JSON.stringify(sub.toJSON()),
      timezone_offset: tzOffset,
      is_active: true,
    }, { onConflict: 'user_id' });
    if (error) throw error;
    alert('✅ Reminders enabled! You\'ll get a notification at each dose time.');
  } catch (err) {
    alert('Could not enable reminders: ' + (err.message || err));
  }
  await refreshScheduleMain();
}

async function renderToday() {
  const el = document.getElementById('schedTodaySection');
  if (!el) return;
  el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text3);font-size:12px;">Loading...</div>`;
  try {
    const { entries, loggedIds } = await loadTodayData();
    if (entries.length === 0) {
      el.innerHTML = `
        <div class="sched-section">
          <div class="sched-section-hdr">
            <div class="sched-section-title">Today · ${todayLabel()}</div>
          </div>
          <div class="sched-empty">
            <div class="sched-empty-icon">✅</div>
            <div class="sched-empty-text">Nothing scheduled today</div>
            <div class="sched-empty-sub">Add a protocol to start tracking</div>
          </div>
        </div>`;
      return;
    }
    // Group by reminder_time (and reminder_time_2 for twice-daily entries)
    const groups = {};
    entries.forEach(e => {
      const t = e.reminder_time || '20:00';
      if (!groups[t]) groups[t] = [];
      groups[t].push({ ...e, _slot: 1 });
      if (e.reminder_time_2) {
        if (!groups[e.reminder_time_2]) groups[e.reminder_time_2] = [];
        groups[e.reminder_time_2].push({ ...e, _slot: 2 });
      }
    });
    const sortedTimes = Object.keys(groups).sort();
    const allCards = Object.values(groups).flat();
    const doneCount = allCards.filter(e => loggedIds.has(`${e.id}:${e._slot}`)).length;

    const fmt12 = t => {
      const [h, m] = t.split(':').map(Number);
      const suffix = h < 12 ? 'AM' : 'PM';
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${h12}:${m.toString().padStart(2,'0')} ${suffix}`;
    };
    const timeLabel = t => {
      const [h] = t.split(':').map(Number);
      const labels = { 8:'🌅 Morning', 12:'☀️ Midday', 17:'🏋️ Pre-workout', 20:'🌙 Evening', 21:'🌙 Before bed' };
      return labels[h] || `🕐 ${fmt12(t)}`;
    };

    let html = `
      <div class="sched-section">
        <div class="sched-section-hdr">
          <div class="sched-section-title">Today · ${todayLabel()}</div>
          <div class="sched-progress">${doneCount} / ${allCards.length} done</div>
        </div>`;

    sortedTimes.forEach(t => {
      html += `<div class="sched-time-group"><div class="sched-time-label">${timeLabel(t)} · ${fmt12(t)}</div>`;
      groups[t].forEach(e => {
        const done = loggedIds.has(`${e.id}:${e._slot}`);
        const stackName = e.schedules?.name || '';
        const cardId = e._slot === 2 ? `${e.id}-2` : e.id;
        html += `
          <div class="sched-entry-card${done ? ' done' : ''}" id="entry-card-${cardId}">
            <div class="sched-entry-info">
              <div class="sched-entry-name">${e.compound_name}${e._slot === 2 ? ' <span style="font-size:11px;color:var(--text3);">(2nd dose)</span>' : ''}</div>
              <div class="sched-entry-dose">${e.dose}${stackName ? ' · ' + stackName : ''}</div>
            </div>
            <button class="sched-check-btn${done ? ' done' : ''}" id="check-${cardId}"
              onclick="toggleInjectionLog('${e.id}','${e.compound_name.replace(/'/g,"\\'")}','${(e.dose||'').replace(/'/g,"\\'")}',${done},'${cardId}')">
              ${done ? '✓' : ''}
            </button>
          </div>`;
      });
      html += `</div>`;
    });
    html += `</div>`;
    el.innerHTML = html;
  } catch (err) {
    el.innerHTML = `<div style="color:var(--red);font-size:12px;padding:10px;">Error loading today's schedule</div>`;
  }
}

async function renderProtocols() {
  const el = document.getElementById('schedProtosSection');
  if (!el) return;
  try {
    const protocols = await loadProtocols();
    if (protocols.length === 0) {
      el.innerHTML = `
        <div class="sched-section">
          <div class="sched-section-hdr"><div class="sched-section-title">My Protocols</div></div>
          <div class="sched-empty" style="padding:24px 20px;">
            <div class="sched-empty-text">No active protocols</div>
            <div class="sched-empty-sub">Tap "+ Add Protocol" to get started</div>
          </div>
        </div>`;
      return;
    }
    let html = `<div class="sched-section"><div class="sched-section-hdr"><div class="sched-section-title">My Protocols</div></div>`;
    protocols.forEach(p => {
      if (!p) return;
      const day = daysBetween(p.start_date);
      const total = (p.cycle_weeks || 12) * 7;
      const compounds = Array.isArray(p.schedule_entries)
        ? p.schedule_entries.filter(e => e && e.is_active).map(e => e.compound_name).join(', ')
        : '';
      const tierLabel = p.tier === 'lo' ? '🟢 Low' : p.tier === 'hi' ? '🔴 High' : '🔵 Standard';
      const stack = STACKS.find(s => s && s.name === p.stack_name);
      const emoji = stack?.emoji || '💉';
      const safeName = (p.name || 'Unnamed').replace(/'/g, "\\'");
      html += `
        <div class="sched-proto-card">
          <div class="sched-proto-hdr">
            <span class="sched-proto-emoji">${emoji}</span>
            <div style="flex:1;min-width:0;">
              <div class="sched-proto-name">${p.name || 'Unnamed'}</div>
              <div class="sched-proto-meta">Day ${day} of ${total} · ${tierLabel}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0;">
              <button class="sched-proto-end-btn" style="background:var(--blue-light);border-color:var(--blue);color:var(--blue);" onclick="openEditProtoModal('${p.id}','${safeName}')">Edit</button>
              <button class="sched-proto-end-btn" onclick="confirmEndProtocol('${p.id}','${safeName}')">End</button>
              <button class="sched-proto-end-btn" style="background:var(--red-light);border-color:var(--hi-border);color:var(--red);" onclick="confirmDeleteProtocol('${p.id}','${safeName}')">Delete</button>
            </div>
          </div>
          <div class="sched-proto-compounds">${compounds}</div>
        </div>`;
    });
    html += `</div>`;
    el.innerHTML = html;
  } catch (err) {
    el.innerHTML = `<div style="color:var(--red);font-size:12px;padding:10px;">Protocol load error: ${err.message || err}</div>`;
  }
}

// ─── Auth modal ───────────────────────────────────────────
let _authMode = 'signup';

export function openAuthModal(mode = 'signup') {
  _authMode = mode;
  const modal = document.getElementById('authModal');
  document.getElementById('authEmail').value = '';
  document.getElementById('authPassword').value = '';
  document.getElementById('authError').classList.remove('visible');
  _updateAuthModalText();
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('open'), 10);
}

function _updateAuthModalText() {
  const isSignup = _authMode === 'signup';
  document.getElementById('authModalTitle').textContent = isSignup ? 'Create Account' : 'Sign In';
  document.getElementById('authSubmitBtn').textContent  = isSignup ? 'Create Account' : 'Sign In';
  document.getElementById('authSwitchText').textContent = isSignup ? 'Already have an account?' : "Don't have an account?";
  document.getElementById('authSwitchLabel').textContent = isSignup ? 'Sign In' : 'Create Account';
}

export function toggleAuthMode() {
  _authMode = _authMode === 'signup' ? 'signin' : 'signup';
  _updateAuthModalText();
}

export function closeAuthModal(e) {
  if (e && e.target !== document.getElementById('authModal')) return;
  _closeAuthModal();
}

export function closeAuthModalDirect() { _closeAuthModal(); }

function _closeAuthModal() {
  const modal = document.getElementById('authModal');
  modal.classList.remove('open');
  setTimeout(() => { modal.style.display = 'none'; }, 200);
}

export async function submitAuth() {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const errEl = document.getElementById('authError');
  const btn = document.getElementById('authSubmitBtn');
  errEl.classList.remove('visible');
  if (!email || !password) {
    errEl.textContent = '⚠ Please enter email and password.';
    errEl.classList.add('visible');
    return;
  }
  btn.textContent = '...';
  btn.disabled = true;
  try {
    if (_authMode === 'signup') {
      await import('./auth.js').then(m => m.signUp(email, password));
      errEl.textContent = '✓ Check your email to confirm your account, then sign in.';
      errEl.style.background = 'var(--teal-light)';
      errEl.style.color = 'var(--teal)';
      errEl.style.border = '1px solid var(--lo-border)';
      errEl.classList.add('visible');
      btn.textContent = 'Create Account';
      btn.disabled = false;
    } else {
      await import('./auth.js').then(m => m.signIn(email, password));
      _closeAuthModal();
    }
  } catch (err) {
    errEl.style.background = '';
    errEl.style.color = '';
    errEl.style.border = '';
    errEl.textContent = '⚠ ' + (err.message || 'Authentication failed.');
    errEl.classList.add('visible');
    btn.textContent = _authMode === 'signup' ? 'Create Account' : 'Sign In';
    btn.disabled = false;
  }
}

export async function schedSignOut() {
  await signOut();
}

// ─── Add Protocol modal ───────────────────────────────────
let _addStep = 1;
let _addStackIdx = '';
let _addTier = 'mid';
let _addMode = 'stack'; // 'stack' | 'custom'
let _customCompounds = []; // [{name,dose,unit,freq,reminderTime}]
let _customProtoName = '';

export function addProtoSwitchMode(mode) {
  _addMode = mode;
  _addStep = 1;
  renderAddProtoStep();
}

function _syncCustomFromDOM() {
  _customCompounds.forEach((c, i) => {
    const nameF = document.getElementById(`cf-name-${i}`);
    const doseF = document.getElementById(`cf-dose-${i}`);
    const unitF = document.getElementById(`cf-unit-${i}`);
    const freqF = document.getElementById(`cf-freq-${i}`);
    const timeF = document.getElementById(`cf-time-${i}`);
    const time2Row = document.getElementById(`cf-t2-row-${i}`);
    const time2F = document.getElementById(`cf-time2-${i}`);
    const daysC = document.getElementById(`cf-days-${i}`);
    if (nameF) c.name = nameF.value;
    if (doseF) c.dose = doseF.value;
    if (unitF) c.unit = unitF.value;
    if (freqF) c.freq = freqF.value;
    if (timeF) c.reminderTime = timeF.value;
    c.reminderTime2 = (time2Row?.style.display !== 'none' && time2F?.value) ? time2F.value : null;
    if (daysC) c.days = Array.from(daysC.querySelectorAll('.day-pill.active')).map(el => parseInt(el.dataset.day));
  });
}

export function addCustomCompound() {
  _syncCustomFromDOM();
  _customCompounds.push({ name:'', dose:'', unit:'mcg', freq:'daily', reminderTime:'20:00', days:[1,4] });
  _renderCustomListInPlace();
}

export function removeCustomCompound(idx) {
  _syncCustomFromDOM();
  _customCompounds.splice(idx, 1);
  _renderCustomListInPlace();
}

export function customFreqChanged(idx) {
  const freq = document.getElementById(`cf-freq-${idx}`)?.value;
  const daysRow = document.getElementById(`cf-days-row-${idx}`);
  if (daysRow) daysRow.style.display = (freq === 'daily' || freq === 'as_needed') ? 'none' : 'flex';
}

function _renderCustomListInPlace() {
  const el = document.getElementById('customCompoundList');
  if (el) el.innerHTML = _renderCustomList();
}

function _renderCustomList() {
  const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const DEFAULT_DAYS = { twice_weekly:[1,4], three_weekly:[1,3,5], weekly:[1] };
  const datalist = `<datalist id="peptide-names">${Object.keys(PEPTIDES).map(n => `<option value="${n}">`).join('')}</datalist>`;
  if (_customCompounds.length === 0) {
    return datalist + '<div style="text-align:center;padding:12px;color:var(--text3);font-size:13px;">No compounds added yet.</div>';
  }
  return datalist + _customCompounds.map((c, i) => {
    const isScheduled = c.freq !== 'daily' && c.freq !== 'as_needed';
    const defDays = c.days || DEFAULT_DAYS[c.freq] || [1];
    return `<div class="proto-compound-row" style="margin-bottom:8px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <input type="text" class="calc-input" placeholder="Compound name" value="${c.name}"
          list="peptide-names"
          style="flex:1;font-size:13px;padding:7px 10px;margin-right:8px;"
          id="cf-name-${i}">
        <button type="button" onclick="removeCustomCompound(${i})"
          style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:18px;padding:4px;line-height:1;flex-shrink:0;">✕</button>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:8px;">
        <input type="text" class="calc-input" placeholder="Dose" value="${c.dose}"
          style="flex:1;font-size:13px;padding:7px 10px;"
          id="cf-dose-${i}">
        <select class="calc-select" style="width:80px;font-size:12px;padding:7px 6px;"
          id="cf-unit-${i}">
          <option value="mcg" ${c.unit==='mcg'?'selected':''}>mcg</option>
          <option value="mg" ${c.unit==='mg'?'selected':''}>mg</option>
          <option value="IU" ${c.unit==='IU'?'selected':''}>IU</option>
        </select>
      </div>
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
        <span class="proto-time-label" style="flex-shrink:0;">Frequency:</span>
        <select class="calc-select" style="flex:1;font-size:12px;padding:7px 8px;"
          onchange="customFreqChanged(${i})" id="cf-freq-${i}">
          <option value="daily" ${c.freq==='daily'?'selected':''}>Daily</option>
          <option value="twice_weekly" ${c.freq==='twice_weekly'?'selected':''}>2x / week</option>
          <option value="three_weekly" ${c.freq==='three_weekly'?'selected':''}>3x / week</option>
          <option value="weekly" ${c.freq==='weekly'?'selected':''}>Once / week</option>
          <option value="as_needed" ${c.freq==='as_needed'?'selected':''}>As needed</option>
        </select>
      </div>
      <div id="cf-days-row-${i}" class="proto-time-row" style="display:${isScheduled?'flex':'none'};gap:4px;flex-wrap:wrap;align-items:center;margin-bottom:6px;">
        <span class="proto-time-label">Days:</span>
        <div id="cf-days-${i}" style="display:flex;gap:4px;flex-wrap:wrap;">
          ${DAY_LABELS.map((d,di) =>
            `<button type="button" class="day-pill${defDays.includes(di)?' active':''}" data-day="${di}" onclick="this.classList.toggle('active')">${d}</button>`
          ).join('')}
        </div>
      </div>
      <div class="proto-time-row" style="gap:6px;margin-bottom:4px;">
        <span class="proto-time-label">Reminder 1:</span>
        <input type="time" class="calc-input" value="${c.reminderTime||'20:00'}"
          style="flex:1;font-size:13px;padding:7px 10px;"
          id="cf-time-${i}">
      </div>
      <div id="cf-t2-row-${i}" style="display:${c.reminderTime2 ? 'flex' : 'none'};gap:6px;align-items:center;margin-bottom:4px;">
        <span class="proto-time-label" style="flex-shrink:0;">Reminder 2:</span>
        <input type="time" class="calc-input" id="cf-time2-${i}" value="${c.reminderTime2||'20:00'}"
          style="flex:1;font-size:13px;padding:7px 10px;">
        <button type="button" onclick="document.getElementById('cf-t2-row-${i}').style.display='none';document.getElementById('cf-t2-add-${i}').style.display='block';document.getElementById('cf-time2-${i}').value=''"
          style="background:none;border:none;color:var(--text3);font-size:18px;cursor:pointer;line-height:1;padding:4px;">✕</button>
      </div>
      <div id="cf-t2-add-${i}" style="display:${c.reminderTime2 ? 'none' : 'block'};margin-bottom:4px;">
        <button type="button" onclick="document.getElementById('cf-t2-row-${i}').style.display='flex';document.getElementById('cf-t2-add-${i}').style.display='none'"
          style="background:none;border:none;color:var(--blue);font-size:12px;cursor:pointer;padding:0;">＋ Add 2nd reminder time</button>
      </div>
    </div>`;
  }).join('');
}

export function openAddProtoModal() {
  _addStep = 1;
  _addStackIdx = '';
  _addTier = 'mid';
  _addMode = 'stack';
  _customCompounds = [];
  renderAddProtoStep();
  const modal = document.getElementById('addProtoModal');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('open'), 10);
}

export function closeAddProtoModal(e) {
  if (e && e.target !== document.getElementById('addProtoModal')) return;
  _closeAddProto();
}

export function closeAddProtoModalDirect() { _closeAddProto(); }

function _closeAddProto() {
  const modal = document.getElementById('addProtoModal');
  modal.classList.remove('open');
  setTimeout(() => { modal.style.display = 'none'; }, 200);
}

function renderAddProtoStep() {
  const body = document.getElementById('addProtoBody');
  const modeToggle = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:16px;">
      <button type="button" class="planner-tier-btn${_addMode==='stack'?' active':''}" onclick="addProtoSwitchMode('stack')">📦 Stack</button>
      <button type="button" class="planner-tier-btn${_addMode==='custom'?' active':''}" onclick="addProtoSwitchMode('custom')">✏️ Custom</button>
    </div>`;

  if (_addStep === 1) {
    if (_addMode === 'stack') {
      const options = STACKS.map((s, i) => `<option value="${i}">${s.emoji} ${s.name}</option>`).join('');
      body.innerHTML = `
        <div class="proto-step-header">Add Protocol</div>
        ${modeToggle}
        <div class="calc-field">
          <label class="calc-label">Stack</label>
          <select class="calc-select" id="addProtoStackSel" onchange="addProtoStackChanged()">
            <option value="">— Select a stack —</option>
            ${options}
          </select>
        </div>
        <div id="addProtoStackPreview" style="display:none;background:var(--blue-mid);border-left:3px solid var(--blue);border-radius:6px;padding:10px 12px;font-size:12px;color:var(--text2);line-height:1.5;margin-bottom:12px;"></div>
        <div class="calc-field" style="margin-bottom:16px;">
          <label class="calc-label">Dose Tier</label>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;" id="addProtoTierBtns">
            <div class="planner-tier-btn${_addTier==='lo'?' active':''}" onclick="addProtoSetTier('lo',this)">🟢 Low</div>
            <div class="planner-tier-btn${_addTier==='mid'?' active':''}" onclick="addProtoSetTier('mid',this)">🔵 Standard</div>
            <div class="planner-tier-btn${_addTier==='hi'?' active':''}" onclick="addProtoSetTier('hi',this)">🔴 High</div>
          </div>
        </div>
        <button class="calc-btn" onclick="addProtoNext()" ${_addStackIdx?'':'disabled'} id="addProtoNextBtn">Review Protocol →</button>
      `;
      if (_addStackIdx) {
        const sel = document.getElementById('addProtoStackSel');
        if (sel) sel.value = _addStackIdx;
        const stack = STACKS[parseInt(_addStackIdx)];
        const preview = document.getElementById('addProtoStackPreview');
        if (preview && stack) { preview.textContent = stack.description || stack.goal; preview.style.display = 'block'; }
      }
    } else {
      // Custom mode
      body.innerHTML = `
        <div class="proto-step-header">Add Protocol</div>
        ${modeToggle}
        <div class="calc-field">
          <label class="calc-label">Protocol Name</label>
          <input type="text" class="calc-input" id="customProtoName" placeholder="e.g. My Recovery Stack" value="${_customProtoName||''}">
        </div>
        <div id="customCompoundList" style="margin-bottom:12px;">${_renderCustomList()}</div>
        <button type="button" class="sched-add-btn" style="margin-bottom:16px;" onclick="addCustomCompound()">+ Add Compound</button>
        <div class="calc-error" id="addProtoError"></div>
        <button class="calc-btn" onclick="addProtoSaveCustom()">Start Protocol ✓</button>
      `;
    }
  } else {
    const stack = STACKS[parseInt(_addStackIdx)];
    const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
    const compounds = stack.peptides.map(p => {
      const dose = p[_addTier] || p.mid;
      const freq = parseFrequency(p.schedule || '');
      const time = parseReminderTime(p.schedule || '');
      const id = p.name.replace(/\s+/g,'-').replace(/[()]/g,'');
      const defDays = defaultDays(freq);
      const isScheduled = freq !== 'daily' && freq !== 'as_needed';
      const dayPicker = isScheduled ? `
        <div class="proto-time-row" style="margin-top:8px;gap:4px;flex-wrap:wrap;align-items:center;">
          <span class="proto-time-label">Days:</span>
          <div id="days-${id}" style="display:flex;gap:4px;flex-wrap:wrap;">
            ${DAY_LABELS.map((d,i) =>
              `<button type="button" class="day-pill${defDays && defDays.includes(i) ? ' active' : ''}" data-day="${i}" onclick="this.classList.toggle('active')">${d}</button>`
            ).join('')}
          </div>
        </div>` : '';
      return `
        <div class="proto-compound-row">
          <div class="proto-compound-name">${p.name}</div>
          <div class="proto-compound-dose">${dose} · ${freqLabel(freq, defDays)}</div>
          <div class="proto-time-row" style="margin-bottom:4px;">
            <span class="proto-time-label">Reminder 1:</span>
            <input type="time" class="calc-input" value="${time}"
              style="flex:1;font-size:13px;padding:7px 10px;"
              id="time-${id}">
          </div>
          <div id="time2-row-${id}" style="display:none;gap:6px;align-items:center;margin-bottom:4px;">
            <span class="proto-time-label" style="flex-shrink:0;">Reminder 2:</span>
            <input type="time" class="calc-input" id="time2-${id}" value="${time}"
              style="flex:1;font-size:13px;padding:7px 10px;">
            <button type="button" onclick="document.getElementById('time2-row-${id}').style.display='none';document.getElementById('time2-add-${id}').style.display='block'"
              style="background:none;border:none;color:var(--text3);font-size:18px;cursor:pointer;line-height:1;padding:4px;">✕</button>
          </div>
          <div id="time2-add-${id}" style="margin-bottom:4px;">
            <button type="button" onclick="document.getElementById('time2-row-${id}').style.display='flex';document.getElementById('time2-add-${id}').style.display='none'"
              style="background:none;border:none;color:var(--blue);font-size:12px;cursor:pointer;padding:0;">＋ Add 2nd reminder time</button>
          </div>
          ${dayPicker}
        </div>`;
    }).join('');
    body.innerHTML = `
      <div class="proto-step-header">Step 2 of 2 — Review & Start</div>
      <div style="background:var(--blue-mid);border-left:3px solid var(--blue);border-radius:6px;padding:10px 12px;font-size:12px;color:var(--text2);line-height:1.5;margin-bottom:12px;">
        <strong>${stack.emoji} ${stack.name}</strong> · ${stack.cycle || '12 weeks'}<br>
        <span style="color:var(--text3);">Starting today — ${todayLabel()}</span>
      </div>
      <div style="max-height:40vh;overflow-y:auto;margin-bottom:16px;">${compounds}</div>
      <div class="calc-error" id="addProtoError"></div>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:8px;">
        <button class="calc-btn" style="background:var(--bg);color:var(--text2);border:1px solid var(--border);" onclick="addProtoBack()">← Back</button>
        <button class="calc-btn" id="addProtoSaveBtn" onclick="addProtoSave()">Start Protocol ✓</button>
      </div>
    `;
  }
}

export function addProtoStackChanged() {
  const sel = document.getElementById('addProtoStackSel');
  _addStackIdx = sel.value;
  const preview = document.getElementById('addProtoStackPreview');
  const btn = document.getElementById('addProtoNextBtn');
  if (_addStackIdx === '') {
    preview.style.display = 'none';
    btn.disabled = true;
    return;
  }
  const stack = STACKS[parseInt(_addStackIdx)];
  preview.textContent = stack.description || stack.goal;
  preview.style.display = 'block';
  btn.disabled = false;
}

export function addProtoSetTier(tier, el) {
  _addTier = tier;
  document.querySelectorAll('#addProtoTierBtns .planner-tier-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

export function addProtoNext() {
  if (!_addStackIdx) return;
  _addStep = 2;
  renderAddProtoStep();
}

export function addProtoBack() {
  _addStep = 1;
  renderAddProtoStep();
  // Restore previous selections
  setTimeout(() => {
    const sel = document.getElementById('addProtoStackSel');
    if (sel) { sel.value = _addStackIdx; addProtoStackChanged(); }
    const btns = document.querySelectorAll('#addProtoTierBtns .planner-tier-btn');
    btns.forEach(b => {
      const t = b.textContent.includes('Low') ? 'lo' : b.textContent.includes('High') ? 'hi' : 'mid';
      b.classList.toggle('active', t === _addTier);
    });
  }, 10);
}

export async function addProtoSave() {
  const btn = document.getElementById('addProtoSaveBtn');
  const errEl = document.getElementById('addProtoError');
  btn.textContent = 'Saving...';
  btn.disabled = true;
  errEl.classList.remove('visible');
  try {
    const stack = STACKS[parseInt(_addStackIdx)];
    const overrides = {};
    stack.peptides.forEach(p => {
      const id = p.name.replace(/\s+/g,'-').replace(/[()]/g,'');
      const timeEl = document.getElementById(`time-${id}`);
      const time2Row = document.getElementById(`time2-row-${id}`);
      const time2El = document.getElementById(`time2-${id}`);
      const daysContainer = document.getElementById(`days-${id}`);
      const freq = parseFrequency(p.schedule || '');
      const isScheduled = freq !== 'daily' && freq !== 'as_needed';
      overrides[p.name] = {
        reminderTime: timeEl ? timeEl.value : null,
        reminderTime2: (time2Row?.style.display !== 'none' && time2El?.value) ? time2El.value : null,
        daysOfWeek: isScheduled && daysContainer
          ? Array.from(daysContainer.querySelectorAll('.day-pill.active')).map(el => parseInt(el.dataset.day))
          : null,
      };
    });
    await createProtocol(_addStackIdx, _addTier, overrides);
    _closeAddProto();
    await refreshScheduleMain();
  } catch (err) {
    errEl.textContent = '⚠ ' + (err.message || 'Failed to save protocol.');
    errEl.classList.add('visible');
    btn.textContent = 'Start Protocol ✓';
    btn.disabled = false;
  }
}

export async function addProtoSaveCustom() {
  const nameEl = document.getElementById('customProtoName');
  const errEl = document.getElementById('addProtoError');
  errEl.classList.remove('visible');
  const protoName = nameEl ? nameEl.value.trim() : '';
  // Collect current field values
  _customCompounds.forEach((c, i) => {
    const nameF = document.getElementById(`cf-name-${i}`);
    const doseF = document.getElementById(`cf-dose-${i}`);
    const unitF = document.getElementById(`cf-unit-${i}`);
    const freqF = document.getElementById(`cf-freq-${i}`);
    const timeF = document.getElementById(`cf-time-${i}`);
    const daysC = document.getElementById(`cf-days-${i}`);
    const time2Row = document.getElementById(`cf-t2-row-${i}`);
    const time2F = document.getElementById(`cf-time2-${i}`);
    if (nameF) c.name = nameF.value.trim();
    if (doseF) c.dose = doseF.value.trim();
    if (unitF) c.unit = unitF.value;
    if (freqF) c.freq = freqF.value;
    if (timeF) c.reminderTime = timeF.value;
    c.reminderTime2 = (time2Row?.style.display !== 'none' && time2F?.value) ? time2F.value : null;
    if (daysC) c.days = Array.from(daysC.querySelectorAll('.day-pill.active')).map(el => parseInt(el.dataset.day));
  });
  const valid = _customCompounds.filter(c => c.name && c.dose);
  if (valid.length === 0) {
    errEl.textContent = '⚠ Add at least one compound with a name and dose.';
    errEl.classList.add('visible');
    return;
  }
  const btn = document.querySelector('#addProtoBody .calc-btn:last-child');
  if (btn) { btn.textContent = 'Saving...'; btn.disabled = true; }
  try {
    await createCustomProtocol(protoName, valid);
    _customProtoName = '';
    _customCompounds = [];
    _closeAddProto();
    await refreshScheduleMain();
  } catch (err) {
    errEl.textContent = '⚠ ' + (err.message || 'Failed to save protocol.');
    errEl.classList.add('visible');
    if (btn) { btn.textContent = 'Start Protocol ✓'; btn.disabled = false; }
  }
}

// ─── Inline handlers ──────────────────────────────────────
export async function toggleInjectionLog(entryId, name, dose, wasDone, cardId) {
  const resolvedCardId = cardId || entryId;
  const slot = String(resolvedCardId).endsWith('-2') ? 2 : 1;
  const card = document.getElementById(`entry-card-${resolvedCardId}`);
  const btn  = document.getElementById(`check-${resolvedCardId}`);
  if (!card || !btn) return;
  const nowDone = !wasDone;
  const safeName = name.replace(/'/g, "\\'");
  const safeDose = dose.replace(/'/g, "\\'");

  const applyState = (cid, done) => {
    const c = document.getElementById(`entry-card-${cid}`);
    const b = document.getElementById(`check-${cid}`);
    if (c) c.classList.toggle('done', done);
    if (b) {
      b.classList.toggle('done', done);
      b.textContent = done ? '✓' : '';
      b.setAttribute('onclick', `toggleInjectionLog('${entryId}','${safeName}','${safeDose}',${done},'${cid}')`);
    }
  };

  // Update only this card — each slot is independently checkable
  applyState(resolvedCardId, nowDone);

  try {
    if (nowDone) {
      await logInjection(entryId, name, dose, slot);
    } else {
      await unlogInjection(entryId, slot);
    }
    const section = document.getElementById('schedTodaySection');
    if (section) {
      const doneCards = section.querySelectorAll('.sched-entry-card.done');
      const allCards  = section.querySelectorAll('.sched-entry-card');
      const prog = section.querySelector('.sched-progress');
      if (prog) prog.textContent = `${doneCards.length} / ${allCards.length} done`;
    }
  } catch (err) {
    applyState(resolvedCardId, wasDone);
  }
}

export function confirmDeleteProtocol(id, name) {
  if (!confirm(`Permanently delete "${name}"?\n\nThis will delete the protocol and all its injection history. This cannot be undone.`)) return;
  deleteProtocol(id).then(() => refreshScheduleMain()).catch(err => alert('Delete failed: ' + (err.message || err)));
}

export function confirmEndProtocol(id, name) {
  if (!confirm(`End "${name}"?\n\nThis will remove it from your active protocols. Your injection history will be kept.`)) return;
  endProtocol(id).then(() => refreshScheduleMain()).catch(() => {});
}

// ─── Edit Protocol modal ──────────────────────────────────
let _editScheduleId = null;
let _editScheduleName = '';
let _editEntries = [];

export async function openEditProtoModal(scheduleId, scheduleName = '') {
  _editScheduleId = scheduleId;
  _editScheduleName = scheduleName;
  const { data } = await supabase
    .from('schedule_entries')
    .select('id, compound_name, dose, frequency, reminder_time, reminder_time_2, days_of_week')
    .eq('schedule_id', scheduleId)
    .eq('is_active', true)
    .order('compound_name');
  _editEntries = data || [];

  const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const rows = _editEntries.map((e, i) => {
    const isScheduled = e.frequency !== 'daily' && e.frequency !== 'as_needed';
    const days = e.days_of_week || [];
    return `
      <div style="border-bottom:1px solid var(--border2);padding:14px 0;" id="edit-row-${i}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="font-weight:600;font-size:14px;color:var(--text1);">${e.compound_name}</div>
          <button type="button" onclick="deleteEditEntry(${i})"
            style="font-size:11px;color:var(--red,#e05);background:none;border:none;cursor:pointer;padding:2px 6px;">Remove</button>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:8px;">
          <input type="text" class="calc-input" id="edit-dose-${i}" value="${e.dose||''}"
            placeholder="Dose" style="flex:1;font-size:13px;padding:7px 10px;">
        </div>
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px;">
          <span class="proto-time-label" style="flex-shrink:0;">Reminder 1:</span>
          <input type="time" class="calc-input" id="edit-time-${i}" value="${e.reminder_time||'20:00'}"
            style="flex:1;font-size:13px;padding:7px 10px;">
        </div>
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:${isScheduled ? '8' : '4'}px;">
          <span class="proto-time-label" style="flex-shrink:0;">Reminder 2:</span>
          <input type="time" class="calc-input" id="edit-time2-${i}" value="${e.reminder_time_2||''}"
            style="flex:1;font-size:13px;padding:7px 10px;">
          <span style="font-size:11px;color:var(--text3);flex-shrink:0;">optional</span>
        </div>
        ${isScheduled ? `
        <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;">
          <span class="proto-time-label" style="flex-shrink:0;">Days:</span>
          <div id="edit-days-${i}" style="display:flex;gap:4px;flex-wrap:wrap;">
            ${DAY_LABELS.map((d, di) => `<button type="button" class="day-pill${days.includes(di)?' active':''}" data-day="${di}" onclick="this.classList.toggle('active')">${d}</button>`).join('')}
          </div>
        </div>` : ''}
      </div>`;
  }).join('');

  const existing = document.getElementById('editProtoModal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'editProtoModal';
  modal.className = 'modal-overlay';
  modal.style.cssText = 'display:flex;align-items:flex-end;';
  modal.innerHTML = `
    <div class="modal-box" style="max-height:80vh;overflow-y:auto;border-radius:20px 20px 0 0;">
      <div class="modal-header">
        <div class="modal-title">Edit Protocol</div>
        <button class="modal-close" onclick="closeEditProtoModal()">✕</button>
      </div>
      <div style="padding:0 20px 24px;">
        <div style="margin-bottom:16px;">
          <label style="font-size:12px;font-weight:600;color:var(--text3);margin-bottom:6px;display:block;">Protocol Name</label>
          <input type="text" class="calc-input" id="edit-proto-name" value="${_editScheduleName}"
            placeholder="Protocol name" style="width:100%;font-size:13px;padding:7px 10px;box-sizing:border-box;">
        </div>
        ${rows || '<div style="padding:16px;color:var(--text3);text-align:center;">No compounds found.</div>'}
        <button class="calc-btn" style="width:100%;margin-top:16px;" onclick="saveEditProto()">Save Changes</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('open'), 10);
}

export async function deleteEditEntry(index) {
  const entry = _editEntries[index];
  if (!entry) return;
  if (!confirm(`Remove "${entry.compound_name}" from this protocol?`)) return;
  const { error } = await supabase.from('schedule_entries')
    .update({ is_active: false })
    .eq('id', entry.id)
    .eq('user_id', currentUser.id);
  if (error) { alert('Could not remove: ' + error.message); return; }
  document.getElementById(`edit-row-${index}`)?.remove();
  _editEntries[index] = null;
}

export function closeEditProtoModal() {
  const modal = document.getElementById('editProtoModal');
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => modal.remove(), 250);
}

export async function saveEditProto() {
  const btn = document.querySelector('#editProtoModal .calc-btn');
  if (btn) { btn.textContent = 'Saving...'; btn.disabled = true; }
  try {
    const newName = document.getElementById('edit-proto-name')?.value?.trim();
    if (newName) {
      await supabase.from('schedules')
        .update({ name: newName })
        .eq('id', _editScheduleId)
        .eq('user_id', currentUser.id);
    }
    for (let i = 0; i < _editEntries.length; i++) {
      const entry = _editEntries[i];
      const dose = document.getElementById(`edit-dose-${i}`)?.value || entry.dose;
      const time = document.getElementById(`edit-time-${i}`)?.value || entry.reminder_time;
      const time2 = document.getElementById(`edit-time2-${i}`)?.value || null;
      const isScheduled = entry.frequency !== 'daily' && entry.frequency !== 'as_needed';
      let days = entry.days_of_week;
      if (isScheduled) {
        const container = document.getElementById(`edit-days-${i}`);
        if (container) days = Array.from(container.querySelectorAll('.day-pill.active')).map(el => parseInt(el.dataset.day));
      }
      const { error: updErr } = await supabase.from('schedule_entries')
        .update({ dose, reminder_time: time, reminder_time_2: time2, days_of_week: days })
        .eq('id', entry.id)
        .eq('user_id', currentUser.id);
      if (updErr) throw updErr;
    }
    closeEditProtoModal();
    await refreshScheduleMain();
  } catch (err) {
    alert('Save failed: ' + (err.message || err));
    if (btn) { btn.textContent = 'Save Changes'; btn.disabled = false; }
  }
}

// ─── Auto-refresh today section on new day ────────────────
let _lastRenderedDate = todayStr();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const today = todayStr();
  if (today !== _lastRenderedDate) {
    _lastRenderedDate = today;
    const schedMain = document.getElementById('schedMain');
    if (schedMain && schedMain.style.display !== 'none') {
      renderToday();
    }
  }
});
