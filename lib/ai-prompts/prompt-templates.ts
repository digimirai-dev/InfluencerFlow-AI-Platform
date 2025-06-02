/**
 * Comprehensive GPT-4 Prompt Templates for InfluencerFlow AI Workflow
 * All prompts are optimized for GPT-4.1 and include detailed context and instructions
 */

export interface CampaignContext {
  title: string
  objective: string
  brand_name: string
  niche: string[]
  budget_min: number
  budget_max: number
  target_audience: any
  deliverables: string[]
  timeline: string
}

export interface CreatorContext {
  handle: string
  name: string
  bio: string
  niche: string[]
  follower_count: number
  engagement_rate: number
  location: string
  languages: string[]
}

/**
 * OUTREACH MESSAGE TEMPLATES
 */
export const OUTREACH_PROMPTS = {
  
  // Initial Email Outreach
  initialEmail: (campaign: CampaignContext, creator: CreatorContext) => `
You are an expert influencer marketing specialist writing personalized outreach emails. Generate a compelling initial outreach email.

CAMPAIGN DETAILS:
- Brand: ${campaign.brand_name}
- Campaign: ${campaign.title}
- Objective: ${campaign.objective}
- Niche: ${campaign.niche.join(', ')}
- Budget Range: $${campaign.budget_min} - $${campaign.budget_max}
- Target Audience: ${JSON.stringify(campaign.target_audience)}
- Timeline: ${campaign.timeline}
- Expected Deliverables: ${campaign.deliverables.join(', ')}

CREATOR PROFILE:
- Name: ${creator.name}
- Handle: @${creator.handle}
- Bio: ${creator.bio}
- Niche: ${creator.niche.join(', ')}
- Followers: ${creator.follower_count.toLocaleString()}
- Engagement Rate: ${creator.engagement_rate}%
- Location: ${creator.location}

REQUIREMENTS:
1. Subject line (max 60 characters, compelling and personalized)
2. Email body (300-450 words)
3. Personalized opening that shows you've researched their content
4. Clear value proposition for the creator
5. Specific campaign details without overwhelming
6. Professional but warm tone
7. Clear call-to-action
8. Include next steps

STRUCTURE:
Subject: [Subject Line]

Hi ${creator.name},

[Personalized opening based on their content/niche]

[Value proposition and campaign overview]

[Specific collaboration details]

[Next steps and call-to-action]

Best regards,
The ${campaign.brand_name} Team

Make it authentic, professional, and compelling. Show genuine interest in their work.`,

  // Follow-up Email
  followUpEmail: (campaign: CampaignContext, creator: CreatorContext, previousContext: string) => `
Generate a professional follow-up email for an influencer who hasn't responded to initial outreach.

CAMPAIGN: ${campaign.title} by ${campaign.brand_name}
CREATOR: ${creator.name} (@${creator.handle})
PREVIOUS CONTEXT: ${previousContext}

TONE: Professional but not pushy, add value in the follow-up
LENGTH: 200-300 words
INCLUDE:
- Brief reminder of original opportunity
- Additional value proposition or incentive
- Soft deadline for response
- Easy way to decline if not interested

Structure with subject line and body.`,

  // Phone Script
  phoneScript: (campaign: CampaignContext, creator: CreatorContext) => `
Create a conversational phone script for AI voice outreach (will be converted to speech).

CAMPAIGN: ${campaign.title} by ${campaign.brand_name}
CREATOR: ${creator.name}
BUDGET: $${campaign.budget_min} - $${campaign.budget_max}

REQUIREMENTS:
- Natural, conversational tone
- Maximum 120 seconds when spoken
- Include pause points for interaction
- Clear instructions for response (press 1 for interested, 2 to decline)
- Professional but friendly

Start with: "Hi ${creator.name}, this is an AI assistant calling on behalf of ${campaign.brand_name}..."`,

  // SMS Message
  smsMessage: (campaign: CampaignContext, creator: CreatorContext, budget: number) => `
Create a concise SMS message for influencer outreach.

CAMPAIGN: ${campaign.title}
BRAND: ${campaign.brand_name}
CREATOR: ${creator.name}
BUDGET: $${budget}

REQUIREMENTS:
- Maximum 160 characters including spaces
- Include budget amount
- Clear call-to-action
- Professional but casual tone
- Include brand name

Format: Direct message without greeting.`,

  // WhatsApp Message
  whatsappMessage: (campaign: CampaignContext, creator: CreatorContext, budget: number) => `
Create an engaging WhatsApp message for influencer collaboration.

CAMPAIGN: ${campaign.title}
BRAND: ${campaign.brand_name}
CREATOR: ${creator.name} (@${creator.handle})
BUDGET: $${budget}
DELIVERABLES: ${campaign.deliverables.join(', ')}

REQUIREMENTS:
- Maximum 300 characters
- Use appropriate emojis
- Casual but professional tone
- Include key details (budget, deliverables)
- Clear call-to-action
- WhatsApp-friendly formatting

Use emojis strategically and make it visually appealing.`
}

/**
 * NEGOTIATION PROMPTS
 */
export const NEGOTIATION_PROMPTS = {
  
  // Analyze Creator Counter-Offer
  analyzeCounterOffer: (originalOffer: any, creatorResponse: string, campaign: CampaignContext) => `
Analyze this creator's counter-offer and provide negotiation strategy.

ORIGINAL OFFER:
- Budget: $${originalOffer.budget}
- Deliverables: ${originalOffer.deliverables.join(', ')}
- Timeline: ${originalOffer.timeline}

CREATOR RESPONSE: "${creatorResponse}"

CAMPAIGN CONSTRAINTS:
- Max Budget: $${campaign.budget_max}
- Required Deliverables: ${campaign.deliverables.join(', ')}
- Timeline: ${campaign.timeline}

ANALYZE:
1. Creator's key requests/concerns
2. What they're willing to negotiate on
3. Deal-breaker issues
4. Sentiment (positive/negative/neutral)
5. Likelihood of reaching agreement (1-10)

PROVIDE:
1. Recommended counter-offer
2. Justification strategy
3. Alternative solutions
4. Risk assessment

Format as JSON with clear sections.`,

  // Generate Counter-Offer
  generateCounterOffer: (analysis: any, campaign: CampaignContext, creator: CreatorContext) => `
Generate a professional counter-offer response based on negotiation analysis.

ANALYSIS SUMMARY: ${JSON.stringify(analysis)}
CAMPAIGN: ${campaign.title}
CREATOR: ${creator.name}

CREATE:
1. Professional response acknowledging their concerns
2. Counter-offer with justification
3. Additional value propositions if possible
4. Flexibility on non-critical points
5. Clear next steps

TONE: Professional, collaborative, solution-oriented
LENGTH: 200-300 words
INCLUDE: Specific numbers and deliverables`,

  // Closing Agreement
  closingMessage: (finalTerms: any, campaign: CampaignContext, creator: CreatorContext) => `
Generate a professional message to close the deal and move to contract phase.

FINAL AGREED TERMS:
- Budget: $${finalTerms.budget}
- Deliverables: ${finalTerms.deliverables.join(', ')}
- Timeline: ${finalTerms.timeline}
- Additional terms: ${finalTerms.additional_terms || 'None'}

CAMPAIGN: ${campaign.title}
CREATOR: ${creator.name}

CREATE:
1. Congratulatory opening
2. Summary of agreed terms
3. Next steps (contract, payment schedule)
4. Contact information for questions
5. Professional closing

TONE: Excited but professional, clear about next steps
LENGTH: 250-350 words`
}

/**
 * CONTRACT GENERATION PROMPTS
 */
export const CONTRACT_PROMPTS = {
  
  // Generate Contract Clauses
  generateContract: (campaign: CampaignContext, creator: CreatorContext, finalTerms: any) => `
Generate comprehensive contract clauses for an influencer marketing agreement.

PARTIES:
- Brand: ${campaign.brand_name}
- Creator: ${creator.name} (@${creator.handle})

AGREEMENT TERMS:
- Campaign: ${campaign.title}
- Budget: $${finalTerms.budget}
- Deliverables: ${finalTerms.deliverables.join(', ')}
- Timeline: Start: ${finalTerms.start_date}, End: ${finalTerms.end_date}
- Usage Rights: ${finalTerms.usage_rights || 'Standard social media rights'}

GENERATE CLAUSES FOR:
1. Scope of Work (detailed deliverables)
2. Payment Terms (amount, schedule, method)
3. Timeline and Milestones
4. Content Guidelines and Brand Standards
5. Usage Rights and Licensing
6. Performance Metrics and KPIs
7. Intellectual Property Rights
8. Termination Conditions
9. Force Majeure
10. Governing Law and Dispute Resolution

REQUIREMENTS:
- Clear, enforceable language
- Protect both parties' interests
- Include specific metrics where applicable
- Professional legal tone
- Comprehensive but readable

Format as numbered sections with clear headers.`,

  // Risk Assessment
  contractRiskAssessment: (contractTerms: any, campaign: CampaignContext, creator: CreatorContext) => `
Perform a comprehensive risk assessment of this influencer marketing contract.

CONTRACT TERMS: ${JSON.stringify(contractTerms)}
CAMPAIGN VALUE: $${campaign.budget_max}
CREATOR PROFILE: ${creator.follower_count} followers, ${creator.engagement_rate}% engagement

ASSESS RISKS IN:
1. Financial (payment, budget overruns)
2. Performance (deliverable quality, timeline)
3. Legal (compliance, intellectual property)
4. Reputation (brand safety, content quality)
5. Operational (communication, project management)

FOR EACH RISK:
- Risk Level: High/Medium/Low
- Probability: High/Medium/Low
- Impact: High/Medium/Low
- Mitigation Strategy
- Recommended Contract Additions

FORMAT: JSON with risk categories and detailed assessments.`,

  // Contract Summary
  contractSummary: (fullContract: string) => `
Generate an executive summary of this influencer marketing contract.

FULL CONTRACT: ${fullContract}

CREATE:
1. Key Terms Summary (2-3 sentences)
2. Financial Overview (budget, payment schedule)
3. Deliverables Checklist
4. Important Dates and Deadlines
5. Key Rights and Restrictions
6. Performance Metrics
7. Risk Highlights

AUDIENCE: Brand executives and creators who need quick overview
TONE: Professional, clear, actionable
LENGTH: 300-400 words maximum`
}

/**
 * REPORT GENERATION PROMPTS
 */
export const REPORT_PROMPTS = {
  
  // Executive Summary
  executiveSummary: (campaignData: any, metrics: any, outcomes: any) => `
Generate an executive summary for a completed influencer marketing campaign.

CAMPAIGN DATA:
- Title: ${campaignData.title}
- Brand: ${campaignData.brand_name}
- Duration: ${campaignData.duration}
- Budget: $${campaignData.budget}
- Creators: ${campaignData.creator_count}

PERFORMANCE METRICS: ${JSON.stringify(metrics)}
OUTCOMES: ${JSON.stringify(outcomes)}

CREATE:
1. Campaign Overview (2-3 sentences)
2. Key Performance Highlights
3. ROI Analysis
4. Success Factors
5. Areas for Improvement
6. Strategic Recommendations

AUDIENCE: C-level executives
TONE: Professional, data-driven, strategic
LENGTH: 400-500 words
FOCUS: Business impact and strategic insights`,

  // Creator Performance Analysis
  creatorAnalysis: (creatorData: any, performanceMetrics: any) => `
Analyze individual creator performance in the campaign.

CREATOR: ${creatorData.name} (@${creatorData.handle})
DELIVERABLES: ${creatorData.deliverables.join(', ')}
METRICS: ${JSON.stringify(performanceMetrics)}

ANALYZE:
1. Content Quality Assessment
2. Engagement Performance vs. Baseline
3. Audience Alignment with Target
4. Timeline Adherence
5. Collaboration Experience
6. ROI for This Creator

PROVIDE:
1. Overall Performance Score (1-10)
2. Strengths and Weaknesses
3. Audience Insights
4. Recommendations for Future Collaborations
5. Content Examples and Highlights

FORMAT: Detailed analysis with specific metrics and examples.`,

  // Campaign Insights and Recommendations
  campaignInsights: (fullCampaignData: any, industryBenchmarks: any) => `
Generate strategic insights and recommendations for future campaigns.

CAMPAIGN PERFORMANCE: ${JSON.stringify(fullCampaignData)}
INDUSTRY BENCHMARKS: ${JSON.stringify(industryBenchmarks)}

ANALYZE:
1. Performance vs. Industry Standards
2. Creator Selection Effectiveness
3. Content Strategy Success
4. Channel Performance
5. Audience Response Patterns
6. Cost Efficiency

PROVIDE:
1. Key Success Factors
2. Performance Gaps and Opportunities
3. Creator Strategy Recommendations
4. Content Strategy Improvements
5. Budget Optimization Suggestions
6. Technology and Process Improvements

AUDIENCE: Marketing managers and strategists
TONE: Analytical, actionable, forward-looking
INCLUDE: Specific recommendations with rationale`
}

/**
 * COMMUNICATION ANALYSIS PROMPTS
 */
export const ANALYSIS_PROMPTS = {
  
  // Sentiment Analysis
  sentimentAnalysis: (message: string, context: string) => `
Analyze the sentiment and intent of this message in the context of influencer marketing outreach.

MESSAGE: "${message}"
CONTEXT: ${context}

PROVIDE:
1. Overall Sentiment (-1 to 1, where -1 = very negative, 1 = very positive)
2. Intent Classification (interested, declined, negotiating, needs_info, scheduling, unclear)
3. Emotional Tone (professional, excited, hesitant, frustrated, neutral)
4. Key Concerns or Interests Mentioned
5. Confidence Level (0-1) in this analysis
6. Recommended Response Strategy

FORMAT: JSON with numerical scores and text explanations.`,

  // Response Strategy
  responseStrategy: (messageAnalysis: any, communicationHistory: any[], campaign: CampaignContext) => `
Determine the optimal response strategy based on message analysis and communication history.

MESSAGE ANALYSIS: ${JSON.stringify(messageAnalysis)}
COMMUNICATION HISTORY: ${JSON.stringify(communicationHistory)}
CAMPAIGN: ${campaign.title}

RECOMMEND:
1. Response Timing (immediate, within hours, next day, wait)
2. Response Channel (same as incoming, escalate to phone, email, in-app)
3. Response Tone (formal, casual, enthusiastic, understanding)
4. Key Messages to Include
5. Next Steps to Propose
6. Concessions or Incentives to Consider

PROVIDE:
- Specific response strategy
- Draft response outline
- Follow-up plan
- Success probability (0-1)

FORMAT: Actionable recommendations with rationale.`
}

/**
 * UTILITY FUNCTIONS FOR PROMPT GENERATION
 */
export class PromptBuilder {
  
  static buildContextualPrompt(
    template: string,
    variables: Record<string, any>
  ): string {
    let prompt = template
    
    // Replace variable placeholders
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`
      prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value))
    })
    
    return prompt
  }
  
  static addSystemContext(
    prompt: string,
    systemRole: string = "expert influencer marketing AI assistant"
  ): string {
    return `You are an ${systemRole}. ${prompt}`
  }
  
  static addOutputFormat(
    prompt: string,
    format: 'json' | 'markdown' | 'plain' | 'email' = 'plain'
  ): string {
    const formatInstructions = {
      json: "Respond only in valid JSON format.",
      markdown: "Format your response using proper Markdown syntax.",
      email: "Format as a professional email with subject and body.",
      plain: "Respond in clear, plain text format."
    }
    
    return `${prompt}\n\n${formatInstructions[format]}`
  }
  
  static enforceTokenLimit(
    prompt: string,
    maxTokens: number
  ): string {
    const estimatedTokens = prompt.length / 4 // Rough estimate
    
    if (estimatedTokens > maxTokens * 0.7) { // Leave room for response
      console.warn(`Prompt may exceed token limit. Estimated: ${estimatedTokens}, Max: ${maxTokens}`)
    }
    
    return `${prompt}\n\nKeep your response concise and within ${Math.floor(maxTokens * 0.3)} tokens.`
  }
}

/**
 * PREDEFINED PROMPT COMBINATIONS
 */
export const PROMPT_COMBINATIONS = {
  
  // Complete outreach sequence
  emailOutreachSequence: (campaign: CampaignContext, creator: CreatorContext) => [
    OUTREACH_PROMPTS.initialEmail(campaign, creator),
    OUTREACH_PROMPTS.followUpEmail(campaign, creator, "No response to initial email"),
    OUTREACH_PROMPTS.smsMessage(campaign, creator, campaign.budget_max)
  ],
  
  // Negotiation workflow
  negotiationFlow: (campaign: CampaignContext, creator: CreatorContext, messages: string[]) => [
    NEGOTIATION_PROMPTS.analyzeCounterOffer({ budget: campaign.budget_max, deliverables: campaign.deliverables, timeline: campaign.timeline }, messages.join('\n'), campaign),
    // Analysis result would be used for the next prompt
  ],
  
  // Contract generation workflow
  contractWorkflow: (campaign: CampaignContext, creator: CreatorContext, finalTerms: any) => [
    CONTRACT_PROMPTS.generateContract(campaign, creator, finalTerms),
    CONTRACT_PROMPTS.contractRiskAssessment(finalTerms, campaign, creator),
    CONTRACT_PROMPTS.contractSummary("")
  ],
  
  // Complete campaign analysis
  campaignReportSuite: (campaignData: any, metrics: any, outcomes: any) => [
    REPORT_PROMPTS.executiveSummary(campaignData, metrics, outcomes),
    REPORT_PROMPTS.creatorAnalysis(campaignData.creators[0], metrics.creator_metrics),
    REPORT_PROMPTS.campaignInsights(campaignData, metrics.industry_benchmarks)
  ]
} 