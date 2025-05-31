import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json([], { status: 200 });
    }

    // Use direct client instead of auth helpers for now
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Use a single query with JOIN to get both creator and user data
    const { data: creatorsWithUsers, error } = await supabase
      .from('creator_profiles')
      .select(`
        *,
        users (
          id,
          full_name,
          avatar_url,
          email
        )
      `)
      .order('follower_count_instagram', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(creatorsWithUsers || []);

  } catch (error) {
    console.error('Creators API error:', error);
    return NextResponse.json([], { status: 200 });
  }
} 