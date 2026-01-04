const { createClient } = require('@supabase/supabase-js');

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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

    // Lemon Squeezy checkout URL with pre-filled email and custom data
    const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;
    const storeId = process.env.LEMONSQUEEZY_STORE_ID || 'aeroscout';

    // Build checkout URL with parameters
    const checkoutUrl = new URL(`https://${storeId}.lemonsqueezy.com/checkout/buy/${variantId}`);

    // Pre-fill customer email
    checkoutUrl.searchParams.set('checkout[email]', userEmail);

    // Pass Supabase user ID in custom data for webhook
    checkoutUrl.searchParams.set('checkout[custom][supabase_user_id]', userId);

    // Redirect URLs
    checkoutUrl.searchParams.set('checkout[success_url]', `${process.env.SITE_URL || 'https://aeroscout.net'}/success.html`);

    res.status(200).json({ url: checkoutUrl.toString() });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message });
  }
};
