import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to check if a string is a valid UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Mock collaborations data for demo campaigns
function getMockCollaborations(campaignId: string) {
  const mockCollaborations: { [key: string]: any[] } = {
    'demo-campaign-1': [
      {
        id: 'collab-1',
        status: 'active',
        agreed_rate: 2000,
        start_date: '2024-06-01',
        end_date: '2024-07-15',
        deliverables_completed: 2,
        total_deliverables: 3,
        creator_profiles: {
          display_name: 'Style Maven',
          users: {
            full_name: 'Emma Rodriguez',
            avatar_url: null
          }
        }
      }
    ],
    'demo-campaign-2': [
      {
        id: 'collab-2',
        status: 'active',
        agreed_rate: 3000,
        start_date: '2024-06-15',
        end_date: '2024-08-01',
        deliverables_completed: 1,
        total_deliverables: 3,
        creator_profiles: {
          display_name: 'Tech Reviewer Pro',
          users: {
            full_name: 'Alex Chen',
            avatar_url: null
          }
        }
      }
    ]
  };

  return mockCollaborations[campaignId] || [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    console.log('Fetching collaborations for campaign:', campaignId);

    // Check if this is a demo campaign (not a valid UUID)
    if (!isValidUUID(campaignId)) {
      const mockCollaborations = getMockCollaborations(campaignId);
      console.log(`Returning ${mockCollaborations.length} mock collaborations for demo campaign`);
      return NextResponse.json(mockCollaborations);
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

    // First fetch collaborations
    const { data: collaborations, error: collabError } = await supabase
      .from('collaborations')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (collabError) {
      console.error('Error fetching collaborations:', collabError);
      return NextResponse.json([], { status: 200 });
    }

    console.log(`Found ${collaborations?.length || 0} collaborations`);

    if (!collaborations || collaborations.length === 0) {
      return NextResponse.json([]);
    }

    // Get creator IDs
    const creatorIds = collaborations.map(collab => collab.creator_id);
    console.log('Looking up creator IDs:', creatorIds);

    // Fetch creator profiles
    const { data: creatorProfiles, error: creatorError } = await supabase
      .from('creator_profiles')
      .select('user_id, display_name')
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
    const processedCollaborations = collaborations.map(collab => {
      const creatorProfile = creatorProfiles?.find(cp => cp.user_id === collab.creator_id);
      const user = users?.find(u => u.id === collab.creator_id);

      return {
        ...collab,
        creator_profiles: {
          display_name: creatorProfile?.display_name || 'Unknown Creator',
          users: user || {
            full_name: 'Unknown User',
            avatar_url: null
          }
        }
      };
    });

    console.log(`Returning ${processedCollaborations.length} processed collaborations`);
    return NextResponse.json(processedCollaborations);

  } catch (error) {
    console.error('Collaborations API error:', error);
    return NextResponse.json([], { status: 200 });
  }
} 