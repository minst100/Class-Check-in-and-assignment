import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="app-shell">
      <header>
        <h1>{t('app.title')}</h1>
        <div className="header-controls">
          <select aria-label="language" value={locale} onChange={(e) => setLocale(e.target.value)}>
            <option value="en">English</option>
            <option value="th">ไทย</option>
          </select>
          {user && <button onClick={logout}>{t('nav.logout')}</button>}
        </div>
      </header>
      <nav>
        <Link to="/">{t('nav.home')}</Link>
        <Link to="/reports">{t('nav.reports')}</Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
