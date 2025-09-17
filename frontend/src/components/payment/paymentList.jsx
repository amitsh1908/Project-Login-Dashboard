// src/components/PaymentsList.jsx
import React, { useEffect, useState } from 'react';

export default function PaymentsList({ initialPage = 1, pageSize = 50 }) {
  const [payments, setPayments] = useState([]);
  const [meta, setMeta] = useState({ page: initialPage, limit: pageSize, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPayments = async (page = initialPage) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5001/api/payments?page=${page}&limit=${pageSize}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch payments: ${res.status} ${text}`);
      }
      const body = await res.json();
      if (!body.success) throw new Error(body.message || 'Failed to fetch payments');
      setPayments(body.data || []);
      setMeta(body.meta || { page, limit: pageSize, total: (body.data || []).length });
    } catch (err) {
      console.error('PaymentsList fetch error:', err);
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(initialPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      const dt = new Date(iso);
      return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(dt);
    } catch {
      return iso;
    }
  };

  const handleNext = () => {
    const next = meta.page + 1;
    if ((next - 1) * meta.limit >= meta.total) return;
    fetchPayments(next);
  };
  const handlePrev = () => {
    const prev = Math.max(1, meta.page - 1);
    if (prev === meta.page) return;
    fetchPayments(prev);
  };

  return (
    <div style={{ padding: 12, background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <h3 style={{ marginTop: 0 }}>Payments</h3>

      {loading && <div>Loading payments...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {!loading && !error && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '8px 6px' }}>#</th>
                <th style={{ padding: '8px 6px' }}>Order ID</th>
                <th style={{ padding: '8px 6px' }}>Payment ID</th>
                <th style={{ padding: '8px 6px' }}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 12 }}>No payments found.</td>
                </tr>
              )}
              {payments.map((p, idx) => (
                <tr key={p._id} style={{ borderBottom: '1px solid #fafafa' }}>
                  <td style={{ padding: '8px 6px' }}>{(meta.page - 1) * meta.limit + idx + 1}</td>
                  <td style={{ padding: '8px 6px', fontFamily: 'monospace' }}>{p.razorpay_order_id}</td>
                  <td style={{ padding: '8px 6px', fontFamily: 'monospace' }}>{p.razorpay_payment_id}</td>
                  <td style={{ padding: '8px 6px' }}>{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <div>Showing {payments.length} of {meta.total}</div>
            <div>
              <button onClick={handlePrev} disabled={meta.page <= 1} style={{ marginRight: 8 }}>Prev</button>
              <button onClick={handleNext} disabled={(meta.page * meta.limit) >= meta.total}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}