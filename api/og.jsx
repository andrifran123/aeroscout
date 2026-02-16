import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const logo = searchParams.get('logo') || '';
  const title = searchParams.get('title') || 'Aviation Job';
  const airline = searchParams.get('airline') || '';
  const location = searchParams.get('location') || '';

  // Fetch logo if provided, with fallback
  let logoSrc = null;
  if (logo) {
    try {
      const res = await fetch(logo, { headers: { 'Accept': 'image/*' } });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/png';
        const buf = await res.arrayBuffer();
        if (buf.byteLength > 0 && buf.byteLength < 2_000_000) {
          const bytes = new Uint8Array(buf);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          logoSrc = `data:${contentType};base64,${btoa(binary)}`;
        }
      }
    } catch (e) {
      // Logo fetch failed, will use fallback
    }
  }

  // Build subtitle: "at Emirates - Dubai"
  const subtitleParts = [];
  if (airline && airline !== 'Unknown Airline') subtitleParts.push(airline);
  if (location) subtitleParts.push(location);
  const subtitle = subtitleParts.join(' · ');

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0b1426 0%, #162044 50%, #1a2a5e 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle radial glow */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Top bar with branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '40px 60px 0 60px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '28px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.5px',
            }}
          >
            AEROSCOUT
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '18px',
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 400,
            }}
          >
            Aviation Jobs Worldwide
          </div>
        </div>

        {/* Main content area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            padding: '0 60px',
            gap: '50px',
          }}
        >
          {/* Logo container */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '220px',
              height: '220px',
              borderRadius: '24px',
              background: 'rgba(255,255,255,0.95)',
              flexShrink: 0,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            {logoSrc ? (
              <img
                src={logoSrc}
                style={{
                  maxWidth: '180px',
                  maxHeight: '180px',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '72px',
                  fontWeight: 800,
                  color: '#1a2a5e',
                }}
              >
                {(airline || title).charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Text content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              gap: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: '42px',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.2,
                letterSpacing: '-0.5px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title.length > 60 ? title.substring(0, 57) + '...' : title}
            </div>
            {subtitle && (
              <div
                style={{
                  display: 'flex',
                  fontSize: '26px',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 400,
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 60px 40px 60px',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: '18px',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            www.aeroscout.net
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 32px',
              borderRadius: '8px',
              background: '#3b82f6',
              color: '#ffffff',
              fontSize: '20px',
              fontWeight: 600,
            }}
          >
            View & Apply
          </div>
        </div>

        {/* Accent line at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)',
            display: 'flex',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  );
}
