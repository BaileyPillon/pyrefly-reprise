/**
 * The ids of the hidden FFX-2 chapter **Yuna's Ballad** (Yuna alone against the possessed Rikku and then the possessed Paine in the Den of Woe, `monster.bin` rows 254 and 256; branch `ch-yunas-ballad`), in one
 * dependency-free place: the chapter record, its pause metadata, the story, the scene's staging and the word on chapter select all read these, so none of them imports another's module just for a string.
 * **FFX-2 only** [AGENTS.md rule 14].
 */

/** The chapter's id: its key in the experiments' store. */
export const YUNAS_BALLAD_ID = 'ffx2-yunas-ballad' as const;

/**
 * The scene key: the Den of Woe's own (`src/scenes/den-of-woe.ts`, Chapter XV's stage). The game fights the two duels in the same map as the three shades ("natural parts b", `kino13_225` to `_229`;
 * `research/re-ffx2-yunas-ballad.md` section 5), so this is the game's own room. The key is the plate's own id, so the cutscene screen and the party prep (which draw `backdrops/<sceneKey>.png`) find the same painting.
 */
export const YUNAS_BALLAD_SCENE = 'den-of-woe';

/** The two formations (the duel's name, then the fight), in play order. */
export const RIKKU_DUEL_GROUP_ID = 'ffx2-den-of-woe-possessed-rikku';
export const PAINE_DUEL_GROUP_ID = 'ffx2-den-of-woe-possessed-paine';
export const YUNAS_BALLAD_GROUP_IDS = [RIKKU_DUEL_GROUP_ID, PAINE_DUEL_GROUP_ID] as const;

/** The two fighters. The FFX-2 ids carry `x2-` because nothing of FFX shares them, and `possessed` so the guide's per-chapter lookup never meets the girls of the party. */
export const X2_POSSESSED_RIKKU_ID = 'x2-possessed-rikku';
export const X2_POSSESSED_PAINE_ID = 'x2-possessed-paine';
/** Both, in duel order. */
export const YUNAS_BALLAD_BODY_IDS = [X2_POSSESSED_RIKKU_ID, X2_POSSESSED_PAINE_ID] as const;

/** The `script-trigger` name that plays between the links: the fall of the possessed Rikku (the seam into the second duel; the second fall is the chapter's close). */
export const BALLAD_SEAM_RIKKU = 'rikku-freed';

/**
 * The paintings (`public/art/characters/<key>/`, installed by the r76b art install, `docs/handoff/r76b-art-install.md`): the party's own Rikku and Paine sets, mirrored to face the party (the sidecars say `facing: left`, so
 * `BattlePresenterActors.mirrorFor` draws them as they are) and tinted cold with pale eyes. The possession look is our invention, to show Bailey (the repo note says no source describes how the illusions look).
 * Before the install the chapter drew the party's own `rikku` and `paine-warrior` sets, which the presenter mirrored because they are painted facing right; a tree without the art draws the placeholder.
 */
export const POSSESSED_RIKKU_SPRITE = X2_POSSESSED_RIKKU_ID;
export const POSSESSED_PAINE_SPRITE = X2_POSSESSED_PAINE_ID;

/** The AI script ids (`src/battle/ffx2/ai/yunas-ballad.ts`; the data file names the same strings, a test pins them). */
export const POSSESSED_RIKKU_SCRIPT_ID = 'x2-possessed-rikku';
export const POSSESSED_PAINE_SCRIPT_ID = 'x2-possessed-paine';
