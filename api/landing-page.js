const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://ziboktbmbyjbhifsdypa.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// ── Helpers (shared with job-page.js) ────────────────────────────────────────

function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildSlug(job) {
  const parts = [job.title, job.org || job.airline]
    .filter(Boolean)
    .map(slugify)
    .filter(Boolean);
  return parts.length > 0 ? `${parts.join('-')}-${job.id}` : String(job.id);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function iconLetter(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

function formatNumber(n) {
  if (!n || n === 0) return '0';
  return Number(n).toLocaleString('en-US');
}

function formatSalary(salary) {
  if (!salary || salary === 0 || salary === '0') return null;
  const salaryStr = String(salary);
  if (salaryStr.includes('-')) {
    const parts = salaryStr.split('-');
    if (parts.length === 2) {
      const low = parseInt(parts[0], 10);
      const high = parseInt(parts[1], 10);
      if (!isNaN(low) && !isNaN(high)) {
        return { formatted: `$${low.toLocaleString('en-US')}-$${high.toLocaleString('en-US')}/yr`, isRange: true };
      }
    }
  }
  const val = parseInt(salaryStr, 10);
  if (!isNaN(val) && val > 0) {
    return { formatted: `$${val.toLocaleString('en-US')}/yr`, isRange: false };
  }
  return null;
}

// ── Job card renderer ─────────────────────────────────────────────────────────

function renderJobCard(job, isCabinCrew, idx) {
  const slug = buildSlug(job);
  const jobUrl = isCabinCrew ? `/jobs/${slug}?type=cabin_crew` : `/jobs/${slug}`;

  const logoHtml = job.logo_url
    ? `<img src="${escapeHtml(job.logo_url)}" alt="${escapeHtml(job.airline)}" loading="lazy" onerror="this.style.display='none';this.parentElement.dataset.fallback='${escapeHtml(iconLetter(job.airline))}';">`
    : '';

  const fallbackLetter = iconLetter(job.airline);
  const visaClass = job.visa_sponsor ? ' visa-sponsor' : '';
  const delay = Math.min(idx * 40, 600);

  // Build attribute pills
  let pills = '';
  if (isCabinCrew) {
    pills += `<span class="pill pill-type">${escapeHtml(job.position || 'Flight Attendant')}</span>`;
    if (job.location) pills += `<span class="pill pill-loc">${escapeHtml(job.location)}</span>`;
    if (job.contract_type) pills += `<span class="pill pill-contract">${escapeHtml(job.contract_type)}</span>`;
    if (job.visa_sponsor) pills += '<span class="pill pill-visa">Visa Sponsored</span>';
  } else {
    if (job.aircraft) pills += `<span class="pill pill-type">${escapeHtml(job.aircraft)}</span>`;
    if (job.rank) pills += `<span class="pill pill-rank">${escapeHtml(job.rank)}</span>`;
    if (job.location) pills += `<span class="pill pill-loc">${escapeHtml(job.location)}</span>`;
    if (job.type_rated) pills += '<span class="pill pill-rated">Type-rated</span>';
    else pills += '<span class="pill pill-nonrated">Non-type rated</span>';
    if (job.visa_sponsor) pills += '<span class="pill pill-visa">Visa Sponsored</span>';
    if (job.direct_entry) pills += '<span class="pill pill-direct">Direct Entry</span>';
  }

  // Build stats
  let stats = '';
  if (isCabinCrew) {
    if (job.experience_years > 0) stats += `<div class="stat"><span class="stat-label">EXP</span><span class="stat-val">${job.experience_years}yr</span></div>`;
    if (job.min_height_cm) stats += `<div class="stat"><span class="stat-label">MIN HT</span><span class="stat-val">${job.min_height_cm}cm</span></div>`;
  } else {
    if (job.total_hours) stats += `<div class="stat"><span class="stat-label">TT</span><span class="stat-val">${formatNumber(job.total_hours)}</span></div>`;
    if (job.pic_hours) stats += `<div class="stat"><span class="stat-label">PIC</span><span class="stat-val">${formatNumber(job.pic_hours)}</span></div>`;
  }
  const salaryInfo = formatSalary(job.salary_usd);
  if (salaryInfo) {
    stats += `<div class="stat stat-salary"><span class="stat-label">SALARY</span><span class="stat-val salary-green">${salaryInfo.formatted}</span></div>`;
  }

  return `<a href="${jobUrl}" class="card${visaClass}" style="animation-delay:${delay}ms" aria-label="${escapeHtml(job.title)} at ${escapeHtml(job.airline)}">
    <div class="card-accent"></div>
    <div class="card-logo" data-fallback="${fallbackLetter}">${logoHtml}${!job.logo_url ? `<span class="card-letter">${fallbackLetter}</span>` : ''}</div>
    <div class="card-content">
      <div class="card-top">
        <h3 class="card-title">${escapeHtml(job.title)}</h3>
        <p class="card-org">${escapeHtml(job.airline)}</p>
      </div>
      <div class="card-pills">${pills}</div>
      ${stats ? `<div class="card-stats">${stats}</div>` : ''}
    </div>
    <div class="card-arrow">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
    </div>
  </a>`;
}

// ── Schema.org markup ────────────────────────────────────────────────────────

function buildFaqSchema(faqs) {
  if (!faqs || faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(f => ({
      '@type': 'Question',
      'name': f.q,
      'acceptedAnswer': { '@type': 'Answer', 'text': f.a },
    })),
  };
}

function buildItemListSchema(jobs, isCabinCrew) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'itemListElement': jobs.slice(0, 30).map((job, i) => ({
      '@type': 'ListItem',
      'position': i + 1,
      'url': `https://www.aeroscout.net/jobs/${buildSlug(job)}${isCabinCrew ? '?type=cabin_crew' : ''}`,
    })),
  };
}

// ── Build full HTML page ─────────────────────────────────────────────────────

function buildLandingPage(pageData, jobs, relatedPages) {
  const isCabinCrew = pageData.filter_table === 'verified_cabin_crew_jobs';
  const jobCount = jobs.length;
  let faqs = [];
  try {
    faqs = typeof pageData.faq_json === 'string' ? JSON.parse(pageData.faq_json) : (pageData.faq_json || []);
  } catch (e) { faqs = []; }

  const ogParams = new URLSearchParams();
  ogParams.set('title', pageData.h1 || pageData.page_title);
  ogParams.set('airline', `${jobCount} Open Position${jobCount !== 1 ? 's' : ''}`);
  const ogImage = `https://www.aeroscout.net/api/og?${ogParams.toString()}`;

  const faqSchema = buildFaqSchema(faqs);
  const itemListSchema = buildItemListSchema(jobs, isCabinCrew);

  const airlinesSet = new Set(jobs.map(j => j.airline).filter(Boolean));
  const visaCount = jobs.filter(j => j.visa_sponsor).length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17913572733"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'AW-17913572733');
  </script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageData.page_title)}</title>
  <meta name="description" content="${escapeHtml(pageData.meta_description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${pageData.canonical_url}">

  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(pageData.og_title || pageData.page_title)}">
  <meta property="og:description" content="${escapeHtml(pageData.og_description || pageData.meta_description)}">
  <meta property="og:url" content="${pageData.canonical_url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="AeroScout">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageData.page_title)}">
  <meta name="twitter:description" content="${escapeHtml(pageData.meta_description)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">

  <!-- Schema.org JSON-LD -->
  ${faqSchema ? `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>` : ''}
  <script type="application/ld+json">${JSON.stringify(itemListSchema)}</script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,700;12..96,800&family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,400&display=swap" rel="stylesheet">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --ink:         #0b0b0b;
      --surface:     #141414;
      --surface-2:   #1a1a1a;
      --surface-3:   #222;
      --border:      rgba(255,255,255,0.07);
      --border-hover:rgba(255,255,255,0.14);
      --brass:       #c8a44e;
      --brass-dim:   #a68838;
      --brass-glow:  rgba(200,164,78,0.12);
      --brass-line:  rgba(200,164,78,0.25);
      --steel:       #6b8bb5;
      --text:        #d4d0c8;
      --text-dim:    #706c64;
      --text-bright: #f0ede6;
      --green:       #4ade80;
      --green-dim:   rgba(74,222,128,0.12);
      --info:        #60a5fa;
      --info-dim:    rgba(96,165,250,0.12);
      --warn:        #fbbf24;
      --warn-dim:    rgba(251,191,36,0.12);
      --font-display:'Bricolage Grotesque', sans-serif;
      --font-body:   'Newsreader', Georgia, serif;
      --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
      --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    body {
      font-family: var(--font-body);
      background: var(--ink);
      color: var(--text);
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    a { text-decoration: none; color: inherit; }

    /* ── Grain overlay ─────────────────────────────── */
    body::after {
      content: '';
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      opacity: 0.025;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      background-repeat: repeat;
      background-size: 256px 256px;
    }

    /* ── Animations ────────────────────────────────── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-12px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes brassShimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes pulseGlow {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.4; }
    }

    /* ── Navbar ─────────────────────────────────────── */
    .nav {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(11,11,11,0.85);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      border-bottom: 1px solid var(--border);
      padding: 0 32px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .nav-logo {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 15px;
      color: var(--text-bright);
      letter-spacing: 0.15em;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .nav-mark {
      width: 26px;
      height: 26px;
      border: 1.5px solid var(--brass);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .nav-mark svg { display: block; }
    .nav-links { display: flex; gap: 2px; align-items: center; }
    .nav-links a {
      font-family: var(--font-display);
      font-size: 12.5px;
      font-weight: 500;
      color: var(--text-dim);
      padding: 7px 14px;
      border-radius: 6px;
      letter-spacing: 0.02em;
      transition: color 0.2s, background 0.2s;
    }
    .nav-links a:hover { color: var(--text-bright); background: rgba(255,255,255,0.04); }
    .nav-links .nav-cta {
      color: var(--ink);
      background: var(--brass);
      font-weight: 600;
      margin-left: 8px;
      padding: 7px 18px;
      letter-spacing: 0.04em;
    }
    .nav-links .nav-cta:hover { background: var(--brass-dim); }

    /* ── Hero ───────────────────────────────────────── */
    .hero {
      position: relative;
      overflow: hidden;
      padding: 80px 32px 64px;
      border-bottom: 1px solid var(--border);
    }
    /* Topographic contour pattern */
    .hero::before {
      content: '';
      position: absolute;
      inset: 0;
      opacity: 0.035;
      background-image: url("data:image/svg+xml,%3Csvg width='600' height='600' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23c8a44e' stroke-width='1'%3E%3Ccircle cx='300' cy='300' r='50'/%3E%3Ccircle cx='300' cy='300' r='100'/%3E%3Ccircle cx='300' cy='300' r='150'/%3E%3Ccircle cx='300' cy='300' r='200'/%3E%3Ccircle cx='300' cy='300' r='250'/%3E%3Ccircle cx='300' cy='300' r='300'/%3E%3Ccircle cx='300' cy='300' r='350'/%3E%3Ccircle cx='300' cy='300' r='400'/%3E%3C/g%3E%3C/svg%3E");
      background-size: 600px 600px;
      background-position: 70% 40%;
      background-repeat: no-repeat;
      pointer-events: none;
    }
    /* Warm glow */
    .hero::after {
      content: '';
      position: absolute;
      width: 500px;
      height: 500px;
      right: -100px;
      top: -150px;
      background: radial-gradient(ellipse, rgba(200,164,78,0.06) 0%, transparent 70%);
      pointer-events: none;
    }
    .hero-inner {
      position: relative;
      z-index: 1;
      max-width: 860px;
      margin: 0 auto;
    }
    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-display);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--brass);
      margin-bottom: 24px;
      animation: fadeIn 0.6s var(--ease-out) both;
    }
    .hero-eyebrow-dot {
      width: 6px;
      height: 6px;
      background: var(--brass);
      border-radius: 50%;
      animation: pulseGlow 2.5s ease-in-out infinite;
    }
    .hero-rule {
      width: 48px;
      height: 1px;
      background: var(--brass-line);
      margin-bottom: 28px;
      animation: fadeIn 0.6s 0.1s var(--ease-out) both;
    }
    .hero h1 {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: clamp(2.2rem, 5.5vw, 3.6rem);
      line-height: 1.05;
      letter-spacing: -0.03em;
      color: var(--text-bright);
      margin-bottom: 20px;
      animation: fadeUp 0.7s 0.15s var(--ease-out) both;
    }
    .hero-sub {
      font-family: var(--font-body);
      font-size: 17px;
      font-weight: 300;
      font-style: italic;
      color: var(--text-dim);
      line-height: 1.6;
      max-width: 480px;
      margin-bottom: 36px;
      animation: fadeUp 0.7s 0.25s var(--ease-out) both;
    }
    .hero-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      animation: fadeUp 0.7s 0.35s var(--ease-out) both;
    }
    .hero-count {
      font-family: var(--font-display);
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 10px 22px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      letter-spacing: 0.02em;
    }
    .hero-count strong {
      font-size: 18px;
      color: var(--brass);
      font-weight: 800;
    }
    .hero-btn {
      font-family: var(--font-display);
      font-size: 13px;
      font-weight: 600;
      color: var(--ink);
      background: var(--brass);
      padding: 10px 26px;
      border-radius: 8px;
      letter-spacing: 0.03em;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s, transform 0.15s;
    }
    .hero-btn:hover {
      background: var(--brass-dim);
      transform: translateY(-1px);
    }

    /* ── Stats strip ───────────────────────────────── */
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border-bottom: 1px solid var(--border);
    }
    .stats-item {
      padding: 20px 24px;
      text-align: center;
      border-right: 1px solid var(--border);
      animation: fadeIn 0.5s var(--ease-out) both;
    }
    .stats-item:nth-child(1) { animation-delay: 0.4s; }
    .stats-item:nth-child(2) { animation-delay: 0.5s; }
    .stats-item:nth-child(3) { animation-delay: 0.6s; }
    .stats-item:nth-child(4) { animation-delay: 0.7s; border-right: none; }
    .stats-num {
      font-family: var(--font-display);
      font-size: 26px;
      font-weight: 800;
      color: var(--text-bright);
      line-height: 1;
    }
    .stats-unit {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-dim);
      margin-left: 2px;
    }
    .stats-label {
      font-family: var(--font-display);
      font-size: 10px;
      font-weight: 500;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: 4px;
    }

    /* ── Main container ────────────────────────────── */
    .main {
      max-width: 860px;
      margin: 0 auto;
      padding: 48px 32px;
    }

    /* ── Editorial intro ───────────────────────────── */
    .intro {
      position: relative;
      padding: 36px 40px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 2px;
      margin-bottom: 56px;
      animation: fadeUp 0.6s 0.5s var(--ease-out) both;
    }
    .intro::before {
      content: '';
      position: absolute;
      top: 16px;
      left: 0;
      width: 2px;
      height: calc(100% - 32px);
      background: linear-gradient(to bottom, var(--brass), transparent);
    }
    .intro p {
      font-size: 16px;
      line-height: 1.8;
      color: var(--text);
      margin-bottom: 16px;
    }
    .intro p:first-child {
      font-size: 18px;
      font-weight: 500;
      color: var(--text-bright);
    }
    .intro p:first-child::first-letter {
      font-family: var(--font-display);
      font-size: 3.2em;
      float: left;
      line-height: 0.8;
      margin-right: 8px;
      margin-top: 6px;
      color: var(--brass);
      font-weight: 800;
    }
    .intro p:last-child { margin-bottom: 0; }

    /* ── Section heading ───────────────────────────── */
    .section-head {
      display: flex;
      align-items: baseline;
      gap: 16px;
      margin-bottom: 20px;
    }
    .section-head h2 {
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 700;
      color: var(--text-bright);
      letter-spacing: -0.02em;
      white-space: nowrap;
    }
    .section-head-line {
      flex: 1;
      height: 1px;
      background: var(--border);
    }
    .section-head-count {
      font-family: var(--font-display);
      font-size: 11px;
      font-weight: 600;
      color: var(--text-dim);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    /* ── Job cards ──────────────────────────────────── */
    .cards { display: flex; flex-direction: column; gap: 6px; }

    .card {
      display: grid;
      grid-template-columns: 3px 60px 1fr 40px;
      align-items: center;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 2px;
      overflow: hidden;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s, transform 0.2s var(--ease-spring);
      animation: fadeUp 0.45s var(--ease-out) both;
    }
    .card:hover {
      border-color: var(--brass-line);
      background: var(--surface-2);
      transform: translateX(4px);
    }
    .card.visa-sponsor .card-accent { background: var(--green); }

    .card-accent {
      width: 3px;
      height: 100%;
      background: transparent;
      transition: background 0.2s;
    }
    .card:hover .card-accent { background: var(--brass); }

    .card-logo {
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-right: 1px solid var(--border);
    }
    .card-logo img {
      width: 36px;
      height: 36px;
      object-fit: contain;
      border-radius: 4px;
      filter: brightness(0.95);
    }
    .card-letter {
      font-family: var(--font-display);
      font-size: 20px;
      font-weight: 800;
      color: var(--text-dim);
    }

    .card-content {
      padding: 14px 16px;
      min-width: 0;
    }
    .card-top { margin-bottom: 6px; }
    .card-title {
      font-family: var(--font-display);
      font-size: 14px;
      font-weight: 600;
      color: var(--text-bright);
      line-height: 1.3;
      letter-spacing: -0.01em;
    }
    .card-org {
      font-family: var(--font-body);
      font-size: 12.5px;
      color: var(--text-dim);
      font-style: italic;
      margin-top: 1px;
    }
    .card-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 6px;
    }
    .pill {
      font-family: var(--font-display);
      font-size: 10.5px;
      font-weight: 500;
      padding: 3px 8px;
      border-radius: 2px;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }
    .pill-type  { color: var(--brass); background: var(--brass-glow); }
    .pill-rank  { color: var(--text); background: rgba(255,255,255,0.06); }
    .pill-loc   { color: var(--text-dim); background: rgba(255,255,255,0.04); }
    .pill-rated { color: var(--info); background: var(--info-dim); }
    .pill-nonrated { color: var(--text-dim); background: rgba(255,255,255,0.03); }
    .pill-visa  { color: var(--green); background: var(--green-dim); }
    .pill-direct { color: var(--warn); background: var(--warn-dim); }
    .pill-contract { color: var(--steel); background: rgba(107,139,181,0.12); }

    .card-stats {
      display: flex;
      gap: 14px;
      align-items: center;
    }
    .stat {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .stat-label {
      font-family: var(--font-display);
      font-size: 9.5px;
      font-weight: 600;
      color: var(--text-dim);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .stat-val {
      font-family: var(--font-display);
      font-size: 12px;
      font-weight: 700;
      color: var(--text);
    }
    .salary-green { color: var(--green); }

    .card-arrow {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      color: var(--text-dim);
      transition: color 0.2s, transform 0.2s;
    }
    .card:hover .card-arrow {
      color: var(--brass);
      transform: translate(2px, -2px);
    }

    /* ── Empty state ───────────────────────────────── */
    .empty {
      text-align: center;
      padding: 64px 24px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 2px;
    }
    .empty-icon {
      font-size: 36px;
      opacity: 0.3;
      margin-bottom: 16px;
    }
    .empty p { color: var(--text-dim); font-size: 15px; margin-bottom: 8px; }
    .empty a { color: var(--brass); font-weight: 600; }

    /* ── FAQ section ───────────────────────────────── */
    .faq {
      margin-top: 56px;
      animation: fadeUp 0.6s 0.3s var(--ease-out) both;
    }
    .faq-head {
      display: flex;
      align-items: baseline;
      gap: 16px;
      margin-bottom: 24px;
    }
    .faq-head h2 {
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 700;
      color: var(--text-bright);
      letter-spacing: -0.02em;
    }
    .faq-head-line {
      flex: 1;
      height: 1px;
      background: var(--border);
    }
    .faq-item {
      border-bottom: 1px solid var(--border);
    }
    .faq-item:first-of-type { border-top: 1px solid var(--border); }
    .faq-trigger {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 20px 0;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
    }
    .faq-trigger h3 {
      font-family: var(--font-body);
      font-size: 16px;
      font-weight: 400;
      font-style: italic;
      color: var(--text);
      line-height: 1.4;
      transition: color 0.2s;
    }
    .faq-trigger:hover h3 { color: var(--text-bright); }
    .faq-chevron {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--text-dim);
      transition: color 0.25s, transform 0.3s var(--ease-out);
    }
    .faq-item.open .faq-chevron {
      color: var(--brass);
      transform: rotate(180deg);
    }
    .faq-answer {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.35s var(--ease-out);
    }
    .faq-item.open .faq-answer { grid-template-rows: 1fr; }
    .faq-answer-inner { overflow: hidden; }
    .faq-answer-inner p {
      font-size: 14.5px;
      color: var(--text-dim);
      line-height: 1.75;
      padding-bottom: 20px;
      padding-right: 44px;
    }

    /* ── Related links ─────────────────────────────── */
    .related {
      margin-top: 56px;
      animation: fadeUp 0.6s 0.4s var(--ease-out) both;
    }
    .related-label {
      font-family: var(--font-display);
      font-size: 10px;
      font-weight: 600;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.14em;
      margin-bottom: 14px;
    }
    .related-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .related-link {
      font-family: var(--font-display);
      font-size: 12px;
      font-weight: 500;
      color: var(--text-dim);
      padding: 8px 16px;
      border: 1px solid var(--border);
      border-radius: 2px;
      transition: color 0.2s, border-color 0.2s, background 0.2s;
      letter-spacing: 0.01em;
    }
    .related-link:hover {
      color: var(--brass);
      border-color: var(--brass-line);
      background: var(--brass-glow);
    }

    /* ── CTA banner ────────────────────────────────── */
    .cta {
      margin-top: 56px;
      padding: 56px 40px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 2px;
      text-align: center;
      position: relative;
      overflow: hidden;
      animation: fadeUp 0.6s 0.5s var(--ease-out) both;
    }
    .cta::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 120px;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--brass), transparent);
    }
    .cta-label {
      font-family: var(--font-display);
      font-size: 10px;
      font-weight: 600;
      color: var(--brass);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    .cta h2 {
      font-family: var(--font-display);
      font-size: clamp(1.4rem, 3vw, 2rem);
      font-weight: 800;
      color: var(--text-bright);
      letter-spacing: -0.02em;
      margin-bottom: 12px;
    }
    .cta p {
      font-size: 15px;
      color: var(--text-dim);
      line-height: 1.6;
      max-width: 420px;
      margin: 0 auto 32px;
      font-style: italic;
    }
    .cta-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .cta-primary {
      font-family: var(--font-display);
      font-size: 13px;
      font-weight: 700;
      color: var(--ink);
      background: var(--brass);
      padding: 12px 32px;
      border-radius: 4px;
      letter-spacing: 0.04em;
      transition: background 0.2s, transform 0.15s;
    }
    .cta-primary:hover { background: var(--brass-dim); transform: translateY(-1px); }
    .cta-secondary {
      font-family: var(--font-display);
      font-size: 13px;
      font-weight: 500;
      color: var(--text-dim);
      border: 1px solid var(--border);
      padding: 12px 28px;
      border-radius: 4px;
      letter-spacing: 0.02em;
      transition: color 0.2s, border-color 0.2s;
    }
    .cta-secondary:hover { color: var(--text); border-color: var(--border-hover); }

    /* ── Footer ────────────────────────────────────── */
    .footer {
      text-align: center;
      padding: 32px;
      border-top: 1px solid var(--border);
      margin-top: 64px;
    }
    .footer p {
      font-family: var(--font-display);
      font-size: 11px;
      color: var(--text-dim);
      letter-spacing: 0.04em;
    }
    .footer a { color: var(--text-dim); transition: color 0.15s; }
    .footer a:hover { color: var(--brass); }
    .footer-dot { margin: 0 10px; opacity: 0.3; }

    /* ── Responsive ────────────────────────────────── */
    @media (max-width: 640px) {
      .nav { padding: 0 16px; height: 50px; }
      .nav-links a:not(.nav-cta) { display: none; }
      .nav-links .nav-cta { margin-left: 0; }

      .hero { padding: 56px 20px 48px; }
      .hero h1 { font-size: 2rem; }
      .hero-sub { font-size: 15px; }

      .stats { grid-template-columns: repeat(2, 1fr); }
      .stats-item:nth-child(2) { border-right: none; }
      .stats-item { padding: 16px; }
      .stats-num { font-size: 22px; }

      .main { padding: 32px 16px; }
      .intro { padding: 24px 20px; }
      .intro::before { display: none; }
      .intro p:first-child::first-letter { font-size: 2.4em; }

      .card { grid-template-columns: 3px 48px 1fr 36px; }
      .card-logo { width: 48px; height: 48px; }
      .card-logo img { width: 28px; height: 28px; }
      .card-letter { font-size: 16px; }
      .card-content { padding: 10px 12px; }
      .card-title { font-size: 13px; }
      .card-pills { display: none; }

      .cta { padding: 40px 20px; }
    }

    @media (max-width: 480px) {
      .hero-actions { gap: 10px; }
      .hero-count { padding: 8px 14px; font-size: 12px; }
      .hero-btn { padding: 8px 18px; font-size: 12px; }
      .card-stats { flex-wrap: wrap; gap: 8px; }
    }
  </style>
</head>
<body>
  <nav class="nav">
    <a href="/" class="nav-logo">
      <div class="nav-mark">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a44e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      AEROSCOUT
    </a>
    <div class="nav-links">
      <a href="/Jobs.html">Browse Jobs</a>
      <a href="/about.html">About</a>
      <a href="/pricing.html">Pricing</a>
      <a href="/login.html">Login</a>
      <a href="/signup.html" class="nav-cta">Sign Up Free</a>
    </div>
  </nav>

  <section class="hero">
    <div class="hero-inner">
      <div class="hero-eyebrow">
        <span class="hero-eyebrow-dot"></span>
        Live Aviation Opportunities
      </div>
      <div class="hero-rule"></div>
      <h1>${escapeHtml(pageData.h1 || pageData.page_title)}</h1>
      <p class="hero-sub">Updated daily from 850+ airlines and operators worldwide. Find your next cockpit or cabin role in minutes.</p>
      <div class="hero-actions">
        <span class="hero-count"><strong>${jobCount}</strong> open position${jobCount !== 1 ? 's' : ''}</span>
        <a href="/Jobs.html" class="hero-btn">Browse all jobs &rarr;</a>
      </div>
    </div>
  </section>

  <div class="stats">
    <div class="stats-item">
      <div class="stats-num">${jobCount}<span class="stats-unit"> jobs</span></div>
      <div class="stats-label">Open Positions</div>
    </div>
    <div class="stats-item">
      <div class="stats-num">${airlinesSet.size}<span class="stats-unit"> orgs</span></div>
      <div class="stats-label">Airlines &amp; Operators</div>
    </div>
    <div class="stats-item">
      <div class="stats-num">${visaCount}<span class="stats-unit"> roles</span></div>
      <div class="stats-label">Visa Sponsored</div>
    </div>
    <div class="stats-item">
      <div class="stats-num">24<span class="stats-unit"> hrs</span></div>
      <div class="stats-label">Update Cycle</div>
    </div>
  </div>

  <main class="main">
    ${pageData.intro_text ? `
    <section class="intro">
      ${pageData.intro_text}
    </section>` : ''}

    <div class="section-head">
      <h2>${escapeHtml(pageData.h1 || 'Jobs')} Available Now</h2>
      <div class="section-head-line"></div>
      <span class="section-head-count">${jobCount} result${jobCount !== 1 ? 's' : ''}</span>
    </div>

    <div class="cards">
      ${jobs.length > 0
        ? jobs.map((j, idx) => renderJobCard(j, isCabinCrew, idx)).join('\n')
        : `<div class="empty">
            <div class="empty-icon">&#9992;</div>
            <p>No positions currently available in this category.</p>
            <p><a href="/Jobs.html">Browse all jobs</a> or check back soon &mdash; we update daily.</p>
          </div>`
      }
    </div>

    ${faqs.length > 0 ? `
    <section class="faq">
      <div class="faq-head">
        <h2>Frequently Asked Questions</h2>
        <div class="faq-head-line"></div>
      </div>
      ${faqs.map((f, idx) => `
        <div class="faq-item" id="faq-${idx}">
          <button class="faq-trigger" onclick="toggleFaq(${idx})" aria-expanded="false" aria-controls="faq-ans-${idx}">
            <h3>${escapeHtml(f.q)}</h3>
            <span class="faq-chevron" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          </button>
          <div class="faq-answer" id="faq-ans-${idx}" role="region">
            <div class="faq-answer-inner">
              <p>${escapeHtml(f.a)}</p>
            </div>
          </div>
        </div>
      `).join('')}
    </section>` : ''}

    <section class="related">
      <div class="related-label">Explore More</div>
      <div class="related-grid">
        ${relatedPages.map(p => `<a href="/${p.slug}" class="related-link">${escapeHtml(p.h1 || p.slug)}</a>`).join('')}
        <a href="/Jobs.html" class="related-link">Browse All Jobs</a>
      </div>
    </section>

    <div class="cta">
      <div class="cta-label">Job Alerts &middot; Free to Use</div>
      <h2>Never Miss a ${isCabinCrew ? 'Cabin Crew' : 'Pilot'} Job Again</h2>
      <p>Get instant alerts for new positions matching your qualifications, aircraft type and location.</p>
      <div class="cta-actions">
        <a href="/signup.html" class="cta-primary">Create Free Account</a>
        <a href="/Jobs.html" class="cta-secondary">Browse all ${jobCount} jobs</a>
      </div>
    </div>
  </main>

  <footer class="footer">
    <p>&copy; ${new Date().getFullYear()} AeroScout<span class="footer-dot">&middot;</span><a href="/terms.html">Terms</a><span class="footer-dot">&middot;</span><a href="/privacy.html">Privacy</a><span class="footer-dot">&middot;</span><a href="/about.html">About</a></p>
  </footer>

  <script>
    function toggleFaq(idx) {
      var item = document.getElementById('faq-' + idx);
      var trigger = item.querySelector('.faq-trigger');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function(el) {
        el.classList.remove('open');
        el.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    }
    var firstFaq = document.getElementById('faq-0');
    if (firstFaq) { toggleFaq(0); }
  </script>
</body>
</html>`;
}

// ── 404 page ─────────────────────────────────────────────────────────────────

function build404() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found | AeroScout</title>
  <meta name="robots" content="noindex">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800&family=Newsreader:ital,opsz,wght@0,6..72,400;1,6..72,400&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Newsreader', Georgia, serif;
      background: #0b0b0b;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #f0ede6;
      text-align: center;
      padding: 24px;
    }
    .err-code {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 120px;
      font-weight: 800;
      color: rgba(200,164,78,0.08);
      line-height: 1;
      margin-bottom: -24px;
      letter-spacing: -4px;
    }
    h1 {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    p { color: rgba(240,237,230,0.4); margin-bottom: 32px; font-size: 15px; font-style: italic; }
    a {
      font-family: 'Bricolage Grotesque', sans-serif;
      background: #c8a44e;
      color: #0b0b0b;
      padding: 12px 32px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.04em;
      transition: background 0.2s;
    }
    a:hover { background: #a68838; }
  </style>
</head>
<body>
  <div class="err-code">404</div>
  <h1>Page Not Found</h1>
  <p>The page you're looking for doesn't exist or has been moved.</p>
  <a href="/Jobs.html">Browse All Jobs</a>
</body>
</html>`;
}

// ── Main handler ─────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { slug } = req.query;

  if (!slug) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(404).send(build404());
  }

  try {
    // 1. Load the landing page definition
    const { data: pageData, error: pageError } = await supabase
      .from('seo_landing_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (pageError || !pageData) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(404).send(build404());
    }

    // 2. Query matching jobs
    const isCabinCrew = pageData.filter_table === 'verified_cabin_crew_jobs';
    const table = isCabinCrew
      ? 'public_verified_cabin_crew_jobs'
      : 'public_verified_jobs';

    let query = supabase
      .from(table)
      .select('*')
      .order('verified_at', { ascending: false })
      .limit(100);

    // Apply primary filter
    if (pageData.filter_column && pageData.filter_value && pageData.filter_column !== '_all') {
      if (pageData.filter_value === 'true') {
        query = query.eq(pageData.filter_column, true);
      } else if (pageData.filter_value === 'false') {
        query = query.eq(pageData.filter_column, false);
      } else {
        query = query.eq(pageData.filter_column, pageData.filter_value);
      }
    }

    // Apply secondary filter (for combo pages)
    if (pageData.filter_column2 && pageData.filter_value2) {
      if (pageData.filter_value2 === 'true') {
        query = query.eq(pageData.filter_column2, true);
      } else if (pageData.filter_value2 === 'false') {
        query = query.eq(pageData.filter_column2, false);
      } else {
        query = query.eq(pageData.filter_column2, pageData.filter_value2);
      }
    }

    const { data: jobs, error: jobsError } = await query;
    if (jobsError) throw jobsError;

    // 3. Load related landing pages for internal links
    let relatedSlugs = [];
    try {
      relatedSlugs = typeof pageData.related_slugs === 'string'
        ? JSON.parse(pageData.related_slugs)
        : (pageData.related_slugs || []);
    } catch (e) { relatedSlugs = []; }

    let relatedPages = [];
    if (relatedSlugs.length > 0) {
      const { data: rp } = await supabase
        .from('seo_landing_pages')
        .select('slug, h1')
        .in('slug', relatedSlugs)
        .eq('is_active', true);
      relatedPages = rp || [];
    }

    // 4. Build and send HTML
    const html = buildLandingPage(pageData, jobs || [], relatedPages);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);

  } catch (err) {
    console.error('landing-page error:', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(build404());
  }
};
