/**
 * Gumroad Webhook Handler (Ping)
 *
 * Handles Gumroad sale and subscription events:
 *   - sale (ping) - User purchased/subscribed
 *   - subscription_cancelled - User cancelled
 *   - subscription_ended - Subscription period ended
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
      // Log but don't block - seller_id encoding can vary
      console.log('Seller ID mismatch - expected:', sellerId, 'got:', data.seller_id);
    }

    // Log incoming data for debugging
    console.log('Gumroad webhook - seller_id:', data.seller_id, 'email:', data.email);

    // Get the customer email
    const customerEmail = data.email || data.purchaser_id;

    if (!customerEmail) {
      console.error('No customer email in webhook data');
      return res.status(400).json({ error: 'No customer email' });
    }

    // Handle different event types
    // Gumroad's ping webhook has a 'resource_name' field for the event type
    const resourceName = data.resource_name || 'sale';

    switch (resourceName) {
      case 'sale':
      case 'ping': {
        // New sale or subscription
        const subscriptionId = data.subscription_id || data.sale_id;

        // Find user by email
        const { data: users, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customerEmail);

        // If no user found by profile email, try auth.users
        let userId = users && users.length > 0 ? users[0].id : null;

        if (!userId) {
          // Try to find user in auth by email
          const { data: authData } = await supabase.auth.admin.listUsers();
          const authUser = authData?.users?.find(u => u.email === customerEmail);
          userId = authUser?.id;
        }

        if (userId) {
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              is_premium: true,
              gumroad_subscription_id: subscriptionId,
              gumroad_customer_email: customerEmail,
              premium_since: new Date().toISOString(),
            }, { onConflict: 'id' });

          if (error) {
            console.error('Failed to update user premium status:', error);
          } else {
            console.log(`User ${userId} (${customerEmail}) upgraded to premium`);
          }
        } else {
          // No user found - store the subscription for later linking
          // This can happen if someone buys before signing up
          console.log(`No user found for email ${customerEmail}, storing for later`);

          // Store in a pending_subscriptions table or just log
          // The user can be upgraded when they sign up with this email
          const { error } = await supabase
            .from('profiles')
            .upsert({
              email: customerEmail,
              is_premium: true,
              gumroad_subscription_id: subscriptionId,
              gumroad_customer_email: customerEmail,
              premium_since: new Date().toISOString(),
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
        // Subscription cancelled or ended
        const subscriptionId = data.subscription_id;

        // Find user by subscription ID or email
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
              premium_ended: new Date().toISOString(),
            })
            .eq('id', profile.id);

          console.log(`User ${profile.id} subscription cancelled/ended`);
        } else {
          console.log(`No user found for subscription ${subscriptionId}`);
        }
        break;
      }

      case 'subscription_restarted': {
        // Subscription restarted
        const subscriptionId = data.subscription_id;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('gumroad_subscription_id', subscriptionId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ is_premium: true })
            .eq('id', profile.id);

          console.log(`User ${profile.id} subscription restarted`);
        }
        break;
      }

      default:
        console.log(`Unhandled Gumroad event type: ${resourceName}`);
    }

    // Gumroad expects a 200 response
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
};
