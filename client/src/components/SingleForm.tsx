import { useState, type FormEvent, type ReactNode } from 'react';
import { ApiError } from '../api/client';
import {
  ETHNICITIES,
  GENDERS,
  INTERESTS,
  MARRIAGE_STATUSES,
  PROPOSE_PREFERENCES,
  SECTORS,
  type SingleFields,
} from '../api/types';
import {
  formToPayload,
  serverFieldsToForm,
  validateSingleForm,
  type SingleFormState,
} from '../lib/singleForm';
import { ChipInput, ChipSelect } from './ChipInput';
import { ImagePicker } from './ImagePicker';
import { ErrorBox, Field } from './ui';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';

type TextKey = {
  [K in keyof SingleFormState]: SingleFormState[K] extends string ? K : never;
}[keyof SingleFormState];

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <fieldset className="m-0 mb-4 min-w-0 rounded-lg border bg-card p-4 pt-3 shadow-soft sm:px-5 sm:pb-5">
      <legend className="px-1.5 text-[1.05rem] font-bold">{title}</legend>
      {subtitle && <p className="-mt-0.5 mb-3 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function SingleForm({
  initial,
  onSubmit,
  submitLabel,
  selfRegistration = false,
}: {
  initial: SingleFormState;
  onSubmit: (payload: Partial<SingleFields>) => Promise<void>;
  submitLabel: string;
  /** The single fills in their own details (public registration link) */
  selfRegistration?: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof SingleFormState>(key: K, value: SingleFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const text = (key: TextKey, label: string, opts: { required?: boolean; type?: string; hint?: string; inputMode?: 'numeric' | 'tel' | 'email'; dir?: 'ltr' } = {}) => (
    <Field label={label} required={opts.required} error={errors[key]} hint={opts.hint}>
      {(id) => (
        <Input
          id={id}
          type={opts.type ?? 'text'}
          inputMode={opts.inputMode}
          dir={opts.dir}
          value={form[key]}
          onChange={(e) => set(key, e.target.value)}
          aria-invalid={Boolean(errors[key])}
        />
      )}
    </Field>
  );

  const area = (key: TextKey, label: string, hint?: string) => (
    <Field label={label} error={errors[key]} hint={hint} wide>
      {(id) => <Textarea id={id} rows={3} value={form[key]} onChange={(e) => set(key, e.target.value)} />}
    </Field>
  );

  const select = (key: TextKey, label: string, options: readonly string[], required = false) => (
    <Field label={label} required={required} error={errors[key]}>
      {(id) => (
        <Select id={id} value={form[key]} onChange={(e) => set(key, e.target.value)} aria-invalid={Boolean(errors[key])}>
          {!form[key] && <option value="">בחירה…</option>}
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const found = validateSingleForm(form);
    setErrors(found);
    if (Object.keys(found).length) {
      setFormError('יש שדות שצריך לתקן. הם מסומנים באדום.');
      requestAnimationFrame(() => document.querySelector('[data-error]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
      return;
    }
    setSaving(true);
    try {
      await onSubmit(formToPayload(form));
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(serverFieldsToForm(err.fields));
        setFormError(err.status === 409 ? 'כבר קיים/ת מועמד/ת עם האימייל הזה' : err.message);
      } else {
        setFormError('משהו השתבש בשמירה');
      }
    } finally {
      setSaving(false);
    }
  };

  const you = selfRegistration;

  return (
    <form onSubmit={submit} noValidate>
      <Section title="פרטים אישיים">
        {text('firstName', 'שם פרטי', { required: true })}
        {text('lastName', 'שם משפחה', { required: true })}
        {select('gender', 'מגדר', GENDERS, true)}
        {text('birthDate', 'תאריך לידה', { required: true, type: 'date', dir: 'ltr' })}
        {text('city', 'עיר מגורים', { required: true })}
        {select('marriageStatus', 'מצב משפחתי', MARRIAGE_STATUSES, true)}
        {form.marriageStatus !== 'רווק/ה' && text('numOfChildren', 'מספר ילדים', { inputMode: 'numeric' })}
        {text('height', 'גובה (ס"מ)', { inputMode: 'numeric' })}
      </Section>

      <Section title="פרטי קשר" subtitle={you ? 'רק השדכן/ית יראו את הפרטים האלה.' : 'לא מוצגים במאגר המשותף.'}>
        {text('phoneNumber', 'טלפון', { required: true, type: 'tel', inputMode: 'tel', dir: 'ltr' })}
        {text('email', 'אימייל', { type: 'email', inputMode: 'email', dir: 'ltr' })}
      </Section>

      <Section title="רקע">
        <Field label="מגזר" hint="אפשר לבחור יותר מאחד" required error={errors.sectors} wide>
          {() => <ChipSelect label="מגזר" options={SECTORS} value={form.sectors as (typeof SECTORS)[number][]} onChange={(v) => set('sectors', v)} />}
        </Field>
        {form.sectors.includes('אחר/ת') && text('customSector', 'פירוט מגזר')}
        {select('ethnicity', 'מוצא', ETHNICITIES, true)}
        {form.ethnicity === 'אחר/ת' && text('customEthnicity', 'פירוט מוצא')}
        {text('currentOccupation', 'עיסוק נוכחי')}
        <Field label="מקומות לימוד ועבודה" hint="Enter אחרי כל אחד" wide>
          {(id) => (
            <ChipInput id={id} value={form.workAndStudyPlaces} onChange={(v) => set('workAndStudyPlaces', v)} placeholder="ישיבה, מדרשה, שירות, אוניברסיטה…" />
          )}
        </Field>
      </Section>

      <Section title={you ? 'קצת עליך' : 'על המועמד/ת'}>
        {area('basicDescription', 'תיאור קצר', 'מופיע גם במאגר המשותף')}
        {area('freeDescription', 'תיאור חופשי')}
        <Field label="תכונות בולטות" wide>
          {(id) => <ChipInput id={id} value={form.attributes} onChange={(v) => set('attributes', v)} placeholder="רגיש/ה, אחראי/ת…" />}
        </Field>
        <Field label="תחומי עניין" wide>
          {() => <ChipSelect label="תחומי עניין" options={INTERESTS} value={form.interests as (typeof INTERESTS)[number][]} onChange={(v) => set('interests', v)} />}
        </Field>
        <Field label="תחומי עניין נוספים" wide>
          {(id) => <ChipInput id={id} value={form.otherInterests} onChange={(v) => set('otherInterests', v)} />}
        </Field>
        {area('futureVision', 'חזון לבית ולעתיד')}
      </Section>

      <Section title="מה מחפשים">
        <Field label="תכונות שמחפשים" wide>
          {(id) => <ChipInput id={id} value={form.lookingForAttributes} onChange={(v) => set('lookingForAttributes', v)} />}
        </Field>
        <Field label="ארבעה דברים שאין עליהם פשרה" required error={errors.nonCompromisableAttributes} wide>
          {() => (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {form.nonCompromisableAttributes.map((v, i) => (
                <Input
                  key={i}
                  aria-label={`דבר ${i + 1} שאין עליו פשרה`}
                  placeholder={`${i + 1}.`}
                  value={v}
                  onChange={(e) => {
                    const next = [...form.nonCompromisableAttributes] as SingleFormState['nonCompromisableAttributes'];
                    next[i] = e.target.value;
                    set('nonCompromisableAttributes', next);
                  }}
                />
              ))}
            </div>
          )}
        </Field>
        <Field label="מגזרים רלוונטיים" wide>
          {() => <ChipSelect label="מגזרים רלוונטיים" options={SECTORS} value={form.desiredSectors as (typeof SECTORS)[number][]} onChange={(v) => set('desiredSectors', v)} />}
        </Field>
        <Field label="טווח גילאים" error={errors.desiredAgeRange}>
          {(id) => (
            <div className="flex items-center gap-2">
              <Input id={id} className="w-24" inputMode="numeric" aria-label="גיל מינימלי" placeholder="מגיל" value={form.desiredAgeMin} onChange={(e) => set('desiredAgeMin', e.target.value)} />
              <span className="text-sm text-muted-foreground">עד</span>
              <Input className="w-24" inputMode="numeric" aria-label="גיל מקסימלי" placeholder="גיל" value={form.desiredAgeMax} onChange={(e) => set('desiredAgeMax', e.target.value)} />
            </div>
          )}
        </Field>
        {area('generalDealBreakers', 'דברים שלא מתאימים')}
      </Section>

      <Section title="מראה">
        {area('appearanceDescription', 'תיאור מראה')}
        {area('appearanceMustHave', 'חשוב שיהיה במראה')}
        {area('appearanceMustNotHave', 'לא מתאים במראה')}
      </Section>

      <Section title="תמונות" subtitle="עד ארבע תמונות. הן מוקטנות אוטומטית לפני השליחה ולא מוצגות במאגר המשותף.">
        <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2" data-error={errors.images ? 'true' : undefined}>
          <ImagePicker value={form.images} onChange={(v) => set('images', v)} />
          {errors.images && <small className="text-xs font-medium text-destructive">{errors.images}</small>}
        </div>
      </Section>

      <Section title="העדפות ופרטים נוספים">
        {select('proposePreference', 'סדר הצעה', PROPOSE_PREFERENCES)}
        {text('nameForPrayer', 'שם לתפילה', { hint: 'למשל: נועה בת שרה' })}
        <Field label="טלפונים של ממליצים" error={errors.referencePhones} wide>
          {(id) => <ChipInput id={id} value={form.referencePhones} onChange={(v) => set('referencePhones', v)} placeholder="050…" />}
        </Field>
        {text('referralSource', 'איך הגעת אלינו?')}
        {area('existingMatchProfile', 'קישור לפרופיל קיים או כרטיס שידוך')}
        {area('matchmakerExpectations', 'ציפיות מהשדכן/ית')}
        <Checkbox className="sm:col-span-2" checked={form.isPublic} onChange={(e) => set('isPublic', e.target.checked)}>
          להציג במאגר המשותף לשדכנים
          <small className="text-muted-foreground"> (בלי שם משפחה, פרטי קשר ותמונות)</small>
        </Checkbox>
        <Checkbox className="sm:col-span-2" checked={form.shareInWhatsappGroups} onChange={(e) => set('shareInWhatsappGroups', e.target.checked)}>
          מאשר/ת שיתוף בקבוצות שדכנים בוואטסאפ
        </Checkbox>
      </Section>

      <div className="sticky bottom-0 z-[1] flex flex-col items-stretch gap-1 bg-gradient-to-b from-transparent via-background via-30% to-background pb-2 pt-5 sm:items-start [&>[role=alert]]:w-full">
        {formError && <ErrorBox message={formError} />}
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? 'שומר…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
