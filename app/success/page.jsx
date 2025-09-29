"use client";
import React from 'react';

export default function SuccessPage() {
  const [sessionId, setSessionId] = React.useState(null);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('session_id');
    setSessionId(id);
  }, []);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 16, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
      <section style={{ background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)', color: '#fff', padding: '24px 16px', borderRadius: 8, marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Payment Successful!</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>Thank you for choosing Miami Motel</p>
      </section>

      {sessionId ? (
        <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <h3 style={{ marginTop: 0, color: '#166534' }}>✓ Payment Confirmed</h3>
          <p style={{ color: '#166534' }}>Your payment has been processed successfully. You will receive a confirmation email shortly.</p>
          <p style={{ color: '#166534', fontSize: 14 }}>Session ID: {sessionId}</p>
        </div>
      ) : (
        <div style={{ background: '#fef3c7', padding: 16, borderRadius: 8, border: '1px solid #f59e0b' }}>
          <h3 style={{ marginTop: 0, color: '#92400e' }}>Complete Your Application</h3>
          <p style={{ color: '#92400e' }}>Please complete your application and verification to proceed to payment.</p>
          <a href="/miami/apply" style={{ background: '#dc2626', color: '#fff', padding: '.6rem .9rem', borderRadius: 8, fontWeight: 700, textDecoration: 'none' }}>Start Application</a>
        </div>
      )}

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <a href="/miami" style={{ color: '#dc2626', textDecoration: 'none' }}>← Back to Miami Motel</a>
      </div>
    </div>
  );
}


