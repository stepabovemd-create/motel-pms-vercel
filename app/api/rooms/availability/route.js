import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

// GET - Get available rooms
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const roomType = searchParams.get('type'); // optional filter by room type
    
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

    // Build query
    let query = supabase
      .from('rooms')
      .select('room_number, room_type, status')
      .eq('status', 'available')
      .order('room_number', { ascending: true });

    // Add room type filter if specified
    if (roomType && roomType !== 'all') {
      query = query.eq('room_type', roomType);
    }

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
