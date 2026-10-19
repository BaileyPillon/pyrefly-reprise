/**
 * **The KO swap, read from a `ko` recording, rig on and off** (the lane kit; the rig program, rig-aeons lane, 2026-10-19; both games, shared plumbing).
 *
 *   node tools/rig/lane/ko-summary.mjs --on <rec>/ko --off <rec>/ko-off [--json out.json]
 *
 * For each run: the frame the actor's pose first reads `ko` (the swap) and the hurt pose before it; the projected box (`projectRect`) a frame before and after; the worst one-frame step of the head, the
 * centroid and the feet through the live camera in the 40 frames after the swap (the skeleton tracker for a rig, the painted anchors for the painting set; the camera's own shift of the root is not taken out
 * here: it is the same in both runs); for a rig the area of the `head` part mesh as the GPU gets it, hurt against KO (the head's size: 1.0000 means the head is not resized) and the whole figure's mesh area;
 * the continuity probe's own row for the actor's KO swap when it left one (`continuity/continuity.json`: the head size before and after, the outline's area ratio and centroid shift; vacuous for a rig).
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from './lane-pure.mjs';
import { toSamples } from './track.mjs';

const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const num = (v, d = 3) => (typeof v === 'number' && Number.isFinite(v) ? Number(v.toFixed(d)) : null);
const dist = (a, b) => (a && b ? Math.hypot(a[0] - b[0], a[1] - b[1]) : null);

/** `{swap, hurt, ...}` of one `ko` recording folder. Pure on the parsed files. */
export function summarise(ko, tracks, probe, continuity) {
  const meta = ko.meta;
  const byN = new Map(meta.map((m) => [m.n, m]));
  const swap = meta.find((m) => m.pose === 'ko')?.n ?? null;
  let hurt = null;
  for (const m of meta) { if (swap !== null && m.n >= swap) break; if (m.pose === 'hurt') hurt = m.n; }
  const out = { actor: ko.actor, rig: ko.rig, engineKoFrame: ko.koFrame, swapFrame: swap, hurtFrame: hurt };
  if (swap === null) return out;
  const box = (n) => { const r = byN.get(n)?.rect; return r ? { x: num(r.x, 1), y: num(r.y, 1), w: num(r.w, 1), h: num(r.h, 1) } : null; };
  out.boxBefore = box(swap - 1);
  out.boxAfter = box(swap);
  if (out.boxBefore && out.boxAfter) {
    out.boxHeightRatio = num(out.boxAfter.h / out.boxBefore.h);
    out.boxAreaRatio = num((out.boxAfter.w * out.boxAfter.h) / (out.boxBefore.w * out.boxBefore.h));
    out.boxShiftPx = num(Math.hypot(out.boxAfter.x + out.boxAfter.w / 2 - (out.boxBefore.x + out.boxBefore.w / 2), out.boxAfter.y + out.boxAfter.h / 2 - (out.boxBefore.y + out.boxBefore.h / 2)), 1);
  }
  const partArea = (m, name) => m?.parts?.filter((p) => (name ? p.name === name : true)).reduce((s, p) => s + p.area, 0) ?? null;
  const before = byN.get(swap - 1);
  const after = byN.get(swap);
  if (before?.parts) {
    out.headArea = { hurt: num(partArea(before, 'head'), 7), ko: num(partArea(after, 'head'), 7), ratio: num(partArea(after, 'head') / partArea(before, 'head'), 4) };
    out.figureMeshArea = { hurt: num(partArea(before), 5), ko: num(partArea(after), 5), ratio: num(partArea(after) / partArea(before), 4) };
    // the head mesh over the whole recorded window: its smallest and largest area against the hurt's (a resize anywhere in the swap would show)
    const heads = meta.filter((m) => m.n >= swap - 3 && m.n <= swap + 60 && m.parts).map((m) => partArea(m, 'head'));
    out.headAreaWindow = { min: num(Math.min(...heads) / partArea(before, 'head'), 4), max: num(Math.max(...heads) / partArea(before, 'head'), 4) };
  }
  if (tracks?.records?.length) {
    const s = toSamples(tracks.records).filter((q) => q.n >= swap - 3 && q.n <= swap + 40);
    const step = (key) => {
      let worst = 0, at = null;
      for (let i = 1; i < s.length; i++) { const d = dist(s[i].fig?.[key], s[i - 1].fig?.[key]); if (d !== null && d > worst) { worst = d; at = s[i].n; } }
      return { px: num(worst, 1), frame: at };
    };
    out.worstStep = { head: step('head'), centroid: step('centroid'), feet: step('feet') };
  }
  const row = continuity?.swaps?.find((w) => w.figure === ko.actor && w.toPose === 'ko');
  if (row) out.probeKoSwap = { fromPose: row.fromPose, head: row.head, outline: row.outline, feet: row.feet };
  if (probe?.checks) {
    const cm = probe.checks['CHK-026']?.note ?? '';
    out.probe = { chk026: probe.checks['CHK-026']?.result, note: cm.slice(0, 400) };
  }
  return out;
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  if (!a.on || !a.off) throw new Error('ko-summary: --on <rec>/ko and --off <rec>/ko-off are required');
  const one = (dir) => {
    const t = fs.existsSync(path.join(dir, 'tracks.json')) ? read(path.join(dir, 'tracks.json')) : null;
    const pr = fs.existsSync(path.join(dir, 'probe.json')) ? read(path.join(dir, 'probe.json')) : null;
    const cf = path.join(dir, 'continuity', 'continuity.json');
    return summarise(read(path.join(dir, 'ko.json')), t, pr, fs.existsSync(cf) ? read(cf) : null);
  };
  const res = { on: one(a.on), off: one(a.off) };
  console.log(JSON.stringify(res, null, 1));
  if (a.json) fs.writeFileSync(a.json, JSON.stringify(res, null, 1));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main().catch((e) => { console.error(e.message); process.exitCode = 1; });
