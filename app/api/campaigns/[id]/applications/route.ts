import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to check if a string is a valid UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Mock applications data for demo campaigns
function getMockApplications(campaignId: string) {
  const mockApplications: { [key: string]: any[] } = {
    'demo-campaign-1': [
      {
        id: 'app-1',
        status: 'pending',
        proposal_message: 'I love your fashion brand and would be excited to create authentic content showcasing your summer collection. My audience aligns perfectly with your target demographic.',
        proposed_rate: 1500,
        submitted_at: '2024-05-25T10:00:00Z',
        creator_profiles: {
          display_name: 'Sarah Fashion',
          bio: 'Fashion & lifestyle content creator',
          follower_count_instagram: 85000,
          follower_count_youtube: 12000,
          engagement_rate: 4.2,
          rate_per_post: 1200,
          niche: ['Fashion', 'Lifestyle', 'Beauty'],
          location: 'Los Angeles, CA',
          users: {
            full_name: 'Sarah Johnson',
            avatar_url: null
          }
        }
      },
      {
        id: 'app-2',
        status: 'accepted',
        proposal_message: 'Your summer collection looks amazing! I specialize in creating engaging fashion content that drives sales. Let me help you reach more customers.',
        proposed_rate: 2000,
        submitted_at: '2024-05-23T14:30:00Z',
        creator_profiles: {
          display_name: 'Style Maven',
          bio: 'Fashion influencer and stylist',
          follower_count_instagram: 120000,
          follower_count_youtube: 25000,
          engagement_rate: 5.1,
          rate_per_post: 1800,
          niche: ['Fashion', 'Style', 'Shopping'],
          location: 'New York, NY',
          users: {
            full_name: 'Emma Rodriguez',
            avatar_url: null
          }
        }
      }
    ],
    'demo-campaign-2': [
      {
        id: 'app-3',
        status: 'pending',
        proposal_message: 'As a tech reviewer with a focus on productivity tools, I would love to create an in-depth review of your app. My audience is always looking for tools to improve their workflow.',
        proposed_rate: 3000,
        submitted_at: '2024-05-28T09:15:00Z',
        creator_profiles: {
          display_name: 'Tech Reviewer Pro',
          bio: 'Technology reviewer and productivity expert',
          follower_count_instagram: 95000,
          follower_count_youtube: 180000,
          engagement_rate: 6.8,
          rate_per_post: 2500,
          niche: ['Technology', 'Productivity', 'Apps'],
          location: 'Austin, TX',
          users: {
            full_name: 'Alex Chen',
            avatar_url: null
          }
        }
      }
    ]
  };

  return mockApplications[campaignId] || [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params to fix Next.js warning
    const { id: campaignId } = await params
    console.log('Fetching applications for campaign:', campaignId);

    // Check if this is a demo campaign (not a valid UUID)
    if (!isValidUUID(campaignId)) {
      const mockApplications = getMockApplications(campaignId);
      console.log(`Returning ${mockApplications.length} mock applications for demo campaign`);
      return NextResponse.json(mockApplications);
    }

    // Handle real UUID campaigns from database
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json([], { status: 200 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // First fetch applications
    const { data: applications, error: appError } = await supabase
      .from('campaign_applications')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('submitted_at', { ascending: false });

    if (appError) {
      console.error('Error fetching applications:', appError);
      return NextResponse.json([], { status: 200 });
    }

    console.log(`Found ${applications?.length || 0} applications`);

    if (!applications || applications.length === 0) {
      return NextResponse.json([]);
    }

    // Get creator IDs
    const creatorIds = applications.map(app => app.creator_id);
    console.log('Looking up creator IDs:', creatorIds);

    // Fetch creator profiles
    const { data: creatorProfiles, error: creatorError } = await supabase
      .from('creator_profiles')
      .select('*')
      .in('user_id', creatorIds);

    if (creatorError) {
      console.error('Error fetching creator profiles:', creatorError);
    } else {
      console.log(`Found ${creatorProfiles?.length || 0} creator profiles`);
    }

    // Fetch user data
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', creatorIds);

    if (userError) {
      console.error('Error fetching users:', userError);
    } else {
      console.log(`Found ${users?.length || 0} users`);
    }

    // Combine the data
    const processedApplications = applications.map(app => {
      const creatorProfile = creatorProfiles?.find(cp => cp.user_id === app.creator_id);
      const user = users?.find(u => u.id === app.creator_id);

      return {
        ...app,
        creator_profiles: {
          ...creatorProfile,
          niche: creatorProfile?.niche || [],
          users: user || {
            full_name: 'Unknown User',
            avatar_url: null
          }
        }
      };
    });

    console.log(`Returning ${processedApplications.length} processed applications`);
    return NextResponse.json(processedApplications);

  } catch (error) {
    console.error('Applications API error:', error);
    return NextResponse.json([], { status: 200 });
  }
} 