"use client";
import { useState } from 'react';
import React from 'react';

export default function SuccessPage() {
  const [state, setState] = useState({ name: '', email: '', plan: 'weekly', loading: false });
  const [verified, setVerified] = useState(false);

  // Check if user is verified on page load
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    if (email) {
      checkVerification(email);
    }
  }, []);

  async function checkVerification(email) {
    const res = await fetch(`/api/check-verification?email=${encodeURIComponent(email)}`);
    const json = await res.json();
    if (json.verified) {
      setVerified(true);
      setState(s => ({ ...s, email }));
    }
  }

  async function startCheckout(e) {
    e.preventDefault();
    setState(s => ({ ...s, loading: true }));
    const res = await fetch('/api/checkout/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: state.name, email: state.email, plan: state.plan }) });
    const json = await res.json();
    if (json.url) window.location.href = json.url; else alert(json.error || 'Failed to start checkout');
    setState(s => ({ ...s, loading: false }));
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
      <h2>Payment</h2>
      
      {!verified ? (
        <div style={{ background: '#fef3c7', padding: 16, borderRadius: 8, border: '1px solid #f59e0b' }}>
          <h3 style={{ marginTop: 0, color: '#92400e' }}>Verification Required</h3>
          <p style={{ color: '#92400e' }}>Please complete your application verification before proceeding to payment.</p>
          <a href="/miami/apply" style={{ background: '#dc2626', color: '#fff', padding: '.6rem .9rem', borderRadius: 8, fontWeight: 700, textDecoration: 'none' }}>Complete Application</a>
        </div>
      ) : (
        <>
                  <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, border: '1px solid #bbf7d0', marginBottom: 16 }}>
                    <h3 style={{ marginTop: 0, color: '#166534' }}>✓ Application Verified</h3>
                    <p style={{ color: '#166534' }}>Your email and ID have been verified. Stripe will perform additional identity verification during payment for enhanced security.</p>
                  </div>
          
          <form onSubmit={startCheckout} style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>Name<input required value={state.name} onChange={e => setState(s => ({ ...s, name: e.target.value }))} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }} /></label>
              <label>Email<input required type="email" value={state.email} onChange={e => setState(s => ({ ...s, email: e.target.value }))} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }} /></label>
            </div>
            <label>Plan<select value={state.plan} onChange={e => setState(s => ({ ...s, plan: e.target.value }))} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}><option value="weekly">Weekly ($250)</option><option value="monthly">Monthly ($800)</option></select></label>
            <button disabled={state.loading} style={{ background: '#dc2626', color: '#fff', padding: '.6rem .9rem', borderRadius: 8, fontWeight: 700 }}>Proceed to Stripe</button>
          </form>
        </>
      )}
    </div>
  );
}


