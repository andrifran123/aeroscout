const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription', // Use 'payment' for one-time purchase
      customer_email: userEmail,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // Your Stripe Price ID
          quantity: 1,
        },
      ],
      metadata: {
        supabase_user_id: userId,
      },
      success_url: `${process.env.SITE_URL || 'https://aeroscout.net'}/success.html`,
      cancel_url: `${process.env.SITE_URL || 'https://aeroscout.net'}/Jobs.html?payment=cancelled`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: error.message });
  }
};
