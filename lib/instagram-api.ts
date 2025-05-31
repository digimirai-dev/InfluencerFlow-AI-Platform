// Instagram Basic Display API integration
interface InstagramProfile {
  id: string;
  username: string;
  account_type: string;
  media_count: number;
}

interface InstagramMedia {
  id: string;
  media_type: string;
  media_url: string;
  permalink: string;
  timestamp: string;
  caption?: string;
  like_count?: number;
  comments_count?: number;
}

interface InstagramInsights {
  reach: number;
  impressions: number;
  profile_views: number;
  website_clicks: number;
}

export class InstagramAPI {
  private accessToken: string;
  private baseUrl = 'https://graph.instagram.com';

  constructor(accessToken?: string) {
    this.accessToken = accessToken || process.env.INSTAGRAM_ACCESS_TOKEN || '';
  }

  // Get user profile information
  async getProfile(userId: string = 'me'): Promise<InstagramProfile | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${userId}?fields=id,username,account_type,media_count&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Instagram profile:', error);
      return null;
    }
  }

  // Get user's media
  async getMedia(userId: string = 'me', limit: number = 25): Promise<InstagramMedia[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${userId}/media?fields=id,media_type,media_url,permalink,timestamp,caption&limit=${limit}&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching Instagram media:', error);
      return [];
    }
  }

  // Get media insights (requires Instagram Business account)
  async getMediaInsights(mediaId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${mediaId}/insights?metric=engagement,impressions,reach,saved&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching media insights:', error);
      return null;
    }
  }

  // Get account insights (requires Instagram Business account)
  async getAccountInsights(userId: string = 'me', period: string = 'day'): Promise<InstagramInsights | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${userId}/insights?metric=reach,impressions,profile_views,website_clicks&period=${period}&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status}`);
      }

      const data = await response.json();
      const insights: any = {};
      
      data.data?.forEach((metric: any) => {
        insights[metric.name] = metric.values[0]?.value || 0;
      });

      return insights;
    } catch (error) {
      console.error('Error fetching account insights:', error);
      return null;
    }
  }

  // Calculate engagement rate from recent posts
  async calculateEngagementRate(userId: string = 'me'): Promise<number> {
    try {
      const media = await this.getMedia(userId, 12); // Get last 12 posts
      const profile = await this.getProfile(userId);

      if (!media.length || !profile) return 0;

      let totalEngagement = 0;
      let validPosts = 0;

      for (const post of media) {
        const insights = await this.getMediaInsights(post.id);
        if (insights?.data) {
          const engagement = insights.data.find((metric: any) => metric.name === 'engagement');
          if (engagement) {
            totalEngagement += engagement.values[0]?.value || 0;
            validPosts++;
          }
        }
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (validPosts === 0) return 0;

      const avgEngagement = totalEngagement / validPosts;
      const followerCount = profile.media_count; // This would need to be fetched differently for follower count
      
      return followerCount > 0 ? (avgEngagement / followerCount) * 100 : 0;
    } catch (error) {
      console.error('Error calculating engagement rate:', error);
      return 0;
    }
  }

  // Verify if an Instagram username exists and get basic info
  async verifyUsername(username: string): Promise<boolean> {
    try {
      // Note: This requires Instagram Basic Display API or Graph API
      // For now, we'll use a simple check
      const response = await fetch(`https://www.instagram.com/${username}/?__a=1`);
      return response.ok;
    } catch (error) {
      console.error('Error verifying Instagram username:', error);
      return false;
    }
  }

  // Get long-lived access token (for token refresh)
  async getLongLivedToken(shortLivedToken: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/access_token?grant_type=ig_exchange_token&client_secret=${process.env.FACEBOOK_APP_SECRET}&access_token=${shortLivedToken}`
      );

      if (!response.ok) {
        throw new Error(`Token exchange error: ${response.status}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting long-lived token:', error);
      return null;
    }
  }

  // Refresh access token
  async refreshToken(accessToken: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Token refresh error: ${response.status}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }
}

// Export singleton instance
export const instagramAPI = new InstagramAPI(); 