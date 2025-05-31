import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to check if a string is a valid UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Mock campaign data for demo campaigns
function getMockCampaign(campaignId: string) {
  const mockCampaigns: { [key: string]: any } = {
    'demo-campaign-1': {
      id: 'demo-campaign-1',
      title: 'Summer Fashion Collection',
      description: 'Promote our new summer fashion line with authentic lifestyle content that resonates with young professionals.',
      status: 'active',
      budget_min: 2000,
      budget_max: 5000,
      timeline_start: '2024-06-01',
      timeline_end: '2024-07-15',
      requirements: ['Fashion & Lifestyle content', 'Minimum 50K followers', '3%+ engagement rate'],
      target_audience: 'Young professionals aged 25-35',
      deliverables: ['Instagram Reel', 'Story Series', 'Feed Post'],
      applications_count: 12,
      created_at: '2024-05-15T10:00:00Z',
      brand_profiles: {
        company_name: 'FashionCo',
        industry: 'Fashion & Retail',
        location: 'New York, NY',
        website: 'https://fashionco.com',
        description: 'Leading fashion brand focused on sustainable and trendy clothing for modern professionals.'
      }
    },
    'demo-campaign-2': {
      id: 'demo-campaign-2',
      title: 'Tech Product Launch',
      description: 'Launch campaign for our innovative productivity app targeting busy professionals and entrepreneurs.',
      status: 'active',
      budget_min: 5000,
      budget_max: 10000,
      timeline_start: '2024-06-15',
      timeline_end: '2024-08-01',
      requirements: ['Technology content', 'Minimum 100K followers', '4%+ engagement rate'],
      target_audience: 'Tech-savvy professionals and entrepreneurs',
      deliverables: ['App Review Video', 'Instagram Reel', 'LinkedIn Post'],
      applications_count: 8,
      created_at: '2024-05-20T14:30:00Z',
      brand_profiles: {
        company_name: 'TechStartup Inc.',
        industry: 'Technology',
        location: 'San Francisco, CA',
        website: 'https://techstartup.com',
        description: 'Innovative tech company developing cutting-edge mobile applications and AI solutions.'
      }
    }
  };

  return mockCampaigns[campaignId] || null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;

    // Check if this is a demo campaign (not a valid UUID)
    if (!isValidUUID(campaignId)) {
      const mockCampaign = getMockCampaign(campaignId);
      if (mockCampaign) {
        return NextResponse.json(mockCampaign);
      } else {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
    }

    // Handle real UUID campaigns from database
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // First, fetch the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error('Error fetching campaign:', campaignError);
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Then fetch the brand profile
    const { data: brandProfile, error: brandError } = await supabase
      .from('brand_profiles')
      .select('company_name, industry, location, website, description')
      .eq('user_id', campaign.brand_id)
      .single();

    if (brandError) {
      console.error('Error fetching brand profile:', brandError);
    }

    // Process the campaign data to match the expected structure
    const processedCampaign = {
      ...campaign,
      requirements: Array.isArray(campaign.requirements) ? campaign.requirements : 
                   campaign.requirements?.niches || [],
      deliverables: Array.isArray(campaign.deliverables) ? campaign.deliverables : [],
      target_audience: typeof campaign.target_audience === 'string' ? 
                      campaign.target_audience : 
                      campaign.target_audience?.location || 'General audience',
      brand_profiles: brandProfile || {
        company_name: 'Unknown Company',
        industry: 'Unknown',
        location: 'Unknown',
        website: '',
        description: ''
      }
    };

    return NextResponse.json(processedCampaign);

  } catch (error) {
    console.error('Campaign API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 