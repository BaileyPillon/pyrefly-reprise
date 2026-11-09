/**
 * The ids of the hidden FFX-2 chapter **Garik Ronso** (Garik and the Ronso Youths at the top of Mt. Gagazet, the Chapter 3 mission "Battle Blockade"; `monster.bin` rows 181 and 182, formations 1621 and 1622; branch
 * `ch-garik-ronso`), in one dependency-free place: the chapter record, its pause metadata, the story, the scene, the setting that picks the fight and the word on chapter select all read these, so none of them imports
 * another's module just for a string. **FFX-2 only** [AGENTS.md rule 14].
 */

/** The chapter's id: its key in the experiments' store. */
export const GARIK_RONSO_ID = 'ffx2-garik-ronso' as const;

/**
 * The scene key: the summit of Mt. Gagazet under the FFX-2 camera (`src/scenes/gagazet-summit.ts`), on Chapter I's `gagazet` plate as the flagged stand-in (the summit has no plate of its own; the party prep and the
 * cutscene screen draw `backdrops/<plate>.png`, and the scene's art namespace maps this key to that plate).
 */
export const GARIK_RONSO_SCENE = 'ffx2-gagazet-summit' as const;
/** The plate this scene draws: Chapter I's Mt. Gagazet, under a snow-and-wind grade (the preflight's pick GA6). */
export const GARIK_RONSO_PLATE = 'gagazet' as const;

/**
 * The two formations: `mtgz10_228` (formation 1622, the hostile fight: two Ronso Youths and Garik) and `mtgz10_229` (formation 1621, the friendly bout: one Youth and Garik). The game picks one by a saved score; the chapter's
 * setting ("Ronso trust", `./garik-ronso-trust.ts`) picks between them, low by default.
 */
export const GARIK_HOSTILE_GROUP_ID = 'ffx2-gagazet-garik-hostile';
export const GARIK_FRIENDLY_GROUP_ID = 'ffx2-gagazet-garik-friendly';
export const GARIK_GROUP_IDS = [GARIK_HOSTILE_GROUP_ID, GARIK_FRIENDLY_GROUP_ID] as const;

/**
 * The fighters. The ids carry `x2-` because nothing of FFX shares them. The hostile fight has Garik and two Youths (lettered A and B in our data, as FFX-2 names its duplicates: Node A/B/C, the Bulwarks); the friendly bout has
 * Garik and one Youth, under ids of their own so each unit's script, record and sprite is unambiguous.
 */
export const X2_GARIK_ID = 'x2-garik-ronso';
export const X2_YOUTH_A_ID = 'x2-ronso-youth-a';
export const X2_YOUTH_B_ID = 'x2-ronso-youth-b';
export const X2_GARIK_BOUT_ID = 'x2-garik-ronso-bout';
export const X2_YOUTH_BOUT_ID = 'x2-ronso-youth-bout';
/** Every fighter of the hostile fight, then the friendly bout. */
export const GARIK_HOSTILE_BODY_IDS = [X2_YOUTH_A_ID, X2_YOUTH_B_ID, X2_GARIK_ID] as const;
export const GARIK_FRIENDLY_BODY_IDS = [X2_YOUTH_BOUT_ID, X2_GARIK_BOUT_ID] as const;
export const GARIK_BODY_IDS = [...GARIK_HOSTILE_BODY_IDS, ...GARIK_FRIENDLY_BODY_IDS] as const;

/** The AI script ids (`src/battle/ffx2/ai/garik-ronso.ts`; the data file names the same strings, a test pins them). */
export const GARIK_HOSTILE_SCRIPT_ID = 'x2-garik-hostile';
export const GARIK_FRIENDLY_SCRIPT_ID = 'x2-garik-friendly';
export const YOUTH_HOSTILE_SCRIPT_ID = 'x2-ronso-youth-hostile';
export const YOUTH_FRIENDLY_SCRIPT_ID = 'x2-ronso-youth-friendly';

/**
 * The paintings (`public/art/characters/<key>/`). **Stand-ins, flagged**: the Ronso brothers' paintings of the FFX Biran and Yenke chapter (`biran-ronso`, `yenke-ronso`: one idle pose each, painted facing the party) stand for the
 * Youths, and Kimahri's party set (every pose, painted facing right and mirrored by the presenter) for Garik until his own painting is made (`x2-garik-ronso`, the art list in `docs/handoff/ch-garik-ronso.md`).
 */
export const GARIK_SPRITE = 'kimahri';
export const YOUTH_A_SPRITE = 'biran-ronso';
export const YOUTH_B_SPRITE = 'yenke-ronso';
