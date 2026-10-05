// Frames for K (TEXT SIZE): the proof matrix's JPEGs into the worktree's docs/screenshots/r39-judg/text-size, with contact sheets and the results JSON.
import fs from 'node:fs';
import path from 'node:path';
import { sheet } from './sheet.mjs';

const S = 'D:/Tools/pyrefly-scratch/2026-10-04/r39-judg/ts-out/proof7';
const D = 'D:/pyrefly-r39-judg/docs/screenshots/r39-judg/text-size';
fs.mkdirSync(D, { recursive: true });
const files = fs.readdirSync(S);
const SIZES = ['100', '115', '130'];
const VPS = ['1600x900', '2000x1012', '390x844'];
const HUD = [['ffx2-bahamut', 'Chapter IV (Bahamut)'], ['ffx2-vegnagun-shuyin', 'Chapter V (Vegnagun)'], ['ffx2-leblanc', 'Chapter VI (Leblanc)']];
const PAUSE = [['seymour-flux', 'FFX (Chapter I)'], ['ffx2-bahamut', 'FFX-2 (Chapter IV)']];
const KEEP_TABS = ['options', 'chapter', 'controls', 'music'];
const copied = [];
const keep = (name) => {
  const m = name.match(/^(.*)-(\d+x\d+)-ts(\d+)-(.*)\.jpg$/);
  if (!m) return false;
  const step = m[4];
  if (step.startsWith('pause-')) return KEEP_TABS.some((t) => step === `pause-${t}`);
  return true; // every HUD frame
};
for (const f of files.filter((x) => x.endsWith('.jpg') && keep(x))) {
  fs.copyFileSync(path.join(S, f), path.join(D, f));
  copied.push(f);
}
console.log('frames copied', copied.length);

// contact sheets: one HUD sheet per chapter and viewport (the first menu at the three sizes, then the submenu), one pause sheet per game and viewport (four tabs x three sizes)
for (const [ch, chName] of HUD) {
  for (const vp of VPS) {
    const cols = 3;
    const items = [];
    for (const step of ['menu', 'step2', ...(vp === '390x844' ? [] : ['target'])]) {
      for (const sz of SIZES) {
        const file = path.join(S, `${ch}-${vp}-ts${sz}-${step}.jpg`);
        if (fs.existsSync(file)) items.push({ file, label: `${chName}, ${vp}, TEXT SIZE ${sz} %, ${step === 'menu' ? 'first command menu' : step === 'step2' ? 'the first row opened' : 'target step'}` });
      }
    }
    if (!items.length) continue;
    const cellW = vp === '390x844' ? 390 : vp === '2000x1012' ? 640 : 600;
    await sheet({ out: path.join(D, `sheet-hud-${ch}-${vp}.jpg`), title: `K: FFX-2 battle HUD, ${chName}, ${vp}, TEXT SIZE 100 / 115 / 130 % (rows: first menu, submenu${vp === '390x844' ? '' : ', target'})`, cols, cellW, items });
  }
}
for (const [ch, chName] of PAUSE) {
  for (const vp of VPS) {
    const items = [];
    for (const tab of KEEP_TABS) {
      for (const sz of SIZES) {
        const file = path.join(S, `${ch}-${vp}-ts${sz}-pause-${tab}.jpg`);
        if (fs.existsSync(file)) items.push({ file, label: `${chName} pause, ${vp}, ${tab.toUpperCase()}, TEXT SIZE ${sz} %` });
      }
    }
    if (!items.length) continue;
    const cellW = vp === '390x844' ? 390 : vp === '2000x1012' ? 640 : 600;
    await sheet({ out: path.join(D, `sheet-pause-${ch}-${vp}.jpg`), title: `K: the pause, ${chName}, ${vp}: OPTIONS, CHAPTER, CONTROLS and MUSIC at TEXT SIZE 100 / 115 / 130 %`, cols: 3, cellW, items });
  }
}
// the measured results, one file
const results = [];
for (const f of fs.readdirSync(S).filter((x) => x.endsWith('.json'))) results.push(JSON.parse(fs.readFileSync(path.join(S, f), 'utf8')));
fs.writeFileSync(path.join(D, 'matrix-results.json'), JSON.stringify(results.map((r) => ({ cell: r.cell, kind: Object.keys(r.steps).some((k) => k.startsWith('pause-')) ? 'pause' : 'hud', size: r.size, ts: r.ts, touch: r.touch, applied: r.applied, errors: r.errors, fail: r.fail ?? null, steps: Object.fromEntries(Object.entries(r.steps).map(([k, v]) => [k, { minPx: v.minPx, off: v.off, offWindowPanels: v.analysis.offWindowPanels, panelVsPanel: v.analysis.panelVsPanel, panelVsFigure: v.analysis.panelVsFigure, textOnText: v.overlaps.length, splitWords: v.splitWords ?? [], truncated: (v.truncated ?? []).length, intentNarrow: v.intentInfo ? v.intentInfo.narrow === true : null, activeTabInside: v.activeTabInside ?? null }])) })), null, 1));
console.log('sheets and results written');
