'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  DollarSign,
  Calendar,
  Building
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface Application {
  id: string
  status: string
  proposal_text: string
  proposed_rate: number | null
  created_at: string
  campaigns: {
    title: string
    description: string
    budget_min: number
    budget_max: number
    timeline_start: string
    timeline_end: string
    brand_profiles: {
      company_name: string
    }
  }
}

export default function ApplicationsPage() {
  const { userProfile } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userProfile?.id) {
      fetchApplications()
    }
  }, [userProfile])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaign-applications?creatorId=${userProfile?.id}`)
      const data = await response.json()
      setApplications(data || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'withdrawn': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'accepted': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const groupedApplications = {
    pending: applications.filter(app => app.status === 'pending'),
    accepted: applications.filter(app => app.status === 'accepted'),
    rejected: applications.filter(app => app.status === 'rejected'),
    withdrawn: applications.filter(app => app.status === 'withdrawn')
  }

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
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600">Track your campaign applications and their status</p>
        </div>
        <div className="text-sm text-gray-500">
          {applications.length} total applications
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{groupedApplications.pending.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-2xl font-bold">{groupedApplications.accepted.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold">{groupedApplications.rejected.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">
                  {applications.length > 0 
                    ? Math.round((groupedApplications.accepted.length / applications.length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{application.campaigns.title}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {application.campaigns.brand_profiles.company_name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(application.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(application.status)}
                        <span className="capitalize">{application.status}</span>
                      </div>
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="line-clamp-2">
                  {application.campaigns.description}
                </CardDescription>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span>
                      ${application.campaigns.budget_min.toLocaleString()} - 
                      ${application.campaigns.budget_max.toLocaleString()}
                    </span>
                  </div>
                  {application.proposed_rate && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Your Rate:</span>
                      <span className="font-medium">${application.proposed_rate}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Due: {new Date(application.campaigns.timeline_end).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>Applied {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Proposal Preview */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium mb-1">Your Proposal:</h4>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {application.proposal_text}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link href={`/dashboard/applications/${application.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                  {application.status === 'accepted' && (
                    <Link href={`/dashboard/collaborations`} className="flex-1">
                      <Button size="sm" className="w-full">
                        View Collaboration
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-600 mb-4">
              Start applying to campaigns to see them here
            </p>
            <Link href="/dashboard/opportunities">
              <Button>
                Browse Opportunities
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 