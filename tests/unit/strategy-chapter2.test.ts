/**
 * The SHIPPED `intendedStrategy` against Chapter 2 (Yunalesca), headlessly.
 *
 * `ffx-chapter2.test.ts` proves the engine is sound: a hand-written driver that
 * cures Darkness wins. That driver lives inside the test, though. The e2e suite
 * and `__pyrefly.autoBattle('intended')` drive the game with
 * `src/engine/BattlePresenterStrategies.ts` instead, and nothing asserted that
 * *that* strategy wins. So Chapter 2 could stall in the real game while every
 * engine test stayed green, which is exactly what happened.
 *
 * This runs the real strategy against the real engine and data with no browser.
 * The browser e2e was the wrong harness for this question: at `speed: 'skip'`
 * the battle loop saturates the page's main thread, so a follow-up
 * `page.evaluate` to read the log never gets scheduled and the run hangs
 * instead of reporting.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, Command, Decision, FFXPartyBuild } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const MAX_DECISIONS = 30_000;

/** The four seeds the coordinating session measures this encounter on. */
const SEEDS = [1, 7, 42, 20260916];

function newEngine(seed: number, party: FFXPartyBuild = zanarkandBuild) {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const group = ENEMY_GROUPS_BY_ID['yunalesca'];
  if (!group) throw new Error('yunalesca group missing from the data layer');
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

/** Plain Attack on the first valid target — used only when the strategy declines to act. */
function attack(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  const target = row?.validTargets[0];
  return { kind: 'attack', targets: target ? [target] : [] };
}

interface Run {
  outcome: string | undefined;
  decisions: number;
  formsReached: number;
  bossHp: number;
  hits: number;
  misses: number;
  strategyDeclined: number;
}

function runIntended(seed: number): Run {
  const engine = newEngine(seed);
  const run: Run = {
    outcome: undefined,
    decisions: 0,
    formsReached: 1,
    bossHp: 0,
    hits: 0,
    misses: 0,
    strategyDeclined: 0,
  };

  for (let i = 0; i < MAX_DECISIONS; i++) {
    run.decisions++;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      run.outcome = d.result.outcome;
      break;
    }
    if (d.kind === 'player-input') {
      const cmd = intendedStrategy(d.actorId, d.commands, engine);
      if (!cmd) run.strategyDeclined++;
      engine.submit(cmd ?? attack(d));
    }
  }

  for (const e of engine.state().log) {
    if (e.type === 'form-change' && e.enemyId === 'yunalesca') run.formsReached = Math.max(run.formsReached, e.formIndex + 1);
    if (e.type === 'damage' && e.targetId === 'yunalesca' && e.amount > 0) run.hits++;
    if (e.type === 'miss' && e.sourceId !== 'yunalesca') run.misses++;
  }
  run.bossHp = engine.state().combatants['yunalesca']?.hp ?? 0;
  return run;
}

/**
 * The acceptance test for Chapter 2: the shipped strategy beats Yunalesca.
 *
 * It was skipped through two repair rounds because the strategy only won about
 * half its seeds. What closed the gap, on 2026-09-17, was two things together:
 *
 *  1. **`src/data/ffx/builds/zanarkand.ts` now carries Confuse Ward**, which is
 *     what `research/ffx-yunalesca.md` §10.10 ("Ward / Proof loadout — the
 *     intended preparation") asks for on *everyone* before Form III, and which
 *     §7.2's Ward arithmetic makes a **total** block of Mind Blast's Confuse,
 *     `(50 − 50) > rng` never being true. The build was carrying the Seymour
 *     Flux loadout-B Death Wards in those slots instead. It matters far more
 *     here than it would in the shipped game, because this engine never
 *     implements the "any physical hit cures Confuse" rule its own status data
 *     declares (`src/data/ffx/statuses/core.ts`, ffx-combat-core §4.2) and
 *     Confuse's duration model is `battle-254` — so a Mind Blast that caught
 *     Yuna *and* an attacker was permanent and unrecoverable: confused
 *     characters are resolved by the engine, never reach the tactic
 *     (`execute.ts actsAutomatically`), and the party beat itself to death with
 *     no summon ever cast. That was 11 of the first 60 losses. The full diff and
 *     the measurements are in `critic/scratch/zanarkand-build-diff.md`.
 *  2. **Four measured changes to `BattlePresenterTactics.ts`** — the supporter
 *     Defends instead of swinging in every form, Cheer's ladder runs only while
 *     every living active is short of it, and the aeons are summoned
 *     Shiva-first / Bahamut-last by Overdrive minus the max HP Yunalesca
 *     Absorbs back off them. Worth 131 → 212 wins in 400 seeds on the *old*
 *     build, before the ward went on.
 *
 * Measured after both: **1,574 wins in 1,600 contiguous seeds (98.4%)**. The
 * remaining losses all reach Form III and die inside its last few thousand HP.
 *
 * Still true and still not this file's to fix — neither is load-bearing on the
 * win any more, but both cap how good the line can get:
 *
 *  * **The free party switch is disabled for every reserve member.**
 *    `src/battle/ffx/commands.ts` builds a switch row per reserve member and
 *    sets `enabled: isAlive(bench)`, while `src/battle/ffx/state.ts:193` defines
 *    `isAlive(c) = c.alive && !has(c, 'ko') && onField(c)` — a benched member is
 *    by definition not on the field, so every switch row the engine offers is
 *    disabled. Wakka, Lulu, Kimahri and Rikku cannot enter the battle at all,
 *    and §10.10's loadout is written per role across all seven. Suggested fix:
 *    gate that row on `bench.alive && !has(bench, 'ko')`.
 *  * **Confuse is never cleared by physical damage**, as above. With Confuse
 *    Ward on the actives it no longer decides the fight, but a party without the
 *    ward is still playing a much harsher status than the real game's.
 *  * `extra.restoresPool` is never read by the engine, so Ether, Turbo Ether and
 *    Elixir restore **HP**, not MP — and on a Zombie a `heals` item is applied
 *    as damage. Yuna's 290 MP is a fixed budget for a 132,000-HP fight, and the
 *    tactic deliberately never tries to refill it.
 *
 * The original diagnosis (Mega Death applies a raw `ko` with no Zombie
 * exception) was not the cause. `ko` IS Death in this contract, and the Zombie
 * exception already lived in the engine's status roll. The real inversion was
 * four engine bugs, all fixed 2026-09-16 and pinned in ffx-chapter2.test.ts:
 *   1. Enemy actions with no accuracy byte rolled the physical hit table with
 *      the enemy's own ACC (Yunalesca: 0, so base 25). Absorb, Mind Blast and
 *      Mega Death landed ~1 time in 4, and every party Cure/Phoenix Down rolled
 *      to hit too. Now ALWAYS, per ffx-combat-core §2.11.
 *   2. A landed `ko` attached a marker to a living combatant instead of killing.
 *   3. A KO'd Zombie could never be revived, so Form II bled the party out.
 *   4. The transformation entry actions (Hellbiter into Form II, Mega Death into
 *      Form III) never fired, and the killing blow of a form drew the next
 *      form's counter.
 */
describe('the shipped intended strategy beats Chapter 2', () => {
  for (const seed of SEEDS) {
    it(`wins against Yunalesca and walks all three forms (seed ${seed})`, () => {
      const r = runIntended(seed);
      // Printed so a failure shows *how* it lost, not just that it did.
      console.log(`seed ${seed}:`, JSON.stringify(r));

      expect(r.decisions, 'the battle must reach a decision, not spin').toBeLessThan(MAX_DECISIONS);
      expect(r.outcome).toBe('victory');
      expect(r.formsReached, 'Yunalesca has three forms; the fight is not won until the third falls').toBe(3);
    });
  }

  /**
   * Four seeds prove the line exists; they do not prove it is the line rather
   * than four lucky rolls. This is the regression net the previous rounds were
   * missing: the whole of Chapter 2, forty contiguous seeds, in about a second.
   *
   * Measured 39/40 here and on the windows starting at 101 and at 1001, and
   * 1,574/1,600 over the first 1,600 seeds. The bar is set at 36 so ordinary
   * tail variance does not flake it, and so that any regression toward the
   * coin-flip this used to be (it was 13/40 on the same window) goes red.
   */
  it('wins the great majority of forty contiguous seeds', () => {
    const results = Array.from({ length: 40 }, (_, i) => runIntended(i + 1));
    const wins = results.filter((r) => r.outcome === 'victory').length;
    const lost = results
      .map((r, i) => ({ seed: i + 1, r }))
      .filter((x) => x.r.outcome !== 'victory')
      .map((x) => `${x.seed}: ${x.r.outcome} with ${x.r.bossHp} left`);
    console.log(`seeds 1-40: ${wins} wins; losses: ${lost.join(', ') || 'none'}`);

    expect(wins, 'Chapter 2 must be reliably winnable, not a coin flip').toBeGreaterThanOrEqual(36);
    expect(
      results.every((r) => r.formsReached === 3),
      'every run must walk all three forms',
    ).toBe(true);
  });
});

/**
 * The wrong tactics must stay punished, independently of whether the intended
 * strategy currently wins. `research/ffx-yunalesca.md` §10.1 names two of them
 * and both are asserted below, in the order the research states them:
 *
 *   * "Do **not** blanket-cure Zombie" — the first block.
 *   * "Do **not** equip Zombieproof" — the second.
 *
 * §5.3 is the mechanism for both: the II->III transformation turn runs
 * Metamorphosis 2 and a 100-chance Mega Death together, before any party member
 * can act, and Mega Death kills every active who is not Zombie.
 */

/**
 * Half one: cure Zombie the moment it lands, and then press on.
 *
 * Two deliberate departures from the shipped line, and neither is a thumb on
 * the scale — together they are the definition of the player §10.1 is warning:
 *
 * 1. **The cure supply is raised to 99 Holy Waters.** With the shipped stock —
 *    four Holy Waters and four Remedies (§11.4) — the party *cannot* blanket
 *    cure: all eight go inside Form II, Hellbiter puts Zombie back on each
 *    member it hits at ~49.5% (Zombie Ward, §5.1), the armour is on again long
 *    before the transformation, and the run then plays out exactly like the
 *    shipped line and wins. That is a fact about the **inventory**, not about
 *    the tactic, and it is why the shipped encounter is forgiving of the
 *    mistake. Raising the stock isolates the tactic itself.
 * 2. **A Defend the tactic asks for becomes an Attack.** The shipped tactic
 *    holds the killing blow on Form II until the party is re-zombified
 *    (`ARM_MARGIN` in `BattlePresenterTactics.ts`) — which is the *opposite* of
 *    blanket-curing, and without this line the wrapper is rescued by the very
 *    rule it is supposed to be violating: it cures, the tactic waits for
 *    Hellbiter, and the party crosses into Form III fully armoured and wins.
 *    §10.1's failure mode is "cure all Zombie, **then kill Form II**", so the
 *    wrapper kills Form II.
 *
 * Measured on the four seeds: defeat on all four, and for the stated reason —
 * the entry Mega Death takes all three actives on seeds 1 and 42 with Form III
 * untouched at its full 60,000, and on the other two the party never recovers
 * (43,559 and 56,625 left, 8 and 5 Mega Death kills).
 */
function cureOnSight(
  engine: ReturnType<typeof newEngine>,
  d: Extract<Decision, { kind: 'player-input' }>,
): Command | null {
  const state = engine.state();
  const zombie = state.activeIds
    .map((id) => state.combatants[id])
    .find((c) => c !== undefined && c.alive && c.statuses['zombie'] !== undefined);
  if (!zombie) return null;
  const cure: AvailableCommand | undefined = d.commands.find(
    (c) => c.enabled && (c.label === 'Holy Water' || c.label === 'Remedy') && c.validTargets.includes(zombie.id),
  );
  return cure ? ({ ...cure.command, targets: [zombie.id] } as Command) : null;
}

function deepCureStock(): FFXPartyBuild {
  return {
    ...zanarkandBuild,
    inventory: zanarkandBuild.inventory.map((i) => (i.itemId === 'holy-water' ? { ...i, count: 99 } : i)),
  };
}

describe('curing Zombie at Yunalesca stays a losing tactic', () => {
  for (const seed of SEEDS) {
    it(`loses to Mega Death once the party can actually blanket-cure (seed ${seed})`, () => {
      const engine = newEngine(seed, deepCureStock());
      let outcome: string | undefined;
      let cures = 0;

      for (let i = 0; i < MAX_DECISIONS; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') {
          outcome = d.result.outcome;
          break;
        }
        if (d.kind !== 'player-input') continue;
        const cure = cureOnSight(engine, d);
        if (cure) {
          cures++;
          engine.submit(cure);
          continue;
        }
        const picked = intendedStrategy(d.actorId, d.commands, engine);
        engine.submit((picked && picked.kind === 'defend' ? attack(d) : picked) ?? attack(d));
      }

      // Lost, and lost *to Mega Death* — the failure §10.1 names, not merely a
      // run that happened to end badly.
      let megaDeathKos = 0;
      let lastAbility = '';
      for (const ev of engine.state().log) {
        if (ev.type === 'action-start') lastAbility = String(ev.abilityId ?? '');
        if (ev.type === 'ko' && lastAbility === 'mega-death') megaDeathKos++;
      }
      console.log(`seed ${seed}: ${outcome}, ${cures} cures, ${megaDeathKos} Mega Death kills, ${engine.state().combatants['yunalesca']?.hp} left`);

      expect(outcome, 'the battle must reach a decision').toBeDefined();
      expect(cures, 'the wrapper must actually have cured, or it proves nothing').toBeGreaterThan(20);
      expect(outcome).not.toBe('victory');
      expect(megaDeathKos, 'a party that cured its armour off must die to Mega Death').toBeGreaterThanOrEqual(3);
    });
  }
});

/**
 * Half two: wear Zombieproof instead of relying on Zombie. Deterministic — the
 * three actives can never be zombified, so the entry Mega Death takes all three
 * and Form III is never scratched.
 */
function zombieproofBuild(): FFXPartyBuild {
  return {
    ...zanarkandBuild,
    members: zanarkandBuild.members.map((m) =>
      zanarkandBuild.activeSlots.includes(m.id)
        ? {
            ...m,
            equipment: {
              ...m.equipment,
              armor: { ...m.equipment.armor!, autoAbilities: ['zombieproof'] },
            },
          }
        : m,
    ),
  };
}

describe('equipping Zombieproof at Yunalesca loses the fight outright', () => {
  for (const seed of SEEDS) {
    it(`Mega Death wipes the active three (seed ${seed})`, () => {
      const engine = newEngine(seed, zombieproofBuild());

      let outcome: string | undefined;
      for (let i = 0; i < MAX_DECISIONS; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') {
          outcome = d.result.outcome;
          break;
        }
        if (d.kind === 'player-input') engine.submit(intendedStrategy(d.actorId, d.commands, engine) ?? attack(d));
      }

      // Not just "lost": lost *to Mega Death*, on the transformation turn, with
      // Yunalesca's third form still on its full 60,000. That is the failure
      // §10.1 asks the build to reproduce, and it is what makes the loss
      // legible to the player afterwards.
      let megaDeathKos = 0;
      let lastAbility = '';
      for (const ev of engine.state().log) {
        if (ev.type === 'action-start') lastAbility = String(ev.abilityId ?? '');
        if (ev.type === 'ko' && lastAbility === 'mega-death') megaDeathKos++;
      }

      expect(outcome, 'the battle must reach a decision').toBeDefined();
      expect(outcome).not.toBe('victory');
      expect(megaDeathKos, 'Mega Death must kill all three actives, none of whom is Zombie').toBe(3);
      expect(engine.state().combatants['yunalesca']?.hp, 'Form III never took a scratch').toBe(60_000);
    });
  }
});
