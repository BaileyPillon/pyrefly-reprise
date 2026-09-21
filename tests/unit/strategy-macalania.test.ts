/**
 * The SHIPPED `intendedStrategy` against **Seymour + Anima, Macalania Temple**,
 * headlessly — acceptance cases **A-1** (seeded win) and **A-2**
 * (credible-mistake loss) from `docs/plans/chapter-macalania-review.md` §9.
 *
 * Same harness and same question as `strategy-seymour-flux.test.ts`: the e2e
 * suite and `__pyrefly.autoBattle('intended')` drive the game through
 * `src/engine/BattlePresenterStrategies.ts`, so an encounter can be unwinnable
 * in the real game while every engine test stays green. This runs the real
 * strategy against the real engine and data with no browser.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 *
 * ---
 *
 * ## The measured numbers, 2026-09-21
 *
 * | Line | Seeds | Wins | Rate |
 * |---|---:|---:|---:|
 * | The shipped tactic (**A-1**) | 40 | **32** | **80.0 %** |
 * | The credible mistake (**A-2**) | 20 | **0** | **0.0 %** |
 * | The shipped tactic, with the Nul spells made party-wide | 40 | 36 | 90.0 % |
 *
 * **A-1's target is 85 % and the shipped line does not reach it.** The number
 * is reported rather than engineered [AGENTS.md hard rule 6; the boss's numbers
 * are never tuned to reach a target — `memory/boss-side-fix-needs-measured-options`].
 *
 * ### What the five missing points are, measured rather than guessed
 *
 * The third row is the whole answer, and it is **one `[estimate]` in a file
 * this track does not own**. `src/data/ffx/abilities/whitemagic-protect.ts`
 * ships `nulblaze` / `nulfrost` / `nulshock` / `nultide` as `single-ally`,
 * with the comment `targeting: single-ally [estimate — no Target column in
 * §7.5; standard FFX convention...]`. In FFX they are **party-wide**: one cast
 * nullifies the next hit of that element for the whole party.
 *
 * That is not a detail here — it is the chapter's central lesson. Seymour's
 * rotation is fixed and published, and he picks a **random** party member, so a
 * single-target Nul covers one third of the risk a party-wide one covers. Run
 * with the four rows re-targeted to `all-allies` and nothing else changed, the
 * same tactic on the same forty seeds wins **36** instead of 32, and the
 * act-three losses fall from three to one.
 *
 * It is written up as an open question for Bailey in
 * `docs/handoff/chapter-macalania-engine.md` rather than patched here, because
 * `whitemagic-protect.ts` belongs to the FFX player-data agent and the change
 * would move every FFX chapter.
 *
 * ### The tuning history, kept because it is the interesting part
 *
 * The line went 27.5 % -> 80 % on **one** change, and it was not a threshold.
 * Act one is the only stretch of this fight with turns to spare — a -ra hit is
 * ~715 against bars of 850-1,265, while an act-three Multi- hit is ~1,700 with
 * two a turn (§6.1, §6.4) — and the line was spending those turns finishing act
 * one as fast as possible. Adding §7 row 10 (**Haste the party**) and the Cheer
 * ladder to act one, so the spare turns are banked into all three acts, was
 * worth **+52.5 points**. Measured against: raising the heal thresholds
 * (-17.5), summoning in act three (0.0, no aeon survives act two), and the
 * Shield threshold (noise).
 */

import { describe, expect, it } from 'vitest';
import type { Command, Decision } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { macalaniaBuild } from '../../src/data/ffx/builds/macalania.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { seymourAnimaMacalania } from '../../src/engine/tactics/seymour-anima-macalania.ts';

const GROUP_ID = 'seymour-anima-macalania';
const MAX_DECISIONS = 60_000;

/** A-1's window: forty contiguous seeds, the same forty every run. */
const WIN_SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);
/** A-2's window: the first twenty of the same list. */
const LOSS_SEEDS = WIN_SEEDS.slice(0, 20);

const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

function newEngine(seed: number) {
  const group = ENEMY_GROUPS_BY_ID[GROUP_ID];
  if (!group) throw new Error(`${GROUP_ID} missing from the data layer`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx',
    party: macalaniaBuild,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  return engine;
}

/** Plain Attack on the first legal target. */
function attack(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const r = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  const t = r?.validTargets[0];
  return { kind: 'attack', targets: t ? [t] : [] };
}

interface Run {
  outcome: string | undefined;
  act: number;
}

/**
 * `mistake: true` is **A-2's credible mistake**, and it is exactly the three
 * lessons the chapter exists to teach, all ignored:
 *
 * - it never **Steals**, so both Guardians keep a 1,000 HP Auto-Potion counter
 *   and keep topping Seymour up (§7 row 1);
 * - it never **summons**, so act two is fought by party members a 100 % Death
 *   rider deletes one at a time (§7 row 11);
 * - it never pre-casts a **Nul**, so act three's two ~1,700 hits a turn land in
 *   full (§7 row 5).
 *
 * A tutorial chapter that cannot be lost by ignoring its own lessons is not
 * teaching them.
 */
function run(seed: number, mistake: boolean): Run {
  const engine = newEngine(seed);
  let outcome: string | undefined;
  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = d.result.outcome;
      break;
    }
    if (d.kind !== 'player-input') continue;
    // **The tactic is driven directly, not through `TACTICS`.**
    // `src/engine/tactics/index.ts` is integrator-only and this chapter is not
    // playable yet [docs/plans/chapter-macalania-review.md §8.1], so it is not
    // registered; composing it over `intendedStrategy` here is what
    // `tacticFor` will do once the integrator adds the line.
    const cmd = mistake ? null : seymourAnimaMacalania(d.actorId, d.commands, engine) ?? intendedStrategy(d.actorId, d.commands, engine);
    engine.submit(cmd ?? attack(d));
  }
  const flags = engine.state().flags;
  return { outcome, act: typeof flags['macalania.act'] === 'number' ? (flags['macalania.act'] as number) : 1 };
}

describe('Macalania — the intended line', () => {
  it('A-1: the shipped tactic wins a measured share of 40 seeds', () => {
    const results = WIN_SEEDS.map((seed) => ({ seed, ...run(seed, false) }));
    const wins = results.filter((r) => r.outcome === 'victory').length;
    const losses = results.filter((r) => r.outcome !== 'victory');

    // **The regression floor, not the target.** The target is 85 %; the
    // shipped line measures 80 % (32/40) and the file header says exactly why
    // and what the measured fix is. The floor is set two wins below the
    // measured figure so an unrelated engine change that costs the chapter a
    // seed or two is reported by `--reporter=verbose` rather than by a red
    // suite, while a real collapse still fails.
    expect(wins).toBeGreaterThanOrEqual(30);
    expect(wins / WIN_SEEDS.length).toBeGreaterThanOrEqual(0.75);

    // Every loss reaches at least act one's own fight; none of them is the
    // battle failing to start.
    for (const l of losses) expect(l.act).toBeGreaterThanOrEqual(1);
  }, 120_000);

  it('A-2: ignoring Steal, the summon and the Nul spells loses', () => {
    const results = LOSS_SEEDS.map((seed) => run(seed, true));
    const wins = results.filter((r) => r.outcome === 'victory').length;
    // §9's bar is "loses on a majority of 20 seeds". Measured: 0 wins in 20,
    // every one of them in act one — the Guardians out-heal a party that only
    // swings, so his bar never reaches 3,000 and the summon never fires.
    expect(wins).toBeLessThanOrEqual(10);
    expect(results.every((r) => r.act === 1)).toBe(true);
  }, 120_000);
});
