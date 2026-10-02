import type { PublicSingle } from '../api/types';

export const ageFromBirthYear = (birthYear: number, now = new Date()): number =>
  now.getFullYear() - birthYear;

/** "חסידי/ת" -> "חסידית" for a woman, "חסידי" for a man (and the same for statuses). */
export function genderize(value: string, gender?: string): string {
  if (!value.includes('/')) return value;
  const female = gender === 'נקבה';
  return value
    .split(' ')
    .map((word) => {
      const [base, suffix] = word.split('/');
      if (suffix === undefined) return word;
      return female ? base + suffix : base;
    })
    .join(' ');
}

export const sectorLabel = (s: Pick<PublicSingle, 'sector' | 'customSector' | 'gender'>) =>
  s.sector === 'אחר/ת' && s.customSector ? s.customSector : genderize(s.sector, s.gender);

export const ethnicityLabel = (s: Pick<PublicSingle, 'ethnicity' | 'customEthnicity' | 'gender'>) =>
  s.ethnicity === 'אחר/ת' && s.customEthnicity ? s.customEthnicity : genderize(s.ethnicity, s.gender);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });

export const initials = (first: string, last = '') => `${first.charAt(0)}${last.charAt(0)}`;

/** Case-insensitive search across the given fields. */
export function matchesQuery(query: string, ...fields: (string | number | undefined)[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => f !== undefined && String(f).toLowerCase().includes(q));
}
