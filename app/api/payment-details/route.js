import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract payment information
    const amount = session.amount_total / 100; // Convert from cents
    const plan = session.metadata?.plan || 'weekly';
    const customerName = session.metadata?.name || 'Guest';
    const customerEmail = session.customer_email || session.metadata?.email || '';

    return new Response(JSON.stringify({
      amount,
      plan,
      customerName,
      customerEmail,
      paymentStatus: session.payment_status,
      sessionId: session.id
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Payment details error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch payment details' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
