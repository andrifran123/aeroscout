// api/og.js — Vercel Node.js Serverless Function
// Composites a company logo onto a branded AeroScout 1200x630 card
//
// Usage: /api/og?logo=https://example.com/logo.png
// Falls back to branded background if logo is missing or fails to load
//
// REQUIRES:
//   npm install sharp
//   public/og-background.png (the branded template)

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Load background template once per cold start
const BG_PATH = path.join(__dirname, '..', 'public', 'og-background.png');
let bgBuffer = null;

function getBackground() {
  if (!bgBuffer) {
    bgBuffer = fs.readFileSync(BG_PATH);
  }
  return bgBuffer;
}

module.exports = async function handler(req, res) {
  try {
    const logoUrl = req.query.logo;

    // No logo param — return plain branded background
    if (!logoUrl) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=604800');
      return res.send(getBackground());
    }

    // Fetch the logo from URL
    let logoBuffer;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(logoUrl, {
        headers: { 'User-Agent': 'AeroScout-OG/1.0' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      logoBuffer = Buffer.from(await response.arrayBuffer());
    } catch (err) {
      console.error('Logo fetch failed:', logoUrl, err.message);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(getBackground());
    }

    // Detect SVG and convert to PNG (sharp handles SVG input)
    const headerBytes = logoBuffer.slice(0, 200).toString('utf-8');
    const isSvg = logoUrl.toLowerCase().endsWith('.svg') || headerBytes.includes('<svg');

    if (isSvg) {
      try {
        logoBuffer = await sharp(logoBuffer, { density: 300 }).png().toBuffer();
      } catch (svgErr) {
        console.error('SVG conversion failed:', svgErr.message);
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(getBackground());
      }
    }

    // Resize logo — fit within 200x200 box, keep aspect ratio
    const resizedLogo = await sharp(logoBuffer)
      .resize(200, 200, {
        fit: 'inside',
        withoutEnlargement: false,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    // Get dimensions to center on the card
    const meta = await sharp(resizedLogo).metadata();
    const centerX = Math.round(600 - meta.width / 2);
    const centerY = Math.round(330 - meta.height / 2);

    // Composite logo onto background
    const result = await sharp(getBackground())
      .composite([{
        input: resizedLogo,
        left: centerX,
        top: centerY,
      }])
      .png()
      .toBuffer();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h
    res.setHeader('Content-Length', result.length);
    return res.send(result);

  } catch (err) {
    console.error('OG generation error:', err);
    // Always return an image — never let Facebook see an error
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(getBackground());
  }
};
