#!/usr/bin/env node
/**
 * Writes the three Option A frames as static HTML. Every count and number printed on a
 * frame is read here from the shipped data modules (read-only); nothing is typed by hand.
 *   node docs/concepts/atlas/a-boss-atlas/build-a.mjs      (Node 24 strips the types)
 * then capture with shoot-a.mjs. Concept only: imports src/data, writes only this folder.
 */
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vegnagunTailGroup, vegnagunLegGroup, vegnagunBodyGroup, vegnagunHeadGroup, shuyinGroup } from '../../../../src/data/ffx2/enemies/vegnagun-shuyin.ts';
import { vegnagunAbilities } from '../../../../src/data/ffx2/enemies/vegnagun-abilities.ts';
import { vegnagunBodyAbilities } from '../../../../src/data/ffx2/enemies/vegnagun-body-abilities.ts';
import { shuyinAbilities } from '../../../../src/data/ffx2/enemies/shuyin-abilities.ts';
import { FFX2_VEGNAGUN_SHUYIN_GUIDE as GUIDE } from '../../../../src/data/guides/ffx2-vegnagun-shuyin.ts';
import { CHAPTERS } from '../../../../src/data/encounters.ts';

const here = dirname(fileURLToPath(import.meta.url));
const ART = '../../../../public/art/characters/';
const fmt = (n) => n.toLocaleString('en-US');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ------------------------------------------------------------ the real data */
const groups = [vegnagunTailGroup, vegnagunLegGroup, vegnagunBodyGroup, vegnagunHeadGroup, shuyinGroup];
const abilityById = new Map([...vegnagunAbilities, ...vegnagunBodyAbilities, ...shuyinAbilities].map((a) => [a.id, a]));
const combatants = groups.flatMap((g) => [...g.enemies, ...(g.parts ?? [])]);
const byId = Object.fromEntries(combatants.map((c) => [c.id, c]));
const chapter = CHAPTERS.find((c) => c.id === 'ffx2-vegnagun-shuyin');

const usedAbilityIds = [...new Set(combatants.flatMap((c) => c.abilityIds))];
for (const id of usedAbilityIds) if (!abilityById.has(id)) throw new Error('ability not found: ' + id);

const onParty = (a) => !/all(y|ies)|self/.test(a.targeting);
const inflicted = new Map(); // status -> ability names
for (const id of usedAbilityIds) {
  const a = abilityById.get(id);
  if (!onParty(a)) continue;
  for (const s of a.statusEffects) inflicted.set(s.status, [...new Set([...(inflicted.get(s.status) ?? []), a.name])]);
}
const immunityKeys = [...new Set(combatants.flatMap((c) => Object.keys(c.immunities)))];
const immunityCover = Object.fromEntries(immunityKeys.map((k) => [k, combatants.filter((c) => k in c.immunities).length]));
const affinities = [...new Set(combatants.flatMap((c) => Object.entries(c.affinities).map(([k, v]) => k + ':' + v)))];
const aiScripts = [...new Set(combatants.map((c) => c.aiScriptId))];
const rewardItems = [...new Set(combatants.flatMap((c) => [
  ...c.rewards.drops.map((d) => d.itemId),
  ...(c.rewards.steal ? [c.rewards.steal.common.itemId, c.rewards.steal.rare.itemId] : []),
]))];

const COUNTS = {
  parts: combatants.length,
  attacks: usedAbilityIds.length,
  statuses: inflicted.size,
  immunities: immunityKeys.length,
  affinities: affinities.length,
  ai: aiScripts.length,
  rewards: rewardItems.length,
};
const TOTAL = Object.values(COUNTS).reduce((a, b) => a + b, 0);
console.log('[build-a] counts', COUNTS, 'total', TOTAL);

/* display names. Status names follow research/ffx2-vegnagun-shuyin.md §3.1 "Immune" row and
   vegnagun-shared.ts; item names follow src/data/ffx2/items/*.ts and research §3.2-3.5. */
const STATUS = {
  ko: 'Death', petrify: 'Petrify', sleep: 'Sleep', silence: 'Silence', darkness: 'Darkness', poison: 'Poison',
  confuse: 'Confusion', berserk: 'Berserk', curse: 'Curse', eject: 'Eject', doom: 'Doom', 'delay-effect': 'Delay',
  'action-cancel': 'Interrupt', haste: 'Haste', slow: 'Slow', stop: 'Stop', reflect: 'Reflect',
  'str-up': 'Str Up', 'str-down': 'Str Down', 'mag-up': 'Mag Up', 'mag-down': 'Mag Down', 'accu-up': 'Acc Up',
  'accu-down': 'Acc Down', 'eva-up': 'Eva Up', 'eva-down': 'Eva Down', 'luck-up': 'Luck Up', 'luck-down': 'Luck Down',
  'def-up': 'Def Up', 'def-down': 'Def Down', 'mdef-up': 'MDef Up', 'mdef-down': 'MDef Down',
};
const ITEM = {
  'x2-megalixir': 'Megalixir', 'x2-mythril-bangle': 'Mythril Bangle', 'mythril-bangle': 'Mythril Bangle', 'x2-elixir': 'Elixir', 'x2-turbo-ether': 'Turbo Ether',
  'x2-mega-potion': 'Mega-Potion', 'x2-x-potion': 'X-Potion', 'x2-phoenix-down': 'Phoenix Down', 'x2-l-bomb': 'L-Bomb',
  'x2-hero-drink': 'Hero Drink',
};
for (const k of immunityKeys) if (!STATUS[k]) throw new Error('no display name for status ' + k);
for (const k of rewardItems) if (!ITEM[k]) throw new Error('no display name for item ' + k);
/* one plain line per AI script, each from the research section named */
const AI = {
  'vegnagun-tail': ['Tail', 'a fixed script with one HP trigger', '§5.1'],
  'vegnagun-leg': ['Leg', 'a 26-step table, Vita Brevis every 4th turn', '§5.2'],
  'vegnagun-node': ['Nodes', 'cycle Red, Green, Yellow', '§3.2'],
  'vegnagun-body': ['Core', 'charges three times, then fires', '§4.1'],
  'vegnagun-bulwark': ['Bulwarks', 'hit back in the damage type you used', '§3.3'],
  'vegnagun-head': ['Head', 'two phases and a hidden fail clock', '§5.4, §4.2'],
  'vegnagun-redoubt': ['Redoubts', 'four-step loops, and they revive each other', '§5.4'],
  shuyin: ['Shuyin', 'an eight-turn cycle', '§5.5'],
};
for (const k of aiScripts) if (!AI[k]) throw new Error('no line for ai script ' + k);

const SYSTEMS = [
  ['parts', 'Parts and forms', 'what stands on the field, battle by battle', COUNTS.parts],
  ['attacks', 'Attacks and abilities', 'every move any part can make', COUNTS.attacks],
  ['status', 'Statuses it inflicts', 'what it can put on your party', COUNTS.statuses],
  ['immune', 'Immunities', 'statuses that some part shrugs off', COUNTS.immunities],
  ['element', 'Elemental affinities', 'Gravity does nothing, on all ' + COUNTS.parts, COUNTS.affinities],
  ['ai', 'Turn pattern (AI)', 'how each kind of part decides its move', COUNTS.ai],
  ['rewards', 'Rewards', 'what it drops, and what you can steal', COUNTS.rewards],
];

/* ------------------------------------------------------------ shared chrome */
const roman = ['I', 'II', 'III', 'IV', 'V'];
const THUMB = { // painting, zoom, focus x, focus y, aspect (h/w) of the painting
  'seymour-flux': ['seymour-flux', 3.2, 0.5, 0.11, 1214 / 832],
  yunalesca: ['yunalesca-1', 3.6, 0.44, 0.2, 1184 / 823],
  'braskas-final-aeon': ['braskas-final-aeon-1', 3.0, 0.31, 0.24, 953 / 1004],
  'ffx2-bahamut': ['ffx2-bahamut', 3.0, 0.45, 0.13, 1],
  'ffx2-vegnagun-shuyin': ['vegnagun-head', 2.7, 0.37, 0.68, 832 / 1216],
};
function crop(id, zoom, fx, fy, ar) {
  const px = ((0.5 - fx * zoom) / (1 - zoom)) * 100;
  const py = ((0.5 - fy * zoom * ar) / (1 - zoom * ar)) * 100;
  return `background-image:url('${ART}${id}/idle.png');background-size:${zoom * 100}% auto;background-position:${px.toFixed(1)}% ${py.toFixed(1)}%`;
}
const switcher = () => `<div class="card switcher" data-audit>${CHAPTERS.map((c, i) => {
  const t = THUMB[c.id];
  return `<div class="chip-ch${c.id === chapter.id ? ' on' : ''}"><div class="thumb" style="${crop(...t)}"></div><div><div class="k">${roman[i]} &middot; ${c.game === 'ffx' ? 'FFX' : 'FFX-2'}</div><div class="n">${esc(c.title)}</div></div></div>`;
}).join('')}</div>`;

const ICON = {
  tilt: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9" ry="4"/><path d="M12 3v18"/><path d="M18 9.5l3 2.5-3 2.5"/></svg>',
  front: '<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="1.5"/><path d="M9 9h6v6H9z"/></svg>',
  zin: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5M8 11h6M11 8v6"/></svg>',
  zout: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5M8 11h6"/></svg>',
  reset: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v5h5"/></svg>',
  help: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.5-1.1 1-1.1 1.8M12 17v.2"/></svg>',
  search: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#0b0a12" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></svg>',
};
const rail = (active) => `<div class="card rail" data-audit>${[['tilt', 'Tilt'], ['front', 'Front'], ['zin', 'Closer'], ['zout', 'Wider'], ['reset', 'Reset'], ['help', 'Help']]
  .map(([k, l]) => `<div class="b${k === active ? ' on' : ''}">${ICON[k]}<span>${l}</span></div>`).join('')}</div>`;

function chrome({ pct, state, hint, view, selectedSystem, labels }) {
  const knob = pct; // percent along the track
  return `
<div class="title">
  <div class="caps eyebrow">Pyrefly Atlas &middot; boss anatomy</div>
  <h1>${esc(chapter.title)}</h1>
  <div class="sub">${esc(chapter.subtitle)}</div>
  <div class="facts"><b>${TOTAL}</b> catalogued pieces &middot; <b>${groups.length}</b> battles &middot; FFX-2, chapter ${chapter.number}<br>Source: research/ffx2-vegnagun-shuyin.md</div>
</div>
${switcher()}
<div class="card search" data-audit>${ICON.search}<span>Find a part, attack or status</span><b class="kbd">/</b></div>
${rail(view)}
<div class="card systems" data-audit>
  <div class="hd"><span class="caps">Systems</span><span class="num">${SYSTEMS.length}</span></div>
  <div class="tabs"><span class="tab on">All</span><span class="tab">What it does</span><span class="tab">What stops it</span></div>
  ${SYSTEMS.map(([k, n, p, c]) => `<div class="sys${k === selectedSystem ? ' sel' : ''}"><span class="dot" style="background:var(--sys-${k})"></span><div class="nm">${n}</div><span class="ct">${c}</span><span class="tog"></span><div class="pl">${p}</div></div>`).join('\n  ')}
  <div class="ft"><span><b>${TOTAL}</b> pieces visible</span><span class="link">Hide all</span></div>
</div>
<div class="card explode" data-audit>
  <div class="main">
    <div class="top"><span class="caps what">Pull it apart</span><span class="caps state">${state}</span></div>
    <div class="track"><div class="bed"></div><div class="fill" style="width:${knob}%"></div>${[0, 25, 50, 75, 100].map((t) => `<i class="tick" style="left:${t}%"></i>`).join('')}<div class="knob" style="left:${knob}%"></div></div>
    <div class="ends"><span class="end${pct > 50 ? ' dim' : ''}">Assembled</span><span class="plain">drag to take the boss apart</span><span class="end${pct < 50 ? ' dim' : ''}">Every piece</span></div>
  </div>
  <div class="side">
    <span class="pct">${pct}<small>%</small></span>
    <div class="ctl"><span class="btn-reset">Reset</span><span class="labels"><span class="tog${labels ? '' : ' off'}"></span>Labels</span></div>
  </div>
</div>
<div class="hint">${hint.map(esc).join(' <i>&middot;</i> ')}</div>
<div class="concept">CONCEPT &middot; OPTION A</div>
<div class="credits">Unofficial fan tribute &middot; <span class="link">sources &amp; credits</span></div>`;
}

const page = (title, body, script = '') => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<meta name="viewport" content="width=1600">
<link rel="stylesheet" href="a.css"></head>
<body>
${body}
${script}
</body></html>
`;

const img = (id) => `<img src="${ART}${id}/idle.png" alt="">`;
const shadow = 'filter:drop-shadow(0 16px 18px rgba(11,10,18,.24))';

/* ------------------------------------------------------------ frame 1 */
const chainRows = groups.map((g, i) => {
  const boss = g.enemies[0];
  const extra = (g.parts ?? []).length;
  const kind = ['Tail', 'Leg', 'Body / Core', 'Head', 'Shuyin'][i];
  const support = extra ? ` + ${extra} ${['', 'Nodes', 'Bulwarks', 'Redoubts'][i]}` : '';
  return `<div class="r"><span class="i">${i + 1}</span><div><div class="nm">${kind}${support}</div><div class="pl">Level ${boss.level}</div></div><div class="hp">${fmt(boss.stats.hp)}<small>HP</small></div></div>`;
}).join('\n    ');

const a1 = page('Pyrefly Atlas: Vegnagun, assembled', `
<div class="plinth" style="left:404px;top:634px;width:770px;height:146px"></div>
<div class="gshadow" style="left:470px;top:672px;width:620px;height:62px;z-index:1"></div>
<div class="part" style="left:792px;top:318px;width:384px;z-index:1;${shadow} saturate(.92) brightness(1.04)">${img('vegnagun-tail')}</div>
<div class="part" style="left:872px;top:300px;width:226px;z-index:1;${shadow} saturate(.92) brightness(1.04)">${img('vegnagun-leg')}</div>
<div class="part" style="left:462px;top:326px;width:552px;z-index:2;${shadow}">${img('vegnagun-body')}</div>
<div class="part flip" style="left:420px;top:120px;width:424px;z-index:3;${shadow}">${img('vegnagun-head')}</div>
<div class="gshadow" style="left:1082px;top:708px;width:92px;height:16px;z-index:2"></div>
<div class="part" style="left:1088px;top:596px;width:80px;z-index:3;${shadow}">${img('shuyin')}</div>
<span class="pin" style="left:1128px;top:404px">1</span>
<span class="pin" style="left:978px;top:318px">2</span>
<span class="pin" style="left:736px;top:476px">3</span>
<span class="pin" style="left:570px;top:250px">4</span>
<span class="pin" style="left:1160px;top:578px">5</span>
${chrome({ pct: 0, state: 'Whole boss', hint: ['Drag to tilt', 'Scroll to zoom', 'Click a part to inspect'], view: 'tilt', labels: false })}
<div class="card chain" data-audit><div class="in">
    <div class="caps">The chain &middot; nothing selected</div>
    <p>${esc(chapter.blurb)}</p>
    ${chainRows}
    <div class="src">Five battles with no menu between them, in this order. Levels and HP: ffx2-vegnagun-shuyin &sect;3.1 to &sect;3.5 &middot; verified: 2 sources.</div>
    <div class="btn ghost"><span>Fight this chapter</span></div>
</div></div>
`);

/* ------------------------------------------------------------ frame 2 */
const ab = (id) => abilityById.get(id);
const body = byId['vegnagun-body'];
const phase = GUIDE.phases.find((p) => p.bossId === 'vegnagun-body');
const watch = GUIDE.watch.find((w) => w.name === 'Charge Core');
const lands = immunityKeys.filter((k) => !(k in body.immunities)).map((k) => STATUS[k]);
const bodyIdx = groups.findIndex((g) => g.id === 'vegnagun-body') + 1;
const tcard = (o) => `<div class="thread-card${o.kind ? ' k-' + o.kind : ''}${o.sel ? ' sel' : ''}" style="left:${o.x}px;top:${o.y}px" data-from="${o.from}" data-ax="${o.ax}" data-ay="${o.ay}" data-side="${o.side}"${o.sel ? ' data-sel="1"' : ''}><div class="n">${o.n}</div><div class="f">${o.f}</div></div>`;
const frac = (a) => `<b>${a.power}/16</b>`;
const T = {
  tailBeam: ab('x2-vegnagun-tail-beam'), noli: ab('x2-vegnagun-noli-me-tangere'), vita: ab('x2-vegnagun-vita-brevis'),
  absorb: ab('x2-vegnagun-leg-absorb'), charge: ab('x2-vegnagun-charge-core'), memento: ab('x2-vegnagun-memento-mori'),
  fullLife: ab('x2-vegnagun-core-full-life'), nemo: ab('x2-vegnagun-nemo-ante-mortem-beatus'), odi: ab('x2-vegnagun-odi-et-amo'),
  terror: ab('x2-shuyin-terror-of-zanarkand'), rain: ab('x2-shuyin-force-rain'),
};
const rest = (ownerId, shown) => byId[ownerId].abilityIds.length - shown;

const cards = [
  // Head (battle 4)
  { from: 'head', ax: 0.78, ay: 0.3, side: 'l', x: 676, y: 106, n: esc(T.nemo.name), f: `magic, power <b>${T.nemo.power}</b> &middot; hits everyone` },
  { from: 'head', ax: 0.8, ay: 0.5, side: 'l', x: 676, y: 160, n: esc(T.odi.name), f: `<b>${T.odi.hits}</b> hits &middot; strips your buffs` },
  { from: 'head', ax: 0.76, ay: 0.72, side: 'l', x: 676, y: 214, kind: 'part', n: 'Redoubt &times; 2', f: `<b>${fmt(byId['redoubt-r'].stats.hp)}</b> HP each &middot; they revive each other` },
  // Tail (battle 1)
  { from: 'tail', ax: 0.35, ay: 0.85, side: 't', x: 938, y: 262, n: esc(T.tailBeam.name), f: `${frac(T.tailBeam)} of max HP &middot; one target` },
  { from: 'tail', ax: 0.6, ay: 0.9, side: 't', x: 938, y: 316, n: esc(T.noli.name), f: `a flat <b>${fmt(T.noli.power * 50)}</b> &middot; hits everyone` },
  // Leg (battle 2)
  { from: 'leg', ax: 0.4, ay: 0.95, side: 't', x: 916, y: 580, n: esc(T.vita.name), f: `magic, power <b>${T.vita.power}</b> &middot; everyone &middot; Delay` },
  { from: 'leg', ax: 0.55, ay: 0.95, side: 't', x: 916, y: 634, n: esc(T.absorb.name), f: `${frac(T.absorb)} of your current HP and MP` },
  { from: 'leg', ax: 0.7, ay: 0.95, side: 't', x: 916, y: 688, kind: 'part', n: 'Node &times; 3', f: `<b>${fmt(byId['node-a'].stats.hp)}</b> HP each &middot; not the fight` },
  // Body / Core (battle 3), selected
  { from: 'body', sel: 1, ax: 0.12, ay: 0.3, side: 'r', x: 360, y: 322, n: esc(T.charge.name), f: `counts to <b>${T.charge.extra.chargeCounterMax}</b>, then it fires` },
  { from: 'body', sel: 1, ax: 0.1, ay: 0.5, side: 'r', x: 360, y: 376, n: esc(T.memento.name), f: `magic, power <b>${T.memento.power}</b> &middot; hits everyone` },
  { from: 'body', sel: 1, ax: 0.12, ay: 0.7, side: 'r', x: 360, y: 430, n: esc(T.fullLife.name), f: 'stands a fallen Bulwark back up' },
  { from: 'body', sel: 1, ax: 0.14, ay: 0.92, side: 't', x: 566, y: 570, kind: 'part', n: 'Right Bulwark', f: `<b>${fmt(byId['bulwark-r'].stats.hp)}</b> HP &middot; Level ${byId['bulwark-r'].level}` },
  { from: 'body', sel: 1, ax: 0.9, ay: 0.92, side: 't', x: 744, y: 570, kind: 'part', n: 'Left Bulwark', f: `<b>${fmt(byId['bulwark-l'].stats.hp)}</b> HP &middot; Level ${byId['bulwark-l'].level}` },
  { from: 'body', sel: 1, ax: 0.5, ay: 0.98, side: 't', x: 566, y: 628, kind: 'immune', n: `Shrugs off <b>${Object.keys(body.immunities).length}</b> of ${COUNTS.immunities} statuses`, f: `what still lands: ${lands.join(', ')} &middot; Armor Break works` },
  // Shuyin (battle 5)
  { from: 'shuyin', ax: 0.85, ay: 0.4, side: 'l', x: 536, y: 690, n: esc(T.terror.name), f: `<b>${T.terror.hits}</b> hits on one girl &middot; ignores Defense` },
];
const mores = [
  { x: 678, y: 270, t: `+ ${rest('vegnagun-head', 2)} more moves at 100%` },
  { x: 918, y: 744, t: `+ ${rest('vegnagun-leg', 2)} more moves, ${byId['node-a'].abilityIds.length} on the Nodes` },
  { x: 538, y: 746, t: `+ ${rest('shuyin', 1)} more moves at 100%` },
];
/* depth, honestly 2.5D: every part is a painted cutout turned the same way; the nearer it is,
   the further its hard paper shadow falls, and the far ones fade a little */
const tilt = 'transform:perspective(720px) rotateY(-24deg)';
const cut = (n, soft) => `drop-shadow(${n}px ${n}px 0 rgba(11,10,18,.14)) drop-shadow(0 ${soft}px ${soft}px rgba(11,10,18,.2))`;
const a2 = page('Pyrefly Atlas: Vegnagun, 55% exploded, Body / Core selected', `
<div class="floor" style="left:330px;top:424px;width:830px;height:354px"><i></i></div>
<div class="plinth" style="left:528px;top:524px;width:420px;height:80px;opacity:.9"></div>
<div class="gshadow" style="left:590px;top:540px;width:300px;height:34px;z-index:1"></div>
<div class="gshadow" style="left:392px;top:746px;width:136px;height:22px;z-index:1"></div>
<div class="gshadow" style="left:452px;top:508px;width:170px;height:28px;z-index:1;opacity:.55"></div>
<div class="gshadow" style="left:1000px;top:556px;width:112px;height:16px;z-index:1;opacity:.6"></div>
<div id="p-tail" class="part flip" style="left:936px;top:118px;width:190px;z-index:1;${tilt};filter:${cut(3, 10)} saturate(.72) brightness(1.1) blur(1px)">${img('vegnagun-tail')}</div>
<div id="p-leg" class="part" style="left:1004px;top:402px;width:108px;z-index:1;${tilt};filter:${cut(5, 12)} saturate(.85) brightness(1.06) blur(.5px)">${img('vegnagun-leg')}</div>
<div id="p-body" class="part" style="left:566px;top:322px;width:340px;z-index:2;${tilt};filter:drop-shadow(2px 0 0 #b8437e) drop-shadow(-2px 0 0 #b8437e) drop-shadow(0 2px 0 #b8437e) drop-shadow(0 -2px 0 #b8437e) ${cut(8, 16)}">${img('vegnagun-body')}<img src="${ART}vegnagun-body/idle.png" alt="" style="position:absolute;left:0;top:0;opacity:.26;filter:sepia(1) hue-rotate(292deg) saturate(2.3) brightness(1.06)"></div>
<div id="p-head" class="part flip" style="left:392px;top:108px;width:266px;z-index:3;${tilt};filter:${cut(12, 16)}">${img('vegnagun-head')}</div>
<div id="p-shuyin" class="part" style="left:402px;top:566px;width:116px;z-index:4;${tilt};filter:${cut(16, 18)}">${img('shuyin')}</div>
<span class="tag" style="left:1010px;top:100px">1 &middot; Tail</span>
<span class="tag" style="left:1024px;top:378px">2 &middot; Leg</span>
<span class="tag sel" style="left:676px;top:302px">3 &middot; Body / Core</span>
<span class="tag" style="left:396px;top:98px">4 &middot; Head</span>
<span class="tag" style="left:404px;top:546px">5 &middot; Shuyin</span>
<svg class="threads" id="threads"></svg>
${cards.map(tcard).join('\n')}
${mores.map((m) => `<div class="more" style="left:${m.x}px;top:${m.y}px">${m.t}</div>`).join('\n')}
${chrome({ pct: 55, state: 'Separated parts', hint: ['Drag to tilt', 'Scroll to zoom', 'Click any piece to inspect'], view: 'tilt', selectedSystem: 'parts', labels: true })}
<div class="card detail" data-audit><div class="bar"></div><div class="in">
  <div class="eb"><span class="caps">Part &middot; battle ${bodyIdx} of ${groups.length}</span><span class="honest">Verified</span></div>
  <h2>Body / Core</h2>
  <div class="under">${esc(body.name)} &middot; Level <b>${body.level}</b> &middot; <b>${fmt(body.stats.hp)}</b> HP</div>
  <p>${esc(body.scanText)}</p>
  <div class="kind">Scan text in this project&rsquo;s own words &middot; numbers are sourced &middot; the painting is an original interpretation</div>
  <div class="dtabs"><span class="dtab">Overview</span><span class="dtab on">How to answer it</span></div>
  <div class="answer"><div class="lab">${esc(phase.label)}</div><div class="tx">${esc(phase.note)}</div><div class="ci">Strategy guide &middot; ${esc(phase.cite)}</div></div>
  <div class="answer"><div class="lab">When you see &ldquo;${esc(watch.name)}&rdquo;</div><div class="tx">${esc(watch.advice)}.</div><div class="ci">Strategy guide &middot; ${esc(watch.cite)}</div></div>
  <div class="facts-row"><div><div class="l">Research reference</div><div class="v">ffx2-vegnagun-shuyin &sect;3.3 &middot; verified: 2 sources</div></div><div><div class="l">Selected</div><div class="v n">1</div></div></div>
  <div class="facts-note">Stats follow SinirothX (Mag ${body.stats.mag} / Def ${body.stats.def}); the wiki swaps the two.</div>
  <div class="actions"><div class="btn primary"><span>Isolate</span></div><div class="btn ghost"><span>Fight this chapter</span></div></div>
  <div class="clear"><span class="link">Clear selection</span></div>
</div></div>
`, `<script>
/* threads: from an anchor on the painted part to the near edge of each small card */
(function () {
  const svg = document.getElementById('threads');
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); svg.appendChild(e); return e; };
  const bodyBox = document.getElementById('p-body').getBoundingClientRect();
  const hub = [bodyBox.left + bodyBox.width / 2, bodyBox.top + bodyBox.height / 2];
  for (const id of ['tail', 'leg', 'head', 'shuyin']) {
    const r = document.getElementById('p-' + id).getBoundingClientRect();
    mk('line', { x1: hub[0], y1: hub[1], x2: r.left + r.width / 2, y2: r.top + r.height / 2, stroke: 'rgba(11,10,18,.42)', 'stroke-width': 1.5, 'stroke-dasharray': '3 6' });
  }
  for (const c of document.querySelectorAll('.thread-card')) {
    const p = document.getElementById('p-' + c.dataset.from).getBoundingClientRect();
    const r = c.getBoundingClientRect();
    const x1 = p.left + p.width * +c.dataset.ax, y1 = p.top + p.height * +c.dataset.ay;
    const s = c.dataset.side;
    const x2 = s === 'l' ? r.left : s === 'r' ? r.right : r.left + Math.min(28, r.width / 2);
    const y2 = s === 't' ? r.top : s === 'b' ? r.bottom : r.top + r.height / 2;
    const col = c.dataset.sel ? '#b8437e' : 'rgba(11,10,18,.45)';
    mk('line', { x1, y1, x2, y2, stroke: col, 'stroke-width': c.dataset.sel ? 1.4 : 1 });
    mk('circle', { cx: x1, cy: y1, r: 3, fill: col });
    mk('circle', { cx: x2, cy: y2, r: 2, fill: col });
  }
})();
</script>`);

/* ------------------------------------------------------------ frame 3 */
const bosses = groups.map((g) => g.enemies[0]).sort((a, b) => b.stats.hp - a.stats.hp);
const supports = groups.flatMap((g) => g.parts ?? []).sort((a, b) => b.stats.hp - a.stats.hp);
const PART_LABEL = { 'vegnagun-tail': 'Tail', 'vegnagun-leg': 'Leg', 'vegnagun-body': 'Body / Core', 'vegnagun-head': 'Head', shuyin: 'Shuyin' };
const CROP = { // illustrative zooms into the parent painting: these seven have no painting of their own
  'node-a': ['vegnagun-leg', 4.2, 0.765, 0.105, 1175 / 777], 'node-b': ['vegnagun-leg', 4.2, 0.3, 0.57, 1175 / 777], 'node-c': ['vegnagun-leg', 3.6, 0.2, 0.14, 1175 / 777],
  'bulwark-r': ['vegnagun-body', 2.7, 0.87, 0.6, 827 / 1213], 'bulwark-l': ['vegnagun-body', 2.7, 0.12, 0.6, 827 / 1213],
  'redoubt-r': ['vegnagun-head', 3.0, 0.4, 0.18, 832 / 1216], 'redoubt-l': ['vegnagun-head', 3.0, 0.14, 0.3, 832 / 1216],
};
const HOVER = 'bulwark-r';
const partTiles = bosses.map((b) => `<div class="tile paint"><div class="im" style="background-image:url('${ART}${b.spriteKey}/idle.png')"></div><div class="cap"><span class="n">${PART_LABEL[b.id]}</span><span class="h">${fmt(b.stats.hp)}</span></div></div>`).join('') +
  `<div class="smalls">${supports.map((s) => `<div class="tile crop${s.id === HOVER ? ' hover' : ''}" id="t-${s.id}" style="${crop(...CROP[s.id])}"><span class="nm">${esc(s.name)}</span></div>`).join('')}</div>`;

// abilities, grouped by the set of parts that own them, in battle order
const ownerSets = new Map();
for (const id of usedAbilityIds) {
  const owners = combatants.filter((c) => c.abilityIds.includes(id)).map((c) => c.id).join('+');
  ownerSets.set(owners, [...(ownerSets.get(owners) ?? []), id]);
}
const OWNER = {
  'vegnagun-tail': 'Tail', 'vegnagun-leg': 'Leg', 'node-a+node-b+node-c': 'Nodes', 'vegnagun-body': 'Core',
  'bulwark-r+bulwark-l': 'Bulwarks', 'bulwark-r': 'Bulwark R', 'bulwark-l': 'Bulwark L', 'vegnagun-head': 'Head',
  'redoubt-r': 'Redoubt R', 'redoubt-l': 'Redoubt L', 'redoubt-r+redoubt-l': 'Redoubts', shuyin: 'Shuyin',
};
const abilityTiles = [...ownerSets].map(([k, ids]) => {
  if (!OWNER[k]) throw new Error('no owner label for ' + k);
  return `<span class="own">${OWNER[k]}</span>` + ids.map((id) => `<span class="chip" style="--c:var(--sys-attacks)"><b>${esc(ab(id).name)}</b></span>`).join('');
}).join('');
const aiTiles = aiScripts.map((k) => `<span class="chip" style="--c:var(--sys-ai)"><b>${AI[k][0]}</b><i>${AI[k][1]}</i></span>`).join('');
const statusTiles = [...inflicted].map(([s, from]) => `<span class="chip" style="--c:var(--sys-status)"><b>${STATUS[s]}</b><i>${esc(from[0])}</i></span>`).join('');
// a status every part blocks is a closed door; one that some part lets through is the way in, so it is marked.
// DISPUTED: the shipped Bulwark record blocks these four (run it: 255 each) while research §3.3, and that file's own
// comment, say they land. Hard rule 6: a count the sources disagree on is not printed. Flagged for a separate fix.
const DISPUTED = new Set(['str-up', 'str-down', 'mag-up', 'mag-down']);
const immuneTiles = immunityKeys.slice().sort((a, b) => immunityCover[b] - immunityCover[a]).map((k) => {
  const open = !DISPUTED.has(k) && immunityCover[k] < COUNTS.parts;
  return `<span class="chip${open ? ' gap' : ''}" style="--c:var(--sys-immune)"><b>${STATUS[k]}</b><i>${DISPUTED.has(k) ? '?' : immunityCover[k]}/${COUNTS.parts}</i></span>`;
}).join('');
const rewardTiles = rewardItems.map((k) => `<span class="chip" style="--c:var(--sys-rewards)"><b>${ITEM[k]}</b></span>`).join('');
const affinityTiles = affinities.map((a) => { const [el, v] = a.split(':'); return `<span class="chip" style="--c:var(--sys-element)"><b>${el[0].toUpperCase() + el.slice(1)}</b><i>${v}, on all ${COUNTS.parts}</i></span>`; }).join('');
const grp = (k, name, n, plain, tiles) => `<div class="g"><div class="gh"><span class="dot" style="background:var(--sys-${k})"></span><span class="caps">${name}</span><span class="num">${n}</span><span class="pl">${plain}</span></div><div class="tiles">${tiles}</div></div>`;
const hov = byId[HOVER];

const a3 = page('Pyrefly Atlas: Vegnagun, the inventory of every piece', `
<div class="inv" data-audit>
  ${grp('parts', 'Parts and forms', COUNTS.parts, 'the five main parts by HP, then their seven supports &middot; a support has no painting yet, so its tile zooms into the parent painting', partTiles)}
  ${grp('attacks', 'Attacks and abilities', COUNTS.attacks, 'in battle order, under the part that owns them', abilityTiles)}
  ${grp('ai', 'Turn pattern (AI)', COUNTS.ai, 'one script per kind of part', aiTiles)}
  ${grp('status', 'Statuses it inflicts', COUNTS.statuses, 'each with the move that does it', statusTiles)}
  <div style="display:flex;gap:22px">${grp('rewards', 'Rewards', COUNTS.rewards, 'dropped or stolen', rewardTiles)}${grp('element', 'Elemental affinities', COUNTS.affinities, '', affinityTiles)}</div>
  ${grp('immune', 'Immunities', COUNTS.immunities, 'how many of the ' + COUNTS.parts + ' parts shrug it off &middot; tinted = not every part blocks it &middot; ? = our data and the research disagree, flagged', immuneTiles)}
</div>
<div class="tip" id="tip" style="left:1252px;top:124px"><div class="n">Right Bulwark</div><div class="f">${fmt(hov.stats.hp)} HP &middot; Level ${hov.level} &middot; ${hov.abilityIds.length} moves. ${esc(hov.scanText.split('.')[0])}.</div><div class="c">&sect;3.3 &middot; verified: 2 sources &middot; picture: a zoom into the Body painting</div></div>
${chrome({ pct: 100, state: `Inventory &middot; ${TOTAL} pieces`, hint: ['Drag to pan', 'Scroll to zoom', 'Click a piece to inspect'], view: 'front', labels: true })}
`);

await writeFile(resolve(here, 'a1-assembled.html'), a1);
await writeFile(resolve(here, 'a2-exploded-selected.html'), a2);
await writeFile(resolve(here, 'a3-inventory.html'), a3);
console.log('[build-a] wrote a1, a2, a3');
