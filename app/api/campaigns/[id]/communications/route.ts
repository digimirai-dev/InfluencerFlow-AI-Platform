import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Communications API Called ===')
    
    // Await params to fix Next.js warning
    const { id: campaignId } = await params
    
    console.log('Campaign ID:', campaignId)

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json([], { status: 200 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Fetch communication logs for the campaign
    const { data: communications, error } = await supabase
      .from('communication_log')
      .select(`
        id,
        campaign_id,
        creator_id,
        channel,
        direction,
        message_type,
        subject,
        content,
        ai_generated,
        external_id,
        delivered,
        read,
        responded,
        created_at,
        users!creator_id (
          full_name,
          avatar_url
        )
      `)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching communications:', error)
      return NextResponse.json([], { status: 200 })
    }

    // Add creator names to communications
    const communicationsWithCreators = (communications || []).map(comm => ({
      ...comm,
      creator_name: (comm.users as any)?.full_name || 'Unknown Creator'
    }))

    console.log(`Found ${communicationsWithCreators.length} communications`)

    return NextResponse.json(communicationsWithCreators)

  } catch (error) {
    console.error('Error in communications API:', error)
    return NextResponse.json([], { status: 200 })
  }
} 