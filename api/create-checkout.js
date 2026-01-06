/**
 * PayPal Subscription Checkout API
 *
 * Creates a PayPal subscription for the user and returns the approval URL.
 *
 * Environment variables required:
 *   - PAYPAL_CLIENT_ID
 *   - PAYPAL_SECRET
 *   - PAYPAL_PLAN_ID
 *   - PAYPAL_MODE (sandbox or live)
 */

const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString('base64');

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to authenticate with PayPal');
  }

  const data = await response.json();
  return data.access_token;
}

async function createSubscription(accessToken, userId, userEmail) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `sub-${userId}-${Date.now()}`,
    },
    body: JSON.stringify({
      plan_id: process.env.PAYPAL_PLAN_ID,
      subscriber: {
        email_address: userEmail,
      },
      custom_id: userId,  // This links the subscription to our Supabase user
      application_context: {
        brand_name: 'AeroScout Pro',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: 'https://www.aeroscout.net/success.html',
        cancel_url: 'https://www.aeroscout.net/pricing.html',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('PayPal subscription error:', error);
    throw new Error('Failed to create subscription');
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

    // Get PayPal access token
    const accessToken = await getAccessToken();

    // Create subscription
    const subscription = await createSubscription(accessToken, userId, userEmail);

    // Find the approval URL
    const approvalLink = subscription.links.find(link => link.rel === 'approve');

    if (!approvalLink) {
      throw new Error('No approval URL in PayPal response');
    }

    res.status(200).json({
      url: approvalLink.href,
      subscriptionId: subscription.id,
    });

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message });
  }
};
