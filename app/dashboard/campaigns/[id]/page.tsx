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
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

interface Campaign {
  id: string
  title: string
  description: string
  status: string
  budget_min: number
  budget_max: number
  timeline_start: string
  timeline_end: string
  requirements: string[]
  target_audience: string
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
    niches: string[]
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

export default function CampaignDetailPage() {
  const { userProfile } = useAuth()
  const params = useParams()
  const campaignId = params.id as string
  
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [collaborations, setCollaborations] = useState<Collaboration[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (campaignId && userProfile?.id) {
      fetchCampaignData()
    }
  }, [campaignId, userProfile])

  const fetchCampaignData = async () => {
    try {
      setLoading(true)
      
      // Fetch campaign details
      const campaignResponse = await fetch(`/api/campaigns/${campaignId}`)
      if (campaignResponse.ok) {
        const campaignData = await campaignResponse.json()
        setCampaign(campaignData)
      }

      // Fetch applications
      const applicationsResponse = await fetch(`/api/campaigns/${campaignId}/applications`)
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json()
        setApplications(applicationsData || [])
      }

      // Fetch collaborations
      const collaborationsResponse = await fetch(`/api/campaigns/${campaignId}/collaborations`)
      if (collaborationsResponse.ok) {
        const collaborationsData = await collaborationsResponse.json()
        setCollaborations(collaborationsData || [])
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
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
          <TabsTrigger value="collaborations">Collaborations ({collaborations.length})</TabsTrigger>
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

              {campaign.requirements && campaign.requirements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {campaign.requirements.map((requirement, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span>{requirement}</span>
                        </div>
                      ))}
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
                      <p className="font-medium">{campaign.target_audience || 'General audience'}</p>
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
                            <span>{application.creator_profiles.follower_count_instagram.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Youtube className="h-4 w-4 text-red-600" />
                            <span>{application.creator_profiles.follower_count_youtube.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-600" />
                            <span>{application.creator_profiles.engagement_rate}% engagement</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span>${application.proposed_rate || application.creator_profiles.rate_per_post}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <p className="text-sm text-gray-700">{application.proposal_message}</p>
                        </div>
                        
                        <div className="mt-3 flex flex-wrap gap-1">
                          {application.creator_profiles.niches.map((niche, index) => (
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
                            <p className="text-sm text-gray-600">${collaboration.agreed_rate} agreed rate</p>
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
      </Tabs>
    </div>
  )
} 