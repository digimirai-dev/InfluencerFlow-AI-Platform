export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  user_type: 'brand' | 'creator' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface BrandProfile {
  id: string;
  user_id: string;
  company_name: string;
  industry: string;
  website?: string;
  description?: string;
  logo_url?: string;
  company_size?: string;
  location?: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatorProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  niche: string[];
  location?: string;
  languages: string[];
  youtube_channel?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  twitter_handle?: string;
  follower_count_youtube?: number;
  follower_count_instagram?: number;
  follower_count_tiktok?: number;
  follower_count_twitter?: number;
  engagement_rate?: number;
  avg_views?: number;
  rate_per_post?: number;
  rate_per_video?: number;
  verified: boolean;
  portfolio_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  brand_id: string;
  title: string;
  description: string;
  objective: string;
  budget_min: number;
  budget_max: number;
  timeline_start: string;
  timeline_end: string;
  deliverables: string[];
  target_audience: {
    age_range: string;
    gender: string;
    location: string[];
    interests: string[];
  };
  requirements: {
    min_followers: number;
    platforms: string[];
    content_type: string[];
    niche: string[];
  };
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  applications_count: number;
  selected_creators: string[];
  created_at: string;
  updated_at: string;
}

export interface CampaignApplication {
  id: string;
  campaign_id: string;
  creator_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  proposal_message: string;
  proposed_rate: number;
  estimated_deliverables: string[];
  submitted_at: string;
  responded_at?: string;
}

export interface Collaboration {
  id: string;
  campaign_id: string;
  brand_id: string;
  creator_id: string;
  status: 'negotiating' | 'active' | 'content_submitted' | 'revision_requested' | 'completed' | 'cancelled';
  agreed_rate: number;
  deliverables: string[];
  deadline: string;
  contract_url?: string;
  contract_signed_brand: boolean;
  contract_signed_creator: boolean;
  milestones: Milestone[];
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  collaboration_id: string;
  title: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'submitted' | 'approved' | 'paid';
  deliverable_urls: string[];
  feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  collaboration_id?: string;
  campaign_id?: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  message_type: 'text' | 'voice' | 'file' | 'system';
  file_url?: string;
  voice_duration?: number;
  is_ai_generated: boolean;
  read_at?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  collaboration_id: string;
  milestone_id?: string;
  payer_id: string;
  recipient_id: string;
  amount: number;
  currency: string;
  stripe_payment_intent_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  transaction_fee: number;
  created_at: string;
  updated_at: string;
}

export interface FileUpload {
  id: string;
  user_id: string;
  collaboration_id?: string;
  milestone_id?: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  upload_purpose: 'contract' | 'deliverable' | 'portfolio' | 'avatar' | 'logo' | 'other';
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'campaign' | 'collaboration' | 'payment' | 'message' | 'system';
  related_id?: string;
  read: boolean;
  action_url?: string;
  created_at: string;
}

export interface AIPromptLog {
  id: string;
  user_id: string;
  prompt_type: 'outreach' | 'reply' | 'campaign_description' | 'contract' | 'translation';
  input_data: Record<string, any>;
  generated_content: string;
  model_used: string;
  tokens_used: number;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface CampaignFormData {
  title: string;
  description: string;
  objective: string;
  budget_min: number;
  budget_max: number;
  timeline_start: string;
  timeline_end: string;
  deliverables: string[];
  target_audience: {
    age_range: string;
    gender: string;
    location: string[];
    interests: string[];
  };
  requirements: {
    min_followers: number;
    platforms: string[];
    content_type: string[];
    niche: string[];
  };
}

export interface CreatorProfileFormData {
  display_name: string;
  bio: string;
  niche: string[];
  location: string;
  languages: string[];
  youtube_channel: string;
  instagram_handle: string;
  tiktok_handle: string;
  twitter_handle: string;
  rate_per_post: number;
  rate_per_video: number;
  portfolio_urls: string[];
}

export interface BrandProfileFormData {
  company_name: string;
  industry: string;
  website: string;
  description: string;
  company_size: string;
  location: string;
}

// Search and Filter Types
export interface CreatorSearchFilters {
  niche?: string[];
  location?: string[];
  min_followers?: number;
  max_followers?: number;
  platforms?: string[];
  engagement_rate_min?: number;
  engagement_rate_max?: number;
  rate_min?: number;
  rate_max?: number;
  languages?: string[];
  verified_only?: boolean;
}

export interface CampaignSearchFilters {
  budget_min?: number;
  budget_max?: number;
  platforms?: string[];
  niche?: string[];
  location?: string[];
  content_type?: string[];
  status?: string[];
}

// Analytics Types
export interface CampaignAnalytics {
  campaign_id: string;
  total_reach: number;
  total_impressions: number;
  total_engagement: number;
  engagement_rate: number;
  click_through_rate: number;
  conversion_rate: number;
  roi: number;
  cost_per_engagement: number;
  platform_breakdown: Record<string, {
    reach: number;
    impressions: number;
    engagement: number;
  }>;
}

export interface CreatorAnalytics {
  creator_id: string;
  total_campaigns: number;
  total_earnings: number;
  avg_engagement_rate: number;
  completion_rate: number;
  rating: number;
  platform_performance: Record<string, {
    followers: number;
    avg_views: number;
    engagement_rate: number;
  }>;
}

// Social Media API Types
export interface YouTubeChannelData {
  channel_id: string;
  title: string;
  subscriber_count: number;
  video_count: number;
  view_count: number;
  thumbnail_url: string;
  description: string;
}

export interface InstagramProfileData {
  username: string;
  full_name: string;
  follower_count: number;
  following_count: number;
  media_count: number;
  profile_picture_url: string;
  biography: string;
  engagement_rate: number;
}

// AI Types
export interface AIGenerationRequest {
  type: 'outreach' | 'reply' | 'campaign_description' | 'contract';
  context: Record<string, any>;
  tone?: 'professional' | 'casual' | 'friendly' | 'formal';
  language?: string;
}

export interface AIGenerationResponse {
  content: string;
  tokens_used: number;
  model_used: string;
}

export interface VoiceTranscriptionRequest {
  audio_url: string;
  language?: string;
}

export interface VoiceTranscriptionResponse {
  text: string;
  confidence: number;
  duration: number;
}

// Webhook Types
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

// Chat Types
export interface ChatRoom {
  id: string;
  collaboration_id: string;
  participants: string[];
  last_message?: Message;
  unread_count: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface TypingIndicator {
  user_id: string;
  room_id: string;
  is_typing: boolean;
  timestamp: string;
} 