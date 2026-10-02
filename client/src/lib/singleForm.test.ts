import { describe, expect, it } from 'vitest';
import type { Single } from '../api/types';
import {
  emptySingleForm,
  formToPayload,
  normalizePhone,
  serverFieldsToForm,
  singleToForm,
  validateSingleForm,
  type SingleFormState,
} from './singleForm';

const NOW = new Date('2026-06-01');

const filled = (): SingleFormState => ({
  ...emptySingleForm(),
  firstName: ' נועה ',
  lastName: 'ברושי',
  phoneNumber: '050-123 4567',
  email: 'noa@example.com',
  city: 'ירושלים',
  gender: 'נקבה',
  sectors: ['דתי/ה לאומי/ת'],
  birthDate: '1998-03-14',
  ethnicity: 'אשכנזי/ה',
  nonCompromisableAttributes: ['יראת שמיים', 'כנות', 'חסד', 'שאיפה ללמוד'],
});

describe('validateSingleForm', () => {
  it('accepts a complete form', () => {
    expect(validateSingleForm(filled(), NOW)).toEqual({});
  });

  it('flags every missing required field on an empty form', () => {
    const errors = validateSingleForm(emptySingleForm(), NOW);
    expect(Object.keys(errors).sort()).toEqual(
      ['birthDate', 'city', 'ethnicity', 'firstName', 'gender', 'lastName', 'nonCompromisableAttributes', 'phoneNumber', 'sectors'].sort()
    );
  });

  it('email is optional but must be valid when given', () => {
    expect(validateSingleForm({ ...filled(), email: '' }, NOW)).toEqual({});
    expect(validateSingleForm({ ...filled(), email: 'nope' }, NOW)).toHaveProperty('email');
  });

  it('requires all four non-negotiables', () => {
    const f = filled();
    f.nonCompromisableAttributes = ['א', 'ב', 'ג', ' '];
    expect(validateSingleForm(f, NOW)).toHaveProperty('nonCompromisableAttributes');
  });

  it('rejects under-18 birth dates and inverted age ranges', () => {
    const f = { ...filled(), birthDate: '2010-01-01', desiredAgeMin: '30', desiredAgeMax: '25' };
    const errors = validateSingleForm(f, NOW);
    expect(errors.birthDate).toBe('תאריך לידה לא סביר');
    // Turns 18 the day after NOW
    expect(validateSingleForm({ ...filled(), birthDate: '2008-06-02' }, NOW).birthDate).toBe('תאריך לידה לא סביר');
    expect(validateSingleForm({ ...filled(), birthDate: '2008-06-01' }, NOW)).toEqual({});
    expect(errors.desiredAgeRange).toBe('הגיל המינימלי גדול מהמקסימלי');
  });

  it('validates height and reference phones only when given', () => {
    expect(validateSingleForm({ ...filled(), height: '300' }, NOW)).toHaveProperty('height');
    expect(validateSingleForm({ ...filled(), referencePhones: ['12'] }, NOW)).toHaveProperty('referencePhones');
    expect(validateSingleForm({ ...filled(), height: '', referencePhones: [] }, NOW)).toEqual({});
  });
});

describe('formToPayload', () => {
  it('trims text, normalizes phones and converts numbers', () => {
    const payload = formToPayload({ ...filled(), height: '166', referencePhones: ['052-000 0000'] });
    expect(payload.firstName).toBe('נועה');
    expect(payload.phoneNumber).toBe('0501234567');
    expect(payload.birthDate).toBe('1998-03-14');
    expect(payload.height).toBe(166);
    expect(payload.referencePhones).toEqual(['0520000000']);
  });

  it('sends null for an empty age range and height so edits can clear them', () => {
    const payload = formToPayload(filled());
    expect(payload.desiredAgeRange).toBeNull();
    expect(payload.height).toBeNull();
  });

  it('keeps an open-ended age range', () => {
    expect(formToPayload({ ...filled(), desiredAgeMin: '25' }).desiredAgeRange).toEqual({ min: 25, max: undefined });
  });

  it('drops custom sector text unless "other" is one of the sectors', () => {
    expect(formToPayload({ ...filled(), customSector: 'x' }).customSector).toBe('');
    const f = { ...filled(), sectors: ['חסידי/ת', 'אחר/ת'], customSector: ' ברסלב ' };
    expect(formToPayload(f).customSector).toBe('ברסלב');
    expect(formToPayload(f).sectors).toEqual(['חסידי/ת', 'אחר/ת']);
  });
});

describe('singleToForm', () => {
  it('round-trips a saved single', () => {
    const payload = formToPayload({ ...filled(), height: '170', desiredAgeMin: '24', desiredAgeMax: '30' });
    // The server returns a full timestamp for birthDate
    const saved = { ...payload, birthDate: '1998-03-14T00:00:00.000Z', _id: 'x', matchMakers: [], createdAt: '', updatedAt: '' } as unknown as Single;
    expect(formToPayload(singleToForm(saved))).toEqual(payload);
  });
});

it('normalizePhone strips spaces and dashes only', () => {
  expect(normalizePhone('+972 50-123-4567')).toBe('+972501234567');
});

it('serverFieldsToForm maps nested paths to their top-level field', () => {
  expect(serverFieldsToForm({ 'desiredAgeRange.min': 'x', email: 'y' })).toEqual({
    desiredAgeRange: 'הערך לא התקבל בשרת',
    email: 'הערך לא התקבל בשרת',
  });
});
