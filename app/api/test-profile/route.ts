import { createSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  try {
    console.log('🧪 Testing profile query for user:', userId)
    
    const supabase = createSupabaseClient()
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    console.log('🧪 Test query result:', { data, error })

    return NextResponse.json({ 
      success: true, 
      data, 
      error: error?.message || null,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('🧪 Test query failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 