/**
 * Loads the demo data (see src/demo.ts) into the database:
 *
 *   MONGO_URI=mongodb://127.0.0.1:27017/tovim npm run seed
 *
 * Safe to re-run: it removes only the records it created before (by email
 * domain) and inserts them again. Nothing else in the database is touched.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { seedDemo } from '../demo.js';

const run = async () => {
  await connectDB();
  await seedDemo();
};

run()
  .then(() => mongoose.disconnect())
  .catch(async (err) => {
    console.error(err);
    await mongoose.disconnect();
    process.exit(1);
  });
