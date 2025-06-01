import OpenAI from 'openai'

// Azure OpenAI Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: `${process.env.OPENAI_BASE_URL}openai/deployments/gpt-4.1`,
  defaultQuery: { 'api-version': process.env.OPENAI_API_VERSION || '2024-02-15-preview' },
  defaultHeaders: {
    'api-key': process.env.OPENAI_API_KEY,
  },
})

export { openai }

// Helper function for content generation
export async function generateContent(prompt: string, options?: {
  model?: string
  maxTokens?: number
  temperature?: number
}) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1', // The deployment name
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
    })

    return response.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('Failed to generate content')
  }
}

// Helper function for campaign description generation
export async function generateCampaignDescription(
  brandName: string,
  productType: string,
  targetAudience: string,
  campaignGoals: string
) {
  const prompt = `Create a compelling campaign description for ${brandName} promoting their ${productType} to ${targetAudience}. 
  Campaign goals: ${campaignGoals}
  
  Generate a professional campaign description that includes:
  - Clear campaign objectives
  - Target audience details
  - Key messaging points
  - Expected deliverables
  
  Keep it engaging and under 300 words.`

  return await generateContent(prompt)
}

// Helper function for influencer outreach messages
export async function generateOutreachMessage(
  influencerName: string,
  brandName: string,
  campaignType: string,
  compensation: string
) {
  const prompt = `Write a professional outreach message to influencer ${influencerName} for a ${campaignType} campaign with ${brandName}.
  
  Compensation: ${compensation}
  
  The message should be:
  - Professional but friendly
  - Clear about the opportunity
  - Mention the compensation
  - Include a call to action
  - Under 150 words
  
  Make it personalized and engaging.`

  return await generateContent(prompt)
}

// Helper function for content ideas generation
export async function generateContentIdeas(
  niche: string,
  platform: string,
  campaignTheme: string
) {
  const prompt = `Generate 5 creative content ideas for a ${niche} influencer on ${platform} for a campaign about ${campaignTheme}.
  
  Each idea should include:
  - Content format (post, reel, story, etc.)
  - Brief description
  - Key elements to include
  - Hashtag suggestions
  
  Make them engaging and platform-appropriate.`

  return await generateContent(prompt)
} 