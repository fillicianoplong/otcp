import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

import { copyIndexHtmlTo404 } from './scripts/copySpa404.ts';

function spa404Fallback(): Plugin {
  let outDir = 'dist';

  return {
    name: 'spa404-fallback',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      copyIndexHtmlTo404(resolve(outDir));
    },
  };
}

export default defineConfig({
  base: '/otcp/',
  plugins: [react(), tailwindcss(), spa404Fallback()],
  test: {
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.ts', 'spikes/**/*.test.ts'],
  },
});
