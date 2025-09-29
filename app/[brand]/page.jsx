import Link from 'next/link';

export default function BrandPage({ params }) {
  const brand = params.brand;
  return (
    <div>
      <h1>Welcome to {brand}</h1>
      <p>Comfortable rooms, flexible stays. Start your application to secure your room.</p>
      <Link href={`/${brand}/apply`} style={{ background: '#222', color: '#fff', padding: '.5rem .75rem', borderRadius: 6 }}>Start Application</Link>
    </div>
  );
}


