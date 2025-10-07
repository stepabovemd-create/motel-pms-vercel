import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

// GET - Simple payment calculation
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
      .order('created_at', { ascending: false }) // Get the most recent guest record
      .limit(1)
      .single();

    if (guestError || !guest) {
      return new Response(JSON.stringify({ error: 'Guest not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get payments for this specific guest
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('guest_id', guest.id)
      .order('payment_date', { ascending: true });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch payments' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Simple calculation
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Find the move-in date (first $350 payment)
    let moveInDate = new Date(guest.first_payment_date);
    const firstPayment = payments.find(p => p.amount >= 35000);
    if (firstPayment) {
      moveInDate = new Date(firstPayment.payment_date);
    }

    // Calculate next due date: move-in date + 7 days for weekly
    const nextDueDate = new Date(moveInDate);
    nextDueDate.setDate(nextDueDate.getDate() + 7);

    // Simple balance: if they paid $350, they have a $100 credit toward next $250
    let accountBalance = 0;
    let nextPaymentAmount = 25000; // $250

    if (totalPaid >= 35000) {
      // They paid the move-in fee, so they have $100 credit toward next payment
      accountBalance = 10000; // $100 credit
      nextPaymentAmount = 15000; // $150 ($250 - $100 credit)
    }

    const responseData = {
      guest: {
        id: guest.id,
        email: guest.email,
        name: guest.name,
        firstPaymentDate: guest.first_payment_date,
        lastPaymentDate: guest.last_payment_date,
        currentPlan: guest.current_plan,
        nextPaymentDue: nextDueDate.toISOString(),
        accountBalance: accountBalance,
        nextPaymentAmount: nextPaymentAmount
      },
      payments: payments || [],
      debug: {
        totalPaid,
        totalPaidDollars: totalPaid / 100,
        moveInDate: moveInDate.toISOString(),
        nextDueDate: nextDueDate.toISOString(),
        accountBalanceDollars: accountBalance / 100,
        nextPaymentAmountDollars: nextPaymentAmount / 100
      }
    };

    console.log('Simple calculation result:', responseData.debug);

    return new Response(JSON.stringify(responseData), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Simple get error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get payment info' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST - Simple payment save
export async function POST(req) {
  try {
    const { email, name, plan, paymentAmount, sessionId } = await req.json();
    
    console.log('Simple POST - Data:', { email, name, plan, paymentAmount, sessionId });
    
    if (!email || !name || !plan) {
      return new Response(JSON.stringify({ error: 'Email, name, and plan required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if payment already exists
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (existingPayment) {
      console.log('Payment already exists for session:', sessionId);
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Payment already recorded'
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get or create guest (use most recent one)
    const { data: existingGuest } = await supabase
      .from('guests')
      .select('*')
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let guestId;
    let isNewGuest = false;

    if (existingGuest) {
      guestId = existingGuest.id;
      console.log('Using existing guest:', guestId);
    } else {
      // Create new guest
      const { data: newGuest, error: createError } = await supabase
        .from('guests')
        .insert({
          email: email.toLowerCase(),
          name: name,
          first_payment_date: new Date().toISOString(),
          last_payment_date: new Date().toISOString(),
          current_plan: plan,
          next_payment_due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating guest:', createError);
        return new Response(JSON.stringify({ error: 'Failed to create guest' }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      guestId = newGuest.id;
      isNewGuest = true;
      console.log('Created new guest:', guestId);
    }

    // Save payment
    const amountInCents = typeof paymentAmount === 'number' && paymentAmount < 1000 
      ? Math.round(paymentAmount * 100)
      : Math.round(paymentAmount);
    
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        guest_id: guestId,
        amount: amountInCents,
        plan: plan,
        session_id: sessionId,
        payment_date: new Date().toISOString()
      })
      .select();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return new Response(JSON.stringify({ error: 'Failed to save payment record' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Payment saved successfully:', paymentData);

    return new Response(JSON.stringify({ 
      success: true,
      isNewGuest: isNewGuest,
      guestId: guestId
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Simple POST error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save payment' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
