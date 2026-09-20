/**
 * The SHIPPED `intendedStrategy` against Chapter 3, headlessly, end to end.
 *
 * Chapter 3 is not one battle: it is a **seven-link chain** with no menu
 * between links — Braska's Final Aeon (60,000 then 120,000) → one battle per
 * aeon Yuna owns → Yu Yevon — and the party's HP, MP, statuses, Overdrive
 * gauges and item counts carry straight through. A test that only ran the first
 * formation would prove almost nothing about the chapter, because the last link
 * is won or lost by what the inventory looks like when it starts. So this file
 * drives the chain exactly the way `BattleScreen.runEncounter` does: run the
 * engine to a decision, follow `EnemyGroupDef.nextGroupId`, re-init on the next
 * formation through `setupForNextLink`, and count links.
 *
 * Mirrors `./strategy-chapter2.test.ts`, which is the harness that caught the
 * equivalent Chapter 2 problem: the e2e suite and `__pyrefly.autoBattle`
 * both drive the game with `src/engine/BattlePresenterStrategies.ts`, and
 * nothing asserted that *that* strategy wins. Chapter 3 was losing on turn 128
 * of link 1 while every engine test stayed green.
 */

import { describe, expect, it } from 'vitest';
import type {
  Command,
  Decision,
  EnemyGroupDef,
  FFXPartyBuild,
} from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';

const MAX_DECISIONS = 40_000;

/** The four seeds the coordinating session measures every encounter on. */
const SEEDS = [1, 7, 42, 20260916];

/**
 * Braska's Final Aeon → Valefor → Ifrit → Ixion → Shiva → Bahamut → Yu Yevon,
 * for the `dreams-end` roster (the five mandatory aeons, §4.4).
 */
const EXPECTED_LINKS = 7;

function newEngine() {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  return createFFXEngine({ content, autoResolveMinigames: true });
}

/** Plain Attack on the first valid target — used only when the strategy declines to act. */
function attack(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row =
    d.commands.find((c) => c.command.kind === 'attack' && c.enabled) ?? d.commands.find((c) => c.enabled);
  const target = row?.validTargets[0];
  return (row
    ? { ...row.command, targets: target ? [target] : [] }
    : { kind: 'attack', targets: [] }) as Command;
}

interface Run {
  outcome: string;
  /** How many formations were fought. 7 is the whole chapter. */
  links: number;
  decisions: number;
  /** One line per link, so a failure prints *where* and *how* it died. */
  trail: string[];
}

/**
 * Run the whole chain under the shipped strategy.
 *
 * `chooseCommand` lets the "wrong tactics stay punished" blocks below wrap the
 * shipped strategy without duplicating the chain loop.
 */
function runChain(
  seed: number,
  party: FFXPartyBuild = dreamsEndBuild,
  chooseCommand?: (d: Extract<Decision, { kind: 'player-input' }>, engine: ReturnType<typeof newEngine>) => Command | null,
): Run {
  const engine = newEngine();
  const first = ENEMY_GROUPS_BY_ID['braskas-final-aeon'];
  if (!first) throw new Error('braskas-final-aeon group missing from the data layer');

  let group: EnemyGroupDef = first;
  let setup = {
    game: 'ffx' as const,
    party,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal' as const,
    canEscape: false,
  };
  engine.init(setup);

  const run: Run = { outcome: 'aborted', links: 0, decisions: 0, trail: [] };

  for (;;) {
    run.links++;
    let linkOutcome: string | undefined;
    for (let i = 0; i < MAX_DECISIONS; i++) {
      run.decisions++;
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') {
        linkOutcome = d.result.outcome;
        break;
      }
      if (d.kind !== 'player-input') continue;
      const override = chooseCommand?.(d, engine) ?? null;
      engine.submit(override ?? intendedStrategy(d.actorId, d.commands, engine) ?? attack(d));
    }

    const state = engine.state();
    const foes = Object.values(state.combatants)
      .filter((c) => c.side === 'enemy' && !c.flags.isPart)
      .map((c) => `${c.id} ${c.hp}/${c.stats.maxHp}`)
      .join(', ');
    run.trail.push(`link ${run.links} [${group.id}] ${linkOutcome ?? 'stalled'} turn=${state.turn} (${foes})`);
    run.outcome = linkOutcome ?? 'stalled';
    if (run.outcome !== 'victory') break;

    const nextId = group.nextGroupId;
    if (nextId === undefined) break;
    const next = ENEMY_GROUPS_BY_ID[nextId];
    if (!next) {
      run.trail.push(`  !! chapter chains to "${nextId}" but no formation exports that id`);
      break;
    }
    setup = { ...setup, ...setupForNextLink(setup, next, state, seed + run.links) } as typeof setup;
    group = next;
    engine.setSeed(setup.seed);
    engine.init(setup);
  }

  return run;
}

/**
 * The acceptance test for Chapter 3.
 *
 * The line, in one paragraph, so a failure here is legible without reading
 * `src/engine/tactics/braskas-final-aeon.ts`:
 *
 * **The bench is the chapter.** §1 `[verified: 2 sources]` says reserve
 * swapping works normally here and `ffx-combat-core.md` §1.7
 * `[verified: 2 sources]` says the incoming member takes the turn happening
 * right now - so a Switch is **free**, and all seven guardians can play. **Lulu
 * takes the third seat** and is the party's damage: her Firaga is 1,905 against
 * the boss's Magic Defense and 4,473 against a Mental-Broken one, where Tidus's
 * sword is 687 and Auron's 1,396, and **Doublecast** (§4.2's recommendation
 * grants it by name) doubles both. Tidus keeps the seat only while he has
 * something nobody else can do - Hastega, the Cheer ladder, Slow, a Talk charge
 * - and Auron lends his own seat back to Tidus for exactly as long as it takes
 * to Haste her.
 *
 * **Both pillars are Slowed and then left standing.** §1.4's guidance is "kill
 * both or neither" and this line picks **neither**: Slow is one of the only two
 * statuses a Yu Pagoda is not immune to (§1.4, resist 50), it is permanent, and
 * it halves Power Wave for the rest of the battle - where killing the pair
 * costs 10,000-15,000 damage every 63-tick revive cycle, which measured is more
 * than half of everything the party produces. Nothing is killed, so the
 * lone-survivor Curse §1.4 warns about never happens.
 *
 * **Auron carries the Zombie and the Mental Break.** §1.6
 * `[verified: 2 sources]`: while the boss is Zombie the next Power Wave deals
 * **1,500 damage instead of healing**, and Zombiestrike on a weapon re-applies
 * it - so the pillars spend the battle damaging their own boss. Mental Break
 * rides with it for the flat x2.35 on every -aga.
 *
 * Then: **Hastega up and kept up**; the two **Stamina Tonics**; the **Cheer
 * ladder exactly once**, because a KO clears the stacks and re-running it after
 * every revive cost five consecutive turns in a measured losing tail; and
 * **Yu Yevon is never attacked** - the Candle of Life goes in first for the
 * Doom, the pillars stay suppressed, and nobody swings until his own Gravija
 * has taken him under 900.
 *
 * **And the five aeons and the two Talk charges are all held for the Ultimate
 * Jecht Shot phase** (round 4). §1.6's branch table is checked in order and
 * only its *third* row can wipe a party: an aeon on the field turns the charge
 * into a single-target Jecht Bomber, form 1 spends it on Triumphant Grasp and
 * form 2 above half on Triumphant Grasp 2 - all single-target, all answered by
 * one Curaga - and only **form 2 at or below half** spends it on Ultimate Jecht
 * Shot, ~4,700 on all three at once. §1.6 says the Talk charges *"**must** be
 * saved for the Ultimate Jecht Shot phase"* and an aeon cancels the same charge
 * for free, so the roster is saved for it too. Measured, spending them on
 * whatever gauge filled first left the party eating **ten** Ultimate Jecht
 * Shots for 137,905 damage on one of the seeds it then lost.
 *
 * **Tidus buys the MP to finish the Slow ladder** (round 4). Slow is
 * `chance 100` against a Pagoda's `resistance 50`, which `statuses.ts` resolves
 * as `100 - 50 > rng(0..100)` - a shade under half. A pair costs four casts on
 * average and can cost nine; at 12 MP each against his 140 (30 of which is
 * Hastega) he runs dry, and a dry Tidus stops being asked for the seat at all,
 * so the pillar he failed to Slow Power Waves at full rate for the rest of the
 * battle. He drinks an Ether instead, and while that debt is open nobody else
 * touches them.
 *
 * Measured: **4/4 on the canonical seeds**, **8/8 on the eight seeds the
 * round-3 verifier picked** (previously 5/8, all three losses on link 1 against
 * the 120,000-HP second form) and **38/40 on seeds 1-40**. Every win walks all
 * seven links and **every loss is link 1** - from the possessed aeons onward
 * the party carries the fayth's permanent Auto-Life and those fights cannot be
 * lost (§2.3).
 *
 * ## What deviates from the research, stated up front
 *
 * An earlier round won the chapter by multiplying the party's Strength by 1.5,
 * which is a x2.6-x2.9 on the damage because the power term is cubic. **That is
 * reverted in full**, and so is the one exception the round after it kept:
 * **Yuna's Strength is §4.1's published 20**, not §4.4's 28. §4.4's sentence is
 * a *threshold* quoted as a recommendation ("the wiki singles out 'Yuna's
 * Strength at least 28' as the threshold for Bahamut's Mega Flare plus a couple
 * of attacks to finish the job"), not a statement about the typical build -
 * §4.1 is the section that answers that question and it says 20. It bought
 * nothing anyway: this build's aeons carry their own stat block, so nothing in
 * the engine scales an aeon off Yuna. **Every offensive stat is now §4.1
 * exactly as published.**
 *
 * What remains is two changes that add **no damage at all**, and both are
 * §4.1's own invitation - it performs exactly one sanity check ("Ultimate Jecht
 * Shot ... would KO Yuna and Lulu outright") and then says "the preset should
 * be tuned so the fight is winnable":
 *
 *   * the **HP column** scaled so no member is removed outright by the top of
 *     §1.5's published Ultimate Jecht Shot band (5,040), then clamped to the
 *     shared stat band `data-ffx-builds.test.ts` holds every chapter to;
 *   * **Auron's Agility 22 -> 29**, the anomaly inside §4.1's own table, where
 *     the party's melee anchor has the lowest Agility of all seven.
 *
 * Full derivation and the measured win-rate table are in
 * `src/data/ffx/builds/dreams-end.ts`'s `PRESET_CORRECTION`. **No enemy HP,
 * stat, ability, counter, AI branch or rotation was changed in the party's
 * favour anywhere in this chapter** - every enemy-side edit of this round and
 * the two before it made the encounter harder, and this round also took §4.4's
 * Stoneproof rule seriously: the build had inherited seven pieces, which made
 * Jecht Beam's Petrify land zero times in a full chain, and now carries the
 * "exactly one or two" §4.4 asks for.
 *
 * ## Engine and data defects fixed for this chapter
 *
 * 2026-09-17 (third pass), written up in `docs/CONTRACT-CHANGES.md`:
 *
 *  1. **Doublecast did nothing.** §4.2's recommendation grants it, `dreams-end`
 *     gives it to Lulu, the ability record carries
 *     `extra.castsTwoBlackMagicSpells`, `AbilityCommand.wrappedId` was
 *     documented in the contract as *"Doublecast / Copycat wrapper"* - and
 *     nothing in the engine read any of it, so the row spent a whole turn on a
 *     `formula: 'none'` no-op. `execute.ts resolveDoublecast` is the reader.
 *  2. **Lulu's Overdrive could not be fired at all.** Her build lists the
 *     generic `'fury'` menu marker, which `execute.ts` refuses outright; the
 *     tactic now re-shapes it into one of the 19 ids its own `resolvesToOneOf`
 *     names, the same way it already re-shapes Talk. (Measured, it is still not
 *     worth a turn here - see the tactic - but it is now a decision rather than
 *     a dead row.)
 *
 * 2026-09-17 (second pass), retained: the Yu Pagodas never revived (§1.4's
 * `reviveRule`); an FFX chain silently restocked the whole item bag at every
 * link; `max-hp-x2` was a status with no effect, so the Stamina Tonics were
 * inert; the tactic cast Armor Break at possessed aeons, which are 255-immune
 * to all four Breaks (§2.2).
 *
 * 2026-09-16 (first pass), retained: the chapter's `nextGroupId` pointed at an
 * id no formation exports, so the chain stopped dead after link 1; no Yu Pagoda
 * ever cast Power Wave; Braska's Final Aeon never used a single Overdrive in
 * either form and Talk was inert; Sleep never counted down; Ether/Turbo
 * Ether/Elixir restored HP instead of MP; the fayth's permanent Auto-Life was
 * never applied; and every possessed aeon stood up with 1 HP instead of
 * mirroring the player's own (§2.2).
 */
describe('the shipped intended strategy beats Chapter 3', () => {
  for (const seed of SEEDS) {
    it(`wins the whole chain, Braska's Final Aeon through Yu Yevon (seed ${seed})`, () => {
      const r = runChain(seed);
      // Printed so a failure shows *where* it lost, not just that it did.
      console.log(`seed ${seed}:\n  ${r.trail.join('\n  ')}`);

      expect(r.decisions, 'the chain must reach a decision, not spin').toBeLessThan(MAX_DECISIONS);
      expect(r.outcome).toBe('victory');
      expect(
        r.links,
        'the chapter is a chain: Braska\'s Final Aeon, five possessed aeons, Yu Yevon',
      ).toBe(EXPECTED_LINKS);
    });
  }

  /**
   * Four seeds prove a line exists; they do not prove it is the line rather
   * than four lucky rolls. This is the regression net: forty contiguous seeds
   * of the whole chapter in about a second.
   *
   * Measured **39/40** on this window as of round 5 (38/40 before it, 36/40
   * before round 4). The bar is 36 so ordinary tail variance does not flake it,
   * and so that a regression toward what this was at the §4.1 preset with no
   * bench, no Doublecast and no Zombie - **0/40, a guaranteed defeat on link 1**
   * - goes red immediately.
   *
   * The wider picture behind this window, measured over the **thousand**
   * contiguous seeds 1-1000 under the shipped line: **972 wins, 97.2 %**
   * (193, 194, 191, 199 and 195 out of 200 on the five windows), against
   * 930/1000 = 93.0 % before round 5's {@link summonNow} change. All 28 losses
   * are link 1 - from the possessed aeons onward the party carries the fayth's
   * permanent Auto-Life and those fights cannot be lost (§2.3).
   */
  it('wins the great majority of forty contiguous seeds, chain and all', () => {
    const results = Array.from({ length: 40 }, (_, i) => runChain(i + 1));
    const wins = results.filter((r) => r.outcome === 'victory' && r.links === EXPECTED_LINKS).length;
    const lost = results
      .map((r, i) => ({ seed: i + 1, r }))
      .filter((x) => x.r.outcome !== 'victory' || x.r.links !== EXPECTED_LINKS)
      .map((x) => `${x.seed}: ${x.r.trail.at(-1)}`);
    console.log(`seeds 1-40: ${wins} wins; losses: ${lost.join(' | ') || 'none'}`);

    expect(wins, 'Chapter 3 must be reliably winnable, not a coin flip').toBeGreaterThanOrEqual(36);
    // Forty seven-link chains are about a second on an idle machine; the budget
    // is for a loaded one, where a dozen other vitest runs are competing.
  }, 180_000);

  /**
   * **The eight seeds the round-3 verifier picked**, none of which the four
   * canonical seeds or the 1-40 net contains.
   *
   * They are here because they are what failed: the round-3 line won 5 of
   * these 8, and all three losses were link 1 against the 120,000-HP second
   * form, which is the one place in the chapter a party can actually lose. The
   * rules that closed them are all in `src/engine/tactics/braskas-final-aeon.ts`
   * - Tidus's Ether for the Slow ladder (round 4), and round 5's
   * `summonNow`, which spends the aeon roster on the boss's Overdrive gauge
   * and puts that decision *ahead* of the routine Protect and top-up in
   * `supportTurn`. This block is what stops any of them being quietly undone.
   * Measured **8/8**; the bar is 7 so one seed of headroom exists for an
   * unrelated tuning change.
   */
  it('wins the eight seeds the verifier picked, chain and all', () => {
    const seeds = [2, 3, 5, 11, 13, 99, 1234, 7777];
    const results = seeds.map((seed) => ({ seed, r: runChain(seed) }));
    const won = results.filter((x) => x.r.outcome === 'victory' && x.r.links === EXPECTED_LINKS);
    const lost = results
      .filter((x) => x.r.outcome !== 'victory' || x.r.links !== EXPECTED_LINKS)
      .map((x) => `${x.seed}: ${x.r.trail.at(-1)}`);
    console.log(`verifier seeds: ${won.length}/${seeds.length} wins; losses: ${lost.join(' | ') || 'none'}`);

    expect(
      won.length,
      'the seeds the previous round lost are the regression this block exists for',
    ).toBeGreaterThanOrEqual(7);
  }, 180_000);
});

/**
 * The wrong tactic must stay punished, independently of whether the intended
 * line currently wins. `research/ffx-bfa-yu-yevon.md` §3.4.1 is the whole of
 * the last fight and it is counter-intuitive enough to be worth pinning:
 *
 * > Yu Yevon fires **at most one Curaga per player-side action that deals him
 * > damage**, evaluated after that action has fully resolved.
 *
 * With this party's best single action worth about 3,700 and the counter-heal
 * capped at 9,999, **every swing is a net heal of six thousand**. The wrapper
 * below plays the obvious game — hit the boss — and what it measures is that
 * swinging buys nothing: the fight is not won by the party's damage.
 *
 * **What it used to assert, and why that changed (Build A.1).** Until round 03
 * blockers #15 and #16a were fixed this block asserted that the swinging line
 * never ends and leaves him above 80,000 HP. That was not the research; it was
 * two defects. (a) `collectBossCounters` never checked `attacker.side`, so
 * every Yu Pagoda Power Wave aimed at him fired his own 9,999 Curaga — a row
 * §3.4.1's table scores at **0** — and the two Pagodas healed him faster than
 * anything could hurt him. (b) His Gravija's target list was hand-built as
 * party-plus-self, though §3.3 says it "removes exactly 75% of current HP from
 * **every target on the field**", so the Pagodas were never in its blast and
 * never suppressed. With both fixed, §3.5's stated attrition route works as
 * documented — "when Gravija starts showing 0, he is at 1 HP and any hit
 * finishes him" — and the group record's "Cannot be lost" holds. So a party
 * that does nothing but swing at him *does* eventually see him die, from his
 * own Gravija, after hundreds of turns. That is the shape this block now pins:
 * the counter still eats every swing, and the slow route stays slow.
 *
 * It reaches Yu Yevon by playing the shipped line for the first six links and
 * only overriding on the last one, so this measures the counter and nothing
 * else.
 */
describe('out-damaging Yu Yevon stays a losing tactic', () => {
  for (const seed of [1, 42]) {
    it(`a party that swings at him wins only the slow way (seed ${seed})`, () => {
      let swings = 0;
      const r = runChain(seed, dreamsEndBuild, (d, engine) => {
        const state = engine.state();
        const yevon = state.combatants['yu-yevon'];
        if (!yevon || !yevon.alive) return null;
        const row = d.commands.find(
          (c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes('yu-yevon'),
        );
        if (!row) return null;
        swings++;
        return { ...row.command, targets: ['yu-yevon'] } as Command;
      });

      console.log(`seed ${seed}: ${r.outcome} after ${swings} swings\n  ${r.trail.join('\n  ')}`);

      // It got there: the first six links are the shipped line and they win.
      expect(r.links, 'the wrapper must actually reach Yu Yevon, or it proves nothing').toBe(
        EXPECTED_LINKS,
      );
      expect(swings, 'the wrapper must actually have swung at him').toBeGreaterThan(10);

      // The counter ate every swing; the only thing that moved his bar was his
      // own Gravija, and §3.5 says that route ends at 1 HP with "any hit"
      // finishing him. So the fight ends — after hundreds of turns of it.
      expect(r.outcome, 'the fight has to reach an outcome').toBe('victory');
      const lastLink = r.trail.at(-1) ?? '';
      expect(lastLink, 'the last link in the trail must be Yu Yevon').toContain('yu-yevon');
      const turns = Number(/turn=(\d+)/.exec(lastLink)?.[1] ?? 0);
      // The shipped line (`intendedStrategy`, above) takes about 200 turns for
      // the whole seven-link chain. Swinging at him takes that many on the last
      // link alone: out-damaging the counter is still not a route this party
      // has, which is what §3.5 warns about.
      expect(turns, 'swinging must stay the slow route, not a way to out-damage him').toBeGreaterThan(
        300,
      );
      // This one deliberately runs the last link to its decision ceiling, so it
      // is the slowest block in the file; the budget is for a loaded machine.
    }, 180_000);
  }
});
