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

    // Use the Lemon Squeezy share link with custom parameters
    const baseUrl = process.env.LEMONSQUEEZY_CHECKOUT_URL || 'https://aeroscout-pro.lemonsqueezy.com/checkout/buy/3811b1aa-0b8c-41d4-9ad9-1a48e9cdc92e';

    // Add custom data to the URL
    const checkoutUrl = `${baseUrl}?checkout[email]=${encodeURIComponent(userEmail)}&checkout[custom][supabase_user_id]=${encodeURIComponent(userId)}&checkout[success_url]=${encodeURIComponent('https://www.aeroscout.net/success.html')}`;

    res.status(200).json({ url: checkoutUrl });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message });
  }
};
