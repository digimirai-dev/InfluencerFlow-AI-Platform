import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing AI workflow tables...');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const tables = [
      'creator_recommendations',
      'communication_log', 
      'workflow_tasks',
      'ai_payments',
      'contracts',
      'negotiation_records',
      'campaign_reports'
    ];

    const results: any = {};

    for (const table of tables) {
      try {
        console.log(`📋 Testing table: ${table}`);
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .limit(1);

        results[table] = {
          exists: !error || error.code !== '42P01', // 42P01 = table does not exist
          accessible: !error || error.code !== '42501', // 42501 = permission denied
          record_count: count || 0,
          error: error?.message || null,
          error_code: error?.code || null
        };

        console.log(`✅ ${table}: ${results[table].exists ? 'exists' : 'missing'}, ${results[table].accessible ? 'accessible' : 'blocked'}`);
      } catch (testError) {
        results[table] = {
          exists: false,
          accessible: false,
          record_count: 0,
          error: testError instanceof Error ? testError.message : 'Unknown error',
          error_code: 'test_exception'
        };
        console.log(`❌ ${table}: test failed`);
      }
    }

    // Test campaign access
    try {
      const { data: campaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, title, status')
        .limit(3);

      results['campaigns'] = {
        exists: true,
        accessible: !campaignError,
        record_count: campaigns?.length || 0,
        sample_campaigns: campaigns?.map(c => ({ id: c.id, title: c.title, status: c.status })) || [],
        error: campaignError?.message || null
      };
    } catch (err) {
      results['campaigns'] = {
        exists: false,
        accessible: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    const summary = {
      tables_tested: tables.length,
      tables_existing: Object.values(results).filter((r: any) => r.exists).length,
      tables_accessible: Object.values(results).filter((r: any) => r.accessible).length,
      ai_workflow_ready: Object.values(results).filter((r: any) => r.exists && r.accessible).length >= 5
    };

    return NextResponse.json({
      success: true,
      summary,
      detailed_results: results,
      recommendation: summary.ai_workflow_ready 
        ? 'AI workflow tables are ready for use'
        : 'Some AI workflow tables need to be created or have permission issues'
    });

  } catch (error) {
    console.error('💥 AI tables test error:', error);
    return NextResponse.json(
      { error: 'AI tables test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 