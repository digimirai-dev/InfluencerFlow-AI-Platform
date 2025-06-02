import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Get Contract API Called ===')
    
    const { id: contractId } = await params
    const cookieStore = await cookies()
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Find contract record in communication_log
    const { data: contractRecords, error } = await supabase
      .from('communication_log')
      .select('*')
      .eq('message_type', 'contract')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contract records:', error)
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    console.log(`GET Contract API: Found ${contractRecords?.length || 0} contract records total`)

    // Find the specific contract by ID in the JSON content
    let contractRecord = null
    let contractData: any = {}

    for (const record of contractRecords || []) {
      try {
        const parsedData = JSON.parse(record.content)
        if (parsedData.id === contractId) {
          contractRecord = record
          contractData = parsedData
          console.log(`GET Contract API: Found contract ${contractId} in record ${record.id}, status: ${parsedData.status}`)
          console.log(`GET Contract API: Brand signed: ${parsedData.signature_data?.brand_signed}, Creator signed: ${parsedData.signature_data?.creator_signed}`)
          break
        }
      } catch (e) {
        console.error('Error parsing contract record:', e)
        continue
      }
    }

    if (!contractRecord) {
      console.error('Contract not found with ID:', contractId)
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Transform to contract format
    const contract = {
      id: contractData.id || contractId,
      negotiation_id: contractData.negotiation_id,
      contract_type: contractData.contract_type || 'collaboration',
      contract_terms: contractData.contract_terms || {},
      status: contractData.status || 'draft',
      legal_review: contractData.legal_review || {},
      signature_data: contractData.signature_data || {},
      created_at: contractData.created_at || contractRecord.created_at,
      updated_at: contractData.updated_at || contractRecord.created_at,
      negotiations: {
        id: contractData.negotiation_id,
        creator_id: contractRecord.creator_id,
        campaign_id: contractRecord.campaign_id,
        current_terms: {},
        creator_terms: {},
        status: 'contracted'
      }
    }

    // Get creator profile and additional data
    if (contractRecord.creator_id) {
      const { data: creatorProfile } = await supabase
        .from('creator_profiles')
        .select('user_id, display_name, niche, follower_count_instagram, engagement_rate, rate_per_post')
        .eq('user_id', contractRecord.creator_id)
        .single()
      
      const { data: user } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', contractRecord.creator_id)
        .single()

      const { data: campaign } = await supabase
        .from('campaigns')
        .select('id, title, description, budget_min, budget_max')
        .eq('id', contractRecord.campaign_id)
        .single()
      
      if (creatorProfile) {
        (contract.negotiations as any).creator_profiles = creatorProfile
      }
      if (user) {
        (contract.negotiations as any).users = user
      }
      if (campaign) {
        (contract.negotiations as any).campaigns = campaign
      }
    }

    return NextResponse.json(contract)

  } catch (error) {
    console.error('Error fetching contract:', error)
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Update Contract API Called ===')
    
    const { id: contractId } = await params
    const cookieStore = await cookies()
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const updates = await request.json()

    // Update contract
    const { data: updatedContract, error } = await supabase
      .from('contracts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', contractId)
      .select()
      .single()

    if (error) {
      console.error('Error updating contract:', error)
      return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 })
    }

    return NextResponse.json(updatedContract)

  } catch (error) {
    console.error('Error updating contract:', error)
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 })
  }
} 