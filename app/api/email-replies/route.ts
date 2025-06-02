import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Email Reply Handler Called ===')
    
    const body = await request.json()
    console.log('Email reply data:', body)

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Extract email details
    const {
      from_email,
      to_email,
      subject,
      text_content,
      html_content,
      in_reply_to, // Original message ID
      references
    } = body

    console.log('Processing reply from:', from_email)
    console.log('Subject:', subject)

    // Find the original outbound message this is replying to
    const { data: originalMessage, error: findError } = await supabase
      .from('communication_log')
      .select('*')
      .eq('external_id', in_reply_to)
      .eq('direction', 'outbound')
      .single()

    if (findError || !originalMessage) {
      console.error('Could not find original message:', findError)
      return NextResponse.json({ error: 'Original message not found' }, { status: 404 })
    }

    console.log('Found original message:', originalMessage.id)

    // Find the creator by email
    const { data: creator, error: creatorError } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('email', from_email)
      .single()

    if (creatorError || !creator) {
      console.error('Creator not found:', creatorError)
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    // Log the reply as an inbound communication
    const { data: replyLog, error: logError } = await supabase
      .rpc('log_communication', {
        p_campaign_id: originalMessage.campaign_id,
        p_creator_id: creator.id,
        p_channel: 'email',
        p_direction: 'inbound',
        p_message_type: 'general',
        p_subject: subject,
        p_content: text_content || html_content,
        p_ai_generated: false,
        p_external_id: `reply_${Date.now()}`,
        p_delivered: true
      })

    if (logError) {
      console.error('Error logging reply:', logError)
      return NextResponse.json({ error: 'Failed to log reply' }, { status: 500 })
    }

    // Mark the original message as responded
    await supabase
      .from('communication_log')
      .update({ responded: true })
      .eq('id', originalMessage.id)

    // Create notification for the brand
    await supabase
      .from('notifications')
      .insert({
        user_id: originalMessage.campaign_id, // This should be the brand user ID
        title: 'Creator Reply Received',
        message: `${creator.full_name} replied to your outreach: ${subject}`,
        type: 'communication',
        related_id: originalMessage.campaign_id,
        action_url: `/dashboard/campaigns/${originalMessage.campaign_id}?tab=communications`
      })

    console.log('✅ Email reply processed successfully')

    return NextResponse.json({ 
      success: true, 
      message: 'Reply processed successfully',
      reply_id: replyLog
    })

  } catch (error) {
    console.error('Error processing email reply:', error)
    return NextResponse.json({ error: 'Reply processing failed' }, { status: 500 })
  }
} 