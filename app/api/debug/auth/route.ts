import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('🐛 Debug auth API called');
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Log all cookies
    const allCookies = request.cookies.getAll();
    console.log('🍪 All cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value, length: c.value?.length })));
    
    // Try getUser
    console.log('📡 Testing getUser...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 getUser result:', { user: user?.email, error: userError?.message });
    
    // Try getSession
    console.log('📡 Testing getSession...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('🔐 getSession result:', { 
      session: session?.user?.email, 
      error: sessionError?.message,
      hasAccessToken: !!session?.access_token,
      tokenLength: session?.access_token?.length
    });
    
    // Check specific auth cookies
    const authTokenCookie = request.cookies.get('sb-pmegrknwfnntlosiwfcp-auth-token');
    const authTokenRefreshCookie = request.cookies.get('sb-pmegrknwfnntlosiwfcp-auth-token-refresh');
    
    console.log('🍪 Auth cookies:', {
      authToken: !!authTokenCookie,
      authTokenLength: authTokenCookie?.value?.length,
      authRefreshToken: !!authTokenRefreshCookie,
      authRefreshTokenLength: authTokenRefreshCookie?.value?.length
    });
    
    // Try to manually parse auth cookie
    if (authTokenCookie) {
      try {
        const cookieValue = authTokenCookie.value;
        console.log('🔍 Auth cookie preview:', cookieValue.substring(0, 50) + '...');
        
        // Check if it looks like a JSON structure
        if (cookieValue.startsWith('[') || cookieValue.startsWith('{')) {
          console.log('🔍 Cookie appears to be JSON format');
        } else {
          console.log('🔍 Cookie appears to be non-JSON format');
        }
      } catch (parseError) {
        console.log('⚠️ Error examining cookie:', parseError);
      }
    }

    return NextResponse.json({
      debug: 'Auth debugging information',
      cookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value, length: c.value?.length })),
      authentication: {
        getUser: {
          success: !!user,
          email: user?.email,
          id: user?.id,
          error: userError?.message
        },
        getSession: {
          success: !!session,
          email: session?.user?.email,
          id: session?.user?.id,
          hasAccessToken: !!session?.access_token,
          error: sessionError?.message
        }
      },
      authCookies: {
        authToken: !!authTokenCookie,
        authTokenLength: authTokenCookie?.value?.length,
        authRefreshToken: !!authTokenRefreshCookie
      }
    });

  } catch (error) {
    console.error('💥 Debug auth API error:', error);
    return NextResponse.json(
      { error: 'Debug auth API failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 