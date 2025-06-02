import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Test Create Contract API Called ===')
    
    const cookieStore = await cookies()
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { negotiationId } = await request.json()

    if (!negotiationId) {
      return NextResponse.json({ error: 'Negotiation ID is required' }, { status: 400 })
    }

    // Create a test contract record with simplified structure
    const contractId = `contract_test_${Date.now()}`
    const contractData = {
      id: contractId,
      negotiation_id: negotiationId,
      status: 'draft',
      contract_terms: {
        total_amount: 1000,
        deliverables: ['Instagram Post', 'Story Series'],
        timeline: '2 weeks'
      },
      signature_data: {
        brand_signed: false,
        creator_signed: false
      },
      created_at: new Date().toISOString()
    }

    const { data: contractRecord, error: contractError } = await supabase
      .from('communication_log')
      .insert({
        campaign_id: '7d906c72-7fe0-4f29-8ec1-1001ccc6ecf9',
        creator_id: 'd94cbf20-5832-4147-bdb9-5585a29b5324',
        channel: 'email',
        direction: 'outbound',
        message_type: 'contract',
        subject: `CONTRACT: Test Contract - Creator`,
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
      console.error('Error creating test contract:', contractError)
      return NextResponse.json({ 
        error: 'Failed to create test contract',
        details: contractError.message 
      }, { status: 500 })
    }

    console.log('Test contract created successfully:', contractId)

    return NextResponse.json({
      success: true,
      contract: contractRecord,
      contractData: contractData,
      message: 'Test contract created successfully!'
    })

  } catch (error) {
    console.error('Error in test contract creation:', error)
    return NextResponse.json({ error: 'Failed to create test contract' }, { status: 500 })
  }
}