"use client";
import { useState, useEffect } from 'react';

export default function MiamiApply() {
  const [values, setValues] = useState({ firstName: '', lastName: '', email: '', phone: '', checkInDate: '', stayPlan: 'weekly' });
  const [errors, setErrors] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [idVerified, setIdVerified] = useState(false);
  const [idPhoto, setIdPhoto] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [stripeIdentitySession, setStripeIdentitySession] = useState(null);

  // Load Stripe SDK for payments and Identity
  useEffect(() => {
    // Check if scripts already exist
    if (document.querySelector('script[src="https://js.stripe.com/v3/"]')) {
      console.log('Stripe SDK already loaded');
    } else {
      // Load Stripe v3 for payments
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => {
        console.log('Stripe v3 SDK loaded successfully');
        console.log('window.Stripe:', window.Stripe);
        
        // Initialize Stripe with publishable key
        if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
          window.stripeInstance = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
          console.log('Stripe instance initialized');
        }
      };
      document.head.appendChild(script);
    }

    // Check if returning from Stripe Identity verification
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
      console.log('Returned from Stripe Identity verification');
      
      // Only restore form data when returning from Stripe Identity
      const savedData = localStorage.getItem('miami-motel-form-data');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setValues(parsedData);
          console.log('Form data restored from localStorage:', parsedData);
          // Clear the saved data after restoring
          localStorage.removeItem('miami-motel-form-data');
        } catch (error) {
          console.error('Failed to parse saved form data:', error);
        }
      }

      // Restore email verification state
      const savedEmailVerified = localStorage.getItem('miami-motel-email-verified');
      if (savedEmailVerified === 'true') {
        setEmailVerified(true);
        console.log('Email verification state restored');
        // Clear the saved email verification state after restoring
        localStorage.removeItem('miami-motel-email-verified');
      }
      
      setIdVerified(true);
      // Remove the query parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Save form data to localStorage
  const saveFormData = (formValues) => {
    localStorage.setItem('miami-motel-form-data', JSON.stringify(formValues));
  };

  // Send verification email when email is entered
  async function sendVerificationEmail(email) {
    if (!email || emailSent) return;
    
    try {
      console.log('Sending verification email to:', email);
      
      // Add a small delay to ensure the API is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const res = await fetch(`/api/verify-email?email=${encodeURIComponent(email)}`);
      const result = await res.json();
      console.log('Email send result:', result);
      
      if (res.ok) {
        setEmailSent(true);
        console.log('Verification email sent successfully');
        // Reset emailSent after 30 seconds to allow resending
        setTimeout(() => setEmailSent(false), 30000);
      } else {
        console.error('Failed to send email:', result);
      }
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }
  }

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
      
      // Clear localStorage since application is being submitted
      localStorage.removeItem('miami-motel-form-data');
      localStorage.removeItem('miami-motel-email-verified');
      console.log('LocalStorage cleared after successful application submission');
      
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
    
    console.log('Verifying email:', values.email, 'with code:', emailCode);
    
    try {
      const res = await fetch('/api/verify-email', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email: values.email, code: emailCode }) 
      });
      
      const json = await res.json();
      console.log('Verification response:', json);
      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);
      
      if (!res.ok) { 
        console.error('Verification failed with status:', res.status);
        console.error('Error details:', json);
        setErrors(json.errors || ['Invalid verification code']); 
        return; 
      }
      
      setEmailVerified(true);
      localStorage.setItem('miami-motel-email-verified', 'true');
      console.log('Email verified successfully');
    } catch (error) {
      console.error('Verification error:', error);
      setErrors(['Network error during verification']);
    }
  }

  async function startStripeIdentity() {
    setErrors([]);
    
    try {
      console.log('Starting Stripe Identity verification...');
      const res = await fetch('/api/stripe-identity', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          email: values.email, 
          name: `${values.firstName} ${values.lastName}` 
        }) 
      });
      
      const json = await res.json();
      console.log('Stripe Identity response:', json);
      
      if (!res.ok) { 
        setErrors([json.error || 'Failed to start identity verification']); 
        return; 
      }
      
      setStripeIdentitySession(json);
      console.log('Stripe Identity session created:', json);
      
      // Save form data before redirecting
      saveFormData(values);
      console.log('Form data saved before redirect');
      
      // Redirect to Stripe's hosted verification page
      if (json.url) {
        console.log('Redirecting to Stripe Identity verification page...');
        window.location.href = json.url;
      } else {
        setErrors(['Failed to get verification URL from Stripe']);
      }
      
    } catch (error) {
      console.error('Stripe Identity error:', error);
      setErrors(['Network error during identity verification']);
    }
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
                  
                  {values.email && (
                    <div style={{ background: '#f0f9ff', padding: 12, borderRadius: 6, border: '1px solid #bae6fd', marginBottom: 12 }}>
                      <p style={{ margin: 0, fontSize: 14, color: '#1e40af' }}>
                        <strong>Email entered:</strong> {values.email}
                      </p>
                      {!emailSent ? (
                        <button 
                          type="button"
                          onClick={() => sendVerificationEmail(values.email)}
                          style={{ background: colors.primary, color: '#fff', padding: '.4rem .8rem', borderRadius: 6, fontWeight: 600, border: 'none', fontSize: 14, marginTop: 8 }}
                        >
                          Send Verification Code
                        </button>
                      ) : (
                        <div style={{ marginTop: 8 }}>
                          <p style={{ margin: '0 0 8px 0', fontSize: 14, color: '#1e40af' }}>
                            ✓ Verification email sent! Check your inbox.
                          </p>
                          <button 
                            type="button"
                            onClick={() => sendVerificationEmail(values.email)}
                            style={{ background: 'transparent', color: colors.primary, padding: '.4rem .8rem', borderRadius: 6, fontWeight: 600, border: `1px solid ${colors.primary}`, fontSize: 14 }}
                          >
                            Resend Code
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {emailSent && (
                    <form onSubmit={verifyEmail} style={{ display: 'grid', gap: 12 }}>
                      <label>Verification Code<input style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }} value={emailCode} onChange={e => setEmailCode(e.target.value)} placeholder="Enter 6-digit code" required /></label>
                      <button type="submit" style={{ background: colors.primary, color: '#fff', padding: '.6rem .9rem', borderRadius: 8, fontWeight: 700 }}>Verify Email</button>
                    </form>
                  )}
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
                  <p>Verify your identity using Stripe's secure verification:</p>
                  <p style={{ fontSize: 14, color: colors.muted, background: '#f0f9ff', padding: 8, borderRadius: 4, border: '1px solid #bae6fd' }}>
                    <strong>Secure Verification:</strong> Stripe Identity will verify your government-issued ID and take a selfie to ensure you are who you claim to be. This provides enhanced security for your stay.
                  </p>
                  
                  {!stripeIdentitySession ? (
                    <button 
                      onClick={startStripeIdentity}
                      disabled={!values.firstName || !values.lastName || !values.email}
                      style={{ 
                        background: (!values.firstName || !values.lastName || !values.email) ? '#9ca3af' : colors.primary, 
                        color: '#fff', 
                        padding: '.8rem 1.2rem', 
                        borderRadius: 8, 
                        fontWeight: 700,
                        border: 'none',
                        cursor: (!values.firstName || !values.lastName || !values.email) ? 'not-allowed' : 'pointer',
                        fontSize: 16
                      }}
                    >
                      {(!values.firstName || !values.lastName || !values.email) ? 'Complete form above first' : 'Start Identity Verification'}
                    </button>
                  ) : (
                    <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, border: '1px solid #bbf7d0' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#166534' }}>Identity Verification Started</h4>
                      <p style={{ margin: '0 0 12px 0', color: '#166534' }}>
                        You will be redirected to Stripe's secure verification page. You'll need to:
                      </p>
                      <ul style={{ margin: '0 0 12px 0', color: '#166534', paddingLeft: 20 }}>
                        <li>Take a photo of your government-issued ID</li>
                        <li>Take a selfie to match your ID</li>
                        <li>Complete the verification process</li>
                        <li>Return to this page when finished</li>
                      </ul>
                      <p style={{ margin: 0, fontSize: 14, color: '#166534' }}>
                        <strong>Note:</strong> This verification is handled securely by Stripe and will redirect you back here when complete.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: '#166534', background: '#f0fdf4', padding: 8, borderRadius: 4, border: '1px solid #bbf7d0' }}>✓ Identity verified successfully</p>
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