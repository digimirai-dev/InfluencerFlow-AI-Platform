import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Adding Sample Communication for Testing ===')
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { campaignId } = await request.json()

    // Get campaign info
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get a creator
    const { data: creator } = await supabase
      .from('creator_profiles')
      .select('*')
      .limit(1)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'No creators found' }, { status: 404 })
    }

    // Create sample communication with pricing
    const sampleContent = `Hi InfluencerFlow Team,

Thank you for reaching out about the "${campaign.campaign_name}" campaign! I'm very interested in this collaboration opportunity.

After reviewing the campaign details, I'd love to work with you. Here are my rates and what I can offer:

💰 My Rates:
- Instagram posts: $300 per post
- Instagram stories: $150 per story set (3-4 stories)
- Instagram reels: $400 per reel

📅 Timeline: I can deliver the content within 2 weeks of receiving the products.

📋 Deliverables I propose:
- 2 high-quality Instagram posts featuring your back-to-school products
- 1 Instagram reel showcasing the products in action
- Story series highlighting key features

Total package: $1000 for the complete campaign

I'm excited about this opportunity and would love to discuss the details further. My content typically achieves great engagement rates and I think your products would resonate well with my audience.

Looking forward to hearing from you!

Best regards,
${creator.display_name}`

    // Insert the communication
    const { data: communication, error } = await supabase
      .from('communication_log')
      .insert({
        campaign_id: campaignId,
        creator_id: creator.user_id,
        direction: 'inbound',
        channel: 'email',
        message_type: 'general',
        subject: `Re: Partnership Opportunity - ${campaign.campaign_name}`,
        content: sampleContent,
        ai_generated: false,
        delivered: true,
        read: false,
        responded: false,
        external_id: `test_${Date.now()}`
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating sample communication:', error)
      return NextResponse.json({ error: 'Failed to create sample communication' }, { status: 500 })
    }

    console.log('Sample communication created:', communication.id)

    return NextResponse.json({
      success: true,
      communication: communication,
      message: 'Sample creator response added successfully! You can now test AI analysis.'
    })

  } catch (error) {
    console.error('Error in test endpoint:', error)
    return NextResponse.json({ error: 'Failed to add sample communication' }, { status: 500 })
  }
} 