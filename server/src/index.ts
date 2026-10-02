// Must be the first import: loads .env before app.ts reads process.env
import 'dotenv/config';
import { connectDB } from './config/db.js';
import { app } from './app.js';
import { hasDemoData, seedDemo } from './demo.js';
import logger from './utils/logger.js';

const port = process.env.PORT || 3000;

/**
 * MONGO_URI when set. Otherwise, with DEMO_MEMORY_DB=true, a throwaway
 * in-process MongoDB so a demo can run without a database account; its data
 * is lost on every restart.
 */
const resolveMongoUri = async (): Promise<string | undefined> => {
  if (process.env.MONGO_URI || process.env.DEMO_MEMORY_DB !== 'true') {
    return process.env.MONGO_URI;
  }
  const { MongoMemoryServer } = await import('mongodb-memory-server-core');
  const server = await MongoMemoryServer.create({
    instance: { args: ['--wiredTigerCacheSizeGB', '0.25'] },
  });
  logger.warn('MONGO_URI is not set: using an in-memory demo database that resets on restart');
  return server.getUri('tovim');
};

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled promise rejection', err);
});

// Establish MongoDB connection before starting the server
resolveMongoUri()
  .then(connectDB)
  .then(async () => {
    // A fresh demo deployment fills itself on first start
    if (process.env.SEED_DEMO === 'true' && !(await hasDemoData())) {
      await seedDemo();
    }
    app.listen(port, () => {
      logger.info(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    logger.error('Failed to start server', err);
    process.exit(1);
  });
