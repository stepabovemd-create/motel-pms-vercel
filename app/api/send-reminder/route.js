import { ServerClient } from 'postmark';

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

    // Check if Postmark is configured
    if (!process.env.POSTMARK_SERVER_TOKEN) {
      console.log('Postmark not configured, logging reminder instead:', {
        email,
        name,
        plan,
        amount,
        dueDate,
        timestamp: new Date().toISOString()
      });
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Reminder logged (Postmark not configured)',
        note: 'Set POSTMARK_SERVER_TOKEN environment variable to send real emails'
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize Postmark client
    const client = new ServerClient(process.env.POSTMARK_SERVER_TOKEN);
    
    // Create HTML email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Reminder - Miami Motel</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(180deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 16px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Miami Motel</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Payment Reminder</p>
          </div>
          <div class="content">
            <h2>Payment Due Soon</h2>
            <p>Dear ${name},</p>
            <p>This is a friendly reminder that your <strong>${plan}</strong> payment of <strong>$${amount}</strong> is due on <strong>${dueDate}</strong>.</p>
            <p>Please make your payment to continue your stay with us.</p>
            <a href="${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/miami/apply" class="button">Make Payment</a>
            <p>If you have any questions or need assistance, please don't hesitate to contact us:</p>
            <ul>
              <li>Phone: <a href="tel:513-429-2251">513-429-2251</a></li>
              <li>Address: 109 North Miami Avenue, Cleves, OH 45002</li>
            </ul>
            <p>Thank you for choosing Miami Motel!</p>
          </div>
          <div class="footer">
            <p>This is an automated reminder. Please do not reply to this email.</p>
            <p>© 2025 Miami Motel. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Postmark
    const response = await client.sendEmail({
      From: process.env.POSTMARK_FROM_EMAIL || 'noreply@miamimotel.com',
      To: email,
      Subject: `Payment Reminder - Miami Motel (Due ${dueDate})`,
      HtmlBody: htmlContent,
      TextBody: `Dear ${name},\n\nThis is a friendly reminder that your ${plan} payment of $${amount} is due on ${dueDate}.\n\nPlease visit Miami Motel to make your payment: ${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/miami/apply\n\nIf you have any questions, please contact us at 513-429-2251.\n\nThank you,\nMiami Motel Team`,
      MessageStream: 'outbound'
    });

    console.log('Email sent successfully:', response.MessageID);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Reminder sent successfully',
      messageId: response.MessageID
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Send reminder error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to send reminder',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
