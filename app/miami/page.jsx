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
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', color: colors.text }}>

      <section style={{ background: `linear-gradient(180deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`, color: '#fff', padding: '56px 16px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ letterSpacing: 1, textTransform: 'uppercase', opacity: .9, margin: 0 }}>Cleves · Extended Stay</p>
          <h1 style={{ margin: '8px 0 0 0', fontSize: 40, lineHeight: 1.1 }}>Affordable extended stays in Cleves</h1>
          <p style={{ marginTop: 10, fontSize: 18, opacity: .95 }}>Furnished rooms · Weekly & monthly rates · Simple, safe, convenient.</p>
          <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
            <Link href="/miami/apply" style={{ background: '#fff', color: colors.primary, padding: '10px 14px', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>Apply / Manage & Pay</Link>
            <a href="#amenities" style={{ background: 'transparent', color: '#fff', padding: '10px 14px', borderRadius: 8, textDecoration: 'none', border: '1px solid rgba(255,255,255,.6)' }}>See amenities</a>
          </div>
        </div>
      </section>

      <section style={{ background: colors.panel, padding: '28px 16px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: colors.panelAlt, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 14, color: colors.muted }}>Address</div>
              <div style={{ fontWeight: 600 }}>109 North Miami Avenue, Cleves, OH 45002</div>
            </div>
            <div style={{ background: colors.panelAlt, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 14, color: colors.muted }}>Call</div>
              <a href="tel:15134292251" style={{ fontWeight: 600, color: colors.primary, textDecoration: 'none' }}>513-429-2251</a>
            </div>
          </div>
        </div>
      </section>

      <section id="amenities" style={{ background: colors.panelAlt, padding: '36px 16px', borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ marginTop: 0 }}>Why stay with us</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Feature title="Extended stays" desc="Weekly & monthly options for longer-term guests." />
            <Feature title="Accessible & affordable" desc="Straightforward pricing that fits your budget." />
            <Feature title="Furnished rooms" desc="Comfortable rooms equipped for extended stays." />
            <Feature title="On-site parking" desc="Convenient access during your stay." />
          </div>
        </div>
      </section>

      <footer style={{ padding: '20px 16px', background: colors.panel, color: colors.muted, borderTop: `1px solid ${colors.border}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <small>© {new Date().getFullYear()} Miami Motel · All rights reserved.</small>
          <Link href="/miami/apply" style={{ color: colors.primary, textDecoration: 'none', fontWeight: 600 }}>Apply / Pay</Link>
        </div>
      </footer>
    </div>
  );
}

function Feature({ title, desc }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      <div style={{ color: '#475569', marginTop: 6 }}>{desc}</div>
    </div>
  );
}


