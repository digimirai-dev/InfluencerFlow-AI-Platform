import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to check if a string is a valid UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Mock campaigns data for demo
function getMockCampaignData(campaignId: string) {
  const mockCampaigns: { [key: string]: any } = {
    'demo-campaign-1': {
      id: 'demo-campaign-1',
      title: 'Summer Fashion Collection',
      description: 'Looking for fashion influencers to showcase our new summer collection. We want authentic content that resonates with young adults aged 18-25.',
      status: 'active',
      budget_min: 1000,
      budget_max: 3000,
      timeline_start: '2024-06-01',
      timeline_end: '2024-08-31',
      requirements: ['Fashion content', 'Instagram posts', 'Stories'],
      target_audience: 'Young adults 18-25',
      deliverables: ['2 Instagram posts', '5 stories', '1 reel'],
      applications_count: 15,
      created_at: '2024-05-20T10:00:00Z',
      brand_profiles: {
        company_name: 'TrendyWear Co.',
        industry: 'Fashion',
        location: 'New York, NY',
        website: 'https://trendywear.com',
        description: 'Trendy fashion brand for young professionals'
      }
    },
    'demo-campaign-2': {
      id: 'demo-campaign-2',
      title: 'Tech Product Launch',
      description: 'Launching our new productivity app and need tech reviewers to create honest reviews and tutorials.',
      status: 'active',
      budget_min: 2000,
      budget_max: 5000,
      timeline_start: '2024-06-15',
      timeline_end: '2024-09-15',
      requirements: ['Tech knowledge', 'YouTube videos', 'App reviews'],
      target_audience: 'Tech enthusiasts 25-40',
      deliverables: ['1 review video', '2 tutorial videos', 'Instagram posts'],
      applications_count: 8,
      created_at: '2024-05-22T14:30:00Z',
      brand_profiles: {
        company_name: 'ProductiveTech Inc.',
        industry: 'Technology',
        location: 'San Francisco, CA',
        website: 'https://productivetech.com',
        description: 'Innovative productivity tools for modern professionals'
      }
    }
  };

  return mockCampaigns[campaignId] || null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params to fix Next.js warning
    const { id: campaignId } = await params
    console.log('Fetching campaign:', campaignId);

    // Check if this is a demo campaign (not a valid UUID)
    if (!isValidUUID(campaignId)) {
      const mockCampaign = getMockCampaignData(campaignId);
      if (mockCampaign) {
        console.log('Returning mock campaign data');
        return NextResponse.json(mockCampaign);
      } else {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
    }

    // Handle real UUID campaigns from database
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Fetch the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError) {
      console.error('Error fetching campaign:', campaignError);
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Fetch brand profile separately
    const { data: brandProfile, error: brandError } = await supabase
      .from('brand_profiles')
      .select('company_name, industry, location, website, description')
      .eq('user_id', campaign.brand_id)
      .single();

    if (brandError) {
      console.error('Error fetching brand profile:', brandError);
    }

    // Combine the data
    const processedCampaign = {
      ...campaign,
      brand_profiles: brandProfile || {
        company_name: 'Unknown Company',
        industry: 'Unknown',
        location: 'Unknown',
        website: '',
        description: ''
      }
    };

    console.log('Campaign found:', campaign.title);
    return NextResponse.json(processedCampaign);

  } catch (error) {
    console.error('Campaign API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 