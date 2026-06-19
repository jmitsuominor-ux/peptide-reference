// ═══════════════════════════════════════════════════════
// LOCAL STORAGE — recently viewed & favourites
// ═══════════════════════════════════════════════════════
const RECENT_KEY = 'peptideref_recent';
const FAV_KEY    = 'peptideref_favorites';
const MAX_RECENT = 6;

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function getRecent()  { return load(RECENT_KEY); }
export function getFavorites() { return load(FAV_KEY); }
export function isFavorite(name) { return load(FAV_KEY).includes(name); }

export function addToRecent(name) {
  const list = load(RECENT_KEY).filter(n => n !== name);
  list.unshift(name);
  save(RECENT_KEY, list.slice(0, MAX_RECENT));
}

export function toggleFavorite(name) {
  const list = load(FAV_KEY);
  const idx  = list.indexOf(name);
  idx >= 0 ? list.splice(idx, 1) : list.unshift(name);
  save(FAV_KEY, list);
  return idx < 0; // true = now favourited
}
