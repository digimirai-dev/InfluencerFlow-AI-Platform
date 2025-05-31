'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search,
  Filter,
  Users,
  Instagram,
  Youtube,
  TrendingUp,
  MapPin,
  Star,
  MessageSquare,
  Eye,
  X,
  User
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Creator {
  id: string
  user_id: string
  display_name: string
  bio: string
  niche: string[]
  location: string
  languages: string[]
  instagram_handle: string
  youtube_channel: string
  follower_count_instagram: number
  follower_count_youtube: number
  engagement_rate: number
  rate_per_post: number
  rate_per_video: number
  verified: boolean
  users: {
    full_name: string
    avatar_url: string
    email: string
  }
}

export default function CreatorsPage() {
  const { userProfile } = useAuth()
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [nicheFilter, setNicheFilter] = useState('all')
  const [sortBy, setSortBy] = useState('followers')
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null)

  useEffect(() => {
    fetchCreators()
  }, [])

  const fetchCreators = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/creators')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setCreators(data)
      } else {
        console.error('API response is not an array:', data)
        setCreators([])
      }
    } catch (error) {
      console.error('Error fetching creators:', error)
      setCreators([]) // Set to empty array on error
    } finally {
      setLoading(false)
    }
  }

  const getAvatarUrl = (creator: Creator) => {
    // If avatar_url exists and is not empty, use it
    if (creator.users.avatar_url && creator.users.avatar_url.trim() !== '') {
      return creator.users.avatar_url
    }
    
    // Generate a colorful avatar based on the creator's name
    const name = creator.display_name || creator.users.full_name || 'User'
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ]
    const colorIndex = name.charCodeAt(0) % colors.length
    
    return { initials, colorClass: colors[colorIndex] }
  }

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const getUniqueNiches = () => {
    if (!Array.isArray(creators)) return []
    const allNiches = creators.flatMap(creator => creator.niche || [])
    return Array.from(new Set(allNiches)).sort()
  }

  const filteredAndSortedCreators = Array.isArray(creators) ? creators
    .filter(creator => {
      const matchesSearch = 
        creator.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creator.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creator.niche?.some(n => n.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesNiche = nicheFilter === 'all' || creator.niche?.includes(nicheFilter)
      
      return matchesSearch && matchesNiche
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'followers':
          return (b.follower_count_instagram || 0) - (a.follower_count_instagram || 0)
        case 'engagement':
          return (b.engagement_rate || 0) - (a.engagement_rate || 0)
        case 'rate':
          return (a.rate_per_post || 0) - (b.rate_per_post || 0)
        case 'name':
          return a.display_name.localeCompare(b.display_name)
        default:
          return 0
      }
    }) : []

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
          <h1 className="text-3xl font-bold text-gray-900">Creators</h1>
          <p className="text-gray-600">Discover and connect with talented content creators</p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredAndSortedCreators.length} creators found
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 flex-wrap gap-2">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search creators by name, bio, or niche..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Niche: {nicheFilter === 'all' ? 'All' : nicheFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setNicheFilter('all')}>
              All Niches
            </DropdownMenuItem>
            {getUniqueNiches().map(niche => (
              <DropdownMenuItem key={niche} onClick={() => setNicheFilter(niche)}>
                {niche}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Sort: {sortBy === 'followers' ? 'Followers' : 
                     sortBy === 'engagement' ? 'Engagement' :
                     sortBy === 'rate' ? 'Rate' : 'Name'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSortBy('followers')}>
              Followers (High to Low)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('engagement')}>
              Engagement Rate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('rate')}>
              Rate (Low to High)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('name')}>
              Name (A-Z)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Creators Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : filteredAndSortedCreators.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedCreators.map((creator) => {
            const avatarData = getAvatarUrl(creator)
            const isImageUrl = typeof avatarData === 'string'
            
            return (
              <Card key={creator.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start space-x-3">
                    {isImageUrl ? (
                      <img
                        src={avatarData}
                        alt={creator.display_name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          // If image fails to load, replace with initials
                          const target = e.target as HTMLImageElement
                          const name = creator.display_name || creator.users.full_name || 'User'
                          const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                          const colors = [
                            'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
                            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
                          ]
                          const colorIndex = name.charCodeAt(0) % colors.length
                          
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            const div = document.createElement('div')
                            div.className = `w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${colors[colorIndex]}`
                            div.textContent = initials
                            parent.appendChild(div)
                          }
                        }}
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${avatarData.colorClass}`}>
                        {avatarData.initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg truncate">{creator.display_name}</CardTitle>
                        {creator.verified && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span>{creator.location}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-2">
                    {creator.bio}
                  </CardDescription>

                  {/* Niches */}
                  <div className="flex flex-wrap gap-1">
                    {creator.niche?.slice(0, 3).map((niche) => (
                      <Badge key={niche} variant="secondary" className="text-xs">
                        {niche}
                      </Badge>
                    ))}
                    {creator.niche?.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{creator.niche.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Social Stats */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <Instagram className="h-4 w-4 text-pink-500" />
                      <span>{formatFollowerCount(creator.follower_count_instagram || 0)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Youtube className="h-4 w-4 text-red-500" />
                      <span>{formatFollowerCount(creator.follower_count_youtube || 0)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span>{creator.engagement_rate?.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Rate:</span>
                      <span className="font-medium">${creator.rate_per_post}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedCreator(creator)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Profile
                    </Button>
                    <Button size="sm" className="flex-1">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No creators found</h3>
            <p className="text-gray-600">
              {searchTerm || nicheFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No creators available at the moment'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Creator Profile Modal */}
      {selectedCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Creator Profile</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedCreator(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-start space-x-4">
                  {(() => {
                    const avatarData = getAvatarUrl(selectedCreator)
                    const isImageUrl = typeof avatarData === 'string'
                    
                    return isImageUrl ? (
                      <img
                        src={avatarData}
                        alt={selectedCreator.display_name}
                        className="w-20 h-20 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          const name = selectedCreator.display_name || selectedCreator.users.full_name || 'User'
                          const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                          const colors = [
                            'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
                            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
                          ]
                          const colorIndex = name.charCodeAt(0) % colors.length
                          
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            const div = document.createElement('div')
                            div.className = `w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl ${colors[colorIndex]}`
                            div.textContent = initials
                            parent.appendChild(div)
                          }
                        }}
                      />
                    ) : (
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl ${avatarData.colorClass}`}>
                        {avatarData.initials}
                      </div>
                    )
                  })()}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-bold">{selectedCreator.display_name}</h3>
                      {selectedCreator.verified && (
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-gray-600 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedCreator.location}</span>
                    </div>
                    <p className="text-gray-700">{selectedCreator.bio}</p>
                  </div>
                </div>

                {/* Niches */}
                <div>
                  <h4 className="font-semibold mb-2">Niches</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCreator.niche?.map((niche) => (
                      <Badge key={niche} variant="secondary">
                        {niche}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Social Media Stats */}
                <div>
                  <h4 className="font-semibold mb-3">Social Media</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Instagram className="h-6 w-6 text-pink-500" />
                      <div>
                        <p className="font-medium">@{selectedCreator.instagram_handle}</p>
                        <p className="text-sm text-gray-600">
                          {formatFollowerCount(selectedCreator.follower_count_instagram || 0)} followers
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Youtube className="h-6 w-6 text-red-500" />
                      <div>
                        <p className="font-medium">{selectedCreator.youtube_channel || 'Not connected'}</p>
                        <p className="text-sm text-gray-600">
                          {formatFollowerCount(selectedCreator.follower_count_youtube || 0)} subscribers
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance & Rates */}
                <div>
                  <h4 className="font-semibold mb-3">Performance & Rates</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Engagement Rate</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedCreator.engagement_rate?.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium mb-1">Rate per Post</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${selectedCreator.rate_per_post}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Languages */}
                {selectedCreator.languages && selectedCreator.languages.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCreator.languages.map((language) => (
                        <Badge key={language} variant="outline">
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t">
                  <Button className="flex-1">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                  <Button variant="outline" className="flex-1">
                    View Instagram
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 