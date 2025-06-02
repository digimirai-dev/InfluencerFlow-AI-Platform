import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Campaign Contracts API Called ===')
    
    const { id: campaignId } = await params
    const cookieStore = await cookies()
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    console.log('Campaign ID:', campaignId)

    // Get contract records from communication_log
    const { data: contractRecords, error } = await supabase
      .from('communication_log')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('message_type', 'contract')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contracts from communication_log:', error)
      return NextResponse.json([], { status: 200 })
    }

    console.log(`Found ${contractRecords?.length || 0} contract records`)
    
    // Transform communication records into contract format
    const contracts = contractRecords?.map(record => {
      let contractData: any = {}
      try {
        contractData = JSON.parse(record.content)
      } catch (e) {
        console.error('Error parsing contract data:', e)
        contractData = {
          id: `contract_${record.id}`,
          status: 'draft',
          contract_terms: {},
          signature_data: {},
          created_at: record.created_at
        }
      }

      return {
        id: contractData.id || `contract_${record.id}`,
        negotiation_id: contractData.negotiation_id || record.external_id,
        contract_type: contractData.contract_type || 'collaboration',
        contract_terms: contractData.contract_terms || {},
        status: contractData.status || 'draft',
        legal_review: contractData.legal_review || {},
        signature_data: contractData.signature_data || {},
        created_at: contractData.created_at || record.created_at,
        updated_at: contractData.updated_at || record.created_at,
        // Add minimal negotiation info
        negotiations: {
          id: contractData.negotiation_id || record.external_id,
          creator_id: record.creator_id,
          campaign_id: record.campaign_id,
          current_terms: {},
          creator_terms: {},
          status: 'contracted'
        }
      }
    }) || []
    
    // If we have contracts, enrich them with creator and campaign data
    if (contracts.length > 0) {
      // Get creator profiles
      const creatorIds = Array.from(new Set(contracts.map(c => c.negotiations?.creator_id).filter(Boolean)))
      
      if (creatorIds.length > 0) {
        const { data: creatorProfiles } = await supabase
          .from('creator_profiles')
          .select('user_id, display_name, niche, follower_count_instagram, engagement_rate, rate_per_post')
          .in('user_id', creatorIds)

        const { data: users } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', creatorIds)

        const { data: campaign } = await supabase
          .from('campaigns')
          .select('id, title, description')
          .eq('id', campaignId)
          .single()

        // Enrich contracts with creator profiles and campaign data
        contracts.forEach(contract => {
          if (contract.negotiations?.creator_id) {
            const profile = creatorProfiles?.find(p => p.user_id === contract.negotiations.creator_id)
            const user = users?.find(u => u.id === contract.negotiations.creator_id)
            if (profile) {
              (contract.negotiations as any).creator_profiles = profile
            }
            if (user) {
              (contract.negotiations as any).users = user
            }
          }
          if (campaign) {
            (contract.negotiations as any).campaigns = campaign
          }
        })
      }
    }

    return NextResponse.json(contracts)

  } catch (error) {
    console.error('Error fetching campaign contracts:', error)
    return NextResponse.json([], { status: 200 })
  }
} 