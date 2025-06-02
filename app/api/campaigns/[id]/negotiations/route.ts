import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Campaign Negotiations API Called ===')
    
    // Await params to fix Next.js warning
    const { id: campaignId } = await params
    
    console.log('Campaign ID:', campaignId)

    const cookieStore = await cookies()

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json([], { status: 200 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Get negotiations with related data
    const { data: negotiations, error } = await supabase
      .from('negotiations')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching negotiations:', error)
      return NextResponse.json([], { status: 200 })
    }

    console.log(`Found ${negotiations?.length || 0} negotiations`)
    
    // If we have negotiations, enrich them with related data
    if (negotiations && negotiations.length > 0) {
      // Get campaign data
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('id, campaign_name, budget_min, budget_max')
        .eq('id', campaignId)
        .single()

      // Get creator profiles
      const creatorIds = Array.from(new Set(negotiations.map(n => n.creator_id)))
      const { data: creators } = await supabase
        .from('creator_profiles')
        .select('user_id, display_name, niche, follower_count_instagram, engagement_rate, rate_per_post')
        .in('user_id', creatorIds)

      // Get communications
      const communicationIds = negotiations.map(n => n.communication_id).filter(Boolean)
      const { data: communications } = await supabase
        .from('communication_log')
        .select('id, subject, content, created_at')
        .in('id', communicationIds)

      // Enrich negotiations with related data
      const enrichedNegotiations = negotiations.map(negotiation => ({
        ...negotiation,
        campaigns: campaign,
        creator_profiles: creators?.find(c => c.user_id === negotiation.creator_id),
        communication_log: communications?.find(c => c.id === negotiation.communication_id)
      }))

      return NextResponse.json(enrichedNegotiations)
    }
    
    return NextResponse.json(negotiations || [])

  } catch (error) {
    console.error('Error in negotiations API:', error)
    return NextResponse.json([], { status: 200 })
  }
} 