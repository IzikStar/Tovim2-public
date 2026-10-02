import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/globalSetup.ts'],
    setupFiles: ['tests/setup.ts'],
    environment: 'node',
    testTimeout: 30_000,
    // First run of mongodb-memory-server may download a mongod binary
    hookTimeout: 180_000,
  },
});
