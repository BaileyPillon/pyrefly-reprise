// Continuity harness: how good are the silhouette readings against the reviewed pose registration? (CHK-026's wide tolerances)
//
//   node critic/runner/lib/continuity-calibrate.mjs --records=docs/target/pose-measure.json --art=public/art/characters
//
// Re-runs the two measurements the policy's wide tolerances rest on, on every painting that has a reviewed record:
//   stance  the silhouette's stance (the middle of the lowest thick part) against the record's, as a share of the painting's height
//           (`continuity.size.feetTolerancePxCoarse`: 6 px is about four times its 90th percentile on screen);
//   mass    the figure's mass ratio against the idle's, where the record's head ratio is known
//           (`continuity.size.headTolerancePctCoarse`: 30 percent is the narrowest tolerance with no false alarm on the poses whose
//           registered head agrees with the idle's within 10 percent).
// Read-only: it opens paintings and the records file and prints. Both games (shared critic plumbing).
import fs from 'node:fs';
import path from 'node:path';

import { parseArgs } from './cli.mjs';
import { decodeMask, estimateMass, estimateStance, loadPoseMeasure } from './continuity-silhouette.mjs';

const args = parseArgs(process.argv.slice(2));
const measure = loadPoseMeasure(args.records ?? 'docs/target/pose-measure.json');
const art = args.art ?? 'public/art/characters';
if (!measure) throw new Error('usage: continuity-calibrate.mjs --records=<pose-measure.json> --art=<public/art/characters>');
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const size = (b) => Math.sqrt(Math.max(1e-9, b[2] - b[0]) * Math.max(1e-9, b[3] - b[1]));
const png = (subject, pose) => path.join(art, subject, `${pose}.png`);

const stance = [];
const rows = [];
for (const [subject, rec] of Object.entries(measure.subjects)) {
  const masses = {};
  for (const [pose, r] of Object.entries(rec.poses)) {
    if (!fs.existsSync(png(subject, pose)) || !r.size) continue;
    const mask = await decodeMask(fs.readFileSync(png(subject, pose)), 320);
    if (r.stance && !(r.prone && !r.standing)) {
      const st = estimateStance(mask);
      if (st) stance.push({ subject, pose, dx: Math.abs(st.u * r.size[0] - r.stance.x) / r.size[1] });
    }
    if (Array.isArray(r.head)) masses[pose] = { head: size(r.head), mass: Math.sqrt((estimateMass(mask) ?? 0) * r.size[0] * r.size[1]), prone: r.prone && !r.standing };
  }
  const idle = masses['idle'];
  if (!idle) continue;
  for (const [pose, m] of Object.entries(masses)) if (pose !== 'idle') rows.push({ subject, pose, head: m.head / idle.head, mass: m.mass / idle.mass, prone: m.prone });
}
const sx = stance.map((s) => s.dx);
console.log(`stance: ${stance.length} standing poses with a reviewed stance. |x error| as a share of the painting's height: median ${q(sx, 0.5).toFixed(4)}, p90 ${q(sx, 0.9).toFixed(4)}, p95 ${q(sx, 0.95).toFixed(4)}, max ${Math.max(...sx).toFixed(4)}; ${sx.filter((v) => v > 0.02).length} over 2 percent`);
const up = rows.filter((r) => !r.prone);
const agree = up.filter((r) => Math.abs(r.head - 1) <= 0.1);
const off = up.filter((r) => Math.abs(r.head - 1) > 0.25);
console.log(`mass: ${rows.length} poses with a registered head and an idle to compare with (${up.length} upright).`);
console.log(`  where the registered head agrees with the idle's within 10 percent (${agree.length} poses) the mass ratio runs ${Math.min(...agree.map((r) => r.mass)).toFixed(2)} to ${Math.max(...agree.map((r) => r.mass)).toFixed(2)}`);
console.log(`  where the head is off by more than 25 percent (${off.length} poses) the mass is off by more than 25 percent for ${off.filter((r) => Math.abs(r.mass - 1) > 0.25).length} and by more than 15 percent for ${off.filter((r) => Math.abs(r.mass - 1) > 0.15).length}`);
