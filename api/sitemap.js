const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://ziboktbmbyjbhifsdypa.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// Static pages
const STATIC_PAGES = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/jobs', changefreq: 'daily', priority: '0.9' },
  { loc: '/about.html', changefreq: 'monthly', priority: '0.7' },
  { loc: '/pricing.html', changefreq: 'monthly', priority: '0.7' },
  { loc: '/signup.html', changefreq: 'monthly', priority: '0.6' },
  { loc: '/login.html', changefreq: 'monthly', priority: '0.5' },
  { loc: '/terms.html', changefreq: 'yearly', priority: '0.3' },
  { loc: '/privacy.html', changefreq: 'yearly', priority: '0.3' },
  { loc: '/refund.html', changefreq: 'yearly', priority: '0.3' },
];

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

async function fetchJobs(table) {
  const jobs = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select('id, verified_at, title, airline')
      .order('verified_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error || !data || data.length === 0) break;
    jobs.push(...data);
    hasMore = data.length === pageSize;
    page++;
  }

  return jobs;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // Fetch all job IDs from both tables
    const [pilotJobs, cabinJobs] = await Promise.all([
      fetchJobs('public_verified_jobs'),
      fetchJobs('public_verified_cabin_crew_jobs'),
    ]);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static pages
    for (const page of STATIC_PAGES) {
      xml += '  <url>\n';
      xml += `    <loc>https://www.aeroscout.net${page.loc}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    // Pilot jobs
    for (const job of pilotJobs) {
      const lastmod = job.verified_at ? job.verified_at.split('T')[0] : today;
      xml += '  <url>\n';
      xml += `    <loc>https://www.aeroscout.net/jobs/${buildSlug(job)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    // Cabin crew jobs
    for (const job of cabinJobs) {
      const lastmod = job.verified_at ? job.verified_at.split('T')[0] : today;
      xml += '  <url>\n';
      xml += `    <loc>https://www.aeroscout.net/jobs/${buildSlug(job)}?type=cabin_crew</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).send(xml);

  } catch (err) {
    console.error('Sitemap error:', err);
    res.setHeader('Content-Type', 'application/xml');
    return res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
};
