const { createClient } = require('@supabase/supabase-js');

let _supabase;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL || 'https://ziboktbmbyjbhifsdypa.supabase.co',
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return _supabase;
}

// ── Slugify ────────────────────────────────────────────────────────────────────

function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Gather live data from the database ─────────────────────────────────────────

async function gatherMarketData(region) {
  const supabase = getSupabase();

  // Get actual total counts first
  let pilotCountQuery = supabase.from('public_verified_jobs').select('*', { count: 'exact', head: true });
  let cabinCountQuery = supabase.from('public_verified_cabin_crew_jobs').select('*', { count: 'exact', head: true });

  if (region && region !== 'global') {
    pilotCountQuery = pilotCountQuery.ilike('location', `%${region}%`);
    cabinCountQuery = cabinCountQuery.ilike('location', `%${region}%`);
  }

  const [pilotCountRes, cabinCountRes] = await Promise.all([pilotCountQuery, cabinCountQuery]);
  const totalPilotJobs = pilotCountRes.count || 0;
  const totalCabinJobs = cabinCountRes.count || 0;

  // Fetch ALL jobs for accurate stats (paginate to bypass Supabase 1000-row default)
  async function fetchAll(baseQuery) {
    const all = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data } = await baseQuery.range(page * pageSize, (page + 1) * pageSize - 1);
      if (!data || data.length === 0) break;
      all.push(...data);
      if (data.length < pageSize) break;
      page++;
    }
    return all;
  }

  let pilotBaseQuery = supabase
    .from('public_verified_jobs')
    .select('title, airline, location, aircraft, rank, salary_usd, visa_sponsor, direct_entry, type_rated, verified_at')
    .order('verified_at', { ascending: false });

  if (region && region !== 'global') {
    pilotBaseQuery = pilotBaseQuery.ilike('location', `%${region}%`);
  }

  const pilotJobs = await fetchAll(pilotBaseQuery);

  // Fetch cabin crew jobs
  let cabinBaseQuery = supabase
    .from('public_verified_cabin_crew_jobs')
    .select('title, airline, location, position, salary_usd, visa_sponsor, contract_type, verified_at')
    .order('verified_at', { ascending: false });

  if (region && region !== 'global') {
    cabinBaseQuery = cabinBaseQuery.ilike('location', `%${region}%`);
  }

  const cabinJobs = await fetchAll(cabinBaseQuery);

  // Compute stats
  const pilots = pilotJobs || [];
  const cabin = cabinJobs || [];

  const totalJobs = totalPilotJobs + totalCabinJobs;

  // Airlines hiring
  const airlines = new Set();
  pilots.forEach(j => airlines.add(j.airline));
  cabin.forEach(j => airlines.add(j.airline));

  // Aircraft types
  const aircraftCounts = {};
  pilots.forEach(j => {
    if (j.aircraft) {
      aircraftCounts[j.aircraft] = (aircraftCounts[j.aircraft] || 0) + 1;
    }
  });
  const topAircraft = Object.entries(aircraftCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Rank distribution
  const rankCounts = {};
  pilots.forEach(j => {
    if (j.rank) {
      rankCounts[j.rank] = (rankCounts[j.rank] || 0) + 1;
    }
  });

  // Location distribution
  const locationCounts = {};
  [...pilots, ...cabin].forEach(j => {
    if (j.location) {
      const loc = j.location.split(',')[0].trim();
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    }
  });
  const topLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Salary stats (pilot jobs with salary)
  const salaries = pilots
    .map(j => parseInt(j.salary_usd, 10))
    .filter(s => s && s > 0);
  const avgSalary = salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : null;
  const minSalary = salaries.length > 0 ? Math.min(...salaries) : null;
  const maxSalary = salaries.length > 0 ? Math.max(...salaries) : null;

  // Visa sponsor percentage
  const visaCount = pilots.filter(j => j.visa_sponsor).length;
  const visaPercent = pilots.length > 0 ? Math.round((visaCount / pilots.length) * 100) : 0;

  // Direct entry percentage
  const directCount = pilots.filter(j => j.direct_entry).length;
  const directPercent = pilots.length > 0 ? Math.round((directCount / pilots.length) * 100) : 0;

  return {
    totalPilotJobs,
    totalCabinJobs,
    totalJobs,
    airlinesHiring: airlines.size,
    topAircraft,
    rankDistribution: rankCounts,
    topLocations,
    avgSalary,
    minSalary,
    maxSalary,
    visaSponsorPercent: visaPercent,
    directEntryPercent: directPercent,
    sampleJobs: pilots.slice(0, 15).map(j => `${j.title} at ${j.airline} (${j.location || 'Undisclosed'})`),
    sampleCabinJobs: cabin.slice(0, 10).map(j => `${j.title} at ${j.airline} (${j.location || 'Undisclosed'})`),
  };
}

// ── Generate draft with Gemini 2.5 Flash via OpenRouter ─────────────────────────

async function generateWithGemini(marketData, region, reportType) {
  const apiKey = process.env.OPENROUTER_API_KEY || 'YOUR_OPENROUTER_API_KEY_HERE';

  const regionLabel = region && region !== 'global' ? region : 'Global';
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const prompt = `You are an aviation industry analyst writing for AeroScout, the world's largest aviation job database. Write a comprehensive ${reportType || 'market report'} for the ${regionLabel} aviation job market.

Current date: ${today}

Here is the REAL live data from AeroScout's database:

MARKET SNAPSHOT:
- Total pilot jobs listed: ${marketData.totalPilotJobs}
- Total cabin crew jobs listed: ${marketData.totalCabinJobs}
- Airlines actively hiring: ${marketData.airlinesHiring}
- Visa sponsorship available: ${marketData.visaSponsorPercent}% of pilot positions
- Direct entry positions: ${marketData.directEntryPercent}% of pilot positions

SALARY DATA (USD/year, pilot roles):
- Average: ${marketData.avgSalary ? '$' + marketData.avgSalary.toLocaleString() : 'Limited data'}
- Range: ${marketData.minSalary && marketData.maxSalary ? '$' + marketData.minSalary.toLocaleString() + ' - $' + marketData.maxSalary.toLocaleString() : 'Limited data'}

TOP AIRCRAFT TYPES IN DEMAND:
${marketData.topAircraft.map(a => `- ${a.name}: ${a.count} positions`).join('\n')}

RANK DISTRIBUTION:
${Object.entries(marketData.rankDistribution).map(([rank, count]) => `- ${rank}: ${count} positions`).join('\n')}

TOP HIRING LOCATIONS:
${marketData.topLocations.map(l => `- ${l.name}: ${l.count} positions`).join('\n')}

SAMPLE CURRENT PILOT OPENINGS:
${marketData.sampleJobs.join('\n')}

SAMPLE CURRENT CABIN CREW OPENINGS:
${marketData.sampleCabinJobs.join('\n')}

Write a professional, data-driven report in HTML format (no <html>, <head>, or <body> tags - just the article content HTML). Include:

1. An executive summary paragraph
2. Market overview with key statistics (reference the real numbers above)
3. Regional hiring trends and which airlines are actively recruiting
4. Aircraft type demand analysis
5. Salary trends and compensation insights
6. Opportunities for different experience levels (cadets, first officers, captains)
7. Cabin crew market overview
8. Key takeaways and recommendations for job seekers

Use semantic HTML: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <table>, <blockquote>. Make the data come alive with analysis and context. Be specific with numbers.

Do NOT use markdown. Output clean HTML only.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://www.aeroscout.net',
      'X-Title': 'AeroScout Market Reports',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenRouter returned empty content');
  }

  // Strip any accidental markdown code fences
  return content
    .replace(/^```html?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

// ── Humanize via Undetectable AI ───────────────────────────────────────────────

async function humanizeContent(htmlContent) {
  const apiKey = process.env.UNDETECTABLE_API_KEY || 'YOUR_UNDETECTABLE_API_KEY_HERE';

  // Strip HTML tags for humanization (Undetectable works on plain text)
  const plainText = htmlContent
    .replace(/<[^>]*>/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Submit for humanization
  const submitRes = await fetch('https://human.undetectable.ai/humanize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
    },
    body: JSON.stringify({
      content: plainText,
      readability: 'University',
      purpose: 'Article',
      strength: 'More Human',
    }),
  });

  if (!submitRes.ok) {
    const errorText = await submitRes.text();
    console.error(`Undetectable AI submit error ${submitRes.status}: ${errorText}`);
    return null; // Fallback to original
  }

  const submitResult = await submitRes.json();
  const documentId = submitResult.id;

  if (!documentId) {
    console.error('Undetectable AI returned no document ID:', submitResult);
    return null;
  }

  // Poll for completion (max 60 seconds)
  for (let attempt = 0; attempt < 12; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const checkRes = await fetch('https://human.undetectable.ai/document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({ id: documentId }),
    });

    if (!checkRes.ok) continue;

    const doc = await checkRes.json();

    if (doc.output) {
      return doc.output;
    }

    // Still processing
    if (doc.status === 'processing' || doc.status === 'queued') {
      continue;
    }

    // Failed
    if (doc.status === 'error') {
      console.error('Undetectable AI processing failed:', doc);
      return null;
    }
  }

  console.error('Undetectable AI timed out after 60s');
  return null;
}

// Re-wrap humanized plain text back into article HTML structure
function rewrapAsHtml(humanizedText, originalHtml) {
  // Split humanized text into paragraphs
  const paragraphs = humanizedText
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  // Try to preserve section headings from the original HTML
  const headingMatches = originalHtml.match(/<h[23][^>]*>.*?<\/h[23]>/gi) || [];
  const headings = headingMatches.map(h => {
    const textMatch = h.match(/>([^<]+)</);
    return { html: h, text: textMatch ? textMatch[1].trim().toLowerCase() : '' };
  });

  let html = '';
  for (const para of paragraphs) {
    // Check if this paragraph matches a heading from the original
    const paraLower = para.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const matchedHeading = headings.find(h =>
      paraLower === h.text.replace(/[^a-z0-9\s]/g, '').trim() ||
      (paraLower.length < 80 && h.text.includes(paraLower))
    );

    if (matchedHeading) {
      html += matchedHeading.html + '\n';
    } else {
      html += `<p>${para}</p>\n`;
    }
  }

  return html;
}

// ── Save to database ───────────────────────────────────────────────────────────

async function saveBlogPost(title, subtitle, content, excerpt, region, reportType) {
  const monthYear = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  const slug = slugify(title);

  const post = {
    slug,
    title,
    subtitle,
    content,
    excerpt,
    author: 'AeroScout Research',
    category: reportType || 'market-report',
    tags: [region || 'global', 'market-report', monthYear.toLowerCase().replace(' ', '-')],
    is_published: true,
    published_at: new Date().toISOString(),
    meta_title: `${title} | AeroScout`,
    meta_description: excerpt,
  };

  // Upsert by slug to allow regeneration
  const { data, error } = await getSupabase()
    .from('blog_posts')
    .upsert(post, { onConflict: 'slug' })
    .select()
    .single();

  if (error) throw new Error(`DB error: ${error.message}`);
  return data;
}

// ── Main handler ───────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple auth check
  const authKey = req.headers['x-api-key'] || req.headers['authorization'];
  const expectedKey = process.env.BLOG_API_KEY || 'YOUR_BLOG_API_KEY_HERE';
  if (authKey !== expectedKey && authKey !== `Bearer ${expectedKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { region, report_type, custom_title } = req.body || {};

    const regionLabel = region && region !== 'global'
      ? region.charAt(0).toUpperCase() + region.slice(1)
      : 'Global';
    const monthYear = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    const reportType = report_type || 'market-report';

    // 1. Gather live market data
    const marketData = await gatherMarketData(region);

    // 2. Generate draft with Gemini 2.5 Flash
    const draft = await generateWithGemini(marketData, region, reportType);

    // 3. Humanize via Undetectable AI (fallback to draft if it fails)
    let content = draft;
    let humanized = false;
    try {
      const humanizedText = await humanizeContent(draft);
      if (humanizedText) {
        content = rewrapAsHtml(humanizedText, draft);
        humanized = true;
      }
    } catch (humanizeErr) {
      console.error('Humanizer failed, using original draft:', humanizeErr.message);
    }

    // 4. Build title and excerpt
    const title = custom_title || `${regionLabel} Aviation Job Market Report - ${monthYear}`;
    const subtitle = `${marketData.totalJobs} active positions across ${marketData.airlinesHiring} airlines`;
    const excerpt = `Analysis of the ${regionLabel.toLowerCase()} aviation job market for ${monthYear}. ${marketData.totalPilotJobs} pilot and ${marketData.totalCabinJobs} cabin crew positions currently available from ${marketData.airlinesHiring} airlines.`;

    // 5. Save to database
    const post = await saveBlogPost(title, subtitle, content, excerpt, region, reportType);

    return res.status(200).json({
      success: true,
      humanized,
      post: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        url: `https://www.aeroscout.net/blog/${post.slug}`,
      },
      stats: {
        totalJobs: marketData.totalJobs,
        pilotJobs: marketData.totalPilotJobs,
        cabinJobs: marketData.totalCabinJobs,
        airlines: marketData.airlinesHiring,
      },
    });
  } catch (err) {
    console.error('generate-market-report error:', err);
    return res.status(500).json({
      error: 'Failed to generate report',
      details: err.message,
    });
  }
};
