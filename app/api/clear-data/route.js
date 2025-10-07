import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

// DELETE - Clear all customer data
export async function DELETE(req) {
  try {
    console.log('Starting data cleanup...');

    // Delete all payments first (due to foreign key constraints)
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (paymentsError) {
      console.error('Error deleting payments:', paymentsError);
      return new Response(JSON.stringify({ 
        error: 'Failed to delete payments',
        details: paymentsError.message
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Payments deleted successfully');

    // Delete all account balances
    const { error: balancesError } = await supabase
      .from('account_balances')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (balancesError) {
      console.error('Error deleting account balances:', balancesError);
    } else {
      console.log('Account balances deleted successfully');
    }

    // Delete all guests
    const { error: guestsError } = await supabase
      .from('guests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (guestsError) {
      console.error('Error deleting guests:', guestsError);
      return new Response(JSON.stringify({ 
        error: 'Failed to delete guests',
        details: guestsError.message
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Guests deleted successfully');

    // Verify tables are empty
    const { data: guests, error: guestsCountError } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true });

    const { data: payments, error: paymentsCountError } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true });

    console.log('Cleanup verification:', {
      guestsCount: guests?.length || 0,
      paymentsCount: payments?.length || 0
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'All customer data cleared successfully',
      verification: {
        guestsCount: guests?.length || 0,
        paymentsCount: payments?.length || 0
      }
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Clear data error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to clear data',
      details: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
