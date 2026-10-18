#!/usr/bin/env node
/**
 * A rig's half-size texture tier (the rig program; both games, shared plumbing). The rule, and why: `tools/rig/rig-tiers.mjs`.
 *
 *   node tools/rig-tiers.mjs write  --rig D:/pyrefly-art-rigs/kimahri[,<folder>...]     write <rig>/1x/<every part PNG and rim mask>
 *   node tools/rig-tiers.mjs verify --rig D:/pyrefly-art-rigs/kimahri[,<folder>...]     prove each twin is exactly the half of its file, and the folder holds nothing else
 *
 * Exit 0 on success, 1 on any problem, 2 on usage. Writes only inside `<rig>/1x/`; never the full-size files and never `public/`.
 */
import { resolve } from 'node:path';
import process from 'node:process';
import { verifyTiers, writeTiers } from './rig/rig-tiers.mjs';

const argv = process.argv.slice(2);
const [command] = argv;
const get = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };

async function main() {
  const rigs = (get('--rig') ?? '').split(',').map((s) => s.trim()).filter(Boolean).map((s) => resolve(s));
  if (!['write', 'verify'].includes(command) || !rigs.length) { console.error('usage: node tools/rig-tiers.mjs write|verify --rig <folder with rig.json>[,<folder>...]'); return 2; }
  let code = 0;
  for (const dir of rigs) {
    if (command === 'write') {
      const w = await writeTiers(dir);
      console.log(`rig-tiers: ${dir}: wrote ${w.written.length} file(s) into 1x/`);
    }
    const v = await verifyTiers(dir);
    console.log(`rig-tiers: ${dir}: ${v.ok ? 'PASS' : 'FAIL'}: ${v.checked} file(s) checked, ${(v.texels / 1e6).toFixed(2)} Mpx, ${(v.bytes / 1e6).toFixed(2)} MB at 1x`);
    for (const p of v.problems.slice(0, 40)) console.log(`  PROBLEM ${p}`);
    if (!v.ok) code = 1;
  }
  return code;
}

process.exitCode = await main();
