import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== AI Response Analysis Called ===')
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log('Supabase client created successfully')

    const { communicationId, campaignBudget, creatorProfile } = await request.json()

    console.log('Request data:', { communicationId, campaignBudget, creatorProfile })

    // Get the communication message
    const { data: communication, error: commError } = await supabase
      .from('communication_log')
      .select('*')
      .eq('id', communicationId)
      .single()

    if (commError || !communication) {
      console.error('Communication not found:', commError)
      return NextResponse.json({ error: 'Communication not found' }, { status: 404 })
    }

    console.log('Analyzing creator response:', communication.subject)

    // AI Analysis using a comprehensive prompt
    const aiAnalysis = await analyzeCreatorResponse(
      communication.content,
      campaignBudget,
      creatorProfile
    )

    console.log('AI Analysis complete:', aiAnalysis)
    console.log('Interest level check:', aiAnalysis.interest_level !== 'low')
    console.log('Extracted terms count:', Object.keys(aiAnalysis.extracted_terms).length)
    console.log('Should create negotiation:', aiAnalysis.interest_level !== 'low' && Object.keys(aiAnalysis.extracted_terms).length > 0)

    // Create negotiation if terms were extracted
    if (aiAnalysis.interest_level !== 'low' && Object.keys(aiAnalysis.extracted_terms).length > 0) {
      
      // Check if negotiation already exists
      const { data: existingNegotiation } = await supabase
        .from('negotiations')
        .select('id')
        .eq('campaign_id', communication.campaign_id)
        .eq('creator_id', communication.creator_id)
        .single()

      if (existingNegotiation) {
        console.log('Negotiation already exists:', existingNegotiation.id)
        return NextResponse.json({
          success: true,
          analysis: aiAnalysis,
          negotiation_id: existingNegotiation.id,
          requires_negotiation: true,
          message: 'Negotiation already exists for this creator and campaign'
        })
      }

      const { data: negotiationId, error: createError } = await supabase
        .rpc('create_negotiation_from_response', {
          p_communication_id: communicationId,
          p_ai_analysis: aiAnalysis,
          p_creator_terms: aiAnalysis.extracted_terms,
          p_strategy: aiAnalysis.recommended_strategy
        })

      if (createError) {
        console.error('Error creating negotiation:', createError)
        return NextResponse.json({ error: 'Failed to create negotiation' }, { status: 500 })
      }

      console.log('Negotiation created:', negotiationId)

      return NextResponse.json({
        success: true,
        analysis: aiAnalysis,
        negotiation_id: negotiationId,
        requires_negotiation: true
      })
    }

    // Return analysis without creating negotiation
    return NextResponse.json({
      success: true,
      analysis: aiAnalysis,
      requires_negotiation: false
    })

  } catch (error) {
    console.error('Error analyzing response:', error)
    return NextResponse.json(
      { error: 'Failed to analyze response', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// AI Analysis Function
async function analyzeCreatorResponse(
  messageContent: string,
  campaignBudget: { min: number, max: number },
  creatorProfile: any
): Promise<any> {
  // For now, we'll use a rule-based approach
  // In production, this would integrate with OpenAI GPT-4 or similar
  
  const content = messageContent.toLowerCase()
  console.log('Analyzing content:', content.substring(0, 200) + '...')
  
  // Extract interest level
  let interestLevel = 'medium'
  if (content.includes('very interested') || content.includes('love to') || content.includes('excited') || content.includes('would love to')) {
    interestLevel = 'high'
  } else if (content.includes('interested') || content.includes('opportunity')) {
    interestLevel = 'medium'
  } else if (content.includes('not interested') || content.includes('no thanks') || content.includes('decline')) {
    interestLevel = 'low'
  }
  
  console.log('Detected interest level:', interestLevel)

  // Extract rates using improved regex
  const rateMatches = content.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g) || []
  const rates = rateMatches.map(rate => parseFloat(rate.replace(/[$,]/g, '')))
  console.log('Extracted rates:', rates)

  // Extract deliverables with more patterns
  const deliverables = []
  if (content.includes('post') || content.includes('instagram post')) deliverables.push('instagram_post')
  if (content.includes('story') || content.includes('stories') || content.includes('instagram stories')) deliverables.push('instagram_story')
  if (content.includes('reel') || content.includes('reels') || content.includes('instagram reel')) deliverables.push('instagram_reel')
  if (content.includes('video')) deliverables.push('video_content')
  if (content.includes('blog')) deliverables.push('blog_post')
  
  console.log('Extracted deliverables:', deliverables)

  // Extract timeline with better patterns
  let timeline = null
  const timelineMatches = content.match(/(\d+)\s*(day|week|month)s?/g)
  if (timelineMatches) {
    timeline = timelineMatches[0]
  }
  console.log('Extracted timeline:', timeline)

  // Extract proposed terms
  const extractedTerms: any = {
    deliverables: deliverables,
    timeline: timeline
  }

  // Map rates to deliverables with better logic
  if (rates.length > 0) {
    // Look for specific rate patterns
    if (content.includes('per post') && rates.length > 0) {
      extractedTerms.rate_per_post = rates[0]
    }
    if (content.includes('per story') || content.includes('story set')) {
      const storyRate = rates.find((rate, i) => {
        const rateContext = content.substring(content.indexOf(rateMatches[i]) - 20, content.indexOf(rateMatches[i]) + 20)
        return rateContext.includes('story')
      })
      if (storyRate) extractedTerms.rate_per_story = storyRate
    }
    if (content.includes('per reel')) {
      const reelRate = rates.find((rate, i) => {
        const rateContext = content.substring(content.indexOf(rateMatches[i]) - 20, content.indexOf(rateMatches[i]) + 20)
        return rateContext.includes('reel')
      })
      if (reelRate) extractedTerms.rate_per_reel = reelRate
    }
    
    // Look for total package/campaign rate
    if (content.includes('total package') || content.includes('complete campaign') || content.includes('total:')) {
      const totalRate = rates[rates.length - 1] // Usually the last/largest number
      extractedTerms.total_rate = totalRate
    }
    
    // If no specific rates found, use the first rate
    if (!extractedTerms.rate_per_post && !extractedTerms.rate_per_story && !extractedTerms.rate_per_reel && !extractedTerms.total_rate && rates.length > 0) {
      extractedTerms.total_rate = rates[0]
    }
  }

  console.log('Final extracted terms:', extractedTerms)

  // Calculate budget compatibility
  const proposedTotal = extractedTerms.total_rate || 
    (extractedTerms.rate_per_post * (deliverables.length || 1)) ||
    (extractedTerms.rate_per_reel * 1) + (extractedTerms.rate_per_post * 2) // Estimate
  
  let budgetCompatibility = 0.5 // neutral
  if (proposedTotal) {
    if (proposedTotal <= campaignBudget.max) {
      budgetCompatibility = 0.8
    }
    if (proposedTotal <= campaignBudget.min) {
      budgetCompatibility = 0.9
    }
    if (proposedTotal > campaignBudget.max * 1.5) {
      budgetCompatibility = 0.2
    }
  }

  console.log('Budget compatibility:', budgetCompatibility, 'for proposed total:', proposedTotal)

  // Generate negotiation recommendations
  const recommendedStrategy = {
    approach: budgetCompatibility > 0.7 ? 'accept' : 'counter',
    priority: proposedTotal > campaignBudget.max ? 'reduce_cost' : 'optimize_value',
    max_rounds: 3,
    auto_approve_threshold: 0.1
  }

  // Generate negotiation points
  const negotiationPoints = []
  if (proposedTotal > campaignBudget.max) {
    negotiationPoints.push('rate_adjustment')
  }
  if (!timeline) {
    negotiationPoints.push('timeline_clarification')
  }
  if (deliverables.length === 0) {
    negotiationPoints.push('deliverable_specification')
  }

  const result = {
    interest_level: interestLevel,
    extracted_terms: extractedTerms,
    budget_compatibility: budgetCompatibility,
    negotiation_points: negotiationPoints,
    recommended_strategy: recommendedStrategy,
    analysis_summary: `Creator shows ${interestLevel} interest. ${proposedTotal ? `Proposed rate: $${proposedTotal}` : 'No specific rate mentioned'}. Budget compatibility: ${Math.round(budgetCompatibility * 100)}%.`,
    confidence_score: deliverables.length > 0 && rates.length > 0 ? 0.8 : 0.6
  }

  console.log('Final AI analysis result:', result)
  return result
} 