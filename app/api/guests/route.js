import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

// GET - Check if guest exists and get their info
export async function GET(req) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('Supabase not configured, returning mock data');
      return new Response(JSON.stringify({ 
        exists: false,
        isNewGuest: true,
        message: 'Database not configured - treating as new guest'
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    console.log('GET /api/guests - Email:', email);
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Query Supabase for guest
    const { data: guest, error } = await supabase
      .from('guests')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    console.log('Supabase query result:', { guest, error });

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Supabase error:', error);
      return new Response(JSON.stringify({ error: 'Database error' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!guest) {
      return new Response(JSON.stringify({ 
        exists: false,
        isNewGuest: true 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get payment count
    const { count } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('guest_id', guest.id);

    return new Response(JSON.stringify({
      exists: true,
      isNewGuest: false,
      guest: {
        id: guest.id,
        email: guest.email,
        name: guest.name,
        firstPaymentDate: guest.first_payment_date,
        lastPaymentDate: guest.last_payment_date,
        totalPayments: count || 0,
        currentPlan: guest.current_plan,
        nextPaymentDue: guest.next_payment_due
      }
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get guest error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get guest info' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST - Create or update guest record
export async function POST(req) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('Supabase not configured, skipping guest save');
      return new Response(JSON.stringify({ 
        success: true,
        isNewGuest: true,
        message: 'Database not configured - guest data not saved'
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { email, name, plan, paymentAmount, sessionId } = await req.json();
    
    console.log('POST /api/guests - Data:', { email, name, plan, paymentAmount, sessionId });
    
    if (!email || !name || !plan) {
      return new Response(JSON.stringify({ error: 'Email, name, and plan required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if guest exists
    const { data: existingGuest } = await supabase
      .from('guests')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    // Calculate next payment due date based on last payment date
    let nextPaymentDate;
    if (existingGuest) {
      // For existing guests, calculate from last payment date
      const lastPaymentDate = new Date(existingGuest.last_payment_date);
      nextPaymentDate = new Date(lastPaymentDate);
      if (plan === 'weekly') {
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
      } else {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }
    } else {
      // For new guests, calculate from today
      nextPaymentDate = new Date();
      if (plan === 'weekly') {
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
      } else {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }
    }

    let guestId;
    let isNewGuest = false;

    if (existingGuest) {
      // Update existing guest
      const { data, error } = await supabase
        .from('guests')
        .update({
          last_payment_date: new Date().toISOString(),
          current_plan: plan,
          next_payment_due: nextPaymentDate.toISOString()
        })
        .eq('email', email.toLowerCase())
        .select()
        .single();

      if (error) {
        console.error('Error updating guest:', error);
        return new Response(JSON.stringify({ error: 'Failed to update guest' }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      guestId = data.id;
    } else {
      // Create new guest
      const { data, error } = await supabase
        .from('guests')
        .insert({
          email: email.toLowerCase(),
          name: name,
          first_payment_date: new Date().toISOString(),
          last_payment_date: new Date().toISOString(),
          current_plan: plan,
          next_payment_due: nextPaymentDate.toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating guest:', error);
        return new Response(JSON.stringify({ error: 'Failed to create guest' }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      guestId = data.id;
      isNewGuest = true;
    }

    // Add payment record
    // paymentAmount should already be in cents from Stripe, but let's be safe
    const amountInCents = typeof paymentAmount === 'number' && paymentAmount < 1000 
      ? Math.round(paymentAmount * 100)  // If it looks like dollars, convert to cents
      : Math.round(paymentAmount);       // If it looks like cents already, use as-is
    
    console.log('Payment amount conversion:', { 
      original: paymentAmount, 
      converted: amountInCents, 
      dollars: amountInCents / 100 
    });
    
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

    console.log('Payment record created:', paymentData);

    // Payment record saved successfully
    console.log('Payment record saved successfully for guest:', guestId);
    
    return new Response(JSON.stringify({ 
      success: true,
      isNewGuest: isNewGuest
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Save guest error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save guest info' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
