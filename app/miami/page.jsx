import Link from 'next/link';

export const metadata = { title: 'Miami Motel | Cleves, OH' };

export default function MiamiLanding() {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
      <section style={{ background: '#ff1a1a', color: '#fff', padding: '48px 16px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: 40 }}>Miami Motel</h1>
          <p style={{ marginTop: 8, fontSize: 18 }}>109 North Miami Avenue, Cleves, OH 45002</p>
          <p style={{ marginTop: 4, fontSize: 18 }}>Furnished rooms for extended stays — weekly and monthly rates.</p>
          <div style={{ marginTop: 16 }}>
            <Link href="/miami/apply" style={{ background: '#fff', color: '#ff1a1a', padding: '10px 14px', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>Start Application</Link>
          </div>
        </div>
      </section>

      <section style={{ background: '#fff', color: '#111', padding: '32px 16px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 16 }}>
          <h2 style={{ margin: 0 }}>Why stay with us</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>Clean, furnished rooms</li>
            <li>Weekly and monthly rates</li>
            <li>Convenient Cleves, OH location</li>
          </ul>
          <div style={{ marginTop: 8 }}>
            <a href="tel:15134292251" style={{ color: '#ff1a1a', fontWeight: 600 }}>Call: 513-429-2251</a>
          </div>
        </div>
      </section>
    </div>
  );
}


