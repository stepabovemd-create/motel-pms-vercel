import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

// GET - Get available rooms
export async function GET(req) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Database not configured',
        rooms: []
      }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all available rooms (all same type)
    const query = supabase
      .from('rooms')
      .select('room_number, room_type, status')
      .eq('status', 'available')
      .order('room_number', { ascending: true });

    const { data: rooms, error } = await query;

    if (error) {
      console.error('Error fetching rooms:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch room availability',
        rooms: []
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      rooms: rooms || [],
      totalAvailable: rooms?.length || 0
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Room availability error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get room availability',
      rooms: []
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
