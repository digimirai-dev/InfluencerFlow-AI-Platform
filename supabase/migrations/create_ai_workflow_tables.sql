-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- CORE ENTITIES
-- ==========================================

-- Enhanced campaigns table with AI workflow fields
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    objective TEXT NOT NULL,
    niche TEXT[] NOT NULL, -- Array of niches for semantic matching
    tags TEXT[] NOT NULL, -- Tags for filtering
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    target_audience JSONB, -- Demographics, interests, etc.
    requirements TEXT[],
    deliverables TEXT[],
    timeline_start DATE,
    timeline_end DATE,
    
    -- AI Workflow Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ai_processing', 'creators_suggested', 'outreach_active', 'negotiating', 'contracts_pending', 'active', 'completed', 'cancelled')),
    ai_processing_stage TEXT DEFAULT 'pending' CHECK (ai_processing_stage IN ('pending', 'finding_creators', 'sending_outreach', 'monitoring_responses', 'negotiating', 'generating_contracts', 'processing_payments', 'completed')),
    
    -- AI Embeddings for semantic matching
    description_embedding VECTOR(1536), -- OpenAI ada-002 embeddings
    niche_embedding VECTOR(1536),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced creators table with AI matching data
CREATE TABLE creators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    handle TEXT UNIQUE NOT NULL,
    bio TEXT,
    niche TEXT[] NOT NULL,
    tags TEXT[] NOT NULL,
    follower_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0,
    avg_views INTEGER DEFAULT 0,
    location TEXT,
    languages TEXT[] DEFAULT ARRAY['english'],
    
    -- Contact Information for Multi-channel Outreach
    email TEXT,
    phone TEXT,
    preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'in_app', 'whatsapp')),
    
    -- AI Performance Metrics
    match_score DECIMAL(5,2) DEFAULT 0, -- Overall AI match score
    response_rate DECIMAL(5,2) DEFAULT 0, -- Historical response rate
    collaboration_success_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Embeddings for semantic matching
    bio_embedding VECTOR(1536),
    niche_embedding VECTOR(1536),
    
    -- Availability and Preferences
    available BOOLEAN DEFAULT true,
    min_budget DECIMAL(10,2),
    max_projects_per_month INTEGER DEFAULT 5,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- AI WORKFLOW TABLES
-- ==========================================

-- AI Creator Recommendations
CREATE TABLE creator_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    
    -- AI Matching Scores
    semantic_similarity_score DECIMAL(5,2) NOT NULL, -- Embedding similarity
    engagement_score DECIMAL(5,2) NOT NULL, -- Based on followers, engagement
    historical_performance_score DECIMAL(5,2) NOT NULL, -- Past collaboration success
    budget_compatibility_score DECIMAL(5,2) NOT NULL, -- Budget alignment
    overall_confidence_score DECIMAL(5,2) NOT NULL, -- Weighted final score
    
    -- AI Reasoning
    match_reasoning TEXT, -- GPT-4 explanation of why this creator matches
    recommended_budget DECIMAL(10,2),
    estimated_deliverables TEXT[],
    
    status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'approved', 'rejected', 'contacted', 'responded', 'negotiating', 'agreed', 'contracted')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Multi-channel Communication Log
CREATE TABLE communication_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    
    channel TEXT NOT NULL CHECK (channel IN ('email', 'phone', 'in_app', 'whatsapp', 'sms')),
    direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
    message_type TEXT NOT NULL CHECK (message_type IN ('initial_outreach', 'follow_up', 'negotiation', 'contract', 'payment', 'general')),
    
    -- Message Content
    subject TEXT, -- For emails
    content TEXT NOT NULL,
    ai_generated BOOLEAN DEFAULT false,
    
    -- External References
    external_id TEXT, -- Gmail message ID, Twilio SID, etc.
    thread_id TEXT, -- For tracking conversations
    
    -- AI Analysis
    sentiment_score DECIMAL(3,2), -- -1 to 1 sentiment analysis
    intent TEXT, -- GPT-4 classified intent (interested, declined, negotiating, etc.)
    key_points TEXT[], -- Extracted key points from message
    
    -- Status
    delivered BOOLEAN DEFAULT false,
    read BOOLEAN DEFAULT false,
    responded BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Negotiation Tracking
CREATE TABLE negotiations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    
    -- Current Terms
    current_budget DECIMAL(10,2),
    current_deliverables TEXT[],
    current_timeline DATE,
    additional_terms JSONB,
    
    -- Negotiation History
    rounds INTEGER DEFAULT 0,
    brand_concessions TEXT[],
    creator_concessions TEXT[],
    
    -- AI Analysis
    negotiation_summary TEXT, -- GPT-4 generated summary
    predicted_outcome TEXT CHECK (predicted_outcome IN ('likely_to_agree', 'needs_more_negotiation', 'likely_to_decline')),
    confidence_score DECIMAL(5,2),
    
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'agreed', 'failed', 'stalled')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Smart Contracts
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    
    -- Contract Details
    contract_number TEXT UNIQUE NOT NULL,
    final_budget DECIMAL(10,2) NOT NULL,
    final_deliverables TEXT[] NOT NULL,
    final_timeline DATE NOT NULL,
    terms_and_conditions TEXT NOT NULL,
    
    -- AI Generated Content
    ai_generated_clauses TEXT[], -- GPT-4 generated legal clauses
    risk_assessment JSONB, -- AI analysis of contract risks
    
    -- Document Management
    contract_pdf_url TEXT, -- Supabase Storage URL
    docusign_envelope_id TEXT, -- DocuSign integration
    
    -- Signatures
    brand_signed BOOLEAN DEFAULT false,
    creator_signed BOOLEAN DEFAULT false,
    brand_signed_at TIMESTAMP WITH TIME ZONE,
    creator_signed_at TIMESTAMP WITH TIME ZONE,
    
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent_for_signature', 'partially_signed', 'fully_signed', 'cancelled')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Tracking
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    
    -- Payment Details
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'razorpay', 'bank_transfer', 'paypal')),
    
    -- External References
    stripe_payment_intent_id TEXT,
    razorpay_payment_id TEXT,
    transaction_id TEXT,
    
    -- Payment Schedule
    payment_type TEXT DEFAULT 'full' CHECK (payment_type IN ('full', 'milestone', 'partial')),
    milestone_description TEXT,
    due_date DATE,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    
    -- Receipt Management
    receipt_url TEXT, -- PDF receipt stored in Supabase Storage
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Final Reports
CREATE TABLE campaign_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- Report Content
    executive_summary TEXT NOT NULL,
    creator_performance_analysis JSONB NOT NULL,
    communication_summary JSONB NOT NULL,
    financial_summary JSONB NOT NULL,
    deliverables_summary JSONB NOT NULL,
    
    -- AI Insights
    ai_insights TEXT[], -- GPT-4 generated insights
    recommendations_for_future TEXT[],
    success_score DECIMAL(5,2), -- AI calculated success score
    
    -- Document Management
    report_pdf_url TEXT, -- Generated PDF report
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- AI WORKFLOW ORCHESTRATION
-- ==========================================

-- Background Task Queue
CREATE TABLE workflow_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_type TEXT NOT NULL CHECK (task_type IN (
        'find_creators', 'send_outreach', 'monitor_responses', 
        'analyze_response', 'negotiate', 'generate_contract', 
        'process_payment', 'generate_report'
    )),
    
    -- Task Context
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES creators(id),
    priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
    
    -- Task Data
    input_data JSONB NOT NULL,
    output_data JSONB,
    error_message TEXT,
    
    -- Execution
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Vector similarity search indexes
CREATE INDEX idx_campaigns_description_embedding ON campaigns USING ivfflat (description_embedding vector_cosine_ops);
CREATE INDEX idx_campaigns_niche_embedding ON campaigns USING ivfflat (niche_embedding vector_cosine_ops);
CREATE INDEX idx_creators_bio_embedding ON creators USING ivfflat (bio_embedding vector_cosine_ops);
CREATE INDEX idx_creators_niche_embedding ON creators USING ivfflat (niche_embedding vector_cosine_ops);

-- Regular indexes for common queries
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_ai_processing_stage ON campaigns(ai_processing_stage);
CREATE INDEX idx_creator_recommendations_campaign_id ON creator_recommendations(campaign_id);
CREATE INDEX idx_creator_recommendations_confidence_score ON creator_recommendations(overall_confidence_score DESC);
CREATE INDEX idx_communication_log_campaign_creator ON communication_log(campaign_id, creator_id);
CREATE INDEX idx_communication_log_channel ON communication_log(channel);
CREATE INDEX idx_workflow_tasks_status_priority ON workflow_tasks(status, priority);
CREATE INDEX idx_workflow_tasks_scheduled_for ON workflow_tasks(scheduled_for);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_reports ENABLE ROW LEVEL SECURITY;

-- Brands can only access their own campaigns
CREATE POLICY "Brands can access their campaigns" ON campaigns
    FOR ALL USING (brand_id = auth.uid());

-- Creators can access campaigns they're recommended for
CREATE POLICY "Creators can access recommended campaigns" ON campaigns
    FOR SELECT USING (
        id IN (
            SELECT campaign_id FROM creator_recommendations 
            WHERE creator_id IN (
                SELECT id FROM creators WHERE user_id = auth.uid()
            )
        )
    );

-- Similar policies for other tables...
CREATE POLICY "Users can access their creator profile" ON creators
    FOR ALL USING (user_id = auth.uid());

-- ==========================================
-- TRIGGERS FOR AUTOMATION
-- ==========================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON creators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_negotiations_updated_at BEFORE UPDATE ON negotiations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 