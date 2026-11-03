/**
 * The ids of the hidden FFX-2 chapter **The Fallen Maesters** (the Via Infinito's floor fights 20, 40, 60 and 80: Aranea, Black Elemental, Concherer and Chac; branch `ch-maesters`), in one
 * dependency-free place: the chapter record, its pause metadata, the story, the scene's staging and the word on chapter select all read these, so none of them imports another's module
 * just for a string. **FFX-2 only** [AGENTS.md rule 14].
 */

/** The chapter's id: its key in the experiments' store. */
export const FALLEN_MAESTERS_ID = 'ffx2-fallen-maesters' as const;

/**
 * The scene key: the Via Infinito's own (`src/scenes/cloister-100.ts`), Chapter XIII's stage, because the game shares ONE battle map across every `stbv09` row, the four floors, Paragon and
 * Trema included (`research/re-ffx2-fallen-maesters.md` §5.1). The key is the plate's own id, so the cutscene screen and the party prep (which draw `backdrops/<sceneKey>.png`) find the same painting.
 */
export const FALLEN_MAESTERS_SCENE = 'via-infinito';

/** The four formations (the floor, then the fiend, as `ffx2-cloister-trema` and `ffx2-bikanel-angra-mainyu` are named), in play order. */
export const FLOOR_20_GROUP_ID = 'ffx2-via-infinito-floor-20-aranea';
export const FLOOR_40_GROUP_ID = 'ffx2-via-infinito-floor-40-black-elemental';
export const FLOOR_60_GROUP_ID = 'ffx2-via-infinito-floor-60-concherer';
export const FLOOR_80_GROUP_ID = 'ffx2-via-infinito-floor-80-chac';
export const FALLEN_MAESTERS_GROUP_IDS = [FLOOR_20_GROUP_ID, FLOOR_40_GROUP_ID, FLOOR_60_GROUP_ID, FLOOR_80_GROUP_ID] as const;

/** The four fiends. The FFX-2 ids carry `x2-` because nothing of FFX shares them. */
export const X2_ARANEA_ID = 'x2-aranea';
export const X2_BLACK_ELEMENTAL_ID = 'x2-black-elemental';
export const X2_CONCHERER_ID = 'x2-concherer';
export const X2_CHAC_ID = 'x2-chac';
/** Every fiend of the chapter, in floor order. */
export const FALLEN_MAESTERS_BODY_IDS = [X2_ARANEA_ID, X2_BLACK_ELEMENTAL_ID, X2_CONCHERER_ID, X2_CHAC_ID] as const;

/** The floors the four stand on (`research/re-ffx2-fallen-maesters.md` §6.2), in the same order. */
export const FALLEN_MAESTERS_FLOORS = [20, 40, 60, 80] as const;

/** The `script-trigger` names that play between the links: the fall of the fiend of floor 20, 40 and 60 (the seams; floor 80's fall is the chapter's close). */
export const MAESTERS_SEAM_20 = 'floor-20-fallen';
export const MAESTERS_SEAM_40 = 'floor-40-fallen';
export const MAESTERS_SEAM_60 = 'floor-60-fallen';

/** The paintings (none exist yet: the art needs list in `docs/handoff/ch-maesters.md`; until they are installed the presenter draws its fallback). */
export const ARANEA_SPRITE = 'x2-aranea';
export const BLACK_ELEMENTAL_SPRITE = 'x2-black-elemental';
export const CONCHERER_SPRITE = 'x2-concherer';
export const CHAC_SPRITE = 'x2-chac';

/** The AI script ids (`src/battle/ffx2/ai/fallen-maesters-*.ts`; the data file names the same strings, a test pins them). */
export const ARANEA_SCRIPT_ID = 'x2-aranea';
export const BLACK_ELEMENTAL_SCRIPT_ID = 'x2-black-elemental';
export const CONCHERER_SCRIPT_ID = 'x2-concherer';
export const CHAC_SCRIPT_ID = 'x2-chac';
