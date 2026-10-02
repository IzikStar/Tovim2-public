import crypto from 'crypto';
import { describe, expect, it } from 'vitest';
import { Types } from 'mongoose';
import { MatchMaker } from '../src/models/matchMaker.js';
import { Token } from '../src/models/token.js';
import { api, createMatchMaker, matchMakerData } from './helpers.js';

describe('auth', () => {
  it('registers without returning the password and stores an scrypt hash', async () => {
    const data = matchMakerData();
    const res = await api().post('/matchmakers').send(data).expect(201);
    expect(res.body).not.toHaveProperty('password');
    expect(res.body.email).toBe(data.email);

    const stored = await MatchMaker.findById(res.body._id).select('+password').lean();
    expect(stored!.password).not.toBe(data.password);
    expect(stored!.password).toMatch(/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
  });

  it('salts per user: the same password gives different hashes', async () => {
    const a = await createMatchMaker({ password: 'same-password' });
    const b = await createMatchMaker({ password: 'same-password' });
    const [ha, hb] = await Promise.all(
      [a.id, b.id].map((id) => MatchMaker.findById(id).select('+password').lean())
    );
    expect(ha!.password).not.toBe(hb!.password);
  });

  it('logs in with correct credentials and rejects wrong ones', async () => {
    const mm = await createMatchMaker();
    expect(mm.token).toMatch(/^[a-f0-9]{64}$/);
    await api().post('/auth/login').send({ email: mm.email, password: 'wrong' }).expect(401);
    await api().post('/auth/login').send({ email: 'nobody@example.com', password: 'x' }).expect(401);
  });

  it('rejects operator injection in login', async () => {
    await createMatchMaker();
    await api()
      .post('/auth/login')
      .send({ email: { $ne: null }, password: { $ne: null } })
      .expect(400);
  });

  it('upgrades a legacy SHA-256 password hash on login', async () => {
    const mm = await createMatchMaker();
    const legacy = crypto.createHash('sha256').update('old-password').digest('hex');
    await MatchMaker.collection.updateOne(
      { _id: new Types.ObjectId(mm.id) },
      { $set: { password: legacy } }
    );
    await api().post('/auth/login').send({ email: mm.email, password: 'old-password' }).expect(200);
    const stored = await MatchMaker.findById(mm.id).select('+password').lean();
    expect(stored!.password).toMatch(/^scrypt\$/);
    await api().post('/auth/login').send({ email: mm.email, password: 'old-password' }).expect(200);
  });

  it('logout invalidates the token', async () => {
    const mm = await createMatchMaker();
    await api().get(`/matchmakers/${mm.id}/singles`).set(mm.auth).expect(200);
    await api().post('/auth/logout').set(mm.auth).expect(200);
    await api().get(`/matchmakers/${mm.id}/singles`).set(mm.auth).expect(401);
    expect(await Token.countDocuments()).toBe(0);
  });

  it('requires a well-formed Bearer header', async () => {
    const mm = await createMatchMaker();
    const url = `/matchmakers/${mm.id}/singles`;
    await api().get(url).expect(401);
    await api().get(url).set('Authorization', mm.token).expect(401);
    await api().get(url).set('Authorization', `Basic ${mm.token}`).expect(401);
    await api().get(url).set('Authorization', 'Bearer').expect(401);
    await api().get(url).set('Authorization', `Bearer ${mm.token} extra`).expect(401);
    await api().get(url).set('Authorization', 'Bearer not-a-real-token').expect(401);
    await api().get(url).set('Authorization', `bearer ${mm.token}`).expect(200);
  });
});
