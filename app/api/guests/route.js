export const dynamic = 'force-dynamic';

// Simple in-memory store for guests (use database in production)
// This will reset on each deployment, but works for testing
const guestsStore = new Map();

// Load guests data
function loadGuests() {
  try {
    return Array.from(guestsStore.values());
  } catch (error) {
    console.error('Error loading guests data:', error);
    return [];
  }
}

// Save guests data
function saveGuests(guests) {
  try {
    guestsStore.clear();
    guests.forEach(guest => {
      guestsStore.set(guest.email.toLowerCase(), guest);
    });
    console.log('Guests saved:', guestsStore.size);
  } catch (error) {
    console.error('Error saving guests data:', error);
  }
}

// GET - Check if guest exists and get their info
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    console.log('GET /api/guests - Email:', email);
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const guests = loadGuests();
    console.log('Loaded guests:', guests.length);
    console.log('All guests:', guests);
    
    const guest = guests.find(g => g.email.toLowerCase() === email.toLowerCase());
    console.log('Found guest:', guest);
    
    if (!guest) {
      return new Response(JSON.stringify({ 
        exists: false,
        isNewGuest: true 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      exists: true,
      isNewGuest: false,
      guest: {
        email: guest.email,
        name: guest.name,
        firstPaymentDate: guest.firstPaymentDate,
        lastPaymentDate: guest.lastPaymentDate,
        totalPayments: guest.payments?.length || 0,
        currentPlan: guest.currentPlan,
        nextPaymentDue: guest.nextPaymentDue
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
    const { email, name, plan, paymentAmount, sessionId } = await req.json();
    
    console.log('POST /api/guests - Data:', { email, name, plan, paymentAmount, sessionId });
    
    if (!email || !name || !plan) {
      return new Response(JSON.stringify({ error: 'Email, name, and plan required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const guests = loadGuests();
    const existingGuestIndex = guests.findIndex(g => g.email.toLowerCase() === email.toLowerCase());
    
    const paymentRecord = {
      date: new Date().toISOString(),
      amount: paymentAmount,
      plan: plan,
      sessionId: sessionId
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
    
    return new Response(JSON.stringify({ 
      success: true,
      isNewGuest: existingGuestIndex < 0
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
