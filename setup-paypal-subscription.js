/**
 * PayPal Subscription Plan Setup Script
 *
 * This script creates a subscription product and plan in PayPal.
 * Run this ONCE to set up your subscription plan, then copy the PLAN_ID to your environment.
 *
 * Usage:
 *   1. Set your PayPal credentials below (from https://developer.paypal.com/dashboard/applications/sandbox)
 *   2. Run: node setup-paypal-subscription.js
 *   3. Copy the PLAN_ID from the output to your environment variables
 */

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================
const PAYPAL_CLIENT_ID = 'AeJ3yeBXXbV5nSoh8XFFq3DyrMdpUAUCBezhhturZv1dEjG_Szdt50grNja29kuDqDLFkDuzK3DuDSHM';
const PAYPAL_SECRET = 'EMLrRz4VhbEnFS0sTlVAXyRQhzbQ8j1DchPHK7HiMv0AVxLfeJPdePtr_BDo99I0UxEACkLB3MELhWoi';
const USE_SANDBOX = true;                            // Set to false for production

// Subscription details
const PRODUCT_NAME = 'AeroScout Pro Premium';
const PRODUCT_DESCRIPTION = 'Premium access to AeroScout aviation job board with advanced features';
const PLAN_NAME = 'AeroScout Pro Monthly';
const PLAN_DESCRIPTION = 'Monthly premium subscription';
const PRICE = '9.99';  // Monthly price in USD
const CURRENCY = 'USD';

// ============================================
// SCRIPT - DO NOT MODIFY BELOW
// ============================================

const BASE_URL = USE_SANDBOX
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');

  const response = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function createProduct(accessToken) {
  console.log('Creating product...');

  const response = await fetch(`${BASE_URL}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `product-${Date.now()}`,
    },
    body: JSON.stringify({
      name: PRODUCT_NAME,
      description: PRODUCT_DESCRIPTION,
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create product: ${error}`);
  }

  const product = await response.json();
  console.log(`Product created: ${product.id}`);
  return product.id;
}

async function createPlan(accessToken, productId) {
  console.log('Creating subscription plan...');

  const response = await fetch(`${BASE_URL}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `plan-${Date.now()}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name: PLAN_NAME,
      description: PLAN_DESCRIPTION,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: {
            interval_unit: 'MONTH',
            interval_count: 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,  // 0 = infinite/until cancelled
          pricing_scheme: {
            fixed_price: {
              value: PRICE,
              currency_code: CURRENCY,
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: '0',
          currency_code: CURRENCY,
        },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create plan: ${error}`);
  }

  const plan = await response.json();
  console.log(`Plan created: ${plan.id}`);
  return plan.id;
}

async function main() {
  console.log('='.repeat(60));
  console.log('PayPal Subscription Plan Setup');
  console.log(`Environment: ${USE_SANDBOX ? 'SANDBOX' : 'PRODUCTION'}`);
  console.log('='.repeat(60));

  if (PAYPAL_CLIENT_ID === 'YOUR_SANDBOX_CLIENT_ID') {
    console.log('\nERROR: Please update PAYPAL_CLIENT_ID and PAYPAL_SECRET in this script!');
    console.log('\nTo get your credentials:');
    console.log('1. Go to https://developer.paypal.com/dashboard/applications/sandbox');
    console.log('2. Click "Create App" or select an existing app');
    console.log('3. Copy the Client ID and Secret');
    console.log('4. Paste them in this script');
    process.exit(1);
  }

  try {
    // Get access token
    console.log('\nAuthenticating with PayPal...');
    const accessToken = await getAccessToken();
    console.log('Authentication successful!');

    // Create product
    const productId = await createProduct(accessToken);

    // Create plan
    const planId = await createPlan(accessToken, productId);

    // Output results
    console.log('\n' + '='.repeat(60));
    console.log('SUCCESS! Save these values:');
    console.log('='.repeat(60));
    console.log(`\nPAYPAL_PRODUCT_ID=${productId}`);
    console.log(`PAYPAL_PLAN_ID=${planId}`);
    console.log(`\nAdd these to your Vercel environment variables along with:`);
    console.log(`PAYPAL_CLIENT_ID=${PAYPAL_CLIENT_ID}`);
    console.log(`PAYPAL_SECRET=${PAYPAL_SECRET}`);
    console.log(`PAYPAL_MODE=${USE_SANDBOX ? 'sandbox' : 'live'}`);
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

main();
