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
  const [profileFetching, setProfileFetching] = useState(false) // Track profile fetching state
  
  // Check if we're in development mode with placeholder values
  const isPlaceholderMode = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' || 
                           !process.env.NEXT_PUBLIC_SUPABASE_URL

  const supabase = createSupabaseClient()

  const fetchUserProfile = async (userId: string) => {
    console.log('👤 Fetching user profile for ID:', userId)
    
    // Prevent duplicate fetching for the same user
    if (profileFetching || (userProfile && userProfile.id === userId)) {
      console.log('⏭️ Skipping profile fetch - already fetching or user unchanged')
      return userProfile
    }

    setProfileFetching(true)
    
    try {
      if (isPlaceholderMode) {
        console.log('🔧 Using placeholder mode - returning mock data')
        // Return mock data for development when no Supabase
        const mockProfile = {
          id: userId,
          email: 'demo@example.com',
          full_name: 'Demo User',
          avatar_url: undefined,
          user_type: 'brand' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setProfileFetching(false)
        return mockProfile
      }

      console.log('📡 Querying users table for profile...')
      
      // First try direct Supabase query with a shorter timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile query timeout')), 3000) // Reduced to 3 seconds
      })

      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      try {
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any

        if (!error && data) {
          console.log('✅ User profile fetched successfully via Supabase:', data)
          setProfileFetching(false)
          return data
        }

        if (error) {
          console.log('⚠️ Supabase query failed, trying API fallback:', error)
        }
      } catch (queryError) {
        console.log('⚠️ Supabase query timed out, trying API fallback:', queryError)
      }

      // Fallback to API route which can handle auth more reliably
      console.log('🔄 Attempting API fallback for profile fetch...')
      try {
        const response = await fetch(`/api/user/profile/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const profileData = await response.json()
          console.log('✅ User profile fetched successfully via API:', profileData)
          setProfileFetching(false)
          return profileData
        } else {
          console.log('⚠️ API fallback failed with status:', response.status)
        }
      } catch (apiError) {
        console.log('⚠️ API fallback error:', apiError)
      }

      // If both methods fail, try to create profile from auth data
      console.log('🔄 Both methods failed, attempting to create profile...')
      const { data: { user: authUserForCreation } } = await supabase.auth.getUser()
      console.log('👤 Auth user data:', authUserForCreation)
      
      if (authUserForCreation && authUserForCreation.id === userId) {
        const newProfile = {
          id: userId,
          email: authUserForCreation.email || '',
          full_name: authUserForCreation.user_metadata?.full_name || authUserForCreation.email?.split('@')[0] || 'User',
          user_type: authUserForCreation.user_metadata?.user_type || 'creator',
          avatar_url: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        console.log('📝 Creating new profile:', newProfile)

        try {
          const { error: insertError } = await supabase
            .from('users')
            .insert(newProfile)

          if (!insertError) {
            console.log('✅ User profile created successfully')
            setProfileFetching(false)
            return newProfile
          } else {
            console.error('❌ Failed to create user profile:', insertError)
          }
        } catch (insertErr) {
          console.error('💥 Error inserting user profile:', insertErr)
        }
      }
      
      // Final fallback - create profile from auth user data
      const { data: { user: catchAuthUser } } = await supabase.auth.getUser()
      console.log('🔄 Returning fallback profile to prevent infinite loading')
      const fallbackProfile = {
        id: userId,
        email: catchAuthUser?.email || 'unknown@example.com',
        full_name: catchAuthUser?.user_metadata?.full_name || catchAuthUser?.email?.split('@')[0] || 'User',
        avatar_url: undefined,
        user_type: (catchAuthUser?.user_metadata?.user_type as 'brand' | 'creator' | 'admin') || 'creator',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setProfileFetching(false)
      return fallbackProfile

    } catch (error) {
      console.error('💥 Unexpected error fetching user profile:', error)
      
      // Get auth user data for better fallback
      try {
        const { data: { user: catchAuthUser } } = await supabase.auth.getUser()
        console.log('🔄 Returning fallback profile due to error')
        const fallbackProfile = {
          id: userId,
          email: catchAuthUser?.email || 'unknown@example.com',
          full_name: catchAuthUser?.user_metadata?.full_name || catchAuthUser?.email?.split('@')[0] || 'User',
          avatar_url: undefined,
          user_type: (catchAuthUser?.user_metadata?.user_type as 'brand' | 'creator' | 'admin') || 'creator',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setProfileFetching(false)
        return fallbackProfile
      } catch (authError) {
        console.error('💥 Error getting auth user for fallback:', authError)
        const fallbackProfile = {
          id: userId,
          email: 'unknown@example.com',
          full_name: 'User',
          avatar_url: undefined,
          user_type: 'creator' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setProfileFetching(false)
        return fallbackProfile
      } finally {
        // Ensure profileFetching is always set to false
        setProfileFetching(false)
      }
    }
  }

  const refreshUser = async () => {
    console.log('🔄 Refreshing user profile...')
    if (user) {
      const profile = await fetchUserProfile(user.id)
      setUserProfile(profile)
    }
  }

  const signOut = async () => {
    console.log('🚪 Signing out...')
    
    if (isPlaceholderMode) {
      setUser(null)
      setUserProfile(null)
      return
    }

    try {
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
      console.log('✅ Signed out successfully')
    } catch (error) {
      console.error('❌ Error signing out:', error)
    }
  }

  useEffect(() => {
    console.log('🚀 AuthProvider useEffect triggered')
    console.log('🔧 Placeholder mode:', isPlaceholderMode)
    console.log('🌐 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    
    if (isPlaceholderMode) {
      console.log('🔧 Using placeholder mode - setting mock data')
      // Only use mock data when Supabase is not configured
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
      console.log('🔍 Getting initial session...')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('📡 Initial session:', session ? 'Found' : 'None', session?.user?.email)
        
        if (session?.user) {
          console.log('👤 Setting user from initial session:', session.user.email)
          setUser(session.user)
          const profile = await fetchUserProfile(session.user.id)
          setUserProfile(profile)
          console.log('✅ Initial session setup complete')
        } else {
          console.log('❌ No initial session found')
        }
        
        setLoading(false)
        console.log('🏁 Initial session loading complete')
      } catch (error) {
        console.error('💥 Error getting initial session:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    console.log('👂 Setting up auth state listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state changed:', event, session?.user?.email)
        
        if (session?.user) {
          // Check if this is actually a different user to prevent duplicate processing
          if (user && user.id === session.user.id) {
            console.log('⏭️ Skipping auth change - same user already set')
            setLoading(false) // Ensure loading is false even if skipping
            return
          }
          
          console.log('👤 Setting user from auth change:', session.user.email)
          setUser(session.user)
          
          try {
            const profile = await fetchUserProfile(session.user.id)
            setUserProfile(profile)
            console.log('✅ Auth state change handled - user set')
          } catch (profileError) {
            console.error('💥 Error fetching profile during auth change:', profileError)
            // Create a basic profile from session data as final fallback
            const basicProfile = {
              id: session.user.id,
              email: session.user.email || 'unknown@example.com',
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              user_type: (session.user.user_metadata?.user_type as 'brand' | 'creator' | 'admin') || 'creator',
              avatar_url: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            setUserProfile(basicProfile)
            console.log('🔄 Set basic profile from session data as final fallback')
          }
        } else {
          console.log('❌ No user in auth state change - clearing state')
          setUser(null)
          setUserProfile(null)
        }
        setLoading(false)
        console.log('🏁 Auth state change loading complete')
      }
    )

    return () => {
      console.log('🧹 Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    userProfile,
    loading,
    signOut,
    refreshUser,
  }

  console.log('🎯 AuthProvider render - User:', user?.email, 'Profile:', userProfile?.full_name, 'Loading:', loading)

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