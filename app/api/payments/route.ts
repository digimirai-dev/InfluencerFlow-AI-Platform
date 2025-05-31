import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get all payments where user is payer or recipient
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        payer:users!payments_payer_id_fkey(full_name, user_type),
        recipient:users!payments_recipient_id_fkey(full_name, user_type),
        collaborations(
          campaigns(title)
        )
      `)
      .or(`payer_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Calculate statistics
    const stats = {
      totalEarnings: 0,
      totalSpent: 0,
      pendingPayments: 0,
      completedPayments: 0
    };

    payments?.forEach(payment => {
      const isIncoming = payment.recipient_id === userId;
      const isCompleted = payment.status === 'completed';
      const isPending = payment.status === 'pending';

      if (isCompleted) {
        stats.completedPayments++;
        if (isIncoming) {
          stats.totalEarnings += Number(payment.amount);
        } else {
          stats.totalSpent += Number(payment.amount);
        }
      }

      if (isPending) {
        stats.pendingPayments++;
      }
    });

    return NextResponse.json({
      payments: payments || [],
      stats
    });

  } catch (error) {
    console.error('Payments API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
} 