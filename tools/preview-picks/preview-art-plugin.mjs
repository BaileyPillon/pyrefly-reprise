// DEV-ONLY (preview-picks branch, never merged): serves an EXTRA art root over the installed art, so candidate
// paintings play in the real game without being written under public/art. Used only through
// tools/preview-picks/vite.preview.config.mjs (a dev server); nothing under src/ knows about it and a build never loads it.
//
//   PREVIEW_ART_ROOT  folder shaped like public/art: <root>/characters/<artId>/<state>.png + <state>.json (+ @2x.png)
//   GET /__preview/off  -> the installed art alone ("live"); GET /__preview/on -> overlay on (the default)
//
// The manifest the page reads is public/art/manifest.json merged with a scan of the overlay (buildManifest from
// tools/gen/manifest.mjs): overlay states join the figure's states, a figure that exists only in the overlay is
// added with its own facing. An overlay file wins over the installed file of the same name.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildManifest } from '../gen/manifest.mjs';

export function previewArtPlugin({ overlayRoot, installedRoot }) {
  let on = true;
  const characters = join(overlayRoot, 'characters');
  return {
    name: 'preview-picks-art',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0];
        if (url === '/__preview/on' || url === '/__preview/off') {
          on = url.endsWith('/on');
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ overlay: on }));
          return;
        }
        if (!on) return next();
        if (url === '/art/manifest.json') {
          const base = JSON.parse(readFileSync(join(installedRoot, 'manifest.json'), 'utf8'));
          const extra = buildManifest(overlayRoot, { now: 'preview' }).manifest;
          for (const [id, sub] of Object.entries(extra.subjects)) {
            const cur = base.subjects[id];
            if (!cur) { base.subjects[id] = sub; continue; }
            cur.states = [...new Set([...cur.states, ...sub.states])].sort();
            if (sub.states2x?.length) cur.states2x = [...new Set([...(cur.states2x ?? []), ...sub.states2x])].sort();
          }
          res.setHeader('content-type', 'application/json');
          res.setHeader('cache-control', 'no-store');
          res.end(JSON.stringify(base));
          return;
        }
        const m = /^\/art\/characters\/([^/]+)\/([^/]+\.(?:png|json))$/.exec(url);
        if (m) {
          const p = join(characters, m[1], decodeURIComponent(m[2]));
          if (existsSync(p)) {
            res.setHeader('content-type', p.endsWith('.png') ? 'image/png' : 'application/json');
            res.setHeader('cache-control', 'no-store');
            res.end(readFileSync(p));
            return;
          }
        }
        next();
      });
    },
  };
}
