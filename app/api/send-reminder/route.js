export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { email, name, plan, amount, dueDate } = await req.json();
    
    if (!email || !name || !plan || !amount || !dueDate) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For now, just log the reminder (in production, you'd send actual emails)
    console.log('Payment Reminder:', {
      email,
      name,
      plan,
      amount,
      dueDate,
      timestamp: new Date().toISOString()
    });

    // In production, you would:
    // 1. Use a service like SendGrid, Mailgun, or AWS SES
    // 2. Send HTML email with payment link
    // 3. Include customer portal link
    
    const emailContent = `
      Dear ${name},
      
      This is a friendly reminder that your ${plan} payment of $${amount} is due on ${dueDate}.
      
      Please visit Miami Motel to make your payment:
      https://your-domain.com/miami/apply
      
      If you have any questions, please contact us at 513-429-2251.
      
      Thank you,
      Miami Motel Team
    `;

    console.log('Email content:', emailContent);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Reminder logged successfully',
      emailContent 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Send reminder error:', error);
    return new Response(JSON.stringify({ error: 'Failed to send reminder' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
