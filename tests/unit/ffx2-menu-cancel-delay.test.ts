/**
 * **The menu-cancel correction** (`research/ffx2-combat-core.md` §9.2, commit `ea05f877`,
 * `[verified: 2 sources]`, Split_Infinity G1041 / G1042): only an ability with a **Delay effect** or
 * **Action-cancel** closes an open command menu, not every enemy hit. Release 17 (decision sheet
 * 2026-09-25 item 4 A1) closed the menu on any damaging enemy hit. The correction is the switch
 * `constants.ts` MENU_CANCEL_ONLY_DELAY_ABILITIES (`menu-cancel.ts`), built OFF and turned **ON** by
 * Bailey on 2026-09-26 ("I'll take all your recommendations", answering "menu correction on (my
 * recommendation), or keep it as is"); the engine option `menuCancelOnlyDelayAbilities: false`
 * replays release 17's rule for measuring. **FFX-2 only** (AGENTS.md rule 14).
 *
 * Proven on the real engine (rule 3): by default (on) the logs are the ones pinned below, Bahamut's plain
 * hit leaves the menu open, and a sourced Delay ability (Chapter VI) still closes it.
 *
 * **Re-parity W4 (2026-10-10; FFX-2 only, reason "game-code parity").** The switch, its option and `menu-cancel.ts` are deleted. The engine
 * now applies the game's own rule (`apply_atb_damage`, exe 0x0061b620; `research/re-ffx2-atb-status.md`): a hit of the ATB class (Delay)
 * pushes the target's gauge back and closes the menu it had open; no other hit does. That is the correction this file was written to
 * pin, now not an option but the engine. What is gone with it: the "carriesMenuCancel reads the rows" block (the helper lives in
 * `helpers/ffx2MenuCancel.ts`, for tests only), the `MENU_CANCEL_ONLY_DELAY_ABILITIES` pin, and the release-17 replay (the option is
 * no longer read, the 18 hashes of it are not reproducible and are not kept). The 18 hashes of the default are re-pinned: the whole
 * clock moved (the logic step, the game's recovery and cast times).
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent, CombatantId, Decision, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFX2Engine, defaultAbilities } from '../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../src/battle/ffx2/internal.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { chateauBuild } from '../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_CHAIN_ORDER } from '../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { driveChapter4, driveChapter5, driveChapter6, ffx2Options, logHash } from './helpers/ffx2ChapterDrive.ts';
import { ActingAbilities, carriesMenuCancel } from './helpers/ffx2MenuCancel.ts';
import { withActionSpanKnobs } from '../../src/battle/ffx2/action-span.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

const ability = (id: string): AbilityDef | undefined =>
  (data.ABILITIES as Record<string, AbilityDef>)[id] ?? defaultAbilities.get(id);

describe('the test helper reads the sourced rows (no row is flagged here)', () => {
  it('the FFX-2 chapters\' Delay abilities carry it: Supercollider, Huggles, Mach Fan (Leblanc §4), Vita Brevis (Vegnagun §3.2)', () => {
    for (const id of ['x2-ormi-supercollider', 'x2-ormi-huggles', 'x2-leblanc-mach-fan', 'vita-brevis']) {
      expect(ability(id), id).toBeDefined();
      expect(carriesMenuCancel(ability(id)), id).toBe(true);
    }
  });
  it('a plain hit does not: Attack, Bahamut\'s Mega Flare, Ormi\'s Shield Bash; an unknown ability carries nothing', () => {
    for (const id of ['attack', 'mega-flare', 'x2-ormi-shield-bash']) {
      if (ability(id)) expect(carriesMenuCancel(ability(id)), id).toBe(false);
    }
    expect(carriesMenuCancel(undefined)).toBe(false);
  });
  it('ActingAbilities nests a counter inside a charged action and pops back to it', () => {
    const a = new ActingAbilities();
    a.note({ type: 'action-start', actorId: 'leblanc', command: { kind: 'ability', id: 'x2-leblanc-mach-fan', targets: [] }, abilityId: 'x2-leblanc-mach-fan', targets: [] } as never);
    a.note({ type: 'action-start', actorId: 'leblanc', command: { kind: 'ability', id: 'x2-leblanc-fan-slap', targets: [] }, abilityId: 'x2-leblanc-fan-slap', targets: [] } as never);
    expect(a.current('leblanc')).toBe('x2-leblanc-fan-slap');
    a.note({ type: 'action-end', actorId: 'leblanc' } as never);
    expect(a.current('leblanc')).toBe('x2-leblanc-mach-fan');
    a.note({ type: 'action-end', actorId: 'leblanc' } as never);
    a.note({ type: 'action-end', actorId: 'leblanc' } as never); // an unmatched end is harmless
    expect(a.current('leblanc')).toBeUndefined();
  });
});

describe('the engine plays the game\'s rule: any hit of the ATB class closes a menu, no other does (pinned logs)', () => {
  // The default's logs, Chapters IV to VI at human pace (`ffx2ChapterDrive`, Active 1.5 s a menu, and the Wait split 1.5 s / 0.5 s on the
  // top list), seeds 1 to 3. **Re-pinned once for the merged state of release candidate 3** (branch re-parity-rc3, 2026-10-11, FFX-2 only; reasons "game-code parity" and "game-script parity"; docs/handoff/re-parity-rc3.md): re-parity W4's logic-step engine, gauges and status clocks and the three boss-AI lanes (a: Bahamut, the Vegnagun chain, Shuyin; b: the Fallen Aeons, the Magus Sisters, Paragon, the Oversoul, Trema; c: the Leblanc Syndicate, the Den of Woe, Ixion) are in one tree, with the AI lanes' timer rows put on the logic-step clock (Bahamut's countdown is 750 steps, a voice poll recovers by the speak command's 60 instead of 70, the Vegnagun Head's Agility 110 is rolled into its first gauge, the Oversoul idles 1,201 steps). Each branch had re-pinned these for itself; this is the one pin of the merged tree. The active rows equal the atb golden's CH4_D1500 / CH5_D1500 seeds 1 to 3 again.
  // Against W4 alone the first differing event is Bahamut's first Curse (Chapter IV), the Tail's first turn 9 steps earlier or a gauge snapshot
  // (Chapter V) and the opening snapshot or the first Ormi / goon turn (Chapter VI, lane c's stat rows); the split rows follow the same events.
  // **Re-pinned 2026-10-10 for re-parity W4 (FFX-2 only; reason "game-code parity")**: the clock is the game's
  // logic step and a command leaves the game's recovery and cast, so every log moved. The 18 before it were pinned 2026-10-09 for W3
  // (old hashes in git at 931613a8; the release-17 replay rows that stood beside them are gone with the option).
  // **Re-pinned for the game's own random streams** (re-parity RNG lane, 2026-10-11, FFX-2 only; reason "game RNG streams (Bailey 2026-10-09)": FFX-2 draws from its own 68 streams, every seed is another deal of the same odds, and nothing else moved (docs/handoff/re-parity-rng.md). The old hashes are in git at 0c729fa5. The active rows equal the atb golden's CH4_D1500 / CH5_D1500 seeds 1 to 3 again.
  // **Re-pinned 2026-10-15 for the item ledger and the battle-end commit window** (re-parity RC8, FFX-2 only; reason "game-code parity"; `docs/handoff/re-parity-rc8-x2-end-ledger.md`): the end of a fight is committed after the casts in flight have fired, so each log gains the events between the last blow and the victory (see `ffx2-atb-golden.test.ts`, thirteenth re-pin). The active rows equal the atb golden's CH4_D1500 / CH5_D1500 seeds 1 to 3 again. The old hashes are in git at ea431aa0.
  // **Re-pinned on the r51 merge for the game's kill rewards** (re-parity RC9 lane X2-C, 2026-10-15, FFX-2 only; reason "game-code parity", note FFX2-G03; docs/handoff/re-parity-rc9-x2-rewards.md): the `victory` result is what the reward routine paid at each knock-out, so that one event's payload differs in every log. Cause, by ablation: with each victory result put back to what the old `buildResult` made from the same board, all eighteen logs give their old digest again, so no battle changed. The old hashes (the item-ledger and commit-window pins above) are in git at 6b638df95. The lane built these on r49 (before RC8); r51-rc re-recorded them on the merged tree (RC8 plus this lane), and the ablation was re-run there: every one of the 119 logs equals RC8's pin again with the result put back. The active rows equal the atb golden's CH4_D1500 / CH5_D1500 seeds 1 to 3 again.
  // **Chapter VI's six re-pinned on the merge of the Chapter VI link opening onto r52-rc** (lane X2-L row XL1, FFX-2 only; reason "game-code parity": the game starts every link of a chain as a full
  // battle, FFX2-G10 sections 4 to 6; `docs/handoff/re-parity-rc9-x2-link-open.md`; PR-0107 turned ON by Bailey's yes of 2026-10-17, "yes turn on chapter VI opening, keep going full speed"): `SEPARATE_BATTLE_GAUGES` is `true` in
  // `src/battle/ffx2/constants.ts`, so Acts II and III open on random waits and the opening trim instead of every wait whole. Cause, by comparing full event logs: Act I is identical and the first
  // differing event is the opening gauge snapshot of Act II (link 2) in all six runs, all still victories. With `separateBattleGauges: false` passed as an option on the merged tree the six old hashes (the
  // r52-rc pins above: 1135b38b, a7917cc4, 552525db, bde33d49, a6475afe, 0baa4501) return exactly. Chapters IV and V did not move. The old hashes are in git at 3c92b60cc (r52-rc).
  // **Re-pinned once for the hit reaction, stacked on r52-rc and the Chapter VI link opening** (re-parity RC9 lane X2-A, slice 1, FFX-2 only; reason "game-code parity", the checked note FFX2-G01 section 7 and the live game of 2026-10-13, question Q1; `docs/handoff/re-parity-rc9-x2-hit-reaction.md`): the eighteen logs of Chapters IV to VI at human pace (Active 1.5 s a menu, and the Wait split 1.5 s / 0.5 s on the top list), seeds 1 to 3. Cause, found by ablation (the switch `CHAIN_WINDOW_PER_BODY` forced off): X2-A per-body windows, on top of the link opening. The chain window, the span of the halved tick and the forced hit are each body's own damage clip plus one step (a girl 24 to 51 steps, Bahamut 52 and 82) where they were 60 and 90 steps and 15. The old hashes are the base 35aa31e77 (r52-rc 3c92b60cc plus the Chapter VI link opening)'s, the six Chapter VI ones being the link-opening row above. Proof on the merged tree (branch `re-parity-rc9-x2-hit-reaction-r52`, 2026-10-17): with `CHAIN_WINDOW_PER_BODY` forced off for the whole run through a module mock (a vitest setup file; `withReactionKnobs(OLD_REACTION)` is the same switch inside the process), these eighteen pins: 18 of 18 of the base's hashes come back exactly, and with it on all 18 move.
  // **Re-pinned 2026-10-20 for the retarget of a skill whose foe has fallen** (re-parity lane x2-retarget, FFX-2 only; reason "game-code parity", `research/re-ffx2-ai-leblanc-den-ixion.md` section 1.12; `docs/handoff/re-parity-x2-retarget-fix.md`): eight of the eighteen rows (Chapter IV split 1, active 3, split 3; Chapter VI active 1, 2, 3 and split 2, 3); Chapter V and the others did not move. In each, the first event that differs is Paine's Armor Break (or Mental Break) landing on Yuna or on herself after its foe had fallen; in Chapter VI the fights then diverge (a girl is knocked out in split 3). With only `src/battle/ffx2/targeting.ts` put back to r59 (6db09ac86) as an in-process overlay, the previous pins return exactly. The old hashes are in git at 6db09ac86.
  const ON: Record<string, string> = {
    'IV|active|1': '5385f128d0bbe00a', 'IV|split|1': '493b57e0883b4e8c',
    'IV|active|2': '878b4ca5279f18f1', 'IV|split|2': '96e98b1c96cf0327',
    'IV|active|3': '214a827b527bdc86', 'IV|split|3': 'aab4968960519c85',
    'V|active|1': 'c568c06af2d32d4a', 'V|split|1': '1dddc6c69afc6440',
    'V|active|2': '70c9b63427a29c45', 'V|split|2': '8e2804953639b4cd',
    'V|active|3': '08d0977e0d1536cb', 'V|split|3': 'eeed11d89e64f1ad',
    'VI|active|1': 'a67af9a2a4bad8e9', 'VI|split|1': 'd36c552702cfb9d1',
    'VI|active|2': 'b57f102a8873966a', 'VI|split|2': 'a154e6dc86275707',
    'VI|active|3': 'b9513ff11c788bbc', 'VI|split|3': 'd25cfbdb0f031372',
  };
  const DRIVES = { IV: driveChapter4, V: driveChapter5, VI: driveChapter6 } as const;

  // OLD timeline (r55): this test pins the flat 3 s / no-action-time world, so it runs with the per-command span put back off; the rest of the file runs on production.
  it('Chapters IV, V and VI at human pace replay the pinned logs, byte for byte', () => withActionSpanKnobs({ perCommand: false }, () => {
    for (const [name, drive] of Object.entries(DRIVES)) {
      for (let seed = 1; seed <= 3; seed++) {
        expect(logHash(drive(seed, 1500, { atbMode: 'active' })), `${name} active ${seed}`).toBe(ON[`${name}|active|${seed}`]);
        expect(logHash(drive(seed, 1500, { atbMode: 'wait', waitSplit: true }, undefined, 500)), `${name} split ${seed}`).toBe(ON[`${name}|split|${seed}`]);
      }
    }
  }), 120_000);
});

/** A fresh engine on `group` with `party`, stopped at its first open menu. */
function engineAt(group: EnemyGroupDef, party: typeof bevelleBuild, seed: number, extra: Partial<Ffx2EngineOptions>): { engine: FFX2Engine; menu: Input } {
  const engine = new FFX2Engine(ffx2Options(extra));
  engine.setSeed(seed);
  engine.init({ game: 'ffx2', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  for (let i = 0; i < 1000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return { engine, menu: d };
    if (d.kind === 'waiting') engine.tick(d.nextEventMs);
    if (d.kind === 'battle-over') break;
  }
  throw new Error('no menu opened');
}

/** One 100 ms step in which enemy hits dealt the standing owner damage: the abilities behind them, and whether her menu was closed after it. */
interface Landed { abilities: Array<string | undefined>; closedAfter: boolean }

const anyDelay = (l: Landed): boolean => l.abilities.some((a) => carriesMenuCancel(ability(a ?? '')));

/** Run the clock under the open menu in 100 ms steps for up to `ms`, listing the steps where an enemy hit landed on the owner. */
function hitsUnderMenu(engine: FFX2Engine, owner: CombatantId, ms: number): Landed[] {
  const acting = new ActingAbilities();
  const landed: Landed[] = [];
  for (let t = 0; t < ms && !engine.state().result; t += 100) {
    const events: BattleEvent[] = engine.tick(100, { throughInput: true });
    const here: Array<string | undefined> = [];
    for (const e of events) {
      acting.note(e as never);
      if (e.type === 'damage' && e.targetId === owner && e.amount > 0 && e.sourceId && engine.state().enemyIds.includes(e.sourceId)) {
        here.push(acting.current(e.sourceId));
      }
    }
    const closed = !engine.inputValid(owner);
    const alive = (engine.state().combatants[owner]?.hp ?? 0) > 0;
    // A status that lands on her (Petrify, Eject, Stop, Sleep, Berserk...) closes the menu on its own
    // rule (`active.ts` inputStillValid), not the hit rule: those steps say nothing about this switch.
    const statused = events.some((e) => (e.type === 'status-add' || e.type === 'ko') && e.targetId === owner);
    if (alive && !statused && here.length > 0 && !engine.state().result) landed.push({ abilities: here, closedAfter: closed });
    if (closed) break;
  }
  return landed;
}

describe('a plain hit leaves the menu open, a Delay ability closes it (Active)', () => {
  it('Chapter IV: Bahamut\'s hits land on the owner and her menu stays open', () => {
    const group = data.ENEMY_GROUPS_BY_ID['ffx2-bahamut']!;
    let plain = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const { engine, menu } = engineAt(group, bevelleBuild, seed, { atbMode: 'active' });
      for (const hit of hitsUnderMenu(engine, menu.actorId, 30_000)) {
        expect(anyDelay(hit), `seed ${seed}: ${hit.abilities.join(', ')}`).toBe(false);
        expect(hit.closedAfter, `seed ${seed}: ${hit.abilities.join(', ')} closed the menu`).toBe(false);
        plain += 1;
      }
    }
    expect(plain, 'no Bahamut hit landed under an open menu').toBeGreaterThan(0);
  });

  it('Chapter VI: a Delay ability that lands on the owner closes her menu; a plain one does not', () => {
    let delayCloses = 0;
    let plainOpen = 0;
    for (const groupId of LEBLANC_CHAIN_ORDER) {
      const group = data.ENEMY_GROUPS_BY_ID[groupId]!;
      for (let seed = 1; seed <= 40; seed++) {
        const { engine, menu } = engineAt(group, chateauBuild, seed, { atbMode: 'active' });
        for (const hit of hitsUnderMenu(engine, menu.actorId, 60_000)) {
          const delay = anyDelay(hit);
          expect(hit.closedAfter, `${groupId} seed ${seed}: ${hit.abilities.join(', ')}`).toBe(delay);
          if (delay) delayCloses += 1;
          else plainOpen += 1;
        }
      }
    }
    expect(delayCloses, 'no Delay ability landed under an open menu in 120 Chapter VI runs').toBeGreaterThan(0);
    expect(plainOpen).toBeGreaterThan(0);
  }, 120_000);
});
