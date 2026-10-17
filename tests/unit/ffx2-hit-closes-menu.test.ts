/**
 * **A Delay or Action-cancel hit closes an open FFX-2 command menu; a plain hit leaves it open.**
 * **FFX-2 only** (AGENTS.md rule 14). Release 17 closed the menu on any enemy hit (decision sheet
 * 2026-09-25 item 4, A1; `research/ffx2-combat-core.md` §1.1 and §1.5; plan
 * `docs/plans/ffx2-hit-closes-menu-review.md`). §9.2 (commit `ea05f877`, `[verified: 2 sources]`,
 * Split_Infinity G1041 / G1042) corrects §1.1, and Bailey turned the correction on on 2026-09-26
 * ("I'll take all your recommendations"; `constants.ts` MENU_CANCEL_ONLY_DELAY_ABILITIES = true).
 *
 * **Re-pinned 2026-09-26 for that flip.** The three tests that asserted "an enemy hit closes the
 * menu" on Chapter IV's Bahamut (who carries no Delay ability, so under the corrected rule none of
 * his hits closes it) now find the close in Chapter VI, where Ormi's Supercollider and Huggles and
 * Leblanc's Mach Fan carry Delay (`research/ffx2-leblanc-syndicate.md` §4), and a new test pins that
 * Bahamut's plain hit leaves the menu open. What happens after a close is unchanged: no delay is
 * applied (A2 is unsourced), she is offered a fresh menu at once, and a racing confirm is refused.
 * Proven on the real engine (rule 3). The switch's own tests are in `ffx2-menu-cancel-delay.test.ts`.
 *
 * **Re-parity W4 (2026-10-10; FFX-2 only, reason "game-code parity").** The switch and `active.ts` `closesOpenMenu` are gone: the engine
 * applies the game's own rule (`apply_atb_damage`, exe 0x0061b620), which closes a menu when a hit of the ATB class (Delay) lands on its
 * owner and for nothing else. The `closesOpenMenu` block is deleted (the function does not exist); the engine-level tests below are
 * unchanged in what they claim, and `tests/unit/helpers/ffx2MenuCancel.ts` tells them which abilities are the Delay ones. The nine D = 0 hashes
 * are re-pinned (the whole clock moved: the logic step, the game's recovery and cast times).
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent, CombatantId, Command, Decision, FFX2Combatant, FFX2PartyBuild } from '../../src/battle/common/types.ts';
import { FFX2Engine, defaultAbilities } from '../../src/battle/ffx2/index.ts';
import { isActionLocked } from '../../src/battle/ffx2/chain.ts';
import type { Ffx2EngineOptions, Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { chateauBuild } from '../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_CHAIN_ORDER } from '../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { driveChapter4, driveChapter5, driveChapter6, ffx2Options, logHash } from './helpers/ffx2ChapterDrive.ts';
import { ActingAbilities, carriesMenuCancel } from './helpers/ffx2MenuCancel.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

const abilityOf = (id: string | undefined): AbilityDef | undefined =>
  id === undefined ? undefined : ((data.ABILITIES as Record<string, AbilityDef>)[id] ?? defaultAbilities.get(id));

function engineAt(seed: number, extra: Partial<Ffx2EngineOptions>, groupId = 'ffx2-bahamut', party: FFX2PartyBuild = bevelleBuild): { engine: FFX2Engine; menu: Input } {
  const engine = new FFX2Engine(ffx2Options(extra));
  const group = data.ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} missing`);
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

const isEnemyHitOn = (engine: FFX2Engine, owner: CombatantId) => (e: BattleEvent): boolean =>
  e.type === 'damage' && e.targetId === owner && e.amount > 0 && !!e.sourceId && engine.state().enemyIds.includes(e.sourceId);

/** One 100 ms step's enemy hits on the owner: the abilities behind them, and whether a status or KO also landed on her. */
interface Step { hitAbilities: Array<string | undefined>; statused: boolean }

/**
 * Run the clock under the open menu in 100 ms steps until it closes or `ms` pass; returns what
 * landed, and the last step's hits on the owner with the ability behind each (`ActingAbilities`).
 */
function runUnderMenu(engine: FFX2Engine, owner: CombatantId, ms: number, top?: boolean): { events: BattleEvent[]; closed: boolean; last: Step; plainHits: number } {
  const events: BattleEvent[] = [];
  const acting = new ActingAbilities();
  let last: Step = { hitAbilities: [], statused: false };
  let plainHits = 0;
  for (let t = 0; t < ms && !engine.state().result; t += 100) {
    if (top) engine.setMenuLevel('top');
    const here = engine.tick(100, { throughInput: true });
    events.push(...here);
    last = { hitAbilities: [], statused: false };
    for (const e of here) {
      acting.note(e as never);
      if (isEnemyHitOn(engine, owner)(e) && e.type === 'damage') last.hitAbilities.push(acting.current(e.sourceId));
      if ((e.type === 'status-add' || e.type === 'ko') && e.targetId === owner) last.statused = true;
    }
    if (!engine.inputValid(owner)) return { events, closed: true, last, plainHits };
    plainHits += last.hitAbilities.filter((a) => !carriesMenuCancel(abilityOf(a))).length;
  }
  return { events, closed: false, last, plainHits };
}

/**
 * RC3 (FFX-2 only; reason "game-script parity"): does the closed menu come back, with the battle still on, inside the 200 steps of 100 ms the
 * three scenarios below allow? The same (formation, seed) is played again from its start (the engine is deterministic), because a candidate
 * whose fight is over before her gauge runs out (the Syndicate's scripts are the game's own now) cannot show the menu returning.
 */
function menuReturns(extra: Partial<Ffx2EngineOptions>, groupId: string, seed: number, top?: boolean): boolean {
  const { engine, menu } = engineAt(seed, extra, groupId, chateauBuild);
  runUnderMenu(engine, menu.actorId, 60_000, top);
  let again = engine.nextDecision();
  for (let i = 0; i < 200 && again.kind !== 'player-input'; i++) {
    if (again.kind === 'waiting') engine.tick(Math.min(100, again.nextEventMs), { throughInput: true });
    again = engine.nextDecision();
  }
  return again.kind === 'player-input';
}

/**
 * The first Chapter VI formation and seed whose opening menu is closed by a Delay hit (Supercollider,
 * Huggles or Mach Fan) landing on the owner, she still standing and no status landing with it.
 */
function closedByDelayHit(extra: Partial<Ffx2EngineOptions>, top?: boolean) {
  for (const groupId of LEBLANC_CHAIN_ORDER) {
    for (let seed = 1; seed <= 40; seed++) {
      const { engine, menu } = engineAt(seed, extra, groupId, chateauBuild);
      const run = runUnderMenu(engine, menu.actorId, 60_000, top);
      const owner = engine.state().combatants[menu.actorId];
      if (run.closed && owner && owner.hp > 0 && !engine.state().result && !run.last.statused
        && run.last.hitAbilities.some((a) => carriesMenuCancel(abilityOf(a))) && menuReturns(extra, groupId, seed, top)) {
        return { seed, engine, menu, run };
      }
    }
  }
  throw new Error('no Chapter VI formation and seed in 1-40 closed a menu by a Delay hit');
}

describe('the menu-cancel correction: a Delay hit closes the open menu, a plain hit does not (FFX-2 only)', () => {
  it('Active: Bahamut\'s plain hits land on the owner and her menu stays open (release 17 closed it)', () => {
    let plain = 0;
    for (let seed = 1; seed <= 5; seed++) {
      const { engine, menu } = engineAt(seed, { atbMode: 'active' });
      const run = runUnderMenu(engine, menu.actorId, 20_000);
      plain += run.plainHits;
      if (run.closed) expect(run.last.statused || run.last.hitAbilities.length === 0, `seed ${seed}: ${run.last.hitAbilities.join(', ')}`).toBe(true);
    }
    expect(plain, 'no plain Bahamut hit landed under an open menu').toBeGreaterThan(0);
  });

  it('Active: the Delay hit closes it AND pushes her gauge back (the game sets the counter to the Delay value, 4,000 or 8,000); the menu returns when it has run out', () => {
    const { engine, menu } = closedByDelayHit({ atbMode: 'active' });
    expect(engine.inputValid(menu.actorId)).toBe(false);
    const girl = engine.state().combatants[menu.actorId] as unknown as Ffx2Unit;
    // Re-parity W4: this used to say "no delay applied (A2 unsourced), she is offered a fresh menu at once". `apply_atb_damage` (exe
    // 0x0061b620) sets a ready girl's counter to the Delay value and sends her back to IDLE (measured on the running game, 2026-10-09).
    expect(girl.gauge.state).not.toBe(4);
    expect(girl.atb.recovery).toBeGreaterThan(2_000);
    expect(girl.atb.recovery).toBeLessThanOrEqual(8_000 + 200);
    let again = engine.nextDecision();
    for (let i = 0; i < 400 && again.kind !== 'player-input'; i++) {
      if (again.kind === 'waiting') engine.tick(Math.min(100, again.nextEventMs), { throughInput: true });
      again = engine.nextDecision();
    }
    expect(again.kind).toBe('player-input');
    if (again.kind === 'player-input') expect(engine.inputValid(again.actorId)).toBe(true);
  });

  it('Active: a confirm that races the Delay hit is refused and spends nothing', () => {
    const { engine, menu } = closedByDelayHit({ atbMode: 'active' });
    const row = menu.commands.find((c) => c.enabled && c.validTargets.length > 0)!;
    const logBefore = engine.state().log.length;
    expect(engine.submit({ ...row.command, targets: [row.validTargets[0]!] } as Command)).toEqual([]);
    expect(engine.state().log.length).toBe(logBefore);
    expect(isActionLocked(engine.state().combatants[menu.actorId] as FFX2Combatant), 'the Delay hit staggered her').toBe(true);
    // Her menu comes back and her turn was not spent. Unlike Bahamut's blow in release 17's version
    // of this test, the Delay hit here staggers her (it opens her chain window, §1.7), and once the
    // refusal has let go of her menu a staggered girl waits for the window to lift (at most 3 s)
    // before she is offered one again; no action of hers resolves in between.
    let again = engine.nextDecision();
    for (let i = 0; i < 200 && again.kind !== 'player-input'; i++) {
      if (again.kind === 'waiting') engine.tick(Math.min(100, again.nextEventMs), { throughInput: true });
      again = engine.nextDecision();
    }
    expect(again.kind).toBe('player-input');
    const hers = engine.state().log.slice(logBefore).filter((e) => e.type === 'action-start' && e.actorId === menu.actorId);
    expect(hers).toEqual([]);
  });

  it('Wait split at the top-level list: the same close by a Delay hit; the fresh menu (when her gauge has run out) starts held until the HUD reports its top list', () => {
    const { engine, menu } = closedByDelayHit({ atbMode: 'wait', waitSplit: true }, true);
    expect(engine.inputValid(menu.actorId)).toBe(false);
    let again = engine.nextDecision();
    for (let i = 0; i < 400 && again.kind !== 'player-input'; i++) {
      if (again.kind === 'waiting') engine.tick(Math.min(100, again.nextEventMs), { throughInput: true });
      again = engine.nextDecision();
    }
    expect(again.kind).toBe('player-input');
    expect(engine.menuLevel()).toBe('deep');
    expect(engine.clockHeld()).toBe(true);
    if (again.kind === 'player-input') expect(engine.inputValid(again.actorId)).toBe(true);
  });

  it('Wait split below the top list and the whole-menu hold: the clock is held, nothing lands, the menu stays', () => {
    for (const extra of [{ atbMode: 'wait', waitSplit: true }, { atbMode: 'wait', waitSplit: false }] as const) {
      const { engine, menu } = engineAt(1, extra);
      engine.setMenuLevel('deep');
      const run = runUnderMenu(engine, menu.actorId, 20_000);
      expect(run.events).toEqual([]);
      expect(run.closed).toBe(false);
    }
  });

  it('a hit on another girl leaves the owner\'s menu open', () => {
    let seen = false;
    for (let seed = 1; seed <= 30 && !seen; seed++) {
      const { engine, menu } = engineAt(seed, { atbMode: 'active' });
      for (let t = 0; t < 60_000; t += 100) {
        const events = engine.tick(100, { throughInput: true });
        const valid = engine.inputValid(menu.actorId);
        const others = events.some((e) => e.type === 'damage' && e.targetId !== menu.actorId && e.amount > 0
          && !!e.sourceId && engine.state().enemyIds.includes(e.sourceId));
        const onOwner = events.some(isEnemyHitOn(engine, menu.actorId));
        if (others && !onOwner && engine.state().combatants[menu.actorId]!.hp > 0 && !engine.state().result) {
          expect(valid).toBe(true);
          seen = true;
          break;
        }
        if (!valid) break;
      }
    }
    expect(seen).toBe(true);
  });
});

describe('zero decision time is untouched (every golden and D = 0 bench)', () => {
  // Pinned from the build before this change: the 40-seed bench's D = 0 aggregate hashes were
  // identical before and after (preflight §7), so these per-seed hashes are the pre-change logs.
  // **Re-pinned 2026-10-09 for re-parity W3 (FFX-2 only; reason "game-code parity").** The hit, critical, damage, status and theft
  // kernels now decide every hit, in the game's draw order, so every D = 0 log moved (all nine are still victories and no menu is
  // closed). Chapters IV and V equal `ffx2-atb-golden.test.ts` CH4_D0 / CH5_D0 seeds 1 to 3 again and Chapter VI equals
  // `chapters/den-of-woe-carry.test.ts` ch6. The old hashes are in git at 029d49c7 (Chapters V and VI earlier: ea05f877, PR-0106).
  // **Chapter IV's row re-pinned again 2026-10-09 for Mega Flare at the game's power 14** (Bailey: "Use 14 from the files"; the first
  // event that differs is Bahamut's first Mega Flare damage; see `ffx2-atb-golden.test.ts`, ninth re-pin); the old row is in git at
  // 3663cd3a. Chapters V and VI did not move.
  // **Re-pinned once for the merged state of release candidate 3** (branch re-parity-rc3, 2026-10-11, FFX-2 only; reasons "game-code parity" and "game-script parity"; docs/handoff/re-parity-rc3.md): re-parity W4's logic-step engine, gauges and status clocks and the three boss-AI lanes (a: Bahamut, the Vegnagun chain, Shuyin; b: the Fallen Aeons, the Magus Sisters, Paragon, the Oversoul, Trema; c: the Leblanc Syndicate, the Den of Woe, Ixion) are in one tree, with the AI lanes' timer rows put on the logic-step clock (Bahamut's countdown is 750 steps, a voice poll recovers by the speak command's 60 instead of 70, the Vegnagun Head's Agility 110 is rolled into its first gauge, the Oversoul idles 1,201 steps). Each branch had re-pinned these for itself; this is the one pin of the merged tree. All nine are still victories and no menu is closed; Chapters IV and V equal the atb golden's seeds 1 to 3 again
  // and Chapter VI equals chapters/den-of-woe-carry.test.ts ch6. Against W4 alone the first differing event is Bahamut's first Curse (Chapter IV, seeds
  // 1 to 3: lane a), the Tail's first turn 9 steps earlier (Chapter V, seeds 1 to 3: the voice poll's 60) and, in Chapter VI, the opening gauge snapshot
  // and the first goon or Ormi turn (lane c: Ormi's, Logos' and the goons' own Agility rows). The old hashes are in git at 931613a8 and bfb229a3.
  // **Re-pinned 2026-10-10 for re-parity W4 (FFX-2 only; reason "game-code parity"):** the engine clock is the game's logic step, a command
  // leaves the game's recovery and its cast the game's charge, so every D = 0 log moved (all nine are still victories and no menu is closed).
  // They equal `ffx2-atb-golden.test.ts` CH4_D0 / CH5_D0 seeds 1 to 3 and `chapters/den-of-woe-carry.test.ts` ch6 again. The old hashes
  // are in git at 931613a8.
  // **Re-pinned for the game's own random streams** (re-parity RNG lane, 2026-10-11, FFX-2 only; reason "game RNG streams (Bailey 2026-10-09)": FFX-2 draws from its own 68 streams, every seed is another deal of the same odds, and nothing else moved (docs/handoff/re-parity-rng.md). The old hashes are in git at 0c729fa5. All nine are still victories and no menu is closed; they equal `ffx2-atb-golden.test.ts` CH4_D0 / CH5_D0 seeds 1 to 3 and `chapters/den-of-woe-carry.test.ts` ch6 again.
  // **Re-pinned 2026-10-15 for the item ledger and the battle-end commit window** (re-parity RC8, FFX-2 only; reason "game-code parity"; `docs/handoff/re-parity-rc8-x2-end-ledger.md`): the end of a fight is committed after the casts in flight have fired, so each log gains the events between the last blow and the victory (see `ffx2-atb-golden.test.ts`, thirteenth re-pin). All nine are still victories and no menu is closed; they equal CH4_D0 / CH5_D0 seeds 1 to 3 and `chapters/den-of-woe-carry.test.ts` ch6 again. The old hashes are in git at ea431aa0.
  // **Chapter VI's row re-pinned on the branch `re-parity-rc9-x2-link-open-on`, NOT FOR MERGE until Bailey says yes** (lane X2-L row XL1, FFX-2 only; reason
  // "game-code parity": the game starts every link of a chain as a full battle, FFX2-G10 sections 4 to 6; `docs/handoff/re-parity-rc9-x2-link-open.md`):
  // `SEPARATE_BATTLE_GAUGES` is ON there, so Acts II and III open on random waits and the opening trim instead of every wait whole. Cause, by comparing full
  // event logs: Act I is identical, the first differing event is the opening gauge snapshot of Act II (link 2) in all three seeds, and all three are still
  // victories with no menu closed. With `separateBattleGauges: false` passed as an option the old row returns exactly (aa6b56cb, 2217fd51, 78d4ed54).
  // Chapters IV and V did not move. The old Chapter VI hashes are in git at 23081b6ab (this branch's parent).
  const PINNED = [
    ['6baeab06549072aa', 'dabe314b3bcfb98c', '1aca076e62b746d6'],
    ['bc16d06c2b310e63', '3405995ca875714e', '6f3ff4787d226772'],
    ['658c49a9f687413e', 'e8afa5f67590e50d', '9a6d146fa1f391b5'],
  ];
  it('Chapters IV, V and VI at D = 0 under the default Wait split replay byte for byte, no menu ever closed', () => {
    [driveChapter4, driveChapter5, driveChapter6].forEach((drive, c) => {
      for (let seed = 1; seed <= 3; seed++) {
        const r = drive(seed, 0, { atbMode: 'wait', waitSplit: true });
        expect(r.invalidated + r.refused).toBe(0);
        expect(logHash(r)).toBe(PINNED[c]![seed - 1]);
      }
    });
  }, 120_000);
});
