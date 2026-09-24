/**
 * **FFX-2 magic never rolls the hit check** (combat-fixes-0924 (a); AGENTS.md hard rule 5).
 *
 * `research/ffx2-combat-core.md` §2.6's hit race and every rule beside it are about physical
 * attacks, and the §2.9 magic tables carry no Accuracy column; the one magic-formula row §2.9 marks
 * `Stat` is Gunner's Enchanted Ammo, which keeps rolling. Before this fix 66 magical rows (party and
 * enemy) rolled §2.6. Real data, real engine, no DOM. Plan: `docs/plans/combat-fixes-0924-review.md`.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]; FFX's `accuracy.ts` already returns ALWAYS for every
 * non-physical action [ffx-combat-core §2.11].
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleSetup, FFX2Combatant, FFX2PartyBuild } from '../../src/battle/common/types.ts';
import { FALLBACK_ABILITY_IDS, FFX2Engine, defaultAbilities, hitPercent } from '../../src/battle/ffx2/index.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { VEGNAGUN_CHAIN_ORDER } from '../../src/data/ffx2/ids.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';
import { driveFfx2, magicMisses } from './helpers/combatFixesDrive.ts';

function engineFor(party: FFX2PartyBuild, groupId: string): FFX2Engine {
  const engine = new FFX2Engine(ffx2Options());
  const setup: BattleSetup = {
    game: 'ffx2', party, enemies: data.ENEMY_GROUPS_BY_ID[groupId]!, triggers: [], seed: 1,
    condition: 'normal', canEscape: false,
  };
  engine.setSeed(1);
  engine.init(setup);
  return engine;
}

function perm(id: string, stacks = 0) {
  return { id, turnsRemaining: null, ticksRemaining: null, charges: null, stacks, permanent: true } as never;
}

/** A blinded copy with ACCU Down x10: the worst attacker the race can see. */
function worstAttacker(c: FFX2Combatant): FFX2Combatant {
  const u = structuredClone(c);
  u.statuses.darkness = perm('darkness');
  u.statuses['accu-down'] = perm('accu-down', 10);
  return u;
}

/** An EVA Up x10 copy with a huge Evasion: the dodgiest target the race can see. */
function dodgiest(c: FFX2Combatant): FFX2Combatant {
  const t = structuredClone(c);
  t.stats.eva = 255;
  t.statuses['eva-up'] = perm('eva-up', 10);
  return t;
}

/** Every magical row either registry can resolve (the data table first, as the engine does). */
function magicalRows(): AbilityDef[] {
  const fallbackOnly = FALLBACK_ABILITY_IDS.filter((id) => !(id in data.ABILITIES)).map((id) => defaultAbilities.get(id)!);
  return [...Object.values(data.ABILITIES), ...fallbackOnly].filter((a) => a.damageType === 'magical');
}

const LINK1 = VEGNAGUN_CHAIN_ORDER[0]!;

describe('(a) magic never rolls §2.6, on either side (FFX-2)', () => {
  const st = engineFor(farplaneBuild, LINK1).state();
  const girls = farplaneBuild.members.map((m) => st.combatants[m.id] as FFX2Combatant);
  const foes = Object.values(st.combatants).filter((c) => c.side === 'enemy') as FFX2Combatant[];
  const rows = magicalRows().filter((a) => a.canMiss !== true && typeof a.accuracy !== 'number');

  it('covers the set the Fallen Aeons repair found (sanity)', () => {
    expect(rows.length).toBeGreaterThan(80);
    expect(rows.map((a) => a.id)).toEqual(
      expect.arrayContaining(['x2-black-mage-firaga', 'x2-shared-holy', 'x2-shared-flare', 'x2-shared-ultima', 'x2-dark-knight-drain', 'force-rain', 'pallida-mors']),
    );
    expect(girls.length).toBe(3);
    expect(foes.length).toBeGreaterThan(0);
  });

  it('a blinded girl at ACCU Down x10 lands every magical row on an EVA 255, EVA Up x10 enemy', () => {
    const under: string[] = [];
    for (const a of rows) for (const g of girls) for (const f of foes) {
      const p = hitPercent(worstAttacker(g), dodgiest(f), a);
      if (p !== 100) under.push(`${a.id} ${g.id}->${f.id} ${p}%`);
    }
    expect(under).toEqual([]);
  });

  it('an enemy lands every magical row on an EVA 255, EVA Up x10 girl', () => {
    const under: string[] = [];
    for (const a of rows) for (const f of foes) for (const g of girls) {
      const p = hitPercent(worstAttacker(f), dodgiest(g), a);
      if (p !== 100) under.push(`${a.id} ${f.id}->${g.id} ${p}%`);
    }
    expect(under).toEqual([]);
  });
});

describe('(a) what still rolls', () => {
  const st = engineFor(farplaneBuild, LINK1).state();
  const girl = st.combatants[farplaneBuild.members[0]!.id] as FFX2Combatant;
  const foe = Object.values(st.combatants).find((c) => c.side === 'enemy') as FFX2Combatant;

  it("Enchanted Ammo, the §2.9 `Stat` row, still races (the one sourced magic-formula exception)", () => {
    const ammo = data.ABILITIES['x2-gunner-enchanted-ammo']!;
    expect(ammo.damageType).toBe('magical');
    expect(ammo.canMiss).toBe(true);
    expect(hitPercent(worstAttacker(girl), dodgiest(foe), ammo)).toBeLessThan(100);
  });

  it('a physical Attack still races', () => {
    const attack = data.ABILITIES['x2-gunner-attack']!;
    expect(attack.damageType).toBe('physical');
    expect(hitPercent(worstAttacker(girl), dodgiest(foe), attack)).toBeLessThan(100);
  });

  it('a numeric accuracy is still the flat override §2.9 says it is', () => {
    const firaga = data.ABILITIES['x2-black-mage-firaga']!;
    expect(hitPercent(girl, foe, { ...firaga, accuracy: 70 })).toBe(70);
  });
});

describe('(a) the engine emits no evaded magic (Chapters IV-VI, 20 seeds each, the intended line)', () => {
  for (const chapter of [4, 5, 6] as const) {
    it(`Chapter ${chapter}`, () => {
      let evaded = 0;
      let landed = 0;
      for (let seed = 1; seed <= 20; seed++) {
        const m = magicMisses(driveFfx2(chapter, seed, intendedStrategy).logs);
        evaded += m.partyMagicEvaded + m.enemyMagicEvaded;
        landed += m.partyMagicLanded + m.enemyMagicLanded;
      }
      expect(landed).toBeGreaterThan(0); // magic really was cast
      expect(evaded).toBe(0);
    }, 120_000);
  }
});
