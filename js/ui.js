// ═══════════════════════════════════════════════════════
// UI — rendering functions
// ═══════════════════════════════════════════════════════
import { CATEGORIES, CAT_COLORS, CAT_BG, EVIDENCE_LABELS, EVIDENCE_BADGE_CLASS } from './data/categories.js';
import { CAT_I18N_KEYS } from './data/translations.js';
import { PEPTIDES, STACKS, t, getPeptideData, getStackData, getCommonVialSize, getInteractionWarnings } from './utils.js';
import { AppState } from './state.js';
import { getRecent, getFavorites, isFavorite, addToRecent, toggleFavorite } from './storage.js';

// Shorthand using current language — avoids threading lang everywhere in templates
function tr(key) { return t(key, AppState.lang); }

// ─── Browse: recently viewed & favourites ─────────────────
export function renderRecentFav() {
  const favs   = getFavorites();
  const recent = getRecent();

  const favSec = document.getElementById('favSection');
  const recSec = document.getElementById('recentSection');
  if (!favSec || !recSec) return;

  if (favs.length) {
    favSec.style.display = 'block';
    document.getElementById('favChips').innerHTML = favs.map(n =>
      `<div class="browse-chip fav" onclick="navToDetail('${n.replace(/'/g,"\\'")}')">⭐ ${n}</div>`
    ).join('');
  } else {
    favSec.style.display = 'none';
  }

  const filteredRecent = recent.filter(n => !favs.includes(n));
  if (filteredRecent.length) {
    recSec.style.display = 'block';
    document.getElementById('recentChips').innerHTML = filteredRecent.map(n =>
      `<div class="browse-chip" onclick="navToDetail('${n.replace(/'/g,"\\'")}')">🕐 ${n}</div>`
    ).join('');
  } else {
    recSec.style.display = 'none';
  }
}

// ─── Browse: categories ──────────────────────────────────
export function renderCategories() {
  document.getElementById('catGrid').innerHTML = CATEGORIES.map((cat, i) => {
    const catName = tr(CAT_I18N_KEYS[cat.id]) || cat.name;
    return `<div class="cat-card" style="--cat-color:${CAT_COLORS[cat.id]||'#1756a9'};animation-delay:${i*0.04}s" onclick="showList('${cat.id}')">
      <div class="cat-icon-box" style="background:${CAT_BG[cat.id]||'#e8f0fb'}">${cat.icon}</div>
      <div class="cat-name">${catName}</div>
      <div class="cat-meta">${cat.peptides.length} ${tr('compounds_label')}</div>
    </div>`;
  }).join('');
}

// ─── Browse: peptide list ─────────────────────────────────
export function showList(catId) {
  pushNav();
  const cat = CATEGORIES.find(c => c.id === catId);
  document.getElementById('catView').style.display = 'none';
  const lv = document.getElementById('listView');
  lv.style.display = 'block';
  lv.dataset.catId = catId;
  document.getElementById('listTitle').textContent = cat.name;
  document.getElementById('listLabel').textContent = `${cat.name.toUpperCase()} — ${cat.peptides.length} COMPOUNDS`;
  const evLabels = ['', 'Anecdotal', 'Preclinical', 'Early Human', 'Phase 3', 'FDA Approved'];
  document.getElementById('peptideList').innerHTML = cat.peptides.map((name, i) => {
    const p = getPeptideData(name, AppState.lang);
    return `<div class="peptide-card" style="animation-delay:${i*0.04}s" onclick="navToDetail('${name.replace(/'/g,"\\'").replace(/\(/g,"\\(").replace(/\)/g,"\\)")}')">
      <div class="pc-idx">${String(i+1).padStart(2,'0')}</div>
      <div class="pc-content">
        <div class="pc-name">${name}</div>
        <div class="pc-tagline">${p ? p.tagline : 'Research peptide'}</div>
        <div class="pc-chips">
          ${p ? '<span class="pc-chip ev">'+'★'.repeat(p.evidence)+'☆'.repeat(5-p.evidence)+' '+evLabels[p.evidence]+'</span>' : ''}
          ${p ? '<span class="pc-chip">'+p.cycle+'</span>' : ''}
        </div>
      </div>
      <div class="pc-arrow">›</div>
    </div>`;
  }).join('');
}

// ─── Compound Compare ─────────────────────────────────────
const _compareList = [];

function _updateCompareBar() {
  const bar = document.getElementById('compareBar');
  if (!bar) return;
  if (_compareList.length === 0) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  document.getElementById('compareBarChips').innerHTML = _compareList.map(n =>
    `<div style="background:rgba(255,255,255,0.1);border-radius:4px;padding:3px 8px;font-size:10px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:80px;">${n}</div>`
  ).join('');
  const btn = document.getElementById('compareBarBtn');
  if (btn) {
    btn.textContent = `Compare (${_compareList.length})`;
    btn.disabled = _compareList.length < 2;
    btn.style.opacity = _compareList.length < 2 ? '0.5' : '1';
  }
}

export function toggleCompare(name) {
  const idx = _compareList.indexOf(name);
  if (idx === -1) {
    if (_compareList.length >= 5) { alert('Maximum 5 compounds for comparison.'); return; }
    _compareList.push(name);
  } else {
    _compareList.splice(idx, 1);
  }
  _updateCompareBar();
  const btn = document.getElementById('compareToggleBtn');
  if (btn && btn.dataset.name === name) _applyCompareBtn(btn, name);
}

function _applyCompareBtn(btn, name) {
  const inList = _compareList.includes(name);
  btn.textContent = inList ? '✓ In Compare' : '＋ Add to Compare';
  btn.style.background = inList ? 'var(--teal)' : 'transparent';
  btn.style.color = inList ? '#fff' : 'var(--blue)';
  btn.style.borderColor = inList ? 'var(--teal)' : 'var(--mid-border)';
}

export function clearCompare() {
  _compareList.length = 0;
  _updateCompareBar();
  closeCompare();
  const btn = document.getElementById('compareToggleBtn');
  if (btn) _applyCompareBtn(btn, btn.dataset.name || '');
}

export function closeCompare() {
  const ov = document.getElementById('compareOverlay');
  if (ov) ov.style.display = 'none';
}

export function openCompare() {
  if (_compareList.length < 2) return;
  const wrap = document.getElementById('compareTableWrap');
  const ov   = document.getElementById('compareOverlay');
  if (!wrap || !ov) return;

  const compounds = _compareList.map(n => ({ name: n, p: getPeptideData(n, AppState.lang) })).filter(c => c.p);
  const rows = [
    { label: 'Category',     fn: c => c.p.category || '—' },
    { label: 'Evidence',     fn: c => `${'★'.repeat(c.p.evidence)}${'☆'.repeat(5-c.p.evidence)}<br><span style="font-size:10px;color:var(--text3);">${EVIDENCE_LABELS[c.p.evidence]||''}</span>` },
    { label: 'Schedule',     fn: c => c.p.schedule || '—' },
    { label: 'Cycle',        fn: c => c.p.cycle || '—' },
    { label: 'Low Dose',     fn: c => c.p.lo || '—' },
    { label: 'Std Dose',     fn: c => c.p.mid || '—' },
    { label: 'High Dose',    fn: c => c.p.hi || '—' },
    { label: 'Benefits',     fn: c => (c.p.benefits||[]).slice(0,3).map(b=>`<div style="margin-bottom:4px;font-size:11px;">• ${b}</div>`).join('') || '—' },
    { label: 'Side Effects', fn: c => (c.p.sideEffects||[]).slice(0,3).map(se=>`<div style="margin-bottom:4px;font-size:11px;"><span style="font-size:9px;font-weight:700;text-transform:uppercase;color:${se.severity==='high'?'var(--red)':se.severity==='med'?'var(--amber)':'var(--teal)'};">${se.severity}</span> ${se.text}</div>`).join('') || '—' },
    { label: 'Pairs With',   fn: c => (c.p.pairsWith||[]).slice(0,3).join(', ') || '—' },
    { label: 'Avoid',        fn: c => (c.p.avoid||[]).slice(0,2).map(a=>a.split('(')[0].trim()).join(', ') || '—' },
  ];

  const colW = '155px';
  const labelW = '88px';
  wrap.innerHTML = `
    <table style="border-collapse:collapse;width:max-content;min-width:100%;font-size:12px;">
      <thead>
        <tr>
          <th style="position:sticky;left:0;z-index:3;background:var(--white);padding:10px 10px;min-width:${labelW};max-width:${labelW};border-bottom:2px solid var(--border);"></th>
          ${compounds.map(c => `
            <th style="min-width:${colW};max-width:${colW};padding:10px 12px;border-bottom:2px solid var(--border);background:var(--white);text-align:left;vertical-align:top;position:relative;">
              <div style="font-size:12px;font-weight:700;color:var(--text);padding-right:20px;">${c.name}</div>
              <div style="font-size:10px;color:var(--text3);margin-top:2px;">${c.p.category}</div>
              <button onclick="toggleCompare('${c.name.replace(/'/g,"\\'")}');openCompare();" style="position:absolute;top:8px;right:6px;background:none;border:none;color:var(--text3);cursor:pointer;font-size:16px;padding:2px;line-height:1;">✕</button>
            </th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map((row, ri) => {
          const bg = ri % 2 === 0 ? 'var(--bg)' : 'var(--white)';
          return `<tr>
            <td style="position:sticky;left:0;z-index:2;background:${bg};padding:10px;font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid var(--border);min-width:${labelW};max-width:${labelW};vertical-align:top;line-height:1.3;">${row.label}</td>
            ${compounds.map(c => `<td style="padding:10px 12px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--text);background:${bg};min-width:${colW};max-width:${colW};line-height:1.4;">${row.fn(c)}</td>`).join('')}
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;

  ov.style.display = 'flex';
  ov.style.flexDirection = 'column';
  window.scrollTo(0, 0);
}

// ─── Browse: compound detail view ────────────────────────
export function showDetail(name) {
  const p = getPeptideData(name, AppState.lang);
  if (!p) return;
  addToRecent(name);
  renderRecentFav();
  document.getElementById('catView').style.display = 'none';
  document.getElementById('listView').style.display = 'none';
  const dv = document.getElementById('detailView');
  dv.style.display = 'block';
  document.getElementById('detailTitle').textContent = name;
  const pips = Array.from({length:5}, (_, i) =>
    `<div class="ev-pip${i < p.evidence ? ' filled' : ''}"></div>`
  ).join('');
  const studiesHTML = p.studies && p.studies.length
    ? p.studies.map(s => {
        const linkHTML = s.url ? '<a class="sc-link" href="'+s.url+'" target="_blank" rel="noopener">'+tr('read_study')+'</a>' : '';
        const pmidHTML = s.pmid ? ' · PMID: '+s.pmid : '';
        return '<div class="study-card"><div class="sc-title">'+s.title+'</div><div class="sc-journal">'+s.journal+pmidHTML+'</div><div class="sc-summary">'+s.summary+'</div>'+linkHTML+'</div>';
      }).join('')
    : tr('no_studies');

  document.getElementById('detailContent').innerHTML = `
    <div class="detail-hero">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;">
        <div>
          <div class="dh-cat">${p.category}</div>
          <div class="dh-name">${name}</div>
          <div class="dh-tagline">${p.tagline}</div>
        </div>
        <button class="fav-btn${isFavorite(name) ? ' active' : ''}" onclick="tapFavorite('${name.replace(/'/g,"\\'")}',this)" title="Favourite">${isFavorite(name) ? '⭐' : '☆'}</button>
      </div>
      <div class="dh-badges" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <span class="dh-badge ${EVIDENCE_BADGE_CLASS[p.evidence]}">${'★'.repeat(p.evidence)}${'☆'.repeat(5-p.evidence)} ${EVIDENCE_LABELS[p.evidence]}</span>
        <button onclick="openAddToProtoSheet('${name.replace(/'/g,"\\'")}','${(p.mid||'').replace(/'/g,"\\'")}','${(p.schedule||'').replace(/'/g,"\\'")}')" style="background:var(--accent);color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer;letter-spacing:0.03em;">＋ Add to Protocol</button>
      </div>
      <button id="compareToggleBtn" data-name="${name.replace(/'/g,"\\'")}" onclick="toggleCompare('${name.replace(/'/g,"\\'")}');" style="margin-top:8px;width:100%;background:${_compareList.includes(name)?'var(--teal)':'transparent'};color:${_compareList.includes(name)?'#fff':'var(--blue)'};border:1.5px solid ${_compareList.includes(name)?'var(--teal)':'var(--mid-border)'};border-radius:6px;padding:7px;font-size:12px;font-weight:600;cursor:pointer;letter-spacing:0.02em;transition:all 0.15s;">
        ${_compareList.includes(name) ? '✓ In Compare' : '＋ Add to Compare'}
      </button>
    </div>
    <div class="section-card">
      <div class="section-header" onclick="toggleSec(this)">
        <div class="sh-left"><div class="sh-icon blue">💊</div><div class="sh-title">${tr('sec_dosing')}</div></div>
        <svg class="sh-chevron open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <div class="section-body open">
        <div class="dose-legend">
          <div class="dl-item"><span class="dl-label lo">${tr('dose_low')}</span><div class="dl-desc">${tr('dose_legend_lo_desc')}</div></div>
          <div class="dl-item"><span class="dl-label mid">${tr('dose_mid')}</span><div class="dl-desc">${tr('dose_legend_mid_desc')}</div></div>
          <div class="dl-item"><span class="dl-label hi">${tr('dose_hi')}</span><div class="dl-desc">${tr('dose_legend_hi_desc')}</div></div>
        </div>
        <div class="info-grid">
          <div class="ig-item"><div class="ig-label">${tr('label_schedule')}</div><div class="ig-value">${p.schedule}</div></div>
          <div class="ig-item"><div class="ig-label">${tr('label_cycle')}</div><div class="ig-value">${p.cycle}</div></div>
        </div>
        <table class="dose-table">
          <thead><tr><th>TIER</th><th>DOSE</th><th>FOR WHOM</th></tr></thead>
          <tbody>
            <tr><td class="t-lo">${tr('tier_lo')}</td><td>${p.lo}</td><td>${tr('tier_lo_who')}</td></tr>
            <tr><td class="t-mid">${tr('tier_mid')}</td><td>${p.mid}</td><td>${tr('tier_mid_who')}</td></tr>
            <tr><td class="t-hi">${tr('tier_hi')}</td><td>${p.hi}</td><td>${tr('tier_hi_who')}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="section-card">
      <div class="section-header" onclick="toggleSec(this)">
        <div class="sh-left"><div class="sh-icon teal">✓</div><div class="sh-title">${tr('sec_benefits')}</div></div>
        <svg class="sh-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <div class="section-body">
        ${p.benefits.map(b => `<div class="benefit-row"><div class="benefit-check">✓</div>${b}</div>`).join('')}
        ${p.timeline ? '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;color:var(--text3);letter-spacing:0.06em;text-transform:uppercase;margin:12px 0 4px;">'+tr('sec_timeline')+'</div><div class="timeline">'+p.timeline.map(tl=>'<div class="tl-row"><div class="tl-time">'+tl.time+'</div><div class="tl-text">'+tl.text+'</div></div>').join('')+'</div>' : ''}
      </div>
    </div>
    <div class="section-card">
      <div class="section-header" onclick="toggleSec(this)">
        <div class="sh-left"><div class="sh-icon blue">🔬</div><div class="sh-title">${tr('sec_mechanism')}</div></div>
        <svg class="sh-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <div class="section-body"><div class="mechanism-box">${p.mechanism}</div></div>
    </div>
    <div class="section-card">
      <div class="section-header" onclick="toggleSec(this)">
        <div class="sh-left"><div class="sh-icon amber">⚠</div><div class="sh-title">${tr('sec_adverse')}</div></div>
        <svg class="sh-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <div class="section-body">
        <div style="display:flex;gap:12px;margin-bottom:10px;font-size:11px;color:var(--text3);">
          <span style="display:flex;gap:4px;align-items:center"><span class="se-badge low" style="margin:0">${tr('sev_mild')}</span>${tr('sev_minor')}</span>
          <span style="display:flex;gap:4px;align-items:center"><span class="se-badge med" style="margin:0">${tr('sev_mod')}</span>${tr('sev_monitor')}</span>
          <span style="display:flex;gap:4px;align-items:center"><span class="se-badge high" style="margin:0">${tr('sev_serious')}</span>${tr('sev_medical')}</span>
        </div>
        ${p.sideEffects.map(se => `<div class="se-row"><span class="se-badge ${se.severity}">${se.severity==='low'?tr('sev_mild'):se.severity==='med'?tr('sev_mod'):tr('sev_serious')}</span>${se.text}</div>`).join('')}
      </div>
    </div>
    <div class="section-card">
      <div class="section-header" onclick="toggleSec(this)">
        <div class="sh-left"><div class="sh-icon teal">🔗</div><div class="sh-title">${tr('sec_compat')}</div></div>
        <svg class="sh-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <div class="section-body">
        ${p.pairsWith.map(pair => `<div class="compat-row"><div class="compat-ind ok">✓</div>${PEPTIDES[pair] ? `<span onclick="goToProfile('${pair.replace(/'/g, "\\'")}')" style="color:var(--accent);text-decoration:underline;text-decoration-style:dotted;cursor:pointer;">${pair}</span>` : pair}</div>`).join('')}
        ${p.avoid.map(av => `<div class="compat-row"><div class="compat-ind no">✗</div>${av}</div>`).join('')}
      </div>
    </div>
    <div class="section-card">
      <div class="section-header" onclick="toggleSec(this)">
        <div class="sh-left"><div class="sh-icon purple">📚</div><div class="sh-title">${tr('sec_studies')}</div></div>
        <svg class="sh-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <div class="section-body">
        <div class="evidence-box">
          <div class="ev-label">${tr('label_ev_quality')} — ${tr('ev_label_'+p.evidence)}</div>
          <div class="ev-bar">${pips}</div>
          <div class="ev-note">${p.evidenceNote}</div>
        </div>
        ${studiesHTML}
      </div>
    </div>
    <div class="calc-section" style="margin-top:8px;">
      <div class="calc-section-title" style="margin-bottom:14px;"><div class="sh-icon amber">📦</div>Quick Vial Calculator</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
          <div class="calc-field" style="margin:0">
            <label class="calc-label">Dose per injection</label>
            <div class="calc-input-row">
              <input type="number" class="calc-input" id="qvDose" placeholder="e.g. 500" min="1" style="font-size:14px;padding:9px 10px;" oninput="qvAutoCalc()">
              <select class="calc-select" id="qvDoseUnit" style="flex:0;min-width:65px;padding-right:24px;font-size:13px;" onchange="qvAutoCalc()">
                <option value="mcg">mcg</option>
                <option value="mg">mg</option>
              </select>
            </div>
          </div>
          <div class="calc-field" style="margin:0">
            <label class="calc-label">Vial size</label>
            <div class="calc-input-row">
              <input type="number" class="calc-input" id="qvVialSize" placeholder="e.g. 5" min="0.1" step="0.1" style="font-size:14px;padding:9px 10px;" oninput="qvAutoCalc()">
              <span class="calc-unit">mg</span>
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">
          <div class="calc-field" style="margin:0">
            <label class="calc-label">Injections/day</label>
            <input type="number" class="calc-input" id="qvInjectDay" placeholder="1" min="1" max="10" value="1" style="font-size:14px;padding:9px 10px;" oninput="qvAutoCalc()">
          </div>
          <div class="calc-field" style="margin:0">
            <label class="calc-label">Days/week</label>
            <input type="number" class="calc-input" id="qvDaysWk" placeholder="7" min="1" max="7" value="7" style="font-size:14px;padding:9px 10px;" oninput="qvAutoCalc()">
          </div>
          <div class="calc-field" style="margin:0">
            <label class="calc-label">Cycle (weeks)</label>
            <input type="number" class="calc-input" id="qvWeeks" placeholder="12" min="1" style="font-size:14px;padding:9px 10px;" oninput="qvAutoCalc()">
          </div>
        </div>
        <button class="calc-btn" id="qvCopyBtn" style="padding:11px" onclick="qvCopy()">Export Info</button>
        <div class="calc-result" id="qvResult" style="margin-top:10px;padding:14px;">
          <div class="calc-result-label">Vials needed</div>
          <div class="calc-result-main" id="qvCount">—</div>
          <div class="calc-result-sub" id="qvSub">—</div>
          <div class="calc-result-grid" style="margin-top:10px;padding-top:10px;">
            <div class="calc-result-item"><div class="calc-result-item-label">Total doses</div><div class="calc-result-item-value" id="qvTotalDoses">—</div></div>
            <div class="calc-result-item"><div class="calc-result-item-label">Leftover</div><div class="calc-result-item-value" id="qvLeftover">—</div></div>
          </div>
        </div>
        <div class="calc-error" id="qvError"></div>
    </div>
    <div class="disclaimer">${tr('research_note')}</div>
  `;
  window.scrollTo(0, 0);
}

// ─── Collapsible sections ─────────────────────────────────
export function toggleSec(header) {
  const body = header.nextElementSibling;
  const chev = header.querySelector('.sh-chevron');
  body.classList.toggle('open');
  chev.classList.toggle('open');
}

// ─── Stacks: list view ───────────────────────────────────
export function renderStacks() {
  document.getElementById('stacksList').innerHTML = STACKS.map((stack, si) => {
    const s = getStackData(si, AppState.lang);
    return `
    <div class="stack-card" style="animation-delay:${si*0.05}s" onclick="showStackDetail(${si})">
      <div class="stack-hdr" style="border-left:3px solid ${stack.color}">
        <div class="stack-hdr-content">
          <div class="stack-name">${s.emoji} ${s.name}</div>
          <div class="stack-goal">${s.goal}</div>
          ${s.cycle ? `<div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--text3);margin-top:5px;letter-spacing:0.03em;">⏱ ${s.cycle}</div>` : ''}
        </div>
        <svg style="width:16px;height:16px;color:var(--text3);flex-shrink:0;margin-top:3px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </div>
    </div>`;
  }).join('');
}

// ─── Stacks: detail view ─────────────────────────────────
export function showStackDetail(idx, skipHistory = false) {
  if (!skipHistory) pushNav();
  AppState.originStackIdx = idx;
  const stack = getStackData(idx, AppState.lang);
  document.getElementById('stacksListView').style.display = 'none';
  const dv = document.getElementById('stackDetailView');
  dv.style.display = 'block';
  document.getElementById('stackDetailTitle').textContent = stack.emoji + ' ' + stack.name;
  const cycleHTML = stack.cycle
    ? '<div style="background:var(--card2);border-radius:8px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;gap:8px;"><span style="font-size:16px;">&#9201;</span><div><div style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;">Cycle Length</div><div style="font-size:13px;font-weight:500;color:var(--text1);margin-top:2px;">'+stack.cycle+'</div></div></div>'
    : '';
  const stackWarnings = getInteractionWarnings(stack.peptides.map(p => p.name));
  const warningsHTML = stackWarnings.length ? `
    <div class="section-card">
      <div class="section-header" onclick="toggleSec(this)">
        <div class="sh-left"><div class="sh-icon amber">⚠</div><div class="sh-title">Interaction Notes</div></div>
        <svg class="sh-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <div class="section-body">
        ${stackWarnings.map(w => `
          <div style="display:flex;gap:8px;align-items:flex-start;padding:6px 0;border-bottom:1px solid var(--border);">
            <span style="color:var(--amber);flex-shrink:0;">⚠</span>
            <div>
              <div style="font-size:12px;font-weight:600;color:var(--text);">${w.a} + ${w.b}</div>
              ${w.reason ? `<div style="font-size:11px;color:var(--text3);margin-top:2px;">${w.reason}</div>` : ''}
            </div>
          </div>`).join('')}
      </div>
    </div>` : '';

  const peptideSections = stack.peptides.map(p => `
    <div class="sp-row">
      <div class="sp-name" onclick="goToProfile('${p.name.replace(/'/g,"\\'")}',true)">${p.name} <span style="font-size:11px;font-weight:400;opacity:0.6;">${tr('profile_link')}</span></div>
      <div class="sp-schedule">${p.schedule}</div>
      <table class="sp-table">
        <tr><td class="t-lo">🟢 LOW</td><td>${p.lo}</td><td style="font-size:11px;color:var(--text3)">Conservative</td></tr>
        <tr><td class="t-mid">🔵 MID</td><td>${p.mid}</td><td style="font-size:11px;color:var(--text3)">Standard</td></tr>
        <tr><td class="t-hi">🔴 HIGH</td><td>${p.hi}</td><td style="font-size:11px;color:var(--text3)">Experienced only</td></tr>
      </table>
    </div>`).join('');
  const studiesHTML = stack.studies && stack.studies.length
    ? stack.studies.map(s => {
        const linkHTML = s.url ? '<a class="sc-link" href="'+s.url+'" target="_blank" rel="noopener">'+tr('read_study')+'</a>' : '';
        const pmidHTML = s.pmid ? ' · PMID: '+s.pmid : '';
        return '<div class="study-card"><div class="sc-title">'+s.title+'</div><div class="sc-journal">'+s.journal+pmidHTML+'</div><div class="sc-summary">'+s.summary+'</div>'+linkHTML+'</div>';
      }).join('')
    : '<div style="color:var(--text3);font-size:12px;padding-top:6px;">See individual peptide profiles for citations.</div>';
  document.getElementById('stackDetailContent').innerHTML = `
    <div class="detail-hero" style="background:var(--navy);border-radius:8px;padding:18px;margin-bottom:10px;position:relative;overflow:hidden;">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${stack.color}"></div>
      <div class="dh-cat">${stack.goal}</div>
      <div class="dh-name">${stack.emoji} ${stack.name}</div>
      <div class="dh-tagline" style="margin-top:6px;">${stack.description||''}</div>
      <div class="dh-badges" style="margin-top:12px;">
        <span class="dh-badge phase2">${stack.peptides.length} ${tr('stack_peptides_badge')}</span>
        <span class="dh-badge fda">${tr('stack_research_badge')}</span>
      </div>
    </div>
    <div class="section-card">
      <div class="section-header" onclick="toggleSec(this)">
        <div class="sh-left"><div class="sh-icon teal">✓</div><div class="sh-title">${tr('stack_benefits_title')}</div></div>
        <svg class="sh-chevron open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <div class="section-body open">
        ${(stack.benefits||[]).map(b => `<div class="benefit-row"><div class="benefit-check">✓</div>${b}</div>`).join('')}
      </div>
    </div>
    <div class="section-card">
      <div class="section-header" onclick="toggleSec(this)">
        <div class="sh-left"><div class="sh-icon blue">💊</div><div class="sh-title">${tr('stack_dosing_title')}</div></div>
        <svg class="sh-chevron open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <div class="section-body open">
        ${cycleHTML}
        <div class="dose-legend" style="margin-bottom:12px;">
          <div class="dl-item"><span class="dl-label lo">LOW</span><div class="dl-desc">Conservative</div></div>
          <div class="dl-item"><span class="dl-label mid">STANDARD</span><div class="dl-desc">Maintenance</div></div>
          <div class="dl-item"><span class="dl-label hi">HIGH</span><div class="dl-desc">Experienced only</div></div>
        </div>
        ${peptideSections}
        <div class="stack-note" style="margin:12px 0 0;"><strong>⚠ Important:</strong> ${stack.note}</div>
      </div>
    </div>
    ${warningsHTML}
    <div class="section-card">
      <div class="section-header" onclick="toggleSec(this)">
        <div class="sh-left"><div class="sh-icon amber">⚠</div><div class="sh-title">Watch Out For</div></div>
        <svg class="sh-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <div class="section-body">
        ${(stack.sideEffects||[]).map(se => `<div class="se-row"><span class="se-badge ${se.severity}">${se.severity==='low'?tr('sev_mild'):se.severity==='med'?tr('sev_mod'):tr('sev_serious')}</span>${se.text}</div>`).join('')}
      </div>
    </div>
    <div class="section-card">
      <div class="section-header" onclick="toggleSec(this)">
        <div class="sh-left"><div class="sh-icon blue">🔬</div><div class="sh-title">${tr('label_why_together')}</div></div>
        <svg class="sh-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <div class="section-body">
        <div class="mechanism-box">${stack.rationale||'Each peptide targets a different biological pathway, creating genuine additive effects.'}</div>
        <div style="margin-top:10px;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--text3);letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px;">${tr('label_profiles')}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${stack.peptides.map(p=>'<div onclick="goToProfile(\''+p.name.replace(/'/g,"\\'")+'\',true)" style="background:var(--blue-light);color:var(--blue);border:1px solid var(--mid-border);border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;font-weight:500;">'+p.name+' →</div>').join('')}
        </div>
      </div>
    </div>
    <div class="section-card">
      <div class="section-header" onclick="toggleSec(this)">
        <div class="sh-left"><div class="sh-icon purple">📚</div><div class="sh-title">${tr('sec_studies')}</div></div>
        <svg class="sh-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <div class="section-body">${studiesHTML}</div>
    </div>
    <div class="calc-section" style="margin-top:8px;">
      <div class="calc-section-title" style="margin-bottom:14px;"><div class="sh-icon amber">📦</div>Quick Vial Calculator</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
          <div class="calc-field" style="margin:0">
            <label class="calc-label">Dose per injection</label>
            <div class="calc-input-row">
              <input type="number" class="calc-input" id="qvDose" placeholder="e.g. 500" min="1" style="font-size:14px;padding:9px 10px;" oninput="qvAutoCalc()">
              <select class="calc-select" id="qvDoseUnit" style="flex:0;min-width:65px;padding-right:24px;font-size:13px;" onchange="qvAutoCalc()">
                <option value="mcg">mcg</option>
                <option value="mg">mg</option>
              </select>
            </div>
          </div>
          <div class="calc-field" style="margin:0">
            <label class="calc-label">Vial size</label>
            <div class="calc-input-row">
              <input type="number" class="calc-input" id="qvVialSize" placeholder="e.g. 5" min="0.1" step="0.1" style="font-size:14px;padding:9px 10px;" oninput="qvAutoCalc()">
              <span class="calc-unit">mg</span>
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">
          <div class="calc-field" style="margin:0">
            <label class="calc-label">Injections/day</label>
            <input type="number" class="calc-input" id="qvInjectDay" placeholder="1" min="1" max="10" value="1" style="font-size:14px;padding:9px 10px;" oninput="qvAutoCalc()">
          </div>
          <div class="calc-field" style="margin:0">
            <label class="calc-label">Days/week</label>
            <input type="number" class="calc-input" id="qvDaysWk" placeholder="7" min="1" max="7" value="7" style="font-size:14px;padding:9px 10px;" oninput="qvAutoCalc()">
          </div>
          <div class="calc-field" style="margin:0">
            <label class="calc-label">Cycle (weeks)</label>
            <input type="number" class="calc-input" id="qvWeeks" placeholder="12" min="1" style="font-size:14px;padding:9px 10px;" oninput="qvAutoCalc()">
          </div>
        </div>
        <button class="calc-btn" id="qvCopyBtn" style="padding:11px" onclick="qvCopy()">Export Info</button>
        <div class="calc-result" id="qvResult" style="margin-top:10px;padding:14px;">
          <div class="calc-result-label">Vials needed</div>
          <div class="calc-result-main" id="qvCount">—</div>
          <div class="calc-result-sub" id="qvSub">—</div>
          <div class="calc-result-grid" style="margin-top:10px;padding-top:10px;">
            <div class="calc-result-item"><div class="calc-result-item-label">Total doses</div><div class="calc-result-item-value" id="qvTotalDoses">—</div></div>
            <div class="calc-result-item"><div class="calc-result-item-label">Leftover</div><div class="calc-result-item-value" id="qvLeftover">—</div></div>
          </div>
        </div>
        <div class="calc-error" id="qvError"></div>
    </div>
    <div class="disclaimer">${tr('stack_research_note')}</div>
  `;
  window.scrollTo(0, 0);
}


// ─── Navigation history engine ────────────────────────────

export function captureNavState() {
  const page = document.querySelector('.nav-tab.active')?.dataset.page || 'browse';
  if (page === 'stacks') {
    return document.getElementById('stackDetailView')?.style.display !== 'none'
      ? { page: 'stacks', view: 'stackDetail' }
      : { page: 'stacks', view: 'stacksList' };
  }
  if (page === 'browse') {
    if (document.getElementById('detailView')?.style.display !== 'none')
      return { page: 'browse', view: 'detail', name: document.getElementById('detailTitle')?.textContent };
    if (document.getElementById('listView')?.style.display !== 'none')
      return { page: 'browse', view: 'list', catId: document.getElementById('listView').dataset.catId };
    return { page: 'browse', view: 'cat' };
  }
  return { page };
}

export function restoreNavState(state) {
  const page = state.page || 'browse';
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const tab = document.querySelector(`[data-page="${page}"]`);
  if (tab) tab.classList.add('active');
  document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
  const pg = document.getElementById(`page-${page}`);
  if (pg) { pg.classList.add('active'); pg.style.display = 'block'; }

  if (page === 'stacks') {
    const isList = state.view === 'stacksList';
    document.getElementById('stacksListView').style.display = isList ? 'block' : 'none';
    document.getElementById('stackDetailView').style.display = isList ? 'none' : 'block';
  } else if (page === 'browse') {
    document.getElementById('catView').style.display = 'none';
    document.getElementById('listView').style.display = 'none';
    document.getElementById('detailView').style.display = 'none';
    if (state.view === 'detail') {
      document.getElementById('detailView').style.display = 'block';
      showDetail(state.name);
    } else if (state.view === 'list') {
      document.getElementById('listView').style.display = 'block';
    } else {
      document.getElementById('catView').style.display = 'block';
    }
  }
  window.scrollTo(0, 0);
}

function pushNav() {
  AppState.navHistory.push(captureNavState());
  AppState.navForward = [];
}

export function navBack() {
  if (!AppState.navHistory.length) return;
  AppState.navForward.push(captureNavState());
  restoreNavState(AppState.navHistory.pop());
}

export function navForward() {
  if (!AppState.navForward.length) return;
  AppState.navHistory.push(captureNavState());
  restoreNavState(AppState.navForward.pop());
}

export function navToDetail(name) {
  pushNav();
  showDetail(name);
}

// ─── Navigation helpers ───────────────────────────────────
export function activatePage(pageId) {
  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });
  const pg = document.getElementById('page-' + pageId);
  pg.classList.add('active');
  pg.style.display = 'block';
  window.scrollTo(0, 0);
  if (pageId === 'schedule' && typeof window.renderSchedulePage === 'function') {
    window.renderSchedulePage();
  }
}

export function goToProfile(name) {
  pushNav();
  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelector('[data-page="browse"]').classList.add('active');
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });
  const bp = document.getElementById('page-browse');
  bp.classList.add('active');
  bp.style.display = 'block';
  document.getElementById('catView').style.display = 'none';
  document.getElementById('listView').style.display = 'none';
  document.getElementById('detailView').style.display = 'block';
  document.getElementById('detailTitle').textContent = name;
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').style.display = 'none';
  document.getElementById('mainNav').style.display = 'flex';
  showDetail(name);
  window.scrollTo(0, 0);
}

export function switchToStack(idx) {
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').style.display = 'none';
  document.getElementById('mainNav').style.display = 'flex';
  activatePage('stacks');
  setTimeout(() => showStackDetail(idx), 50);
}
