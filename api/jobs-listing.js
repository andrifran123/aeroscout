const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://ziboktbmbyjbhifsdypa.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

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
  const parts = [job.title, job.airline].filter(Boolean).map(slugify).filter(Boolean);
  return parts.length > 0 ? `${parts.join('-')}-${job.id}` : String(job.id);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchAllJobs(table, columns) {
  const jobs = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order('verified_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error || !data || data.length === 0) break;
    jobs.push(...data);
    hasMore = data.length === pageSize;
    page++;
  }

  return jobs;
}

function renderPilotJobRow(job) {
  const slug = buildSlug(job);
  const url = `/jobs/${slug}`;
  const airline = escapeHtml(job.airline || 'Unknown Airline');
  const title = escapeHtml(job.title || 'Pilot Position');
  const location = escapeHtml(job.location || '');
  const aircraft = escapeHtml(job.aircraft || '');
  const rank = escapeHtml(job.rank || '');

  let details = [];
  if (aircraft) details.push(aircraft);
  if (rank) details.push(rank);
  if (location) details.push(location);

  return `<tr>
<td><a href="${url}">${title}</a></td>
<td>${airline}</td>
<td>${location}</td>
<td>${details.join(' | ')}</td>
</tr>`;
}

function renderCabinCrewJobRow(job) {
  const slug = buildSlug(job);
  const url = `/jobs/${slug}?type=cabin_crew`;
  const airline = escapeHtml(job.airline || 'Unknown Airline');
  const title = escapeHtml(job.title || 'Cabin Crew Position');
  const location = escapeHtml(job.location || '');
  const position = escapeHtml(job.position || 'Flight Attendant');

  return `<tr>
<td><a href="${url}">${title}</a></td>
<td>${airline}</td>
<td>${location}</td>
<td>${position}</td>
</tr>`;
}

function buildJobPostingSchema(jobs, type) {
  // Schema for up to 50 jobs to keep payload reasonable
  const subset = jobs.slice(0, 50);
  return subset.map(job => {
    const slug = buildSlug(job);
    const url = type === 'cabin_crew'
      ? `https://www.aeroscout.net/jobs/${slug}?type=cabin_crew`
      : `https://www.aeroscout.net/jobs/${slug}`;

    const posting = {
      '@type': 'JobPosting',
      'title': job.title || (type === 'cabin_crew' ? 'Cabin Crew Position' : 'Pilot Position'),
      'url': url,
      'directApply': true,
      'hiringOrganization': {
        '@type': 'Organization',
        'name': job.airline || 'Unknown Airline',
      },
    };

    if (job.verified_at) {
      posting.datePosted = job.verified_at.split('T')[0];
    }
    if (job.location) {
      posting.jobLocation = { '@type': 'Place', 'address': job.location };
    }

    return posting;
  });
}

function buildPage(pilotJobs, cabinCrewJobs) {
  const pilotCount = pilotJobs.length;
  const cabinCount = cabinCrewJobs.length;
  const totalCount = pilotCount + cabinCount;

  const pilotSchema = buildJobPostingSchema(pilotJobs, 'pilot');
  const cabinSchema = buildJobPostingSchema(cabinCrewJobs, 'cabin_crew');
  const allSchema = [...pilotSchema, ...cabinSchema];

  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': allSchema,
  });

  const pilotRows = pilotJobs.map(renderPilotJobRow).join('\n');
  const cabinRows = cabinCrewJobs.map(renderCabinCrewJobRow).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>AeroScout | ${totalCount} Pilot &amp; Cabin Crew Jobs Worldwide</title>
<meta name="description" content="Browse ${pilotCount} pilot jobs and ${cabinCount} cabin crew positions worldwide. Find openings at Emirates, Qatar Airways, Ryanair, easyJet and more. Updated daily." />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://www.aeroscout.net/Jobs.html" />
<meta property="og:title" content="AeroScout | ${totalCount} Pilot &amp; Cabin Crew Jobs" />
<meta property="og:description" content="Browse ${pilotCount} pilot jobs and ${cabinCount} cabin crew positions worldwide. Updated daily with new aviation jobs." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://www.aeroscout.net/Jobs.html" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="AeroScout | ${totalCount} Aviation Jobs" />
<meta name="twitter:description" content="Browse ${pilotCount} pilot jobs and ${cabinCount} cabin crew positions worldwide." />
<script type="application/ld+json">
${schemaJson}
</script>
<style>
body { font-family: system-ui, -apple-system, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; color: #1e293b; }
h1 { color: #0f172a; }
h2 { color: #334155; margin-top: 40px; }
p { color: #475569; line-height: 1.6; }
table { width: 100%; border-collapse: collapse; margin: 20px 0; }
th { background: #f8fafc; text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 14px; }
td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
a { color: #2563eb; text-decoration: none; }
a:hover { text-decoration: underline; }
.summary { background: #f0f9ff; padding: 16px 20px; border-radius: 8px; margin: 20px 0; font-size: 16px; }
nav { margin: 20px 0; }
nav a { margin-right: 16px; }
</style>
</head>
<body>
<h1>AeroScout - Aviation Job Board</h1>
<nav>
<a href="/">Home</a>
<a href="/Jobs.html">Jobs</a>
<a href="/about.html">About</a>
<a href="/pricing.html">Pricing</a>
</nav>

<div class="summary">
<strong>Currently displaying ${totalCount} active aviation jobs:</strong> ${pilotCount} pilot positions and ${cabinCount} cabin crew positions worldwide. Updated daily.
</div>

<h2>Pilot Jobs (${pilotCount} active positions)</h2>
${pilotCount > 0 ? `<table>
<thead><tr><th>Position</th><th>Airline</th><th>Location</th><th>Details</th></tr></thead>
<tbody>
${pilotRows}
</tbody>
</table>` : '<p>No pilot jobs currently available.</p>'}

<h2>Cabin Crew Jobs (${cabinCount} active positions)</h2>
${cabinCount > 0 ? `<table>
<thead><tr><th>Position</th><th>Airline</th><th>Location</th><th>Role</th></tr></thead>
<tbody>
${cabinRows}
</tbody>
</table>` : '<p>No cabin crew jobs currently available.</p>'}

<footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 13px;">
<p>AeroScout is the largest aviation job database for pilots and cabin crew. Visit <a href="https://www.aeroscout.net">www.aeroscout.net</a> for the full interactive experience with filters, map view, and job alerts.</p>
</footer>
</body>
</html>`;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    const [pilotJobs, cabinCrewJobs] = await Promise.all([
      fetchAllJobs('public_verified_jobs', 'id, title, airline, location, aircraft, rank, verified_at, logo_url, salary_usd'),
      fetchAllJobs('public_verified_cabin_crew_jobs', 'id, title, airline, location, position, verified_at, logo_url, salary_usd'),
    ]);

    const html = buildPage(pilotJobs, cabinCrewJobs);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);

  } catch (err) {
    console.error('jobs-listing error:', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send('<!doctype html><html><head><title>AeroScout Jobs</title></head><body><h1>AeroScout Jobs</h1><p>Unable to load jobs. Please visit <a href="https://www.aeroscout.net/Jobs.html">www.aeroscout.net</a></p></body></html>');
  }
};
