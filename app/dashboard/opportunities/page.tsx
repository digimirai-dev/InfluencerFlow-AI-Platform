'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search,
  Filter,
  DollarSign,
  Calendar,
  Users,
  MapPin,
  Clock,
  Eye,
  Send
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  brand_profiles: {
    company_name: string
    industry: string
    location: string
  }
  hasApplied?: boolean
}

export default function OpportunitiesPage() {
  const { userProfile } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [budgetFilter, setBudgetFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    if (userProfile?.id) {
      fetchOpportunities()
    }
  }, [userProfile])

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/opportunities?creatorId=${userProfile?.id}`)
      const data = await response.json()
      setCampaigns(data || [])
    } catch (error) {
      console.error('Error fetching opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyToCampaign = async (campaignId: string) => {
    try {
      const response = await fetch('/api/campaign-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          proposal_text: 'I would love to collaborate on this campaign. Please find my portfolio attached.',
        }),
      })

      if (response.ok) {
        // Update the campaign to show it's been applied to
        setCampaigns(prev => prev.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, hasApplied: true }
            : campaign
        ))
      }
    } catch (error) {
      console.error('Error applying to campaign:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredAndSortedCampaigns = campaigns
    .filter(campaign => {
      const matchesSearch = 
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.brand_profiles.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      
      let matchesBudget = true
      if (budgetFilter !== 'all') {
        const maxBudget = campaign.budget_max
        switch (budgetFilter) {
          case 'under-500':
            matchesBudget = maxBudget < 500
            break
          case '500-1000':
            matchesBudget = maxBudget >= 500 && maxBudget <= 1000
            break
          case '1000-5000':
            matchesBudget = maxBudget > 1000 && maxBudget <= 5000
            break
          case 'over-5000':
            matchesBudget = maxBudget > 5000
            break
        }
      }
      
      return matchesSearch && matchesBudget && campaign.status === 'active'
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'budget-high':
          return b.budget_max - a.budget_max
        case 'budget-low':
          return a.budget_max - b.budget_max
        case 'deadline':
          return new Date(a.timeline_end).getTime() - new Date(b.timeline_end).getTime()
        default:
          return 0
      }
    })

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-gray-600">Discover campaigns that match your profile</p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredAndSortedCampaigns.length} opportunities available
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 flex-wrap gap-2">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search campaigns by title, description, or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Budget: {budgetFilter === 'all' ? 'All' : 
                      budgetFilter === 'under-500' ? 'Under $500' :
                      budgetFilter === '500-1000' ? '$500-$1K' :
                      budgetFilter === '1000-5000' ? '$1K-$5K' : 'Over $5K'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setBudgetFilter('all')}>
              All Budgets
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBudgetFilter('under-500')}>
              Under $500
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBudgetFilter('500-1000')}>
              $500 - $1,000
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBudgetFilter('1000-5000')}>
              $1,000 - $5,000
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBudgetFilter('over-5000')}>
              Over $5,000
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Sort: {sortBy === 'newest' ? 'Newest' : 
                     sortBy === 'budget-high' ? 'Budget (High)' :
                     sortBy === 'budget-low' ? 'Budget (Low)' : 'Deadline'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSortBy('newest')}>
              Newest First
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('budget-high')}>
              Budget (High to Low)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('budget-low')}>
              Budget (Low to High)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('deadline')}>
              Deadline (Soonest)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Opportunities Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : filteredAndSortedCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAndSortedCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl line-clamp-1">{campaign.title}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-600">{campaign.brand_profiles.company_name}</span>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      ${campaign.budget_min.toLocaleString()} - ${campaign.budget_max.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {campaign.applications_count} applications
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="line-clamp-3">
                  {campaign.description}
                </CardDescription>

                {/* Campaign Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{campaign.brand_profiles.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{campaign.target_audience}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Due: {new Date(campaign.timeline_end).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Deliverables */}
                {campaign.deliverables && campaign.deliverables.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Deliverables:</h4>
                    <div className="flex flex-wrap gap-1">
                      {campaign.deliverables.slice(0, 3).map((deliverable, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {deliverable}
                        </Badge>
                      ))}
                      {campaign.deliverables.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{campaign.deliverables.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Link href={`/dashboard/opportunities/${campaign.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                  {campaign.hasApplied ? (
                    <Button size="sm" className="flex-1" disabled>
                      Applied
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => applyToCampaign(campaign.id)}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Apply Now
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
            <p className="text-gray-600">
              {searchTerm || budgetFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No active campaigns available at the moment'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 