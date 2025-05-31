import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Use service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const testUsers = [
      {
        email: 'admin@influencerflow.com',
        password: 'admin123',
        userData: {
          full_name: 'Admin User',
          user_type: 'admin',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        }
      },
      {
        email: 'brand@influencerflow.com',
        password: 'brand123',
        userData: {
          full_name: 'Brand Manager',
          user_type: 'brand',
          avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face'
        }
      },
      {
        email: 'creator@influencerflow.com',
        password: 'creator123',
        userData: {
          full_name: 'Content Creator',
          user_type: 'creator',
          avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
        }
      }
    ];

    const results = [];

    for (const testUser of testUsers) {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: {
          full_name: testUser.userData.full_name
        }
      });

      if (authError) {
        console.error(`Error creating auth user ${testUser.email}:`, authError);
        results.push({ email: testUser.email, success: false, error: authError.message });
        continue;
      }

      // Create public user profile
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: testUser.email,
          full_name: testUser.userData.full_name,
          avatar_url: testUser.userData.avatar_url,
          user_type: testUser.userData.user_type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error(`Error creating profile for ${testUser.email}:`, profileError);
        results.push({ email: testUser.email, success: false, error: profileError.message });
        continue;
      }

      results.push({ 
        email: testUser.email, 
        success: true, 
        userId: authData.user.id 
      });
    }

    // Create brand profile for brand user
    const brandUser = results.find(r => r.email === 'brand@influencerflow.com' && r.success);
    if (brandUser) {
      await supabase
        .from('brand_profiles')
        .upsert({
          id: brandUser.userId,
          user_id: brandUser.userId,
          company_name: 'Test Brand Co.',
          industry: 'Technology',
          website: 'https://testbrand.com',
          description: 'A test brand for demonstrating the InfluencerFlow platform capabilities.',
          logo_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop',
          company_size: '50-200',
          location: 'San Francisco, CA',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    // Create creator profile for creator user
    const creatorUser = results.find(r => r.email === 'creator@influencerflow.com' && r.success);
    if (creatorUser) {
      await supabase
        .from('creator_profiles')
        .upsert({
          id: creatorUser.userId,
          user_id: creatorUser.userId,
          display_name: 'Test Creator',
          bio: 'Professional content creator specializing in tech reviews and lifestyle content.',
          niche: ['Technology', 'Lifestyle', 'Reviews'],
          location: 'Los Angeles, CA',
          languages: ['English', 'Spanish'],
          instagram_handle: 'testcreator',
          youtube_channel: 'TestCreatorChannel',
          tiktok_handle: 'testcreator',
          twitter_handle: 'testcreator',
          follower_count_instagram: 125000,
          follower_count_youtube: 85000,
          follower_count_tiktok: 45000,
          follower_count_twitter: 25000,
          engagement_rate: 6.8,
          avg_views: 15000,
          rate_per_post: 750,
          rate_per_video: 1200,
          verified: true,
          portfolio_urls: ['https://portfolio.testcreator.com'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test users created successfully',
      results 
    });

  } catch (error) {
    console.error('Error creating test users:', error);
    return NextResponse.json(
      { error: 'Failed to create test users' },
      { status: 500 }
    );
  }
} 