import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, Stat, Loading, Empty } from '../../components/ui.jsx';
import { BookOpen, Users2, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProfessorDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState(null);
  const [exams, setExams] = useState([]);

  useEffect(() => {
    (async () => {
      const [c, e] = await Promise.all([api.get('/courses'), api.get('/courses/exams')]);
      setCourses(c.data.filter(co => co.professor_id === user.loginId));
      setExams(e.data);
    })();
  }, [user.loginId]);

  if (!courses) return <Loading />;
  const myCourseIds = new Set(courses.map(c => c.course_id));
  const myExams = exams.filter(e => myCourseIds.has(e.course_id));

  return (
    <>
      <PageHeader title="Faculty dashboard" subtitle={`Welcome, ${user.name}. Manage your courses and exams.`} />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Stat label="Courses teaching" value={courses.length} icon={BookOpen} />
        <Stat label="Total credits" value={courses.reduce((s, c) => s + (c.credits || 0), 0)} icon={GraduationCap} />
        <Stat label="Upcoming exams" value={myExams.length} icon={Users2} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="My courses">
          {courses.length === 0 ? <Empty title="No courses assigned" /> : (
            <div className="space-y-2">
              {courses.map(c => (
                <div key={c.course_id} className="p-3 border border-slate-200 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium">{c.course_id} · {c.course_name}</p>
                    <p className="text-xs text-slate-500">{c.department} · {c.credits} credits · {c.class_slot}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Upcoming exams">
          {myExams.length === 0 ? <Empty title="No exams scheduled" /> : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Course</th><th>Type</th><th>Day</th><th>Time</th><th>Room</th></tr></thead>
                <tbody>
                  {myExams.map(e => (
                    <tr key={e.exam_id}>
                      <td className="font-medium">{e.course_name}</td>
                      <td><span className="badge badge-slate">{e.exam_type}</span></td>
                      <td>{e.exam_day}</td>
                      <td>{e.start_time}</td>
                      <td>{e.exam_room_number || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
