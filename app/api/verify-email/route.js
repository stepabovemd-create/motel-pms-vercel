import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// Simple in-memory store for demo (use Redis in production)
const emailCodes = new Map();

export async function POST(req) {
  const { email, code } = await req.json();
  
  if (!email || !code) {
    return new Response(JSON.stringify({ errors: ['Email and code required'] }), { status: 400 });
  }

  // For demo, accept any 6-digit code
  if (code.length === 6 && /^\d+$/.test(code)) {
    // Store verification status
    await sql`CREATE TABLE IF NOT EXISTS verifications (id SERIAL PRIMARY KEY, email TEXT UNIQUE, email_verified BOOLEAN DEFAULT FALSE, id_verified BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW());`;
    await sql`INSERT INTO verifications (email, email_verified) VALUES (${email}, true) ON CONFLICT (email) DO UPDATE SET email_verified = true;`;
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  return new Response(JSON.stringify({ errors: ['Invalid verification code'] }), { status: 400 });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  
  if (!email) {
    return new Response(JSON.stringify({ errors: ['Email required'] }), { status: 400 });
  }

  // Generate and store a simple 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  emailCodes.set(email, code);
  
  // In production, send actual email here
  console.log(`Verification code for ${email}: ${code}`);
  
  return new Response(JSON.stringify({ message: 'Code sent to email' }), { status: 200 });
}
