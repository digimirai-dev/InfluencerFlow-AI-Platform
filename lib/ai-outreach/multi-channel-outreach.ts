import { createClient } from '@supabase/supabase-js'
import { generateContent } from '../openai'

/**
 * Multi-Channel AI Outreach System
 * Handles email, phone, SMS, WhatsApp, and in-app messaging
 */

interface OutreachConfig {
  campaign_id: string
  creator_id: string
  channel: 'email' | 'phone' | 'in_app' | 'whatsapp' | 'sms'
  message_type: 'initial_outreach' | 'follow_up' | 'negotiation'
  context: {
    brand_name: string
    campaign_title: string
    recommended_budget: number
    deliverables: string[]
    timeline: string
  }
}

interface CreatorContact {
  id: string
  handle: string
  email?: string
  phone?: string
  preferred_contact_method: string
  name: string
  niche: string[]
  follower_count: number
}

/**
 * Main Outreach Orchestrator
 */
export class AIOutreachSystem {
  private supabase: any
  
  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Execute multi-channel outreach for a creator
   */
  async executeOutreach(config: OutreachConfig): Promise<{
    success: boolean
    channels_used: string[]
    message_ids: string[]
  }> {
    try {
      // Get creator contact information
      const creator = await this.getCreatorContact(config.creator_id)
      
      if (!creator) {
        throw new Error('Creator not found')
      }

      const results = {
        success: true,
        channels_used: [] as string[],
        message_ids: [] as string[]
      }

      // Determine channels to use based on availability and preference
      const channels = this.determineChannels(creator, config.channel)
      
      // Execute outreach on each channel
      for (const channel of channels) {
        try {
          const messageId = await this.sendMessage(channel, creator, config)
          results.channels_used.push(channel)
          results.message_ids.push(messageId)
          
          // Log communication
          await this.logCommunication({
            campaign_id: config.campaign_id,
            creator_id: config.creator_id,
            channel,
            message_type: config.message_type,
            external_id: messageId,
            delivered: true
          })
          
        } catch (error) {
          console.error(`Failed to send via ${channel}:`, error)
          // Continue with other channels
        }
      }

      return results

    } catch (error) {
      console.error('Outreach execution error:', error)
      return {
        success: false,
        channels_used: [],
        message_ids: []
      }
    }
  }

  /**
   * Get creator contact information
   */
  private async getCreatorContact(creatorId: string): Promise<CreatorContact | null> {
    const { data } = await this.supabase
      .from('creators')
      .select(`
        id, handle, email, phone, preferred_contact_method,
        niche, follower_count,
        users!inner(full_name, email)
      `)
      .eq('id', creatorId)
      .single()

    if (!data) return null

    return {
      id: data.id,
      handle: data.handle,
      email: data.email || data.users.email,
      phone: data.phone,
      preferred_contact_method: data.preferred_contact_method,
      name: data.users.full_name || data.handle,
      niche: data.niche,
      follower_count: data.follower_count
    }
  }

  /**
   * Determine which channels to use for outreach
   */
  private determineChannels(creator: CreatorContact, requestedChannel?: string): string[] {
    const available = []
    
    if (creator.email) available.push('email')
    if (creator.phone) available.push('phone', 'sms', 'whatsapp')
    available.push('in_app') // Always available
    
    if (requestedChannel && available.includes(requestedChannel)) {
      return [requestedChannel]
    }
    
    // Use preferred method + backup
    const preferred = creator.preferred_contact_method
    const channels = [preferred]
    
    if (preferred !== 'email' && available.includes('email')) {
      channels.push('email')
    }
    if (preferred !== 'in_app') {
      channels.push('in_app')
    }
    
    return channels.filter(ch => available.includes(ch))
  }

  /**
   * Send message via specific channel
   */
  private async sendMessage(
    channel: string, 
    creator: CreatorContact, 
    config: OutreachConfig
  ): Promise<string> {
    
    const content = await this.generateMessageContent(channel, creator, config)
    
    switch (channel) {
      case 'email':
        return await this.sendEmail(creator, content, config)
      case 'phone':
        return await this.makePhoneCall(creator, content, config)
      case 'sms':
        return await this.sendSMS(creator, content, config)
      case 'whatsapp':
        return await this.sendWhatsApp(creator, content, config)
      case 'in_app':
        return await this.sendInAppMessage(creator, content, config)
      default:
        throw new Error(`Unsupported channel: ${channel}`)
    }
  }

  /**
   * Generate AI-powered message content for specific channel
   */
  private async generateMessageContent(
    channel: string,
    creator: CreatorContact,
    config: OutreachConfig
  ): Promise<{
    subject?: string
    content: string
    call_to_action: string
  }> {
    
    const channelSpecs = {
      email: { maxLength: 500, formal: true, includeSubject: true },
      phone: { maxLength: 200, conversational: true, includeSubject: false },
      sms: { maxLength: 160, brief: true, includeSubject: false },
      whatsapp: { maxLength: 300, casual: true, includeSubject: false },
      in_app: { maxLength: 400, professional: true, includeSubject: true }
    }

    const spec = channelSpecs[channel as keyof typeof channelSpecs]
    
    const prompt = `Generate a ${config.message_type} message for influencer outreach via ${channel}.

CAMPAIGN DETAILS:
- Brand: ${config.context.brand_name}
- Campaign: ${config.context.campaign_title}
- Budget: $${config.context.recommended_budget}
- Deliverables: ${config.context.deliverables.join(', ')}
- Timeline: ${config.context.timeline}

CREATOR DETAILS:
- Name: ${creator.name}
- Handle: @${creator.handle}
- Niche: ${creator.niche.join(', ')}
- Followers: ${creator.follower_count.toLocaleString()}

CHANNEL REQUIREMENTS:
- Platform: ${channel}
- Max Length: ${spec.maxLength} characters
- Tone: ${spec.formal ? 'Professional' : spec.conversational ? 'Conversational' : spec.casual ? 'Casual' : 'Professional'}
- Include Subject: ${spec.includeSubject}

Generate:
${spec.includeSubject ? '1. Subject line (max 50 chars)\n' : ''}2. Message content (personalized, engaging, clear value proposition)
3. Clear call-to-action

Make it compelling and tailored to this specific creator and channel.`

    try {
      const response = await generateContent(prompt, {
        maxTokens: 300,
        temperature: 0.8
      })

      // Parse response into structured format
      const lines = response.split('\n').filter(line => line.trim())
      
      let subject, content, callToAction
      
      if (spec.includeSubject) {
        subject = lines[0]?.replace(/^(Subject:|1\.|Subject Line:)/i, '').trim()
        content = lines.slice(1, -1).join('\n').trim()
        callToAction = lines[lines.length - 1]?.replace(/^(CTA:|Call to Action:|3\.)/i, '').trim()
      } else {
        content = lines.slice(0, -1).join('\n').trim()
        callToAction = lines[lines.length - 1]?.replace(/^(CTA:|Call to Action:)/i, '').trim()
      }

      return {
        subject,
        content: content || response,
        call_to_action: callToAction || 'Interested in collaborating?'
      }

    } catch (error) {
      console.error('Content generation error:', error)
      
      // Fallback content
      return {
        subject: spec.includeSubject ? `Collaboration Opportunity with ${config.context.brand_name}` : undefined,
        content: `Hi ${creator.name}! We'd love to collaborate with you on a ${config.context.campaign_title} campaign. Budget: $${config.context.recommended_budget}. Interested?`,
        call_to_action: 'Let us know if you\'d like to discuss!'
      }
    }
  }

  /**
   * Send email via Gmail API
   */
  private async sendEmail(
    creator: CreatorContact,
    content: { subject?: string; content: string; call_to_action: string },
    config: OutreachConfig
  ): Promise<string> {
    
    const emailBody = `${content.content}\n\n${content.call_to_action}`
    
    const email = {
      to: creator.email!,
      subject: content.subject || `Collaboration Opportunity with ${config.context.brand_name}`,
      body: emailBody,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Collaboration Opportunity</h2>
          <p>${content.content.replace(/\n/g, '</p><p>')}</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Campaign:</strong> ${config.context.campaign_title}<br>
            <strong>Budget:</strong> $${config.context.recommended_budget}<br>
            <strong>Deliverables:</strong> ${config.context.deliverables.join(', ')}
          </div>
          <p><strong>${content.call_to_action}</strong></p>
          <p style="color: #666; font-size: 12px;">Sent via InfluencerFlow AI</p>
        </div>
      `
    }

    // Gmail API integration
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GMAIL_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: this.createEmailRaw(email)
      })
    })

    const data = await response.json()
    return data.id || 'email_sent'
  }

  /**
   * Make AI-powered phone call via ElevenLabs + Twilio
   */
  private async makePhoneCall(
    creator: CreatorContact,
    content: { content: string; call_to_action: string },
    config: OutreachConfig
  ): Promise<string> {
    
    // Generate voice content with ElevenLabs
    const voiceText = `Hi ${creator.name}, this is an AI assistant from ${config.context.brand_name}. ${content.content} ${content.call_to_action} You can respond by pressing 1 if interested, or 2 to decline. Thank you!`

    // Generate audio with ElevenLabs
    const audioResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!
      },
      body: JSON.stringify({
        text: voiceText,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    })

    const audioBuffer = await audioResponse.arrayBuffer()
    const audioUrl = await this.uploadAudio(audioBuffer, `call-${config.campaign_id}-${creator.id}.mp3`)

    // Make call with Twilio
    const callResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Calls.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: creator.phone!,
        From: process.env.TWILIO_PHONE_NUMBER!,
        Url: `${process.env.APP_URL}/api/twilio/voice-webhook?audio_url=${encodeURIComponent(audioUrl)}`
      })
    })

    const callData = await callResponse.json()
    return callData.sid
  }

  /**
   * Send SMS via Twilio
   */
  private async sendSMS(
    creator: CreatorContact,
    content: { content: string; call_to_action: string },
    config: OutreachConfig
  ): Promise<string> {
    
    const message = `${content.content}\n\n${content.call_to_action}\n\n- ${config.context.brand_name} via InfluencerFlow`

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: creator.phone!,
        From: process.env.TWILIO_PHONE_NUMBER!,
        Body: message
      })
    })

    const data = await response.json()
    return data.sid
  }

  /**
   * Send WhatsApp message via Twilio/WhatsApp Cloud API
   */
  private async sendWhatsApp(
    creator: CreatorContact,
    content: { content: string; call_to_action: string },
    config: OutreachConfig
  ): Promise<string> {
    
    const message = `🤝 *${config.context.brand_name} Collaboration*\n\nHi ${creator.name}!\n\n${content.content}\n\n💰 Budget: $${config.context.recommended_budget}\n📦 Deliverables: ${config.context.deliverables.join(', ')}\n\n${content.call_to_action}`

    // WhatsApp Cloud API
    const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: creator.phone!,
        type: 'text',
        text: { body: message }
      })
    })

    const data = await response.json()
    return data.messages?.[0]?.id || 'whatsapp_sent'
  }

  /**
   * Send in-app message via Supabase Realtime
   */
  private async sendInAppMessage(
    creator: CreatorContact,
    content: { subject?: string; content: string; call_to_action: string },
    config: OutreachConfig
  ): Promise<string> {
    
    const message = {
      id: crypto.randomUUID(),
      campaign_id: config.campaign_id,
      from_user_id: null, // System message
      to_user_id: creator.id,
      subject: content.subject || `New Campaign Opportunity`,
      content: `${content.content}\n\n${content.call_to_action}`,
      message_type: 'campaign_invitation',
      metadata: {
        campaign_title: config.context.campaign_title,
        brand_name: config.context.brand_name,
        budget: config.context.recommended_budget,
        deliverables: config.context.deliverables
      },
      created_at: new Date().toISOString()
    }

    await this.supabase
      .from('messages')
      .insert(message)

    // Trigger real-time notification
    await this.supabase
      .channel('user-notifications')
      .send({
        type: 'broadcast',
        event: 'new_message',
        payload: {
          user_id: creator.id,
          message
        }
      })

    return message.id
  }

  /**
   * Log communication to database
   */
  private async logCommunication(log: {
    campaign_id: string
    creator_id: string
    channel: string
    message_type: string
    external_id: string
    delivered: boolean
  }) {
    await this.supabase
      .from('communication_log')
      .insert({
        ...log,
        direction: 'outbound',
        ai_generated: true,
        created_at: new Date().toISOString()
      })
  }

  /**
   * Helper methods
   */
  private createEmailRaw(email: { to: string; subject: string; body: string; html: string }): string {
    const emailContent = [
      `To: ${email.to}`,
      `Subject: ${email.subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      email.html
    ].join('\n')

    return Buffer.from(emailContent).toString('base64')
  }

  private async uploadAudio(audioBuffer: ArrayBuffer, filename: string): Promise<string> {
    const { data } = await this.supabase.storage
      .from('audio-files')
      .upload(`calls/${filename}`, audioBuffer, {
        contentType: 'audio/mpeg'
      })

    return `${process.env.SUPABASE_URL}/storage/v1/object/public/audio-files/${data?.path}`
  }
}

/**
 * AI Response Analysis System
 * Analyzes incoming responses and determines next actions
 */
export class AIResponseAnalyzer {
  private supabase: any

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Analyze incoming response and determine next action
   */
  async analyzeResponse(response: {
    campaign_id: string
    creator_id: string
    channel: string
    content: string
    external_id?: string
  }): Promise<{
    intent: string
    sentiment: number
    key_points: string[]
    next_action: string
    confidence: number
  }> {

    // Generate AI analysis
    const prompt = `Analyze this influencer response to a collaboration outreach:

MESSAGE: "${response.content}"

Analyze and provide:
1. INTENT: (interested, declined, negotiating, needs_more_info, scheduling, unclear)
2. SENTIMENT: (-1 to 1 scale, where -1 is negative, 0 is neutral, 1 is positive)
3. KEY_POINTS: [list of important points mentioned]
4. NEXT_ACTION: (send_contract, negotiate_terms, provide_more_info, schedule_call, follow_up, mark_declined)
5. CONFIDENCE: (0-1 confidence in analysis)

Respond in JSON format only.`

    try {
      const analysis = await generateContent(prompt, {
        maxTokens: 200,
        temperature: 0.3
      })

      const parsed = JSON.parse(analysis)
      
      // Log the response and analysis
      await this.supabase
        .from('communication_log')
        .insert({
          campaign_id: response.campaign_id,
          creator_id: response.creator_id,
          channel: response.channel,
          direction: 'inbound',
          content: response.content,
          external_id: response.external_id,
          sentiment_score: parsed.SENTIMENT,
          intent: parsed.INTENT,
          key_points: parsed.KEY_POINTS,
          delivered: true,
          read: true,
          responded: true
        })

      // Update creator recommendation status
      await this.updateRecommendationStatus(
        response.campaign_id,
        response.creator_id,
        parsed.INTENT
      )

      return {
        intent: parsed.INTENT,
        sentiment: parsed.SENTIMENT,
        key_points: parsed.KEY_POINTS,
        next_action: parsed.NEXT_ACTION,
        confidence: parsed.CONFIDENCE
      }

    } catch (error) {
      console.error('Response analysis error:', error)
      
      // Fallback analysis
      const sentiment = response.content.toLowerCase().includes('yes') || 
                       response.content.toLowerCase().includes('interested') ? 0.8 : -0.2
      
      return {
        intent: 'unclear',
        sentiment,
        key_points: [],
        next_action: 'follow_up',
        confidence: 0.3
      }
    }
  }

  private async updateRecommendationStatus(
    campaignId: string,
    creatorId: string,
    intent: string
  ) {
    const statusMap: { [key: string]: string } = {
      interested: 'responded',
      negotiating: 'negotiating',
      declined: 'rejected',
      needs_more_info: 'responded'
    }

    const newStatus = statusMap[intent] || 'responded'

    await this.supabase
      .from('creator_recommendations')
      .update({ status: newStatus })
      .eq('campaign_id', campaignId)
      .eq('creator_id', creatorId)
  }
}

// Export instances
export const outreachSystem = new AIOutreachSystem(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const responseAnalyzer = new AIResponseAnalyzer(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
) 