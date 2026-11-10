/**
 * The ids of the hidden FFX-2 chapter **Gullwings, Chapter 1** (Boris at the Floating Ruins, the Flame Dragon in Besaid's cave, the Guardian Beast in the Zanarkand Ruins, YSLS-Zero at Kilika's approach; hidden chapter 51,
 * branch `ch-gullwings-ch1`), in one dependency-free place: the chapter record, its pause metadata, the story, the tactic, the guide and the word on chapter select all read these, so none of them imports another's module
 * just for a string. **FFX-2 only** [AGENTS.md rule 14].
 */

/** The chapter's id: its key in the experiments' store. */
export const GULLWINGS_CH1_ID = 'ffx2-gullwings-ch1' as const;

/**
 * The scene key: the Zanarkand Dome's plate (`src/scenes/zanarkand-dome.ts`, Chapter II's stage), a **flagged stand-in** for all four acts (DR4, the driver's pick under Bailey's blanket yes): stone ruins fit the Floating Ruins
 * and the Zanarkand Ruins, and stand for Besaid's cave and Kilika's approach, which have no plate (`research/re-ffx2-gullwings-chapter1.md` §7). The key is the plate's own id, so the cutscene screen and the party prep
 * (which draw `backdrops/<sceneKey>.png`) find the same painting.
 */
export const GULLWINGS_CH1_SCENE = 'zanarkand-dome';

/** The four formations (the place, then the boss, as `ffx2-bevelle-underground-floor-3-georapella` is named), in play order. */
export const BORIS_GROUP_ID = 'ffx2-gagazet-floating-ruins-boris';
export const FLAME_DRAGON_GROUP_ID = 'ffx2-besaid-cave-flame-dragon';
export const GUARDIAN_BEAST_GROUP_ID = 'ffx2-zanarkand-ruins-guardian-beast';
export const YSLS_ZERO_GROUP_ID = 'ffx2-kilika-approach-ysls-zero';
export const GULLWINGS_CH1_GROUP_IDS = [BORIS_GROUP_ID, FLAME_DRAGON_GROUP_ID, GUARDIAN_BEAST_GROUP_ID, YSLS_ZERO_GROUP_ID] as const;

/** The four bosses. The FFX-2 ids carry `x2-` because nothing of FFX shares them. */
export const X2_BORIS_ID = 'x2-boris';
export const X2_FLAME_DRAGON_ID = 'x2-flame-dragon';
export const X2_GUARDIAN_BEAST_ID = 'x2-guardian-beast';
export const X2_YSLS_ZERO_ID = 'x2-ysls-zero';
/** Every boss of the chapter, in play order. */
export const GULLWINGS_CH1_BODY_IDS = [X2_BORIS_ID, X2_FLAME_DRAGON_ID, X2_GUARDIAN_BEAST_ID, X2_YSLS_ZERO_ID] as const;

/** The game's own rows of the four (`monster.bin`, 0-based): Boris 132, Flame Dragon 122, Guardian Beast 162, YSLS-Zero 47 [RE §0]. */
export const GULLWINGS_CH1_ROWS = [132, 122, 162, 47] as const;

/** The `script-trigger` names that play between the acts: the fall of Boris, of the Flame Dragon and of the Guardian Beast (the seams; YSLS-Zero's fall is the chapter's close). */
export const GULLWINGS_SEAM_1 = 'boris-fallen';
export const GULLWINGS_SEAM_2 = 'flame-dragon-fallen';
export const GULLWINGS_SEAM_3 = 'guardian-beast-fallen';

/**
 * The paintings (`public/art/characters/<key>/`). **None of the four is installed under its own key yet** (the art list in `docs/handoff/ch-gullwings-ch1.md`): a tree without the art draws the presenter's procedural placeholder
 * for an unpainted key, which is what stands in for all four here. Boris is the `x2-aranea` painting recoloured when the art lane makes it (the game's Boris is a spider-fiend of the Aranea's family); the Flame Dragon's painting
 * will also serve the Zalamander (plan row 55, the same model family) and the Guardian Beast's the Azi Dahaka by recolour.
 */
export const BORIS_SPRITE = X2_BORIS_ID;
export const FLAME_DRAGON_SPRITE = X2_FLAME_DRAGON_ID;
export const GUARDIAN_BEAST_SPRITE = X2_GUARDIAN_BEAST_ID;
export const YSLS_ZERO_SPRITE = X2_YSLS_ZERO_ID;

/** The AI script ids (`src/battle/ffx2/ai/gullwings-ch1.ts`; the data file names the same strings, a test pins them). */
export const BORIS_SCRIPT_ID = 'x2-boris';
export const FLAME_DRAGON_SCRIPT_ID = 'x2-flame-dragon';
export const GUARDIAN_BEAST_SCRIPT_ID = 'x2-guardian-beast';
export const YSLS_ZERO_SCRIPT_ID = 'x2-ysls-zero';

/**
 * The polls past which each stage of a boss's "battle too long" block shows (`>` each, in the order Angry, Furious, About to Blow, This Battle Ends Now), then Time Up Meteor every poll [RE §5]. Each boss has its own marks;
 * the block is live in each boss's own scene (the scene constant of each compiled worker equals the scene it stands in here), so it is live in every act.
 */
export const BORIS_TOO_LONG_POLLS = [135, 140, 145, 150] as const;
export const FLAME_DRAGON_TOO_LONG_POLLS = [140, 150, 155, 160] as const;
export const GUARDIAN_BEAST_TOO_LONG_POLLS = [180, 190, 195, 200] as const;
export const YSLS_ZERO_TOO_LONG_POLLS = [135, 140, 145, 150] as const;
