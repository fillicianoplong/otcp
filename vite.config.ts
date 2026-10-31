import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/otcp/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.ts', 'spikes/**/*.test.ts'],
  },
});
