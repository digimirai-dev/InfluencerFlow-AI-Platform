import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== AI Recommendation Update Called ===')
    
    // Await params to fix Next.js warning
    const { id: recommendationId } = await params
    
    console.log('Recommendation ID:', recommendationId)

    // Parse request body
    const { status } = await request.json()
    console.log('New status:', status)

    // Validate status
    if (!['approved', 'rejected', 'contacted', 'responded'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Handle real UUID campaigns from database
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log('Updating recommendation status...')

    // Update the recommendation status using RPC to bypass RLS
    const { data: updateData, error: updateError } = await supabase
      .rpc('update_recommendation_status', {
        p_recommendation_id: recommendationId,
        p_new_status: status
      })

    if (updateError) {
      console.error('RPC update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update recommendation', 
        details: updateError.message 
      }, { status: 500 })
    }

    console.log('Successfully updated recommendation:', updateData)

    return NextResponse.json({
      success: true,
      message: 'Recommendation status updated successfully',
      data: updateData
    })

  } catch (error) {
    console.error('Error updating AI recommendation:', error)
    return NextResponse.json(
      { error: 'Failed to update recommendation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 