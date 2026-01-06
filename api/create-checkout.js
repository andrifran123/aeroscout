/**
 * Paddle Subscription Checkout API
 *
 * Creates a Paddle checkout session for subscriptions.
 * Users can pay with credit card without needing a Paddle/PayPal account.
 *
 * Environment variables required:
 *   - PADDLE_API_KEY
 *   - PADDLE_PRICE_ID
 */

const PADDLE_API_URL = 'https://api.paddle.com';

async function createCheckoutSession(userId, userEmail) {
  const response = await fetch(`${PADDLE_API_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          price_id: process.env.PADDLE_PRICE_ID,
          quantity: 1,
        },
      ],
      customer_id: null,  // Let Paddle create customer
      custom_data: {
        supabase_user_id: userId,
      },
      checkout: {
        url: 'https://www.aeroscout.net/success.html',
      },
      // Pre-fill customer email
      customer: {
        email: userEmail,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Paddle API error:', error);
    throw new Error('Failed to create checkout session');
  }

  return response.json();
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, userEmail } = req.body;

    if (!userId || !userEmail) {
      return res.status(400).json({ error: 'Missing userId or userEmail' });
    }

    // Create Paddle checkout session
    const session = await createCheckoutSession(userId, userEmail);

    // Get the checkout URL from the response
    const checkoutUrl = session.data?.checkout?.url;

    if (!checkoutUrl) {
      // For Paddle Billing, we need to use the transaction ID to build checkout URL
      const transactionId = session.data?.id;
      if (transactionId) {
        // Redirect to Paddle's hosted checkout
        return res.status(200).json({
          url: `https://checkout.paddle.com/checkout/custom/${transactionId}`,
          transactionId: transactionId,
        });
      }
      throw new Error('No checkout URL in Paddle response');
    }

    res.status(200).json({
      url: checkoutUrl,
      transactionId: session.data?.id,
    });

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message });
  }
};
