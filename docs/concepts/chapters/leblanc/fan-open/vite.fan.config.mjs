/**
 * PR-0096 in-game check (FFX-2 only): the repo's app served as it is, HMR and the watcher off
 * (other agents edit src/ meanwhile), its own optimizer cache on D:. The candidate reaches the page
 * only through Playwright request interception; nothing here serves or writes art.
 *   node node_modules/vite/bin/vite.js --config docs/concepts/chapters/leblanc/fan-open/vite.fan.config.mjs --port 5780 --strictPort
 */
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
export default defineConfig({
  root: REPO,
  base: '/',
  publicDir: join(REPO, 'public'),
  server: { host: '127.0.0.1', hmr: false, watch: null },
  cacheDir: 'D:/Tools/pyrefly-scratch/leblanc-fan/.vite-cache',
  optimizeDeps: { entries: ['index.html'] },
});
