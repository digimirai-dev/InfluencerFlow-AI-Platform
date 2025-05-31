import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
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

    // Handle demo user for development
    if (userId === 'demo-user-id') {
      if (userType === 'brand') {
        return NextResponse.json({
          activeCampaigns: 3,
          totalCreators: 8,
          totalSpent: 15000,
          avgROI: 4.2,
          campaigns: []
        });
      } else {
        return NextResponse.json({
          activeCampaigns: 2,
          totalEarnings: 3500,
          pendingApplications: 1,
          completedProjects: 5,
          recentCollaborations: []
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