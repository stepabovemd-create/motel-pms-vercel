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
    
    console.log('=== DEBUG BALANCE TEST ===');
    console.log('Email:', email);
    
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
    
    console.log('Guest found:', guest.id);
    
    // Get payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('guest_id', guest.id)
      .order('payment_date', ASC);
    
    if (paymentsError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch payments' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Payments found:', payments.length);
    console.log('Payment amounts:', payments.map(p => ({ amount: p.amount, dollars: p.amount / 100 })));
    
    // Calculate balance directly
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
    
    const currentBalance = totalPaid - totalExpected;
    const nextPaymentAmount = Math.max(0, 25000 - currentBalance);
    
    console.log('=== CALCULATION RESULTS ===');
    console.log('Total Paid:', totalPaid, '($' + (totalPaid / 100) + ')');
    console.log('Payments Count:', paymentsCount);
    console.log('Total Expected:', totalExpected, '($' + (totalExpected / 100) + ')');
    console.log('Current Balance:', currentBalance, '($' + (currentBalance / 100) + ')');
    console.log('Next Payment Amount:', nextPaymentAmount, '($' + (nextPaymentAmount / 100) + ')');
    console.log('=== END DEBUG ===');
    
    return new Response(JSON.stringify({
      email: email,
      guestId: guest.id,
      plan: guest.current_plan,
      payments: payments.map(p => ({
        amount: p.amount,
        amountDollars: p.amount / 100,
        date: p.payment_date
      })),
      calculation: {
        totalPaid: totalPaid,
        totalPaidDollars: totalPaid / 100,
        paymentsCount: paymentsCount,
        totalExpected: totalExpected,
        totalExpectedDollars: totalExpected / 100,
        currentBalance: currentBalance,
        currentBalanceDollars: currentBalance / 100,
        nextPaymentAmount: nextPaymentAmount,
        nextPaymentAmountDollars: nextPaymentAmount / 100
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Debug balance error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
