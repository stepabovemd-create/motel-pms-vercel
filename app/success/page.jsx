"use client";
import React from 'react';

export default function SuccessPage() {
  const [sessionId, setSessionId] = React.useState(null);
  const [paymentData, setPaymentData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('session_id');
    setSessionId(id);
    
    if (id) {
      fetchPaymentDetails(id);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchPaymentDetails(sessionId) {
    try {
      const res = await fetch(`/api/payment-details?session_id=${sessionId}`);
      const data = await res.json();
      setPaymentData(data);
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
    } finally {
      setLoading(false);
    }
  }

  function getNextPaymentDate(plan) {
    const now = new Date();
    if (plan === 'weekly') {
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return nextWeek.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      return nextMonth.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  }

  const colors = { primary: '#dc2626', muted: '#475569' };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 16, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
      <section style={{ background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)', color: '#fff', padding: '24px 16px', borderRadius: 8, marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Payment Successful!</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>Thank you for choosing Miami Motel</p>
      </section>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p>Loading payment details...</p>
        </div>
      ) : sessionId && paymentData ? (
        <div style={{ display: 'grid', gap: 24 }}>
          {/* Payment Confirmation */}
          <div style={{ background: '#f0fdf4', padding: 20, borderRadius: 8, border: '1px solid #bbf7d0' }}>
            <h3 style={{ marginTop: 0, color: '#166534' }}>✓ Payment Confirmed</h3>
            <p style={{ color: '#166534', margin: 0 }}>Your payment has been processed successfully. You will receive a confirmation email shortly.</p>
          </div>

          {/* Receipt */}
          <div style={{ background: '#f9fafb', padding: 20, borderRadius: 8, border: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0, color: colors.primary }}>Payment Receipt</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.muted }}>Customer:</span>
                <span>{paymentData.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.muted }}>Email:</span>
                <span>{paymentData.customerEmail}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.muted }}>Plan:</span>
                <span>{paymentData.plan === 'weekly' ? 'Weekly' : 'Monthly'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.muted }}>Amount Paid:</span>
                <span style={{ fontWeight: 700 }}>${paymentData.amount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.muted }}>Payment Date:</span>
                <span>{new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>
          </div>

          {/* Next Payment */}
          <div style={{ background: '#fef3c7', padding: 20, borderRadius: 8, border: '1px solid #f59e0b' }}>
            <h3 style={{ marginTop: 0, color: '#92400e' }}>Next Payment Due</h3>
            <p style={{ color: '#92400e', margin: 0 }}>
              Your next payment of <strong>${paymentData.amount}</strong> is due on{' '}
              <strong>{getNextPaymentDate(paymentData.plan)}</strong>
            </p>
            <p style={{ color: '#92400e', fontSize: 14, margin: '8px 0 0 0' }}>
              We'll send you email reminders 1-2 days before your payment is due.
            </p>
          </div>

          {/* Contact Info */}
          <div style={{ background: '#f0f9ff', padding: 20, borderRadius: 8, border: '1px solid #bae6fd' }}>
            <h3 style={{ marginTop: 0, color: '#1e40af' }}>Need Help?</h3>
            <p style={{ color: '#1e40af', margin: 0 }}>
              Miami Motel • 109 North Miami Avenue, Cleves, OH 45002
            </p>
            <p style={{ color: '#1e40af', margin: '8px 0 0 0' }}>
              Phone: <a href="tel:513-429-2251" style={{ color: '#1e40af' }}>513-429-2251</a>
            </p>
          </div>
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


