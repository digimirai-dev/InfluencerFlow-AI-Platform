import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Add Contract Field Test API Called ===')
    
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

    // Try to update the negotiation with contract_data field
    const { data: updatedNegotiation, error } = await supabase
      .from('negotiations')
      .update({ 
        contract_data: {
          test: 'test_value',
          created_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', negotiationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating negotiation with contract_data:', error)
      return NextResponse.json({ 
        error: 'Failed to add contract_data field',
        details: error.message 
      }, { status: 500 })
    }

    console.log('Successfully added contract_data field to negotiation')

    return NextResponse.json({
      success: true,
      negotiation: updatedNegotiation,
      message: 'Contract data field added successfully!'
    })

  } catch (error) {
    console.error('Error in test API:', error)
    return NextResponse.json({ error: 'Failed to test contract field' }, { status: 500 })
  }
} 