// Mirrors server/src/models. Enum values are the Hebrew strings the server stores.

export const GENDERS = ['זכר', 'נקבה'] as const;
export type Gender = (typeof GENDERS)[number];

export const SECTORS = [
  'חרדי/ת',
  'חסידי/ת',
  'ליטאי/ת',
  'דתי/ה לאומי/ת',
  'חרדלי/ת',
  'מסורתי/ת',
  'חילוני/ת',
  'אחר/ת',
] as const;
export type Sector = (typeof SECTORS)[number];

export const MARRIAGE_STATUSES = ['רווק/ה', 'גרוש/ה', 'אלמן/ה'] as const;
export type MarriageStatus = (typeof MARRIAGE_STATUSES)[number];

export const ETHNICITIES = ['אשכנזי/ה', 'עדות המזרח', 'תימני/ת', 'מעורב/ת', 'אחר/ת'] as const;
export type Ethnicity = (typeof ETHNICITIES)[number];

export const INTERESTS = [
  'תורה', 'ספורט', 'מוסיקה', 'אמנות', 'טכנולוגיה', 'נסיעות', 'בישול', 'התנדבות',
  'קריאה', 'שחמט', 'גינון', 'צילום', 'כתיבה', 'קולנוע', 'תיאטרון', 'ריקוד', 'יוגה',
  'מדיטציה', 'ריצה', 'אופניים', 'טיולים', 'שחיה', 'ציור', 'תרבות קפה', 'טעימות יין',
  'בישול בירה', 'גיימינג', 'משחקי קופסה', 'פילוסופיה', 'פוליטיקה', 'טבע', 'מדע',
  'היסטוריה', 'אופנה', 'דיג', 'טיפוס הרים', 'אסטרונומיה', 'שירה',
] as const;
export type Interest = (typeof INTERESTS)[number];

export const PROPOSE_PREFERENCES = [
  'ללא העדפה',
  'מעוניין/ת שיציעו לי קודם',
  'מעוניין/ת שיציעו קודם לצד השני',
] as const;
export type ProposePreference = (typeof PROPOSE_PREFERENCES)[number];

export interface MatchMaker {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  city: string;
  gender: Gender;
  sector: Sector;
  expertSectors: Sector[];
  ageRange?: AgeRange | null;
  priceRange?: AgeRange | null;
  about?: string;
}

export type MatchMakerSummary = Pick<MatchMaker, '_id' | 'firstName' | 'lastName' | 'city'> &
  Partial<Pick<MatchMaker, 'sector' | 'expertSectors'>>;

export interface MatchMakerInput {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
  city: string;
  gender: Gender | '';
  sector: Sector | '';
  expertSectors: Sector[];
  ageRange?: AgeRange | null;
  priceRange?: AgeRange | null;
  about?: string;
}

export interface AgeRange {
  min?: number;
  max?: number;
}

/** Everything a matchmaker or the single can edit (server: SINGLE_EDITABLE_FIELDS). */
export interface SingleFields {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  city: string;
  gender: Gender;
  /** One or more */
  sectors: Sector[];
  customSector?: string;
  /** ISO date (YYYY-MM-DD or a full timestamp) */
  birthDate: string;
  marriageStatus: MarriageStatus;
  numOfChildren: number;
  ethnicity: Ethnicity;
  customEthnicity?: string;
  workAndStudyPlaces: string[];
  currentOccupation?: string;
  basicDescription?: string;
  freeDescription?: string;
  attributes: string[];
  lookingForAttributes: string[];
  nonCompromisableAttributes: string[];
  desiredSectors: Sector[];
  isPublic: boolean;
  images: string[];
  height?: number;
  appearanceDescription?: string;
  appearanceMustHave?: string;
  appearanceMustNotHave?: string;
  generalDealBreakers?: string;
  interests: Interest[];
  otherInterests: string[];
  futureVision?: string;
  existingMatchProfile?: string;
  shareInWhatsappGroups: boolean;
  proposePreference: ProposePreference;
  referencePhones: string[];
  nameForPrayer?: string;
  referralSource?: string;
  matchmakerExpectations?: string;
  desiredAgeRange?: AgeRange | null;
}

export interface Single extends SingleFields {
  _id: string;
  /** Derived from birthDate by the server */
  age: number;
  matchMakers: string[];
  /** Married or engaged: off the active lists and the pool */
  isTaken?: boolean;
  marriedMatchmaker?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * What GET /singles/public returns (server: SINGLE_PUBLIC_PROJECTION): the
 * age, never the exact birth date.
 */
export type PublicSingle = Pick<
  Single,
  | '_id'
  | 'firstName'
  | 'gender'
  | 'sectors'
  | 'customSector'
  | 'age'
  | 'city'
  | 'marriageStatus'
  | 'numOfChildren'
  | 'ethnicity'
  | 'customEthnicity'
  | 'height'
  | 'currentOccupation'
  | 'basicDescription'
  | 'interests'
  | 'otherInterests'
  | 'desiredSectors'
  | 'desiredAgeRange'
>;

export type RequestStatus = 'pending' | 'approved' | 'rejected';

type SingleSummary = Pick<Single, '_id' | 'firstName' | 'lastName' | 'gender' | 'sectors' | 'customSector' | 'age' | 'city'>;

interface TransferRequestBase {
  _id: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  /** null when the single was deleted after the request was made */
  single: SingleSummary | null;
}

export interface IncomingRequest extends TransferRequestBase {
  from: MatchMakerSummary | null;
  to: string;
}

export interface OutgoingRequest extends TransferRequestBase {
  from: string;
  to: MatchMakerSummary | null;
}

export interface RequestsResponse {
  incoming: IncomingRequest[];
  outgoing: OutgoingRequest[];
}

// ---------- proposals ----------

export const PROPOSAL_STATUSES = ['idea', 'proposed', 'dating', 'engaged', 'married', 'closed'] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const SIDE_RESPONSES = ['pending', 'thinking', 'yes', 'no'] as const;
export type SideResponse = (typeof SIDE_RESPONSES)[number];

/** One side of a proposal as the server returns it (no images or contacts). */
export interface ProposalPerson {
  _id: string;
  firstName: string;
  /** Only for singles the matchmaker handles */
  lastName?: string;
  gender: Gender;
  sectors: Sector[];
  customSector?: string;
  age: number;
  city: string;
  currentOccupation?: string;
  mine: boolean;
}

export interface ProposalSide {
  /** null when the single was deleted */
  single: ProposalPerson | null;
  response: SideResponse;
  note?: string;
  respondedAt?: string;
}

export interface ProposalEvent {
  status: ProposalStatus;
  /** A status change (default), or the proposal put on hold / taken off it */
  kind?: 'status' | 'hold' | 'resume';
  at: string;
  note?: string;
}

/** Paused until a date because a side isn't available; the status is kept. */
export interface ProposalHold {
  until: string;
  since: string;
  /** Single ids of the sides that aren't available */
  unavailable: string[];
  reason?: string;
}

export interface Proposal {
  _id: string;
  sides: ProposalSide[];
  status: ProposalStatus;
  notes?: string;
  datesCount: number;
  closeReason?: string;
  history: ProposalEvent[];
  hold?: ProposalHold | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalUpdate {
  status?: ProposalStatus;
  statusNote?: string;
  notes?: string;
  datesCount?: number;
  closeReason?: string;
  sides?: { single: string; response?: SideResponse; note?: string }[];
  /** Put on hold (or snooze again); null takes it off hold */
  hold?: { until: string; unavailable?: string[]; reason?: string } | null;
}

export interface SuggestionPerson {
  _id: string;
  firstName: string;
  lastName?: string;
  gender: Gender;
  sectors: Sector[];
  age: number;
  city: string;
  currentOccupation?: string;
  mine: boolean;
}

export interface Suggestion {
  single: SuggestionPerson;
  candidate: SuggestionPerson;
  score: number;
  reasons: string[];
}

// ---------- brainstorm ----------

export const BRAINSTORM_MODES = ['random', 'pool', 'waiting', 'outside', 'single'] as const;
export type BrainstormMode = (typeof BRAINSTORM_MODES)[number];

/** A brainstorm pair; score ignores sector/age requirements, stretches lists the ones it breaks. */
export interface BrainstormIdea extends Suggestion {
  stretches: string[];
  note?: string;
}
