import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

export async function GET(req) {
  try {
    console.log('Testing Supabase connection...');
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
    console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Supabase environment variables not configured',
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
        key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Test basic connection
    const { data, error } = await supabase
      .from('guests')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase error:', error);
      return new Response(JSON.stringify({ 
        error: 'Supabase connection failed',
        details: error.message,
        hint: error.hint
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_tables');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Supabase connection working',
      tables: tables || 'Could not check tables',
      guestsCount: data || 'Could not count guests'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Test error:', error);
    return new Response(JSON.stringify({ 
      error: 'Test failed',
      details: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
