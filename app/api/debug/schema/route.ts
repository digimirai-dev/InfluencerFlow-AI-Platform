import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking database schema...');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const results: any = {};

    // Check campaigns table for AI columns
    console.log('📋 Testing campaigns table AI columns...');
    try {
      // Try to select the AI columns to see if they exist
      const { error: aiColumnsError } = await supabase
        .from('campaigns')
        .select('ai_processing_stage, description_embedding, niche_embedding')
        .limit(1);

      results.campaigns = {
        ai_columns_exist: !aiColumnsError,
        error: aiColumnsError?.message || null,
        missing_columns: aiColumnsError ? ['ai_processing_stage', 'description_embedding', 'niche_embedding'] : []
      };
    } catch (err) {
      results.campaigns = { error: 'Table access failed', ai_columns_exist: false };
    }

    // Check workflow_tasks table for AI columns
    console.log('📋 Testing workflow_tasks table AI columns...');
    try {
      const { error: workflowError } = await supabase
        .from('workflow_tasks')
        .select('input_data, output_data, scheduled_for')
        .limit(1);

      results.workflow_tasks = {
        ai_columns_exist: !workflowError,
        error: workflowError?.message || null,
        missing_columns: workflowError ? ['input_data', 'output_data', 'scheduled_for'] : []
      };
    } catch (err) {
      results.workflow_tasks = { error: 'Table access failed', ai_columns_exist: false };
    }

    // Check creator_recommendations table
    console.log('📋 Testing creator_recommendations table...');
    try {
      const { error: creatorError } = await supabase
        .from('creator_recommendations')
        .select('semantic_similarity_score, engagement_score, match_reasoning')
        .limit(1);

      results.creator_recommendations = {
        ai_columns_exist: !creatorError,
        error: creatorError?.message || null,
        missing_columns: creatorError ? ['semantic_similarity_score', 'engagement_score', 'match_reasoning'] : []
      };
    } catch (err) {
      results.creator_recommendations = { error: 'Table access failed', ai_columns_exist: false };
    }

    // Check ai_prompt_logs table
    console.log('📋 Testing ai_prompt_logs table...');
    try {
      const { error: logsError } = await supabase
        .from('ai_prompt_logs')
        .select('cost, tokens_used, prompt_type')
        .limit(1);

      results.ai_prompt_logs = {
        ai_columns_exist: !logsError,
        error: logsError?.message || null,
        missing_columns: logsError ? ['cost', 'tokens_used', 'prompt_type'] : []
      };
    } catch (err) {
      results.ai_prompt_logs = { error: 'Table access failed', ai_columns_exist: false };
    }

    // Test basic campaigns status update (this should always work)
    console.log('🧪 Testing basic campaigns update...');
    try {
      const { data: testCampaign } = await supabase
        .from('campaigns')
        .select('id, status')
        .eq('id', '5bf88362-342d-4d40-9eb2-fd6f424717f7')
        .single();

      if (testCampaign) {
        const { error: updateError } = await supabase
          .from('campaigns')
          .update({ status: 'outreach_active' })
          .eq('id', testCampaign.id);

        results.status_update_test = {
          success: !updateError,
          error: updateError?.message || null,
          test_campaign_id: testCampaign.id,
          current_status: testCampaign.status
        };

        if (!updateError) {
          console.log('✅ Successfully updated campaign status to outreach_active');
        }
      }
    } catch (updateErr) {
      results.status_update_test = { 
        success: false, 
        error: updateErr instanceof Error ? updateErr.message : 'Unknown error' 
      };
    }

    // Summary
    const tablesWithIssues = Object.entries(results)
      .filter(([_, result]: [string, any]) => !result.ai_columns_exist)
      .map(([table, _]) => table);

    const summary = {
      schema_migration_needed: tablesWithIssues.length > 0,
      tables_with_missing_ai_columns: tablesWithIssues.length,
      total_tables_checked: Object.keys(results).length - 1, // excluding status_update_test
      status_update_works: results.status_update_test?.success || false
    };

    return NextResponse.json({
      success: true,
      summary,
      detailed_results: results,
      recommendation: summary.schema_migration_needed 
        ? `Need to run AI workflow migration. Missing AI columns in: ${tablesWithIssues.join(', ')}`
        : 'Database schema is ready for AI workflow',
      quick_fix: summary.schema_migration_needed 
        ? 'Run the scripts/apply-ai-workflow.sql in Supabase SQL editor'
        : 'Schema is ready'
    });

  } catch (error) {
    console.error('💥 Schema check error:', error);
    return NextResponse.json(
      { error: 'Schema check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 