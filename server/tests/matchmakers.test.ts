import { describe, expect, it } from 'vitest';
import { MatchMaker } from '../src/models/matchMaker.js';
import { Sector } from '../src/models/enums.js';
import { api, createMatchMaker, createSingle, matchMakerData } from './helpers.js';

describe('matchmakers', () => {
  it('PUT hashes a new password instead of storing it in plain text', async () => {
    const mm = await createMatchMaker();
    const res = await api()
      .put(`/matchmakers/${mm.id}`)
      .set(mm.auth)
      .send({ password: 'brand-new-password', city: 'Tel Aviv' })
      .expect(200);
    expect(res.body).not.toHaveProperty('password');
    expect(res.body.city).toBe('Tel Aviv');

    const stored = await MatchMaker.findById(mm.id).select('+password').lean();
    expect(stored!.password).not.toBe('brand-new-password');
    expect(stored!.password).toMatch(/^scrypt\$/);

    await api().post('/auth/login').send({ email: mm.email, password: mm.password }).expect(401);
    await api()
      .post('/auth/login')
      .send({ email: mm.email, password: 'brand-new-password' })
      .expect(200);
  });

  it('query-based updates hash the password too', async () => {
    const mm = await createMatchMaker();
    await MatchMaker.findByIdAndUpdate(mm.id, { password: 'via-query' });
    const stored = await MatchMaker.findById(mm.id).select('+password').lean();
    expect(stored!.password).toMatch(/^scrypt\$/);
  });

  it('PUT ignores fields that are not whitelisted', async () => {
    const mm = await createMatchMaker();
    const res = await api()
      .put(`/matchmakers/${mm.id}`)
      .set(mm.auth)
      .send({ _id: '000000000000000000000000', createdAt: '2000-01-01', isAdmin: true, city: 'Safed' })
      .expect(200);
    expect(res.body._id).toBe(mm.id);
    expect(res.body.isAdmin).toBeUndefined();
    expect(new Date(res.body.createdAt).getFullYear()).not.toBe(2000);
  });

  it('POST ignores fields that are not whitelisted', async () => {
    const res = await api()
      .post('/matchmakers')
      .send({ ...matchMakerData(), _id: '000000000000000000000001', role: 'admin' })
      .expect(201);
    expect(res.body._id).not.toBe('000000000000000000000001');
    expect(res.body.role).toBeUndefined();
  });

  it('PUT validates input', async () => {
    const mm = await createMatchMaker();
    const res = await api().put(`/matchmakers/${mm.id}`).set(mm.auth).send({ sector: 'nope' }).expect(400);
    expect(res.body.fields).toHaveProperty('sector');
  });

  it('cannot update or delete another matchmaker', async () => {
    const a = await createMatchMaker();
    const b = await createMatchMaker();
    await api().put(`/matchmakers/${b.id}`).set(a.auth).send({ city: 'X' }).expect(403);
    await api().delete(`/matchmakers/${b.id}`).set(a.auth).expect(403);
  });

  it('duplicate email -> 409', async () => {
    const data = matchMakerData();
    await api().post('/matchmakers').send(data).expect(201);
    await api().post('/matchmakers').send(data).expect(409);
  });

  it('GET /:id/others returns only safe fields', async () => {
    const me = await createMatchMaker();
    await createMatchMaker({ firstName: 'Other', expertSectors: [Sector.HAREDI] });
    const res = await api().get(`/matchmakers/${me.id}/others`).set(me.auth).expect(200);
    expect(res.body).toHaveLength(1);
    expect(Object.keys(res.body[0]).sort()).toEqual(
      ['_id', 'city', 'expertSectors', 'firstName', 'lastName', 'sector'].sort()
    );
    expect(res.body[0].expertSectors).toEqual([Sector.HAREDI]);
  });

  it('GET /:id/others and /:id/singles are only for the owner', async () => {
    const a = await createMatchMaker();
    const b = await createMatchMaker();
    await api().get(`/matchmakers/${b.id}/others`).set(a.auth).expect(403);
    await api().get(`/matchmakers/${b.id}/singles`).set(a.auth).expect(403);
  });

  it('add-single adds a public single to the matchmaker', async () => {
    const owner = await createMatchMaker();
    const other = await createMatchMaker();
    const pub = await createSingle(owner, { isPublic: true });
    const priv = await createSingle(owner, { isPublic: false });
    const res = await api().post(`/matchmakers/${other.id}/add-single/${pub._id}`).set(other.auth).expect(200);
    expect(res.body.matchMakers).toEqual([owner.id, other.id]);
    await api().post(`/matchmakers/${other.id}/add-single/${priv._id}`).set(other.auth).expect(404);
    const mine = await api().get(`/matchmakers/${other.id}/singles`).set(other.auth).expect(200);
    expect(mine.body.map((s: { _id: string }) => s._id)).toEqual([pub._id]);
  });

  it('DELETE removes the matchmaker and its tokens', async () => {
    const mm = await createMatchMaker();
    await api().delete(`/matchmakers/${mm.id}`).set(mm.auth).expect(200);
    await api().get(`/matchmakers/${mm.id}/singles`).set(mm.auth).expect(401);
  });
  it('GET /me returns the logged-in profile without the password', async () => {
    const mm = await createMatchMaker({ firstName: 'Miriam' });
    const res = await api().get('/matchmakers/me').set(mm.auth).expect(200);
    expect(res.body._id).toBe(mm.id);
    expect(res.body.firstName).toBe('Miriam');
    expect(res.body).not.toHaveProperty('password');
    await api().get('/matchmakers/me').expect(401);
  });

  it('GET /:id/public exposes only name and city, for registration links', async () => {
    const mm = await createMatchMaker({ firstName: 'Miriam', city: 'Safed' });
    const res = await api().get(`/matchmakers/${mm.id}/public`).expect(200);
    expect(Object.keys(res.body).sort()).toEqual(['_id', 'city', 'firstName', 'lastName']);
    expect(res.body.city).toBe('Safed');
    await api().get('/matchmakers/000000000000000000000000/public').expect(404);
    await api().get('/matchmakers/not-an-id/public').expect(404);
  });
});
