export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    console.log('Reminders cron job triggered at:', new Date().toISOString());
    
    // In production, you would:
    // 1. Query your database for customers with payments due in 1-2 days
    // 2. Send email reminders to those customers
    // 3. Log the results
    
    // For demo purposes, let's simulate sending reminders
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    
    console.log('Checking for payments due:', {
      tomorrow: tomorrow.toDateString(),
      dayAfter: dayAfter.toDateString()
    });
    
    // Simulate finding customers with payments due
    const mockCustomers = [
      {
        email: 'demo@example.com',
        name: 'Demo Customer',
        plan: 'weekly',
        amount: 250,
        dueDate: tomorrow.toDateString()
      }
    ];
    
    // Send reminders via Postmark
    const sentReminders = [];
    for (const customer of mockCustomers) {
      console.log(`Sending reminder to ${customer.email} for payment due ${customer.dueDate}`);
      
      try {
        const reminderRes = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/send-reminder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer)
        });
        
        const reminderResult = await reminderRes.json();
        sentReminders.push({
          email: customer.email,
          success: reminderRes.ok,
          result: reminderResult
        });
      } catch (error) {
        console.error(`Failed to send reminder to ${customer.email}:`, error);
        sentReminders.push({
          email: customer.email,
          success: false,
          error: error.message
        });
      }
    }
    
    return new Response(JSON.stringify({ 
      message: 'Reminders cron job executed successfully',
      timestamp: new Date().toISOString(),
      customersNotified: mockCustomers.length,
      remindersSent: sentReminders
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Reminders cron job error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to execute reminders cron job',
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}