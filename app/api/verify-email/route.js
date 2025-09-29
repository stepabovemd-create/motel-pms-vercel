export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { email, code } = await req.json();
    
    if (!email || !code) {
      return new Response(JSON.stringify({ errors: ['Email and code required'] }), { status: 400 });
    }

    // For demo, accept any 6-digit code
    if (code.length === 6 && /^\d+$/.test(code)) {
      console.log(`Email verified for ${email} with code ${code}`);
      return new Response(JSON.stringify({ success: true }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ errors: ['Invalid verification code'] }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
