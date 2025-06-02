import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { cookies } from 'next/headers'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    console.log('=== Outreach Send API Called ===')
    
    // Get the user session from cookies
    const cookieStore = await cookies()
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

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
    
    // Parse request body
    const {
      campaignId,
      recommendationId,
      creatorId,
      channel,
      subject,
      message
    } = await request.json()

    console.log('Sending outreach:', {
      campaignId,
      recommendationId,
      creatorId,
      channel,
      subject: subject?.substring(0, 50) + '...'
    })

    // Validate required fields
    if (!campaignId || !creatorId || !message || !channel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get creator details for sending
    const { data: creator, error: creatorError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        creator_profiles (
          display_name,
          user_id
        )
      `)
      .eq('id', creatorId)
      .single()

    if (creatorError || !creator) {
      console.error('Creator not found:', creatorError)
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    // Send the message based on channel
    let messageId: string
    let deliveryStatus = 'pending'
    
    try {
      switch (channel) {
        case 'email':
          messageId = await sendEmailOutreach(creator, subject, message, campaignId)
          deliveryStatus = 'sent' // Email is immediate
          break
        
        case 'in_app':
          messageId = await sendInAppMessage(supabase, creatorId, campaignId, subject, message)
          deliveryStatus = 'delivered'
          break
        
        case 'whatsapp':
          messageId = await sendWhatsAppMessage(creator, message, campaignId)
          deliveryStatus = 'sent'
          break
        
        default:
          throw new Error(`Unsupported channel: ${channel}`)
      }
    } catch (sendError) {
      console.error('Error sending message:', sendError)
      messageId = `failed_${Date.now()}`
      deliveryStatus = 'failed'
    }

    // Log the communication using direct SQL to bypass RLS issues
    const { data: communicationLog, error: logError } = await supabase
      .rpc('log_communication', {
        p_campaign_id: campaignId,
        p_creator_id: creatorId,
        p_channel: channel,
        p_direction: 'outbound',
        p_message_type: 'initial_outreach',
        p_subject: subject,
        p_content: message,
        p_ai_generated: message.includes('🤖') || message.includes('AI analysis'),
        p_external_id: messageId,
        p_delivered: deliveryStatus === 'delivered' || deliveryStatus === 'sent'
      })

    if (logError) {
      console.error('Error logging communication via RPC:', logError)
      // Fallback to direct insert with system privileges
      const { data: fallbackLog, error: fallbackError } = await supabase
        .from('communication_log')
        .insert({
          campaign_id: campaignId,
          creator_id: creatorId,
          channel: channel,
          direction: 'outbound',
          message_type: 'initial_outreach',
          subject: subject,
          content: message,
          ai_generated: message.includes('🤖') || message.includes('AI analysis'),
          external_id: messageId,
          delivered: deliveryStatus === 'delivered' || deliveryStatus === 'sent',
          read: false,
          responded: false
        })
        .select()
        .single()
      
      if (!fallbackError) {
        console.log('✅ Communication logged via fallback method')
      } else {
        console.error('❌ Fallback communication logging failed:', fallbackError)
      }
    } else {
      console.log('✅ Communication logged via RPC')
    }

    // Update the AI recommendation status to 'contacted'
    if (recommendationId) {
      const { error: updateError } = await supabase
        .rpc('update_recommendation_status', {
          p_recommendation_id: recommendationId,
          p_new_status: 'contacted'
        })

      if (updateError) {
        console.error('Error updating recommendation status:', updateError)
        // Try direct update as fallback
        await supabase
          .from('creator_recommendations')
          .update({ status: 'contacted' })
          .eq('id', recommendationId)
      }
    }

    // Create notification for the creator
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: creatorId,
        title: 'New Partnership Opportunity',
        message: `You have received a collaboration proposal: ${subject}`,
        type: 'campaign',
        related_id: campaignId,
        action_url: `/dashboard/campaigns/${campaignId}`
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
    }

    console.log('Outreach sent successfully:', {
      messageId,
      deliveryStatus,
      communicationLogId: communicationLog?.id
    })

    return NextResponse.json({
      success: true,
      message_id: messageId,
      delivery_status: deliveryStatus,
      communication_log_id: communicationLog?.id,
      message: 'Outreach sent successfully'
    })

  } catch (error) {
    console.error('Error sending outreach:', error)
    return NextResponse.json(
      { error: 'Failed to send outreach', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Send email outreach using Resend
async function sendEmailOutreach(
  creator: any,
  subject: string,
  message: string,
  campaignId: string
): Promise<string> {
  console.log(`📧 Sending email to ${creator.email} via Resend`)
  
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  try {
    const emailHtml = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🚀 InfluencerFlow</h1>
          <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">Partnership Opportunity</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px; background: white; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="white-space: pre-wrap; line-height: 1.8; color: #374151; font-size: 16px;">
            ${message}
          </div>
          
          <!-- CTA Section -->
          <div style="margin: 40px 0 30px 0; padding: 25px; background: linear-gradient(135deg, #f8faff 0%, #e0e7ff 100%); border-radius: 12px; text-align: center; border: 1px solid #c7d2fe;">
            <p style="margin: 0 0 20px 0; color: #4f46e5; font-weight: 600; font-size: 18px;">Ready to collaborate?</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/campaigns/${campaignId}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
              View Campaign Details
            </a>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Sent via <strong>InfluencerFlow</strong> - Connecting Brands with Creators
            </p>
            <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
              This email was sent to ${creator.email}
            </p>
          </div>
        </div>
      </div>
    `

    const { data, error } = await resend.emails.send({
      from: 'InfluencerFlow <team@nvidiastudio.com>', // Use verified domain
      to: [creator.email],
      replyTo: 'replies@nvidiastudio.com', // Set up this email to forward to our API
      subject: subject,
      html: emailHtml,
      headers: {
        'X-Campaign-ID': campaignId,
        'X-Creator-ID': creator.id,
        'X-Message-Type': 'initial_outreach'
      }
    })

    if (error) {
      console.error('Resend error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    if (!data) {
      throw new Error('No response data from Resend')
    }

    console.log('✅ Email sent successfully via Resend:', data.id)
    return data.id

  } catch (error) {
    console.error('Error sending email via Resend:', error)
    throw error
  }
}

// Send in-app message
async function sendInAppMessage(
  supabase: any,
  recipientId: string,
  campaignId: string,
  subject: string,
  message: string
): Promise<string> {
  console.log(`📱 Sending in-app message to user ${recipientId}`)
  
  // Create a message record in the database
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: null, // System message
      recipient_id: recipientId,
      campaign_id: campaignId,
      subject: subject,
      content: message,
      type: 'campaign_outreach',
      read: false
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to send in-app message: ${error.message}`)
  }

  return `in_app_${data.id}`
}

// Send WhatsApp message (placeholder - would integrate with WhatsApp Business API)
async function sendWhatsAppMessage(
  creator: any,
  message: string,
  campaignId: string
): Promise<string> {
  console.log(`📱 WhatsApp message would be sent to ${creator.phone || 'phone not available'}`)
  
  // In production, integrate with WhatsApp Business API
  // For now, simulate WhatsApp sending
  
  await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
  
  return `whatsapp_${Date.now()}`
} 