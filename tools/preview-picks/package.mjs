#!/usr/bin/env node
// Builds the INSTALL-READY packages from the staged preview art root (stage.mjs) + picks.json:
//   <out>/<set>/art/characters/<artId>/<state>.png|.json|@2x.png  (named as the game expects; copy `art/` onto public/art)
//   <out>/manifest.json  (target path, source, bytes, sha256, replaces?, abilityIds, game, wiring note) and per-set byte totals.
// Reads the installed art (read-only) only to tell NEW from REPLACE. Writes only under <out>; never public/art.
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const STAGE = 'D:/Tools/pyrefly-scratch/2026-10-03/visual-options/preview/art-root/characters';
const INSTALLED = 'D:/Final Fantasy/public/art/characters';
const OUT = process.argv[2] || 'D:/Tools/pyrefly-art-backup/candidates/2026-10-03-overnight/install-ready';
const picks = JSON.parse(readFileSync(join(HERE, 'picks.json'), 'utf8')).filter((p) => !p.hold && !p.previewOnly);
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');

// telegraph slot wiring today (r37 slots): only a boss whose AI emits a `charge` event shows it.
const FIRES_TODAY = new Set(['ffx2-bahamut', 'shuyin']);
const setOf = (p) => {
  if (p.set === 'new-figure') return `1-new-figure-${p.artId}`;
  if (p.set === 'apex') return p.game === 'ffx' ? '2-apex-ffx' : '3-apex-ffx2';
  if (p.set === 'telegraph') return FIRES_TODAY.has(p.artId) ? '4a-telegraph-fires-today' : '4b-telegraph-needs-wiring';
  if (p.set === 'reroll') return '5-rerolls-d333-d334';
  return p.set;
};

const entries = [];
const totals = {};
const copy = (from, to) => { mkdirSync(dirname(to), { recursive: true }); copyFileSync(from, to); };
for (const p of picks) {
  const set = setOf(p);
  const files = [`${p.state}.png`, `${p.state}.json`];
  if (existsSync(join(STAGE, p.artId, `${p.state}@2x.png`))) files.push(`${p.state}@2x.png`);
  for (const f of files) {
    const from = join(STAGE, p.artId, f);
    const rel = `characters/${p.artId}/${f}`;
    const to = join(OUT, set, 'art', rel);
    copy(from, to);
    const bytes = statSync(from).size;
    const inst = join(INSTALLED, p.artId, f);
    entries.push({
      set, game: p.game, target: `public/art/${rel}`, source: `${set}/art/${rel}`, bytes, sha256: sha(from),
      action: existsSync(inst) ? 'REPLACE' : 'NEW', ...(existsSync(inst) ? { replacesSha256: sha(inst), replacesBytes: statSync(inst).size } : {}),
      ...(p.abilityIds ? { abilityIds: p.abilityIds } : {}), ...(p.note ? { note: p.note } : {}),
      kind: f.endsWith('.json') ? 'sidecar' : f.includes('@2x') ? 'master2x' : 'painting',
    });
    totals[set] ??= { files: 0, paintings: 0, bytes: 0 };
    totals[set].files++; totals[set].bytes += bytes; if (f.endsWith('.png') && !f.includes('@2x')) totals[set].paintings++;
  }
}
const net = entries.reduce((a, e) => a + e.bytes - (e.replacesBytes ?? 0), 0);
const all = entries.reduce((a, e) => a + e.bytes, 0);
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({
  generated: new Date().toISOString(), note: 'Candidates for Bailey\'s pick (rule 9). Copy each set\'s art/ onto D:/Final Fantasy/public/art (the target paths), then node tools/gen/manifest.mjs; lock the hashes the way approved/2026-10-02-art/install.mjs does. A REPLACE entry lists the sha256 and size it replaces. Bytes are raw file bytes.',
  totalBytes: all, netBytesVsInstalled: net, sets: totals, files: entries,
}, null, 1));
console.log(JSON.stringify({ totals, totalBytes: all, netBytesVsInstalled: net }, null, 1));
