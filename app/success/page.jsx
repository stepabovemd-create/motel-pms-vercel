"use client";
import { useState } from 'react';

export default function SuccessPage() {
  const [state, setState] = useState({ name: '', email: '', plan: 'weekly', loading: false });

  async function startCheckout(e) {
    e.preventDefault();
    setState(s => ({ ...s, loading: true }));
    const res = await fetch('/api/checkout/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: state.name, email: state.email, plan: state.plan }) });
    const json = await res.json();
    if (json.url) window.location.href = json.url; else alert(json.error || 'Failed to start checkout');
    setState(s => ({ ...s, loading: false }));
  }

  return (
    <div>
      <h2>Success</h2>
      <p>Your application was received. Proceed to secure payment.</p>
      <form onSubmit={startCheckout} style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>Name<input required value={state.name} onChange={e => setState(s => ({ ...s, name: e.target.value }))} /></label>
          <label>Email<input required type="email" value={state.email} onChange={e => setState(s => ({ ...s, email: e.target.value }))} /></label>
        </div>
        <label>Plan<select value={state.plan} onChange={e => setState(s => ({ ...s, plan: e.target.value }))}><option value="weekly">Weekly ($250)</option><option value="monthly">Monthly ($800)</option></select></label>
        <button disabled={state.loading} style={{ background: '#222', color: '#fff', padding: '.5rem .75rem', borderRadius: 6 }}>Proceed to Stripe</button>
      </form>
    </div>
  );
}


