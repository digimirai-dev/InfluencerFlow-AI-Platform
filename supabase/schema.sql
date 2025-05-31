-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types/enums
CREATE TYPE user_type AS ENUM ('brand', 'creator', 'admin');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
CREATE TYPE collaboration_status AS ENUM ('negotiating', 'active', 'content_submitted', 'revision_requested', 'completed', 'cancelled');
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE milestone_status AS ENUM ('pending', 'submitted', 'approved', 'paid');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE message_type AS ENUM ('text', 'voice', 'file', 'system');
CREATE TYPE notification_type AS ENUM ('campaign', 'collaboration', 'payment', 'message', 'system');
CREATE TYPE upload_purpose AS ENUM ('contract', 'deliverable', 'portfolio', 'avatar', 'logo', 'other');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    user_type user_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand profiles
CREATE TABLE brand_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    industry TEXT NOT NULL,
    website TEXT,
    description TEXT,
    logo_url TEXT,
    company_size TEXT,
    location TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Creator profiles
CREATE TABLE creator_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    bio TEXT,
    niche TEXT[] DEFAULT '{}',
    location TEXT,
    languages TEXT[] DEFAULT '{}',
    youtube_channel TEXT,
    instagram_handle TEXT,
    tiktok_handle TEXT,
    twitter_handle TEXT,
    follower_count_youtube INTEGER,
    follower_count_instagram INTEGER,
    follower_count_tiktok INTEGER,
    follower_count_twitter INTEGER,
    engagement_rate DECIMAL(5,2),
    avg_views INTEGER,
    rate_per_post DECIMAL(10,2),
    rate_per_video DECIMAL(10,2),
    verified BOOLEAN DEFAULT FALSE,
    portfolio_urls TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Campaigns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    objective TEXT NOT NULL,
    budget_min DECIMAL(10,2) NOT NULL,
    budget_max DECIMAL(10,2) NOT NULL,
    timeline_start DATE NOT NULL,
    timeline_end DATE NOT NULL,
    deliverables TEXT[] DEFAULT '{}',
    target_audience JSONB NOT NULL DEFAULT '{}',
    requirements JSONB NOT NULL DEFAULT '{}',
    status campaign_status DEFAULT 'draft',
    applications_count INTEGER DEFAULT 0,
    selected_creators UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign applications
CREATE TABLE campaign_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status application_status DEFAULT 'pending',
    proposal_message TEXT NOT NULL,
    proposed_rate DECIMAL(10,2) NOT NULL,
    estimated_deliverables TEXT[] DEFAULT '{}',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(campaign_id, creator_id)
);

-- Collaborations
CREATE TABLE collaborations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status collaboration_status DEFAULT 'negotiating',
    agreed_rate DECIMAL(10,2) NOT NULL,
    deliverables TEXT[] DEFAULT '{}',
    deadline DATE NOT NULL,
    contract_url TEXT,
    contract_signed_brand BOOLEAN DEFAULT FALSE,
    contract_signed_creator BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milestones
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collaboration_id UUID NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status milestone_status DEFAULT 'pending',
    deliverable_urls TEXT[] DEFAULT '{}',
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collaboration_id UUID REFERENCES collaborations(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type message_type DEFAULT 'text',
    file_url TEXT,
    voice_duration INTEGER,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collaboration_id UUID NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
    payer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    stripe_payment_intent_id TEXT,
    status payment_status DEFAULT 'pending',
    payment_method TEXT,
    transaction_fee DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File uploads
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    collaboration_id UUID REFERENCES collaborations(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    upload_purpose upload_purpose NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    related_id UUID,
    read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI prompt logs
CREATE TABLE ai_prompt_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt_type TEXT NOT NULL,
    input_data JSONB NOT NULL DEFAULT '{}',
    generated_content TEXT NOT NULL,
    model_used TEXT NOT NULL,
    tokens_used INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat rooms
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collaboration_id UUID NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
    participants UUID[] NOT NULL,
    unread_count JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collaboration_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_brand_profiles_user_id ON brand_profiles(user_id);
CREATE INDEX idx_creator_profiles_user_id ON creator_profiles(user_id);
CREATE INDEX idx_creator_profiles_niche ON creator_profiles USING GIN(niche);
CREATE INDEX idx_creator_profiles_verified ON creator_profiles(verified);
CREATE INDEX idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_timeline ON campaigns(timeline_start, timeline_end);
CREATE INDEX idx_campaign_applications_campaign_id ON campaign_applications(campaign_id);
CREATE INDEX idx_campaign_applications_creator_id ON campaign_applications(creator_id);
CREATE INDEX idx_campaign_applications_status ON campaign_applications(status);
CREATE INDEX idx_collaborations_campaign_id ON collaborations(campaign_id);
CREATE INDEX idx_collaborations_brand_id ON collaborations(brand_id);
CREATE INDEX idx_collaborations_creator_id ON collaborations(creator_id);
CREATE INDEX idx_collaborations_status ON collaborations(status);
CREATE INDEX idx_milestones_collaboration_id ON milestones(collaboration_id);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_messages_collaboration_id ON messages(collaboration_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_payments_collaboration_id ON payments(collaboration_id);
CREATE INDEX idx_payments_payer_id ON payments(payer_id);
CREATE INDEX idx_payments_recipient_id ON payments(recipient_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX idx_file_uploads_collaboration_id ON file_uploads(collaboration_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_ai_prompt_logs_user_id ON ai_prompt_logs(user_id);
CREATE INDEX idx_chat_rooms_collaboration_id ON chat_rooms(collaboration_id);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brand_profiles_updated_at BEFORE UPDATE ON brand_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creator_profiles_updated_at BEFORE UPDATE ON creator_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collaborations_updated_at BEFORE UPDATE ON collaborations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Brand profiles policies
CREATE POLICY "Anyone can view brand profiles" ON brand_profiles FOR SELECT USING (true);
CREATE POLICY "Brands can manage their own profile" ON brand_profiles FOR ALL USING (auth.uid() = user_id);

-- Creator profiles policies
CREATE POLICY "Anyone can view creator profiles" ON creator_profiles FOR SELECT USING (true);
CREATE POLICY "Creators can manage their own profile" ON creator_profiles FOR ALL USING (auth.uid() = user_id);

-- Campaigns policies
CREATE POLICY "Anyone can view active campaigns" ON campaigns FOR SELECT USING (status = 'active');
CREATE POLICY "Brands can manage their own campaigns" ON campaigns FOR ALL USING (auth.uid() = brand_id);

-- Campaign applications policies
CREATE POLICY "Brands can view applications for their campaigns" ON campaign_applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_id AND campaigns.brand_id = auth.uid())
);
CREATE POLICY "Creators can view their own applications" ON campaign_applications FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Creators can create applications" ON campaign_applications FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their own applications" ON campaign_applications FOR UPDATE USING (auth.uid() = creator_id);

-- Collaborations policies
CREATE POLICY "Collaboration participants can view" ON collaborations FOR SELECT USING (
    auth.uid() = brand_id OR auth.uid() = creator_id
);
CREATE POLICY "Brands can manage collaborations" ON collaborations FOR ALL USING (auth.uid() = brand_id);

-- Messages policies
CREATE POLICY "Message participants can view" ON messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- File uploads policies
CREATE POLICY "Users can view their own files" ON file_uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload files" ON file_uploads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name, avatar_url, user_type)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'creator')::user_type
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 