import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Simple Update Test API Called ===')
    
    const cookieStore = await cookies()
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Find the test contract record
    const { data: contractRecords, error: fetchError } = await supabase
      .from('communication_log')
      .select('*')
      .eq('external_id', 'contract_test_1748842728073')
      .single()

    if (fetchError || !contractRecords) {
      console.error('Error fetching test contract:', fetchError)
      return NextResponse.json({ error: 'Test contract not found' }, { status: 404 })
    }

    console.log('Found test contract record:', contractRecords.id)

    // Try a simple update
    const simpleTestData = {
      id: "contract_test_1748842728073",
      status: "test_updated",
      simple_test: true,
      timestamp: new Date().toISOString()
    }

    const { data: updateResult, error: updateError } = await supabase
      .from('communication_log')
      .update({
        content: JSON.stringify(simpleTestData)
      })
      .eq('id', contractRecords.id)
      .select()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ 
        error: 'Update failed',
        details: updateError.message,
        code: updateError.code 
      }, { status: 500 })
    }

    console.log('Update successful:', updateResult)

    return NextResponse.json({
      success: true,
      message: 'Simple update test completed',
      recordId: contractRecords.id,
      updateResult: updateResult
    })

  } catch (error) {
    console.error('Error in simple update test:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
} 