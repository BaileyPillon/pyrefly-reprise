/**
 * Chapter XV — the chain between the shades: GP3 a (everything carries), GP4
 * (a loss retries from Baralai), and the absence check that no other FFX-2 chain
 * moved (rule 14, CHK-021). **FFX-2 only**; the carry lives in shared plumbing
 * (`src/app/screens/BattleScreenSetup.ts`, `BattleScreenCarry.ts`) behind a flag
 * only the Den sets, so every other chain is the "both" case of unchanged.
 *
 * Run, not grepped (hard rule 3): the carry is proved on the real engine across a
 * real seam, and the absence on full event logs.
 */

import { describe, expect, it } from 'vitest';
import type { BattleSetup, FFX2Combatant, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { buildState, gridNodeContents } from '../../../src/battle/ffx2/setup.ts';
import { SeededRng } from '../../../src/battle/common/rng.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import { chateauBuild } from '../../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_CHAIN_ORDER } from '../../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { FALLEN_AEONS_CHAIN_ORDER, roadSistersGroup } from '../../../src/data/ffx2/enemies/fallen-aeons-road.ts';
import { VEGNAGUN_CHAIN_ORDER } from '../../../src/data/ffx2/ids.ts';
import { denBaralaiGroup, denGippalGroup, denNoojGroup } from '../../../src/data/ffx2/enemies/den-of-woe.ts';
import { carryPartyForward, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { wearing } from '../../../src/app/screens/BattleScreenCarry.ts';
import { checkpointAt } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';
import { chainLogHash } from '../helpers/ffx2ChainLogs.ts';
import { driveDen, LINES } from '../helpers/denOfWoeDrive.ts';

/** The grid's node count as the engine reads it (clamped 2-6). */
const nodesOf = (m: { garmentGrid: { id: string } }) =>
  Math.max(2, Math.min(6, (data.GARMENT_GRIDS as Record<string, { nodeCount: number }>)[m.garmentGrid.id]!.nodeCount));

function baralaiEngine(seed = 5): { engine: FFX2Engine; setup: BattleSetup } {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  const setup: BattleSetup = { game: 'ffx2', party: farplaneBuild, enemies: denBaralaiGroup, triggers: [], seed, condition: 'normal', canEscape: false };
  engine.setSeed(seed);
  engine.init(setup);
  return { engine, setup };
}

const girl = (engine: FFX2Engine, id: string) => engine.state().combatants[id] as FFX2Combatant;

describe('GP3 a: everything carries from Baralai to Gippal to Nooj, with no results between', () => {
  it('HP, MP, KO, statuses, the worn dressphere, the node and the passed gates ride into the next shade', () => {
    const { engine, setup } = baralaiEngine();
    const yunaBuild = farplaneBuild.members[0];
    const layout = gridNodeContents(yunaBuild, nodesOf(yunaBuild));
    const yuna = girl(engine, 'yuna');
    const rikku = girl(engine, 'rikku');
    const paine = girl(engine, 'paine');
    // Yuna stands on node 1 in what it holds, having passed a gate; Rikku is KO'd; Paine is Protected and Silenced.
    yuna.dresspheres!.current = layout[1]!;
    yuna.dresspheres!.garmentGrid.nodePosition = 1;
    yuna.dresspheres!.garmentGrid.passedGates = ['blue'];
    yuna.hp = 1500;
    yuna.mp = 40;
    rikku.hp = 0;
    rikku.alive = false;
    rikku.statuses.ko = { id: 'ko', ticksRemaining: null, stacks: 1 } as never;
    paine.statuses.protect = { id: 'protect', ticksRemaining: null, stacks: 1 } as never;
    paine.statuses.silence = { id: 'silence', ticksRemaining: null, stacks: 1 } as never;

    const next = setupForNextLink(setup, denGippalGroup, engine.state(), 6);
    const built = buildState(next, ffx2Options(), new SeededRng(6));
    const at = (id: string) => built.state.combatants[id] as FFX2Combatant;
    expect(at('yuna').dresspheres?.current).toBe(layout[1]);
    expect(at('yuna').dresspheres?.garmentGrid.nodePosition).toBe(1);
    expect(at('yuna').dresspheres?.garmentGrid.passedGates).toEqual(['blue']);
    expect(built.gridNodes['yuna']).toEqual(layout); // the grid is laid out exactly as before
    expect(at('yuna').hp).toBe(Math.min(1500, at('yuna').stats.maxHp));
    expect(at('yuna').mp).toBe(Math.min(40, at('yuna').stats.maxMp));
    expect([at('rikku').alive, at('rikku').hp, Boolean(at('rikku').statuses.ko)]).toEqual([false, 0, true]);
    expect(Object.keys(at('paine').statuses).sort()).toEqual(['protect', 'silence']);
    expect(next.condition).toBe('scripted');
    expect(next.enemies.id).toBe(denGippalGroup.id);
  });

  it('the carried stats are the worn dressphere\'s own (derived again, accessories kept)', () => {
    const { engine, setup } = baralaiEngine();
    const layout = gridNodeContents(farplaneBuild.members[1], nodesOf(farplaneBuild.members[1]));
    const rikku = girl(engine, 'rikku');
    const other = layout.findIndex((d, i) => i > 0 && d !== null && d !== 'dark-knight');
    rikku.dresspheres!.current = layout[other]!;
    rikku.dresspheres!.garmentGrid.nodePosition = other;
    const next = setupForNextLink(setup, denGippalGroup, engine.state(), 6);
    const fresh = buildState({ ...setup, party: { ...farplaneBuild, members: [farplaneBuild.members[0], { ...farplaneBuild.members[1], currentDressphere: layout[other]! }, farplaneBuild.members[2]] } as FFX2PartyBuild }, ffx2Options(), new SeededRng(1));
    const carried = buildState(next, ffx2Options(), new SeededRng(6));
    expect(carried.state.combatants['rikku']!.stats.maxHp).toBe(fresh.state.combatants['rikku']!.stats.maxHp);
    expect((carried.state.combatants['rikku'] as FFX2Combatant).dresspheres?.current).toBe(layout[other]);
  });

  it('a layout that cannot be reproduced keeps the build\'s dressphere; the statuses still carry', () => {
    const member = { ...farplaneBuild.members[0], owned: ['white-mage', 'gunner'], garmentGrid: { ...farplaneBuild.members[0].garmentGrid, nodePosition: 4 } };
    // Two dresspheres on six nodes, the worn one moved to node 4: empty nodes sit before a full one.
    const worn = { current: 'gunner', owned: member.owned, abilitiesLearned: {}, garmentGrid: { ...member.garmentGrid, nodePosition: 1 } };
    expect(wearing(member, worn)).toBeNull();
  });

  it('the whole Den, driven: no results screen between links, and the carried HP is the HP the last link ended on', () => {
    let checked = 0;
    const pools = (engine: FFX2Engine) => ['yuna', 'rikku', 'paine'].map((id) => {
      const g = engine.state().combatants[id]!;
      return [g.hp, g.mp, Object.keys(g.statuses).sort().join(',')].join('/');
    });
    for (let seed = 1; seed <= 20 && checked < 3; seed++) {
      const ended: string[][] = [];
      const started: string[][] = [];
      const run = driveDen(LINES.intended, seed, { inspect: (e) => ended.push(pools(e)), start: (e) => started.push(pools(e)) });
      if (run.links.length < 2) continue;
      checked += 1;
      expect(run.links[0]!.outcome).toBe('victory');
      // Link 2 opens on exactly what link 1 closed on: HP, MP and the status set.
      expect(started[1], `seed ${seed}`).toEqual(ended[0]);
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe('the flag is the only way in: every other chain carries what it always did', () => {
  it('without carriesFullPartyState the FFX-2 carry is HP, MP and items only (Chapters 5, 6, XI)', () => {
    const { engine } = baralaiEngine();
    girl(engine, 'paine').statuses.protect = { id: 'protect', ticksRemaining: null, stacks: 1 } as never;
    const plain = carryPartyForward(farplaneBuild, engine.state()) as FFX2PartyBuild;
    expect(plain.members.map((m) => m.statuses)).toEqual([undefined, undefined, undefined]);
    expect(plain.members.map((m) => m.currentDressphere)).toEqual(farplaneBuild.members.map((m) => m.currentDressphere));
    expect(plain.members.map((m) => m.owned)).toEqual(farplaneBuild.members.map((m) => m.owned));
    const road = setupForNextLink({ game: 'ffx2', party: farplaneBuild, enemies: denBaralaiGroup, triggers: [], seed: 1, condition: 'normal', canEscape: false }, roadSistersGroup, engine.state(), 2);
    expect((road.party as FFX2PartyBuild).members.map((m) => m.statuses)).toEqual([undefined, undefined, undefined]);
    for (const g of Object.values(data.ENEMY_GROUPS_BY_ID)) {
      if (g.carriesFullPartyState) expect([denGippalGroup.id, denNoojGroup.id], g.id).toContain(g.id);
    }
  });

  it('no Save Sphere and no checkpoint: a loss on Gippal or Nooj retries from Baralai (GP4, built as a)', () => {
    const setup = { game: 'ffx2', party: farplaneBuild, enemies: denBaralaiGroup, triggers: [], seed: 1, condition: 'normal', canEscape: false } as BattleSetup;
    expect(checkpointAt(1, denBaralaiGroup, setup)).toBeNull();
    expect(checkpointAt(2, denGippalGroup, setup)).toBeNull();
    expect(checkpointAt(3, denNoojGroup, setup)).toBeNull();
  });

  /**
   * Recorded on the base commit 4f2481f2 (before this track) with this same
   * helper, in a scratch export of that tree: every link's event log of each
   * chain, seeds 1-8, `intendedStrategy`, D = 0. Chapter 5's first eight equal the
   * `ffx2-atb-golden.test.ts` pins. The Sisters' runs exercise the "set to" path
   * that now also runs riders (Delta Attack has none): 4 Delta Attacks across
   * seeds 1-8, counted 2026-09-25.
   */
  const BASE = {
    ch5: ['f5874befbb32bca2', '3d936ba1a11afdd9', '6e4e0fb5790b3f6a', '65a2f90ebd84a0a3', '5bcf9bc9c12b4f79', '1f317c664da2fa56', 'f2bbb405d2f7559a', '2460bc9767b55825'],
    ch6: ['0aadde1f8d3aff80', '995cb5ec3f5834e0', '67647d2cb3df6954', '31f76e6f441c188f', 'f25cf6be4eb333fd', '66b37dd52d704894', '5030ad54d4e4d192', '11b9c3bbc8f0a712'],
    ch11: ['80a3a08d15d5a0ce', 'e472b1ff05535728', '662ee19744422dbb', 'dd1c791ffa2f41d6', '11d4214a0f788bce', '44006cd052148b1d', '998d88ffbeec0c78', '522b508037e30825'],
    sisters: ['82dd30838f13ef2b', 'f15bb46d43c44d92', '7146e484f29262ab', '98d6337c46636466', '2ed76b894bc74539', '36c03240823c36bb', '196ef488a130ca0e', 'c4efaaee767d9973'],
  };

  it('Chapters 5, 6 and XI: byte-identical event logs to the base commit, seeds 1-8', () => {
    for (let seed = 1; seed <= 8; seed++) {
      expect(chainLogHash(VEGNAGUN_CHAIN_ORDER[0]!, farplaneBuild, seed).hash, `ch5 ${seed}`).toBe(BASE.ch5[seed - 1]);
      expect(chainLogHash(LEBLANC_CHAIN_ORDER[0]!, chateauBuild, seed).hash, `ch6 ${seed}`).toBe(BASE.ch6[seed - 1]);
      expect(chainLogHash(FALLEN_AEONS_CHAIN_ORDER[0], farplaneBuild, seed).hash, `ch11 ${seed}`).toBe(BASE.ch11[seed - 1]);
      expect(chainLogHash(FALLEN_AEONS_CHAIN_ORDER[1], farplaneBuild, seed).hash, `sisters ${seed}`).toBe(BASE.sisters[seed - 1]);
    }
  }, 120_000);
});
