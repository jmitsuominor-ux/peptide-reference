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
    '.pref-wrap{padding:14px 20px 16px;background:rgba(7,20,40,0.7);border-top:1px solid rgba(0,180,216,0.15);border-bottom:1px solid rgba(0,180,216,0.15);backdrop-filter:blur(8px);}',
    '.pref-inner{max-width:1200px;margin:0 auto;}',
    '.pref-label{font-family:"Rajdhani",sans-serif;font-size:10px;font-weight:700;color:#00b4d8;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:8px;}',
    '.pref-label::after{content:"";flex:1;height:1px;background:rgba(0,180,216,0.2);}',
    '.pref-scroll{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding-bottom:2px;}',
    '.pref-scroll::-webkit-scrollbar{display:none;}',
    '.pref-card{position:relative;flex-shrink:0;width:106px;background:linear-gradient(145deg,rgba(10,29,58,0.9),rgba(7,20,40,0.95));border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:10px 10px 10px 13px;text-decoration:none;display:flex;flex-direction:column;gap:3px;overflow:hidden;transition:transform 0.15s,border-color 0.15s;}',
    '.pref-card:active{transform:scale(0.96);}',
    '.pref-card:hover{border-color:rgba(0,180,216,0.3);}',
    '.pref-bar{position:absolute;left:0;top:0;bottom:0;width:3px;border-radius:8px 0 0 8px;}',
    '.pref-icon{font-size:16px;line-height:1;margin-bottom:2px;}',
    '.pref-name{font-family:"Rajdhani",sans-serif;font-size:12px;font-weight:700;color:#d0e4f7;letter-spacing:0.01em;line-height:1.2;}',
    '.pref-count{font-family:"Rajdhani",sans-serif;font-size:10px;font-weight:600;color:#4a6d96;letter-spacing:0.04em;text-transform:uppercase;margin-top:3px;}'
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
          '<div class="pref-label">Compound Reference Guide</div>' +
          '<div class="pref-scroll">' +
            CATS.map(function (c) {
              return (
                '<a class="pref-card" href="' + REF_BASE + '?cat=' + c.id + '" target="_blank" rel="noopener">' +
                  '<div class="pref-bar" style="background:' + c.accent + '"></div>' +
                  '<div class="pref-icon">' + c.icon + '</div>' +
                  '<div class="pref-name">' + c.name + '</div>' +
                  '<div class="pref-count">' + c.count + ' cmpds</div>' +
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
