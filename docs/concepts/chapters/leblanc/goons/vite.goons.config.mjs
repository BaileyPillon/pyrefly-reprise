/**
 * Goons options round (FFX-2 only, chapter 6 Leblanc, Act I): the repo's Vite config plus one
 * middleware that answers /art/manifest.json and /art/characters/ffx2-{dr,fem}-goon/* from a
 * SCRATCH variant (D:/Tools/pyrefly-lora/goons/r3/art-scratch/<variant>/), so option candidates are
 * seen in battle without writing a byte under public/art. The active variant is the text of
 * art-scratch/ACTIVE, read per request; empty = the shipped build (the procedural placeholder).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../../../..');
const SCRATCH = 'D:/Tools/pyrefly-lora/goons/r3/art-scratch';

function scratchArt() {
  return {
    name: 'goons-scratch-art',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0];
        const active = existsSync(join(SCRATCH, 'ACTIVE')) ? readFileSync(join(SCRATCH, 'ACTIVE'), 'utf8').trim() : '';
        if (!active) return next();
        const dir = join(SCRATCH, active);
        if (url === '/art/manifest.json' && existsSync(join(dir, 'manifest.json'))) {
          res.setHeader('content-type', 'application/json');
          res.setHeader('cache-control', 'no-store');
          return res.end(readFileSync(join(dir, 'manifest.json')));
        }
        const m = url.match(/^\/art\/characters\/(ffx2-(?:dr|fem)-goon)\/([a-z0-9._-]+)$/i);
        if (!m) return next();
        const f = join(dir, 'characters', m[1], m[2]);
        res.setHeader('cache-control', 'no-store');
        if (!existsSync(f)) { res.statusCode = 404; return res.end('not in the scratch variant'); }
        res.setHeader('content-type', f.endsWith('.png') ? 'image/png' : 'application/json');
        return res.end(readFileSync(f));
      });
    },
  };
}

export default defineConfig({
  root: REPO,
  base: '/',
  publicDir: join(REPO, 'public'),
  plugins: [scratchArt()],
  server: { host: '127.0.0.1' },
  cacheDir: 'D:/Tools/pyrefly-lora/goons/r3/.vite-cache',
  optimizeDeps: { entries: ['index.html'] },
});
