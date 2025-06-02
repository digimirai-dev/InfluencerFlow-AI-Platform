-- AI Workflow Enhancement Script
-- Apply essential AI tables for InfluencerFlow

-- AI Creator Recommendations
CREATE TABLE IF NOT EXISTS creator_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- AI Matching Scores
    semantic_similarity_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    engagement_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    historical_performance_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    budget_compatibility_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    overall_confidence_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- AI Reasoning
    match_reasoning TEXT,
    recommended_budget DECIMAL(10,2),
    estimated_deliverables TEXT[],
    
    status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'approved', 'rejected', 'contacted', 'responded', 'negotiating', 'agreed', 'contracted')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Multi-channel Communication Log
CREATE TABLE IF NOT EXISTS communication_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    channel TEXT NOT NULL CHECK (channel IN ('email', 'phone', 'in_app', 'whatsapp', 'sms')),
    direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
    message_type TEXT NOT NULL CHECK (message_type IN ('initial_outreach', 'follow_up', 'negotiation', 'contract', 'payment', 'general')),
    
    -- Message Content
    subject TEXT,
    content TEXT NOT NULL,
    ai_generated BOOLEAN DEFAULT false,
    
    -- External References
    external_id TEXT,
    thread_id TEXT,
    
    -- AI Analysis
    sentiment_score DECIMAL(3,2),
    intent TEXT,
    key_points TEXT[],
    
    -- Status
    delivered BOOLEAN DEFAULT false,
    read BOOLEAN DEFAULT false,
    responded BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Negotiation Tracking
CREATE TABLE IF NOT EXISTS negotiation_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
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
    negotiation_summary TEXT,
    predicted_outcome TEXT CHECK (predicted_outcome IN ('likely_to_agree', 'needs_more_negotiation', 'likely_to_decline')),
    confidence_score DECIMAL(5,2),
    
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'agreed', 'failed', 'stalled')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Smart Contracts
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contract Details
    contract_number TEXT UNIQUE NOT NULL,
    final_budget DECIMAL(10,2) NOT NULL,
    final_deliverables TEXT[] NOT NULL,
    final_timeline DATE NOT NULL,
    terms_and_conditions TEXT NOT NULL,
    
    -- AI Generated Content
    ai_generated_clauses TEXT[],
    risk_assessment JSONB,
    
    -- Document Management
    contract_pdf_url TEXT,
    docusign_envelope_id TEXT,
    
    -- Signatures
    brand_signed BOOLEAN DEFAULT false,
    creator_signed BOOLEAN DEFAULT false,
    brand_signed_at TIMESTAMP WITH TIME ZONE,
    creator_signed_at TIMESTAMP WITH TIME ZONE,
    
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent_for_signature', 'partially_signed', 'fully_signed', 'cancelled')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Payments Table
CREATE TABLE IF NOT EXISTS ai_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    
    -- Payment Details
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_type TEXT DEFAULT 'milestone' CHECK (payment_type IN ('milestone', 'completion', 'bonus')),
    
    -- Payment Processing
    stripe_payment_intent_id TEXT,
    razorpay_payment_id TEXT,
    bank_transfer_ref TEXT,
    
    -- AI Processing
    auto_release BOOLEAN DEFAULT false,
    ai_approval_score DECIMAL(5,2),
    fraud_check_status TEXT DEFAULT 'pending' CHECK (fraud_check_status IN ('pending', 'approved', 'flagged', 'declined')),
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Reports with AI Insights
CREATE TABLE IF NOT EXISTS campaign_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- Performance Metrics
    total_reach INTEGER DEFAULT 0,
    total_engagement INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    roi DECIMAL(10,2) DEFAULT 0,
    
    -- AI Insights
    performance_summary TEXT,
    key_insights TEXT[],
    recommendations TEXT[],
    sentiment_analysis JSONB,
    
    -- Report Generation
    report_type TEXT DEFAULT 'periodic' CHECK (report_type IN ('periodic', 'final', 'milestone')),
    generated_by_ai BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow Automation Tasks
CREATE TABLE IF NOT EXISTS workflow_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Task Details
    task_type TEXT NOT NULL CHECK (task_type IN ('send_outreach', 'follow_up', 'generate_contract', 'process_payment', 'send_report')),
    task_data JSONB NOT NULL,
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    
    -- Priority
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_recommendations_campaign_id ON creator_recommendations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_creator_recommendations_confidence_score ON creator_recommendations(overall_confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_communication_log_campaign_creator ON communication_log(campaign_id, creator_id);
CREATE INDEX IF NOT EXISTS idx_communication_log_channel ON communication_log(channel);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status_priority ON workflow_tasks(status, priority);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_scheduled_for ON workflow_tasks(scheduled_for);

-- Enable RLS on new tables
ALTER TABLE creator_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Campaign participants can view creator recommendations" ON creator_recommendations FOR SELECT USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_id AND campaigns.brand_id = auth.uid())
    OR creator_id = auth.uid()
);

CREATE POLICY "Campaign participants can view communication log" ON communication_log FOR SELECT USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_id AND campaigns.brand_id = auth.uid())
    OR creator_id = auth.uid()
);

CREATE POLICY "Campaign participants can view contracts" ON contracts FOR SELECT USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_id AND campaigns.brand_id = auth.uid())
    OR creator_id = auth.uid()
);

CREATE POLICY "Users can view their payment records" ON ai_payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_id AND campaigns.brand_id = auth.uid())
    OR creator_id = auth.uid()
);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_negotiation_records_updated_at BEFORE UPDATE ON negotiation_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_tasks_updated_at BEFORE UPDATE ON workflow_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 