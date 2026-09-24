/**
 * The chain loop, and the rule that decides which cue scores a formation.
 *
 * Lifted out of `BattleScreen.ts` for two reasons the critic's round-02 report
 * made expensive:
 *
 * 1. **#01 "Chapter 4 is won and then never ends".** The loop that decides a
 *    chapter is finished lived inside a screen that needs Three.js, a DOM and a
 *    WebGL context, so nothing could replay a whole chapter to victory in a
 *    test. It can now: `tests/unit/flow-encounter-chain.test.ts` drives the
 *    real engines and the real `BattlePresenter` through every chapter, at
 *    every playback speed, against fake ports, and fails on a budget rather
 *    than hanging.
 * 2. **#02 "every boss fight is scored with the generic battle-ffx".** The
 *    screen played `chapter.music.battle` at `battleStart` and only ever read a
 *    formation's own `musicCues` when *chaining*, so Seymour's, Yunalesca's,
 *    Jecht's, Bahamut's and Vegnagun's declared cues were dead data. One
 *    function — {@link cueForGroup} — now answers "what scores this formation?"
 *    for the first link and every link after it, and it is the same answer in
 *    both places.
 *
 * Layering: no `three`, no DOM. Everything it drives is a port.
 */

import type {
  BattleEngine,
  BattleSetup,
  BattleState,
  EnemyGroupDef,
  MusicKey,
} from '../../battle/common/types.ts';
import type { Chapter } from '../../data/encounters.ts';
import type { BattleOutcome, BattlePresenter } from '../../engine/BattlePresenter.ts';
import { setupForNextLink } from './BattleScreenSetup.ts';
import { fadeMsToSec } from '../../audio/AudioManager.ts';
import { checkpointAt, type ChainCheckpoint } from './BattleChainCheckpoint.ts';

/**
 * How many formations the chain starting at `group` has: walk `nextGroupId` to
 * the end (a cycle ends it). Moved out of `BattleScreen.ts` unchanged.
 */
export async function chainLengthOf(
  group: EnemyGroupDef | null,
  find: (id: string) => Promise<EnemyGroupDef | null>,
): Promise<number> {
  let count = 1;
  const seen = new Set<string>();
  while (group?.nextGroupId && !seen.has(group.nextGroupId)) {
    seen.add(group.nextGroupId);
    const next = await find(group.nextGroupId);
    if (!next) break;
    group = next;
    count++;
  }
  return count;
}

/** The audio surface the chain needs. `AudioManager` satisfies it structurally. */
export interface ChainAudioPort {
  playMusic(name: string, options?: { fade?: number }): unknown;
}

/**
 * The one thing the chain asks of the field: re-stage it for the next
 * formation. `PaintedStage.stage` satisfies it; a test passes a recorder.
 */
export interface ChainStagePort {
  stage(state: BattleState): Promise<void>;
}

/**
 * The cue that scores one formation of one chapter.
 *
 * A formation's own `{ at: 'start' }` cue wins — that is where the data agents
 * put the answer (`seymour-flux.ts:217`, `yunalesca.ts:157`,
 * `braskas-final-aeon.ts:247`/`481`, `bahamut.ts:114`, the four Vegnagun parts
 * and `shuyin.ts:90`), and it is per-formation, so a chapter's later links
 * switch cue on their own: Chapter 3 goes `boss-jecht` → `boss-yu-yevon` and
 * Chapter 5 goes `boss-vegnagun` → `boss-shuyin` without a rule here.
 *
 * `phase2` is the chapter-level fallback for a chained formation that declares
 * nothing, and `battle` is the fallback for the first one. Both are per-chapter
 * and therefore per-game: an FFX chapter can only name an FFX cue and an FFX-2
 * chapter only an FFX-2 one, which is the constraint
 * `tests/unit/flow-encounter-chain.test.ts` asserts rather than assumes.
 */
export function cueForGroup(
  chapter: Chapter,
  group: EnemyGroupDef | null,
  link: 'first' | 'next',
): { track: MusicKey | undefined; fadeMs: number } {
  const cue = group?.musicCues?.find((c) => c.at === 'start') ?? group?.musicCues?.[0];
  const fallback = link === 'first' ? chapter.music.battle : (chapter.music.phase2 ?? chapter.music.battle);
  return { track: cue?.track ?? fallback, fadeMs: cue?.fadeMs ?? (link === 'first' ? 1200 : 1200) };
}

export interface EncounterChainOptions {
  chapter: Chapter;
  presenter: BattlePresenter;
  engine: BattleEngine;
  stage: ChainStagePort;
  /** The formation the encounter opens on. */
  group: EnemyGroupDef;
  setup: BattleSetup;
  seed: number;
  findGroup(id: string): Promise<EnemyGroupDef | null>;
  audio?: ChainAudioPort | null;
  /** Called at the head of every link, so the screen can keep its own bookkeeping. */
  onLink?(info: { links: number; group: EnemyGroupDef; setup: BattleSetup }): void;
  /**
   * Formations to walk before giving up, counted from the first.
   *
   * A `nextGroupId` cycle used to be caught only by the `seen` set in
   * `measureChain`; the loop that actually fights had no bound at all, so a
   * data edit that pointed a formation back at itself would have fought
   * forever with the screen stuck on `'battle'` — exactly the shape of the
   * failure the critic reported. The longest shipped chain is Chapter 5's five
   * formations.
   */
  maxLinks?: number;
  /**
   * The 1-based chain position of `group`: 1 (the default) is the chapter's
   * opening formation; more is a retry at a checkpoint (FA3 = b,
   * `BattleChainCheckpoint.ts`). It numbers the links and their seeds exactly
   * as if the earlier links had just been won.
   */
  startLink?: number;
  /**
   * The Save Sphere between links (O-4 = C, FA2 = b; FFX-2 Chapter XI only).
   * Called instead of a bare re-stage when the next formation carries
   * `restoresPartyOnEntry`; it must call `swap` exactly once, under its cover,
   * and resolve after. Omitted, or for any other formation, the next link is
   * re-staged exactly as before.
   */
  saveSphere?(swap: () => Promise<void>, info: { link: number; group: EnemyGroupDef }): Promise<void>;
}

export interface EncounterChainResult {
  outcome: BattleOutcome;
  /**
   * The 1-based position of the last formation fought: how many were fought,
   * counting the ones a checkpoint retry skipped. 1 unless the encounter chains.
   */
  links: number;
  /** The last Save Sphere link entered, where a defeat retries (FA3 = b); else null. */
  checkpoint: ChainCheckpoint | null;
}

const DEFAULT_MAX_LINKS = 16;

/**
 * Fight one encounter to the end, following `nextGroupId` with no results
 * screen in between.
 *
 * Always returns: every exit from the loop is a `break` or a `return`, and the
 * link count is bounded, so a caller awaiting this is never left parked.
 */
export async function runEncounterChain(opts: EncounterChainOptions): Promise<EncounterChainResult> {
  const { chapter, presenter, engine, stage } = opts;
  const maxLinks = opts.maxLinks ?? DEFAULT_MAX_LINKS;

  let group: EnemyGroupDef = opts.group;
  let setup = opts.setup;
  const startLink = Math.max(1, Math.floor(opts.startLink ?? 1));
  let links = startLink - 1;
  let checkpoint: ChainCheckpoint | null = null;
  let outcome: BattleOutcome = { kind: 'aborted' };

  // The first formation's own cue, resolved the same way a chained link's is.
  // Until this existed the pre-scene's boss theme was crossfaded straight back
  // out to `battle-ffx` on the frame the battle screen appeared (#02).
  const opening = cueForGroup(chapter, group, startLink > 1 ? 'next' : 'first');
  // `fadeMs` (from `MusicPhaseCue.fadeMs` / the `cueForGroup` fallback) is
  // milliseconds; `ChainAudioPort.playMusic`/`AudioManager` want seconds
  // (PR-0089).
  if (opening.track) void opts.audio?.playMusic(opening.track, { fade: fadeMsToSec(opening.fadeMs, 1200) });

  for (;;) {
    links++;
    checkpoint = checkpointAt(links, group, setup) ?? checkpoint;
    opts.onLink?.({ links, group, setup });
    presenter.syncHud(engine);
    outcome = await presenter.run(engine);

    if (outcome.kind !== 'victory') break;

    const nextId = group.nextGroupId;
    if (!nextId) break;

    if (links >= maxLinks) {
      console.error(
        `[battle] ${chapter.id}: stopped after ${links} formations — "${group.id}" chains to ` +
          `"${nextId}" but the chain is longer than any shipped encounter. Treating the fight as won.`,
      );
      break;
    }

    const nextGroup = await opts.findGroup(nextId);
    if (!nextGroup) {
      console.warn(`[battle] chapter chains to "${nextId}" but no formation exports that id`);
      break;
    }

    // Next link: same party, carried state, no results screen in between.
    const state = engine.state();
    setup = setupForNextLink(setup, nextGroup, state, opts.seed + links);
    group = nextGroup;
    // The screen can be left from the pause menu (RESTART ENCOUNTER, CHAPTER
    // SELECT, QUIT) while the next link is being staged or the Save Sphere card
    // plays: the exit aborts the presenter and releases the pause gate, so the
    // card resumes and returns here on a screen that is gone. Nothing below may
    // touch the engine, the stage or the music after that (fa-flow repair: the
    // Sisters' theme used to start on chapter select).
    const aborted = (): boolean => presenter.isAborted === true;
    const restage = async (): Promise<void> => {
      if (aborted()) return;
      engine.setSeed(setup.seed);
      engine.init(setup);
      await stage.stage(engine.state());
    };
    if (group.restoresPartyOnEntry === true && opts.saveSphere) {
      // Under the Save Sphere's cover: re-init, re-stage, and show the HUD the
      // refilled HP and MP before the wash clears.
      let swapped = false;
      await opts.saveSphere(async () => {
        if (swapped || aborted()) return;
        swapped = true;
        await restage();
        presenter.syncHud(engine);
      }, { link: links + 1, group });
      // A card that never called `swap` must still not strand the fight.
      if (!swapped) await restage();
    } else {
      await restage();
    }
    if (aborted()) {
      outcome = { kind: 'aborted' };
      break;
    }

    const cue = cueForGroup(chapter, group, 'next');
    if (cue.track) void opts.audio?.playMusic(cue.track, { fade: fadeMsToSec(cue.fadeMs, 1200) });
  }

  return { outcome, links: Math.max(1, links), checkpoint };
}
