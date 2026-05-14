// ═══════════════════════════════════════════════════════════════
// PSW CORE ENGINE  v1.0
// Reads window.PSW_CONFIG and renders the full Peptide Supply
// Warehouse site. Drop a <script src="config.js"> before this.
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var C = window.PSW_CONFIG || {};

  // ── Defaults ─────────────────────────────────────────────────
  var cfg = {
    marketName:    C.marketName    || 'Peptide Supply Warehouse',
    marketCity:    C.marketCity    || '',
    contactName:   C.contactName   || 'Michael John',
    whatsapp:      C.whatsapp      || '',
    mobile:        C.mobile        || '',
    sheetApiUrl:   C.sheetApiUrl   || '',
    defaultLang:   C.defaultLang   || 'en',
    accentColor:   C.accentColor   || '#00b4d8',
    // Influencer mode
    isInfluencer:       C.isInfluencer       || false,
    influencerName:     C.influencerName     || '',
    influencerHandle:   C.influencerHandle   || '',
    influencerPhoto:    C.influencerPhoto    || '',
    influencerAdminUrl: C.influencerAdminUrl || '',
    // Pricing: either 'standard' or 'influencer'
    pricingMode:   C.pricingMode   || 'standard',
    customPrices:  C.customPrices  || {},   // { code: price } loaded by influencer admin
  };

  // ── Product catalog (shared across all markets) ───────────────
  var ALL_PRODUCTS = [
    {code:'TR5',  name:'Tirzepatide',            cat:'Weight Loss',       spec:'5mg/vial',                  price:12.61},
    {code:'TR10', name:'Tirzepatide',            cat:'Weight Loss',       spec:'10mg/vial',                 price:18.02},
    {code:'TR15', name:'Tirzepatide',            cat:'Weight Loss',       spec:'15mg/vial',                 price:22.52},
    {code:'TR20', name:'Tirzepatide',            cat:'Weight Loss',       spec:'20mg/vial',                 price:28.53},
    {code:'TR30', name:'Tirzepatide',            cat:'Weight Loss',       spec:'30mg/vial',                 price:36.04},
    {code:'TR40', name:'Tirzepatide',            cat:'Weight Loss',       spec:'40mg/vial',                 price:43.54},
    {code:'TR50', name:'Tirzepatide',            cat:'Weight Loss',       spec:'50mg/vial',                 price:52.55},
    {code:'TR60', name:'Tirzepatide',            cat:'Weight Loss',       spec:'60mg/vial',                 price:59.46},
    {code:'SM5',  name:'Semaglutide',            cat:'Weight Loss',       spec:'5mg/vial',                  price:11.41},
    {code:'SM10', name:'Semaglutide',            cat:'Weight Loss',       spec:'10mg/vial',                 price:16.52},
    {code:'SM15', name:'Semaglutide',            cat:'Weight Loss',       spec:'15mg/vial',                 price:21.02},
    {code:'SM20', name:'Semaglutide',            cat:'Weight Loss',       spec:'20mg/vial',                 price:28.53},
    {code:'SM30', name:'Semaglutide',            cat:'Weight Loss',       spec:'30mg/vial',                 price:36.04},
    {code:'RT5',  name:'Retatrutide',            cat:'Weight Loss',       spec:'5mg/vial',                  price:19.52},
    {code:'RT10', name:'Retatrutide',            cat:'Weight Loss',       spec:'10mg/vial',                 price:29.43},
    {code:'RT15', name:'Retatrutide',            cat:'Weight Loss',       spec:'15mg/vial',                 price:39.04},
    {code:'RT20', name:'Retatrutide',            cat:'Weight Loss',       spec:'20mg/vial',                 price:48.05},
    {code:'RT30', name:'Retatrutide',            cat:'Weight Loss',       spec:'30mg/vial',                 price:66.07},
    {code:'RT40', name:'Retatrutide',            cat:'Weight Loss',       spec:'40mg/vial',                 price:82.58},
    {code:'RT50', name:'Retatrutide',            cat:'Weight Loss',       spec:'50mg/vial',                 price:96.10},
    {code:'RT60', name:'Retatrutide',            cat:'Weight Loss',       spec:'60mg/vial',                 price:114.11},
    {code:'LC216',name:'Lipo-C',                 cat:'Weight Loss',       spec:'10ml/vial',                 price:24.02},
    {code:'CGL5', name:'Cagrilintide',           cat:'Weight Loss',       spec:'5mg/vial',                  price:33.03},
    {code:'CGL10',name:'Cagrilintide',           cat:'Weight Loss',       spec:'10mg/vial',                 price:60.06},
    {code:'CS5',  name:'CagriSema Combo',        cat:'Weight Loss',       spec:'Sema 2.5mg + Cagri 2.5mg', price:28.53},
    {code:'CS10', name:'CagriSema Combo',        cat:'Weight Loss',       spec:'Sema 5mg + Cagri 5mg',     price:51.05},
    {code:'5AD',  name:'AOD-9604',               cat:'Weight Loss',       spec:'5mg/vial',                  price:33.03},
    {code:'CD5',  name:'CJC-1295 With DAC',      cat:'Growth Hormone',    spec:'5mg/vial',                  price:49.55},
    {code:'CND5', name:'CJC-1295 Without DAC',   cat:'Growth Hormone',    spec:'5mg/vial',                  price:24.02},
    {code:'CND10',name:'CJC-1295 Without DAC',   cat:'Growth Hormone',    spec:'10mg/vial',                 price:42.04},
    {code:'IP5',  name:'Ipamorelin',             cat:'Growth Hormone',    spec:'5mg/vial',                  price:13.51},
    {code:'IP10', name:'Ipamorelin',             cat:'Growth Hormone',    spec:'10mg/vial',                 price:22.52},
    {code:'CP10', name:'CJC-1295 + Ipamorelin',  cat:'Growth Hormone',    spec:'CJC 5mg + IPA 5mg',        price:33.03},
    {code:'SMO5', name:'Sermorelin Acetate',      cat:'Growth Hormone',    spec:'5mg/vial',                  price:24.02},
    {code:'SMO10',name:'Sermorelin Acetate',      cat:'Growth Hormone',    spec:'10mg/vial',                 price:40.54},
    {code:'TSM5', name:'Tesamorelin',             cat:'Growth Hormone',    spec:'5mg/vial',                  price:33.03},
    {code:'TSM10',name:'Tesamorelin',             cat:'Growth Hormone',    spec:'10mg/vial',                 price:61.56},
    {code:'H10',  name:'HGH 191AA',              cat:'Growth Hormone',    spec:'10 IU/vial',                price:15.02},
    {code:'H15',  name:'HGH 191AA',              cat:'Growth Hormone',    spec:'15 IU/vial',                price:22.52},
    {code:'H24',  name:'HGH 191AA',              cat:'Growth Hormone',    spec:'24 IU/vial',                price:36.04},
    {code:'FR5',  name:'HGH Fragment 176-191',   cat:'Growth Hormone',    spec:'5mg/vial',                  price:31.53},
    {code:'BC5',  name:'BPC-157',                cat:'Healing & Recovery',spec:'5mg/vial',                  price:12.91},
    {code:'BC10', name:'BPC-157',                cat:'Healing & Recovery',spec:'10mg/vial',                 price:20.42},
    {code:'TB5',  name:'TB-500',                 cat:'Healing & Recovery',spec:'5mg/vial',                  price:24.02},
    {code:'TB10', name:'TB-500',                 cat:'Healing & Recovery',spec:'10mg/vial',                 price:40.54},
    {code:'BB10', name:'BPC-157 + TB-500 Combo', cat:'Healing & Recovery',spec:'BPC 5mg + TB 5mg',         price:31.53},
    {code:'BB20', name:'BPC-157 + TB-500 Combo', cat:'Healing & Recovery',spec:'BPC 10mg + TB 10mg',       price:57.06},
    {code:'KPV10',name:'KPV',                    cat:'Healing & Recovery',spec:'10mg/vial',                 price:18.02},
    {code:'CU50', name:'GHK-Cu',                 cat:'Anti-Aging & Immune',spec:'50mg/vial',               price:10.51},
    {code:'CU100',name:'GHK-Cu',                 cat:'Anti-Aging & Immune',spec:'100mg/vial',              price:15.02},
    {code:'ET10', name:'Epithalon',              cat:'Anti-Aging & Immune',spec:'10mg/vial',               price:15.02},
    {code:'ET50', name:'Epithalon',              cat:'Anti-Aging & Immune',spec:'50mg/vial',               price:45.05},
    {code:'TA5',  name:'Thymosin Alpha-1',       cat:'Anti-Aging & Immune',spec:'5mg/vial',                price:27.03},
    {code:'TA10', name:'Thymosin Alpha-1',       cat:'Anti-Aging & Immune',spec:'10mg/vial',               price:48.05},
    {code:'GTT',  name:'L-Glutathione',          cat:'Anti-Aging & Immune',spec:'1500mg/vial',             price:24.02},
    {code:'NP810',name:'SNAP-8',                 cat:'Anti-Aging & Immune',spec:'10mg/vial',               price:16.52},
    {code:'NJ500',name:'NAD+',                   cat:'Mitochondrial',     spec:'500mg/vial',                price:20.42},
    {code:'NJ1000',name:'NAD+',                  cat:'Mitochondrial',     spec:'1000mg/vial',               price:34.53},
    {code:'2S10', name:'SS-31',                  cat:'Mitochondrial',     spec:'10mg/vial',                 price:29.43},
    {code:'2S50', name:'SS-31',                  cat:'Mitochondrial',     spec:'50mg/vial',                 price:97.60},
    {code:'MS10', name:'MOTS-C',                 cat:'Mitochondrial',     spec:'10mg/vial',                 price:20.42},
    {code:'MS40', name:'MOTS-C',                 cat:'Mitochondrial',     spec:'40mg/vial',                 price:60.06},
    {code:'5AM',  name:'5-Amino-1MQ',            cat:'Mitochondrial',     spec:'5mg/vial',                  price:13.51},
    {code:'50AM', name:'5-Amino-1MQ',            cat:'Mitochondrial',     spec:'50mg/vial',                 price:27.03},
    {code:'322',  name:'SLU-PP-332',             cat:'Mitochondrial',     spec:'5mg/vial',                  price:43.54},
    {code:'IG01', name:'IGF-1 LR3',              cat:'Muscle & IGF',      spec:'0.1mg/vial',                price:17.42},
    {code:'IG1',  name:'IGF-1 LR3',              cat:'Muscle & IGF',      spec:'1mg/vial',                  price:60.06},
    {code:'IGD',  name:'IGF-1 DES',              cat:'Muscle & IGF',      spec:'1mg/vial',                  price:15.02},
    {code:'P41',  name:'PT-141',                 cat:'Hormonal',          spec:'10mg/vial',                 price:19.52},
    {code:'G5K',  name:'HCG',                    cat:'Hormonal',          spec:'5,000 IU/vial',             price:25.53},
    {code:'G10K', name:'HCG',                    cat:'Hormonal',          spec:'10,000 IU/vial',            price:46.55},
    {code:'KS5',  name:'Kisspeptin-10',          cat:'Hormonal',          spec:'5mg/vial',                  price:18.02},
    {code:'KS10', name:'Kisspeptin-10',          cat:'Hormonal',          spec:'10mg/vial',                 price:30.03},
    {code:'MT1',  name:'Melanotan I',            cat:'Hormonal',          spec:'10mg/vial',                 price:15.02},
    {code:'ML10', name:'Melanotan II',           cat:'Hormonal',          spec:'10mg/vial',                 price:15.02},
    {code:'MT10', name:'Melatonin',              cat:'Hormonal',          spec:'10mg/vial',                 price:17.42},
    {code:'SK5',  name:'Selank',                 cat:'Cognitive',         spec:'5mg/vial',                  price:14.41},
    {code:'SK11', name:'Selank',                 cat:'Cognitive',         spec:'11mg/vial',                 price:21.02},
    {code:'XA5',  name:'Semax',                  cat:'Cognitive',         spec:'5mg/vial',                  price:15.02},
    {code:'XA11', name:'Semax',                  cat:'Cognitive',         spec:'11mg/vial',                 price:20.42},
    {code:'DS5',  name:'DSIP',                   cat:'Cognitive',         spec:'5mg/vial',                  price:14.41},
    {code:'DS10', name:'DSIP',                   cat:'Cognitive',         spec:'10mg/vial',                 price:24.02},
    {code:'VIP5', name:'VIP',                    cat:'Immune',            spec:'5mg/vial',                  price:28.53},
    {code:'VIP10',name:'VIP',                    cat:'Immune',            spec:'10mg/vial',                 price:46.55},
    {code:'375',  name:'LL-37',                  cat:'Immune',            spec:'5mg/vial',                  price:28.53},
    {code:'WA3',  name:'BAC Water',              cat:'Reconstitution',    spec:'3ml/vial',                  price:1.50},
    {code:'WA10', name:'BAC Water',              cat:'Reconstitution',    spec:'10ml/vial',                 price:3.00},
    {code:'AA',   name:'Acetic Acid Water',      cat:'Reconstitution',    spec:'3ml/vial',                  price:1.50},
  ];

  var CAT_ORDER = ['Weight Loss','Growth Hormone','Healing & Recovery','Anti-Aging & Immune','Mitochondrial','Muscle & IGF','Hormonal','Cognitive','Immune','Reconstitution'];

  // ── CSS ───────────────────────────────────────────────────────
  var CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
:root{
  --navy:#040e1f;--navy2:#071428;--navy3:#0a1d3a;
  --blue:#0e4fa8;--blue2:#1565c0;--blue-bright:#2196f3;
  --cyan:${cfg.accentColor};--cyan-dim:rgba(0,180,216,0.15);
  --white:#ffffff;--text:#d0e4f7;--text2:#8aafd4;--text3:#4a6d96;
  --border:rgba(255,255,255,0.08);--border2:rgba(255,255,255,0.14);
  --gold:#f0c040;--green:#00c896;--green-dim:rgba(0,200,150,0.12);
  --red:#ef5350;--red-dim:rgba(239,83,80,0.12);
  --mono:'Rajdhani',sans-serif;--sans:'Open Sans',sans-serif;
  --script:'Dancing Script',cursive;
}
html{scroll-behavior:smooth;}
body{font-family:var(--sans);background:var(--navy);color:var(--text);min-height:100vh;overflow-x:hidden;}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 80% 50% at 20% 20%,rgba(14,79,168,0.25) 0%,transparent 60%),radial-gradient(ellipse 60% 40% at 80% 80%,rgba(21,101,192,0.2) 0%,transparent 60%);pointer-events:none;z-index:0;}
body::after{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(33,150,243,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(33,150,243,0.04) 1px,transparent 1px);background-size:50px 50px;pointer-events:none;z-index:0;}
.topbar{position:sticky;top:0;z-index:200;background:rgba(4,14,31,0.96);border-bottom:1px solid rgba(33,150,243,0.2);backdrop-filter:blur(16px);}
.topbar-inner{max-width:1200px;margin:0 auto;padding:0 20px;height:58px;display:flex;align-items:center;gap:14px;}
.brand-logo{font-family:var(--mono);font-size:20px;font-weight:700;color:var(--white);letter-spacing:0.05em;text-shadow:0 0 20px rgba(33,150,243,0.6);cursor:pointer;user-select:none;}
.brand-logo span{color:var(--cyan);}
.brand-divider{width:1px;height:24px;background:var(--border2);}
.brand-sub{font-size:10px;color:var(--text2);letter-spacing:0.1em;font-family:var(--mono);text-transform:uppercase;}
.topbar-search{flex:1;max-width:340px;background:rgba(255,255,255,0.05);border:1px solid var(--border2);border-radius:6px;display:flex;align-items:center;padding:0 12px;gap:8px;transition:border-color 0.2s;}
.topbar-search:focus-within{border-color:rgba(33,150,243,0.4);}
.topbar-search svg{width:13px;height:13px;color:var(--text3);flex-shrink:0;}
.topbar-search input{background:transparent;border:none;outline:none;color:var(--white);font-family:var(--sans);font-size:13px;width:100%;padding:10px 0;}
.topbar-search input::placeholder{color:var(--text3);}
.cart-btn{margin-left:auto;display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,var(--blue),var(--blue-bright));border:none;border-radius:6px;padding:9px 16px;cursor:pointer;transition:all 0.15s;color:#fff;font-family:var(--mono);font-size:14px;font-weight:600;white-space:nowrap;letter-spacing:0.04em;box-shadow:0 4px 16px rgba(33,150,243,0.3);}
.cart-btn svg{width:15px;height:15px;}
.cart-badge{background:var(--gold);color:var(--navy);border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;font-family:var(--mono);flex-shrink:0;}
.hero{position:relative;z-index:1;padding:52px 20px 56px;text-align:center;overflow:hidden;}
.hero-rings{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:600px;height:600px;pointer-events:none;}
.ring{position:absolute;border-radius:50%;border:1px solid rgba(33,150,243,0.1);top:50%;left:50%;transform:translate(-50%,-50%);animation:pulse-ring 4s ease-out infinite;}
.ring:nth-child(1){width:200px;height:200px;animation-delay:0s;}
.ring:nth-child(2){width:350px;height:350px;animation-delay:1s;}
.ring:nth-child(3){width:500px;height:500px;animation-delay:2s;}
@keyframes pulse-ring{0%{opacity:0.6;transform:translate(-50%,-50%) scale(0.95);}100%{opacity:0;transform:translate(-50%,-50%) scale(1.05);}}
.hero-content{position:relative;z-index:1;max-width:700px;margin:0 auto;}
.hero-eyebrow{display:inline-flex;align-items:center;gap:8px;font-family:var(--mono);font-size:11px;font-weight:600;color:var(--cyan);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:20px;}
.hero-eyebrow::before,.hero-eyebrow::after{content:'';height:1px;background:linear-gradient(90deg,transparent,var(--cyan),transparent);width:40px;}
.hero-title{font-family:var(--mono);font-size:clamp(28px,7vw,56px);font-weight:700;color:var(--white);letter-spacing:0.04em;text-transform:uppercase;line-height:1.05;margin-bottom:14px;text-shadow:0 0 40px rgba(33,150,243,0.4);}
.hero-title span{color:transparent;background:linear-gradient(135deg,var(--cyan),var(--blue-bright));-webkit-background-clip:text;background-clip:text;}
.hero-tagline{font-family:var(--script);font-size:clamp(20px,4vw,30px);color:var(--silver,#c8d8ea);margin-bottom:8px;opacity:0.9;}
.hero-sub{font-size:13px;color:var(--text2);letter-spacing:0.06em;margin-bottom:28px;}
.hero-contact{display:inline-flex;flex-direction:column;gap:8px;background:rgba(255,255,255,0.04);border:1px solid var(--border2);border-radius:10px;padding:14px 24px;margin-bottom:24px;}
.contact-row{display:flex;align-items:center;gap:10px;font-family:var(--mono);font-size:14px;font-weight:600;color:var(--white);letter-spacing:0.04em;}
.contact-label{font-size:10px;color:var(--text2);letter-spacing:0.08em;margin-right:4px;}
.mj-sig{font-family:var(--script);font-size:32px;color:var(--gold);display:block;margin-bottom:4px;filter:drop-shadow(0 0 8px rgba(240,192,64,0.3));}
.influencer-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(0,180,216,0.08);border:1px solid rgba(0,180,216,0.2);border-radius:20px;padding:4px 14px 4px 4px;margin-bottom:16px;}
.influencer-avatar{width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid var(--cyan);}
.influencer-avatar-placeholder{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;font-family:var(--mono);}
.influencer-info{text-align:left;}
.influencer-info-name{font-family:var(--mono);font-size:13px;font-weight:700;color:var(--white);}
.influencer-info-handle{font-family:var(--mono);font-size:10px;color:var(--cyan);letter-spacing:0.04em;}
.cat-strip{position:relative;z-index:1;background:rgba(7,20,40,0.8);border-top:1px solid rgba(33,150,243,0.15);border-bottom:1px solid rgba(33,150,243,0.15);backdrop-filter:blur(8px);padding:0 20px;}
.cat-strip-inner{max-width:1200px;margin:0 auto;display:flex;gap:0;overflow-x:auto;scrollbar-width:none;}
.cat-strip-inner::-webkit-scrollbar{display:none;}
.cat-pill{padding:13px 18px;font-family:var(--mono);font-size:12px;font-weight:600;color:var(--text3);letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;transition:all 0.15s;border-bottom:2px solid transparent;white-space:nowrap;flex-shrink:0;}
.cat-pill:hover{color:var(--blue-bright);}
.cat-pill.active{color:var(--cyan);border-bottom-color:var(--cyan);}
.main{position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:28px 20px;}
.loading-state{text-align:center;padding:60px 20px;}
.loading-spinner{width:40px;height:40px;border:3px solid rgba(33,150,243,0.2);border-top-color:var(--blue-bright);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;}
@keyframes spin{to{transform:rotate(360deg);}}
.loading-text{font-family:var(--mono);font-size:12px;color:var(--text3);letter-spacing:0.08em;}
.product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:12px;}
.product-card{background:linear-gradient(145deg,rgba(10,29,58,0.9),rgba(7,20,40,0.95));border:1px solid var(--border);border-radius:10px;padding:16px 14px;display:flex;flex-direction:column;gap:6px;transition:all 0.2s;position:relative;overflow:hidden;}
.product-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--blue),var(--cyan));opacity:0;}
.product-card:active{transform:scale(0.98);}
.product-card.in-cart{border-color:rgba(0,200,150,0.35);}
.product-card.in-cart::before{opacity:1;}
.pc-cat{font-family:var(--mono);font-size:10px;font-weight:600;color:var(--text3);letter-spacing:0.1em;text-transform:uppercase;}
.pc-code{font-family:var(--mono);font-size:11px;color:var(--cyan);background:rgba(0,180,216,0.08);border:1px solid rgba(0,180,216,0.15);border-radius:3px;padding:2px 8px;width:fit-content;letter-spacing:0.06em;}
.pc-name{font-family:var(--mono);font-size:16px;font-weight:700;color:var(--white);line-height:1.2;letter-spacing:0.02em;}
.pc-spec{font-size:13px;color:var(--text2);margin-top:3px;}
.pc-stock{font-family:var(--mono);font-size:11px;font-weight:600;margin-top:5px;padding:3px 8px;border-radius:4px;width:fit-content;}
.pc-stock.in-stock{color:var(--green);background:rgba(0,200,150,0.1);border:1px solid rgba(0,200,150,0.2);}
.pc-stock.low-stock{color:var(--gold);background:rgba(240,192,64,0.1);border:1px solid rgba(240,192,64,0.2);}
.pc-stock.no-stock{color:var(--red);background:rgba(239,83,80,0.1);border:1px solid rgba(239,83,80,0.2);}
.pc-price{font-family:var(--mono);font-size:22px;font-weight:700;color:var(--cyan);margin-top:auto;padding-top:8px;letter-spacing:0.02em;}
.pc-add{width:100%;background:linear-gradient(135deg,rgba(14,79,168,0.4),rgba(33,150,243,0.3));color:var(--blue-bright);border:1px solid rgba(33,150,243,0.25);border-radius:6px;padding:10px;font-family:var(--mono);font-size:12px;font-weight:700;cursor:pointer;transition:all 0.15s;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:5px;letter-spacing:0.05em;text-transform:uppercase;}
.pc-add:hover{background:linear-gradient(135deg,var(--blue),var(--blue-bright));color:#fff;border-color:transparent;box-shadow:0 4px 14px rgba(33,150,243,0.35);}
.pc-add.in-cart{background:var(--green-dim);color:var(--green);border-color:rgba(0,200,150,0.25);}
.pc-add:active{transform:scale(0.96);}
.in-cart-dot{position:absolute;top:10px;right:10px;width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);display:none;}
.product-card.in-cart .in-cart-dot{display:block;}
.no-results{text-align:center;padding:60px 20px;color:var(--text3);font-family:var(--mono);}
.drawer-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:300;display:none;backdrop-filter:blur(4px);}
.drawer-overlay.open{display:block;}
.cart-drawer{position:fixed;top:0;right:0;bottom:0;width:100%;max-width:420px;background:linear-gradient(180deg,var(--navy2),var(--navy));border-left:1px solid rgba(33,150,243,0.2);z-index:400;transform:translateX(100%);transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);display:flex;flex-direction:column;box-shadow:-8px 0 40px rgba(0,0,0,0.5);}
.cart-drawer.open{transform:translateX(0);}
.drawer-header{padding:18px 20px 16px;border-bottom:1px solid rgba(33,150,243,0.15);display:flex;align-items:center;gap:10px;}
.drawer-title{font-family:var(--mono);font-size:16px;font-weight:700;letter-spacing:0.06em;color:var(--white);flex:1;}
.drawer-close{width:32px;height:32px;background:rgba(255,255,255,0.05);border:1px solid var(--border2);border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;color:var(--text2);transition:all 0.15s;}
.drawer-body{flex:1;overflow-y:auto;padding:16px 20px;}
.drawer-footer{padding:16px 20px;border-top:1px solid rgba(33,150,243,0.15);}
.cart-empty-state{text-align:center;padding:50px 20px;color:var(--text3);}
.cart-empty-state svg{width:48px;height:48px;margin-bottom:12px;opacity:0.4;}
.cart-empty-state p{font-family:var(--mono);font-size:12px;letter-spacing:0.06em;}
.cart-item{display:flex;gap:10px;align-items:flex-start;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);}
.cart-item:last-child{border-bottom:none;}
.ci-info{flex:1;min-width:0;}
.ci-name{font-family:var(--mono);font-size:13px;font-weight:700;color:var(--white);}
.ci-spec{font-size:11px;color:var(--text2);margin-top:2px;}
.ci-line-price{font-family:var(--mono);font-size:13px;font-weight:700;color:var(--cyan);margin-top:5px;}
.ci-controls{display:flex;align-items:center;gap:6px;flex-shrink:0;}
.qty-btn{width:26px;height:26px;border-radius:5px;background:rgba(255,255,255,0.05);border:1px solid var(--border2);color:var(--text2);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.12s;font-family:var(--mono);}
.qty-num{font-family:var(--mono);font-size:13px;font-weight:700;min-width:18px;text-align:center;color:var(--white);}
.ci-remove{width:26px;height:26px;border-radius:5px;background:var(--red-dim);border:1px solid rgba(239,83,80,0.2);color:var(--red);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.cart-totals{background:rgba(33,150,243,0.06);border:1px solid rgba(33,150,243,0.15);border-radius:8px;padding:14px;margin-bottom:14px;}
.ct-row{display:flex;justify-content:space-between;padding:4px 0;}
.ct-label{font-size:13px;color:var(--text2);}
.ct-value{font-family:var(--mono);font-size:13px;font-weight:700;color:var(--white);}
.ct-total .ct-label{font-family:var(--mono);font-size:15px;font-weight:700;color:var(--white);}
.ct-total .ct-value{font-size:20px;color:var(--cyan);}
.ct-divider{height:1px;background:rgba(33,150,243,0.15);margin:8px 0;}
.checkout-btn{width:100%;background:linear-gradient(135deg,var(--blue),var(--blue-bright));color:#fff;border:none;border-radius:8px;padding:14px;font-family:var(--mono);font-size:15px;font-weight:700;cursor:pointer;transition:all 0.15s;letter-spacing:0.06em;text-transform:uppercase;box-shadow:0 4px 20px rgba(33,150,243,0.35);}
.clear-cart-btn{width:100%;background:transparent;color:var(--text3);border:none;padding:10px;font-size:12px;font-family:var(--mono);cursor:pointer;margin-top:6px;letter-spacing:0.04em;}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:500;display:none;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px);}
.modal-overlay.open{display:flex;}
.modal{background:linear-gradient(160deg,var(--navy2),var(--navy3));border:1px solid rgba(33,150,243,0.25);border-radius:14px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.6);animation:modalIn 0.2s ease;}
@keyframes modalIn{from{opacity:0;transform:scale(0.95) translateY(12px);}to{opacity:1;transform:none;}}
.modal-header{padding:20px 22px 16px;border-bottom:1px solid rgba(33,150,243,0.15);display:flex;align-items:center;gap:10px;position:sticky;top:0;background:var(--navy2);z-index:1;}
.modal-title{font-family:var(--mono);font-size:16px;font-weight:700;flex:1;letter-spacing:0.06em;color:var(--white);}
.modal-close{width:30px;height:30px;background:rgba(255,255,255,0.05);border:1px solid var(--border2);border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:17px;color:var(--text2);}
.modal-body{padding:20px 22px;}
.modal-section-title{font-family:var(--mono);font-size:10px;font-weight:600;color:var(--cyan);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:12px;margin-top:20px;display:flex;align-items:center;gap:8px;}
.modal-section-title::after{content:'';flex:1;height:1px;background:rgba(0,180,216,0.2);}
.modal-section-title:first-child{margin-top:0;}
.form-field{margin-bottom:14px;}
.form-label{display:block;font-family:var(--mono);font-size:10px;font-weight:600;color:var(--text2);margin-bottom:5px;letter-spacing:0.08em;text-transform:uppercase;}
.form-label .req{color:var(--red);}
.form-label .opt{color:var(--text3);font-weight:400;text-transform:none;}
.form-input,.form-textarea{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:7px;color:var(--white);font-family:var(--sans);font-size:14px;padding:10px 13px;outline:none;transition:border-color 0.15s;}
.form-input:focus,.form-textarea:focus{border-color:rgba(33,150,243,0.5);}
.form-input::placeholder,.form-textarea::placeholder{color:var(--text3);}
.form-textarea{resize:vertical;min-height:70px;}
.order-review{background:rgba(255,255,255,0.03);border:1px solid rgba(33,150,243,0.12);border-radius:8px;padding:12px;margin-bottom:10px;max-height:180px;overflow-y:auto;}
.or-item{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;}
.or-item:last-child{border-bottom:none;}
.or-name{flex:1;color:var(--text);font-family:var(--mono);}
.or-qty{color:var(--text3);margin:0 8px;font-family:var(--mono);}
.or-price{color:var(--cyan);font-weight:700;font-family:var(--mono);}
.or-total{display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid rgba(33,150,243,0.2);margin-top:4px;}
.or-total-label{font-family:var(--mono);font-size:14px;font-weight:700;color:var(--white);}
.or-total-val{font-family:var(--mono);font-size:18px;font-weight:700;color:var(--cyan);}
.submit-btn{width:100%;background:linear-gradient(135deg,var(--blue),var(--blue-bright));color:#fff;border:none;border-radius:9px;padding:14px;font-family:var(--mono);font-size:15px;font-weight:700;cursor:pointer;transition:all 0.15s;margin-top:16px;letter-spacing:0.06em;text-transform:uppercase;box-shadow:0 4px 20px rgba(33,150,243,0.35);display:flex;align-items:center;justify-content:center;gap:8px;}
.submit-btn:disabled{opacity:0.6;cursor:not-allowed;}
.success-screen{text-align:center;padding:36px 22px 28px;}
.success-icon{width:70px;height:70px;background:var(--green-dim);border:2px solid rgba(0,200,150,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;margin:0 auto 18px;}
.success-title{font-family:var(--mono);font-size:22px;font-weight:700;margin-bottom:8px;color:var(--white);}
.success-sub{font-size:14px;color:var(--text2);line-height:1.6;}
.success-note{background:rgba(33,150,243,0.08);border:1px solid rgba(33,150,243,0.2);border-radius:10px;padding:13px 15px;font-size:12px;color:var(--text2);line-height:1.7;margin-top:16px;text-align:left;}
.success-done-btn{margin-top:20px;width:100%;background:linear-gradient(135deg,var(--blue),var(--blue-bright));color:#fff;border:none;border-radius:8px;padding:13px;font-family:var(--mono);font-size:14px;font-weight:700;cursor:pointer;letter-spacing:0.06em;text-transform:uppercase;}
.footer{position:relative;z-index:1;background:rgba(4,14,31,0.95);border-top:1px solid rgba(33,150,243,0.15);padding:28px 20px;text-align:center;margin-top:40px;}
.footer-name{font-family:var(--script);font-size:26px;color:var(--gold);margin-bottom:10px;}
.footer-contacts{display:flex;gap:20px;justify-content:center;flex-wrap:wrap;margin-bottom:14px;}
.footer-contact{display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:13px;font-weight:600;color:var(--white);}
.footer-disc{font-size:11px;color:var(--text3);line-height:1.7;max-width:600px;margin:0 auto;}
.footer-disc strong{color:var(--gold);}
.spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;}
@media(max-width:480px){.product-grid{grid-template-columns:repeat(2,1fr);}.hero-title{font-size:26px;}.cart-drawer{max-width:100%;}}
::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(33,150,243,0.3);border-radius:2px;}
`;

  // ── Inject fonts + styles ─────────────────────────────────────
  function injectStyles() {
    if (!document.getElementById('psw-fonts')) {
      var link = document.createElement('link');
      link.id = 'psw-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Open+Sans:wght@300;400;600&family=Dancing+Script:wght@700&display=swap';
      document.head.appendChild(link);
    }
    if (!document.getElementById('psw-styles')) {
      var style = document.createElement('style');
      style.id = 'psw-styles';
      style.textContent = CSS;
      document.head.appendChild(style);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────
  function getPrice(product) {
    if (cfg.pricingMode === 'influencer' && cfg.customPrices[product.code] !== undefined) {
      return cfg.customPrices[product.code];
    }
    return product.price;
  }

  // ── State ─────────────────────────────────────────────────────
  var cart = {};
  var activeCategory = 'All';
  var inventory = {};
  var PRODUCTS = [];

  // ── Build DOM ─────────────────────────────────────────────────
  function buildDOM() {
    document.title = cfg.marketName + (cfg.marketCity ? ' — ' + cfg.marketCity : '');

    var heroContactBlock = cfg.isInfluencer
      ? buildInfluencerHero()
      : '<div class="hero-contact">' +
          '<span class="mj-sig">' + cfg.contactName + '</span>' +
          (cfg.whatsapp ? '<div class="contact-row"><span>💬</span><span class="contact-label">WHATSAPP</span><span>' + cfg.whatsapp + '</span></div>' : '') +
          (cfg.mobile   ? '<div class="contact-row"><span>📱</span><span class="contact-label">MOBILE</span><span>' + cfg.mobile + '</span></div>' : '') +
        '</div>';

    document.body.innerHTML =
      '<div class="topbar"><div class="topbar-inner">' +
        '<div class="brand-logo" onclick="window.location.href=\'index.html\'">PSW<span>·</span></div>' +
        '<div class="brand-divider"></div>' +
        '<div class="brand-sub">Research Compounds</div>' +
        '<div class="topbar-search">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' +
          '<input type="text" id="searchInput" placeholder="Search compounds, codes…">' +
        '</div>' +
        '<button class="cart-btn" id="cartBtn">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>' +
          'ORDER LIST' +
          '<div class="cart-badge" id="cartBadge" style="display:none">0</div>' +
        '</button>' +
      '</div></div>' +

      '<div class="hero">' +
        '<div class="hero-rings"><div class="ring"></div><div class="ring"></div><div class="ring"></div></div>' +
        '<div class="hero-content">' +
          '<div class="hero-eyebrow">Research Grade Peptides</div>' +
          '<h1 class="hero-title">Peptide Supply<br><span>Warehouse</span></h1>' +
          '<div class="hero-tagline">we supply your favorite doctors</div>' +
          '<div class="hero-sub">Wholesale and retail inquiries welcome</div>' +
          heroContactBlock +
        '</div>' +
      '</div>' +

      '<div class="cat-strip"><div class="cat-strip-inner" id="catNav"></div></div>' +

      '<div class="main">' +
        '<div class="loading-state" id="loadingState">' +
          '<div class="loading-spinner"></div>' +
          '<div class="loading-text">LOADING INVENTORY…</div>' +
        '</div>' +
        '<div class="product-grid" id="productGrid" style="display:none"></div>' +
        '<div class="no-results" id="noResults" style="display:none">No products match your search</div>' +
      '</div>' +

      '<div class="footer">' +
        '<div class="footer-name">' + cfg.contactName + '</div>' +
        '<div class="footer-contacts">' +
          (cfg.whatsapp ? '<div class="footer-contact"><span>💬</span> WhatsApp: ' + cfg.whatsapp + '</div>' : '') +
          (cfg.mobile   ? '<div class="footer-contact"><span>📱</span> Mobile: ' + cfg.mobile + '</div>' : '') +
        '</div>' +
        '<div class="footer-disc"><strong>Research Use Only.</strong> All compounds are sold for research purposes only. Not intended for human consumption. Not FDA approved. Consult a licensed healthcare provider before any use.</div>' +
      '</div>' +

      '<div class="drawer-overlay" id="drawerOverlay"></div>' +
      '<div class="cart-drawer" id="cartDrawer">' +
        '<div class="drawer-header"><div class="drawer-title">YOUR ORDER</div><div class="drawer-close" id="drawerClose">×</div></div>' +
        '<div class="drawer-body" id="drawerBody"></div>' +
        '<div class="drawer-footer" id="drawerFooter"></div>' +
      '</div>' +

      '<div class="modal-overlay" id="checkoutModal"><div class="modal" id="modalContent"></div></div>';
  }

  function buildInfluencerHero() {
    var avatarHtml = cfg.influencerPhoto
      ? '<img class="influencer-avatar" src="' + cfg.influencerPhoto + '" alt="">'
      : '<div class="influencer-avatar-placeholder">' + (cfg.influencerName[0] || 'I') + '</div>';
    return (
      '<div class="influencer-badge">' +
        avatarHtml +
        '<div class="influencer-info">' +
          '<div class="influencer-info-name">' + cfg.influencerName + '</div>' +
          (cfg.influencerHandle ? '<div class="influencer-info-handle">' + cfg.influencerHandle + '</div>' : '') +
        '</div>' +
      '</div>' +
      '<div class="hero-contact">' +
        '<span class="mj-sig">' + cfg.contactName + '</span>' +
        (cfg.whatsapp ? '<div class="contact-row"><span>💬</span><span class="contact-label">WHATSAPP</span><span>' + cfg.whatsapp + '</span></div>' : '') +
        (cfg.mobile   ? '<div class="contact-row"><span>📱</span><span class="contact-label">MOBILE</span><span>' + cfg.mobile + '</span></div>' : '') +
      '</div>'
    );
  }

  // ── Inventory ─────────────────────────────────────────────────
  function loadInventory() {
    if (!cfg.sheetApiUrl) {
      PRODUCTS = ALL_PRODUCTS;
      finishLoad();
      return;
    }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', cfg.sheetApiUrl + '?action=getInventory&t=' + Date.now(), true);
    xhr.onload = function () {
      try {
        var data = JSON.parse(xhr.responseText);
        inventory = data || {};
      } catch(e) { inventory = {}; }
      PRODUCTS = (inventory && Object.keys(inventory).length > 0)
        ? ALL_PRODUCTS.filter(function(p){ return inventory[p.code] && inventory[p.code].stock > 0; })
        : [];
      finishLoad();
    };
    xhr.onerror = function () { PRODUCTS = []; finishLoad(); };
    setTimeout(function(){ if (!PRODUCTS.length) { PRODUCTS = []; finishLoad(); } }, 8000);
    xhr.send();
  }

  function finishLoad() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('productGrid').style.display = 'grid';
    buildCatNav();
    renderProducts();
  }

  // ── Category nav ──────────────────────────────────────────────
  function buildCatNav() {
    var cats = ['All'].concat(CAT_ORDER.filter(function(c){ return PRODUCTS.some(function(p){ return p.cat === c; }); }));
    document.getElementById('catNav').innerHTML = cats.map(function(c){
      return '<div class="cat-pill' + (c === activeCategory ? ' active' : '') + '" data-cat="' + c + '">' + c + '</div>';
    }).join('');
    document.getElementById('catNav').addEventListener('click', function(e){
      var pill = e.target.closest('.cat-pill');
      if (pill) { activeCategory = pill.dataset.cat; buildCatNav(); renderProducts(); }
    });
  }

  // ── Products ──────────────────────────────────────────────────
  function renderProducts() {
    var q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
    var filtered = PRODUCTS.filter(function(p){
      var matchCat = activeCategory === 'All' || p.cat === activeCategory;
      var matchQ = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
    var grid = document.getElementById('productGrid');
    var noRes = document.getElementById('noResults');
    if (!filtered.length) {
      grid.innerHTML = '';
      noRes.style.display = 'block';
      return;
    }
    noRes.style.display = 'none';
    grid.innerHTML = filtered.map(function(p){
      var inCart = !!cart[p.code];
      var price = getPrice(p);
      var stock = inventory[p.code] ? inventory[p.code].stock : null;
      var stockLabel = stock === null ? '' : (stock === 0 ? 'Out of Stock' : stock <= 5 ? stock + ' left — Low Stock' : stock + ' in stock');
      var stockClass = stock === null ? '' : (stock === 0 ? 'no-stock' : stock <= 5 ? 'low-stock' : 'in-stock');
      return '<div class="product-card' + (inCart ? ' in-cart' : '') + '" id="card-' + p.code + '">' +
        '<div class="in-cart-dot"></div>' +
        '<div class="pc-cat">' + p.cat + '</div>' +
        '<div class="pc-code">' + p.code + '</div>' +
        '<div class="pc-name">' + p.name + '</div>' +
        '<div class="pc-spec">' + p.spec + '</div>' +
        (stockLabel ? '<div class="pc-stock ' + stockClass + '">' + stockLabel + '</div>' : '') +
        '<div class="pc-price">$' + price.toFixed(2) + '</div>' +
        '<button class="pc-add' + (inCart ? ' in-cart' : '') + '" data-code="' + p.code + '">' +
          (inCart ? '✓ IN ORDER ×' + cart[p.code] : '+ ADD TO ORDER') +
        '</button>' +
      '</div>';
    }).join('');
    grid.addEventListener('click', function(e){
      var btn = e.target.closest('.pc-add');
      if (btn) addToCart(btn.dataset.code);
    });
  }

  // ── Cart ──────────────────────────────────────────────────────
  function addToCart(code) { cart[code] = (cart[code] || 0) + 1; updateCartUI(); renderProducts(); }
  function changeQty(code, delta) { if (!cart[code]) return; cart[code] = Math.max(1, cart[code] + delta); updateCartUI(); renderProducts(); }
  function removeItem(code) { delete cart[code]; updateCartUI(); renderProducts(); }
  function clearCartFn() { Object.keys(cart).forEach(function(k){ delete cart[k]; }); updateCartUI(); renderProducts(); closeCart(); }
  function cartTotal() { return Object.entries(cart).reduce(function(s,e){ var p=PRODUCTS.find(function(p){return p.code===e[0];}); return s+(p?getPrice(p)*e[1]:0); },0); }
  function cartCount() { return Object.values(cart).reduce(function(a,b){return a+b;},0); }

  function updateCartUI() {
    var count = cartCount();
    var badge = document.getElementById('cartBadge');
    if (count > 0) { badge.textContent = count; badge.style.display = 'flex'; } else { badge.style.display = 'none'; }
    renderDrawer();
  }

  function openCart() { renderDrawer(); document.getElementById('drawerOverlay').classList.add('open'); document.getElementById('cartDrawer').classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeCart() { document.getElementById('drawerOverlay').classList.remove('open'); document.getElementById('cartDrawer').classList.remove('open'); document.body.style.overflow = ''; }

  function renderDrawer() {
    var keys = Object.keys(cart);
    var body = document.getElementById('drawerBody');
    var footer = document.getElementById('drawerFooter');
    if (!keys.length) {
      body.innerHTML = '<div class="cart-empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><p>ORDER LIST EMPTY</p></div>';
      footer.innerHTML = ''; return;
    }
    var total = cartTotal();
    body.innerHTML = keys.map(function(code){
      var p = PRODUCTS.find(function(p){return p.code===code;});
      var qty = cart[code];
      return '<div class="cart-item">' +
        '<div class="ci-info"><div class="ci-name">' + p.name + '</div><div class="ci-spec">' + p.code + ' · ' + p.spec + '</div><div class="ci-line-price">$' + (getPrice(p)*qty).toFixed(2) + '</div></div>' +
        '<div class="ci-controls">' +
          '<button class="qty-btn" data-action="dec" data-code="' + code + '">−</button>' +
          '<span class="qty-num">' + qty + '</span>' +
          '<button class="qty-btn" data-action="inc" data-code="' + code + '">+</button>' +
          '<button class="ci-remove" data-action="rm" data-code="' + code + '">×</button>' +
        '</div>' +
      '</div>';
    }).join('');
    body.addEventListener('click', function(e){
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'dec') changeQty(btn.dataset.code, -1);
      if (btn.dataset.action === 'inc') changeQty(btn.dataset.code, 1);
      if (btn.dataset.action === 'rm')  removeItem(btn.dataset.code);
    });
    footer.innerHTML =
      '<div class="cart-totals"><div class="ct-row"><span class="ct-label">' + cartCount() + ' item' + (cartCount()!==1?'s':'') + '</span></div><div class="ct-divider"></div><div class="ct-row ct-total"><span class="ct-label">ORDER TOTAL</span><span class="ct-value">$' + total.toFixed(2) + '</span></div></div>' +
      '<button class="checkout-btn" id="checkoutBtn">PROCEED TO CHECKOUT →</button>' +
      '<button class="clear-cart-btn" id="clearBtn">Clear order</button>';
    document.getElementById('checkoutBtn').onclick = openCheckout;
    document.getElementById('clearBtn').onclick = clearCartFn;
  }

  // ── Checkout ──────────────────────────────────────────────────
  function openCheckout() {
    closeCart();
    var total = cartTotal();
    var orderRows = Object.keys(cart).map(function(code){
      var p = PRODUCTS.find(function(p){return p.code===code;});
      var qty = cart[code];
      return '<div class="or-item"><span class="or-name">' + p.name + ' <span style="color:var(--text3);font-size:10px;">' + p.spec + '</span></span><span class="or-qty">×' + qty + '</span><span class="or-price">$' + (getPrice(p)*qty).toFixed(2) + '</span></div>';
    }).join('');
    document.getElementById('modalContent').innerHTML =
      '<div class="modal-header"><div class="modal-title">COMPLETE ORDER</div><div class="modal-close" id="modalClose">×</div></div>' +
      '<div class="modal-body">' +
        '<div class="modal-section-title">Order Summary</div>' +
        '<div class="order-review">' + orderRows + '<div class="or-total"><span class="or-total-label">TOTAL</span><span class="or-total-val">$' + total.toFixed(2) + '</span></div></div>' +
        '<div class="modal-section-title">Your Information</div>' +
        '<div class="form-field"><label class="form-label">Full Name <span class="req">*</span></label><input type="text" class="form-input" id="custName" placeholder="First and last name"></div>' +
        '<div class="form-field"><label class="form-label">Email <span class="req">*</span></label><input type="email" class="form-input" id="custEmail" placeholder="you@email.com"></div>' +
        '<div class="form-field"><label class="form-label">Phone <span class="req">*</span></label><input type="tel" class="form-input" id="custPhone" placeholder="+1 (555) 000-0000"></div>' +
        '<div class="form-field"><label class="form-label">Shipping Address <span class="opt">(optional)</span></label><textarea class="form-textarea" id="custAddress" placeholder="Street, City, State, ZIP"></textarea></div>' +
        '<div class="form-field"><label class="form-label">Notes <span class="opt">(optional)</span></label><textarea class="form-textarea" id="custNotes" placeholder="Special instructions…" style="min-height:60px;"></textarea></div>' +
        '<button class="submit-btn" id="submitBtn">PLACE ORDER →</button>' +
      '</div>';
    document.getElementById('modalClose').onclick = closeCheckout;
    document.getElementById('submitBtn').onclick = submitOrder;
    document.getElementById('checkoutModal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCheckout() { document.getElementById('checkoutModal').classList.remove('open'); document.body.style.overflow = ''; }

  function submitOrder() {
    var name    = document.getElementById('custName').value.trim();
    var email   = document.getElementById('custEmail').value.trim();
    var phone   = document.getElementById('custPhone').value.trim();
    var address = document.getElementById('custAddress').value.trim();
    var notes   = document.getElementById('custNotes').value.trim();
    if (!name)  { flash('custName',  'Please enter your name.');  return; }
    if (!email || !email.includes('@')) { flash('custEmail', 'Please enter a valid email.'); return; }
    if (!phone) { flash('custPhone', 'Please enter your phone.'); return; }

    var btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> SENDING…';

    var items = Object.entries(cart).map(function(e){
      var p = PRODUCTS.find(function(p){return p.code===e[0];});
      return { code:e[0], name:p?p.name:e[0], spec:p?p.spec:'', qty:e[1], price:p?getPrice(p):0 };
    });

    var order = {
      id: 'ORD-' + Date.now(),
      market: cfg.marketCity || cfg.marketName,
      influencer: cfg.isInfluencer ? cfg.influencerName : null,
      total: cartTotal(),
      customer: { name:name, email:email, phone:phone, address:address, notes:notes },
      items: items
    };

    // Save to Google Sheets if configured
    if (cfg.sheetApiUrl) {
      var xhr = new XMLHttpRequest();
      var params = 'action=saveOrder&order=' + encodeURIComponent(JSON.stringify(order));
      xhr.open('GET', cfg.sheetApiUrl + '?' + params, true);
      xhr.send();
    }

    // Show success
    setTimeout(function(){
      Object.keys(cart).forEach(function(k){ delete cart[k]; });
      updateCartUI();
      renderProducts();
      document.getElementById('modalContent').innerHTML =
        '<div class="success-screen">' +
          '<div class="success-icon">✓</div>' +
          '<div class="success-title">ORDER RECEIVED</div>' +
          '<div class="success-sub">Thank you, ' + name + '. Your order has been submitted.</div>' +
          '<div class="success-note">We\'ll reach out within <strong>24 hours</strong>.<br>Questions? WhatsApp <strong>' + (cfg.whatsapp||'') + '</strong></div>' +
          '<button class="success-done-btn" id="successDone">BACK TO CATALOG</button>' +
        '</div>';
      document.getElementById('successDone').onclick = closeCheckout;
    }, 800);
  }

  function flash(id, msg) {
    var el = document.getElementById(id);
    el.style.borderColor = 'var(--red)'; el.focus(); el.placeholder = msg;
    setTimeout(function(){ el.style.borderColor = ''; el.placeholder = ''; }, 3000);
  }

  // ── Event wiring ──────────────────────────────────────────────
  function wireEvents() {
    document.getElementById('cartBtn').addEventListener('click', openCart);
    document.getElementById('drawerOverlay').addEventListener('click', closeCart);
    document.getElementById('drawerClose').addEventListener('click', closeCart);
    document.getElementById('searchInput').addEventListener('input', function(){ renderProducts(); });
  }

  // ── Boot ──────────────────────────────────────────────────────
  function boot() {
    injectStyles();
    buildDOM();
    wireEvents();
    loadInventory();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
