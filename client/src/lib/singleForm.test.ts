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
  sector: 'דתי/ה לאומי/ת',
  birthYear: '1998',
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
      ['birthYear', 'city', 'email', 'ethnicity', 'firstName', 'gender', 'lastName', 'nonCompromisableAttributes', 'phoneNumber', 'sector'].sort()
    );
  });

  it('requires all four non-negotiables', () => {
    const f = filled();
    f.nonCompromisableAttributes = ['א', 'ב', 'ג', ' '];
    expect(validateSingleForm(f, NOW)).toHaveProperty('nonCompromisableAttributes');
  });

  it('rejects under-18 birth years and inverted age ranges', () => {
    const f = { ...filled(), birthYear: '2010', desiredAgeMin: '30', desiredAgeMax: '25' };
    const errors = validateSingleForm(f, NOW);
    expect(errors.birthYear).toBe('שנת לידה לא סבירה');
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
    expect(payload.birthYear).toBe(1998);
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

  it('drops custom sector text unless the sector is "other"', () => {
    expect(formToPayload({ ...filled(), customSector: 'x' }).customSector).toBe('');
    expect(formToPayload({ ...filled(), sector: 'אחר/ת', customSector: ' ברסלב ' }).customSector).toBe('ברסלב');
  });
});

describe('singleToForm', () => {
  it('round-trips a saved single', () => {
    const payload = formToPayload({ ...filled(), height: '170', desiredAgeMin: '24', desiredAgeMax: '30' });
    const saved = { ...payload, _id: 'x', matchMakers: [], createdAt: '', updatedAt: '' } as unknown as Single;
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
