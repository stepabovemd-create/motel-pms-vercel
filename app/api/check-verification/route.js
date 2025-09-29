import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  
  if (!email) {
    return new Response(JSON.stringify({ verified: false }), { status: 400 });
  }

  try {
    await sql`CREATE TABLE IF NOT EXISTS verifications (id SERIAL PRIMARY KEY, email TEXT UNIQUE, email_verified BOOLEAN DEFAULT FALSE, id_verified BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW());`;
    
    const result = await sql`SELECT email_verified, id_verified FROM verifications WHERE email = ${email}`;
    
    if (result.rows.length > 0) {
      const { email_verified, id_verified } = result.rows[0];
      return new Response(JSON.stringify({ verified: email_verified && id_verified }), { status: 200 });
    }
    
    return new Response(JSON.stringify({ verified: false }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ verified: false }), { status: 500 });
  }
}
