/**
 * **FFX's own random streams, at the engine** (re-parity RNG lane; Bailey 2026-10-09: "Adopt game streams (Recommended)").
 *
 * What is proved here, and against what:
 *
 * 1. **Which stream each draw of a hit comes from.** For 400 generated hits, by user (a party member, an aeon, a monster in
 *    each of the eight monster slots), the real `resolveAbility` runs on FFX's own 68 streams with every draw recorded; the
 *    kernels then run on the SAME recorded values, in the game's order, labelling each draw by its role (hit roll, variance,
 *    critical roll, shatter roll); and each draw's stream is compared with a table written out again below from
 *    `research/re-ffx-rng-hit.md` section 2 (a party member `slot + 20`, every aeon and slot 7 stream 27, a monster `slot + 8`,
 *    plus 16 for the hit roll and 32 for status rolls). Nothing here imports the engine's own stream table.
 * 2. **The mutation check.** The same comparison, run on an engine whose generator moves one purpose onto another stream
 *    (the hit roll onto the damage stream, the status roll onto the hit stream, the aeons onto a monster's stream, the monsters
 *    one stream along), fails for each.
 * 3. **The rolls that are not a hit's**: the opening counters' 26 draws, the scripts' `GetRandomValue` (stream 2, 16 bits) and
 *    picker (stream 4), a forced action's target (4), a random-target command's hits (5), a Reflect bounce (6), Steal (10 and 11),
 *    Escape (the escaper's own mode 0 stream), and the Evrae fight's scene and camera draws on stream 2. The stand-ins for a
 *    player (minigame defaults, an aim placeholder) and the engine's own drop model draw from the engine-side stream and never
 *    move a game stream.
 * 4. **Determinism**: the same run seed gives the same draws; a fork at a position replays them.
 *
 * Game case: **FFX only**. FFX-2 has its own streams and its own test (`parity-ffx2-rng-streams.test.ts`).
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, FFXCombatant } from '../../src/battle/common/types.ts';
import type { BattleRng } from '../../src/battle/common/streams.ts';
import { GameStreams, AUX_STREAM } from '../../src/battle/common/streams.ts';
import { ALL_ABILITIES } from '../../src/data/ffx/index.ts';
import { CORE_ABILITIES, resolveAbility } from '../../src/battle/ffx/index.ts';
import { critCheck } from '../../src/battle/ffx/kernel/crit.ts';
import { hitCheck } from '../../src/battle/ffx/kernel/hit.ts';
import { noStatusOutcome } from '../../src/battle/ffx/kernel/aftermath.ts';
import { subCtb } from '../../src/battle/ffx/kernel/ctb.ts';
import { calcHitDamage } from '../../src/battle/ffx/kernel/hitdamage.ts';
import { FFX_STREAM_GAME, makeFfxRng } from '../../src/battle/ffx/adapt/streams.ts';
import { combatantOf, contextOf, makeRng, oracleInputs, randomSituation, wiringPool, type Situation } from './helpers/ffxEngineWiring.ts';

// ------------------------------------------------------------------------------------------ the independent stream table

type Mode = 0 | 1 | 2;

/** `research/re-ffx-rng-hit.md` section 2, written out again: the stream a character's roll of a mode uses. */
function streamFor(slot: number, mode: Mode, aeon: boolean): number {
  const add = mode === 1 ? 16 : mode === 2 ? 32 : 0;
  if (slot >= 0x14 && slot <= 0x1b) return slot + 8 + add; // the eight monster slots: 28 to 35
  if (aeon) return 27 + add; // every aeon shares stream 27 with party slot 7
  return slot + 20 + add; // a party member: 20 to 27
}

/** The game's slots, from `research/re-ffx-ctb-status.md` section 0: the party in the game's order, then the ten aeons. */
const PARTY_SLOTS = ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'rikku'] as const;
const AEON_SLOTS = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo', 'cindy', 'sandy', 'mindy'] as const;

/** The fixed streams (section 2 and the lane notes), written out again. */
const SCRIPT = 2;
const PICKER = 4;
const RANDOM_TARGET = 5;
const REFLECT = 6;
const STEAL = 10;
const STEAL_SLOT = 11;

interface Cast {
  id: string;
  side: 'party' | 'aeon' | 'enemy';
  slot: number;
  aeon: boolean;
  /** Dummy monsters standing before an enemy user in the formation, which is what makes his monster slot. */
  before: number;
}

function castFor(sit: Situation, rng: ReturnType<typeof makeRng>): Cast {
  if (sit.userSide === 'enemy') {
    const k = rng.int(0, 7);
    return { id: 'bossy', side: 'enemy', slot: 0x14 + k, aeon: false, before: k };
  }
  if (rng.next() < 0.35) {
    const i = rng.int(0, AEON_SLOTS.length - 1);
    return { id: AEON_SLOTS[i]!, side: 'aeon', slot: 8 + i, aeon: true, before: 0 };
  }
  const i = rng.int(0, PARTY_SLOTS.length - 1);
  return { id: PARTY_SLOTS[i]!, side: 'party', slot: i, aeon: false, before: 0 };
}

/** The roles a draw of a hit can have, and the mode of the user's stream each one is drawn from (section 7 of the note). */
const MODE_OF_ROLE: Readonly<Record<string, Mode>> = { V: 0, C: 0, H: 1, S: 2 };

// --------------------------------------------------------------------------------------------------------- the oracle

/** The kernels on the engine's recorded values, in the game's order, with each draw labelled by its role. */
function labelled(sit: Situation, hits: number, raws: readonly number[]): { labels: string; used: number } {
  let cursor = 0;
  let labels = '';
  const next = (label: string) => (): number => {
    labels += label;
    return raws[cursor++] ?? 0;
  };
  let hp = sit.target.hp, mp = sit.target.mp, ctb = sit.target.ctb, sleep = sit.target.sleep;
  let nul = [...sit.target.nul];
  for (let h = 0; h < hits; h++) {
    const inp = oracleInputs(sit, { hp, mp, ctb, sleep });
    inp.input.record.nul = { blaze: nul[0] as number, frost: nul[1] as number, shock: nul[2] as number, tide: nul[3] as number };
    const out = calcHitDamage(inp.input, {
      draw: next('V'),
      hit: () => hitCheck(inp.hit, next('H')),
      crit: () => critCheck(inp.crit, 0, next('C')).crit,
      // A Petrified target costs the status step one shatter roll, spent whether or not the command has a shatter chance.
      status: () => {
        if (sit.target.petrify) next('S')();
        return noStatusOutcome(inp.input.record.perm, inp.input.record.extra);
      },
    });
    nul = [out.nul.blaze, out.nul.frost, out.nul.shock, out.nul.tide];
    if (out.outcome === 'nullified' || out.outcome === 'noEffect' || out.outcome === 'miss') continue;
    const [a0, a1, a2] = out.amounts;
    const classes = sit.def.record!.damageClass;
    if ((out.resultMask & 4) !== 0 && a2 !== 0) ctb = subCtb(ctb, a2);
    if ((classes & 2) !== 0 && a1 !== 0) mp = Math.max(0, Math.min(sit.target.maxMp, mp - a1));
    if ((classes & 1) !== 0 && a0 !== 0) {
      hp = Math.max(0, Math.min(sit.target.maxHp, hp - a0));
      if (sit.def.damageType === 'physical' && a0 > 0) sleep = false;
    }
  }
  return { labels, used: cursor };
}

interface Taps {
  list: Array<{ stream: number; value: number }>;
}

/** Run the real resolver on a game generator, recording every draw. */
function viaEngine(sit: Situation, cast: Cast, rng: GameStreams): { taps: Taps['list']; died: boolean } {
  const taps: Taps['list'] = [];
  rng.tap = (stream, value) => taps.push({ stream, value });
  const targetSide = sit.def.targeting === 'single-ally' ? sit.userSide : sit.userSide === 'party' ? 'enemy' : 'party';
  const user = combatantOf(sit.user, cast.id, cast.side === 'enemy' ? 'enemy' : 'party');
  user.side = cast.side;
  const target = combatantOf(sit.target, 'tgt', targetSide);
  const dummies = Array.from({ length: cast.before }, (_, i) => combatantOf(sit.target, `dummy${i}`, 'enemy'));
  const { ctx } = contextOf(user, target, rng, sit.target.ctb, dummies);
  if (cast.side === 'enemy') ctx.state.enemyIds = [...dummies.map((d) => d.id), user.id, ...ctx.state.enemyIds.filter((id) => id !== user.id && !id.startsWith('dummy'))];
  if (cast.side === 'aeon') ctx.state.aeonId = user.id;
  resolveAbility(ctx, user, sit.def, [target.id], {
    ...(sit.power !== undefined ? { power: sit.power } : {}),
    ...(sit.gilSpent !== undefined ? { gilSpent: sit.gilSpent } : {}),
    ...(sit.timing ? { timing: sit.timing } : {}),
    hits: sit.def.hits,
  });
  return { taps, died: !target.alive };
}

const POOL: AbilityDef[] = [...wiringPool(ALL_ABILITIES), ...wiringPool(CORE_ABILITIES.map((a) => ({ ...a })))];

/** How many of `n` generated hits disagree with the table, and the roles and users seen. */
function compare(n: number, make: (seed: number) => GameStreams): { bad: string[]; compared: number; users: Set<string>; roles: Set<string> } {
  const rng = makeRng(20261011);
  const bad: string[] = [];
  const users = new Set<string>();
  const roles = new Set<string>();
  let compared = 0;
  for (let i = 0; i < n; i++) {
    const sit = randomSituation(rng, POOL);
    const cast = castFor(sit, rng);
    const run = viaEngine(sit, cast, make(1000 + i));
    if (run.died) continue; // a target that dies mid-action takes the KO path, which the oracle does not model
    const { labels, used } = labelled(sit, sit.def.hits, run.taps.map((t) => t.value));
    const expected = [...labels].map((l) => streamFor(cast.slot, MODE_OF_ROLE[l]!, cast.aeon));
    const got = run.taps.map((t) => t.stream);
    compared++;
    users.add(`${cast.side}:${cast.slot}`);
    for (const l of labels) roles.add(l);
    if (used !== run.taps.length || expected.join() !== got.join()) bad.push(`#${i} ${sit.def.id} by ${cast.id} (slot ${cast.slot}): wanted ${expected.join()} (${labels}), saw ${got.join()}`);
  }
  return { bad, compared, users, roles };
}

/** An engine whose generator moves one purpose onto another stream. */
class Mutant extends GameStreams {
  constructor(private readonly remap: (stream: number) => number, seed: number) {
    super(FFX_STREAM_GAME, seed);
  }

  override on(stream: number): ReturnType<GameStreams['on']> {
    return super.on(this.remap(stream));
  }
}

describe('the draws of a hit come from the user\'s own streams (the game\'s table, written out again)', () => {
  it('400 generated hits: every draw is on the stream its role names, for a party member, an aeon and each monster slot', () => {
    const r = compare(400, (seed) => makeFfxRng(seed));
    expect(r.bad.slice(0, 5)).toEqual([]);
    expect(r.compared).toBeGreaterThan(330);
    // The sample is wide enough to have exercised each kind of user and each role.
    expect([...r.users].filter((u) => u.startsWith('enemy')).length).toBe(8);
    expect([...r.users].filter((u) => u.startsWith('aeon')).length).toBeGreaterThan(5);
    expect([...r.users].filter((u) => u.startsWith('party')).length).toBeGreaterThan(5);
    expect([...r.roles].sort().join('')).toBe('CHSV');
  });

  it('MUTANT: the hit roll on the damage stream is caught', () => {
    const r = compare(400, (seed) => new Mutant((s) => (s >= 36 && s <= 51 ? s - 16 : s), seed));
    expect(r.bad.length).toBeGreaterThan(50);
  });

  it('MUTANT: the status roll on the hit stream is caught', () => {
    const r = compare(400, (seed) => new Mutant((s) => (s >= 52 && s <= 67 ? s - 16 : s), seed));
    expect(r.bad.length).toBeGreaterThan(0);
  });

  it('MUTANT: the aeons on a monster\'s stream are caught', () => {
    const r = compare(400, (seed) => new Mutant((s) => (s === 27 ? 28 : s), seed));
    expect(r.bad.length).toBeGreaterThan(10);
  });

  it('MUTANT: every monster one stream along is caught', () => {
    const r = compare(400, (seed) => new Mutant((s) => (s >= 28 && s <= 35 ? s + 1 : s), seed));
    expect(r.bad.length).toBeGreaterThan(50);
  });

  it('the same run seed gives the same draws, hit after hit', () => {
    const rng = makeRng(5);
    for (let i = 0; i < 30; i++) {
      const sit = randomSituation(rng, POOL);
      const cast = castFor(sit, rng);
      const a = viaEngine(sit, cast, makeFfxRng(9));
      const b = viaEngine(sit, cast, makeFfxRng(9));
      expect(b.taps).toEqual(a.taps);
    }
  });
});

describe('the other rolls: the table above, role by role', () => {
  it('the opening counters: 26 draws, party slots 20 to 26, slot 7 and the ten aeons on 27, the monsters 28 to 35', async () => {
    const { buildBattle, FFXContentRegistry } = await import('../../src/battle/ffx/index.ts');
    const { ENEMY_GROUPS_BY_ID, ITEMS } = await import('../../src/data/ffx/index.ts');
    const { gagazetBuild } = await import('../../src/data/ffx/builds/gagazet.ts');
    const { openingCtb } = await import('../../src/battle/ffx/adapt/ctb.ts');
    const content = new FFXContentRegistry();
    content.addAbilities(ALL_ABILITIES);
    content.addItems(Object.values(ITEMS));
    const rng = makeFfxRng(3);
    const ctx = buildBattle(
      { game: 'ffx', party: gagazetBuild, enemies: ENEMY_GROUPS_BY_ID['seymour-flux']!, triggers: [], seed: 3, condition: 'scripted', canEscape: false },
      rng,
      content,
      () => undefined,
    );
    const taps: number[] = [];
    rng.tap = (stream) => taps.push(stream);
    openingCtb(ctx, 'normal');
    const expected = [20, 21, 22, 23, 24, 25, 26, ...new Array<number>(11).fill(27), 28, 29, 30, 31, 32, 33, 34, 35];
    expect(taps).toEqual(expected);
    taps.length = 0;
    openingCtb(ctx, 'preemptive');
    expect(taps).toEqual([]); // a preemptive or ambush start spends none
  });

  it('a script\'s GetRandomValue is stream 2 (16 bits) and its picker stream 4 (no draw under two)', async () => {
    const { scriptValue, pickMatching, drawPicker } = await import('../../src/battle/ffx/ai/script-random.ts');
    const rng = makeFfxRng(11);
    const mirror = makeFfxRng(11);
    const taps: number[] = [];
    rng.tap = (stream) => taps.push(stream);
    const ctx = { rng, state: { enemyIds: [] as string[] } } as never;
    const v = scriptValue(ctx);
    expect(v).toBe(mirror.draw(SCRIPT) & 0xffff);
    const fighters = ['tidus', 'yuna', 'auron'].map((id) => ({ id, side: 'party' }) as unknown as FFXCombatant);
    const pick = pickMatching(ctx, fighters);
    expect(pick?.id).toBe(['tidus', 'yuna', 'auron'][mirror.draw(PICKER) % 3]);
    expect(taps).toEqual([SCRIPT, PICKER]);
    taps.length = 0;
    expect(pickMatching(ctx, fighters.slice(0, 1))?.id).toBe('tidus');
    drawPicker(ctx, 1);
    expect(taps).toEqual([]);
    drawPicker(ctx, 3);
    expect(taps).toEqual([PICKER]);
  });

  it('Berserk and Confuse pick their target with stream 4, along the actors in ascending order; one candidate draws nothing', async () => {
    const { berserkCommand, confusedCommand } = await import('../../src/battle/ffx/execute.ts');
    const rng = makeFfxRng(21);
    const mirror = makeFfxRng(21);
    const taps: number[] = [];
    const sit = randomSituation(makeRng(1), POOL);
    const mk = (id: string, side: 'party' | 'enemy'): FFXCombatant => combatantOf(sit.target, id, side);
    const actor = mk('boss', 'enemy');
    const party = ['auron', 'tidus', 'yuna'].map((id) => mk(id, 'party')); // deliberately not in slot order
    const { ctx } = contextOf(actor, party[0]!, rng, 0, party.slice(1));
    ctx.state.activeIds = party.map((p) => p.id); // the list order the engine keeps: auron, tidus, yuna
    rng.tap = (stream) => taps.push(stream);
    const cmd = berserkCommand(ctx, actor);
    expect(taps).toEqual([PICKER]);
    expect(cmd.targets).toEqual([['tidus', 'yuna', 'auron'][mirror.draw(PICKER) % 3]]);
    taps.length = 0;
    const cmd2 = confusedCommand(ctx, actor);
    expect(taps).toEqual([PICKER]);
    // the pool of a Confuse is both sides but the actor: auron, tidus, yuna in list order, ordered by actor number: tidus, yuna, auron
    expect(cmd2.targets).toEqual([['tidus', 'yuna', 'auron'][mirror.draw(PICKER) % 3]]);
    taps.length = 0;
    ctx.state.activeIds = ['tidus'];
    ctx.state.enemyIds = ['boss'];
    expect(berserkCommand(ctx, actor).targets).toEqual(['tidus']);
    expect(taps).toEqual([]);
  });

  it('every hit of a random-target command draws stream 5 first, and lands on the (value % count)-th candidate in actor order', () => {
    const def = ALL_ABILITIES.find((a) => a.targeting === 'random-enemy' && a.hits >= 4 && a.record !== undefined) as AbilityDef;
    expect(def).toBeDefined();
    const rng = makeFfxRng(33);
    const taps: Array<{ stream: number; value: number }> = [];
    const sit = randomSituation(makeRng(2), POOL);
    Object.assign(sit.target, { hp: 99999, maxHp: 99999, eva: 0, nul: [0, 0, 0, 0], absorb: 0, nullMask: 0, immuneAll: false, immunePhys: false, immuneMag: false, sleep: false, petrify: false });
    const boss = combatantOf(sit.user, 'bossy', 'enemy');
    const party = ['rikku', 'wakka', 'tidus'].map((id) => combatantOf(sit.target, id, 'party')); // list order rikku, wakka, tidus
    const { ctx, events } = contextOf(boss, party[0]!, rng, 0, party.slice(1));
    ctx.state.activeIds = party.map((p) => p.id);
    rng.tap = (stream, value) => taps.push({ stream, value });
    resolveAbility(ctx, boss, def, []);
    const fives = taps.filter((t) => t.stream === RANDOM_TARGET);
    expect(fives).toHaveLength(def.hits);
    const ordered = ['tidus', 'wakka', 'rikku']; // ascending actor number: Tidus 0, Wakka 4, Rikku 6
    const landed = events.filter((e) => e['type'] === 'damage' || e['type'] === 'miss').map((e) => e['targetId']);
    expect(landed.slice(0, def.hits)).toEqual(fives.map((t) => ordered[t.value % 3]));
    // each hit's own pick comes before its own draws, and the draws between two picks are the boss's own (monster slot 0x14: 28, 44, 60)
    const own = new Set([streamFor(0x14, 0, false), streamFor(0x14, 1, false), streamFor(0x14, 2, false)]);
    expect(taps[0]!.stream).toBe(RANDOM_TARGET);
    for (const t of taps) if (t.stream !== RANDOM_TARGET) expect(own.has(t.stream)).toBe(true);
  });

  it('a Reflect bounce draws stream 6 over the other side in actor order, and nothing with one candidate', async () => {
    const { reflectBounceTarget } = await import('../../src/battle/ffx/targeting.ts');
    const rng = makeFfxRng(8);
    const mirror = makeFfxRng(8);
    const taps: number[] = [];
    const sit = randomSituation(makeRng(3), POOL);
    const reflector = combatantOf(sit.target, 'boss', 'enemy');
    const party = ['lulu', 'yuna', 'auron'].map((id) => combatantOf(sit.target, id, 'party'));
    const { ctx } = contextOf(reflector, party[0]!, rng, 0, party.slice(1));
    ctx.state.activeIds = party.map((p) => p.id);
    rng.tap = (stream) => taps.push(stream);
    const bounced = reflectBounceTarget(ctx, reflector);
    expect(taps).toEqual([REFLECT]);
    expect(bounced?.id).toBe(['yuna', 'auron', 'lulu'][mirror.draw(REFLECT) % 3]);
    taps.length = 0;
    ctx.state.activeIds = ['lulu'];
    expect(reflectBounceTarget(ctx, reflector)?.id).toBe('lulu');
    expect(taps).toEqual([]);
  });

  it('Steal draws stream 10 (the roll, % 255) and, on a success, stream 11 (the rare slot, & 0xff)', async () => {
    const { resolveSteal } = await import('../../src/battle/ffx/steal.ts');
    const sit = randomSituation(makeRng(4), POOL);
    let successes = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const rng = makeFfxRng(seed);
      const taps: Array<{ stream: number; value: number }> = [];
      const user = combatantOf(sit.user, 'rikku', 'party');
      const target = combatantOf(sit.target, 'boss', 'enemy');
      target.enemy = { rewards: { steal: { baseChance: 100, common: { itemId: 'potion', count: 2 }, rare: { itemId: 'hi-potion', count: 1 } } } } as never;
      const { ctx } = contextOf(user, target, rng, 0);
      rng.tap = (stream, value) => taps.push({ stream, value });
      resolveSteal(ctx, user, target);
      expect(taps[0]!.stream).toBe(STEAL);
      if (taps.length > 1) {
        expect(taps).toHaveLength(2);
        expect(taps[1]!.stream).toBe(STEAL_SLOT);
        successes++;
      }
    }
    expect(successes).toBeGreaterThan(0);
  });

  it('Escape is rolled first on the escaper\'s own mode 0 stream, even in a battle that cannot be escaped', async () => {
    const { executeCommand } = await import('../../src/battle/ffx/execute.ts');
    const sit = randomSituation(makeRng(6), POOL);
    for (const canEscape of [true, false]) {
      const rng = makeFfxRng(12);
      const taps: number[] = [];
      const user = combatantOf(sit.user, 'wakka', 'party');
      const foe = combatantOf(sit.target, 'boss', 'enemy');
      const { ctx } = contextOf(user, foe, rng, 0);
      ctx.rt.canEscape = canEscape;
      rng.tap = (stream) => taps.push(stream);
      executeCommand(ctx, user, { kind: 'escape', targets: [] } as never, true);
      expect(taps, `canEscape ${canEscape}`).toEqual([streamFor(4, 0, false)]); // Wakka is party slot 4: stream 24
    }
  });

  it('the engine\'s stand-ins for a player and its drop model draw from the engine-side stream and move no game stream', async () => {
    const { rollDefaultMinigame } = await import('../../src/battle/ffx/overdrive.ts');
    const rng = makeFfxRng(14);
    const before = Array.from(rng.states);
    const sit = randomSituation(makeRng(7), POOL);
    const user = combatantOf(sit.user, 'tidus', 'party');
    const foe = combatantOf(sit.target, 'boss', 'enemy');
    const { ctx } = contextOf(user, foe, rng, 0);
    const taps: number[] = [];
    rng.tap = (stream) => taps.push(stream);
    const def = POOL.find((a) => a.id === 'attack')!;
    for (const kind of ['tidus-timing', 'auron-sequence', 'wakka-reels', 'lulu-fury', 'gunner-trigger'] as const) rollDefaultMinigame(ctx, kind, def, user);
    expect(taps.length).toBeGreaterThan(5);
    expect(new Set(taps)).toEqual(new Set([AUX_STREAM]));
    expect(Array.from(rng.states)).toEqual(before);
  });
});

describe('the Fahrenheit fights\' scenes and camera draw on the scripts\' stream (Chapter VIII, and the Fins of Chapter XVII)', () => {
  it('a voice reply draws mod 100 once, and a second time while it is below the speaker\'s threshold (255, then the last second draw)', async () => {
    const { orderVoiceScene } = await import('../../src/battle/ffx/ai/airship-scenes.ts');
    const sit = randomSituation(makeRng(8), POOL);
    const rng = makeFfxRng(77);
    const mirror = makeFfxRng(77);
    const user = combatantOf(sit.user, 'tidus', 'party');
    const foe = combatantOf(sit.target, 'boss', 'enemy');
    const { ctx } = contextOf(user, foe, rng, 0);
    const taps: number[] = [];
    rng.tap = (stream) => taps.push(stream);
    // The formation script, restated: v15 (Tidus) and v16 (Rikku) start at 255; a reply is d1 = rand % 100; if d1 < v then v = rand % 100.
    const thresholds: Record<string, number> = { tidus: 255, rikku: 255 };
    let expectedDraws = 0;
    const order = ['tidus', 'tidus', 'rikku', 'tidus', 'rikku', 'rikku', 'tidus', 'tidus', 'rikku', 'tidus', 'tidus', 'tidus'];
    for (const who of order) {
      orderVoiceScene(ctx, who);
      const d1 = (mirror.draw(SCRIPT) & 0xffff) % 100;
      expectedDraws++;
      if (d1 < thresholds[who]!) {
        thresholds[who] = (mirror.draw(SCRIPT) & 0xffff) % 100;
        expectedDraws++;
      }
    }
    expect(taps).toHaveLength(expectedDraws);
    expect(taps.every((s) => s === SCRIPT)).toBe(true);
    expect(expectedDraws).toBeGreaterThan(order.length); // the second draw happens
    expect(expectedDraws).toBeLessThan(2 * order.length); // and sometimes it does not
    taps.length = 0;
    orderVoiceScene(ctx, 'auron'); // only Tidus and Rikku have the Trigger Commands: the scene branches on them alone
    expect(taps).toEqual([]);
  });

  it('Cid\'s pre-turn caption draws mod 2 once, but only while an order stands; the Guided Missiles camera draws mod 100 once', async () => {
    const { cidAi } = await import('../../src/battle/ffx/ai/evrae.ts');
    const { orderCaptionScene, missileCameraShot } = await import('../../src/battle/ffx/ai/airship-scenes.ts');
    const rng = makeFfxRng(5);
    const mirror = makeFfxRng(5);
    const sit = randomSituation(makeRng(9), POOL);
    const user = combatantOf(sit.user, 'tidus', 'party');
    const foe = combatantOf(sit.target, 'boss', 'enemy');
    const { ctx } = contextOf(user, foe, rng, 0);
    const taps: number[] = [];
    rng.tap = (stream) => taps.push(stream);
    orderCaptionScene(ctx);
    expect(taps).toEqual([SCRIPT]);
    mirror.draw(SCRIPT);
    missileCameraShot(ctx);
    expect(taps).toEqual([SCRIPT, SCRIPT]);
    expect(typeof cidAi).toBe('function');
  });
});

describe('a game generator in the engine: snapshots and forks', () => {
  it('a fork at the engine\'s position replays its draws', () => {
    const rng: BattleRng = makeFfxRng(4);
    for (let i = 0; i < 50; i++) rng.on(i % 68).int(0, 99);
    const f = rng.fork(4, rng.saveState());
    for (let i = 0; i < 80; i++) expect(f.on(i % 68).int(0, 99)).toBe(rng.on(i % 68).int(0, 99));
  });
});
