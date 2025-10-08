"use client";
import { useState, useEffect } from 'react';

export default function MiamiApply() {
  const [values, setValues] = useState({ firstName: '', lastName: '', email: '', phone: '', checkInDate: '', stayPlan: 'weekly', roomNumber: '' });
  const [errors, setErrors] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [idVerified, setIdVerified] = useState(false);
  const [idPhoto, setIdPhoto] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [stripeIdentitySession, setStripeIdentitySession] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Fetch available rooms
  const fetchAvailableRooms = async () => {
    setLoadingRooms(true);
    try {
      const response = await fetch('/api/rooms/availability');
      const data = await response.json();
      if (response.ok) {
        setAvailableRooms(data.rooms || []);
      } else {
        console.error('Failed to fetch rooms:', data.error);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

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

  // Fetch available rooms on component mount
  useEffect(() => {
    fetchAvailableRooms();
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
        
        // Store the verification code in localStorage for client-side verification
        // This is a temporary fix for the serverless function issue
        if (result.code) {
          localStorage.setItem('miami-motel-verification-code', result.code);
          localStorage.setItem('miami-motel-verification-email', email);
          console.log('Verification code stored in localStorage:', result.code);
        }
        
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
    
    if (!values.roomNumber) {
      setErrors(['Please select a room']);
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
    
    // First try server-side verification
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
      
      if (res.ok) {
        setEmailVerified(true);
        localStorage.setItem('miami-motel-email-verified', 'true');
        console.log('Email verified successfully via server');
        return;
      }
      
      console.error('Server verification failed with status:', res.status);
      console.error('Error details:', json);
      
      // Fallback to client-side verification if server fails
      console.log('Trying client-side verification fallback...');
      
    } catch (error) {
      console.error('Server verification error:', error);
      console.log('Trying client-side verification fallback...');
    }
    
    // Client-side verification fallback
    try {
      const storedCode = localStorage.getItem('miami-motel-verification-code');
      const storedEmail = localStorage.getItem('miami-motel-verification-email');
      
      console.log('Client-side verification check:');
      console.log('Stored code:', storedCode);
      console.log('Stored email:', storedEmail);
      console.log('Input email:', values.email);
      console.log('Input code:', emailCode);
      
      if (storedCode && storedEmail === values.email && storedCode === emailCode) {
        setEmailVerified(true);
        localStorage.setItem('miami-motel-email-verified', 'true');
        console.log('Email verified successfully via client-side fallback');
        
        // Clear the stored code
        localStorage.removeItem('miami-motel-verification-code');
        localStorage.removeItem('miami-motel-verification-email');
        return;
      }
      
      console.log('Client-side verification failed');
      setErrors(['Invalid verification code. Please try again or request a new code.']);
      
    } catch (error) {
      console.error('Client-side verification error:', error);
      setErrors(['Verification failed. Please try again or request a new code.']);
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

  const colors = { 
    primary: '#dc2626', 
    primaryDark: '#b91c1c',
    border: '#e5e7eb', 
    muted: '#475569',
    background: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a'
  };

  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      background: colors.background,
      minHeight: '100vh'
    }}>
      <section style={{ 
        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', 
        color: '#fff', 
        padding: '60px 16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none'
        }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1.1
          }}>Miami Motel Application</h1>
          <p style={{ 
            margin: '16px 0 0 0', 
            fontSize: 18,
            opacity: 0.95
          }}>Weekly and monthly stays • 109 North Miami Avenue, Cleves, OH 45002</p>
          <div style={{ 
            marginTop: 16, 
            fontSize: 16, 
            opacity: 0.9,
            maxWidth: '600px',
            lineHeight: 1.5
          }}>
            Complete your application and verification to proceed to secure payment
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 16px' }}>
        {errors.length ? (
          <div style={{ 
            background: '#fff1f2', 
            padding: 20, 
            borderRadius: 12, 
            color: '#991b1b', 
            border: '1px solid #fecaca',
            marginBottom: 24,
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)'
          }}>
            <ul style={{ margin: 0, paddingLeft: 20 }}>{errors.map(e => <li key={e}>{e}</li>)}</ul>
          </div>
        ) : null}

        {submitted ? (
          <section style={{ 
            background: '#f0fdf4', 
            padding: 32, 
            borderRadius: 16, 
            border: '1px solid #bbf7d0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ 
              marginTop: 0, 
              color: '#166534',
              fontSize: 24,
              fontWeight: 700
            }}>✓ Redirecting to Stripe...</h3>
            <p style={{ 
              color: '#166534',
              fontSize: 16,
              margin: 0
            }}>Your application has been submitted and verified. Redirecting to secure payment...</p>
          </section>
        ) : (
          <div style={{ display: 'grid', gap: 32 }}>
            {/* Application Form */}
            <section style={{ 
              background: colors.card, 
              padding: 32, 
              borderRadius: 16,
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ 
                marginTop: 0, 
                fontSize: 24,
                fontWeight: 700,
                color: colors.text,
                marginBottom: 24
              }}>Application Information</h3>
              <form onSubmit={onSubmit} style={{ display: 'grid', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 8, 
                      fontWeight: 600, 
                      color: colors.text,
                      fontSize: 14
                    }}>First name</label>
                    <input style={{ 
                      width: '100%',
                      border: `2px solid ${colors.border}`, 
                      borderRadius: 12, 
                      padding: 14,
                      fontSize: 16,
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }} value={values.firstName} onChange={e => setValues(v => ({ ...v, firstName: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 8, 
                      fontWeight: 600, 
                      color: colors.text,
                      fontSize: 14
                    }}>Last name</label>
                    <input style={{ 
                      width: '100%',
                      border: `2px solid ${colors.border}`, 
                      borderRadius: 12, 
                      padding: 14,
                      fontSize: 16,
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }} value={values.lastName} onChange={e => setValues(v => ({ ...v, lastName: e.target.value }))} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 8, 
                      fontWeight: 600, 
                      color: colors.text,
                      fontSize: 14
                    }}>Email</label>
                    <input style={{ 
                      width: '100%',
                      border: `2px solid ${colors.border}`, 
                      borderRadius: 12, 
                      padding: 14,
                      fontSize: 16,
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }} type="email" value={values.email} onChange={e => setValues(v => ({ ...v, email: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 8, 
                      fontWeight: 600, 
                      color: colors.text,
                      fontSize: 14
                    }}>Phone</label>
                    <input style={{ 
                      width: '100%',
                      border: `2px solid ${colors.border}`, 
                      borderRadius: 12, 
                      padding: 14,
                      fontSize: 16,
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }} type="tel" value={values.phone} onChange={e => setValues(v => ({ ...v, phone: e.target.value }))} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 8, 
                      fontWeight: 600, 
                      color: colors.text,
                      fontSize: 14
                    }}>Check-in date</label>
                    <input style={{ 
                      width: '100%',
                      border: `2px solid ${colors.border}`, 
                      borderRadius: 12, 
                      padding: 14,
                      fontSize: 16,
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }} type="date" value={values.checkInDate} onChange={e => setValues(v => ({ ...v, checkInDate: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 8, 
                      fontWeight: 600, 
                      color: colors.text,
                      fontSize: 14
                    }}>Plan</label>
                    <select style={{ 
                      width: '100%',
                      border: `2px solid ${colors.border}`, 
                      borderRadius: 12, 
                      padding: 14,
                      fontSize: 16,
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }} value={values.stayPlan} onChange={e => setValues(v => ({ ...v, stayPlan: e.target.value }))}>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 8, 
                    fontWeight: 600, 
                    color: colors.text,
                    fontSize: 14
                  }}>Room Selection</label>
                  {loadingRooms ? (
                    <div style={{ 
                      padding: 14, 
                      border: `2px solid ${colors.border}`, 
                      borderRadius: 12,
                      textAlign: 'center',
                      color: colors.muted
                    }}>
                      Loading available rooms...
                    </div>
                  ) : availableRooms.length > 0 ? (
                    <select style={{ 
                      width: '100%',
                      border: `2px solid ${colors.border}`, 
                      borderRadius: 12, 
                      padding: 14,
                      fontSize: 16,
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }} value={values.roomNumber} onChange={e => setValues(v => ({ ...v, roomNumber: e.target.value }))} required>
                      <option value="">Select a room</option>
                      {availableRooms.map(room => (
                        <option key={room.room_number} value={room.room_number}>
                          Room {room.room_number}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ 
                      padding: 14, 
                      border: `2px solid #fecaca`, 
                      borderRadius: 12,
                      background: '#fff1f2',
                      color: '#991b1b'
                    }}>
                      No rooms currently available. Please contact us directly.
                    </div>
                  )}
                </div>
              </form>
            </section>

            {/* Email Verification */}
            <section style={{ 
              background: colors.card, 
              padding: 32, 
              borderRadius: 16,
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ 
                marginTop: 0, 
                fontSize: 24,
                fontWeight: 700,
                color: colors.text,
                marginBottom: 24
              }}>Email Verification {emailVerified && <span style={{ color: '#166534' }}>✓</span>}</h3>
              {!emailVerified ? (
                <>
                  <p>Verify your email address to continue:</p>
                  
                  {values.email && (
                    <div style={{ 
                      background: '#f0f9ff', 
                      padding: 20, 
                      borderRadius: 12, 
                      border: '1px solid #bae6fd', 
                      marginBottom: 20 
                    }}>
                      <p style={{ margin: 0, fontSize: 16, color: '#1e40af', fontWeight: 600 }}>
                        <strong>Email entered:</strong> {values.email}
                      </p>
                      {!emailSent ? (
                        <button 
                          type="button"
                          onClick={() => sendVerificationEmail(values.email)}
                          style={{ 
                            background: colors.primary, 
                            color: '#fff', 
                            padding: '12px 24px', 
                            borderRadius: 8, 
                            fontWeight: 600, 
                            border: 'none', 
                            fontSize: 16, 
                            marginTop: 12,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          Send Verification Code
                        </button>
                      ) : (
                        <div style={{ marginTop: 12 }}>
                          <p style={{ margin: '0 0 12px 0', fontSize: 16, color: '#1e40af', fontWeight: 600 }}>
                            ✓ Verification email sent! Check your inbox.
                          </p>
                          <button 
                            type="button"
                            onClick={() => sendVerificationEmail(values.email)}
                            style={{ 
                              background: 'transparent', 
                              color: colors.primary, 
                              padding: '12px 24px', 
                              borderRadius: 8, 
                              fontWeight: 600, 
                              border: `2px solid ${colors.primary}`, 
                              fontSize: 16,
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            Resend Code
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {emailSent && (
                    <form onSubmit={verifyEmail} style={{ display: 'grid', gap: 20 }}>
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: 8, 
                          fontWeight: 600, 
                          color: colors.text,
                          fontSize: 14
                        }}>Verification Code</label>
                        <input style={{ 
                          width: '100%',
                          border: `2px solid ${colors.border}`, 
                          borderRadius: 12, 
                          padding: 14,
                          fontSize: 16,
                          transition: 'all 0.3s ease',
                          boxSizing: 'border-box'
                        }} value={emailCode} onChange={e => setEmailCode(e.target.value)} placeholder="Enter 6-digit code" required />
                      </div>
                      <button type="submit" style={{ 
                        background: colors.primary, 
                        color: '#fff', 
                        padding: '16px 32px', 
                        borderRadius: 12, 
                        fontWeight: 700,
                        fontSize: 16,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        alignSelf: 'start'
                      }}>Verify Email</button>
                    </form>
                  )}
                </>
              ) : (
                <p style={{ color: '#166534', background: '#f0fdf4', padding: 8, borderRadius: 4, border: '1px solid #bbf7d0' }}>✓ Email verified successfully</p>
              )}
            </section>

            {/* ID Verification */}
            <section style={{ 
              background: colors.card, 
              padding: 32, 
              borderRadius: 16,
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ 
                marginTop: 0, 
                fontSize: 24,
                fontWeight: 700,
                color: colors.text,
                marginBottom: 24
              }}>Identity Verification {idVerified && <span style={{ color: '#166534' }}>✓</span>}</h3>
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
                        padding: '16px 32px', 
                        borderRadius: 12, 
                        fontWeight: 700,
                        border: 'none',
                        cursor: (!values.firstName || !values.lastName || !values.email) ? 'not-allowed' : 'pointer',
                        fontSize: 16,
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)'
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
                padding: '20px 40px', 
                borderRadius: 16, 
                fontWeight: 700,
                fontSize: 18,
                border: 'none',
                cursor: (!emailVerified || !idVerified) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: (!emailVerified || !idVerified) ? 'none' : '0 8px 25px -8px rgba(220, 38, 38, 0.4)',
                alignSelf: 'center',
                justifySelf: 'center'
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