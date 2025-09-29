"use client";
import { useState } from 'react';

export default function MiamiApply() {
  const [values, setValues] = useState({ firstName: '', lastName: '', email: '', phone: '', checkInDate: '', stayPlan: 'weekly' });
  const [errors, setErrors] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [idVerified, setIdVerified] = useState(false);
  const [idPhoto, setIdPhoto] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setErrors([]);
    
    if (!emailVerified) {
      setErrors(['Please verify your email first']);
      return;
    }
    
    if (!idVerified) {
      setErrors(['Please verify your ID first']);
      return;
    }
    
    try {
      console.log('Submitting application:', values);
      const res = await fetch(`/api/applications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, brandKey: 'miami' }) });
      console.log('Response status:', res.status);
      const json = await res.json();
      console.log('Response data:', json);
      console.log('Full response:', res);
      if (!res.ok) { 
        console.error('API Error Details:', json);
        const errorMsg = json.error || json.message || 'Failed to submit';
        setErrors([errorMsg]); 
        return; 
      }
      // Redirect directly to Stripe checkout
      const checkoutRes = await fetch('/api/checkout/session', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          name: `${values.firstName} ${values.lastName}`, 
          email: values.email, 
          plan: values.stayPlan 
        }) 
      });
      const checkoutJson = await checkoutRes.json();
      if (checkoutJson.url) {
        window.location.href = checkoutJson.url;
      } else {
        setErrors([checkoutJson.error || 'Failed to start checkout']);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setErrors(['Network error: ' + error.message]);
    }
  }

  async function verifyEmail(e) {
    e.preventDefault();
    setErrors([]);
    const res = await fetch('/api/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: values.email, code: emailCode }) });
    const json = await res.json();
    if (!res.ok) { setErrors(json.errors || ['Invalid verification code']); return; }
    setEmailVerified(true);
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
    setIdVerified(true);
  }

  const colors = { primary: '#dc2626', border: '#e5e7eb', muted: '#475569' };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
      <section style={{ background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)', color: '#fff', padding: '24px 16px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h1 style={{ margin: 0 }}>Miami Motel Application</h1>
          <p style={{ margin: 0 }}>Weekly and monthly stays • 109 North Miami Avenue, Cleves, OH 45002</p>
          <div style={{ marginTop: 8, fontSize: 14, opacity: 0.9 }}>
            Complete your application and verification to proceed to secure payment
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
        {errors.length ? (<div style={{ background: '#fff1f2', padding: 12, borderRadius: 6, color: '#991b1b', border: '1px solid #fecaca' }}><ul>{errors.map(e => <li key={e}>{e}</li>)}</ul></div>) : null}

        {submitted ? (
          <section style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, border: '1px solid #bbf7d0' }}>
            <h3 style={{ marginTop: 0, color: '#166534' }}>✓ Redirecting to Stripe...</h3>
            <p style={{ color: '#166534' }}>Your application has been submitted and verified. Redirecting to secure payment...</p>
          </section>
        ) : (
          <div style={{ display: 'grid', gap: 24 }}>
            {/* Application Form */}
            <section style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
              <h3 style={{ marginTop: 0 }}>Application Information</h3>
              <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label>First name<input style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }} value={values.firstName} onChange={e => setValues(v => ({ ...v, firstName: e.target.value }))} required /></label>
                  <label>Last name<input style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }} value={values.lastName} onChange={e => setValues(v => ({ ...v, lastName: e.target.value }))} required /></label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label>Email<input style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }} type="email" value={values.email} onChange={e => setValues(v => ({ ...v, email: e.target.value }))} required /></label>
                  <label>Phone<input style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }} type="tel" value={values.phone} onChange={e => setValues(v => ({ ...v, phone: e.target.value }))} required /></label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label>Check-in date<input style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }} type="date" value={values.checkInDate} onChange={e => setValues(v => ({ ...v, checkInDate: e.target.value }))} required /></label>
                  <label>Plan<select style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }} value={values.stayPlan} onChange={e => setValues(v => ({ ...v, stayPlan: e.target.value }))}><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
                </div>
              </form>
            </section>

            {/* Email Verification */}
            <section style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
              <h3 style={{ marginTop: 0 }}>Email Verification {emailVerified && <span style={{ color: '#166534' }}>✓</span>}</h3>
              {!emailVerified ? (
                <>
                  <p>Verify your email address to continue:</p>
                  <form onSubmit={verifyEmail} style={{ display: 'grid', gap: 12 }}>
                    <label>Verification Code<input style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }} value={emailCode} onChange={e => setEmailCode(e.target.value)} placeholder="Enter 6-digit code" required /></label>
                    <button type="submit" style={{ background: colors.primary, color: '#fff', padding: '.6rem .9rem', borderRadius: 8, fontWeight: 700 }}>Verify Email</button>
                  </form>
                  <p style={{ fontSize: 14, color: colors.muted, marginTop: 8 }}>For demo: enter any 6-digit number (like 123456)</p>
                </>
              ) : (
                <p style={{ color: '#166534', background: '#f0fdf4', padding: 8, borderRadius: 4, border: '1px solid #bbf7d0' }}>✓ Email verified successfully</p>
              )}
            </section>

            {/* ID Verification */}
            <section style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
              <h3 style={{ marginTop: 0 }}>Identity Verification {idVerified && <span style={{ color: '#166534' }}>✓</span>}</h3>
              {!idVerified ? (
                <>
                  <p>Upload a clear photo of your government-issued ID (driver's license, passport, etc.):</p>
                  <p style={{ fontSize: 14, color: colors.muted, background: '#f0f9ff', padding: 8, borderRadius: 4, border: '1px solid #bae6fd' }}>
                    <strong>Note:</strong> This is a basic verification. Stripe will perform additional identity verification during payment processing for enhanced security.
                  </p>
                  <form onSubmit={verifyId} style={{ display: 'grid', gap: 12 }}>
                    <label>ID Photo<input type="file" accept="image/*" onChange={e => setIdPhoto(e.target.files[0])} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }} required /></label>
                    {idPhoto && <p style={{ color: colors.muted, fontSize: 14 }}>Selected: {idPhoto.name}</p>}
                    <button type="submit" style={{ background: colors.primary, color: '#fff', padding: '.6rem .9rem', borderRadius: 8, fontWeight: 700 }}>Verify ID</button>
                  </form>
                </>
              ) : (
                <p style={{ color: '#166534', background: '#f0fdf4', padding: 8, borderRadius: 4, border: '1px solid #bbf7d0' }}>✓ ID verified successfully</p>
              )}
            </section>

            {/* Submit Button */}
            <button 
              onClick={onSubmit} 
              disabled={!emailVerified || !idVerified}
              style={{ 
                background: (!emailVerified || !idVerified) ? '#9ca3af' : colors.primary, 
                color: '#fff', 
                padding: '.8rem 1.2rem', 
                borderRadius: 8, 
                fontWeight: 700,
                fontSize: 16,
                border: 'none',
                cursor: (!emailVerified || !idVerified) ? 'not-allowed' : 'pointer'
              }}
            >
              {(!emailVerified || !idVerified) ? 'Complete verification above to submit' : 'Submit Application & Proceed to Payment'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}