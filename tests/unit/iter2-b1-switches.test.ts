/**
 * Iteration 2 batch B1: the FFX-2 sourced switches, built **OFF** for Bailey (plan §8 Q4) and
 * measured in `tests/unit/iter2-b1-bench.test.ts`. **FFX-2 only** (AGENTS.md rule 14): chains,
 * dresspheres and the Leblanc Syndicate exist only in FFX-2's battle system.
 *
 * - PR-0106: Leblanc's failsafe fires **once**, on her turn 25 + No Love Lost uses, and turn 5 of
 *   her loop is Fan Slap (`research/ffx2-leblanc-syndicate.md` §19.2 and §19.3: SinirothX, GameFAQs
 *   FAQ 31807, GameFAQs' reading, our estimate; it conflicts with the wiki's "Turn 5: Repeat Turn 1").
 * - IC-1 / PR-0209: an immune hit opens no chain (`research/ffx2-combat-core.md` §10.1).
 * - PR-0124: the dressphere carries across a chain seam, gates and the special unlock do not
 *   (`research/ffx2-combat-core.md` §10.2, KADFC FAQ 38278, our estimate).
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { aiHarness, aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import { IMMUNE_HITS_SKIP_CHAIN, LEBLANC_SCRIPT_SINIROTHX } from '../../src/battle/ffx2/constants.ts';
import type { BattleSetup, FFX2Combatant, FFX2PartyBuild } from '../../src/battle/common/types.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { buildState, gridNodeContents } from '../../src/battle/ffx2/setup.ts';
import { ENEMY_GROUPS_BY_ID, GARMENT_GRIDS } from '../../src/data/ffx2/index.ts';
import { chateauBuild } from '../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_ACT_I, LEBLANC_ACT_II } from '../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { FFX2_DRESSPHERE_CARRIES } from '../../src/app/screens/BattleScreenCarry.ts';
import { checkpointAt } from '../../src/app/screens/BattleChainCheckpoint.ts';
import { shuyinGroup } from '../../src/data/ffx2/enemies/shuyin.ts';
import { VEGNAGUN_CHAIN_ORDER } from '../../src/data/ffx2/ids.ts';
import { macalaniaBuild } from '../../src/data/ffx/builds/macalania.ts';
import { fahrenheitBuild } from '../../src/data/ffx/builds/fahrenheit.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { ABILITIES } from '../../src/data/ffx2/index.ts';
import { abilityRegistryFrom } from '../../src/battle/ffx2/index.ts';
import { chainRegistries, defaultAbilities } from '../../src/battle/ffx2/abilities.ts';
import { resolveAbility, type ResolveContext } from '../../src/battle/ffx2/resolve.ts';

function leblancTurns(count: number, sinirothX: boolean, withHenchmen = true): Array<string | null> {
  const self = aiUnit('leblanc', 'enemy', 1380);
  self.level = 23;
  const others = withHenchmen ? [aiUnit('ormi', 'enemy', 1344, 1), aiUnit('logos', 'enemy', 989, 2)] : [aiUnit('ormi', 'enemy', 1344, 1)];
  const h = aiHarness(self, others, 'ffx2-leblanc');
  if (sinirothX) h.flags['leblancScriptSinirothX'] = true;
  return h.run(count);
}

const GUARD = 'x2-leblanc-not-so-mighty-guard';

describe('PR-0106: the Leblanc script switch (FFX-2, Chapter VI)', () => {
  it('ships OFF (Bailey decides with the measurement, plan §8 Q4)', () => {
    expect(LEBLANC_SCRIPT_SINIROTHX).toBe(false);
  });

  it('OFF keeps the AUTHORED reading exactly: guard on turn 5, and every turn past 25 + uses', () => {
    const picks = leblancTurns(40, false);
    expect(picks[4]).toBe(GUARD);
    expect(picks.slice(29, 34)).toEqual([GUARD, GUARD, GUARD, GUARD, GUARD]);
  });

  it('ON, SinirothX turn 5 is Fan Slap on a random girl (§19.3)', () => {
    const picks = leblancTurns(12, true);
    expect(picks[0]).toBe(GUARD);
    expect(picks[1]).toBe('x2-leblanc-fan-slap');
    expect(picks[4]).toBe('x2-leblanc-fan-slap');
    expect(picks[9]).toBe('x2-leblanc-fan-slap'); // turn 10 = step 5 of the second loop
  });

  it('ON, the failsafe guard fires once, on turn 25 + uses: 29 with both henchmen (§19.2)', () => {
    const picks = leblancTurns(60, true);
    const guards = picks.map((p, i) => (p === GUARD ? i + 1 : 0)).filter(Boolean);
    // Turn 1 (the loop's opener) and turn 29 (No Love Lost on 3, 11, 19, 27 = four uses): nothing else.
    expect(guards).toEqual([1, 29]);
    const nll = picks.map((p, i) => (p === 'x2-nll-1' ? i + 1 : 0)).filter(Boolean);
    expect(nll).toEqual([3, 11, 19, 27, 35, 43, 51, 59]);
  });

  it('ON, with a henchman down early the failsafe comes at 25 (no No Love Lost at all)', () => {
    const picks = leblancTurns(40, true, false);
    const guards = picks.map((p, i) => (p === GUARD ? i + 1 : 0)).filter(Boolean);
    expect(guards).toEqual([1, 25]);
  });
});

describe('IC-1: the immune-hit chain switch stays OFF (FFX-2)', () => {
  it('ships OFF; its reading is labelled GameFAQs (Split_Infinity G1032), our estimate', () => {
    expect(IMMUNE_HITS_SKIP_CHAIN).toBe(false);
  });
});

describe('PR-0124: the worn dressphere carries across a plain chain seam, an OFF switch (FFX-2)', () => {
  const nodesOf = (m: { garmentGrid: { id: string } }) =>
    Math.max(2, Math.min(6, (GARMENT_GRIDS as Record<string, { nodeCount: number }>)[m.garmentGrid.id]!.nodeCount));

  /** Act I of Chapter VI with Rikku moved onto another node of her grid, a gate passed and a special unlocked. */
  function actOneEnd(): { setup: BattleSetup; state: ReturnType<FFX2Engine['state']>; worn: string; node: number } {
    const engine = new FFX2Engine({ atbMode: 'wait' });
    const setup: BattleSetup = { game: 'ffx2', party: chateauBuild, enemies: ENEMY_GROUPS_BY_ID[LEBLANC_ACT_I]!, triggers: [], seed: 4, condition: 'normal', canEscape: false };
    engine.setSeed(4);
    engine.init(setup);
    const build = chateauBuild.members[1];
    const layout = gridNodeContents(build, nodesOf(build));
    const node = layout.findIndex((d, i) => i > 0 && d !== null);
    const rikku = engine.state().combatants['rikku'] as FFX2Combatant;
    rikku.dresspheres!.current = layout[node]!;
    rikku.dresspheres!.garmentGrid.nodePosition = node;
    rikku.dresspheres!.garmentGrid.passedGates = ['blue'];
    rikku.dresspheres!.garmentGrid.wornThisBattle = [build.currentDressphere, layout[node]!];
    return { setup, state: engine.state(), worn: layout[node]!, node };
  }

  it('ships OFF', () => {
    expect(FFX2_DRESSPHERE_CARRIES).toBe(false);
  });

  it('OFF: the next Act reverts her to the dressphere set before the fight, as today', () => {
    const { setup, state } = actOneEnd();
    const next = setupForNextLink(setup, ENEMY_GROUPS_BY_ID[LEBLANC_ACT_II]!, state, 5);
    const rikku = (next.party as FFX2PartyBuild).members[1];
    expect(rikku.currentDressphere).toBe(chateauBuild.members[1].currentDressphere);
    expect(rikku.garmentGrid.passedGates).toEqual([]);
  });

  it('ON: she starts the next Act in what she wore, on the same grid layout; gates and the worn list do not carry', () => {
    const { setup, state, worn, node } = actOneEnd();
    const next = setupForNextLink(setup, ENEMY_GROUPS_BY_ID[LEBLANC_ACT_II]!, state, 5, { dressphereCarries: true });
    const rikku = (next.party as FFX2PartyBuild).members[1];
    expect(rikku.currentDressphere).toBe(worn);
    expect(rikku.garmentGrid.nodePosition).toBe(node);
    expect(rikku.garmentGrid.passedGates).toEqual([]);
    expect(rikku.garmentGrid.wornThisBattle).toEqual([]);
    const built = buildState(next, {}, new SeededRng(5));
    expect(built.gridNodes['rikku']).toEqual(gridNodeContents(chateauBuild.members[1], nodesOf(chateauBuild.members[1])));
    expect((built.state.combatants['rikku'] as FFX2Combatant).dresspheres?.current).toBe(worn);
    // Her statuses do not ride along on a plain seam (only XIII and XV carry them, each its own approved rule).
    expect(rikku.statuses).toBeUndefined();
  });

  it('ON: a girl in a special dressphere at the seam keeps the preset (an engine choice, unsourced)', () => {
    const { setup, state } = actOneEnd();
    const rikku = state.combatants['rikku'] as FFX2Combatant;
    rikku.dresspheres!.special = true as never;
    const next = setupForNextLink(setup, ENEMY_GROUPS_BY_ID[LEBLANC_ACT_II]!, state, 5, { dressphereCarries: true });
    expect((next.party as FFX2PartyBuild).members[1].currentDressphere).toBe(chateauBuild.members[1].currentDressphere);
  });

  it('XIII and XV keep their own approved carries whether the switch is on or off', () => {
    const { setup, state } = actOneEnd();
    const trema = { ...ENEMY_GROUPS_BY_ID[LEBLANC_ACT_II]!, carriesPartyState: true };
    const off = setupForNextLink(setup, trema, state, 5);
    const on = setupForNextLink(setup, trema, state, 5, { dressphereCarries: true });
    expect(on).toEqual(off);
  });
});

describe('Acta F4 guard: both Acta Est Fabula rows hit only the ids named, the two Redoubts (FFX-2, D-193)', () => {
  it('the data row carries namedTargetsOnly, as the engine row does', () => {
    expect(ABILITIES['x2-vegnagun-acta-est-fabula']?.extra?.['namedTargetsOnly']).toBe(true);
    expect(defaultAbilities.get('acta-est-fabula')?.extra?.['namedTargetsOnly']).toBe(true);
  });

  it('resolved from the data row, it heals the named Redoubts and never the Head', () => {
    const head = aiUnit('vegnagun-head', 'enemy', 40000, 0);
    head.hp = 20000;
    const r = aiUnit('redoubt-r', 'enemy', 2500, 1);
    const l = aiUnit('redoubt-l', 'enemy', 2500, 2);
    for (const pod of [r, l]) { pod.hp = 0; pod.alive = false; }
    const events: Array<{ type: string; targetId?: string }> = [];
    const ctx: ResolveContext = {
      units: [head, r, l], abilities: chainRegistries(abilityRegistryFrom(Object.values(ABILITIES)), defaultAbilities),
      rng: new SeededRng(1), emit: (e) => events.push(e as never), breaksDamageLimit: () => false,
    };
    resolveAbility(ctx, head, ABILITIES['x2-vegnagun-acta-est-fabula']!, [r.id, l.id]);
    const touched = new Set(events.filter((e) => e.targetId).map((e) => e.targetId));
    expect(touched.has('vegnagun-head')).toBe(false);
    expect(head.hp).toBe(20000);
    expect(r.alive && l.alive).toBe(true);
  });
});

describe('PR-0069 (FFX only): the possessed aeon keeps its own data file\'s affinities', () => {
  it('research/ffx-bfa-yu-yevon.md §2 is silent on affinities, so none are mirrored from the player\'s aeon', () => {
    const src = readFileSync('src/battle/ffx/setup.ts', 'utf8');
    expect(src).toContain('Affinities are **not** mirrored (PR-0069)');
    expect(src).not.toContain('Affinities are mirrored too');
  });
});

describe('D-217 (FFX-2, Chapter V): a checkpoint at Shuyin, labelled an adaptation', () => {
  it('Shuyin\'s link is a retry checkpoint; the Vegnagun links before it are not', () => {
    const setup = { game: 'ffx2', party: chateauBuild, enemies: shuyinGroup, triggers: [], seed: 5, condition: 'scripted', canEscape: false } as BattleSetup;
    expect(checkpointAt(5, shuyinGroup, setup)).toMatchObject({ link: 5 });
    for (const id of VEGNAGUN_CHAIN_ORDER.slice(0, 4)) {
      expect(ENEMY_GROUPS_BY_ID[id]?.checkpointOnEntry).not.toBe(true);
    }
    expect(readFileSync('src/data/ffx2/enemies/shuyin.ts', 'utf8')).toContain('An adaptation, not a sourced rule');
  });
});

describe('PR-0174 (FFX only, Chapters VIII and X): Rikku\'s S.Lv sits between the presets either side', () => {
  it('Macalania 40 <= Fahrenheit <= Gagazet 42, with its source tag, and X inherits it', () => {
    const at = (b: { members: Array<{ id: string; sphereGrid: { sLv: number } }> }) => b.members.find((m) => m.id === 'rikku')!.sphereGrid.sLv;
    const mac = at(macalaniaBuild as never);
    const fah = at(fahrenheitBuild as never);
    const gag = at(gagazetBuild as never);
    expect([mac, fah, gag]).toEqual([40, 41, 42]);
    expect(readFileSync('src/data/ffx/builds/fahrenheit.ts', 'utf8')).toContain('PR-0174, `[estimate]`');
  });
});
