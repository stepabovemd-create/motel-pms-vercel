import Link from 'next/link';

export const metadata = { title: 'Miami Motel · Extended Stay in Cleves, OH' };

const colors = {
  primary: '#dc2626', // softer red
  primaryDark: '#b91c1c',
  text: '#0f172a',
  muted: '#475569',
  panel: '#ffffff',
  panelAlt: '#f8fafc',
  border: '#e5e7eb',
};

export default function MiamiLanding() {
  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 
      color: colors.text,
      lineHeight: 1.6
    }}>

      <section style={{ 
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`, 
        color: '#fff', 
        padding: '80px 16px',
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
          <div style={{ 
            letterSpacing: 2, 
            textTransform: 'uppercase', 
            opacity: 0.9, 
            margin: 0, 
            fontSize: 14,
            fontWeight: 600
          }}>Cleves · Extended Stay</div>
          <h1 style={{ 
            margin: '16px 0 0 0', 
            fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
            lineHeight: 1.1,
            fontWeight: 800,
            letterSpacing: '-0.02em'
          }}>Affordable extended stays in Cleves</h1>
          <p style={{ 
            marginTop: 24, 
            fontSize: 20, 
            opacity: 0.95,
            maxWidth: '600px',
            fontWeight: 400
          }}>Furnished rooms · Weekly & monthly rates · Simple, safe, convenient.</p>
          <div style={{ 
            marginTop: 32, 
            display: 'flex', 
            gap: 16,
            flexWrap: 'wrap'
          }}>
            <Link href="/miami/apply" style={{ 
              background: '#fff', 
              color: colors.primary, 
              padding: '16px 32px', 
              borderRadius: 12, 
              textDecoration: 'none', 
              fontWeight: 700,
              fontSize: 16,
              boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              border: 'none',
              display: 'inline-block'
            }}>Apply / Manage & Pay</Link>
            <Link href="/customer-portal" style={{ 
              background: 'transparent', 
              color: '#fff', 
              padding: '16px 32px', 
              borderRadius: 12, 
              textDecoration: 'none', 
              border: '2px solid rgba(255,255,255,0.3)',
              fontWeight: 600,
              fontSize: 16,
              transition: 'all 0.3s ease',
              display: 'inline-block'
            }}>Customer Portal</Link>
            <a href="#amenities" style={{ 
              background: 'transparent', 
              color: '#fff', 
              padding: '16px 32px', 
              borderRadius: 12, 
              textDecoration: 'none', 
              border: '2px solid rgba(255,255,255,0.3)',
              fontWeight: 600,
              fontSize: 16,
              transition: 'all 0.3s ease',
              display: 'inline-block'
            }}>See amenities</a>
          </div>
        </div>
      </section>

      <section style={{ background: colors.panel, padding: '60px 16px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div style={{ 
              background: '#fff', 
              border: `1px solid ${colors.border}`, 
              borderRadius: 16, 
              padding: 32,
              boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ 
                fontSize: 14, 
                color: colors.muted, 
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontWeight: 600,
                marginBottom: 8
              }}>Address</div>
              <div style={{ fontWeight: 600, fontSize: 16, lineHeight: 1.5 }}>109 North Miami Avenue, Cleves, OH 45002</div>
            </div>
            <div style={{ 
              background: '#fff', 
              border: `1px solid ${colors.border}`, 
              borderRadius: 16, 
              padding: 32,
              boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ 
                fontSize: 14, 
                color: colors.muted, 
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontWeight: 600,
                marginBottom: 8
              }}>Call</div>
              <a href="tel:15134292251" style={{ 
                fontWeight: 600, 
                color: colors.primary, 
                textDecoration: 'none',
                fontSize: 16
              }}>513-429-2251</a>
            </div>
          </div>
        </div>
      </section>

      <section id="amenities" style={{ 
        background: colors.panelAlt, 
        padding: '80px 16px'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ 
              marginTop: 0, 
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: colors.text
            }}>Why stay with us</h2>
            <p style={{ 
              fontSize: 18, 
              color: colors.muted, 
              maxWidth: '600px', 
              margin: '16px auto 0',
              lineHeight: 1.6
            }}>Everything you need for a comfortable extended stay in Cleves</p>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 24 
          }}>
            <Feature title="Extended stays" desc="Weekly & monthly options for longer-term guests." />
            <Feature title="Accessible & affordable" desc="Straightforward pricing that fits your budget." />
            <Feature title="Furnished rooms" desc="Comfortable rooms equipped for extended stays." />
            <Feature title="On-site parking" desc="Convenient access during your stay." />
          </div>
        </div>
      </section>

      <footer style={{ 
        padding: '40px 16px', 
        background: '#1e293b', 
        color: '#94a3b8'
      }}>
        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ fontSize: 14 }}>© {new Date().getFullYear()} Miami Motel · All rights reserved.</div>
          <Link href="/miami/apply" style={{ 
            color: '#fff', 
            textDecoration: 'none', 
            fontWeight: 600,
            background: colors.primary,
            padding: '12px 24px',
            borderRadius: 8,
            transition: 'all 0.3s ease'
          }}>Apply / Pay</Link>
        </div>
      </footer>
    </div>
  );
}

function Feature({ title, desc }) {
  return (
    <div style={{ 
      background: '#fff', 
      border: '1px solid #e5e7eb', 
      borderRadius: 16, 
      padding: 32,
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ 
        background: `linear-gradient(135deg, ${colors.primary}15, ${colors.primaryDark}10)`,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none'
      }} />
      <div style={{ 
        fontWeight: 700, 
        fontSize: 18,
        color: colors.text,
        marginBottom: 12,
        position: 'relative'
      }}>{title}</div>
      <div style={{ 
        color: '#475569', 
        lineHeight: 1.6,
        position: 'relative'
      }}>{desc}</div>
    </div>
  );
}


