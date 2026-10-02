import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { ErrorBox, Field } from '../components/ui';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';

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
    <Card className="mx-auto my-6 w-full max-w-[420px] p-6 sm:p-7">
      <h1 className="mb-5 text-center">כניסה לשדכנים</h1>
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field label="אימייל">
          {(id) => <Input id={id} type="email" dir="ltr" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />}
        </Field>
        <Field label="סיסמה">
          {(id) => (
            <Input id={id} type="password" dir="ltr" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          )}
        </Field>
        {error && <ErrorBox message={error} />}
        <Button type="submit" size="lg" className="mt-2 w-full" disabled={busy}>
          {busy ? 'נכנסים…' : 'כניסה'}
        </Button>
      </form>
      <p className="mt-4 text-center text-muted-foreground">
        עוד אין חשבון? <Link to="/signup" className="font-semibold text-primary hover:underline">הרשמה</Link>
      </p>
      {(import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_LOGIN === 'true') && (
        <p className="mt-3 text-center text-[0.82rem] text-muted-foreground">
          נתוני דמו: <code dir="ltr">rachel@demo.tovim.example</code> /{' '}
          <code dir="ltr">demo-password</code>
        </p>
      )}
    </Card>
  );
}
