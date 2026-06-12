import { supabase } from './supabase-client.js';
import { currentUser, signOut } from './auth.js';
import { STACKS } from './utils.js';

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
  return new Date().toISOString().split('T')[0];
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
      .select('entry_id')
      .eq('user_id', currentUser.id)
      .eq('scheduled_for', todayStr()),
  ]);
  const entries = (entriesRes.data || []).filter(isDueToday);
  const loggedIds = new Set((logsRes.data || []).map(l => l.entry_id));
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

export async function logInjection(entryId, compoundName, dose) {
  const { error } = await supabase.from('injection_log').insert({
    user_id: currentUser.id,
    entry_id: entryId,
    compound_name: compoundName,
    dose,
    scheduled_for: todayStr(),
  });
  if (error) throw error;
}

export async function unlogInjection(entryId) {
  const { error } = await supabase
    .from('injection_log')
    .delete()
    .eq('user_id', currentUser.id)
    .eq('entry_id', entryId)
    .eq('scheduled_for', todayStr());
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

const VAPID_PUBLIC_KEY = 'BMLdIZJowZXPOiSRrawEBFr3ol2h03ZLvdffRc5rQZGmHyhqjsQS85EiwnX2j4UEVQyHYWbqLACQ2DBbUpP3wog';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function getSubscriptionStatus() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission !== 'granted') return 'default';
  // Only wait for SW if permission was already granted
  try {
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, rej) => setTimeout(() => rej(), 2000)),
    ]);
    const existing = await reg.pushManager.getSubscription().catch(() => null);
    return existing ? 'subscribed' : 'default';
  } catch {
    return 'unsupported';
  }
}

async function refreshScheduleMain() {
  const mainDiv = document.getElementById('schedMain');
  const status = await getSubscriptionStatus();
  const notifHtml = status === 'subscribed'
    ? `<span style="color:var(--green);font-weight:600;">✅ Reminders on</span> — you'll be notified at each dose time.`
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
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Push notifications are not supported.\n\nOn iPhone, add this page to your Home Screen first, then try again.');
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') { await refreshScheduleMain(); return; }

  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    const tzOffset = new Date().getTimezoneOffset(); // minutes behind UTC
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: currentUser.id,
      subscription: subscription.toJSON(),
      timezone_offset: tzOffset,
      is_active: true,
    }, { onConflict: 'user_id' });
    if (error) throw error;
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
    const doneCount = entries.filter(e => loggedIds.has(e.id)).length;

    // Group by reminder_time
    const groups = {};
    entries.forEach(e => {
      const t = e.reminder_time || '20:00';
      if (!groups[t]) groups[t] = [];
      groups[t].push(e);
    });
    const sortedTimes = Object.keys(groups).sort();

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
          <div class="sched-progress">${doneCount} / ${entries.length} done</div>
        </div>`;

    sortedTimes.forEach(t => {
      html += `<div class="sched-time-group"><div class="sched-time-label">${timeLabel(t)} · ${fmt12(t)}</div>`;
      groups[t].forEach(e => {
        const done = loggedIds.has(e.id);
        const stackName = e.schedules?.name || '';
        html += `
          <div class="sched-entry-card${done ? ' done' : ''}" id="entry-card-${e.id}">
            <div class="sched-entry-info">
              <div class="sched-entry-name">${e.compound_name}</div>
              <div class="sched-entry-dose">${e.dose}${stackName ? ' · ' + stackName : ''}</div>
            </div>
            <button class="sched-check-btn${done ? ' done' : ''}" id="check-${e.id}"
              onclick="toggleInjectionLog('${e.id}','${e.compound_name.replace(/'/g,"\\'")}','${(e.dose||'').replace(/'/g,"\\'")}',${done})">
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

export function addCustomCompound() {
  _customCompounds.push({ name:'', dose:'', unit:'mcg', freq:'daily', reminderTime:'20:00', days:[1,4] });
  _renderCustomListInPlace();
}

export function removeCustomCompound(idx) {
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
  if (_customCompounds.length === 0) {
    return '<div style="text-align:center;padding:12px;color:var(--text3);font-size:13px;">No compounds added yet.</div>';
  }
  return _customCompounds.map((c, i) => {
    const isScheduled = c.freq !== 'daily' && c.freq !== 'as_needed';
    const defDays = c.days || DEFAULT_DAYS[c.freq] || [1];
    return `<div class="proto-compound-row" style="margin-bottom:8px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <input type="text" class="calc-input" placeholder="Compound name" value="${c.name}"
          style="flex:1;font-size:13px;padding:7px 10px;margin-right:8px;"
          oninput="_customCompounds[${i}].name=this.value" id="cf-name-${i}">
        <button type="button" onclick="removeCustomCompound(${i})"
          style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:18px;padding:4px;line-height:1;flex-shrink:0;">✕</button>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:8px;">
        <input type="text" class="calc-input" placeholder="Dose" value="${c.dose}"
          style="flex:1;font-size:13px;padding:7px 10px;"
          oninput="_customCompounds[${i}].dose=this.value" id="cf-dose-${i}">
        <select class="calc-select" style="width:80px;font-size:12px;padding:7px 6px;"
          onchange="_customCompounds[${i}].unit=this.value" id="cf-unit-${i}">
          <option value="mcg" ${c.unit==='mcg'?'selected':''}>mcg</option>
          <option value="mg" ${c.unit==='mg'?'selected':''}>mg</option>
          <option value="IU" ${c.unit==='IU'?'selected':''}>IU</option>
        </select>
      </div>
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
        <span class="proto-time-label" style="flex-shrink:0;">Frequency:</span>
        <select class="calc-select" style="flex:1;font-size:12px;padding:7px 8px;"
          onchange="_customCompounds[${i}].freq=this.value;customFreqChanged(${i})" id="cf-freq-${i}">
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
      <div class="proto-time-row" style="gap:6px;">
        <span class="proto-time-label">Reminder:</span>
        <input type="time" class="calc-input" value="${c.reminderTime||'20:00'}"
          style="flex:1;font-size:13px;padding:7px 10px;"
          onchange="_customCompounds[${i}].reminderTime=this.value" id="cf-time-${i}">
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
          <div class="proto-time-row">
            <span class="proto-time-label">Reminder:</span>
            <input type="time" class="calc-input" value="${time}"
              style="flex:1;font-size:13px;padding:7px 10px;"
              id="time-${id}">
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
      const daysContainer = document.getElementById(`days-${id}`);
      const freq = parseFrequency(p.schedule || '');
      const isScheduled = freq !== 'daily' && freq !== 'as_needed';
      overrides[p.name] = {
        reminderTime: timeEl ? timeEl.value : null,
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
    if (nameF) c.name = nameF.value.trim();
    if (doseF) c.dose = doseF.value.trim();
    if (unitF) c.unit = unitF.value;
    if (freqF) c.freq = freqF.value;
    if (timeF) c.reminderTime = timeF.value;
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
export async function toggleInjectionLog(entryId, name, dose, wasDone) {
  const card = document.getElementById(`entry-card-${entryId}`);
  const btn  = document.getElementById(`check-${entryId}`);
  if (!card || !btn) return;
  // Optimistic UI update
  const nowDone = !wasDone;
  card.classList.toggle('done', nowDone);
  btn.classList.toggle('done', nowDone);
  btn.textContent = nowDone ? '✓' : '';
  btn.setAttribute('onclick', `toggleInjectionLog('${entryId}','${name.replace(/'/g,"\\'")}','${dose.replace(/'/g,"\\'")}',${nowDone})`);
  try {
    if (nowDone) {
      await logInjection(entryId, name, dose);
    } else {
      await unlogInjection(entryId);
    }
    // Update progress counter
    const section = document.getElementById('schedTodaySection');
    if (section) {
      const cards = section.querySelectorAll('.sched-entry-card');
      const doneCards = section.querySelectorAll('.sched-entry-card.done');
      const prog = section.querySelector('.sched-progress');
      if (prog) prog.textContent = `${doneCards.length} / ${cards.length} done`;
    }
  } catch (err) {
    // Revert on error
    card.classList.toggle('done', wasDone);
    btn.classList.toggle('done', wasDone);
    btn.textContent = wasDone ? '✓' : '';
    btn.setAttribute('onclick', `toggleInjectionLog('${entryId}','${name.replace(/'/g,"\\'")}','${dose.replace(/'/g,"\\'")}',${wasDone})`);
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
