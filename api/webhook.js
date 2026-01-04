const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Supabase client with service role key for admin operations
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

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const rawBody = buf.toString('utf8');
  const signature = req.headers['x-signature'];

  // Verify webhook signature
  if (!signature) {
    console.error('Missing webhook signature');
    return res.status(400).json({ error: 'Missing signature' });
  }

  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  try {
    const isValid = verifySignature(rawBody, signature, secret);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }
  } catch (err) {
    console.error('Signature verification error:', err.message);
    return res.status(400).json({ error: 'Signature verification failed' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error('Invalid JSON:', err.message);
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const eventName = event.meta?.event_name;
  const customData = event.meta?.custom_data || {};
  const userId = customData.supabase_user_id;

  console.log(`Received Lemon Squeezy event: ${eventName}`);

  // Handle the event
  switch (eventName) {
    case 'order_created':
    case 'subscription_created': {
      if (userId) {
        const subscriptionId = event.data?.id;
        const customerEmail = event.data?.attributes?.user_email;

        // Update user's premium status in Supabase
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            is_premium: true,
            lemonsqueezy_subscription_id: String(subscriptionId),
            lemonsqueezy_customer_email: customerEmail,
            premium_since: new Date().toISOString(),
          }, { onConflict: 'id' });

        if (error) {
          console.error('Failed to update user premium status:', error);
        } else {
          console.log(`User ${userId} upgraded to premium`);
        }
      } else {
        console.log('No supabase_user_id in custom data');
      }
      break;
    }

    case 'subscription_cancelled': {
      const subscriptionId = event.data?.id;

      // Find user by subscription ID and remove premium
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('lemonsqueezy_subscription_id', String(subscriptionId))
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ is_premium: false })
          .eq('id', profile.id);

        console.log(`User ${profile.id} subscription cancelled`);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${eventName}`);
  }

  res.status(200).json({ received: true });
};
