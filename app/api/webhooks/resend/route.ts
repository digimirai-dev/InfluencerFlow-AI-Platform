import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Resend Webhook Called ===')
    
    const body = await request.json()
    console.log('Webhook payload:', body)

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Handle different webhook events
    switch (body.type) {
      case 'email.delivered':
        await handleEmailDelivered(supabase, body.data)
        break
      
      case 'email.opened':
        await handleEmailOpened(supabase, body.data)
        break
      
      case 'email.clicked':
        await handleEmailClicked(supabase, body.data)
        break
      
      case 'email.bounced':
        await handleEmailBounced(supabase, body.data)
        break
      
      case 'email.complained':
        await handleEmailComplained(supabase, body.data)
        break
      
      default:
        console.log('Unhandled webhook event:', body.type)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error processing Resend webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleEmailDelivered(supabase: any, data: any) {
  console.log('📧 Email delivered:', data.email_id)
  
  // Update communication log to mark as delivered
  await supabase
    .from('communication_log')
    .update({ delivered: true })
    .eq('external_id', data.email_id)
}

async function handleEmailOpened(supabase: any, data: any) {
  console.log('👀 Email opened:', data.email_id)
  
  // Update communication log to mark as read
  await supabase
    .from('communication_log')
    .update({ read: true })
    .eq('external_id', data.email_id)
}

async function handleEmailClicked(supabase: any, data: any) {
  console.log('🔗 Email link clicked:', data.email_id)
  
  // Could track click events if needed
  // For now, just mark as read
  await supabase
    .from('communication_log')
    .update({ read: true })
    .eq('external_id', data.email_id)
}

async function handleEmailBounced(supabase: any, data: any) {
  console.log('❌ Email bounced:', data.email_id)
  
  // Update communication log to mark delivery failed
  await supabase
    .from('communication_log')
    .update({ delivered: false })
    .eq('external_id', data.email_id)
}

async function handleEmailComplained(supabase: any, data: any) {
  console.log('⚠️ Email complaint:', data.email_id)
  
  // Could handle spam complaints
  // For now, just log it
} 