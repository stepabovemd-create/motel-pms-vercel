import { ServerClient } from 'postmark';

export const dynamic = 'force-dynamic';

// Simple in-memory store for verification codes (use Redis in production)
const verificationCodes = new Map();

export async function POST(req) {
  try {
    const { email, code } = await req.json();
    
    console.log('Verification attempt:', { email, code, timestamp: new Date().toISOString() });
    console.log('Stored codes:', Array.from(verificationCodes.entries()));
    
    if (!email || !code) {
      return new Response(JSON.stringify({ errors: ['Email and code required'] }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if code matches
    const storedCode = verificationCodes.get(email);
    console.log('Stored code for email:', storedCode);
    
    if (storedCode && storedCode.code === code && storedCode.expires > Date.now()) {
      // Mark as verified
      verificationCodes.set(email, { ...storedCode, verified: true });
      console.log(`Email verified for ${email}`);
      return new Response(JSON.stringify({ success: true }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // More detailed error message
    let errorMessage = 'Invalid verification code';
    if (!storedCode) {
      errorMessage = 'No verification code found for this email. Please request a new code.';
    } else if (storedCode.expires <= Date.now()) {
      errorMessage = 'Verification code has expired. Please request a new code.';
    } else if (storedCode.code !== code) {
      errorMessage = `Code mismatch. Expected: ${storedCode.code}, Got: ${code}`;
    }

    console.log('Verification failed:', errorMessage);
    return new Response(JSON.stringify({ errors: [errorMessage] }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return new Response(JSON.stringify({ errors: ['Email required'] }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    // Store code
    verificationCodes.set(email, { code, expires, verified: false });
    
    console.log(`Generated verification code for ${email}: ${code}`);
    console.log(`Code expires at: ${new Date(expires).toISOString()}`);
    console.log('All stored codes:', Array.from(verificationCodes.entries()));
    
    // Send email via Postmark
    if (process.env.POSTMARK_SERVER_TOKEN) {
      const client = new ServerClient(process.env.POSTMARK_SERVER_TOKEN);
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Email Verification - Miami Motel</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(180deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .code { background: #dc2626; color: white; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Miami Motel</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">Email Verification</p>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Thank you for applying to Miami Motel! To continue with your application, please verify your email address.</p>
              <p>Your verification code is:</p>
              <div class="code">${code}</div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this verification, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© 2025 Miami Motel. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await client.sendEmail({
        From: process.env.POSTMARK_FROM_EMAIL || 'noreply@miamimotel.com',
        To: email,
        Subject: 'Verify Your Email - Miami Motel',
        HtmlBody: htmlContent,
        TextBody: `Your Miami Motel verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this verification, please ignore this email.`,
        MessageStream: 'outbound'
      });
      
      console.log(`Verification email sent to ${email}`);
    } else {
      console.log(`Verification code for ${email}: ${code} (Postmark not configured)`);
    }
    
    return new Response(JSON.stringify({ message: 'Verification code sent to email' }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Send verification email error:', error);
    return new Response(JSON.stringify({ error: 'Failed to send verification email' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
