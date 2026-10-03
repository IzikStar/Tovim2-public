import { useState, type FormEvent } from 'react';
import { ApiError, api } from '../api/client';
import { GENDERS, SECTORS, type AgeRange, type Gender, type MatchMakerInput, type Sector } from '../api/types';
import { useAuth, useMe } from '../auth/AuthContext';
import { ChipSelect } from '../components/ChipInput';
import { ErrorBox, Field } from '../components/ui';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { PASSWORD_HINT, passwordProblem, passwordStrength, type PasswordStrength } from '../lib/password';
import { normalizePhone } from '../lib/singleForm';

const SECTION = 'mb-4 min-w-0 rounded-lg border bg-card p-5 pt-4 shadow-soft sm:px-6';
const LEGEND = 'px-1.5 text-[1.05rem] font-bold';
const GRID = 'grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2';
const RANGE = 'flex items-center gap-2';

const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
const rangeOrNull = (min: string, max: string): AgeRange | null =>
  min.trim() === '' && max.trim() === '' ? null : { min: num(min), max: num(max) };

/** The matchmaker's own details, the ages and fees they work with, and (separately) a password change. */
export function ProfilePage() {
  const me = useMe();
  const { refresh } = useAuth();
  const [form, setForm] = useState({
    firstName: me.firstName,
    lastName: me.lastName,
    phoneNumber: me.phoneNumber,
    email: me.email,
    city: me.city,
    gender: me.gender as Gender,
    sector: me.sector as Sector,
    expertSectors: me.expertSectors,
    ageMin: me.ageRange?.min?.toString() ?? '',
    ageMax: me.ageRange?.max?.toString() ?? '',
    priceMin: me.priceRange?.min?.toString() ?? '',
    priceMax: me.priceRange?.max?.toString() ?? '',
    about: me.about ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setSaved(false);
    setForm((f) => ({ ...f, [k]: v }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'חסר שם פרטי';
    if (!form.lastName.trim()) e.lastName = 'חסר שם משפחה';
    if (!form.city.trim()) e.city = 'חסרה עיר';
    if (!/^\+?\d{7,15}$/.test(normalizePhone(form.phoneNumber))) e.phoneNumber = 'מספר טלפון לא תקין';
    if (!/.+@.+\..+/.test(form.email.trim())) e.email = 'כתובת אימייל לא תקינה';
    const age = rangeOrNull(form.ageMin, form.ageMax);
    if (age && ((age.min ?? 18) < 18 || (age.min != null && age.max != null && age.min > age.max))) e.age = 'טווח גילאים לא תקין';
    const price = rangeOrNull(form.priceMin, form.priceMax);
    if (price && ((price.min ?? 0) < 0 || (price.min != null && price.max != null && price.min > price.max))) e.price = 'טווח מחירים לא תקין';
    return e;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    const payload: Partial<MatchMakerInput> = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phoneNumber: normalizePhone(form.phoneNumber),
      email: form.email.trim(),
      city: form.city.trim(),
      gender: form.gender,
      sector: form.sector,
      expertSectors: form.expertSectors,
      ageRange: rangeOrNull(form.ageMin, form.ageMax),
      priceRange: rangeOrNull(form.priceMin, form.priceMax),
      about: form.about,
    };
    try {
      await api.updateMe(me._id, payload);
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'השמירה נכשלה');
    } finally {
      setBusy(false);
    }
  };

  const text = (k: 'firstName' | 'lastName' | 'city' | 'phoneNumber' | 'email', label: string, type = 'text') => (
    <Field label={label} error={errors[k]} required>
      {(id) => (
        <Input id={id} type={type} dir={k === 'email' || k === 'phoneNumber' ? 'ltr' : undefined} value={form[k]} onChange={(e) => set(k, e.target.value)} />
      )}
    </Field>
  );

  return (
    <div className="mx-auto max-w-[820px]">
      <h1 className="mb-5">הפרופיל שלי</h1>
      <form onSubmit={submit} noValidate>
        <fieldset className={SECTION}>
          <legend className={LEGEND}>פרטים</legend>
          <div className={GRID}>
            {text('firstName', 'שם פרטי')}
            {text('lastName', 'שם משפחה')}
            {text('email', 'אימייל', 'email')}
            {text('phoneNumber', 'טלפון', 'tel')}
            {text('city', 'עיר')}
            <Field label="מגדר" required>
              {(id) => (
                <Select id={id} value={form.gender} onChange={(e) => set('gender', e.target.value as Gender)}>
                  {GENDERS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="מגזר" required>
              {(id) => (
                <Select id={id} value={form.sector} onChange={(e) => set('sector', e.target.value as Sector)}>
                  {SECTORS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        </fieldset>

        <fieldset className={SECTION}>
          <legend className={LEGEND}>במה אני עוסק/ת</legend>
          <div className={GRID}>
            <Field label="מגזרים שאני מתמחה בהם" wide>
              {() => <ChipSelect<Sector> label="מגזרי התמחות" options={SECTORS} value={form.expertSectors} onChange={(v) => set('expertSectors', v)} />}
            </Field>
            <Field label="גילאי המועמדים" error={errors.age} hint="שדכנים אחרים רואים את זה כשהם מחפשים עם מי לשתף">
              {() => (
                <div className={RANGE}>
                  <Input className="min-w-0 flex-1" type="number" inputMode="numeric" min={18} placeholder="מגיל" aria-label="מגיל" value={form.ageMin} onChange={(e) => set('ageMin', e.target.value)} />
                  <span className="shrink-0 text-sm text-muted-foreground">עד</span>
                  <Input className="min-w-0 flex-1" type="number" inputMode="numeric" min={18} placeholder="עד גיל" aria-label="עד גיל" value={form.ageMax} onChange={(e) => set('ageMax', e.target.value)} />
                </div>
              )}
            </Field>
            <Field label="דמי שידוך (₪)" error={errors.price}>
              {() => (
                <div className={RANGE}>
                  <Input className="min-w-0 flex-1" type="number" inputMode="numeric" min={0} placeholder="מ-" aria-label="מחיר מינימום" value={form.priceMin} onChange={(e) => set('priceMin', e.target.value)} />
                  <span className="shrink-0 text-sm text-muted-foreground">עד</span>
                  <Input className="min-w-0 flex-1" type="number" inputMode="numeric" min={0} placeholder="עד" aria-label="מחיר מקסימום" value={form.priceMax} onChange={(e) => set('priceMax', e.target.value)} />
                </div>
              )}
            </Field>
            <Field label="קצת עליי" wide>
              {(id) => <Textarea id={id} rows={3} value={form.about} onChange={(e) => set('about', e.target.value)} />}
            </Field>
          </div>
        </fieldset>

        <div className="sticky bottom-0 flex flex-col items-start gap-1 bg-gradient-to-b from-transparent via-background via-30% to-background pb-2 pt-5">
          {error && <div className="w-full"><ErrorBox message={error} /></div>}
          {saved && <div className="my-3 w-full rounded-md bg-success-soft px-4 py-2.5 text-sm font-medium text-success" role="status">נשמר ✓</div>}
          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={busy}>
            {busy ? 'שומרים…' : 'שמירה'}
          </Button>
        </div>
      </form>
      <PasswordForm />
    </div>
  );
}

const STRENGTH: Record<PasswordStrength, { label: string; bar: string; width: string }> = {
  weak: { label: 'חלשה', bar: 'bg-destructive', width: 'w-1/3' },
  ok: { label: 'סבירה', bar: 'bg-warning', width: 'w-2/3' },
  strong: { label: 'חזקה', bar: 'bg-success', width: 'w-full' },
};

/** Its own form: a password change needs the current password and must not ride along with a profile save. */
function PasswordForm() {
  const me = useMe();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form, v: string) => {
    setSaved(false);
    setForm((f) => ({ ...f, [k]: v }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const found: Record<string, string> = {};
    if (!form.current) found.current = 'חסרה הסיסמה הנוכחית';
    const weak = passwordProblem(form.next);
    if (weak) found.next = weak;
    else if (form.next === form.current) found.next = 'הסיסמה החדשה זהה לנוכחית';
    if (form.confirm !== form.next) found.confirm = 'הסיסמאות לא תואמות';
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await api.changePassword(me._id, form.current, form.next);
      setForm({ current: '', next: '', confirm: '' });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'שינוי הסיסמה נכשל');
    } finally {
      setBusy(false);
    }
  };

  const strength = form.next ? STRENGTH[passwordStrength(form.next)] : null;
  const input = (k: keyof typeof form, autoComplete: string) => (id: string) => (
    <Input id={id} type="password" dir="ltr" autoComplete={autoComplete} value={form[k]} onChange={(e) => set(k, e.target.value)} />
  );

  return (
    <form onSubmit={submit} noValidate aria-label="שינוי סיסמה">
      <fieldset className={SECTION}>
        <legend className={LEGEND}>שינוי סיסמה</legend>
        <div className={GRID}>
          <Field label="סיסמה נוכחית" error={errors.current} wide>
            {input('current', 'current-password')}
          </Field>
          <Field label="סיסמה חדשה" error={errors.next} hint={PASSWORD_HINT}>
            {(id) => (
              <>
                {input('next', 'new-password')(id)}
                {strength && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${strength.bar} ${strength.width}`} />
                    </div>
                    <span>חוזק: {strength.label}</span>
                  </div>
                )}
              </>
            )}
          </Field>
          <Field label="אימות סיסמה חדשה" error={errors.confirm}>
            {input('confirm', 'new-password')}
          </Field>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">אחרי השינוי, מכשירים אחרים שמחוברים לחשבון יתנתקו.</p>
        {error && <ErrorBox message={error} />}
        {saved && <div className="my-3 rounded-md bg-success-soft px-4 py-2.5 text-sm font-medium text-success" role="status">הסיסמה עודכנה ✓</div>}
        <Button type="submit" variant="outline" className="mt-3 w-full sm:w-auto" disabled={busy}>
          {busy ? 'מעדכנים…' : 'עדכון סיסמה'}
        </Button>
      </fieldset>
    </form>
  );
}
