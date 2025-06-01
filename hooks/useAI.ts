import { useState } from 'react'

interface AIGenerationOptions {
  maxTokens?: number
  temperature?: number
  model?: string
}

interface AIHookReturn {
  generateContent: (prompt: string, options?: AIGenerationOptions) => Promise<string>
  generateCampaignDescription: (data: {
    brandName: string
    productType: string
    targetAudience: string
    campaignGoals: string
  }) => Promise<string>
  generateOutreachMessage: (data: {
    influencerName: string
    brandName: string
    campaignType: string
    compensation: string
  }) => Promise<string>
  generateContentIdeas: (data: {
    niche: string
    platform: string
    campaignTheme: string
  }) => Promise<string>
  loading: boolean
  error: string | null
}

export function useAI(): AIHookReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const makeAIRequest = async (type: string, data: any, options?: AIGenerationOptions): Promise<string> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type,
          data: { ...data, options }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate content')
      }

      const result = await response.json()
      return result.content
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const generateContent = async (prompt: string, options?: AIGenerationOptions): Promise<string> => {
    return makeAIRequest('custom', { prompt, options })
  }

  const generateCampaignDescription = async (data: {
    brandName: string
    productType: string
    targetAudience: string
    campaignGoals: string
  }): Promise<string> => {
    return makeAIRequest('campaign-description', data)
  }

  const generateOutreachMessage = async (data: {
    influencerName: string
    brandName: string
    campaignType: string
    compensation: string
  }): Promise<string> => {
    return makeAIRequest('outreach-message', data)
  }

  const generateContentIdeas = async (data: {
    niche: string
    platform: string
    campaignTheme: string
  }): Promise<string> => {
    return makeAIRequest('content-ideas', data)
  }

  return {
    generateContent,
    generateCampaignDescription,
    generateOutreachMessage,
    generateContentIdeas,
    loading,
    error
  }
} 