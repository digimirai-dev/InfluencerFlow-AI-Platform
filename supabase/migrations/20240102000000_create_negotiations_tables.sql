-- Create negotiations table
CREATE TABLE IF NOT EXISTS negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  communication_id UUID REFERENCES communication_log(id), -- Link to the creator's response
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'agreed', 'declined', 'expired')),
  
  -- Original terms (from AI analysis of creator response)
  creator_terms JSONB NOT NULL DEFAULT '{}',
  
  -- Current negotiated terms
  current_terms JSONB NOT NULL DEFAULT '{}',
  
  -- Negotiation history (array of rounds)
  negotiation_history JSONB[] DEFAULT ARRAY[]::JSONB[],
  
  -- AI analysis of the creator's response
  ai_analysis JSONB DEFAULT '{}',
  
  -- Negotiation strategy settings
  strategy JSONB DEFAULT '{}',
  
  -- Auto-approval settings
  auto_approve_threshold DECIMAL DEFAULT 0.1, -- 10% variance
  max_rounds INTEGER DEFAULT 3,
  current_round INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Unique constraint to prevent duplicate negotiations
  UNIQUE(campaign_id, creator_id)
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID REFERENCES negotiations(id) ON DELETE CASCADE,
  
  -- Contract details
  contract_type TEXT NOT NULL DEFAULT 'influencer_partnership',
  template_version TEXT DEFAULT 'v1.0',
  
  -- Generated contract content
  contract_terms JSONB NOT NULL DEFAULT '{}',
  generated_contract TEXT, -- Full contract HTML/PDF content
  
  -- Contract status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed_creator', 'signed_brand', 'executed', 'cancelled')),
  
  -- Signature data
  signature_data JSONB DEFAULT '{}',
  creator_signed_at TIMESTAMP WITH TIME ZONE,
  brand_signed_at TIMESTAMP WITH TIME ZONE,
  
  -- External service IDs (DocuSign, HelloSign, etc.)
  external_contract_id TEXT,
  external_service TEXT,
  
  -- Legal and compliance
  legal_review_required BOOLEAN DEFAULT FALSE,
  legal_reviewed_at TIMESTAMP WITH TIME ZONE,
  legal_reviewer_id UUID REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create negotiation rounds table for detailed tracking
CREATE TABLE IF NOT EXISTS negotiation_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID REFERENCES negotiations(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  
  -- Who made this round (brand or creator)
  initiated_by TEXT NOT NULL CHECK (initiated_by IN ('brand', 'creator', 'ai')),
  
  -- Terms proposed in this round
  proposed_terms JSONB NOT NULL DEFAULT '{}',
  
  -- AI analysis of this round
  ai_analysis JSONB DEFAULT '{}',
  
  -- Response details
  response_type TEXT CHECK (response_type IN ('accept', 'counter', 'decline')),
  response_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(negotiation_id, round_number)
);

-- Create indexes for performance
CREATE INDEX idx_negotiations_campaign_id ON negotiations(campaign_id);
CREATE INDEX idx_negotiations_creator_id ON negotiations(creator_id);
CREATE INDEX idx_negotiations_status ON negotiations(status);
CREATE INDEX idx_contracts_negotiation_id ON contracts(negotiation_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_negotiation_rounds_negotiation_id ON negotiation_rounds(negotiation_id);

-- Create updated_at trigger for negotiations
CREATE OR REPLACE FUNCTION update_negotiations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_negotiations_updated_at
  BEFORE UPDATE ON negotiations
  FOR EACH ROW
  EXECUTE FUNCTION update_negotiations_updated_at();

-- Create updated_at trigger for contracts
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contracts_updated_at();

-- RPC function to create a new negotiation from a communication
CREATE OR REPLACE FUNCTION create_negotiation_from_response(
  p_communication_id UUID,
  p_ai_analysis JSONB,
  p_creator_terms JSONB,
  p_strategy JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_negotiation_id UUID;
  v_campaign_id UUID;
  v_creator_id UUID;
BEGIN
  -- Get campaign and creator from communication
  SELECT campaign_id, creator_id INTO v_campaign_id, v_creator_id
  FROM communication_log
  WHERE id = p_communication_id;

  -- Insert negotiation
  INSERT INTO negotiations (
    campaign_id,
    creator_id,
    communication_id,
    creator_terms,
    current_terms,
    ai_analysis,
    strategy
  ) VALUES (
    v_campaign_id,
    v_creator_id,
    p_communication_id,
    p_creator_terms,
    p_creator_terms, -- Start with creator's terms
    p_ai_analysis,
    p_strategy
  ) RETURNING id INTO v_negotiation_id;

  -- Create first round entry
  INSERT INTO negotiation_rounds (
    negotiation_id,
    round_number,
    initiated_by,
    proposed_terms,
    ai_analysis
  ) VALUES (
    v_negotiation_id,
    1,
    'creator',
    p_creator_terms,
    p_ai_analysis
  );

  RETURN v_negotiation_id;
END;
$$ LANGUAGE plpgsql;

-- RPC function to add negotiation round
CREATE OR REPLACE FUNCTION add_negotiation_round(
  p_negotiation_id UUID,
  p_initiated_by TEXT,
  p_proposed_terms JSONB,
  p_ai_analysis JSONB DEFAULT '{}',
  p_response_type TEXT DEFAULT NULL,
  p_response_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_round_id UUID;
  v_next_round INTEGER;
BEGIN
  -- Get next round number
  SELECT COALESCE(MAX(round_number), 0) + 1 INTO v_next_round
  FROM negotiation_rounds
  WHERE negotiation_id = p_negotiation_id;

  -- Insert round
  INSERT INTO negotiation_rounds (
    negotiation_id,
    round_number,
    initiated_by,
    proposed_terms,
    ai_analysis,
    response_type,
    response_message
  ) VALUES (
    p_negotiation_id,
    v_next_round,
    p_initiated_by,
    p_proposed_terms,
    p_ai_analysis,
    p_response_type,
    p_response_message
  ) RETURNING id INTO v_round_id;

  -- Update negotiation current terms and round
  UPDATE negotiations SET
    current_terms = p_proposed_terms,
    current_round = v_next_round,
    updated_at = NOW()
  WHERE id = p_negotiation_id;

  RETURN v_round_id;
END;
$$ LANGUAGE plpgsql; 