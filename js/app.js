// ═══════════════════════════════════════════════════════
// APP — event handlers, calculators, init
// Entry point: imported as <script type="module" src="js/app.js">
// ═══════════════════════════════════════════════════════
import { AppState } from './state.js?v=2';
import { TRANSLATIONS } from './data/translations.js';
import { STACKS } from './utils.js';
import { t, parseDoseToMgPerWeek, getCommonVialSize, computeVialCount, getStackData, PEPTIDES } from './utils.js';
import {
  renderCategories, showList, showDetail, toggleSec,
  renderStacks, showStackDetail,
  activatePage, goToProfile, switchToStack,
  navBack, navForward, navToDetail, captureNavState, restoreNavState,
  renderRecentFav,
  toggleCompare, clearCompare, openCompare, closeCompare,
  swipeNextCompound, swipePrevCompound,
} from './ui.js?v=2';
import { toggleFavorite } from './storage.js';
import { initAuth, signOut } from './auth.js';
import {
  renderSchedulePage,
  openAuthModal, closeAuthModal, closeAuthModalDirect, toggleAuthMode, submitAuth, schedSignOut,
  openAddProtoModal, closeAddProtoModal, closeAddProtoModalDirect,
  addProtoStackChanged, addProtoSetTier, addProtoNext, addProtoBack, addProtoSave,
  addProtoSwitchMode, addCustomCompound, removeCustomCompound, customFreqChanged, customNameChanged, addProtoSaveCustom,
  toggleInjectionLog, confirmEndProtocol, confirmDeleteProtocol, enableReminders,
  openEditProtoModal, closeEditProtoModal, saveEditProto, deleteEditEntry, editFreqChanged,
  openAddToProtoSheet, closeAddToProtoSheet,
} from './scheduler.js?v=11';

// ─── Expose UI fns for inline onclick= handlers in generated HTML ─
// tapFavorite: toggles, updates the star button inline, refreshes the chips
window.tapFavorite = function(name, btn) {
  const nowFav = toggleFavorite(name);
  btn.textContent = nowFav ? '⭐' : '☆';
  btn.classList.toggle('active', nowFav);
  renderRecentFav();
};

Object.assign(window, {
  showList, showDetail, navToDetail, toggleSec, showStackDetail,
  goToProfile, switchToStack, activatePage,
  toggleCompare, clearCompare, openCompare, closeCompare,
  swipeNextCompound, swipePrevCompound,
  calculateRecon, calculateVials, showCalcError,
  reconAutoCalc, vialsAutoCalc, presetPeptide, switchVialMode, toggleCalcSection,
  vialsCopy, reconCopy, plannerCopy,
  calcQuickVials, qvAutoCalc, qvCopy,
  plannerSetTier, plannerLoadStack, plannerCalculate,
  // Schedule / auth
  renderSchedulePage,
  openAuthModal, closeAuthModal, closeAuthModalDirect, toggleAuthMode, submitAuth, schedSignOut,
  openAddProtoModal, closeAddProtoModal, closeAddProtoModalDirect,
  addProtoStackChanged, addProtoSetTier, addProtoNext, addProtoBack, addProtoSave,
  addProtoSwitchMode, addCustomCompound, removeCustomCompound, customFreqChanged, customNameChanged, addProtoSaveCustom,
  toggleInjectionLog, confirmEndProtocol, confirmDeleteProtocol, enableReminders,
  openEditProtoModal, closeEditProtoModal, saveEditProto, deleteEditEntry, editFreqChanged,
  openAddToProtoSheet, closeAddToProtoSheet,
  toggleAuthPw,
});

function toggleAuthPw() {
  const input = document.getElementById('authPassword');
  const btn = document.getElementById('authPwEye');
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.textContent = show ? '🙈' : '👁';
}

// ─── i18n ────────────────────────────────────────────────
function tr(key) { return t(key, AppState.lang); }

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = tr(el.dataset.i18n);
    if (val) el.innerHTML = val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const val = tr(el.dataset.i18nPlaceholder);
    if (val) el.placeholder = val;
  });
  const btn = document.getElementById('langBtn');
  if (btn) {
    btn.textContent = AppState.lang === 'en' ? '🇲🇽' : '🇺🇸';
    btn.classList.toggle('es-active', AppState.lang === 'es');
  }
  document.documentElement.lang = AppState.lang;
  renderCategories();
  renderStacks();
}

function toggleLang() {
  AppState.lang = AppState.lang === 'en' ? 'es' : 'en';
  applyTranslations();
  if (document.getElementById('detailView').style.display !== 'none') {
    const name = document.getElementById('detailTitle').textContent;
    if (name) showDetail(name);
  }
  if (document.getElementById('stackDetailView').style.display !== 'none') {
    if (AppState.originStackIdx !== null) showStackDetail(AppState.originStackIdx, true);
  }
}

// ─── Quick vial calculator (inside compound detail) ───────
function calcQuickVials() {
  const dose = parseFloat(document.getElementById('qvDose').value);
  const doseUnit = document.getElementById('qvDoseUnit').value;
  const vialSize = parseFloat(document.getElementById('qvVialSize').value);
  const injectDay = parseFloat(document.getElementById('qvInjectDay').value) || 1;
  const daysWk = parseFloat(document.getElementById('qvDaysWk').value) || 7;
  const weeks = parseFloat(document.getElementById('qvWeeks').value);
  const errEl = document.getElementById('qvError');
  const resEl = document.getElementById('qvResult');
  errEl.textContent = '';
  errEl.classList.remove('visible');
  resEl.classList.remove('visible');
  if (!dose || dose <= 0) { errEl.textContent = '⚠ Enter a dose.'; errEl.classList.add('visible'); return; }
  if (!vialSize || vialSize <= 0) { errEl.textContent = '⚠ Enter vial size (mg).'; errEl.classList.add('visible'); return; }
  if (!weeks || weeks <= 0) { errEl.textContent = '⚠ Enter cycle length.'; errEl.classList.add('visible'); return; }
  const doseMg = doseUnit === 'mcg' ? dose / 1000 : dose;
  const { totalDoses, totalMg, vialsNeeded, leftover } = computeVialCount({
    doseMg, injectionsPerDay: injectDay, daysPerWeek: daysWk, weeks, vialSizeMg: vialSize,
  });
  document.getElementById('qvCount').textContent = vialsNeeded + (vialsNeeded === 1 ? ' vial' : ' vials');
  document.getElementById('qvSub').textContent = totalMg.toFixed(2) + 'mg total · ' + vialSize + 'mg vials';
  document.getElementById('qvTotalDoses').textContent = totalDoses + ' injections';
  document.getElementById('qvLeftover').textContent = leftover > 0.01 ? leftover.toFixed(2) + ' mg' : 'None';
  resEl.classList.add('visible');
}

function qvAutoCalc() {
  const dose = parseFloat(document.getElementById('qvDose').value);
  const vialSize = parseFloat(document.getElementById('qvVialSize').value);
  const weeks = parseFloat(document.getElementById('qvWeeks').value);
  if (dose > 0 && vialSize > 0 && weeks > 0) {
    calcQuickVials();
  } else {
    document.getElementById('qvError').classList.remove('visible');
    document.getElementById('qvResult').classList.remove('visible');
  }
}

async function qvCopy() {
  const resEl = document.getElementById('qvResult');
  if (!resEl.classList.contains('visible')) { calcQuickVials(); }
  if (!resEl.classList.contains('visible')) return;
  const name    = (document.getElementById('detailTitle') || document.getElementById('stackDetailTitle'))?.textContent?.trim() || 'Compound';
  const dose    = document.getElementById('qvDose').value;
  const unit    = document.getElementById('qvDoseUnit').value;
  const vialSz  = document.getElementById('qvVialSize').value;
  const injectD = parseFloat(document.getElementById('qvInjectDay').value) || 1;
  const daysWk  = parseFloat(document.getElementById('qvDaysWk').value) || 7;
  const weeks   = document.getElementById('qvWeeks').value;
  const vials   = document.getElementById('qvCount').textContent;
  const totalInj = document.getElementById('qvTotalDoses').textContent;
  const schedule = (injectD === 1 && daysWk === 7) ? 'Once daily'
                 : `${injectD}x/day · ${daysWk} days/week`;
  const text = [
    name,
    `Dose: ${dose} ${unit}/injection`,
    `Schedule: ${schedule}`,
    `Cycle: ${weeks} weeks`,
    `Vial size: ${vialSz}mg`,
    `Vials needed: ${vials}`,
    `Total injections: ${totalInj}`,
  ].filter(Boolean).join('\n');
  await _shareOrCopy(text, `${name} — Vial Supply`, document.getElementById('qvCopyBtn'), 'Export Info');
}

// ─── Syringe SVG visual ───────────────────────────────────
function updateSyringeVisual(fillPercent, syringeSize, activeUnit) {
  const bX = 47, bW = 211, pW = 10;
  const rawLeft = bX + (fillPercent / 100) * bW - pW / 2;
  const plungerLeft = Math.max(bX, Math.min(rawLeft, bX + bW - pW));
  const fluidW = Math.max(0, plungerLeft - bX);
  const fluid = document.getElementById('syrFluid');
  const plunger = document.getElementById('syrPlunger');
  if (fluid) fluid.setAttribute('width', fluidW.toFixed(1));
  if (plunger) plunger.setAttribute('x', plungerLeft.toFixed(1));
  const steps = syringeSize === 100 ? [10,20,30,40,50,60,70,80,90,100]
              : syringeSize === 50  ? [10,20,30,40,50] : [10,20,30];
  const ticksEl = document.getElementById('syrTicks');
  const labelsEl = document.getElementById('syrLabels');
  if (!ticksEl || !labelsEl) return;
  let tHtml = '', lHtml = '';
  steps.forEach(s => {
    const tx = (bX + (s / syringeSize) * bW).toFixed(1);
    const on = s === activeUnit;
    tHtml += `<line x1="${tx}" y1="40" x2="${tx}" y2="${on ? 50 : 47}" stroke="${on ? 'var(--blue)' : 'var(--border2)'}" stroke-width="${on ? 1.5 : 1}"/>`;
    lHtml += `<text x="${tx}" y="61" fill="${on ? 'var(--blue)' : 'var(--text3)'}" font-weight="${on ? '700' : '400'}">${s}</text>`;
  });
  ticksEl.innerHTML = tHtml;
  labelsEl.innerHTML = lHtml;
}

// ─── Reconstitution calculator ────────────────────────────
function calculateRecon() {
  const vialMg = parseFloat(document.getElementById('vialMg').value);
  const bacWater = parseFloat(document.getElementById('bacWater').value);
  const desiredDose = parseFloat(document.getElementById('desiredDose').value);
  const doseUnit = document.getElementById('doseUnit').value;
  const syringeSize = parseInt(document.getElementById('syringeType').value);
  const errorEl = document.getElementById('reconError');
  const resultEl = document.getElementById('reconResult');
  errorEl.classList.remove('visible');
  resultEl.classList.remove('visible');
  if (!vialMg || vialMg <= 0) { showCalcError('reconError', 'Please enter a valid vial size (mg).'); return; }
  if (!bacWater || bacWater <= 0) { showCalcError('reconError', 'Please enter a valid BAC water amount (ml).'); return; }
  if (!desiredDose || desiredDose <= 0) { showCalcError('reconError', 'Please enter a valid dose.'); return; }
  const doseMcg = doseUnit === 'mg' ? desiredDose * 1000 : desiredDose;
  const vialMcg = vialMg * 1000;
  const concMcgPerMl = vialMcg / bacWater;
  const volumeMl = doseMcg / concMcgPerMl;
  const units = (volumeMl * 100).toFixed(1);
  const dosesPerVial = Math.floor(vialMcg / doseMcg);
  const mcgPerUnit = (concMcgPerMl / 100).toFixed(1);
  const fillPercent = Math.min((parseFloat(units) / syringeSize) * 100, 100);
  if (parseFloat(units) > syringeSize) {
    showCalcError('reconError', 'This dose exceeds syringe capacity. Use a larger syringe, add more BAC water, or split into 2 injections.');
    return;
  }
  document.getElementById('reconUnits').textContent = parseFloat(units) + ' units';
  document.getElementById('reconMl').textContent = volumeMl.toFixed(3) + ' ml — ' + tr('calc_draw_to') + ' ' + parseFloat(units) + ' ' + tr('calc_unit_line');
  document.getElementById('reconConc').textContent = concMcgPerMl >= 1000 ? (concMcgPerMl/1000).toFixed(2)+' mg/ml' : concMcgPerMl.toFixed(0)+' mcg/ml';
  document.getElementById('reconPerUnit').textContent = mcgPerUnit + ' mcg/unit';
  document.getElementById('reconDoses').textContent = dosesPerVial + ' doses';
  document.getElementById('reconSyringe').textContent = syringeSize + ' units (1ml)';
  const unitsInt = Math.round(parseFloat(units));
  updateSyringeVisual(fillPercent, syringeSize, unitsInt);
  resultEl.classList.add('visible');
}

async function reconCopy() {
  const resEl = document.getElementById('reconResult');
  if (!resEl.classList.contains('visible')) { calculateRecon(); }
  if (!resEl.classList.contains('visible')) return;
  const vialMg  = document.getElementById('vialMg').value;
  const bacWater = document.getElementById('bacWater').value;
  const dose    = document.getElementById('desiredDose').value;
  const unit    = document.getElementById('doseUnit').value;
  const syringe = document.getElementById('syringeType').value;
  const drawUnits = document.getElementById('reconUnits').textContent;
  const drawMl    = document.getElementById('reconMl').textContent;
  const conc      = document.getElementById('reconConc').textContent;
  const perUnit   = document.getElementById('reconPerUnit').textContent;
  const doses     = document.getElementById('reconDoses').textContent;
  const text = [
    `Mix & Draw — ${vialMg}mg vial`,
    `BAC water: ${bacWater}ml`,
    `Dose: ${dose} ${unit}`,
    `Syringe: ${syringe}-unit`,
    `Draw to: ${drawUnits} (${drawMl.split('—')[0].trim()})`,
    `Concentration: ${conc}`,
    `Per unit: ${perUnit}`,
    `Doses per vial: ${doses}`,
  ].join('\n');
  await _shareOrCopy(text, 'Mix & Draw', document.getElementById('reconExportBtn'), 'Export Info');
}

// ─── Vial count calculator ────────────────────────────────
function calculateVials() {
  if (AppState.vialMode === 'last') { _calcVialsDuration(); return; }
  const dose = parseFloat(document.getElementById('vialDose').value);
  const doseUnit = document.getElementById('vialDoseUnit').value;
  const injectionsPerDay = parseFloat(document.getElementById('injectionsPerDay').value);
  const daysPerWeek = parseFloat(document.getElementById('daysPerWeek').value);
  const cycleWeeks = parseFloat(document.getElementById('cycleWeeks').value);
  const vialSize = parseFloat(document.getElementById('vialSize').value);
  const errorEl = document.getElementById('vialError');
  const resultEl = document.getElementById('vialResult');
  errorEl.classList.remove('visible');
  resultEl.classList.remove('visible');
  const bacGuideEl = document.getElementById('bacGuide');
  if (bacGuideEl) bacGuideEl.style.display = 'none';
  if (!dose || dose <= 0) { showCalcError('vialError', 'Please enter a valid dose.'); return; }
  if (!injectionsPerDay || injectionsPerDay <= 0) { showCalcError('vialError', 'Please enter injections per day.'); return; }
  if (!daysPerWeek || daysPerWeek < 1 || daysPerWeek > 7) { showCalcError('vialError', 'Days per week must be 1–7.'); return; }
  if (!cycleWeeks || cycleWeeks <= 0) { showCalcError('vialError', 'Please enter cycle length in weeks.'); return; }
  if (!vialSize || vialSize <= 0) { showCalcError('vialError', 'Please enter the vial size (mg).'); return; }
  const doseMg = doseUnit === 'mcg' ? dose / 1000 : dose;
  const { totalDoses, totalMg, vialsNeeded, mgPerWeek, leftover } = computeVialCount({
    doseMg, injectionsPerDay, daysPerWeek, weeks: cycleWeeks, vialSizeMg: vialSize,
  });
  document.getElementById('vialCount').textContent = vialsNeeded + (vialsNeeded === 1 ? ' vial' : ' vials');
  document.getElementById('vialSub').textContent = totalMg.toFixed(2) + 'mg total across ' + Math.round(daysPerWeek * cycleWeeks) + ' days';
  document.getElementById('totalDoses').textContent = totalDoses + ' injections';
  document.getElementById('vialLeftover').textContent = leftover > 0 ? leftover.toFixed(2) + ' mg' : tr('calc_exact_fit');
  resultEl.classList.add('visible');
  const bacGuide = document.getElementById('bacGuide');
  if (bacGuide) {
    document.getElementById('bacVialCount').textContent = vialsNeeded + (vialsNeeded === 1 ? ' vial' : ' vials');
    document.getElementById('bac1ml').textContent = vialsNeeded + ' ml';
    document.getElementById('bac2ml').textContent = (vialsNeeded * 2) + ' ml';
    bacGuide.style.display = '';
  }
}


// Extracts injections/week from a dose string like "500mcg/day", "2mg 2x/wk"
function _parseInjectionsPerWeek(doseStr) {
  if (!doseStr) return null;
  const s = doseStr.toLowerCase();
  if (s.includes('/wk') || s.includes('/week') || s.includes('per week')) {
    const m = s.match(/(\d+)x\s*\/w/);
    return m ? parseInt(m[1]) : 1;
  }
  if (s.includes('/day') || s.includes('per day')) {
    const m = s.match(/(\d+)x\s*\/day/);
    return (m ? parseInt(m[1]) : 1) * 7;
  }
  return null;
}

async function _shareOrCopy(text, title, btn, resetLabel) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      if (btn) { btn.textContent = '✓ Shared'; setTimeout(() => { btn.textContent = resetLabel; }, 2000); }
    } catch (e) {
      if (e.name !== 'AbortError') {
        navigator.clipboard.writeText(text).catch(() => {});
        if (btn) { btn.textContent = '✓ Copied'; setTimeout(() => { btn.textContent = resetLabel; }, 2000); }
      }
    }
  } else {
    navigator.clipboard.writeText(text).catch(() => {});
    if (btn) { btn.textContent = '✓ Copied'; setTimeout(() => { btn.textContent = resetLabel; }, 2000); }
  }
}


function showCalcError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = '⚠ ' + msg;
  el.classList.add('visible');
}

// ─── Peptide presets ──────────────────────────────────────
const CALC_PRESETS = {
  'Retatrutide': { mg: 5,   dose: 0.5,  unit: 'mg'  },
  'CJC-1295':    { mg: 2,   dose: 100,  unit: 'mcg' },
  'BPC-157':     { mg: 5,   dose: 500,  unit: 'mcg' },
  'Ipamorelin':  { mg: 5,   dose: 200,  unit: 'mcg' },
  'TB-500':      { mg: 5,   dose: 2.5,  unit: 'mg'  },
  'Tesamorelin': { mg: 1,   dose: 1,    unit: 'mg'  },
  'Sermorelin':  { mg: 3,   dose: 300,  unit: 'mcg' },
  'GHK-Cu':      { mg: 5,   dose: 1,    unit: 'mg'  },
  'AOD9604':     { mg: 5,   dose: 300,  unit: 'mcg' },
  'TA-1':        { mg: 1.5, dose: 1.5,  unit: 'mg'  },
};

function presetPeptide(name) {
  const p = CALC_PRESETS[name];
  if (!p) return;
  document.getElementById('vialMg').value = p.mg;
  document.getElementById('desiredDose').value = p.dose;
  document.getElementById('doseUnit').value = p.unit;
  document.querySelectorAll('.preset-pill').forEach(b =>
    b.classList.toggle('active', b.dataset.name === name)
  );
  reconAutoCalc();
}

// ─── Auto-calc wrappers (oninput — silent if any field empty) ──
function reconAutoCalc() {
  const vialMg = parseFloat(document.getElementById('vialMg').value);
  const bacWater = parseFloat(document.getElementById('bacWater').value);
  const desiredDose = parseFloat(document.getElementById('desiredDose').value);
  if (vialMg > 0 && bacWater > 0 && desiredDose > 0) {
    calculateRecon();
  } else {
    document.getElementById('reconError').classList.remove('visible');
    document.getElementById('reconResult').classList.remove('visible');
  }
}

function vialsAutoCalc() {
  const errorEl = document.getElementById('vialError');
  const resultEl = document.getElementById('vialResult');
  const dose = parseFloat(document.getElementById('vialDose').value);
  const inj = parseFloat(document.getElementById('injectionsPerDay').value);
  const days = parseFloat(document.getElementById('daysPerWeek').value);
  const size = parseFloat(document.getElementById('vialSize').value);
  const allBase = dose > 0 && inj > 0 && days > 0 && size > 0;
  if (AppState.vialMode === 'last') {
    const onHand = parseFloat(document.getElementById('vialsOnHand').value);
    if (allBase && onHand > 0) { calculateVials(); return; }
  } else {
    const weeks = parseFloat(document.getElementById('cycleWeeks').value);
    if (allBase && weeks > 0) { calculateVials(); return; }
  }
  errorEl.classList.remove('visible');
  resultEl.classList.remove('visible');
}




async function vialsCopy() {
  const resEl = document.getElementById('vialResult');
  if (!resEl.classList.contains('visible')) { calculateVials(); }
  if (!resEl.classList.contains('visible')) return;
  const dose    = document.getElementById('vialDose').value;
  const unit    = document.getElementById('vialDoseUnit').value;
  const inj     = document.getElementById('injectionsPerDay').value;
  const days    = document.getElementById('daysPerWeek').value;
  const vialSz  = document.getElementById('vialSize').value;
  const result  = document.getElementById('vialCount').textContent;
  const totalInj = document.getElementById('totalDoses').textContent;
  const vialsNum = parseInt(result);
  const schedule = (parseFloat(inj) === 1 && parseFloat(days) === 7) ? 'Once daily'
                 : `${inj}x/day · ${days} days/week`;
  const lines = [];
  if (AppState.vialMode === 'need') {
    const weeks = document.getElementById('cycleWeeks').value;
    lines.push(`Dose: ${dose} ${unit}`);
    lines.push(`Schedule: ${schedule}`);
    lines.push(`Cycle: ${weeks} weeks`);
  } else {
    const onHand = document.getElementById('vialsOnHand').value;
    lines.push(`Dose: ${dose} ${unit}`);
    lines.push(`Schedule: ${schedule}`);
    lines.push(`Vials on hand: ${onHand} × ${vialSz}mg`);
  }
  lines.push(`Vial size: ${vialSz}mg`);
  lines.push(`Result: ${result}`);
  lines.push(`Total injections: ${totalInj}`);
  if (!isNaN(vialsNum) && vialsNum > 0) {
  }
  const btn = document.getElementById('vialCalcBtn');
  await _shareOrCopy(lines.join('\n'), 'Vial Supply', btn, 'Export Info');
}

// ─── Calculator section collapse ─────────────────────────
function toggleCalcSection(id) {
  const body = document.getElementById(id + 'Body');
  const chevron = document.getElementById(id + 'Chevron');
  const collapsed = body.classList.toggle('collapsed');
  if (chevron) chevron.style.transform = collapsed ? 'rotate(-90deg)' : '';
}

// ─── Vial mode toggle ─────────────────────────────────────
function switchVialMode(mode) {
  AppState.vialMode = mode;
  document.getElementById('vialModeNeedBtn').classList.toggle('active', mode === 'need');
  document.getElementById('vialModeLastBtn').classList.toggle('active', mode === 'last');
  document.getElementById('vialCycleField').style.display = mode === 'need' ? '' : 'none';
  document.getElementById('vialOnHandField').style.display = mode === 'last' ? '' : 'none';
  const lbl = document.getElementById('vialResultLabel');
  if (lbl) lbl.textContent = mode === 'need' ? 'Vials needed for full cycle' : 'Your supply will last';
  document.getElementById('vialError').classList.remove('visible');
  document.getElementById('vialResult').classList.remove('visible');
}

// ─── Supply duration calculator (vial mode: 'last') ───────
function _calcVialsDuration() {
  const dose = parseFloat(document.getElementById('vialDose').value);
  const doseUnit = document.getElementById('vialDoseUnit').value;
  const injectionsPerDay = parseFloat(document.getElementById('injectionsPerDay').value);
  const daysPerWeek = parseFloat(document.getElementById('daysPerWeek').value);
  const vialsOnHand = parseFloat(document.getElementById('vialsOnHand').value);
  const vialSize = parseFloat(document.getElementById('vialSize').value);
  const errorEl = document.getElementById('vialError');
  const resultEl = document.getElementById('vialResult');
  errorEl.classList.remove('visible');
  resultEl.classList.remove('visible');
  if (!dose || dose <= 0) { showCalcError('vialError', 'Please enter a valid dose.'); return; }
  if (!injectionsPerDay || injectionsPerDay <= 0) { showCalcError('vialError', 'Please enter injections per day.'); return; }
  if (!daysPerWeek || daysPerWeek < 1 || daysPerWeek > 7) { showCalcError('vialError', 'Days per week must be 1–7.'); return; }
  if (!vialsOnHand || vialsOnHand <= 0) { showCalcError('vialError', 'Please enter vials on hand.'); return; }
  if (!vialSize || vialSize <= 0) { showCalcError('vialError', 'Please enter the vial size (mg).'); return; }
  const doseMg = doseUnit === 'mcg' ? dose / 1000 : dose;
  const totalMg = vialsOnHand * vialSize;
  const mgPerWeek = doseMg * injectionsPerDay * daysPerWeek;
  const totalDoses = Math.floor(totalMg / doseMg);
  const weeks = Math.floor(totalMg / mgPerWeek);
  const remainingMg = totalMg - weeks * mgPerWeek;
  const extraDays = Math.floor(remainingMg / (doseMg * injectionsPerDay));
  const durationText = weeks > 0
    ? weeks + (weeks === 1 ? ' week' : ' weeks') + (extraDays > 0 ? ' + ' + extraDays + 'd' : '')
    : extraDays + ' days';
  document.getElementById('vialCount').textContent = durationText;
  document.getElementById('vialSub').textContent = totalMg.toFixed(2) + 'mg on hand · ' + vialsOnHand + ' × ' + vialSize + 'mg vials';
  document.getElementById('totalDoses').textContent = totalDoses + ' injections';
  document.getElementById('vialLeftover').textContent = remainingMg > 0.01 ? remainingMg.toFixed(2) + ' mg unused' : tr('calc_exact_fit');
  resultEl.classList.add('visible');
}

// ─── Stack planner (Calculator tab) ──────────────────────
function initPlanner() {
  const sel = document.getElementById('plannerStackSelect');
  STACKS.forEach((s, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = s.emoji + ' ' + s.name;
    sel.appendChild(opt);
  });
}

function plannerSetTier(tier, btn) {
  AppState.plannerTier = tier;
  document.querySelectorAll('.planner-tier-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  plannerUpdateDoseLabels();
  plannerCalculate();
}

function plannerLoadStack() {
  const idx = document.getElementById('plannerStackSelect').value;
  if (idx === '') {
    document.getElementById('plannerStep2').style.display = 'none';
    document.getElementById('plannerStep3').style.display = 'none';
    document.getElementById('plannerResult').classList.remove('visible');
    document.getElementById('plannerStackDesc').style.display = 'none';
    return;
  }
  const stack = STACKS[parseInt(idx)];
  const desc = document.getElementById('plannerStackDesc');
  desc.style.display = 'block';
  desc.textContent = stack.description || stack.goal;
  document.getElementById('plannerStep2').style.display = 'block';
  const container = document.getElementById('plannerPeptideInputs');
  container.innerHTML = stack.peptides.map((p, i) => {
    const doseLabel = p[AppState.plannerTier] || p.mid;
    return `<div class="planner-peptide-row">
      <div>
        <div class="planner-p-name">${p.name}</div>
        <div class="planner-p-dose" id="plannerDose_${i}">${doseLabel}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <input type="number" class="calc-input" id="plannerVial_${i}"
          placeholder="${getCommonVialSize(p.name)}" min="0.1" step="0.1"
          style="width:70px;font-size:13px;padding:8px 10px;"
          oninput="plannerCalculate()">
        <span class="calc-unit">mg</span>
      </div>
    </div>`;
  }).join('');
  document.getElementById('plannerStep3').style.display = 'block';
  document.getElementById('plannerResult').classList.remove('visible');
}

function plannerUpdateDoseLabels() {
  const idx = document.getElementById('plannerStackSelect').value;
  if (idx === '') return;
  const stack = STACKS[parseInt(idx)];
  stack.peptides.forEach((p, i) => {
    const el = document.getElementById('plannerDose_' + i);
    if (el) el.textContent = p[AppState.plannerTier] || p.mid;
  });
}

function plannerCalculate() {
  const idx = document.getElementById('plannerStackSelect').value;
  const weeks = parseFloat(document.getElementById('plannerWeeks').value);
  if (idx === '' || !weeks || weeks <= 0) return;
  const stack = STACKS[parseInt(idx)];
  const resultEl = document.getElementById('plannerResult');
  const contentEl = document.getElementById('plannerResultContent');
  let rows = '';
  let hasAnyResult = false;
  stack.peptides.forEach((p, i) => {
    const vialSizeInput = document.getElementById('plannerVial_' + i);
    const vialSize = vialSizeInput ? parseFloat(vialSizeInput.value) : NaN;
    const doseStr = p[AppState.plannerTier] || p.mid;
    const mgPerWeek = parseDoseToMgPerWeek(doseStr);
    let vialsHtml = '';
    let detailHtml = '';
    if (mgPerWeek === null) {
      vialsHtml = `<div><div class="planner-result-vials" style="font-size:14px;color:var(--amber)">As-needed</div><div class="planner-result-vials-label">check dose</div></div>`;
      detailHtml = doseStr;
    } else if (!vialSize || isNaN(vialSize) || vialSize <= 0) {
      const totalMg = mgPerWeek * weeks;
      vialsHtml = `<div><div class="planner-result-vials" style="font-size:14px;color:var(--text3)">—</div><div class="planner-result-vials-label">enter vial size</div></div>`;
      detailHtml = `${totalMg.toFixed(2)}mg BAC water needed`;
    } else {
      const totalMg = mgPerWeek * weeks;
      const vialsNeeded = Math.ceil(totalMg / vialSize);
      const leftover = (vialsNeeded * vialSize) - totalMg;
      vialsHtml = `<div><div class="planner-result-vials">${vialsNeeded}</div><div class="planner-result-vials-label">${vialsNeeded === 1 ? 'VIAL' : 'VIALS'}</div></div>`;
      detailHtml = `${totalMg.toFixed(2)}mg total · ${vialSize}mg vials · ${mgPerWeek.toFixed(2)}mg/wk`;
      if (leftover > 0.01) detailHtml += ` · ${leftover.toFixed(2)}mg leftover`;
      hasAnyResult = true;
    }
    rows += `<div class="planner-result-row">
      <div style="flex:1;min-width:0;">
        <div class="planner-result-name">${p.name}</div>
        <div class="planner-result-detail">${detailHtml}</div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--text3);margin-top:2px;">${doseStr}</div>
      </div>
      ${vialsHtml}
    </div>`;
  });
  const tierLabel = AppState.plannerTier === 'lo' ? '🟢 LOW' : AppState.plannerTier === 'mid' ? '🔵 STANDARD' : '🔴 HIGH';
  contentEl.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
      <div style="background:var(--white);border:1px solid var(--border);border-radius:6px;padding:8px 12px;flex:1;">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--text3);">STACK</div>
        <div style="font-size:13px;font-weight:600;">${stack.emoji} ${stack.name}</div>
      </div>
      <div style="background:var(--white);border:1px solid var(--border);border-radius:6px;padding:8px 12px;">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--text3);">CYCLE</div>
        <div style="font-size:13px;font-weight:600;">${weeks} weeks</div>
      </div>
      <div style="background:var(--white);border:1px solid var(--border);border-radius:6px;padding:8px 12px;">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--text3);">TIER</div>
        <div style="font-size:13px;font-weight:600;">${tierLabel}</div>
      </div>
    </div>
    ${rows}
  `;
  resultEl.classList.add('visible');
}

async function plannerCopy() {
  const resEl = document.getElementById('plannerResult');
  if (!resEl.classList.contains('visible')) { plannerCalculate(); }
  if (!resEl.classList.contains('visible')) return;
  const idx = document.getElementById('plannerStackSelect').value;
  if (idx === '') return;
  const stack = STACKS[parseInt(idx)];
  const weeks = document.getElementById('plannerWeeks').value;
  const tierLabel = AppState.plannerTier === 'lo' ? 'LOW' : AppState.plannerTier === 'mid' ? 'STANDARD' : 'HIGH';
  const lines = [`${stack.emoji} ${stack.name}`, `Cycle: ${weeks} weeks · ${tierLabel} dose`, ''];
  stack.peptides.forEach((p, i) => {
    const vialSize = parseFloat(document.getElementById('plannerVial_' + i)?.value);
    const doseStr  = p[AppState.plannerTier] || p.mid;
    const mgPerWeek = parseDoseToMgPerWeek(doseStr);
    const injPerWk  = _parseInjectionsPerWeek(doseStr);
    lines.push(p.name);
    lines.push(`  Dose: ${doseStr}`);
    if (mgPerWeek !== null && vialSize > 0) {
      const total = mgPerWeek * parseFloat(weeks);
      const vials = Math.ceil(total / vialSize);
      if (injPerWk) lines.push(`  Total injections: ${Math.round(injPerWk * parseFloat(weeks))}`);
      lines.push(`  Vial: ${vialSize}mg ea · ${vials} vials needed`);
      lines.push(`  Total mg: ${total.toFixed(1)}mg`);
    } else if (mgPerWeek !== null) {
      lines.push(`  Total mg needed: ${(mgPerWeek * parseFloat(weeks)).toFixed(1)}mg`);
    }
    lines.push('');
  });
  const title = `${stack.emoji} ${stack.name} — ${weeks} weeks (${tierLabel})`;
  await _shareOrCopy(lines.join('\n'), title, document.getElementById('plannerExportBtn'), 'Export Info');
}

// ─── Event listeners ──────────────────────────────────────
function initEventListeners() {
  document.getElementById('langBtn').addEventListener('click', toggleLang);

  document.getElementById('themeBtn').addEventListener('click', () => {
    AppState.isDark = !AppState.isDark;
    document.body.classList.toggle('dark', AppState.isDark);
    document.getElementById('themeBtn').textContent = AppState.isDark ? '☀️' : '🌙';
  });

  window.addEventListener('scroll', () => {
    document.getElementById('scrollTop').classList.toggle('visible', window.scrollY > 300);
  });
  document.getElementById('scrollTop').addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: 'smooth' })
  );

  document.getElementById('backToStacks').addEventListener('click', navBack);
  document.getElementById('backToCat').addEventListener('click', navBack);
  document.getElementById('backToList').addEventListener('click', navBack);


  // Debounced global search
  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => handleSearch(this.value.trim().toLowerCase()), 200);
  });

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      const leaving = document.querySelector('.nav-tab.active')?.dataset.page;
      if (leaving && leaving !== this.dataset.page) {
        AppState.tabMemory[leaving] = captureNavState();
      }
      activatePage(this.dataset.page);
      const saved = AppState.tabMemory[this.dataset.page];
      if (saved && saved.page === this.dataset.page) restoreNavState(saved);
    });
  });
}

function handleSearch(q) {
  const sr = document.getElementById('searchResults');
  if (!q) {
    sr.style.display = 'none';
    sr.classList.remove('active');
    document.getElementById('mainNav').style.display = 'flex';
    document.querySelectorAll('.page').forEach(p => {
      p.style.display = p.classList.contains('active') ? 'block' : 'none';
    });
    return;
  }
  document.getElementById('mainNav').style.display = 'none';
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  sr.style.display = 'block';
  sr.classList.add('active');
  const results = [];
  Object.entries(PEPTIDES).forEach(([n, p]) => {
    if ((`${n} ${p.tagline} ${p.category} ${p.mechanism} ${p.benefits.join(' ')}`).toLowerCase().includes(q))
      results.push({ name: n, sub: n.toLowerCase().includes(q) ? p.category : p.tagline.slice(0, 60) + '…' });
  });
  STACKS.forEach(s => {
    if ((s.name + s.goal).toLowerCase().includes(q))
      results.push({ name: s.name, sub: 'Stack: ' + s.goal, isStack: true, idx: STACKS.indexOf(s) });
  });
  sr.innerHTML = results.length
    ? results.map(r => `
        <div class="sr-item" onclick="${r.isStack ? 'switchToStack('+r.idx+')' : 'goToProfile(\''+r.name.replace(/'/g,"\\'").replace(/\(/g,"\\(").replace(/\)/g,"\\)")+'\')'}">\n          <div class="sr-name">${r.name}</div><div class="sr-sub">${r.sub}</div>\n        </div>`).join('')
    : `<div style="padding:20px;text-align:center;color:var(--text3)">${tr('no_results_for')} "${q}"</div>`;
}

// ─── Swipe back/forward gestures ─────────────────────────
function initSwipeBack() {
  let touchStartX = 0;
  let touchStartY = 0;
  const SWIPE_THRESHOLD = 80;
  const EDGE_ZONE = 44;
  const CENTER_ZONE_START = 60;
  const CENTER_ZONE_END_OFFSET = 60;
  const VERTICAL_LIMIT = 60;

  document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
    if (dy > VERTICAL_LIMIT || Math.abs(dx) < SWIPE_THRESHOLD) return;
    const isDetailOpen = document.getElementById('detailView')?.style.display === 'block';
    const inCenter = touchStartX >= CENTER_ZONE_START && touchStartX <= window.innerWidth - CENTER_ZONE_END_OFFSET;
    if (isDetailOpen && inCenter && AppState.compoundList.length > 1) {
      if (dx < 0) swipeNextCompound();
      else swipePrevCompound();
    } else if (dx > 0 && touchStartX < EDGE_ZONE) {
      navBack();
    } else if (dx < 0 && touchStartX > window.innerWidth - EDGE_ZONE) {
      navForward();
    }
  }, { passive: true });
}

// ─── Store Back Button ────────────────────────────────────
function initStoreBack() {
  const STORES = {
    cerritos: { label: 'Cerritos', url: 'https://jmitsuominor-ux.github.io/Peptide-Supply-Warehouse-/cerritos.html' },
    sd:       { label: 'San Diego', url: 'https://jmitsuominor-ux.github.io/Peptide-Supply-Warehouse-/sandiego.html' },
    sandiego: { label: 'San Diego', url: 'https://jmitsuominor-ux.github.io/Peptide-Supply-Warehouse-/sandiego.html' },
    tj:       { label: 'Tijuana',   url: 'https://jmitsuominor-ux.github.io/Peptide-Supply-Warehouse-/tijuana.html' },
    tijuana:  { label: 'Tijuana',   url: 'https://jmitsuominor-ux.github.io/Peptide-Supply-Warehouse-/tijuana.html' },
  };
  const param = new URLSearchParams(window.location.search).get('store');
  if (param) {
    const store = STORES[param.toLowerCase()];
    if (store) sessionStorage.setItem('psw_store', JSON.stringify(store));
  }
  const stored = sessionStorage.getItem('psw_store');
  if (stored) {
    const store = JSON.parse(stored);
    const btn = document.getElementById('storeBackBtn');
    const lbl = document.getElementById('storeBackLabel');
    if (btn && lbl) { btn.href = store.url; lbl.textContent = '← Back to ' + store.label + ' Store'; btn.classList.add('visible'); }
  }
}

// ─── Bootstrap ────────────────────────────────────────────
function init() {
  // Hide catView immediately if deep-linking to a compound to prevent blip
  if (new URLSearchParams(window.location.search).get('compound')) {
    document.getElementById('catView').style.display = 'none';
  }
  // Chrome won't autofill readonly inputs — remove readonly on first user interaction
  const _si = document.getElementById('searchInput');
  _si.value = '';
  _si.addEventListener('focus', () => _si.removeAttribute('readonly'), { once: true });
  renderCategories();
  renderRecentFav();
  renderStacks();
  initPlanner();
  applyTranslations();
  initEventListeners();
  initSwipeBack();
  initStoreBack();

  // Auth + schedule
  initAuth(user => {
    if (document.getElementById('page-schedule')?.classList.contains('active')) {
      renderSchedulePage();
    }
  });

  // Service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/peptide-reference/sw.js').catch(() => {});
  }
  // Deep-link: ?compound=BPC-157
  const compoundParam = new URLSearchParams(window.location.search).get('compound');
  if (compoundParam) {
    // Wait for full render then retry until compound detail opens
    const name = decodeURIComponent(compoundParam);
    let attempts = 0;
    const tryOpen = () => {
      attempts++;
      showDetail(name);
      // Check if detail view became visible
      const dv = document.getElementById('detailView');
      if (dv && dv.style.display === 'block') return;
      if (attempts < 10) setTimeout(tryOpen, 200);
    };
    setTimeout(tryOpen, 300);
  }
  // Deep-link: ?stack=FAT+STACK
  const stackParam = new URLSearchParams(window.location.search).get('stack');
  if (stackParam) {
    const sName = decodeURIComponent(stackParam).trim().toUpperCase();
    let sAttempts = 0;
    const tryOpenStack = () => {
      sAttempts++;
      const idx = STACKS.findIndex(s => s.name.toUpperCase() === sName);
      if (idx >= 0) {
        switchToStack(idx);
        const cover = document.getElementById('stackDeepLinkCover');
        if (cover) {
          cover.style.transition = 'opacity 0.2s';
          cover.style.opacity = '0';
          setTimeout(() => { if (cover.parentNode) cover.parentNode.removeChild(cover); }, 220);
        }
        return;
      }
      if (sAttempts < 10) setTimeout(tryOpenStack, 200);
    };
    setTimeout(tryOpenStack, 300);
  }
}

init();
