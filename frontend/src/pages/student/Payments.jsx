import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, StatusBadge, Loading, Empty } from '../../components/ui.jsx';

export default function Payments() {
  const [items, setItems] = useState(null);
  useEffect(() => { api.get('/payments/history').then(r => setItems(r.data)); }, []);
  if (!items) return <Loading />;

  return (
    <>
      <PageHeader title="Payments" subtitle="Your payment history for ID cards, events and other services." />
      <Card>
        {items.length === 0 ? <Empty title="No payments" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Payment ID</th><th>Purpose</th><th>Amount</th><th>Status</th><th>Txn ID</th><th>Paid at</th></tr></thead>
              <tbody>
                {items.map(p => (
                  <tr key={p.payment_id}>
                    <td className="font-mono text-xs">{p.payment_id}</td>
                    <td>{p.purpose}</td>
                    <td>₹{p.amount}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="font-mono text-xs">{p.transaction_id || '—'}</td>
                    <td>{p.paid_at ? new Date(p.paid_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
