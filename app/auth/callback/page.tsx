'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth/signin?error=callback_error')
          return
        }

        if (data.session) {
          // User is authenticated, redirect to dashboard
          router.push('/dashboard')
        } else {
          // No session, redirect to signin
          router.push('/auth/signin')
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        router.push('/auth/signin?error=unexpected_error')
      }
    }

    handleAuthCallback()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Completing sign in...</h2>
        <p className="text-gray-600">Please wait while we redirect you.</p>
      </div>
    </div>
  )
} 