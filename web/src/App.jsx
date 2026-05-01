import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import RoleRoute from './components/RoleRoute';
import LoginPage from './pages/auth/LoginPage';
import HomePage from './pages/HomePage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ReportsPage from './pages/reports/ReportsPage';

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RoleRoute allowed={['teacher']} />}>
          <Route path="/teacher" element={<TeacherDashboard />} />
        </Route>
        <Route element={<RoleRoute allowed={['student']} />}>
          <Route path="/student" element={<StudentDashboard />} />
        </Route>
        <Route element={<RoleRoute allowed={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        <Route element={<RoleRoute allowed={['teacher', 'admin']} />}>
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
