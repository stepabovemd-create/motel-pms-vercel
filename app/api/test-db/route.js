import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = 'https://jouvuxmzppfdexiuvss.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdXZ1eG16cHBmZGV4aWl1dnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzI1NjgsImV4cCI6MjA3NDc0ODU2OH0.WGTv2s_IRdu4y_gQBF7lAonQ2Zi-h-L2sGbN5Jv30m4';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .limit(1);
    
    if (error) {
      return new Response(JSON.stringify({ error: error.message, details: error }), { status: 500 });
    }
    
    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
