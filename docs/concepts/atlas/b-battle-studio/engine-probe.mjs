// Pyrefly Studio (atlas option B): every computed number on the three frames comes from here.
// It runs the project's REAL FFX engine (src/battle/ffx/**, pure TypeScript, no DOM) under node.
//
//   node --experimental-transform-types --no-warnings docs/concepts/atlas/b-battle-studio/engine-probe.mjs
//
// Read-only: it builds chapter 1 in memory exactly as the game does (setupForChapter: condition 'normal'),
// plays the real engine up to Tidus's first turn, previews, then submits Attack. Output: engine-probe.json.
// (--experimental-transform-types is needed only because one engine class uses a TS parameter property.)
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const R = '../../../../src/';
const ffx = await import(R + 'battle/ffx/index.ts');
const data = await import(R + 'data/ffx/index.ts');
const { gagazetBuild } = await import(R + 'data/ffx/builds/gagazet.ts');
const est = await import(R + 'battle/ffx/estimate.ts');
const sim = await import(R + 'battle/ffx/simulate.ts');

function registry() {
  const reg = new ffx.FFXContentRegistry();
  reg.addAbilities(data.ALL_ABILITIES);
  reg.addItems(Object.values(data.ITEMS));
  return reg;
}

/** Start chapter 1 and play the real engine until a party member has to choose. */
function openTurn(seed, mutateParty) {
  const party = structuredClone(gagazetBuild);
  if (mutateParty) mutateParty(party);
  const reg = registry();
  const engine = ffx.createFFXEngine({ content: reg, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party, enemies: data.ENEMY_GROUPS_BY_ID['seymour-flux'], triggers: [], seed, condition: 'normal', canEscape: false });
  const before = [];
  let d = engine.nextDecision();
  let guard = 0;
  while (d.kind === 'resolved' && guard++ < 20) { before.push(...d.events); d = engine.nextDecision(); }
  return { engine, reg, decision: d, before };
}
const nameOf = (engine, id) => engine.state().combatants[id]?.name ?? id;
const order = (engine, n, cmd) => engine.predictTurnOrder(n, cmd).map((r) => ({ who: nameOf(engine, r.actorId), id: r.actorId, tick: r.tickValue, party: r.isParty }));
const flat = (rows) => rows.map((r) => `${r.who}@${r.tick}`).join('  ');
const brief = (engine, events) => events
  .filter((e) => ['action-start', 'damage', 'heal', 'miss', 'status-add', 'overdrive-gauge', 'charge', 'counter', 'message'].includes(e.type))
  .map((e) => {
    const o = { type: e.type };
    for (const k of ['actorId', 'abilityId', 'abilityName', 'targetId', 'amount', 'crit', 'status', 'value', 'gauge', 'delta', 'name', 'stage', 'turnsLeft', 'text', 'combatantId', 'ready']) if (e[k] !== undefined) o[k] = e[k];
    return o;
  });

const out = { how: 'real engine under node: createFFXEngine + nextDecision/submit, chapter 1 data, condition normal, triggers []', seedsTried: [] };

// Pick the first seed (1..40) whose first player turn is Tidus. Nothing else is selected for.
let SEED = null;
for (let s = 1; s <= 40; s++) {
  const t = openTurn(s);
  out.seedsTried.push({ seed: s, first: t.decision.actorId });
  if (t.decision.kind === 'player-input' && t.decision.actorId === 'tidus') { SEED = s; break; }
}
out.seed = SEED;

{
  const { engine, reg, decision, before } = openTurn(SEED);
  const st = engine.state();
  out.actor = decision.actorId;
  out.beforeTidus = brief(engine, before);
  out.combatants = Object.fromEntries(Object.values(st.combatants).filter((c) => [...st.activeIds, ...st.enemyIds].includes(c.id)).map((c) => [c.id, {
    name: c.name, hp: c.hp, maxHp: c.stats.maxHp, mp: c.mp, str: c.stats.str, def: c.stats.def, mag: c.stats.mag, mdef: c.stats.mdef, agi: c.stats.agi,
    luck: c.stats.luck, acc: c.stats.acc, eva: c.stats.eva, baseTicks: ffx.baseCtb(c.stats.agi), statuses: Object.keys(c.statuses ?? {}),
    overdrive: c.overdrive ? { gauge: c.overdrive.gauge, mode: c.overdrive.mode } : null,
  }]));
  out.reserve = st.reserveIds;
  out.commandCount = decision.commands.length;
  out.commandsByCategory = decision.commands.reduce((m, r) => ((m[r.category] = (m[r.category] ?? 0) + 1), m), {});
  out.commands = decision.commands.filter((r) => r.category !== 'item').map((r) => ({ label: r.label, category: r.category, mp: r.mpCost, rank: r.rank, enabled: r.enabled, why: r.disabledReason }));
  out.turnOrder = order(engine, 10);
  out.turnOrderByCommand = {};
  const cmds = {
    'Cheer (rank 2)': { kind: 'ability', id: 'cheer', targets: [] },
    'Attack (rank 3)': { kind: 'attack', targets: ['seymour-flux'] },
    'Haste (rank 4)': { kind: 'ability', id: 'haste', targets: ['tidus'] },
    'Hastega (rank 6)': { kind: 'ability', id: 'hastega', targets: [] },
    'Delay Buster (rank 8)': { kind: 'ability', id: 'delay-buster', targets: ['seymour-flux'] },
  };
  for (const [label, cmd] of Object.entries(cmds)) out.turnOrderByCommand[label] = flat(order(engine, 8, cmd));

  const attackDef = reg.ability('attack');
  out.attackRecord = { name: attackDef.name, formula: attackDef.formula, power: attackDef.power, rank: attackDef.rank, damageType: attackDef.damageType, flags: attackDef.flags };
  out.attack = {};
  for (const tgt of ['seymour-flux', 'mortiorchis']) {
    const cmd = { kind: 'attack', targets: [tgt] };
    const e = est.estimateCommand(st, 'tidus', cmd, attackDef, reg);
    const t = e.perTarget[0];
    out.attack[tgt] = { mid: t.amount, min: t.min, max: t.max, affinity: t.affinity, hitPercent: sim.previewHitChance(st, 'tidus', tgt, attackDef), critPercent: sim.previewCritChance(st, 'tidus', tgt, attackDef) };
  }
  out.estimatedDamageTidus = ffx.estimatedDamage(st.combatants['tidus']);
  const ni = engine.intent();
  out.bossNextBefore = ni && { enemy: ni.enemyName, move: ni.moveName, turnsAway: ni.turnsAway, confidence: ni.confidence, description: ni.description, statusText: ni.statusText, cite: ni.cite,
    perTarget: ni.estimate?.perTarget?.map((t) => ({ name: t.targetName, mid: t.amount, min: t.min, max: t.max, statuses: t.statuses })), counters: ni.counters };

  // Now really take the turn: Tidus, Attack, Seymour Flux.
  const gaugeBefore = st.combatants['tidus'].overdrive.gauge;
  const hpBefore = st.combatants['seymour-flux'].hp;
  const events = engine.submit({ kind: 'attack', targets: ['seymour-flux'] });
  const st2 = engine.state();
  out.submitted = {
    events: brief(engine, events),
    seymourHp: { before: hpBefore, after: st2.combatants['seymour-flux'].hp },
    tidusGauge: { before: gaugeBefore, after: st2.combatants['tidus'].overdrive.gauge, mode: st2.combatants['tidus'].overdrive.mode },
    turnOrderAfter: flat(order(engine, 8)),
  };
  const ni2 = engine.intent();
  out.bossNextAfter = ni2 && { enemy: ni2.enemyName, move: ni2.moveName, turnsAway: ni2.turnsAway, confidence: ni2.confidence, statusText: ni2.statusText, cite: ni2.cite,
    perTarget: ni2.estimate?.perTarget?.map((t) => ({ name: t.targetName, mid: t.amount, min: t.min, max: t.max, statuses: t.statuses })) };
}

// The Agility slider on the "Turn order" card: same seed, same battle, only Tidus's Agility changes.
out.agilitySweep = {};
for (const agi of [10, 20, 30, 35, 44, 62]) {
  const { engine, decision } = openTurn(SEED, (p) => { p.members.find((m) => m.id === 'tidus').stats.agi = agi; });
  const t = engine.state().combatants['tidus'];
  out.agilitySweep[agi] = { baseTicks: ffx.baseCtb(t.stats.agi), rank3Recovery: ffx.recoveryTicks(t, 3), firstToChoose: decision.actorId, order: flat(order(engine, 8)) };
}

writeFileSync(join(here, 'engine-probe.json'), JSON.stringify(out, null, 1));
const { combatants, seedsTried, ...rest } = out;
console.log(JSON.stringify(rest, null, 1));
