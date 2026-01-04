const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Disable body parsing - Stripe needs raw body for signature verification
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

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata.supabase_user_id;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      if (userId) {
        // Update user's premium status in Supabase
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            is_premium: true,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            premium_since: new Date().toISOString(),
          }, { onConflict: 'id' });

        if (error) {
          console.error('Failed to update user premium status:', error);
        } else {
          console.log(`User ${userId} upgraded to premium`);
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;

      // Find user by subscription ID and remove premium
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
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

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      console.log(`Payment failed for customer ${invoice.customer}`);
      // Optionally notify user or handle failed payment
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
};
