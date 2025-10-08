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

    // Check if rooms table exists by trying to query it
    const { data: existingRooms, error: tableCheckError } = await supabase
      .from('rooms')
      .select('id')
      .limit(1);

    if (tableCheckError && tableCheckError.message.includes('does not exist')) {
      return new Response(JSON.stringify({ 
        error: 'Rooms table does not exist. Please create it manually in Supabase dashboard.',
        instructions: 'Go to Supabase dashboard > SQL Editor and run the migration file: supabase/migrations/20250102000006_create_rooms_table.sql'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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
      message: 'Rooms table created and populated successfully',
      roomsInserted: insertedRooms?.length || 0,
      rooms: insertedRooms
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create rooms table error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create rooms table',
      details: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
