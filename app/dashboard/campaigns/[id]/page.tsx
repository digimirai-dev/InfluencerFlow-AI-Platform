'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ArrowLeft,
  Edit,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  Target,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  MessageSquare,
  Star,
  Instagram,
  Youtube,
  ExternalLink,
  Brain,
  TrendingUp,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Send,
  Mail,
  Sparkles,
  Handshake,
  X
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface Campaign {
  id: string
  title: string
  description: string
  status: string
  budget_min: number
  budget_max: number
  timeline_start: string
  timeline_end: string
  requirements: string[] | { list: string[]; niches: string[] }
  target_audience: string | { niches: string[]; description: string }
  deliverables: string[]
  applications_count: number
  created_at: string
  brand_profiles?: {
    company_name: string
    industry: string
    location: string
    website: string
    description: string
  }
}

interface Application {
  id: string
  status: string
  proposal_message: string
  proposed_rate: number
  submitted_at: string
  creator_profiles: {
    display_name: string
    bio: string
    follower_count_instagram: number
    follower_count_youtube: number
    engagement_rate: number
    rate_per_post: number
    niche: string[]
    location: string
    users: {
      full_name: string
      avatar_url: string
    }
  }
}

interface Collaboration {
  id: string
  status: string
  agreed_rate: number
  start_date: string
  end_date: string
  deliverables_completed: number
  total_deliverables: number
  creator_profiles: {
    display_name: string
    users: {
      full_name: string
      avatar_url: string
    }
  }
}

interface AIRecommendation {
  id: string
  creator_id: string
  semantic_similarity_score: number
  engagement_score: number
  historical_performance_score: number
  budget_compatibility_score: number
  overall_confidence_score: number
  match_reasoning: string
  recommended_budget: number
  estimated_deliverables: string[]
  status: string
  created_at: string
  creator_profiles: {
    display_name: string
    niche: string[]
    follower_count_instagram: number
    follower_count_youtube: number
    follower_count_tiktok: number
    engagement_rate: number
    rate_per_post: number
    users: {
      full_name: string
      avatar_url: string
    }
  }
}

export default function CampaignDetailPage() {
  const { userProfile } = useAuth()
  const params = useParams()
  const campaignId = params.id as string
  
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [collaborations, setCollaborations] = useState<Collaboration[]>([])
  const [aiRecommendations, setAIRecommendations] = useState<AIRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Outreach modal state
  const [outreachModal, setOutreachModal] = useState(false)
  const [selectedCreator, setSelectedCreator] = useState<AIRecommendation | null>(null)
  const [outreachMessage, setOutreachMessage] = useState('')
  const [outreachSubject, setOutreachSubject] = useState('')
  const [outreachChannel, setOutreachChannel] = useState('email')
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false)
  const [sendingOutreach, setSendingOutreach] = useState(false)

  const [communications, setCommunications] = useState<any[]>([])
  const [communicationsLoading, setCommunicationsLoading] = useState(true)

  // State for negotiations
  const [negotiations, setNegotiations] = useState<any[]>([])
  const [selectedNegotiation, setSelectedNegotiation] = useState<any>(null)
  const [showNegotiationModal, setShowNegotiationModal] = useState(false)
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false)
  const [counterOfferTerms, setCounterOfferTerms] = useState<any>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // State for contracts
  const [contracts, setContracts] = useState<any[]>([])
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [showContractModal, setShowContractModal] = useState(false)
  const [isGeneratingContract, setIsGeneratingContract] = useState(false)

  useEffect(() => {
    if (campaignId && userProfile?.id) {
      fetchCampaignData()
    }
  }, [campaignId, userProfile])

  const fetchCampaignData = async () => {
    try {
      setLoading(true)
      
      // Fetch campaign details
      const campaignResponse = await fetch(`/api/campaigns/${campaignId}`, {
        credentials: 'include'
      })
      if (campaignResponse.ok) {
        const campaignData = await campaignResponse.json()
        setCampaign(campaignData)
      }

      // Fetch applications
      const applicationsResponse = await fetch(`/api/campaigns/${campaignId}/applications`, {
        credentials: 'include'
      })
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json()
        setApplications(applicationsData || [])
      }

      // Fetch collaborations
      const collaborationsResponse = await fetch(`/api/campaigns/${campaignId}/collaborations`, {
        credentials: 'include'
      })
      if (collaborationsResponse.ok) {
        const collaborationsData = await collaborationsResponse.json()
        setCollaborations(collaborationsData || [])
      }

      // Fetch AI recommendations
      console.log('Fetching AI recommendations for campaign:', campaignId)
      const aiRecommendationsResponse = await fetch(`/api/campaigns/${campaignId}/ai-recommendations`, {
        credentials: 'include'
      })
      console.log('AI recommendations response status:', aiRecommendationsResponse.status)
      console.log('AI recommendations response headers:', aiRecommendationsResponse.headers)
      
      if (aiRecommendationsResponse.ok) {
        const aiRecommendationsData = await aiRecommendationsResponse.json()
        console.log('AI recommendations data received:', aiRecommendationsData)
        console.log('Number of recommendations:', aiRecommendationsData?.length || 0)
        setAIRecommendations(aiRecommendationsData || [])
      } else {
        const errorText = await aiRecommendationsResponse.text()
        console.error('Error fetching AI recommendations:', aiRecommendationsResponse.status, errorText)
        console.error('Full response:', aiRecommendationsResponse)
      }

      // Fetch communications
      console.log('Fetching communications for campaign:', campaignId)
      const communicationsResponse = await fetch(`/api/campaigns/${campaignId}/communications`, {
        credentials: 'include'
      })
      console.log('Communications response status:', communicationsResponse.status)
      
      if (communicationsResponse.ok) {
        const communicationsData = await communicationsResponse.json()
        console.log('Communications data received:', communicationsData)
        console.log('Number of communications:', communicationsData?.length || 0)
        setCommunications(communicationsData || [])
      } else {
        const errorText = await communicationsResponse.text()
        console.error('Error fetching communications:', communicationsResponse.status, errorText)
      }
      setCommunicationsLoading(false)

      // Fetch negotiations
      const negotiationsResponse = await fetch(`/api/campaigns/${campaignId}/negotiations`, {
        credentials: 'include'
      })
      console.log('Negotiations response status:', negotiationsResponse.status)
      
      if (negotiationsResponse.ok) {
        const negotiationsData = await negotiationsResponse.json()
        console.log('Negotiations data received:', negotiationsData)
        setNegotiations(negotiationsData)
      } else {
        console.error('Failed to fetch negotiations:', negotiationsResponse.status)
        setNegotiations([])
      }

      // Fetch contracts
      const contractsResponse = await fetch(`/api/campaigns/${campaignId}/contracts`, {
        credentials: 'include'
      })
      console.log('Contracts response status:', contractsResponse.status)
      
      if (contractsResponse.ok) {
        const contractsData = await contractsResponse.json()
        console.log('Contracts data received:', contractsData)
        setContracts(contractsData)
      } else {
        console.error('Failed to fetch contracts:', contractsResponse.status)
        setContracts([])
      }

    } catch (error) {
      console.error('Error fetching campaign data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplicationAction = async (applicationId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`/api/campaign-applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: action === 'accept' ? 'accepted' : 'rejected' }),
      })

      if (response.ok) {
        // Refresh applications
        fetchCampaignData()
      }
    } catch (error) {
      console.error('Error updating application:', error)
    }
  }

  const handleAIRecommendationAction = async (recommendationId: string, action: 'approve' | 'reject' | 'contact') => {
    try {
      console.log('=== AI Recommendation Action ===')
      console.log('Recommendation ID:', recommendationId)
      console.log('Action:', action)
      
      // If action is contact, open outreach modal instead of changing status immediately
      if (action === 'contact') {
        const recommendation = aiRecommendations.find(r => r.id === recommendationId)
        if (recommendation) {
          setSelectedCreator(recommendation)
          setOutreachSubject(`Partnership Opportunity: ${campaign?.title || 'Campaign'}`)
          setOutreachMessage('')
          setOutreachModal(true)
        }
        return
      }
      
      const response = await fetch(`/api/ai-recommendations/${recommendationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: action === 'approve' ? 'approved' : 'rejected' }),
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('Success! Updated recommendation:', result)
        // Refresh AI recommendations
        fetchCampaignData()
      } else {
        const errorText = await response.text()
        console.error('Failed to update recommendation:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error updating AI recommendation:', error)
    }
  }

  const generateAIOutreachMessage = async () => {
    if (!selectedCreator || !campaign) return
    
    setIsGeneratingMessage(true)
    try {
      const response = await fetch('/api/ai/generate-outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          creatorName: selectedCreator.creator_profiles.display_name,
          creatorNiche: selectedCreator.creator_profiles.niche.join(', '),
          campaignTitle: campaign.title,
          campaignDescription: campaign.description,
          recommendedBudget: selectedCreator.recommended_budget,
          deliverables: selectedCreator.estimated_deliverables,
          confidenceScore: selectedCreator.overall_confidence_score,
          matchReasoning: selectedCreator.match_reasoning
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setOutreachMessage(result.message)
      } else {
        console.error('Failed to generate AI message')
        // Fallback message
        setOutreachMessage(`Hi ${selectedCreator.creator_profiles.display_name},

I hope you're doing well! I'm reaching out regarding an exciting collaboration opportunity for our "${campaign.title}" campaign.

Based on your content in ${selectedCreator.creator_profiles.niche.join(', ')}, I believe you'd be a perfect fit for this partnership. We're offering $${selectedCreator.recommended_budget} for creating ${selectedCreator.estimated_deliverables.join(', ')}.

Would you be interested in learning more about this opportunity?

Looking forward to hearing from you!

Best regards`)
      }
    } catch (error) {
      console.error('Error generating AI message:', error)
    } finally {
      setIsGeneratingMessage(false)
    }
  }

  const sendOutreachMessage = async () => {
    if (!selectedCreator || !outreachMessage.trim()) return
    
    setSendingOutreach(true)
    try {
      const response = await fetch('/api/outreach/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          campaignId: campaignId,
          recommendationId: selectedCreator.id,
          creatorId: selectedCreator.creator_id,
          channel: outreachChannel,
          subject: outreachSubject,
          message: outreachMessage,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Outreach sent successfully:', result)
        
        // Close modal and refresh data
        setOutreachModal(false)
        setSelectedCreator(null)
        setOutreachMessage('')
        setOutreachSubject('')
        fetchCampaignData()
        
        // Show success message (you could use a toast here)
        alert('Outreach message sent successfully!')
      } else {
        const errorText = await response.text()
        console.error('Failed to send outreach:', response.status, errorText)
        alert('Failed to send outreach message. Please try again.')
      }
    } catch (error) {
      console.error('Error sending outreach:', error)
      alert('Error sending outreach message. Please try again.')
    } finally {
      setSendingOutreach(false)
    }
  }

  const simulateEmailReply = async (creatorId: string) => {
    try {
      const response = await fetch('/api/test/simulate-email-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          campaignId: campaignId,
          creatorId: creatorId,
          subject: 'Re: Partnership Opportunity: ' + campaign?.title,
          message: `Hi InfluencerFlow Team,

Thank you for reaching out! I am very interested in this Back to School campaign opportunity.

I would love to discuss the details further. My rate for Instagram posts is $250 per post, and I can deliver high-quality content that resonates with students.

When can we schedule a call to discuss this further?

Best regards,
Gaurav Patil`
        }),
      })

      if (response.ok) {
        console.log('Email reply simulated successfully')
        fetchCampaignData() // Refresh to show the new reply
        alert('✅ Email reply simulated! Check the communications tab.')
      } else {
        console.error('Failed to simulate email reply')
        alert('Failed to simulate email reply')
      }
    } catch (error) {
      console.error('Error simulating email reply:', error)
      alert('Error simulating email reply')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-blue-100 text-blue-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAvatarUrl = (name: string) => {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'indigo', 'teal']
    const colorIndex = name.charCodeAt(0) % colors.length
    const color = colors[colorIndex]
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=40`
  }

  // Analyze communication for negotiation potential
  const analyzeForNegotiation = async (communication: any) => {
    if (isAnalyzing) return
    
    setIsAnalyzing(true)
    try {
      console.log('Analyzing communication for negotiation:', communication.id)
      
      const response = await fetch('/api/ai/analyze-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          communicationId: communication.id,
          campaignBudget: { min: campaign?.budget_min || 0, max: campaign?.budget_max || 0 },
          creatorProfile: communication.creator_profiles
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Analysis result:', result)
        
        if (result.requires_negotiation) {
          // Refresh negotiations to show the new one
          await fetchNegotiations()
          alert('New negotiation started! Check the Negotiations tab.')
        } else {
          alert(`Analysis complete: ${result.analysis.analysis_summary}`)
        }
      } else {
        console.error('Failed to analyze communication:', response.status)
        alert('Failed to analyze communication')
      }
    } catch (error) {
      console.error('Error analyzing communication:', error)
      alert('Error analyzing communication')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Fetch negotiations for this campaign
  const fetchNegotiations = async () => {
    try {
      console.log('Fetching negotiations for campaign:', campaignId)
      const response = await fetch(`/api/campaigns/${campaignId}/negotiations`, {
        credentials: 'include'
      })
      console.log('Negotiations response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Negotiations data received:', data)
        setNegotiations(data)
      } else {
        console.error('Failed to fetch negotiations:', response.status)
        setNegotiations([])
      }
    } catch (error) {
      console.error('Error fetching negotiations:', error)
      setNegotiations([])
    }
  }

  // Handle communication reply
  const handleCommunicationReply = (communication: any) => {
    // For now, just open a simple alert
    // In a full implementation, this would open a reply modal
    alert(`Reply to ${communication.creator_profiles?.display_name || 'Creator'}: Feature coming soon!`)
  }

  // Handle viewing negotiation details
  const handleViewNegotiationDetails = async (negotiation: any) => {
    try {
      console.log('Viewing negotiation details:', negotiation.id)
      
      const response = await fetch(`/api/negotiations/${negotiation.id}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const detailedNegotiation = await response.json()
        console.log('Detailed negotiation data:', detailedNegotiation)
        
        setSelectedNegotiation(detailedNegotiation)
        setShowNegotiationModal(true)
      } else {
        alert('Failed to load negotiation details.')
      }
    } catch (error) {
      console.error('Error loading negotiation details:', error)
      alert('Failed to load negotiation details.')
    }
  }

  // Handle making a counter-offer
  const handleMakeCounterOffer = (negotiation: any) => {
    console.log('Making counter-offer for:', negotiation.id)
    
    // Set initial terms from current negotiation
    const initialTerms = {
      total_rate: negotiation.current_terms?.total_rate || '',
      deliverables: negotiation.current_terms?.deliverables || '',
      timeline: negotiation.current_terms?.timeline || ''
    }
    
    setSelectedNegotiation(negotiation)
    setCounterOfferTerms(initialTerms)
    setShowCounterOfferModal(true)
  }

  // Handle submitting counter-offer
  const handleSubmitCounterOffer = async () => {
    if (!selectedNegotiation) return
    
    try {
      const response = await fetch(`/api/negotiations/${selectedNegotiation.id}/counter-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          proposedTerms: counterOfferTerms,
          responseMessage: `Counter-offer: $${counterOfferTerms.total_rate} for ${counterOfferTerms.deliverables}`
        })
      })

      if (response.ok) {
        alert('Counter-offer submitted successfully!')
        setShowCounterOfferModal(false)
        setCounterOfferTerms({})
        
        // Refresh negotiations
        fetchCampaignData()
      } else {
        alert('Failed to submit counter-offer.')
      }
    } catch (error) {
      console.error('Error submitting counter-offer:', error)
      alert('Failed to submit counter-offer.')
    }
  }

  // Handle generating contract from negotiation
  const handleGenerateContract = async (negotiation: any) => {
    if (isGeneratingContract) return
    
    setIsGeneratingContract(true)
    try {
      console.log('Generating contract for negotiation:', negotiation.id)
      
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          negotiationId: negotiation.id,
          contractType: 'collaboration'
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Contract generated:', result)
        alert('Contract generated successfully!')
        
        // Refresh data
        fetchCampaignData()
      } else {
        const errorText = await response.text()
        console.error('Failed to generate contract:', response.status, errorText)
        alert('Failed to generate contract.')
      }
    } catch (error) {
      console.error('Error generating contract:', error)
      alert('Error generating contract.')
    } finally {
      setIsGeneratingContract(false)
    }
  }

  // Handle viewing contract details
  const handleViewContract = async (contract: any) => {
    try {
      console.log('Viewing contract details:', contract.id)
      
      const response = await fetch(`/api/contracts/${contract.id}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const detailedContract = await response.json()
        console.log('Detailed contract data:', detailedContract)
        
        setSelectedContract(detailedContract)
        setShowContractModal(true)
      } else {
        alert('Failed to load contract details.')
      }
    } catch (error) {
      console.error('Error loading contract details:', error)
      alert('Failed to load contract details.')
    }
  }

  // Handle contract signing
  const handleSignContract = async (contractId: string, signerType: 'brand' | 'creator') => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          signerType: signerType,
          signatureData: `${signerType}_signature_${Date.now()}`, // In real app, this would be actual signature data
          ipAddress: '127.0.0.1', // In real app, get actual IP
          userAgent: navigator.userAgent
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        
        // Refresh data
        fetchCampaignData()
        setShowContractModal(false)
      } else {
        alert('Failed to sign contract.')
      }
    } catch (error) {
      console.error('Error signing contract:', error)
      alert('Error signing contract.')
    }
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Campaign not found</h3>
          <p className="text-gray-600 mb-4">The campaign you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/dashboard/campaigns">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Campaigns
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{campaign.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-gray-600">{campaign.brand_profiles?.company_name || 'Unknown Company'}</span>
              <Badge className={getStatusColor(campaign.status)}>
                {campaign.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/dashboard/campaigns/${campaign.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Budget</p>
                <p className="font-semibold">
                  ${campaign.budget_min?.toLocaleString() || '0'} - ${campaign.budget_max?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Applications</p>
                <p className="font-semibold">{applications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Active Collaborations</p>
                <p className="font-semibold">{collaborations.filter(c => c.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Deadline</p>
                <p className="font-semibold">
                  {campaign.timeline_end ? new Date(campaign.timeline_end).toLocaleDateString() : 'Not set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="overview" className="whitespace-nowrap">Overview</TabsTrigger>
          <TabsTrigger value="ai-recommendations" className="whitespace-nowrap">
            AI Recommendations ({aiRecommendations.length})
          </TabsTrigger>
          <TabsTrigger value="applications" className="whitespace-nowrap">
            Applications ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="collaborations" className="whitespace-nowrap">
            Collaborations ({collaborations.length})
          </TabsTrigger>
          <TabsTrigger value="communications" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Communications</span>
            {communications.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {communications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="negotiations" className="flex items-center space-x-2">
            <Handshake className="h-4 w-4" />
            <span>Negotiations</span>
            {negotiations.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {negotiations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Contracts</span>
            {contracts.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {contracts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{campaign.description}</p>
                </CardContent>
              </Card>

              {campaign.deliverables && campaign.deliverables.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Deliverables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {campaign.deliverables.map((deliverable, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{deliverable}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {campaign.requirements && (
                (Array.isArray(campaign.requirements) && campaign.requirements.length > 0) ||
                (typeof campaign.requirements === 'object' && campaign.requirements !== null && 
                 (campaign.requirements as any).list?.length > 0)
              ) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(() => {
                        // Handle case where requirements might be an object
                        let requirementsList: string[] = [];
                        
                        if (Array.isArray(campaign.requirements)) {
                          requirementsList = campaign.requirements;
                        } else if (typeof campaign.requirements === 'object' && campaign.requirements !== null) {
                          const reqObj = campaign.requirements as { list?: string[]; niches?: string[] };
                          requirementsList = reqObj.list || [];
                          // Also include niches if available
                          if (reqObj.niches && Array.isArray(reqObj.niches)) {
                            requirementsList = [...requirementsList, ...reqObj.niches.map((niche: string) => `${niche} content`)];
                          }
                        }
                        
                        return requirementsList.map((requirement, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Target className="h-4 w-4 text-blue-600" />
                            <span>{requirement}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Timeline</p>
                      <p className="font-medium">
                        {campaign.timeline_start && campaign.timeline_end
                          ? `${new Date(campaign.timeline_start).toLocaleDateString()} - ${new Date(campaign.timeline_end).toLocaleDateString()}`
                          : 'Not set'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Target Audience</p>
                      <p className="font-medium">
                        {(() => {
                          if (typeof campaign.target_audience === 'string') {
                            return campaign.target_audience || 'General audience';
                          } else if (typeof campaign.target_audience === 'object' && campaign.target_audience !== null) {
                            const audienceObj = campaign.target_audience as { niches?: string[]; description?: string };
                            const parts = [];
                            if (audienceObj.description) parts.push(audienceObj.description);
                            if (audienceObj.niches && audienceObj.niches.length > 0) {
                              parts.push(`(${audienceObj.niches.join(', ')})`);
                            }
                            return parts.length > 0 ? parts.join(' ') : 'General audience';
                          }
                          return 'General audience';
                        })()}
                      </p>
                    </div>
                  </div>
                  
                  {campaign.created_at && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Created</p>
                        <p className="font-medium">{new Date(campaign.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Brand Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium">{campaign.brand_profiles?.company_name || 'Unknown Company'}</p>
                    <p className="text-sm text-gray-600">{campaign.brand_profiles?.industry || 'Unknown Industry'}</p>
                  </div>
                  
                  {campaign.brand_profiles?.description && (
                    <p className="text-sm text-gray-700">{campaign.brand_profiles.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{campaign.brand_profiles?.location || 'Unknown Location'}</span>
                  </div>
                  
                  {campaign.brand_profiles?.website && (
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                      <a 
                        href={campaign.brand_profiles.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai-recommendations" className="space-y-6">
          {aiRecommendations.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">AI-Generated Creator Recommendations</h3>
                  <p className="text-sm text-gray-600">Our AI has analyzed and recommended these creators for your campaign</p>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  <Brain className="mr-1 h-3 w-3" />
                  AI Powered
                </Badge>
              </div>

              {aiRecommendations.map((recommendation) => (
                <Card key={recommendation.id} className="border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage 
                          src={recommendation.creator_profiles.users.avatar_url || getAvatarUrl(recommendation.creator_profiles.display_name)} 
                          alt={recommendation.creator_profiles.display_name} 
                        />
                        <AvatarFallback>{recommendation.creator_profiles.display_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-semibold">{recommendation.creator_profiles.display_name}</h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <span>{recommendation.creator_profiles.niche?.join(', ') || 'No niche specified'}</span>
                              <span>•</span>
                              <div className="flex items-center space-x-1">
                                <Sparkles className="h-3 w-3 text-purple-600" />
                                <span className="font-medium text-purple-600">
                                  {Math.round(recommendation.overall_confidence_score * 100)}% AI Match
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600">
                              ${recommendation.recommended_budget?.toLocaleString() || 'TBD'}
                            </div>
                            <div className="text-sm text-gray-600">Recommended budget</div>
                          </div>
                        </div>
                        
                        {/* AI Scoring Grid */}
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <div className="text-lg font-semibold text-blue-600">
                              {Math.round(recommendation.semantic_similarity_score * 100)}%
                            </div>
                            <div className="text-xs text-gray-600">Niche Match</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded-lg">
                            <div className="text-lg font-semibold text-green-600">
                              {Math.round(recommendation.engagement_score * 100)}%
                            </div>
                            <div className="text-xs text-gray-600">Engagement</div>
                          </div>
                          <div className="text-center p-2 bg-yellow-50 rounded-lg">
                            <div className="text-lg font-semibold text-yellow-600">
                              {Math.round(recommendation.historical_performance_score * 100)}%
                            </div>
                            <div className="text-xs text-gray-600">Performance</div>
                          </div>
                          <div className="text-center p-2 bg-purple-50 rounded-lg">
                            <div className="text-lg font-semibold text-purple-600">
                              {Math.round(recommendation.budget_compatibility_score * 100)}%
                            </div>
                            <div className="text-xs text-gray-600">Budget Fit</div>
                          </div>
                        </div>

                        {/* Creator Stats */}
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <Instagram className="h-4 w-4 text-pink-600" />
                            <span>{(recommendation.creator_profiles.follower_count_instagram || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Youtube className="h-4 w-4 text-red-600" />
                            <span>{(recommendation.creator_profiles.follower_count_youtube || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-600" />
                            <span>{recommendation.creator_profiles.engagement_rate || 0}% engagement</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span>${(recommendation.creator_profiles.rate_per_post || 0).toLocaleString()}/post</span>
                          </div>
                        </div>
                        
                        {/* AI Reasoning */}
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Brain className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">AI Analysis</p>
                              <p className="text-sm text-gray-700 mt-1">{recommendation.match_reasoning}</p>
                            </div>
                          </div>
                        </div>

                        {/* Estimated Deliverables */}
                        {recommendation.estimated_deliverables && recommendation.estimated_deliverables.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-900 mb-2">Estimated Deliverables</p>
                            <div className="flex flex-wrap gap-2">
                              {recommendation.estimated_deliverables.map((deliverable, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {deliverable}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {recommendation.status === 'suggested' && (
                          <div className="mt-4 flex space-x-2">
                            <Button 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleAIRecommendationAction(recommendation.id, 'approve')}
                            >
                              <ThumbsUp className="mr-2 h-4 w-4" />
                              Approve & Contact
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAIRecommendationAction(recommendation.id, 'contact')}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Send Message
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAIRecommendationAction(recommendation.id, 'reject')}
                            >
                              <ThumbsDown className="mr-2 h-4 w-4" />
                              Not Interested
                            </Button>
                          </div>
                        )}

                        {recommendation.status === 'approved' && (
                          <div className="mt-4 flex items-center justify-between">
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Approved - Ready for outreach
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAIRecommendationAction(recommendation.id, 'contact')}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Send Outreach
                            </Button>
                          </div>
                        )}

                        {recommendation.status === 'contacted' && (
                          <div className="mt-4">
                            <Badge className="bg-blue-100 text-blue-800">
                              <MessageSquare className="mr-1 h-3 w-3" />
                              Message sent - Awaiting response
                            </Badge>
                          </div>
                        )}

                        {recommendation.status === 'responded' && (
                          <div className="mt-4">
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Mail className="mr-1 h-3 w-3" />
                              Response received - Check messages
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No AI recommendations yet</h3>
                <p className="text-gray-600 mb-4">
                  Our AI is analyzing creators for your campaign. Recommendations will appear here shortly.
                </p>
                <Button variant="outline" onClick={fetchCampaignData}>
                  <Zap className="mr-2 h-4 w-4" />
                  Refresh Recommendations
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          {applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={application.creator_profiles.users.avatar_url} />
                        <AvatarFallback>
                          <img 
                            src={getAvatarUrl(application.creator_profiles.display_name)} 
                            alt={application.creator_profiles.display_name}
                            className="w-full h-full object-cover"
                          />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{application.creator_profiles.display_name}</h3>
                            <p className="text-sm text-gray-600">{application.creator_profiles.location}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(application.status)}>
                              {application.status}
                            </Badge>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatDistanceToNow(new Date(application.submitted_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <Instagram className="h-4 w-4 text-pink-600" />
                            <span>{(application.creator_profiles.follower_count_instagram || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Youtube className="h-4 w-4 text-red-600" />
                            <span>{(application.creator_profiles.follower_count_youtube || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-600" />
                            <span>{application.creator_profiles.engagement_rate || 0}% engagement</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span>${(application.proposed_rate || application.creator_profiles.rate_per_post || 0).toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <p className="text-sm text-gray-700">{application.proposal_message}</p>
                        </div>
                        
                        <div className="mt-3 flex flex-wrap gap-1">
                          {application.creator_profiles.niche.map((niche, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {niche}
                            </Badge>
                          ))}
                        </div>
                        
                        {application.status === 'pending' && (
                          <div className="mt-4 flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleApplicationAction(application.id, 'accept')}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleApplicationAction(application.id, 'reject')}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                            <Button size="sm" variant="ghost">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Message
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                <p className="text-gray-600">Applications will appear here once creators start applying to your campaign.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="collaborations" className="space-y-6">
          {collaborations.length > 0 ? (
            <div className="space-y-4">
              {collaborations.map((collaboration) => (
                <Card key={collaboration.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={collaboration.creator_profiles.users.avatar_url} />
                        <AvatarFallback>
                          <img 
                            src={getAvatarUrl(collaboration.creator_profiles.display_name)} 
                            alt={collaboration.creator_profiles.display_name}
                            className="w-full h-full object-cover"
                          />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{collaboration.creator_profiles.display_name}</h3>
                            <p className="text-sm text-gray-600">${(collaboration.agreed_rate || 0).toLocaleString()} agreed rate</p>
                          </div>
                          <Badge className={getStatusColor(collaboration.status)}>
                            {collaboration.status}
                          </Badge>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Start Date</p>
                            <p className="font-medium">{new Date(collaboration.start_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">End Date</p>
                            <p className="font-medium">{new Date(collaboration.end_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">
                              {collaboration.deliverables_completed} / {collaboration.total_deliverables} deliverables
                            </span>
                          </div>
                          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ 
                                width: `${(collaboration.deliverables_completed / collaboration.total_deliverables) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex space-x-2">
                          <Link href={`/dashboard/collaborations/${collaboration.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                          </Link>
                          <Button size="sm" variant="ghost">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active collaborations</h3>
                <p className="text-gray-600">Collaborations will appear here once you accept applications.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="communications" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Communications</h3>
            {/* Test Button for Development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/test/add-sample-communication', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ campaignId: campaignId })
                      })
                      if (response.ok) {
                        const result = await response.json()
                        alert(result.message)
                        fetchCampaignData() // Refresh to show new communication
                      } else {
                        alert('Failed to add sample communication')
                      }
                    } catch (error) {
                      console.error('Error:', error)
                      alert('Error adding sample communication')
                    }
                  }}
                >
                  📝 Add Sample Response
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Find a creator who has been contacted
                    const contactedCreator = aiRecommendations.find(r => r.status === 'contacted')
                    if (contactedCreator) {
                      simulateEmailReply(contactedCreator.creator_id)
                    } else {
                      alert('Send an outreach message first to test email replies')
                    }
                  }}
                >
                  🧪 Test Email Reply
                </Button>
              </div>
            )}
          </div>

          {communicationsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : communications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No communications yet</h3>
                <p className="text-gray-500">
                  Communication logs will appear here once you start reaching out to creators.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {communications.map((comm, index) => (
                <Card key={comm.id || index} className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      comm.direction === 'outbound' ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{comm.subject}</h4>
                          <Badge variant={comm.direction === 'outbound' ? 'default' : 'secondary'}>
                            {comm.direction === 'outbound' ? 'Sent' : 'Received'}
                          </Badge>
                          <Badge variant="outline">{comm.channel}</Badge>
                          {comm.ai_generated && (
                            <Badge variant="outline" className="text-purple-600 border-purple-200">
                              🤖 AI Generated
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          {comm.delivered && (
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              ✓ Delivered
                            </Badge>
                          )}
                          {comm.read && (
                            <Badge variant="outline" className="text-blue-600 border-blue-200">
                              ✓ Read
                            </Badge>
                          )}
                          {comm.responded && (
                            <Badge variant="outline" className="text-purple-600 border-purple-200">
                              ✓ Responded
                            </Badge>
                          )}
                          <span>{new Date(comm.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 mb-3">
                        <p className="text-sm whitespace-pre-wrap">{comm.content}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {comm.direction === 'outbound' ? 'To' : 'From'}: {comm.creator_name || 'Creator'}
                        </span>
                        <span>{new Date(comm.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCommunicationReply(comm)}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Reply
                    </Button>
                    {comm.direction === 'inbound' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => analyzeForNegotiation(comm)}
                        disabled={isAnalyzing}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isAnalyzing ? 'Analyzing...' : 'AI Analyze'}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="negotiations" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">AI-Powered Negotiations</h3>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">
                Active negotiations and contract discussions
              </div>
              {/* Test Button for Development */}
              {process.env.NODE_ENV === 'development' && negotiations.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        const activeNegotiation = negotiations.find(n => n.status === 'active')
                        if (!activeNegotiation) {
                          alert('No active negotiations to set as agreed')
                          return
                        }
                        
                        const response = await fetch('/api/test/set-negotiation-agreed', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ negotiationId: activeNegotiation.id })
                        })
                        
                        if (response.ok) {
                          const result = await response.json()
                          alert(result.message)
                          fetchCampaignData() // Refresh to show updated status
                        } else {
                          alert('Failed to set negotiation as agreed')
                        }
                      } catch (error) {
                        console.error('Error:', error)
                        alert('Error setting negotiation as agreed')
                      }
                    }}
                  >
                    🧪 Set as Agreed (Test)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        const firstNegotiation = negotiations[0]
                        if (!firstNegotiation) {
                          alert('No negotiations available')
                          return
                        }
                        
                        const response = await fetch('/api/test/add-contract-field', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ negotiationId: firstNegotiation.id })
                        })
                        
                        if (response.ok) {
                          const result = await response.json()
                          alert(result.message)
                          fetchCampaignData() // Refresh to show updated status
                        } else {
                          const errorData = await response.json()
                          alert(`Failed: ${errorData.error}`)
                        }
                      } catch (error) {
                        console.error('Error:', error)
                        alert('Error testing contract field')
                      }
                    }}
                  >
                    🔧 Test Contract Field
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {negotiations.length > 0 ? (
            <div className="space-y-4">
              {negotiations.map((negotiation) => (
                <Card key={negotiation.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={negotiation.creator_profiles?.users?.avatar_url} />
                        <AvatarFallback>
                          {negotiation.creator_profiles?.display_name?.substring(0, 2) || 'CR'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{negotiation.creator_profiles?.display_name || 'Creator'}</h3>
                            <p className="text-sm text-gray-600">
                              {negotiation.current_terms?.total_rate 
                                ? `$${negotiation.current_terms.total_rate} current offer`
                                : 'Terms being negotiated'
                              }
                            </p>
                          </div>
                          <Badge className={`${
                            negotiation.status === 'agreed' ? 'bg-green-100 text-green-800' :
                            negotiation.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            negotiation.status === 'declined' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {negotiation.status}
                          </Badge>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Round</p>
                            <p className="font-medium">{negotiation.current_round} / {negotiation.max_rounds}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Started</p>
                            <p className="font-medium">{new Date(negotiation.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        {negotiation.ai_analysis?.analysis_summary && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <Sparkles className="inline w-4 h-4 mr-1" />
                              AI Insight: {negotiation.ai_analysis.analysis_summary}
                            </p>
                          </div>
                        )}
                        
                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewNegotiationDetails(negotiation)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View Details
                          </Button>
                          {negotiation.status === 'agreed' ? (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleGenerateContract(negotiation)}
                              disabled={isGeneratingContract}
                              className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                            >
                              {isGeneratingContract ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              ) : (
                                <Handshake className="h-3 w-3" />
                              )}
                              {isGeneratingContract ? 'Generating...' : 'Generate Contract'}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMakeCounterOffer(negotiation)}
                              className="flex items-center gap-1"
                            >
                              <MessageSquare className="h-3 w-3" />
                              Make Counter-Offer
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Handshake className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active negotiations</h3>
                <p className="text-gray-600 mb-4">Start negotiations by analyzing creator responses with AI.</p>
                <div className="text-sm text-blue-600">
                  💡 Tip: Look for creator responses in Communications and click "AI Analyze" to extract terms and start negotiations automatically.
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Contract Management</h3>
            <div className="text-sm text-gray-500">
              Generated contracts and signature tracking
            </div>
          </div>
          
          {contracts.length > 0 ? (
            <div className="space-y-4">
              {contracts.map((contract) => (
                <Card key={contract.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={contract.negotiations?.creator_profiles?.users?.avatar_url} />
                        <AvatarFallback>
                          {contract.negotiations?.creator_profiles?.display_name?.substring(0, 2) || 'CR'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{contract.negotiations?.creator_profiles?.display_name || 'Creator'}</h3>
                            <p className="text-sm text-gray-600">
                              ${contract.contract_terms?.compensation?.total_amount?.toLocaleString() || 'TBD'} - {contract.contract_type || 'Collaboration'}
                            </p>
                          </div>
                          <Badge className={`${
                            contract.status === 'signed' ? 'bg-green-100 text-green-800' :
                            contract.status === 'partially_signed' ? 'bg-yellow-100 text-yellow-800' :
                            contract.status === 'draft' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {contract.status}
                          </Badge>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Contract Type</p>
                            <p className="font-medium capitalize">{contract.contract_type || 'Collaboration'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Generated</p>
                            <p className="font-medium">{new Date(contract.created_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Brand Signed</p>
                            <p className="font-medium">{contract.signature_data?.brand_signed ? '✓ Signed' : 'Pending'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Creator Signed</p>
                            <p className="font-medium">{contract.signature_data?.creator_signed ? '✓ Signed' : 'Pending'}</p>
                          </div>
                        </div>
                        
                        {contract.contract_terms?.deliverables?.content_requirements && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-900 mb-2">Deliverables</p>
                            <div className="flex flex-wrap gap-2">
                              {contract.contract_terms.deliverables.content_requirements.map((deliverable: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {deliverable}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {contract.contract_terms?.ai_generated && (
                          <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                            <p className="text-sm text-purple-800">
                              <Sparkles className="inline w-4 h-4 mr-1" />
                              AI-Generated Contract - Comprehensive terms automatically created based on negotiation
                            </p>
                          </div>
                        )}
                        
                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewContract(contract)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View Contract
                          </Button>
                          {!contract.signature_data?.brand_signed && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleSignContract(contract.id, 'brand')}
                              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
                            >
                              <Handshake className="h-3 w-3" />
                              Sign as Brand
                            </Button>
                          )}
                          {process.env.NODE_ENV === 'development' && !contract.signature_data?.creator_signed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSignContract(contract.id, 'creator')}
                              className="flex items-center gap-1"
                            >
                              <Handshake className="h-3 w-3" />
                              Sign as Creator (Demo)
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Handshake className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts yet</h3>
                <p className="text-gray-600 mb-4">Contracts will appear here once negotiations are finalized.</p>
                <div className="text-sm text-blue-600">
                  💡 Tip: Complete negotiations and click "Generate Contract" to create AI-powered contracts automatically.
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Outreach Modal */}
      <Dialog open={outreachModal} onOpenChange={setOutreachModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Send className="h-5 w-5 text-purple-600" />
              <span>Send Outreach Message</span>
            </DialogTitle>
            <DialogDescription>
              Send a personalized message to this creator about your campaign collaboration opportunity.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCreator && (
            <div className="space-y-4">
              {/* Creator Info */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={selectedCreator.creator_profiles.users.avatar_url || getAvatarUrl(selectedCreator.creator_profiles.display_name)} 
                    alt={selectedCreator.creator_profiles.display_name} 
                  />
                  <AvatarFallback>{selectedCreator.creator_profiles.display_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedCreator.creator_profiles.display_name}</p>
                  <p className="text-sm text-gray-600">{selectedCreator.creator_profiles.niche?.join(', ')}</p>
                </div>
                <div className="ml-auto">
                  <Badge variant="secondary">
                    {Math.round(selectedCreator.overall_confidence_score * 100)}% AI Match
                  </Badge>
                </div>
              </div>

              {/* Channel Selection */}
              <div className="space-y-2">
                <Label htmlFor="channel">Communication Channel</Label>
                <Select value={outreachChannel} onValueChange={setOutreachChannel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="in_app">In-App Message</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Line */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={outreachSubject}
                  onChange={(e) => setOutreachSubject(e.target.value)}
                  placeholder="Enter subject line..."
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="message">Message</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateAIOutreachMessage}
                    disabled={isGeneratingMessage}
                  >
                    {isGeneratingMessage ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600 mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-3 w-3" />
                        Generate AI Message
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="message"
                  value={outreachMessage}
                  onChange={(e) => setOutreachMessage(e.target.value)}
                  placeholder="Write your outreach message..."
                  rows={8}
                  className="resize-none"
                />
              </div>

              {/* Preview */}
              {outreachMessage && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-2">Message Preview</p>
                  <div className="text-sm text-blue-800 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {outreachMessage}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOutreachModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={sendOutreachMessage}
              disabled={!outreachMessage.trim() || sendingOutreach}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {sendingOutreach ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Negotiation Details Modal (Read-only) */}
      {showNegotiationModal && selectedNegotiation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold">Negotiation Details</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNegotiationModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Creator Info */}
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedNegotiation.creator_profiles?.users?.avatar_url} />
                  <AvatarFallback>
                    {selectedNegotiation.creator_profiles?.display_name?.substring(0, 2) || 'CR'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{selectedNegotiation.creator_profiles?.display_name || 'Creator'}</h4>
                  <p className="text-sm text-gray-600">Round {selectedNegotiation.current_round} of {selectedNegotiation.max_rounds}</p>
                </div>
              </div>

              {/* Current Terms */}
              <div>
                <h5 className="font-medium mb-3">Current Terms</h5>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div><strong>Total Rate:</strong> ${selectedNegotiation.current_terms?.total_rate || 'Not specified'}</div>
                  <div><strong>Deliverables:</strong> {selectedNegotiation.current_terms?.deliverables || 'Not specified'}</div>
                  <div><strong>Timeline:</strong> {selectedNegotiation.current_terms?.timeline || 'Not specified'}</div>
                </div>
              </div>

              {/* Original Creator Terms */}
              {selectedNegotiation.creator_terms && (
                <div>
                  <h5 className="font-medium mb-3">Original Creator Proposal</h5>
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <div><strong>Total Rate:</strong> ${selectedNegotiation.creator_terms.total_rate || 'Not specified'}</div>
                    <div><strong>Deliverables:</strong> {selectedNegotiation.creator_terms.deliverables || 'Not specified'}</div>
                    <div><strong>Timeline:</strong> {selectedNegotiation.creator_terms.timeline || 'Not specified'}</div>
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              {selectedNegotiation.ai_analysis && (
                <div>
                  <h5 className="font-medium mb-3">AI Analysis</h5>
                  <div className="bg-purple-50 p-4 rounded-lg space-y-2">
                    <div><strong>Interest Level:</strong> {selectedNegotiation.ai_analysis.interest_level}</div>
                    <div><strong>Budget Compatibility:</strong> {selectedNegotiation.ai_analysis.budget_compatibility}%</div>
                    {selectedNegotiation.ai_analysis.insights && (
                      <div><strong>Insights:</strong> {selectedNegotiation.ai_analysis.insights.join(', ')}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Negotiation History */}
              {selectedNegotiation.negotiation_rounds && selectedNegotiation.negotiation_rounds.length > 0 && (
                <div>
                  <h5 className="font-medium mb-3">Negotiation History</h5>
                  <div className="space-y-3">
                    {selectedNegotiation.negotiation_rounds.map((round: any, index: number) => (
                      <div key={index} className="border p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Round {round.round_number} - {round.initiated_by}</div>
                        <div className="mt-1">{round.response_message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Counter-Offer Modal (Editable Form) */}
      {showCounterOfferModal && selectedNegotiation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold">Make Counter-Offer</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCounterOfferModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Review and manage the negotiation process
            </p>

            {/* Creator Info */}
            <div className="flex items-center gap-3 mb-6">
              <Avatar>
                <AvatarImage src={selectedNegotiation.creator_profiles?.users?.avatar_url} />
                <AvatarFallback>
                  {selectedNegotiation.creator_profiles?.display_name?.substring(0, 2) || 'CR'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">{selectedNegotiation.creator_profiles?.display_name || 'Creator'}</h4>
                <p className="text-sm text-gray-600">${selectedNegotiation.current_terms?.total_rate || 0} current offer</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="total_rate">Proposed Total Rate</Label>
                <Input
                  id="total_rate"
                  type="number"
                  value={counterOfferTerms.total_rate}
                  onChange={(e) => setCounterOfferTerms({ ...counterOfferTerms, total_rate: e.target.value })}
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <Label htmlFor="deliverables">Proposed Deliverables</Label>
                <Input
                  id="deliverables"
                  value={counterOfferTerms.deliverables}
                  onChange={(e) => setCounterOfferTerms({ ...counterOfferTerms, deliverables: e.target.value })}
                  placeholder="e.g. 2 Instagram posts, 1 Story series"
                />
              </div>

              <div>
                <Label htmlFor="timeline">Proposed Timeline</Label>
                <Input
                  id="timeline"
                  value={counterOfferTerms.timeline}
                  onChange={(e) => setCounterOfferTerms({ ...counterOfferTerms, timeline: e.target.value })}
                  placeholder="e.g. 2 weeks"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCounterOfferModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitCounterOffer}
                disabled={!counterOfferTerms.total_rate || !counterOfferTerms.deliverables || !counterOfferTerms.timeline}
                className="bg-purple-600 hover:bg-purple-700 flex-1"
              >
                Submit Counter-Offer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Details Modal */}
      {showContractModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Handshake className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Contract Details</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowContractModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Contract Header */}
              <div className="border-b pb-4">
                <h2 className="text-xl font-semibold">{selectedContract.contract_terms?.contract_title || 'Collaboration Agreement'}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <Badge className={`${
                    selectedContract.status === 'signed' ? 'bg-green-100 text-green-800' :
                    selectedContract.status === 'partially_signed' ? 'bg-yellow-100 text-yellow-800' :
                    selectedContract.status === 'draft' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedContract.status}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Generated: {new Date(selectedContract.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Parties Information */}
              <div>
                <h4 className="font-medium mb-3">Parties</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium">Brand</h5>
                    <p>{selectedContract.contract_terms?.parties?.brand?.company_name || 'Brand Company'}</p>
                    <p className="text-sm text-gray-600">{selectedContract.contract_terms?.parties?.brand?.email || 'brand@email.com'}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-medium">Creator</h5>
                    <p>{selectedContract.contract_terms?.parties?.creator?.name || 'Creator'}</p>
                    <p className="text-sm text-gray-600">{selectedContract.contract_terms?.parties?.creator?.email || 'creator@email.com'}</p>
                  </div>
                </div>
              </div>

              {/* Financial Terms */}
              {selectedContract.contract_terms?.compensation && (
                <div>
                  <h4 className="font-medium mb-3">Financial Terms</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <strong>Total Amount:</strong> ${selectedContract.contract_terms.compensation.total_amount?.toLocaleString()} {selectedContract.contract_terms.compensation.currency}
                    </div>
                    <div>
                      <strong>Payment Method:</strong> {selectedContract.contract_terms.compensation.payment_method}
                    </div>
                    <div>
                      <strong>Payment Terms:</strong> {selectedContract.contract_terms.compensation.payment_terms}
                    </div>
                    {selectedContract.contract_terms.compensation.payment_schedule && (
                      <div>
                        <strong>Payment Schedule:</strong>
                        <ul className="mt-1 ml-4 space-y-1">
                          {selectedContract.contract_terms.compensation.payment_schedule.map((payment: any, index: number) => (
                            <li key={index} className="text-sm">
                              • {payment.milestone}: ${payment.amount} ({payment.percentage}%) - {payment.due_date}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Deliverables */}
              {selectedContract.contract_terms?.deliverables && (
                <div>
                  <h4 className="font-medium mb-3">Deliverables & Timeline</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    {selectedContract.contract_terms.deliverables.content_requirements && (
                      <div>
                        <strong>Content Requirements:</strong>
                        <ul className="mt-1 ml-4 space-y-1">
                          {selectedContract.contract_terms.deliverables.content_requirements.map((req: string, index: number) => (
                            <li key={index} className="text-sm">• {req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedContract.contract_terms.deliverables.timeline && (
                      <div>
                        <strong>Timeline:</strong>
                        <ul className="mt-1 ml-4 space-y-1">
                          <li className="text-sm">• Creation Deadline: {selectedContract.contract_terms.deliverables.timeline.content_creation_deadline}</li>
                          <li className="text-sm">• Revision Period: {selectedContract.contract_terms.deliverables.timeline.revision_period}</li>
                          <li className="text-sm">• Publication: {selectedContract.contract_terms.deliverables.timeline.publication_schedule}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Usage Rights */}
              {selectedContract.contract_terms?.usage_rights && (
                <div>
                  <h4 className="font-medium mb-3">Usage Rights & Licensing</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div><strong>License Type:</strong> {selectedContract.contract_terms.usage_rights.license_type}</div>
                    <div><strong>Usage Duration:</strong> {selectedContract.contract_terms.usage_rights.usage_duration}</div>
                    <div><strong>Geographic Scope:</strong> {selectedContract.contract_terms.usage_rights.geographic_scope}</div>
                    {selectedContract.contract_terms.usage_rights.usage_scope && (
                      <div>
                        <strong>Usage Scope:</strong>
                        <ul className="mt-1 ml-4">
                          {selectedContract.contract_terms.usage_rights.usage_scope.map((scope: string, index: number) => (
                            <li key={index} className="text-sm">• {scope}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Signature Status */}
              <div>
                <h4 className="font-medium mb-3">Signature Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${selectedContract.signature_data?.brand_signed ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      {selectedContract.signature_data?.brand_signed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="font-medium">Brand Signature</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedContract.signature_data?.brand_signed 
                        ? `Signed on ${new Date(selectedContract.signature_data.brand_signature_date).toLocaleDateString()}`
                        : 'Pending signature'
                      }
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${selectedContract.signature_data?.creator_signed ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      {selectedContract.signature_data?.creator_signed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="font-medium">Creator Signature</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedContract.signature_data?.creator_signed 
                        ? `Signed on ${new Date(selectedContract.signature_data.creator_signature_date).toLocaleDateString()}`
                        : 'Pending signature'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowContractModal(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                {!selectedContract.signature_data?.brand_signed && (
                  <Button
                    onClick={() => handleSignContract(selectedContract.id, 'brand')}
                    className="bg-blue-600 hover:bg-blue-700 flex-1"
                  >
                    Sign as Brand
                  </Button>
                )}
                {process.env.NODE_ENV === 'development' && !selectedContract.signature_data?.creator_signed && (
                  <Button
                    variant="outline"
                    onClick={() => handleSignContract(selectedContract.id, 'creator')}
                    className="flex-1"
                  >
                    Sign as Creator (Demo)
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 