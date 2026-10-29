import { defineConfig } from 'vitest/config'

// Unit tests cover the pure logic (algebra, SQL engine, ER model) and need no React plugin.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
})
