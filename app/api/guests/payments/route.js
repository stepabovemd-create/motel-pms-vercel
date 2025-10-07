import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

// GET - Get payment history for a guest
export async function GET(req) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('Supabase not configured, returning no data');
      return new Response(JSON.stringify({ 
        error: 'Database not configured'
      }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get guest first
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    console.log('Guest query result:', { guest, guestError });

    if (guestError) {
      if (guestError.code === 'PGRST116') {
        // No rows found
        return new Response(JSON.stringify({ error: 'Guest not found' }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        console.error('Supabase error:', guestError);
        return new Response(JSON.stringify({ 
          error: 'Database error',
          details: guestError.message
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (!guest) {
      return new Response(JSON.stringify({ error: 'Guest not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get payments for this guest - force fresh data
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('guest_id', guest.id)
      .order('payment_date', { ascending: true }); // Changed to ascending to get chronological order

    console.log('Payments query result:', { payments, paymentsError });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch payments' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate balance directly from payments (more reliable than database table)
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const paymentsCount = payments.length;
    
    // Calculate expected amount based on COMPLETE periods only
    // This handles partial payments correctly
    let totalExpected = 0;
    const standardWeeklyRate = 25000; // $250 in cents
    const standardMonthlyRate = 80000; // $800 in cents
    const moveInFee = 10000; // $100 in cents

    if (guest.current_plan === 'weekly') {
      if (paymentsCount === 0) {
        totalExpected = 0;
      } else {
        // Calculate how many COMPLETE periods have been paid
        let completePeriods = 0;
        let runningTotal = 0;
        
        // First payment should be $350 (including move-in fee)
        if (totalPaid >= (standardWeeklyRate + moveInFee)) {
          completePeriods = 1;
          runningTotal = standardWeeklyRate + moveInFee;
        }
        
        // Additional complete periods at $250 each
        if (completePeriods > 0) {
          const remainingPayments = totalPaid - runningTotal;
          const additionalCompletePeriods = Math.floor(remainingPayments / standardWeeklyRate);
          completePeriods += additionalCompletePeriods;
          runningTotal += (additionalCompletePeriods * standardWeeklyRate);
        }
        
        totalExpected = runningTotal;
      }
    } else { // monthly
      if (paymentsCount === 0) {
        totalExpected = 0;
      } else {
        // Calculate how many COMPLETE periods have been paid
        let completePeriods = 0;
        let runningTotal = 0;
        
        // First payment should be $900 (including move-in fee)
        if (totalPaid >= (standardMonthlyRate + moveInFee)) {
          completePeriods = 1;
          runningTotal = standardMonthlyRate + moveInFee;
        }
        
        // Additional complete periods at $800 each
        if (completePeriods > 0) {
          const remainingPayments = totalPaid - runningTotal;
          const additionalCompletePeriods = Math.floor(remainingPayments / standardMonthlyRate);
          completePeriods += additionalCompletePeriods;
          runningTotal += (additionalCompletePeriods * standardMonthlyRate);
        }
        
        totalExpected = runningTotal;
      }
    }
    
    const currentBalance = totalPaid - totalExpected;
    
    // Calculate complete periods for debugging
    let completePeriods = 0;
    if (guest.current_plan === 'weekly') {
      if (totalExpected >= (standardWeeklyRate + moveInFee)) {
        completePeriods = 1;
        const additionalPeriods = Math.floor((totalExpected - (standardWeeklyRate + moveInFee)) / standardWeeklyRate);
        completePeriods += additionalPeriods;
      }
    } else {
      if (totalExpected >= (standardMonthlyRate + moveInFee)) {
        completePeriods = 1;
        const additionalPeriods = Math.floor((totalExpected - (standardMonthlyRate + moveInFee)) / standardMonthlyRate);
        completePeriods += additionalPeriods;
      }
    }

    console.log('Direct balance calculation:', { 
      totalPaid, 
      paymentsCount, 
      totalExpected, 
      currentBalance,
      completePeriods,
      totalPaidDollars: totalPaid / 100,
      totalExpectedDollars: totalExpected / 100,
      balanceDollars: currentBalance / 100
    });

    // Calculate next payment amount considering credit/debt
    let nextPaymentAmount = 0;
    if (guest.current_plan === 'weekly') {
      nextPaymentAmount = Math.max(0, 25000 - currentBalance); // $250 - credit/debt
    } else {
      nextPaymentAmount = Math.max(0, 80000 - currentBalance); // $800 - credit/debt
    }

    // Calculate correct next payment due date based on COMPLETE periods
    let correctNextDueDate = guest.next_payment_due;
    if (payments.length > 0) {
      const firstPaymentDate = new Date(guest.first_payment_date);
      
      // Calculate complete periods based on total expected amount
      let completePeriods = 0;
      if (guest.current_plan === 'weekly') {
        if (totalExpected >= (standardWeeklyRate + moveInFee)) {
          completePeriods = 1; // First period (including move-in fee)
          const additionalPeriods = Math.floor((totalExpected - (standardWeeklyRate + moveInFee)) / standardWeeklyRate);
          completePeriods += additionalPeriods;
        }
      } else {
        if (totalExpected >= (standardMonthlyRate + moveInFee)) {
          completePeriods = 1; // First period (including move-in fee)
          const additionalPeriods = Math.floor((totalExpected - (standardMonthlyRate + moveInFee)) / standardMonthlyRate);
          completePeriods += additionalPeriods;
        }
      }
      
      // Next due date = first payment date + complete periods + 1
      const nextDueDate = new Date(firstPaymentDate);
      if (guest.current_plan === 'weekly') {
        nextDueDate.setDate(nextDueDate.getDate() + ((completePeriods + 1) * 7));
      } else {
        nextDueDate.setMonth(nextDueDate.getMonth() + (completePeriods + 1));
      }
      correctNextDueDate = nextDueDate.toISOString();
    }

    const responseData = {
      guest: {
        id: guest.id,
        email: guest.email,
        name: guest.name,
        firstPaymentDate: guest.first_payment_date,
        lastPaymentDate: guest.last_payment_date,
        currentPlan: guest.current_plan,
        nextPaymentDue: correctNextDueDate,
        accountBalance: currentBalance,
        nextPaymentAmount: nextPaymentAmount
      },
      payments: payments || []
    };

    console.log('=== API RESPONSE DEBUG ===');
    console.log('Total Paid:', totalPaid, '($' + (totalPaid / 100) + ')');
    console.log('Payments Count:', paymentsCount);
    console.log('Total Expected:', totalExpected, '($' + (totalExpected / 100) + ')');
    console.log('Current Balance:', currentBalance, '($' + (currentBalance / 100) + ')');
    console.log('Next Payment Amount:', nextPaymentAmount, '($' + (nextPaymentAmount / 100) + ')');
    console.log('Returning response data:', responseData);
    console.log('=== END DEBUG ===');

    return new Response(JSON.stringify(responseData), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get payments error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get payment history' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
