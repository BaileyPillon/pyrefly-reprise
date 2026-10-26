#!/usr/bin/env node
/**
 * Reads a fight-start CPU profile (`fight-start-timeline.mjs --profile`) of a PRODUCTION bundle through the build's hidden source maps (post-conference lane "post-fight-start"; both games; analysis only).
 *
 *   node tools/fight-start-profile.mjs --profile=<run>-cold.cpuprofile --run=<run>.json --maps=<PYREFLY_SOURCEMAP_DIR of the build> [--which=cold] [--bin=500] [--top=6] [--from=0] [--to=15000]
 *
 * The build's maps come from `PYREFLY_SOURCEMAP_DIR=<dir> npx vite build ...` (they never ship; the bundle is byte-identical with and without them). For every window of `--bin` ms after the press
 * (page clock, put on it through the run file's `profileOffsetMs`) it prints the main thread's busy time and the functions of `src/` and `node_modules/` that hold the most INCLUSIVE time in it
 * (every function on a sampled stack gets the sample), named by their original file and line, plus the same table for the whole span. The idle and garbage-collector samples are counted apart.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { TraceMap, originalPositionFor } = require('@jridgewell/trace-mapping');

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const profile = JSON.parse(fs.readFileSync(String(args.profile), 'utf8'));
const run = JSON.parse(fs.readFileSync(String(args.run), 'utf8')).runs.find((r) => r.which === String(args.which ?? 'cold'));
const mapsDir = String(args.maps);
const BIN = Number(args.bin ?? 500);
const TOP = Number(args.top ?? 6);
const press = run.marks.find((m) => m.k === 'press').t;
const t0 = run.profileOffsetMs; // the page's clock at the profile's start
const maps = new Map();
function mapFor(url) {
  const base = path.basename(url.split('?')[0]);
  if (!maps.has(base)) {
    const file = path.join(mapsDir, 'assets', `${base}.map`);
    maps.set(base, fs.existsSync(file) ? new TraceMap(JSON.parse(fs.readFileSync(file, 'utf8'))) : null);
  }
  return maps.get(base);
}
const nameCache = new Map();
function label(node) {
  const cf = node.callFrame;
  const key = `${cf.url}:${cf.lineNumber}:${cf.columnNumber}:${cf.functionName}`;
  if (nameCache.has(key)) return nameCache.get(key);
  let out;
  if (!cf.url) out = `(${cf.functionName || 'native'})`;
  else {
    const tm = mapFor(cf.url);
    const pos = tm ? originalPositionFor(tm, { line: cf.lineNumber + 1, column: cf.columnNumber }) : null;
    if (pos?.source) out = `${pos.source.replace(/^(\.\.\/)+/, '')}:${pos.line}${pos.name || cf.functionName ? ` ${pos.name || cf.functionName}` : ''}`;
    else out = `${path.basename(cf.url)}:${cf.lineNumber + 1} ${cf.functionName}`;
  }
  nameCache.set(key, out);
  return out;
}

const byId = new Map(profile.nodes.map((n) => [n.id, n]));
const parent = new Map();
for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id);
const stackOf = (id) => { const out = []; for (let x = id; x !== undefined; x = parent.get(x)) out.push(x); return out; };

// sample i lasts timeDeltas[i+1] (the time to the next sample); its page time is t0 + elapsed
const samples = [];
let elapsed = 0;
for (let i = 0; i < profile.samples.length; i++) {
  elapsed += profile.timeDeltas[i] / 1000;
  const dur = (profile.timeDeltas[i + 1] ?? 0) / 1000;
  samples.push({ at: t0 + elapsed - press, dur, id: profile.samples[i] });
}
const from = Number(args.from ?? 0);
const to = Number(args.to ?? run.split.totalMs + 300);

function table(list, top) {
  const incl = new Map();
  let busy = 0, idle = 0, gc = 0;
  for (const s of list) {
    const node = byId.get(s.id);
    const fn = node.callFrame.functionName;
    if (fn === '(idle)') { idle += s.dur; continue; }
    if (fn === '(garbage collector)') gc += s.dur;
    busy += s.dur;
    const seen = new Set();
    for (const id of stackOf(s.id)) {
      const lab = label(byId.get(id));
      if (seen.has(lab) || lab.startsWith('(')) continue;
      seen.add(lab);
      incl.set(lab, (incl.get(lab) ?? 0) + s.dur);
    }
  }
  const rows = [...incl.entries()].filter(([l]) => /^(src\/|node_modules\/|tools\/)/.test(l) || /\.(js|ts):/.test(l)).sort((a, b) => b[1] - a[1]).slice(0, top);
  return { busy, idle, gc, rows };
}

for (let b = from; b < to; b += BIN) {
  const part = samples.filter((s) => s.at >= b && s.at < b + BIN);
  const t = table(part, TOP);
  console.log(`\n${String(b).padStart(6)}-${String(b + BIN).padEnd(6)} ms  busy ${Math.round(t.busy)} ms  idle ${Math.round(t.idle)} ms  gc ${Math.round(t.gc)} ms`);
  for (const [lab, ms] of t.rows) console.log(`      ${String(Math.round(ms)).padStart(5)}  ${lab}`);
}
const all = table(samples.filter((s) => s.at >= from && s.at < to), 40);
console.log(`\nWHOLE SPAN ${from}-${to} ms: busy ${Math.round(all.busy)} ms, idle ${Math.round(all.idle)} ms, gc ${Math.round(all.gc)} ms`);
for (const [lab, ms] of all.rows) console.log(`      ${String(Math.round(ms)).padStart(5)}  ${lab}`);
