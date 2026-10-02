import { describe, expect, it } from 'vitest';
import { api, createMatchMaker } from './helpers.js';

describe('error handling', () => {
  it('bad ObjectId -> 400 instead of crashing', async () => {
    const mm = await createMatchMaker();
    const res = await api().put('/singles/not-an-id').set(mm.auth).send({ city: 'X' }).expect(400);
    expect(res.body).toEqual({ error: 'Invalid value for _id' });
    await api().delete('/singles/123').set(mm.auth).expect(400);
    // the server is still alive
    await api().get('/').expect(200);
  });

  it('malformed JSON -> 400', async () => {
    await api()
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":')
      .expect(400);
  });

  it('unknown route -> 404 JSON', async () => {
    const res = await api().get('/nope').expect(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('CORS allows the configured client origin only', async () => {
    const ok = await api().get('/').set('Origin', 'http://localhost:5173').expect(200);
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    const bad = await api().get('/').set('Origin', 'https://evil.example').expect(200);
    expect(bad.headers['access-control-allow-origin']).toBeUndefined();
  });
});
