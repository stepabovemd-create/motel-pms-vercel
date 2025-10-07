import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get guest
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

    // Get payments
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

    // Calculate everything step by step
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const standardWeeklyRate = 25000;
    const moveInFee = 10000;

    // Find move-in date
    let moveInDate = null;
    const sortedPayments = [...payments].sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date));
    
    for (let payment of sortedPayments) {
      if (payment.amount >= (guest.current_plan === 'weekly' ? 35000 : 90000)) {
        moveInDate = new Date(payment.payment_date);
        break;
      }
    }

    if (!moveInDate) {
      moveInDate = new Date(guest.first_payment_date);
    }

    // Calculate expected amount
    let totalExpected = 0;
    if (totalPaid >= (standardWeeklyRate + moveInFee)) {
      totalExpected = standardWeeklyRate + moveInFee;
      const additionalPeriods = Math.floor((totalPaid - (standardWeeklyRate + moveInFee)) / standardWeeklyRate);
      totalExpected += (additionalPeriods * standardWeeklyRate);
    }

    const currentBalance = totalPaid - totalExpected;

    // Calculate complete periods
    let completePeriods = 0;
    if (totalExpected >= (standardWeeklyRate + moveInFee)) {
      completePeriods = 1;
      const additionalPeriods = Math.floor((totalExpected - (standardWeeklyRate + moveInFee)) / standardWeeklyRate);
      completePeriods += additionalPeriods;
    }

    // Calculate next due date
    const nextDueDate = new Date(moveInDate);
    nextDueDate.setDate(nextDueDate.getDate() + ((completePeriods + 1) * 7));

    const debugInfo = {
      guest: {
        email: guest.email,
        name: guest.name,
        plan: guest.current_plan,
        firstPaymentDate: guest.first_payment_date,
        lastPaymentDate: guest.last_payment_date,
        nextPaymentDue: guest.next_payment_due
      },
      payments: payments.map(p => ({
        date: p.payment_date,
        amount: p.amount,
        amountDollars: p.amount / 100,
        sessionId: p.session_id?.slice(-8)
      })),
      calculations: {
        totalPaid,
        totalPaidDollars: totalPaid / 100,
        totalExpected,
        totalExpectedDollars: totalExpected / 100,
        currentBalance,
        currentBalanceDollars: currentBalance / 100,
        completePeriods
      },
      dates: {
        moveInDate: moveInDate.toISOString(),
        moveInDateFormatted: moveInDate.toLocaleDateString(),
        calculatedNextDue: nextDueDate.toISOString(),
        calculatedNextDueFormatted: nextDueDate.toLocaleDateString(),
        databaseNextDue: guest.next_payment_due,
        databaseNextDueFormatted: new Date(guest.next_payment_due).toLocaleDateString()
      }
    };

    return new Response(JSON.stringify(debugInfo, null, 2), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Debug dates error:', error);
    return new Response(JSON.stringify({ error: 'Failed to debug dates' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
