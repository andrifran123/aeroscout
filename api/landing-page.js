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

function renderJobCard(job, isCabinCrew) {
  const slug = buildSlug(job);
  const jobUrl = isCabinCrew ? `/jobs/${slug}?type=cabin_crew` : `/jobs/${slug}`;

  const logoHtml = job.logo_url
    ? `<img src="${escapeHtml(job.logo_url)}" alt="${escapeHtml(job.airline)}" loading="lazy" onerror="this.style.display='none';this.parentElement.dataset.fallback='${escapeHtml(iconLetter(job.airline))}';">`
    : '';

  const fallbackLetter = iconLetter(job.airline);
  const visaClass = job.visa_sponsor ? ' visa-sponsor' : '';

  // Build attribute pills
  let pills = '';
  if (isCabinCrew) {
    pills += `<span class="attr-pill pill-type">${escapeHtml(job.position || 'Flight Attendant')}</span>`;
    if (job.location) pills += `<span class="attr-pill pill-loc"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${escapeHtml(job.location)}</span>`;
    if (job.contract_type) pills += `<span class="attr-pill pill-contract">${escapeHtml(job.contract_type)}</span>`;
    if (job.visa_sponsor) pills += '<span class="attr-pill pill-visa">Visa Sponsored</span>';
  } else {
    if (job.aircraft) pills += `<span class="attr-pill pill-type">${escapeHtml(job.aircraft)}</span>`;
    if (job.rank) pills += `<span class="attr-pill pill-rank">${escapeHtml(job.rank)}</span>`;
    if (job.location) pills += `<span class="attr-pill pill-loc"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${escapeHtml(job.location)}</span>`;
    if (job.type_rated) pills += '<span class="attr-pill pill-rated">Type-rated</span>';
    else pills += '<span class="attr-pill pill-nonrated">Non-type rated</span>';
    if (job.visa_sponsor) pills += '<span class="attr-pill pill-visa">Visa Sponsored</span>';
    if (job.direct_entry) pills += '<span class="attr-pill pill-direct">Direct Entry</span>';
  }

  // Build stats
  let stats = '';
  if (isCabinCrew) {
    if (job.experience_years > 0) stats += `<div class="stat-box"><span class="stat-label">Experience</span><span class="stat-value">${job.experience_years} yr</span></div>`;
    if (job.min_height_cm) stats += `<div class="stat-box"><span class="stat-label">Min Height</span><span class="stat-value">${job.min_height_cm} cm</span></div>`;
  } else {
    if (job.total_hours) stats += `<div class="stat-box"><span class="stat-label">Total Time</span><span class="stat-value">${formatNumber(job.total_hours)} hrs</span></div>`;
    if (job.pic_hours) stats += `<div class="stat-box"><span class="stat-label">PIC</span><span class="stat-value">${formatNumber(job.pic_hours)} hrs</span></div>`;
  }
  const salaryInfo = formatSalary(job.salary_usd);
  if (salaryInfo) {
    stats += `<div class="stat-box"><span class="stat-label">Salary</span><span class="stat-value salary-val">${salaryInfo.formatted}</span></div>`;
  }

  return `<a href="${jobUrl}" class="job-card${visaClass}" aria-label="${escapeHtml(job.title)} at ${escapeHtml(job.airline)}">
    <div class="job-card-logo" data-fallback="${fallbackLetter}">${logoHtml}${!job.logo_url ? `<span class="logo-letter">${fallbackLetter}</span>` : ''}</div>
    <div class="job-card-body">
      <div class="job-card-header">
        <div class="job-card-title">${escapeHtml(job.title)}</div>
        <div class="job-card-airline">${escapeHtml(job.airline)}</div>
      </div>
      <div class="job-card-pills">${pills}</div>
      ${stats ? `<div class="job-card-stats">${stats}</div>` : ''}
    </div>
    <div class="job-card-cta">
      <svg class="arrow-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
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

  // Compute quick stats from jobs array
  const airlinesSet = new Set(jobs.map(j => j.airline).filter(Boolean));
  const countriesSet = new Set(jobs.map(j => (j.location || '').split(',').pop().trim()).filter(Boolean));
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
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap" rel="stylesheet">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

  <style>
    /* ── Reset & base ───────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --navy:       #060e1f;
      --navy-mid:   #0c1a33;
      --navy-light: #142040;
      --blue:       #1e6bff;
      --blue-dim:   #1858d4;
      --blue-glow:  rgba(30,107,255,0.18);
      --teal:       #00c2a8;
      --gold:       #f0a500;
      --green:      #10b981;
      --green-bg:   rgba(16,185,129,0.1);
      --green-bdr:  rgba(16,185,129,0.35);
      --slate-50:   #f8fafc;
      --slate-100:  #f1f5f9;
      --slate-200:  #e2e8f0;
      --slate-400:  #94a3b8;
      --slate-500:  #64748b;
      --slate-600:  #475569;
      --slate-700:  #334155;
      --slate-800:  #1e293b;
      --slate-900:  #0f172a;
      --font-head:  'Space Grotesk', system-ui, sans-serif;
      --font-body:  'DM Sans', system-ui, sans-serif;
      --radius-sm:  8px;
      --radius-md:  12px;
      --radius-lg:  18px;
      --radius-xl:  24px;
      --shadow-sm:  0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05);
      --shadow-md:  0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05);
      --shadow-lg:  0 10px 30px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06);
      --shadow-blue:0 8px 28px rgba(30,107,255,0.22);
    }

    body {
      font-family: var(--font-body);
      background: var(--slate-100);
      color: var(--slate-800);
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    a { text-decoration: none; color: inherit; }

    /* ── Navbar ─────────────────────────────────────────── */
    .nav {
      background: var(--navy);
      padding: 0 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 60px;
      position: sticky;
      top: 0;
      z-index: 100;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      backdrop-filter: blur(12px);
    }
    .nav-logo {
      font-family: var(--font-head);
      font-weight: 700;
      font-size: 17px;
      color: #fff;
      letter-spacing: 3px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .nav-logo-mark {
      width: 28px;
      height: 28px;
      background: var(--blue);
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nav-logo-mark svg { display: block; }
    .nav-links { display: flex; gap: 4px; align-items: center; }
    .nav-links a {
      color: rgba(255,255,255,0.65);
      font-size: 13px;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      transition: background 0.15s, color 0.15s;
      letter-spacing: 0.01em;
    }
    .nav-links a:hover { color: #fff; background: rgba(255,255,255,0.07); }
    .nav-links a.nav-cta {
      background: var(--blue);
      color: #fff;
      margin-left: 6px;
      padding: 6px 16px;
    }
    .nav-links a.nav-cta:hover { background: var(--blue-dim); }

    /* ── Hero ───────────────────────────────────────────── */
    .landing-hero {
      background: var(--navy);
      position: relative;
      overflow: hidden;
      padding: 72px 24px 60px;
      text-align: center;
    }
    /* Mesh gradient background */
    .landing-hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 60% at 20% 40%, rgba(30,107,255,0.18) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 80% 20%, rgba(0,194,168,0.10) 0%, transparent 55%),
        radial-gradient(ellipse 50% 80% at 60% 80%, rgba(30,107,255,0.08) 0%, transparent 50%);
      pointer-events: none;
    }
    /* Subtle grid pattern */
    .landing-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
      background-size: 48px 48px;
      pointer-events: none;
      mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.6) 70%, transparent 100%);
    }
    .hero-content { position: relative; z-index: 1; max-width: 780px; margin: 0 auto; }
    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: rgba(30,107,255,0.15);
      border: 1px solid rgba(30,107,255,0.3);
      color: #7ab5ff;
      padding: 5px 14px;
      border-radius: 100px;
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 22px;
    }
    .hero-eyebrow-dot {
      width: 6px;
      height: 6px;
      background: var(--teal);
      border-radius: 50%;
      animation: pulse-dot 2s ease-in-out infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.7); }
    }
    .landing-hero h1 {
      font-family: var(--font-head);
      color: #fff;
      font-size: clamp(1.9rem, 5vw, 3rem);
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.15;
      margin-bottom: 16px;
    }
    .landing-hero h1 .accent {
      background: linear-gradient(135deg, #5b9fff 0%, var(--teal) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .landing-hero .subtitle {
      color: rgba(255,255,255,0.55);
      font-size: 15.5px;
      font-weight: 400;
      line-height: 1.6;
      max-width: 520px;
      margin: 0 auto 28px;
    }
    .hero-badge-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      color: #fff;
      padding: 9px 20px;
      border-radius: 100px;
      font-size: 13px;
      font-weight: 600;
      transition: background 0.2s, border-color 0.2s;
    }
    .hero-badge-num {
      color: var(--teal);
      font-size: 15px;
      font-weight: 700;
    }
    .hero-browse-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--blue);
      color: #fff;
      padding: 10px 24px;
      border-radius: 100px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: var(--shadow-blue);
      transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    }
    .hero-browse-btn:hover {
      background: var(--blue-dim);
      transform: translateY(-1px);
      box-shadow: 0 12px 32px rgba(30,107,255,0.32);
    }

    /* ── Stats bar ──────────────────────────────────────── */
    .stats-bar {
      background: var(--navy-mid);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .stats-bar-inner {
      max-width: 900px;
      margin: 0 auto;
      padding: 0 16px;
      display: flex;
      align-items: stretch;
    }
    .stats-bar-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 18px 12px;
      border-right: 1px solid rgba(255,255,255,0.06);
      min-width: 0;
    }
    .stats-bar-item:last-child { border-right: none; }
    .stats-bar-num {
      font-family: var(--font-head);
      font-size: 22px;
      font-weight: 700;
      color: #fff;
      line-height: 1.1;
    }
    .stats-bar-num .unit {
      font-size: 13px;
      font-weight: 500;
      color: var(--slate-400);
      margin-left: 2px;
    }
    .stats-bar-label {
      font-size: 11px;
      font-weight: 500;
      color: var(--slate-400);
      text-transform: uppercase;
      letter-spacing: 0.07em;
      margin-top: 3px;
    }

    /* ── Container ──────────────────────────────────────── */
    .container {
      max-width: 900px;
      margin: 32px auto;
      padding: 0 16px;
    }

    /* ── Intro section ─────────────────────────────────── */
    .intro-section {
      background: #fff;
      border-radius: var(--radius-lg);
      border: 1px solid var(--slate-200);
      padding: 32px 36px;
      margin-bottom: 28px;
      box-shadow: var(--shadow-sm);
      position: relative;
      overflow: hidden;
    }
    .intro-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(to bottom, var(--blue), var(--teal));
      border-radius: 4px 0 0 4px;
    }
    .intro-section p {
      font-size: 15px;
      line-height: 1.78;
      color: var(--slate-700);
      margin-bottom: 14px;
    }
    .intro-section p:first-child {
      font-size: 16px;
      font-weight: 500;
      color: var(--slate-800);
    }
    .intro-section p:last-child { margin-bottom: 0; }

    /* Pull quote (first paragraph styled as pull quote) */
    .pull-quote {
      font-size: 17px !important;
      font-style: italic;
      color: var(--slate-700) !important;
      font-weight: 400 !important;
      position: relative;
      padding-left: 20px;
      border-left: 3px solid var(--blue);
      margin-bottom: 20px !important;
    }

    /* ── Section header ─────────────────────────────────── */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .section-title {
      font-family: var(--font-head);
      font-size: 19px;
      font-weight: 700;
      color: var(--slate-900);
      letter-spacing: -0.02em;
    }
    .section-count {
      font-size: 12px;
      font-weight: 600;
      color: var(--slate-500);
      background: var(--slate-100);
      border: 1px solid var(--slate-200);
      padding: 4px 10px;
      border-radius: 100px;
    }

    /* ── Job list ───────────────────────────────────────── */
    .job-list { display: flex; flex-direction: column; gap: 8px; }

    .job-card {
      display: grid;
      grid-template-columns: 68px 1fr 44px;
      gap: 0;
      align-items: center;
      background: #fff;
      border-radius: var(--radius-md);
      border: 1px solid var(--slate-200);
      overflow: hidden;
      transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
    }
    .job-card:hover {
      border-color: var(--blue);
      box-shadow: 0 6px 20px rgba(30,107,255,0.12), 0 2px 6px rgba(0,0,0,0.06);
      transform: translateY(-2px);
    }
    .job-card.visa-sponsor {
      border-left: 3px solid var(--green);
    }
    .job-card-logo {
      width: 68px;
      height: 68px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--slate-50);
      border-right: 1px solid var(--slate-100);
      overflow: hidden;
      flex-shrink: 0;
      align-self: stretch;
    }
    .job-card-logo img {
      width: 52px;
      height: 52px;
      object-fit: contain;
    }
    .logo-letter {
      font-family: var(--font-head);
      font-size: 22px;
      font-weight: 700;
      color: var(--navy-mid);
      user-select: none;
    }
    .job-card-body {
      padding: 13px 16px;
      min-width: 0;
    }
    .job-card-header {
      margin-bottom: 7px;
    }
    .job-card-title {
      font-family: var(--font-head);
      font-size: 14px;
      font-weight: 600;
      color: var(--slate-900);
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .job-card-airline {
      font-size: 12px;
      font-weight: 400;
      color: var(--slate-500);
      margin-top: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .job-card-pills {
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
      margin-bottom: 7px;
    }
    .attr-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 100px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
      line-height: 1.4;
    }
    .pill-type    { background: #eff6ff; color: #1d4ed8; }
    .pill-rank    { background: #f0f4ff; color: #3730a3; }
    .pill-loc     { background: var(--slate-100); color: var(--slate-600); }
    .pill-rated   { background: #fef9ec; color: #92400e; border: 1px solid #fde68a; }
    .pill-nonrated{ background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .pill-visa    { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-bdr); }
    .pill-contract{ background: #faf5ff; color: #6d28d9; }
    .pill-direct  { background: #eff6ff; color: #1565c0; }
    .job-card-stats {
      display: flex;
      gap: 14px;
      align-items: center;
    }
    .stat-box { display: flex; flex-direction: column; }
    .stat-label {
      font-size: 9px;
      text-transform: uppercase;
      color: var(--slate-400);
      font-weight: 700;
      letter-spacing: 0.06em;
    }
    .stat-value {
      font-family: var(--font-head);
      font-size: 12px;
      font-weight: 600;
      color: var(--slate-800);
      margin-top: 1px;
    }
    .salary-val { color: var(--green); }
    .job-card-cta {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      align-self: stretch;
      border-left: 1px solid var(--slate-100);
    }
    .arrow-icon {
      color: var(--slate-300);
      transition: color 0.15s, transform 0.15s;
      flex-shrink: 0;
    }
    .job-card:hover .arrow-icon {
      color: var(--blue);
      transform: translateX(3px);
    }

    /* ── Empty state ────────────────────────────────────── */
    .empty-state {
      text-align: center;
      padding: 56px 20px;
      background: #fff;
      border-radius: var(--radius-lg);
      border: 1px solid var(--slate-200);
    }
    .empty-state-icon {
      font-size: 40px;
      margin-bottom: 12px;
      opacity: 0.4;
    }
    .empty-state p {
      color: var(--slate-500);
      font-size: 15px;
      margin-bottom: 8px;
    }
    .empty-state a {
      color: var(--blue);
      font-weight: 600;
    }

    /* ── FAQ section ────────────────────────────────────── */
    .faq-section {
      background: #fff;
      border-radius: var(--radius-lg);
      border: 1px solid var(--slate-200);
      padding: 32px 36px;
      margin-top: 28px;
      box-shadow: var(--shadow-sm);
    }
    .faq-section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .faq-icon {
      width: 36px;
      height: 36px;
      background: var(--blue);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .faq-section h2 {
      font-family: var(--font-head);
      font-size: 19px;
      font-weight: 700;
      color: var(--slate-900);
      letter-spacing: -0.02em;
    }
    .faq-item {
      border-bottom: 1px solid var(--slate-100);
    }
    .faq-item:last-child { border-bottom: none; }
    .faq-trigger {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 0;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
    }
    .faq-trigger h3 {
      font-family: var(--font-head);
      font-size: 14.5px;
      font-weight: 600;
      color: var(--slate-800);
      line-height: 1.4;
    }
    .faq-chevron {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--slate-100);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.2s, transform 0.25s;
    }
    .faq-chevron svg { display: block; transition: transform 0.25s; }
    .faq-item.open .faq-chevron {
      background: var(--blue);
      transform: none;
    }
    .faq-item.open .faq-chevron svg { transform: rotate(180deg); stroke: #fff; }
    .faq-answer {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.28s ease;
    }
    .faq-item.open .faq-answer { grid-template-rows: 1fr; }
    .faq-answer-inner {
      overflow: hidden;
    }
    .faq-answer-inner p {
      font-size: 14px;
      color: var(--slate-600);
      line-height: 1.72;
      padding-bottom: 18px;
    }

    /* ── Related links ──────────────────────────────────── */
    .related-section {
      margin-top: 28px;
    }
    .related-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }
    .related-header h2 {
      font-family: var(--font-head);
      font-size: 14px;
      font-weight: 600;
      color: var(--slate-500);
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }
    .related-header-line {
      flex: 1;
      height: 1px;
      background: var(--slate-200);
    }
    .related-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .related-link {
      background: #fff;
      color: var(--slate-700);
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 500;
      border: 1px solid var(--slate-200);
      transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: var(--shadow-sm);
    }
    .related-link::before {
      content: '';
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--slate-300);
      transition: background 0.15s;
      flex-shrink: 0;
    }
    .related-link:hover {
      background: var(--navy);
      color: #fff;
      border-color: var(--navy);
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(6,14,31,0.15);
    }
    .related-link:hover::before { background: var(--teal); }

    /* ── CTA Banner ─────────────────────────────────────── */
    .cta-banner {
      background: var(--navy);
      border-radius: var(--radius-lg);
      padding: 48px 36px;
      margin-top: 28px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .cta-banner::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 70% 60% at 15% 50%, rgba(30,107,255,0.22) 0%, transparent 60%),
        radial-gradient(ellipse 50% 60% at 85% 30%, rgba(0,194,168,0.12) 0%, transparent 55%);
      pointer-events: none;
    }
    .cta-content { position: relative; z-index: 1; }
    .cta-eyebrow {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--teal);
      margin-bottom: 12px;
    }
    .cta-banner h2 {
      font-family: var(--font-head);
      color: #fff;
      font-size: clamp(1.3rem, 3vw, 1.8rem);
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
    }
    .cta-banner p {
      color: rgba(255,255,255,0.6);
      font-size: 14.5px;
      line-height: 1.6;
      margin-bottom: 28px;
      max-width: 440px;
      margin-left: auto;
      margin-right: auto;
    }
    .cta-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .cta-btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--blue);
      color: #fff;
      padding: 12px 28px;
      border-radius: 100px;
      font-weight: 600;
      font-size: 14px;
      box-shadow: var(--shadow-blue);
      transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    }
    .cta-btn-primary:hover {
      background: var(--blue-dim);
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(30,107,255,0.38);
    }
    .cta-btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      color: rgba(255,255,255,0.85);
      padding: 12px 24px;
      border-radius: 100px;
      font-weight: 500;
      font-size: 14px;
      transition: background 0.2s, border-color 0.2s;
    }
    .cta-btn-secondary:hover {
      background: rgba(255,255,255,0.13);
      border-color: rgba(255,255,255,0.25);
    }

    /* ── Footer ─────────────────────────────────────────── */
    .footer {
      text-align: center;
      padding: 28px 24px;
      color: var(--slate-400);
      font-size: 12.5px;
      border-top: 1px solid var(--slate-200);
      margin-top: 48px;
    }
    .footer a { color: var(--slate-500); transition: color 0.15s; }
    .footer a:hover { color: var(--slate-800); }
    .footer-divider { margin: 0 8px; }

    /* ── Responsive ─────────────────────────────────────── */
    @media (max-width: 640px) {
      .nav { padding: 0 16px; height: 54px; }
      .nav-logo-mark { width: 24px; height: 24px; }
      .nav-links a:not(.nav-cta) { display: none; }
      .nav-links a.nav-cta { margin-left: 0; }

      .landing-hero { padding: 52px 16px 44px; }
      .landing-hero h1 { font-size: 1.75rem; }
      .stats-bar-num { font-size: 18px; }

      .container { margin: 20px auto; padding: 0 12px; }
      .intro-section { padding: 22px 20px; }
      .intro-section::before { display: none; }

      .job-card { grid-template-columns: 54px 1fr 38px; }
      .job-card-logo { width: 54px; height: 54px; }
      .job-card-logo img { width: 40px; height: 40px; }
      .logo-letter { font-size: 18px; }
      .job-card-body { padding: 11px 12px; }
      .job-card-title { font-size: 13px; }
      .job-card-stats { gap: 10px; }

      .faq-section { padding: 22px 20px; }
      .cta-banner { padding: 36px 20px; }
      .stats-bar-inner { gap: 0; }
      .stats-bar-item { padding: 14px 8px; }
      .stats-bar-label { font-size: 10px; }
    }

    @media (max-width: 480px) {
      .hero-badge-row { gap: 8px; }
      .hero-badge { font-size: 12px; padding: 7px 14px; }
      .job-card-pills { display: none; }
    }
  </style>
</head>
<body>
  <!-- Navigation -->
  <nav class="nav">
    <a href="/" class="nav-logo">
      <div class="nav-logo-mark">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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

  <!-- Hero -->
  <section class="landing-hero">
    <div class="hero-content">
      <div class="hero-eyebrow">
        <span class="hero-eyebrow-dot"></span>
        Live aviation opportunities
      </div>
      <h1>${escapeHtml(pageData.h1 || pageData.page_title)}</h1>
      <p class="subtitle">Updated daily from 850+ airlines and operators worldwide. Find your next cockpit or cabin role in minutes.</p>
      <div class="hero-badge-row">
        <span class="hero-badge">
          <span class="hero-badge-num">${jobCount}</span>
          open position${jobCount !== 1 ? 's' : ''}
        </span>
        <a href="/Jobs.html" class="hero-browse-btn">
          Browse all jobs
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
      </div>
    </div>
  </section>

  <!-- Quick stats bar -->
  <div class="stats-bar">
    <div class="stats-bar-inner">
      <div class="stats-bar-item">
        <div class="stats-bar-num">${jobCount}<span class="unit"> jobs</span></div>
        <div class="stats-bar-label">Open Positions</div>
      </div>
      <div class="stats-bar-item">
        <div class="stats-bar-num">${airlinesSet.size}<span class="unit"> orgs</span></div>
        <div class="stats-bar-label">Airlines & Operators</div>
      </div>
      <div class="stats-bar-item">
        <div class="stats-bar-num">${visaCount}<span class="unit"> roles</span></div>
        <div class="stats-bar-label">Visa Sponsored</div>
      </div>
      <div class="stats-bar-item">
        <div class="stats-bar-num">24<span class="unit"> hrs</span></div>
        <div class="stats-bar-label">Update Cycle</div>
      </div>
    </div>
  </div>

  <main class="container">
    <!-- Intro / editorial text -->
    ${pageData.intro_text ? `
    <section class="intro-section">
      ${pageData.intro_text}
    </section>` : ''}

    <!-- Job listings -->
    <div class="section-header">
      <h2 class="section-title">${escapeHtml(pageData.h1 || 'Jobs')} Available Now</h2>
      <span class="section-count">${jobCount} result${jobCount !== 1 ? 's' : ''}</span>
    </div>

    <div class="job-list">
      ${jobs.length > 0
        ? jobs.map(j => renderJobCard(j, isCabinCrew)).join('\n')
        : `<div class="empty-state">
            <div class="empty-state-icon">&#9992;</div>
            <p>No positions currently available in this category.</p>
            <p><a href="/Jobs.html">Browse all jobs</a> or check back soon &mdash; we update daily.</p>
          </div>`
      }
    </div>

    <!-- FAQ section -->
    ${faqs.length > 0 ? `
    <section class="faq-section">
      <div class="faq-section-header">
        <div class="faq-icon">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h2>Frequently Asked Questions</h2>
      </div>
      ${faqs.map((f, idx) => `
        <div class="faq-item" id="faq-${idx}">
          <button class="faq-trigger" onclick="toggleFaq(${idx})" aria-expanded="false" aria-controls="faq-ans-${idx}">
            <h3>${escapeHtml(f.q)}</h3>
            <span class="faq-chevron" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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

    <!-- Related pages -->
    <section class="related-section">
      <div class="related-header">
        <h2>Explore More</h2>
        <div class="related-header-line"></div>
      </div>
      <div class="related-links">
        ${relatedPages.map(p => `<a href="/${p.slug}" class="related-link">${escapeHtml(p.h1 || p.slug)}</a>`).join('')}
        <a href="/Jobs.html" class="related-link">Browse All Jobs</a>
      </div>
    </section>

    <!-- CTA Banner -->
    <div class="cta-banner">
      <div class="cta-content">
        <div class="cta-eyebrow">Job alerts &middot; Free to use</div>
        <h2>Never Miss a ${isCabinCrew ? 'Cabin Crew' : 'Pilot'} Job Again</h2>
        <p>Get instant alerts for new positions matching your qualifications, aircraft type and location. Set up in under 60 seconds.</p>
        <div class="cta-actions">
          <a href="/signup.html" class="cta-btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
            Create Free Account
          </a>
          <a href="/Jobs.html" class="cta-btn-secondary">
            Browse all ${jobCount} jobs
          </a>
        </div>
      </div>
    </div>
  </main>

  <footer class="footer">
    <p>&copy; ${new Date().getFullYear()} AeroScout.
      <span class="footer-divider">&middot;</span>
      <a href="/terms.html">Terms</a>
      <span class="footer-divider">&middot;</span>
      <a href="/privacy.html">Privacy</a>
      <span class="footer-divider">&middot;</span>
      <a href="/about.html">About</a>
    </p>
  </footer>

  <!-- FAQ accordion script -->
  <script>
    function toggleFaq(idx) {
      var item = document.getElementById('faq-' + idx);
      var trigger = item.querySelector('.faq-trigger');
      var isOpen = item.classList.contains('open');
      // Close all
      document.querySelectorAll('.faq-item.open').forEach(function(el) {
        el.classList.remove('open');
        el.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
      });
      // Open clicked if it was closed
      if (!isOpen) {
        item.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    }
    // Open first FAQ by default if present
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
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'DM Sans', sans-serif;
      background: #060e1f;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #fff;
      text-align: center;
      padding: 24px;
    }
    .err-code {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 96px;
      font-weight: 700;
      color: rgba(255,255,255,0.07);
      line-height: 1;
      margin-bottom: -16px;
      letter-spacing: -4px;
    }
    h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    p { color: rgba(255,255,255,0.5); margin-bottom: 28px; font-size: 15px; }
    a {
      background: #1e6bff;
      color: white;
      padding: 12px 28px;
      border-radius: 100px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      transition: background 0.2s;
    }
    a:hover { background: #1858d4; }
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
