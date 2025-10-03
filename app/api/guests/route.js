import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

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

// GET - Check if guest exists and get their info
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

    const guests = loadGuests();
    const guest = guests.find(g => g.email.toLowerCase() === email.toLowerCase());
    
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
