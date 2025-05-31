import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';

// Set global options
setGlobalOptions({ maxInstances: 10 });

// Simple API endpoints for essential functionality
export const api = onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const path = req.path;

  try {
    // Route API requests
    if (path.startsWith('/campaigns')) {
      await handleCampaigns(req, res);
    } else if (path.startsWith('/opportunities')) {
      await handleOpportunities(req, res);
    } else if (path.startsWith('/dashboard')) {
      await handleDashboard(req, res);
    } else if (path.startsWith('/user/profile')) {
      await handleUserProfile(req, res);
    } else if (path.startsWith('/messages')) {
      await handleMessages(req, res);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Campaign handlers
async function handleCampaigns(req: any, res: any) {
  if (req.method === 'GET') {
    // Return mock campaigns for now
    const campaigns = [
      {
        id: '1',
        title: 'Summer Fashion Collection',
        description: 'Promote our new summer fashion line',
        status: 'active',
        budget_min: 2000,
        budget_max: 5000,
        applications_count: 12,
        timeline_start: '2024-06-01',
        timeline_end: '2024-07-31',
        created_at: '2024-05-15T10:00:00Z',
        brand_profiles: { company_name: 'Fashion Brand' }
      }
    ];
    res.json(campaigns);
  } else if (req.method === 'POST') {
    // Handle campaign creation
    const campaignData = req.body;
    const newCampaign = {
      id: Date.now().toString(),
      ...campaignData,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    res.status(201).json(newCampaign);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Opportunities handler
async function handleOpportunities(req: any, res: any) {
  if (req.method === 'GET') {
    const opportunities = [
      {
        id: '1',
        title: 'Tech Product Launch',
        description: 'Launch campaign for innovative tech product',
        status: 'active',
        budget_min: 5000,
        budget_max: 10000,
        applications_count: 8,
        brand_profiles: { company_name: 'Tech Company', industry: 'Technology' },
        hasApplied: false
      }
    ];
    res.json(opportunities);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Dashboard handlers
async function handleDashboard(req: any, res: any) {
  const subPath = req.path.replace('/dashboard', '');
  
  if (subPath.startsWith('/stats')) {
    res.json({
      activeCampaigns: 3,
      totalCreators: 150,
      totalSpent: 15000,
      avgROI: 4.2,
      campaigns: []
    });
  } else if (subPath.startsWith('/recent-campaigns')) {
    res.json([
      {
        id: '1',
        title: 'Summer Fashion Collection',
        status: 'active',
        budget_max: 5000,
        applications_count: 12,
        activeCollaborations: 3,
        brand_profiles: { company_name: 'Fashion Brand' }
      }
    ]);
  } else {
    res.status(404).json({ error: 'Dashboard endpoint not found' });
  }
}

// User profile handler
async function handleUserProfile(req: any, res: any) {
  if (req.method === 'GET') {
    const userId = req.path.split('/').pop();
    res.json({
      id: userId,
      email: 'user@example.com',
      full_name: 'User Name',
      user_type: 'brand',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Messages handler
async function handleMessages(req: any, res: any) {
  if (req.method === 'GET') {
    res.json([]);
  } else if (req.method === 'POST') {
    res.status(201).json({ success: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 