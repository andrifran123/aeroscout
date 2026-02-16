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
  const type = searchParams.get('type') || 'pilot'; // pilot or cabin_crew

  const isPilot = type !== 'cabin_crew';

  // Build subtitle parts
  const subtitleParts = [];
  if (aircraft && isPilot) subtitleParts.push(aircraft);
  if (rank && isPilot) subtitleParts.push(rank);
  if (location) subtitleParts.push(location);
  const subtitle = subtitleParts.join('  \u2022  ');

  return new ImageResponse(
    (
      {
        type: 'div',
        props: {
          style: {
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0b1426 0%, #162044 50%, #0b1426 100%)',
            padding: '60px 70px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          },
          children: [
            // Top section: Logo + badge
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                },
                children: [
                  // Logo
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
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
                              fontWeight: '800',
                            },
                            children: 'A',
                          },
                        },
                        {
                          type: 'span',
                          props: {
                            style: {
                              color: 'white',
                              fontSize: '24px',
                              fontWeight: '800',
                              letterSpacing: '3px',
                            },
                            children: 'AEROSCOUT',
                          },
                        },
                      ],
                    },
                  },
                  // Badge
                  {
                    type: 'div',
                    props: {
                      style: {
                        background: isPilot ? 'rgba(37, 99, 235, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                        border: isPilot ? '1px solid rgba(37, 99, 235, 0.4)' : '1px solid rgba(168, 85, 247, 0.4)',
                        borderRadius: '20px',
                        padding: '6px 18px',
                        color: isPilot ? '#60a5fa' : '#c084fc',
                        fontSize: '14px',
                        fontWeight: '600',
                        letterSpacing: '1px',
                      },
                      children: isPilot ? 'PILOT POSITION' : 'CABIN CREW',
                    },
                  },
                ],
              },
            },
            // Middle section: Job title + airline
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  flex: '1',
                  justifyContent: 'center',
                },
                children: [
                  // Job title
                  {
                    type: 'div',
                    props: {
                      style: {
                        color: 'white',
                        fontSize: title.length > 40 ? '38px' : '48px',
                        fontWeight: '800',
                        lineHeight: '1.1',
                        letterSpacing: '-1px',
                      },
                      children: title,
                    },
                  },
                  // Airline name
                  airline ? {
                    type: 'div',
                    props: {
                      style: {
                        color: '#60a5fa',
                        fontSize: '28px',
                        fontWeight: '600',
                      },
                      children: airline,
                    },
                  } : null,
                  // Subtitle (aircraft, rank, location)
                  subtitle ? {
                    type: 'div',
                    props: {
                      style: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '20px',
                        fontWeight: '400',
                        marginTop: '4px',
                      },
                      children: subtitle,
                    },
                  } : null,
                ].filter(Boolean),
              },
            },
            // Bottom section: CTA
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingTop: '24px',
                },
                children: [
                  {
                    type: 'span',
                    props: {
                      style: {
                        color: 'rgba(255, 255, 255, 0.4)',
                        fontSize: '16px',
                      },
                      children: 'aeroscout.net',
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        background: '#2563eb',
                        color: 'white',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '700',
                      },
                      children: 'View & Apply',
                    },
                  },
                ],
              },
            },
          ],
        },
      }
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
