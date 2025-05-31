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

    console.log('Fetching creators from Supabase...');

    // Fetch all creators without limit
    const { data: creators, error } = await supabase
      .from('creator_profiles')
      .select('*')
      .order('follower_count_instagram', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json([], { status: 200 });
    }

    console.log(`Found ${creators?.length || 0} creators`);
    
    // If we have creators, let's get the user data separately
    if (creators && creators.length > 0) {
      const userIds = creators.map(c => c.user_id);
      console.log('Looking up user IDs:', userIds.slice(0, 5), '... and', userIds.length - 5, 'more');
      
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, email')
        .in('id', userIds);
      
      if (userError) {
        console.error('User lookup error:', userError);
      } else {
        console.log(`Found ${users?.length || 0} users`);
      }
      
      // Combine the data
      const creatorsWithUsers = creators.map(creator => {
        const user = users?.find(user => user.id === creator.user_id);
        return {
          ...creator,
          users: user || {
            id: creator.user_id,
            full_name: creator.display_name,
            avatar_url: null,
            email: null
          }
        };
      });
      
      return NextResponse.json(creatorsWithUsers);
    }

    return NextResponse.json(creators || []);

  } catch (error) {
    console.error('Creators API error:', error);
    return NextResponse.json([], { status: 200 });
  }
} 