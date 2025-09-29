"use client";
import { useState } from 'react';

export default function MiamiApply() {
  const [values, setValues] = useState({ firstName: '', lastName: '', email: '', phone: '', checkInDate: '', stayPlan: 'weekly' });
  const [errors, setErrors] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState('form'); // 'form', 'verify-email', 'verify-id', 'complete'
  const [emailCode, setEmailCode] = useState('');
  const [idPhoto, setIdPhoto] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setErrors([]);
    const res = await fetch(`/api/applications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, brandKey: 'miami' }) });
    const json = await res.json();
    if (!res.ok) { setErrors(json.errors || ['Failed to submit']); return; }
    setStep('verify-email');
  }

  async function verifyEmail(e) {
    e.preventDefault();
    setErrors([]);
    const res = await fetch('/api/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: values.email, code: emailCode }) });
    const json = await res.json();
    if (!res.ok) { setErrors(json.errors || ['Invalid verification code']); return; }
    setStep('verify-id');
  }

  async function verifyId(e) {
    e.preventDefault();
    setErrors([]);
    if (!idPhoto) { setErrors(['Please upload a photo of your ID']); return; }
    
    const formData = new FormData();
    formData.append('idPhoto', idPhoto);
    formData.append('email', values.email);
    
    const res = await fetch('/api/verify-id', { method: 'POST', body: formData });
    const json = await res.json();
    if (!res.ok) { setErrors(json.errors || ['ID verification failed']); return; }
    setStep('complete');
  }

  const colors = { primary: '#dc2626', border: '#e5e7eb', muted: '#475569' };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
      <section style={{ background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)', color: '#fff', padding: '24px 16px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h1 style={{ margin: 0 }}>Miami Motel Application</h1>
          <p style={{ margin: 0 }}>Weekly and monthly stays • 109 North Miami Avenue, Cleves, OH 45002</p>
        </div>
      </section>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
        {errors.length ? (<div style={{ background: '#fff1f2', padding: 12, borderRadius: 6, color: '#991b1b', border: '1px solid #fecaca' }}><ul>{errors.map(e => <li key={e}>{e}</li>)}</ul></div>) : null}

        {step === 'form' && (
          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>First name<input style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }} value={values.firstName} onChange={e => setValues(v => ({ ...v, firstName: e.target.value }))} required /></label>
              <label>Last name<input style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }} value={values.lastName} onChange={e => setValues(v => ({ ...v, lastName: e.target.value }))} required /></label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>Email<input style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }} type="email" value={values.email} onChange={e => setValues(v => ({ ...v, email: e.target.value }))} required /></label>
              <label>Phone<input style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }} value={values.phone} onChange={e => setValues(v => ({ ...v, phone: e.target.value }))} required /></label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>Check-in date<input style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }} type="date" value={values.checkInDate} onChange={e => setValues(v => ({ ...v, checkInDate: e.target.value }))} required /></label>
              <label>Plan<select style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }} value={values.stayPlan} onChange={e => setValues(v => ({ ...v, stayPlan: e.target.value }))}><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
            </div>
            <button type="submit" style={{ background: colors.primary, color: '#fff', padding: '.6rem .9rem', borderRadius: 8, fontWeight: 700 }}>Submit Application</button>
          </form>
        )}

        {step === 'verify-email' && (
          <section style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>Verify Your Email</h3>
            <p>We sent a verification code to <strong>{values.email}</strong>. Please enter it below:</p>
            <form onSubmit={verifyEmail} style={{ display: 'grid', gap: 12 }}>
              <label>Verification Code<input style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }} value={emailCode} onChange={e => setEmailCode(e.target.value)} placeholder="Enter 6-digit code" required /></label>
              <button type="submit" style={{ background: colors.primary, color: '#fff', padding: '.6rem .9rem', borderRadius: 8, fontWeight: 700 }}>Verify Email</button>
            </form>
          </section>
        )}

        {step === 'verify-id' && (
          <section style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>Verify Your Identity</h3>
            <p>Please upload a clear photo of your government-issued ID (driver's license, passport, etc.):</p>
            <form onSubmit={verifyId} style={{ display: 'grid', gap: 12 }}>
              <label>ID Photo<input type="file" accept="image/*" onChange={e => setIdPhoto(e.target.files[0])} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }} required /></label>
              {idPhoto && <p style={{ color: colors.muted, fontSize: 14 }}>Selected: {idPhoto.name}</p>}
              <button type="submit" style={{ background: colors.primary, color: '#fff', padding: '.6rem .9rem', borderRadius: 8, fontWeight: 700 }}>Verify ID</button>
            </form>
          </section>
        )}

        {step === 'complete' && (
          <section style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, border: '1px solid #bbf7d0' }}>
            <h3 style={{ marginTop: 0, color: '#166534' }}>✓ Verification Complete!</h3>
            <p style={{ color: '#166534' }}>Your application has been verified. You can now proceed to secure payment.</p>
            <a href={`/success?email=${encodeURIComponent(values.email)}`} style={{ background: colors.primary, color: '#fff', padding: '.6rem .9rem', borderRadius: 8, fontWeight: 700, textDecoration: 'none' }}>Proceed to Payment</a>
          </section>
        )}
      </main>
    </div>
  );
}


