import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Get payment history for a guest
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

    // Get guest first
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

    // Get payments for this guest
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('guest_id', guest.id)
      .order('payment_date', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch payments' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      guest: {
        id: guest.id,
        email: guest.email,
        name: guest.name,
        firstPaymentDate: guest.first_payment_date,
        lastPaymentDate: guest.last_payment_date,
        currentPlan: guest.current_plan,
        nextPaymentDue: guest.next_payment_due
      },
      payments: payments || []
    }), { 
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
