import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  resolve: {
    alias: {
    "@": new URL("./src", import.meta.url).pathname,
  },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
