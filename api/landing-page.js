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

// ── Job card renderer (compact list version) ─────────────────────────────────

function renderJobCard(job, isCabinCrew) {
  const slug = buildSlug(job);
  const jobUrl = isCabinCrew ? `/jobs/${slug}?type=cabin_crew` : `/jobs/${slug}`;

  const logoHtml = job.logo_url
    ? `<img src="${escapeHtml(job.logo_url)}" alt="${escapeHtml(job.airline)}" onerror="this.parentElement.textContent='${iconLetter(job.airline)}'">`
    : iconLetter(job.airline);

  const visaClass = job.visa_sponsor ? ' visa-sponsor' : '';

  // Build attribute pills
  let pills = '';
  if (isCabinCrew) {
    pills += `<span class="attr-pill">${escapeHtml(job.position || 'Flight Attendant')}</span>`;
    if (job.location) pills += `<span class="attr-pill">${escapeHtml(job.location)}</span>`;
    if (job.contract_type) pills += `<span class="attr-pill">${escapeHtml(job.contract_type)}</span>`;
    if (job.visa_sponsor) pills += '<span class="attr-pill green">Visa Sponsor</span>';
  } else {
    if (job.aircraft) pills += `<span class="attr-pill">${escapeHtml(job.aircraft)}</span>`;
    if (job.rank) pills += `<span class="attr-pill">${escapeHtml(job.rank)}</span>`;
    if (job.location) pills += `<span class="attr-pill">${escapeHtml(job.location)}</span>`;
    if (job.type_rated) pills += '<span class="attr-pill">Type-rated</span>';
    else pills += '<span class="attr-pill green">Non-type rated</span>';
    if (job.visa_sponsor) pills += '<span class="attr-pill green">Visa Sponsor</span>';
    if (job.direct_entry) pills += '<span class="attr-pill" style="background:#e3f2fd;color:#1565c0;">Direct Entry</span>';
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
    stats += `<div class="stat-box"><span class="stat-label">Salary</span><span class="stat-value" style="color:#22c55e;">${salaryInfo.formatted}</span></div>`;
  }

  return `<a href="${jobUrl}" class="job-card${visaClass}">
    <div class="job-card-logo">${logoHtml}</div>
    <div class="job-card-info">
      <div class="job-card-title">${escapeHtml(job.title)}<span class="job-card-airline">${escapeHtml(job.airline)}</span></div>
      <div class="job-card-pills">${pills}</div>
      <div class="job-card-stats">${stats}</div>
    </div>
    <div class="job-card-arrow">&#8250;</div>
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
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;600;800&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f1f5f9;
      color: #1e293b;
      min-height: 100vh;
    }
    a { text-decoration: none; color: inherit; }

    /* ── Navbar ─────────────────────────────────────────── */
    .nav {
      background: #0b1426;
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .nav-logo {
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 18px;
      color: #fff;
      letter-spacing: 2px;
    }
    .nav-links { display: flex; gap: 20px; }
    .nav-links a {
      color: rgba(255,255,255,0.8);
      font-size: 13px;
      font-weight: 500;
      transition: color 0.15s;
    }
    .nav-links a:hover { color: #fff; }

    /* ── Hero ───────────────────────────────────────────── */
    .landing-hero {
      background: linear-gradient(135deg, #0b1426 0%, #162240 100%);
      padding: 48px 24px 36px;
      text-align: center;
    }
    .landing-hero h1 {
      font-family: 'Outfit', sans-serif;
      color: #fff;
      font-size: 2.2rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    .landing-hero .subtitle {
      color: rgba(255,255,255,0.65);
      font-size: 15px;
    }
    .job-count-badge {
      display: inline-block;
      background: #2563eb;
      color: #fff;
      padding: 6px 18px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      margin-top: 16px;
    }

    /* ── Container ──────────────────────────────────────── */
    .container {
      max-width: 900px;
      margin: 24px auto;
      padding: 0 16px;
    }

    /* ── Intro section ─────────────────────────────────── */
    .intro-section {
      background: #fff;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      padding: 24px 28px;
      margin-bottom: 24px;
      box-shadow: 0 2px 4px -1px rgba(0,0,0,0.06);
    }
    .intro-section p {
      font-size: 15px;
      line-height: 1.7;
      color: #334155;
      margin-bottom: 12px;
    }
    .intro-section p:last-child { margin-bottom: 0; }

    /* ── Job list ───────────────────────────────────────── */
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 14px;
    }
    .job-list { display: flex; flex-direction: column; gap: 10px; }

    .job-card {
      display: grid;
      grid-template-columns: 70px 1fr 30px;
      gap: 12px;
      align-items: center;
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 14px 16px;
      transition: all 0.15s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .job-card:hover {
      border-color: #2563eb;
      box-shadow: 0 4px 12px rgba(37,99,235,0.1);
      transform: translateY(-1px);
    }
    .job-card.visa-sponsor {
      background: #f1f8e9;
      border-color: #a5d6a7;
    }
    .job-card-logo {
      width: 70px;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 20px;
      color: #0b2a6f;
      background: #f8fafc;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .job-card-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .job-card-info { min-width: 0; }
    .job-card-title {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
      line-height: 1.3;
    }
    .job-card-airline {
      margin-left: 8px;
      font-size: 12px;
      font-weight: 500;
      color: #64748b;
    }
    .job-card-pills {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 6px;
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
    .job-card-stats {
      display: flex;
      gap: 16px;
    }
    .stat-box { display: flex; flex-direction: column; }
    .stat-label {
      font-size: 9px;
      text-transform: uppercase;
      color: #94a3b8;
      font-weight: 700;
    }
    .stat-value {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }
    .job-card-arrow {
      font-size: 24px;
      color: #cbd5e1;
      justify-self: center;
    }
    .job-card:hover .job-card-arrow { color: #2563eb; }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #64748b;
      font-size: 15px;
    }
    .empty-state a { color: #2563eb; font-weight: 600; }

    /* ── FAQ section ────────────────────────────────────── */
    .faq-section {
      background: #fff;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      padding: 24px 28px;
      margin-top: 28px;
      box-shadow: 0 2px 4px -1px rgba(0,0,0,0.06);
    }
    .faq-section h2 {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .faq-item {
      border-bottom: 1px solid #f1f5f9;
      padding: 16px 0;
    }
    .faq-item:last-child { border-bottom: none; }
    .faq-item h3 {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 6px;
    }
    .faq-item p {
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
    }

    /* ── Related links ──────────────────────────────────── */
    .related-section {
      margin-top: 28px;
    }
    .related-section h2 {
      font-size: 16px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .related-links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .related-link {
      background: #fff;
      color: #1e293b;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid #e2e8f0;
      transition: all 0.15s;
    }
    .related-link:hover {
      background: #2563eb;
      color: #fff;
      border-color: #2563eb;
    }

    /* ── CTA Banner ─────────────────────────────────────── */
    .cta-banner {
      background: #0b1426;
      border-radius: 12px;
      padding: 28px;
      margin-top: 28px;
      text-align: center;
    }
    .cta-banner h2 {
      font-family: 'Outfit', sans-serif;
      color: #fff;
      font-size: 20px;
      margin-bottom: 8px;
    }
    .cta-banner p {
      color: rgba(255,255,255,0.7);
      font-size: 14px;
      margin-bottom: 16px;
    }
    .cta-btn {
      display: inline-block;
      background: #2563eb;
      color: #fff;
      padding: 10px 24px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      transition: background 0.15s;
    }
    .cta-btn:hover { background: #1d4ed8; }

    /* ── Footer ─────────────────────────────────────────── */
    .footer {
      text-align: center;
      padding: 24px;
      color: #94a3b8;
      font-size: 12px;
    }
    .footer a { color: #64748b; }
    .footer a:hover { color: #1e293b; }

    /* ── Responsive ─────────────────────────────────────── */
    @media (max-width: 768px) {
      .landing-hero { padding: 32px 16px 24px; }
      .landing-hero h1 { font-size: 1.6rem; }
      .container { margin: 12px auto; padding: 0 12px; }
      .intro-section { padding: 16px 18px; }
      .job-card {
        grid-template-columns: 50px 1fr 20px;
        gap: 10px;
        padding: 12px;
      }
      .job-card-logo { width: 50px; height: 50px; font-size: 16px; }
      .job-card-title { font-size: 13px; }
      .job-card-airline { display: block; margin-left: 0; margin-top: 2px; }
      .job-card-pills { gap: 4px; }
      .attr-pill { font-size: 10px; padding: 2px 6px; }
      .job-card-stats { gap: 10px; }
      .stat-label { font-size: 8px; }
      .stat-value { font-size: 11px; }
      .faq-section { padding: 16px 18px; }
      .related-link { padding: 6px 12px; font-size: 12px; }
    }
  </style>
</head>
<body>
  <nav class="nav">
    <a href="/" class="nav-logo">AEROSCOUT</a>
    <div class="nav-links">
      <a href="/Jobs.html">Browse Jobs</a>
      <a href="/about.html">About</a>
      <a href="/pricing.html">Pricing</a>
      <a href="/login.html">Login</a>
    </div>
  </nav>

  <section class="landing-hero">
    <h1>${escapeHtml(pageData.h1 || pageData.page_title)}</h1>
    <p class="subtitle">Updated daily from 850+ airlines and operators worldwide</p>
    <span class="job-count-badge">${jobCount} open position${jobCount !== 1 ? 's' : ''}</span>
  </section>

  <main class="container">
    ${pageData.intro_text ? `<section class="intro-section">${pageData.intro_text}</section>` : ''}

    <h2 class="section-title">${jobCount} ${escapeHtml(pageData.h1 || 'Jobs')} Available Now</h2>

    <div class="job-list">
      ${jobs.length > 0
        ? jobs.map(j => renderJobCard(j, isCabinCrew)).join('\n')
        : '<div class="empty-state">No positions currently available in this category. <a href="/Jobs.html">Browse all jobs</a> or check back soon.</div>'
      }
    </div>

    ${faqs.length > 0 ? `
    <section class="faq-section">
      <h2>Frequently Asked Questions</h2>
      ${faqs.map(f => `
        <div class="faq-item">
          <h3>${escapeHtml(f.q)}</h3>
          <p>${escapeHtml(f.a)}</p>
        </div>
      `).join('')}
    </section>` : ''}

    <section class="related-section">
      <h2>Explore More Aviation Jobs</h2>
      <div class="related-links">
        ${relatedPages.map(p => `<a href="/${p.slug}" class="related-link">${escapeHtml(p.h1 || p.slug)}</a>`).join('')}
        <a href="/Jobs.html" class="related-link">Browse All Jobs</a>
      </div>
    </section>

    <div class="cta-banner">
      <h2>Never Miss a ${isCabinCrew ? 'Cabin Crew' : 'Pilot'} Job</h2>
      <p>Get instant alerts for new positions matching your criteria. Free tier available.</p>
      <a href="/signup.html" class="cta-btn">Create Free Account</a>
    </div>
  </main>

  <footer class="footer">
    <p>&copy; ${new Date().getFullYear()} AeroScout. <a href="/terms.html">Terms</a> &middot; <a href="/privacy.html">Privacy</a></p>
  </footer>
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
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;600;800&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background: #f1f5f9; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; color: #1e293b; }
    h1 { font-family: 'Outfit', sans-serif; font-size: 28px; margin-bottom: 8px; }
    p { color: #64748b; margin-bottom: 20px; }
    a { background: #0b2a6f; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; }
    a:hover { background: #081a45; }
  </style>
</head>
<body>
  <h1>Page Not Found</h1>
  <p>The page you're looking for doesn't exist.</p>
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
