'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Plus,
  X,
  Calendar,
  DollarSign,
  Target,
  Users,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

interface CampaignFormData {
  title: string
  description: string
  budget_min: number
  budget_max: number
  timeline_start: string
  timeline_end: string
  target_audience: string
  requirements: string[]
  deliverables: string[]
  niches: string[]
}

const AVAILABLE_NICHES = [
  'Fashion', 'Beauty', 'Lifestyle', 'Technology', 'Fitness', 'Food', 'Travel',
  'Gaming', 'Music', 'Art', 'Photography', 'Business', 'Education', 'Health',
  'Parenting', 'Finance', 'Sports', 'Entertainment', 'Home & Garden', 'Automotive'
]

export default function NewCampaignPage() {
  const { userProfile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [newRequirement, setNewRequirement] = useState('')
  const [newDeliverable, setNewDeliverable] = useState('')

  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    budget_min: 0,
    budget_max: 0,
    timeline_start: '',
    timeline_end: '',
    target_audience: '',
    requirements: [],
    deliverables: [],
    niches: []
  })

  const handleInputChange = (field: keyof CampaignFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }))
      setNewRequirement('')
    }
  }

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  const addDeliverable = () => {
    if (newDeliverable.trim()) {
      setFormData(prev => ({
        ...prev,
        deliverables: [...prev.deliverables, newDeliverable.trim()]
      }))
      setNewDeliverable('')
    }
  }

  const removeDeliverable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }))
  }

  const toggleNiche = (niche: string) => {
    setFormData(prev => ({
      ...prev,
      niches: prev.niches.includes(niche)
        ? prev.niches.filter(n => n !== niche)
        : [...prev.niches, niche]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userProfile) {
      alert('Please log in to create a campaign')
      return
    }

    // Basic validation
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in all required fields')
      return
    }

    if (formData.budget_min <= 0 || formData.budget_max <= 0 || formData.budget_min > formData.budget_max) {
      alert('Please enter valid budget amounts')
      return
    }

    if (!formData.timeline_start || !formData.timeline_end) {
      alert('Please select campaign timeline')
      return
    }

    if (new Date(formData.timeline_start) >= new Date(formData.timeline_end)) {
      alert('End date must be after start date')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          brand_id: userProfile.id
        }),
      })

      if (response.ok) {
        const campaign = await response.json()
        router.push(`/dashboard/campaigns/${campaign.id}`)
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to create campaign')
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert('Failed to create campaign. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/campaigns">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
          <p className="text-gray-600">Set up your influencer marketing campaign</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Campaign Details</span>
            </CardTitle>
            <CardDescription>
              Basic information about your campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Campaign Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Summer Fashion Collection Launch"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Campaign Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your campaign goals, brand message, and what you're looking for from creators..."
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="target_audience">Target Audience</Label>
              <Input
                id="target_audience"
                value={formData.target_audience}
                onChange={(e) => handleInputChange('target_audience', e.target.value)}
                placeholder="e.g., Young professionals aged 25-35"
              />
            </div>
          </CardContent>
        </Card>

        {/* Budget & Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Budget & Timeline</span>
            </CardTitle>
            <CardDescription>
              Set your campaign budget and timeline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget_min">Minimum Budget ($) *</Label>
                <Input
                  id="budget_min"
                  type="number"
                  value={formData.budget_min || ''}
                  onChange={(e) => handleInputChange('budget_min', parseInt(e.target.value) || 0)}
                  placeholder="1000"
                  min="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="budget_max">Maximum Budget ($) *</Label>
                <Input
                  id="budget_max"
                  type="number"
                  value={formData.budget_max || ''}
                  onChange={(e) => handleInputChange('budget_max', parseInt(e.target.value) || 0)}
                  placeholder="5000"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timeline_start">Start Date *</Label>
                <Input
                  id="timeline_start"
                  type="date"
                  value={formData.timeline_start}
                  onChange={(e) => handleInputChange('timeline_start', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="timeline_end">End Date *</Label>
                <Input
                  id="timeline_end"
                  type="date"
                  value={formData.timeline_end}
                  onChange={(e) => handleInputChange('timeline_end', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Niches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Content Categories</span>
            </CardTitle>
            <CardDescription>
              Select the content niches that match your campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_NICHES.map((niche) => (
                <Badge
                  key={niche}
                  variant={formData.niches.includes(niche) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleNiche(niche)}
                >
                  {niche}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
            <CardDescription>
              Specify what you're looking for in creators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                placeholder="e.g., Minimum 50K followers"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
              />
              <Button type="button" onClick={addRequirement}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {formData.requirements.map((requirement, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span>{requirement}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRequirement(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Deliverables */}
        <Card>
          <CardHeader>
            <CardTitle>Deliverables</CardTitle>
            <CardDescription>
              What content do you expect from creators?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={newDeliverable}
                onChange={(e) => setNewDeliverable(e.target.value)}
                placeholder="e.g., Instagram Reel"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDeliverable())}
              />
              <Button type="button" onClick={addDeliverable}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {formData.deliverables.map((deliverable, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span>{deliverable}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDeliverable(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Link href="/dashboard/campaigns">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Create Campaign
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 