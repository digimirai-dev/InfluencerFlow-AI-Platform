'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createSupabaseClient } from '@/lib/supabase'
import { Eye, EyeOff, User, Building, Shield } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createSupabaseClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('🔐 Starting sign-in process for:', email)

    try {
      console.log('📡 Calling Supabase auth.signInWithPassword...')
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('📡 Supabase response:', { data, error: authError })

      if (authError) {
        console.error('❌ Auth error:', authError)
        setError(authError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        console.log('✅ User authenticated:', data.user.email)
        console.log('🔄 Redirecting to dashboard...')
        
        // Force a small delay to ensure auth state is updated
        setTimeout(() => {
          router.push('/dashboard')
        }, 100)
      } else {
        console.error('❌ No user data returned')
        setError('Authentication failed - no user data')
        setLoading(false)
      }

    } catch (error) {
      console.error('💥 Unexpected error during sign-in:', error)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleQuickLogin = async (userType: 'admin' | 'brand' | 'creator') => {
    setLoading(true)
    setError('')

    const credentials = {
      admin: { email: 'admin@influencerflow.com', password: 'admin123' },
      brand: { email: 'brand@influencerflow.com', password: 'brand123' },
      creator: { email: 'creator@influencerflow.com', password: 'creator123' }
    }

    console.log(`🚀 Quick login as ${userType}:`, credentials[userType].email)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword(credentials[userType])

      console.log('📡 Quick login response:', { data, error: authError })

      if (authError) {
        console.error('❌ Quick login error:', authError)
        setError(authError.message)
      } else if (data.user) {
        console.log('✅ Quick login successful:', data.user.email)
        setTimeout(() => {
          router.push('/dashboard')
        }, 100)
      }
    } catch (error) {
      console.error('💥 Quick login error:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to InfluencerFlow
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/sign-up" className="font-medium text-purple-600 hover:text-purple-500">
              create a new account
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Quick Login for Testing</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleQuickLogin('admin')}
                  disabled={loading}
                  className="w-full"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Login as Admin
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickLogin('brand')}
                  disabled={loading}
                  className="w-full"
                >
                  <Building className="mr-2 h-4 w-4" />
                  Login as Brand
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickLogin('creator')}
                  disabled={loading}
                  className="w-full"
                >
                  <User className="mr-2 h-4 w-4" />
                  Login as Creator
                </Button>
              </div>

              <div className="mt-4 text-xs text-gray-500 text-center">
                <p><strong>Test Credentials:</strong></p>
                <p>Admin: admin@influencerflow.com / admin123</p>
                <p>Brand: brand@influencerflow.com / brand123</p>
                <p>Creator: creator@influencerflow.com / creator123</p>
                <p className="mt-2 text-blue-600">Check browser console for debug logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 