import type {
  MatchMaker,
  MatchMakerInput,
  MatchMakerSummary,
  Proposal,
  ProposalStatus,
  ProposalUpdate,
  PublicSingle,
  RequestsResponse,
  Single,
  SingleFields,
  Suggestion,
  BrainstormIdea,
  BrainstormMode,
} from './types';

const BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const TOKEN_KEY = 'tovim.token';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Per-field validation messages from the server (400 "Validation failed") */
    public readonly fields: Record<string, string> = {}
  ) {
    super(message);
  }
}

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string | null) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Storage can be unavailable (private mode); the session then lasts until reload
    }
  },
};

/** Called when the server rejects the stored token, so the app can log out. */
let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'אין חיבור לשרת. כדאי לבדוק שהשרת רץ ולנסות שוב.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(res.status, translateError(res.status, data?.error), data?.fields ?? {});
  }
  return data as T;
}

const SERVER_MESSAGES: Record<string, string> = {
  'Invalid credentials': 'אימייל או סיסמה שגויים',
  'Duplicate value': 'כבר קיימת רשומה עם האימייל הזה',
  'Validation failed': 'חלק מהשדות לא תקינים',
  'A pending request already exists': 'כבר נשלחה בקשה ממתינה לשדכן/ית הזה/ו',
  'Matchmaker already handles this single': 'השדכן/ית כבר מטפל/ת במועמד/ת',
  'Only pending requests can be approved or rejected': 'הבקשה כבר טופלה',
  'Payload too large': 'התמונות גדולות מדי. אפשר להעלות פחות תמונות או קטנות יותר',
  'Matchmaker not found': 'השדכן/ית לא נמצא/ה',
  'Single not found': 'המועמד/ת לא נמצא/ה',
  'Proposal already exists': 'כבר יש הצעה פתוחה לזוג הזה',
  'A proposal needs a man and a woman': 'הצעה היא בין בחור לבחורה',
  'Single is already taken': 'אחד הצדדים כבר תפוס/ה',
};

export function translateError(status: number, serverMessage?: string): string {
  if (serverMessage && SERVER_MESSAGES[serverMessage]) return SERVER_MESSAGES[serverMessage];
  if (status === 401) return 'צריך להתחבר מחדש';
  if (status === 403) return 'אין לך הרשאה לפעולה הזו';
  if (status === 404) return 'לא נמצא';
  if (status >= 500) return 'שגיאה בשרת. נסו שוב בעוד רגע';
  return 'הבקשה נכשלה';
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; matchMakerId: string }>('POST', '/auth/login', { email, password }),
  logout: () => request<{ message: string }>('POST', '/auth/logout'),

  signup: (input: MatchMakerInput) => request<MatchMaker>('POST', '/matchmakers', input),
  me: () => request<MatchMaker>('GET', '/matchmakers/me'),
  updateMe: (id: string, input: Partial<MatchMakerInput>) =>
    request<MatchMaker>('PUT', `/matchmakers/${id}`, input),
  publicMatchMaker: (id: string) =>
    request<Pick<MatchMaker, '_id' | 'firstName' | 'lastName' | 'city'>>('GET', `/matchmakers/${id}/public`),
  mySingles: (id: string) => request<Single[]>('GET', `/matchmakers/${id}/singles`),
  myCouples: (id: string) => request<Single[]>('GET', `/matchmakers/${id}/married`),
  otherMatchMakers: (id: string) => request<MatchMakerSummary[]>('GET', `/matchmakers/${id}/others`),
  adoptSingle: (id: string, singleId: string) =>
    request<Single>('POST', `/matchmakers/${id}/add-single/${singleId}`),

  publicSingles: () => request<PublicSingle[]>('GET', '/singles/public'),
  single: (id: string) => request<Single>('GET', `/singles/${id}`),
  createSingle: (matchMakerId: string, fields: Partial<SingleFields>) =>
    request<Single>('POST', '/singles', { ...fields, matchMakerId }),
  updateSingle: (id: string, fields: Partial<SingleFields>) => request<Single>('PUT', `/singles/${id}`, fields),
  deleteSingle: (id: string) => request<{ message: string }>('DELETE', `/singles/${id}`),
  registerSingle: (matchMakerId: string, fields: Partial<SingleFields>) =>
    request<Single>('POST', `/singles/register/${matchMakerId}`, fields),

  proposals: (singleId?: string) =>
    request<Proposal[]>('GET', `/proposals${singleId ? `?single=${singleId}` : ''}`),
  createProposal: (singleIds: [string, string], status: ProposalStatus = 'idea', notes?: string) =>
    request<Proposal>('POST', '/proposals', { singleIds, status, notes }),
  updateProposal: (id: string, update: ProposalUpdate) => request<Proposal>('PUT', `/proposals/${id}`, update),
  deleteProposal: (id: string) => request<{ message: string }>('DELETE', `/proposals/${id}`),
  suggestions: (singleId?: string, limit = 12) =>
    request<Suggestion[]>('GET', `/proposals/suggestions?limit=${limit}${singleId ? `&single=${singleId}` : ''}`),

  brainstorm: (mode: BrainstormMode, { single, count = 6 }: { single?: string; count?: number } = {}) =>
    request<BrainstormIdea[]>('GET', `/proposals/brainstorm?mode=${mode}&count=${count}${single ? `&single=${single}` : ''}`),

  requests: () => request<RequestsResponse>('GET', '/requests'),
  sendRequest: (singleId: string, toMatchMakerId: string) =>
    request<unknown>('POST', '/requests', { singleId, toMatchMakerId }),
  approveRequest: (id: string) => request<unknown>('POST', `/requests/${id}/approve`),
  rejectRequest: (id: string) => request<unknown>('POST', `/requests/${id}/reject`),
};
