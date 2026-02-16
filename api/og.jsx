import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);

  const title = searchParams.get('title') || 'Aviation Job';
  const airline = searchParams.get('airline') || '';
  const location = searchParams.get('location') || '';
  const aircraft = searchParams.get('aircraft') || '';
  const rank = searchParams.get('rank') || '';
  const type = searchParams.get('type') || 'pilot';

  const isPilot = type !== 'cabin_crew';

  // Build subtitle parts
  const subtitleParts = [];
  if (aircraft && isPilot) subtitleParts.push(aircraft);
  if (rank && isPilot) subtitleParts.push(rank);
  if (location) subtitleParts.push(location);
  const subtitle = subtitleParts.join('  \u2022  ');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0b1426 0%, #162044 50%, #0b1426 100%)',
          padding: '60px 70px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Top: Logo + badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: '#2563eb',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                color: 'white',
                fontWeight: 800,
              }}
            >
              A
            </div>
            <span
              style={{
                color: 'white',
                fontSize: '24px',
                fontWeight: 800,
                letterSpacing: '3px',
              }}
            >
              AEROSCOUT
            </span>
          </div>
          <div
            style={{
              background: isPilot ? 'rgba(37, 99, 235, 0.2)' : 'rgba(168, 85, 247, 0.2)',
              border: isPilot ? '1px solid rgba(37, 99, 235, 0.4)' : '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '20px',
              padding: '6px 18px',
              color: isPilot ? '#60a5fa' : '#c084fc',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '1px',
            }}
          >
            {isPilot ? 'PILOT POSITION' : 'CABIN CREW'}
          </div>
        </div>

        {/* Middle: Job title + airline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: title.length > 40 ? 38 : 48,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-1px',
            }}
          >
            {title}
          </div>
          {airline && (
            <div style={{ color: '#60a5fa', fontSize: '28px', fontWeight: 600 }}>
              {airline}
            </div>
          )}
          {subtitle && (
            <div
              style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '20px',
                fontWeight: 400,
                marginTop: '4px',
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Bottom: CTA */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '24px',
          }}
        >
          <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '16px' }}>
            aeroscout.net
          </span>
          <div
            style={{
              background: '#2563eb',
              color: 'white',
              padding: '10px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 700,
            }}
          >
            View &amp; Apply
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      },
    },
  );
}
