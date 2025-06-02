import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Set Negotiation Agreed API Called ===')
    
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

    // Update negotiation status to agreed
    const { data: updatedNegotiation, error } = await supabase
      .from('negotiations')
      .update({ 
        status: 'agreed',
        updated_at: new Date().toISOString()
      })
      .eq('id', negotiationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating negotiation:', error)
      return NextResponse.json({ error: 'Failed to update negotiation' }, { status: 500 })
    }

    console.log('Negotiation set to agreed:', updatedNegotiation.id)

    return NextResponse.json({
      success: true,
      negotiation: updatedNegotiation,
      message: 'Negotiation status set to agreed!'
    })

  } catch (error) {
    console.error('Error setting negotiation agreed:', error)
    return NextResponse.json({ error: 'Failed to set negotiation agreed' }, { status: 500 })
  }
} 