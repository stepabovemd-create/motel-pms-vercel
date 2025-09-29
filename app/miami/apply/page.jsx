"use client";
import { useState } from 'react';

export default function MiamiApply() {
  const [values, setValues] = useState({ firstName: '', lastName: '', email: '', phone: '', checkInDate: '', stayPlan: 'weekly' });
  const [errors, setErrors] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErrors([]);
    const res = await fetch(`/api/applications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, brandKey: 'miami' }) });
    const json = await res.json();
    if (!res.ok) { setErrors(json.errors || ['Failed to submit']); return; }
    setSubmitted(true);
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
      <header style={{ background: '#ff1a1a', color: '#fff', padding: '24px 16px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h1 style={{ margin: 0 }}>Miami Motel Application</h1>
          <p style={{ margin: 0 }}>Weekly and monthly stays • 109 North Miami Avenue, Cleves, OH 45002</p>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
        {errors.length ? (<div style={{ background: '#fff1f2', padding: 12, borderRadius: 6, color: '#991b1b', border: '1px solid #fecaca' }}><ul>{errors.map(e => <li key={e}>{e}</li>)}</ul></div>) : null}

        {!submitted ? (
          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>First name<input value={values.firstName} onChange={e => setValues(v => ({ ...v, firstName: e.target.value }))} required /></label>
              <label>Last name<input value={values.lastName} onChange={e => setValues(v => ({ ...v, lastName: e.target.value }))} required /></label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>Email<input type="email" value={values.email} onChange={e => setValues(v => ({ ...v, email: e.target.value }))} required /></label>
              <label>Phone<input value={values.phone} onChange={e => setValues(v => ({ ...v, phone: e.target.value }))} required /></label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>Check-in date<input type="date" value={values.checkInDate} onChange={e => setValues(v => ({ ...v, checkInDate: e.target.value }))} required /></label>
              <label>Plan<select value={values.stayPlan} onChange={e => setValues(v => ({ ...v, stayPlan: e.target.value }))}><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
            </div>
            <button type="submit" style={{ background: '#ff1a1a', color: '#fff', padding: '.6rem .9rem', borderRadius: 6, fontWeight: 600 }}>Submit Application</button>
          </form>
        ) : (
          <section style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>Thank you!</h3>
            <p>We received your application. You can proceed to secure payment now or later.</p>
            <a href="/success" style={{ background: '#ff1a1a', color: '#fff', padding: '.6rem .9rem', borderRadius: 6, fontWeight: 600, textDecoration: 'none' }}>Proceed to Payment</a>
          </section>
        )}
      </main>
    </div>
  );
}


