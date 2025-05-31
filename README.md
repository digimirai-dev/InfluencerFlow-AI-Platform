# InfluencerFlow 🚀

The ultimate SaaS platform for influencer marketing collaborations. Connect brands with creators, manage campaigns, and track performance with AI-powered tools.

## 🌟 Features

### For Brands
- **AI Creator Discovery**: Find perfect creators using AI-powered search and recommendations
- **Smart Outreach**: Automate personalized outreach with AI-generated messages
- **Campaign Management**: Create and manage campaigns with detailed briefs and requirements
- **Contract Generation**: Automated contract creation and digital signing
- **Payment Processing**: Secure milestone-based payments through Stripe
- **Performance Analytics**: Track campaign ROI and engagement metrics
- **Real-time Chat**: Communicate with creators in real-time

### For Creators
- **Profile Management**: Showcase your work with portfolio and social media integration
- **Campaign Discovery**: Find relevant campaigns matching your niche and audience
- **AI-Powered Proposals**: Generate compelling proposals with AI assistance
- **Deliverable Management**: Submit and track content deliverables
- **Earnings Tracker**: Monitor payments and earnings across campaigns
- **Voice Notes**: Send voice messages with automatic transcription

### AI Features
- **GPT Integration**: Auto-generate outreach messages, replies, and campaign descriptions
- **Whisper Integration**: Voice-to-text transcription for voice notes
- **ElevenLabs**: AI voice synthesis for voice replies
- **Translation**: Multi-language support for global collaborations
- **Semantic Search**: Find creators using natural language queries

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + ShadCN UI
- **State Management**: Zustand
- **Authentication**: Supabase Auth
- **Charts**: Recharts
- **Notifications**: React Hot Toast

### Backend
- **Platform**: Supabase
- **Database**: PostgreSQL with Row Level Security
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

### AI & APIs
- **OpenAI**: GPT-4 for content generation
- **Whisper**: Voice transcription
- **ElevenLabs**: Voice synthesis
- **Google Translate**: Multi-language support
- **YouTube/Instagram APIs**: Creator data fetching

### Payments & Integrations
- **Stripe**: Payment processing
- **DocuSign**: Contract signing
- **Gmail API**: Email integration

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key
- Stripe account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/influencerflow.git
   cd influencerflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   
   # Add other API keys as needed
   ```

4. **Set up Supabase database**
   ```bash
   # Run the schema.sql file in your Supabase SQL editor
   # Or use the Supabase CLI:
   supabase db reset
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
influencerflow/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── campaigns/         # Campaign management
│   ├── creators/          # Creator discovery
│   ├── chat/              # Real-time chat
│   └── admin/             # Admin panel
├── components/            # Reusable components
│   ├── ui/                # ShadCN UI components
│   ├── forms/             # Form components
│   ├── charts/            # Chart components
│   └── providers/         # Context providers
├── lib/                   # Utility libraries
│   ├── supabase.ts        # Supabase client
│   ├── openai.ts          # OpenAI integration
│   ├── stripe.ts          # Stripe integration
│   └── utils.ts           # Helper functions
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
├── supabase/              # Database schema and migrations
└── public/                # Static assets
```

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Run the SQL schema from `supabase/schema.sql`
3. Set up Row Level Security policies
4. Configure authentication providers (Google, GitHub, etc.)
5. Set up storage buckets for file uploads

### OpenAI Setup
1. Get an API key from OpenAI
2. Configure usage limits and billing
3. Test the integration with the AI features

### Stripe Setup
1. Create a Stripe account
2. Get your API keys (test and live)
3. Set up webhooks for payment events
4. Configure products and pricing

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Configure build settings and environment variables
- **Railway**: Use the provided Dockerfile
- **DigitalOcean**: Deploy using App Platform

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

## 📊 Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts and profiles
- `brand_profiles` - Brand-specific information
- `creator_profiles` - Creator-specific information
- `campaigns` - Campaign details and requirements
- `collaborations` - Active collaborations between brands and creators
- `messages` - Real-time chat messages
- `payments` - Payment transactions and milestones
- `notifications` - User notifications

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- JWT-based authentication with Supabase
- API rate limiting
- Input validation and sanitization
- Secure file upload handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.influencerflow.com](https://docs.influencerflow.com)
- **Discord**: [Join our community](https://discord.gg/influencerflow)
- **Email**: support@influencerflow.com

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] API for third-party integrations
- [ ] White-label solutions
- [ ] Advanced AI features (content generation, trend analysis)

---

Built with ❤️ by the InfluencerFlow team 