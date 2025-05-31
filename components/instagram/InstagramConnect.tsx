'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useInstagram, useInstagramConnect } from '@/hooks/useInstagram'
import { Instagram, Loader2, CheckCircle, AlertCircle, Users, Heart, MessageCircle } from 'lucide-react'

export default function InstagramConnect() {
  const [username, setUsername] = useState('')
  const { data, loading, error, fetchProfile, verifyUsername } = useInstagram()
  const { connecting, connectInstagram } = useInstagramConnect()

  const handleVerifyUsername = async () => {
    if (!username.trim()) return
    await verifyUsername(username.trim())
  }

  const handleConnectAccount = async () => {
    await connectInstagram()
  }

  const handleFetchProfile = async () => {
    await fetchProfile()
  }

  return (
    <div className="space-y-6">
      {/* Instagram Connection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            Instagram Integration
          </CardTitle>
          <CardDescription>
            Connect your Instagram account to fetch profile data, engagement metrics, and recent posts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Username Verification */}
          <div className="space-y-2">
            <Label htmlFor="username">Instagram Username</Label>
            <div className="flex gap-2">
              <Input
                id="username"
                placeholder="Enter Instagram username (without @)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleVerifyUsername}
                disabled={!username.trim() || loading}
                variant="outline"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
              </Button>
            </div>
          </div>

          {/* Connect Account Button */}
          <div className="space-y-2">
            <Label>Connect Instagram Account</Label>
            <Button 
              onClick={handleConnectAccount}
              disabled={connecting}
              className="w-full"
            >
              {connecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Instagram className="mr-2 h-4 w-4" />
                  Connect Instagram Account
                </>
              )}
            </Button>
            <p className="text-sm text-gray-500">
              This will redirect you to Instagram to authorize access to your profile data.
            </p>
          </div>

          {/* Test API Button */}
          <div className="space-y-2">
            <Label>Test API (with current token)</Label>
            <Button 
              onClick={handleFetchProfile}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                'Test Instagram API'
              )}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Profile Data Display */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Instagram Profile Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Username</Label>
                <p className="text-sm text-gray-600">@{data.profile.username}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Account Type</Label>
                <p className="text-sm text-gray-600 capitalize">{data.profile.account_type}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Media Count</Label>
                <p className="text-sm text-gray-600">{data.profile.media_count} posts</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Engagement Rate</Label>
                <p className="text-sm text-gray-600">{data.engagement_rate.toFixed(2)}%</p>
              </div>
            </div>

            {/* Recent Posts */}
            {data.media && data.media.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Recent Posts</Label>
                <div className="grid grid-cols-3 gap-2">
                  {data.media.slice(0, 6).map((post, index) => (
                    <div key={post.id || index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      {post.media_url && (
                        <img 
                          src={post.media_url} 
                          alt={`Post ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* API Response (for debugging) */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-600">
                View Raw API Response
              </summary>
              <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(data, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}

      {/* API Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">API Configuration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Instagram Access Token</span>
              <span className={`px-2 py-1 rounded text-xs ${
                process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN ? 'Configured' : 'Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Facebook App ID</span>
              <span className={`px-2 py-1 rounded text-xs ${
                process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ? 'Configured' : 'Missing'}
              </span>
            </div>
          </div>
          
          {(!process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN || !process.env.NEXT_PUBLIC_FACEBOOK_APP_ID) && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                To test the Instagram API, add the environment variables to your .env.local file:
                <br />
                <code className="text-xs">INSTAGRAM_ACCESS_TOKEN=your_token</code>
                <br />
                <code className="text-xs">NEXT_PUBLIC_FACEBOOK_APP_ID=your_app_id</code>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 