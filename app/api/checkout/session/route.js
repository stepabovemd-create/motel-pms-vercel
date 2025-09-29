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

    const origin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price_data: { currency: 'usd', product_data: { name: description }, unit_amount: price }, quantity: 1 }],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/miami/apply`,
      metadata: { plan, name, email },
    });

    return new Response(JSON.stringify({ id: session.id, url: session.url }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), { status: 500 });
  }
}


