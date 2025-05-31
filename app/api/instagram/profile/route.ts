import { NextRequest, NextResponse } from 'next/server';
import { instagramAPI } from '@/lib/instagram-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'me';
    const username = searchParams.get('username');

    // If username is provided, verify it first
    if (username) {
      const isValid = await instagramAPI.verifyUsername(username);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Instagram username not found' },
          { status: 404 }
        );
      }
    }

    // Get profile data
    const profile = await instagramAPI.getProfile(userId);
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Failed to fetch Instagram profile' },
        { status: 500 }
      );
    }

    // Get recent media for additional insights
    const media = await instagramAPI.getMedia(userId, 12);
    
    // Calculate engagement rate
    const engagementRate = await instagramAPI.calculateEngagementRate(userId);

    return NextResponse.json({
      profile,
      media: media.slice(0, 6), // Return only first 6 posts
      engagement_rate: engagementRate,
      total_posts: media.length
    });

  } catch (error) {
    console.error('Instagram API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, accessToken } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Create new Instagram API instance with provided token
    const customAPI = accessToken ? new (await import('@/lib/instagram-api')).InstagramAPI(accessToken) : instagramAPI;

    // Verify username exists
    const isValid = await customAPI.verifyUsername(username);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Instagram username not found' },
        { status: 404 }
      );
    }

    // For public profiles, we can only get limited data
    // This would require the user to connect their Instagram account
    return NextResponse.json({
      username,
      verified: true,
      message: 'Username verified. User needs to connect Instagram account for full data.'
    });

  } catch (error) {
    console.error('Instagram verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify Instagram account' },
      { status: 500 }
    );
  }
} 