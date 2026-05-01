import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  return (
    <section className="card">
      <h2>Login</h2>
      <p>Pick a demo role:</p>
      <div className="stack">
        <button onClick={() => login('teacher')}>Login as Teacher</button>
        <button onClick={() => login('student')}>Login as Student</button>
        <button onClick={() => login('admin')}>Login as Admin</button>
      </div>
    </section>
  );
}
