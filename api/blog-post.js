const { createClient } = require('@supabase/supabase-js');

let _supabase;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL || 'https://ziboktbmbyjbhifsdypa.supabase.co',
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    );
  }
  return _supabase;
}

function browseFooterCss() {
  return `
    .browse-footer{background:#1a2744;color:rgba(255,255,255,.85);padding:2.5rem 2rem 0}
    .browse-footer__inner{max-width:1100px;margin:0 auto}
    .browse-footer__title{font-family:'Playfair Display',Georgia,serif;font-size:1.25rem;font-weight:700;color:#fff;margin-bottom:1.5rem;padding-bottom:.75rem;border-bottom:1px solid rgba(255,255,255,.12)}
    .browse-footer__grid{display:grid;grid-template-columns:repeat(5,1fr);gap:1.5rem 2rem}
    .browse-footer__col h4{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.45);margin-bottom:.6rem}
    .browse-footer__col a{display:block;font-size:.78rem;color:rgba(255,255,255,.65);text-decoration:none;padding:2.5px 0;line-height:1.55;transition:color .15s}
    .browse-footer__col a:hover{color:#60a5fa}
    .browse-footer__bottom{padding:1.2rem 0;margin-top:1.5rem;border-top:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem}
    .browse-footer__bottom span{font-size:.7rem;color:rgba(255,255,255,.35)}
    .browse-footer__bottom a{font-size:.7rem;color:rgba(255,255,255,.35);text-decoration:none}
    .browse-footer__bottom a:hover{color:#60a5fa}
    .browse-footer__bottom-links{display:flex;gap:1.5rem}
    @media(max-width:768px){.browse-footer{padding:2rem 1.2rem 0}.browse-footer__grid{grid-template-columns:repeat(2,1fr);gap:1.2rem}.browse-footer__col:last-child{grid-column:span 2}.browse-footer__bottom{flex-direction:column;text-align:center}}
  `;
}

function browseFooterHtml() {
  const yr = new Date().getFullYear();
  return `
  <div class="browse-footer">
    <div class="browse-footer__inner">
      <h3 class="browse-footer__title">Browse Pilot &amp; Cabin Crew Jobs</h3>
      <div class="browse-footer__grid">
        <div class="browse-footer__col">
          <h4>By Aircraft Type</h4>
          <a href="/a320-pilot-jobs">A320 Pilot Jobs</a><a href="/b737-pilot-jobs">B737 Pilot Jobs</a><a href="/a330-pilot-jobs">A330 Pilot Jobs</a><a href="/atr-pilot-jobs">ATR Pilot Jobs</a><a href="/embraer-pilot-jobs">Embraer Pilot Jobs</a><a href="/dash-8-pilot-jobs">Dash 8 Pilot Jobs</a><a href="/learjet-pilot-jobs">Learjet Pilot Jobs</a><a href="/gulfstream-pilot-jobs">Gulfstream Pilot Jobs</a><a href="/challenger-650-pilot-jobs">Challenger 650 Pilot Jobs</a><a href="/citation-pilot-jobs">Citation Pilot Jobs</a><a href="/pc12-pilot-jobs">PC-12 Pilot Jobs</a><a href="/king-air-pilot-jobs">King Air Pilot Jobs</a>
        </div>
        <div class="browse-footer__col">
          <h4>By Location</h4>
          <a href="/pilot-jobs-europe">Pilot Jobs Europe</a><a href="/pilot-jobs-middle-east">Pilot Jobs Middle East</a><a href="/pilot-jobs-uk">Pilot Jobs UK</a><a href="/pilot-jobs-london">Pilot Jobs London</a><a href="/pilot-jobs-canada">Pilot Jobs Canada</a><a href="/pilot-jobs-worldwide">Pilot Jobs Worldwide</a><a href="/pilot-jobs-hong-kong">Pilot Jobs Hong Kong</a><a href="/pilot-jobs-alaska">Pilot Jobs Alaska</a><a href="/pilot-jobs-california">Pilot Jobs California</a><a href="/pilot-jobs-florida">Pilot Jobs Florida</a><a href="/pilot-jobs-texas">Pilot Jobs Texas</a><a href="/pilot-jobs-new-york">Pilot Jobs New York</a><a href="/pilot-jobs-ohio">Pilot Jobs Ohio</a><a href="/pilot-jobs-arizona">Pilot Jobs Arizona</a><a href="/pilot-jobs-colorado">Pilot Jobs Colorado</a>
        </div>
        <div class="browse-footer__col">
          <h4>By Airline</h4>
          <a href="/emirates-pilot-jobs">Emirates Pilot Jobs</a><a href="/ryanair-pilot-jobs">Ryanair Pilot Jobs</a><a href="/wizz-air-pilot-jobs">Wizz Air Pilot Jobs</a><a href="/etihad-pilot-jobs">Etihad Pilot Jobs</a><a href="/sas-pilot-jobs">SAS Pilot Jobs</a><a href="/vistajet-pilot-jobs">VistaJet Pilot Jobs</a><a href="/jet2-pilot-jobs">Jet2 Pilot Jobs</a><a href="/netjets-pilot-jobs">NetJets Pilot Jobs</a><a href="/vietnam-airlines-pilot-jobs">Vietnam Airlines Pilot Jobs</a><a href="/air-astana-pilot-jobs">Air Astana Pilot Jobs</a>
        </div>
        <div class="browse-footer__col">
          <h4>By Role</h4>
          <a href="/captain-jobs">Captain Jobs</a><a href="/first-officer-jobs">First Officer Jobs</a><a href="/flight-instructor-jobs">Flight Instructor Jobs</a><a href="/flight-instructor-positions">Flight Instructor Positions</a><a href="/cadet-pilot-jobs">Cadet Pilot Jobs</a><a href="/airline-pilot-jobs">Airline Pilot Jobs</a><a href="/business-aviation-jobs">Business Aviation Jobs</a><a href="/air-ambulance-pilot-jobs">Air Ambulance Pilot Jobs</a><a href="/government-pilot-jobs">Government Pilot Jobs</a><a href="/a320-captain-jobs">A320 Captain Jobs</a><a href="/a320-first-officer-jobs">A320 First Officer Jobs</a><a href="/b737-captain-jobs">B737 Captain Jobs</a><a href="/b737-first-officer-jobs">B737 First Officer Jobs</a><a href="/atr-captain-jobs">ATR Captain Jobs</a><a href="/atr-first-officer-jobs">ATR First Officer Jobs</a><a href="/visa-sponsorship-pilot-jobs">Visa Sponsorship Pilot Jobs</a><a href="/direct-entry-pilot-jobs">Direct Entry Pilot Jobs</a><a href="/type-rated-pilot-jobs">Type Rated Pilot Jobs</a>
        </div>
        <div class="browse-footer__col">
          <h4>Cabin Crew</h4>
          <a href="/cabin-crew-jobs">Cabin Crew Jobs</a><a href="/flight-attendant-jobs">Flight Attendant Jobs</a><a href="/cabin-manager-jobs">Cabin Manager Jobs</a><a href="/cabin-crew-jobs-europe">Cabin Crew Jobs Europe</a><a href="/cabin-crew-jobs-middle-east">Cabin Crew Jobs Middle East</a>
        </div>
      </div>
      <div class="browse-footer__bottom">
        <span>&copy; ${yr} AeroScout</span>
        <div class="browse-footer__bottom-links">
          <a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:contact@aeroscout.net">Contact</a>
        </div>
      </div>
    </div>
  </div>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
function stripHtml(html) {
  if (!html) return '';
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
function truncate(str, maxLen) {
  if (!str) return '';
  const clean = stripHtml(str);
  return clean.length <= maxLen ? clean : clean.substring(0, maxLen - 3) + '...';
}
function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function readingTime(html) {
  const words = stripHtml(html).split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200)) + ' min read';
}

function buildArticleSchema(post, url) {
  return {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: post.title,
    description: post.meta_description || truncate(post.content, 160),
    url, datePublished: post.published_at, dateModified: post.published_at,
    author: { '@type': 'Organization', name: post.author || 'AeroScout', url: 'https://www.aeroscout.net' },
    publisher: { '@type': 'Organization', name: 'AeroScout', url: 'https://www.aeroscout.net', logo: { '@type': 'ImageObject', url: 'https://www.aeroscout.net/images/og-homepage.png' } },
    ...(post.cover_image_url ? { image: post.cover_image_url } : {}),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}

function buildPage(post) {
  const canonicalUrl = `https://www.aeroscout.net/blog/${escapeHtml(post.slug)}`;
  const pageTitle = escapeHtml((post.meta_title || post.title) + ' | AeroScout');
  const metaDesc = escapeHtml(post.meta_description || truncate(post.content, 160));
  const ogImage = post.cover_image_url ? escapeHtml(post.cover_image_url) : 'https://www.aeroscout.net/images/og-homepage.png';
  const schema = buildArticleSchema(post, canonicalUrl);
  const tags = (post.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  const categoryLabel = (post.category || 'article').replace(/-/g, ' ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17913572733"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','AW-17913572733');</script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${metaDesc}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${metaDesc}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="AeroScout">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${pageTitle}">
  <meta name="twitter:description" content="${metaDesc}">
  <meta name="twitter:image" content="${ogImage}">
  <script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;600;800&family=Playfair+Display:wght@600;700;800&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --navy: #1a2744; --navy-deep: #111c35; --gold: #2563EB; --gold-light: #3b82f6;
      --gold-pale: #EFF6FF; --cream: #faf9f6; --cream-dark: #f2efe8; --white: #ffffff;
      --text-dark: #1a2744; --text-mid: #4a5568; --text-light: #718096;
      --border: #e8e3d8; --border-light: #f0ece3; --green: #4caf50; --green-pale: #f0faf0;
      --shadow-md: 0 4px 12px rgba(26,39,68,0.1), 0 2px 4px rgba(26,39,68,0.06);
    }
    body { font-family: 'Source Sans 3', system-ui, sans-serif; background: var(--cream); color: var(--text-dark); min-height: 100vh; -webkit-font-smoothing: antialiased; }
    a { text-decoration: none; color: inherit; }

    /* ── Nav ────────────────────────────────────────── */
    .nav { position: sticky; top: 0; z-index: 200; background: rgba(255,255,255,0.82); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); height: 62px; padding: 0 40px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(26,39,68,0.07); box-shadow: 0 1px 8px rgba(26,39,68,0.04); }
    .nav__brand { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.5rem; color: #1a2744; letter-spacing: -0.5px; }
    .nav__links { display: flex; gap: 2px; align-items: center; }
    .nav__links a { font-size: 14px; font-weight: 500; color: #4a5568; padding: 8px 14px; border-radius: 6px; transition: color 0.15s, background 0.15s; }
    .nav__links a:hover { color: #1a2744; background: rgba(37,99,235,0.06); }
    .nav__signup { border: 1.5px solid #2563EB !important; background: #2563EB !important; color: #fff !important; font-weight: 600 !important; border-radius: 7px !important; margin-left: 4px !important; }
    .nav__signup:hover { background: #1d56d0 !important; border-color: #1d56d0 !important; }
    .nav__login { border: 1.5px solid rgba(26,39,68,0.15) !important; color: #1a2744 !important; font-weight: 600 !important; border-radius: 7px !important; }
    .nav__login:hover { border-color: #2563EB !important; background: rgba(37,99,235,0.06) !important; color: #2563EB !important; }

    /* ── Article hero ───────────────────────────────── */
    .article-hero {
      position: relative;
      overflow: hidden;
      padding: 64px 40px 52px;
    }
    .article-hero__bg {
      position: absolute;
      inset: 0;
      background-image: url('https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1600&q=80');
      background-size: cover;
      background-position: center right;
      z-index: 0;
    }
    .article-hero__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(100deg, rgba(17,28,53,0.97) 0%, rgba(26,39,68,0.93) 50%, rgba(26,39,68,0.6) 80%, rgba(26,39,68,0.4) 100%);
      z-index: 1;
    }
    .article-hero__inner {
      position: relative;
      z-index: 2;
      max-width: 780px;
      margin: 0 auto;
    }
    .category-badge {
      display: inline-block;
      background: rgba(200,164,78,0.2);
      color: var(--gold-light);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 4px 14px;
      border-radius: 4px;
      margin-bottom: 18px;
    }
    .article-hero h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(1.8rem, 4vw, 2.6rem);
      font-weight: 700;
      color: #fff;
      line-height: 1.2;
      margin-bottom: 14px;
    }
    .article-subtitle {
      font-size: 17px;
      color: rgba(255,255,255,0.65);
      font-weight: 400;
      line-height: 1.6;
      margin-bottom: 22px;
      max-width: 560px;
    }
    .article-meta {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 13px;
      color: rgba(255,255,255,0.45);
    }
    .meta-dot { color: rgba(255,255,255,0.25); }

    /* ── Stats bar ──────────────────────────────────── */
    .stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); background: linear-gradient(90deg, var(--gold-light) 0%, var(--gold) 100%); }
    .stats-bar__item { padding: 14px 20px; text-align: center; border-right: 1px solid rgba(255,255,255,0.2); display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .stats-bar__item:last-child { border-right: none; }
    .stats-bar__icon { margin-bottom: 2px; color: rgba(255,255,255,0.85); }
    .stats-bar__value { font-size: 20px; font-weight: 700; color: #fff; line-height: 1; }
    .stats-bar__label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.82); text-transform: uppercase; letter-spacing: 0.1em; }

    /* ── Article body ───────────────────────────────── */
    .article-container {
      max-width: 780px;
      margin: 0 auto;
      padding: 48px 40px 64px;
    }
    .article-content {
      font-size: 16.5px;
      line-height: 1.85;
      color: var(--text-mid);
    }
    .article-content h2 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 26px;
      font-weight: 700;
      color: var(--navy);
      margin: 44px 0 18px;
      padding-bottom: 10px;
      border-bottom: 2px solid var(--border);
    }
    .article-content h3 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 20px;
      font-weight: 600;
      color: var(--text-dark);
      margin: 36px 0 12px;
    }
    .article-content p { margin-bottom: 20px; }
    .article-content ul, .article-content ol { margin: 0 0 20px 24px; }
    .article-content li { margin-bottom: 8px; line-height: 1.75; }
    .article-content blockquote {
      border-left: 4px solid var(--gold);
      background: var(--gold-pale);
      padding: 18px 22px;
      margin: 28px 0;
      border-radius: 0 10px 10px 0;
      font-style: italic;
      color: var(--text-mid);
    }
    .article-content strong { color: var(--text-dark); }
    .article-content a { color: var(--navy); text-decoration: underline; text-underline-offset: 2px; }
    .article-content a:hover { color: var(--gold); }
    .article-content table { width: 100%; border-collapse: collapse; margin: 28px 0; font-size: 14.5px; }
    .article-content table th { background: var(--navy); color: #fff; padding: 11px 16px; text-align: left; font-weight: 600; }
    .article-content table th:first-child { border-radius: 8px 0 0 0; }
    .article-content table th:last-child { border-radius: 0 8px 0 0; }
    .article-content table td { padding: 11px 16px; border-bottom: 1px solid var(--border); }
    .article-content table tr:nth-child(even) { background: var(--cream); }

    /* ── Tags ─────────────────────────────────────── */
    .tags-section {
      margin-top: 44px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .tag {
      background: var(--gold-pale);
      color: var(--gold);
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    /* ── CTA Banner ──────────────────────────────────── */
    .cta-banner {
      background: var(--navy);
      border-radius: 12px;
      padding: 36px 32px;
      margin-top: 48px;
      text-align: center;
    }
    .cta-banner h2 {
      font-family: 'Playfair Display', Georgia, serif;
      color: #fff;
      font-size: 24px;
      margin-bottom: 10px;
    }
    .cta-banner p {
      color: rgba(255,255,255,0.6);
      font-size: 15px;
      margin-bottom: 22px;
      max-width: 480px;
      margin-left: auto;
      margin-right: auto;
      line-height: 1.6;
    }
    .cta-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: var(--gold-light);
      color: var(--white);
      padding: 13px 30px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 15px;
      transition: background 0.18s, transform 0.14s;
      box-shadow: 0 4px 16px rgba(37,99,235,0.3);
    }
    .cta-btn:hover { background: #1d56d0; transform: translateY(-2px); }

    /* ── Footer ───────────────────────────────────── */
    ${browseFooterCss()}

    /* ── Responsive ───────────────────────────────── */
    @media (max-width: 768px) {
      .nav { padding: 0 16px; height: 54px; }
      .nav__brand { font-size: 1.25rem; }
      .nav__links a { font-size: 12px; padding: 6px 8px; }
      .nav__signup, .nav__login { display: none !important; }
      .article-hero { padding: 36px 20px 32px; }
      .article-hero h1 { font-size: 1.5rem; }
      .article-subtitle { font-size: 14px; }
      .article-meta { flex-wrap: wrap; gap: 8px; font-size: 12px; }
      .stats-bar { grid-template-columns: repeat(2, 1fr); }
      .article-container { padding: 28px 16px 40px; }
      .article-content { font-size: 15px; }
      .article-content h2 { font-size: 22px; margin: 32px 0 14px; }
      .article-content h3 { font-size: 18px; }
    }
  </style>
</head>
<body>
  <nav class="nav">
    <a href="/" class="nav__brand">AEROSCOUT</a>
    <div class="nav__links">
      <a href="/jobs">Browse Jobs</a>
      <a href="/blog">Blog</a>
      <a href="/about.html">About</a>
      <a href="/pricing.html">Pricing</a>
      <a href="/login.html" class="nav__login">Login &rsaquo;</a>
      <a href="/signup.html" class="nav__signup">Sign Up For Free</a>
    </div>
  </nav>

  <div class="article-hero">
    <div class="article-hero__bg"></div>
    <div class="article-hero__overlay"></div>
    <div class="article-hero__inner">
      <span class="category-badge">${escapeHtml(categoryLabel)}</span>
      <h1>${escapeHtml(post.title)}</h1>
      ${post.subtitle ? `<p class="article-subtitle">${escapeHtml(post.subtitle)}</p>` : ''}
      <div class="article-meta">
        <span>${escapeHtml(post.author || 'AeroScout')}</span>
        <span class="meta-dot">&middot;</span>
        <span>${formatDate(post.published_at)}</span>
        <span class="meta-dot">&middot;</span>
        <span>${readingTime(post.content)}</span>
      </div>
    </div>
  </div>

  <div class="stats-bar">
    <div class="stats-bar__item">
      <div class="stats-bar__icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
      <div class="stats-bar__value">Report</div>
      <div class="stats-bar__label">${escapeHtml(categoryLabel)}</div>
    </div>
    <div class="stats-bar__item">
      <div class="stats-bar__icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></div>
      <div class="stats-bar__value">850</div>
      <div class="stats-bar__label">Airlines & Operators</div>
    </div>
    <div class="stats-bar__item">
      <div class="stats-bar__icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
      <div class="stats-bar__value">24hr</div>
      <div class="stats-bar__label">Data Refresh</div>
    </div>
    <div class="stats-bar__item">
      <div class="stats-bar__icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>
      <div class="stats-bar__value">Global</div>
      <div class="stats-bar__label">Coverage</div>
    </div>
  </div>

  <main class="article-container">
    <div class="article-content">
      ${post.content}
    </div>

    ${tags ? `<div class="tags-section">${tags}</div>` : ''}

    <div class="cta-banner">
      <h2>Find Your Next Aviation Role</h2>
      <p>Browse the largest pilot and cabin crew job database with real-time listings from 850+ airlines worldwide.</p>
      <a href="/jobs" class="cta-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Browse All Jobs
      </a>
    </div>
  </main>

  ${browseFooterHtml()}

  <script defer src="/_vercel/insights/script.js"></script>
</body>
</html>`;
}

function build404() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Post Not Found | AeroScout</title>
  <meta name="robots" content="noindex">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;600;800&family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Source Sans 3', sans-serif; background: #faf9f6; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; color: #1a2744; }
    h1 { font-family: 'Playfair Display', serif; font-size: 28px; margin-bottom: 8px; }
    p { color: #718096; margin-bottom: 24px; }
    a { display: inline-flex; align-items: center; gap: 8px; background: #3b82f6; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; transition: background 0.15s; box-shadow: 0 4px 16px rgba(37,99,235,0.3); }
    a:hover { background: #1d56d0; }
  </style>
</head>
<body>
  <h1>Post Not Found</h1>
  <p>This article may have been removed or is no longer available.</p>
  <a href="/blog">Back to Blog</a>
</body>
</html>`;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();

  const { slug } = req.query;
  if (!slug) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(404).send(build404());
  }

  try {
    const { data, error } = await getSupabase()
      .from('public_blog_posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      return res.status(404).send(build404());
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).send(buildPage(data));
  } catch (err) {
    console.error('blog-post error:', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(build404());
  }
};
