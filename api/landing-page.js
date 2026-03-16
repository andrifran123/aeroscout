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

  // Logo – matches Jobs.html
  const logoHtml = job.logo_url
    ? `<img src="${escapeHtml(job.logo_url)}" alt="${escapeHtml(job.airline)}" loading="${idx < 6 ? 'eager' : 'lazy'}" onerror="this.parentElement.textContent='${fl}'">`
    : `<span style="font-size:24px;font-weight:700;color:var(--navy);">${fl}</span>`;

  // Attributes – matches Jobs.html renderAttributes() exactly
  let attrs = '';
  if (isCabinCrew) {
    attrs += `<span class="attr-item"><b>Position:</b> <span class="attr-pill">${escapeHtml(job.position || 'Flight Attendant')}</span></span>`;
    if (job.location)       attrs += `<span class="attr-item"><b>Location:</b> <span class="attr-pill">${escapeHtml(job.location)}</span></span>`;
    if (job.contract_type)  attrs += `<span class="attr-pill">${escapeHtml(job.contract_type)}</span>`;
    if (job.visa_sponsor)   attrs += `<span class="attr-pill pill-green"><b>Visa Sponsor</b></span>`;
  } else {
    attrs += `<span class="attr-item"><b>Aircraft:</b> <span class="attr-pill">${escapeHtml(job.aircraft || 'N/A')}</span></span>`;
    attrs += `<span class="attr-item"><b>Location:</b> <span class="attr-pill">${escapeHtml(job.location || 'Not specified')}</span></span>`;
    if (job.type_rated)     attrs += `<span class="attr-pill">Type-rated</span>`;
    else                    attrs += `<span class="attr-pill pill-green">Non-type rated</span>`;
    if (job.visa_sponsor)   attrs += `<span class="attr-pill pill-green"><b>Visa sponsor</b></span>`;
    if (job.direct_entry)   attrs += `<span class="attr-pill"><b>Direct Entry</b></span>`;
  }

  // Stats row – matches Jobs.html renderStatsRow() exactly
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
  if (sal) statBoxes.push(`<div class="stat-box"><span class="stat-label">Salary${sal.isRange ? ' (range)' : ''}</span><span class="stat-value salary-val">${sal.formatted}</span></div>`);
  const statsHtml = statBoxes.length > 0 ? `<div class="stats-row">${statBoxes.join('')}</div>` : '';

  // Time ago badge
  const timeBadge = timeAgo(job.verified_at);
  const timeClass = timeAgoClass(job.verified_at);
  const timeBadgeHtml = timeBadge ? `<span class="time-ago ${timeClass}">${timeBadge}</span>` : '';

  return `
<a href="${jobUrl}" class="card${visaClass}" aria-label="${escapeHtml(job.title)} at ${escapeHtml(job.airline)}">
  <div class="company-logo">${logoHtml}</div>
  <div class="job-title-row">
    <h3 class="job-title">${escapeHtml(job.title)}</h3><span class="airline-badge">${escapeHtml(job.airline)}</span>
  </div>
  <div class="apply-col">
    <span class="view-details">View Details <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
  </div>
  <div class="attributes">${attrs}</div>
  ${statsHtml}
  ${timeBadgeHtml}
  <span class="view-details-mobile">View Details <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
</a>`;
}

// ── Browse Jobs footer ───────────────────────────────────────────────────────

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

// ── Schema.org ───────────────────────────────────────────────────────────────

function buildFaqSchema(faqs) {
  if (!faqs || !faqs.length) return null;
  return { '@context':'https://schema.org','@type':'FAQPage','mainEntity':faqs.map(f=>({'@type':'Question','name':f.q,'acceptedAnswer':{'@type':'Answer','text':f.a}})) };
}
function buildItemListSchema(jobs, isCabinCrew) {
  return { '@context':'https://schema.org','@type':'ItemList','itemListElement':jobs.slice(0,30).map((job,i)=>({'@type':'ListItem','position':i+1,'url':`https://www.aeroscout.net/jobs/${buildSlug(job)}${isCabinCrew?'?type=cabin_crew':''}`})) };
}

// ── Landing page HTML ────────────────────────────────────────────────────────

function buildLandingPage(pageData, jobs, relatedPages, totalJobCount) {
  const isCabinCrew = pageData.filter_table === 'verified_cabin_crew_jobs';
  const jobCount = totalJobCount || jobs.length;
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

  // Extract category word from h1 for the search card title (e.g. "Captain Pilot" from "Captain Pilot Jobs Worldwide")
  const h1Text = pageData.h1 || pageData.page_title || '';
  const categoryLabel = h1Text.replace(/jobs?/gi, '').replace(/worldwide|global/gi, '').trim() || (isCabinCrew ? 'Cabin Crew' : 'Pilot');

  // Intro text: split into paragraphs
  const introText = pageData.intro_text || '';
  const introParagraphs = introText
    ? introText.split(/\n\n+/).map(p => p.trim()).filter(Boolean).map(p => `<p>${p}</p>`).join('\n')
    : '';

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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;600;800&family=Playfair+Display:wght@600;700;800&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --navy: #1a2744;
      --navy-deep: #111c35;
      --gold: #2563EB;
      --gold-light: #3b82f6;
      --gold-pale: #EFF6FF;
      --cream: #faf9f6;
      --cream-dark: #f2efe8;
      --white: #ffffff;
      --text-dark: #1a2744;
      --text-mid: #4a5568;
      --text-light: #718096;
      --border: #e8e3d8;
      --border-light: #f0ece3;
      --green: #4caf50;
      --green-pale: #f0faf0;
      --shadow-sm: 0 1px 3px rgba(26,39,68,0.07), 0 1px 2px rgba(26,39,68,0.05);
      --shadow-md: 0 4px 12px rgba(26,39,68,0.1), 0 2px 4px rgba(26,39,68,0.06);
      --shadow-lg: 0 10px 28px rgba(26,39,68,0.13), 0 4px 8px rgba(26,39,68,0.06);
    }

    body {
      font-family: 'Source Sans 3', ui-sans-serif, system-ui, -apple-system, sans-serif;
      background: var(--cream);
      color: var(--text-dark);
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    a { text-decoration: none; color: inherit; }

    /* ── Nav ──────────────────────────────────────────────────────────────── */
    .nav {
      position: sticky;
      top: 0;
      z-index: 200;
      background: rgba(255, 255, 255, 0.82);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      height: 62px;
      padding: 0 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(26, 39, 68, 0.07);
      box-shadow: 0 1px 8px rgba(26, 39, 68, 0.04);
    }
    .nav__brand {
      font-family: 'Outfit', 'Inter', sans-serif;
      font-weight: 800;
      font-size: 1.5rem;
      color: var(--navy);
      letter-spacing: -0.5px;
      text-decoration: none;
      display: flex;
      align-items: center;
    }
    .nav__links {
      display: flex;
      gap: 2px;
      align-items: center;
    }
    .nav__links a {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-mid);
      padding: 8px 14px;
      border-radius: 6px;
      transition: color 0.15s, background 0.15s;
    }
    .nav__links a:hover { color: var(--navy); background: rgba(37, 99, 235, 0.06); }
    .nav__signup {
      border: 1.5px solid var(--gold) !important;
      background: var(--gold) !important;
      color: var(--white) !important;
      font-weight: 600 !important;
      border-radius: 7px !important;
      margin-left: 4px !important;
    }
    .nav__signup:hover { background: #1d56d0 !important; border-color: #1d56d0 !important; color: var(--white) !important; }
    .nav__login {
      border: 1.5px solid rgba(26, 39, 68, 0.15) !important;
      color: var(--navy) !important;
      font-weight: 600 !important;
      border-radius: 7px !important;
    }
    .nav__login:hover { border-color: var(--gold) !important; background: rgba(37, 99, 235, 0.06) !important; color: var(--gold) !important; }

    /* ── Hero ──────────────────────────────────────────────────────────────── */
    .hero {
      position: relative;
      min-height: 440px;
      display: flex;
      align-items: stretch;
      overflow: hidden;
    }
    .hero__bg {
      position: absolute;
      inset: 0;
      background-image: url('https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1600&q=80');
      background-size: cover;
      background-position: center right;
      z-index: 0;
    }
    .hero__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(100deg, rgba(17,28,53,0.96) 0%, rgba(26,39,68,0.90) 45%, rgba(26,39,68,0.4) 70%, transparent 100%);
      z-index: 1;
    }
    .hero__content {
      position: relative;
      z-index: 2;
      max-width: 1100px;
      width: 100%;
      margin: 0 auto;
      padding: 64px 40px;
      display: flex;
      align-items: center;
    }
    .hero__left {
      max-width: 520px;
    }
    .hero h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(1.9rem, 4vw, 3rem);
      font-weight: 700;
      color: var(--white);
      line-height: 1.18;
      letter-spacing: -0.01em;
      margin-bottom: 18px;
    }
    .hero__sub {
      font-size: 16px;
      font-weight: 400;
      color: rgba(255,255,255,0.72);
      line-height: 1.7;
      margin-bottom: 36px;
      max-width: 420px;
    }
    .hero__btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
      font-weight: 700;
      color: var(--white);
      background: var(--gold-light);
      padding: 13px 30px;
      border-radius: 8px;
      letter-spacing: 0.01em;
      transition: background 0.18s, transform 0.14s, box-shadow 0.18s;
      box-shadow: 0 4px 16px rgba(37,99,235,0.3);
    }
    .hero__btn:hover {
      background: #1d56d0;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(37,99,235,0.35);
    }
    .hero__btn svg { flex-shrink: 0; }

    /* ── Stats bar ─────────────────────────────────────────────────────────── */
    .stats-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      background: linear-gradient(90deg, var(--gold-light) 0%, var(--gold) 100%);
    }
    .stats-bar__item {
      padding: 16px 20px;
      text-align: center;
      border-right: 1px solid rgba(255,255,255,0.2);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
    }
    .stats-bar__item:last-child { border-right: none; }
    .stats-bar__value {
      font-size: 22px;
      font-weight: 700;
      color: var(--white);
      line-height: 1;
      letter-spacing: -0.02em;
    }
    .stats-bar__label {
      font-size: 10px;
      font-weight: 700;
      color: rgba(255,255,255,0.82);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .stats-bar__icon {
      margin-bottom: 2px;
      color: rgba(255,255,255,0.85);
    }

    /* ── Two-column content section ───────────────────────────── */
    .content-section {
      max-width: 1100px;
      margin: 0 auto;
      padding: 64px 40px;
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 56px;
      align-items: start;
    }
    .map-col {
      position: sticky;
      top: 24px;
    }

    /* Left: intro text */
    .intro-col__heading {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(1.5rem, 3vw, 2.1rem);
      font-weight: 700;
      color: var(--navy);
      line-height: 1.25;
      margin-bottom: 22px;
    }
    .intro-col__body {
      font-size: 15.5px;
      line-height: 1.8;
      color: var(--text-mid);
      margin-bottom: 28px;
    }
    .intro-col__body p { margin-bottom: 14px; }
    .intro-col__body p:last-child { margin-bottom: 0; }
    .intro-checklist {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .intro-checklist li {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      font-size: 15px;
      color: var(--text-dark);
      font-weight: 500;
      line-height: 1.5;
    }
    .check-icon {
      width: 20px;
      height: 20px;
      background: var(--green-pale);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
      color: var(--green);
    }

    /* Job map */
    .job-map {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
      box-shadow: var(--shadow-md);
    }
    .job-map img {
      width: 100%;
      height: auto;
      display: block;
    }

    /* ── Jobs section ─────────────────────────────────────────────────────── */
    .jobs-section {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 40px 64px;
    }
    .section-heading {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(1.4rem, 2.5vw, 1.85rem);
      font-weight: 700;
      color: var(--navy);
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .section-heading__line { flex: 1; height: 1px; background: var(--border); }
    .section-heading__count {
      font-family: 'Source Sans 3', sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-light);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      white-space: nowrap;
    }

    /* ── Cards – matches Jobs.html grid layout exactly ──────────────────── */
    .cards-list { display: grid; gap: 8px; min-width: 0; }

    .card {
      background: var(--white);
      border-radius: 14px;
      border: 1px solid var(--border);
      padding: 16px 20px;
      display: grid;
      grid-template-columns: 100px minmax(0, 1fr) 150px;
      grid-template-rows: auto auto auto;
      gap: 6px 14px;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      color: inherit;
    }
    .card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--gold);
    }
    .card.visa-sponsor {
      background: #f1f8e9;
      border-color: #a5d6a7;
    }

    /* Logo – grid-row spans rows 1 and 2, matches Jobs.html */
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
      color: var(--navy);
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
      color: var(--navy);
      line-height: 1.3;
    }
    .airline-badge {
      margin-left: 12px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-mid);
      letter-spacing: 0.3px;
      background: rgba(71,85,105,0.06);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid rgba(71,85,105,0.15);
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* Apply/View column – matches Jobs.html apply-container position */
    .apply-col {
      grid-column: 3;
      grid-row: 1 / span 2;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
    .view-details {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      font-weight: 600;
      color: var(--navy);
      white-space: nowrap;
      transition: color 0.15s;
    }
    .card:hover .view-details { color: var(--gold); }

    /* Mobile-only View Details link – hidden on desktop, shown at 600px */
    .view-details-mobile {
      display: none;
    }

    /* Attributes row – matches Jobs.html */
    .attributes {
      grid-column: 2;
      grid-row: 2;
      display: flex;
      gap: 10px;
      color: var(--text-light);
      font-size: 12px;
      flex-wrap: wrap;
      align-items: center;
    }
    .attr-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: var(--text-mid);
    }
    .attr-item b {
      font-weight: 600;
      color: var(--text-mid);
    }
    .attr-pill {
      background: #e3f2fd;
      color: #1565c0;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    .attr-pill.pill-green {
      background: white;
      color: #2e7d32;
      border: 1.5px solid #4caf50;
    }

    /* Stats row – matches Jobs.html exactly */
    .stats-row {
      grid-column: 2;
      grid-row: 3;
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
      margin-top: 4px;
      padding-top: 8px;
      border-top: 1px dashed var(--border);
    }
    .stat-box { display: flex; flex-direction: column; }
    .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--text-light);
      font-weight: 700;
    }
    .stat-value {
      font-size: 15px;
      font-weight: 700;
      color: var(--navy);
    }
    .salary-val { color: #22c55e; }

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
    .time-ago.recent { color: #2e7d32; background: #e8f5e9; }
    .time-ago.older  { color: #1565c0; background: #e3f2fd; }

    /* ── Browse all button ────────────────────────────────────────────────── */
    .browse-all-wrap {
      text-align: center;
      margin-top: 28px;
    }
    .browse-all-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 700;
      color: var(--navy);
      background: transparent;
      border: 2px solid var(--gold);
      padding: 12px 30px;
      border-radius: 8px;
      letter-spacing: 0.01em;
      transition: background 0.15s, color 0.15s, transform 0.12s;
    }
    .browse-all-btn:hover {
      background: var(--gold);
      color: var(--white);
      transform: translateY(-1px);
    }

    /* ── Empty state ──────────────────────────────────────────────────────── */
    .empty {
      text-align: center;
      padding: 60px 24px;
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 14px;
    }
    .empty p { color: var(--text-mid); font-size: 15px; margin-bottom: 8px; }
    .empty a { color: var(--gold); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }

    /* ── Bottom sections wrapper ──────────────────────────────────────────── */
    .bottom-section {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 40px 64px;
    }

    /* ── FAQ ──────────────────────────────────────────────────────────────── */
    .faq { margin-bottom: 52px; }
    .faq__heading {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.55rem;
      font-weight: 700;
      color: var(--navy);
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .faq__heading-line { flex: 1; height: 1px; background: var(--border); }

    .faq-item {
      border-bottom: 1px solid var(--border);
      background: var(--white);
    }
    .faq-item:first-of-type {
      border-top: 1px solid var(--border);
      border-radius: 12px 12px 0 0;
    }
    .faq-item:last-of-type { border-radius: 0 0 12px 12px; }
    .faq-trigger {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 17px 22px;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
    }
    .faq-trigger h3 {
      font-size: 15px;
      font-weight: 600;
      color: var(--navy);
      line-height: 1.4;
      transition: color 0.15s;
      font-family: 'Source Sans 3', sans-serif;
    }
    .faq-trigger:hover h3 { color: var(--gold); }
    .faq-chevron {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--gold);
      transition: transform 0.25s ease;
    }
    .faq-item.open .faq-chevron { transform: rotate(180deg); }
    .faq-answer {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.28s ease;
    }
    .faq-item.open .faq-answer { grid-template-rows: 1fr; }
    .faq-answer-inner { overflow: hidden; }
    .faq-answer-inner p {
      font-size: 14.5px;
      color: var(--text-mid);
      line-height: 1.78;
      padding: 0 22px 20px;
    }

    /* ── Related pages ────────────────────────────────────────────────────── */
    .related { margin-bottom: 52px; }
    .related__label {
      font-size: 10px;
      font-weight: 700;
      color: var(--text-light);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin-bottom: 14px;
    }
    .related__grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .related__link {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-mid);
      padding: 8px 16px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--white);
      transition: color 0.15s, border-color 0.15s, background 0.15s;
    }
    .related__link:hover {
      color: var(--navy);
      border-color: var(--gold);
      background: var(--gold-pale);
    }

    /* ── CTA banner ───────────────────────────────────────────────────────── */
    .cta {
      background: var(--navy);
      border-radius: 14px;
      padding: 52px 48px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .cta::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 1px);
      background-size: 24px 24px;
      pointer-events: none;
    }
    .cta::after {
      content: '';
      position: absolute;
      bottom: -40px;
      right: -40px;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(37,99,235,0.15), transparent 70%);
      pointer-events: none;
    }
    .cta__inner { position: relative; z-index: 1; }
    .cta__tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--gold-light);
      margin-bottom: 14px;
    }
    .cta h2 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(1.4rem, 3vw, 2rem);
      font-weight: 700;
      color: var(--white);
      margin-bottom: 12px;
    }
    .cta p {
      font-size: 15px;
      color: rgba(255,255,255,0.58);
      line-height: 1.65;
      max-width: 420px;
      margin: 0 auto 30px;
    }
    .cta__actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .cta__primary {
      font-size: 14px;
      font-weight: 700;
      color: var(--white);
      background: var(--gold-light);
      padding: 13px 32px;
      border-radius: 8px;
      letter-spacing: 0.01em;
      transition: background 0.15s, transform 0.12s;
    }
    .cta__primary:hover { background: #1d56d0; transform: translateY(-1px); }
    .cta__secondary {
      font-size: 14px;
      font-weight: 600;
      color: rgba(255,255,255,0.65);
      border: 1.5px solid rgba(255,255,255,0.2);
      padding: 12px 26px;
      border-radius: 8px;
      transition: color 0.15s, border-color 0.15s;
    }
    .cta__secondary:hover { color: var(--white); border-color: rgba(255,255,255,0.45); }

    /* ── Footer ───────────────────────────────────────────────────────────── */
    ${browseFooterCss()}

    /* ── Responsive: Tablet landscape (1024px) ──────────────────────────── */
    @media (max-width: 1024px) {
      .content-section { padding: 48px 32px; grid-template-columns: 1fr; gap: 32px; }
      .map-col { position: static; max-width: 500px; }
      .card { grid-template-columns: 90px minmax(0, 1fr) 130px; }
      .company-logo { width: 90px; height: 90px; }
    }

    /* ── Responsive: Tablet portrait / iPad (768px) ──────────────────────── */
    @media (max-width: 768px) {
      .nav { padding: 0 20px; height: 56px; }
      .nav__links a:not(.nav__signup):not(.nav__login) { display: none; }
      .hero__content { padding: 48px 24px; }
      .hero { min-height: 340px; }
      .hero__overlay {
        background: linear-gradient(180deg, rgba(17,28,53,0.93) 0%, rgba(26,39,68,0.82) 50%, rgba(26,39,68,0.55) 100%);
      }
      .stats-bar { grid-template-columns: repeat(2, 1fr); }
      .stats-bar__item:nth-child(2) { border-right: none; }
      .stats-bar__item:nth-child(3) { border-top: 1px solid rgba(255,255,255,0.2); }
      .stats-bar__item:nth-child(4) { border-top: 1px solid rgba(255,255,255,0.2); border-right: none; }
      .content-section { padding: 36px 20px; }
      .jobs-section { padding: 0 20px 44px; }
      .bottom-section { padding: 0 20px 44px; }
      .card {
        grid-template-columns: 80px minmax(0, 1fr) 110px;
        padding: 14px 16px;
        gap: 5px 12px;
      }
      .company-logo { width: 80px; height: 80px; font-size: 20px; }
      .job-title { font-size: 15px; }
      .cta { padding: 36px 24px; }
    }

    /* ── Responsive: Large mobile (600px) ─────────────────────────────────── */
    /* Matches Jobs.html 768px: switches from grid to block + float layout */
    @media (max-width: 600px) {
      .nav__signup { font-size: 12px !important; padding: 6px 10px !important; }
      .nav__login { font-size: 12px !important; padding: 6px 10px !important; }
      .hero h1 { font-size: 1.7rem; }
      .hero__sub { font-size: 14.5px; max-width: 320px; }
      .hero__btn { padding: 11px 22px; font-size: 14px; }
      .stats-bar__value { font-size: 19px; }
      .intro-col__heading { font-size: 1.4rem; }

      /* Card: switch to block layout like Jobs.html mobile */
      .card {
        display: block;
        position: relative;
        padding: 14px;
        overflow: hidden;
      }
      .company-logo {
        width: 70px;
        height: 70px;
        font-size: 18px;
        float: left;
        margin-right: 12px;
        margin-bottom: 10px;
      }
      .job-title-row {
        display: block;
        min-width: 0;
        padding-right: 0;
      }
      .job-title { font-size: 14px; line-height: 1.3; margin-bottom: 2px; }
      .airline-badge {
        display: block;
        margin-left: 0;
        margin-top: 4px;
        margin-bottom: 6px;
        font-size: 12px;
        background: none;
        border: none;
        padding: 0;
        color: var(--text-light);
      }
      /* Hide desktop View Details, show mobile version at bottom */
      .apply-col { display: none; }
      .view-details-mobile {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-top: 12px;
        padding: 8px 0;
        font-size: 13px;
        font-weight: 700;
        color: var(--navy);
        background: var(--cream);
        border: 1.5px solid var(--border);
        border-radius: 7px;
        clear: both;
      }
      .attributes {
        clear: both;
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        font-size: 11px;
        margin-top: 10px;
      }
      .attr-item { font-size: 11px; }
      .attr-item b { display: none; }
      .attr-pill { font-size: 10px; padding: 3px 7px; border-radius: 4px; }
      .stats-row {
        display: flex;
        gap: 16px;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid var(--border);
      }
      .stat-label { font-size: 9px; }
      .stat-value { font-size: 13px; }
      .time-ago {
        display: inline-block;
        margin-top: 8px;
      }
      .faq-trigger { padding: 14px 16px; }
      .faq-trigger h3 { font-size: 14px; }
      .faq-answer-inner p { padding: 0 16px 16px; font-size: 13.5px; }
      .cta { padding: 32px 20px; border-radius: 10px; }
      .cta h2 { font-size: 1.3rem; }
      .related__grid { gap: 6px; }
      .related__link { font-size: 12px; padding: 6px 12px; }
    }

    /* ── Responsive: Small mobile (480px) ──────────────────────────────────── */
    @media (max-width: 480px) {
      .card { padding: 12px; }
      .company-logo {
        width: 60px;
        height: 60px;
        font-size: 16px;
        margin-right: 10px;
      }
      .job-title { font-size: 13px; }
      .attr-pill { font-size: 9px; padding: 2px 6px; }
      .stat-value { font-size: 12px; }
    }

    /* ── Responsive: Extra small mobile (380px) ────────────────────────────── */
    @media (max-width: 380px) {
      .nav { padding: 0 12px; }
      .nav__brand { font-size: 1.1rem; }
      .nav__signup { display: none !important; }
      .hero { min-height: 300px; }
      .hero__content { padding: 36px 14px; }
      .hero h1 { font-size: 1.35rem; }
      .hero__sub { font-size: 13px; margin-bottom: 24px; }
      .hero__btn { padding: 10px 18px; font-size: 13px; }
      .stats-bar__value { font-size: 17px; }
      .stats-bar__label { font-size: 9px; }
      .stats-bar__item { padding: 12px 10px; }
      .content-section { padding: 28px 12px; }
      .jobs-section { padding: 0 12px 36px; }
      .bottom-section { padding: 0 12px 36px; }
      .intro-col__heading { font-size: 1.2rem; }
      .intro-col__body { font-size: 14px; }
      .intro-checklist li { font-size: 13.5px; gap: 8px; }
      .section-heading { font-size: 1.15rem; }
      .card { padding: 10px; }
      .company-logo {
        width: 55px;
        height: 55px;
        font-size: 14px;
        margin-right: 8px;
      }
      .job-title { font-size: 12px; }
      .airline-badge { font-size: 10px; }
      .attr-pill { font-size: 9px; padding: 2px 5px; }
      .attr-item { font-size: 10px; }
      .stats-row { gap: 12px; padding-top: 8px; }
      .stat-label { font-size: 8px; }
      .stat-value { font-size: 11px; }
      .browse-all-btn { font-size: 13px; padding: 10px 22px; }
      .cta__primary { padding: 11px 24px; font-size: 13px; }
      .cta__secondary { padding: 10px 20px; font-size: 13px; }
    }
  </style>
</head>
<body>

  <!-- ── Nav ── -->
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

  <!-- ── Hero ── -->
  <section class="hero">
    <div class="hero__bg"></div>
    <div class="hero__overlay"></div>
    <div class="hero__content">
      <div class="hero__left">
        <h1>${escapeHtml(pageData.h1 || pageData.page_title)}</h1>
        <p class="hero__sub">Updated daily from 850+ airlines and operators worldwide. Find your next ${isCabinCrew ? 'cabin crew' : 'cockpit'} role in minutes.</p>
        <a href="/jobs" class="hero__btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          Browse ${jobCount} Jobs
        </a>
      </div>
    </div>
  </section>

  <!-- ── Stats bar ── -->
  <div class="stats-bar">
    <div class="stats-bar__item">
      <div class="stats-bar__icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
      </div>
      <div class="stats-bar__value">${jobCount}</div>
      <div class="stats-bar__label">Open Positions</div>
    </div>
    <div class="stats-bar__item">
      <div class="stats-bar__icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </div>
      <div class="stats-bar__value">850</div>
      <div class="stats-bar__label">Airlines &amp; Operators</div>
    </div>
    <div class="stats-bar__item">
      <div class="stats-bar__icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <div class="stats-bar__value">24hr</div>
      <div class="stats-bar__label">Update Cycle</div>
    </div>
    <div class="stats-bar__item">
      <div class="stats-bar__icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      </div>
      <div class="stats-bar__value">Global</div>
      <div class="stats-bar__label">${visaCount > 0 ? `${visaCount} Visa Sponsored` : 'Worldwide Opportunities'}</div>
    </div>
  </div>

  <!-- ── Two-column content ── -->
  <section class="content-section">
    <!-- Left column: intro text -->
    <div class="intro-col">
      <h2 class="intro-col__heading">Elevate Your Career to New Heights.</h2>
      ${introParagraphs
        ? `<div class="intro-col__body">${introParagraphs}</div>`
        : `<div class="intro-col__body"><p>Discover the latest ${escapeHtml(categoryLabel)} positions from airlines and operators around the world. Our listings are verified and updated every 24 hours, giving you access to the most current opportunities available.</p></div>`
      }
      <ul class="intro-checklist">
        <li>
          <span class="check-icon">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          Active job postings from 850+ airlines worldwide
        </li>
        <li>
          <span class="check-icon">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          Visa sponsorship options for select roles
        </li>
        <li>
          <span class="check-icon">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          Detailed listings with pay, type rating requirements &amp; benefits
        </li>
      </ul>
    </div>

    <!-- Right column: map -->
    <div class="map-col">
      <div class="job-map">
        <img src="/images/job-locations-map.png" alt="AeroScout job locations worldwide" loading="lazy">
      </div>
    </div>

  </section>

  <!-- ── Job cards ── -->
  <section class="jobs-section">
    <h2 class="section-heading">
      Latest ${escapeHtml(pageData.h1 || 'Jobs')}
      <span class="section-heading__line"></span>
      <span class="section-heading__count">${jobCount} result${jobCount !== 1 ? 's' : ''}</span>
    </h2>

    <div class="cards-list">
      ${jobs.length > 0
        ? jobs.map((j, i) => renderJobCard(j, isCabinCrew, i)).join('\n')
        : `<div class="empty"><p>No positions currently available in this category.</p><p><a href="/jobs">Browse all jobs</a> or check back soon &mdash; we update daily.</p></div>`
      }
    </div>

    ${jobs.length > 0 && jobCount > jobs.length ? `
    <div class="browse-all-wrap">
      <a href="/jobs" class="browse-all-btn">
        View All ${jobCount} ${escapeHtml(pageData.h1 || 'Jobs')}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </a>
    </div>` : ''}
  </section>

  <!-- ── Bottom sections: FAQ, Related, CTA ── -->
  <div class="bottom-section">

    ${faqs.length > 0 ? `
    <section class="faq">
      <h2 class="faq__heading">
        Frequently Asked Questions
        <span class="faq__heading-line"></span>
      </h2>
      ${faqs.map((f, i) => `
      <div class="faq-item" id="faq-${i}">
        <button class="faq-trigger" onclick="toggleFaq(${i})" aria-expanded="false" aria-controls="faq-ans-${i}">
          <h3>${escapeHtml(f.q)}</h3>
          <span class="faq-chevron">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
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
        <a href="/jobs" class="related__link">Browse All Jobs</a>
      </div>
    </section>

    <div class="cta">
      <div class="cta__inner">
        <div class="cta__tag">Job Alerts &middot; Free to Use</div>
        <h2>Never Miss a ${isCabinCrew ? 'Cabin Crew' : 'Pilot'} Job Again</h2>
        <p>Get instant alerts for new positions matching your qualifications, aircraft type and location preferences.</p>
        <div class="cta__actions">
          <a href="/signup.html" class="cta__primary">Create Free Account</a>
          <a href="/jobs" class="cta__secondary">Browse All ${jobCount} ${escapeHtml(pageData.h1 || 'Jobs')}</a>
        </div>
      </div>
    </div>

  </div>

  ${browseFooterHtml()}

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
  <a href="/jobs">Browse All Jobs</a>
</body></html>`;
}

// ── Handler ──────────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();
  const { slug } = req.query;
  if (!slug) { res.setHeader('Content-Type','text/html; charset=utf-8'); return res.status(404).send(build404()); }

  try {
    const { data: pageData, error: pageError } = await getSupabase()
      .from('seo_landing_pages').select('*').eq('slug', slug).eq('is_active', true).single();
    if (pageError || !pageData) { res.setHeader('Content-Type','text/html; charset=utf-8'); return res.status(404).send(build404()); }

    const isCabinCrew = pageData.filter_table === 'verified_cabin_crew_jobs';
    const table = isCabinCrew ? 'public_verified_cabin_crew_jobs' : 'public_verified_jobs';
    // Helper: apply a filter using prefix match for location_bucket, exact match otherwise
    function applyFilter(q, col, val) {
      if (!col || !val || col === '_all') return q;
      if (val === 'true') return q.eq(col, true);
      if (val === 'false') return q.eq(col, false);
      if (col === 'location_bucket') return q.like(col, val + '%');
      return q.eq(col, val);
    }

    // Get total count for stats/SEO
    let countQuery = getSupabase().from(table).select('*', { count: 'exact', head: true });
    countQuery = applyFilter(countQuery, pageData.filter_column, pageData.filter_value);
    countQuery = applyFilter(countQuery, pageData.filter_column2, pageData.filter_value2);
    const { count: totalJobCount } = await countQuery;

    // Get preview jobs (20 most recent) for card display
    let query = getSupabase().from(table).select('*').order('verified_at', { ascending: false }).limit(20);
    query = applyFilter(query, pageData.filter_column, pageData.filter_value);
    query = applyFilter(query, pageData.filter_column2, pageData.filter_value2);

    const { data: jobs, error: jobsError } = await query;
    if (jobsError) throw jobsError;

    let relatedSlugs = [];
    try { relatedSlugs = typeof pageData.related_slugs === 'string' ? JSON.parse(pageData.related_slugs) : (pageData.related_slugs || []); } catch(e) { relatedSlugs=[]; }
    let relatedPages = [];
    if (relatedSlugs.length > 0) {
      const { data: rp } = await getSupabase().from('seo_landing_pages').select('slug, h1').in('slug', relatedSlugs).eq('is_active', true);
      relatedPages = rp || [];
    }

    const html = buildLandingPage(pageData, jobs || [], relatedPages, totalJobCount || 0);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);
  } catch (err) {
    console.error('landing-page error:', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(build404());
  }
};
