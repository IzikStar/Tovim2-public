import type { PublicSingle } from '../api/types';

/** Full years since birthDate (ISO string). */
export function ageFromBirthDate(birthDate: string, now = new Date()): number {
  const b = new Date(birthDate);
  let age = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age -= 1;
  return age;
}

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

/** "חסידית, חרדית"; "other" shows the custom text when there is one. */
export const sectorLabel = (s: Pick<PublicSingle, 'sectors' | 'gender'> & { customSector?: string }) =>
  (s.sectors ?? [])
    .map((x) => (x === 'אחר/ת' && s.customSector ? s.customSector : genderize(x, s.gender)))
    .join(', ');

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
