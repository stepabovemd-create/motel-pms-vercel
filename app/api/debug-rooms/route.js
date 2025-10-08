import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

export async function GET(req) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Database not configured',
        rooms: [],
        total: 0
      }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all rooms (not just available ones)
    const { data: allRooms, error: allError } = await supabase
      .from('rooms')
      .select('*')
      .order('room_number', { ascending: true });

    // Get available rooms
    const { data: availableRooms, error: availableError } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', 'available')
      .order('room_number', { ascending: true });

    return new Response(JSON.stringify({ 
      allRooms: allRooms || [],
      availableRooms: availableRooms || [],
      totalRooms: allRooms?.length || 0,
      availableCount: availableRooms?.length || 0,
      allError: allError?.message || null,
      availableError: availableError?.message || null
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Debug rooms error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to debug rooms',
      details: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
