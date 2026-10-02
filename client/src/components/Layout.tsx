import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from './ui';

export function Layout() {
  const { me, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__inner">
          <Link to={me ? '/dashboard' : '/'} className="brand">
            <span className="brand__mark" aria-hidden>
              ט
            </span>
            טובים
          </Link>
          <nav className="nav">
            {me ? (
              <>
                <NavLink to="/dashboard">ראשי</NavLink>
                <NavLink to="/proposals">הצעות</NavLink>
                <NavLink to="/pool">מאגר משותף</NavLink>
                <NavLink to="/couples">זוגות</NavLink>
                <NavLink to="/requests">בקשות</NavLink>
              </>
            ) : (
              <NavLink to="/pool">מאגר משותף</NavLink>
            )}
          </nav>
          <div className="topbar__user">
            {me ? (
              <>
                <Link to="/profile" className="topbar__name" title="הפרופיל שלי">
                  <Avatar firstName={me.firstName} lastName={me.lastName} size={30} />
                  <span className="topbar__first">{me.firstName}</span>
                </Link>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    void logout();
                    navigate('/');
                  }}
                >
                  יציאה
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn--primary btn--sm">
                כניסה
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">טובים · מערכת לשדכנים ושדכניות</footer>
    </div>
  );
}

/** Minimal frame for the public registration form a single opens from a link. */
export function BareLayout() {
  return (
    <div className="app app--bare">
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">טובים · מערכת לשדכנים ושדכניות</footer>
    </div>
  );
}
