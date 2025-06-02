import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Main Campaign Created Workflow Trigger
 * Orchestrates the entire AI-driven influencer matching and outreach process
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { campaign_id } = await req.json()

    console.log(`🚀 Starting AI workflow for campaign: ${campaign_id}`)

    // Update campaign status to AI processing
    await supabase
      .from('campaigns')
      .update({ 
        status: 'ai_processing',
        ai_processing_stage: 'finding_creators'
      })
      .eq('id', campaign_id)

    // Generate embeddings for the campaign
    await scheduleTask(supabase, {
      task_type: 'generate_campaign_embeddings',
      campaign_id,
      priority: 1,
      input_data: { campaign_id }
    })

    // Find matching creators using AI
    await scheduleTask(supabase, {
      task_type: 'find_creators',
      campaign_id,
      priority: 1,
      input_data: { campaign_id }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'AI workflow initiated',
        campaign_id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Campaign workflow error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

/**
 * Helper function to schedule background tasks
 */
async function scheduleTask(supabase: any, task: {
  task_type: string
  campaign_id: string
  creator_id?: string
  priority: number
  input_data: any
  scheduled_for?: Date
}) {
  return await supabase
    .from('workflow_tasks')
    .insert({
      task_type: task.task_type,
      campaign_id: task.campaign_id,
      creator_id: task.creator_id,
      priority: task.priority,
      input_data: task.input_data,
      scheduled_for: task.scheduled_for || new Date().toISOString()
    })
} 