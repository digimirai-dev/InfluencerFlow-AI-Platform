import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user || authError) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    console.log('🔧 Fixing profile for user:', user.email)

    // Create or update the user profile
    const profileData = {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      user_type: (user.user_metadata?.user_type as 'brand' | 'creator' | 'admin') || 'creator',
      avatar_url: user.user_metadata?.avatar_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Try to insert/upsert the profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .upsert(profileData, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError)
      
      // If upsert fails, just return the profile data
      console.log('🔄 Returning fallback profile data')
      return NextResponse.json({
        success: true,
        profile: profileData,
        message: 'Profile created as fallback',
        note: 'Database may need schema setup'
      })
    }

    console.log('✅ Profile created/updated successfully')
    return NextResponse.json({
      success: true,
      profile: profile || profileData,
      message: 'Profile fixed successfully'
    })

  } catch (error) {
    console.error('💥 Fix profile error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fix profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 