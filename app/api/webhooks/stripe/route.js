import Stripe from 'stripe';

export const runtime = 'edge';

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature') || '';
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    // Handle successful payment
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}


