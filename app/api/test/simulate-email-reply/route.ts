import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Simulating Email Reply ===')
    
    // Get the user session from cookies
    const cookieStore = await cookies()
    
    const { campaignId, creatorId, subject, message } = await request.json()

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Get auth token from cookies
    let authToken = null
    try {
      const tokenCookie = cookieStore.get('sb-pmegrknwfnntlosiwfcp-auth-token')
      if (tokenCookie?.value) {
        const parsed = JSON.parse(tokenCookie.value)
        authToken = parsed[0]
      }
    } catch (e) {
      // Try alternative cookie format
      const tokenCookie0 = cookieStore.get('sb-pmegrknwfnntlosiwfcp-auth-token.0')
      const tokenCookie1 = cookieStore.get('sb-pmegrknwfnntlosiwfcp-auth-token.1')
      
      if (tokenCookie0?.value && tokenCookie1?.value) {
        try {
          const combined = tokenCookie0.value + tokenCookie1.value
          const parsed = JSON.parse(combined)
          authToken = parsed.access_token
        } catch (parseError) {
          console.error('Failed to parse auth token:', parseError)
        }
      }
    }

    if (!authToken) {
      console.error('No auth token found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Set the auth token for this request
    await supabase.auth.setSession({
      access_token: authToken,
      refresh_token: '' // Not needed for this operation
    })

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('User authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.email)
    console.log('Simulating reply for campaign:', campaignId, 'creator:', creatorId)

    // Find the original outbound message
    const { data: originalMessage, error: findError } = await supabase
      .from('communication_log')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('creator_id', creatorId)
      .eq('direction', 'outbound')
      .eq('channel', 'email')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (findError || !originalMessage) {
      console.error('Could not find original outbound message:', findError)
      console.error('Search params:', { campaignId, creatorId })
      return NextResponse.json({ error: 'Original message not found' }, { status: 404 })
    }

    console.log('Found original message:', originalMessage.id)

    // Log the simulated email reply using RPC to bypass RLS issues
    const { data: replyLog, error: logError } = await supabase
      .rpc('log_communication', {
        p_campaign_id: campaignId,
        p_creator_id: creatorId,
        p_channel: 'email',
        p_direction: 'inbound',
        p_message_type: 'reply',
        p_subject: subject,
        p_content: message,
        p_ai_generated: false,
        p_external_id: `simulated_${Date.now()}`,
        p_delivered: true
      })

    let communicationLogId = replyLog?.id

    if (logError) {
      console.error('Error logging simulated reply via RPC:', logError)
      // Fallback to direct insert
      const { data: fallbackLog, error: fallbackError } = await supabase
        .from('communication_log')
        .insert({
          campaign_id: campaignId,
          creator_id: creatorId,
          channel: 'email',
          direction: 'inbound',
          message_type: 'reply',
          subject: subject,
          content: message,
          ai_generated: false,
          external_id: `simulated_${Date.now()}`,
          delivered: true,
          read: false,
          responded: false
        })
        .select()
        .single()
      
      if (fallbackError) {
        console.error('Fallback insert also failed:', fallbackError)
        return NextResponse.json({ error: 'Failed to log reply' }, { status: 500 })
      }
      
      communicationLogId = fallbackLog.id
      console.log('Successfully logged reply via fallback:', fallbackLog.id)
    } else {
      console.log('Successfully logged reply via RPC:', replyLog?.id)
    }

    // Update the original message to mark it as responded
    await supabase
      .from('communication_log')
      .update({ responded: true })
      .eq('id', originalMessage.id)

    // Update AI recommendation status
    await supabase
      .from('creator_recommendations')
      .update({ status: 'responded' })
      .eq('campaign_id', campaignId)
      .eq('creator_id', creatorId)

    console.log('✅ Simulated email reply logged successfully')

    return NextResponse.json({
      success: true,
      message: 'Email reply simulated successfully',
      communication_log_id: communicationLogId
    })

  } catch (error) {
    console.error('Error simulating email reply:', error)
    return NextResponse.json(
      { error: 'Failed to simulate email reply', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 