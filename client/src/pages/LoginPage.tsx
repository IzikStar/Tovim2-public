import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { ErrorBox, Field } from '../components/ui';

export function LoginPage() {
  const { me, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (me) return <Navigate to={from} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'הכניסה נכשלה');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth card">
      <h1>כניסה לשדכנים</h1>
      <form onSubmit={submit} className="stack">
        <Field label="אימייל">
          {(id) => <input id={id} type="email" dir="ltr" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />}
        </Field>
        <Field label="סיסמה">
          {(id) => (
            <input id={id} type="password" dir="ltr" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          )}
        </Field>
        {error && <ErrorBox message={error} />}
        <button className="btn btn--primary btn--lg" disabled={busy}>
          {busy ? 'נכנסים…' : 'כניסה'}
        </button>
      </form>
      <p className="auth__alt">
        עוד אין חשבון? <Link to="/signup">הרשמה</Link>
      </p>
      {(import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_LOGIN === 'true') && (
        <p className="auth__demo">
          נתוני דמו: <code dir="ltr">rachel@demo.tovim.example</code> /{' '}
          <code dir="ltr">demo-password</code>
        </p>
      )}
    </div>
  );
}
