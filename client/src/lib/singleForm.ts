import type { Single, SingleFields } from '../api/types';

/**
 * The form keeps every field as something an <input> can hold (strings for
 * numbers, fixed-length arrays for the four non-negotiables). These helpers
 * convert between that shape and the API payload.
 */
export interface SingleFormState {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  city: string;
  gender: string;
  sector: string;
  customSector: string;
  birthYear: string;
  marriageStatus: string;
  numOfChildren: string;
  ethnicity: string;
  customEthnicity: string;
  height: string;
  currentOccupation: string;
  workAndStudyPlaces: string[];
  basicDescription: string;
  freeDescription: string;
  attributes: string[];
  lookingForAttributes: string[];
  nonCompromisableAttributes: [string, string, string, string];
  desiredSectors: string[];
  desiredAgeMin: string;
  desiredAgeMax: string;
  appearanceDescription: string;
  appearanceMustHave: string;
  appearanceMustNotHave: string;
  generalDealBreakers: string;
  interests: string[];
  otherInterests: string[];
  futureVision: string;
  existingMatchProfile: string;
  proposePreference: string;
  shareInWhatsappGroups: boolean;
  isPublic: boolean;
  referencePhones: string[];
  nameForPrayer: string;
  referralSource: string;
  matchmakerExpectations: string;
  images: string[];
}

export const emptySingleForm = (): SingleFormState => ({
  firstName: '',
  lastName: '',
  phoneNumber: '',
  email: '',
  city: '',
  gender: '',
  sector: '',
  customSector: '',
  birthYear: '',
  marriageStatus: 'רווק/ה',
  numOfChildren: '0',
  ethnicity: '',
  customEthnicity: '',
  height: '',
  currentOccupation: '',
  workAndStudyPlaces: [],
  basicDescription: '',
  freeDescription: '',
  attributes: [],
  lookingForAttributes: [],
  nonCompromisableAttributes: ['', '', '', ''],
  desiredSectors: [],
  desiredAgeMin: '',
  desiredAgeMax: '',
  appearanceDescription: '',
  appearanceMustHave: '',
  appearanceMustNotHave: '',
  generalDealBreakers: '',
  interests: [],
  otherInterests: [],
  futureVision: '',
  existingMatchProfile: '',
  proposePreference: 'ללא העדפה',
  shareInWhatsappGroups: false,
  isPublic: false,
  referencePhones: [],
  nameForPrayer: '',
  referralSource: '',
  matchmakerExpectations: '',
  images: [],
});

const str = (v: string | number | undefined | null) => (v === undefined || v === null ? '' : String(v));

export function singleToForm(s: Single): SingleFormState {
  const nc = [...(s.nonCompromisableAttributes ?? []), '', '', '', ''].slice(0, 4) as SingleFormState['nonCompromisableAttributes'];
  return {
    ...emptySingleForm(),
    firstName: s.firstName,
    lastName: s.lastName,
    phoneNumber: s.phoneNumber,
    email: str(s.email),
    city: s.city,
    gender: s.gender,
    sector: s.sector,
    customSector: str(s.customSector),
    birthYear: str(s.birthYear),
    marriageStatus: s.marriageStatus,
    numOfChildren: str(s.numOfChildren ?? 0),
    ethnicity: s.ethnicity,
    customEthnicity: str(s.customEthnicity),
    height: str(s.height),
    currentOccupation: str(s.currentOccupation),
    workAndStudyPlaces: s.workAndStudyPlaces ?? [],
    basicDescription: str(s.basicDescription),
    freeDescription: str(s.freeDescription),
    attributes: s.attributes ?? [],
    lookingForAttributes: s.lookingForAttributes ?? [],
    nonCompromisableAttributes: nc,
    desiredSectors: s.desiredSectors ?? [],
    desiredAgeMin: str(s.desiredAgeRange?.min),
    desiredAgeMax: str(s.desiredAgeRange?.max),
    appearanceDescription: str(s.appearanceDescription),
    appearanceMustHave: str(s.appearanceMustHave),
    appearanceMustNotHave: str(s.appearanceMustNotHave),
    generalDealBreakers: str(s.generalDealBreakers),
    interests: s.interests ?? [],
    otherInterests: s.otherInterests ?? [],
    futureVision: str(s.futureVision),
    existingMatchProfile: str(s.existingMatchProfile),
    proposePreference: s.proposePreference,
    shareInWhatsappGroups: Boolean(s.shareInWhatsappGroups),
    isPublic: Boolean(s.isPublic),
    referencePhones: s.referencePhones ?? [],
    nameForPrayer: str(s.nameForPrayer),
    referralSource: str(s.referralSource),
    matchmakerExpectations: str(s.matchmakerExpectations),
    images: s.images ?? [],
  };
}

const toNumber = (v: string): number | undefined => {
  const trimmed = v.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
};

/** Strips spaces and dashes so "050-123 4567" passes the server's phone pattern. */
export const normalizePhone = (v: string) => v.replace(/[\s-]/g, '');

/**
 * Builds the API payload. Optional text fields are always sent (empty string
 * clears them on edit); numbers that were left empty are sent as null.
 */
export function formToPayload(f: SingleFormState): Partial<SingleFields> {
  const min = toNumber(f.desiredAgeMin);
  const max = toNumber(f.desiredAgeMax);
  const trimList = (list: string[]) => list.map((x) => x.trim()).filter(Boolean);
  return {
    firstName: f.firstName.trim(),
    lastName: f.lastName.trim(),
    phoneNumber: normalizePhone(f.phoneNumber),
    email: f.email.trim(),
    city: f.city.trim(),
    gender: f.gender as SingleFields['gender'],
    sector: f.sector as SingleFields['sector'],
    customSector: f.sector === 'אחר/ת' ? f.customSector.trim() : '',
    birthYear: toNumber(f.birthYear) as number,
    marriageStatus: f.marriageStatus as SingleFields['marriageStatus'],
    numOfChildren: toNumber(f.numOfChildren) ?? 0,
    ethnicity: f.ethnicity as SingleFields['ethnicity'],
    customEthnicity: f.ethnicity === 'אחר/ת' ? f.customEthnicity.trim() : '',
    height: (toNumber(f.height) ?? null) as number | undefined,
    currentOccupation: f.currentOccupation.trim(),
    workAndStudyPlaces: trimList(f.workAndStudyPlaces),
    basicDescription: f.basicDescription.trim(),
    freeDescription: f.freeDescription.trim(),
    attributes: trimList(f.attributes),
    lookingForAttributes: trimList(f.lookingForAttributes),
    nonCompromisableAttributes: f.nonCompromisableAttributes.map((x) => x.trim()),
    desiredSectors: f.desiredSectors as SingleFields['desiredSectors'],
    desiredAgeRange: min === undefined && max === undefined ? null : { min, max },
    appearanceDescription: f.appearanceDescription.trim(),
    appearanceMustHave: f.appearanceMustHave.trim(),
    appearanceMustNotHave: f.appearanceMustNotHave.trim(),
    generalDealBreakers: f.generalDealBreakers.trim(),
    interests: f.interests as SingleFields['interests'],
    otherInterests: trimList(f.otherInterests),
    futureVision: f.futureVision.trim(),
    existingMatchProfile: f.existingMatchProfile.trim(),
    proposePreference: f.proposePreference as SingleFields['proposePreference'],
    shareInWhatsappGroups: f.shareInWhatsappGroups,
    isPublic: f.isPublic,
    referencePhones: trimList(f.referencePhones).map(normalizePhone),
    nameForPrayer: f.nameForPrayer.trim(),
    referralSource: f.referralSource.trim(),
    matchmakerExpectations: f.matchmakerExpectations.trim(),
    images: f.images,
  };
}

const PHONE = /^\+?\d{7,15}$/;
const EMAIL = /.+@.+\..+/;

/** Client-side checks that mirror the server schema, with Hebrew messages. */
export function validateSingleForm(f: SingleFormState, now = new Date()): Record<string, string> {
  const e: Record<string, string> = {};
  const required: [keyof SingleFormState, string][] = [
    ['firstName', 'שם פרטי'],
    ['lastName', 'שם משפחה'],
    ['city', 'עיר מגורים'],
    ['gender', 'מגדר'],
    ['sector', 'מגזר'],
    ['marriageStatus', 'מצב משפחתי'],
    ['ethnicity', 'מוצא'],
  ];
  for (const [key, label] of required) {
    if (!String(f[key]).trim()) e[key] = `חסר ${label}`;
  }
  if (!PHONE.test(normalizePhone(f.phoneNumber))) e.phoneNumber = 'מספר טלפון לא תקין';
  if (f.email.trim() && !EMAIL.test(f.email.trim())) e.email = 'כתובת אימייל לא תקינה';

  const year = Number(f.birthYear);
  const thisYear = now.getFullYear();
  if (!f.birthYear.trim() || !Number.isInteger(year)) e.birthYear = 'חסרה שנת לידה';
  else if (year > thisYear - 18 || year < thisYear - 100) e.birthYear = 'שנת לידה לא סבירה';

  if (f.height.trim()) {
    const h = Number(f.height);
    if (!(h >= 50 && h <= 250)) e.height = 'גובה בס"מ, בין 50 ל־250';
  }
  const min = f.desiredAgeMin.trim() ? Number(f.desiredAgeMin) : undefined;
  const max = f.desiredAgeMax.trim() ? Number(f.desiredAgeMax) : undefined;
  if ((min !== undefined && min < 18) || (max !== undefined && max < 18)) e.desiredAgeRange = 'גיל מינימלי 18';
  else if (min !== undefined && max !== undefined && min > max) e.desiredAgeRange = 'הגיל המינימלי גדול מהמקסימלי';

  if (f.nonCompromisableAttributes.some((x) => !x.trim())) {
    e.nonCompromisableAttributes = 'צריך למלא בדיוק ארבע תכונות';
  }
  if (f.referencePhones.some((p) => p.trim() && !PHONE.test(normalizePhone(p)))) {
    e.referencePhones = 'אחד ממספרי הממליצים לא תקין';
  }
  return e;
}

/** Maps server validation paths (e.g. "desiredAgeRange.min") to form field keys. */
export function serverFieldsToForm(fields: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const path of Object.keys(fields)) {
    const key = path.split('.')[0];
    out[key] = 'הערך לא התקבל בשרת';
  }
  return out;
}
