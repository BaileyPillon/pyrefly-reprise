/**
 * The ids of the hidden FFX-2 chapter **The Guardians of the Bevelle Underground** (Georapella and the Precepts Guard on floor 3, Baralai on floor 7; branch `ch-bevelle-guardians`), in one dependency-free
 * place: the chapter record, its pause metadata, the story, the scene's staging and the word on chapter select all read these, so none of them imports another's module just for a string.
 * **FFX-2 only** [AGENTS.md rule 14].
 */

/** The chapter's id: its key in the experiments' store. */
export const BEVELLE_GUARDIANS_ID = 'ffx2-bevelle-guardians' as const;

/**
 * The scene key: the Bevelle Underground's own plate (`src/scenes/bevelle-underground.ts`, Chapter IV's stage). BG3 (the driver's pick under Bailey's blanket yes): one plate for all three acts, the game's rooms are
 * "Under-Bevelle exterior" (floor 3) and "artificial parts" (floor 7), which no plate shows yet (`research/re-ffx2-bevelle-underground.md` §5.1). The key is the plate's own id, so the cutscene screen and the party prep
 * (which draw `backdrops/<sceneKey>.png`) find the same painting.
 */
export const BEVELLE_GUARDIANS_SCENE = 'bevelle-underground';

/** The three formations (the place, then the guardian, as `ffx2-via-infinito-floor-20-aranea` is named), in play order. */
export const GEORAPELLA_GROUP_ID = 'ffx2-bevelle-underground-floor-3-georapella';
export const PRECEPTS_GUARD_GROUP_ID = 'ffx2-bevelle-underground-floor-3-precepts-guard';
export const BARALAI_GROUP_ID = 'ffx2-bevelle-underground-floor-7-baralai';
export const BEVELLE_GUARDIANS_GROUP_IDS = [GEORAPELLA_GROUP_ID, PRECEPTS_GUARD_GROUP_ID, BARALAI_GROUP_ID] as const;

/** The three guardians. The FFX-2 ids carry `x2-` because nothing of FFX shares them. */
export const X2_GEORAPELLA_ID = 'x2-georapella';
export const X2_PRECEPTS_GUARD_ID = 'x2-precepts-guard';
export const X2_BARALAI_ID = 'x2-baralai';
/** Every guardian of the chapter, in play order. */
export const BEVELLE_GUARDIANS_BODY_IDS = [X2_GEORAPELLA_ID, X2_PRECEPTS_GUARD_ID, X2_BARALAI_ID] as const;

/** The game's own rows of the three (`monster.bin`, 0-based): Georapella 262, Precepts Guard 263, Baralai 175 [RE §0]. */
export const BEVELLE_GUARDIANS_ROWS = [262, 263, 175] as const;

/** The `script-trigger` names that play between the links: the fall of Georapella and of the Precepts Guard (the seams; Baralai's fall is the chapter's close). */
export const GUARDIANS_SEAM_1 = 'georapella-fallen';
export const GUARDIANS_SEAM_2 = 'precepts-guard-fallen';
/** The `script-trigger` name Baralai's AI emits once, when his blow count reaches nine (BG4: the chapter's one counter callout; the game shows none). It is the key of the callout script, with no entry in `mid`. */
export const BARALAI_COUNT_NINE_TRIGGER = 'baralai-count-nine';

/**
 * The paintings (`public/art/characters/<key>/`). Georapella and the Precepts Guard have none yet (the presenter draws its procedural placeholder for an unpainted key); **Baralai stands in with the Den of Woe
 * shade's painting** (`baralai-shade`, the same man as a spectre: idle, cast, hurt, ko), flagged, until the living Baralai is painted (`x2-baralai` in the handoff's art list, with attack and glint poses).
 */
export const GEORAPELLA_SPRITE = 'x2-georapella';
export const PRECEPTS_GUARD_SPRITE = 'x2-precepts-guard';
export const BARALAI_SPRITE = 'baralai-shade';

/** The AI script ids (`src/battle/ffx2/ai/bevelle-guardians.ts`; the data file names the same strings, a test pins them). */
export const GEORAPELLA_SCRIPT_ID = 'x2-georapella';
export const PRECEPTS_GUARD_SCRIPT_ID = 'x2-precepts-guard';
export const BARALAI_SCRIPT_ID = 'x2-baralai';
