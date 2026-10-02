import { describe, expect, it } from 'vitest';
import { ageFromBirthDate, genderize, matchesQuery, sectorLabel } from './format';

describe('genderize', () => {
  it('picks the feminine or masculine form of slash words', () => {
    expect(genderize('דתי/ה לאומי/ת', 'נקבה')).toBe('דתיה לאומית');
    expect(genderize('דתי/ה לאומי/ת', 'זכר')).toBe('דתי לאומי');
    expect(genderize('עדות המזרח', 'נקבה')).toBe('עדות המזרח');
  });
});

it('sectorLabel lists every sector and prefers the custom text for "other"', () => {
  expect(sectorLabel({ sectors: ['אחר/ת'], customSector: 'ברסלב', gender: 'זכר' })).toBe('ברסלב');
  expect(sectorLabel({ sectors: ['חסידי/ת', 'חרדי/ת'], gender: 'נקבה' })).toBe('חסידית, חרדית');
});

it('ageFromBirthDate counts the birthday', () => {
  expect(ageFromBirthDate('1998-03-14', new Date('2026-03-13'))).toBe(27);
  expect(ageFromBirthDate('1998-03-14', new Date('2026-03-14'))).toBe(28);
});

it('matchesQuery is case-insensitive and ignores empty queries', () => {
  expect(matchesQuery('', 'x')).toBe(true);
  expect(matchesQuery('JERU', 'Jerusalem')).toBe(true);
  expect(matchesQuery('חיפה', 'ירושלים', undefined)).toBe(false);
});
