import Stripe from 'stripe';

export const runtime = 'edge';

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature') || '';
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    // Optionally store to Postgres here
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}


