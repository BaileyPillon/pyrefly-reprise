// @vitest-environment jsdom
/**
 * **PR-0407, Chapter XIII (FFX-2 only): where a lost link 2 retries, and what it opens on**, through the real
 * `GameFlow`, the real chain, the real seam carry and the real FFX-2 engine. Only the presenter is a script: it
 * either decides the link's outcome (after forcing the state the girls leave link 1 in) or plays the fight out by
 * the intended line (`tremaLines.ts`).
 *
 * The finding (critic round 23, `critic/rounds/round-23.md` issue 6): a loss to Trema retries **at Trema** (the TR5
 * b checkpoint, in Paragon's end state, no prep), not at Paragon. When one girl stood at the seam the retry opens
 * on that same state, and the engine measured it at 0 wins in 200 runs with 107 lost inside two decisions. The
 * shipped answer (`TREMA_HOPELESS_RETRY`, `data/ffx2/enemies/trema.ts`): fewer than two girls standing, and the retry
 * opens with the Save Sphere's rule; two or three standing, it replays the state as entered, as TR5 b has it. The
 * other two answers (`'chapter-start'`, `'carry'`) stay built and are pinned here too.
 *
 * Game case: FFX-2 only (Trema's link is the only formation that names `hopelessRetry`); the plumbing is the shared
 * checkpoint seam, pinned for every other chain by `flow-checkpoint-retry.test.ts` and `sin-checkpoint-flow.test.ts`.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { App } from '../../../src/app/App.ts';
import { pinRunSeed } from '../../../src/app/runSeed.ts';
import { SaveStore } from '../../../src/app/SaveData.ts';
import { Screen } from '../../../src/app/Screen.ts';
import { GameFlow, registerFlowScreens, resetFlowScreens, type FlowScreen } from '../../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../../src/app/screens/BattleScreen.ts';
import { resumeSetup } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import { runEncounterChain } from '../../../src/app/screens/BattleEncounterChain.ts';
import { findEnemyGroup, setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { createEngine } from '../../../src/app/screens/BattleScreenWiring.ts';
import type { BattleEngine, BattleSetup, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import type { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { applyStatus } from '../../../src/battle/ffx2/statuses.ts';
import type { BattleOutcome, BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { CLOISTER_TREMA, cloisterTremaGroup, tremaHopelessRetry } from '../../../src/data/ffx2/enemies/trema.ts';
import { LINES } from '../helpers/tremaLines.ts';
import { fallback, knightTurn, rikkuTurn } from '../helpers/tremaLines.ts';

const TREMA = getChapter('ffx2-trema')!;
const GIRLS = ['yuna', 'rikku', 'paine'] as const;

type Answer = 'shipped' | 'carry' | 'restore' | 'chapter-start';
/** The formation Trema's link is, for each answer (the shipped one is whatever the game finds). */
async function tremaFor(answer: Answer): Promise<EnemyGroupDef> {
  if (answer === 'shipped') return (await findEnemyGroup(CLOISTER_TREMA))!;
  const { hopelessRetry: _shipped, ...plain } = cloisterTremaGroup;
  return answer === 'carry' ? plain : { ...plain, ...tremaHopelessRetry(answer) };
}

/** One scripted step: win after forcing how the girls end the link, lose, or play the real fight out. */
type Step =
  | { kind: 'victory'; ko?: readonly string[]; hp?: Record<string, number> }
  | { kind: 'defeat' }
  | { kind: 'play' };

interface Girl { id: string; hp: number; max: number; alive: boolean }
interface Attempt {
  opts: BattleScreenOptions;
  onLinks: number[];
  /** The party and the enemy ids as each link opened: what the player sees on the first frame. */
  opened: Array<{ enemies: string[]; girls: Girl[] }>;
  /** For a `play` step: how the real fight ended and how many menus the girls got. */
  fights: Array<{ outcome: string; decisions: number }>;
}

const shown: string[] = [];
const attempts: Attempt[] = [];
let steps: Step[][] = [];
let answer: Answer = 'shipped';

const girlsOf = (e: BattleEngine): Girl[] =>
  GIRLS.map((id) => {
    const c = e.state().combatants[id] as unknown as { hp: number; alive: boolean; stats: { maxHp: number } };
    return { id, hp: c.hp, max: c.stats.maxHp, alive: c.alive };
  });

/** Force the state the girls leave a won link in (the seam reads it live, as the chain does). */
function leave(engine: BattleEngine, step: Extract<Step, { kind: 'victory' }>): void {
  for (const id of step.ko ?? []) {
    const u = engine.state().combatants[id] as unknown as { hp: number; alive: boolean };
    u.hp = 0;
    u.alive = false;
    applyStatus(u as never, { status: 'ko', chance: 255, duration: 0 });
  }
  for (const [id, hp] of Object.entries(step.hp ?? {})) (engine.state().combatants[id] as unknown as { hp: number }).hp = hp;
}

/** Play a link to its end by the chapter's intended line, the way the engine's own bench does. */
function playOut(engine: BattleEngine): { outcome: string; decisions: number } {
  const e = engine as unknown as FFX2Engine;
  let decisions = 0;
  for (let i = 0; i < 60000; i++) {
    const d = e.nextDecision();
    if (d.kind === 'battle-over') return { outcome: d.result.outcome, decisions };
    if (d.kind === 'waiting') { e.tick(Math.max(1, d.nextEventMs)); continue; }
    if (d.kind !== 'player-input') continue;
    e.tick(1500, { throughInput: true });
    if (!e.inputValid(d.actorId)) continue;
    decisions++;
    const line = LINES.kitIntended;
    e.submit((d.actorId === 'rikku' ? rikkuTurn(d, e, line) : knightTurn(d, e, line)) ?? fallback(d));
  }
  return { outcome: 'stalled', decisions };
}

/** The battle screen's own engine and chain calls (`BattleScreen.ts`) with a presenter that plays the script. */
class TremaBattle extends Screen implements FlowScreen<BattleScreenResult> {
  readonly name = 'battle';
  readonly done: Promise<BattleScreenResult>;
  constructor(opts: BattleScreenOptions) {
    super();
    const rec: Attempt = { opts, onLinks: [], opened: [], fights: [] };
    attempts.push(rec);
    this.done = this.fight(opts, rec, steps.shift() ?? [{ kind: 'defeat' }]);
  }
  private async fight(opts: BattleScreenOptions, rec: Attempt, script: Step[]): Promise<BattleScreenResult> {
    const resume = opts.resumeAt;
    const setup: BattleSetup = resume ? resumeSetup(resume, opts.seed ?? 1) : setupForChapter(TREMA, opts.seed ?? 1);
    const group = resume ? resume.group : TREMA.enemyGroupRef;
    const engine = await createEngine(TREMA.game, setup, { automated: true });
    const presenter = {
      syncHud: () => undefined,
      run: async (e: BattleEngine): Promise<BattleOutcome> => {
        rec.opened.push({ enemies: e.state().enemyIds.slice(), girls: girlsOf(e) });
        const step = script.shift() ?? { kind: 'defeat' };
        if (step.kind === 'play') {
          const r = playOut(e);
          rec.fights.push(r);
          return { kind: r.outcome === 'victory' ? 'victory' : 'defeat', result: { turns: 1, elapsedMs: 0, elapsedTicks: 0 } } as unknown as BattleOutcome;
        }
        if (step.kind === 'victory') leave(e, step);
        return { kind: step.kind, result: { turns: 1, elapsedMs: 0, elapsedTicks: 0 } } as unknown as BattleOutcome;
      },
    } as unknown as BattlePresenter;
    const chain = await runEncounterChain({
      chapter: TREMA,
      presenter,
      engine,
      stage: { stage: async () => undefined },
      group,
      setup,
      seed: opts.seed ?? 1,
      findGroup: (id) => (id === CLOISTER_TREMA ? tremaFor(answer) : findEnemyGroup(id)),
      startLink: resume?.link ?? 1,
      priorWon: resume?.won ?? [],
      onLink: ({ links }) => rec.onLinks.push(links),
    });
    return {
      chapterId: TREMA.id,
      outcome: chain.outcome.kind,
      result: chain.outcome.kind === 'victory' ? chain.outcome.result : null,
      elapsedMs: 10,
      links: chain.links,
      preview: false,
      ...(chain.checkpoint ? { checkpoint: chain.checkpoint } : {}),
    };
  }
  override enter(): void {
    shown.push(this.name);
  }
}

class Done<T> extends Screen implements FlowScreen<T> {
  readonly done: Promise<T>;
  constructor(readonly name: string, value: T) {
    super();
    this.done = Promise.resolve(value);
  }
  override enter(): void {
    shown.push(this.name);
  }
}

class FakeApp {
  readonly uiRoot: HTMLElement;
  readonly save = new SaveStore();
  readonly flow: GameFlow;
  current: Screen | null = null;
  constructor() {
    this.uiRoot = document.createElement('div');
    document.body.appendChild(this.uiRoot);
    this.flow = new GameFlow(this as unknown as App);
  }
  get overlayActive(): boolean {
    return false;
  }
  async replace(screen: Screen): Promise<void> {
    const previous = this.current;
    this.current = null;
    if (previous) {
      await previous.exit();
      previous.root?.remove();
    }
    screen.app = this as unknown as App;
    screen.root = document.createElement('div');
    this.uiRoot.appendChild(screen.root);
    this.current = screen;
    await screen.enter();
  }
  async goto(): Promise<boolean> {
    return true;
  }
  fade(): Promise<void> {
    return Promise.resolve();
  }
  nextFrame(): Promise<void> {
    return Promise.resolve();
  }
}

let choices: Array<'retry' | 'chapter-select'> = [];
let app: FakeApp;

beforeEach(() => {
  pinRunSeed(1);
  shown.length = 0;
  attempts.length = 0;
  steps = [];
  choices = [];
  answer = 'shipped';
  document.body.innerHTML = '';
  resetFlowScreens();
  registerFlowScreens({
    partyPrep: () => new Done('party-prep', true),
    battle: (opts) => new TremaBattle(opts),
    results: (opts) => {
      if (opts.outcome === 'defeat') opts.onChoice?.(choices.shift() ?? 'chapter-select');
      return new Done('results', undefined);
    },
  });
  app = new FakeApp();
});

afterEach(() => {
  resetFlowScreens();
  pinRunSeed(null);
});

const run = (): Promise<unknown> => app.flow.runChapter(TREMA.id, { skipCutscenes: true, speed: 'skip' });
const standing = (g: Girl[]): number => g.filter((x) => x.alive && x.hp > 0).length;
const PAINE_AT = 3000; // the one girl left, below her ceiling (the engine probe's seed 21 left Paine on 6,549 of her doubled maximum)
const ONE_STANDING: Extract<Step, { kind: 'victory' }> = { kind: 'victory', ko: ['yuna', 'rikku'], hp: { paine: PAINE_AT } };

describe('a lost Trema retries at Trema, never at Paragon (every answer)', () => {
  it('one girl standing, shipped answer: Paragon is won, Trema is lost, RETRY opens Trema again, with no prep', async () => {
    steps = [[ONE_STANDING, { kind: 'defeat' }], [{ kind: 'defeat' }]];
    choices = ['retry', 'chapter-select'];
    await run();
    expect(attempts).toHaveLength(2);
    const [first, retry] = attempts as [Attempt, Attempt];
    expect(first.onLinks).toEqual([1, 2]);
    expect(first.opened[1]!.enemies).toEqual(['trema']);
    expect(standing(first.opened[1]!.girls)).toBe(1); // the first entry is the sourced carry: Paine alone, at the HP link 1 left her
    expect(first.opened[1]!.girls.find((g) => g.id === 'paine')!.hp).toBe(PAINE_AT);
    expect(retry.opts.resumeAt?.link).toBe(2);
    expect(retry.opts.resumeAt?.group.id).toBe(CLOISTER_TREMA);
    expect(retry.onLinks).toEqual([2]); // at Trema, not at Paragon
    expect(retry.opened[0]!.enemies).toEqual(['trema']);
    expect(shown).toEqual(['party-prep', 'battle', 'results', 'battle', 'results']); // one prep, at the chapter's start
  });

  it('shipped answer, one standing: the retry opens with all three on their feet at full HP, and so does every further retry', async () => {
    steps = [[ONE_STANDING, { kind: 'defeat' }], [{ kind: 'defeat' }], [{ kind: 'defeat' }]];
    choices = ['retry', 'retry', 'chapter-select'];
    await run();
    expect(attempts.map((a) => a.onLinks)).toEqual([[1, 2], [2], [2]]);
    for (const retry of attempts.slice(1)) {
      const girls = retry.opened[0]!.girls;
      expect(standing(girls)).toBe(3);
      for (const g of girls) expect(g.hp).toBe(g.max); // the Save Sphere's rule: full HP (and MP), a KO'd girl up
      expect(girls.find((g) => g.id === 'paine')!.hp).toBeGreaterThan(PAINE_AT);
    }
    expect(attempts[2]!.opts.seed).toBe(2001);
  });

  it('shipped answer, two standing (TR5 b as adopted): the retry replays the state as entered, nobody restored', async () => {
    steps = [[{ kind: 'victory', ko: ['rikku'], hp: { yuna: 1234 } }, { kind: 'defeat' }], [{ kind: 'defeat' }]];
    choices = ['retry', 'chapter-select'];
    await run();
    const [first, retry] = attempts as [Attempt, Attempt];
    expect(retry.onLinks).toEqual([2]);
    expect(retry.opened[0]!.girls).toEqual(first.opened[1]!.girls);
    expect(retry.opened[0]!.girls.map((g) => g.id + ':' + g.hp + ':' + g.alive)).toContain('yuna:1234:true');
    expect(retry.opened[0]!.girls.find((g) => g.id === 'rikku')!.alive).toBe(false);
  });

  it('shipped answer, three standing and hurt: the retry replays them as entered', async () => {
    steps = [[{ kind: 'victory', hp: { yuna: 2000, rikku: 3000 } }, { kind: 'defeat' }], [{ kind: 'defeat' }]];
    choices = ['retry', 'chapter-select'];
    await run();
    const [first, retry] = attempts as [Attempt, Attempt];
    expect(retry.opened[0]!.girls).toEqual(first.opened[1]!.girls);
    expect(retry.opened[0]!.girls.map((g) => g.hp).slice(0, 2)).toEqual([2000, 3000]);
  });

  it('a loss at Paragon is not a checkpoint: RETRY starts the chapter over, through prep, as before', async () => {
    steps = [[{ kind: 'defeat' }], [{ kind: 'defeat' }]];
    choices = ['retry', 'chapter-select'];
    await run();
    expect(attempts.map((a) => a.opts.resumeAt)).toEqual([undefined, undefined]);
    expect(attempts.map((a) => a.onLinks)).toEqual([[1], [1]]);
    expect(shown.filter((s) => s === 'party-prep')).toHaveLength(2);
  });
});

describe('the other two answers stay built and pinned', () => {
  it("'carry' (what shipped until PR-0407): one standing, the retry replays Paine alone", async () => {
    answer = 'carry';
    steps = [[ONE_STANDING, { kind: 'defeat' }], [{ kind: 'defeat' }]];
    choices = ['retry', 'chapter-select'];
    await run();
    const retry = attempts[1]!;
    expect(retry.onLinks).toEqual([2]);
    expect(standing(retry.opened[0]!.girls)).toBe(1);
    expect(retry.opened[0]!.girls.find((g) => g.id === 'paine')!.hp).toBe(PAINE_AT);
  });

  it("'chapter-start' (TR5 a for a hopeless state): one standing, a loss retries Paragon through prep", async () => {
    answer = 'chapter-start';
    steps = [[ONE_STANDING, { kind: 'defeat' }], [{ kind: 'defeat' }]];
    choices = ['retry', 'chapter-select'];
    await run();
    const [first, retry] = attempts as [Attempt, Attempt];
    expect(first.onLinks).toEqual([1, 2]);
    expect(retry.opts.resumeAt).toBeUndefined();
    expect(retry.onLinks).toEqual([1]);
    expect(retry.opened[0]!.enemies).not.toEqual(['trema']);
    expect(shown).toEqual(['party-prep', 'battle', 'results', 'party-prep', 'battle', 'results']);
  });

  it("'chapter-start' with two standing still retries at Trema, as entered", async () => {
    answer = 'chapter-start';
    steps = [[{ kind: 'victory', ko: ['rikku'] }, { kind: 'defeat' }], [{ kind: 'defeat' }]];
    choices = ['retry', 'chapter-select'];
    await run();
    expect(attempts[1]!.opts.resumeAt?.link).toBe(2);
    expect(attempts[1]!.onLinks).toEqual([2]);
  });
});

describe('the real fight through the flow (the intended line, the real engine)', () => {
  /** Real-engine Retries from the one-standing state, each on its own seed: the first entry, then up to `n` Retries. */
  async function retriesFromOneStanding(n: number): Promise<Attempt[]> {
    steps = [[ONE_STANDING, { kind: 'play' }], ...Array.from({ length: n }, () => [{ kind: 'play' } as Step])];
    choices = Array.from({ length: n }, () => 'retry' as const);
    choices.push('chapter-select');
    await run();
    return attempts;
  }

  it("'carry': every Retry from one girl standing is lost within a few menus (the round-23 loop)", async () => {
    answer = 'carry';
    const all = await retriesFromOneStanding(5);
    const retries = all.slice(1).flatMap((a) => a.fights);
    expect(retries.length).toBe(5);
    // Re-parity W4 (FFX-2 only; reason "game-code parity", `docs/handoff/re-parity-w4.md`): "a few menus" was 8. The game's own recovery
    // after each command (`cost_atb x 10000 / (AGI + 1)`) and the full-tick casts pace one girl alone differently; the five Retries
    // on their seeds ran 12, 0, 8, 3 and 6 menus, every one still a defeat, which is the round-23 loop this pins.
    expect(retries.every((f) => f.outcome === 'defeat' && f.decisions <= 12)).toBe(true);
  }, 120000);

  it("shipped answer: the same Retries start from three girls on their feet, and one of them wins", async () => {
    const all = await retriesFromOneStanding(6);
    const retries = all.slice(1);
    expect(retries.every((a) => standing(a.opened[0]!.girls) === 3 && a.onLinks[0] === 2)).toBe(true);
    expect(retries.some((a) => a.fights[0]!.outcome === 'victory')).toBe(true);
  }, 120000);
});

/**
 * The same finding with **no forced state** (round 24 carried PR-0407 "not re-tested": the link-2 carried state was not
 * exercised). A real Oversoul Paragon win on the kit-intended line that leaves Yuna alone on her feet (Rikku and Paine
 * knocked out in the fight itself). Seeds are deterministic (seeded RNG), so a change to the engine moves this pin: scan run
 * seeds with `play` on link 1, read `opened[1]`, and pick the next seed that leaves one girl standing; do not loosen it.
 *
 * Re-pinned on the combined release candidate `r42-rc` (FFX-2 only; reason "game-code parity", `docs/handoff/re-parity-w4.md`
 * and `re-parity-rc3.md`). Run seed 73 was found on `r40-rc` bc373d58 (96 of run seeds 1 to 200 won link 1; only seed 73 left
 * one girl, and seeds 14, 76, 100, 138 and 194 left two). Under the game's logic step and recovery (`cost_atb x 10000 / (AGI + 1)`,
 * casts counted at the full tick), the Oversoul's rewritten script and the game's own random streams a seeded replay is a
 * different replay, and seed 73 now wins Paragon with all three girls on their feet. The same scan on `r42-rc`, run seeds 1 to
 * 5400: 4,161 win link 1 (48 percent before, 77 percent now), 4,017 of them leave three girls standing, 138 leave two and
 * **6 leave one** (seeds 3543, 4053, 4404, 4518 and 4624 leave Yuna alone; seed 4559 leaves Paine). Seed 3543 is the first.
 * The Retry rule (fewer than two standing means the Save Sphere's rule) is not changed by this.
 */
describe('a real Paragon win that leaves one girl standing (run seed 3543, nothing forced)', () => {
  const ALONE_SEED = 3543;
  async function fromTheRealSeam(which: Answer, retries: number): Promise<Attempt[]> {
    pinRunSeed(ALONE_SEED);
    answer = which;
    steps = [[{ kind: 'play' }, { kind: 'play' }], ...Array.from({ length: retries }, () => [{ kind: 'play' } as Step])];
    choices = [...Array.from({ length: retries }, () => 'retry' as const), 'chapter-select'];
    await run();
    return attempts;
  }
  const alive = (g: Girl[]): string[] => g.filter((x) => x.alive && x.hp > 0).map((x) => x.id);

  it("the first entry into Trema is the sourced carry: Paragon is won for real and only Yuna stands", async () => {
    const [first] = await fromTheRealSeam('shipped', 1);
    expect(first!.fights[0]).toMatchObject({ outcome: 'victory' }); // the real Paragon fight
    expect(first!.onLinks).toEqual([1, 2]);
    expect(alive(first!.opened[1]!.girls)).toEqual(['yuna']); // not touched by the PR-0407 rule: the first entry is never changed
  }, 120000);

  it("'carry' (what shipped until PR-0407): every Retry replays Yuna alone and is lost (the round-23 loop)", async () => {
    const all = await fromTheRealSeam('carry', 4);
    const retries = all.slice(1);
    expect(retries).toHaveLength(4);
    for (const a of retries) {
      expect(a.onLinks).toEqual([2]);
      expect(alive(a.opened[0]!.girls)).toEqual(['yuna']);
    }
    // Re-parity W4 (FFX-2 only; reason "game-code parity", `docs/handoff/re-parity-w4.md`): "a few menus" was 8. A command now leaves its OWN
    // recovery (`cost_atb x 10000 / (AGI + 1)`: an item 40, an Attack 70, a spell 0 plus its cast counted at the full tick) where every command
    // left 70, so one girl alone is paced differently and gets more menus before the same defeat. The four Retries on this seed ran 3, 22, 2 and
    // 12 menus, every one still a defeat; the eight Retries on each of the six one-girl run seeds (3543, 4053, 4404, 4518, 4559, 4624) ran 0 to 22 menus, 48 of 48 defeats.
    expect(retries.every((a) => a.fights[0]!.outcome === 'defeat' && a.fights[0]!.decisions <= 22)).toBe(true);
  }, 120000);

  it('shipped answer (D-506): every Retry opens at Trema with all three up at full HP, and a Retry can be won', async () => {
    const all = await fromTheRealSeam('shipped', 6);
    const retries = all.slice(1);
    expect(retries.length).toBeGreaterThanOrEqual(1);
    for (const a of retries) {
      expect(a.onLinks).toEqual([2]); // at Trema, never back at Paragon
      expect(alive(a.opened[0]!.girls)).toHaveLength(3);
      for (const g of a.opened[0]!.girls) expect(g.hp).toBe(g.max);
    }
    expect(retries.some((a) => a.fights[0]!.outcome === 'victory')).toBe(true);
  }, 240000);
});
