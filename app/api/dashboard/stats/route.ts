import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType');
    const userId = searchParams.get('userId');

    if (!userId || !userType) {
      return NextResponse.json(
        { error: 'User ID and user type are required' },
        { status: 400 }
      );
    }

    // Create a direct client for fallback queries
    const directClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Handle demo user and test users for development
    if (userId === 'demo-user-id' || userId === '00000000-0000-0000-0000-000000000002' || userId === '00000000-0000-0000-0000-000000000003' || userId === '00000000-0000-0000-0000-000000000001') {
      
      if (userType === 'brand') {
        // Get actual creator count
        const { data: creators } = await directClient
          .from('creator_profiles')
          .select('id', { count: 'exact' });

        const totalCreators = creators?.length || 58;

        // Get actual campaigns for brand user
        const { data: campaigns } = await directClient
          .from('campaigns')
          .select('*')
          .limit(3);

        return NextResponse.json({
          activeCampaigns: campaigns?.length || 3,
          totalCreators,
          totalSpent: 15000,
          avgROI: 4.2,
          campaigns: campaigns || []
        });
      } else if (userType === 'creator') {
        // Get actual collaborations for creator
        const { data: collaborations } = await directClient
          .from('collaborations')
          .select('*')
          .limit(5);

        return NextResponse.json({
          activeCampaigns: 2,
          totalEarnings: 3500,
          pendingApplications: 1,
          completedProjects: 5,
          recentCollaborations: collaborations || []
        });
      } else if (userType === 'admin') {
        // Admin dashboard stats
        const [creatorsResult, brandsResult, campaignsResult, collaborationsResult] = await Promise.all([
          directClient.from('creator_profiles').select('id', { count: 'exact' }),
          directClient.from('brand_profiles').select('id', { count: 'exact' }),
          directClient.from('campaigns').select('id, status', { count: 'exact' }),
          directClient.from('collaborations').select('id, status', { count: 'exact' })
        ]);

        const totalCreators = creatorsResult.data?.length || 0;
        const totalBrands = brandsResult.data?.length || 0;
        const totalCampaigns = campaignsResult.data?.length || 0;
        const totalCollaborations = collaborationsResult.data?.length || 0;

        return NextResponse.json({
          totalUsers: totalCreators + totalBrands,
          totalCreators,
          totalBrands,
          totalCampaigns,
          totalCollaborations,
          activeCampaigns: campaignsResult.data?.filter(c => c.status === 'active').length || 0,
          platformRevenue: 25000,
          monthlyGrowth: 12.5
        });
      }
    }

    if (userType === 'brand') {
      // Brand dashboard stats
      const [campaignsResult, collaborationsResult, paymentsResult] = await Promise.all([
        // Active campaigns count
        supabase
          .from('campaigns')
          .select('id, status, budget_max, applications_count')
          .eq('brand_id', userId),
        
        // Active collaborations
        supabase
          .from('collaborations')
          .select('id, status, agreed_rate, creator_id')
          .eq('brand_id', userId),
        
        // Total payments made
        supabase
          .from('payments')
          .select('amount, status')
          .eq('payer_id', userId)
          .eq('status', 'completed')
      ]);

      const campaigns = campaignsResult.data || [];
      const collaborations = collaborationsResult.data || [];
      const payments = paymentsResult.data || [];

      const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
      const totalCreators = new Set(collaborations.map(c => c.creator_id)).size;
      const totalSpent = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const avgROI = 4.2; // This would be calculated based on campaign performance metrics

      return NextResponse.json({
        activeCampaigns,
        totalCreators,
        totalSpent,
        avgROI,
        campaigns: campaigns.slice(0, 5) // Recent campaigns
      });

    } else if (userType === 'creator') {
      // Creator dashboard stats
      const [collaborationsResult, paymentsResult, applicationsResult] = await Promise.all([
        // Active collaborations
        supabase
          .from('collaborations')
          .select('id, status, agreed_rate, campaign_id, campaigns(title)')
          .eq('creator_id', userId),
        
        // Total earnings
        supabase
          .from('payments')
          .select('amount, status')
          .eq('recipient_id', userId)
          .eq('status', 'completed'),
        
        // Pending applications
        supabase
          .from('campaign_applications')
          .select('id, status, campaign_id, campaigns(title)')
          .eq('creator_id', userId)
      ]);

      const collaborations = collaborationsResult.data || [];
      const payments = paymentsResult.data || [];
      const applications = applicationsResult.data || [];

      const activeCampaigns = collaborations.filter(c => c.status === 'active').length;
      const totalEarnings = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const pendingApplications = applications.filter(a => a.status === 'pending').length;
      const completedProjects = collaborations.filter(c => c.status === 'completed').length;

      return NextResponse.json({
        activeCampaigns,
        totalEarnings,
        pendingApplications,
        completedProjects,
        recentCollaborations: collaborations.slice(0, 5)
      });
    } else if (userType === 'admin') {
      // Admin dashboard stats
      const [usersResult, campaignsResult, collaborationsResult, paymentsResult] = await Promise.all([
        supabase.from('users').select('id, user_type', { count: 'exact' }),
        supabase.from('campaigns').select('id, status', { count: 'exact' }),
        supabase.from('collaborations').select('id, status', { count: 'exact' }),
        supabase.from('payments').select('amount, status').eq('status', 'completed')
      ]);

      const users = usersResult.data || [];
      const campaigns = campaignsResult.data || [];
      const collaborations = collaborationsResult.data || [];
      const payments = paymentsResult.data || [];

      const totalUsers = users.length;
      const totalCreators = users.filter(u => u.user_type === 'creator').length;
      const totalBrands = users.filter(u => u.user_type === 'brand').length;
      const totalCampaigns = campaigns.length;
      const totalCollaborations = collaborations.length;
      const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
      const platformRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0) * 0.1; // 10% platform fee

      return NextResponse.json({
        totalUsers,
        totalCreators,
        totalBrands,
        totalCampaigns,
        totalCollaborations,
        activeCampaigns,
        platformRevenue,
        monthlyGrowth: 12.5
      });
    }

    return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
} 