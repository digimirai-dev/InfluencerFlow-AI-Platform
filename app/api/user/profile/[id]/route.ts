import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const userId = params.id;

    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // If no user is found, try to get session as fallback
    if (!user || authError) {
      console.log('No user from getUser, trying getSession as fallback');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('No session found either, returning unauthorized');
        return NextResponse.json(
          { error: 'Unauthorized - no valid session' },
          { status: 401 }
        );
      }

      // Use session user if getUser failed but session exists
      const sessionUser = session.user;
      
      // Only allow users to fetch their own profile for security
      if (sessionUser.id !== userId) {
        return NextResponse.json(
          { error: 'Forbidden - can only access own profile' },
          { status: 403 }
        );
      }

      // Try to fetch profile with session user
      return await fetchProfileForUser(supabase, userId, sessionUser);
    }

    // Only allow users to fetch their own profile for security
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - can only access own profile' },
        { status: 403 }
      );
    }

    return await fetchProfileForUser(supabase, userId, user);

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function fetchProfileForUser(supabase: any, userId: string, user: any) {
  try {
    // Fetch user profile
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      
      // If profile doesn't exist, create one from auth data
      if (error.code === 'PGRST116') {
        console.log('Profile not found, creating new profile from auth data');
        const newProfile = {
          id: userId,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          user_type: user.user_metadata?.user_type || 'creator',
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('users')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.error('Error creating user profile:', createError);
          
          // If creation fails, return the profile data anyway for fallback
          console.log('Profile creation failed, returning fallback profile');
          return NextResponse.json(newProfile);
        }

        console.log('Profile created successfully');
        return NextResponse.json(createdProfile);
      }

      // For other errors, return a fallback profile
      console.log('Other profile fetch error, returning fallback');
      const fallbackProfile = {
        id: userId,
        email: user.email || 'unknown@example.com',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        user_type: user.user_metadata?.user_type || 'creator',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      return NextResponse.json(fallbackProfile);
    }

    console.log('Profile fetched successfully via API');
    return NextResponse.json(profile);
    
  } catch (fetchError) {
    console.error('Error in fetchProfileForUser:', fetchError);
    
    // Return fallback profile on any error
    const fallbackProfile = {
      id: userId,
      email: user.email || 'unknown@example.com',
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      user_type: user.user_metadata?.user_type || 'creator',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    return NextResponse.json(fallbackProfile);
  }
} 