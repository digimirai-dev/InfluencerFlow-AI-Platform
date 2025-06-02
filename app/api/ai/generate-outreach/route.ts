import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('=== AI Outreach Generation Called ===')
    
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
    
    const {
      creatorName,
      creatorNiche,
      campaignTitle,
      campaignDescription,
      recommendedBudget,
      deliverables,
      confidenceScore,
      matchReasoning
    } = await request.json()

    console.log('Generating outreach for creator:', creatorName)
    console.log('Campaign:', campaignTitle)
    console.log('Confidence score:', confidenceScore)

    // Generate AI outreach message
    const outreachMessage = `Hi ${creatorName},

I hope you're doing well! I'm reaching out regarding an exciting collaboration opportunity for our "${campaignTitle}" campaign.

${matchReasoning}

Based on your expertise in ${creatorNiche}, I believe you'd be a perfect fit for this partnership. We're offering $${recommendedBudget?.toLocaleString() || 'competitive compensation'} for creating ${Array.isArray(deliverables) ? deliverables.join(', ') : 'engaging content'}.

Here's what we're looking for:
${Array.isArray(deliverables) ? deliverables.map(d => `• ${d}`).join('\n') : '• Authentic, engaging content that resonates with your audience'}

Campaign Details:
${campaignDescription}

Our AI matching system identified you as a ${Math.round((confidenceScore || 0.8) * 100)}% match for this campaign, which means we believe your content style and audience align perfectly with our brand values.

Would you be interested in learning more about this opportunity? I'd love to discuss the details further and answer any questions you might have.

Looking forward to the possibility of working together!

Best regards,
The InfluencerFlow Team

🤖 This message was crafted with AI assistance to ensure the best possible match for your collaboration preferences.`

    return NextResponse.json({
      success: true,
      message: outreachMessage
    })

  } catch (error) {
    console.error('Error generating AI outreach:', error)
    return NextResponse.json(
      { error: 'Failed to generate outreach message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 