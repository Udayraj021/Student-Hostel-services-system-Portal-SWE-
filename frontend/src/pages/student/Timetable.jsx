import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, Loading, Empty } from '../../components/ui.jsx';

export default function Timetable() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get('/courses/timetable').then(r => setRows(r.data)); }, []);
  if (!rows) return <Loading />;

  return (
    <>
      <PageHeader title="Timetable" subtitle="Your personalised class schedule for the current semester." />
      <Card>
        {rows.length === 0 ? <Empty title="No courses enrolled" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Course ID</th><th>Course Name</th><th>Slot</th><th>Credits</th><th>Professor</th><th>Semester</th></tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.course_id}>
                    <td className="font-mono font-medium">{r.course_id}</td>
                    <td>{r.course_name}</td>
                    <td>{r.class_slot}</td>
                    <td>{r.credits}</td>
                    <td>{r.professor_name || '—'}</td>
                    <td>{r.semester}</td>
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
