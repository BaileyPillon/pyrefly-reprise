/**
 * The ids of the hidden FFX-2 chapter **The Luca Opener** (the first fights of FFX-2's Chapter 1 on the docks of Luca: Logos and Ormi, then Leblanc as the Songstress; branch `ch-luca-opener`), in one dependency-free
 * place: the chapter record, its pause metadata, the story, the formations, the AI and the word on chapter select all read these, so none of them imports another's module just for a string.
 * **FFX-2 only** [AGENTS.md rule 14].
 */

/** The chapter's id: its key in the experiments' store. */
export const LUCA_OPENER_ID = 'ffx2-luca-opener' as const;

/**
 * The scene key: `leblanc-last-room`, the Leblanc chapters' stage (Leblanc stands there already). LO4 (the driver's pick under Bailey's blanket yes): a **flagged stand-in** for the docks of Luca, for which no plate exists
 * (`docs/plans/ch-debut-review.md` section 5). The key is the plate's own id, so the cutscene screen and the party prep (which draw `backdrops/<sceneKey>.png`) find the same painting.
 */
export const LUCA_OPENER_SCENE = 'leblanc-last-room';

/** The two formations (the place, then the people, as `ffx2-bevelle-underground-floor-3-georapella` is named), in play order. */
export const LUCA_DOCK_LOGOS_ORMI_GROUP_ID = 'ffx2-luca-dock-logos-ormi';
export const LUCA_DOCK_LEBLANC_GROUP_ID = 'ffx2-luca-dock-leblanc';
export const LUCA_OPENER_GROUP_IDS = [LUCA_DOCK_LOGOS_ORMI_GROUP_ID, LUCA_DOCK_LEBLANC_GROUP_ID] as const;

/** The three Syndicate people of the opener. The ids carry `x2-luca-` so they can never meet the Chateau Leblanc set (`ormi`, `logos`, `leblanc`, rows 241 to 253) in one lookup. */
export const X2_LUCA_ORMI_ID = 'x2-luca-ormi';
export const X2_LUCA_LOGOS_ID = 'x2-luca-logos';
export const X2_LUCA_LEBLANC_ID = 'x2-luca-leblanc';
/** Every fighter of the chapter, in play order (act 1's pair, then act 2's one). */
export const LUCA_OPENER_BODY_IDS = [X2_LUCA_LOGOS_ID, X2_LUCA_ORMI_ID, X2_LUCA_LEBLANC_ID] as const;
/** Act 1's pair (the seam fires when both are down). */
export const LUCA_ACT_1_IDS = [X2_LUCA_LOGOS_ID, X2_LUCA_ORMI_ID] as const;

/** The game's own rows of the three (`monster.bin`, 0-based): Ormi 129, Logos 130, Leblanc 131 [RE section 0]. The Chateau Leblanc set (rows 241 to 253) is a different record of the same people. */
export const LUCA_OPENER_ROWS = [129, 130, 131] as const;

/** The `script-trigger` name that plays between the acts: the fall of Logos and Ormi (the seam; Leblanc's fall is the chapter's close). */
export const LUCA_SEAM_1 = 'luca-act-1-fallen';
/** The `script-trigger` names the AI emits (callouts, no entry in `mid`): Logos' one Potion, and Ormi's first shield throw. */
export const LUCA_POTION_TRIGGER = 'luca-logos-potion';
export const LUCA_SHIELD_TRIGGER = 'luca-ormi-shield';

/**
 * The paintings (`public/art/characters/<key>/`): the Leblanc Syndicate's approved sets, shared with the Chateau Leblanc chapters. A tree without the art draws the presenter's procedural placeholder.
 * The three paintings are a stand-in only in the sense that they are the Chateau fights' bodies, not new paintings of the Lv 2 opener (`docs/handoff/ch-luca-opener.md`, art list).
 */
export const LUCA_ORMI_SPRITE = 'ormi';
export const LUCA_LOGOS_SPRITE = 'logos';
export const LUCA_LEBLANC_SPRITE = 'leblanc';

/** The AI script ids (`src/battle/ffx2/ai/luca-opener.ts`; the data file names the same strings, a test pins them). */
export const LUCA_ORMI_SCRIPT_ID = 'x2-luca-ormi';
export const LUCA_LOGOS_SCRIPT_ID = 'x2-luca-logos';
export const LUCA_LEBLANC_SCRIPT_ID = 'x2-luca-leblanc';
