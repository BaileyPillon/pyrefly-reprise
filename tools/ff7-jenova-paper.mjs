// Row 44 (Jenova LIFE, FF7 only): paper arithmetic, NOT the engine. Standalone: it imports nothing from any repo tree.
// Formulas are research/ff7-battle-core.md (core) section numbers; stats are Lifestream Encore (LE) docs/research/party.md section 7 (Fergusson PM via LE)
// and enemies.md section 4 (Fergusson EM, Gamer Corner). Every number printed is derived here; nothing is tuned toward a result.
// Run: node tools/ff7-jenova-paper.mjs > research/ff7-jenova-life-paper.txt

const T = Math.trunc;

// ---- core formulas (core section 4) ----
const physBase = (att, lvl) => att + T((att + lvl) / 32) * T((att * lvl) / 32);
const magBase = (mat, lvl) => 6 * (mat + lvl);
const dmg = (power, def, base) => T((power * (512 - def) * base) / (16 * 512));
const varRange = (d) => [T((d * 3841) / 4096), d]; // Random Variation: [x*(3841+Rnd(0..255))/4096]
const split23 = (d) => T((d * 2) / 3);
const pct = (base, p) => base + T((base * p) / 100);

// ---- Jenova LIFE (EM 4.1, GC) ----
const J = { lvl: 50, hp: 10000, mp: 300, att: 128, mat: 40, def: 110, mdf: 290, dfPct: 10, dex: 140, lck: 40 };
const JM = magBase(J.mat, J.lvl); // 540
const ABIL = { blueLight: { pw: 14, mp: 8, all: false }, blueFlame: { pw: 16, mp: 12, all: false }, aqualung: { pw: 52, mp: 34, all: true } };

// ---- party at Lv 38 (party.md section 7 effective stats; HP/MP recomputed with the engine's rule: summed Materia % applied once) ----
const party = {
  cloud:  { lvl: 38, att: 107, atPct: 100, mat: 78, mdf: 59, def: 113, dex: 36, baseDex: 36, maxHp: pct(2298, -2 - 2 - 5 - 5 + 20), maxMp: pct(316, 2 + 2 + 5 + 5), lnum: [140, 324, 435, 506], limitLv: 2, row: 'front' },
  tifa:   { lvl: 38, att: 116, atPct: 112, mat: 66, mdf: 54, def: 98, dex: 43, baseDex: 43, maxHp: pct(2072, -2 - 2 - 2), maxMp: pct(291, 2 + 2 + 2), lnum: [120, 334, 509, 566], limitLv: 3, row: 'front' },
  barret: { lvl: 38, att: 94, atPct: 100, mat: 64, mdf: 62, def: 121, dex: 33, baseDex: 33, maxHp: pct(2573, -2 - 2 - 2 - 2), maxMp: pct(274, 2 + 2 + 2 + 2), lnum: [129, 240, 374, 450], limitLv: 3, row: 'back' },
};
const names = Object.keys(party);

const out = [];
const log = (...a) => out.push(a.join(' '));

log('# ff7-jenova-paper.mjs output (paper arithmetic; no engine run)');
log('\n## A. Pools after Materia (engine rule: sum the % once, truncate toward zero)');
for (const n of names) log(`${n}: maxHp ${party[n].maxHp}, maxMp ${party[n].maxMp}`);

log('\n## B. Jenova LIFE damage on each member (core 4.2; MAt% 100 hits: 100 + 50 - 19 - 1 = 130 >= 100 so it never misses unless armour MD% exists)');
log(`M = 6*(${J.mat}+${J.lvl}) = ${JM}`);
const tbl = [];
for (const n of names) {
  const p = party[n];
  for (const [an, a] of Object.entries(ABIL)) {
    let d = dmg(a.pw, p.mdf, JM);
    if (a.all) d = split23(d);
    const [lo, hi] = varRange(d);
    const [mlo, mhi] = varRange(T(d / 2)); // MBarrier halves after the split, before variation (core 4.5 step 9 then 12)
    tbl.push(`${n.padEnd(7)} ${an.padEnd(10)} MP ${String(a.mp).padStart(2)}  ${lo}-${hi}   with MBarrier ${mlo}-${mhi}   (${(hi / p.maxHp * 100).toFixed(1)}% of max HP)`);
  }
}
log(tbl.join('\n'));
log(`Aqualung on all three: ${names.map((n) => varRange(split23(dmg(52, party[n].mdf, JM)))[1]).reduce((a, b) => a + b, 0)} at the top of the range, against ${names.reduce((s, n) => s + party[n].maxHp, 0)} party max HP`);
// LE formulas.md 5.7 says Aqualung is "a two-cast kill" on Cloud; check:
{
  const [lo, hi] = varRange(split23(dmg(52, party.cloud.mdf, JM)));
  log(`Check of formulas.md 5.7 ("two-cast kill" on Cloud): one Aqualung ${lo}-${hi}; two = ${2 * lo}-${2 * hi}; Cloud max HP ${party.cloud.maxHp}. ${2 * hi < party.cloud.maxHp ? 'Two casts do NOT kill a full-HP Cloud; three do (' + 3 * lo + '-' + 3 * hi + ').' : 'two casts can kill'}`);
}

log('\n## C. Party actions on Jenova LIFE');
const rowC = [];
for (const n of names) {
  const p = party[n];
  const B = physBase(p.att, p.lvl);
  const d = dmg(16, J.def, B);
  rowC.push(`${n.padEnd(7)} Attack: Base ${B}, ${varRange(d)[0]}-${varRange(d)[1]}, critical ${2 * varRange(d)[0]}-${2 * varRange(d)[1]}${p.row === 'back' ? ' (Barret back row: Heavy Vulcan is Long Range, so no halving)' : ''}`);
}
log(rowC.join('\n'));
{
  const c = party.cloud, cB = physBase(c.att, c.lvl);
  const MB = magBase(c.mat, c.lvl);
  const spell = (name, pw, mp, weak) => {
    let d = dmg(pw, J.mdf, MB);
    const [lo, hi] = varRange(d);
    return `${name} (power ${pw}, ${mp} MP): ${weak ? lo * 2 : lo}-${weak ? hi * 2 : hi}${weak ? ' (Earth weak, x2 after variation)' : ''}`;
  };
  log(`Cloud magic base 6*(${c.mat}+${c.lvl}) = ${MB}`);
  log(spell('Bolt2', 20, 22, false));
  log(spell('Bolt3', 64, 52, false));
  log(spell('Quake2', 24, 28, true));
  log(spell('Quake3', 70, 68, true));
  log('Limit (Cloud, Limit Level 2), Base ' + cB + ':');
  for (const [n, pw] of [['Blade Beam 3 1/2x', 56], ['Climhazzard 4 3/8x', 70]]) { const d = dmg(pw, J.def, cB); log(`  ${n}: ${varRange(d)[0]}-${varRange(d)[1]}`); }
  const t = party.tifa, tB = physBase(t.att, t.lvl);
  log(`Limit (Tifa, Limit Level 3), Base ${tB}; the chain Beat Rush, Somersault, Waterkick, Meteodrive, Dolphin Blow (every reel "Hit"):`);
  let lo = 0, hi = 0;
  for (const [n, pw] of [['Beat Rush 1 1/4x', 20], ['Somersault 1 3/8x', 22], ['Waterkick 1 1/2x', 24], ['Meteodrive 1 5/8x', 26], ['Dolphin Blow 1 3/4x', 28]]) { const d = dmg(pw, J.def, tB); const v = varRange(d); lo += v[0]; hi += v[1]; log(`  ${n}: ${v[0]}-${v[1]}`); }
  log(`  chain total ${lo}-${hi}`);
  const b = party.barret, bB = physBase(b.att, b.lvl);
  log(`Limit (Barret, Limit Level 3), Base ${bB}:`);
  { const d = dmg(35, J.def, bB); const v = varRange(d); log(`  Satellite Beam 2 3/16x, auto-critical: ${2 * v[0]}-${2 * v[1]} (all enemies, one here)`); }
  { const d = dmg(8, J.def, bB); const v = varRange(d); log(`  Angermax 18 x 1/2x: ${18 * v[0]}-${18 * v[1]} if all 18 hit (each ${v[0]}-${v[1]})`); }
  // Reflect bounce: a reflectable spell cast at Jenova while she has Reflect comes back at the CASTER and is recomputed against the caster
  log('A reflected Bolt2 from Cloud lands on Cloud: ' + varRange(dmg(20, c.mdf, MB)).join('-') + ' (Cloud max HP ' + c.maxHp + '); a reflected Quake2 (Earth, Cloud not weak): ' + varRange(dmg(24, c.mdf, MB)).join('-'));
}

log('\n## D. The clock (core 2.3), Battle Speed 128: V-Timer increase 182 per tick');
const normalSpeed = Math.ceil(names.reduce((s, n) => s + party[n].baseDex, 0) / names.length) + 50;
log(`NormalSpeed = RU(avg base Dex ${(names.reduce((s, n) => s + party[n].baseDex, 0) / names.length).toFixed(2)}) + 50 = ${normalSpeed}`);
const inc = {};
for (const n of names) { inc[n] = T(((party[n].dex + 50) * 182) / normalSpeed); log(`${n}: +${inc[n]}/tick -> full in ${Math.ceil(65535 / inc[n])} ticks`); }
const jinc = T((J.dex * 182) / normalSpeed);
log(`Jenova: +${jinc}/tick -> full in ${Math.ceil(65535 / jinc)} ticks (no +50 for enemies)`);
const partyTicks = names.map((n) => 65535 / inc[n]);
log(`Jenova acts ${(partyTicks.reduce((a, b) => a + b, 0) / names.length / (65535 / jinc)).toFixed(2)}x as often as the average member; the three members together act ${(3 / (partyTicks.reduce((a, b) => a + b, 0) / names.length) * (65535 / jinc)).toFixed(2)} times per Jenova turn`);

// ---- Monte Carlo (paper): a seeded generator, three policies ----
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function fight(seed, policy) {
  const R = rng(seed);
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const P = {}; for (const n of names) { const p = party[n]; P[n] = { ...p, hp: p.maxHp, mp: p.maxMp, gauge: 0, timer: 0, alive: true, mbarrier: false }; }
  const jen = { hp: J.hp, mp: J.mp, timer: 0, reflect: false, count: ri(0, 3), spcl: 5 };
  let pd = 10, hiPot = 15;
  // battle start (Normal, core 2.4)
  const all = [...names, 'jen'];
  const t0 = {}; for (const k of all) t0[k] = ri(0, 32767);
  const top = Math.max(...all.map((k) => t0[k])); const shift = 57344 - top;
  for (const k of names) P[k].timer = t0[k] + shift; jen.timer = t0[all[all.length - 1]] + shift;
  let ticks = 0, jenTurns = 0, aq = 0, partyActions = 0, bounces = 0, limits = 0;
  const livingP = () => names.filter((n) => P[n].alive);
  const hurt = (n, d, isMagic) => { const p = P[n]; if (isMagic && p.mbarrier) d = T(d / 2); p.hp -= d; if (p.hp <= 0) { p.hp = 0; p.alive = false; p.gauge = 0; } else {
      const units = T((T((300 * d) / p.maxHp) * 256) / p.lnum[p.limitLv - 1]); p.gauge = Math.min(255, p.gauge + units); } };
  const jenAct = () => {
    jenTurns++;
    let ab; const c = jen.count;
    const pick = () => { const l = livingP(); return l[ri(0, l.length - 1)]; };
    const cast = (key, tgt) => { const a = ABIL[key]; if (jen.mp < a.mp) return; jen.mp -= a.mp; const base = a.all ? split23(dmg(a.pw, 0, 0)) : 0; void base;
      const targets = a.all ? livingP() : [tgt]; if (a.all) aq++;
      for (const t of targets) { let d = dmg(a.pw, P[t].mdf, JM); if (a.all && targets.length > 1) d = split23(d); d = T((d * (3841 + ri(0, 255))) / 4096); hurt(t, d, true); } };
    if (c <= 1) { cast('blueLight', pick()); if (ri(1, jen.spcl) === 1 && livingP().length) cast('blueLight', pick()); jen.count++; }
    else if (c === 2) { cast('blueFlame', pick()); jen.count = ri(1, jen.spcl) === 1 ? 3 : 0; }
    else { cast('aqualung'); jen.count = 0; }
  };
  const afterHit = (magical) => { const r = jen.hp / J.hp; jen.spcl = r <= 0.25 ? 2 : r <= 0.5 ? 3 : r <= 0.75 ? 4 : 5; if (magical && !jen.reflect && jen.mp >= 30) { jen.mp -= 30; jen.reflect = true; } };
  const partyAct = (n) => {
    const p = P[n]; partyActions++;
    const healAt = policy === 'mixed' ? 0.25 : 0.45;
    const wounded = livingP().filter((k) => P[k].hp < P[k].maxHp * healAt).sort((a, b) => P[a].hp - P[b].hp)[0];
    const dead = names.find((k) => !P[k].alive);
    if (policy !== 'naive') {
      if (dead && pd > 0) { pd--; P[dead].alive = true; P[dead].hp = T(P[dead].maxHp / 4); P[dead].timer = 0; return; }
      if (wounded && (n === 'cloud' || n === 'barret') && p.mp >= 24) { p.mp -= 24; const d = T((T(((6 * (p.mat + p.lvl) + 770) * (3841 + ri(0, 255))) / 4096))); P[wounded].hp = Math.min(P[wounded].maxHp, P[wounded].hp + d); return; }
      if (wounded && hiPot > 0) { hiPot--; P[wounded].hp = Math.min(P[wounded].maxHp, P[wounded].hp + 500); return; }
    }
    // Limit when full
    if (p.gauge >= 255) {
      p.gauge = 0; limits++;
      const B = physBase(p.att, p.lvl);
      let d = 0;
      if (n === 'cloud') d = T((dmg(70, J.def, B) * (3841 + ri(0, 255))) / 4096);
      if (n === 'barret') d = 2 * T((dmg(35, J.def, B) * (3841 + ri(0, 255))) / 4096);
      if (n === 'tifa') for (const pw of [20, 22, 24, 26, 28]) d += T((dmg(pw, J.def, B) * (3841 + ri(0, 255))) / 4096);
      jen.hp -= d; afterHit(false); return;
    }
    if (policy === 'mixed') {
      // a distracted player: half the turns Attack, 30% an element spell at Jenova (Bolt2 / Ice2 / Fire2, 22 MP) whatever her Reflect says, 20% Defend (the turn is spent)
      const r = R();
      if (r >= 0.8) return;
      if (r >= 0.5 && p.mp >= 22) {
        p.mp -= 22; const MB = magBase(p.mat, p.lvl);
        if (jen.reflect) { bounces++; const d = T((dmg(20, p.mdf, MB) * (3841 + ri(0, 255))) / 4096); hurt(n, d, true); }
        else { const d = T((dmg(20, J.mdf, MB) * (3841 + ri(0, 255))) / 4096); jen.hp -= d; afterHit(true); }
        return;
      }
    }
    if (policy === 'naive') {
      // casts its element every turn, as a player who ignores the Reflect would (Bolt2 / Ice2 / Fire2: power 20, 22 MP)
      if (p.mp >= 22) {
        p.mp -= 22; const MB = magBase(p.mat, p.lvl);
        if (jen.reflect) { bounces++; const d = T((dmg(20, p.mdf, MB) * (3841 + ri(0, 255))) / 4096); hurt(n, d, true); }
        else { const d = T((dmg(20, J.mdf, MB) * (3841 + ri(0, 255))) / 4096); jen.hp -= d; afterHit(true); }
        return;
      }
    }
    if (policy === 'quake' && n === 'cloud' && !jen.reflect && p.mp >= 28) {
      p.mp -= 28; const MB = magBase(p.mat, p.lvl); const d = 2 * T((dmg(24, J.mdf, MB) * (3841 + ri(0, 255))) / 4096); jen.hp -= d; afterHit(true); return;
    }
    const B = physBase(p.att, p.lvl);
    const crit = R() < 0.02 ? 2 : 1; const hit = R() * 100 < Math.min(100, T(p.dex / 4) + p.atPct + T(p.dex / 4) - 10); // Hit% = [Dex/4] + At% + Df% - TargetDf% (approx.)
    if (!hit) { afterHit(false); return; }
    const d = crit * T((dmg(16, J.def, B) * (3841 + ri(0, 255))) / 4096); jen.hp -= d; afterHit(false);
  };
  const TICKS_MAX = 30 * 60 * 20; // 20 minutes at 30 ticks/s (estimate)
  while (ticks < TICKS_MAX) {
    ticks++;
    jen.timer += jinc;
    for (const n of names) if (P[n].alive) P[n].timer += inc[n];
    // order within a tick: party first (core 2.6 estimate), then Jenova
    for (const n of names) if (P[n].alive && P[n].timer >= 65535) { P[n].timer = 0; partyAct(n); if (jen.hp <= 0) return { win: true, ticks, jenTurns, aq, partyActions, bounces, limits, alive: livingP().length }; if (!livingP().length) return { win: false, ticks, jenTurns, aq, partyActions, bounces, limits, alive: 0 }; }
    if (jen.timer >= 65535) { jen.timer = 0; jenAct(); if (!livingP().length) return { win: false, ticks, jenTurns, aq, partyActions, bounces, limits, alive: 0 }; }
  }
  return { win: false, timeout: true, ticks, jenTurns, aq, partyActions, bounces, limits, alive: livingP().length };
}

log('\n## E. Paper Monte Carlo (NOT the bench: no engine, no Active/Recommended/Wait menus, zero player decision time, the heal rules below)');
log('Policies: physical = Attack/Limit, Cure2 (Cloud, Barret, 24 MP) or Hi-Potion below 45% HP, Phoenix Down on a KO (10 PD, 15 Hi-Potion, both [estimate] stock);');
log('          quake = the same but Cloud opens with Quake2 until Reflect is up (then physical); mixed = a distracted player: per turn 50% Attack, 30% a 22 MP element spell whatever her Reflect says, 20% Defend, heals only below 25% HP;');
log('          naive = every member casts a 22 MP element spell every turn into the Reflect, no heals. Limits are used when full in every policy.');
for (const policy of ['physical', 'quake', 'mixed', 'naive']) {
  const N = 2000; let wins = 0, ticks = 0, jt = 0, aqs = 0, pa = 0, b = 0, lm = 0, surv = 0, tmo = 0;
  for (let s = 1; s <= N; s++) { const r = fight(s, policy); if (r.win) { wins++; ticks += r.ticks; jt += r.jenTurns; aqs += r.aq; pa += r.partyActions; b += r.bounces; lm += r.limits; surv += r.alive; } if (r.timeout) tmo++; }
  log(`${policy.padEnd(9)} wins ${wins}/${N} (${(wins / N * 100).toFixed(1)}%), timeouts ${tmo}` + (wins ? `; per win: ${(ticks / wins / 30).toFixed(0)} s at 30 ticks/s, ${(jt / wins).toFixed(1)} Jenova turns, ${(aqs / wins).toFixed(2)} Aqualungs, ${(pa / wins).toFixed(1)} party actions, ${(lm / wins).toFixed(2)} Limits, ${(b / wins).toFixed(1)} reflected casts, ${(surv / wins).toFixed(2)} members standing` : ''));
}

log('\n## F. Door word check for `bluelight` (the rule of tests/unit/chapter-doors.test.ts: no begin/end/contain, no suffix-prefix overlap), against the 15 table words, `pilgrim`, `gear` and the other proposed words of PLAN 8');
const existing = ['limit', 'leblanc', 'experiment', 'mushroom', 'fayth', 'daigoro', 'valefor', 'gagazet', 'angra', 'yojimbo', 'summon', 'keeper', 'infinito', 'yrp', 'waker'];
const planned = ['gear', 'darkaeon', 'judgment', 'geosgaeno', 'drillshot', 'duelist', 'beast', 'wraith', 'spherimorph', 'youth', 'weapon', 'sidequest', 'ifrit', 'lionheart', 'shinryu', 'wendigo', 'blitz', 'dragon', 'debut', 'legion', 'gauntlet', 'jumbo', 'safer', 'sinspawn', 'extractor', 'exhibition', 'sector', 'junon', 'bizarro', 'lastmission', 'ghost'];
{
  const w = 'bluelight'; const fails = [];
  for (const o of [...existing, 'pilgrim', ...planned]) for (const [a, b] of [[w, o], [o, w]]) {
    if (a.startsWith(b) || a.endsWith(b) || a.includes(b)) fails.push(`${a} vs ${b}: begins/ends/contains`);
    for (let k = 1; k <= Math.min(a.length, b.length); k++) if (a.slice(-k) === b.slice(0, k)) fails.push(`${a} vs ${b}: last ${k} start ${b}`);
  }
  log(fails.length ? 'FAILS: ' + [...new Set(fails)].join('; ') : `no failures against ${existing.length + 1 + planned.length} words`);
}

console.log(out.join('\n'));
