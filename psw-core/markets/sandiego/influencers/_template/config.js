// ── Influencer Page Config ─────────────────────────────────────
// To add a new influencer:
//   1. Copy this folder to influencers/<influencer-handle>/
//   2. Fill in every field below
//   3. Set customPrices for any products with a markup
//      (prices can only be at or above Michael's base price)
//   4. Share the folder's index.html URL with the influencer

window.PSW_CONFIG = {
  // Market this influencer is tied to (always San Diego for US influencers)
  marketName:    'Peptide Supply Warehouse',
  marketCity:    'San Diego',

  // Michael's contact info (stays the same for all influencer pages)
  contactName:   'Michael John',
  whatsapp:      '+1-310-683-0049',
  mobile:        '+1-310-683-0049',

  // Google Sheet URL for San Diego inventory (same sheet as main SD site)
  sheetApiUrl:   '',   // TODO: paste San Diego Google Apps Script URL

  defaultLang:   'en',
  accentColor:   '#ff6b9d',   // pink — change per influencer if desired

  // ── Influencer fields ────────────────────────────────────────
  isInfluencer:      true,
  influencerName:    '',        // e.g. 'Dr. Amanda Cole'
  influencerHandle:  '',        // e.g. '@dramandacole'
  influencerPhoto:   '',        // URL to headshot image (leave blank for initial)

  // ── Pricing ──────────────────────────────────────────────────
  pricingMode:   'influencer',
  customPrices:  {
    // Format: 'PRODUCT_CODE': price_in_dollars
    // Price must be >= Michael's base price (floor is enforced by the admin tool)
    // Example:
    // 'TR5':  15.00,
    // 'SM5':  14.00,
  },
};
