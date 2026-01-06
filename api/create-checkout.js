/**
 * Paddle Subscription Checkout API
 *
 * Creates a Paddle checkout URL using Paddle.js overlay checkout.
 * Users can pay with credit card without needing a Paddle/PayPal account.
 *
 * Environment variables required:
 *   - PADDLE_PRICE_ID
 */

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

    const priceId = process.env.PADDLE_PRICE_ID;

    if (!priceId) {
      throw new Error('PADDLE_PRICE_ID not configured');
    }

    // Build Paddle checkout URL with parameters
    // Using Paddle's direct checkout link format
    const checkoutParams = new URLSearchParams({
      items: JSON.stringify([{ priceId: priceId, quantity: 1 }]),
      'customer[email]': userEmail,
      'customData[supabase_user_id]': userId,
      'settings[successUrl]': 'https://www.aeroscout.net/success.html',
    });

    // Return the price ID and user data - frontend will use Paddle.js
    res.status(200).json({
      priceId: priceId,
      customData: {
        supabase_user_id: userId,
      },
      customerEmail: userEmail,
      successUrl: 'https://www.aeroscout.net/success.html',
    });

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message });
  }
};
