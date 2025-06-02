import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Email Reply Webhook Called ===')
    
    // Parse the webhook payload from Resend
    const payload = await request.json()
    console.log('Webhook payload:', payload)

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Extract email data from webhook payload
    const {
      from,
      to,
      subject,
      text,
      html,
      'message-id': messageId,
      'in-reply-to': inReplyTo
    } = payload

    console.log('Email reply received from:', from)
    console.log('Subject:', subject)

    // Try to find the original outbound message this is replying to
    const { data: originalMessage, error: findError } = await supabase
      .from('communication_log')
      .select(`
        id,
        campaign_id,
        creator_id,
        external_id,
        subject
      `)
      .eq('direction', 'outbound')
      .eq('channel', 'email')
      .or(`external_id.eq.${inReplyTo},subject.ilike.%${subject?.replace('Re: ', '').replace('RE: ', '')}%`)
      .single()

    if (findError || !originalMessage) {
      console.error('Could not find original message:', findError)
      // Still log the reply, but without campaign context
      const { error: logError } = await supabase
        .from('communication_log')
        .insert({
          campaign_id: null,
          creator_id: null,
          channel: 'email',
          direction: 'inbound',
          message_type: 'reply',
          subject: subject,
          content: text || html,
          ai_generated: false,
          external_id: messageId,
          delivered: true,
          read: false,
          responded: false
        })

      if (logError) {
        console.error('Error logging orphaned email reply:', logError)
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Email received but could not match to original campaign' 
      })
    }

    // Log the email reply in the communication_log
    const { data: replyLog, error: logError } = await supabase
      .from('communication_log')
      .insert({
        campaign_id: originalMessage.campaign_id,
        creator_id: originalMessage.creator_id,
        channel: 'email',
        direction: 'inbound',
        message_type: 'reply',
        subject: subject,
        content: text || html,
        ai_generated: false,
        external_id: messageId,
        delivered: true,
        read: false,
        responded: false
      })
      .select()
      .single()

    if (logError) {
      console.error('Error logging email reply:', logError)
      return NextResponse.json({ error: 'Failed to log email reply' }, { status: 500 })
    }

    // Update the original message to mark it as responded
    await supabase
      .from('communication_log')
      .update({ responded: true })
      .eq('id', originalMessage.id)

    // Update the AI recommendation status if applicable
    if (originalMessage.campaign_id && originalMessage.creator_id) {
      await supabase
        .from('creator_recommendations')
        .update({ status: 'responded' })
        .eq('campaign_id', originalMessage.campaign_id)
        .eq('creator_id', originalMessage.creator_id)
    }

    // Create notification for the brand
    if (originalMessage.campaign_id) {
      // Get campaign owner
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('brand_id')
        .eq('id', originalMessage.campaign_id)
        .single()

      if (campaign) {
        await supabase
          .from('notifications')
          .insert({
            user_id: campaign.brand_id,
            title: 'Creator Response Received',
            message: `A creator has responded to your campaign outreach: ${subject}`,
            type: 'communication',
            related_id: originalMessage.campaign_id,
            action_url: `/dashboard/campaigns/${originalMessage.campaign_id}?tab=communications`
          })
      }
    }

    console.log('✅ Email reply logged successfully:', replyLog.id)

    return NextResponse.json({
      success: true,
      message: 'Email reply processed successfully',
      communication_log_id: replyLog.id
    })

  } catch (error) {
    console.error('Error processing email reply webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process email reply', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 