// Lighting mockups (branch lighting-mockups, never merged): the repo's Vite config for a DEV server only, with HMR off
// (a measurement run must not reload under its feet), a private dep cache, and a middleware that serves the derived
// light maps (normal maps of the approved paintings, made by tools/lighting/normals.py) from the scratch folder at
// `/__lightmaps/`. Nothing is written into public/art and nothing here reaches a build.
//   npx vite --config tools/lighting/vite-lighting.config.mjs --port 6944 --strictPort
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, normalize } from 'node:path';
import base from '../../vite.config.ts';

const MAPS = process.env.PYREFLY_LIGHT_MAPS || 'D:/Tools/pyrefly-scratch/2026-10-06/lighting/normals';
const TYPES = { '.png': 'image/png', '.json': 'application/json', '.webp': 'image/webp' };

function lightMaps() {
  return {
    name: 'pyrefly-light-maps',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__lightmaps/', (req, res, next) => {
        const rel = decodeURIComponent((req.url || '').split('?')[0]).replace(/^\/+/, '');
        const file = normalize(join(MAPS, rel));
        if (!file.startsWith(normalize(MAPS)) || !existsSync(file) || !statSync(file).isFile()) return next();
        const ext = file.slice(file.lastIndexOf('.'));
        res.setHeader('Content-Type', TYPES[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-store');
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default (env) => {
  const c = typeof base === 'function' ? base(env) : base;
  return {
    ...c,
    plugins: [...(c.plugins ?? []), lightMaps()],
    cacheDir: process.env.LIGHT_CACHE || 'D:/Tools/pyrefly-scratch/2026-10-06/lighting/vite-cache',
    // No HMR socket, and a watcher that skips the big folders (an idle default watcher holds about 93,000 files): a source edit
    // still invalidates its module, a measurement run is never reloaded under its feet.
    server: {
      ...(c.server ?? {}),
      hmr: false,
      fs: { strict: false },
      strictPort: true,
      watch: { ignored: ['**/node_modules/**', '**/public/**', '**/docs/**', '**/critic/**', '**/research/**', '**/dist/**', '**/.git/**', '**/tools/**', '**/tests/**'] },
    },
  };
};
