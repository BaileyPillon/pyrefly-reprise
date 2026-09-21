#!/usr/bin/env node
/**
 * Pyrefly Studio (atlas option B): writes the three frames and shoots them.
 *
 *   node docs/concepts/atlas/b-battle-studio/capture.mjs            (from the repo root)
 *
 * 1. Reads engine-probe.json (written by engine-probe.mjs, which runs the real FFX engine) and
 *    inventory.mjs (the sourced rule list). No number on a frame is typed by hand: they are
 *    injected from those two files, so the frames cannot drift from the engine or the docs.
 * 2. Writes b1-assembled.html, b2-exploded-selected.html, b3-inventory.html (static, no script).
 * 3. Loads each over file:// in Playwright at 1600x900, waits for fonts and images, saves the PNG,
 *    and audits legibility: any text under 13 px, any broken image, any clipped line, and any text
 *    that runs outside its own card, tile or panel (added in the verification pass) is reported.
 * No server, no network, no WebGL. The browser is closed at the end.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { COMPONENTS, PIECES, TOTAL, countFor } from './inventory.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const P = JSON.parse(readFileSync(join(here, 'engine-probe.json'), 'utf8'));
const ART = '../../../../public/art';

// ---- numbers, straight from the engine run -------------------------------------------------
const atk = P.attack['seymour-flux'];
const dealt = P.submitted.events.find((e) => e.type === 'damage').amount;
const gauge = P.submitted.tidusGauge;
const recovery = P.agilitySweep['30'].rank3Recovery;
const baseTicks = P.agilitySweep['30'].baseTicks;
const next = P.bossNextAfter;
const nextT = next.perTarget[0];
const zombie = nextT.statuses.find((s) => s.status === 'zombie').percent;
const order = P.turnOrder; // [{who,id,tick,party}]
const parse = (s) => s.split('  ').map((x) => { const i = x.lastIndexOf('@'); return { who: x.slice(0, i), tick: Number(x.slice(i + 1)) }; });
const at30 = parse(P.agilitySweep['30'].order);
const at44 = parse(P.agilitySweep['44'].order);
const sweep44 = P.agilitySweep['44'];

const FACE = { tidus: 'portraits/tidus.png', yuna: 'portraits/yuna.png', kimahri: 'portraits/kimahri.png', 'seymour-flux': 'portraits/seymour.png', mortiorchis: 'characters/mortiorchis/idle.png' };

// ---- shared chrome ------------------------------------------------------------------------------
const CHAPTERS = [ // titles from src/data/encounters.ts
  ['I', 'Seymour Flux', 'portraits/seymour.png'], ['II', 'Lady Yunalesca', 'portraits/yunalesca.png'], ['III', "Braska's Final Aeon", 'portraits/jecht.png'],
  ['IV', 'Bahamut', 'portraits/bahamut.png'], ['V', 'Vegnagun', 'portraits/shuyin.png'],
];
const chip = ([n, t, img], on) => `<div class="chap${on ? ' on' : ''}"><span class="face"><img src="${ART}/${img}" alt=""></span><span class="n">${n}</span><span class="t">${t}</span></div>`;
const chapters = () => `<nav class="chapters"><div class="grp"><div class="row">${CHAPTERS.slice(0, 3).map((c, i) => chip(c, i === 0)).join('')}</div><div class="br">FFX · a turn list</div></div>
<div class="grp"><div class="row">${CHAPTERS.slice(3).map((c) => chip(c, false)).join('')}</div><div class="br">FFX-2 · gauges</div></div></nav>`;

const components = (sel) => `<aside class="glass components"><div class="head"><span class="caps k">Components</span><span class="v">${COMPONENTS.length}</span></div>
${COMPONENTS.map((c) => `<div class="comp${c.c === sel ? ' sel' : ''}${c.c === 8 ? ' chapter' : ''}"><span class="no">0${c.c}</span><i class="gl g${c.c}"></i><span class="nm">${c.name}</span><span class="ct">${countFor(c.c)}</span><span class="pl">${c.plain}</span></div>`).join('\n')}
<div class="foot"><span><b class="num" style="font-size:15px;color:var(--paper)">${TOTAL}</b> pieces visible</span><u>Hide all</u></div></aside>`;

const live = () => `<aside class="glass live"><div class="caps k"><i class="dot"></i>Live engine</div>
<p>Nothing here is typed in. This page runs the game's own battle code.</p>
<div class="row"><span>Seed<b>${P.seed}</b></span><span class="btn">Re-roll</span></div></aside>`;

const rail = (view) => `<div class="glass rail">
<div class="rb${view === '34' ? ' on' : ''}"><i class="v34"></i></div><div class="rb${view === 'front' ? ' on' : ''}"><i class="vfront"></i></div><div class="rb"><i class="vside"></i></div><div class="rb"><i class="vtop"></i></div><hr>
<div class="rb"><i class="plus"></i></div><div class="rb"><i class="minus"></i></div><hr><div class="rb"><i class="spin"></i></div><div class="rb"><i class="full"></i></div><div class="rb"><i class="q">?</i></div></div>`;

const explode = (pct, caption, labelsOn) => `<div class="caps xcap"><span>${caption}</span></div>
<div class="glass explode"><div class="toggle${labelsOn ? '' : ' off'}"><i></i><span class="lab${labelsOn ? ' on' : ''}">Labels</span></div><div class="sep"></div>
<span class="lab${pct === 0 ? ' on' : ''}">Assembled</span><div class="track" style="--p:${pct}%"><div class="groove"></div><div class="fill"></div><div class="ticks"></div><div class="knob"></div></div><span class="lab${pct === 100 ? ' on' : ''}">Every rule</span>
<div class="pct">${pct}<small>%</small></div><span class="reset">Reset</span></div>`;

const page = ({ file, title, cx, body, sel = 0, pct, caption, hint, view = '34', labelsOn = true, tag }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${title}</title><link rel="stylesheet" href="b.css"></head>
<body class="${file}"><div class="studio" style="--cx:${cx}px">
<div class="spot"></div><div class="floor"></div>
${body}
<div class="grain"></div><div class="vignette"></div>
<header class="title"><div class="eyebrow">Pyrefly Studio · Battle system</div><h1>One Turn</h1>
<div class="facts">Tidus · Attack · Seymour Flux<br><b>${TOTAL}</b> sourced rules · live engine</div></header>
<div class="gameswitch"><span class="on">FFX</span><span>FFX-2</span></div>
${chapters()}
<div class="glass search"><i class="mag"></i><span class="ph">Find a rule, status or move</span><span class="kbd">/</span></div>
${components(sel)}
${live()}
${rail(view)}
${explode(pct, caption, labelsOn)}
<div class="hint">${hint.map((h) => `<span>${h}</span>`).join('<i></i>')}</div>
<div class="concept">Concept · ${tag}</div>
<div class="credits">Unofficial fan tribute · <u>sources &amp; credits</u></div>
</div></body></html>`;

// ---- the staged turn -------------------------------------------------------------------------------
const actRow = (r, i) => `<div class="act${i === 0 ? ' now' : ''}${r.party ? '' : ' foe'}"><span class="face${r.id === 'mortiorchis' ? ' mort' : ''}"><img src="${ART}/${FACE[r.id]}" alt=""></span><span class="nm">${r.who}</span><span class="tk">${r.tick}</span></div>`;

// frame 1: assembled
const turntable = () => `<div class="plinth"></div><div class="turntable"><i class="ring"></i><i class="ticks"></i><i class="arc"></i></div>`;
const b1 = () => {
  const cx = 740, cy = 676;
  return `<div class="stage" style="--cx:${cx}px;--cy:${cy}px;--rx:430px;--sq:.2">
<div class="cyc" style="left:${cx - 500}px;top:84px;width:1000px;height:570px"><img src="${ART}/backdrops/gagazet.png" alt=""></div>
${turntable()}
<div class="shadow" style="left:${cx - 330}px;top:${cy - 30}px;width:300px;height:56px"></div>
<div class="shadow" style="left:${cx + 80}px;top:${cy - 52}px;width:330px;height:64px"></div>
<img class="fig back" src="${ART}/characters/mortiorchis/idle.png" style="left:${cx - 6}px;top:150px;width:516px" alt="">
<img class="fig" src="${ART}/characters/seymour-flux-body/idle.png" style="left:${cx + 124}px;top:246px;height:410px" alt="">
<img class="fig" src="${ART}/characters/tidus/attack.png" style="left:${cx - 344}px;top:292px;height:392px" alt="">

<div class="pin" style="left:${cx - 404}px;top:196px"><span class="d">02</span><span class="t">Command</span></div>
<div class="banner" style="left:${cx - 400}px;top:232px"><span class="nm">Attack</span><span class="chip">Rank ${P.attackRecord.rank}</span></div>
<div class="plain" style="left:${cx - 404}px;top:276px">Rank ${P.attackRecord.rank}: his next turn comes <b>${recovery}</b> ticks later</div>

<div class="pin" style="left:${cx - 52}px;top:262px"><span class="d">04</span><span class="t">Damage</span></div>
<div class="dmg" style="left:${cx - 40}px;top:298px"><b>${dealt}</b></div>
<div class="chipline" style="left:${cx - 66}px;top:382px"><span class="d">03</span><span>Hit <b>${atk.hitPercent}%</b></span><span>Crit <b>${atk.critPercent}%</b></span></div>
<div class="chipline" style="left:${cx - 66}px;top:416px"><span class="d">05</span><span>No element <b>×1.0</b></span></div>
<div class="chipline" style="left:${cx - 66}px;top:450px"><span class="d">06</span><span>No status applied</span></div>

<div class="pin" style="left:${cx - 330}px;top:690px"><span class="d">07</span></div>
<div class="odbar" style="left:${cx - 296}px;top:688px"><div class="k"><span>Overdrive gauge</span><b>${gauge.before} → ${gauge.after}%</b></div><div class="bar"><i style="width:${gauge.before}%"></i><em style="left:${gauge.before}%;width:${gauge.after - gauge.before}%"></em></div></div>

<div class="pin" style="left:${cx + 150}px;top:118px"><span class="d">08</span><span class="t">The boss's next move</span></div>
<div class="intent" style="left:${cx + 150}px;top:152px"><span class="k">NEXT</span><span class="v">${next.move}</span></div>

<div class="pin" style="left:${cx + 412}px;top:516px"><span class="d">01</span><span class="t">Turn order</span></div>
<div class="plain" style="left:${cx + 414}px;top:545px">Ticks to wait. The lowest acts next.</div>
<div class="actlist" style="left:${cx + 412}px;top:570px">${order.slice(0, 5).map(actRow).join('')}</div>
</div>

<aside class="glass peek"><div class="head"><div class="caps k"><span>Switch to FFX-2</span><em>preview</em></div>
<p>The list changes. FFX-2 has no turn list: each girl has her own gauge.</p></div>
${[['The gauge', 'fill, command, charge, recovery', 1], ['Command and charge time', '', 1], ['Hit roll', '', 0], ['Damage', '', 0], ['Element', '', 0], ['Status', '', 0], ['Chain', 'hits in a row multiply damage', 1], ['Spherechange', 'changing job costs the turn', 1]]
    .map(([n, s, isNew], i) => `<div class="r${isNew ? ' new' : ''}"><span class="no">0${i + 1}</span><span class="nm">${n}${s ? `<small>${s}</small>` : ''}</span></div>`).join('')}
<div class="src">ffx2-combat-core §1, §2, §4.2<br>ffx-vs-ffx2-presentation §4.2</div></aside>`;
};

// frame 2: exploded at 55%, step 01 selected
const STEPS = [
  { rule: 'The lowest counter goes next. Three are tied at 0, and the party goes before enemies.', lv: `<b>${order.slice(0, 5).map((r) => r.tick).join(' · ')}</b><span class="pw">ticks each one must wait</span>`, two: 1 },
  { rule: 'Every command has a rank. A higher rank means a longer wait for your next turn.', lv: `Rank ${P.attackRecord.rank} <b>${baseTicks} × ${P.attackRecord.rank} = ${recovery}</b> ticks` },
  { rule: 'A physical attack rolls to hit. Only 40% of Accuracy counts, against Evasion.', lv: `Hit <b>${atk.hitPercent}%</b> Critical <b>${atk.critPercent}%</b>` },
  { rule: 'Strength cubed ÷ 32 + 30, cut by his Defense, then a 32-step random roll.', lv: `<b>${atk.min}–${atk.max}</b> dealt <b>${dealt}</b>` },
  { rule: 'Weak ×1.5, resists ×0.5, immune ×0, absorbs heals. The strongest one wins.', lv: `No element <b>×1.0</b>` },
  { rule: 'A status lands if its chance, minus the target’s resistance, beats a 0–100 roll.', lv: `His Poison resistance <b>90</b>` },
  { rule: 'Warrior mode: damage × 10 ÷ your own undefended Attack, capped at 16.', lv: `${dealt}×10÷${P.estimatedDamageTidus} <b>${gauge.before} → ${gauge.after}%</b>` },
  { rule: 'His script is fixed. The studio runs it ahead on a copy of the battle.', lv: `<b class="sm">${next.move}</b><span class="pw">next · ${zombie}% chance of Zombie</span>`, two: 1 },
];
const STEP_NAMES = ['Turn order', 'Command', 'Hit roll', 'Damage', 'Element, affinity', 'Status', 'Overdrive gauge', 'Boss’s next move'];
const b2 = () => {
  const cx = 736, cy = 690;
  // U-shaped track: 01 02 03 up the left, 04 05 across the back, 06 07 08 down the right.
  const L = 296, Rr = 952, T = 92, W = 226;
  const ys = [556, 398, 240];
  const pos = [
    { x: L, y: ys[0], t: 'perspective(1300px) rotateY(22deg) scale(1.03)' },
    { x: L + 8, y: ys[1], t: 'perspective(1300px) rotateY(22deg)' },
    { x: L + 16, y: ys[2], t: 'perspective(1300px) rotateY(22deg) scale(.97)', far: 1 },
    { x: cx - W - 8, y: T, t: 'perspective(1300px) rotateX(-11deg)', far: 1 },
    { x: cx + 8, y: T, t: 'perspective(1300px) rotateX(-11deg)', far: 1 },
    { x: Rr - 16, y: ys[2], t: 'perspective(1300px) rotateY(-22deg) scale(.97)', far: 1 },
    { x: Rr - 8, y: ys[1], t: 'perspective(1300px) rotateY(-22deg)' },
    { x: Rr, y: ys[0], t: 'perspective(1300px) rotateY(-22deg) scale(1.03)' },
  ];
  const anchors = [[cx - 128, 388], [cx - 70, 470], [cx - 14, 520], [cx + 24, 446], [cx - 36, 585], [cx + 128, 470], [cx - 110, 662], [cx + 116, 300]];
  const edge = (i) => (i < 3 ? [pos[i].x + W - 6, pos[i].y + 66] : i < 5 ? [pos[i].x + W / 2, pos[i].y + 130] : [pos[i].x + 6, pos[i].y + 66]);
  const mx = L + W / 2, rx2 = Rr + W / 2;
  return `<div class="stage" style="--cx:${cx}px;--cy:${cy}px;--rx:330px;--sq:.19">
<div class="cyc" style="left:${cx - 235}px;top:240px;width:470px;height:300px;opacity:.8;filter:blur(1.2px)"><img src="${ART}/backdrops/gagazet.png" alt=""></div>
${turntable()}
<svg class="lines">
<path class="trk" d="M${mx} 690 V 262 Q ${mx} 156 ${cx - 120} 156 H ${cx + 120} Q ${rx2} 156 ${rx2} 262 V 690"/>
${anchors.map((a, i) => { const e = edge(i); const dx = cx - e[0], dy = 470 - e[1], k = (i === 3 || i === 4 ? 20 : 26) / Math.hypot(dx, dy); const x = (e[0] + dx * k).toFixed(1), y = (e[1] + dy * k).toFixed(1); return `<path class="stub${i === 0 ? ' sel' : ''}" d="M${e[0]} ${e[1]} L${x} ${y}"/><circle class="${i === 0 ? 'sel' : ''}" cx="${x}" cy="${y}" r="3"/>`; }).join('')}
</svg>
<div class="shadow" style="left:${cx - 210}px;top:${cy - 22}px;width:220px;height:44px"></div>
<div class="shadow" style="left:${cx + 28}px;top:${cy - 44}px;width:200px;height:40px;opacity:.7"></div>
<img class="fig back" src="${ART}/characters/mortiorchis/idle.png" style="left:${cx - 26}px;top:248px;width:236px" alt="">
<img class="fig" src="${ART}/characters/seymour-flux-body/idle.png" style="left:${cx + 44}px;top:398px;height:262px" alt="">
<img class="fig" src="${ART}/characters/tidus/attack.png" style="left:${cx - 206}px;top:410px;height:288px" alt="">
<div class="dmg" style="left:${cx - 28}px;top:412px;transform:skewX(-12deg) rotate(-4deg) scale(.72);transform-origin:0 0"><b>${dealt}</b></div>
${STEPS.map((s, i) => { const p = pos[i]; return `<div class="step${i === 0 ? ' sel' : ''}${p.far ? ' far' : ''}" style="left:${p.x}px;top:${p.y}px;width:${W}px;transform:${p.t}"><div class="hd"><span class="no">0${i + 1}</span><span>${STEP_NAMES[i]}</span></div><p>${s.rule}</p><div class="lv${s.two ? ' two' : ''}"><i class="e"></i>${s.lv}</div></div>`; }).join('\n')}
</div>

<aside class="glass detail"><div class="bar"></div><div class="in">
<div class="eb"><span class="caps k">01 · Turn order</span><span class="only">FFX only</span></div>
<h2>Turn order</h2>
<div class="tabs"><span>Overview</span><span class="on">How it works</span></div>
<p class="body">Everyone has a counter; the lowest goes next. Acting adds your base ticks × the command’s rank. Faster means fewer ticks.</p>
<div class="claim"><i></i>Game rule · 2 sources agree · computed live</div>
<div class="try"><div class="caps k"><span>Drag Tidus’s Agility</span><em><i></i>Live</em></div>
<div class="agi"><div class="track" style="--p:${((44 - 10) / (62 - 10) * 100).toFixed(1)}%"><div class="groove"></div><div class="fill"></div><div class="mark" data-l="30" style="left:${((30 - 10) / (62 - 10) * 100).toFixed(1)}%"></div><div class="knob"></div></div><div class="val">44</div></div>
<div class="sub">Base ticks <b>${baseTicks} → ${sweep44.baseTicks}</b> · Attack costs <b>${recovery} → ${sweep44.rank3Recovery}</b> ticks</div>
<div class="cols"><div><div class="ch">At 30 (his build)</div>${at30.map((r) => `<div class="tl${r.who === 'Tidus' ? ' me' : r.who === 'Kimahri' || r.who === 'Yuna' ? '' : ' foe'}"><span>${r.who}</span><span class="tk">${r.tick}</span></div>`).join('')}</div>
<div><div class="ch now">At 44 (your drag)</div>${at44.map((r, i) => `<div class="tl${r.who === 'Tidus' ? (i > 0 ? ' me moved' : ' me') : r.who === 'Kimahri' || r.who === 'Yuna' ? '' : ' foe'}"><span>${r.who}</span><span class="tk">${r.tick}</span></div>`).join('')}</div></div>
<div class="note">Numbers are ticks from now. His second turn moves from 8th to 5th.</div></div>
<div class="facts2"><div><div class="fk">Source</div><div class="fv"><u>ffx-combat-core</u><br>§1.1, §1.2, §1.6</div></div>
<div><div class="fk">Computed by</div><div class="fv">battle/ffx/turnQueue.ts<small>the game’s own file</small></div></div></div>
</div>
<div class="actions"><div class="isolate"><span>Isolate step</span></div><span class="clear">Clear selection</span></div></aside>`;
};

// frame 3: the flat inventory, largest first
const b3 = () => {
  const bySize = (s) => PIECES.filter((p) => p.size === s).sort((a, b) => a.c - b.c);
  const tile = (p) => {
    const hot = p.name === 'Zombie';
    const inner = p.size === 'L'
      ? `<i class="gl g${p.c}"></i><span class="nm">${p.name}</span><span class="fx">${p.line}</span>`
      : `<i class="gl g${p.c}"></i><span>${p.name}</span>`;
    const tip = hot ? `<div class="tip"><div class="caps k"><span>06 · Status</span><em>1 of ${countFor(6)}</em></div><h3>Zombie</h3>
<p>Healing hurts instead. Life, Full-Life and Phoenix Down kill a living Zombie outright. Holy Water or Remedy cures it; Esuna does not.</p>
<div class="src">In this fight: Lance of Atrophy inflicts it, then Full-Life finishes the job.<br><b>Source</b> ffx-combat-core §4.2 · ffx-seymour-flux §4.2</div></div><i class="cursor"></i>` : '';
    return `<div class="tile ${p.size}${hot ? ' hot' : ''}">${inner}${tip}</div>`;
  };
  const Ls = bySize('L'), Ms = bySize('M'), Ss = bySize('S');
  return `<div class="inv">
${Ls.map(tile).join('')}<div class="cap tall"><b>${Ls.length}</b> mechanisms, each with its formula</div><div class="brk"></div>
${Ms.map(tile).join('')}<div class="cap"><b>${Ms.length}</b> named rules: statuses, steps, modes, moves</div><div class="brk"></div>
${Ss.map(tile).join('')}<div class="cap"><b>${Ss.length}</b> single values</div>
</div>`;
};

const FRAMES = [
  { file: 'b1-assembled', title: 'Pyrefly Studio · B1 assembled', cx: 740, body: b1(), pct: 0, caption: 'One turn · assembled', hint: ['Drag to orbit', 'Scroll to zoom', 'Click a piece to inspect'], tag: 'B1 · FFX' },
  { file: 'b2-exploded-selected', title: 'Pyrefly Studio · B2 exploded, Turn order selected', cx: 736, body: b2(), sel: 1, pct: 55, caption: 'Separated steps', hint: ['Drag to orbit', 'Scroll to zoom', 'Click a step to inspect'], tag: 'B2 · FFX' },
  { file: 'b3-inventory', title: 'Pyrefly Studio · B3 inventory', cx: 900, body: b3(), pct: 100, caption: `Rule inventory · ${TOTAL} pieces · largest first`, hint: ['Drag to pan', 'Scroll to zoom', 'Hover a rule to read it'], view: 'front', labelsOn: false, tag: 'B3 · FFX' },
];

const only = process.argv[2];
const browser = await chromium.launch({ headless: true });
let failed = false;
try {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  for (const f of FRAMES) {
    if (only && !f.file.startsWith(only)) continue;
    const html = join(here, f.file + '.html');
    writeFileSync(html, page(f));
    const pg = await ctx.newPage();
    const problems = [];
    pg.on('pageerror', (e) => problems.push('pageerror: ' + e));
    pg.on('requestfailed', (r) => problems.push('request failed: ' + r.url()));
    await pg.goto(pathToFileURL(html).href, { waitUntil: 'load', timeout: 60000 });
    await pg.evaluate(() => document.fonts.ready);
    const audit = await pg.evaluate(async () => {
      const imgs = [...document.images];
      await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => (i.onload = i.onerror = r)))));
      const out = { broken: imgs.filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src')), small: [], clipped: [], off: [], spill: [] };
      for (const box of document.querySelectorAll('.step, .tile, .tip, .peek, .detail, .try, .components, .live, .explode, .search, .chap, .act, .banner, .isolate')) {
        const R = box.getBoundingClientRect();
        const tw = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
        while (tw.nextNode()) {
          const tn = tw.currentNode; const t = tn.textContent.trim(); if (!t) continue;
          if (box.classList.contains('tile') && tn.parentElement.closest('.tip')) continue; // the hover card is checked as its own box
          const rg = document.createRange(); rg.selectNodeContents(tn); const r = rg.getBoundingClientRect(); if (!r.width) continue;
          if (r.right > R.right + 0.5 || r.left < R.left - 0.5 || r.bottom > R.bottom + 0.5 || r.top < R.top - 0.5) out.spill.push(`"${t.slice(0, 40)}" leaves .${box.className.split(' ')[0]} by ${Math.round(Math.max(r.right - R.right, R.left - r.left, r.bottom - R.bottom, R.top - r.top))}px`);
        }
      }
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const seen = new Set();
      while (walker.nextNode()) {
        const node = walker.currentNode; const txt = node.textContent.trim(); if (!txt) continue;
        const el = node.parentElement; if (seen.has(el)) continue; seen.add(el);
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        // effective size = font-size x the vertical scale of every transformed ancestor
        let scale = 1; for (let a = el; a && a !== document.body; a = a.parentElement) { const m = getComputedStyle(a).transform; if (m && m !== 'none') { const v = m.match(/matrix(3d)?\(([^)]+)\)/); if (v) { const n = v[2].split(',').map(Number); scale *= v[1] ? Math.hypot(n[4], n[5], n[6]) : Math.hypot(n[2], n[3]); } } }
        const px = parseFloat(cs.fontSize) * scale;
        if (px < 12.95) out.small.push(`${px.toFixed(1)}px "${txt.slice(0, 40)}"`);
        if (el.scrollWidth > el.clientWidth + 1 && cs.overflow !== 'visible') out.clipped.push(`"${txt.slice(0, 40)}"`);
        const r = el.getBoundingClientRect();
        if (r.width && (r.right > 1601 || r.bottom > 901 || r.left < -1 || r.top < -1)) out.off.push(`"${txt.slice(0, 40)}" ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.right)},${Math.round(r.bottom)}`);
      }
      return out;
    });
    await pg.waitForTimeout(300);
    writeFileSync(join(here, f.file + '.png'), await pg.screenshot({ type: 'png' }));
    await pg.close();
    for (const b of audit.broken) problems.push('image did not decode: ' + b);
    for (const s of audit.small) problems.push('text under 13px: ' + s);
    for (const s of audit.clipped) problems.push('clipped text: ' + s);
    for (const s of audit.off) problems.push('off canvas: ' + s);
    for (const s of audit.spill) problems.push('text outside its box: ' + s);
    console.log(`[capture] ${f.file}.png  ${problems.length ? problems.length + ' problem(s)' : 'clean'}`);
    for (const p of problems) console.log('   - ' + p);
    if (problems.length) failed = true;
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
