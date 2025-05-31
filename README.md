# InfluencerFlow SaaS Platform

A comprehensive full-stack SaaS platform that connects social media influencers with brands for seamless collaborations, featuring AI-powered creator discovery, automated outreach, and campaign management.

## 🚀 Features

### For Brands
- **Creator Discovery**: AI-powered search and filtering to find the perfect influencers
- **Campaign Management**: Create, manage, and track marketing campaigns
- **Automated Outreach**: Streamlined communication with creators
- **Analytics Dashboard**: Real-time insights and performance metrics
- **Payment Processing**: Secure payment handling and invoicing

### For Creators
- **Opportunity Discovery**: Browse and apply to relevant brand campaigns
- **Portfolio Management**: Showcase your content and engagement metrics
- **Application Tracking**: Monitor campaign applications and status
- **Earnings Dashboard**: Track payments and financial performance
- **Direct Messaging**: Communicate directly with brands

### Platform Features
- **Real-time Messaging**: Built-in chat system for brand-creator communication
- **Instagram Integration**: Connect and sync Instagram profiles and metrics
- **Advanced Filtering**: Search by niche, engagement rate, follower count, and more
- **Secure Authentication**: Supabase-powered user management
- **Responsive Design**: Modern UI that works on all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **UI Components**: ShadCN UI
- **Styling**: Tailwind CSS
- **API Integration**: Instagram Basic Display API

## 📊 Database Schema

The platform includes a comprehensive database schema with:
- User management (brands and creators)
- Campaign and collaboration tracking
- Messaging system
- Payment processing
- File uploads and notifications
- AI prompt logging

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
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
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   ```

4. **Set up the database**
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - The schema includes all tables, RLS policies, and sample data

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Demo

The platform includes a demo mode with mock data for testing:
- Demo brand user with sample campaigns
- Mock creator profiles with realistic metrics
- Sample conversations and applications
- Test payment history

## 🔧 Configuration

### Instagram API Setup
1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com)
2. Add Instagram Basic Display product
3. Configure redirect URIs and permissions
4. Add your credentials to `.env.local`

### Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Run the provided SQL schema
4. Configure RLS policies as needed

## 📈 Key Metrics (Mock Data)

- **13 Active Creators** across diverse niches
- **3 Brand Partners** with active campaigns
- **$70,000** in total campaign budgets
- **160K+** average creator followers
- **5.36%** average engagement rate

## 🎯 Creator Niches Supported

- Lifestyle & Fashion
- Fitness & Wellness
- Beauty & Skincare
- Technology & Gaming
- Travel & Adventure
- Food & Cooking
- Art & Design
- Music & Entertainment
- Finance & Business
- Parenting & Family

## 🔐 Security Features

- Row Level Security (RLS) policies
- Secure authentication with Supabase
- Protected API routes
- Input validation and sanitization
- Environment variable protection

## 📝 API Documentation

### Key Endpoints

- `GET /api/creators` - Fetch creator profiles
- `GET /api/campaigns` - Get campaign listings
- `POST /api/campaign-applications` - Submit applications
- `GET /api/messages` - Retrieve conversations
- `GET /api/dashboard/stats` - Dashboard analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the backend infrastructure
- [ShadCN UI](https://ui.shadcn.com) for the component library
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Next.js](https://nextjs.org) for the React framework

## 📞 Support

For support, email support@influencerflow.com or join our Discord community.

---

**Built with ❤️ for the creator economy** 