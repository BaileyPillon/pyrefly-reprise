/**
 * PR-0075 (critic round 08, refuted as unbuilt by the release-09 verifier): an FFX-2 heal or
 * recovery item aimed at your own side never rolls the §2.6 hit check.
 * **FFX-2 only** — FFX's `accuracy.ts` already returns ALWAYS for every non-physical action
 * [ffx-combat-core §2.11]. Preflight: `docs/plans/ffx2-item-accuracy-review.md`.
 *
 * §2.6 [research/ffx2-combat-core.md] is an attacker-versus-defender points race; no source
 * applies it to a friendly target, and the §2.9.1 tables mark every ally-support row "—" in
 * the Accuracy column. Real data, real engine, no DOM.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent, BattleSetup, Command, Decision, FFX2Combatant, FFX2PartyBuild } from '../../src/battle/common/types.ts';
import { FFX2Engine, hitPercent } from '../../src/battle/ffx2/index.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { VEGNAGUN_CHAIN_ORDER } from '../../src/data/ffx2/ids.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';

const CH5_LINK1 = VEGNAGUN_CHAIN_ORDER[0]!;

function engineFor(party: FFX2PartyBuild, groupId: string, seed: number): FFX2Engine {
  const engine = new FFX2Engine(ffx2Options());
  const setup: BattleSetup = {
    game: 'ffx2', party, enemies: data.ENEMY_GROUPS_BY_ID[groupId]!, triggers: [], seed,
    condition: 'normal', canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  return engine;
}

function girls(party: FFX2PartyBuild, groupId: string): FFX2Combatant[] {
  const st = engineFor(party, groupId, 1).state();
  return party.members.map((m) => structuredClone(st.combatants[m.id] as FFX2Combatant));
}

/** Every restorative FFX-2 player action that reaches the hit check (revives return before it). */
function restorative(): AbilityDef[] {
  return Object.values(data.ABILITIES).filter(
    (a) =>
      a.game === 'ffx2' &&
      a.category !== 'enemy' &&
      (a.flags.includes('heals') || a.formula === 'healing' || a.category === 'item') &&
      !a.flags.includes('misses-if-target-alive') &&
      a.targeting !== 'single-enemy' &&
      a.targeting !== 'all-enemies',
  );
}

function perm(id: string, stacks = 0) {
  return { id, turnsRemaining: null, ticksRemaining: null, charges: null, stacks, permanent: true } as never;
}

describe('A1 — a friendly heal or item is 100 % on self and on every ally (FFX-2)', () => {
  const heals = restorative();
  it('covers the whole restorative set (sanity)', () => {
    expect(heals.length).toBeGreaterThan(30);
    expect(heals.map((a) => a.id)).toEqual(expect.arrayContaining(['x2-white-mage-cure', 'x2-white-mage-pray', 'x2-item-potion', 'x2-item-megalixir']));
  });

  for (const [label, party, group] of [['chapter 4', bevelleBuild, 'ffx2-bahamut'], ['chapter 5', farplaneBuild, CH5_LINK1]] as const) {
    it(`${label}: every girl, every restorative action, self and allies, even blinded vs EVA Up x10`, () => {
      const members = girls(party, group);
      const under: string[] = [];
      for (const a of heals) {
        for (const u of members) {
          const blind = structuredClone(u);
          blind.statuses.darkness = perm('darkness');
          for (const t of members) {
            const dodgy = structuredClone(t);
            dodgy.statuses['eva-up'] = perm('eva-up', 10);
            for (const [uu, tt] of [[u, t], [blind, dodgy]] as const) {
              const p = hitPercent(uu, tt, a);
              if (p !== 100) under.push(`${a.id} ${uu.id}->${tt.id} ${p}%`);
            }
          }
        }
      }
      expect(under).toEqual([]);
    });
  }
});

describe('A2 — hostile actions still roll the §2.6 race', () => {
  it('a blinded girl attacking an ally (Confuse) can miss', () => {
    const [yuna, rikku] = girls(bevelleBuild, 'ffx2-bahamut');
    yuna!.statuses.darkness = perm('darkness');
    rikku!.statuses['eva-up'] = perm('eva-up', 10);
    const attack = data.ABILITIES['x2-gunner-attack'] ?? Object.values(data.ABILITIES).find((a) => a.id === 'x2-gunner-attack')!;
    expect(hitPercent(yuna!, rikku!, attack)).toBeLessThan(100);
  });
});

interface HealRun { itemUses: number; heals: number; friendlyMisses: string[] }

/** Every girl heals or Potions herself whenever she can; otherwise attacks. */
function selfHealRun(party: FFX2PartyBuild, groupId: string, seed: number): HealRun {
  const engine = engineFor(party, groupId, seed);
  const ids = new Set(party.members.map((m) => m.id));
  const out: HealRun = { itemUses: 0, heals: 0, friendlyMisses: [] };
  let seen = 0;
  for (let i = 0; i < 3000; i++) {
    const d = engine.nextDecision() as Decision;
    const log = engine.state().log as BattleEvent[];
    for (; seen < log.length; seen++) {
      const e = log[seen] as BattleEvent & { sourceId?: string; targetId?: string };
      if (e.type === 'miss' && ids.has(e.sourceId ?? '') && ids.has(e.targetId ?? '')) {
        out.friendlyMisses.push(`seed ${seed} ${e.sourceId}->${e.targetId}`);
      }
    }
    if (d.kind === 'battle-over') break;
    if (d.kind === 'waiting') { engine.tick(Math.max(1, d.nextEventMs)); continue; }
    if (d.kind !== 'player-input') continue;
    const self = d.commands.filter(
      (c) => c.enabled && c.validTargets.includes(d.actorId) &&
        (c.command.kind === 'item' || /cure|cura|pray|potion|elixir/i.test(c.label)),
    );
    const pick = i % 2 === 0 ? self.find((c) => c.command.kind === 'item') ?? self[0] : self.find((c) => c.command.kind !== 'item') ?? self[0];
    if (pick) {
      if (pick.command.kind === 'item') out.itemUses++; else out.heals++;
      engine.submit({ ...pick.command, targets: [d.actorId] } as Command);
    } else {
      const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
      engine.submit(row ? ({ ...row.command, targets: row.validTargets[0] ? [row.validTargets[0]] : [] } as Command) : ({ kind: 'defend', targets: [] } as Command));
    }
  }
  return out;
}

describe('A3 — the engine never emits a party-to-party miss for a heal or item (40 + 40 seeds)', () => {
  for (const [label, party, group] of [['chapter 4', bevelleBuild, 'ffx2-bahamut'], ['chapter 5 link 1', farplaneBuild, CH5_LINK1]] as const) {
    it(label, () => {
      let items = 0; let heals = 0; const misses: string[] = [];
      for (let seed = 1; seed <= 40; seed++) {
        const r = selfHealRun(party, group, seed);
        items += r.itemUses; heals += r.heals; misses.push(...r.friendlyMisses);
      }
      expect(items + heals).toBeGreaterThan(200); // the driver really healed
      expect(misses).toEqual([]);
    });
  }
});
