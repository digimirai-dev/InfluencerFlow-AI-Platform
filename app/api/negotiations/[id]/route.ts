import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Get Negotiation API Called ===')
    
    const { id: negotiationId } = await params
    const cookieStore = await cookies()
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Get negotiation with all related data
    const { data: negotiation, error } = await supabase
      .from('negotiations')
      .select(`
        *,
        campaigns!campaign_id (id, title, budget_min, budget_max),
        users!creator_id (id, full_name, email),
        communication_log!communication_id (id, subject, content, created_at)
      `)
      .eq('id', negotiationId)
      .single()

    if (error || !negotiation) {
      console.error('Negotiation not found:', error)
      return NextResponse.json({ error: 'Negotiation not found' }, { status: 404 })
    }

    // Get creator profile separately
    if (negotiation.creator_id) {
      const { data: creatorProfile } = await supabase
        .from('creator_profiles')
        .select('user_id, display_name, niche, follower_count_instagram, engagement_rate, rate_per_post')
        .eq('user_id', negotiation.creator_id)
        .single()
      
      negotiation.creator_profiles = creatorProfile
    }

    // Get negotiation rounds separately if the table exists
    const { data: rounds } = await supabase
      .from('negotiation_rounds')
      .select('*')
      .eq('negotiation_id', negotiationId)
      .order('round_number', { ascending: true })

    // Add rounds to the negotiation object
    negotiation.negotiation_rounds = rounds || []

    return NextResponse.json(negotiation)

  } catch (error) {
    console.error('Error fetching negotiation:', error)
    return NextResponse.json({ error: 'Failed to fetch negotiation' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Update Negotiation API Called ===')
    
    const { id: negotiationId } = await params
    const cookieStore = await cookies()
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const updates = await request.json()

    // Update negotiation
    const { data: updatedNegotiation, error } = await supabase
      .from('negotiations')
      .update(updates)
      .eq('id', negotiationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating negotiation:', error)
      return NextResponse.json({ error: 'Failed to update negotiation' }, { status: 500 })
    }

    return NextResponse.json(updatedNegotiation)

  } catch (error) {
    console.error('Error updating negotiation:', error)
    return NextResponse.json({ error: 'Failed to update negotiation' }, { status: 500 })
  }
} 