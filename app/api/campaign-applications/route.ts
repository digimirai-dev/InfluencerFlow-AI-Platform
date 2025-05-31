import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { campaign_id, proposal_text, proposed_rate } = await request.json();

    if (!campaign_id || !proposal_text) {
      return NextResponse.json(
        { error: 'Campaign ID and proposal text are required' },
        { status: 400 }
      );
    }

    // Check if user has already applied to this campaign
    const { data: existingApplication } = await supabase
      .from('campaign_applications')
      .select('id')
      .eq('campaign_id', campaign_id)
      .eq('creator_id', user.id)
      .single();

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied to this campaign' },
        { status: 400 }
      );
    }

    // Create the application
    const { data: application, error } = await supabase
      .from('campaign_applications')
      .insert({
        campaign_id,
        creator_id: user.id,
        proposal_text,
        proposed_rate,
        status: 'pending'
      })
      .select(`
        *,
        campaigns(title, brand_id),
        creator_profiles(display_name)
      `)
      .single();

    if (error) {
      throw error;
    }

    // Update campaign applications count
    await supabase.rpc('increment_applications_count', {
      campaign_id: campaign_id
    });

    return NextResponse.json(application);

  } catch (error) {
    console.error('Campaign application error:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const campaignId = searchParams.get('campaignId');

    let query = supabase
      .from('campaign_applications')
      .select(`
        *,
        campaigns(
          title,
          description,
          budget_min,
          budget_max,
          timeline_start,
          timeline_end,
          brand_profiles(company_name)
        ),
        creator_profiles(
          display_name,
          users(full_name, avatar_url)
        )
      `)
      .order('created_at', { ascending: false });

    if (creatorId) {
      query = query.eq('creator_id', creatorId);
    }

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data: applications, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(applications || []);

  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
} 