import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const roleHome = user ? `/${user.role}` : '/login';
  return (
    <section className="card">
      <h2>Welcome to Class Check-In</h2>
      <p>Role-aware attendance and scheduling platform.</p>
      <Link to={roleHome}>Go to your dashboard</Link>
    </section>
  );
}
