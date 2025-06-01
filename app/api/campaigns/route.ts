import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the authenticated user first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // If no user is found, try to get session as fallback (like in profile API)
    if (!user || authError) {
      console.log('No user from getUser, trying getSession as fallback');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('No session found either, returning unauthorized');
        console.error('Authentication error:', authError);
        return NextResponse.json(
          { error: 'Unauthorized - please log in' },
          { status: 401 }
        );
      }

      console.log('Using session user for authentication');
      // Use session user if getUser failed but session exists
      return await createCampaignForUser(supabase, session.user, request);
    }

    console.log('Authentication successful with user:', user.email);
    return await createCampaignForUser(supabase, user, request);

  } catch (error) {
    console.error('Campaign creation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createCampaignForUser(supabase: any, user: any, request: NextRequest) {
  const {
    title,
    description,
    budget_min,
    budget_max,
    timeline_start,
    timeline_end,
    target_audience,
    requirements,
    deliverables,
    niches,
    brand_id
  } = await request.json();

  // Ensure the brand_id matches the authenticated user
  if (brand_id !== user.id) {
    console.error('Brand ID mismatch:', { brand_id, user_id: user.id });
    return NextResponse.json(
      { error: 'Forbidden - can only create campaigns for your own brand' },
      { status: 403 }
    );
  }

  // Verify the user is a brand
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (profileError || !userProfile || userProfile.user_type !== 'brand') {
    console.error('User type verification failed:', profileError);
    return NextResponse.json(
      { error: 'Only brand users can create campaigns' },
      { status: 403 }
    );
  }

  // Validate required fields
  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json(
      { error: 'Title and description are required' },
      { status: 400 }
    );
  }

  if (!budget_min || !budget_max || budget_min <= 0 || budget_max <= 0 || budget_min > budget_max) {
    return NextResponse.json(
      { error: 'Valid budget range is required' },
      { status: 400 }
    );
  }

  if (!timeline_start || !timeline_end) {
    return NextResponse.json(
      { error: 'Campaign timeline is required' },
      { status: 400 }
    );
  }

  if (new Date(timeline_start) >= new Date(timeline_end)) {
    return NextResponse.json(
      { error: 'End date must be after start date' },
      { status: 400 }
    );
  }

  // Create the campaign - the RLS policy will now work because auth.uid() = brand_id
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .insert({
      title: title.trim(),
      description: description.trim(),
      status: 'active',
      budget_min: Number(budget_min),
      budget_max: Number(budget_max),
      timeline_start,
      timeline_end,
      target_audience: {
        description: target_audience,
        niches: niches || []
      },
      requirements: {
        niches: niches || [],
        list: requirements || []
      },
      deliverables: deliverables || [],
      brand_id: user.id, // Use the authenticated user's ID
      objective: 'Brand awareness and engagement', // Add default objective
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (campaignError) {
    console.error('Error creating campaign:', campaignError);
    return NextResponse.json(
      { error: 'Failed to create campaign', details: campaignError.message },
      { status: 500 }
    );
  }

  console.log('Campaign created successfully:', campaign.id);
  return NextResponse.json(campaign, { status: 201 });
}

export async function GET(request: NextRequest) {
  try {
    // Check Supabase configuration
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json([], { status: 200 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Get campaigns
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      return NextResponse.json([], { status: 200 });
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

    // Transform the data to match expected structure
    const transformedCampaigns = campaigns?.map(campaign => ({
      ...campaign,
      brand_profiles: brandProfileMap.get(campaign.brand_id) || null
    })) || [];

    return NextResponse.json(transformedCampaigns);

  } catch (error) {
    console.error('Campaigns API error:', error);
    return NextResponse.json([], { status: 200 });
  }
} 