import { describe, expect, it } from 'vitest';
import { ageFromBirthYear, genderize, matchesQuery, sectorLabel } from './format';

describe('genderize', () => {
  it('picks the feminine or masculine form of slash words', () => {
    expect(genderize('דתי/ה לאומי/ת', 'נקבה')).toBe('דתיה לאומית');
    expect(genderize('דתי/ה לאומי/ת', 'זכר')).toBe('דתי לאומי');
    expect(genderize('עדות המזרח', 'נקבה')).toBe('עדות המזרח');
  });
});

it('sectorLabel prefers the custom sector for "other"', () => {
  expect(sectorLabel({ sector: 'אחר/ת', customSector: 'ברסלב', gender: 'זכר' })).toBe('ברסלב');
  expect(sectorLabel({ sector: 'חסידי/ת', gender: 'נקבה' })).toBe('חסידית');
});

it('ageFromBirthYear', () => {
  expect(ageFromBirthYear(1998, new Date('2026-01-01'))).toBe(28);
});

it('matchesQuery is case-insensitive and ignores empty queries', () => {
  expect(matchesQuery('', 'x')).toBe(true);
  expect(matchesQuery('JERU', 'Jerusalem')).toBe(true);
  expect(matchesQuery('חיפה', 'ירושלים', undefined)).toBe(false);
});
