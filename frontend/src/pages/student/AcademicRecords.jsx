import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, Loading, Stat } from '../../components/ui.jsx';
import { TrendingUp, BookOpen } from 'lucide-react';

export default function AcademicRecords() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/academic/records').then(r => setData(r.data)); }, []);
  if (!data) return <Loading />;

  const groups = {};
  data.records.forEach(r => { groups[r.semester] = groups[r.semester] || []; groups[r.semester].push(r); });

  return (
    <>
      <PageHeader title="Academic Records" subtitle="Your grades, credits and CGPA." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="CGPA" value={data.cgpa} icon={TrendingUp} />
        <Stat label="Records" value={data.records.length} icon={BookOpen} />
        <Stat label="Credits" value={data.records.reduce((s,r) => s + Number(r.credits || 0), 0)} />
        <Stat label="Semesters" value={Object.keys(groups).length} />
      </div>
      {Object.entries(groups).map(([sem, rows]) => (
        <div key={sem} className="mb-6">
          <Card title={`Semester: ${sem}`}>
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Course</th><th>Name</th><th>Credits</th><th>Grade</th><th>Grade Point</th></tr></thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.record_id}>
                      <td className="font-mono font-medium">{r.course_code}</td>
                      <td>{r.course_name || '—'}</td>
                      <td>{r.credits}</td>
                      <td><span className="badge-blue">{r.grade}</span></td>
                      <td>{r.grade_point}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ))}
    </>
  );
}
