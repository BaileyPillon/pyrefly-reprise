export type RetireGame = 'ffx' | 'ffx2';

/** One way the game reaches a stand-in: the `v2:` key it plays and the originals it asked the mixer to look up first. */
export interface Use {
  key: string;
  /** `undefined`: the key is looked up by its own name (a menu key); an array (even empty): those names, in order. */
  events: readonly string[] | undefined;
}

export interface CoreCue {
  game?: 'ffx' | 'ffx2' | 'both' | undefined;
}

export interface RetireInput {
  /** The cues the v2 sprite holds now. */
  sprite: ReadonlySet<string>;
  /** The key space (`V2_CUES`): each cue's game. */
  cues: Readonly<Record<string, { game: 'ffx' | 'ffx2' | 'both' }>>;
  /** Each game's core pack (`ffx-core`, `ffx2-core`): its cues by name. A game whose core is not shipped has none. */
  core: Readonly<Record<RetireGame, Readonly<Record<string, CoreCue>> | undefined>>;
  /** Every use observed per game. */
  uses: Readonly<Record<RetireGame, readonly Use[]>>;
  /** Cue names a repack has already taken out of the sprite (the key space minus the sprite): they stay retired. */
  already?: readonly string[] | undefined;
}

export interface RetirePlan {
  /** Cue names (no prefix) to take out of the v2 sprite, sorted. */
  retired: string[];
  /** Cue name -> why it stays. */
  kept: Record<string, string>;
  /** The names that were already out of the sprite when the plan was made, sorted: retired too, but giving no bytes back now. */
  already?: string[];
  /** The names in `already` that the rules no longer allow to stay out (a game that asks for the cue has no recorded original of it): they must be put back into the sprite. */
  reinstate?: string[];
}

export function planRetirement(input: RetireInput): RetirePlan;
export function retiredBytes(plan: RetirePlan, cues: Readonly<Record<string, { duration: number }>>, spriteBytes: number, spriteSeconds: number, gapSeconds?: number): number;
