/**
 * The ids of the hidden **Mirror Aeons** chapter (FFX only; `../chapter-mirror-aeons.ts`; hidden chapter number 27; branch `ch-mirror-aeons`, 2026-10-15), in a module with no imports so that the scene, the door, the data,
 * the guide, the tactic and the battle layer's seams can all name them without pulling each other's graphs in (a scene must not import the chapter record, which imports the story and the party's builds). The battle
 * layer does not import `src/data`: `battle/ffx/ai/dark-aeons-seams.ts` keeps its own copy of the script ids and the formation table's battle ids, and `tests/unit/chapters/mirror-aeons-data.test.ts` pins that the
 * copies agree.
 *
 * **Every number in the two formation tables is the game's own**, read from its files by the reverse-engineering session (`research/re-ffx-yojimbo-sisters-feasibility.md`, "RE section n", `[bytes]`): the eleven
 * formations of the Dark Magus Sisters (`kino00_70` to `kino05_71`) and of Dark Yojimbo (`nagi05_70` to `nagi05_74`), their battle ids, monster slots, stage ids and launch flag words (RE sections 1 and 3), and the
 * Overdrive gauge each Dark Yojimbo tier adds per turn (RE section 4.1). **The two `MIRROR_ACT_*` picks are NOT the game's:** they are the chapter's choice among the game's own fights, an `[estimate]` until the bench
 * (`tests/unit/chapters/mirror-aeons-bench.test.ts`) measures the ladder (`docs/plans/ch-mirror-aeons-review.md` section 3).
 */

/** The chapter's id: its key in the experiments' store and on the board (the board has no card for it; its word is `yojimbo`, `../../app/screens/frontend/yojimboDoor.ts`). */
export const MIRROR_AEONS_ID = 'mirror-aeons' as const;

/** The chapter's scene key: one painted stage with two plates (`../../scenes/mirror-aeons.ts`). */
export const MIRROR_AEONS_SCENE = 'mirror-aeons' as const;

/** Act I's plate (Mushroom Rock Road, the plate Sinspawn Gui's first fight uses) and Act II's (the Cavern of the Stolen Fayth, Chapter IX's). Both are existing backdrops, 2688 x 1536. */
export const MIRROR_ACT_I_PLATE = 'mushroom-rock-road' as const;
export const MIRROR_ACT_II_PLATE = 'cavern-stolen-fayth' as const;

/** Combatant ids, which are also the art subjects' names for the sprite lookup (`characters/<spriteKey>`; the Dark aeons draw their aeon's own painting, as the possessed aeons do). */
export const DARK_CINDY_ID = 'dark-cindy' as const;
export const DARK_SANDY_ID = 'dark-sandy' as const;
export const DARK_MINDY_ID = 'dark-mindy' as const;
export const DARK_YOJIMBO_ID = 'dark-yojimbo' as const;
/** The dog stand-in of Dark Yojimbo's formations (the file m116, the Sinscale used as a stand-in: RE section 3): untargetable, no turns, bites when ordered. */
export const DARK_DAIGORO_ID = 'dark-daigoro' as const;

/** AI script ids (registered by `battle/ffx/ai/dark-aeons.ts`, from the reverse-engineering session's note `research/re-ffx-dark-aeons.md`). */
export const DARK_CINDY_SCRIPT = 'dark-sister-cindy' as const;
export const DARK_SANDY_SCRIPT = 'dark-sister-sandy' as const;
export const DARK_MINDY_SCRIPT = 'dark-sister-mindy' as const;
export const DARK_YOJIMBO_SCRIPT = 'dark-yojimbo' as const;
export const DARK_DAIGORO_SCRIPT = 'dark-daigoro' as const;

export type SisterName = 'cindy' | 'sandy' | 'mindy';

/** One formation of the Dark Magus Sisters (RE section 3's table). */
export interface SisterFormation {
  /** The game's formation file name. */
  readonly file: string;
  /** The battle id (area key x 65,536 + 70 + n); the scripts branch on it (RE section 4.2). */
  readonly battleId: number;
  /** Who stands in it, by monster slot (slot 0 is battle actor 20, then 21, 22: RE section 3). */
  readonly sisters: readonly SisterName[];
  /** The battlefield (stage) id from the area table. */
  readonly stage: number;
  /** The launching event's battle flag word: 0x1800 has the victory pose, 0x1000 the same without bit 0x800; a defeat is a game over in all of them (RE section 3). */
  readonly flagWord: number;
  /** Every sister's Overdrive gauge at the start: 100 in the trio formations (RE section 4.2), 0 elsewhere (`[inferred]` from the absence of a write, RE section 9 item 3). */
  readonly startGauge: number;
}

/** The six formations, in the game's file order (RE section 3). The sisters in the trio stand Mindy, Sandy, Cindy from slot 0 (RE section 3: slot 0 is actor 20). */
export const SISTER_FORMATIONS: readonly SisterFormation[] = [
  { file: 'kino00_70', battleId: 0x00dc0046, sisters: ['mindy', 'sandy', 'cindy'], stage: 1035, flagWord: 0x1800, startGauge: 100 },
  { file: 'kino01_70', battleId: 0x00dd0046, sisters: ['mindy', 'sandy', 'cindy'], stage: 1036, flagWord: 0x1800, startGauge: 100 },
  { file: 'kino01_71', battleId: 0x00dd0047, sisters: ['cindy'], stage: 1036, flagWord: 0x1800, startGauge: 0 },
  { file: 'kino01_72', battleId: 0x00dd0048, sisters: ['mindy', 'sandy'], stage: 1036, flagWord: 0x1000, startGauge: 0 },
  { file: 'kino05_70', battleId: 0x00e10046, sisters: ['sandy'], stage: 1036, flagWord: 0x1000, startGauge: 0 },
  { file: 'kino05_71', battleId: 0x00e10047, sisters: ['mindy'], stage: 1036, flagWord: 0x1000, startGauge: 0 },
] as const;

/**
 * **OUR ADJUSTMENT, not a game formation** (RE note 2.6; disclosed wherever it is used, in the guide, the handoff and the changelog; the bench measures it only as an alternative to the faithful trio, and the
 * chapter does NOT ship it): the faithful trio's battle id (`kino00_70`, so the scripts' trio test still runs) with the three gauges written 0 after the setup instead of 100. Delta Attack then arrives on Cindy's turn
 * at tick 45 (five rounds of basic turns first) instead of as the third enemy action of the battle. It is the smaller departure from the game's data than scaling the Sisters' damage (RE note 2.6), and the only one the
 * plan allowed (`docs/plans/ch-mirror-aeons-review.md`); a boss row is never touched.
 */
export const SISTER_ADJUSTED_FORMATIONS: readonly SisterFormation[] = [
  { file: 'kino00_70-g0', battleId: 0x00dc0046, sisters: ['mindy', 'sandy', 'cindy'], stage: 1035, flagWord: 0x1800, startGauge: 0 },
] as const;

/** One tier of Dark Yojimbo (RE sections 3 and 4.1): five fresh 1,600,000-HP fights; what changes is how fast his gauge fills. */
export interface YojimboTier {
  readonly file: string;
  readonly battleId: number;
  readonly stage: number;
  /** Overdrive gauge added after each of his own turns (RE section 4.1): Zanmato at 100. */
  readonly gaugePerTurn: number;
  /** Only the first tier's script sets the ambushed start (RE section 4.1). */
  readonly ambushed: boolean;
}

/** The five tiers in the game's order (flag word 0x1500 on all five launches: no victory pose, a defeat is a game over). */
export const YOJIMBO_TIERS: readonly YojimboTier[] = [
  { file: 'nagi05_70', battleId: 0x01ae0046, stage: 1080, gaugePerTurn: 6, ambushed: true },
  { file: 'nagi05_71', battleId: 0x01ae0047, stage: 1066, gaugePerTurn: 10, ambushed: false },
  { file: 'nagi05_72', battleId: 0x01ae0048, stage: 1080, gaugePerTurn: 16, ambushed: false },
  { file: 'nagi05_73', battleId: 0x01ae0049, stage: 1066, gaugePerTurn: 20, ambushed: false },
  { file: 'nagi05_74', battleId: 0x01ae004a, stage: 1066, gaugePerTurn: 26, ambushed: false },
] as const;

/** The group id of one Sisters formation or one Yojimbo tier (`../data/ffx/enemies/dark-aeons-groups.ts`). */
export const sistersGroupId = (file: string): string => `mirror-sisters-${file}`;
export const yojimboGroupId = (file: string): string => `mirror-yojimbo-${file}`;

/**
 * **THE TWO PICKS, set by the bench** (`docs/plans/ch-mirror-aeons-bench.md`; the chapter's own choice among the game's fights, never a number of the game's). Act I fights **the faithful pair `kino01_72`** (Dark Mindy and
 * Dark Sandy, 4.5M HP together, both gauges starting at 0: no Delta Attack, a Mega Graviton on each one's sixth turn): RE's note recommends it as the game-sourced formation that is "not too easy, not too hard" (RE note 2.6),
 * and the bench agrees, because the faithful trio (`kino00_70`) is out of reach for the advisor's line, 1 win in 100, and so is the trio with its gauges started at 0, our adjustment (`SISTER_ADJUSTED_FORMATIONS`). Act II
 * fights **tier 2 `nagi05_71`** (+10 a turn: Zanmato on his eleventh turn, about four actions of the party's between Zanmatos), RE's recommendation too; the bench found the tiers 1 to 5 within a few points of each other
 * for a line that sends an aeon in on time (84 to 99 percent), so the tier is RE's reading and not a lever.
 */
export const MIRROR_ACT_I = 'kino01_72' as const;
export const MIRROR_ACT_II = 'nagi05_71' as const;

/** Act I's rungs from the easiest to the hardest, by the files' own HP totals (RE section 2): Mindy alone 2.0M, Sandy alone 2.5M, Cindy alone 3.0M, Sandy with Mindy 4.5M, the trio 7.5M. */
export const SISTER_LADDER: readonly string[] = ['kino05_71', 'kino05_70', 'kino01_71', 'kino01_72', 'kino01_70', 'kino00_70'] as const;

/** The two acts' group ids as the chapter chains them. */
export const MIRROR_ACT_I_GROUP = sistersGroupId(MIRROR_ACT_I);
export const MIRROR_ACT_II_GROUP = yojimboGroupId(MIRROR_ACT_II);

/** The seam between the acts: a mid-battle script on the `all-ko` of Act I's sisters (`../../story/scripts/mirror-aeons.ts` mirrors the id). */
export const MIRROR_SEAM = 'sisters-fall' as const;

/** The player's side: the four optional aeons Yuna owns in the preset (Yojimbo and the three Magus Sisters); the two named estimates the files do not hold are in `./builds/mirror-aeons.ts` (RE section 5.5). */
export const PLAYER_MIRROR_AEONS = ['yojimbo', 'cindy', 'sandy', 'mindy'] as const;
