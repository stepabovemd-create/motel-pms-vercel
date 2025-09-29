import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

function validate(body) {
  const errors = [];
  const required = ['firstName', 'lastName', 'email', 'phone', 'checkInDate', 'stayPlan', 'brandKey'];
  for (const k of required) if (!body?.[k]) errors.push(`${k} is required`);
  if (body?.stayPlan && !['weekly', 'monthly'].includes(body.stayPlan)) errors.push('stayPlan must be weekly or monthly');
  return errors;
}

export async function POST(req) {
  try {
    const data = await req.json();
    console.log('Received data:', data);
    
    const errors = validate(data);
    if (errors.length) return new Response(JSON.stringify({ errors }), { status: 400 });
    
    console.log('Creating table...');
    await sql`CREATE TABLE IF NOT EXISTS applications (id SERIAL PRIMARY KEY, brandKey TEXT, firstName TEXT, lastName TEXT, email TEXT, phone TEXT, checkInDate TEXT, stayPlan TEXT, createdAt TIMESTAMPTZ DEFAULT NOW());`;
    
    console.log('Inserting application...');
    await sql`INSERT INTO applications (brandKey, firstName, lastName, email, phone, checkInDate, stayPlan) VALUES (${data.brandKey}, ${data.firstName}, ${data.lastName}, ${data.email}, ${data.phone}, ${data.checkInDate}, ${data.stayPlan});`;
    
    console.log('Application saved successfully');
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}


