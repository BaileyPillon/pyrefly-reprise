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
   * seeds 1-8, counted 2026-09-25. Chapter XI's two rows re-recorded 2026-09-26 on an export of
   * `main` 30420871 (its Fallen Aeons ship layer, option A: 3 s of action time on the Road links,
   * moves those logs), and the merged branch prints the same hashes: the Den's flag moves nothing.
   *
   * **Re-pinned 2026-10-09 for re-parity W3 (FFX-2 only; reason "game-code parity").** No Den code changed; the engine did: the hit,
   * critical, damage, status and theft kernels decide every hit in the game's draw order, so all thirty-two logs moved. Chapter 5's eight
   * equal `ffx2-atb-golden.test.ts` CH5_D0 seeds 1 to 8 again, and Chapter 6's first three equal `ffx2-hit-closes-menu.test.ts`'s. The old
   * hashes are in git at 029d49c7.
   *
   * **Re-pinned once for the merged state of release candidate 3** (branch re-parity-rc3, 2026-10-11, FFX-2 only; reasons "game-code parity" and "game-script parity"; docs/handoff/re-parity-rc3.md): re-parity W4's logic-step engine, gauges and status clocks and the three boss-AI lanes (a: Bahamut, the Vegnagun chain, Shuyin; b: the Fallen Aeons, the Magus Sisters, Paragon, the Oversoul, Trema; c: the Leblanc Syndicate, the Den of Woe, Ixion) are in one tree, with the AI lanes' timer rows put on the logic-step clock (Bahamut's countdown is 750 steps, a voice poll recovers by the speak command's 60 instead of 70, the Vegnagun Head's Agility 110 is rolled into its first gauge, the Oversoul idles 1,201 steps). Each branch had re-pinned these for itself; this is the one pin of the merged tree. No Den code changed in this test's sense; all thirty-two logs
   * moved. Chapter 5's eight equal the atb golden's CH5_D0 seeds 1 to 8 again and Chapter 6's first three equal ffx2-hit-closes-menu's. Against W4 alone
   * the first differing event is: Chapter 5, the Tail's first turn 9 steps earlier (the voice poll's 60); Chapter 6, the first Ormi / goon turn or the
   * opening snapshot (lane c's rows and stats); Chapter XI, Shiva's moves (lane b: her roll is random() mod 4, the girl a separate pick, +5 for every result); the Sisters, Mindy's,
   * Sandy's or Cindy's early moves (lane b: Mindy picks her girl then rolls mod 6, Sandy's Razzia is 1 in 3, Cindy's Camisade 2 in 5). All eight of each
   * still win at D = 0.
   * **Re-pinned 2026-10-10 for re-parity W4 (FFX-2 only; reason "game-code parity").** No Den code changed; the engine did: the clock is the
   * game's logic step and every gauge is the game's counter (recovery, cast, opening, thinking, Delay, status clocks), so all thirty-two logs
   * moved again. Chapter 5's eight equal `ffx2-atb-golden.test.ts` CH5_D0 seeds 1 to 8 again, and Chapter 6's first three equal
   * `ffx2-hit-closes-menu.test.ts`'s. The old hashes are in git at 931613a8.
   * **Re-pinned 2026-10-10 for re-parity AI-FFX2-b (FFX-2 only; reason "game-script parity").** No Den code changed; the AI of Chapter XI's links did: Shiva
   * (`m167`: Triple Attack is three polls of Chain Attack, the late table chosen after the +3, +5 for every result applied) and the Magus Sisters (`m171` to
   * `m173`: Delta Attack only from Cindy once both flags are up, Sandy 1/3 and Cindy 2/5 odds, Regen's counter 50, +5 for every result unguarded) take other
   * moves and other draws, so all eight logs of each of those two chains moved. Chapters 5 and 6 are byte-identical (their eight each equal the old pins), so
   * nothing outside the Road moved. Outcomes at D = 0: Shiva won eight of eight before and after; the Sisters won eight of eight before and six of eight now
   * (seeds 4 and 7 are lost). The old hashes are in git at 931613a8.
   * **Chapter 6's eight re-pinned 2026-10-10 for re-parity AI lane C (FFX-2 only; reason "game-script parity").** The Syndicate's scripts are the
   * game's own and Acts I and II carry the game's stat rows (`docs/handoff/re-parity-ai-ffx2-c.md`); all eight Chapter 6 logs moved, first at the
   * opening gauge snapshot (new Agility for Ormi, Logos and the goons). Chapters 5, XI and the Sisters did not move, and with the old scripts and
   * stats put back the eight Chapter 6 hashes are the old ones again (so the new results tally and per-stage sequence targets move nothing by
   * themselves). The old hashes are in git at 931613a8.
   *
   * **Re-pinned for the game's own random streams** (re-parity RNG lane, 2026-10-11, FFX-2 only; reason "game RNG streams (Bailey 2026-10-09)": FFX-2 draws from its own 68 streams, every seed is another deal of the same odds, and nothing else moved (docs/handoff/re-parity-rng.md). The old hashes are in git at 0c729fa5. All thirty-two logs moved; Chapter 5's eight equal `ffx2-atb-golden.test.ts` CH5_D0 seeds 1 to 8 again and Chapter 6's first three equal `ffx2-hit-closes-menu.test.ts`'s.
   *
   * **Re-pinned 2026-09-26 for the merge of `ffx2-engine-fixes-0926` (Bailey's D-193, option B;
   * FFX-2 only).** No Den code changed; the engine did. (1) IC-2: an all-target action hits each
   * target taken at its start once, and a target KO'd partway is skipped instead of its hits
   * wrapping onto someone already hit (`research/ffx2-combat-core.md` §9.1). (2) Acta Est Fabula
   * hits only the two Redoubts it names (`NAMED_TARGETS_ONLY`, Chapter 5 only). Chapter 5's eight
   * now equal the re-pinned `ffx2-atb-golden.test.ts` CH5_D0 pins again; Chapter 6 moves on seed 3
   * only, Chapter XI's Road on six of eight and the Sisters on all eight (IC-2 alone: neither chain
   * casts Acta, and both OFF switches stay off). The old hashes are in git at bd4d1327.
   *
   * **Chapter 5's row re-pinned 2026-10-10 for the boss AI (re-parity AI lane FFX-2 a, FFX-2 only; reason "game-script parity";
   * `docs/handoff/re-parity-ai-ffx2-a.md`).** No Den code changed; Chapter 5's bosses (the Tail, the Leg and its Nodes, the Core, the Head, the
   * Redoubts and Shuyin) follow the game's own scripts now, so its eight equal `ffx2-atb-golden.test.ts` CH5_D0 seeds 1 to 8 again (the first
   * event that differs is inside the Tail's link). Chapters 6 and XI and the Sisters did not move. The old Chapter 5 hashes are in git at 931613a8.
   *
   * **Chapter 5's seed 4 re-pinned 2026-10-14 for re-parity RC7 X2-B, the FFX-2 command menu** (FFX-2 only; reason "game-code parity";
   * `docs/handoff/re-parity-rc7-x2cmd.md` section 5). No Den code changed; the menu rules did: Silence now stops exactly the rows with the game's
   * silenceable bit (the Arcana spells yes, Pray and Vigor no). In Chapter V's link 4, seed 4, Rikku is Silenced and used to cast Black Sky; she
   * now uses Darkness, and Yuna, also Silenced, can use Pray and Vigor. `92f34919fb6d8fcc` became `4662e80c1515469b`, which is again the
   * `ffx2-atb-golden.test.ts` CH5_D0 seed 4 digest. The other seven Chapter 5 logs and all thirty-two of the others (Chapter 6, Chapter XI, the
   * Sisters) are unchanged. With the old Silence rule put back through a module mock the old digest returns.
   *
   * **Re-pinned 2026-10-15 for the item ledger and the battle-end commit window** (re-parity RC8, lane X2-F row XF1 and lane X2-K row XK2, FFX-2 only; reason "game-code parity",
   * the checked notes FFX2-G06 and FFX2-G10; `docs/handoff/re-parity-rc8-x2-end-ledger.md`). No Den code changed; the engine did: the end of a fight is committed only after the casts
   * already on the purple bar have fired, and an item leaves the stock at the pick. 31 of the 32 logs moved (Chapter 6 seed 4 did not); Chapter 5's eight equal `ffx2-atb-golden.test.ts`
   * CH5_D0 seeds 1 to 8 again and Chapter 6's first three equal `ffx2-hit-closes-menu.test.ts`'s. Cause, by comparing full event logs before and after: the first differing event is the end
   * of a link in 30 of the 31 (a cast in flight resolves before the victory); in the other one, Chapter 6 seed 5, the second link opens with an Attack where the base threw a Grenade,
   * because the four Grenades the party carries are no longer the ones a cast in flight at the end of the first link had not yet spent. All thirty-two still win. The old hashes are in
   * git at ea431aa0.
   *
   * **Chapter 6's eight re-pinned on the branch `re-parity-rc9-x2-link-open-on`, NOT FOR MERGE until Bailey says yes** (lane X2-L row XL1, FFX-2 only; reason "game-code parity":
   * the game starts every link of a chain as a full battle, FFX2-G10 sections 4 to 6; `docs/handoff/re-parity-rc9-x2-link-open.md`). No Den code changed; `SEPARATE_BATTLE_GAUGES` is
   * ON on that branch, so Chapter 6's Acts II and III open on random waits and the opening trim instead of every wait whole. All eight logs moved: Act I is identical in each, the first
   * differing event is the opening gauge snapshot of Act II (link 2), and all eight are still victories in three links. Chapter 5, Chapter XI and the Sisters did not move (the flag is
   * on no other group). With `separateBattleGauges: false` passed as an option the eight old hashes return exactly. The old hashes are in git at 23081b6ab (this branch's parent).
   */
  const BASE = {
    ch5: ['bc16d06c2b310e63', '3405995ca875714e', '6f3ff4787d226772', '19e4019ffcf7880c', '48022cc460c8aae2', '71a0d0a7a92737fa', '276aa8ad4aa650ab', '7a1ae4b195157295'],
    ch6: ['658c49a9f687413e', 'e8afa5f67590e50d', '9a6d146fa1f391b5', '15ef0057f1255d21', '06289dd5eff90986', '7ab0f9abd6eb9911', '7e7259c65dd8fce3', '2e5dc2b0bffc0cc2'],
    ch11: ['604514318823d2e0', '19c99ef6850db941', 'b11fcb2af7df9162', '748c9f80531df8af', '4f8dd5667cf843f8', '2201781c02da2e62', '387873d77b23913f', '9f660b4d1647783d'],
    sisters: ['c7145c067ca3cb54', 'ce7ed8347fb795be', '1c46c157eb6a5aba', 'ec8e64761ac7c459', '3394a5010e63304e', '59aee9966c69a02f', 'e0fe326b14ac1a8c', '9fc81a1fb15172ec'],
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
