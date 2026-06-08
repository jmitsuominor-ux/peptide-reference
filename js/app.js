// ═══════════════════════════════════════════════════════
// APP — event handlers, calculators, init
// Entry point: imported as <script type="module" src="js/app.js">
// ═══════════════════════════════════════════════════════
import { AppState } from './state.js';
import { TRANSLATIONS } from './data/translations.js';
import { STACKS } from './utils.js';
import { t, parseDoseToMgPerWeek, getCommonVialSize, computeVialCount, getStackData, PEPTIDES } from './utils.js';
import {
  renderCategories, showList, showDetail, toggleSec,
  renderStacks, showStackDetail, renderAZ, scrollToLetter,
  activatePage, goToProfile, switchToStack,
} from './ui.js';

// ─── Expose UI fns for inline onclick= handlers in generated HTML ─
Object.assign(window, {
  showList, showDetail, toggleSec, showStackDetail,
  goToProfile, switchToStack, activatePage, scrollToLetter,
  calcQuickVials, calculateRecon, calculateVials, showCalcError,
  reconAutoCalc, vialsAutoCalc, presetPeptide, updateBacSuggestions, applyBacSuggestion, switchVialMode,
  sdSetTier, sdCalculate,
  plannerSetTier, plannerLoadStack, plannerCalculate,
});

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
  renderAZ();
}

function toggleLang() {
  AppState.lang = AppState.lang === 'en' ? 'es' : 'en';
  applyTranslations();
  if (document.getElementById('detailView').style.display !== 'none') {
    const name = document.getElementById('detailTitle').textContent;
    if (name) showDetail(name);
  }
  if (document.getElementById('stackDetailView').style.display !== 'none') {
    if (AppState.originStackIdx !== null) showStackDetail(AppState.originStackIdx);
  }
}

// ─── Stack detail inline vial planner ────────────────────
function sdSetTier(tier, btn, idx) {
  AppState.sdTier = tier;
  document.querySelectorAll('.planner-tier-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const stack = getStackData(idx, AppState.lang);
  stack.peptides.forEach((p, pi) => {
    const el = document.getElementById('sdDose_' + pi);
    if (el) el.textContent = p[tier] || p.mid;
  });
  sdCalculate(idx);
}

function sdCalculate(idx) {
  const stack = getStackData(idx, AppState.lang);
  const weeks = parseFloat(document.getElementById('sdWeeks').value);
  if (!weeks || weeks <= 0) return;
  const resultEl = document.getElementById('sdResult');
  const contentEl = document.getElementById('sdResultContent');
  if (!resultEl || !contentEl) return;
  let rows = '';
  stack.peptides.forEach((p, pi) => {
    const vialInput = document.getElementById('sdVial_' + pi);
    const vialSize = vialInput ? parseFloat(vialInput.value) : NaN;
    const doseStr = p[AppState.sdTier] || p.mid;
    const mgPerWeek = parseDoseToMgPerWeek(doseStr);
    let right = '';
    let detail = doseStr;
    if (mgPerWeek === null) {
      right = '<span style="font-size:13px;font-weight:600;color:var(--amber);">As-needed</span>';
    } else if (!vialSize || isNaN(vialSize)) {
      const total = (mgPerWeek * weeks).toFixed(2);
      right = '<span style="font-size:13px;font-weight:600;color:var(--text3);">— vials</span>';
      detail = total + 'mg total needed · enter vial size';
    } else {
      const total = mgPerWeek * weeks;
      const vials = Math.ceil(total / vialSize);
      const leftover = (vials * vialSize) - total;
      right = '<span style="font-size:22px;font-weight:600;color:var(--blue);">' + vials + '</span><div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:var(--text3);">' + (vials === 1 ? 'VIAL' : 'VIALS') + '</div>';
      detail = total.toFixed(2) + 'mg total · ' + vialSize + 'mg vials' + (leftover > 0.01 ? ' · ' + leftover.toFixed(2) + 'mg left' : '');
    }
    rows += `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--mid-border);">
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:600;color:var(--navy);">${p.name}</div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--text3);margin-top:2px;">${detail}</div>
      </div>
      <div style="text-align:right;">${right}</div>
    </div>`;
  });
  contentEl.innerHTML = rows;
  resultEl.classList.add('visible');
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
  const units = (volumeMl * syringeSize).toFixed(1);
  const dosesPerVial = Math.floor(vialMcg / doseMcg);
  const mcgPerUnit = (concMcgPerMl / syringeSize).toFixed(1);
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
  document.getElementById('syringeFill').style.width = fillPercent + '%';
  const steps = syringeSize === 100 ? [10,20,30,40,50,60,70,80,90,100] : syringeSize === 50 ? [10,20,30,40,50] : [10,20,30];
  const unitsInt = Math.round(parseFloat(units));
  document.getElementById('syringeMarkers').innerHTML = steps.map(s => `<span class="syringe-marker${s === unitsInt ? ' active' : ''}">${s}</span>`).join('');
  const needleEl = document.getElementById('syringeNeedle');
  if (needleEl) { needleEl.style.left = fillPercent + '%'; needleEl.style.display = ''; }
  resultEl.classList.add('visible');
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
  document.getElementById('totalMg').textContent = totalMg.toFixed(2) + ' mg';
  document.getElementById('mgPerWeek').textContent = mgPerWeek.toFixed(2) + ' mg/wk';
  document.getElementById('vialLeftover').textContent = leftover > 0 ? leftover.toFixed(2) + ' mg' : tr('calc_exact_fit');
  resultEl.classList.add('visible');
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
  const { totalDoses, totalMg, vialsNeeded, mgPerWeek, leftover } = computeVialCount({
    doseMg, injectionsPerDay: injectDay, daysPerWeek: daysWk, weeks, vialSizeMg: vialSize,
  });
  document.getElementById('qvCount').textContent = vialsNeeded + (vialsNeeded === 1 ? ' vial' : ' vials');
  document.getElementById('qvSub').textContent = totalMg.toFixed(2) + 'mg total · ' + vialSize + 'mg vials';
  document.getElementById('qvTotalMg').textContent = totalMg.toFixed(2) + ' mg';
  document.getElementById('qvMgWk').textContent = mgPerWeek.toFixed(2) + ' mg/wk';
  document.getElementById('qvTotalDoses').textContent = totalDoses + ' injections';
  document.getElementById('qvLeftover').textContent = leftover > 0.01 ? leftover.toFixed(2) + ' mg' : 'None';
  resEl.classList.add('visible');
}

function showCalcError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = '⚠ ' + msg;
  el.classList.add('visible');
}

// ─── Peptide presets ──────────────────────────────────────
const CALC_PRESETS = {
  'BPC-157':     { mg: 5,   dose: 500,  unit: 'mcg' },
  'Ipamorelin':  { mg: 5,   dose: 200,  unit: 'mcg' },
  'CJC-1295':    { mg: 2,   dose: 100,  unit: 'mcg' },
  'TB-500':      { mg: 5,   dose: 2.5,  unit: 'mg'  },
  'PT-141':      { mg: 10,  dose: 1,    unit: 'mg'  },
  'GHK-Cu':      { mg: 5,   dose: 1,    unit: 'mg'  },
  'Semaglutide': { mg: 3,   dose: 0.5,  unit: 'mg'  },
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
  updateBacSuggestions();
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

// ─── Smart BAC suggestions ────────────────────────────────
function updateBacSuggestions() {
  const vialMg = parseFloat(document.getElementById('vialMg').value);
  const desiredDose = parseFloat(document.getElementById('desiredDose').value);
  const doseUnit = document.getElementById('doseUnit').value;
  const syringeSize = parseInt(document.getElementById('syringeType').value);
  const panel = document.getElementById('bacSuggestPanel');
  if (!vialMg || !desiredDose || vialMg <= 0 || desiredDose <= 0) {
    panel.style.display = 'none';
    return;
  }
  const doseMcg = doseUnit === 'mg' ? desiredDose * 1000 : desiredDose;
  const suggestions = [];
  for (const units of [5, 10, 20, 25, 50]) {
    const bac = (units * vialMg * 1000) / (doseMcg * syringeSize);
    if (bac >= 0.5 && bac <= 3.5) {
      const bacR = Math.round(bac * 10) / 10;
      if (!suggestions.find(s => s.bac === bacR)) suggestions.push({ units, bac: bacR });
    }
  }
  if (!suggestions.length) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  panel.innerHTML =
    `<div class="bac-suggest-label">💡 Tap to set BAC water for a clean syringe draw:</div>` +
    `<div class="bac-suggest-pills">` +
    suggestions.map(s =>
      `<button class="bac-suggest-btn" onclick="applyBacSuggestion(${s.bac})">${s.bac} ml → <strong>${s.units} units</strong></button>`
    ).join('') +
    `</div>`;
}

function applyBacSuggestion(bac) {
  document.getElementById('bacWater').value = bac;
  calculateRecon();
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
  document.getElementById('totalMg').textContent = totalMg.toFixed(2) + ' mg';
  document.getElementById('mgPerWeek').textContent = mgPerWeek.toFixed(2) + ' mg/wk';
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
      detailHtml = `${totalMg.toFixed(2)}mg total needed`;
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

  document.getElementById('backToStacks').addEventListener('click', () => {
    document.getElementById('stackDetailView').style.display = 'none';
    document.getElementById('stacksListView').style.display = 'block';
    window.scrollTo(0, 0);
  });

  document.getElementById('backToCat').addEventListener('click', () => {
    document.getElementById('listView').style.display = 'none';
    document.getElementById('catView').style.display = 'block';
    window.scrollTo(0, 0);
  });

  document.getElementById('backToList').addEventListener('click', () => {
    document.getElementById('detailView').style.display = 'none';
    if (AppState.profileOrigin === 'stack' && AppState.originStackIdx !== null) {
      AppState.profileOrigin = null;
      document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
      document.querySelector('[data-page="stacks"]').classList.add('active');
      document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
      });
      const sp = document.getElementById('page-stacks');
      sp.classList.add('active');
      sp.style.display = 'block';
      document.getElementById('stackDetailView').style.display = 'block';
      document.getElementById('stacksListView').style.display = 'none';
    } else {
      const lv = document.getElementById('listView');
      lv.dataset.catId
        ? (lv.style.display = 'block')
        : (document.getElementById('catView').style.display = 'block');
    }
    window.scrollTo(0, 0);
  });

  document.getElementById('azSearch').addEventListener('input', function () {
    renderAZ(this.value.trim().toLowerCase());
  });

  // Debounced global search
  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => handleSearch(this.value.trim().toLowerCase()), 200);
  });

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', function () { activatePage(this.dataset.page); });
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
        <div class="sr-item" onclick="${r.isStack ? 'switchToStack('+r.idx+')' : 'goToProfile(\''+r.name.replace(/'/g,"\\'").replace(/\(/g,"\\(").replace(/\)/g,"\\)")+'\')'}">
          <div class="sr-name">${r.name}</div><div class="sr-sub">${r.sub}</div>
        </div>`).join('')
    : `<div style="padding:20px;text-align:center;color:var(--text3)">${tr('no_results_for')} "${q}"</div>`;
}

// ─── Swipe-back gesture ───────────────────────────────────
function initSwipeBack() {
  let touchStartX = 0;
  let touchStartY = 0;
  const SWIPE_THRESHOLD = 80;
  const EDGE_ZONE = 40;
  const VERTICAL_LIMIT = 60;

  document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const dx = touchEndX - touchStartX;
    const dy = Math.abs(touchEndY - touchStartY);
    if (touchStartX > EDGE_ZONE || dx < SWIPE_THRESHOLD || dy > VERTICAL_LIMIT) return;
    const browseActive = document.getElementById('page-browse').classList.contains('active');
    const stacksActive = document.getElementById('page-stacks').classList.contains('active');
    if (browseActive) {
      if (document.getElementById('detailView').style.display !== 'none')
        document.getElementById('backToList').click();
      else if (document.getElementById('listView').style.display !== 'none')
        document.getElementById('backToCat').click();
    }
    if (stacksActive && document.getElementById('stackDetailView').style.display !== 'none')
      document.getElementById('backToStacks').click();
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
  renderCategories();
  renderStacks();
  renderAZ();
  initPlanner();
  applyTranslations();
  initEventListeners();
  initSwipeBack();
  initStoreBack();
}

init();
