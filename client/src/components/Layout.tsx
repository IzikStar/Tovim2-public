import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { cn } from '../lib/utils';
import { Avatar } from './ui';
import { Button, buttonVariants } from './ui/button';

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
    isActive && 'bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary'
  );

function Brand({ to }: { to: string }) {
  return (
    <Link to={to} className="inline-flex shrink-0 items-center gap-2.5 text-xl font-bold text-foreground">
      <span
        className="grid size-9 place-items-center rounded-[11px] bg-gradient-to-br from-primary to-[hsl(345_55%_55%)] text-lg text-white shadow-sm"
        aria-hidden
      >
        ט
      </span>
      טובים
    </Link>
  );
}

function Footer() {
  return <footer className="px-5 py-6 text-center text-sm text-muted-foreground">טובים · מערכת לשדכנים ושדכניות</footer>;
}

export function Layout() {
  const { me, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-card/85 backdrop-blur-md backdrop-saturate-150">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-5">
          <Brand to={me ? '/dashboard' : '/'} />
          <nav
            className="order-last -mx-1 flex basis-full gap-1 overflow-x-auto px-1 pb-1 sm:order-none sm:basis-auto sm:flex-1 sm:pb-0"
            aria-label="ניווט ראשי"
          >
            {me ? (
              <>
                <NavLink to="/dashboard" className={navClass}>ראשי</NavLink>
                <NavLink to="/proposals" className={navClass}>הצעות</NavLink>
                <NavLink to="/pool" className={navClass}>מאגר משותף</NavLink>
                <NavLink to="/couples" className={navClass}>זוגות</NavLink>
                <NavLink to="/requests" className={navClass}>בקשות</NavLink>
              </>
            ) : (
              <NavLink to="/pool" className={navClass}>מאגר משותף</NavLink>
            )}
          </nav>
          <div className="ms-auto flex items-center gap-1.5 sm:ms-0">
            {me ? (
              <>
                <Link
                  to="/profile"
                  title="הפרופיל שלי"
                  className="inline-flex items-center gap-2 rounded-full py-1 pe-3 ps-1 text-sm font-medium text-foreground hover:bg-muted"
                >
                  <Avatar firstName={me.firstName} lastName={me.lastName} size={30} />
                  <span className="hidden sm:inline">{me.firstName}</span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void logout();
                    navigate('/');
                  }}
                >
                  <LogOut aria-hidden />
                  יציאה
                </Button>
              </>
            ) : (
              <Link to="/login" className={buttonVariants({ size: 'sm' })}>
                כניסה
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 pb-12 pt-7 sm:px-5">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

/** Minimal frame for the public registration form a single opens from a link. */
export function BareLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-[1120px] px-4 pt-6 sm:px-5">
        <Brand to="/" />
      </header>
      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 pb-12 pt-6 sm:px-5">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
