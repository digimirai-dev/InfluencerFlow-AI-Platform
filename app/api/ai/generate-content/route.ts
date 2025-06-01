import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateContent, generateCampaignDescription, generateOutreachMessage, generateContentIdeas } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      // Try session fallback
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized - please log in' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const { type, data } = body

    let result = ''

    switch (type) {
      case 'campaign-description':
        const { brandName, productType, targetAudience, campaignGoals } = data
        result = await generateCampaignDescription(brandName, productType, targetAudience, campaignGoals)
        break

      case 'outreach-message':
        const { influencerName, brandName: brand, campaignType, compensation } = data
        result = await generateOutreachMessage(influencerName, brand, campaignType, compensation)
        break

      case 'content-ideas':
        const { niche, platform, campaignTheme } = data
        result = await generateContentIdeas(niche, platform, campaignTheme)
        break

      case 'custom':
        const { prompt, options } = data
        result = await generateContent(prompt, options)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid generation type' },
          { status: 400 }
        )
    }

    return NextResponse.json({ content: result })

  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
} 