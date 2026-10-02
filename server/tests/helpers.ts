import request from 'supertest';
import { app } from '../src/app.js';
import { Gender, Sector, MarriageStatus, Ethnicity } from '../src/models/enums.js';

export const api = () => request(app);

let counter = 0;
const unique = () => `${Date.now()}${++counter}`;

export const matchMakerData = (overrides: Record<string, unknown> = {}) => ({
  firstName: 'Rivka',
  lastName: 'Cohen',
  phoneNumber: '0501234567',
  email: `mm${unique()}@example.com`,
  password: 'correct horse battery',
  city: 'Jerusalem',
  gender: Gender.FEMALE,
  sector: Sector.DATI_LEUMI,
  expertSectors: [Sector.DATI_LEUMI],
  ...overrides,
});

export const singleData = (overrides: Record<string, unknown> = {}) => ({
  firstName: 'David',
  lastName: 'Levi',
  phoneNumber: '0521112233',
  email: `single${unique()}@example.com`,
  city: 'Haifa',
  gender: Gender.MALE,
  sector: Sector.DATI_LEUMI,
  birthYear: 1997,
  marriageStatus: MarriageStatus.SINGLE,
  ethnicity: Ethnicity.MIXED,
  nonCompromisableAttributes: ['a', 'b', 'c', 'd'],
  basicDescription: 'Kind and curious',
  freeDescription: 'Call my sister on 0549998877',
  referencePhones: ['0547654321'],
  nameForPrayer: 'David ben Sarah',
  images: ['data:image/png;base64,AAAA'],
  isPublic: true,
  ...overrides,
});

export interface LoggedInMatchMaker {
  id: string;
  token: string;
  auth: { Authorization: string };
  email: string;
  password: string;
}

/** Registers a matchmaker through the API and logs in. */
export const createMatchMaker = async (
  overrides: Record<string, unknown> = {}
): Promise<LoggedInMatchMaker> => {
  const data = matchMakerData(overrides);
  const created = await api().post('/matchmakers').send(data).expect(201);
  const login = await api()
    .post('/auth/login')
    .send({ email: data.email, password: data.password })
    .expect(200);
  return {
    id: created.body._id,
    token: login.body.token,
    auth: { Authorization: `Bearer ${login.body.token}` },
    email: data.email,
    password: data.password,
  };
};

/** Creates a single owned by the given matchmaker. */
export const createSingle = async (
  owner: LoggedInMatchMaker,
  overrides: Record<string, unknown> = {}
) => {
  const res = await api()
    .post('/singles')
    .set(owner.auth)
    .send({ ...singleData(overrides), matchMakerId: owner.id })
    .expect(201);
  return res.body as { _id: string; matchMakers: string[] };
};
