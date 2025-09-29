import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });

export async function POST(req) {
  try {
    const { email, name } = await req.json();
    
    if (!email || !name) {
      return new Response(JSON.stringify({ error: 'Email and name required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create a Stripe Identity verification session
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        email: email,
        name: name,
      },
      options: {
        document: {
          allowed_types: ['driving_license', 'id_card', 'passport'],
          require_id_number: true,
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
    });

    console.log('Created Stripe Identity session:', verificationSession.id);

    return new Response(JSON.stringify({ 
      client_secret: verificationSession.client_secret,
      session_id: verificationSession.id 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Stripe Identity error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create identity verification session',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

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

    // Retrieve the verification session
    const session = await stripe.identity.verificationSessions.retrieve(sessionId);
    
    return new Response(JSON.stringify({ 
      status: session.status,
      verified: session.status === 'verified',
      last_verification_report: session.last_verification_report
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Stripe Identity check error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to check verification status',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
