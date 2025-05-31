import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    // Get all active campaigns with brand information
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        brand_profiles!inner(
          company_name,
          industry,
          location
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // If creator ID is provided, check which campaigns they've already applied to
    let appliedCampaigns: string[] = [];
    if (creatorId) {
      const { data: applications } = await supabase
        .from('campaign_applications')
        .select('campaign_id')
        .eq('creator_id', creatorId);
      
      appliedCampaigns = applications?.map(app => app.campaign_id) || [];
    }

    // Add hasApplied flag to campaigns
    const campaignsWithApplicationStatus = campaigns?.map(campaign => ({
      ...campaign,
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