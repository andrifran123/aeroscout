const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://ziboktbmbyjbhifsdypa.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// ── Slug helper ──────────────────────────────────────────────────────────────

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
  const parts = [job.title, job.org].filter(Boolean).map(slugify).filter(Boolean);
  return parts.length > 0 ? `${parts.join('-')}-${job.id}` : String(job.id);
}

function extractIdFromSlug(slug) {
  // Extract trailing numeric ID: "pc-12-first-officer-private-air-5391" → 5391
  // Also handles plain numeric IDs: "5391" → 5391
  const match = String(slug).match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : NaN;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJsonLd(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/<\/script>/gi, '<\\/script>');
}

function stripHtml(html) {
  if (!html) return '';
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(str, maxLen = 160) {
  if (!str) return '';
  const clean = stripHtml(str);
  if (clean.length <= maxLen) return clean;
  return clean.substring(0, maxLen - 3) + '...';
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

// ── Data mapping (matches Jobs.html client-side mapping) ─────────────────────

function mapPilotJob(row) {
  return {
    id: row.id,
    title: row.title || '',
    org: row.airline || 'Unknown Airline',
    location: row.location || '',
    aircraft: row.aircraft || '',
    rank: row.rank || '',
    chips: [row.aircraft, row.rank].filter(Boolean),
    visa: row.visa_sponsor || false,
    direct: row.direct_entry || false,
    type: row.type_rated ? 'typed' : 'standard',
    typeRated: row.type_rated || false,
    flightTime: row.total_hours || 0,
    pic: row.pic_hours || 0,
    jetTime: row.jet_time || 0,
    multiEngine: row.multi_engine_time || 0,
    salary: row.salary_usd || 0,
    roster: row.roster || '',
    logo: row.logo_url || '',
    applyUrl: row.url || '#',
    description: row.description_summary || '',
    requirements: row.requirements || '',
    jobType: 'pilot',
    verifiedAt: row.verified_at || '',
  };
}

function mapCabinCrewJob(row) {
  return {
    id: row.id,
    title: row.title || '',
    org: row.airline || 'Unknown Airline',
    location: row.location || '',
    position: row.position || 'Flight Attendant',
    contractType: row.contract_type || '',
    visa: row.visa_sponsor || false,
    experienceYears: row.experience_years || 0,
    languageRequirements: row.language_requirements || '',
    salary: row.salary_usd || 0,
    logo: row.logo_url || '',
    applyUrl: row.url || '#',
    description: row.description_summary || '',
    requirements: row.requirements || '',
    minHeightCm: row.min_height_cm || null,
    armReachCm: row.arm_reach_cm || null,
    swimmingAbility: row.swimming_ability || false,
    minAge: row.min_age || null,
    benefits: row.benefits || [],
    jobType: 'cabin_crew',
    verifiedAt: row.verified_at || '',
  };
}

// ── HTML renderers (server-side equivalents of Jobs.html functions) ──────────

function renderAttributes(j) {
  if (j.jobType === 'cabin_crew') {
    let html = '';
    html += `<span class="attr-item"><b>Position:</b> <span class="attr-pill">${escapeHtml(j.position || 'Flight Attendant')}</span></span>`;
    html += `<span class="attr-item"><b>Location:</b> <span class="attr-pill">${escapeHtml(j.location || 'Not specified')}</span></span>`;
    if (j.contractType) html += `<span class="attr-pill">${escapeHtml(j.contractType)}</span>`;
    if (j.visa) html += '<span class="attr-pill green"><b>Visa Sponsor</b></span>';
    if (j.swimmingAbility) html += '<span class="attr-pill" style="background:#e0f2fe;color:#0369a1;">Swimming Required</span>';
    return html;
  } else {
    let html = '';
    html += `<span class="attr-item"><b>Aircraft:</b> <span class="attr-pill">${escapeHtml(j.chips[0] || 'N/A')}</span></span>`;
    html += `<span class="attr-item"><b>Location:</b> <span class="attr-pill">${escapeHtml(j.location || 'Not specified')}</span></span>`;
    html += j.type === 'typed'
      ? '<span class="attr-pill">Type-rated</span>'
      : '<span class="attr-pill green">Non-type rated</span>';
    if (j.visa) html += '<span class="attr-pill green"><b>Visa sponsor</b></span>';
    if (j.direct) html += '<span class="attr-pill" style="background:#e3f2fd;color:#1565c0;"><b>Direct Entry</b></span>';
    return html;
  }
}

function renderStatsRow(j) {
  if (j.jobType === 'cabin_crew') {
    let stats = '';
    if (j.minHeightCm) {
      stats += `<div class="stat-box"><span class="stat-label">Min Height</span><span class="stat-value">${j.minHeightCm} cm</span></div>`;
    }
    if (j.minAge) {
      stats += `<div class="stat-box"><span class="stat-label">Min Age</span><span class="stat-value">${j.minAge}+ years</span></div>`;
    }
    if (j.experienceYears > 0) {
      stats += `<div class="stat-box"><span class="stat-label">Experience</span><span class="stat-value">${j.experienceYears} ${j.experienceYears === 1 ? 'year' : 'years'}</span></div>`;
    }
    let languages = [];
    if (j.languageRequirements) {
      try {
        languages = typeof j.languageRequirements === 'string' ? JSON.parse(j.languageRequirements) : j.languageRequirements;
      } catch (e) {
        languages = [j.languageRequirements];
      }
    }
    if (languages && languages.length > 0 && languages[0] !== 'None') {
      stats += `<div class="stat-box"><span class="stat-label">Languages</span><span class="stat-value">${escapeHtml(Array.isArray(languages) ? languages.join(', ') : languages)}</span></div>`;
    }
    if (j.contractType) {
      stats += `<div class="stat-box"><span class="stat-label">Contract</span><span class="stat-value">${escapeHtml(j.contractType)}</span></div>`;
    }
    const salaryInfo = formatSalary(j.salary);
    if (salaryInfo) {
      stats += `<div class="stat-box"><span class="stat-label">Salary${salaryInfo.isRange ? ' (range)' : ''}</span><span class="stat-value" style="color: #22c55e;">${salaryInfo.formatted}</span></div>`;
    }
    return stats || '<div class="stat-box"><span class="stat-label">Details</span><span class="stat-value">See description</span></div>';
  } else {
    let stats = '';
    stats += `<div class="stat-box"><span class="stat-label">Total Time</span><span class="stat-value">${formatNumber(j.flightTime)} hrs</span></div>`;
    stats += `<div class="stat-box"><span class="stat-label">PIC Time</span><span class="stat-value">${formatNumber(j.pic)} hrs</span></div>`;
    if (j.jetTime) {
      stats += `<div class="stat-box"><span class="stat-label">Jet Time</span><span class="stat-value">${formatNumber(j.jetTime)} hrs</span></div>`;
    }
    if (j.multiEngine) {
      stats += `<div class="stat-box"><span class="stat-label">Multi-Engine</span><span class="stat-value">${formatNumber(j.multiEngine)} hrs</span></div>`;
    }
    if (j.roster) {
      stats += `<div class="stat-box"><span class="stat-label">Roster</span><span class="stat-value">${escapeHtml(j.roster)}</span></div>`;
    }
    const salaryInfo = formatSalary(j.salary);
    if (salaryInfo) {
      stats += `<div class="stat-box"><span class="stat-label">Salary${salaryInfo.isRange ? ' (range)' : ''}</span><span class="stat-value" style="color: #22c55e;">${salaryInfo.formatted}</span></div>`;
    }
    return stats;
  }
}

function renderRequirements(requirementsJson) {
  if (!requirementsJson) return '';
  try {
    let requirements = requirementsJson;
    if (typeof requirementsJson === 'string') {
      requirements = JSON.parse(requirementsJson);
    }
    if (!Array.isArray(requirements) || requirements.length === 0) return '';
    const items = requirements.map(req => `<li>${escapeHtml(req)}</li>`).join('');
    return `<ul class="requirements-list">${items}</ul>`;
  } catch (e) {
    return '';
  }
}

// ── JSON-LD schema (server-rendered, identical to injectSingleJobSchema) ─────

function buildJobPostingSchema(j, canonicalUrl) {
  const posting = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    'title': j.title,
    'description': stripHtml(j.description) || j.title,
    'url': canonicalUrl,
    'directApply': true,
    'hiringOrganization': {
      '@type': 'Organization',
      'name': j.org,
    },
  };

  if (j.verifiedAt) {
    posting.datePosted = j.verifiedAt.split('T')[0];
  }

  if (j.logo) {
    posting.hiringOrganization.logo = j.logo;
  }

  if (j.location) {
    posting.jobLocation = {
      '@type': 'Place',
      'address': j.location,
    };
  }

  const salaryNum = typeof j.salary === 'string' && j.salary.includes('-')
    ? null
    : parseInt(j.salary, 10);

  if (salaryNum && salaryNum > 0) {
    posting.baseSalary = {
      '@type': 'MonetaryAmount',
      'currency': 'USD',
      'value': {
        '@type': 'QuantitativeValue',
        'value': salaryNum,
        'unitText': 'YEAR',
      },
    };
  }

  if (j.applyUrl && j.applyUrl !== '#') {
    posting.applicationContact = {
      '@type': 'ContactPoint',
      'url': j.applyUrl,
    };
  }

  if (j.rank) posting.occupationalCategory = j.rank;
  if (j.aircraft) posting.skills = j.aircraft;

  return posting;
}

// ── Build the full HTML page ─────────────────────────────────────────────────

function buildPage(j, jobType) {
  const isCabinCrew = jobType === 'cabin_crew';
  const slug = buildSlug(j);
  const canonicalUrl = isCabinCrew
    ? `https://www.aeroscout.net/jobs/${slug}?type=cabin_crew`
    : `https://www.aeroscout.net/jobs/${slug}`;

  // Build page title: "A320 Captain at Emirates - Dubai | AeroScout"
  const titleParts = [j.title];
  if (j.org && j.org !== 'Unknown Airline') titleParts.push(`at ${j.org}`);
  if (j.location) titleParts.push(`- ${j.location}`);
  const pageTitle = escapeHtml(titleParts.join(' ') + ' | AeroScout');

  // Meta description
  const metaDesc = escapeHtml(truncate(
    j.description || `${j.title} position at ${j.org}${j.location ? ' in ' + j.location : ''}. Apply now on AeroScout.`,
    160
  ));

  // OG image: dynamic branded card via /api/og
  const ogParams = new URLSearchParams();
  ogParams.set('title', j.title || 'Aviation Job');
  if (j.org) ogParams.set('airline', j.org);
  if (j.location) ogParams.set('location', j.location);
  if (j.logo) ogParams.set('logo', j.logo);
  const ogImage = `https://www.aeroscout.net/api/og?${ogParams.toString()}`;

  // JSON-LD
  const schema = buildJobPostingSchema(j, canonicalUrl);
  const schemaJson = JSON.stringify(schema, null, 2);

  // Job card HTML
  const visaClass = j.visa ? ' visa-sponsor' : '';
  const logoHtml = j.logo
    ? `<img src="${escapeHtml(j.logo)}" alt="${escapeHtml(j.org)}" onerror="this.parentElement.textContent='${iconLetter(j.org)}'">`
    : iconLetter(j.org);

  const descriptionHtml = j.description
    ? `<div class="job-description-content">${j.description}</div>`
    : '<div class="job-description-content"></div>';

  const requirementsHtml = j.requirements
    ? `<div class="requirements-title">Requirements</div>${renderRequirements(j.requirements)}`
    : '';

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
  <title>${pageTitle}</title>
  <meta name="description" content="${metaDesc}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- Open Graph -->
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${metaDesc}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="AeroScout">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${pageTitle}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
  <meta name="twitter:description" content="${metaDesc}">

  <!-- JSON-LD JobPosting Schema (server-rendered) -->
  <script type="application/ld+json">
${schemaJson}
  </script>

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

    /* ── Main content ──────────────────────────────────── */
    .container {
      max-width: 900px;
      margin: 24px auto;
      padding: 0 16px;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #64748b;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 16px;
      transition: color 0.15s;
    }
    .back-link:hover { color: #1e293b; }

    /* ── Job Card (matching Jobs.html styles exactly) ─── */
    .card {
      background: white;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      padding: 16px 20px;
      display: grid;
      grid-template-columns: 100px 1fr 150px;
      grid-template-rows: auto auto auto;
      gap: 6px 14px;
      box-shadow: 0 2px 4px -1px rgba(0,0,0,0.08);
    }
    .card.visa-sponsor {
      background: #f1f8e9;
      border-color: #a5d6a7;
    }
    .company-logo {
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
    h1.job-title {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
      color: #1e293b;
      align-self: center;
      line-height: 1.4;
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
    }
    .attributes {
      display: flex;
      gap: 10px;
      color: #64748b;
      font-size: 12px;
      flex-wrap: wrap;
      align-items: center;
    }
    .attr-item b { color: #334155; }
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
    .apply-container {
      text-align: right;
      grid-column: 3;
      grid-row: 1;
      align-self: center;
    }
    .apply-btn {
      background: #0b2a6f;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 13px;
      display: inline-block;
      transition: background 0.15s ease;
    }
    .apply-btn:hover { background: #081a45; }
    .stats-row {
      grid-column: 2;
      display: flex;
      gap: 24px;
      margin-top: 4px;
      padding-top: 8px;
      border-top: 1px dashed #e2e8f0;
    }
    .stat-box { display: flex; flex-direction: column; }
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
    .job-description {
      grid-column: 1 / -1;
      background: #f8fafc;
      border-radius: 10px;
      margin-top: 12px;
      padding: 16px 20px;
      border: 1px solid #e2e8f0;
    }
    .job-description-content {
      font-size: 14px;
      line-height: 1.6;
      color: #000000;
    }
    .job-description-content:empty::before {
      content: "No description available for this position.";
      color: #94a3b8;
      font-style: italic;
    }
    .requirements-list {
      list-style: none;
      padding: 0;
      margin: 8px 0 0 0;
    }
    .requirements-list li {
      position: relative;
      padding-left: 16px;
      margin-bottom: 6px;
      font-size: 13px;
      line-height: 1.5;
      color: #1e293b;
    }
    .requirements-list li::before {
      content: "\\2022";
      position: absolute;
      left: 0;
      color: #0b2a6f;
      font-weight: bold;
    }
    .requirements-title {
      font-weight: 600;
      color: #475569;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 12px;
      margin-bottom: 4px;
    }

    /* ── CTA Banner ────────────────────────────────────── */
    .cta-banner {
      background: #0b1426;
      border-radius: 12px;
      padding: 24px 28px;
      margin-top: 20px;
      text-align: center;
    }
    .cta-banner h2 {
      font-family: 'Outfit', sans-serif;
      color: #fff;
      font-size: 18px;
      margin-bottom: 8px;
    }
    .cta-banner p {
      color: rgba(255,255,255,0.7);
      font-size: 13px;
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

    /* ── Footer ────────────────────────────────────────── */
    .footer {
      text-align: center;
      padding: 24px;
      color: #94a3b8;
      font-size: 12px;
    }
    .footer a { color: #64748b; }
    .footer a:hover { color: #1e293b; }

    /* ── Responsive ────────────────────────────────────── */
    @media (min-width: 1441px) {
      .card { grid-template-columns: 110px 1fr 160px; padding: 18px 22px; }
      .company-logo { width: 110px; height: 110px; font-size: 26px; }
      h1.job-title { font-size: 19px; }
      .apply-btn { padding: 10px 18px; font-size: 14px; }
      .stats-row { gap: 28px; }
    }
    @media (max-width: 1024px) {
      .card { grid-template-columns: 90px 1fr 140px; padding: 14px 16px; gap: 5px 12px; }
      .company-logo { width: 90px; height: 90px; font-size: 22px; }
      h1.job-title { font-size: 16px; }
      .apply-btn { padding: 7px 14px; font-size: 12px; }
      .attributes { font-size: 11px; gap: 8px; }
      .stats-row { gap: 20px; }
    }
    @media (max-width: 768px) {
      .container { margin: 12px auto; padding: 0 12px; }
      .card {
        display: block;
        position: relative;
        padding: 14px;
        padding-top: 16px;
        border-radius: 10px;
      }
      .company-logo {
        width: 70px;
        height: 70px;
        font-size: 18px;
        float: left;
        margin-right: 12px;
        margin-bottom: 10px;
      }
      h1.job-title {
        font-size: 15px;
        line-height: 1.3;
        margin-bottom: 2px;
        padding-right: 80px;
      }
      .airline-name {
        display: block;
        margin-left: 0;
        margin-top: 4px;
        margin-bottom: 6px;
        font-size: 12px;
        background: none;
        border: none;
        padding: 0;
        color: #64748b;
      }
      .apply-container {
        position: absolute;
        top: 14px;
        right: 10px;
        text-align: right;
        margin: 0;
      }
      .apply-btn { padding: 6px 10px; font-size: 10px; border-radius: 5px; }
      .attributes {
        clear: both;
        flex-wrap: wrap;
        gap: 5px;
        font-size: 11px;
        margin-top: 10px;
      }
      .attr-item b { display: none; }
      .attr-pill { font-size: 10px; padding: 3px 7px; border-radius: 4px; }
      .stats-row {
        display: flex;
        gap: 16px;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #eee;
      }
      .stat-label { font-size: 9px; }
      .stat-value { font-size: 13px; }
      .job-description { padding: 12px 14px; }
    }
  </style>
</head>
<body>
  <nav class="nav">
    <a href="/" class="nav-logo">AEROSCOUT</a>
    <div class="nav-links">
      <a href="/jobs">Browse Jobs</a>
      <a href="/about.html">About</a>
      <a href="/pricing.html">Pricing</a>
      <a href="/login.html">Login</a>
    </div>
  </nav>

  <main class="container">
    <a href="/jobs" class="back-link">&larr; Back to all jobs</a>

    <article class="card${visaClass}">
      <div class="company-logo">${logoHtml}</div>

      <h1 class="job-title">${escapeHtml(j.title)}<span class="airline-name">${escapeHtml(j.org)}</span></h1>

      <div class="apply-container">
        <a href="${escapeHtml(j.applyUrl)}" class="apply-btn" target="_blank" rel="noopener noreferrer">Apply Now</a>
      </div>

      <div class="attributes">
        ${renderAttributes(j)}
      </div>

      <div class="stats-row">
        ${renderStatsRow(j)}
      </div>

      <div class="job-description">
        ${descriptionHtml}
        ${requirementsHtml}
      </div>
    </article>

    <div class="cta-banner">
      <h2>Explore ${isCabinCrew ? 'Cabin Crew' : 'Pilot'} Jobs Worldwide</h2>
      <p>Search, filter, and get alerts for the latest aviation positions from 850+ airlines &amp; operators.</p>
      <a href="/jobs${isCabinCrew ? '?type=cabin_crew' : ''}" class="cta-btn">Browse All Jobs</a>
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
  <title>Job Not Found | AeroScout</title>
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
  <h1>Job Not Found</h1>
  <p>This position may have been filled or removed.</p>
  <a href="/jobs">Browse All Jobs</a>
</body>
</html>`;
}

// ── Main handler ─────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { id, type } = req.query;

  if (!id) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(404).send(build404());
  }

  // Extract numeric ID from slug (e.g., "pc-12-first-officer-private-air-5391" → 5391)
  const jobId = extractIdFromSlug(id);
  if (isNaN(jobId)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(404).send(build404());
  }

  const isCabinCrew = type === 'cabin_crew';

  try {
    // Try primary table first
    const primaryTable = isCabinCrew ? 'public_verified_cabin_crew_jobs' : 'public_verified_jobs';
    const fallbackTable = isCabinCrew ? 'public_verified_jobs' : 'public_verified_cabin_crew_jobs';

    let { data, error } = await supabase
      .from(primaryTable)
      .select('*')
      .eq('id', jobId)
      .single();

    let jobType = isCabinCrew ? 'cabin_crew' : 'pilot';

    // If not found in primary table, try fallback
    if (error || !data) {
      const fallback = await supabase
        .from(fallbackTable)
        .select('*')
        .eq('id', jobId)
        .single();

      if (fallback.error || !fallback.data) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        return res.status(404).send(build404());
      }

      data = fallback.data;
      jobType = isCabinCrew ? 'pilot' : 'cabin_crew';
    }

    // Map the raw row to our job object
    const job = jobType === 'cabin_crew' ? mapCabinCrewJob(data) : mapPilotJob(data);

    // 301 redirect if URL doesn't have the correct slug (e.g., /jobs/5391 → /jobs/pc-12-first-officer-private-air-5391)
    const correctSlug = buildSlug(job);
    if (id !== correctSlug) {
      const redirectUrl = isCabinCrew
        ? `/jobs/${correctSlug}?type=cabin_crew`
        : `/jobs/${correctSlug}`;
      res.setHeader('Location', redirectUrl);
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      return res.status(301).end();
    }

    // Build and send the full HTML page
    const html = buildPage(job, jobType);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);

  } catch (err) {
    console.error('job-page error:', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(build404());
  }
};
