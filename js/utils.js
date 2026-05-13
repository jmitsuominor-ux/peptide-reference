// ═══════════════════════════════════════════════════════
// UTILITIES — i18n helpers, data accessors, calculators
// ═══════════════════════════════════════════════════════
import { TRANSLATIONS, CAT_I18N_KEYS } from './data/translations.js';
import { PEPTIDES, PEPTIDE_ES } from './data/peptides.js';
import { STACKS, STACKS_ES } from './data/stacks.js';

export { TRANSLATIONS, CAT_I18N_KEYS };

// ─── i18n ───────────────────────────────────────────────
export function t(key, lang) {
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) ||
         (TRANSLATIONS.en && TRANSLATIONS.en[key]) ||
         key;
}

// ─── Data accessors (pure — accept lang as param) ────────
export function getPeptideData(name, lang) {
  const base = PEPTIDES[name];
  if (!base) return null;
  if (lang === 'es' && PEPTIDE_ES[name]) return { ...base, ...PEPTIDE_ES[name] };
  return base;
}

export function getStackData(idx, lang) {
  const base = STACKS[idx];
  if (!base) return null;
  if (lang === 'es' && STACKS_ES[idx]) return { ...base, ...STACKS_ES[idx] };
  return base;
}

// Re-export raw data for UI modules that iterate over them
export { PEPTIDES, STACKS };

// ─── Dose parser ─────────────────────────────────────────
// Converts dose strings like "500 mcg/day", "2 mg 2x/wk" → mg/week.
export function parseDoseToMgPerWeek(doseStr) {
  if (!doseStr) return null;
  const s = doseStr.toLowerCase();

  function toMg(amt, unit) {
    const n = parseFloat(String(amt).replace(',', ''));
    if (unit === 'mcg') return n / 1000;
    if (unit === 'iu') return n / 1000; // rough conversion
    return n; // mg
  }

  // Per-week explicit: "5 mg/wk", "500 mcg 2x/wk", "1000 IU 3x/week"
  if (s.includes('/wk') || s.includes('/week') || s.includes('per week')) {
    const nxMatch = s.match(/([\d.,]+)\s*(mg|mcg|iu)\s*(\d+)x\s*\/w/);
    if (nxMatch) return toMg(nxMatch[1], nxMatch[2]) * parseInt(nxMatch[3]);
    const onceMatch = s.match(/([\d.,]+)\s*(mg|mcg|iu)/);
    if (onceMatch) return toMg(onceMatch[1], onceMatch[2]);
  }

  // Per day: "500 mcg/day", "250 mcg 2x/day"
  if (s.includes('/day') || s.includes('per day')) {
    const amtMatch = s.match(/([\d.,]+)\s*(mg|mcg|iu)/);
    if (amtMatch) {
      const timesMatch = s.match(/(\d+)x\s*\/day/);
      return toMg(amtMatch[1], amtMatch[2]) * (timesMatch ? parseInt(timesMatch[1]) : 1) * 7;
    }
  }

  // Per night: "250 mcg/night"
  if (s.includes('/night') || s.includes('nightly')) {
    const m = s.match(/([\d.,]+)\s*(mg|mcg)/);
    if (m) return toMg(m[1], m[2]) * 7;
  }

  // As-needed — cannot calculate weekly total
  if (s.includes('as needed') || s.includes('burst')) return null;

  // Fallback: grab first amount + unit, assume once daily
  const fallback = s.match(/([\d.,]+)\s*(mg|mcg|iu)/);
  if (fallback) return toMg(fallback[1], fallback[2]) * 7;
  return null;
}

// ─── Vial size suggestions ────────────────────────────────
export function getCommonVialSize(name) {
  const sizes = {
    'BPC-157': '5', 'TB-500': '5', 'GHK-Cu': '5', 'KPV': '5',
    'CJC-1295 (no DAC)': '2', 'CJC-1295 (with DAC)': '2',
    'Ipamorelin': '2', 'Sermorelin': '3', 'GHRP-2': '2', 'GHRP-6': '5',
    'Hexarelin': '2', 'Tesamorelin': '1', 'HGH 191AA': '10',
    'IGF-1 LR3': '1', 'IGF DES': '1', 'MGF': '2',
    'NAD+': '500', 'SS-31': '5', 'MOTS-c': '5', '5-amino-1mq': '50',
    'Thymosin Alpha-1': '1.5', 'Epithalon': '10',
    'PT-141': '10', 'KissPeptin-10': '5', 'HCG': '5000',
    'Semaglutide': '3', 'Tirzepatide': '5', 'Cagrilintide': '3',
    'Retatrutide': '5', 'AOD9604': '5', 'HGH Fragment': '5',
    'Semax': '3', 'Selank': '3', 'L-Glutathione': '600',
    'Melanotan I': '10', 'Melanotan II': '10',
  };
  return sizes[name] || '5';
}

// ─── Shared vial count calculator ────────────────────────
// Used by the Vial Count tab, Stack Detail planner, and Stack Planner.
export function computeVialCount({ doseMg, injectionsPerDay, daysPerWeek, weeks, vialSizeMg }) {
  const totalDoses = injectionsPerDay * daysPerWeek * weeks;
  const totalMg = doseMg * totalDoses;
  const vialsNeeded = Math.ceil(totalMg / vialSizeMg);
  const mgPerWeek = doseMg * injectionsPerDay * daysPerWeek;
  const usedInLastVial = totalMg % vialSizeMg;
  const leftover = usedInLastVial === 0 ? 0 : vialSizeMg - usedInLastVial;
  return { totalDoses, totalMg, vialsNeeded, mgPerWeek, leftover };
}
