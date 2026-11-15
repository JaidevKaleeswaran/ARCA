import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/{api,agents,mcp,security}/**/*.test.js'],
    testTimeout: 20000,
    hookTimeout: 20000,
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});
