import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || 'cameron.macke02@gmail.com';
    
    console.log('=== FULL SYSTEM DIAGNOSTIC ===');
    console.log('Email:', email);
    
    // 1. Get guest record
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (guestError || !guest) {
      return new Response(JSON.stringify({ error: 'Guest not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 2. Get all payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('guest_id', guest.id)
      .order('payment_date', { ascending: true });
    
    if (paymentsError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch payments' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 3. Get balance record
    const { data: balance, error: balanceError } = await supabase
      .from('account_balances')
      .select('*')
      .eq('guest_id', guest.id)
      .single();
    
    // 4. Calculate everything manually
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const paymentsCount = payments.length;
    
    let totalExpected = 0;
    if (guest.current_plan === 'weekly') {
      if (paymentsCount === 0) {
        totalExpected = 0;
      } else if (paymentsCount === 1) {
        totalExpected = 35000; // $350 (250 + 100 move-in)
      } else {
        totalExpected = 35000 + ((paymentsCount - 1) * 25000); // $350 + ($250 * remaining)
      }
    }
    
    const calculatedBalance = totalPaid - totalExpected;
    const nextPaymentAmount = Math.max(0, 25000 - calculatedBalance);
    
    // Calculate due date
    let nextDueDate = guest.next_payment_due;
    if (payments.length > 0) {
      const lastPaymentDate = new Date(payments[payments.length - 1].payment_date);
      const nextDate = new Date(lastPaymentDate);
      nextDate.setDate(nextDate.getDate() + (paymentsCount * 7));
      nextDueDate = nextDate.toISOString();
    }
    
    const diagnostic = {
      guest: {
        id: guest.id,
        email: guest.email,
        name: guest.name,
        plan: guest.current_plan,
        firstPaymentDate: guest.first_payment_date,
        lastPaymentDate: guest.last_payment_date,
        nextPaymentDue: guest.next_payment_due,
        updatedAt: guest.updated_at
      },
      payments: {
        count: paymentsCount,
        total: payments.map(p => ({
          id: p.id,
          amount: p.amount,
          amountDollars: p.amount / 100,
          date: p.payment_date,
          sessionId: p.session_id?.slice(-8) || 'N/A'
        }))
      },
      calculations: {
        totalPaid: totalPaid,
        totalPaidDollars: totalPaid / 100,
        totalExpected: totalExpected,
        totalExpectedDollars: totalExpected / 100,
        calculatedBalance: calculatedBalance,
        calculatedBalanceDollars: calculatedBalance / 100,
        nextPaymentAmount: nextPaymentAmount,
        nextPaymentAmountDollars: nextPaymentAmount / 100,
        correctNextDueDate: nextDueDate
      },
      databaseBalance: balance ? {
        balanceCents: balance.balance_cents,
        balanceDollars: balance.balance_cents / 100,
        lastUpdated: balance.updated_at
      } : null,
      issues: []
    };
    
    // Check for issues
    if (paymentsCount === 0) {
      diagnostic.issues.push('No payments found');
    }
    
    if (balance && balance.balance_cents !== calculatedBalance) {
      diagnostic.issues.push(`Balance mismatch: DB has ${balance.balance_cents}, calculated ${calculatedBalance}`);
    }
    
    if (guest.next_payment_due !== nextDueDate) {
      diagnostic.issues.push(`Due date mismatch: DB has ${guest.next_payment_due}, calculated ${nextDueDate}`);
    }
    
    console.log('=== DIAGNOSTIC COMPLETE ===');
    console.log('Issues found:', diagnostic.issues.length);
    
    return new Response(JSON.stringify(diagnostic, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Diagnostic error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
