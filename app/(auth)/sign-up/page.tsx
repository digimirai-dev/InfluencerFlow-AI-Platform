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

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [userType, setUserType] = useState<'brand' | 'creator' | 'admin'>('creator')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createSupabaseClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType
          }
        }
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: email,
            full_name: fullName,
            user_type: userType,
            avatar_url: null
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Don't show this error to user as auth was successful
        }

        // Create specific profile based on user type
        if (userType === 'brand') {
          await supabase
            .from('brand_profiles')
            .insert({
              id: authData.user.id,
              user_id: authData.user.id,
              company_name: fullName + ' Company',
              industry: 'Technology',
              description: 'A new brand on InfluencerFlow',
              location: 'San Francisco, CA'
            })
        } else if (userType === 'creator') {
          await supabase
            .from('creator_profiles')
            .insert({
              id: authData.user.id,
              user_id: authData.user.id,
              display_name: fullName,
              bio: 'Content creator on InfluencerFlow',
              niche: ['General'],
              location: 'Los Angeles, CA',
              languages: ['English'],
              instagram_handle: email.split('@')[0],
              follower_count_instagram: 1000,
              engagement_rate: 3.5,
              rate_per_post: 100,
              rate_per_video: 200,
              verified: false
            })
        }

        setSuccess('Account created successfully! Please check your email to verify your account.')
        
        // Auto redirect after 2 seconds
        setTimeout(() => {
          router.push('/sign-in')
        }, 2000)
      }

    } catch (error) {
      setError('An unexpected error occurred')
      console.error('Sign up error:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTestUser = async (type: 'admin' | 'brand' | 'creator') => {
    const testUsers = {
      admin: { email: 'admin@influencerflow.com', password: 'admin123', name: 'Admin User' },
      brand: { email: 'brand@influencerflow.com', password: 'brand123', name: 'Brand Manager' },
      creator: { email: 'creator@influencerflow.com', password: 'creator123', name: 'Content Creator' }
    }

    const user = testUsers[type]
    setEmail(user.email)
    setPassword(user.password)
    setFullName(user.name)
    setUserType(type)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/sign-in" className="font-medium text-purple-600 hover:text-purple-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create a new account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

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
                    autoComplete="new-password"
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

              <div>
                <Label htmlFor="userType">Account Type</Label>
                <select
                  id="userType"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as 'brand' | 'creator' | 'admin')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="creator">Creator</option>
                  <option value="brand">Brand</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Quick Create Test Users</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  onClick={() => createTestUser('admin')}
                  disabled={loading}
                  className="w-full"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Create Admin User
                </Button>
                <Button
                  variant="outline"
                  onClick={() => createTestUser('brand')}
                  disabled={loading}
                  className="w-full"
                >
                  <Building className="mr-2 h-4 w-4" />
                  Create Brand User
                </Button>
                <Button
                  variant="outline"
                  onClick={() => createTestUser('creator')}
                  disabled={loading}
                  className="w-full"
                >
                  <User className="mr-2 h-4 w-4" />
                  Create Creator User
                </Button>
              </div>

              <div className="mt-4 text-xs text-gray-500 text-center">
                <p>Click the buttons above to auto-fill test user credentials</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 