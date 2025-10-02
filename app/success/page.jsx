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

  const colors = { 
    primary: '#dc2626', 
    primaryDark: '#b91c1c',
    muted: '#475569',
    background: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a'
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: colors.background,
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 16px' }}>
        <section style={{ 
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', 
          color: '#fff', 
          padding: '60px 32px', 
          borderRadius: 16, 
          marginBottom: 40,
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center'
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
          <div style={{ position: 'relative' }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.1
            }}>Payment Successful!</h1>
            <p style={{ 
              margin: '16px 0 0 0', 
              opacity: 0.95,
              fontSize: 18
            }}>Thank you for choosing Miami Motel</p>
          </div>
        </section>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p>Loading payment details...</p>
          </div>
        ) : sessionId && paymentData ? (
          <div style={{ display: 'grid', gap: 32 }}>
            {/* Payment Confirmation */}
            <div style={{ 
              background: '#f0fdf4', 
              padding: 32, 
              borderRadius: 16, 
              border: '1px solid #bbf7d0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ 
                marginTop: 0, 
                color: '#166534',
                fontSize: 24,
                fontWeight: 700
              }}>✓ Payment Confirmed</h3>
              <p style={{ 
                color: '#166534', 
                margin: 0,
                fontSize: 16,
                lineHeight: 1.6
              }}>Your payment has been processed successfully. You will receive a confirmation email shortly.</p>
            </div>

            {/* Receipt */}
            <div style={{ 
              background: colors.card, 
              padding: 32, 
              borderRadius: 16, 
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ 
                marginTop: 0, 
                color: colors.primary,
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 24
              }}>Payment Receipt</h3>
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '12px 0',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <span style={{ color: colors.muted, fontWeight: 600 }}>Customer:</span>
                  <span style={{ fontWeight: 600 }}>{paymentData.customerName}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <span style={{ color: colors.muted, fontWeight: 600 }}>Email:</span>
                  <span>{paymentData.customerEmail}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <span style={{ color: colors.muted, fontWeight: 600 }}>Plan:</span>
                  <span style={{ fontWeight: 600 }}>{paymentData.plan === 'weekly' ? 'Weekly' : 'Monthly'}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <span style={{ color: colors.muted, fontWeight: 600 }}>Amount Paid:</span>
                  <span style={{ fontWeight: 700, fontSize: 18, color: colors.primary }}>${paymentData.amount}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '12px 0'
                }}>
                  <span style={{ color: colors.muted, fontWeight: 600 }}>Payment Date:</span>
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
            <div style={{ 
              background: '#fef3c7', 
              padding: 32, 
              borderRadius: 16, 
              border: '1px solid #f59e0b',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ 
                marginTop: 0, 
                color: '#92400e',
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 16
              }}>Next Payment Due</h3>
              <p style={{ 
                color: '#92400e', 
                margin: 0,
                fontSize: 16,
                lineHeight: 1.6
              }}>
                Your next payment of <strong style={{ fontSize: 18 }}>${paymentData.amount}</strong> is due on{' '}
                <strong>{getNextPaymentDate(paymentData.plan)}</strong>
              </p>
              <p style={{ 
                color: '#92400e', 
                fontSize: 14, 
                margin: '12px 0 0 0',
                opacity: 0.8
              }}>
                We'll send you email reminders 1-2 days before your payment is due.
              </p>
            </div>

            {/* Contact Info */}
            <div style={{ 
              background: '#f0f9ff', 
              padding: 32, 
              borderRadius: 16, 
              border: '1px solid #bae6fd',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ 
                marginTop: 0, 
                color: '#1e40af',
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 16
              }}>Need Help?</h3>
              <p style={{ color: '#1e40af', margin: 0, fontSize: 16 }}>
                Miami Motel • 109 North Miami Avenue, Cleves, OH 45002
              </p>
              <p style={{ color: '#1e40af', margin: '8px 0 0 0', fontSize: 16 }}>
                Phone: <a href="tel:513-429-2251" style={{ color: '#1e40af', fontWeight: 600 }}>513-429-2251</a>
              </p>
            </div>
          </div>
        ) : (
          <div style={{ 
            background: '#fef3c7', 
            padding: 32, 
            borderRadius: 16, 
            border: '1px solid #f59e0b',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ 
              marginTop: 0, 
              color: '#92400e',
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 16
            }}>Complete Your Application</h3>
            <p style={{ 
              color: '#92400e', 
              marginBottom: 24,
              fontSize: 16
            }}>Please complete your application and verification to proceed to payment.</p>
            <a href="/miami/apply" style={{ 
              background: colors.primary, 
              color: '#fff', 
              padding: '16px 32px', 
              borderRadius: 12, 
              fontWeight: 700, 
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)'
            }}>Start Application</a>
          </div>
        )}

        <div style={{ 
          marginTop: 40, 
          textAlign: 'center' 
        }}>
          <a href="/miami" style={{ 
            color: colors.primary, 
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 16,
            padding: '12px 24px',
            border: '2px solid ' + colors.primary,
            borderRadius: 8,
            display: 'inline-block',
            transition: 'all 0.3s ease'
          }}>Back to Miami Motel</a>
        </div>
      </div>
    </div>
  );
}