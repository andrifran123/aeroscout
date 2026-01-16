/**
 * Job Count API Endpoint
 *
 * Returns the current count of jobs from the verified_jobs table
 * Supports CORS for frontend requests
 *
 * Environment variables required:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY)
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://ziboktbmbyjbhifsdypa.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get job type from query parameter (default to 'pilot')
    const jobType = req.query.type || 'pilot';
    const tableName = jobType === 'cabin_crew' ? 'verified_cabin_crew_jobs' : 'verified_jobs';

    // Get count of all jobs in the appropriate table
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching job count:', error);
      return res.status(500).json({
        error: 'Failed to fetch job count',
        details: error.message
      });
    }

    // Get current GMT time
    const now = new Date();
    const gmtTime = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'GMT'
    }) + ' GMT';

    // Return the count and time
    return res.status(200).json({
      count: count || 0,
      gmtTime: gmtTime,
      timestamp: now.toISOString(),
      jobType: jobType
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
};
