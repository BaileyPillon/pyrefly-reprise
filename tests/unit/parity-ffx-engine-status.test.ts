/**
 * **Engine-level parity, FFX status infliction wiring** (re-parity W2; **FFX only**). The turn order is in
 * `parity-ffx-engine-ctb-status.test.ts`, the per-turn ticks in `parity-ffx-engine-ticks.test.ts`; all follow the pattern of
 * `parity-ffx-engine-wiring.test.ts`: the engine's own path against an oracle that runs the kernels by an independent route.
 *
 * The kernel tests (`parity-ffx-status-*.test.ts`) prove the infliction step against the game's own machine code. This file
 * proves the WIRING: it drives the engine's `resolveAbility` on a few hundred generated hits written in the game's terms (the
 * target's permanent word, thirteen counters and extra word, its 25 resistance bytes, stage stacks and buff flags; the user's
 * clock and weapon strikes) and asserts that what the engine does equals what `calcHitDamage` with the kernel's
 * `inflictStatuses` returns for the same inputs and the same draws:
 *
 * 1. the draws: the hit roll, the variances, the critical roll, then one `% 101` draw per status with a chance byte (Threaten's is
 *    `% 100`), none for a cleansing command, and the one shatter roll of a Petrified target, in the game's order;
 * 2. the target's words afterwards, read back from the engine's status instances: the permanent word, the thirteen counters, the
 *    extra word, the stage stacks and the buff flags, and what is given by equipment staying given;
 * 3. the target's HP, MP, CTB counter and maxima (Haste, Slow, Threaten, Delay, the Double HP and Double MP flags), and whether it
 *    died or left the field (Death, Petrify on a monster, Eject, a revival).
 *
 * The hand-worked cases at the end are rules the generator cannot reach: Banish on an aeon, the Distill bits, the weapon strikes'
 * durations, an ability with no game record deriving its bytes from its own statuses.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, FFXCommandRecord, StatusApplication, StatusId } from '../../src/battle/common/types.ts';
import { ALL_ABILITIES } from '../../src/data/ffx/index.ts';
import { CORE_ABILITIES, resolveAbility } from '../../src/battle/ffx/index.ts';
import { resolveCommand } from '../../src/battle/ffx/adapt/command.ts';
import { ability } from './ffx-fixtures.test.ts';
import { ScriptedRng, combatantOf, contextOf, makeRng, randomSide } from './helpers/ffxEngineWiring.ts';
import {
  BUFF_IDS,
  EXTRA_IDS,
  PERM_IDS,
  STACK_IDS,
  TEMPORAL_IDS,
  type Outcome,
  type StatusSituation,
  oracleRun,
  randomStatusSituation,
  statusPool,
  targetCombatant,
  userCombatant,
  wordsOf,
} from './helpers/ffxEngineStatus.ts';

const POOL: AbilityDef[] = [...statusPool(ALL_ABILITIES), ...statusPool(CORE_ABILITIES.map((a) => ({ ...a })))];

/** What the engine does. */
function viaEngine(sit: StatusSituation, hits: number): Outcome {
  const rng = new ScriptedRng(sit.raws);
  const targetSide = sit.def.targeting === 'single-ally' ? sit.userSide : sit.userSide === 'party' ? 'enemy' : 'party';
  // The engine keys the game's character slots by id, so a party-side combatant needs a party member's id.
  const user = userCombatant(sit, sit.userSide === 'party' ? 'yuna' : 'enemy-u');
  const target = targetCombatant(sit, targetSide === 'party' ? 'tidus' : 'enemy-t', targetSide);
  const { ctx } = contextOf(user, target, rng, sit.target.ctb);
  ctx.rt.actors.get(user.id)!.ctb = sit.userCtb;
  if (sit.targetMonster) ctx.rt.actors.get(target.id)!.threatenChance = sit.threatenChance;
  resolveAbility(ctx, user, sit.def, [target.id], {
    hits,
    ...(sit.power !== undefined ? { power: sit.power } : {}),
    ...(sit.gilSpent !== undefined ? { gilSpent: sit.gilSpent } : {}),
    ...(sit.timing ? { timing: sit.timing } : {}),
  });
  const ejected = target.removed;
  const dead = !target.alive && !target.removed;
  return {
    kinds: rng.kinds(),
    words: !dead && !ejected ? wordsOf(target) : null,
    dead,
    ejected,
    hp: target.hp,
    mp: target.mp,
    ctb: ctx.rt.actors.get(target.id)!.ctb,
    maxHp: target.stats.maxHp,
    maxMp: target.stats.maxMp,
    doom: !dead && !ejected ? (target.statuses['doom']?.turnsRemaining ?? null) : null,
    early: false,
  };
}

describe('the engine rolls statuses and writes them back as the kernels do, on generated hits', () => {
  it('there is a pool to draw from', () => {
    expect(POOL.length).toBeGreaterThan(70);
    expect(POOL.some((a) => a.id === 'esuna')).toBe(true);
    expect(POOL.some((a) => a.id === 'phoenix-down' || a.id === 'life')).toBe(true);
  });

  it('1500 situations: the same draws, words, flags and pools', () => {
    const rng = makeRng(20261009);
    let skipped = 0;
    const seen = { changed: 0, cleanse: 0, killed: 0, revived: 0, ejected: 0, threaten: 0, stacks: 0, pools: 0, ctb: 0, kinds: new Set<string>() };
    for (let i = 0; i < 1500; i++) {
      const sit = randomStatusSituation(rng, POOL);
      const hits = sit.hits;
      const kernels = oracleRun(sit, hits);
      if (kernels.early) {
        skipped++;
        continue;
      }
      const engine = viaEngine(sit, hits);
      const note = `situation ${i}: ${sit.def.id}`;
      expect(engine.kinds, `${note}: draws`).toBe(kernels.kinds);
      expect(engine, note).toEqual(kernels);
      seen.kinds.add(kernels.kinds);
      const was = sit.words;
      if (kernels.words && JSON.stringify(kernels.words) !== JSON.stringify(was)) seen.changed++;
      if (((sit.def.record!.flagsDamage ?? 0) & 0x20) !== 0) seen.cleanse++;
      if (kernels.dead || kernels.ejected) seen.killed++;
      if ((was.perm & 1) !== 0 && !kernels.dead && !kernels.ejected) seen.revived++;
      if (kernels.ejected) seen.ejected++;
      if ((sit.def.record!.chances ?? []).some(([n]) => n === 11)) seen.threaten++;
      if ((sit.def.record!.stage?.[0] ?? 0) !== 0) seen.stacks++;
      if (((sit.def.record!.buff ?? 0) & 3) !== 0) seen.pools++;
      if (kernels.ctb !== sit.target.ctb) seen.ctb++;
    }
    expect(skipped).toBeLessThan(150);
    // The sample is wide enough to have exercised each branch.
    expect(seen.changed).toBeGreaterThan(500);
    expect(seen.cleanse).toBeGreaterThan(50);
    expect(seen.killed).toBeGreaterThan(20);
    expect(seen.revived).toBeGreaterThan(12);
    expect(seen.ejected).toBeGreaterThan(10);
    expect(seen.threaten).toBeGreaterThan(5);
    expect(seen.stacks).toBeGreaterThan(15);
    expect(seen.pools).toBeGreaterThan(2);
    expect(seen.ctb).toBeGreaterThan(60);
    expect(seen.kinds.size).toBeGreaterThan(10);
  });
});

describe('an ability with no game record derives its status bytes from its own statuses', () => {
  /** The same bytes, written out as a record by an independent mapping of the ability's own statuses (typed again here). */
  function writtenRecord(def: AbilityDef, side: 'party' | 'enemy'): FFXCommandRecord {
    const base = resolveCommand(def, { side }).record;
    const chances = new Map<number, number>();
    const durations = new Map<number, number>();
    let extra = 0, stageMask = 0, stageAmount = 0, buff = 0;
    const number = (status: StatusId): number => (PERM_IDS.includes(status) ? PERM_IDS.indexOf(status) : TEMPORAL_IDS.includes(status) ? 12 + TEMPORAL_IDS.indexOf(status) : -1);
    for (const s of def.statusEffects) {
      const n = number(s.status);
      if (n >= 0) {
        chances.set(n, s.chance);
        if (n >= 12) durations.set(n - 12, s.duration);
      } else if (EXTRA_IDS.some(([id]) => id === s.status)) extra |= EXTRA_IDS.find(([id]) => id === s.status)![1];
      else if (STACK_IDS.includes(s.status)) {
        stageMask |= 1 << STACK_IDS.indexOf(s.status);
        stageAmount = Math.max(stageAmount, s.stacks ?? 1);
      } else if (BUFF_IDS.some(([id]) => id === s.status)) buff |= BUFF_IDS.find(([id]) => id === s.status)![1];
    }
    for (const status of def.removesStatuses) {
      const n = number(status);
      if (n >= 0) {
        chances.set(n, 254);
        if (n >= 12) durations.set(n - 12, 254);
      } else if (EXTRA_IDS.some(([id]) => id === status)) extra |= EXTRA_IDS.find(([id]) => id === status)![1];
    }
    // A revival of ours (heals, may aim at the dead, nothing else) is the cleanse of Death.
    const revives = def.flags.includes('heals') && def.flags.includes('can-target-dead') && def.statusEffects.length === 0 && def.removesStatuses.length === 0;
    if (revives && !chances.has(0)) chances.set(0, 254);
    const cleanse = def.removesStatuses.length > 0 || def.flags.includes('removes-statuses') || revives;
    const out: FFXCommandRecord = { ...base, flagsDamage: cleanse ? base.flagsDamage | 0x20 : base.flagsDamage & ~0x20 };
    if (chances.size > 0) out.chances = [...chances.entries()].sort((a, b) => a[0] - b[0]);
    if (durations.size > 0) out.durations = [...durations.entries()].sort((a, b) => a[0] - b[0]);
    if (extra !== 0) out.extra = extra;
    if (stageMask !== 0) out.stage = [stageMask, stageAmount];
    if (buff !== 0) out.buff = buff;
    return out;
  }

  const PAYLOAD: ReadonlyArray<StatusApplication> = [
    { status: 'poison', chance: 100, duration: 254 }, { status: 'sleep', chance: 254, duration: 3 }, { status: 'slow', chance: 255, duration: 254 },
    { status: 'zombie', chance: 60, duration: 254 }, { status: 'petrify', chance: 30, duration: 254 }, { status: 'silence', chance: 100, duration: 3 },
    { status: 'protect', chance: 254, duration: 254 }, { status: 'nulblaze', chance: 254, duration: 1 }, { status: 'regen', chance: 254, duration: 10 },
    { status: 'shield', chance: 255, duration: 1 }, { status: 'defend', chance: 255, duration: 1 }, { status: 'curse', chance: 255, duration: 254 },
    { status: 'doom', chance: 255, duration: 5 }, { status: 'cheer', chance: 254, duration: 254, stacks: 2 }, { status: 'jinx', chance: 254, duration: 254, stacks: 1 },
    { status: 'damage-9999', chance: 255, duration: 254 }, { status: 'ko', chance: 100, duration: 254 }, { status: 'threaten', chance: 255, duration: 254 },
  ];
  const REMOVABLE: readonly StatusId[] = ['poison', 'sleep', 'silence', 'darkness', 'slow', 'confuse', 'shell', 'reflect', 'haste', 'curse', 'petrify', 'zombie'];

  it('is exactly the same ability with those bytes written out as its record, on the same draws', () => {
    const rng = makeRng(404);
    let landed = 0;
    for (let i = 0; i < 300; i++) {
      const statusEffects: StatusApplication[] = [];
      for (let k = rng.int(0, 3); k > 0; k--) statusEffects.push({ ...rng.pick(PAYLOAD) });
      const removesStatuses: StatusId[] = [];
      for (let k = rng.int(0, 2); k > 0; k--) removesStatuses.push(rng.pick(REMOVABLE));
      const flags: AbilityDef['flags'] = [];
      if (removesStatuses.length > 0) flags.push('removes-statuses');
      const def = ability({
        id: 'derived-status', formula: 'none', canMiss: false, targeting: 'single-enemy', statusEffects, removesStatuses, flags,
      });
      const sit = randomStatusSituation(rng, [def]);
      sit.userSide = 'party';
      const unwritten = viaEngine({ ...sit, def }, 1);
      const written = viaEngine({ ...sit, def: { ...def, record: writtenRecord(def, 'party') } }, 1);
      expect(unwritten, `derived ${i}: ${JSON.stringify(statusEffects)} ${JSON.stringify(removesStatuses)}`).toEqual(written);
      if (unwritten.words && JSON.stringify(unwritten.words) !== JSON.stringify(sit.words)) landed++;
    }
    expect(landed).toBeGreaterThan(100);
  });

  it('a revival of ours is the cleanse of Death: it stands a downed member up and kills a living Zombie', () => {
    const def = ability({ id: 'derived-life', formula: 'healing', power: 20, damageType: 'magical', canMiss: false, targeting: 'single-ally', flags: ['heals', 'can-target-dead'] });
    const rng = makeRng(405);
    for (let i = 0; i < 30; i++) {
      const sit = randomStatusSituation(rng, [def]);
      sit.userSide = 'party';
      const out = viaEngine({ ...sit, def }, 1);
      const was = (sit.words.perm & 1) !== 0;
      if (was) expect(out.dead, 'a downed member is stood up').toBe(false);
      else if ((sit.words.perm & 2) !== 0 && !sit.lifeImmune) expect(out.dead, 'a living Zombie dies').toBe(true);
    }
  });
});

describe('rules the generator cannot reach', () => {
  const by = (id: string): AbilityDef => ALL_ABILITIES.find((a) => a.id === id) ?? (CORE_ABILITIES.find((a) => a.id === id) as AbilityDef);

  it('Banish removes an aeon whose Aeon Ribbon would refuse any other Eject', () => {
    const rng = makeRng(5);
    const user = combatantOf(randomSide(rng, false), 'u', 'enemy');
    const aeon = combatantOf(randomSide(rng, true), 't', 'party');
    aeon.side = 'aeon';
    aeon.immunities['eject'] = 255; // the data gives every aeon this
    const { ctx } = contextOf(user, aeon, new ScriptedRng([7]), 0);
    ctx.state.aeonId = 't';
    resolveAbility(ctx, user, by('banish'), ['t']);
    expect(aeon.removed).toBe(true);
    expect(aeon.statuses['eject']).toBeDefined();
  });

  it('an ordinary Eject against that aeon is refused by its immunity', () => {
    const rng = makeRng(6);
    const user = combatantOf(randomSide(rng, false), 'u', 'enemy');
    const aeon = combatantOf(randomSide(rng, true), 't', 'party');
    aeon.side = 'aeon';
    aeon.immunities['eject'] = 255;
    const { ctx } = contextOf(user, aeon, new ScriptedRng([7]), 0);
    const eject: AbilityDef = { ...by('banish'), id: 'plain-eject', extra: {} };
    resolveAbility(ctx, user, eject, ['t']);
    expect(aeon.removed).toBe(false);
  });
});
