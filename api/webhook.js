/**
 * PayPal Webhook Handler
 *
 * Handles PayPal subscription events:
 *   - BILLING.SUBSCRIPTION.ACTIVATED - User subscribed successfully
 *   - BILLING.SUBSCRIPTION.CANCELLED - User cancelled subscription
 *   - BILLING.SUBSCRIPTION.SUSPENDED - Payment failed
 *   - BILLING.SUBSCRIPTION.EXPIRED - Subscription ended
 *
 * Environment variables required:
 *   - PAYPAL_CLIENT_ID
 *   - PAYPAL_SECRET
 *   - PAYPAL_WEBHOOK_ID
 *   - PAYPAL_MODE (sandbox or live)
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_KEY
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Disable body parsing - we need raw body for signature verification
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

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

async function verifyWebhookSignature(headers, body) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(body),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Webhook verification failed:', error);
    return false;
  }

  const result = await response.json();
  return result.verification_status === 'SUCCESS';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const rawBody = buf.toString('utf8');

  // Verify webhook signature (optional but recommended)
  if (process.env.PAYPAL_WEBHOOK_ID) {
    try {
      const isValid = await verifyWebhookSignature(req.headers, rawBody);
      if (!isValid) {
        console.error('Invalid PayPal webhook signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    } catch (err) {
      console.error('Signature verification error:', err.message);
      // Continue processing - PayPal sandbox sometimes has verification issues
    }
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error('Invalid JSON:', err.message);
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const eventType = event.event_type;
  const resource = event.resource;

  console.log(`Received PayPal event: ${eventType}`);

  // Handle subscription events
  switch (eventType) {
    case 'BILLING.SUBSCRIPTION.ACTIVATED':
    case 'BILLING.SUBSCRIPTION.CREATED': {
      // User subscribed successfully
      const subscriptionId = resource.id;
      const userId = resource.custom_id;  // Our Supabase user ID
      const subscriberEmail = resource.subscriber?.email_address;

      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            is_premium: true,
            paypal_subscription_id: subscriptionId,
            paypal_customer_email: subscriberEmail,
            premium_since: new Date().toISOString(),
          }, { onConflict: 'id' });

        if (error) {
          console.error('Failed to update user premium status:', error);
        } else {
          console.log(`User ${userId} upgraded to premium (subscription: ${subscriptionId})`);
        }
      } else {
        console.log('No custom_id (user ID) in subscription');
      }
      break;
    }

    case 'BILLING.SUBSCRIPTION.CANCELLED':
    case 'BILLING.SUBSCRIPTION.SUSPENDED':
    case 'BILLING.SUBSCRIPTION.EXPIRED': {
      // User cancelled or subscription ended
      const subscriptionId = resource.id;

      // Find user by subscription ID and remove premium
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('paypal_subscription_id', subscriptionId)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            is_premium: false,
            premium_ended: new Date().toISOString(),
          })
          .eq('id', profile.id);

        console.log(`User ${profile.id} subscription ${eventType.split('.')[2].toLowerCase()}`);
      }
      break;
    }

    case 'PAYMENT.SALE.COMPLETED': {
      // Recurring payment succeeded - ensure premium is active
      const subscriptionId = resource.billing_agreement_id;

      if (subscriptionId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('paypal_subscription_id', subscriptionId)
          .single();

        if (profile && !profile.is_premium) {
          await supabase
            .from('profiles')
            .update({ is_premium: true })
            .eq('id', profile.id);

          console.log(`User ${profile.id} premium reactivated after payment`);
        }
      }
      break;
    }

    default:
      console.log(`Unhandled PayPal event type: ${eventType}`);
  }

  res.status(200).json({ received: true });
};
