# InfluencerFlow

A platform that connects influencers with brands for collaborations. Built with Next.js and Supabase.

## What it does

This is a web app where brands can find influencers and vice versa. Brands post campaigns, influencers apply, and they can chat to work out the details.

### For Brands
- Search for influencers by niche, followers, engagement rate
- Create campaigns with budgets and requirements  
- Review applications from creators
- Message influencers directly
- Track campaign performance

### For Influencers
- Browse available campaigns
- Apply to ones that match your audience
- Chat with brands about collaborations
- Track your applications and earnings
- Connect your Instagram for automatic stats

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **UI**: ShadCN components
- **APIs**: Instagram Basic Display API

## Database

The app has tables for users, campaigns, applications, messages, payments, etc. All set up with proper relationships and security policies.

## Getting Started

You'll need Node.js and a Supabase account.

```bash
git clone https://github.com/digimirai-dev/InfluencerFlow-AI-Platform.git
cd InfluencerFlow-AI-Platform
npm install
```

Copy `env.example` to `.env.local` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the SQL schema from `supabase/schema.sql` in your Supabase project, then:

```bash
npm run dev
```

## Demo Mode

The app includes demo data so you can test it without setting up real accounts. Just browse around the dashboard to see how it works.

## Current Features

- User authentication (brands vs creators)
- Campaign creation and browsing
- Application system
- Real-time messaging
- Instagram profile integration
- Payment tracking
- Dashboard with stats

## Sample Data

I've included some mock data:
- 13 test creator profiles across different niches
- 3 sample brands with active campaigns
- Example conversations and applications
- Fake payment history

## Instagram Setup

If you want to connect real Instagram accounts:

1. Create a Facebook app at developers.facebook.com
2. Add Instagram Basic Display
3. Get your access token and app credentials
4. Add them to your .env.local file

## Contributing

Feel free to fork and submit PRs. The code could definitely use some cleanup and there are plenty of features that could be added.

## License

MIT License - do whatever you want with it.

## Notes

This was built as a learning project to understand how influencer marketing platforms work. The payment system is just for demo purposes - you'd need to integrate with Stripe or similar for real transactions.

If you're actually building something like this for production, you'll want to add proper error handling, rate limiting, email notifications, and a bunch of other stuff I didn't get to.

---

Built by someone who wanted to understand the creator economy better.
