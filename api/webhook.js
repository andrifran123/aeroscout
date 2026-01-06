/**
 * Paddle Webhook Handler
 *
 * Handles Paddle subscription events:
 *   - subscription.activated - User subscribed successfully
 *   - subscription.canceled - User cancelled subscription
 *   - subscription.updated - Subscription changed
 *   - transaction.completed - Payment successful
 *
 * Environment variables required:
 *   - PADDLE_WEBHOOK_SECRET (optional, for signature verification)
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_KEY
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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

function verifyPaddleSignature(rawBody, signature, secret) {
  if (!secret) return true; // Skip verification if no secret configured

  const hmac = crypto.createHmac('sha256', secret);
  const expectedSignature = hmac.update(rawBody).digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const rawBody = buf.toString('utf8');

  // Verify webhook signature if secret is configured
  const signature = req.headers['paddle-signature'];
  if (process.env.PADDLE_WEBHOOK_SECRET && signature) {
    // Extract the h1 signature from the header
    const signatureParts = signature.split(';');
    const h1Part = signatureParts.find(p => p.startsWith('h1='));
    const h1Signature = h1Part ? h1Part.replace('h1=', '') : '';

    if (!verifyPaddleSignature(rawBody, h1Signature, process.env.PADDLE_WEBHOOK_SECRET)) {
      console.error('Invalid Paddle webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
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
  const data = event.data;

  console.log(`Received Paddle event: ${eventType}`);

  // Handle subscription events
  switch (eventType) {
    case 'subscription.activated':
    case 'subscription.created': {
      // User subscribed successfully
      const subscriptionId = data.id;
      const customData = data.custom_data || {};
      const userId = customData.supabase_user_id;
      const customerEmail = data.customer?.email;

      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            is_premium: true,
            paddle_subscription_id: subscriptionId,
            paddle_customer_id: data.customer_id,
            paddle_customer_email: customerEmail,
            premium_since: new Date().toISOString(),
          }, { onConflict: 'id' });

        if (error) {
          console.error('Failed to update user premium status:', error);
        } else {
          console.log(`User ${userId} upgraded to premium (subscription: ${subscriptionId})`);
        }
      } else {
        console.log('No supabase_user_id in custom_data');
      }
      break;
    }

    case 'subscription.canceled':
    case 'subscription.paused': {
      // User cancelled or paused subscription
      const subscriptionId = data.id;

      // Find user by subscription ID and remove premium
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('paddle_subscription_id', subscriptionId)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            is_premium: false,
            premium_ended: new Date().toISOString(),
          })
          .eq('id', profile.id);

        console.log(`User ${profile.id} subscription ${eventType.split('.')[1]}`);
      }
      break;
    }

    case 'subscription.resumed':
    case 'subscription.updated': {
      // Subscription resumed or updated - check if it's active
      const subscriptionId = data.id;
      const status = data.status;

      if (status === 'active') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('paddle_subscription_id', subscriptionId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ is_premium: true })
            .eq('id', profile.id);

          console.log(`User ${profile.id} subscription reactivated`);
        }
      }
      break;
    }

    case 'transaction.completed': {
      // Payment completed - ensure premium is active
      const customData = data.custom_data || {};
      const userId = customData.supabase_user_id;
      const subscriptionId = data.subscription_id;

      if (userId) {
        // Update user to premium
        await supabase
          .from('profiles')
          .upsert({
            id: userId,
            is_premium: true,
            paddle_subscription_id: subscriptionId,
            paddle_customer_id: data.customer_id,
            premium_since: new Date().toISOString(),
          }, { onConflict: 'id' });

        console.log(`User ${userId} payment completed`);
      }
      break;
    }

    default:
      console.log(`Unhandled Paddle event type: ${eventType}`);
  }

  res.status(200).json({ received: true });
};
