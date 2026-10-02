import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { MatchMaker } from '../src/models/matchMaker.js';
import { Single } from '../src/models/single.js';
import { app as apiApp, createApp } from '../src/app.js';
import { hasDemoData, seedDemo } from '../src/demo.js';

describe('serving the built client (CLIENT_DIST)', () => {
  it('serves the app on client routes and the API under /api', async () => {
    const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'tovim-dist-'));
    fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><title>tovim</title>');
    const app = createApp({ clientDist: dist });

    const page = await request(app).get('/singles/123').expect(200);
    expect(page.text).toContain('<title>tovim</title>');
    await request(app).get('/').expect(200).expect('Content-Type', /html/);

    const hello = await request(app).get('/api/').expect(200);
    expect(hello.body).toEqual({ message: 'Hello from Express + TypeScript' });
    await request(app).get('/api/singles/123').expect(401);

    const missing = await request(app).get('/api/nope').expect(404);
    expect(missing.body).toEqual({ error: 'Not found' });
  });
});

describe('demo data', () => {
  it('seeds once and can log in with the demo account', async () => {
    expect(await hasDemoData()).toBe(false);
    await seedDemo();
    expect(await hasDemoData()).toBe(true);
    expect(await MatchMaker.countDocuments()).toBe(2);
    expect(await Single.countDocuments()).toBe(10);

    await request(apiApp)
      .post('/auth/login')
      .send({ email: 'rachel@demo.tovim.example', password: 'demo-password' })
      .expect(200);

    // Re-running replaces rather than duplicates
    await seedDemo();
    expect(await MatchMaker.countDocuments()).toBe(2);
  });
});
