import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });
const DATA_FILE = path.join(process.cwd(), 'data', 'guests.json');

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load guests data
function loadGuests() {
  ensureDataDirectory();
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading guests data:', error);
    return [];
  }
}

// Save guests data
function saveGuests(guests) {
  ensureDataDirectory();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(guests, null, 2));
  } catch (error) {
    console.error('Error saving guests data:', error);
  }
}

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Payment successful for session:', session.id);

      // Extract data from session metadata
      const { plan, name, email, isNewGuest } = session.metadata;
      const amount = session.amount_total / 100; // Convert from cents

      if (!email || !name || !plan) {
        console.error('Missing required metadata in session:', session.id);
        return new Response('Missing required metadata', { status: 400 });
      }

      // Save guest record
      const guests = loadGuests();
      const existingGuestIndex = guests.findIndex(g => g.email.toLowerCase() === email.toLowerCase());
      
      const paymentRecord = {
        date: new Date().toISOString(),
        amount: amount,
        plan: plan,
        sessionId: session.id,
        isNewGuest: isNewGuest === 'true'
      };

      if (existingGuestIndex >= 0) {
        // Update existing guest
        const guest = guests[existingGuestIndex];
        guest.lastPaymentDate = new Date().toISOString();
        guest.currentPlan = plan;
        guest.payments = guest.payments || [];
        guest.payments.push(paymentRecord);
        
        // Calculate next payment due date
        const nextPaymentDate = new Date();
        if (plan === 'weekly') {
          nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
        } else {
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        }
        guest.nextPaymentDue = nextPaymentDate.toISOString();
        
        guests[existingGuestIndex] = guest;
      } else {
        // Create new guest
        const newGuest = {
          email: email.toLowerCase(),
          name: name,
          firstPaymentDate: new Date().toISOString(),
          lastPaymentDate: new Date().toISOString(),
          currentPlan: plan,
          payments: [paymentRecord],
          createdAt: new Date().toISOString()
        };
        
        // Calculate next payment due date
        const nextPaymentDate = new Date();
        if (plan === 'weekly') {
          nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
        } else {
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        }
        newGuest.nextPaymentDue = nextPaymentDate.toISOString();
        
        guests.push(newGuest);
      }

      saveGuests(guests);
      console.log('Guest record saved for:', email);
    }

    return new Response('Webhook processed successfully', { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook error', { status: 500 });
  }
}