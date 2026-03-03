const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://ziboktbmbyjbhifsdypa.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str) {
  return String(str).toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}
function buildSlug(job) {
  const parts = [job.title, job.org || job.airline].filter(Boolean).map(slugify).filter(Boolean);
  return parts.length > 0 ? `${parts.join('-')}-${job.id}` : String(job.id);
}
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
function iconLetter(name) { return name ? name.charAt(0).toUpperCase() : '?'; }
function formatNumber(n) { return (!n || n === 0) ? '0' : Number(n).toLocaleString('en-US'); }
function formatSalary(salary) {
  if (!salary || salary === 0 || salary === '0') return null;
  const s = String(salary);
  if (s.includes('-')) {
    const p = s.split('-');
    if (p.length === 2) { const l=parseInt(p[0],10),h=parseInt(p[1],10); if(!isNaN(l)&&!isNaN(h)) return {formatted:`$${l.toLocaleString('en-US')}-$${h.toLocaleString('en-US')}/yr`, isRange:true}; }
  }
  const v = parseInt(s, 10);
  return (!isNaN(v) && v > 0) ? { formatted: `$${v.toLocaleString('en-US')}/yr`, isRange: false } : null;
}

function timeAgoDays(dateStr) {
  if (!dateStr) return -1;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return -1;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}
function timeAgo(dateStr) {
  const diffDays = timeAgoDays(dateStr);
  if (diffDays < 0 || diffDays > 21) return '';
  if (diffDays === 0) return 'Added today';
  if (diffDays === 1) return 'Added yesterday';
  if (diffDays < 7) return `Added ${diffDays} days ago`;
  if (diffDays < 14) return 'Added 1 week ago';
  if (diffDays < 21) return 'Added 2 weeks ago';
  return 'Added 3 weeks ago';
}
function timeAgoClass(dateStr) {
  const diffDays = timeAgoDays(dateStr);
  if (diffDays < 0 || diffDays > 21) return '';
  return diffDays < 7 ? 'recent' : 'older';
}

// ── Job card ─────────────────────────────────────────────────────────────────

function renderJobCard(job, isCabinCrew, idx) {
  const slug = buildSlug(job);
  const jobUrl = isCabinCrew ? `/jobs/${slug}?type=cabin_crew` : `/jobs/${slug}`;
  const fl = iconLetter(job.airline);
  const visaClass = job.visa_sponsor ? ' visa-sponsor' : '';

  // Logo
  const logoHtml = job.logo_url
    ? `<img src="${escapeHtml(job.logo_url)}" alt="${escapeHtml(job.airline)}" loading="${idx < 6 ? 'eager' : 'lazy'}" onerror="this.style.display='none'">`
    : `<span style="font-size:24px;font-weight:700;color:#0b2a6f;">${fl}</span>`;

  // Pills (attr-pills) – matches Jobs.html renderAttributes()
  let pills = '';
  if (isCabinCrew) {
    pills += `<span class="attr-item"><b>Position:</b> <span class="attr-pill">${escapeHtml(job.position || 'Flight Attendant')}</span></span>`;
    if (job.location)       pills += `<span class="attr-item"><b>Location:</b> <span class="attr-pill">${escapeHtml(job.location)}</span></span>`;
    if (job.contract_type)  pills += `<span class="attr-pill">${escapeHtml(job.contract_type)}</span>`;
    if (job.visa_sponsor)   pills += `<span class="attr-pill green"><b>Visa Sponsor</b></span>`;
  } else {
    pills += `<span class="attr-item"><b>Aircraft:</b> <span class="attr-pill">${escapeHtml(job.aircraft || 'N/A')}</span></span>`;
    pills += `<span class="attr-item"><b>Location:</b> <span class="attr-pill">${escapeHtml(job.location || 'Not specified')}</span></span>`;
    if (job.type_rated)     pills += `<span class="attr-pill">Type-rated</span>`;
    else                    pills += `<span class="attr-pill green">Non-type rated</span>`;
    if (job.visa_sponsor)   pills += `<span class="attr-pill green"><b>Visa sponsor</b></span>`;
    if (job.direct_entry)   pills += `<span class="attr-pill"><b>Direct Entry</b></span>`;
  }

  // Stats row – matches Jobs.html renderStatsRow() exactly
  let statsHtml = '';
  const statBoxes = [];
  if (isCabinCrew) {
    if (job.min_height_cm)        statBoxes.push(`<div class="stat-box"><span class="stat-label">Min Height</span><span class="stat-value">${job.min_height_cm} cm</span></div>`);
    if (job.min_age)              statBoxes.push(`<div class="stat-box"><span class="stat-label">Min Age</span><span class="stat-value">${job.min_age}+ years</span></div>`);
    if (job.experience_years > 0) statBoxes.push(`<div class="stat-box"><span class="stat-label">Experience</span><span class="stat-value">${job.experience_years} ${job.experience_years === 1 ? 'year' : 'years'}</span></div>`);
    if (job.contract_type)        statBoxes.push(`<div class="stat-box"><span class="stat-label">Contract</span><span class="stat-value">${escapeHtml(job.contract_type)}</span></div>`);
  } else {
    statBoxes.push(`<div class="stat-box"><span class="stat-label">Total Time</span><span class="stat-value">${formatNumber(job.total_hours)} hrs</span></div>`);
    statBoxes.push(`<div class="stat-box"><span class="stat-label">PIC Time</span><span class="stat-value">${formatNumber(job.pic_hours)} hrs</span></div>`);
    if (job.jet_time)             statBoxes.push(`<div class="stat-box"><span class="stat-label">Jet Time</span><span class="stat-value">${formatNumber(job.jet_time)} hrs</span></div>`);
    if (job.multi_engine_time)    statBoxes.push(`<div class="stat-box"><span class="stat-label">Multi-Engine</span><span class="stat-value">${formatNumber(job.multi_engine_time)} hrs</span></div>`);
    if (job.roster)               statBoxes.push(`<div class="stat-box"><span class="stat-label">Roster</span><span class="stat-value">${escapeHtml(job.roster)}</span></div>`);
  }
  const sal = formatSalary(job.salary_usd);
  if (sal) statBoxes.push(`<div class="stat-box"><span class="stat-label">Salary${sal.isRange ? ' (range)' : ''}</span><span class="stat-value" style="color:#22c55e;">${sal.formatted}</span></div>`);
  if (statBoxes.length > 0) statsHtml = `<div class="stats-row">${statBoxes.join('')}</div>`;

  // Time ago badge – matches Jobs.html
  const timeBadge = timeAgo(job.verified_at);
  const timeClass = timeAgoClass(job.verified_at);
  const timeBadgeHtml = timeBadge ? `<span class="time-ago ${timeClass}">${timeBadge}</span>` : '';

  return `
<a href="${jobUrl}" class="card${visaClass}" aria-label="${escapeHtml(job.title)} at ${escapeHtml(job.airline)}">
  <div class="company-logo">${logoHtml}</div>
  <div class="job-title-row">
    <h3 class="job-title">${escapeHtml(job.title)}</h3><span class="airline-name">${escapeHtml(job.airline)}</span>
  </div>
  <div class="attributes">${pills}</div>
  ${statsHtml}
  ${timeBadgeHtml}
  <div class="card-arrow">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
  </div>
</a>`;
}

// ── Schema.org ───────────────────────────────────────────────────────────────

function buildFaqSchema(faqs) {
  if (!faqs || !faqs.length) return null;
  return { '@context':'https://schema.org','@type':'FAQPage','mainEntity':faqs.map(f=>({'@type':'Question','name':f.q,'acceptedAnswer':{'@type':'Answer','text':f.a}})) };
}
function buildItemListSchema(jobs, isCabinCrew) {
  return { '@context':'https://schema.org','@type':'ItemList','itemListElement':jobs.slice(0,30).map((job,i)=>({'@type':'ListItem','position':i+1,'url':`https://www.aeroscout.net/jobs/${buildSlug(job)}${isCabinCrew?'?type=cabin_crew':''}`})) };
}

// ── Landing page HTML ────────────────────────────────────────────────────────

function buildLandingPage(pageData, jobs, relatedPages) {
  const isCabinCrew = pageData.filter_table === 'verified_cabin_crew_jobs';
  const jobCount = jobs.length;
  let faqs = [];
  try { faqs = typeof pageData.faq_json === 'string' ? JSON.parse(pageData.faq_json) : (pageData.faq_json || []); } catch(e) { faqs=[]; }

  const ogParams = new URLSearchParams();
  ogParams.set('title', pageData.h1 || pageData.page_title);
  ogParams.set('airline', `${jobCount} Open Position${jobCount !== 1 ? 's' : ''}`);
  const ogImage = `https://www.aeroscout.net/api/og?${ogParams.toString()}`;
  const faqSchema = buildFaqSchema(faqs);
  const itemListSchema = buildItemListSchema(jobs, isCabinCrew);
  const airlines = new Set(jobs.map(j => j.airline).filter(Boolean));
  const visaCount = jobs.filter(j => j.visa_sponsor).length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17913572733"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','AW-17913572733');</script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(pageData.page_title)}</title>
  <meta name="description" content="${escapeHtml(pageData.meta_description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${pageData.canonical_url}">
  <meta property="og:title" content="${escapeHtml(pageData.og_title || pageData.page_title)}">
  <meta property="og:description" content="${escapeHtml(pageData.og_description || pageData.meta_description)}">
  <meta property="og:url" content="${pageData.canonical_url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="AeroScout">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageData.page_title)}">
  <meta name="twitter:description" content="${escapeHtml(pageData.meta_description)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
  ${faqSchema ? `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>` : ''}
  <script type="application/ld+json">${JSON.stringify(itemListSchema)}</script>
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
      background: #f1f5f9;
      color: #0e1830;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    a { text-decoration: none; color: inherit; }

    /* ── Nav ─────────────────────────────────────────────────────────── */
    .nav {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #0b2a6f;
      height: 58px;
      padding: 0 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(11,42,111,0.18);
    }
    .nav__brand {
      font-weight: 800;
      font-size: 1.25rem;
      color: #fff;
      letter-spacing: 0.3px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .nav__logo {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #1b66ff, #00b7a8);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .nav__links {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .nav__links a {
      font-size: 13px;
      font-weight: 500;
      color: rgba(255,255,255,0.75);
      padding: 7px 14px;
      border-radius: 6px;
      transition: color 0.15s, background 0.15s;
    }
    .nav__links a:hover { color: #fff; background: rgba(255,255,255,0.1); }
    .nav__cta {
      background: rgba(255,255,255,0.15) !important;
      color: #fff !important;
      border: 1px solid rgba(255,255,255,0.25) !important;
      font-weight: 700 !important;
      margin-left: 6px !important;
    }
    .nav__cta:hover { background: rgba(255,255,255,0.25) !important; }

    /* ── Hero ────────────────────────────────────────────────────────── */
    .hero {
      background: #0b2a6f;
      padding: 56px 32px 48px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 1px);
      background-size: 28px 28px;
      pointer-events: none;
    }
    .hero::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 900px 400px at 50% 100%, rgba(27,102,255,0.25), transparent 70%);
      pointer-events: none;
    }
    .hero__inner {
      position: relative;
      z-index: 1;
      max-width: 700px;
      margin: 0 auto;
    }
    .hero__tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #00b7a8;
      margin-bottom: 18px;
    }
    .hero__tag-dot {
      width: 6px;
      height: 6px;
      background: #00b7a8;
      border-radius: 50%;
    }
    .hero h1 {
      font-size: clamp(1.8rem, 4vw, 2.8rem);
      font-weight: 800;
      color: #fff;
      line-height: 1.15;
      letter-spacing: -0.02em;
      margin-bottom: 14px;
    }
    .hero__sub {
      font-size: 16px;
      color: rgba(255,255,255,0.65);
      line-height: 1.6;
      max-width: 500px;
      margin: 0 auto 32px;
    }
    .hero__actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .hero__count {
      font-size: 14px;
      font-weight: 600;
      color: rgba(255,255,255,0.8);
      padding: 10px 22px;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px;
      background: rgba(255,255,255,0.07);
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .hero__count strong {
      font-size: 18px;
      font-weight: 800;
      color: #fff;
    }
    .hero__btn {
      font-size: 14px;
      font-weight: 700;
      color: #0b2a6f;
      background: #fff;
      padding: 10px 26px;
      border-radius: 8px;
      transition: background 0.15s, transform 0.12s;
      letter-spacing: 0.01em;
    }
    .hero__btn:hover { background: #dbe8ff; transform: translateY(-1px); }

    /* ── Stats bar ───────────────────────────────────────────────────── */
    .stats-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    }
    .stats-bar__item {
      padding: 18px 16px;
      text-align: center;
      border-right: 1px solid #e2e8f0;
    }
    .stats-bar__item:last-child { border-right: none; }
    .stats-bar__num {
      font-size: 26px;
      font-weight: 800;
      color: #0b2a6f;
      line-height: 1;
      letter-spacing: -0.02em;
    }
    .stats-bar__unit {
      font-size: 13px;
      font-weight: 400;
      color: #94a3b8;
      margin-left: 2px;
    }
    .stats-bar__label {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 3px;
    }

    /* ── Main wrapper ────────────────────────────────────────────────── */
    .main {
      max-width: 860px;
      margin: 0 auto;
      padding: 40px 24px 64px;
    }

    /* ── Intro ───────────────────────────────────────────────────────── */
    .intro {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #0b2a6f;
      border-radius: 10px;
      padding: 24px 28px;
      margin-bottom: 36px;
      box-shadow: 0 2px 4px -1px rgba(0,0,0,0.06);
    }
    .intro p {
      font-size: 15px;
      line-height: 1.75;
      color: #334155;
      margin-bottom: 10px;
    }
    .intro p:last-child { margin-bottom: 0; }

    /* ── Section heading ─────────────────────────────────────────────── */
    .sec-head {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 16px;
    }
    .sec-head h2 {
      font-size: 20px;
      font-weight: 700;
      color: #0b2a6f;
      white-space: nowrap;
    }
    .sec-head__line { flex: 1; height: 1px; background: #e2e8f0; }
    .sec-head__badge {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    /* ── Cards container ─────────────────────────────────────────────── */
    .cards { display: grid; gap: 8px; min-width: 0; }

    /* ── Card - matching Jobs.html exactly ───────────────────────────── */
    .card {
      background: white;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      padding: 16px 20px;
      display: grid;
      grid-template-columns: 100px minmax(0, 1fr) 36px;
      grid-template-rows: auto auto auto;
      gap: 6px 14px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px -1px rgba(0,0,0,0.08);
      cursor: pointer;
      color: inherit;
    }
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
      border-color: #cbd5e1;
    }
    .card.visa-sponsor {
      background: #f1f8e9;
      border-color: #a5d6a7;
    }

    /* Logo - grid-row spans rows 1 and 2, matches Jobs.html */
    .company-logo {
      grid-column: 1;
      grid-row: 1 / span 2;
      width: 100px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 24px;
      color: #0b2a6f;
      flex-shrink: 0;
    }
    .company-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    /* Title row: job title + airline badge inline */
    .job-title-row {
      grid-column: 2;
      grid-row: 1;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0;
      align-self: center;
      min-width: 0;
    }
    .job-title {
      font-size: 16px;
      font-weight: 700;
      margin: 0;
      color: #1e293b;
      line-height: 1.3;
    }
    .airline-name {
      margin-left: 12px;
      font-size: 12px;
      font-weight: 500;
      color: #475569;
      letter-spacing: 0.3px;
      background: rgba(71,85,105,0.06);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid rgba(71,85,105,0.15);
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* Attributes row */
    .attributes {
      grid-column: 2;
      grid-row: 2;
      display: flex;
      gap: 10px;
      color: #64748b;
      font-size: 12px;
      flex-wrap: wrap;
      align-items: center;
    }
    .attr-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: #475569;
    }
    .attr-item b {
      font-weight: 600;
      color: #475569;
    }
    .attr-pill {
      background: #e3f2fd;
      color: #1565c0;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    .attr-pill.green {
      background: white;
      color: #2e7d32;
      border: 1.5px solid #4caf50;
    }

    /* Stats row - matches Jobs.html exactly */
    .stats-row {
      grid-column: 2;
      grid-row: 3;
      display: flex;
      gap: 24px;
      margin-top: 4px;
      padding-top: 8px;
      border-top: 1px dashed #e2e8f0;
    }
    .stat-box {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #94a3b8;
      font-weight: 700;
    }
    .stat-value {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }

    /* Time ago badge – matches Jobs.html */
    .time-ago {
      grid-column: 1;
      grid-row: 3;
      font-size: 10px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 10px;
      white-space: nowrap;
      align-self: end;
      justify-self: start;
    }
    .time-ago.recent {
      color: #2e7d32;
      background: #e8f5e9;
    }
    .time-ago.older {
      color: #1565c0;
      background: #e3f2fd;
    }

    /* Right arrow indicator */
    .card-arrow {
      grid-column: 3;
      grid-row: 1 / span 2;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #cbd5e1;
      align-self: center;
      transition: color 0.2s, transform 0.2s;
    }
    .card:hover .card-arrow {
      color: #0b2a6f;
      transform: translateX(2px);
    }

    /* ── Empty state ─────────────────────────────────────────────────── */
    .empty {
      text-align: center;
      padding: 60px 24px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
    }
    .empty p { color: #64748b; font-size: 15px; margin-bottom: 8px; }
    .empty a { color: #0b2a6f; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }

    /* ── FAQ ─────────────────────────────────────────────────────────── */
    .faq { margin-top: 48px; }
    .faq__head {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 16px;
    }
    .faq__head h2 {
      font-size: 20px;
      font-weight: 700;
      color: #0b2a6f;
      white-space: nowrap;
    }
    .faq__head-line { flex: 1; height: 1px; background: #e2e8f0; }

    .faq-item {
      border-bottom: 1px solid #e2e8f0;
      background: #fff;
    }
    .faq-item:first-of-type {
      border-top: 1px solid #e2e8f0;
      border-radius: 14px 14px 0 0;
    }
    .faq-item:last-of-type { border-radius: 0 0 14px 14px; }
    .faq-trigger {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 16px 20px;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
    }
    .faq-trigger h3 {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.4;
      transition: color 0.2s;
    }
    .faq-trigger:hover h3 { color: #0b2a6f; }
    .faq-chevron {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #94a3b8;
      transition: color 0.2s, transform 0.25s ease;
    }
    .faq-item.open .faq-chevron { color: #0b2a6f; transform: rotate(180deg); }
    .faq-answer {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.28s ease;
    }
    .faq-item.open .faq-answer { grid-template-rows: 1fr; }
    .faq-answer-inner { overflow: hidden; }
    .faq-answer-inner p {
      font-size: 14px;
      color: #475569;
      line-height: 1.75;
      padding: 0 20px 18px;
    }

    /* ── Related pages ───────────────────────────────────────────────── */
    .related { margin-top: 48px; }
    .related__label {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin-bottom: 12px;
    }
    .related__grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .related__link {
      font-size: 13px;
      font-weight: 500;
      color: #475569;
      padding: 8px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #fff;
      transition: color 0.15s, border-color 0.15s, box-shadow 0.15s;
    }
    .related__link:hover {
      color: #0b2a6f;
      border-color: #cbd5e1;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    /* ── CTA banner ──────────────────────────────────────────────────── */
    .cta {
      margin-top: 48px;
      padding: 48px 40px;
      background: linear-gradient(135deg, #0b2a6f, #081a45);
      border-radius: 14px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .cta::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 1px);
      background-size: 22px 22px;
      pointer-events: none;
    }
    .cta__inner { position: relative; z-index: 1; }
    .cta__tag {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #00b7a8;
      margin-bottom: 14px;
    }
    .cta h2 {
      font-size: clamp(1.4rem, 3vw, 1.9rem);
      font-weight: 800;
      color: #fff;
      margin-bottom: 10px;
      letter-spacing: -0.01em;
    }
    .cta p {
      font-size: 14px;
      color: rgba(255,255,255,0.55);
      line-height: 1.65;
      max-width: 420px;
      margin: 0 auto 28px;
    }
    .cta__actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .cta__primary {
      font-size: 14px;
      font-weight: 700;
      color: #0b2a6f;
      background: #fff;
      padding: 12px 30px;
      border-radius: 8px;
      letter-spacing: 0.01em;
      transition: background 0.15s, transform 0.12s;
    }
    .cta__primary:hover { background: #dbe8ff; transform: translateY(-1px); }
    .cta__secondary {
      font-size: 13px;
      font-weight: 600;
      color: rgba(255,255,255,0.6);
      border: 1px solid rgba(255,255,255,0.18);
      padding: 12px 24px;
      border-radius: 8px;
      transition: color 0.15s, border-color 0.15s;
    }
    .cta__secondary:hover { color: rgba(255,255,255,0.9); border-color: rgba(255,255,255,0.35); }

    /* ── Footer ──────────────────────────────────────────────────────── */
    .footer {
      text-align: center;
      padding: 28px 32px;
      border-top: 1px solid #e2e8f0;
      background: #fff;
      margin-top: 0;
    }
    .footer p {
      font-size: 12px;
      color: #94a3b8;
      letter-spacing: 0.02em;
    }
    .footer a { color: #64748b; transition: color 0.15s; }
    .footer a:hover { color: #0b2a6f; }
    .footer__dot { margin: 0 10px; opacity: 0.4; }

    /* ── Responsive ──────────────────────────────────────────────────── */
    @media (max-width: 768px) {
      .nav { padding: 0 16px; height: 52px; }
      .nav__links a:not(.nav__cta) { display: none; }
      .hero { padding: 40px 20px 36px; }
      .stats-bar { grid-template-columns: repeat(2, 1fr); }
      .stats-bar__item:nth-child(2) { border-right: none; }
      .stats-bar__item:nth-child(3) { border-top: 1px solid #e2e8f0; }
      .stats-bar__item:nth-child(4) { border-top: 1px solid #e2e8f0; border-right: none; }
      .main { padding: 28px 14px 48px; }
      .intro { padding: 18px 20px; }
      .card {
        grid-template-columns: 80px minmax(0, 1fr) 30px;
        padding: 14px 14px;
        gap: 5px 10px;
      }
      .company-logo { width: 80px; height: 80px; font-size: 20px; }
      .job-title { font-size: 14px; }
      .cta { padding: 36px 20px; }
    }
    @media (max-width: 480px) {
      .hero h1 { font-size: 1.6rem; }
      .hero__sub { font-size: 14px; }
      .hero__count { padding: 8px 14px; font-size: 13px; }
      .hero__btn { padding: 8px 18px; font-size: 13px; }
      .stats-bar__num { font-size: 22px; }
      .card {
        grid-template-columns: 66px minmax(0, 1fr) 26px;
        padding: 12px 12px;
        gap: 4px 8px;
      }
      .company-logo { width: 66px; height: 66px; font-size: 18px; }
      .job-title { font-size: 13px; }
      .airline-name { font-size: 11px; }
      .attr-pill { font-size: 10px; padding: 2px 6px; }
      .stats-row { gap: 14px; }
      .stat-value { font-size: 13px; }
    }
  </style>
</head>
<body>
  <!-- ── Nav ── -->
  <nav class="nav">
    <a href="/" class="nav__brand">
      <div class="nav__logo">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      AeroScout
    </a>
    <div class="nav__links">
      <a href="/Jobs.html">Browse Jobs</a>
      <a href="/about.html">About</a>
      <a href="/pricing.html">Pricing</a>
      <a href="/login.html">Login</a>
      <a href="/signup.html" class="nav__cta">Sign Up Free</a>
    </div>
  </nav>

  <!-- ── Hero ── -->
  <section class="hero">
    <div class="hero__inner">
      <div class="hero__tag">
        <span class="hero__tag-dot"></span>
        Live Aviation Opportunities
      </div>
      <h1>${escapeHtml(pageData.h1 || pageData.page_title)}</h1>
      <p class="hero__sub">Updated daily from 850+ airlines and operators worldwide. Find your next ${isCabinCrew ? 'cabin crew' : 'cockpit'} role in minutes.</p>
      <div class="hero__actions">
        <span class="hero__count"><strong>${jobCount}</strong>&nbsp;open position${jobCount !== 1 ? 's' : ''}</span>
        <a href="/Jobs.html" class="hero__btn">Browse all jobs &rarr;</a>
      </div>
    </div>
  </section>

  <!-- ── Stats bar ── -->
  <div class="stats-bar">
    <div class="stats-bar__item">
      <div class="stats-bar__num">${jobCount}<span class="stats-bar__unit">jobs</span></div>
      <div class="stats-bar__label">Open Positions</div>
    </div>
    <div class="stats-bar__item">
      <div class="stats-bar__num">${airlines.size}<span class="stats-bar__unit">orgs</span></div>
      <div class="stats-bar__label">Airlines &amp; Operators</div>
    </div>
    <div class="stats-bar__item">
      <div class="stats-bar__num">${visaCount}<span class="stats-bar__unit">roles</span></div>
      <div class="stats-bar__label">Visa Sponsored</div>
    </div>
    <div class="stats-bar__item">
      <div class="stats-bar__num">24<span class="stats-bar__unit">hrs</span></div>
      <div class="stats-bar__label">Update Cycle</div>
    </div>
  </div>

  <!-- ── Main content ── -->
  <main class="main">
    ${pageData.intro_text ? `<section class="intro">${pageData.intro_text}</section>` : ''}

    <div class="sec-head">
      <h2>${escapeHtml(pageData.h1 || 'Jobs')} Available Now</h2>
      <div class="sec-head__line"></div>
      <span class="sec-head__badge">${jobCount} result${jobCount !== 1 ? 's' : ''}</span>
    </div>

    <div class="cards">
      ${jobs.length > 0
        ? jobs.map((j, i) => renderJobCard(j, isCabinCrew, i)).join('\n')
        : `<div class="empty"><p>No positions currently available in this category.</p><p><a href="/Jobs.html">Browse all jobs</a> or check back soon &mdash; we update daily.</p></div>`
      }
    </div>

    ${faqs.length > 0 ? `
    <section class="faq">
      <div class="faq__head">
        <h2>Frequently Asked Questions</h2>
        <div class="faq__head-line"></div>
      </div>
      ${faqs.map((f, i) => `
      <div class="faq-item" id="faq-${i}">
        <button class="faq-trigger" onclick="toggleFaq(${i})" aria-expanded="false" aria-controls="faq-ans-${i}">
          <h3>${escapeHtml(f.q)}</h3>
          <span class="faq-chevron">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </span>
        </button>
        <div class="faq-answer" id="faq-ans-${i}" role="region">
          <div class="faq-answer-inner"><p>${escapeHtml(f.a)}</p></div>
        </div>
      </div>`).join('')}
    </section>` : ''}

    <section class="related">
      <div class="related__label">Explore More</div>
      <div class="related__grid">
        ${relatedPages.map(p => `<a href="/${p.slug}" class="related__link">${escapeHtml(p.h1 || p.slug)}</a>`).join('')}
        <a href="/Jobs.html" class="related__link">Browse All Jobs</a>
      </div>
    </section>

    <div class="cta">
      <div class="cta__inner">
        <div class="cta__tag">Job Alerts &middot; Free to Use</div>
        <h2>Never Miss a ${isCabinCrew ? 'Cabin Crew' : 'Pilot'} Job Again</h2>
        <p>Get instant alerts for new positions matching your qualifications, aircraft type and location.</p>
        <div class="cta__actions">
          <a href="/signup.html" class="cta__primary">Create Free Account</a>
          <a href="/Jobs.html" class="cta__secondary">Browse all ${jobCount} jobs</a>
        </div>
      </div>
    </div>
  </main>

  <footer class="footer">
    <p>&copy; ${new Date().getFullYear()} AeroScout<span class="footer__dot">&middot;</span><a href="/terms.html">Terms</a><span class="footer__dot">&middot;</span><a href="/privacy.html">Privacy</a><span class="footer__dot">&middot;</span><a href="/about.html">About</a></p>
  </footer>

  <script>
    function toggleFaq(i) {
      var el = document.getElementById('faq-' + i);
      var t = el.querySelector('.faq-trigger');
      var isOpen = el.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function(e) {
        e.classList.remove('open');
        e.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        el.classList.add('open');
        t.setAttribute('aria-expanded', 'true');
      }
    }
    // Open the first FAQ by default
    var f0 = document.getElementById('faq-0');
    if (f0) toggleFaq(0);
  </script>
</body>
</html>`;
}

// ── 404 ──────────────────────────────────────────────────────────────────────

function build404() {
  return `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Page Not Found | AeroScout</title><meta name="robots" content="noindex">
  <style>
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
      background: #f1f5f9;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #0b2a6f;
      text-align: center;
      padding: 24px;
    }
    .code {
      font-size: 100px;
      font-weight: 800;
      color: rgba(11,42,111,0.06);
      line-height: 1;
      margin-bottom: -20px;
    }
    h1 { font-size: 26px; font-weight: 700; margin-bottom: 10px; color: #0b2a6f; }
    p { color: #64748b; margin-bottom: 28px; font-size: 14px; }
    a {
      background: #0b2a6f;
      color: #fff;
      padding: 12px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.01em;
      transition: background 0.15s;
    }
    a:hover { background: #081a45; }
  </style>
</head><body>
  <div class="code">404</div>
  <h1>Page Not Found</h1>
  <p>The page you're looking for doesn't exist or has been moved.</p>
  <a href="/Jobs.html">Browse All Jobs</a>
</body></html>`;
}

// ── Handler ──────────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();
  const { slug } = req.query;
  if (!slug) { res.setHeader('Content-Type','text/html; charset=utf-8'); return res.status(404).send(build404()); }

  try {
    const { data: pageData, error: pageError } = await supabase
      .from('seo_landing_pages').select('*').eq('slug', slug).eq('is_active', true).single();
    if (pageError || !pageData) { res.setHeader('Content-Type','text/html; charset=utf-8'); return res.status(404).send(build404()); }

    const isCabinCrew = pageData.filter_table === 'verified_cabin_crew_jobs';
    const table = isCabinCrew ? 'public_verified_cabin_crew_jobs' : 'public_verified_jobs';
    let query = supabase.from(table).select('*').order('verified_at', { ascending: false }).limit(100);

    if (pageData.filter_column && pageData.filter_value && pageData.filter_column !== '_all') {
      if (pageData.filter_value === 'true') query = query.eq(pageData.filter_column, true);
      else if (pageData.filter_value === 'false') query = query.eq(pageData.filter_column, false);
      else query = query.eq(pageData.filter_column, pageData.filter_value);
    }
    if (pageData.filter_column2 && pageData.filter_value2) {
      if (pageData.filter_value2 === 'true') query = query.eq(pageData.filter_column2, true);
      else if (pageData.filter_value2 === 'false') query = query.eq(pageData.filter_column2, false);
      else query = query.eq(pageData.filter_column2, pageData.filter_value2);
    }

    const { data: jobs, error: jobsError } = await query;
    if (jobsError) throw jobsError;

    let relatedSlugs = [];
    try { relatedSlugs = typeof pageData.related_slugs === 'string' ? JSON.parse(pageData.related_slugs) : (pageData.related_slugs || []); } catch(e) { relatedSlugs=[]; }
    let relatedPages = [];
    if (relatedSlugs.length > 0) {
      const { data: rp } = await supabase.from('seo_landing_pages').select('slug, h1').in('slug', relatedSlugs).eq('is_active', true);
      relatedPages = rp || [];
    }

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
