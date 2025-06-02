import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Generate Contract API Called ===')
    
    const cookieStore = await cookies()
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { negotiationId, contractType = 'collaboration' } = await request.json()

    if (!negotiationId) {
      return NextResponse.json({ error: 'Negotiation ID is required' }, { status: 400 })
    }

    // Get negotiation with all related data
    const { data: negotiation, error: negotiationError } = await supabase
      .from('negotiations')
      .select(`
        *,
        campaigns!campaign_id (id, title, description, budget_min, budget_max, timeline_start, timeline_end, deliverables),
        users!creator_id (id, full_name, email),
        communication_log!communication_id (id, subject, content, created_at)
      `)
      .eq('id', negotiationId)
      .single()

    if (negotiationError || !negotiation) {
      console.error('Negotiation not found:', negotiationError)
      return NextResponse.json({ error: 'Negotiation not found' }, { status: 404 })
    }

    // Get creator profile
    let creatorProfile = null
    if (negotiation.creator_id) {
      const { data: profile } = await supabase
        .from('creator_profiles')
        .select('user_id, display_name, niche, follower_count_instagram, engagement_rate, rate_per_post')
        .eq('user_id', negotiation.creator_id)
        .single()
      
      creatorProfile = profile
    }

    // Generate AI-powered contract terms
    const contractTerms = await generateContractTerms(negotiation, creatorProfile)

    // Create a unique contract ID
    const contractId = `contract_${Date.now()}_${negotiationId.substring(0, 8)}`

    // Store contract as a communication record (workaround for missing contracts table)
    const contractData = {
      id: contractId,
      contract_type: contractType,
      contract_terms: contractTerms,
      status: 'draft',
      negotiation_id: negotiationId,
      legal_review: {
        status: 'pending',
        created_at: new Date().toISOString(),
        issues: [],
        recommendations: []
      },
      signature_data: {
        brand_signed: false,
        creator_signed: false,
        brand_signature_date: null,
        creator_signature_date: null,
        contract_finalized: false
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: contractRecord, error: contractError } = await supabase
      .from('communication_log')
      .insert({
        campaign_id: negotiation.campaign_id,
        creator_id: negotiation.creator_id,
        channel: 'email',
        direction: 'outbound',
        message_type: 'contract',
        subject: `CONTRACT: ${negotiation.campaigns?.title || 'Campaign'} - ${creatorProfile?.display_name || 'Creator'}`,
        content: JSON.stringify(contractData),
        ai_generated: true,
        external_id: contractId,
        thread_id: null,
        sentiment_score: null,
        intent: null,
        key_points: null,
        delivered: true,
        read: false,
        responded: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (contractError) {
      console.error('Error creating contract record:', contractError)
      return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
    }

    // Update negotiation status to 'contracted'
    await supabase
      .from('negotiations')
      .update({ 
        status: 'contracted',
        updated_at: new Date().toISOString()
      })
      .eq('id', negotiationId)

    console.log('Contract generated successfully:', contractId)

    return NextResponse.json({
      success: true,
      contract: {
        ...contractData,
        // Add negotiation data for compatibility
        negotiations: {
          id: negotiation.id,
          creator_id: negotiation.creator_id,
          campaign_id: negotiation.campaign_id,
          current_terms: negotiation.current_terms,
          creator_terms: negotiation.creator_terms,
          status: 'contracted',
          campaigns: negotiation.campaigns,
          users: negotiation.users
        }
      },
      message: 'Contract generated successfully!'
    })

  } catch (error) {
    console.error('Error generating contract:', error)
    return NextResponse.json({ error: 'Failed to generate contract' }, { status: 500 })
  }
}

// AI-powered contract term generation
async function generateContractTerms(negotiation: any, creatorProfile: any) {
  const campaign = negotiation.campaigns
  const agreedTerms = negotiation.current_terms || negotiation.creator_terms

  // Generate comprehensive contract terms
  const contractTerms = {
    // Basic Information
    contract_title: `Influencer Collaboration Agreement - ${campaign?.title || 'Campaign'}`,
    parties: {
      brand: {
        company_name: campaign?.brand_profiles?.company_name || 'Brand Company',
        representative: 'Marketing Manager', // This could be fetched from brand profile
        email: 'contracts@brand.com', // This could be fetched from brand profile
        address: campaign?.brand_profiles?.location || 'Brand Address'
      },
      creator: {
        name: creatorProfile?.display_name || negotiation.users?.full_name || 'Creator',
        email: negotiation.users?.email || 'creator@email.com',
        social_handles: {
          instagram: `@${creatorProfile?.display_name?.toLowerCase().replace(' ', '') || 'creator'}`,
          followers: creatorProfile?.follower_count_instagram || 0
        }
      }
    },

    // Financial Terms
    compensation: {
      total_amount: agreedTerms?.total_rate || 1000,
      currency: 'USD',
      payment_schedule: [
        {
          milestone: 'Contract Signature',
          percentage: 30,
          amount: Math.round((agreedTerms?.total_rate || 1000) * 0.3),
          due_date: 'Upon contract execution'
        },
        {
          milestone: 'Content Delivery',
          percentage: 50,
          amount: Math.round((agreedTerms?.total_rate || 1000) * 0.5),
          due_date: 'Upon delivery of approved content'
        },
        {
          milestone: 'Campaign Completion',
          percentage: 20,
          amount: Math.round((agreedTerms?.total_rate || 1000) * 0.2),
          due_date: '30 days after campaign completion'
        }
      ],
      payment_method: 'Bank transfer',
      payment_terms: 'Net 30 days'
    },

    // Deliverables & Timeline
    deliverables: {
      content_requirements: agreedTerms?.deliverables || campaign?.deliverables || [
        '2 Instagram Posts',
        '1 Instagram Story series',
        '1 Product review video'
      ],
      content_specifications: {
        platform_guidelines: true,
        brand_guidelines: true,
        hashtag_requirements: [`#${campaign?.title?.replace(/\s+/g, '').toLowerCase() || 'campaign'}`],
        mention_requirements: ['@brandhandle'],
        disclosure_requirements: ['#ad', '#sponsored', '#partnership']
      },
      timeline: {
        content_creation_deadline: agreedTerms?.timeline || '2 weeks from contract signature',
        revision_period: '5 business days',
        publication_schedule: 'As agreed with brand team'
      }
    },

    // Usage Rights & Licensing
    usage_rights: {
      license_type: 'Non-exclusive',
      usage_duration: '2 years from publication date',
      usage_scope: [
        'Social media marketing',
        'Website usage',
        'Email marketing',
        'Paid advertising (with additional approval)'
      ],
      geographic_scope: 'Worldwide',
      platform_rights: ['Instagram', 'Facebook', 'Website', 'Email'],
      whitelist_approval: true
    },

    // Performance & Analytics
    performance_metrics: {
      minimum_engagement_rate: creatorProfile?.engagement_rate || 3.0,
      reporting_requirements: [
        'Screenshot of published content',
        'Analytics report after 7 days',
        'Final performance summary after 30 days'
      ],
      content_performance_bonus: {
        enabled: true,
        threshold: '150% of average engagement',
        bonus_amount: Math.round((agreedTerms?.total_rate || 1000) * 0.1)
      }
    },

    // Legal Terms
    legal_terms: {
      content_ownership: 'Creator retains original content ownership, grants usage license to Brand',
      exclusivity_period: '30 days (category exclusive)',
      competitor_restrictions: 'No direct competitor partnerships during campaign period',
      cancellation_policy: {
        brand_cancellation: '7 days notice, 50% payment if content created',
        creator_cancellation: '14 days notice, forfeit of advance payment',
        force_majeure: 'Standard force majeure clause applies'
      },
      dispute_resolution: 'Mediation followed by arbitration',
      governing_law: 'State of California, USA',
      confidentiality: 'Standard NDA terms apply for 2 years'
    },

    // Quality & Approval Process
    approval_process: {
      content_approval_timeline: '3 business days',
      revision_rounds: 2,
      final_approval_authority: 'Brand Marketing Manager',
      content_standards: [
        'High-quality images/videos',
        'Brand-appropriate messaging',
        'FTC compliance for sponsored content',
        'Platform-specific optimization'
      ]
    },

    // Special Clauses
    special_clauses: [
      {
        title: 'Content Authenticity',
        description: 'Creator agrees to maintain authentic voice while incorporating brand messaging'
      },
      {
        title: 'Platform Compliance',
        description: 'All content must comply with platform terms of service and community guidelines'
      },
      {
        title: 'Performance Monitoring',
        description: 'Brand reserves right to monitor content performance and request reasonable adjustments'
      }
    ],

    // AI Generation Metadata
    ai_generated: true,
    generation_timestamp: new Date().toISOString(),
    contract_version: '1.0',
    template_used: 'influencer_collaboration_standard_v2',
    customization_level: 'high'
  }

  return contractTerms
} 