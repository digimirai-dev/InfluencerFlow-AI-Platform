'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Megaphone, 
  DollarSign, 
  TrendingUp,
  Plus,
  Eye,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle,
  Building,
  BarChart3,
  Shield
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface DashboardStats {
  activeCampaigns: number
  totalCreators?: number
  totalSpent?: number
  avgROI?: number
  totalEarnings?: number
  pendingApplications?: number
  completedProjects?: number
  campaigns?: any[]
  recentCollaborations?: any[]
  // Admin specific stats
  totalUsers?: number
  totalBrands?: number
  totalCampaigns?: number
  totalCollaborations?: number
  platformRevenue?: number
  monthlyGrowth?: number
}

interface Campaign {
  id: string
  title: string
  status: string
  budget_max: number
  applications_count: number
  activeCollaborations: number
  brand_profiles: { company_name: string }
}

export default function DashboardPage() {
  const { userProfile } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userProfile?.id) {
      fetchDashboardData()
    }
  }, [userProfile])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard stats
      const statsResponse = await fetch(
        `/api/dashboard/stats?userId=${userProfile?.id}&userType=${userProfile?.user_type}`
      )
      const statsData = await statsResponse.json()
      setStats(statsData)

      // Fetch recent campaigns
      const campaignsResponse = await fetch(
        `/api/dashboard/recent-campaigns?userId=${userProfile?.id}&userType=${userProfile?.user_type}`
      )
      const campaignsData = await campaignsResponse.json()
      setRecentCampaigns(campaignsData || [])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'completed': return 'bg-blue-500'
      case 'paused': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const renderBrandDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600">Here's what's happening with your campaigns</p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCampaigns || 0}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCreators || 0}</div>
            <p className="text-xs text-muted-foreground">+4 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.totalSpent ? stats.totalSpent.toLocaleString() : '0'}
            </div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgROI || 0}x</div>
            <p className="text-xs text-muted-foreground">+0.3x from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
            <CardDescription>Your latest campaign activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentCampaigns.length > 0 ? (
              recentCampaigns.slice(0, 3).map((campaign) => (
                <div key={campaign.id} className="flex items-center space-x-4">
                  <div className={`w-2 h-2 ${getStatusColor(campaign.status)} rounded-full`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{campaign.title}</p>
                    <p className="text-xs text-gray-500">
                      {campaign.activeCollaborations} creators • ${campaign.budget_max.toLocaleString()} budget
                    </p>
                  </div>
                  <Link href={`/dashboard/campaigns/${campaign.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No campaigns yet. Create your first campaign!</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/campaigns/new">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create New Campaign
              </Button>
            </Link>
            <Link href="/dashboard/creators">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Browse Creators
              </Button>
            </Link>
            <Link href="/dashboard/messages">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="mr-2 h-4 w-4" />
                Check Messages
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderCreatorDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600">Here are your latest opportunities and earnings</p>
        </div>
        <Link href="/dashboard/opportunities">
          <Button>
            <Eye className="mr-2 h-4 w-4" />
            Browse Opportunities
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCampaigns || 0}</div>
            <p className="text-xs text-muted-foreground">+1 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.totalEarnings ? stats.totalEarnings.toLocaleString() : '0'}
            </div>
            <p className="text-xs text-muted-foreground">+$450 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingApplications || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedProjects || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Collaborations</CardTitle>
            <CardDescription>Your current projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.recentCollaborations && stats.recentCollaborations.length > 0 ? (
              stats.recentCollaborations.slice(0, 3).map((collaboration: any) => (
                <div key={collaboration.id} className="flex items-center space-x-4">
                  <div className={`w-2 h-2 ${getStatusColor(collaboration.status)} rounded-full`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{collaboration.campaigns?.title || 'Campaign'}</p>
                    <p className="text-xs text-gray-500">
                      ${collaboration.agreed_rate} • {collaboration.status}
                    </p>
                  </div>
                  <Link href={`/dashboard/collaborations/${collaboration.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No active collaborations. Browse opportunities!</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/opportunities">
              <Button variant="outline" className="w-full justify-start">
                <Eye className="mr-2 h-4 w-4" />
                Browse Opportunities
              </Button>
            </Link>
            <Link href="/dashboard/applications">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                My Applications
              </Button>
            </Link>
            <Link href="/dashboard/messages">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="mr-2 h-4 w-4" />
                Check Messages
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Platform overview and management</p>
        </div>
        <Link href="/dashboard/analytics">
          <Button>
            <BarChart3 className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
        </Link>
      </div>

      {/* Admin Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">+{stats?.monthlyGrowth || 0}% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCampaigns || 0}</div>
            <p className="text-xs text-muted-foreground">of {stats?.totalCampaigns || 0} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.platformRevenue ? stats.platformRevenue.toLocaleString() : '0'}
            </div>
            <p className="text-xs text-muted-foreground">10% commission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collaborations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCollaborations || 0}</div>
            <p className="text-xs text-muted-foreground">Total completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Breakdown</CardTitle>
            <CardDescription>User distribution and activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Creators</span>
              </div>
              <span className="text-sm font-bold">{stats?.totalCreators || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Brands</span>
              </div>
              <span className="text-sm font-bold">{stats?.totalBrands || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Megaphone className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Total Campaigns</span>
              </div>
              <span className="text-sm font-bold">{stats?.totalCampaigns || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Monthly Growth</span>
              </div>
              <span className="text-sm font-bold text-green-600">+{stats?.monthlyGrowth || 0}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
            <CardDescription>Platform management tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/users">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
            <Link href="/dashboard/campaigns">
              <Button variant="outline" className="w-full justify-start">
                <Megaphone className="mr-2 h-4 w-4" />
                Review Campaigns
              </Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                Platform Analytics
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="mr-2 h-4 w-4" />
                Platform Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="p-6">
      {userProfile.user_type === 'brand' 
        ? renderBrandDashboard() 
        : userProfile.user_type === 'admin'
        ? renderAdminDashboard()
        : renderCreatorDashboard()}
    </div>
  )
} 