import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.POSTGRES_URL) {
    return new Response(JSON.stringify({ weekly: 0, monthly: 0, note: 'POSTGRES_URL not set' }), { status: 200 });
  }
  await sql`CREATE TABLE IF NOT EXISTS applications (id SERIAL PRIMARY KEY, brandKey TEXT, firstName TEXT, lastName TEXT, email TEXT, phone TEXT, checkInDate TEXT, stayPlan TEXT, createdAt TIMESTAMPTZ DEFAULT NOW());`;
  const weekly = await sql`SELECT COUNT(DISTINCT email) as c FROM applications WHERE stayPlan = 'weekly'`;
  const monthly = await sql`SELECT COUNT(DISTINCT email) as c FROM applications WHERE stayPlan = 'monthly'`;
  return new Response(JSON.stringify({ weekly: weekly.rows?.[0]?.c || 0, monthly: monthly.rows?.[0]?.c || 0 }), { status: 200 });
}


