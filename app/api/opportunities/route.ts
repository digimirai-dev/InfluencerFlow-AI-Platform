import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    // Get all active campaigns
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Get brand profiles for all campaigns
    const brandIds = campaigns?.map(c => c.brand_id).filter((id, index, arr) => arr.indexOf(id) === index) || [];
    const { data: brandProfiles } = await supabase
      .from('brand_profiles')
      .select('user_id, company_name, industry, location')
      .in('user_id', brandIds);

    // Create a map for quick lookup
    const brandProfileMap = new Map();
    brandProfiles?.forEach(profile => {
      brandProfileMap.set(profile.user_id, profile);
    });

    // If creator ID is provided, check which campaigns they've already applied to
    let appliedCampaigns: string[] = [];
    if (creatorId) {
      const { data: applications } = await supabase
        .from('campaign_applications')
        .select('campaign_id')
        .eq('creator_id', creatorId);
      
      appliedCampaigns = applications?.map(app => app.campaign_id) || [];
    }

    // Transform the data to match expected structure and add hasApplied flag
    const campaignsWithApplicationStatus = campaigns?.map(campaign => ({
      ...campaign,
      brand_profiles: brandProfileMap.get(campaign.brand_id) || null,
      hasApplied: appliedCampaigns.includes(campaign.id)
    })) || [];

    return NextResponse.json(campaignsWithApplicationStatus);

  } catch (error) {
    console.error('Opportunities API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
} 