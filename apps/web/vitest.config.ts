import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  css: {
    postcss: { plugins: [] },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    poolOptions: { forks: { singleFork: true } },
  },
})
