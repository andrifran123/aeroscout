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
    if (p.length === 2) { const l=parseInt(p[0],10),h=parseInt(p[1],10); if(!isNaN(l)&&!isNaN(h)) return {formatted:`$${l.toLocaleString('en-US')}-$${h.toLocaleString('en-US')}/yr`}; }
  }
  const v = parseInt(s, 10);
  return (!isNaN(v) && v > 0) ? { formatted: `$${v.toLocaleString('en-US')}/yr` } : null;
}

// ── Job card ─────────────────────────────────────────────────────────────────

function renderJobCard(job, isCabinCrew, idx) {
  const slug = buildSlug(job);
  const jobUrl = isCabinCrew ? `/jobs/${slug}?type=cabin_crew` : `/jobs/${slug}`;
  const logoHtml = job.logo_url
    ? `<img src="${escapeHtml(job.logo_url)}" alt="${escapeHtml(job.airline)}" loading="lazy" onerror="this.style.display='none';this.parentElement.dataset.fallback='${escapeHtml(iconLetter(job.airline))}';">`
    : '';
  const fl = iconLetter(job.airline);
  const visa = job.visa_sponsor ? ' card--visa' : '';
  const delay = Math.min(idx * 35, 500);

  let pills = '';
  if (isCabinCrew) {
    pills += `<span class="pill pill--aircraft">${escapeHtml(job.position||'Flight Attendant')}</span>`;
    if (job.location) pills += `<span class="pill pill--loc">${escapeHtml(job.location)}</span>`;
    if (job.contract_type) pills += `<span class="pill pill--misc">${escapeHtml(job.contract_type)}</span>`;
    if (job.visa_sponsor) pills += '<span class="pill pill--visa">Visa Sponsored</span>';
  } else {
    if (job.aircraft) pills += `<span class="pill pill--aircraft">${escapeHtml(job.aircraft)}</span>`;
    if (job.rank) pills += `<span class="pill pill--rank">${escapeHtml(job.rank)}</span>`;
    if (job.location) pills += `<span class="pill pill--loc">${escapeHtml(job.location)}</span>`;
    if (job.type_rated) pills += '<span class="pill pill--rated">Type-rated</span>';
    else pills += '<span class="pill pill--misc">Non-type rated</span>';
    if (job.visa_sponsor) pills += '<span class="pill pill--visa">Visa Sponsored</span>';
    if (job.direct_entry) pills += '<span class="pill pill--direct">Direct Entry</span>';
  }

  let stats = '';
  if (isCabinCrew) {
    if (job.experience_years > 0) stats += `<div class="stat"><span class="stat__k">EXP</span><span class="stat__v">${job.experience_years}yr</span></div>`;
    if (job.min_height_cm) stats += `<div class="stat"><span class="stat__k">HT</span><span class="stat__v">${job.min_height_cm}cm</span></div>`;
  } else {
    if (job.total_hours) stats += `<div class="stat"><span class="stat__k">TT</span><span class="stat__v">${formatNumber(job.total_hours)}</span></div>`;
    if (job.pic_hours) stats += `<div class="stat"><span class="stat__k">PIC</span><span class="stat__v">${formatNumber(job.pic_hours)}</span></div>`;
  }
  const sal = formatSalary(job.salary_usd);
  if (sal) stats += `<div class="stat"><span class="stat__k">SALARY</span><span class="stat__v stat__v--salary">${sal.formatted}</span></div>`;

  return `<a href="${jobUrl}" class="card${visa}" style="animation-delay:${delay}ms" aria-label="${escapeHtml(job.title)} at ${escapeHtml(job.airline)}">
    <div class="card__logo" data-fallback="${fl}">${logoHtml}${!job.logo_url ? `<span class="card__letter">${fl}</span>` : ''}</div>
    <div class="card__body">
      <h3 class="card__title">${escapeHtml(job.title)}</h3>
      <p class="card__org">${escapeHtml(job.airline)}</p>
      <div class="card__pills">${pills}</div>
      ${stats ? `<div class="card__stats">${stats}</div>` : ''}
    </div>
    <div class="card__go"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg></div>
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Libre+Franklin:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

    :root {
      --paper:      #f8f7f4;
      --white:      #ffffff;
      --cream:      #f0eee9;
      --sand:       #e5e2dc;
      --sand-dark:  #d1cdc5;
      --navy:       #1a2744;
      --navy-light: #2c3e5a;
      --charcoal:   #1a1a1a;
      --ink:        #2d2d2d;
      --graphite:   #4a4a4a;
      --slate:      #6b7280;
      --mist:       #9ca3af;
      --gold:       #b08d4c;
      --gold-light: #c9a85c;
      --gold-bg:    rgba(176,141,76,0.08);
      --gold-bdr:   rgba(176,141,76,0.22);
      --emerald:    #047857;
      --emerald-bg: rgba(4,120,87,0.06);
      --emerald-bdr:rgba(4,120,87,0.18);
      --sky:        #1d6fa5;
      --sky-bg:     rgba(29,111,165,0.06);
      --sky-bdr:    rgba(29,111,165,0.18);
      --amber:      #b45309;
      --amber-bg:   rgba(180,83,9,0.06);
      --font-serif: 'Cormorant', Georgia, 'Times New Roman', serif;
      --font-sans:  'Libre Franklin', 'Helvetica Neue', Arial, sans-serif;
      --ease:       cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    body {
      font-family: var(--font-sans);
      background: var(--paper);
      color: var(--ink);
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    a { text-decoration: none; color: inherit; }

    /* ── Animations ─────────────────────────── */
    @keyframes rise {
      from { opacity:0; transform:translateY(16px) }
      to   { opacity:1; transform:translateY(0) }
    }
    @keyframes fadeIn {
      from { opacity:0 } to { opacity:1 }
    }

    /* ── Nav ────────────────────────────────── */
    .nav {
      position: sticky; top:0; z-index:100;
      background: rgba(248,247,244,0.92);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--sand);
      height: 58px;
      padding: 0 32px;
      display: flex; align-items:center; justify-content:space-between;
    }
    .nav__brand {
      font-family: var(--font-sans);
      font-weight: 700; font-size:14px;
      color: var(--navy);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      display:flex; align-items:center; gap:10px;
    }
    .nav__icon {
      width:28px; height:28px;
      background: var(--navy);
      border-radius: 6px;
      display:flex; align-items:center; justify-content:center;
    }
    .nav__links { display:flex; gap:4px; align-items:center; }
    .nav__links a {
      font-size:12.5px; font-weight:500;
      color: var(--slate);
      padding: 7px 14px; border-radius:6px;
      transition: color 0.2s, background 0.2s;
      letter-spacing: 0.01em;
    }
    .nav__links a:hover { color: var(--navy); background: rgba(26,39,68,0.04); }
    .nav__cta {
      background: var(--navy) !important;
      color: #fff !important;
      margin-left: 8px !important;
      padding: 7px 20px !important;
      font-weight: 600 !important;
      letter-spacing: 0.03em !important;
    }
    .nav__cta:hover { background: var(--navy-light) !important; }

    /* ── Hero ───────────────────────────────── */
    .hero {
      padding: 72px 32px 56px;
      text-align: center;
      border-bottom: 1px solid var(--sand);
      position: relative;
      background: var(--white);
    }
    /* Subtle watermark pattern */
    .hero::before {
      content:'';
      position:absolute; inset:0;
      background-image: radial-gradient(circle at 1px 1px, var(--sand) 0.5px, transparent 0.5px);
      background-size: 32px 32px;
      opacity: 0.4;
      pointer-events:none;
    }
    .hero__inner {
      position:relative; z-index:1;
      max-width: 680px; margin:0 auto;
    }
    .hero__tag {
      display: inline-flex; align-items:center; gap:8px;
      font-family: var(--font-sans);
      font-size:10.5px; font-weight:600;
      letter-spacing:0.14em; text-transform:uppercase;
      color: var(--gold);
      margin-bottom: 20px;
      animation: fadeIn 0.5s var(--ease) both;
    }
    .hero__tag-dot {
      width:5px; height:5px;
      background: var(--gold);
      border-radius:50%;
    }
    .hero__divider {
      width:40px; height:1px;
      background: var(--gold-bdr);
      margin: 0 auto 24px;
      animation: fadeIn 0.5s 0.1s var(--ease) both;
    }
    .hero h1 {
      font-family: var(--font-serif);
      font-weight: 600;
      font-size: clamp(2.4rem, 5vw, 3.4rem);
      line-height: 1.1;
      letter-spacing: -0.02em;
      color: var(--navy);
      margin-bottom: 16px;
      animation: rise 0.6s 0.15s var(--ease) both;
    }
    .hero__sub {
      font-family: var(--font-serif);
      font-size: 18px;
      font-weight: 400;
      font-style: italic;
      color: var(--slate);
      line-height: 1.5;
      max-width: 460px;
      margin: 0 auto 32px;
      animation: rise 0.6s 0.25s var(--ease) both;
    }
    .hero__actions {
      display:flex; align-items:center; justify-content:center;
      gap:14px; flex-wrap:wrap;
      animation: rise 0.6s 0.35s var(--ease) both;
    }
    .hero__count {
      font-family: var(--font-sans);
      font-size:13px; font-weight:500;
      color: var(--graphite);
      padding: 10px 22px;
      border: 1px solid var(--sand);
      border-radius: 6px;
      background: var(--white);
      display:inline-flex; align-items:center; gap:8px;
    }
    .hero__count strong {
      font-size:17px; font-weight:700;
      color: var(--navy);
    }
    .hero__btn {
      font-family: var(--font-sans);
      font-size:13px; font-weight:600;
      color:#fff;
      background: var(--navy);
      padding: 10px 26px;
      border-radius: 6px;
      transition: background 0.2s, transform 0.15s;
      letter-spacing: 0.02em;
    }
    .hero__btn:hover { background: var(--navy-light); transform:translateY(-1px); }

    /* ── Metrics ────────────────────────────── */
    .metrics {
      display:grid; grid-template-columns:repeat(4,1fr);
      border-bottom: 1px solid var(--sand);
      background: var(--white);
    }
    .metric {
      padding: 20px 16px;
      text-align:center;
      border-right: 1px solid var(--sand);
      animation: fadeIn 0.5s var(--ease) both;
    }
    .metric:nth-child(1){animation-delay:0.3s}
    .metric:nth-child(2){animation-delay:0.4s}
    .metric:nth-child(3){animation-delay:0.5s}
    .metric:nth-child(4){animation-delay:0.6s;border-right:none}
    .metric__num {
      font-family: var(--font-serif);
      font-size:28px; font-weight:600;
      color: var(--navy);
      line-height:1;
    }
    .metric__unit {
      font-family: var(--font-sans);
      font-size:13px; font-weight:400;
      color: var(--mist);
      margin-left:3px;
    }
    .metric__label {
      font-family: var(--font-sans);
      font-size:10px; font-weight:600;
      color: var(--mist);
      text-transform:uppercase;
      letter-spacing:0.1em;
      margin-top:4px;
    }

    /* ── Main ───────────────────────────────── */
    .main {
      max-width: 840px;
      margin: 0 auto;
      padding: 48px 32px 64px;
    }

    /* ── Intro ──────────────────────────────── */
    .intro {
      margin-bottom: 48px;
      padding: 32px 36px;
      background: var(--white);
      border: 1px solid var(--sand);
      border-radius: 4px;
      position:relative;
      animation: rise 0.5s 0.4s var(--ease) both;
    }
    .intro::after {
      content:'';
      position:absolute; top:12px; left:0;
      width:3px; height:calc(100% - 24px);
      background: linear-gradient(to bottom, var(--gold), var(--sand));
      border-radius: 0 2px 2px 0;
    }
    .intro p {
      font-family: var(--font-serif);
      font-size:17px;
      line-height:1.75;
      color: var(--graphite);
      margin-bottom:14px;
    }
    .intro p:first-child {
      font-size:19px;
      font-weight:500;
      color: var(--charcoal);
    }
    .intro p:first-child::first-letter {
      font-family: var(--font-serif);
      font-size: 3.4em;
      float:left;
      line-height:0.78;
      margin-right:8px;
      margin-top:5px;
      color: var(--navy);
      font-weight:700;
    }
    .intro p:last-child { margin-bottom:0; }

    /* ── Section head ──────────────────────── */
    .sec-head {
      display:flex; align-items:center; gap:16px;
      margin-bottom:18px;
    }
    .sec-head h2 {
      font-family: var(--font-serif);
      font-size:24px; font-weight:600;
      color: var(--navy);
      letter-spacing:-0.01em;
      white-space:nowrap;
    }
    .sec-head__line { flex:1; height:1px; background:var(--sand); }
    .sec-head__badge {
      font-family: var(--font-sans);
      font-size:11px; font-weight:600;
      color: var(--slate);
      letter-spacing:0.06em;
      white-space:nowrap;
    }

    /* ── Cards ──────────────────────────────── */
    .cards { display:flex; flex-direction:column; gap:6px; }

    .card {
      display:grid;
      grid-template-columns: 64px 1fr 40px;
      align-items:center;
      background: var(--white);
      border: 1px solid var(--sand);
      border-radius: 4px;
      overflow:hidden;
      cursor:pointer;
      transition: border-color 0.2s, box-shadow 0.25s var(--ease), transform 0.2s var(--ease);
      animation: rise 0.4s var(--ease) both;
    }
    .card:hover {
      border-color: var(--sand-dark);
      box-shadow: 0 4px 20px rgba(26,39,68,0.07), 0 1px 4px rgba(0,0,0,0.04);
      transform: translateY(-2px);
    }
    .card--visa { border-left: 3px solid var(--emerald); }

    .card__logo {
      width:64px; height:64px;
      display:flex; align-items:center; justify-content:center;
      border-right:1px solid var(--sand);
      background: var(--paper);
    }
    .card__logo img {
      width:36px; height:36px;
      object-fit:contain; border-radius:3px;
    }
    .card__letter {
      font-family: var(--font-serif);
      font-size:22px; font-weight:600;
      color: var(--mist);
    }

    .card__body { padding:14px 16px; min-width:0; }
    .card__title {
      font-family: var(--font-sans);
      font-size:14px; font-weight:600;
      color: var(--charcoal);
      line-height:1.3;
      margin-bottom:1px;
    }
    .card__org {
      font-family: var(--font-serif);
      font-size:13px; font-style:italic;
      color: var(--slate);
      margin-bottom:6px;
    }
    .card__pills { display:flex; flex-wrap:wrap; gap:4px; margin-bottom:6px; }
    .pill {
      font-family: var(--font-sans);
      font-size:10px; font-weight:600;
      padding:3px 8px;
      border-radius:3px;
      letter-spacing:0.02em;
      border: 1px solid transparent;
    }
    .pill--aircraft { color:var(--navy); background:rgba(26,39,68,0.06); border-color:rgba(26,39,68,0.12); }
    .pill--rank     { color:var(--graphite); background:var(--cream); border-color:var(--sand); }
    .pill--loc      { color:var(--slate); background:transparent; border-color:var(--sand); }
    .pill--rated    { color:var(--sky); background:var(--sky-bg); border-color:var(--sky-bdr); }
    .pill--misc     { color:var(--mist); background:transparent; border-color:var(--sand); }
    .pill--visa     { color:var(--emerald); background:var(--emerald-bg); border-color:var(--emerald-bdr); }
    .pill--direct   { color:var(--amber); background:var(--amber-bg); border-color:rgba(180,83,9,0.15); }

    .card__stats { display:flex; gap:14px; align-items:center; }
    .stat { display:flex; align-items:center; gap:4px; }
    .stat__k {
      font-family:var(--font-sans);
      font-size:9px; font-weight:600;
      color:var(--mist);
      letter-spacing:0.08em;
      text-transform:uppercase;
    }
    .stat__v {
      font-family:var(--font-sans);
      font-size:12px; font-weight:700;
      color:var(--graphite);
    }
    .stat__v--salary { color: var(--emerald); }

    .card__go {
      display:flex; align-items:center; justify-content:center;
      width:40px; color:var(--mist);
      transition: color 0.2s, transform 0.2s;
    }
    .card:hover .card__go {
      color: var(--navy);
      transform: translate(2px,-2px);
    }

    /* ── Empty ──────────────────────────────── */
    .empty {
      text-align:center; padding:60px 24px;
      background:var(--white);
      border:1px solid var(--sand);
      border-radius:4px;
    }
    .empty p { color:var(--slate); font-size:15px; margin-bottom:8px; }
    .empty a { color:var(--navy); font-weight:600; text-decoration:underline; text-underline-offset:3px; }

    /* ── FAQ ────────────────────────────────── */
    .faq {
      margin-top:48px;
      animation: rise 0.5s 0.2s var(--ease) both;
    }
    .faq__head {
      display:flex; align-items:center; gap:16px;
      margin-bottom:20px;
    }
    .faq__head h2 {
      font-family: var(--font-serif);
      font-size:24px; font-weight:600;
      color: var(--navy);
    }
    .faq__head-line { flex:1; height:1px; background:var(--sand); }
    .faq-item { border-bottom:1px solid var(--sand); }
    .faq-item:first-of-type { border-top:1px solid var(--sand); }
    .faq-trigger {
      width:100%;
      display:flex; align-items:center; justify-content:space-between; gap:20px;
      padding:18px 0;
      background:none; border:none; cursor:pointer; text-align:left;
    }
    .faq-trigger h3 {
      font-family: var(--font-serif);
      font-size:17px; font-weight:500;
      color: var(--charcoal);
      line-height:1.4;
      transition: color 0.2s;
    }
    .faq-trigger:hover h3 { color: var(--navy); }
    .faq-chevron {
      width:20px; height:20px;
      display:flex; align-items:center; justify-content:center;
      flex-shrink:0;
      color: var(--mist);
      transition: color 0.2s, transform 0.3s var(--ease);
    }
    .faq-item.open .faq-chevron { color:var(--gold); transform:rotate(180deg); }
    .faq-answer {
      display:grid; grid-template-rows:0fr;
      transition: grid-template-rows 0.3s var(--ease);
    }
    .faq-item.open .faq-answer { grid-template-rows:1fr; }
    .faq-answer-inner { overflow:hidden; }
    .faq-answer-inner p {
      font-family: var(--font-serif);
      font-size:15px; color:var(--slate);
      line-height:1.75; padding-bottom:20px;
      padding-right:40px;
    }

    /* ── Related ────────────────────────────── */
    .related {
      margin-top:48px;
      animation: rise 0.5s 0.3s var(--ease) both;
    }
    .related__label {
      font-family: var(--font-sans);
      font-size:10px; font-weight:600;
      color: var(--mist);
      text-transform:uppercase;
      letter-spacing:0.14em;
      margin-bottom:12px;
    }
    .related__grid { display:flex; flex-wrap:wrap; gap:8px; }
    .related__link {
      font-family: var(--font-sans);
      font-size:12px; font-weight:500;
      color: var(--slate);
      padding:8px 16px;
      border:1px solid var(--sand);
      border-radius:4px;
      background: var(--white);
      transition: color 0.2s, border-color 0.2s, box-shadow 0.2s;
    }
    .related__link:hover {
      color: var(--navy);
      border-color: var(--sand-dark);
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }

    /* ── CTA ────────────────────────────────── */
    .cta {
      margin-top:48px;
      padding:52px 40px;
      background: var(--navy);
      border-radius:6px;
      text-align:center;
      position:relative;
      overflow:hidden;
      animation: rise 0.5s 0.4s var(--ease) both;
    }
    .cta::before {
      content:'';
      position:absolute; inset:0;
      background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 0.5px, transparent 0.5px);
      background-size: 24px 24px;
      pointer-events:none;
    }
    .cta__inner { position:relative; z-index:1; }
    .cta__tag {
      font-family: var(--font-sans);
      font-size:10px; font-weight:600;
      letter-spacing:0.14em; text-transform:uppercase;
      color: var(--gold-light);
      margin-bottom:16px;
    }
    .cta h2 {
      font-family: var(--font-serif);
      font-size: clamp(1.5rem,3vw,2rem);
      font-weight:600;
      color:#fff;
      margin-bottom:12px;
    }
    .cta p {
      font-family: var(--font-serif);
      font-size:15px; font-style:italic;
      color:rgba(255,255,255,0.55);
      line-height:1.6;
      max-width:400px;
      margin:0 auto 28px;
    }
    .cta__actions { display:flex; align-items:center; justify-content:center; gap:12px; flex-wrap:wrap; }
    .cta__primary {
      font-family: var(--font-sans);
      font-size:13px; font-weight:600;
      color: var(--navy);
      background: #fff;
      padding:12px 30px; border-radius:6px;
      letter-spacing:0.02em;
      transition: background 0.2s, transform 0.15s;
    }
    .cta__primary:hover { background:var(--cream); transform:translateY(-1px); }
    .cta__secondary {
      font-family: var(--font-sans);
      font-size:13px; font-weight:500;
      color: rgba(255,255,255,0.6);
      border:1px solid rgba(255,255,255,0.15);
      padding:12px 24px; border-radius:6px;
      transition: color 0.2s, border-color 0.2s;
    }
    .cta__secondary:hover { color:rgba(255,255,255,0.85); border-color:rgba(255,255,255,0.3); }

    /* ── Footer ─────────────────────────────── */
    .footer {
      text-align:center;
      padding:28px 32px;
      border-top:1px solid var(--sand);
      margin-top:0;
    }
    .footer p {
      font-family: var(--font-sans);
      font-size:11px; color:var(--mist);
      letter-spacing:0.03em;
    }
    .footer a { color:var(--slate); transition:color 0.15s; }
    .footer a:hover { color:var(--navy); }
    .footer__dot { margin:0 10px; opacity:0.35; }

    /* ── Responsive ─────────────────────────── */
    @media (max-width:640px) {
      .nav { padding:0 16px; height:52px; }
      .nav__links a:not(.nav__cta) { display:none; }
      .nav__cta { margin-left:0 !important; }
      .hero { padding:52px 20px 44px; }
      .hero h1 { font-size:2rem; }
      .metrics { grid-template-columns:repeat(2,1fr); }
      .metric:nth-child(2) { border-right:none; }
      .main { padding:32px 16px 48px; }
      .intro { padding:24px 20px; }
      .intro::after { display:none; }
      .intro p:first-child::first-letter { font-size:2.4em; }
      .card { grid-template-columns:50px 1fr 36px; }
      .card__logo { width:50px; height:50px; }
      .card__logo img { width:28px; height:28px; }
      .card__letter { font-size:18px; }
      .card__body { padding:10px 12px; }
      .card__title { font-size:13px; }
      .card__pills { display:none; }
      .cta { padding:36px 20px; }
    }
    @media (max-width:480px) {
      .hero__actions { gap:10px; }
      .hero__count { padding:8px 14px; font-size:12px; }
      .hero__btn { padding:8px 18px; font-size:12px; }
    }
  </style>
</head>
<body>
  <nav class="nav">
    <a href="/" class="nav__brand">
      <div class="nav__icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

  <section class="hero">
    <div class="hero__inner">
      <div class="hero__tag">
        <span class="hero__tag-dot"></span>
        Live Aviation Opportunities
      </div>
      <div class="hero__divider"></div>
      <h1>${escapeHtml(pageData.h1 || pageData.page_title)}</h1>
      <p class="hero__sub">Updated daily from 850+ airlines and operators worldwide. Find your next cockpit or cabin role in minutes.</p>
      <div class="hero__actions">
        <span class="hero__count"><strong>${jobCount}</strong> open position${jobCount !== 1 ? 's' : ''}</span>
        <a href="/Jobs.html" class="hero__btn">Browse all jobs &rarr;</a>
      </div>
    </div>
  </section>

  <div class="metrics">
    <div class="metric">
      <div class="metric__num">${jobCount}<span class="metric__unit">jobs</span></div>
      <div class="metric__label">Open Positions</div>
    </div>
    <div class="metric">
      <div class="metric__num">${airlines.size}<span class="metric__unit">orgs</span></div>
      <div class="metric__label">Airlines &amp; Operators</div>
    </div>
    <div class="metric">
      <div class="metric__num">${visaCount}<span class="metric__unit">roles</span></div>
      <div class="metric__label">Visa Sponsored</div>
    </div>
    <div class="metric">
      <div class="metric__num">24<span class="metric__unit">hrs</span></div>
      <div class="metric__label">Update Cycle</div>
    </div>
  </div>

  <main class="main">
    ${pageData.intro_text ? `<section class="intro">${pageData.intro_text}</section>` : ''}

    <div class="sec-head">
      <h2>${escapeHtml(pageData.h1 || 'Jobs')} Available Now</h2>
      <div class="sec-head__line"></div>
      <span class="sec-head__badge">${jobCount} result${jobCount !== 1 ? 's' : ''}</span>
    </div>

    <div class="cards">
      ${jobs.length > 0
        ? jobs.map((j,i) => renderJobCard(j, isCabinCrew, i)).join('\n')
        : `<div class="empty"><p>No positions currently available in this category.</p><p><a href="/Jobs.html">Browse all jobs</a> or check back soon &mdash; we update daily.</p></div>`
      }
    </div>

    ${faqs.length > 0 ? `
    <section class="faq">
      <div class="faq__head">
        <h2>Frequently Asked Questions</h2>
        <div class="faq__head-line"></div>
      </div>
      ${faqs.map((f,i) => `
        <div class="faq-item" id="faq-${i}">
          <button class="faq-trigger" onclick="toggleFaq(${i})" aria-expanded="false" aria-controls="faq-ans-${i}">
            <h3>${escapeHtml(f.q)}</h3>
            <span class="faq-chevron"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span>
          </button>
          <div class="faq-answer" id="faq-ans-${i}" role="region"><div class="faq-answer-inner"><p>${escapeHtml(f.a)}</p></div></div>
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
    function toggleFaq(i){var el=document.getElementById('faq-'+i),t=el.querySelector('.faq-trigger'),o=el.classList.contains('open');document.querySelectorAll('.faq-item.open').forEach(function(e){e.classList.remove('open');e.querySelector('.faq-trigger').setAttribute('aria-expanded','false')});if(!o){el.classList.add('open');t.setAttribute('aria-expanded','true')}}
    var f0=document.getElementById('faq-0');if(f0)toggleFaq(0);
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant:wght@400;600&family=Libre+Franklin:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body{font-family:'Libre Franklin',sans-serif;background:#f8f7f4;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;color:#1a2744;text-align:center;padding:24px}
    .code{font-family:'Cormorant',serif;font-size:100px;font-weight:600;color:rgba(26,39,68,0.06);line-height:1;margin-bottom:-20px}
    h1{font-family:'Cormorant',serif;font-size:26px;font-weight:600;margin-bottom:10px}
    p{color:#6b7280;margin-bottom:28px;font-size:14px}
    a{background:#1a2744;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;letter-spacing:0.02em;transition:background 0.2s}
    a:hover{background:#2c3e5a}
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
