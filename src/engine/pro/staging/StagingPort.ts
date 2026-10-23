/**
 * THE PORT THE PRESENTER TALKS TO FOR THE PRO STAGING (lane "pro-staging"; `StagingSwitch.ts` has the switch and the four pieces). The presenter (`BattlePresenterStaging.ts`, called from the beats) tells it what is
 * happening; the DOM layer behind it (`ui/common/proStage/ProStageLayer.ts`) draws it. Nothing here waits on the layer: every call returns at once, and the presenter keeps its own clock (a hold it needs is its own
 * `ctx.sleep`), so a layer that is missing, slow or broken costs the picture, never the fight.
 *
 * Game case (AGENTS.md rule 14): the cue names the game; the layer skins it (FFX: ivory, ice-blue and gold; FFX-2: pearl, lilac and pink). Pure: no `three`, no DOM, no imports from the engine's heavy modules.
 */
import type { DemoGame } from '../../motion/DemoGate.ts';

/** The two boss moves the held breath stages: Total Annihilation (FFX only, Chapter I) and Mega Flare (FFX-2 only, Chapter IV). */
export type BigMove = 'total-annihilation' | 'mega-flare';

/** The ability ids each move goes by (the ids the ENGINE emits: `battle/ffx2/abilities-core.ts` has `mega-flare`; the enemy data file's `x2-bahamut-mega-flare` is the same move). */
const MOVE_OF: Readonly<Record<string, BigMove>> = Object.freeze({
  'total-annihilation': 'total-annihilation',
  'mega-flare': 'mega-flare',
  'x2-bahamut-mega-flare': 'mega-flare',
});

/** Which staged move an ability is, in this game: Total Annihilation is FFX's (the id is the mount's), Mega Flare FFX-2's (FFX shares the id for the aeon Bahamut's Overdrive, which is never staged here). */
export function bigMoveOf(abilityId: string | undefined, game: DemoGame): BigMove | null {
  const move = abilityId === undefined ? undefined : MOVE_OF[abilityId];
  if (move === undefined) return null;
  return (move === 'total-annihilation') === (game === 'ffx') ? move : null;
}

/** The facts every cue carries about how it should play. */
export interface StageFacts {
  game: DemoGame;
  /** The playback speed's factor on every duration (`SPEED_SCALE`: 1 normal, 0.32 fast). Never 0: a skipped run sends no cue. */
  scale: number;
  /** REDUCE MOTION: no lean, no drifting motes, no ring travel; the light still changes. */
  calm: boolean;
  /** REDUCE FLASHES is on: no white flash, and the flood is capped. */
  tame: boolean;
}

/** The held breath: a boss's big blow in four beats. `attacker` and `party` are combatant ids; the layer asks the stage for their rectangles. */
export type BreathCue =
  | (StageFacts & { kind: 'mark'; move: BigMove; name: string; attacker: string; party: readonly string[] })
  | (StageFacts & { kind: 'tell'; move: BigMove; name: string; attacker: string; party: readonly string[]; msToBlow: number })
  | (StageFacts & { kind: 'blow'; move: BigMove; attacker: string })
  | (StageFacts & { kind: 'lift' });

/** The ending: the freeze on the last blow, the title, the pull-back into the results; the defeat caption. */
export type EndingCue =
  | (StageFacts & { kind: 'freeze'; boss: string; holdMs: number })
  | (StageFacts & { kind: 'title'; name: string })
  | (StageFacts & { kind: 'pullback'; ms: number })
  | (StageFacts & { kind: 'fall'; party: readonly string[] });

/** The openings: an Overdrive (FFX) and a dress change (FFX-2). */
export type OpeningCue =
  | (StageFacts & { kind: 'overdrive'; actor: string; name: string; actorName: string })
  | (StageFacts & { kind: 'change'; actor: string; actorName: string; dress: string; gate?: string | undefined });

export interface StagingPort {
  breath(cue: BreathCue): void;
  ending(cue: EndingCue): void;
  opening(cue: OpeningCue): void;
  /** Drop every layer at once (the screen leaves, a fight restarts). */
  clear(): void;
}
