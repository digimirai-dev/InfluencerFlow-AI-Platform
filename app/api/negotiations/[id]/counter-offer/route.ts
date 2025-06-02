import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Counter-Offer API Called ===')
    
    const { id: negotiationId } = await params
    const cookieStore = await cookies()
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { proposedTerms, responseMessage, aiGenerated = false } = await request.json()

    // AI analysis of the counter-offer
    const aiAnalysis = await analyzeCounterOffer(proposedTerms, negotiationId, supabase)

    // Add negotiation round manually instead of using RPC
    let roundId = null
    let currentNegotiation = null
    try {
      // Get the current round number
      const { data: negData } = await supabase
        .from('negotiations')
        .select('current_round')
        .eq('id', negotiationId)
        .single()

      currentNegotiation = negData
      const nextRound = (currentNegotiation?.current_round || 0) + 1

      // Try to insert negotiation round
      const { data: round, error: roundError } = await supabase
        .from('negotiation_rounds')
        .insert({
          negotiation_id: negotiationId,
          round_number: nextRound,
          initiated_by: 'brand',
          proposed_terms: proposedTerms,
          ai_analysis: aiAnalysis,
          response_type: 'counter',
          response_message: responseMessage
        })
        .select()
        .single()

      if (round) {
        roundId = round.id
      }

      // Update the negotiation with new round and terms
      await supabase
        .from('negotiations')
        .update({
          current_round: nextRound,
          current_terms: proposedTerms,
          updated_at: new Date().toISOString()
        })
        .eq('id', negotiationId)

    } catch (roundError) {
      console.log('Negotiation rounds table might not exist, continuing without it')
    }

    // Check if we should auto-generate a response or send to creator
    if (aiAnalysis.should_auto_respond && currentNegotiation) {
      // Auto-generate AI response (for demo purposes)
      const autoResponse = generateAutoResponse(proposedTerms, aiAnalysis)
      
      // Add AI response round manually
      try {
        const nextRound = ((currentNegotiation?.current_round || 0) + 1) + 1 // One more for AI response

        await supabase
          .from('negotiation_rounds')
          .insert({
            negotiation_id: negotiationId,
            round_number: nextRound,
            initiated_by: 'ai',
            proposed_terms: autoResponse.terms,
            ai_analysis: { type: 'auto_response', reasoning: autoResponse.reasoning },
            response_type: autoResponse.action,
            response_message: autoResponse.message
          })

        // Update negotiation round
        await supabase
          .from('negotiations')
          .update({ current_round: nextRound })
          .eq('id', negotiationId)

        if (autoResponse.action === 'accept') {
          // Mark negotiation as agreed
          await supabase
            .from('negotiations')
            .update({ status: 'agreed' })
            .eq('id', negotiationId)
        }
      } catch (error) {
        console.log('Auto-response failed, continuing without it')
      }
    }

    // Get updated negotiation
    const { data: updatedNegotiation, error: fetchError } = await supabase
      .from('negotiations')
      .select(`
        *,
        campaigns!campaign_id (id, title, budget_min, budget_max),
        users!creator_id (id, full_name, email),
        communication_log!communication_id (id, subject, content, created_at)
      `)
      .eq('id', negotiationId)
      .single()

    if (fetchError) {
      console.error('Error fetching updated negotiation:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch updated negotiation' }, { status: 500 })
    }

    // Get creator profile separately
    if (updatedNegotiation.creator_id) {
      const { data: creatorProfile } = await supabase
        .from('creator_profiles')
        .select('user_id, display_name, niche, follower_count_instagram, engagement_rate, rate_per_post')
        .eq('user_id', updatedNegotiation.creator_id)
        .single()
      
      updatedNegotiation.creator_profiles = creatorProfile
    }

    // Get negotiation rounds separately
    const { data: rounds } = await supabase
      .from('negotiation_rounds')
      .select('*')
      .eq('negotiation_id', negotiationId)
      .order('round_number', { ascending: true })

    // Add rounds to the negotiation object
    updatedNegotiation.negotiation_rounds = rounds || []

    return NextResponse.json({
      success: true,
      negotiation: updatedNegotiation,
      round_id: roundId,
      ai_analysis: aiAnalysis
    })

  } catch (error) {
    console.error('Error making counter-offer:', error)
    return NextResponse.json({ error: 'Failed to make counter-offer' }, { status: 500 })
  }
}

// AI Analysis for counter-offers
async function analyzeCounterOffer(proposedTerms: any, negotiationId: string, supabase: any) {
  try {
    // Get current negotiation state
    const { data: negotiation } = await supabase
      .from('negotiations')
      .select('creator_terms, current_terms, strategy, current_round, max_rounds')
      .eq('id', negotiationId)
      .single()

    if (!negotiation) {
      throw new Error('Negotiation not found')
    }

    const creatorTerms = negotiation.creator_terms
    const currentTerms = negotiation.current_terms

    // Calculate variance from creator's original terms
    let variance = 0
    if (creatorTerms.total_rate && proposedTerms.total_rate) {
      variance = Math.abs(proposedTerms.total_rate - creatorTerms.total_rate) / creatorTerms.total_rate
    }

    // Determine if this should auto-respond (for demo)
    const shouldAutoRespond = variance < 0.15 && negotiation.current_round < negotiation.max_rounds

    // Generate negotiation insights
    const insights = []
    if (proposedTerms.total_rate && creatorTerms.total_rate) {
      if (proposedTerms.total_rate > creatorTerms.total_rate) {
        insights.push('Offered rate is higher than creator\'s ask - likely to be accepted')
      } else if (proposedTerms.total_rate < creatorTerms.total_rate * 0.8) {
        insights.push('Offered rate is significantly lower - may need justification')
      }
    }

    return {
      variance_from_creator_terms: variance,
      should_auto_respond: shouldAutoRespond,
      likelihood_of_acceptance: variance < 0.1 ? 0.9 : variance < 0.2 ? 0.7 : 0.4,
      insights: insights,
      negotiation_health: variance < 0.2 ? 'good' : variance < 0.4 ? 'moderate' : 'poor',
      recommended_next_steps: shouldAutoRespond ? ['auto_respond'] : ['send_to_creator', 'wait_for_response']
    }
  } catch (error) {
    console.error('Error in AI analysis:', error)
    return {
      variance_from_creator_terms: 0,
      should_auto_respond: false,
      likelihood_of_acceptance: 0.5,
      insights: ['Analysis unavailable'],
      negotiation_health: 'unknown',
      recommended_next_steps: ['send_to_creator']
    }
  }
}

// Auto-response generator (for demo)
function generateAutoResponse(brandTerms: any, aiAnalysis: any) {
  // Simulate creator response based on AI analysis
  if (aiAnalysis.likelihood_of_acceptance > 0.8) {
    return {
      action: 'accept',
      terms: brandTerms,
      message: 'I accept your terms! This looks great. When can we get started?',
      reasoning: 'High likelihood of acceptance based on terms analysis'
    }
  } else if (aiAnalysis.likelihood_of_acceptance > 0.6) {
    // Generate a minor counter
    const counterTerms = { ...brandTerms }
    if (brandTerms.total_rate) {
      counterTerms.total_rate = Math.round(brandTerms.total_rate * 1.05) // 5% increase
    }
    
    return {
      action: 'counter',
      terms: counterTerms,
      message: `Thanks for the offer. I'm close to accepting. Could we do $${counterTerms.total_rate} instead? That would work perfectly for me.`,
      reasoning: 'Moderate likelihood - generated minor counter-offer'
    }
  } else {
    return {
      action: 'decline',
      terms: {},
      message: 'Thanks for the offer, but I don\'t think we can make this work with the current terms.',
      reasoning: 'Low likelihood of acceptance'
    }
  }
} 