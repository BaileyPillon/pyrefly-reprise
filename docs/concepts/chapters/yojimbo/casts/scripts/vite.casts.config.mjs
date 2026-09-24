/**
 * Yojimbo casts capture (FFX only): the repo's game, served on its own port with no HMR and no
 * watcher (other agents edit src/ meanwhile) and its own optimizer cache on D:. Candidates are never
 * served from here: ingame.mjs swaps them in with Playwright request interception.
 */
import { join } from 'node:path';
import { defineConfig } from 'vite';

const REPO = 'D:/Final Fantasy';
export default defineConfig({
  root: REPO,
  base: '/',
  publicDir: join(REPO, 'public'),
  server: { host: '127.0.0.1', hmr: false, watch: null },
  cacheDir: 'D:/Tools/pyrefly-scratch/yoj-casts/.vite-cache',
  optimizeDeps: { entries: ['index.html'] },
});
