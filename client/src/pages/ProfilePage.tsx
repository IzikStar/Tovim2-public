import { useState, type FormEvent } from 'react';
import { ApiError, api } from '../api/client';
import { GENDERS, SECTORS, type AgeRange, type Gender, type MatchMakerInput, type Sector } from '../api/types';
import { useAuth, useMe } from '../auth/AuthContext';
import { ChipSelect } from '../components/ChipInput';
import { ErrorBox, Field } from '../components/ui';
import { normalizePhone } from '../lib/singleForm';

const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
const rangeOrNull = (min: string, max: string): AgeRange | null =>
  min.trim() === '' && max.trim() === '' ? null : { min: num(min), max: num(max) };

/** The matchmaker's own details, the ages and fees they work with, and a password change. */
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
    password: '',
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
    if (form.password && form.password.length < 8) e.password = 'לפחות 8 תווים';
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
      ...(form.password ? { password: form.password } : {}),
    };
    try {
      await api.updateMe(me._id, payload);
      await refresh();
      setForm((f) => ({ ...f, password: '' }));
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
        <input id={id} type={type} dir={k === 'email' || k === 'phoneNumber' ? 'ltr' : undefined} value={form[k]} onChange={(e) => set(k, e.target.value)} />
      )}
    </Field>
  );

  return (
    <div className="page page--narrow">
      <h1>הפרופיל שלי</h1>
      <form onSubmit={submit} noValidate>
        <fieldset className="form-section">
          <legend>פרטים</legend>
          <div className="form-grid">
            {text('firstName', 'שם פרטי')}
            {text('lastName', 'שם משפחה')}
            {text('email', 'אימייל', 'email')}
            {text('phoneNumber', 'טלפון', 'tel')}
            {text('city', 'עיר')}
            <Field label="מגדר" required>
              {(id) => (
                <select id={id} value={form.gender} onChange={(e) => set('gender', e.target.value as Gender)}>
                  {GENDERS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="מגזר" required>
              {(id) => (
                <select id={id} value={form.sector} onChange={(e) => set('sector', e.target.value as Sector)}>
                  {SECTORS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              )}
            </Field>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>במה אני עוסק/ת</legend>
          <div className="form-grid">
            <Field label="מגזרים שאני מתמחה בהם" wide>
              {() => <ChipSelect<Sector> label="מגזרי התמחות" options={SECTORS} value={form.expertSectors} onChange={(v) => set('expertSectors', v)} />}
            </Field>
            <Field label="גילאי המועמדים" error={errors.age} hint="שדכנים אחרים רואים את זה כשהם מחפשים עם מי לשתף">
              {() => (
                <div className="range">
                  <input type="number" inputMode="numeric" min={18} placeholder="מגיל" aria-label="מגיל" value={form.ageMin} onChange={(e) => set('ageMin', e.target.value)} />
                  <span>עד</span>
                  <input type="number" inputMode="numeric" min={18} placeholder="עד גיל" aria-label="עד גיל" value={form.ageMax} onChange={(e) => set('ageMax', e.target.value)} />
                </div>
              )}
            </Field>
            <Field label="דמי שידוך (₪)" error={errors.price}>
              {() => (
                <div className="range">
                  <input type="number" inputMode="numeric" min={0} placeholder="מ-" aria-label="מחיר מינימום" value={form.priceMin} onChange={(e) => set('priceMin', e.target.value)} />
                  <span>עד</span>
                  <input type="number" inputMode="numeric" min={0} placeholder="עד" aria-label="מחיר מקסימום" value={form.priceMax} onChange={(e) => set('priceMax', e.target.value)} />
                </div>
              )}
            </Field>
            <Field label="קצת עליי" wide>
              {(id) => <textarea id={id} rows={3} value={form.about} onChange={(e) => set('about', e.target.value)} />}
            </Field>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>סיסמה</legend>
          <Field label="סיסמה חדשה" error={errors.password} hint="משאירים ריק כדי לא לשנות">
            {(id) => <input id={id} type="password" dir="ltr" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} />}
          </Field>
        </fieldset>

        <div className="form-actions">
          {error && <ErrorBox message={error} />}
          {saved && <div className="alert alert--info">נשמר ✓</div>}
          <button className="btn btn--primary btn--lg" disabled={busy}>
            {busy ? 'שומרים…' : 'שמירה'}
          </button>
        </div>
      </form>
    </div>
  );
}
