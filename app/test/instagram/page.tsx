import InstagramConnect from '@/components/instagram/InstagramConnect'

export default function InstagramTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Instagram API Integration Test
          </h1>
          <p className="text-gray-600">
            Test the Meta/Instagram API integration for InfluencerFlow platform.
          </p>
        </div>
        
        <InstagramConnect />
      </div>
    </div>
  )
} 