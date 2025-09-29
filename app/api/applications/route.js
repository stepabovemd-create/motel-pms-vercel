import { createClient } from '@supabase/supabase-js';

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
    
    // Create Supabase client
    const supabaseUrl = 'https://jouvuxmzppfdexiuvss.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdXZ1eG16cHBmZGV4aWl1dnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzI1NjgsImV4cCI6MjA3NDc0ODU2OH0.WGTv2s_IRdu4y_gQBF7lAonQ2Zi-h-L2sGbN5Jv30m4';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Inserting application...');
    const { data: result, error } = await supabase
      .from('applications')
      .insert([{
        brandKey: data.brandKey,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        checkInDate: data.checkInDate,
        stayPlan: data.stayPlan
      }])
      .select();
    
    if (error) {
      console.error('Supabase error:', error);
      return new Response(JSON.stringify({ error: error.message, details: error }), { status: 500 });
    }
    
    console.log('Application saved successfully:', result);
    return new Response(JSON.stringify({ ok: true, data: result }), { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), { status: 500 });
  }
}


