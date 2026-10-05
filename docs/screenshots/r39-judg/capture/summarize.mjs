// Summarise a folder of textsize cell JSONs: per cell and step, the figure and panel overlaps, off-window text and panels,
// text-on-text, and what is NEW against the same chapter/viewport/step at TEXT SIZE 100.
//   node summarize.mjs <dir> [--graze=3] [--steps=menu,step2]
import fs from 'node:fs';
import path from 'node:path';
const argv = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return [m[1], m[2] ?? true]; }));
const dir = process.argv[2];
const GRAZE = Number(argv.graze ?? 3); // percent of a fighter's box under which an overlap is only a graze of the approximate box
const only = argv.steps ? String(argv.steps).split(',') : null;
const cells = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const kindOf = (c) => (Object.keys(c.steps).some((k) => k.startsWith('pause-')) ? 'pause' : 'hud');
const key = (c) => `${c.chapter}|${c.size}${c.touch ? '|touch' : ''}|${kindOf(c)}`;
const base = new Map();
for (const c of cells) if (Math.round(c.ts * 100) === 100) base.set(key(c), c);
const sig = (s, a) => ({
  pf: new Set(a.panelVsFigure.filter((x) => x.figPct >= GRAZE).map((x) => `${x.panel}>${x.figure}`)),
  pfAll: new Set(a.panelVsFigure.map((x) => `${x.panel}>${x.figure}`)),
  pp: new Set(a.panelVsPanel.map((x) => `${x.a}+${x.b}`)),
  off: new Set([...s.off.map((x) => x.key + ':' + x.t), ...a.offWindowPanels.map((x) => 'panel:' + x.panel)]),
  tov: new Set(s.overlaps.map((x) => `${x.ka}|${x.kb}`)),
});
let bad = 0;
const rows = [];
for (const c of cells.sort((a, b) => key(a).localeCompare(key(b)) || a.ts - b.ts)) {
  const b = base.get(key(c));
  for (const [step, s] of Object.entries(c.steps)) {
    if (only && !only.includes(step)) continue;
    const a = s.analysis;
    const mine = sig(s, a);
    const bs = b?.steps?.[step];
    const theirs = bs ? sig(bs, bs.analysis) : null;
    const isBase = Math.round(c.ts * 100) === 100;
    const fresh = (set, other) => [...set].filter((k) => !(other && other.has(k)));
    const newPf = fresh(mine.pf, theirs?.pf);
    const newPp = fresh(mine.pp, theirs?.pp);
    const newOff = fresh(mine.off, theirs?.off);
    const newTov = fresh(mine.tov, theirs?.tov);
    const line = `${c.chapter} ${c.size}${c.touch ? ' touch' : ''} ts${Math.round(c.ts * 100)} ${step}: pf=${[...mine.pf].length}${isBase ? '' : `(+${newPf.length})`} pp=${[...mine.pp].length}${isBase ? '' : `(+${newPp.length})`} off=${[...mine.off].length}${isBase ? '' : `(+${newOff.length})`} tov=${[...mine.tov].length}${isBase ? '' : `(+${newTov.length})`} min=${s.minPx} err=${c.errors.length}${c.fail ? ' FAIL ' + c.fail : ''}`;
    rows.push(line);
    const detail = [];
    const list = isBase ? { pf: [...mine.pf], pp: [...mine.pp], off: [...mine.off] } : { pf: newPf, pp: newPp, off: newOff };
    if (list.pf.length) detail.push('  figure: ' + list.pf.join(', ') + '  [' + a.panelVsFigure.filter((x) => x.figPct >= GRAZE).map((x) => `${x.panel}>${x.figure} ${x.figPct}%`).join(', ') + ']');
    if (list.pp.length) detail.push('  panel: ' + list.pp.join(', '));
    if (list.off.length) detail.push('  off: ' + list.off.join(', '));
    if (!isBase && newTov.length) detail.push('  text-on-text new: ' + newTov.join(', '));
    if (!isBase && (newPf.length || newPp.length || newOff.length || newTov.length || c.errors.length || c.fail)) bad++;
    rows.push(...detail);
  }
}
console.log(rows.join('\n'));
console.log(`\ncells with something new against TEXT SIZE 100: ${bad}`);
