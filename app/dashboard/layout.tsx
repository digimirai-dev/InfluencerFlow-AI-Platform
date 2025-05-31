'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  MessageSquare, 
  CreditCard, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

const navigation = {
  brand: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
    { name: 'Creators', href: '/dashboard/creators', icon: Users },
    { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  creator: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Opportunities', href: '/dashboard/opportunities', icon: Megaphone },
    { name: 'My Campaigns', href: '/dashboard/my-campaigns', icon: Megaphone },
    { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { name: 'Earnings', href: '/dashboard/earnings', icon: CreditCard },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  admin: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
    { name: 'Analytics', href: '/dashboard/analytics', icon: LayoutDashboard },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, userProfile, loading, signOut } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user || !userProfile) {
    return null
  }

  const userNavigation = navigation[userProfile.user_type] || navigation.creator

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-purple-600">InfluencerFlow</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {userNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={signOut}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-purple-600">InfluencerFlow</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {userNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={signOut}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-600">
                    {userProfile.full_name?.charAt(0) || userProfile.email.charAt(0)}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">
                    {userProfile.full_name || userProfile.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {userProfile.user_type}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 