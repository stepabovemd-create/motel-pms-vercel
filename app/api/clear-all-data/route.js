import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

export async function DELETE(req) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Database not configured'
      }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Starting complete data clear...');

    // Clear all payments first (due to foreign key constraints)
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all payments

    if (paymentsError) {
      console.error('Error clearing payments:', paymentsError);
      return new Response(JSON.stringify({ 
        error: 'Failed to clear payments',
        details: paymentsError.message
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Clear all account balances
    const { error: balancesError } = await supabase
      .from('account_balances')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all balances

    if (balancesError) {
      console.error('Error clearing account balances:', balancesError);
    }

    // Clear all guests
    const { error: guestsError } = await supabase
      .from('guests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all guests

    if (guestsError) {
      console.error('Error clearing guests:', guestsError);
      return new Response(JSON.stringify({ 
        error: 'Failed to clear guests',
        details: guestsError.message
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Reset all rooms to available status
    const { error: roomsError } = await supabase
      .from('rooms')
      .update({
        status: 'available',
        guest_id: null,
        check_in_date: null,
        check_out_date: null,
        updated_at: new Date().toISOString()
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rooms

    if (roomsError) {
      console.error('Error resetting rooms:', roomsError);
      return new Response(JSON.stringify({ 
        error: 'Failed to reset rooms',
        details: roomsError.message
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Complete data clear successful');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'All data cleared successfully',
      cleared: {
        payments: 'All payment records deleted',
        guests: 'All guest records deleted', 
        accountBalances: 'All account balance records deleted',
        rooms: 'All rooms reset to available status'
      }
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Clear all data error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to clear all data',
      details: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Also support GET for easy browser testing
export async function GET(req) {
  return DELETE(req);
}
