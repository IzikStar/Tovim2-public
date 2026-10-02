import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import { GENDERS, SECTORS, type MatchMakerInput, type Sector } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ChipSelect } from '../components/ChipInput';
import { ErrorBox, Field } from '../components/ui';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PASSWORD_HINT, passwordProblem } from '../lib/password';
import { normalizePhone } from '../lib/singleForm';

const EMPTY: MatchMakerInput = {
  firstName: '',
  lastName: '',
  phoneNumber: '',
  email: '',
  password: '',
  city: '',
  gender: '',
  sector: '',
  expertSectors: [],
};

export function validateSignup(f: MatchMakerInput): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.firstName.trim()) e.firstName = 'חסר שם פרטי';
  if (!f.lastName.trim()) e.lastName = 'חסר שם משפחה';
  if (!f.city.trim()) e.city = 'חסרה עיר';
  if (!f.gender) e.gender = 'חסר מגדר';
  if (!f.sector) e.sector = 'חסר מגזר';
  if (!/^\+?\d{7,15}$/.test(normalizePhone(f.phoneNumber))) e.phoneNumber = 'מספר טלפון לא תקין';
  if (!/.+@.+\..+/.test(f.email.trim())) e.email = 'כתובת אימייל לא תקינה';
  const weak = passwordProblem(f.password);
  if (weak) e.password = weak;
  return e;
}

export function SignupPage() {
  const { me, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (me) return <Navigate to="/dashboard" replace />;

  const set = <K extends keyof MatchMakerInput>(k: K, v: MatchMakerInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const found = validateSignup(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const payload = { ...form, email: form.email.trim(), phoneNumber: normalizePhone(form.phoneNumber) };
      await api.signup(payload);
      await login(payload.email, payload.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ההרשמה נכשלה');
    } finally {
      setBusy(false);
    }
  };

  const input = (k: 'firstName' | 'lastName' | 'city' | 'phoneNumber' | 'email' | 'password', label: string, type = 'text') => (
    <Field label={label} error={errors[k]} hint={k === 'password' ? PASSWORD_HINT : undefined} required>
      {(id) => (
        <Input
          id={id}
          type={type}
          dir={['email', 'password', 'phoneNumber'].includes(k) ? 'ltr' : undefined}
          value={form[k]}
          onChange={(e) => set(k, e.target.value)}
          autoComplete={k === 'password' ? 'new-password' : undefined}
        />
      )}
    </Field>
  );

  return (
    <Card className="mx-auto my-6 w-full max-w-[680px] p-6 sm:p-7">
      <h1 className="mb-5 text-center">הרשמה לשדכנים</h1>
      <form onSubmit={submit} noValidate>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
          {input('firstName', 'שם פרטי')}
          {input('lastName', 'שם משפחה')}
          {input('email', 'אימייל', 'email')}
          {input('password', 'סיסמה', 'password')}
          {input('phoneNumber', 'טלפון', 'tel')}
          {input('city', 'עיר')}
          <Field label="מגדר" error={errors.gender} required>
            {(id) => (
              <Select id={id} value={form.gender} onChange={(e) => set('gender', e.target.value as MatchMakerInput['gender'])}>
                <option value="">בחירה…</option>
                {GENDERS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="מגזר" error={errors.sector} required>
            {(id) => (
              <Select id={id} value={form.sector} onChange={(e) => set('sector', e.target.value as MatchMakerInput['sector'])}>
                <option value="">בחירה…</option>
                {SECTORS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="מגזרים שאני מתמחה בהם" wide>
            {() => <ChipSelect<Sector> label="מגזרי התמחות" options={SECTORS} value={form.expertSectors} onChange={(v) => set('expertSectors', v)} />}
          </Field>
        </div>
        {error && <ErrorBox message={error} />}
        <Button type="submit" size="lg" className="mt-5 w-full" disabled={busy}>
          {busy ? 'נרשמים…' : 'יצירת חשבון'}
        </Button>
      </form>
      <p className="mt-4 text-center text-muted-foreground">
        כבר רשומים? <Link to="/login" className="font-semibold text-primary hover:underline">כניסה</Link>
      </p>
    </Card>
  );
}
