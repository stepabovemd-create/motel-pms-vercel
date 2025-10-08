import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

export async function POST(req) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Database not configured'
      }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Clear existing room data first
    const { error: deleteError } = await supabase
      .from('rooms')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rooms

    if (deleteError) {
      console.error('Error deleting existing rooms:', deleteError);
    }

    // Insert Miami Motel rooms (1-12, 14)
    const rooms = [
      { room_number: '1', room_type: 'standard', status: 'available' },
      { room_number: '2', room_type: 'standard', status: 'available' },
      { room_number: '3', room_type: 'standard', status: 'available' },
      { room_number: '4', room_type: 'standard', status: 'available' },
      { room_number: '5', room_type: 'standard', status: 'available' },
      { room_number: '6', room_type: 'standard', status: 'available' },
      { room_number: '7', room_type: 'standard', status: 'available' },
      { room_number: '8', room_type: 'standard', status: 'available' },
      { room_number: '9', room_type: 'standard', status: 'available' },
      { room_number: '10', room_type: 'standard', status: 'available' },
      { room_number: '11', room_type: 'standard', status: 'available' },
      { room_number: '12', room_type: 'standard', status: 'available' },
      { room_number: '14', room_type: 'standard', status: 'available' }
    ];

    const { data: insertedRooms, error: insertError } = await supabase
      .from('rooms')
      .insert(rooms)
      .select();

    if (insertError) {
      console.error('Error inserting rooms:', insertError);
      return new Response(JSON.stringify({ 
        error: 'Failed to insert rooms',
        details: insertError.message
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Rooms setup successfully',
      roomsInserted: insertedRooms?.length || 0,
      rooms: insertedRooms
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Setup rooms error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to setup rooms',
      details: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
