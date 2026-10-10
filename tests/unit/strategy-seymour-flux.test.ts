/**
 * The SHIPPED `intendedStrategy` against Chapter 1 (Seymour Flux), headlessly.
 *
 * Same harness and same question as `strategy-chapter2.test.ts`: the e2e suite
 * and `__pyrefly.autoBattle('intended')` drive the game through
 * `src/engine/BattlePresenterStrategies.ts`, so an encounter can be unwinnable
 * in the real game while every engine test stays green. This runs the real
 * strategy against the real engine and data with no browser.
 *
 * ## What was wrong, and what the line is
 *
 * Before 2026-09-17 the chapter had **no tactic at all** (`seymour-flux.ts`
 * exported `null`), so the generic ladder played it — and the generic ladder's
 * `bestEnemyTarget` prefers a *part* over the boss it props up, which is right
 * in three of the five chapters and exactly wrong here. Measured on these four
 * seeds it wiped in 4-32 turns with Seymour on a full **70,000** every time and
 * only the Mortiorchis dented. `research/ffx-seymour-flux.md` §2.2's correction
 * box is why: the mount's max HP floors at 1,000 and it revives from every
 * kill, so it is a damage *tap*, never a way to remove the adds.
 *
 * Three canon rules were being broken underneath that, and all three are fixed
 * (see `docs/CONTRACT-CHANGES.md` and `docs/handoff/play-seymour-flux.md`):
 *
 *  1. **Cross Cleave and Total Annihilation used the mount's stats.** §5.4
 *     settles that ambiguity — both are rows in Seymour's own `m142` list and
 *     are merely animated on the mount, so they compute with his Strength 30 /
 *     Magic 15. Measured before the fix, Cross Cleave hit a 2,420-HP Tidus for
 *     **5,776** where §5.2's table says 2,453 and three guides say "around
 *     2,000": a party wipe on turn one, every time.
 *  2. **The phase-1 cycle inverted its parity.** §4.2 is six steps with Seymour
 *     on the even ones and the mount on the odd ones; a single shared counter
 *     only produces that while the two strictly alternate, and CTB hands the
 *     mount the first turn often enough. Inverted, every mount turn fell
 *     through to its `else` branch — Cross Cleave, the cycle's biggest hit —
 *     so the fight opened with a party-wide 2,400 on *every* mount turn.
 *  3. **Kimahri's Ronso Rage always resolved as Jump.** `rollDefaultMinigame`
 *     discarded the ability the command named and used
 *     `unlockedOverdriveIds[0]`, so Mighty Guard — §6 row 13's answer to Total
 *     Annihilation, and the reason §7.9.2 makes his full gauge a *rule* — was
 *     uncastable.
 *
 * The line the tactic now plays is §6's strategy table in the order those
 * strategies have to happen: Holy Water the Zombie before the mount's Full-Life
 * (row 4), Hastega and a Poison Fang on turn one (rows 10 and 5-6), **an aeon
 * whenever one is available** (row 15 — a summon puts the party off-stage with
 * frozen counters and answers Seymour with a zero-damage Banish, which is worth
 * more than the burst), Mighty Guard and the party's Protect (rows 12-13), the
 * Cheer ladder, and Auron off the bench for the swinging turns (row 12's named
 * route). It never once aims at the mount.
 *
 * Measured after all of it: **146 wins in 200 contiguous seeds (73%)**, against
 * 0 before. That is short of the 90% this project asks of a chapter and is
 * reported as such — `docs/handoff/play-seymour-flux.md` lists what still caps
 * it, the largest being that the Lance-of-Atrophy → Full-Life combo lands
 * back-to-back on a party that gets no turn in between about six times in a
 * hundred seeds and kills the run in its first dozen turns.
 */

import { describe, expect, it } from 'vitest';
import type { Command } from '../../src/battle/common/types.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { MAX_DECISIONS, SEEDS, WINDOWS, attack, newEngine, runIntended } from './helpers/seymourFluxDrive.ts';

/**
 * Seed 1 is a **documented loss**, and the reason is that the encounter got
 * harder by getting correct.
 *
 * §4.4.1's phase-2 loop used to deadlock: `seymour-flux.ts` set its FLARED flag
 * and never cleared it on the wait turn, so below 50% he cast **one** Flare for
 * the whole of phase 2 and then nothing but threshold counters — measured on
 * seeds 1 and 7 as ten phase-2 actions containing a single offensive one. He
 * also cast the *player's* `flare` (power 60, single-enemy) instead of the
 * encounter's `flare-self` (power 80, Self, bouncing off his own Reflect for
 * §5.2's 1,900-2,100). Both are fixed, which is the whole of critic round 02's
 * issues #24 and #25, and phase 2 now costs the party a real ~2,000 party-side
 * bounce every other turn.
 *
 * The cost is measured, on the same forty-seed window and with everything else
 * held still: **26 wins with the deadlocked loop, 23 with the canon one**. The
 * research is not negotiable here ("never weaken a boss"), so the line absorbs
 * it: the §4.7 Talk trigger — which had never been executable from a command
 * list at all (#12) — pays 4 of those wins back (19 -> 23), and seed 1 is the
 * seed the trade costs. It dies in **phase 1**, at turn 54 with 37,887 left,
 * to the pre-existing Lance-of-Atrophy -> Full-Life pairing this file's header
 * already names as what caps the chapter.
 *
 * It is listed rather than deleted so the next pass can try to win it back.
 */
// 2026-09-25, PR-0155 (FFX only): aeons lost the party's Items (ffx-combat-core §6.2), so seed 7
// now loses (37,578 left) and seed 42 wins; the forty-seed window moved 23 -> 17.
// 2026-09-27, PR-0179 arm a (D-243, FFX only; Bailey: "I'll go with all of your recommendations"):
// the aeons carry research/ffx-combat-core.md §6.4.3's Gagazet rows (Bahamut 1,398 -> 2,935 HP), so
// seeds 7 and 20260916 now win (each measured under 'shipped' and under a, nothing else changed) and
// leave the list; seed 1 still loses (43,187 left at turn 38). Nothing on the boss was touched.
// 2026-10-08, re-parity W1 (FFX only): the hit, variance and critical rolls come in the game's order and Cross Cleave —
// party-wide, accuracy formula 0 in the game's own command record (0x6074), never rolled — always hits, where our data
// had it on an accuracy byte of 100 marked [estimate]. Seeds 1, 7 and 42 now lose (7 and 1 inside the opening cycles,
// at turns 11 and 9 with Seymour untouched; 42 at turn 50) and 20260916 still wins. Nothing on the boss or the party was
// tuned; restoring only Cross Cleave's old accuracy formula gives 17 of seeds 1-40 again (measured on the same tree).
// 2026-10-09, re-parity AI-Seymour (FFX only): Flux and the Mortiorchis now follow the game's own scripts (D-01 to D-08 of
// research/re-ffx-ai-seymour.md). All four named seeds win, and so does every seed measured (see docs/handoff/re-parity-ai-seymour.md
// for the 500-seed table and the ablation of what moved it). Nothing on the boss or the party was tuned.
// 2026-10-10, re-parity W2 merged onto release candidate 1 (FFX only): the turn order, the status step and the per-turn ticks are the game's on top of
// those scripts (the Mortiorchis is still charged the dummy Command 150's rank 3, tests/unit/re-parity-w2-rc1-merge.test.ts). All four named seeds still win
// and seeds 1 to 40 are 40 of 40; the four windows are 158 of 160 (it was 160) and the shipped line wins 499 of seeds 1 to 500 (it won all 500).
const KNOWN_LOSSES: readonly number[] = [];

/**
 * ### 2026-09-19, the release-prep pass — read this before trusting the list above
 *
 * Three of the four named seeds are documented losses now, and the forty-seed
 * rate went **up**. Both are true, and the second is the one that matters: the
 * four seeds are a sample of forty, and a line that wins 65% of them will drop
 * three of any four often enough (about one window in nine).
 *
 * | | seeds 1-40 | 41-80 | 101-140 | 1001-1040 | **160 seeds** |
 * |---|---:|---:|---:|---:|---:|
 * | before | 23 | 26 | 24 | 24 | **97** |
 * | after  | **26** | 21 | 24 | 29 | **100** |
 *
 * Three changes, all in `src/engine/tactics/seymour-flux.ts`, none of them a
 * change to the boss or to battle math:
 *
 *  1. **An aeon spends its one turn on its Overdrive** (§4.5, §5.7). The
 *     strike ladder knew three Overdrive labels and all three were the
 *     party's, so every summon fell through to the thrown-item rung: measured
 *     over these forty seeds, 35 Bahamut summons, 35 Fire Gems thrown by
 *     Bahamut, and **Mega Flare cast zero times**.
 *  2. **Two aeons are held back until he crosses 50%** (§6 row 15, which says
 *     "in phase 2" in so many words; §4.4.2, where a summon is the only thing
 *     that postpones Total Annihilation). Reserve of 0 / 1 / 2 / 3 measures
 *     91 / 96 / 100 / 56 wins of 160.
 *  3. **Dispel his Reflect as a phase-2 rung** rather than below the Cheer
 *     ladder (§6 row 8, §5.3), which is where the file's own comment has said
 *     it belongs since §4.4.1's loop was fixed.
 *
 * **The target was 34 of 40 and this is 26.** What still caps it, measured on
 * this window: `Full-Life` is 50 of the 110 party KOs — Lance of Atrophy
 * zombifies, the mount's very next action kills, and at Agility 38 apiece the
 * two enemy actors routinely take those two steps with no party turn in
 * between, which is the pairing this file's header already names. Of 78 Cross
 * Cleave casts only 88 hits land, i.e. the party is down to roughly one
 * standing member by the time the party-wide hit arrives. Shell coverage in
 * phase 2 is already 92% and Total Annihilation is down to ~348 a hit, so the
 * phase-2 wall is no longer the binding constraint; the Zombie combo is.
 * Things measured and rejected on the way, each worse than the line above:
 * party-wide Reflect off the six Star Curtains (33 of 160 — Dispel strips it
 * every cycle and it blocks Yuna's own heals), benching Kimahri the moment
 * Mighty Guard is spent (91), benching Yuna when she is idle (85), rebuilding
 * the Cheer ladder after each death (93), Silence bought with a Wakka swap
 * (94), farming the Mortiorchis while its max HP is still decaying (98), and
 * gating the Poison Fang opener on the party being safe (70 — the poison is
 * the largest single line in the damage budget and landing it late costs more
 * than the turn it saves).
 */

describe('the shipped intended strategy beats Chapter 1', () => {
  for (const seed of SEEDS) {
    const expected = KNOWN_LOSSES.includes(seed) ? 'is a documented loss' : 'wins';
    it(`${expected} against Seymour Flux and completes the chain (seed ${seed})`, () => {
      const r = runIntended(seed);
      // Printed so a failure shows *how* it lost, not just that it did.
      console.log(`seed ${seed}:`, JSON.stringify(r));

      expect(r.decisions, 'the battle must reach a decision, not spin').toBeLessThan(MAX_DECISIONS);
      if (KNOWN_LOSSES.includes(seed)) {
        // Still an assertion with teeth: it must reach a real outcome, and it
        // must not be losing because it went after the mount (§2.2).
        expect(r.outcome).toBe('defeat');
        // Still an assertion with teeth: the line must have lasted into the first full cycle of the
        // fight (battle turn 8 or later) rather than wiping on the opening Lance of Atrophy. Since
        // 2026-10-08 (re-parity W1) the bound is on the turn, not on Seymour's HP: with Cross Cleave
        // always landing, two of the three documented losses end with Seymour untouched.
        expect(r.turns, 'a documented loss is still a fight, not a turn-4 wipe').toBeGreaterThanOrEqual(8);
        return;
      }
      expect(r.outcome).toBe('victory');
      expect(r.bossHp, 'Seymour Flux is the win condition, not the mount').toBe(0);
      expect(r.links, 'the encounter is a single-link chain and it must complete').toBe(1);

      // §2.2: "Mortiorchis has no death state at all in this encounter." Its
      // max HP floors at 1,000 and it revives from every kill, so it must still
      // be standing when the fight ends — a run that ended with a dead mount
      // would mean the floor was implemented as a decay to zero, the exact
      // failure the correction box exists to prevent.
      expect(r.mountHp, 'the Mortiorchis is never permanently dead').toBeGreaterThan(0);
      expect(r.mountMaxHp, 'its max HP floors at 1,000').toBeGreaterThanOrEqual(1_000);
    }, 30_000);
  }

  /**
   * Four seeds prove a line exists; they do not prove it is the line rather
   * than four lucky rolls. This is the assertion that actually guards the
   * chapter, and it is where the release-prep pass is measured: **26 of these
   * forty**, against 23 before it, and 100 of the 160 seeds in the four
   * windows the note on `KNOWN_LOSSES` tabulates.
   *
   * The bar moves 22 -> 25 with it. High enough that losing the aeon
   * Overdrives again (19 when it was measured), or banking three aeons instead
   * of two (10), goes red immediately; low enough that ordinary tail variance
   * on a 65% line over forty samples does not flake it. Any regression toward
   * the coin-flip this used to be — **0** of 40 before the tactic existed —
   * fails here first.
   *
   * **The bar moves back 25 -> 22 on 2026-09-24 (combat-fixes-0924 (d), FFX only).** Poison carrying
   * Seymour below 50 % no longer opens phase 2 [ffx-seymour-flux §4.3: "HP loss came from Poison |
   * No threshold reaction, no pattern change"], so the free self-Flares the old HP-read phase handed
   * the party are gone: 26 -> 23 of these forty (seeds 8, 11, 17 and 33 lost, 12 won), 227 -> 214 of
   * seeds 1-400. Every changed seed is a Poison-crossing run. Bailey approved the fix knowing it moves
   * difficulty; nothing on the boss was tuned (`docs/plans/combat-fixes-0924-review.md` §8).
   *
   * **22 -> 15 on 2026-09-25 (PR-0155, FFX only; Bailey: "I'll go with all your recommendations").**
   * An aeon's menu has no Item row [ffx-combat-core §6.2], so Ifrit, Ixion and Shiva no longer throw
   * Gems on their one turn: 23 -> 17 of these forty, measured with nothing else changed (26 -> 17
   * against live a999d133, both fixes together). 17/40 is under half: this is a floor, not a promise.
   */
  it('keeps at least 36 wins in forty contiguous seeds (measured 40 on 2026-10-09 and again on 2026-10-10)', () => {
    const results = Array.from({ length: 40 }, (_, i) => runIntended(i + 1));
    const wins = results.filter((r) => r.outcome === 'victory').length;
    const lost = results
      .map((r, i) => ({ seed: i + 1, r }))
      .filter((x) => x.r.outcome !== 'victory')
      .map((x) => `${x.seed}: ${x.r.outcome} with ${x.r.bossHp} left at turn ${x.r.turns}`);
    console.log(`seeds 1-40: ${wins} wins; losses: ${lost.join(', ') || 'none'}`);

    // 17/40 on 2026-09-25 (PR-0155); 18/40 under PR-0179 arm a (D-243, 2026-09-27). The floor stayed at 15.
    // 18 -> 10 on 2026-10-08 (re-parity W1, FFX only; floor 15 -> 8): the game's own record makes Cross Cleave
    // unevadable (accuracy formula 0), where our data rolled it on an accuracy byte of 100 marked [estimate]. Restoring
    // only that one formula gives 17/40 on the same tree, so the whole move is that sourced answer. Nothing on the
    // boss or the party was tuned; the difficulty it implies is Bailey's call (docs/handoff/re-parity-w1.md).
    // 10 -> 40 on 2026-10-09 (re-parity AI-Seymour, FFX only; floor 8 -> 36): Flux and the Mortiorchis follow the game's own
    // scripts. The ablation (docs/handoff/re-parity-ai-seymour.md) shows no single row decides it: reverting the seven rows
    // together gives 85 of 500 wins, any six of them leave it near 100 %. Nothing on the boss or the party was tuned; the
    // difficulty it implies is Bailey's call. The floor is the project's 90 % bar.
    expect(wins, 'Chapter 1 fell below its 36/40 floor (40/40 measured 2026-10-09, re-parity AI-Seymour; 40/40 again with re-parity W2 merged, 2026-10-10)').toBeGreaterThanOrEqual(36);
  }, 120_000);

  /**
   * **The 160-seed floor (PR-0008, 2026-09-25; FFX only; Bailey: "I'll go with all your
   * recommendations", decisions-2026-09-25 item 5).** Forty seeds swing 17-29 wins from window to
   * window, so the chapter is measured over the four standard windows too. Refreshed method check
   * (`docs/plans/pr-0008-method-check.md`, 2026-09-25 section): 17 / 17 / 19 / 25 = **78 of 160**;
   * the floor sits five wins below it. At most two losses before battle turn 10 (measured 1: seed 20
   * at turn 8), and a battle turn is the engine's, not a player's. Nothing on the boss was tuned.
   */
  it('keeps at least 144 wins over the four standard windows (measured 160 of 160 on 2026-10-09, 158 of 160 on 2026-10-10)', () => {
    const perWindow: number[] = [];
    let early = 0;
    for (const [a, b] of WINDOWS) {
      let wins = 0;
      for (let seed = a; seed <= b; seed++) {
        const r = runIntended(seed);
        if (r.outcome === 'victory') wins++;
        else if (r.turns < 10) early++;
      }
      perWindow.push(wins);
    }
    const total = perWindow.reduce((s, w) => s + w, 0);
    console.log(`four windows: ${perWindow.join(' / ')} = ${total} of 160; losses before battle turn 10: ${early}`);

    // 17 / 17 / 19 / 25 = 78 on 2026-09-25 (PR-0008); 18 / 19 / 21 / 21 = 79 under PR-0179 arm a
    // (D-243, 2026-09-27; one loss before turn 10 either way). The floor stayed at 73 and the early losses at 2.
    // 79 -> 45 on 2026-10-08 (re-parity W1, FFX only; floor 73 -> 40, early losses 2 -> 12 with 9 measured): the same
    // sourced answer as the forty-seed window above, Cross Cleave always landing. Nothing was tuned.
    // 45 -> 160 on 2026-10-09 (re-parity AI-Seymour, FFX only; floor 40 -> 144 = 90 %, early losses 12 -> 2, none measured): see the
    // forty-seed window above. Nothing was tuned.
    // 160 -> 158 on 2026-10-10 (re-parity W2 merged onto release candidate 1, FFX only; 40 / 40 / 39 / 39): two seeds of 160 lose now, none before turn 10;
    // the 500-seed rate is 499 of 500 (docs/handoff/re-parity-w2.md). Floor and bound unchanged. Nothing was tuned.
    expect(total, 'Chapter 1 fell below its 144/160 floor (160/160 measured 2026-10-09, re-parity AI-Seymour; 158/160 with re-parity W2 merged, 2026-10-10)').toBeGreaterThanOrEqual(144);
    expect(early, 'a loss before battle turn 10 is a wipe, not a fight').toBeLessThanOrEqual(2);
  }, 240_000);

  /**
   * The two mechanics the line is actually built on, asserted directly so a
   * win that stopped using them would still go red.
   *
   *  * **Poison** (§6 rows 5-6) is 2% of 70,000 a turn, flat, for ever, and it
   *    is the largest single line in the party's damage budget.
   *  * **The aeons** (§6 row 15) are the shield: a summon puts the party
   *    off-stage with frozen counters and answers Seymour with a zero-damage
   *    Banish.
   */
  it('poisons him on the way in and spends the aeons', () => {
    const r = runIntended(42);
    console.log(`seed 42 mechanics:`, JSON.stringify(r));
    expect(r.poison, 'the poison must be landed and must tick').toBeGreaterThanOrEqual(1_400 * 5);
    expect(r.summons, 'the aeons are the line, not decoration').toBeGreaterThanOrEqual(3);
  }, 30_000);
});

/**
 * The wrong tactic must stay punished, independently of whether the intended
 * strategy currently wins.
 *
 * §6 row 17, as corrected in §2.2: killing the Mortiorchis is a *damage route
 * into Seymour*, "not a way to remove the adds… players cannot simply eliminate
 * it as a permanent solution". Its max HP floors at 1,000 and Mortibsorption
 * revives it every time, so a party that spends the fight on the mount is
 * feeding a bucket with a hole in it — which is precisely what the generic
 * `bestEnemyTarget` does, because it prefers a `flags.isPart` target.
 */
/**
 * **Re-parity (2026-10-09, FFX only; D-06 of `research/re-ffx-ai-seymour.md`): this used to be a claim that the route loses.**
 * It is still §2.2's claim that the mount is never gone, and §6 row 17's that it is "a damage route into Seymour": every
 * kill puts the mount back at the revive value (4,000, 3,000, 2,000, 1,000, 1,000 ...) and Mortibsorption drains him for
 * the same number. What the old engine added was a mount that came back 1,000 HP weaker (3,000 first), so the route fed
 * him less and lost. The game's own order restores the value first, so each of the first three lives is worth 1,000 more
 * and the route can win; it is measured below and reported, never tuned.
 */
describe('killing the Mortiorchis instead of Seymour is a damage route into him, and the mount is never gone', () => {
  for (const seed of SEEDS) {
    it(`drains him for exactly the revive value each time (seed ${seed})`, () => {
      const engine = newEngine(seed);
      let outcome: string | undefined;
      let mountKills = 0;

      for (let i = 0; i < MAX_DECISIONS; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') {
          outcome = d.result.outcome;
          break;
        }
        if (d.kind !== 'player-input') continue;
        // The shipped line, with one thing taken away: every offensive row is
        // re-aimed at the mount. Support rows are left alone, so this is the
        // *targeting* mistake in isolation and not a crippled party.
        const cmd = intendedStrategy(d.actorId, d.commands, engine) ?? attack(d);
        const aimedAtBoss = ((cmd.targets ?? []) as readonly string[]).includes('seymour-flux');
        const row = d.commands.find(
          (c) => c.enabled && c.command.kind === cmd.kind && c.validTargets.includes('mortiorchis'),
        );
        engine.submit(aimedAtBoss && row ? ({ ...cmd, targets: ['mortiorchis'] } as Command) : cmd);
      }

      const drains: number[] = [];
      for (const e of engine.state().log) {
        if (e.type === 'heal' && e.targetId === 'mortiorchis' && e.cause === 'mortibsorption') {
          mountKills++;
          drains.push(e.amount);
        }
      }
      const bossHp = engine.state().combatants['seymour-flux']?.hp ?? 0;
      console.log(`seed ${seed}: ${outcome}, ${mountKills} Mortibsorptions, ${bossHp} left`);

      expect(outcome, 'the battle must reach a decision').toBeDefined();
      // The drain equals the value the mount came back at: 4,000, 3,000, 2,000, 1,000, then 1,000 for ever (D-06).
      expect(drains.length, 'the route kills the mount at least once').toBeGreaterThan(0);
      expect(drains.slice(0, 5)).toEqual([4_000, 3_000, 2_000, 1_000, 1_000].slice(0, Math.min(5, drains.length)));
      expect(drains.every((a) => a >= 1_000)).toBe(true);
      expect(engine.state().combatants['mortiorchis']?.hp ?? 0, 'the mount is never permanently dead').toBeGreaterThan(0);
      // Not asserted any more (2026-10-09): that the route loses with Seymour barely scratched. Until then it did, 63,000 /
      // 22,141 / 56,234 / 45,588 left on these four seeds (2 / 13 / 3 / 9 Mortibsorptions), because the mount came back 1,000
      // weaker than the game's script restores it (D-06). The outcome is printed above and measured in the handoff.
    }, 30_000);
  }
});
