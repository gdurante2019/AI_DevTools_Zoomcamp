import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Some sandboxed environments don't like worker pools; force a single worker.
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    testTimeout: 10_000,
    hookTimeout: 10_000,
  },
});

