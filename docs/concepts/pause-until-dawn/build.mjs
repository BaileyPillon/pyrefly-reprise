#!/usr/bin/env node
/**
 * Emit the concept frames for "pause, rebuilt on the Until Dawn layout".
 *
 *   node docs/concepts/pause-until-dawn/build.mjs
 *
 * Writes one standalone .html per frame beside this file, so the kit's own
 * renderer takes them unmodified:
 *
 *   node docs/concepts/polish/_kit/shoot.mjs <frame>.html <frame>.png --w=1600 --h=900
 *
 * MOCKUP ONLY. Nothing here is product code and nothing in `src/` is touched.
 *
 * ---------------------------------------------------------------------------
 * Framing
 * ---------------------------------------------------------------------------
 * Every painting is an approved 2x master from `public/art/pause/` (2688x1536).
 * It is never edited — only framed, by placing the sidecar's `focal` point at a
 * chosen spot in the frame and scaling. `plate()` does that arithmetic and
 * refuses (loudly) any framing that would leave a bar of empty page, or that
 * would magnify a master beyond 1.25x.
 */

import { writeFileSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');

const SRC_W = 2688; // every `public/art/pause/*.2x.webp`
const SRC_H = 1536;
const ASPECT = SRC_W / SRC_H;

/** Where the head sits in each source, measured off the paintings themselves. */
const HEAD_FRACTION = {
  tidus: 0.62,
  yuna: 0.6,
  'yuna-ffx2': 0.35,
};

function focal(id) {
  const j = JSON.parse(readFileSync(join(REPO, 'public', 'art', 'pause', `${id}.json`), 'utf8'));
  return j.focal;
}

/**
 * Lay a close-up into a frame.
 *
 * `tx`/`ty` are where the painting's focal point should land, as a fraction of
 * the frame. `zoom` is relative to `cover`. Returns the inline style plus the
 * diagnostics the caller prints.
 */
function plate(id, { fw, fh, zoom, tx, ty }) {
  const f = focal(id);
  const coverW = Math.max(fw, fh * ASPECT);
  const w = coverW * zoom;
  const h = w / ASPECT;
  let left = fw * tx - w * f.x;
  let top = fh * ty - h * f.y;

  const clamped = [];
  if (left > 0) { clamped.push(`left ${left.toFixed(0)}`); left = 0; }
  if (left + w < fw) { clamped.push(`right ${(fw - left - w).toFixed(0)}`); left = fw - w; }
  if (top > 0) { clamped.push(`top ${top.toFixed(0)}`); top = 0; }
  if (top + h < fh) { clamped.push(`bottom ${(fh - top - h).toFixed(0)}`); top = fh - h; }

  const mag = w / SRC_W;
  const head = (HEAD_FRACTION[id] ?? 0) * h / fh;
  const facedAt = ((left + w * f.x) / fw);
  console.log(
    `  plate ${id.padEnd(11)} zoom ${zoom.toFixed(2)}  ${w.toFixed(0)}x${h.toFixed(0)}  ` +
    `face@${(facedAt * 100).toFixed(0)}%x${(((top + h * f.y) / fh) * 100).toFixed(0)}%  ` +
    `head ${(head * 100).toFixed(0)}% of frame  master x${mag.toFixed(2)}` +
    (clamped.length ? `  CLAMPED(${clamped.join(', ')})` : ''),
  );
  if (mag > 1.25) console.error(`  !! ${id} magnifies its master x${mag.toFixed(2)} (> 1.25)`);

  return `style="left:${left.toFixed(1)}px;top:${top.toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px"`;
}

const art = (id) => `../../../public/art/pause/${id}.2x.webp`;

// ---------------------------------------------------------------- components

function tabs(list) {
  const items = list.map((t) => {
    const cls = ['pf__tab'];
    if (t.on) cls.push('pf__tab--on');
    if (t.fading) cls.push('pf__tab--fading');
    const hp = t.hp === undefined ? '' :
      `<span class="pf__tabhp${t.hp < 0.3 ? ' pf__tabhp--low' : ''}"><i style="width:${(t.hp * 100).toFixed(1)}%"></i></span>`;
    const dot = t.dot ? '<span class="pf__dot"></span>' : '';
    return `<span class="${cls.join(' ')}">${t.label}${hp}${dot}</span>`;
  }).join('\n        ');
  return `<nav class="pf__tabs">
        <span class="pf__bump pf__bump--l"><b>Q</b><i>L1</i></span>
        ${items}
        <span class="pf__bump pf__bump--r"><i>R1</i><b>E</b></span>
      </nav>`;
}

/** value/best meter with the party-average marker. */
function row(r) {
  if (r.kind === 'word') {
    return `<div class="pf__row pf__row--word"><span class="pf__k">${r.k}</span>` +
      `<span class="pf__bar"></span><span class="pf__v">${r.v}</span></div>`;
  }
  const fill = `<i style="width:${(r.fill * 100).toFixed(1)}%"></i>`;
  const ext = r.ext === undefined ? '' :
    `<u style="left:${(r.fill * 100).toFixed(1)}%;width:${((r.ext - r.fill) * 100).toFixed(1)}%"></u>`;
  const mark = r.mark === undefined ? '' : `<s style="left:${(r.mark * 100).toFixed(1)}%"></s>`;
  return `<div class="pf__row"><span class="pf__k">${r.k}</span>` +
    `<span class="pf__bar">${fill}${ext}${mark}</span>` +
    `<span class="pf__v">${r.v}</span></div>`;
}

function col(heading, rows, wide) {
  return `<div class="pf__col${wide ? ' pf__col--wide' : ''}"><h3>${heading}</h3>\n          ${rows.map(row).join('\n          ')}\n        </div>`;
}

function actions(heading, list) {
  const body = list.map((a) => {
    if (a === '-') return `<div class="pf__act pf__act--sep"><span></span></div>`;
    return `<div class="pf__act${a.sel ? ' pf__act--sel' : ''}">${a.label}${
      a.v ? `<span class="pf__note" style="margin-left:auto">${a.v}</span>` : ''}</div>`;
  }).join('\n          ');
  return `<div class="pf__col" style="width:300px"><h3>${heading}</h3>\n          ${body}\n        </div>`;
}

function optionRow(o) {
  if (o.ratio === null) {
    return row({ kind: 'word', k: o.k, v: o.v });
  }
  return row({ k: o.k, fill: o.ratio, v: o.v });
}

// -------------------------------------------------------------------- page

function page({ title, cls, grade, artHtml, ui, w = 1600, h = 900 }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<link rel="stylesheet" href="pause-ud.css">
<style>html,body{width:${w}px;height:${h}px}</style>
</head>
<body>
  <div class="pf ${cls}" data-grade="${grade}">
    ${artHtml}
    <div class="pf__tint"></div>
    <div class="pf__falloff"></div>
    <div class="pf__vig"></div>
    <div class="pf__grain"></div>
${ui}
    <div class="pf__baseline">H&nbsp;&nbsp;show panels &nbsp;&middot;&nbsp; Esc&nbsp;&nbsp;resume</div>
    <div class="pf__tag">CONCEPT</div>
  </div>
</body>
</html>
`;
}

function artLayer(id, framing, ghost) {
  const main = `<div class="pf__art"><img src="${art(id)}" alt="" ${framing}></div>`;
  // The OUTGOING member sits on top at low opacity: that is what a cross-fade
  // looks like on the frame where it is half done.
  const g = ghost
    ? `<div class="pf__art pf__art--ghost"><img src="${art(ghost.id)}" alt="" ${ghost.framing}></div>`
    : '';
  return `${main}${g}`;
}

function back(resume = 'Resume', hide = 'H&nbsp;&nbsp;hide panels') {
  return `      <div class="pf__back"><span class="pf__key">Esc</span>${resume}</div>
      <div class="pf__hide">${hide}</div>`;
}

function objective(eyebrow, line) {
  return `      <div class="pf__obj"><span class="pf__eyebrow">${eyebrow}</span><p class="pf__line">${line}</p></div>`;
}

const brand = (game) =>
  `      <div class="pf__brand">Pyrefly Reprise &middot; ${game}</div>`;

// ============================================================ frame content

// --- FFX, chapter 1, the three on the field -------------------------------
// Stats: src/data/ffx/builds/gagazet.ts (research/ffx-seymour-flux.md §7.3).
// Bars: value / the best of the three on the field; the tick is their average.
const FFX_BEST = { str: 31, mag: 37, def: 22, mdef: 39, agi: 30 };
const FFX_AVG = { str: 24, mag: 25, def: 18.33, mdef: 24.33, agi: 21 };
const st = (key, v) => ({ fill: v / FFX_BEST[key], mark: FFX_AVG[key] / FFX_BEST[key], v: String(v) });

const TIDUS_STATS = [
  { k: 'HP', fill: 1904 / 2420, v: '1904<em>/2420</em>' },
  { k: 'MP', fill: 92 / 115, v: '92<em>/115</em>' },
  { k: 'Strength', ...st('str', 31) },
  { k: 'Magic', ...st('mag', 16) },
  { k: 'Defence', ...st('def', 20) },
  { k: 'Magic Def', ...st('mdef', 18) },
  { k: 'Agility', ...st('agi', 30) },
];
const TIDUS_FIGHT = [
  { k: 'Overdrive', fill: 0.7, v: '70<em>%</em>' },
  { kind: 'word', k: 'Mode', v: 'Warrior' },
  { kind: 'word', k: 'Haste', v: 'Rest of battle' },
  { kind: 'word', k: 'Cheer &times;2', v: 'Rest of battle' },
  { kind: 'word', k: 'Turn order', v: '2nd of 6' },
];

const YUNA_STATS = [
  { k: 'HP', fill: 1180 / 1500, v: '1180<em>/1500</em>' },
  { k: 'MP', fill: 214 / 270, v: '214<em>/270</em>' },
  { k: 'Strength', ...st('str', 15) },
  { k: 'Magic', ...st('mag', 37) },
  { k: 'Defence', ...st('def', 13) },
  { k: 'Magic Def', ...st('mdef', 39) },
  { k: 'Agility', ...st('agi', 15) },
];
const YUNA_FIGHT = [
  { k: 'Overdrive', fill: 0.4, v: '40<em>%</em>' },
  { kind: 'word', k: 'Mode', v: 'Healer' },
  { kind: 'word', k: 'Zombie', v: 'Rest of battle' },
  { kind: 'word', k: 'Shell', v: 'Rest of battle' },
  { kind: 'word', k: 'Turn order', v: '4th of 6' },
];

const CH1_EYEBROW = 'Chapter I &middot; Mt. Gagazet — the Prominence';
const CH1_LINE = 'Holy&nbsp;Water a Zombie before Full-Life lands';

const ffxTabs = (active, opts = {}) => tabs([
  { label: 'Tidus', on: active === 'tidus', fading: opts.fading === 'tidus', hp: 1904 / 2420 },
  { label: 'Yuna', on: active === 'yuna', hp: 1180 / 1500, dot: true },
  { label: 'Kimahri', on: active === 'kimahri', hp: 1 },
  { label: 'Chapter', on: active === 'chapter' },
  { label: 'Guide', on: active === 'guide' },
  { label: 'Options', on: active === 'options' },
  { label: 'Controls', on: active === 'controls' },
  { label: 'Music', on: active === 'music' },
]);

// --- FFX-2, chapter 4 ------------------------------------------------------
// Stats: the dressphere x level tables each girl is actually wearing —
// gunner.ts L23, dark-knight.ts L24, warrior.ts L25 (ffx2-combat-core §5.1).
// The dim extension on a bar is what Protection Halo + her two accessories add
// (src/data/ffx2/builds/bevelle.ts, garment-grids/early.ts).
const X2_BEST = { str: 69, mag: 49, def: 121, mdef: 82, agi: 53 };
const X2_AVG = { str: 61.33, mag: 33.67, def: 84, mdef: 40.67, agi: 47 };
const x2 = (key, v, bonus) => ({
  fill: v / X2_BEST[key],
  ...(bonus ? { ext: (v + bonus) / X2_BEST[key] } : {}),
  mark: X2_AVG[key] / X2_BEST[key],
  v: bonus ? `${v}<b>+${bonus}</b>` : String(v),
});

const X2_YUNA_STATS = [
  { k: 'HP', fill: 723 / 970, v: '723<em>/970</em>' },
  { k: 'MP', fill: 40 / 56, v: '40<em>/56</em>' },
  { k: 'Strength', ...x2('str', 49) },
  { k: 'Magic', ...x2('mag', 26, 10) },
  { k: 'Defence', ...x2('def', 31, 25) },
  { k: 'Magic Def', ...x2('mdef', 31, 15) },
  { k: 'Agility', ...x2('agi', 53) },
];
const X2_YUNA_FIGHT = [
  { k: 'ATB', fill: 0.62, v: '62<em>%</em>' },
  { kind: 'word', k: 'Mode', v: 'Active' },
  { kind: 'word', k: 'Chain', v: '&times;3' },
  { kind: 'word', k: 'Dressphere', v: 'Gunner' },
  { kind: 'word', k: 'Garment grid', v: 'Protection Halo' },
  { kind: 'word', k: 'Gates', v: '0 of 4 passed' },
];

const x2Tabs = (active) => tabs([
  { label: 'Yuna', on: active === 'yuna', hp: 723 / 970 },
  { label: 'Rikku', on: active === 'rikku', hp: 1290 / 1533, dot: true },
  { label: 'Paine', on: active === 'paine', hp: 352 / 1219 },
  { label: 'Chapter', on: active === 'chapter' },
  { label: 'Guide', on: active === 'guide' },
  { label: 'Options', on: active === 'options' },
  { label: 'Controls', on: active === 'controls' },
  { label: 'Music', on: active === 'music' },
]);

// ================================================================== frames

const F = { fw: 1600, fh: 900 };
const OUT = [];
const write = (name, html) => { writeFileSync(join(HERE, name), html); OUT.push(name); };

console.log('frames:');

// --- (a) FFX, Tidus, chapter 1 --------------------------------------------
console.log('a-ffx-tidus');
const tidusPlate = plate('tidus', { ...F, zoom: 1.26, tx: 0.58, ty: 0.45 });
const frameA = (grade) => page({
  title: 'Pause — Tidus',
  cls: 'pf--ffx',
  grade,
  artHtml: artLayer('tidus', tidusPlate),
  ui: `    <div class="pf__ui">
${brand('Final Fantasy X')}
      ${ffxTabs('tidus')}
      <div class="pf__meters">
        ${col('Battle stats', TIDUS_STATS)}
        ${col('In this fight', TIDUS_FIGHT)}
      </div>
${objective(CH1_EYEBROW, CH1_LINE)}
${back()}
    </div>`,
});
write('a-ffx-tidus.html', frameA('b'));
write('a-grade-a-faithful.html', frameA('a'));

// --- (b) FFX, Yuna, mid cross-fade ----------------------------------------
// Her painting puts her face at 30% of its width, so the chrome goes to the
// empty side instead of over her. See README, question 2.
console.log('b-ffx-yuna');
write('b-ffx-yuna.html', page({
  title: 'Pause — Yuna',
  cls: 'pf--ffx pf--mirror',
  grade: 'b',
  artHtml: artLayer(
    'yuna',
    plate('yuna', { ...F, zoom: 1.27, tx: 0.38, ty: 0.42 }),
    { id: 'tidus', framing: tidusPlate },
  ),
  ui: `    <div class="pf__ui">
${brand('Final Fantasy X')}
      ${ffxTabs('yuna', { fading: 'tidus' })}
      <div class="pf__meters">
        ${col('Battle stats', YUNA_STATS)}
        ${col('In this fight', YUNA_FIGHT)}
      </div>
${objective(CH1_EYEBROW, CH1_LINE)}
${back()}
    </div>`,
}));

// --- (c) FFX-2, Yuna (Gunner), chapter 4 ----------------------------------
console.log('c-ffx2-yuna-gunner');
write('c-ffx2-yuna-gunner.html', page({
  title: 'Pause — Yuna (Gunner)',
  cls: 'pf--ffx2',
  grade: 'b',
  artHtml: artLayer('yuna-ffx2', plate('yuna-ffx2', { ...F, zoom: 1.9, tx: 0.66, ty: 0.45 })),
  ui: `    <div class="pf__ui">
${brand('Final Fantasy X-2')}
      ${x2Tabs('yuna')}
      <div class="pf__meters">
        ${col('Battle stats', X2_YUNA_STATS)}
        ${col('In this fight', X2_YUNA_FIGHT, true)}
      </div>
${objective('Chapter IV &middot; Bevelle Underground — Limbo', 'Survive a Mega Flare')}
${back()}
    </div>`,
}));

// --- (d) the OPTIONS tab ---------------------------------------------------
console.log('d-options');
const OPTS = [
  { k: 'Master volume', ratio: 0.8, v: '80' },
  { k: 'Music', ratio: 0.7, v: '70' },
  { k: 'Sound effects', ratio: 0.9, v: '90' },
  { k: 'Text speed', ratio: 0.3, v: '1x' },
  { k: 'X-2 battle', ratio: null, v: 'Active' },
  { k: 'Strategy guide', ratio: null, v: 'On' },
  { k: 'Battle help', ratio: null, v: 'On' },
];
write('d-options.html', page({
  title: 'Pause — Options',
  cls: 'pf--ffx',
  grade: 'b',
  artHtml: artLayer('tidus', tidusPlate),
  ui: `    <div class="pf__ui">
${brand('Final Fantasy X')}
      ${ffxTabs('options')}
      <div class="pf__meters">
        <div class="pf__col pf__col--opt"><h3>Settings</h3>
          ${OPTS.map(optionRow).join('\n          ')}
        </div>
        ${actions('This encounter', [
          { label: 'Replay briefing', v: '&#9656;', sel: true },
          { label: 'Restart encounter', v: '&#9656;' },
          '-',
          { label: 'Chapter select', v: '&#9656;' },
          { label: 'Quit to title', v: '&#9656;' },
        ])}
      </div>
${objective(CH1_EYEBROW, CH1_LINE)}
${back()}
    </div>`,
}));

// --- (e) panels hidden (H) -------------------------------------------------
console.log('e-hidden');
write('e-hidden.html', page({
  title: 'Pause — panels hidden',
  cls: 'pf--ffx pf--bare',
  grade: 'b',
  artHtml: artLayer('tidus', tidusPlate),
  ui: '',
}));

// --- (f) phone, 390x844 ----------------------------------------------------
console.log('f-phone');
const P = { fw: 390, fh: 844 };
const phoneTabs = `<nav class="pf__tabs"><div class="pf__swipe">
        <span class="pf__tab pf__tab--on">Tidus<span class="pf__tabhp"><i style="width:78.7%"></i></span></span>
        <span class="pf__tab">Yuna<span class="pf__tabhp"><i style="width:78.7%"></i></span><span class="pf__dot"></span></span>
        <span class="pf__tab">Kimahri<span class="pf__tabhp"><i style="width:100%"></i></span></span>
        <span class="pf__tab">Chapter</span>
        <span class="pf__tab">Guide</span>
        <span class="pf__tab">Options</span>
      </div></nav>
      <div class="pf__dots"><i class="on"></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`;
write('f-phone.html', page({
  title: 'Pause — phone',
  cls: 'pf--ffx pf--phone',
  grade: 'b',
  w: 390, h: 844,
  artHtml: artLayer('tidus', plate('tidus', { ...P, zoom: 1.0, tx: 0.5, ty: 0.26 })),
  ui: `    <div class="pf__ui">
      <div class="pf__brand">Pyrefly Reprise</div>
      ${phoneTabs}
      <div class="pf__meters">
        ${col('Battle stats', TIDUS_STATS.slice(0, 5))}
        ${col('In this fight', [TIDUS_FIGHT[0], TIDUS_FIGHT[2], TIDUS_FIGHT[4]])}
      </div>
${objective('Chapter I &middot; Mt. Gagazet', CH1_LINE)}
      <div class="pf__back"><span class="pf__key">Esc</span>Resume</div>
      <div class="pf__hide">H&nbsp;&nbsp;hide</div>
    </div>`,
}));

console.log(`\nwrote ${OUT.length} frames: ${OUT.join(', ')}`);
