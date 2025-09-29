import Header from '../components/Header';

export const metadata = { title: 'Miami Motel · Extended Stay in Cleves, OH' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', color: '#0f172a', margin: 0 }}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}


