import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, Loading, Empty } from '../../components/ui.jsx';

export default function Exams() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get('/courses/exams').then(r => setRows(r.data)); }, []);
  if (!rows) return <Loading />;

  return (
    <>
      <PageHeader title="Exam Schedule" subtitle="Your exam dates, times and room allocations." />
      <Card>
        {rows.length === 0 ? <Empty title="No exams scheduled" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Course</th><th>Type</th><th>Date</th><th>Time</th><th>Duration</th><th>Room</th></tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.exam_id}>
                    <td className="font-medium">{r.course_id} — {r.course_name}</td>
                    <td><span className="badge-blue">{r.exam_type}</span></td>
                    <td>{new Date(r.exam_day).toLocaleDateString()}</td>
                    <td>{r.start_time || '—'}</td>
                    <td>{r.duration_minutes} min</td>
                    <td>{r.exam_room_number || '—'}</td>
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
