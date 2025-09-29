export default function Home() {
  if (typeof window !== 'undefined') {
    window.location.replace('/miami');
  }
  return null;
}


