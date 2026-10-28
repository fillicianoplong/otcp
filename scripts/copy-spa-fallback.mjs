import { copyFile } from 'node:fs/promises';

// GitHub Pages serves 404.html for unknown paths and keeps the requested URL.
// Copying the built app there lets client routes such as /otcp/about refresh.
await copyFile('dist/index.html', 'dist/404.html');
