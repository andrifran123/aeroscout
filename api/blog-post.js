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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function readingTime(html) {
  const text = stripHtml(html);
  const words = text.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function buildArticleSchema(post, canonicalUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': post.title,
    'description': post.meta_description || truncate(post.content, 160),
    'url': canonicalUrl,
    'datePublished': post.published_at,
    'dateModified': post.published_at,
    'author': {
      '@type': 'Organization',
      'name': post.author || 'AeroScout',
      'url': 'https://www.aeroscout.net',
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'AeroScout',
      'url': 'https://www.aeroscout.net',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://www.aeroscout.net/images/og-homepage.png',
      },
    },
    ...(post.cover_image_url ? { image: post.cover_image_url } : {}),
    'mainEntityOfPage': { '@type': 'WebPage', '@id': canonicalUrl },
  };
}

function buildPage(post) {
  const canonicalUrl = `https://www.aeroscout.net/blog/${escapeHtml(post.slug)}`;
  const pageTitle = escapeHtml((post.meta_title || post.title) + ' | AeroScout');
  const metaDesc = escapeHtml(post.meta_description || truncate(post.content, 160));
  const ogImage = post.cover_image_url
    ? escapeHtml(post.cover_image_url)
    : 'https://www.aeroscout.net/images/og-homepage.png';
  const schema = buildArticleSchema(post, canonicalUrl);
  const schemaJson = JSON.stringify(schema, null, 2);
  const tags = (post.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  const categoryLabel = (post.category || 'article').replace(/-/g, ' ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
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
      background: #f8fafc;
      color: #1e293b;
      min-height: 100vh;
    }
    a { text-decoration: none; color: inherit; }

    /* ── Navbar ─────────────────────────────────────── */
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

    /* ── Article header ─────────────────────────────── */
    .article-hero {
      background: linear-gradient(135deg, #0b1426 0%, #0b2a6f 100%);
      padding: 60px 24px 48px;
      color: #fff;
    }
    .article-hero-inner {
      max-width: 780px;
      margin: 0 auto;
    }
    .category-badge {
      display: inline-block;
      background: rgba(0,194,255,0.15);
      color: #00C2FF;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 4px 12px;
      border-radius: 4px;
      margin-bottom: 16px;
    }
    .article-hero h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 36px;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 12px;
    }
    .article-subtitle {
      font-size: 18px;
      color: rgba(255,255,255,0.7);
      font-weight: 300;
      line-height: 1.5;
      margin-bottom: 20px;
    }
    .article-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 13px;
      color: rgba(255,255,255,0.5);
    }
    .article-meta span { display: flex; align-items: center; gap: 4px; }
    .meta-dot { color: rgba(255,255,255,0.3); }

    /* ── Cover image ────────────────────────────────── */
    .cover-image-wrap {
      max-width: 780px;
      margin: -24px auto 0;
      padding: 0 24px;
    }
    .cover-image-wrap img {
      width: 100%;
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    }

    /* ── Article body ───────────────────────────────── */
    .article-container {
      max-width: 780px;
      margin: 0 auto;
      padding: 40px 24px 60px;
    }
    .article-content {
      font-size: 16px;
      line-height: 1.8;
      color: #334155;
    }
    .article-content h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 700;
      color: #0f172a;
      margin: 40px 0 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    .article-content h3 {
      font-family: 'Outfit', sans-serif;
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin: 32px 0 12px;
    }
    .article-content p { margin-bottom: 20px; }
    .article-content ul, .article-content ol {
      margin: 0 0 20px 24px;
    }
    .article-content li {
      margin-bottom: 8px;
      line-height: 1.7;
    }
    .article-content blockquote {
      border-left: 4px solid #0b2a6f;
      background: #f1f5f9;
      padding: 16px 20px;
      margin: 24px 0;
      border-radius: 0 8px 8px 0;
      font-style: italic;
      color: #475569;
    }
    .article-content strong { color: #0f172a; }
    .article-content a {
      color: #0b2a6f;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .article-content a:hover { color: #1b66ff; }
    .article-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      font-size: 14px;
    }
    .article-content table th {
      background: #0b1426;
      color: #fff;
      padding: 10px 14px;
      text-align: left;
      font-weight: 600;
    }
    .article-content table td {
      padding: 10px 14px;
      border-bottom: 1px solid #e2e8f0;
    }
    .article-content table tr:nth-child(even) { background: #f8fafc; }

    /* ── Tags ────────────────────────────────────────── */
    .tags-section {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .tag {
      background: #e3f2fd;
      color: #1565c0;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    /* ── CTA Banner ──────────────────────────────────── */
    .cta-banner {
      background: #0b1426;
      border-radius: 12px;
      padding: 32px 28px;
      margin-top: 40px;
      text-align: center;
    }
    .cta-banner h2 {
      font-family: 'Outfit', sans-serif;
      color: #fff;
      font-size: 22px;
      margin-bottom: 8px;
    }
    .cta-banner p {
      color: rgba(255,255,255,0.7);
      font-size: 14px;
      margin-bottom: 20px;
    }
    .cta-btn {
      display: inline-block;
      background: #2563eb;
      color: #fff;
      padding: 12px 28px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      transition: background 0.15s;
    }
    .cta-btn:hover { background: #1d4ed8; }

    /* ── Footer ──────────────────────────────────────── */
    .footer {
      text-align: center;
      padding: 24px;
      color: #94a3b8;
      font-size: 12px;
    }
    .footer a { color: #64748b; }
    .footer a:hover { color: #1e293b; }

    /* ── Responsive ──────────────────────────────────── */
    @media (max-width: 768px) {
      .article-hero { padding: 32px 16px 28px; }
      .article-hero h1 { font-size: 24px; }
      .article-subtitle { font-size: 15px; }
      .article-meta { flex-wrap: wrap; gap: 8px; font-size: 12px; }
      .article-container { padding: 24px 16px 40px; }
      .article-content { font-size: 15px; }
      .article-content h2 { font-size: 22px; margin: 32px 0 12px; }
      .article-content h3 { font-size: 18px; margin: 24px 0 10px; }
      .cover-image-wrap { padding: 0 16px; margin-top: -16px; }
    }
  </style>
</head>
<body>
  <nav class="nav">
    <a href="/" class="nav-logo">AEROSCOUT</a>
    <div class="nav-links">
      <a href="/Jobs.html">Browse Jobs</a>
      <a href="/blog">Blog</a>
      <a href="/about.html">About</a>
      <a href="/pricing.html">Pricing</a>
      <a href="/login.html">Login</a>
    </div>
  </nav>

  <div class="article-hero">
    <div class="article-hero-inner">
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

  ${post.cover_image_url ? `
  <div class="cover-image-wrap">
    <img src="${escapeHtml(post.cover_image_url)}" alt="${escapeHtml(post.title)}">
  </div>` : ''}

  <main class="article-container">
    <div class="article-content">
      ${post.content}
    </div>

    ${tags ? `<div class="tags-section">${tags}</div>` : ''}

    <div class="cta-banner">
      <h2>Find Your Next Aviation Role</h2>
      <p>Browse the largest pilot and cabin crew job database with real-time listings from 850+ airlines worldwide.</p>
      <a href="/Jobs.html" class="cta-btn">Browse All Jobs</a>
    </div>
  </main>

  <footer class="footer">
    <p>&copy; ${new Date().getFullYear()} AeroScout. <a href="/terms.html">Terms</a> &middot; <a href="/privacy.html">Privacy</a></p>
  </footer>

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
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;600;800&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; color: #1e293b; }
    h1 { font-family: 'Outfit', sans-serif; font-size: 28px; margin-bottom: 8px; }
    p { color: #64748b; margin-bottom: 20px; }
    a { background: #0b2a6f; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; }
    a:hover { background: #081a45; }
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
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

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

    const html = buildPage(data);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);
  } catch (err) {
    console.error('blog-post error:', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(build404());
  }
};
