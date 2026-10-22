#!/usr/bin/env node
/**
 * Make a NEW release art mirror that carries the lighting maps (release 60, the conference demo build; both games, shared plumbing). The why and the rules are in `tools/art-maps-mirror.mjs`; in short, a
 * release mirror is a folder of hard links, so this is a new folder: every file of the source mirror linked, the chosen maps linked at the paths the game asks for, `manifest.json` rebuilt so it lists them.
 *
 *   node tools/art-mirror-add-maps.mjs --from D:/pyrefly-art-demo --maps D:/pyrefly-art-maps --to D:/pyrefly-art-r60 --subjects tidus,yuna,... --backdrops gagazet,bevelle-underground [--tiers 1] [--dry]
 *
 *   --from       the source mirror (read only; its files are linked, never written)
 *   --maps       the maps folder (`MAPS-README.txt` there; read only; its files are linked, never written)
 *   --to         the new mirror: must not exist, must be on the same volume as --from and --maps
 *   --subjects   the figures to light: every chosen state of each (the source mirror's manifest), at --tiers
 *   --backdrops  the rooms to fog: `backdrops/<key>.depth.png`
 *   --tiers      1 = the base map (default), 1,2 = the base map and `@2x` where the painting has an @2x master. A normal map is smooth and the base map is one texel to a screen pixel at 1440p, so the
 *                demo build ships tier 1 only and the game draws a 2x or larger master with it (`engine/ArtManifestMaps.ts`)
 *   --dry        check everything and say what would be made; write nothing
 *
 * Exit: 0 made and proved; 1 made but not proved; 2 usage; 3 refused before writing anything. The release then points its `public/art` junction at --to.
 */
import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

import { buildMapsMirror, planMapsMirror, verifyMapsMirror } from './art-maps-mirror.mjs';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const get = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const list = (s) => (s ?? '').split(',').map((x) => x.trim()).filter(Boolean);
const mb = (n) => `${(n / 1e6).toFixed(1)} MB`;

function main() {
  const [from, maps, to] = [get('--from'), get('--maps'), get('--to')];
  if (!from || !maps || !to) { console.error('usage: node tools/art-mirror-add-maps.mjs --from <source mirror> --maps <maps folder> --to <new mirror> --subjects a,b [--backdrops x,y] [--tiers 1|1,2] [--dry]  (see the header)'); return 2; }
  const tiers = list(get('--tiers', '1')).map(Number);
  const plan = planMapsMirror({ from, mapsRoot: maps, to, subjects: list(get('--subjects')), backdrops: list(get('--backdrops')), tiers });
  for (const p of plan.problems) console.error(`REFUSED  ${p}`);
  if (!plan.ok) { console.error(`art-mirror-add-maps: refused, ${plan.problems.length} problem(s); nothing was written`); return 3; }
  const bytes = plan.maps.reduce((n, m) => n + statSync(m.from).size, 0);
  const normal = plan.maps.filter((m) => m.kind === 'normal');
  console.log(`art-mirror-add-maps: ${plan.links.length} file(s) of ${resolve(from)} to hard-link, ${normal.length} normal map(s) of ${new Set(normal.map((m) => m.subject)).size} figure(s) at tier(s) ${tiers.join('+')} and ${plan.maps.length - normal.length} depth map(s) (${mb(bytes)} as made) to hard-link from ${resolve(maps)}, manifest.json rebuilt, into ${resolve(to)}`);
  if (plan.uncovered.length) console.log(`art-mirror-add-maps: ${plan.uncovered.length} map(s) asked for that the maps folder does not hold (not linked, not listed): ${plan.uncovered.slice(0, 12).join(', ')}${plan.uncovered.length > 12 ? ', ...' : ''}`);
  if (flag('--dry')) { console.log('art-mirror-add-maps: --dry, nothing written'); return 0; }
  const made = buildMapsMirror({ from, to, plan, log: console.log });
  console.log(`art-mirror-add-maps: linked ${made.linked} file(s) and ${made.maps} map(s); manifest lightMaps lists ${made.lightMaps.normal} normal map(s) of ${made.lightMaps.subjects} figure(s) and ${made.lightMaps.depth} depth map(s)`);
  const proved = verifyMapsMirror({ from, to, plan });
  console.log(`art-mirror-add-maps: ${proved.ok ? 'PROVED' : 'NOT PROVED'}: ${proved.files} file(s) in the new mirror, ${proved.linked} linked to the source's, ${proved.maps} map(s) linked to the maps folder's (${mb(proved.bytes)})`);
  for (const p of proved.problems.slice(0, 40)) console.log(`  PROBLEM ${p}`);
  return proved.ok ? 0 : 1;
}

process.exitCode = main();
