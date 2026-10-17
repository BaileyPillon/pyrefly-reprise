#!/usr/bin/env node
/**
 * Make a NEW release art mirror that carries the rigs (the rig program; both games, shared plumbing). The why and the rules are in `tools/rig/rig-mirror.mjs`; in short, a release mirror
 * is a folder of hard links to the live art, so a rig release is a new folder: every existing file linked (none opened for writing), `manifest.json` and `rigs/<subject>/` real files of its own.
 *
 *   node tools/art-mirror-add-rigs.mjs --from D:/pyrefly-art-r50 --rigs D:/pyrefly-art-rigs --to D:/pyrefly-art-r51 [--subjects kimahri,rikku] [--make-tiers] [--dry]
 *
 *   --from      the source mirror (read only; its files are linked, never written)
 *   --rigs      the rig root: <rigs>/<subject>/rig.json, the part PNGs, and their 1x tier (default D:/pyrefly-art-rigs)
 *   --to        the new mirror: must not exist, must be on the same volume as --from
 *   --subjects  which rigs to add (default: every rig in --rigs); each must verify as a shipping rig against --from's paintings, or nothing is written
 *   --make-tiers  write the 1x tier into the NEW copy of each rig instead of requiring it in --rigs
 *   --dry       check everything and say what would be made; write nothing
 *
 * Exit: 0 made and proved; 1 made but not proved; 2 usage; 3 refused before writing anything. The release then points its `public/art` junction at --to.
 */
import { resolve } from 'node:path';
import process from 'node:process';
import { DEFAULT_RIGS_ROOT } from './rig/rig-format.mjs';
import { buildMirror, planMirror, verifyMirror } from './rig/rig-mirror.mjs';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const get = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };

async function main() {
  const [from, to] = [get('--from'), get('--to')];
  if (!from || !to) { console.error('usage: node tools/art-mirror-add-rigs.mjs --from <source mirror> --to <new mirror> [--rigs D:/pyrefly-art-rigs] [--subjects a,b] [--make-tiers] [--dry]  (see the header)'); return 2; }
  const rigsRoot = resolve(get('--rigs', DEFAULT_RIGS_ROOT));
  const subjects = (get('--subjects') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const makeTiers = flag('--make-tiers');
  const plan = await planMirror({ from, rigsRoot, to, subjects, makeTiers });
  for (const p of plan.problems) console.error(`REFUSED  ${p}`);
  if (!plan.ok) { console.error(`art-mirror-add-rigs: refused, ${plan.problems.length} problem(s); nothing was written`); return 3; }
  const copies = plan.copies.reduce((n, c) => n + c.files.length, 0);
  console.log(`art-mirror-add-rigs: ${plan.links.length} file(s) of ${resolve(from)} to hard-link, ${copies} rig file(s) to copy (${plan.copies.map((c) => `${c.subject}${c.replaces ? ' (replaces the source mirror\'s)' : ''}: ${c.files.length}`).join('; ')}), manifest.json rebuilt, into ${resolve(to)}`);
  if (flag('--dry')) { console.log('art-mirror-add-rigs: --dry, nothing written'); return 0; }
  const made = await buildMirror({ from, rigsRoot, to, plan, makeTiers, log: console.log });
  console.log(`art-mirror-add-rigs: linked ${made.linked}, copied ${made.copied}${makeTiers ? `, wrote ${made.tiered} tier file(s)` : ''}; manifest rigs [${made.manifest.rigs.join(', ')}], tiers ${JSON.stringify(made.manifest.rigTiers)}; keys that differ from the source's manifest: ${made.manifest.changedKeys.join(', ') || 'none'}`);
  const proved = await verifyMirror({ from, rigsRoot, to, plan });
  console.log(`art-mirror-add-rigs: ${proved.ok ? 'PROVED' : 'NOT PROVED'}: ${proved.files} file(s) in the new mirror, ${proved.linked} linked to the source's, ${proved.copied} rig file(s) copied`);
  for (const p of proved.problems.slice(0, 40)) console.log(`  PROBLEM ${p}`);
  return proved.ok ? 0 : 1;
}

process.exitCode = await main();
