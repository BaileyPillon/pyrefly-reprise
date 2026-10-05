// Frames for J (Swordplay), M (first-run step 1) and L (look turned on): copies and contact sheets into the worktree's docs/screenshots/r39-judg.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'file:///D:/pyrefly-r39-judg/node_modules/sharp/dist/index.cjs';
import { sheet } from './sheet.mjs';

const S = 'D:/Tools/pyrefly-scratch/2026-10-04/r39-judg';
const D = 'D:/pyrefly-r39-judg/docs/screenshots/r39-judg';
const pending = [];
// frames are committed as JPEG (q 86); json is copied as is
const cp = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (from.endsWith('.png')) pending.push(sharp(from).jpeg({ quality: 86 }).toFile(to.replace(/\.png$/, '.jpg')));
  else fs.copyFileSync(from, to);
};

// ---- J: Swordplay
for (const tier of ['spiral-cut', 'slice-dice', 'energy-rain', 'blitz-ace']) {
  cp(`${S}/swordplay-before/${tier}-overlay.png`, `${D}/swordplay/before-${tier}-overlay.png`);
  cp(`${S}/swordplay-after/${tier}-overlay.png`, `${D}/swordplay/after-${tier}-overlay.png`);
}
cp(`${S}/swordplay-before/spiral-cut-full.png`, `${D}/swordplay/before-spiral-cut-full.png`);
cp(`${S}/swordplay-after/spiral-cut-full.png`, `${D}/swordplay/after-spiral-cut-full.png`);
cp(`${S}/swordplay-after/blitz-ace-full.png`, `${D}/swordplay/after-blitz-ace-full.png`);
cp(`${S}/swordplay-before/run.json`, `${D}/swordplay/run-before.json`);
cp(`${S}/swordplay-after/run.json`, `${D}/swordplay/run-after.json`);
await sheet({
  out: `${D}/swordplay/sheet-spiral-cut-vs-blitz-ace.jpg`,
  title: 'J: Swordplay, FFX Chapter II, real keys (1600x900): Spiral Cut and Blitz Ace, before and after',
  note: 'Before: every tier drew the same 12.22 % gold zone and a ~1,059 ms sweep. After: Spiral Cut 22 % / 1,400 ms, Blitz Ace 9 % / 700 ms (our estimate, adopted by Bailey 2026-10-04).',
  cols: 2,
  cellW: 853,
  items: [
    { file: `${S}/swordplay-before/spiral-cut-overlay.png`, label: 'BEFORE: Spiral Cut, zone 12.22 %, sweep about 1,040 ms' },
    { file: `${S}/swordplay-before/blitz-ace-overlay.png`, label: 'BEFORE: Blitz Ace, the same zone, the same sweep' },
    { file: `${S}/swordplay-after/spiral-cut-overlay.png`, label: 'AFTER: Spiral Cut, zone 22 %, sweep about 1,400 ms, timer 3,000 ms' },
    { file: `${S}/swordplay-after/blitz-ace-overlay.png`, label: 'AFTER: Blitz Ace, zone 9 %, sweep about 700 ms, timer 2,200 ms' },
  ],
});
await sheet({
  out: `${D}/swordplay/sheet-all-four-tiers-after.jpg`,
  title: 'J: the four Swordplay tiers after the change (stronger tier: narrower zone, faster sweep, shorter timer)',
  cols: 2,
  cellW: 853,
  items: ['spiral-cut', 'slice-dice', 'energy-rain', 'blitz-ace'].map((t, i) => ({ file: `${S}/swordplay-after/${t}-overlay.png`, label: ['Spiral Cut 22 % / 1,400 ms / 3,000 ms', 'Slice and Dice 16 % / 1,150 ms / 3,000 ms', 'Energy Rain 12 % / 900 ms / 2,600 ms', 'Blitz Ace 9 % / 700 ms / 2,200 ms'][i] })),
});

// ---- M: first-run step 1
for (const vp of ['1600x900', '390x844']) {
  cp(`${S}/firstrun-before/${vp}-ch1-selected.png`, `${D}/first-run/before-${vp}-chapter-I-selected.png`);
  cp(`${S}/firstrun-before/${vp}-other-selected.png`, `${D}/first-run/before-${vp}-chapter-IV-selected.png`);
  cp(`${S}/firstrun-after/${vp}-ch1-selected.png`, `${D}/first-run/after-${vp}-chapter-I-selected.png`);
  cp(`${S}/firstrun-after/${vp}-other-selected.png`, `${D}/first-run/after-${vp}-chapter-IV-selected.png`);
}
cp(`${S}/firstrun-before/run.json`, `${D}/first-run/run-before.json`);
cp(`${S}/firstrun-after/run.json`, `${D}/first-run/run-after.json`);
await sheet({
  out: `${D}/first-run/sheet-1600x900.jpg`,
  title: 'M: first-run step 1, fresh profile, real keys (1600x900): Chapter I keeps "the first one"; Chapter IV says "this one"',
  note: 'The card keeps its place (text only).',
  cols: 2,
  cellW: 800,
  items: [
    { file: `${S}/firstrun-after/1600x900-ch1-selected.png`, label: 'AFTER, Chapter I selected: "Start with the first one."' },
    { file: `${S}/firstrun-after/1600x900-other-selected.png`, label: 'AFTER, Chapter IV selected: "Start with this one."' },
    { file: `${S}/firstrun-before/1600x900-ch1-selected.png`, label: 'BEFORE, Chapter I selected' },
    { file: `${S}/firstrun-before/1600x900-other-selected.png`, label: 'BEFORE, Chapter IV selected: still "the first one" (wrong row)' },
  ],
});
await sheet({
  out: `${D}/first-run/sheet-390x844.jpg`,
  title: 'M: first-run step 1 on a phone (390x844): before and after, Chapter IV selected',
  cols: 3,
  cellW: 390,
  items: [
    { file: `${S}/firstrun-after/390x844-ch1-selected.png`, label: 'AFTER, Chapter I: "the first one"' },
    { file: `${S}/firstrun-after/390x844-other-selected.png`, label: 'AFTER, Chapter IV: "this one"' },
    { file: `${S}/firstrun-before/390x844-other-selected.png`, label: 'BEFORE, Chapter IV: "the first one"' },
  ],
});

// ---- L: look turned on
for (const ch of ['seymour-flux', 'ffx2-bahamut']) {
  cp(`${S}/looks-before/${ch}-1-opened.png`, `${D}/eye-candy/before-${ch}-1-opened.png`);
  cp(`${S}/looks-before/${ch}-2-spectacle-on.png`, `${D}/eye-candy/before-${ch}-2-look-on.png`);
  cp(`${S}/looks-after/${ch}-2-spectacle-on.png`, `${D}/eye-candy/after-${ch}-2-look-on.png`);
  cp(`${S}/looks-after/${ch}-3-keeps-choices.png`, `${D}/eye-candy/after-${ch}-3-keeps-choices.png`);
  cp(`${S}/looks-after/${ch}-4-cinema-back.png`, `${D}/eye-candy/after-${ch}-4-cinema-back.png`);
}
cp(`${S}/looks-before/run.json`, `${D}/eye-candy/run-before.json`);
cp(`${S}/looks-after/run.json`, `${D}/eye-candy/run-after.json`);
await sheet({
  out: `${D}/eye-candy/sheet-ffx.jpg`,
  title: 'L: EYE CANDY page in FFX, real keys, a save that had BATTLE SPECTACLE off (the release-35 fixture)',
  note: 'Before: the look turns ON over three parts that are all OFF (8 OF 11 ON, nothing visibly changes). After: its parts come on with it (11 OF 11 ON). A part turned off afterwards stays off, even through the look going off and on again.',
  cols: 2,
  cellW: 800,
  items: [
    { file: `${S}/looks-before/seymour-flux-1-opened.png`, label: 'Opened: BATTLE SPECTACLE OFF, its parts OFF' },
    { file: `${S}/looks-before/seymour-flux-2-spectacle-on.png`, label: 'BEFORE: BATTLE SPECTACLE turned ON, the parts still OFF (8 OF 11)' },
    { file: `${S}/looks-after/seymour-flux-2-spectacle-on.png`, label: 'AFTER: BATTLE SPECTACLE turned ON, the parts come on (11 OF 11)' },
    { file: `${S}/looks-after/seymour-flux-3-keeps-choices.png`, label: 'AFTER: SPLASH ART turned off by hand, look off and on again: it stays off' },
  ],
});
await sheet({
  out: `${D}/eye-candy/sheet-ffx2.jpg`,
  title: 'L: EYE CANDY page in FFX-2 (DRESSPHERE SHOT is the listed part), the same save',
  cols: 2,
  cellW: 800,
  items: [
    { file: `${S}/looks-before/ffx2-bahamut-2-spectacle-on.png`, label: 'BEFORE: BATTLE SPECTACLE turned ON, the parts still OFF' },
    { file: `${S}/looks-after/ffx2-bahamut-2-spectacle-on.png`, label: 'AFTER: the parts come on with the look' },
    { file: `${S}/looks-after/ffx2-bahamut-3-keeps-choices.png`, label: 'AFTER: SPLASH ART off by hand stays off through the look off and on' },
    { file: `${S}/looks-after/ffx2-bahamut-4-cinema-back.png`, label: 'AFTER: CINEMA LIGHT, three parts off by hand, look off then on: the parts return' },
  ],
});
await Promise.all(pending);
console.log('frames written');
