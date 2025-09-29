import Link from 'next/link';

const BRANDS = ['beachside', 'downtown', 'highway', 'airport'];

export default function Home() {
  return (
    <div>
      <h1>Choose Location</h1>
      <ul>
        {BRANDS.map(b => (
          <li key={b}><Link href={`/${b}`}>{b}</Link></li>
        ))}
      </ul>
    </div>
  );
}


