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
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function readingTime(html) {
  const text = stripHtml(html);
  const words = text.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function renderPostCard(post) {
  const categoryLabel = (post.category || 'article').replace(/-/g, ' ');
  return `
    <a href="/blog/${escapeHtml(post.slug)}" class="post-card">
      ${post.cover_image_url
        ? `<div class="post-image"><img src="${escapeHtml(post.cover_image_url)}" alt="${escapeHtml(post.title)}" loading="lazy"></div>`
        : `<div class="post-image post-image-placeholder"><span>${escapeHtml(categoryLabel)}</span></div>`
      }
      <div class="post-body">
        <span class="post-category">${escapeHtml(categoryLabel)}</span>
        <h2 class="post-title">${escapeHtml(post.title)}</h2>
        <p class="post-excerpt">${escapeHtml(post.excerpt || truncate(post.content, 140))}</p>
        <div class="post-meta">
          <span>${formatDate(post.published_at)}</span>
          <span class="meta-dot">&middot;</span>
          <span>${readingTime(post.content)}</span>
        </div>
      </div>
    </a>`;
}

function buildPage(posts) {
  const postCards = posts.map(renderPostCard).join('');

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
  <title>Aviation Industry Blog & Market Reports | AeroScout</title>
  <meta name="description" content="Aviation industry insights, pilot job market reports, and career guidance. Data-driven analysis of global pilot and cabin crew hiring trends.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://www.aeroscout.net/blog">

  <meta property="og:title" content="Aviation Industry Blog & Market Reports | AeroScout">
  <meta property="og:description" content="Aviation industry insights, pilot job market reports, and career guidance.">
  <meta property="og:url" content="https://www.aeroscout.net/blog">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="AeroScout">
  <meta property="og:image" content="https://www.aeroscout.net/images/og-homepage.png">

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

    /* ── Page hero ──────────────────────────────────── */
    .page-hero {
      background: linear-gradient(135deg, #0b1426 0%, #0b2a6f 100%);
      padding: 56px 24px 48px;
      text-align: center;
      color: #fff;
    }
    .page-hero h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 36px;
      font-weight: 800;
      margin-bottom: 12px;
    }
    .page-hero p {
      font-size: 16px;
      color: rgba(255,255,255,0.6);
      max-width: 520px;
      margin: 0 auto;
      line-height: 1.6;
    }

    /* ── Post grid ─────────────────────────────────── */
    .posts-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 40px 24px 60px;
    }
    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 28px;
    }
    .post-card {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      transition: box-shadow 0.2s, transform 0.2s;
      display: flex;
      flex-direction: column;
    }
    .post-card:hover {
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      transform: translateY(-2px);
    }
    .post-image {
      height: 200px;
      overflow: hidden;
      background: #e2e8f0;
    }
    .post-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .post-image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0b1426, #0b2a6f);
    }
    .post-image-placeholder span {
      color: rgba(255,255,255,0.3);
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 3px;
    }
    .post-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .post-category {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #0b2a6f;
      margin-bottom: 8px;
    }
    .post-title {
      font-family: 'Outfit', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
      margin-bottom: 10px;
    }
    .post-excerpt {
      font-size: 14px;
      color: #64748b;
      line-height: 1.6;
      flex: 1;
      margin-bottom: 16px;
    }
    .post-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #94a3b8;
    }
    .meta-dot { color: #cbd5e1; }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #94a3b8;
    }
    .empty-state h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 24px;
      color: #64748b;
      margin-bottom: 8px;
    }

    .footer {
      text-align: center;
      padding: 24px;
      color: #94a3b8;
      font-size: 12px;
    }
    .footer a { color: #64748b; }
    .footer a:hover { color: #1e293b; }

    @media (max-width: 768px) {
      .page-hero { padding: 36px 16px 32px; }
      .page-hero h1 { font-size: 26px; }
      .page-hero p { font-size: 14px; }
      .posts-container { padding: 24px 16px 40px; }
      .posts-grid { grid-template-columns: 1fr; gap: 20px; }
      .post-image { height: 180px; }
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

  <div class="page-hero">
    <h1>Aviation Industry Insights</h1>
    <p>Data-driven market reports, hiring trends, and career guidance for pilots and cabin crew worldwide.</p>
  </div>

  <main class="posts-container">
    ${posts.length > 0
      ? `<div class="posts-grid">${postCards}</div>`
      : `<div class="empty-state"><h2>Coming Soon</h2><p>Our first market reports and industry analyses are on the way.</p></div>`
    }
  </main>

  <footer class="footer">
    <p>&copy; ${new Date().getFullYear()} AeroScout. <a href="/terms.html">Terms</a> &middot; <a href="/privacy.html">Privacy</a></p>
  </footer>

  <script defer src="/_vercel/insights/script.js"></script>
</body>
</html>`;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    const { data, error } = await getSupabase()
      .from('public_blog_posts')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(50);

    const posts = data || [];

    const html = buildPage(posts);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);
  } catch (err) {
    console.error('blog-listing error:', err);
    const html = buildPage([]);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  }
};
