import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType');

    if (!userId || !userType) {
      return NextResponse.json(
        [],
        { status: 200 }
      );
    }

    // Handle demo user for development
    if (userId === 'demo-user-id') {
      const mockCampaigns = [
        {
          id: 'demo-campaign-1',
          title: 'Summer Fashion Collection',
          description: 'Promote our new summer fashion line with authentic lifestyle content',
          status: 'active',
          budget_min: 2000,
          budget_max: 5000,
          applications_count: 12,
          timeline_start: '2024-06-01',
          timeline_end: '2024-07-31',
          created_at: '2024-05-15T10:00:00Z',
          brand_profiles: { company_name: 'Demo Fashion Brand' },
          activeCollaborations: 3,
          totalCollaborations: 5
        },
        {
          id: 'demo-campaign-2',
          title: 'Tech Product Launch',
          description: 'Launch campaign for our innovative tech product',
          status: 'active',
          budget_min: 5000,
          budget_max: 10000,
          applications_count: 8,
          timeline_start: '2024-06-15',
          timeline_end: '2024-08-15',
          created_at: '2024-05-20T10:00:00Z',
          brand_profiles: { company_name: 'Demo Tech Company' },
          activeCollaborations: 2,
          totalCollaborations: 3
        }
      ];
      return NextResponse.json(mockCampaigns);
    }

    let query = supabase
      .from('campaigns')
      .select(`
        id,
        title,
        description,
        status,
        budget_min,
        budget_max,
        applications_count,
        timeline_start,
        timeline_end,
        created_at,
        brand_profiles!inner(company_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (userType === 'brand') {
      query = query.eq('brand_id', userId);
    }

    const { data: campaigns, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json([], { status: 200 });
    }

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // For each campaign, get collaboration count
    const campaignsWithStats = await Promise.all(
      campaigns.map(async (campaign) => {
        try {
          const { data: collaborations } = await supabase
            .from('collaborations')
            .select('id, status')
            .eq('campaign_id', campaign.id);

          const activeCollaborations = collaborations?.filter(c => c.status === 'active').length || 0;

          return {
            ...campaign,
            activeCollaborations,
            totalCollaborations: collaborations?.length || 0
          };
        } catch (collabError) {
          console.error('Error fetching collaborations for campaign:', campaign.id, collabError);
          return {
            ...campaign,
            activeCollaborations: 0,
            totalCollaborations: 0
          };
        }
      })
    );

    return NextResponse.json(campaignsWithStats);

  } catch (error) {
    console.error('Recent campaigns error:', error);
    return NextResponse.json([], { status: 200 });
  }
} 