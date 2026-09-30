/**
 * The battle entry by situation (A-2; approved tile "The pane breaks",
 * Bailey 2026-09-19: "canon by situation"). One owner per game
 * (build-b-review REQUIRED 9), `research/ffx-vs-ffx2-presentation.md` §1.1 to 1.3:
 *
 * | game  | situation                      | entry                              |
 * | ----- | ------------------------------ | ---------------------------------- |
 * | FFX   | out of a scene played through  | blur (`blur.ts`)                   |
 * | FFX   | a skipped scene, a retry       | FFX's shatter (right-to-left)      |
 * | FFX-2 | any                            | FFX-2's shatter, then a hard cut   |
 * | both  | reduced motion                 | a cut                              |
 * | both  | low effects                    | the swirl (`swirl.ts`)             |
 *
 * Vegnagun's parts get the implosion (`implosion.ts`), built OFF until Bailey
 * has seen it. Skip speed spends 0 s; a fresh Confirm press ends the leaving.
 *
 * **Not wired yet.** `BattleScreenFlow.ts` still plays the swirl; the one line
 * that swaps it for {@link playBattleEntry} is B5's (iteration 2 plan, A-2),
 * written out in `docs/handoff/iter2-b2.md`.
 */

import type { GameId } from '../../../battle/common/types.ts';
import { readSetting } from '../../../app/SaveData.ts';
import { blurPlayer } from './blur.ts';
import { playEntry, type EntryHooks, type EntryPlayer } from './entryOverlay.ts';
import { implosionPlayer } from './implosion.ts';
import { prefersReducedMotion } from './reduceMotion.ts';
import { shatterPlayer } from './shatter.ts';
import { playBattleSwirl } from './swirl.ts';
import { paceFactor, paceGameOf } from '../../../engine/pace.ts';

/** How the battle was reached. */
export type EntrySituation = 'scene' | 'skipped' | 'retry';

export type EntryKind = 'blur' | 'shatter-ffx' | 'shatter-ffx2' | 'implosion' | 'swirl' | 'cut';

/** Which entry a fight gets. Pure: the table above. */
export function entryKindFor(
  game: GameId,
  situation: EntrySituation,
  opts: { reduced?: boolean; low?: boolean; implosion?: boolean } = {},
): EntryKind {
  if (opts.reduced) return 'cut';
  if (opts.low) return 'swirl';
  if (opts.implosion && game === 'ffx2') return 'implosion';
  if (game === 'ffx2') return 'shatter-ffx2';
  return situation === 'scene' ? 'blur' : 'shatter-ffx';
}

export interface BattleEntryOptions extends EntryHooks {
  game: GameId;
  situation: EntrySituation;
  /** Skip speed: swap at once, show nothing. */
  instant?: boolean;
  /** Overrides for tests and captures; by default read from the settings. */
  reduced?: boolean;
  low?: boolean;
  /** A Vegnagun part seam (only when the implosion is switched on). */
  implosion?: boolean;
}

/** A held frame that simply goes: reduced motion's cut. */
function cutPlayer(w: number, h: number): EntryPlayer {
  return {
    className: 'pf-entry--cut',
    introMs: 0,
    outMs: 0,
    outro(ctx, frame, t) {
      ctx.clearRect(0, 0, w, h);
      if (t < 1) ctx.drawImage(frame, 0, 0, w, h);
    },
  };
}

function playerFor(kind: EntryKind, w: number, h: number): EntryPlayer | null {
  switch (kind) {
    case 'blur':
      return blurPlayer(w, h);
    case 'shatter-ffx':
      return shatterPlayer('ffx', w, h);
    case 'shatter-ffx2':
      return shatterPlayer('ffx2', w, h);
    case 'implosion':
      return implosionPlayer(w, h);
    case 'cut':
      return cutPlayer(w, h);
    default:
      return null;
  }
}

/** Play the entry the situation calls for over `root`; resolves when it is gone. */
export async function playBattleEntry(root: HTMLElement, opts: BattleEntryOptions): Promise<void> {
  if (opts.instant) {
    await Promise.resolve(opts.onCover?.());
    return;
  }
  const kind = entryKindFor(opts.game, opts.situation, {
    reduced: opts.reduced ?? prefersReducedMotion(),
    low: opts.low ?? readLow(),
    implosion: opts.implosion === true,
  });
  const win = root.ownerDocument.defaultView ?? window;
  const player = playerFor(kind, Math.max(1, win.innerWidth), Math.max(1, win.innerHeight));
  if (!player) {
    await playBattleSwirl(root, {
      ...(opts.onCover ? { onCover: opts.onCover } : {}),
      ...(opts.whileCovered ? { whileCovered: opts.whileCovered } : {}),
    });
    return;
  }
  // The pacing option (`src/engine/pace.ts`, 1 unless picked) stretches the entry, per game.
  const f = paceFactor('transition', paceGameOf(opts.game));
  await playEntry(root, f === 1 ? player : { ...player, introMs: player.introMs * f, outMs: player.outMs * f }, opts);
}

function readLow(): boolean {
  try {
    return readSetting('lowEffects') === true;
  } catch {
    return false;
  }
}
