import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin endpoint to assign campaigns to a brand user
export async function POST(request: NextRequest) {
  try {
    // Use regular Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Server configuration error - missing Supabase credentials' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { brandEmail, campaignIds } = await request.json();

    if (!brandEmail) {
      return NextResponse.json(
        { error: 'Brand email is required' },
        { status: 400 }
      );
    }

    // Find the brand user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, user_type, email')
      .eq('email', brandEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: `Brand user not found with email: ${brandEmail}` },
        { status: 404 }
      );
    }

    if (user.user_type !== 'brand') {
      return NextResponse.json(
        { error: `User ${brandEmail} is not a brand user (type: ${user.user_type})` },
        { status: 400 }
      );
    }

    // If specific campaign IDs are provided, update those campaigns
    if (campaignIds && Array.isArray(campaignIds)) {
      const { data: updatedCampaigns, error: updateError } = await supabase
        .from('campaigns')
        .update({ brand_id: user.id })
        .in('id', campaignIds)
        .select();

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update campaigns', details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Successfully assigned ${updatedCampaigns.length} campaigns to ${brandEmail}`,
        updatedCampaigns
      });
    }

    // If no specific campaigns, create some sample campaigns for the brand
    const sampleCampaigns = [
      {
        title: 'Summer Fashion Collection Launch',
        description: 'Promote our new summer fashion line with authentic lifestyle content that resonates with young professionals.',
        status: 'active',
        budget_min: 2000,
        budget_max: 5000,
        timeline_start: '2024-06-01',
        timeline_end: '2024-07-15',
        target_audience: { description: 'Young professionals aged 25-35', niches: ['Fashion', 'Lifestyle'] },
        requirements: { niches: ['Fashion', 'Lifestyle'], list: ['Fashion & Lifestyle content', 'Minimum 50K followers', '3%+ engagement rate'] },
        deliverables: ['Instagram Reel', 'Story Series', 'Feed Post'],
        objective: 'Brand awareness and engagement',
        brand_id: user.id,
        applications_count: 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        title: 'Tech Product Launch Campaign',
        description: 'Launch campaign for our innovative productivity app targeting busy professionals and entrepreneurs.',
        status: 'active',
        budget_min: 5000,
        budget_max: 10000,
        timeline_start: '2024-06-15',
        timeline_end: '2024-08-01',
        target_audience: { description: 'Tech-savvy professionals and entrepreneurs', niches: ['Technology', 'Business'] },
        requirements: { niches: ['Technology', 'Business'], list: ['Technology content', 'Minimum 100K followers', '4%+ engagement rate'] },
        deliverables: ['App Review Video', 'Instagram Reel', 'LinkedIn Post'],
        objective: 'Product launch and user acquisition',
        brand_id: user.id,
        applications_count: 8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        title: 'Holiday Season Marketing Blitz',
        description: 'Seasonal marketing campaign to drive sales during the holiday shopping period.',
        status: 'draft',
        budget_min: 3000,
        budget_max: 7500,
        timeline_start: '2024-11-01',
        timeline_end: '2024-12-31',
        target_audience: { description: 'Holiday shoppers and gift buyers', niches: ['Lifestyle', 'Shopping'] },
        requirements: { niches: ['Lifestyle', 'Shopping'], list: ['Holiday content', 'Minimum 75K followers', '4%+ engagement rate'] },
        deliverables: ['Holiday Posts', 'Gift Guide Video', 'Stories Campaign'],
        objective: 'Holiday sales and brand visibility',
        brand_id: user.id,
        applications_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Create campaigns one by one to handle RLS policies
    const createdCampaigns = [];
    for (const campaign of sampleCampaigns) {
      try {
        const { data: createdCampaign, error: createError } = await supabase
          .from('campaigns')
          .insert(campaign)
          .select()
          .single();

        if (createError) {
          console.error(`Failed to create campaign "${campaign.title}":`, createError);
          continue;
        }

        createdCampaigns.push(createdCampaign);
      } catch (campaignError) {
        console.error(`Error creating campaign "${campaign.title}":`, campaignError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdCampaigns.length} sample campaigns for ${brandEmail}`,
      createdCampaigns,
      userId: user.id
    });

  } catch (error) {
    console.error('Admin assign campaigns error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get all campaigns and users for admin management
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get all users and campaigns
    const [usersResult, campaignsResult] = await Promise.all([
      supabase.from('users').select('id, email, user_type').order('created_at'),
      supabase.from('campaigns').select('id, title, brand_id, status').order('created_at')
    ]);

    return NextResponse.json({
      users: usersResult.data || [],
      campaigns: campaignsResult.data || []
    });

  } catch (error) {
    console.error('Admin get data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 