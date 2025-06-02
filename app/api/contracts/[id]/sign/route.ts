import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Sign Contract API Called ===')
    
    const { id: contractId } = await params
    const cookieStore = await cookies()
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { signerType, signatureData, ipAddress, userAgent } = await request.json()

    if (!signerType || !signatureData) {
      return NextResponse.json({ error: 'Signer type and signature data are required' }, { status: 400 })
    }

    // Find contract record in communication_log
    const { data: contractRecords, error: fetchError } = await supabase
      .from('communication_log')
      .select('*')
      .eq('message_type', 'contract')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching contract records:', fetchError)
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    console.log(`Found ${contractRecords?.length || 0} contract records total`)

    // Find the specific contract by ID in the JSON content
    let contractRecord = null
    let contractData: any = {}

    for (const record of contractRecords || []) {
      try {
        const parsedData = JSON.parse(record.content)
        if (parsedData.id === contractId) {
          contractRecord = record
          contractData = parsedData
          console.log(`Found contract ${contractId} in record ${record.id}, status: ${parsedData.status}`)
          console.log(`Brand signed: ${parsedData.signature_data?.brand_signed}, Creator signed: ${parsedData.signature_data?.creator_signed}`)
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

    // Update signature data
    const currentSignatureData = contractData.signature_data || {}
    const timestamp = new Date().toISOString()

    let updatedSignatureData = { ...currentSignatureData }
    let newStatus = contractData.status || 'draft'

    if (signerType === 'brand') {
      updatedSignatureData = {
        ...updatedSignatureData,
        brand_signed: true,
        brand_signature_date: timestamp,
        brand_signature_data: {
          signature: signatureData,
          ip_address: ipAddress,
          user_agent: userAgent,
          timestamp: timestamp
        }
      }
    } else if (signerType === 'creator') {
      updatedSignatureData = {
        ...updatedSignatureData,
        creator_signed: true,
        creator_signature_date: timestamp,
        creator_signature_data: {
          signature: signatureData,
          ip_address: ipAddress,
          user_agent: userAgent,
          timestamp: timestamp
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid signer type' }, { status: 400 })
    }

    // Check if contract is fully signed
    if (updatedSignatureData.brand_signed && updatedSignatureData.creator_signed) {
      updatedSignatureData.contract_finalized = true
      updatedSignatureData.finalization_date = timestamp
      newStatus = 'signed'
    } else {
      newStatus = 'partially_signed'
    }

    // Update contract data
    const updatedContractData = {
      ...contractData,
      signature_data: updatedSignatureData,
      status: newStatus,
      updated_at: timestamp
    }

    const { data: updatedContractRecord, error: updateError } = await supabase
      .from('communication_log')
      .update({
        content: JSON.stringify(updatedContractData)
      })
      .eq('id', contractRecord.id)
      .select()

    if (updateError) {
      console.error('Error updating contract:', updateError)
      console.error('Contract ID:', contractId)
      console.error('Communication Record ID:', contractRecord.id)
      console.error('Updated Contract Data:', JSON.stringify(updatedContractData, null, 2))
      return NextResponse.json({ 
        error: 'Failed to update contract',
        details: updateError.message,
        contractId: contractId,
        recordId: contractRecord.id 
      }, { status: 500 })
    }

    // If fully signed, trigger post-signature actions
    if (newStatus === 'signed') {
      await triggerPostSignatureActions(contractId, contractRecord.id, supabase)
    }

    console.log(`Contract ${contractId} signed by ${signerType}`)

    return NextResponse.json({
      success: true,
      contract: {
        id: contractId,
        negotiation_id: contractRecord.id,
        ...updatedContractData
      },
      fullyExecuted: newStatus === 'signed',
      message: newStatus === 'signed' 
        ? 'Contract fully executed! Both parties have signed.' 
        : `Contract signed by ${signerType}. Waiting for other party.`
    })

  } catch (error) {
    console.error('Error signing contract:', error)
    return NextResponse.json({ error: 'Failed to sign contract' }, { status: 500 })
  }
}

// Trigger actions when contract is fully signed
async function triggerPostSignatureActions(contractId: string, negotiationId: string, supabase: any) {
  try {
    // Get negotiation details with contract data
    const { data: negotiation } = await supabase
      .from('negotiations')
      .select(`
        *,
        campaigns!campaign_id (id, title),
        users!creator_id (id, full_name, email)
      `)
      .eq('id', negotiationId)
      .single()

    if (!negotiation || !negotiation.contract_data) return

    // 1. Create collaboration record
    const collaborationData = {
      campaign_id: negotiation.campaign_id,
      creator_id: negotiation.creator_id,
      contract_id: contractId,
      status: 'active',
      agreed_rate: negotiation.contract_data.contract_terms?.compensation?.total_amount || 0,
      start_date: new Date().toISOString(),
      end_date: null, // Will be set based on deliverable completion
      deliverables_completed: 0,
      total_deliverables: Array.isArray(negotiation.contract_data.contract_terms?.deliverables?.content_requirements) 
        ? negotiation.contract_data.contract_terms.deliverables.content_requirements.length 
        : 3,
      created_at: new Date().toISOString()
    }

    const { data: collaboration, error: collabError } = await supabase
      .from('collaborations')
      .insert(collaborationData)
      .select()
      .single()

    if (collabError) {
      console.error('Error creating collaboration:', collabError)
    } else {
      console.log('Collaboration created:', collaboration.id)
    }

    // 2. Send notification emails (simulated)
    console.log('Sending contract execution notifications...')
    
    // 3. Update campaign status if needed
    // 4. Schedule payment reminders
    // 5. Create content delivery tracking

  } catch (error) {
    console.error('Error in post-signature actions:', error)
  }
} 