/**
 * **Seymour Natus and Mortibody, the Highbridge** — phases 2 and 3, Banish,
 * Desperado, Talk, and the FFX-only absence tests: the second half of the
 * mechanic units from `docs/plans/chapter-natus-review.md` §9, split out of
 * natus-engine.test.ts (house rule 7, files under 400 lines). Shared fixtures
 * live in `tests/unit/helpers/natusUnits.ts`.
 *
 * Every case pins one research claim against the real engine and the real
 * data. Nothing greps: hard rule 3 says prove it by running the engine.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The last describe block holds
 * the absence tests the rule requires.
 */

import { describe, expect, it } from 'vitest';
import type { Command } from '../../../src/battle/common/types.ts';
import { createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { highbridgeBuild } from '../../../src/data/ffx/builds/highbridge.ts';
import { CHAPTERS } from '../../../src/data/encounters.ts';
import * as rules from '../../../src/battle/ffx/ai/seymour-natus-rules.ts';
import { ALL_ABILITIES as FFX2_ABILITIES } from '../../../src/data/ffx2/index.ts';
import {
  GROUP_ID,
  NATUS,
  MORT,
  content,
  newEngine,
  defend,
  drive,
  nextInput,
  actor,
  makeInvincible,
  status,
  actions,
  flags,
} from '../helpers/natusUnits.ts';

// ---------------------------------------------------------------------------
// Phases 2 and 3, Break and shatter, Cura
// ---------------------------------------------------------------------------

describe('Phase 2 — Break and Shattering Claw [§4.1, §5]', () => {
  it('Natus casts Break and Mortibody the Claw every turn; the Claw shatters a petrified member at about 90 %', () => {
    let clawsOnStone = 0;
    let shattered = 0;
    for (let seed = 1; seed <= 120; seed++) {
      const engine = newEngine(seed);
      makeInvincible(engine);
      flags(engine)[rules.NATUS_PHASE] = 2;
      actor(engine, 'kimahri').statuses.petrify = status('petrify');
      drive(engine, defend, (e) => actions(e.state().log, MORT).length >= 1);
      const log = engine.state().log;
      expect(actions(log, MORT)[0]).toBe('mortibody-shattering-claw');
      for (const a of actions(log, NATUS)) expect(a).toBe('natus-break');
      const at = log.findIndex((x) => x.type === 'action-start' && x.actorId === MORT);
      const end = log.findIndex((x, j) => j > at && x.type === 'action-end');
      const slice = log.slice(at, end + 1);
      const hitKimahri = slice.some((x) => (x.type === 'damage' || x.type === 'miss') && x.targetId === 'kimahri');
      if (!hitKimahri || !slice.some((x) => x.type === 'damage' && x.targetId === 'kimahri')) continue;
      clawsOnStone++;
      if (slice.some((x) => x.type === 'status-add' && x.targetId === 'kimahri' && x.status === 'eject')) shattered++;
    }
    expect(clawsOnStone).toBeGreaterThan(15);
    const rate = shattered / clawsOnStone;
    expect(rate).toBeGreaterThan(0.75);
    expect(rate).toBeLessThan(1);
  });

  it('a shattered member is gone for the battle and no Switch refills the slot', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const engine = newEngine(seed);
      makeInvincible(engine);
      flags(engine)[rules.NATUS_PHASE] = 2;
      actor(engine, 'kimahri').statuses.petrify = status('petrify');
      drive(engine, defend, (e) => actor(e, 'kimahri').statuses.eject !== undefined || actions(e.state().log, MORT).length >= 1);
      if (actor(engine, 'kimahri').statuses.eject === undefined) continue;
      expect(actor(engine, 'kimahri').removed).toBe(true);
      // For the rest of a long run: Kimahri never takes a turn again, and every
      // Switch row offered swaps out the member whose turn it is — never the
      // hole Kimahri left (`commands.ts`: `outId` is always the acting member).
      const from = engine.state().log.length;
      let offered = 0;
      drive(engine, (d) => {
        for (const c of d.commands) {
          if (c.command.kind !== 'switch') continue;
          offered++;
          expect(c.command.extra).toMatchObject({ outId: d.actorId });
          expect(d.actorId).not.toBe('kimahri');
        }
        return defend();
      }, (e) => e.state().log.length - from > 400);
      expect(offered).toBeGreaterThan(0);
      expect(engine.state().log.slice(from).some((e) => e.type === 'turn-start' && e.actorId === 'kimahri')).toBe(false);
      expect(actor(engine, 'kimahri').statuses.eject).toBeDefined();
      return;
    }
    throw new Error('no seed shattered Kimahri');
  });

  it('Break reflected off a Reflected member misses both enemies: they are Petrify-immune', () => {
    const engine = newEngine(11);
    makeInvincible(engine);
    flags(engine)[rules.NATUS_PHASE] = 2;
    for (const id of engine.state().activeIds) actor(engine, id).statuses.reflect = status('reflect');
    drive(engine, defend, (e) => actions(e.state().log, NATUS).length >= 2);
    expect(actor(engine, NATUS).statuses.petrify).toBeUndefined();
    expect(actor(engine, MORT).statuses.petrify).toBeUndefined();
    for (const id of engine.state().activeIds) expect(actor(engine, id).statuses.petrify).toBeUndefined();
  });
});

describe('Phase 3 — Flare and Cura [§4.1, §4.3]', () => {
  it('Natus casts Flare (rank 5) and Mortibody casts Cura on him', () => {
    const engine = newEngine(12);
    makeInvincible(engine);
    flags(engine)[rules.NATUS_PHASE] = 3;
    actor(engine, NATUS).hp = 10_000;
    drive(engine, defend, (e) => actions(e.state().log, NATUS).length >= 2 && actions(e.state().log, MORT).length >= 2);
    const log = engine.state().log;
    expect(new Set(actions(log, NATUS))).toEqual(new Set(['natus-flare']));
    expect(new Set(actions(log, MORT))).toEqual(new Set(['mortibody-cura']));
    // A heal is a negative `damage` event; §3.3: 1,200 (1,125-1,270) at Magic 20.
    const heals = log.filter((e) => e.type === 'damage' && e.sourceId === MORT && e.amount < 0);
    expect(heals.length).toBeGreaterThan(0);
    for (const h of heals) if (h.type === 'damage') {
      expect(h.targetId).toBe(NATUS);
      expect(-h.amount).toBeGreaterThanOrEqual(1_125);
      expect(-h.amount).toBeLessThanOrEqual(1_270);
    }
  });

  it('a Reflect on Natus bounces Mortibody’s Cura onto the party (strategy 5)', () => {
    const engine = newEngine(13);
    makeInvincible(engine);
    flags(engine)[rules.NATUS_PHASE] = 3;
    actor(engine, NATUS).hp = 10_000;
    actor(engine, NATUS).statuses.reflect = status('reflect');
    drive(engine, defend, (e) => actions(e.state().log, MORT).length >= 1);
    const heals = engine.state().log.filter((e) => e.type === 'damage' && e.sourceId === MORT && e.amount < 0);
    expect(heals.length).toBeGreaterThan(0);
    for (const h of heals) if (h.type === 'damage') expect(['tidus', 'yuna', 'kimahri']).toContain(h.targetId);
    expect(actor(engine, NATUS).hp).toBe(10_000);
  });
});

// ---------------------------------------------------------------------------
// Banish, Desperado, Talk, and what fails
// ---------------------------------------------------------------------------

describe('Banish, Desperado and Talk [§4.3, §6.2]', () => {
  it('an aeon gets exactly one turn, then Natus Banishes it', () => {
    const engine = newEngine(14);
    makeInvincible(engine);
    drive(engine, (d) => {
      if (d.actorId === 'yuna' && !engine.state().aeonId && !engine.state().log.some((e) => e.type === 'summon')) {
        return { kind: 'summon', id: 'ifrit', targets: [] };
      }
      return defend();
    }, (e) => e.state().log.some((x) => x.type === 'action-start' && x.actorId === NATUS && x.abilityId === 'banish'));
    const log = engine.state().log;
    const summoned = log.findIndex((e) => e.type === 'summon');
    const banished = log.findIndex((e) => e.type === 'action-start' && e.actorId === NATUS && e.abilityId === 'banish');
    expect(summoned).toBeGreaterThan(-1);
    expect(banished).toBeGreaterThan(summoned);
    const aeonTurns = log.slice(summoned, banished).filter((e) => e.type === 'turn-start' && e.actorId === 'ifrit').length;
    expect(aeonTurns).toBe(1);
    expect(engine.state().aeonId).toBeNull();
  });

  it('Haste on all three active members calls Desperado: 468-529 to each, the §3.2 strip list, Shell ignored', () => {
    const engine = newEngine(15);
    makeInvincible(engine);
    for (const id of engine.state().activeIds) {
      const c = actor(engine, id);
      for (const s of ['haste', 'shell', 'protect', 'regen', 'nulblaze'] as const) c.statuses[s] = status(s);
    }
    drive(engine, defend, (e) => actions(e.state().log, MORT).length >= 1);
    const log = engine.state().log;
    expect(actions(log, MORT)[0]).toBe('mortibody-desperado');
    const hits = log.filter((e) => e.type === 'damage' && e.sourceId === MORT);
    expect(hits).toHaveLength(3);
    for (const h of hits) if (h.type === 'damage') {
      expect(h.amount).toBeGreaterThanOrEqual(468);
      expect(h.amount).toBeLessThanOrEqual(529);
    }
    for (const id of engine.state().activeIds) {
      const c = actor(engine, id);
      for (const s of ['haste', 'shell', 'protect', 'regen', 'nulblaze'] as const) expect(c.statuses[s], `${id} ${s}`).toBeUndefined();
    }
  });

  it('Haste on two is safe (strategy 7): no Desperado', () => {
    const engine = newEngine(15);
    makeInvincible(engine);
    for (const id of engine.state().activeIds.slice(0, 2)) actor(engine, id).statuses.haste = status('haste');
    drive(engine, defend, (e) => actions(e.state().log, MORT).length >= 3);
    expect(actions(engine.state().log, MORT)).not.toContain('mortibody-desperado');
  });

  it('Talk: Tidus and Auron +10 Strength, Yuna +10 Magic Defense, once each; Kimahri has no line', () => {
    const engine = newEngine(16);
    makeInvincible(engine);
    const before = { tidus: actor(engine, 'tidus').stats.str, yuna: actor(engine, 'yuna').stats.mdef };
    const talked = new Set<string>();
    drive(engine, (d) => {
      const talk = d.commands.find((c) => c.command.kind === 'trigger' && 'id' in c.command && c.command.id === 'talk');
      if (d.actorId === 'kimahri') expect(talk?.enabled ?? false).toBe(false);
      if (talk?.enabled && !talked.has(d.actorId)) {
        talked.add(d.actorId);
        return talk.command;
      }
      if (talked.has(d.actorId)) expect(talk?.enabled ?? false).toBe(false);
      return defend();
    }, () => talked.has('tidus') && talked.has('yuna') && engine.state().log.filter((e) => e.type === 'turn-start' && e.actorId === 'yuna').length >= 2);
    expect(actor(engine, 'tidus').stats.str).toBe(before.tidus + 10);
    expect(actor(engine, 'yuna').stats.mdef).toBe(before.yuna + 10);
    expect(rules.NATUS_TALK_BONUS).toEqual({
      tidus: { stat: 'str', amount: 10, label: 'Strength' },
      auron: { stat: 'str', amount: 10, label: 'Strength' },
      yuna: { stat: 'mdef', amount: 10, label: 'Magic Defense' },
    });
  });

  it('Threaten and Magic Break fail on Natus, and nobody can flee', () => {
    const engine = newEngine(17);
    makeInvincible(engine);
    const d = nextInput(engine);
    // Whoever is up casts the probes through the engine; the rows need not be in their menu.
    void d;
    const plan: Command[] = [
      { kind: 'ability', id: 'threaten', targets: [NATUS] },
      { kind: 'ability', id: 'magic-break', targets: [NATUS] },
      { kind: 'escape', targets: [], extra: { mode: 'party' } },
    ];
    engine.submit(plan[0]!);
    let i = 1;
    drive(engine, () => plan[i++] ?? defend(), () => i > plan.length);
    expect(actor(engine, NATUS).statuses.threaten).toBeUndefined();
    expect(actor(engine, NATUS).statuses['magic-break']).toBeUndefined();
    expect(engine.state().result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Absence tests [AGENTS.md rule 14, CHK-021]
// ---------------------------------------------------------------------------

describe('FFX only: nothing here reaches another chapter or FFX-2', () => {
  it('only Natus’s Multi-ra carries distinct targets per hit; no other formation runs a Natus script', () => {
    const distinct = ALL_ABILITIES.filter((a) => a.extra?.['distinctTargetsPerHit'] === true).map((a) => a.id).sort();
    expect(distinct).toEqual(['natus-multi-blizzara', 'natus-multi-fira', 'natus-multi-thundara', 'natus-multi-watera']);
    expect(FFX2_ABILITIES.some((a) => a.extra?.['distinctTargetsPerHit'] !== undefined)).toBe(false);
    for (const [id, group] of Object.entries(ENEMY_GROUPS_BY_ID)) {
      if (id === GROUP_ID) continue;
      for (const e of group.enemies) expect(rules.isNatusScript(e.aiScriptId), `${id}/${e.id}`).toBe(false);
    }
  });

  it('every other FFX chapter keeps its natus.* flags empty through a seeded run', () => {
    for (const ch of CHAPTERS.filter((c) => c.game === 'ffx' && c.id !== 'seymour-natus')) { // Chapter X itself is listed (2026-09-25)
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.init({ game: 'ffx', party: ch.buildRef as typeof highbridgeBuild, enemies: ch.enemyGroupRef, triggers: [], seed: 1, condition: 'normal', canEscape: false });
      drive(engine, defend, (e) => e.state().turn > 40);
      expect(Object.keys(engine.state().flags).filter((k) => k.startsWith('natus.')), ch.id).toEqual([]);
    }
  });
});
