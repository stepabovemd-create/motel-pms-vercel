"use client";
import React, { useState, useEffect } from 'react';

export default function CustomerPortal() {
  const [email, setEmail] = useState('');
  const [guestData, setGuestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const colors = { 
    primary: '#dc2626', 
    primaryDark: '#b91c1c',
    muted: '#475569',
    background: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a'
  };

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Fetching guest data for:', email);
      // Add cache-busting parameter to force fresh data
      const response = await fetch(`/api/guests/payments?email=${encodeURIComponent(email)}&t=${Date.now()}`);
      const data = await response.json();
      
      console.log('=== CUSTOMER PORTAL DEBUG ===');
      console.log('API response:', data);
      console.log('Guest data:', data.guest);
      console.log('Account balance:', data.guest?.accountBalance, '($' + ((data.guest?.accountBalance || 0) / 100) + ')');
      console.log('Next payment amount:', data.guest?.nextPaymentAmount, '($' + ((data.guest?.nextPaymentAmount || 0) / 100) + ')');
      console.log('=== END DEBUG ===');

      if (response.ok && data.guest) {
        setGuestData({
          ...data.guest,
          payments: data.payments || [],
          totalPayments: (data.payments || []).length
        });
        setIsLoggedIn(true);
        console.log('Guest data set:', {
          ...data.guest,
          payments: data.payments || [],
          totalPayments: (data.payments || []).length
        });
      } else {
        setError('No payment history found for this email address. Please use the application form to make your first payment.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to load your account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment(amount = null) {
    if (!guestData) return;
    
    setPaymentLoading(true);
    setError('');
    
    try {
      const paymentAmount = amount || customAmount;
      if (!paymentAmount || isNaN(parseFloat(paymentAmount))) {
        setError('Please enter a valid payment amount.');
        setPaymentLoading(false);
        return;
      }

      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: guestData.email,
          name: guestData.name,
          plan: guestData.currentPlan,
          customAmount: parseFloat(paymentAmount)
        })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Failed to start payment process. Please try again.');
      }
    } catch (err) {
      setError('Failed to start payment process. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: colors.background,
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 16px' }}>
        
        {/* Header */}
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
            }}>Customer Portal</h1>
            <p style={{ 
              margin: '16px 0 0 0', 
              opacity: 0.95,
              fontSize: 18
            }}>Manage your Miami Motel account</p>
          </div>
        </section>

        {!isLoggedIn ? (
          /* Login Form */
          <div style={{ 
            background: colors.card, 
            padding: 40, 
            borderRadius: 16,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            maxWidth: 500,
            margin: '0 auto'
          }}>
            <h2 style={{ 
              marginTop: 0, 
              fontSize: 24,
              fontWeight: 700,
              color: colors.text,
              marginBottom: 24,
              textAlign: 'center'
            }}>Access Your Account</h2>
            
            {error && (
              <div style={{ 
                background: '#fff1f2', 
                padding: 16, 
                borderRadius: 8, 
                color: '#991b1b', 
                border: '1px solid #fecaca',
                marginBottom: 24
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleEmailSubmit} style={{ display: 'grid', gap: 20 }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontWeight: 600, 
                  color: colors.text,
                  fontSize: 14
                }}>Email Address</label>
                <input 
                  style={{ 
                    width: '100%',
                    border: '2px solid #e5e7eb', 
                    borderRadius: 12, 
                    padding: 14,
                    fontSize: 16,
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }} 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="Enter your email address"
                  required 
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  background: loading ? '#9ca3af' : colors.primary, 
                  color: '#fff', 
                  padding: '16px 32px', 
                  borderRadius: 12, 
                  fontWeight: 700,
                  fontSize: 16,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? 'Loading...' : 'Access Account'}
              </button>
            </form>

            <div style={{ 
              marginTop: 24, 
              textAlign: 'center',
              padding: 20,
              background: '#f0f9ff',
              borderRadius: 8,
              border: '1px solid #bae6fd'
            }}>
              <p style={{ margin: 0, fontSize: 14, color: '#1e40af' }}>
                <strong>New to Miami Motel?</strong> Use our{' '}
                <a href="/miami/apply" style={{ color: colors.primary, fontWeight: 600 }}>
                  application form
                </a>{' '}
                to get started.
              </p>
            </div>
          </div>
        ) : (
          /* Customer Dashboard */
          <div style={{ display: 'grid', gap: 32 }}>
            
            {/* Account Summary */}
            <div style={{ 
              background: colors.card, 
              padding: 32, 
              borderRadius: 16,
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ 
                marginTop: 0, 
                fontSize: 24,
                fontWeight: 700,
                color: colors.text,
                marginBottom: 24
              }}>Account Summary</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 14, color: colors.muted, fontWeight: 600, marginBottom: 4 }}>Customer</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{guestData.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, color: colors.muted, fontWeight: 600, marginBottom: 4 }}>Email</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{guestData.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, color: colors.muted, fontWeight: 600, marginBottom: 4 }}>Current Plan</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{guestData.currentPlan === 'weekly' ? 'Weekly' : 'Monthly'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, color: colors.muted, fontWeight: 600, marginBottom: 4 }}>Total Payments</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{guestData.totalPayments}</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, color: colors.muted, fontWeight: 600, marginBottom: 4 }}>
                    {guestData.accountBalance >= 0 ? 'Account Credit' : 'Balance Due'}
                  </div>
                  <div style={{ 
                    fontSize: 18, 
                    fontWeight: 700,
                    color: guestData.accountBalance >= 0 ? '#166534' : '#dc2626'
                  }}>
                    {formatCurrency(Math.abs(guestData.accountBalance) / 100)}
                  </div>
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
              }}>Make a Payment</h3>
              <p style={{ 
                color: '#92400e', 
                margin: 0,
                fontSize: 16,
                lineHeight: 1.6
              }}>
                {guestData.nextPaymentAmount > 0 ? (
                  <>
                    Your next payment of <strong style={{ fontSize: 18 }}>
                      {formatCurrency(guestData.nextPaymentAmount / 100)}
                    </strong> is due on{' '}
                    <strong>{formatDate(guestData.nextPaymentDue)}</strong>
                  </>
                ) : (
                  <>
                    <strong style={{ color: '#166534' }}>No payment due!</strong> You have sufficient credit to cover your next period.
                    <br />
                    Next due date: <strong>{formatDate(guestData.nextPaymentDue)}</strong>
                  </>
                )}
              </p>
              
              <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button 
                  onClick={() => handlePayment(guestData.nextPaymentAmount / 100)}
                  disabled={paymentLoading || guestData.nextPaymentAmount <= 0}
                  style={{ 
                    background: (paymentLoading || guestData.nextPaymentAmount <= 0) ? '#9ca3af' : colors.primary, 
                    color: '#fff', 
                    padding: '12px 24px', 
                    borderRadius: 8, 
                    fontWeight: 600,
                    fontSize: 14,
                    border: 'none',
                    cursor: (paymentLoading || guestData.nextPaymentAmount <= 0) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {guestData.nextPaymentAmount > 0 ? 
                    `Pay Due Amount (${formatCurrency(guestData.nextPaymentAmount / 100)})` : 
                    'No Payment Due'
                  }
                </button>
                
                <button 
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                  style={{ 
                    background: 'transparent', 
                    color: '#92400e', 
                    padding: '12px 24px', 
                    borderRadius: 8, 
                    fontWeight: 600,
                    fontSize: 14,
                    border: '2px solid #f59e0b',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Custom Amount
                </button>
              </div>

              {showPaymentForm && (
                <div style={{ 
                  marginTop: 20, 
                  padding: 20, 
                  background: '#fef7cd', 
                  borderRadius: 8,
                  border: '1px solid #f59e0b'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#92400e', fontSize: 16 }}>
                    Enter Custom Payment Amount
                  </h4>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ color: '#92400e', fontWeight: 600 }}>$</span>
                    <input 
                      type="number"
                      value={customAmount}
                      onChange={e => setCustomAmount(e.target.value)}
                      placeholder="0.00"
                      style={{
                        border: '2px solid #f59e0b',
                        borderRadius: 6,
                        padding: '8px 12px',
                        fontSize: 16,
                        width: 120
                      }}
                    />
                    <button 
                      onClick={() => handlePayment()}
                      disabled={paymentLoading || !customAmount}
                      style={{ 
                        background: (paymentLoading || !customAmount) ? '#9ca3af' : colors.primary, 
                        color: '#fff', 
                        padding: '8px 16px', 
                        borderRadius: 6, 
                        fontWeight: 600,
                        fontSize: 14,
                        border: 'none',
                        cursor: (paymentLoading || !customAmount) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {paymentLoading ? 'Processing...' : 'Pay Now'}
                    </button>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#92400e', opacity: 0.8 }}>
                    Pay more for credit, or pay less (you'll carry a balance)
                  </p>
                </div>
              )}
            </div>

            {/* Payment History */}
            <div style={{ 
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
              }}>Payment History</h3>
              
              <div style={{ display: 'grid', gap: 16 }}>
                {guestData.payments && guestData.payments.map((payment, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: '1px solid #f1f5f9'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>
                        {formatCurrency(payment.amount / 100)} - {payment.plan === 'weekly' ? 'Weekly' : 'Monthly'}
                      </div>
                      <div style={{ fontSize: 14, color: colors.muted }}>
                        {formatDate(payment.payment_date)}
                      </div>
                      <div style={{ fontSize: 12, color: colors.muted }}>
                        Session: {payment.session_id?.slice(-8) || 'N/A'}
                      </div>
                    </div>
                    <div style={{ 
                      background: '#f0fdf4', 
                      color: '#166534',
                      padding: '4px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      ✓ Paid
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Logout */}
            <div style={{ textAlign: 'center' }}>
              <button 
                onClick={() => {
                  setIsLoggedIn(false);
                  setGuestData(null);
                  setEmail('');
                }}
                style={{ 
                  color: colors.muted, 
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  textDecoration: 'underline'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          marginTop: 40, 
          textAlign: 'center' 
        }}>
          <a href="/miami" style={{ 
            color: colors.primary, 
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 16
          }}>← Back to Miami Motel</a>
        </div>
      </div>
    </div>
  );
}
