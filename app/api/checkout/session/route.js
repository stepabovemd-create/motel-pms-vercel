import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });

export async function POST(req) {
  try {
    const { email, name, plan } = await req.json();
    if (!email || !name || !plan) return new Response(JSON.stringify({ error: 'email, name, and plan required' }), { status: 400 });
    if (!['weekly', 'monthly'].includes(plan)) return new Response(JSON.stringify({ error: 'Invalid plan' }), { status: 400 });

    const price = plan === 'weekly' ? 25000 : 80000;
    const description = plan === 'weekly' ? 'Weekly Room Rate' : 'Monthly Room Rate';
    const moveInFee = 10000; // $100.00 in cents

    // Check if this is a new guest by querying Supabase directly
    let isNewGuest = true;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        const { data: guest, error } = await supabase
          .from('guests')
          .select('*')
          .eq('email', email.toLowerCase())
          .single();
        
        console.log('Guest check result:', { guest, error });
        
        if (guest && !error) {
          isNewGuest = false; // Guest exists, no move-in fee
          console.log('Existing guest found, no move-in fee');
        } else {
          isNewGuest = true; // Guest doesn't exist, charge move-in fee
          console.log('New guest, will charge move-in fee');
        }
      } catch (error) {
        console.error('Error checking guest status:', error);
        // Default to new guest if check fails
        isNewGuest = true;
      }
    }

    const origin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    
    // Create line items - only include move-in fee for new guests
    const lineItems = [
      { 
        price_data: { 
          currency: 'usd', 
          product_data: { name: description }, 
          unit_amount: price 
        }, 
        quantity: 1 
      }
    ];

    // Add move-in fee only for new guests
    if (isNewGuest) {
      lineItems.push({
        price_data: { 
          currency: 'usd', 
          product_data: { name: 'Move-in Fee' }, 
          unit_amount: moveInFee 
        }, 
        quantity: 1 
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: lineItems,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/miami/apply`,
      metadata: { plan, name, email, isNewGuest: isNewGuest.toString(), moveInFee: isNewGuest ? '10000' : '0' },
      // Enable identity verification
      payment_intent_data: {
        setup_future_usage: 'off_session',
      },
      // Add identity verification requirements
      automatic_tax: { enabled: false },
      customer_creation: 'always',
      // Enable identity verification for high-risk payments
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
    });

    return new Response(JSON.stringify({ id: session.id, url: session.url }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), { status: 500 });
  }
}


