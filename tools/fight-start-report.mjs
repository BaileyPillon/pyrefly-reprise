#!/usr/bin/env node
/**
 * Puts the runs of `fight-start-timeline.mjs` side by side, before and after (post-conference lane "post-fight-start", PR-0481; both games; analysis only).
 *
 *   node tools/fight-start-report.mjs --dir=<folder of run JSONs> [--md=<report.md>] [--json=<report.json>]
 *
 * A run file says which build it came from in its `label`: `<build>-r<n>` (for example `before-r2`, `after-r3`); the text before the first dash is the build. Runs are grouped by route
 * (demo or select), chapter, dwell and the session (cold or warm); for each group and build it prints the median of the runs with their least and greatest, for the whole press-to-menu time and for
 * every part (`fight-start-split.mjs`), the waits (`deadMs`), the load (`loadMs`), the authored time, the frozen frame under the entry, the frames over 100 ms and the milliseconds lost to long frames.
 * Where a group has both builds, the difference of the medians is printed too.
 */
import fs from 'node:fs';
import path from 'node:path';

import { splitTimeline } from './fight-start-split.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const dir = String(args.dir);

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.endsWith('.cpuprofile.json') && !f.startsWith('plan') && !f.startsWith('report'));
const groups = new Map();
for (const f of files) {
  let j;
  try { j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { continue; }
  if (!Array.isArray(j.runs) || typeof j.label !== 'string' || !/^[a-z0-9]+-r\d+/i.test(j.label)) continue;
  const build = j.label.split('-')[0];
  for (const r of j.runs) {
    const s = splitTimeline(r); // read again with the current splitter, so an old run is cut the same way as a new one
    if (!s.totalMs) continue;
    const key = `${j.route} ${j.chapter} ${j.dwell} ${r.which}`;
    if (!groups.has(key)) groups.set(key, new Map());
    const byBuild = groups.get(key);
    if (!byBuild.has(build)) byBuild.set(build, []);
    byBuild.get(build).push({ file: f, label: j.label, s, cpu: r.cpuBusyPct });
  }
}

const median = (a) => { const b = [...a].sort((x, y) => x - y); const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const stat = (list) => (list.length ? { med: Math.round(median(list)), min: Math.min(...list), max: Math.max(...list), n: list.length } : null);
const fmt = (st) => (st ? `${st.med} [${st.min}-${st.max}]` : '-');

const metrics = (runs) => {
  const parts = new Set(runs.flatMap((r) => r.s.parts.map((p) => p.name)));
  const out = {
    total: stat(runs.map((r) => r.s.totalMs)),
    dead: stat(runs.map((r) => r.s.deadMs)),
    load: stat(runs.map((r) => r.s.loadMs)),
    authored: stat(runs.map((r) => r.s.authoredMs)),
    frozen: stat(runs.map((r) => r.s.facts['frozenMs'] ?? 0)),
    gaps100: stat(runs.map((r) => r.s.gapsOver100)),
    lost: stat(runs.map((r) => r.s.lostMs)),
    lost9: stat(runs.map((r) => r.s.lostFirst9sMs)),
    worstGap: stat(runs.map((r) => r.s.worstGapMs)),
    cpu: stat(runs.map((r) => r.cpu ?? 0)),
    parts: {},
  };
  for (const name of parts) out.parts[name] = stat(runs.map((r) => r.s.parts.find((p) => p.name === name)?.ms ?? 0));
  return out;
};

const report = {};
const md = [];
for (const [key, byBuild] of [...groups.entries()].sort()) {
  report[key] = {};
  md.push(`\n### ${key}\n`);
  const builds = [...byBuild.keys()].sort((a, b) => (a === 'before' ? -1 : b === 'before' ? 1 : a.localeCompare(b))); // before first, then the others
  const m = Object.fromEntries(builds.map((b) => [b, metrics(byBuild.get(b))]));
  for (const b of builds) report[key][b] = m[b];
  const rows = [['total', 'total (press to first menu), ms'], ['dead', 'waits (press-wait, after-prep, after-scene, card-to-sweep)'], ['load', 'load (entry-load + first-draw)'], ['authored', 'authored (scene, card, sweep, sweep-to-menu)'], ['frozen', 'longest task under the entry (frozen frame)'], ['gaps100', 'frames over 100 ms'], ['lost', 'ms lost to long frames'], ['lost9', 'ms lost in the first 9 s'], ['worstGap', 'worst frame gap'], ['cpu', 'machine CPU busy %']];
  const partNames = [...new Set(builds.flatMap((b) => Object.keys(m[b].parts)))];
  md.push(`| | ${builds.map((b) => `${b} (n=${byBuild.get(b).length})`).join(' | ')} | ${builds.length === 2 ? 'difference of the medians (second build less the first: negative is faster)' : ''} |`);
  md.push(`|---|${builds.map(() => '---|').join('')}${builds.length === 2 ? '---|' : ''}`);
  const line = (label, get) => {
    const cells = builds.map((b) => fmt(get(m[b])));
    const d = builds.length === 2 && get(m[builds[0]]) && get(m[builds[1]]) ? `${get(m[builds[1]]).med - get(m[builds[0]]).med > 0 ? '+' : ''}${get(m[builds[1]]).med - get(m[builds[0]]).med}` : '';
    md.push(`| ${label} | ${cells.join(' | ')} | ${d} |`);
  };
  for (const [k, label] of rows) line(label, (x) => x[k]);
  for (const name of partNames) line(`part: ${name}`, (x) => x.parts[name] ?? null);
}
const text = md.join('\n');
console.log(text);
if (args.md) fs.writeFileSync(String(args.md), `# Fight-start timeline report\n\nRuns in ${dir}. Medians with [least-greatest] over the n runs of the build; times in ms.\n${text}\n`);
if (args.json) fs.writeFileSync(String(args.json), JSON.stringify(report, null, 1));
