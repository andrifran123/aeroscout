/**
 * Gumroad Webhook Handler (Ping)
 *
 * Handles Gumroad sale and subscription events:
 *   - sale (ping) - User purchased/subscribed (or started trial)
 *   - subscription_cancelled - User cancelled
 *   - subscription_ended - Subscription period ended
 *   - subscription_restarted - User restarted subscription
 *
 * Environment variables required:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_KEY
 *   - GUMROAD_SELLER_ID (for verification)
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  // Gumroad sends webhooks as POST with form-urlencoded data
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Gumroad sends data as form-urlencoded
    const data = req.body;

    console.log('Gumroad webhook received:', JSON.stringify(data, null, 2));

    // Verify this is from our Gumroad account (optional check)
    const sellerId = process.env.GUMROAD_SELLER_ID;
    if (sellerId && data.seller_id && data.seller_id !== sellerId) {
      console.log('Seller ID mismatch - expected:', sellerId, 'got:', data.seller_id);
    }

    console.log('Gumroad webhook - seller_id:', data.seller_id, 'email:', data.email);

    // Get the customer email
    const customerEmail = data.email || data.purchaser_id;

    if (!customerEmail) {
      console.error('No customer email in webhook data');
      return res.status(400).json({ error: 'No customer email' });
    }

    const resourceName = data.resource_name || 'sale';

    // Detect if this is a free trial
    // Gumroad sets is_free_trial or the price is 0 for trial starts
    const isFreeTrial = data.is_free_trial === 'true' || data.is_free_trial === true
      || (data.price && parseInt(data.price) === 0 && data.subscription_id);

    switch (resourceName) {
      case 'sale':
      case 'ping': {
        const subscriptionId = data.subscription_id || data.sale_id;

        // Find user by email
        const { data: users, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customerEmail);

        let userId = users && users.length > 0 ? users[0].id : null;

        if (!userId) {
          const { data: authData } = await supabase.auth.admin.listUsers();
          const authUser = authData?.users?.find(u => u.email === customerEmail);
          userId = authUser?.id;
        }

        // Build update payload
        const now = new Date().toISOString();
        const trialEndsAt = isFreeTrial
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          : null;

        const updatePayload = {
          is_premium: true,
          gumroad_subscription_id: subscriptionId,
          gumroad_customer_email: customerEmail,
          premium_since: now,
          is_trial: isFreeTrial,
          trial_ends_at: trialEndsAt,
          subscription_status: isFreeTrial ? 'trial' : 'active',
        };

        if (userId) {
          const { error } = await supabase
            .from('profiles')
            .upsert({ id: userId, ...updatePayload }, { onConflict: 'id' });

          if (error) {
            console.error('Failed to update user premium status:', error);
          } else {
            const label = isFreeTrial ? 'free trial' : 'premium';
            console.log(`User ${userId} (${customerEmail}) upgraded to ${label}`);
          }
        } else {
          console.log(`No user found for email ${customerEmail}, storing for later`);
          const { error } = await supabase
            .from('profiles')
            .upsert({
              email: customerEmail,
              ...updatePayload,
            }, {
              onConflict: 'email',
              ignoreDuplicates: false
            });

          if (error) {
            console.log('Could not store pending subscription:', error.message);
          }
        }
        break;
      }

      case 'subscription_cancelled':
      case 'cancellation':
      case 'subscription_ended': {
        const subscriptionId = data.subscription_id;

        let query = supabase.from('profiles').select('id');
        if (subscriptionId) {
          query = query.eq('gumroad_subscription_id', subscriptionId);
        } else {
          query = query.eq('gumroad_customer_email', customerEmail);
        }

        const { data: profile } = await query.single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              is_premium: false,
              is_trial: false,
              premium_ended: new Date().toISOString(),
              subscription_status: 'cancelled',
            })
            .eq('id', profile.id);

          console.log(`User ${profile.id} subscription cancelled/ended`);
        } else {
          console.log(`No user found for subscription ${subscriptionId}`);
        }
        break;
      }

      case 'subscription_restarted': {
        const subscriptionId = data.subscription_id;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('gumroad_subscription_id', subscriptionId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              is_premium: true,
              is_trial: false,
              subscription_status: 'active',
            })
            .eq('id', profile.id);

          console.log(`User ${profile.id} subscription restarted`);
        }
        break;
      }

      default:
        console.log(`Unhandled Gumroad event type: ${resourceName}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
};
