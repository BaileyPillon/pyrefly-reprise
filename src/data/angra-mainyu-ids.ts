/**
 * The ids of the hidden FFX-2 chapter Angra Mainyu (the Chapter 5 mission "Showdown in the Sands": Angra Mainyu, Zarich and Tawrich at the Al Bhed excavation camp in the Bikanel Desert; branch
 * `ch-angra-mainyu`), in one dependency-free place: the chapter record, its pause metadata, the scene registry and the word on chapter select all read these, so none of them imports another's
 * module just for a string. **FFX-2 only** [AGENTS.md rule 14].
 */

/** The chapter's id: its key in the experiments' store. The boss first, as `ffx2-valefor-besaid` and `ffx2-ixion-djose` are named. */
export const ANGRA_MAINYU_ID = 'ffx2-angra-mainyu' as const;

/** The formation's id (the place, then the boss, as `ffx2-besaid-valefor` and `ffx2-cavern-yojimbo` are). */
export const ANGRA_MAINYU_GROUP_ID = 'ffx2-bikanel-angra-mainyu';

/** The three bodies. The FFX-2 ids carry `x2-` because nothing of FFX shares them. */
export const X2_ANGRA_MAINYU_ID = 'x2-angra-mainyu';
export const X2_ZARICH_ID = 'x2-zarich';
export const X2_TAWRICH_ID = 'x2-tawrich';
/** Every body of the fight, the body first (`bossIds` of the guide, the advisor and the tests). */
export const ANGRA_MAINYU_BODY_IDS = [X2_ANGRA_MAINYU_ID, X2_ZARICH_ID, X2_TAWRICH_ID] as const;

/** The painting: a provisional Bikanel Desert plate (`public/art/backdrops/bikanel-desert-provisional.png`, a new file in the art mirror; until it is installed the engine shows its placeholder plate). */
export const ANGRA_MAINYU_PLATE = 'bikanel-desert-provisional';

/**
 * The scene key: the FFX-2 stage for the desert (`src/scenes/angra-mainyu-desert.ts`). It is the plate's own key, as every other chapter's scene is (`djose-chamber-provisional`, `mushroom-rock-road`), because the cutscene
 * screen and the party prep's wash draw `backdrops/<sceneKey>.png`: a scene key of its own had left the intro on a black screen.
 */
export const ANGRA_MAINYU_SCENE = ANGRA_MAINYU_PLATE;
