import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

// POST - Assign room to guest
export async function POST(req) {
  try {
    const { guestId, roomNumber } = await req.json();
    
    if (!guestId || !roomNumber) {
      return new Response(JSON.stringify({ error: 'Guest ID and room number required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Database not configured',
        success: true,
        message: 'Room assignment skipped - database not configured'
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if room is available
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_number', roomNumber)
      .eq('status', 'available')
      .single();

    if (roomError || !room) {
      return new Response(JSON.stringify({ 
        error: 'Room not available or does not exist'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update room status to occupied
    const { error: updateRoomError } = await supabase
      .from('rooms')
      .update({
        status: 'occupied',
        guest_id: guestId,
        check_in_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('room_number', roomNumber);

    if (updateRoomError) {
      console.error('Error updating room:', updateRoomError);
      return new Response(JSON.stringify({ 
        error: 'Failed to assign room'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update guest with room number
    const { error: updateGuestError } = await supabase
      .from('guests')
      .update({
        room_number: roomNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', guestId);

    if (updateGuestError) {
      console.error('Error updating guest:', updateGuestError);
      // Try to revert room status
      await supabase
        .from('rooms')
        .update({
          status: 'available',
          guest_id: null,
          check_in_date: null,
          updated_at: new Date().toISOString()
        })
        .eq('room_number', roomNumber);
      
      return new Response(JSON.stringify({ 
        error: 'Failed to assign room to guest'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      roomNumber: roomNumber,
      message: 'Room assigned successfully'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Room assignment error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to assign room'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
