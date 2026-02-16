module.exports = async function handler(req, res) {
  const { ImageResponse } = await import('@vercel/og');

  const url = new URL(req.url, 'https://www.aeroscout.net');
  const logo = url.searchParams.get('logo') || '';
  const title = url.searchParams.get('title') || 'Aviation Job';
  const airline = url.searchParams.get('airline') || '';
  const location = url.searchParams.get('location') || '';

  // Fetch logo if provided
  let logoSrc = null;
  if (logo) {
    try {
      const logoRes = await fetch(logo, { headers: { 'Accept': 'image/*' } });
      if (logoRes.ok) {
        const contentType = logoRes.headers.get('content-type') || 'image/png';
        const buf = await logoRes.arrayBuffer();
        if (buf.byteLength > 0 && buf.byteLength < 2000000) {
          const bytes = new Uint8Array(buf);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          logoSrc = 'data:' + contentType + ';base64,' + btoa(binary);
        }
      }
    } catch (e) {
      // Logo fetch failed, use fallback
    }
  }

  // Build subtitle
  const subtitleParts = [];
  if (airline && airline !== 'Unknown Airline') subtitleParts.push(airline);
  if (location) subtitleParts.push(location);
  const subtitle = subtitleParts.join(' · ');

  const displayTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
  const firstLetter = (airline || title).charAt(0).toUpperCase();

  const imageResponse = new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f1a2e',
          fontFamily: 'sans-serif',
          position: 'relative',
        },
        children: [
          // Top bar
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '40px 60px 0 60px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      fontSize: '28px',
                      fontWeight: 800,
                      color: '#ffffff',
                      letterSpacing: '-0.5px',
                    },
                    children: 'AEROSCOUT',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      fontSize: '18px',
                      color: 'rgba(255,255,255,0.5)',
                      fontWeight: 400,
                    },
                    children: 'Aviation Jobs Worldwide',
                  },
                },
              ],
            },
          },
          // Main content
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
                padding: '0 60px',
                gap: '50px',
              },
              children: [
                // Logo box
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '220px',
                      height: '220px',
                      borderRadius: '24px',
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      flexShrink: 0,
                    },
                    children: logoSrc
                      ? {
                          type: 'img',
                          props: {
                            src: logoSrc,
                            style: {
                              maxWidth: '180px',
                              maxHeight: '180px',
                              objectFit: 'contain',
                            },
                          },
                        }
                      : {
                          type: 'div',
                          props: {
                            style: {
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '72px',
                              fontWeight: 800,
                              color: '#1a2a5e',
                            },
                            children: firstLetter,
                          },
                        },
                  },
                },
                // Text
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                      gap: '12px',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            fontSize: '42px',
                            fontWeight: 700,
                            color: '#ffffff',
                            lineHeight: 1.2,
                          },
                          children: displayTitle,
                        },
                      },
                      subtitle
                        ? {
                            type: 'div',
                            props: {
                              style: {
                                display: 'flex',
                                fontSize: '26px',
                                color: 'rgba(255,255,255,0.7)',
                                fontWeight: 400,
                              },
                              children: subtitle,
                            },
                          }
                        : null,
                    ].filter(Boolean),
                  },
                },
              ],
            },
          },
          // Bottom bar
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 60px 40px 60px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      fontSize: '18px',
                      color: 'rgba(255,255,255,0.4)',
                    },
                    children: 'www.aeroscout.net',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '12px 32px',
                      borderRadius: '8px',
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      fontSize: '20px',
                      fontWeight: 600,
                    },
                    children: 'View & Apply',
                  },
                },
              ],
            },
          },
          // Accent line
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '4px',
                backgroundColor: '#3b82f6',
                display: 'flex',
              },
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
    },
  );

  // Stream the ImageResponse body to the Node.js response
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');

  const reader = imageResponse.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(Buffer.from(value));
  }
  res.end();
};
