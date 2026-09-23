/**
 * PR-0086 (critic round 09): Leblanc's White Wind must heal and cure the
 * Syndicate, and their percentage-damage immunity must stay an immunity to
 * **damage**.
 *
 * Sources:
 * - `research/ffx2-leblanc-syndicate.md` §4.4 (White Wind: "Recovery, enemy
 *   party": restores 1/8 of max HP to the enemy party and cures all their
 *   negative statuses, [verified: 2 sources]) and §5.4 fact 3 (with both
 *   henchmen dead she heals and wipes the party's Darkness).
 * - §3.1-3.3: the trio's immunity is "Gravity/fractional", a **status**
 *   immunity to fractional (gravity-type) damage.
 * - `research/ffx2-combat-core.md` §2.1 step 20, "Damage immunity":
 *   "fractional vs fractional-immune -> IMMUNE". A heal is not damage.
 * - Step 7 (the randomiser) applies to everything except menu-cast White
 *   Magic, so 1/8 of max HP lands inside `x rand(240..271)/256`.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Every claim is run, not
 * grepped [hard rule 3].
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent, Command, EnemyDef } from '../../../src/battle/common/types.ts';
import { SeededRng } from '../../../src/battle/common/rng.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../../src/battle/ffx2/index.ts';
import { resolveAbility } from '../../../src/battle/ffx2/resolve.ts';
import type { ResolveContext } from '../../../src/battle/ffx2/resolve.ts';
import { computeDamage } from '../../../src/battle/ffx2/formulas.ts';
import { aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import type { Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { applyStatus } from '../../../src/battle/ffx2/statuses.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { chateauBuild } from '../../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_ACT_III } from '../../../src/data/ffx2/enemies/leblanc-syndicate.ts';

const REGISTRY = abilityRegistryFrom(Object.values(data.ABILITIES));
const WHITE_WIND = 'x2-leblanc-white-wind';

function ability(id: string): AbilityDef {
  const found = REGISTRY.get(id);
  if (!found) throw new Error(`${id} is not in the shipped ability table`);
  return found;
}

function actIII(id: string): EnemyDef {
  const def = data.ENEMY_GROUPS_BY_ID[LEBLANC_ACT_III]?.enemies.find((e) => e.id === id);
  if (!def) throw new Error(`${id} is not in the Act III group`);
  return def;
}

/** A unit carrying the shipped record's HP, level, immunities and flags. */
function syndicateUnit(id: string, slot: number): Ffx2Unit {
  const def = actIII(id);
  const unit = aiUnit(id, 'enemy', def.stats.hp, slot);
  unit.level = def.level ?? unit.level;
  unit.immunities = { ...def.immunities };
  unit.immunityFlags = [...def.immunityFlags];
  unit.affinities = { ...def.affinities };
  return unit;
}

function ctxFor(units: Ffx2Unit[], seed: number): { ctx: ResolveContext; events: BattleEvent[] } {
  const events: BattleEvent[] = [];
  const ctx: ResolveContext = {
    units,
    abilities: REGISTRY,
    rng: new SeededRng(seed),
    emit: (e: unknown) => events.push(e as BattleEvent),
    breaksDamageLimit: () => false,
  };
  return { ctx, events };
}

/** 1/8 of max HP through the step-7 randomiser, truncated as the engine does. */
function whiteWindBand(maxHp: number): [number, number] {
  const eighth = (maxHp * 2) / 16;
  return [Math.trunc((eighth * 240) / 256), Math.trunc((eighth * 271) / 256)];
}

describe('PR-0086: White Wind restores and cures the Syndicate [§4.4, §5.4 fact 3]', () => {
  it('ships the trio flagged immune to percentage damage, so the test exercises the real flag [§3.1-3.3]', () => {
    for (const id of ['leblanc', 'ormi', 'logos']) {
      expect(actIII(id).immunityFlags).toContain('immune-to-percentage-damage');
    }
  });

  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    it(`heals 1/8 max HP and removes Darkness on every living member, with no IMMUNE miss (seed ${seed})`, () => {
      const leblanc = syndicateUnit('leblanc', 0);
      const ormi = syndicateUnit('ormi', 1);
      const logos = syndicateUnit('logos', 2);
      leblanc.hp = 690;
      ormi.hp = 672;
      logos.hp = 0;
      logos.alive = false;
      for (const u of [leblanc, ormi]) applyStatus(u, { status: 'darkness', chance: 255, duration: 255 });

      const { ctx, events } = ctxFor([leblanc, ormi, logos], seed);
      resolveAbility(ctx, leblanc, ability(WHITE_WIND), []);

      expect(events.filter((e) => e.type === 'miss')).toEqual([]);
      for (const [unit, before] of [[leblanc, 690], [ormi, 672]] as const) {
        const [lo, hi] = whiteWindBand(unit.stats.maxHp);
        const healed = unit.hp - before;
        expect(healed, `${unit.id} healed`).toBeGreaterThanOrEqual(lo);
        expect(healed, `${unit.id} healed`).toBeLessThanOrEqual(hi);
        expect(unit.statuses.darkness, `${unit.id} darkness`).toBeUndefined();
        expect(
          events.some((e) => e.type === 'status-remove' && e.targetId === unit.id && e.status === 'darkness'),
        ).toBe(true);
      }
      // A dead henchman is not revived by a heal.
      expect(logos.alive).toBe(false);
      expect(logos.hp).toBe(0);
    });
  }

  it('the percentage-damage immunity still stops percentage damage on the trio [combat-core §2.1 step 20]', () => {
    // Quarter Pounder with its gravity element removed, so only the
    // fractional-immunity clause can answer (Leblanc is also Gravity-immune).
    const fractional: AbilityDef = { ...ability('x2-gunner-quarter-pounder'), element: ['none'] };
    const girl = aiUnit('paine', 'party', 1000);
    for (const id of ['leblanc', 'ormi', 'logos']) {
      const target = syndicateUnit(id, 0);
      const result = computeDamage({
        user: girl,
        target,
        ability: fractional,
        chainCount: 0,
        crit: false,
        randomRoll: 256,
      });
      expect(result.immune, id).toBe(true);
      expect(result.amount, id).toBe(0);
    }
  });

  it('a percent-total heal on a fractional-immune target is not immune, and heals (negative amount)', () => {
    const leblanc = syndicateUnit('leblanc', 0);
    const result = computeDamage({
      user: leblanc,
      target: leblanc,
      ability: ability(WHITE_WIND),
      chainCount: 0,
      crit: false,
      randomRoll: 256,
    });
    expect(result.immune).toBe(false);
    expect(result.amount).toBe(-172); // trunc(1380 * 2 / 16) at the neutral roll
  });
});

// ---------------------------------------------------------------------------

describe('PR-0086 on the real engine: a seeded Act III where Leblanc reaches White Wind', () => {
  it('every White Wind cast heals each living Syndicate member and emits no IMMUNE miss (seeds 1-20)', () => {
    let casts = 0;
    let heals = 0;
    let expectedHeals = 0;
    let immune = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const engine = new FFX2Engine({
        abilities: REGISTRY,
        items: itemRegistryFrom(Object.values(data.ITEMS)),
        dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
        garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
        minigames: false,
      } as never);
      const group = data.ENEMY_GROUPS_BY_ID[LEBLANC_ACT_III];
      if (!group) throw new Error('Act III group missing');
      engine.setSeed(seed);
      engine.init({ game: 'ffx2', party: chateauBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
      // The round-09 probe's driver: kill Logos (arming the White Wind branch,
      // §5.3 turn 4B), chip Leblanc below 70 %, then only Defend.
      for (let i = 0; i < 4000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') {
          engine.tick(Math.max(1, d.nextEventMs));
          continue;
        }
        if (d.kind !== 'player-input') continue;
        const st = engine.state();
        const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
        const leb = st.combatants['leblanc'];
        let cmd: Command = { kind: 'defend', targets: [] } as Command;
        if (row && st.combatants['logos']?.alive && row.validTargets.includes('logos')) {
          cmd = { ...row.command, targets: ['logos'] } as Command;
        } else if (row && leb && leb.hp > leb.stats.maxHp * 0.7 && row.validTargets.includes('leblanc')) {
          cmd = { ...row.command, targets: ['leblanc'] } as Command;
        }
        if (engine.submit(cmd).length === 0) engine.submit({ kind: 'defend', targets: [] } as Command);
        if (engine.state().ticks / 3000 > 240) break;
      }
      const log = engine.state().log as unknown as Array<Record<string, unknown>>;
      for (let i = 0; i < log.length; i++) {
        const ev = log[i]!;
        if (ev['type'] !== 'action-start' || ev['abilityId'] !== WHITE_WIND) continue;
        casts += 1;
        const hits: Array<Record<string, unknown>> = [];
        // The cast charges (§5.2 medium tier), so other actors' actions
        // interleave; the resolution ends at Leblanc's own action-end.
        for (let j = i + 1; j < log.length; j++) {
          if (log[j]!['type'] === 'action-end' && log[j]!['actorId'] === 'leblanc') break;
          const x = log[j]!;
          if (x['sourceId'] === 'leblanc' && (x['type'] === 'miss' || x['type'] === 'damage')) hits.push(x);
        }
        expectedHeals += hits.length;
        for (const x of hits) {
          if (x['type'] === 'miss' && x['reason'] === 'immune') immune += 1;
          if (x['type'] === 'damage' && Number(x['amount']) < 0) heals += 1;
        }
      }
    }
    expect(casts).toBeGreaterThan(0);
    expect(immune).toBe(0);
    expect(heals).toBeGreaterThan(0);
    expect(heals).toBe(expectedHeals);
  });
});
