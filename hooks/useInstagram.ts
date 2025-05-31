import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface InstagramProfile {
  id: string;
  username: string;
  account_type: string;
  media_count: number;
}

interface InstagramData {
  profile: InstagramProfile;
  media: any[];
  engagement_rate: number;
  total_posts: number;
}

interface UseInstagramReturn {
  data: InstagramData | null;
  loading: boolean;
  error: string | null;
  fetchProfile: (userId?: string) => Promise<void>;
  verifyUsername: (username: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

export function useInstagram(): UseInstagramReturn {
  const [data, setData] = useState<InstagramData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUserId, setLastUserId] = useState<string>('me');

  const fetchProfile = useCallback(async (userId: string = 'me') => {
    setLoading(true);
    setError(null);
    setLastUserId(userId);

    try {
      const response = await fetch(`/api/instagram/profile?userId=${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Instagram profile');
      }

      const profileData = await response.json();
      setData(profileData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Instagram API Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyUsername = useCallback(async (username: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/instagram/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to verify Instagram username');
        return false;
      }

      const result = await response.json();
      if (result.verified) {
        toast.success('Instagram username verified!');
        return true;
      }

      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`Verification Error: ${errorMessage}`);
      return false;
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (lastUserId) {
      await fetchProfile(lastUserId);
    }
  }, [fetchProfile, lastUserId]);

  return {
    data,
    loading,
    error,
    fetchProfile,
    verifyUsername,
    refreshData,
  };
}

// Hook for Instagram insights (requires business account)
export function useInstagramInsights() {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async (userId: string = 'me', period: string = 'day') => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/instagram/insights?userId=${userId}&period=${period}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Instagram insights');
      }

      const insightsData = await response.json();
      setInsights(insightsData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Instagram Insights Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    insights,
    loading,
    error,
    fetchInsights,
  };
}

// Hook for connecting Instagram account
export function useInstagramConnect() {
  const [connecting, setConnecting] = useState(false);

  const connectInstagram = useCallback(async () => {
    setConnecting(true);
    
    try {
      // Redirect to Instagram OAuth
      const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/instagram/callback`);
      const scope = 'user_profile,user_media';
      
      const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
      
      window.location.href = authUrl;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect Instagram';
      toast.error(errorMessage);
      setConnecting(false);
    }
  }, []);

  return {
    connecting,
    connectInstagram,
  };
} 