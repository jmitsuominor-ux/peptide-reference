// ═══════════════════════════════════════════════════════
// APP STATE — single source of truth, replaces scattered globals
// ═══════════════════════════════════════════════════════
export const AppState = {
  lang: 'en',
  isDark: false,
  plannerTier: 'mid',
  sdTier: 'mid',
  profileOrigin: null,    // 'stack' | null — where backToList navigates
  originStackIdx: null,   // which stack detail to restore when going back
};
