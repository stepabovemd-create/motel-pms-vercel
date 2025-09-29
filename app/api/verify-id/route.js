import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const formData = await req.formData();
  const idPhoto = formData.get('idPhoto');
  const email = formData.get('email');
  
  if (!idPhoto || !email) {
    return new Response(JSON.stringify({ errors: ['ID photo and email required'] }), { status: 400 });
  }

  // For demo, accept any image file
  if (idPhoto.size > 0 && idPhoto.type.startsWith('image/')) {
    // Store ID verification status
    await sql`CREATE TABLE IF NOT EXISTS verifications (id SERIAL PRIMARY KEY, email TEXT UNIQUE, email_verified BOOLEAN DEFAULT FALSE, id_verified BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW());`;
    await sql`INSERT INTO verifications (email, id_verified) VALUES (${email}, true) ON CONFLICT (email) DO UPDATE SET id_verified = true;`;
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  return new Response(JSON.stringify({ errors: ['Invalid ID photo'] }), { status: 400 });
}
