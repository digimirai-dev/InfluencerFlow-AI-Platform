'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase'
import { User as AppUser } from '@/types'

interface AuthContextType {
  user: User | null
  userProfile: AppUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Check if we're in development mode with placeholder values
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' || 
                           !process.env.NEXT_PUBLIC_SUPABASE_URL

  const supabase = createSupabaseClient()

  const fetchUserProfile = async (userId: string) => {
    if (isPlaceholderMode) {
      // Return mock data for development
      return {
        id: userId,
        email: 'demo@example.com',
        full_name: 'Demo User',
        avatar_url: null,
        user_type: 'brand' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  const refreshUser = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id)
      setUserProfile(profile)
    }
  }

  const signOut = async () => {
    if (isPlaceholderMode) {
      setUser(null)
      setUserProfile(null)
      return
    }

    try {
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  useEffect(() => {
    // For development, always use mock data to test the dashboard
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (isPlaceholderMode || isDevelopment) {
      // Set mock user for development
      const mockUser = {
        id: 'demo-user-id',
        email: 'demo@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as User

      const mockProfile = {
        id: 'demo-user-id',
        email: 'demo@example.com',
        full_name: 'Demo Brand User',
        avatar_url: undefined,
        user_type: 'brand' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setUser(mockUser)
      setUserProfile(mockProfile)
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          const profile = await fetchUserProfile(session.user.id)
          setUserProfile(profile)
        } else {
          // If no session, use mock data for development
          const mockUser = {
            id: 'demo-user-id',
            email: 'demo@example.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as User

          const mockProfile = {
            id: 'demo-user-id',
            email: 'demo@example.com',
            full_name: 'Demo Brand User',
            avatar_url: undefined,
            user_type: 'brand' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          setUser(mockUser)
          setUserProfile(mockProfile)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error getting session:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          const profile = await fetchUserProfile(session.user.id)
          setUserProfile(profile)
        } else {
          setUser(null)
          setUserProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    userProfile,
    loading,
    signOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {isPlaceholderMode && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Development Mode:</strong> Using placeholder Supabase configuration. 
                Please set up your environment variables for full functionality.
              </p>
            </div>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 