# 🤖 InfluencerFlow AI Platform

## Complete AI-Driven Influencer-Brand Collaboration Workflow

An intelligent system that automates the entire influencer marketing workflow from campaign creation to final report generation using advanced AI and multi-channel outreach.

## 🧠 AI Workflow Overview

When a brand creates a campaign, the system automatically:

1. **🎯 AI Creator Matching** - Uses OpenAI embeddings + pgvector for semantic creator matching
2. **📧 Multi-Channel Outreach** - Contacts creators via email, phone, SMS, WhatsApp, and in-app messaging
3. **🤝 Smart Negotiation** - GPT-4 powered response analysis and automated negotiation
4. **📄 Contract Generation** - AI-generated contracts with risk assessment and DocuSign integration
5. **💳 Payment Processing** - Automated payments via Stripe/Razorpay with receipt generation
6. **📊 Report Generation** - Comprehensive AI-powered campaign analytics and insights

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     InfluencerFlow AI Platform                  │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js 15 + React 19)                              │
│  ├── Dashboard & Campaign Management                           │
│  ├── Real-time Chat & Notifications                           │
│  └── Analytics & Reporting UI                                 │
├─────────────────────────────────────────────────────────────────┤
│  Backend APIs (Next.js API Routes)                             │
│  ├── Authentication & Authorization                            │
│  ├── Campaign & Creator Management                             │
│  ├── AI Content Generation                                     │
│  └── Payment & Contract Processing                             │
├─────────────────────────────────────────────────────────────────┤
│  AI & Automation Layer                                         │
│  ├── OpenAI GPT-4.1 (Azure)                                   │
│  ├── Semantic Creator Matching (pgvector)                     │
│  ├── Multi-Channel Outreach Engine                            │
│  └── Smart Response Analysis                                   │
├─────────────────────────────────────────────────────────────────┤
│  External Integrations                                         │
│  ├── Gmail API (Email outreach)                               │
│  ├── Twilio (SMS/Voice calls)                                 │
│  ├── ElevenLabs (Voice generation)                            │
│  ├── WhatsApp Cloud API                                       │
│  ├── Stripe/Razorpay (Payments)                               │
│  └── DocuSign (Contract signatures)                           │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                    │
│  ├── Supabase PostgreSQL                                      │
│  ├── Supabase Auth                                            │
│  ├── Supabase Storage                                         │
│  ├── Supabase Realtime                                        │
│  └── Supabase Edge Functions                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Azure OpenAI access (GPT-4.1 deployed)
- API keys for external services (see Environment Variables)

### Installation

1. **Clone and Install**
```bash
git clone https://github.com/your-repo/influencerflow-ai-platform.git
cd influencerflow-ai-platform
npm install
```

2. **Environment Setup**
```bash
cp env.example .env.local
# Configure all environment variables (see Environment Variables section)
```

3. **Database Setup**
```bash
# Run database migrations
npx supabase migration up

# Generate TypeScript types
npm run db:generate

# Seed initial data
npm run db:seed
```

4. **Start Development Server**
```bash
npm run dev
```

## 🔧 Environment Variables

### Core Configuration
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Azure OpenAI (GPT-4.1)
OPENAI_API_KEY=your-azure-openai-key
OPENAI_BASE_URL=https://your-resource.openai.azure.com/
OPENAI_MODEL=gpt-4.1
```

### Communication APIs
```env
# Gmail API
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_ACCESS_TOKEN=your-gmail-access-token

# Twilio
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token

# ElevenLabs
ELEVENLABS_API_KEY=your-elevenlabs-api-key

# WhatsApp
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
```

### Payment Processing
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

## 🎯 Key Features

### 1. AI-Powered Creator Matching
- **Semantic Similarity**: Uses OpenAI embeddings to match creators by niche, content style, and audience
- **Performance Scoring**: Advanced algorithm considering engagement rates, follower quality, and brand alignment
- **Geographic Targeting**: Location-based creator recommendations
- **Confidence Scores**: AI-generated match confidence percentages

### 2. Multi-Channel Outreach Engine
- **Email**: Personalized emails via Gmail API with tracking
- **Voice Calls**: AI-generated voice messages using ElevenLabs + Twilio
- **SMS**: Smart SMS campaigns with response tracking
- **WhatsApp**: Business messaging with media support
- **In-App**: Real-time chat via Supabase Realtime

### 3. Smart Negotiation System
- **Intent Recognition**: GPT-4 powered analysis of creator responses
- **Automated Responses**: Context-aware reply generation
- **Terms Adjustment**: Dynamic budget and deliverable negotiation
- **Escalation Logic**: Human handoff for complex negotiations

### 4. Contract & Payment Automation
- **AI Contract Generation**: Custom contracts with legal clause optimization
- **Risk Assessment**: Automated contract risk analysis
- **Digital Signatures**: DocuSign integration for e-signatures
- **Payment Processing**: Multi-currency support with Stripe/Razorpay
- **Receipt Generation**: Automated PDF receipts and financial tracking

### 5. Analytics & Reporting
- **Real-time Performance**: Live campaign metrics and creator tracking
- **AI Insights**: GPT-4 generated campaign analysis and recommendations
- **ROI Calculation**: Comprehensive financial performance tracking
- **Predictive Analytics**: Future performance predictions based on historical data

## 📁 Project Structure

```
influencerflow-ai-platform/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── ai/                   # AI content generation
│   │   ├── campaigns/            # Campaign management
│   │   ├── creators/             # Creator operations
│   │   ├── contracts/            # Contract generation
│   │   ├── payments/             # Payment processing
│   │   └── webhooks/             # External service webhooks
│   ├── dashboard/                # Dashboard pages
│   │   ├── campaigns/            # Campaign management UI
│   │   ├── creators/             # Creator discovery UI
│   │   ├── analytics/            # Analytics dashboard
│   │   └── contracts/            # Contract management
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Base UI components
│   ├── dashboard/                # Dashboard-specific components
│   ├── campaigns/                # Campaign components
│   └── providers/                # Context providers
├── lib/                          # Utility libraries
│   ├── ai-outreach/              # Multi-channel outreach system
│   ├── ai-prompts/               # GPT-4 prompt templates
│   ├── contract-payment/         # Contract & payment processing
│   ├── reports/                  # Campaign analytics
│   ├── api-integrations/         # External API integrations
│   └── openai.ts                 # OpenAI client
├── supabase/                     # Supabase configuration
│   ├── migrations/               # Database migrations
│   └── functions/                # Edge functions
├── types/                        # TypeScript type definitions
├── hooks/                        # Custom React hooks
└── env.example                   # Environment variables template
```

## 🔄 Workflow Implementation

### 1. Campaign Creation Trigger

```typescript
// Campaign created → Trigger AI workflow
POST /api/campaigns
```

**Supabase Edge Function**: `campaign-created`
- Analyzes campaign requirements
- Triggers AI creator matching
- Initiates outreach sequence

### 2. AI Creator Matching

```typescript
// Semantic similarity matching
POST /api/ai/creator-matching
```

**Features**:
- OpenAI embeddings for content analysis
- pgvector similarity search
- Multi-factor scoring algorithm
- Confidence-based recommendations

### 3. Multi-Channel Outreach

```typescript
// Execute outreach across all channels
POST /api/outreach/execute
```

**Channels**:
- **Email**: Gmail API with personalized content
- **Phone**: ElevenLabs voice generation + Twilio calls
- **SMS**: Twilio messaging with response tracking
- **WhatsApp**: Business messaging with rich media
- **In-App**: Supabase Realtime notifications

### 4. Response Analysis & Negotiation

```typescript
// Analyze creator responses
POST /api/ai/analyze-response
```

**GPT-4 Capabilities**:
- Sentiment analysis
- Intent recognition
- Automated response generation
- Terms negotiation logic

### 5. Contract Generation

```typescript
// Generate AI-powered contracts
POST /api/contracts/generate
```

**Features**:
- Custom clause generation
- Risk assessment
- PDF generation with signatures
- DocuSign integration

### 6. Payment Processing

```typescript
// Process campaign payments
POST /api/payments/process
```

**Supported Methods**:
- Stripe (Global)
- Razorpay (India)
- Bank transfers
- Automated receipt generation

## 📊 Database Schema

### Core Tables

```sql
-- Campaigns with AI workflow support
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    objective TEXT NOT NULL,
    niche TEXT[] NOT NULL,
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    ai_status TEXT DEFAULT 'pending',
    embedding VECTOR(1536)
);

-- AI-powered creator recommendations
CREATE TABLE creator_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id),
    creator_id UUID REFERENCES creators(id),
    match_score DECIMAL(5,2),
    confidence_score DECIMAL(5,2),
    ai_reasoning TEXT,
    status TEXT DEFAULT 'pending'
);

-- Multi-channel communication log
CREATE TABLE communication_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id),
    creator_id UUID REFERENCES creators(id),
    channel TEXT NOT NULL,
    direction TEXT NOT NULL,
    content TEXT,
    ai_generated BOOLEAN DEFAULT false,
    sentiment_score DECIMAL(3,2),
    response_required BOOLEAN DEFAULT false
);

-- AI-generated contracts
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id),
    creator_id UUID REFERENCES creators(id),
    contract_number TEXT UNIQUE,
    ai_generated_clauses JSONB,
    risk_assessment JSONB,
    contract_pdf_url TEXT,
    docusign_envelope_id TEXT,
    status TEXT DEFAULT 'draft'
);
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### API Testing
```bash
# Test AI content generation
curl -X POST http://localhost:3000/api/ai/generate-content \
  -H "Content-Type: application/json" \
  -d '{"type": "campaign_description", "context": {...}}'

# Test creator matching
curl -X POST http://localhost:3000/api/ai/creator-matching \
  -H "Content-Type: application/json" \
  -d '{"campaign_id": "uuid"}'
```

## 🚀 Deployment

### Vercel Deployment
```bash
npm run build
vercel --prod
```

### Environment Variables Setup
1. Configure all API keys in Vercel dashboard
2. Set up webhook endpoints for external services
3. Configure Supabase Edge Functions
4. Enable real-time subscriptions

### External Service Configuration

#### 1. Gmail API Setup
1. Create Google Cloud Project
2. Enable Gmail API
3. Set up OAuth2 credentials
4. Configure Pub/Sub topic for real-time notifications

#### 2. Twilio Setup
1. Create Twilio account
2. Purchase phone number
3. Configure webhook endpoints
4. Set up TwiML apps for voice calls

#### 3. WhatsApp Business API
1. Set up Meta Business account
2. Configure WhatsApp Business API
3. Create webhook endpoints
4. Verify phone number

#### 4. Payment Processing
1. **Stripe**: Create account, configure webhooks
2. **Razorpay**: Set up account for Indian market
3. Configure payment success/failure webhooks

## 📈 Monitoring & Analytics

### Performance Metrics
- Campaign success rates
- Creator response rates
- Conversion tracking
- AI accuracy metrics
- System performance monitoring

### Logging
- Comprehensive request/response logging
- AI decision tracking
- Error monitoring with Sentry
- Performance metrics with analytics

## 🔐 Security

### Data Protection
- Encrypted sensitive data storage
- Secure API key management
- GDPR compliance for user data
- PCI compliance for payment data

### Authentication
- Supabase Auth with RLS policies
- JWT token validation
- Rate limiting on all endpoints
- Webhook signature verification

## 🆘 Support & Documentation

### API Documentation
- Complete OpenAPI specification
- Interactive API testing interface
- SDKs for popular languages
- Webhook documentation

### Troubleshooting
- Common setup issues
- API rate limiting guidelines
- Error code references
- Performance optimization tips

## 🔄 Future Enhancements

### Planned Features
- **Video Call Integration**: Zoom/Google Meet scheduling
- **Social Media Integration**: Direct posting capabilities
- **Advanced Analytics**: Predictive performance modeling
- **Mobile App**: Native iOS/Android applications
- **API Marketplace**: Third-party integrations
- **White-label Solutions**: Custom branding options

### Scalability Improvements
- Microservices architecture migration
- Message queue implementation
- Global CDN integration
- Multi-region deployment

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Contact

- **Email**: support@influencerflow.ai
- **Discord**: [InfluencerFlow Community](https://discord.gg/influencerflow)
- **Documentation**: [docs.influencerflow.ai](https://docs.influencerflow.ai)
- **API Reference**: [api.influencerflow.ai](https://api.influencerflow.ai)

---

Built with ❤️ using OpenAI GPT-4, Supabase, and Next.js
