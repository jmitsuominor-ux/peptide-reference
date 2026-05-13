// PSW Peptide Reference Widget
// Usage in Peptide Supply Warehouse index.html:
//   <div id="psw-peptide-ref"></div>
//   <script src="https://jmitsuominor-ux.github.io/peptide-reference/js/widget.js"></script>
(function () {
  'use strict';

  var REF_BASE_DEFAULT = 'https://jmitsuominor-ux.github.io/peptide-reference/';

  var CATS = [
    { id: 'weight',    name: 'Weight Loss',          icon: '⚖️',  count: 12, accent: '#00b4d8' },
    { id: 'healing',   name: 'Healing & Recovery',   icon: '🔧',  count: 14, accent: '#00c896' },
    { id: 'gh',        name: 'Growth Hormone',        icon: '📈',  count: 12, accent: '#9c79ff' },
    { id: 'antiaging', name: 'Anti-Aging',            icon: '✨',  count: 21, accent: '#f0c040' },
    { id: 'mito',      name: 'Mitochondrial',         icon: '⚡',  count: 11, accent: '#ff6b9d' },
    { id: 'muscle',    name: 'Muscle & IGF',          icon: '💪',  count: 7,  accent: '#00c896' },
    { id: 'neuro',     name: 'Cognitive',             icon: '🧠',  count: 13, accent: '#4ecdc4' },
    { id: 'immune',    name: 'Immune',                icon: '🛡️',  count: 10, accent: '#f0c040' },
    { id: 'hormonal',  name: 'Hormonal',              icon: '⚗️',  count: 16, accent: '#9c79ff' },
    { id: 'metabolic', name: 'Metabolic / Longevity', icon: '🔬',  count: 9,  accent: '#00c896' },
    { id: 'cardio',    name: 'Cardiovascular',        icon: '❤️',  count: 3,  accent: '#ef5350' },
    { id: 'recon',     name: 'Reconstitution',        icon: '💧',  count: 2,  accent: '#00b4d8' },
  ];

  var CSS = [
    '#psw-peptide-ref{position:relative;z-index:1;}',
    '.pref-wrap{padding:36px 20px;background:rgba(7,20,40,0.7);border-top:1px solid rgba(0,180,216,0.15);border-bottom:1px solid rgba(0,180,216,0.15);backdrop-filter:blur(8px);}',
    '.pref-inner{max-width:1200px;margin:0 auto;}',
    '.pref-hd{text-align:center;margin-bottom:24px;}',
    '.pref-eyebrow{font-family:"Rajdhani",sans-serif;font-size:11px;font-weight:700;color:#00b4d8;letter-spacing:0.18em;text-transform:uppercase;display:inline-flex;align-items:center;gap:10px;margin-bottom:6px;}',
    '.pref-eyebrow::before,.pref-eyebrow::after{content:"";display:block;width:32px;height:1px;background:#00b4d8;opacity:0.5;}',
    '.pref-sub{font-family:"Rajdhani",sans-serif;font-size:13px;color:rgba(208,228,247,0.45);letter-spacing:0.06em;}',
    '.pref-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;}',
    '.pref-card{position:relative;background:linear-gradient(145deg,rgba(10,29,58,0.9),rgba(7,20,40,0.95));border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:14px 12px 14px 16px;text-decoration:none;display:flex;flex-direction:column;gap:5px;overflow:hidden;transition:transform 0.18s,border-color 0.18s,box-shadow 0.18s;}',
    '.pref-card:hover{transform:translateY(-2px);border-color:rgba(0,180,216,0.3);box-shadow:0 8px 24px rgba(0,0,0,0.35);}',
    '.pref-bar{position:absolute;left:0;top:0;bottom:0;width:3px;border-radius:10px 0 0 10px;}',
    '.pref-icon{font-size:20px;line-height:1;margin-bottom:3px;}',
    '.pref-name{font-family:"Rajdhani",sans-serif;font-size:13px;font-weight:700;color:#d0e4f7;letter-spacing:0.02em;line-height:1.2;}',
    '.pref-count{font-family:"Rajdhani",sans-serif;font-size:11px;font-weight:600;color:#4a6d96;letter-spacing:0.06em;text-transform:uppercase;margin-top:auto;padding-top:6px;}',
    '.pref-cta{font-family:"Rajdhani",sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;opacity:0;transition:opacity 0.18s;margin-top:2px;}',
    '.pref-card:hover .pref-cta{opacity:1;}',
    '@media(max-width:480px){.pref-grid{grid-template-columns:repeat(2,1fr);}}'
  ].join('');

  function inject() {
    if (!document.getElementById('pref-styles')) {
      var s = document.createElement('style');
      s.id = 'pref-styles';
      s.textContent = CSS;
      document.head.appendChild(s);
    }

    var root = document.getElementById('psw-peptide-ref');
    if (!root) return;
    var REF_BASE = root.dataset.base || REF_BASE_DEFAULT;

    root.innerHTML =
      '<div class="pref-wrap">' +
        '<div class="pref-inner">' +
          '<div class="pref-hd">' +
            '<div class="pref-eyebrow">Compound Reference Guide</div>' +
            '<div class="pref-sub">Select a category to view dosing protocols, mechanisms &amp; research data</div>' +
          '</div>' +
          '<div class="pref-grid">' +
            CATS.map(function (c) {
              return (
                '<a class="pref-card" href="' + REF_BASE + '?cat=' + c.id + '" target="_blank" rel="noopener">' +
                  '<div class="pref-bar" style="background:' + c.accent + '"></div>' +
                  '<div class="pref-icon">' + c.icon + '</div>' +
                  '<div class="pref-name">' + c.name + '</div>' +
                  '<div class="pref-count">' + c.count + ' compounds</div>' +
                  '<div class="pref-cta" style="color:' + c.accent + '">View Reference →</div>' +
                '</a>'
              );
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
