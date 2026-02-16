import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Start with simplest possible test
  return new ImageResponse(
    {
      type: 'div',
      props: {
        children: 'Hello World',
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '64px',
          background: 'white',
          color: 'black',
        },
      },
    },
    {
      width: 1200,
      height: 630,
    },
  );
}
