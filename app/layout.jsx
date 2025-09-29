export const metadata = { title: 'Motel PMS' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', color: '#222' }}>
        <header style={{ borderBottom: '4px solid #222', padding: '1rem' }}>
          <strong>Motel PMS</strong>
        </header>
        <main style={{ maxWidth: 960, margin: '0 auto', padding: '1rem' }}>{children}</main>
      </body>
    </html>
  );
}


