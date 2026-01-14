/**
 * Legacy checkout endpoint - Redirects to Gumroad
 *
 * This endpoint is no longer used. Checkout is now handled
 * directly via Gumroad's overlay on the client side.
 */

module.exports = async (req, res) => {
  res.status(410).json({
    error: 'This endpoint is deprecated. Checkout is now handled via Gumroad.',
    redirect: 'https://freyrsmith.gumroad.com/l/dmtwbg'
  });
};
