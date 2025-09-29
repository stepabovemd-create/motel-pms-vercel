import { sql } from '@vercel/postgres';

function validate(body: any) {
  const errors: string[] = [];
  const required = ['firstName', 'lastName', 'email', 'phone', 'checkInDate', 'stayPlan', 'brandKey'];
  for (const k of required) if (!body?.[k]) errors.push(`${k} is required`);
  if (body?.stayPlan && !['weekly', 'monthly'].includes(body.stayPlan)) errors.push('stayPlan must be weekly or monthly');
  return errors;
}

export async function POST(req: Request) {
  const data = await req.json();
  const errors = validate(data);
  if (errors.length) return new Response(JSON.stringify({ errors }), { status: 400 });
  await sql`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      brandKey TEXT NOT NULL,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      checkInDate TEXT NOT NULL,
      stayPlan TEXT NOT NULL,
      createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`;
  await sql`INSERT INTO applications (brandKey, firstName, lastName, email, phone, checkInDate, stayPlan)
            VALUES (${data.brandKey}, ${data.firstName}, ${data.lastName}, ${data.email}, ${data.phone}, ${data.checkInDate}, ${data.stayPlan});`;
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}


