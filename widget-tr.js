(function() {
  'use strict';

  var ENDPOINT = 'https://ziboktbmbyjbhifsdypa.supabase.co/functions/v1/widget-type-rating';
  var SITE = 'https://www.aeroscout.net';

  // Match intelligence.html color system exactly
  var LIGHT = {
    bg: '#F5F8FC',
    text: '#1A2744',
    body: '#2e3e56',
    sec: '#516680',
    dim: '#8298b0',
    wh: '#fff',
    bd: 'rgba(26,39,68,.07)',
    sh: '0 1px 3px rgba(26,39,68,.04)',
    grd: 'rgba(26,39,68,.05)',
    gn: '#16a34a',
    rd: '#dc2626'
  };
  var DARK = {
    bg: '#0c1222',
    text: '#e2e8f0',
    body: '#cbd5e1',
    sec: '#94a3b8',
    dim: '#64748b',
    wh: '#151e2e',
    bd: 'rgba(255,255,255,.06)',
    sh: '0 1px 3px rgba(0,0,0,.2)',
    grd: 'rgba(255,255,255,.06)',
    gn: '#22c55e',
    rd: '#ef4444'
  };

  var AIRCRAFT_NAMES = {
    'A320': 'A320', 'B737': 'B737', 'B777': 'B777', 'B787': 'B787',
    'A330': 'A330', 'A350': 'A350', 'ATR': 'ATR', 'E190': 'E190',
    'E170': 'E170', 'LEARJET': 'Learjet', 'CITATION_CJ': 'Citation CJ',
    'CITATION_EXCEL': 'Citation Excel', 'CITATION_SOVEREIGN': 'Citation Sovereign',
    'PC12': 'PC-12', 'PC24': 'PC-24', 'KING_AIR': 'King Air',
    'DASH_8': 'Dash 8', 'DASH8': 'Dash 8', 'CRJ': 'CRJ',
    'GULFSTREAM': 'Gulfstream', 'CHALLENGER': 'Challenger',
    'GLOBAL_EXPRESS': 'Global Express', 'FALCON': 'Falcon',
    'SAAB_340': 'Saab 340', 'ERJ_145': 'ERJ 145', 'PHENOM': 'Phenom',
    'CARAVAN': 'Caravan', 'G550': 'G550', 'G650': 'G650',
    'GLOBAL_7500': 'Global 7500', 'HAWKER': 'Hawker'
  };

  function formatName(raw) {
    return AIRCRAFT_NAMES[raw] || raw.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
  }

  function getCtaUrl() {
    var host = '';
    try { host = encodeURIComponent(window.location.hostname); } catch(e) {}
    return SITE + '/intelligence?ref=widget-tr&host=' + host;
  }

  function injectFonts() {
    if (document.getElementById('as-widget-fonts')) return;
    var link = document.createElement('link');
    link.id = 'as-widget-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600&display=swap';
    document.head.appendChild(link);
  }

  function injectStyles(isDark) {
    if (document.getElementById('as-widget-styles')) {
      document.getElementById('as-widget-styles').remove();
    }
    var t = isDark ? DARK : LIGHT;

    var style = document.createElement('style');
    style.id = 'as-widget-styles';
    style.textContent =
      // Card container — matches .c from intelligence.html
      '.as-w{font-family:"Barlow",sans-serif;max-width:400px;background:' + t.wh + ';border:1px solid ' + t.bd + ';border-radius:11px;padding:1.4rem;box-shadow:' + t.sh + ';color:' + t.body + ';box-sizing:border-box;-webkit-font-smoothing:antialiased}' +
      '.as-w *{box-sizing:border-box;margin:0;padding:0}' +

      // Header — matches .ch, .ct, .cb from intelligence.html
      '.as-w-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:.8rem;flex-wrap:wrap;gap:.4rem}' +
      '.as-w-title{font-family:"Newsreader",Georgia,serif;font-weight:400;font-size:1rem;color:' + t.text + '}' +
      '.as-w-hdr-right{display:flex;align-items:center;gap:.5rem;margin-left:auto}' +
      '.as-w-badge{font-size:.6rem;color:' + t.dim + ';letter-spacing:.05em;text-transform:uppercase;font-weight:500;padding:.2rem .5rem;background:' + t.bg + ';border-radius:4px;white-space:nowrap}' +
      '.as-w-brand{font-family:"Barlow",sans-serif;font-size:.85rem;font-weight:700;letter-spacing:.04em;line-height:1;white-space:nowrap}' +
      '.as-w-brand-aero{color:' + (isDark ? '#e2e8f0' : '#111827') + '}' +
      '.as-w-brand-scout{color:#2563EB}' +
      '.as-w-brand-net{color:' + (isDark ? '#e2e8f0' : '#111827') + '}' +

      // Chart wrapper — contains bars area + x-axis, like ECharts grid
      '.as-w-chart{position:relative}' +
      '.as-w-chart-inner{position:relative}' +

      // Each bar row — matches ECharts barWidth:15 with proper vertical spacing
      // ECharts tr1: 420px height / 12 items ≈ 35px per row; we use 35px for same feel
      '.as-w-row{display:flex;align-items:center;height:35px}' +
      '.as-w-label{width:76px;font-size:10px;font-weight:500;color:' + t.text + ';flex-shrink:0;text-align:right;padding-right:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.as-w-bar-wrap{flex:1;display:flex;align-items:center;height:15px;position:relative}' +
      '.as-w-bar{height:15px;border-radius:0 4px 4px 0;background:linear-gradient(to right,#2563EB,#60A5FA);min-width:2px;flex-shrink:0;transition:width .8s cubic-bezier(.4,0,.2,1)}' +
      '.as-w-count{font-size:10px;font-weight:600;color:' + t.text + ';padding-left:6px;white-space:nowrap;flex-shrink:0}' +
      '.as-w-trend{font-size:9px;padding-left:2px;flex-shrink:0}' +
      '.as-w-trend-up{color:' + t.gn + '}' +
      '.as-w-trend-down{color:' + t.rd + '}' +
      '.as-w-trend-flat{color:' + t.dim + '}' +

      // Grid lines — vertical lines behind bars at each x-axis tick, matching ECharts splitLine
      '.as-w-grid{position:absolute;top:0;left:76px;right:0;bottom:0;pointer-events:none}' +
      '.as-w-gridline{position:absolute;top:0;bottom:0;width:1px;background:' + t.grd + '}' +

      // X-axis — number labels along the bottom, matching ECharts xAxis type:value
      '.as-w-xaxis{display:flex;padding-left:76px;margin-top:4px;position:relative}' +
      '.as-w-xtick{position:absolute;font-size:10px;color:' + t.dim + ';transform:translateX(-50%)}' +

      // Footer section
      '.as-w-footer{margin-top:1rem;text-align:center}' +
      '.as-w-meta{font-size:.6rem;color:' + t.dim + ';letter-spacing:.02em;margin-bottom:.7rem;font-weight:400}' +
      '.as-w-cta{display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:.5rem 1.3rem;border-radius:6px;font-size:.75rem;font-weight:500;font-family:"Barlow",sans-serif;letter-spacing:.03em;transition:background .2s}' +
      '.as-w-cta:hover{background:#1d4ed8}' +
      '.as-w-powered{margin-top:.5rem;font-size:.55rem;color:' + t.dim + ';letter-spacing:.02em}' +
      '.as-w-powered a{color:' + t.dim + ';text-decoration:none}' +
      '.as-w-powered a:hover{text-decoration:underline}' +

      // Fallback
      '.as-w-fallback{font-size:.8rem;color:' + t.dim + ';text-align:center;padding:1.5rem .8rem}' +
      '.as-w-fallback a{color:#2563EB;text-decoration:none}' +
      '.as-w-fallback a:hover{text-decoration:underline}';

    document.head.appendChild(style);
  }

  // Compute nice x-axis ticks (0, 20, 40... or 0, 50, 100... depending on max)
  function computeTicks(maxVal) {
    var nice = [10, 20, 25, 50, 100, 200, 250, 500];
    var step = 20;
    for (var i = 0; i < nice.length; i++) {
      if (nice[i] * 5 >= maxVal) { step = nice[i]; break; }
    }
    var ticks = [];
    for (var v = 0; v <= maxVal + step; v += step) {
      ticks.push(v);
      if (v >= maxVal) break;
    }
    return ticks;
  }

  function renderWidget(container, payload, isDark) {
    var items = payload.data;
    var maxJobs = items.length > 0 ? items[0].jobs : 1;

    // Compute x-axis ticks and scale
    var ticks = computeTicks(maxJobs);
    var axisMax = ticks[ticks.length - 1];

    var html = '';

    // Card container
    html += '<div class="as-w">';

    // Header — matches .ch layout from intelligence.html
    html += '<div class="as-w-hdr">';
    html += '<div class="as-w-title">Aircraft Demand (Type-Rated Aircraft Only)</div>';
    html += '<div class="as-w-hdr-right">';
    html += '<span class="as-w-brand"><span class="as-w-brand-aero">AERO</span><span class="as-w-brand-scout">SCOUT</span><span class="as-w-brand-net">.NET</span></span>';
    html += '<span class="as-w-badge">Active positions</span>';
    html += '</div>';
    html += '</div>';

    // Chart area
    html += '<div class="as-w-chart">';
    html += '<div class="as-w-chart-inner">';

    // Grid lines — one per x-axis tick (skip 0)
    html += '<div class="as-w-grid">';
    for (var g = 1; g < ticks.length; g++) {
      var gPct = (ticks[g] / axisMax) * 100;
      html += '<div class="as-w-gridline" style="left:' + gPct + '%"></div>';
    }
    html += '</div>';

    // Bars
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var pct = Math.max(0.5, (item.jobs / axisMax) * 100);
      var trendHtml = '';
      if (item.trend === 'up' || item.trend === 'new') {
        trendHtml = '<span class="as-w-trend as-w-trend-up">\u25B2</span>';
      } else if (item.trend === 'down') {
        trendHtml = '<span class="as-w-trend as-w-trend-down">\u25BC</span>';
      } else {
        trendHtml = '<span class="as-w-trend as-w-trend-flat">\u2500</span>';
      }

      html += '<div class="as-w-row">';
      html += '<div class="as-w-label">' + formatName(item.aircraft) + '</div>';
      html += '<div class="as-w-bar-wrap"><div class="as-w-bar" style="width:' + pct + '%"></div><span class="as-w-count">' + item.jobs + '</span>' + trendHtml + '</div>';
      html += '</div>';
    }

    html += '</div>'; // chart-inner

    // X-axis labels
    html += '<div class="as-w-xaxis">';
    for (var x = 0; x < ticks.length; x++) {
      var xPct = (ticks[x] / axisMax) * 100;
      html += '<span class="as-w-xtick" style="left:' + xPct + '%">' + ticks[x] + '</span>';
    }
    html += '</div>';

    html += '</div>'; // chart

    // Footer
    html += '<div class="as-w-footer">';
    html += '<div class="as-w-meta">Based on ' + (payload.total_jobs || 0).toLocaleString() + ' active pilot positions \u00B7 Updated ' + (payload.updated || 'today') + '</div>';
    html += '<a class="as-w-cta" href="' + getCtaUrl() + '" target="_blank" rel="noopener">See full analysis \u2192</a>';
    html += '<div class="as-w-powered"><a href="' + SITE + '" target="_blank" rel="noopener">Powered by AeroScout</a></div>';
    html += '</div>';

    html += '</div>';

    container.innerHTML = html;
  }

  function renderFallback(container) {
    container.innerHTML = '<div class="as-w"><div class="as-w-fallback">Aviation job market data powered by <a href="' + getCtaUrl() + '" target="_blank" rel="noopener">AeroScout</a></div></div>';
  }

  function init() {
    var container = document.getElementById('aeroscout-tr-widget');
    if (!container) return;

    var isDark = container.getAttribute('data-theme') === 'dark';

    injectFonts();
    injectStyles(isDark);

    fetch(ENDPOINT)
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function(payload) {
        if (!payload.data || payload.data.length === 0) {
          renderFallback(container);
          return;
        }
        renderWidget(container, payload, isDark);
      })
      .catch(function() {
        renderFallback(container);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
