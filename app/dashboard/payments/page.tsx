'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Building
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface Payment {
  id: string
  amount: number
  status: string
  payment_type: string
  description: string
  created_at: string
  processed_at: string | null
  payer: {
    full_name: string
    user_type: string
  }
  recipient: {
    full_name: string
    user_type: string
  }
  collaborations?: {
    campaigns: {
      title: string
    }
  }
}

export default function PaymentsPage() {
  const { userProfile } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalSpent: 0,
    pendingPayments: 0,
    completedPayments: 0
  })

  useEffect(() => {
    if (userProfile?.id) {
      fetchPayments()
    }
  }, [userProfile])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/payments?userId=${userProfile?.id}`)
      const data = await response.json()
      setPayments(data.payments || [])
      setStats(data.stats || stats)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'failed': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone': return <Calendar className="h-4 w-4" />
      case 'bonus': return <TrendingUp className="h-4 w-4" />
      case 'refund': return <CreditCard className="h-4 w-4" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }

  const isIncoming = (payment: Payment) => {
    return payment.recipient.full_name === userProfile?.full_name
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
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">
            {userProfile.user_type === 'brand' 
              ? 'Track your campaign payments and expenses'
              : 'View your earnings and payment history'
            }
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {userProfile.user_type === 'creator' ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalEarnings.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All time earnings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingPayments}</div>
                <p className="text-xs text-muted-foreground">Awaiting processing</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalSpent.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Campaign expenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingPayments}</div>
                <p className="text-xs text-muted-foreground">Processing</p>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedPayments}</div>
            <p className="text-xs text-muted-foreground">Successful transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${payments
                .filter(p => {
                  const paymentDate = new Date(p.created_at)
                  const now = new Date()
                  return paymentDate.getMonth() === now.getMonth() && 
                         paymentDate.getFullYear() === now.getFullYear() &&
                         p.status === 'completed' &&
                         (userProfile.user_type === 'creator' ? isIncoming(p) : !isIncoming(p))
                })
                .reduce((sum, p) => sum + p.amount, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Your recent payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : payments.length > 0 ? (
            <div className="space-y-4">
              {payments.map((payment) => {
                const incoming = isIncoming(payment)
                return (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${incoming ? 'bg-green-100' : 'bg-blue-100'}`}>
                        {getPaymentTypeIcon(payment.payment_type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">
                            {payment.collaborations?.campaigns?.title || payment.description}
                          </h4>
                          <Badge className={getStatusColor(payment.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(payment.status)}
                              <span className="capitalize">{payment.status}</span>
                            </div>
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Building className="h-3 w-3" />
                          <span>
                            {incoming ? `From ${payment.payer.full_name}` : `To ${payment.recipient.full_name}`}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{payment.payment_type}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(payment.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${incoming ? 'text-green-600' : 'text-blue-600'}`}>
                        {incoming ? '+' : '-'}${payment.amount.toLocaleString()}
                      </div>
                      {payment.processed_at && (
                        <div className="text-xs text-gray-500">
                          Processed {formatDistanceToNow(new Date(payment.processed_at), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
              <p className="text-gray-600">
                {userProfile.user_type === 'creator' 
                  ? 'Complete collaborations to start earning'
                  : 'Create campaigns to see payment history'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 