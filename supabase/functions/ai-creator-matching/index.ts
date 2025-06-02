import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * AI-Powered Creator Matching Function
 * Uses OpenAI embeddings + pgvector for semantic similarity matching
 * Calculates comprehensive scores for creator recommendations
 */
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { campaign_id } = await req.json()

    console.log(`🎯 Finding creators for campaign: ${campaign_id}`)

    // Get campaign details with embeddings
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single()

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    // Find semantically similar creators using pgvector
    const semanticMatches = await findSemanticMatches(supabase, campaign)
    
    // Calculate comprehensive scores for each creator
    const recommendations = await calculateCreatorScores(
      supabase, 
      campaign, 
      semanticMatches
    )

    // Store recommendations in database
    await storeRecommendations(supabase, campaign_id, recommendations)

    // Update campaign status
    await supabase
      .from('campaigns')
      .update({ 
        status: 'creators_suggested',
        ai_processing_stage: 'sending_outreach'
      })
      .eq('id', campaign_id)

    // Schedule outreach tasks for approved creators
    await scheduleOutreachTasks(supabase, campaign_id, recommendations)

    return new Response(
      JSON.stringify({ 
        success: true, 
        recommendations_count: recommendations.length,
        campaign_id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Creator matching error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

/**
 * Find semantically similar creators using pgvector
 */
async function findSemanticMatches(supabase: any, campaign: any) {
  // Use pgvector similarity search with campaign embeddings
  const { data: creators } = await supabase.rpc('find_similar_creators', {
    campaign_description_embedding: campaign.description_embedding,
    campaign_niche_embedding: campaign.niche_embedding,
    similarity_threshold: 0.7,
    limit_count: 50
  })

  return creators || []
}

/**
 * Calculate comprehensive AI scores for creator recommendations
 */
async function calculateCreatorScores(supabase: any, campaign: any, creators: any[]) {
  const recommendations = []

  for (const creator of creators) {
    // 1. Semantic Similarity Score (from pgvector)
    const semanticScore = creator.similarity_score * 100

    // 2. Engagement Score (based on metrics)
    const engagementScore = calculateEngagementScore(creator)

    // 3. Historical Performance Score
    const performanceScore = await calculatePerformanceScore(supabase, creator.id)

    // 4. Budget Compatibility Score
    const budgetScore = calculateBudgetCompatibility(campaign, creator)

    // 5. Overall Confidence Score (weighted average)
    const overallScore = (
      semanticScore * 0.3 +
      engagementScore * 0.25 +
      performanceScore * 0.25 +
      budgetScore * 0.2
    )

    // Generate AI reasoning using GPT-4
    const reasoning = await generateMatchReasoning(campaign, creator, {
      semanticScore,
      engagementScore,
      performanceScore,
      budgetScore,
      overallScore
    })

    recommendations.push({
      creator_id: creator.id,
      semantic_similarity_score: semanticScore,
      engagement_score: engagementScore,
      historical_performance_score: performanceScore,
      budget_compatibility_score: budgetScore,
      overall_confidence_score: overallScore,
      match_reasoning: reasoning,
      recommended_budget: calculateRecommendedBudget(campaign, creator),
      estimated_deliverables: estimateDeliverables(campaign, creator)
    })
  }

  // Sort by overall confidence score
  return recommendations
    .sort((a, b) => b.overall_confidence_score - a.overall_confidence_score)
    .slice(0, 10) // Top 10 recommendations
}

/**
 * Calculate engagement score based on creator metrics
 */
function calculateEngagementScore(creator: any): number {
  const followerWeight = Math.min(creator.follower_count / 100000, 1) * 30
  const engagementWeight = creator.engagement_rate * 50
  const viewsWeight = Math.min(creator.avg_views / 50000, 1) * 20
  
  return Math.min(followerWeight + engagementWeight + viewsWeight, 100)
}

/**
 * Calculate historical performance score
 */
async function calculatePerformanceScore(supabase: any, creatorId: string): number {
  const { data: history } = await supabase
    .from('creator_recommendations')
    .select('status')
    .eq('creator_id', creatorId)
    .in('status', ['agreed', 'contracted'])

  const totalCollaborations = history?.length || 0
  const baseScore = Math.min(totalCollaborations * 10, 70)
  const responseRateBonus = 30 // Could calculate from communication_log
  
  return Math.min(baseScore + responseRateBonus, 100)
}

/**
 * Calculate budget compatibility score
 */
function calculateBudgetCompatibility(campaign: any, creator: any): number {
  const campaignMax = campaign.budget_max || 0
  const creatorMin = creator.min_budget || 0
  
  if (campaignMax >= creatorMin) {
    const compatibility = (campaignMax - creatorMin) / campaignMax
    return Math.min(compatibility * 100, 100)
  }
  
  return 0
}

/**
 * Generate AI reasoning for creator match using GPT-4
 */
async function generateMatchReasoning(campaign: any, creator: any, scores: any): Promise<string> {
  const prompt = `As an AI influencer marketing expert, analyze why this creator matches this campaign:

CAMPAIGN:
- Title: ${campaign.title}
- Objective: ${campaign.objective}
- Niche: ${campaign.niche.join(', ')}
- Budget: $${campaign.budget_min}-$${campaign.budget_max}
- Target Audience: ${JSON.stringify(campaign.target_audience)}

CREATOR:
- Handle: ${creator.handle}
- Bio: ${creator.bio}
- Niche: ${creator.niche.join(', ')}
- Followers: ${creator.follower_count}
- Engagement Rate: ${creator.engagement_rate}%
- Location: ${creator.location}

SCORES:
- Semantic Match: ${scores.semanticScore}/100
- Engagement Score: ${scores.engagementScore}/100
- Performance Score: ${scores.performanceScore}/100
- Budget Compatibility: ${scores.budgetScore}/100
- Overall Confidence: ${scores.overallScore}/100

Provide a concise 2-3 sentence explanation of why this creator is a good match, highlighting the strongest alignment factors.`

  try {
    const response = await fetch(`${Deno.env.get('OPENAI_BASE_URL')}openai/deployments/gpt-4.1/chat/completions?api-version=2024-02-15-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': Deno.env.get('OPENAI_API_KEY') ?? ''
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7
      })
    })

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'Strong match based on niche alignment and engagement metrics.'
  } catch (error) {
    console.error('GPT-4 reasoning error:', error)
    return 'Strong match based on AI analysis of profile compatibility.'
  }
}

/**
 * Calculate recommended budget for creator
 */
function calculateRecommendedBudget(campaign: any, creator: any): number {
  const baseRate = creator.follower_count * 0.01 // $0.01 per follower baseline
  const engagementMultiplier = 1 + (creator.engagement_rate / 100)
  const recommended = baseRate * engagementMultiplier
  
  // Ensure it's within campaign budget
  return Math.min(recommended, campaign.budget_max || recommended)
}

/**
 * Estimate deliverables for creator
 */
function estimateDeliverables(campaign: any, creator: any): string[] {
  const deliverables = []
  
  if (creator.niche.includes('instagram')) {
    deliverables.push('1 Instagram post', '3 Instagram stories')
  }
  if (creator.niche.includes('tiktok')) {
    deliverables.push('2 TikTok videos')
  }
  if (creator.niche.includes('youtube')) {
    deliverables.push('1 YouTube video mention')
  }
  
  return deliverables.length > 0 ? deliverables : ['Social media content package']
}

/**
 * Store recommendations in database
 */
async function storeRecommendations(supabase: any, campaignId: string, recommendations: any[]) {
  const records = recommendations.map(rec => ({
    campaign_id: campaignId,
    ...rec
  }))

  await supabase
    .from('creator_recommendations')
    .insert(records)
}

/**
 * Schedule outreach tasks for top recommendations
 */
async function scheduleOutreachTasks(supabase: any, campaignId: string, recommendations: any[]) {
  // Auto-approve top 5 creators with confidence > 80
  const autoApproved = recommendations
    .filter(rec => rec.overall_confidence_score > 80)
    .slice(0, 5)

  for (const rec of autoApproved) {
    await supabase
      .from('workflow_tasks')
      .insert({
        task_type: 'send_outreach',
        campaign_id: campaignId,
        creator_id: rec.creator_id,
        priority: 2,
        input_data: { 
          campaign_id: campaignId, 
          creator_id: rec.creator_id,
          recommended_budget: rec.recommended_budget,
          deliverables: rec.estimated_deliverables
        }
      })
  }
} 