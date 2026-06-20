// ═══════════════════════════════════════════════════════
// APP STATE — single source of truth, replaces scattered globals
// ═══════════════════════════════════════════════════════
export const AppState = {
  lang: 'en',
  isDark: false,
  plannerTier: 'mid',
  sdTier: 'mid',
  vialMode: 'need',
  originStackIdx: null,   // which stack is currently open (for re-render on lang switch)
  navHistory: [],         // back stack — array of nav state snapshots
  navForward: [],         // forward stack — populated when going back
  tabMemory: { browse: null, stacks: null, calculate: null, schedule: null },
  compoundList: [],       // ordered compound names for prev/next navigation
  currentDetailName: '',  // which compound detail is currently open
};
