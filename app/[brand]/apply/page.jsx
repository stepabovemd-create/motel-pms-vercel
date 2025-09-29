"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ApplyPage({ params }) {
  const router = useRouter();
  const [values, setValues] = useState({ firstName: '', lastName: '', email: '', phone: '', checkInDate: '', stayPlan: 'weekly' });
  const [errors, setErrors] = useState([]);

  async function onSubmit(e) {
    e.preventDefault();
    setErrors([]);
    const res = await fetch(`/api/applications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, brandKey: params.brand }) });
    const json = await res.json();
    if (!res.ok) { setErrors(json.errors || ['Failed to submit']); return; }
    router.push(`/success`);
  }

  return (
    <div>
      <h2>Guest Application ({params.brand})</h2>
      {errors.length ? (<div style={{ background: '#fff1f2', padding: 12, borderRadius: 6 }}><ul>{errors.map(e => <li key={e}>{e}</li>)}</ul></div>) : null}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>First name<input value={values.firstName} onChange={e => setValues(v => ({ ...v, firstName: e.target.value }))} required /></label>
          <label>Last name<input value={values.lastName} onChange={e => setValues(v => ({ ...v, lastName: e.target.value }))} required /></label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>Email<input type="email" value={values.email} onChange={e => setValues(v => ({ ...v, email: e.target.value }))} required /></label>
          <label>Phone<input value={values.phone} onChange={e => setValues(v => ({ ...v, phone: e.target.value }))} required /></label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>Check-in date<input type="date" value={values.checkInDate} onChange={e => setValues(v => ({ ...v, checkInDate: e.target.value }))} required /></label>
          <label>Plan<select value={values.stayPlan} onChange={e => setValues(v => ({ ...v, stayPlan: e.target.value }))}><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
        </div>
        <button type="submit" style={{ background: '#222', color: '#fff', padding: '.5rem .75rem', borderRadius: 6 }}>Submit</button>
      </form>
    </div>
  );
}


