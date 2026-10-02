import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

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
                <NavLink to="/dashboard">המועמדים שלי</NavLink>
                <NavLink to="/pool">מאגר משותף</NavLink>
                <NavLink to="/requests">בקשות</NavLink>
              </>
            ) : (
              <NavLink to="/pool">מאגר משותף</NavLink>
            )}
          </nav>
          <div className="topbar__user">
            {me ? (
              <>
                <span className="topbar__name">שלום, {me.firstName}</span>
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
