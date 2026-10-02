import crypto from 'crypto';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, inject } from 'vitest';
// Register all models before syncing indexes
import '../src/models/matchMaker.js';
import '../src/models/single.js';
import '../src/models/token.js';
import '../src/models/transferRequest.js';

beforeAll(async () => {
  const dbName = `tovim_test_${crypto.randomBytes(6).toString('hex')}`;
  await mongoose.connect(inject('mongoUri'), { dbName });
  // Unique indexes must exist before tests that rely on duplicate-key errors
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
