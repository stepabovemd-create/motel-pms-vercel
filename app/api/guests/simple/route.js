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

    // Calculate balance and next payment
    let accountBalance = 0;
    let nextPaymentAmount = 25000; // $250

    if (totalPaid >= 35000) {
      // They paid the first week completely ($250 + $100 move-in fee)
      let amountAfterFirstWeek = totalPaid - 35000;
      
      // Calculate how many complete additional weeks they've paid for
      const additionalCompleteWeeks = Math.floor(amountAfterFirstWeek / 25000);
      const remainingCredit = amountAfterFirstWeek % 25000;
      
      // Update due date based on complete weeks
      if (additionalCompleteWeeks > 0) {
        nextDueDate.setDate(nextDueDate.getDate() + (additionalCompleteWeeks * 7));
      }
      
      accountBalance = remainingCredit; // Credit toward next week
      nextPaymentAmount = Math.max(0, 25000 - remainingCredit); // $250 minus remaining credit
    } else if (totalPaid > 0) {
      // Partial payment toward first week
      accountBalance = -totalPaid; // Debt (negative balance)
      nextPaymentAmount = 35000 - totalPaid; // Remaining amount needed for first week
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
        nextPaymentAmount: nextPaymentAmount,
        roomNumber: guest.room_number
      },
      payments: payments || []
    };


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
    const { email, name, plan, paymentAmount, sessionId, roomNumber } = await req.json();
    
    
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

    // Assign room if room number provided and this is a new guest
    if (roomNumber && isNewGuest) {
      try {
        const assignResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/rooms/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestId: guestId,
            roomNumber: roomNumber
          })
        });
        
        const assignResult = await assignResponse.json();
        if (!assignResponse.ok) {
          console.error('Room assignment failed:', assignResult.error);
        } else {
          console.log('Room assigned successfully:', roomNumber);
        }
      } catch (error) {
        console.error('Error assigning room:', error);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      isNewGuest: isNewGuest,
      guestId: guestId,
      roomNumber: roomNumber || null
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
