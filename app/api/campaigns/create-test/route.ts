import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test campaign creation API called');
    
    // Use direct Supabase client instead of auth helpers
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      title,
      description,
      budget_min,
      budget_max,
      timeline_start,
      timeline_end,
      target_audience,
      requirements,
      deliverables,
      niches
    } = await request.json();

    console.log('📊 Test campaign data received:', { title, budget_min, budget_max });

    // Use your known user ID for testing
    const testUserId = '136b104e-231e-4f17-93c8-de1d6888f1bd';
    
    console.log('👤 Using test user ID:', testUserId);

    // Validate required fields
    if (!title?.trim() || !description?.trim()) {
      console.error('🚫 Missing required fields');
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    if (!budget_min || !budget_max || budget_min <= 0 || budget_max <= 0 || budget_min > budget_max) {
      console.error('🚫 Invalid budget:', { budget_min, budget_max });
      return NextResponse.json(
        { error: 'Valid budget range is required' },
        { status: 400 }
      );
    }

    console.log('📋 All validations passed, creating test campaign...');

    // Create the campaign data
    const campaignData = {
      title: title.trim(),
      description: description.trim(),
      status: 'active',
      budget_min: Number(budget_min),
      budget_max: Number(budget_max),
      timeline_start,
      timeline_end,
      target_audience: {
        description: target_audience,
        niches: niches || []
      },
      requirements: {
        niches: niches || [],
        list: requirements || []
      },
      deliverables: deliverables || [],
      brand_id: testUserId,
      objective: 'Brand awareness and engagement',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📋 Test campaign data to insert:', campaignData);

    // Try inserting with service role key if available, otherwise use anon key
    let insertResult;
    
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('🔑 Using service role key for insertion');
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      insertResult = await serviceSupabase
        .from('campaigns')
        .insert(campaignData)
        .select()
        .single();
    } else {
      console.log('🔑 Using anon key for insertion');
      insertResult = await supabase
        .from('campaigns')
        .insert(campaignData)
        .select()
        .single();
    }

    const { data: campaign, error: campaignError } = insertResult;

    if (campaignError) {
      console.error('❌ Database error creating test campaign:', campaignError);
      return NextResponse.json(
        { error: 'Failed to create test campaign', details: campaignError.message },
        { status: 500 }
      );
    }

    console.log('✅ Test campaign created successfully:', campaign.id);
    return NextResponse.json({ 
      ...campaign, 
      message: 'Test campaign created successfully',
      method: 'test_bypass'
    }, { status: 201 });

  } catch (error) {
    console.error('💥 Test campaign creation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 