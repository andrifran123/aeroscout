const { ImageResponse } = require('@vercel/og');

module.exports = async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const searchParams = url.searchParams;

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

  // Helper to create elements (satori accepts {type, props} objects)
  function h(type, props, ...children) {
    const flatChildren = children.flat().filter(Boolean);
    return {
      type,
      props: {
        ...props,
        children: flatChildren.length === 1 ? flatChildren[0] : flatChildren.length === 0 ? undefined : flatChildren,
      },
    };
  }

  const element = h('div', {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      background: 'linear-gradient(135deg, #0b1426 0%, #162044 50%, #0b1426 100%)',
      padding: '60px 70px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
  },
    // Top row: Logo + badge
    h('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    },
      // Logo
      h('div', {
        style: { display: 'flex', alignItems: 'center', gap: '12px' },
      },
        h('div', {
          style: {
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
          },
        }, 'A'),
        h('span', {
          style: {
            color: 'white',
            fontSize: '24px',
            fontWeight: 800,
            letterSpacing: '3px',
          },
        }, 'AEROSCOUT')
      ),
      // Badge
      h('div', {
        style: {
          background: isPilot ? 'rgba(37, 99, 235, 0.2)' : 'rgba(168, 85, 247, 0.2)',
          border: isPilot ? '1px solid rgba(37, 99, 235, 0.4)' : '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '20px',
          padding: '6px 18px',
          color: isPilot ? '#60a5fa' : '#c084fc',
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '1px',
        },
      }, isPilot ? 'PILOT POSITION' : 'CABIN CREW')
    ),

    // Middle: Job title + airline + subtitle
    h('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flex: 1,
        justifyContent: 'center',
      },
    },
      h('div', {
        style: {
          color: 'white',
          fontSize: title.length > 40 ? 38 : 48,
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-1px',
        },
      }, title),
      airline ? h('div', {
        style: { color: '#60a5fa', fontSize: '28px', fontWeight: 600 },
      }, airline) : null,
      subtitle ? h('div', {
        style: {
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '20px',
          fontWeight: 400,
          marginTop: '4px',
        },
      }, subtitle) : null
    ),

    // Bottom: URL + CTA button
    h('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        paddingTop: '24px',
      },
    },
      h('span', {
        style: { color: 'rgba(255, 255, 255, 0.4)', fontSize: '16px' },
      }, 'aeroscout.net'),
      h('div', {
        style: {
          background: '#2563eb',
          color: 'white',
          padding: '10px 24px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 700,
        },
      }, 'View & Apply')
    )
  );

  const imageResponse = new ImageResponse(element, {
    width: 1200,
    height: 630,
  });

  // Convert the Response to a Node.js response
  const buffer = await imageResponse.arrayBuffer();
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
  res.status(200).send(Buffer.from(buffer));
};
