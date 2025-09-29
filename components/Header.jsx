import Link from 'next/link';

const colors = {
  primary: '#dc2626',
  muted: '#475569',
  border: '#e5e7eb',
  panel: '#ffffff',
};

export default function Header() {
  return (
    <header style={{ borderBottom: `1px solid ${colors.border}`, background: colors.panel }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/miami" style={{ color: colors.primary, textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>Miami Motel</Link>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link href="/miami/apply" style={{ color: colors.primary, textDecoration: 'none', fontWeight: 600 }}>Apply / Pay</Link>
          <a href="tel:15134292251" style={{ color: colors.muted, textDecoration: 'none' }}>513-429-2251</a>
        </nav>
      </div>
    </header>
  );
}
