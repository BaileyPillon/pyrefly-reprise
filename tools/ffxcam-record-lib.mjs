/**
 * **The shot recorder's library** (FFX only; a dev tool that reads Bailey's own copy of the camera programs, so it runs only on his PC): it replays the camera-program VM (`src/engine/ffxcam/`)
 * headless over every beat the Evrae fight can produce and writes down the camera's pose at every logic step. `tools/ffxcam-record.mjs` is the command line; `tools/ffxcam-table-build.mjs` turns
 * the recording into the website's keyframe table (`src/data/ffx/camera/evrae-shots.ts`).
 *
 * What it replays is the live chapter's own director (`FfxCameraDirector`), with the live chapter's host values: the game's camHeight and camWidth for every character (`extents.json`), the FAR fit,
 * the roster, the party on FFX's three slots and Evrae on his NEAR or FAR spot, heading as the scene stands them. It records the **raw** pose (no safety net, no variant), because the table is
 * built from what the programs do.
 *
 * - **Scenarios.** For every row of the action table (party abilities by the character that has them, items, the plain Attack of each side, Evrae's and Cid's moves): the beat at the action's opening
 *   (command accepted plus the cast's start) and at its launch (the effect fires), for each slot the actor can stand in, each kind of target the ability can have (from `AbilityDef.targeting`), and
 *   both ranges. Then Enter / Select / Normal at each range, Cid's Pull back and Move in, the victory and the defeat.
 * - **Branches.** A shot the programs pick at random (`camRand`, `GetRandomValue`) is run under `samples` seeds of the camera's own presentation dice; each distinct outcome is kept once with how
 *   many seeds drew it. A scenario whose first run drew no dice has one outcome.
 * - **Prior state.** A launch is recorded 40 steps into its action's opening shot. {@link priorDependence} replays a beat from two different cameras and says how far its first poses differ.
 *
 * Game case: FFX only.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = pathToFileURL(join(import.meta.dirname, '..') + '/').href;
const load = (path) => import(ROOT + path);

export const LOCAL_ROOT = process.env.PYREFLY_FFX_LOCAL?.trim() || 'D:/Tools/ffx-parity/assets/runtime';
export const LANE_INDEX = 'D:/Tools/ffx-parity/camera/programs/evrae/INDEX.json';

/** Steps a recording may run before it is cut off, by kind. */
export const CAPS = { action: 800, scene: 400, victory: 150, defeat: 520, view: 20 };

const ACTIVE = ['tidus', 'wakka', 'rikku'];

/** The three on the deck in slot order with `actor` standing in `slot` (a displaced active takes the actor's place, so no one stands twice). */
export function lineupFor(actor, slot) {
  const base = [...ACTIVE];
  if (slot === 'm') return base;
  const i = base.indexOf(actor);
  if (i >= 0 && i !== slot) [base[i], base[slot]] = [base[slot], base[i]];
  else base[slot] = actor;
  return base;
}
const SIDE = { tidus: 'party', wakka: 'party', rikku: 'party', lulu: 'party', auron: 'party', kimahri: 'party', evrae: 'enemy', cid: 'enemy' };

const rd = (path) => JSON.parse(readFileSync(path, 'utf8'));

/** The modules the recorder needs, imported once. */
export async function modules() {
  const [book, director, formation, farFitMod, staging, world, roster, vmMod, solverMod, geometry, data] = await Promise.all([
    load('src/engine/ffxcam/load.ts'),
    load('src/engine/ffxcam/director.ts'),
    load('src/engine/ffxcam/formation.ts'),
    load('src/engine/ffxcam/farFit.ts'),
    load('src/engine/ffx3d/ffxStaging.ts'),
    load('src/engine/ffx3d/ffxWorld.ts'),
    load('src/engine/ffxcam/roster.ts'),
    load('src/engine/ffxcam/vm.ts'),
    load('src/engine/ffxcam/solver.ts'),
    load('src/engine/ffxcam/geometry.ts'),
    load('src/data/ffx/index.ts'),
  ]);
  return { ...book, ...director, ...formation, ...farFitMod, ...staging, ...world, ...roster, ...vmMod, ...solverMod, ...geometry, data };
}

/** Bailey's camera folder, validated: `{ programs, lane }`. Throws with the first problem. */
export async function loadLocal(m, root = LOCAL_ROOT) {
  const dir = `${root}/camera/evrae`;
  const rawIndex = rd(`${dir}/index.json`);
  const files = new Map(rawIndex.programs.map((p) => [p, rd(`${dir}/${p}`)]));
  const ext = await load('src/engine/ffxcam/extents.ts');
  const parsed = ext.parseExtents(rd(`${dir}/extents.json`));
  if (!('extents' in parsed)) throw new Error(`extents.json: ${parsed.problem}`);
  const built = m.buildFfxCameraPrograms(rawIndex, files, parsed.extents);
  if (!('programs' in built)) throw new Error(`camera programs: ${built.problem}`);
  return { programs: built.programs, lane: rd(LANE_INDEX) };
}

// ------------------------------------------------------------------------------------------------ the rig

const ctxBase = { camera: {}, speed: 'normal', skipping: false, ms: (x) => x };
const subj = (id) => ({ id, side: SIDE[id] });

/** The solver's blend shapes seen while recording (`a,b,c,d` of every trapezoid), for the table builder to fit against. */
export const seenShapes = new Set();
let patched = false;
let draws = 0;
function patch(m) {
  if (patched) return;
  patched = true;
  const arm = m.CameraSolver.prototype.armMove;
  m.CameraSolver.prototype.armMove = function (p, shape) {
    if (shape.kind === 2) seenShapes.add(`${shape.a | 0},${shape.b | 0},${shape.c | 0},${shape.d | 0}`);
    return arm.call(this, p, shape);
  };
  const rand = m.FormationHost.prototype.random;
  m.FormationHost.prototype.random = function (stream) {
    draws++;
    return rand.call(this, stream);
  };
}

/** The party standing on FFX's slots: `lineup` is the three ids in slot order. */
export function makeRig(m, { programs, range, lineup = ACTIVE, seed = 1 }) {
  patch(m);
  const warnings = [];
  const rig = { started: 0 };
  const dir = new m.FfxCameraDirector({
    programs,
    sink: { apply() {} },
    onStart: () => void rig.started++,
    seed,
    warn: (w) => warnings.push(w),
    rewriteCall: m.farFit(m.FFX_FAR_VIEW.ref, m.FFX_PARTY_SLOTS),
  });
  const host = dir.host;
  host.setRoster(m.rosterFor(lineup));
  const ext = (chr) => programs.extents[String(chr)];
  lineup.forEach((id, slot) => {
    const chr = host.chrOf(id);
    const e = ext(chr);
    host.setFrame(chr, { pos: [...m.FFX_PARTY_SLOTS[slot]], heading: Math.PI, height: e.height, width: e.width });
  });
  const spot = range === 'far' ? m.FFX_EVRAE_SPOTS.far : m.FFX_EVRAE_SPOTS.near;
  const ev = ext(20);
  host.setFrame(20, { pos: [...spot], heading: 0, height: ev.height, width: ev.width });
  host.setProperty(20, 30, range === 'far' ? 3 : 0);
  return Object.assign(rig, { dir, host, vm: dir.vm, warnings, lineup, range, m });
}

const sample = (pose, m) => [
  ...pose.eye.map((v) => Math.round(v * 1000) / 1000),
  ...pose.ref.map((v) => Math.round(v * 1000) / 1000),
  Math.round(pose.roll * m.R2D * 1000) / 1000,
  Math.round(pose.scrDpt * 1000) / 1000,
];

/** The camera settled on the default view of the rig's range (Enter, run to its end). */
export function settle(rig) {
  rig.dir.battleStart({ ...ctxBase, partyIds: [], boss: null, bossName: null });
  rig.dir.vm.runToEnd(100);
}

/**
 * Run `beat` (a call on the director that starts a shot) and record the pose after it and after every step until the camera is idle, or `cap` steps. `len` is the steps to idle; the last sample is the
 * pose the camera rests on.
 */
export function record(rig, beat, cap) {
  const vm = rig.vm;
  const before = rig.started;
  beat();
  if (rig.started === before) return { none: true, len: 0, samples: [sample(vm.pose(), rig.m)], capped: false }; // no script answered: the camera is as it was
  const samples = [sample(vm.pose(), rig.m)];
  while (!vm.idle && samples.length <= cap) {
    vm.tick();
    samples.push(sample(vm.pose(), rig.m));
  }
  return { len: samples.length - 1, samples, capped: !vm.idle };
}

const key = (r) => r.samples.map((s) => s.join(',')).join(';');

/** Run `once(seed)` for `samples` seeds when it draws dice, else once; merge identical outcomes: `[{ w, len, samples }]` and whether it drew. */
function branches(once, samples) {
  const first = (() => {
    const before = draws;
    const r = once(1);
    return { r, drew: draws !== before };
  })();
  if (!first.drew) return { drew: false, outcomes: [{ w: samples, len: first.r.len, samples: first.r.samples, capped: first.r.capped, none: first.r.none === true }] };
  const byKey = new Map();
  for (let seed = 1; seed <= samples; seed++) {
    const r = seed === 1 ? first.r : once(seed);
    const k = key(r);
    const have = byKey.get(k);
    if (have) have.w++;
    else byKey.set(k, { w: 1, len: r.len, samples: r.samples, capped: r.capped, none: r.none === true, firstSeed: seed });
  }
  return { drew: true, outcomes: [...byKey.values()].sort((a, b) => b.w - a.w || a.firstSeed - b.firstSeed) };
}

// ------------------------------------------------------------------------------------------------ scenarios

/** Which kinds of target an ability can have, as the table's target codes: `e` Evrae, `s` the actor, `aN` another party member by slot, `p` the party, `x` both sides. */
export function targetKinds(side, targeting, slot) {
  const others = [0, 1, 2].filter((j) => j !== slot).map((j) => `a${j}`);
  if (side === 'party') {
    switch (targeting) {
      case 'single-enemy': case 'all-enemies': case 'random-enemy': return ['e'];
      case 'self': return ['s'];
      case 'single-ally': case 'random-ally': return ['s', ...others];
      case 'all-allies': return ['p'];
      case 'single-any': return ['e', 's', ...others];
      case 'all': return ['x'];
      default: return ['e'];
    }
  }
  // a monster: its "enemies" are the party
  switch (targeting) {
    case 'single-enemy': return ['a0', 'a1', 'a2'];
    case 'all-enemies': return ['p'];
    case 'random-enemy': return ['p', 'a0', 'a1', 'a2'];
    case 'self': return ['s'];
    case 'single-ally': return ['e'];
    default: return ['p'];
  }
}

/** The ids a target code names, for the lineup (slot order) and the actor. */
export function targetsOf(code, actor, lineup) {
  if (code === 'e') return ['evrae'];
  if (code === 's') return [actor];
  if (code === 'p') return [...lineup];
  if (code === 'x') return [...lineup, 'evrae'];
  return [lineup[Number(code[1])]];
}

/** Every (phase, row, actor, slot, target code, range) the fight can produce for the rows of the action table. */
export function scenarios(m, { programs, lane }) {
  const A = m.data.ABILITIES;
  const I = m.data.ITEMS;
  const out = [];
  const ownersOf = (ability) => {
    const owners = Object.entries(lane.commands.party).filter(([, rows]) => rows.some((r) => r.ability === ability)).map(([who]) => who);
    return owners.length ? owners : ACTIVE;
  };
  const add = (row, actor, slot, tgt, steps, side) => {
    for (const range of ['n', 'f']) {
      for (const phase of ['open', 'launch']) {
        if (phase === 'launch' && !steps.some((s) => s.at === 'launch')) continue;
        out.push({ phase, row, actor, slot, tgt, range, side });
      }
    }
  };
  const party = programs.actions.party;
  const items = programs.actions.items;
  const mon = programs.actions.monster;
  for (const [id, row] of Object.entries(party)) {
    const ability = A[id];
    if (!ability) continue;
    for (const actor of ownersOf(id)) {
      for (const slot of [0, 1, 2]) {
        for (const tgt of targetKinds('party', ability.targeting, slot)) add(id, actor, slot, tgt, row.steps, 'party');
      }
    }
  }
  for (const [id, row] of Object.entries(items)) {
    const item = I[id];
    if (!item) continue;
    for (const slot of [0, 1, 2]) {
      const actor = ACTIVE[slot];
      for (const tgt of targetKinds('party', item.targeting, slot)) add(id, actor, slot, tgt, row.steps, 'party');
    }
  }
  for (const [rowId, side] of [['@attack.party', 'party'], ['@attack.monster', 'monster']]) {
    const row = side === 'party' ? programs.actions.attack.party : programs.actions.attack.monster;
    if (!row) continue;
    if (side === 'party') for (const slot of [0, 1, 2]) add(rowId, ACTIVE[slot], slot, 'e', row.steps, 'party');
    else for (const tgt of ['a0', 'a1', 'a2']) add(rowId, 'evrae', 'm', tgt, row.steps, 'monster');
  }
  for (const [id, row] of Object.entries(mon)) {
    const ability = A[id];
    if (!ability || id === 'evrae-attack') continue;
    const actor = id.startsWith('cid-') ? 'cid' : 'evrae';
    for (const tgt of targetKinds('monster', ability.targeting, 'm')) add(id, actor, 'm', tgt, row.steps, 'monster');
  }
  return out;
}

/** Record one scenario: `{ ...scenario, drew, outcomes }`. `programs` and the lineup are rebuilt per run, so no run can see another's camera. */
export function recordScenario(m, env, s, samples) {
  const lineup = lineupFor(s.actor, s.slot);
  const targets = targetsOf(s.tgt, s.actor, lineup);
  const range = s.range === 'f' ? 'far' : 'near';
  const isItem = s.row in env.programs.actions.items;
  const action = { kind: 'cast', abilityId: s.row.startsWith('@attack') ? undefined : s.row, commandKind: s.row.startsWith('@attack') ? 'attack' : isItem ? 'item' : 'ability' };
  const open = () => ({ ...ctxBase, actor: subj(s.actor), targets: targets.map(subj), action });
  const hit = () => ({ ...ctxBase, actor: subj(s.actor), action, target: subj(targets[0]), hitIndex: 0, heavy: false });
  const once = (seed) => {
    const rig = makeRig(m, { programs: env.programs, range, lineup, seed });
    settle(rig);
    if (s.phase === 'open') return record(rig, () => rig.dir.actionOpen(open()), CAPS.action);
    rig.dir.actionOpen(open());
    for (let i = 0; i < 40 && !rig.vm.idle; i++) rig.vm.tick(); // the launch comes while the opening shot plays
    return record(rig, () => rig.dir.impact(hit()), CAPS.action);
  };
  return { ...s, ...branches(once, samples) };
}

/** The camera at Enter / Select / Normal (one default view per range), the two airship scenes, the victory and the defeat. */
export function recordFixed(m, env, samples) {
  const out = [];
  for (const range of ['near', 'far']) {
    const once = () => {
      const rig = makeRig(m, { programs: env.programs, range });
      return record(rig, () => rig.dir.battleStart({ ...ctxBase, partyIds: [], boss: null, bossName: null }), CAPS.view);
    };
    out.push({ phase: 'view', row: 'default', range: range[0], ...branches(once, samples) });
  }
  for (const [kind, from] of [['pullBack', 'near'], ['moveIn', 'far']]) {
    const once = (seed) => {
      const rig = makeRig(m, { programs: env.programs, range: from, seed });
      settle(rig);
      return record(rig, () => rig.dir.rangeChange(kind, { ...ctxBase }), CAPS.scene);
    };
    out.push({ phase: 'scene', row: kind, range: from[0], ...branches(once, samples) });
  }
  for (const range of ['near', 'far']) {
    const onceV = (seed) => {
      const rig = makeRig(m, { programs: env.programs, range, seed });
      settle(rig);
      return record(rig, () => rig.dir.victory({ ...ctxBase }), CAPS.victory);
    };
    out.push({ phase: 'victory', row: 'victory', range: range[0], ...branches(onceV, samples) });
  }
  for (const slot of [0, 1, 2]) {
    for (const range of ['near', 'far']) {
      const onceD = (seed) => {
        const rig = makeRig(m, { programs: env.programs, range, seed });
        settle(rig);
        rig.host.lastDead = rig.host.chrOf(ACTIVE[slot]);
        return record(rig, () => rig.dir.defeat({ ...ctxBase }), CAPS.defeat);
      };
      out.push({ phase: 'defeat', row: 'defeat', slot, range: range[0], ...branches(onceD, samples) });
    }
  }
  return out;
}

/**
 * How far a launch's first poses move when it comes at different moments of its action's opening shot (at the opening, 40 steps in, and after the opening has run to its end): the largest
 * difference over its first `steps` samples, in FFX units (the roll in degrees). Zero when the launch cuts to its own shot whatever the camera was doing.
 */
export function priorDependence(m, env, s, steps = 3) {
  const lineup = lineupFor(s.actor, s.slot);
  const targets = targetsOf(s.tgt, s.actor, lineup);
  const range = s.range === 'f' ? 'far' : 'near';
  const isItem = s.row in env.programs.actions.items;
  const action = { kind: 'cast', abilityId: s.row.startsWith('@attack') ? undefined : s.row, commandKind: s.row.startsWith('@attack') ? 'attack' : isItem ? 'item' : 'ability' };
  const open = () => ({ ...ctxBase, actor: subj(s.actor), targets: targets.map(subj), action });
  const hit = () => ({ ...ctxBase, actor: subj(s.actor), action, target: subj(targets[0]), hitIndex: 0, heavy: false });
  const run = (ticks) => {
    const rig = makeRig(m, { programs: env.programs, range, lineup, seed: 1 });
    settle(rig);
    rig.dir.actionOpen(open());
    for (let i = 0; i < ticks && !rig.vm.idle; i++) rig.vm.tick();
    return record(rig, () => rig.dir.impact(hit()), steps);
  };
  const runs = [run(0), run(40), run(Number.POSITIVE_INFINITY)].filter((r) => !r.none);
  let worst = 0;
  for (const r of runs) {
    for (let i = 0; i < Math.min(r.samples.length, runs[0].samples.length); i++) {
      for (let c = 0; c < 7; c++) worst = Math.max(worst, Math.abs(r.samples[i][c] - runs[0].samples[i][c]));
    }
  }
  return worst;
}
