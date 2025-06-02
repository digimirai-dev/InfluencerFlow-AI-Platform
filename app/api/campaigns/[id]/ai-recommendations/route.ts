import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== AI Recommendations API Called ===')
    
    // Await params to fix Next.js warning
    const { id: campaignId } = await params
    
    console.log('Campaign ID:', campaignId)

    // Handle real UUID campaigns from database
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json([], { status: 200 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log('Trying RPC approach...')
    
    // Use RPC function to bypass RLS
    const { data: recommendations, error: rpcError } = await supabase
      .rpc('get_campaign_recommendations', {
        p_campaign_id: campaignId
      })

    if (rpcError) {
      console.error('RPC error:', rpcError)
      return NextResponse.json({ error: 'Failed to fetch recommendations', details: rpcError.message }, { status: 500 })
    }

    console.log('RPC success! Found recommendations:', recommendations?.length || 0)
    console.log('RPC data:', recommendations)

    if (!recommendations || recommendations.length === 0) {
      return NextResponse.json([])
    }

    // Extract unique creator IDs
    const creatorIds = Array.from(new Set(recommendations.map((r: any) => r.creator_id)))
    console.log('Creator IDs:', creatorIds)

    // Fetch creator profiles separately to join the data
    const { data: creatorProfiles, error: profilesError } = await supabase
      .from('creator_profiles')
      .select(`
        user_id,
        display_name,
        niche,
        follower_count_instagram,
        follower_count_youtube,
        follower_count_tiktok,
        engagement_rate,
        rate_per_post,
        users (
          full_name,
          avatar_url
        )
      `)
      .in('user_id', creatorIds)

    if (profilesError) {
      console.error('Error fetching creator profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch creator profiles' }, { status: 500 })
    }

    console.log('Creator profiles found:', creatorProfiles?.length || 0)
    console.log('Creator profiles data:', creatorProfiles)

    // Combine recommendations with creator profiles
    const recommendationsWithProfiles = recommendations.map((recommendation: any) => {
      const profile = creatorProfiles?.find((p: any) => p.user_id === recommendation.creator_id)
      console.log(`Matching profile for creator ${recommendation.creator_id}:`, profile ? 'FOUND' : 'NOT FOUND')
      
      return {
        ...recommendation,
        creator_profiles: profile || {
          display_name: 'Unknown Creator',
          niche: [],
          follower_count_instagram: 0,
          follower_count_youtube: 0,
          follower_count_tiktok: 0,
          engagement_rate: 0,
          rate_per_post: 0,
          users: {
            full_name: 'Unknown Creator',
            avatar_url: null
          }
        }
      }
    })

    console.log('Final recommendations with profiles:', recommendationsWithProfiles.length)
    console.log('Final data:', recommendationsWithProfiles)

    return NextResponse.json(recommendationsWithProfiles)

  } catch (error) {
    console.error('Error fetching AI recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI recommendations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 