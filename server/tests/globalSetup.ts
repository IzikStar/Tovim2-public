import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    mongoUri: string;
  }
}

let stop: (() => Promise<unknown>) | undefined;

/**
 * Integration tests need a real MongoDB:
 * - MONGO_URI set (CI uses a mongo:7 service container) -> use it; each test
 *   file gets its own throwaway database on that server.
 * - otherwise -> start mongodb-memory-server (downloads a mongod binary on
 *   first use; fails if fastdl.mongodb.org is unreachable).
 */
export default async function setup(project: TestProject) {
  let uri = process.env.MONGO_URI;
  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server-core');
    try {
      const server = await MongoMemoryServer.create();
      stop = () => server.stop();
      uri = server.getUri();
    } catch (err) {
      throw new Error(
        'Integration tests need MongoDB. Set MONGO_URI (e.g. docker run -p 27017:27017 mongo:7, ' +
          'then MONGO_URI=mongodb://127.0.0.1:27017) or allow mongodb-memory-server to download mongod.\n' +
          String(err)
      );
    }
  }
  project.provide('mongoUri', uri);
  return async () => {
    await stop?.();
  };
}
