/**
 * The ids of the hidden Sinspawn Gui chapter (FFX only; `../chapter-sinspawn-gui.ts`), in a module with no imports so that the scene, the door, the data, the guide and the tactic can all
 * name them without pulling each other's graphs in (a scene must not import the chapter record, which imports the story and the party's builds). The battle layer does not import `src/data`:
 * `battle/ffx/ai/sinspawn-gui-rules.ts` keeps its own copies of the combatant, script and command ids, and `tests/unit/chapters/sinspawn-gui-data.test.ts` pins that the two agree.
 */

/** The chapter's id: its key in the experiments' store and on the board. */
export const SINSPAWN_GUI_ID = 'sinspawn-gui' as const;

/** The chapter's scene key: the Mushroom Rock Road diorama (`../../scenes/mushroom-rock-road.ts`, a provisional plate). */
export const MUSHROOM_ROCK_SCENE = 'mushroom-rock-road' as const;

/** The second fight's plate: the same camp after the beam (`art/backdrops/mushroom-rock-road-ruined.png`; `EnemyGroupDef.plate`). */
export const MUSHROOM_ROCK_RUINED_PLATE = 'mushroom-rock-road-ruined' as const;

/** Combatant ids: the first fight's body, the second fight's body (the reanimated one), the head and the two arms (actors 20 to 23). */
export const GUI_ID = 'sinspawn-gui' as const;
export const GUI_BODY_2_ID = 'sinspawn-gui-2' as const;
export const GUI_HEAD_ID = 'sinspawn-gui-head' as const;
/** The art subject of the second fight's head (its combatant id is the same as the first's; the painting is the cracked one): `public/art/characters/sinspawn-gui-head-2`. */
export const GUI_HEAD_2_ART = 'sinspawn-gui-head-2' as const;
export const GUI_ARM_LEFT_ID = 'sinspawn-gui-arm-left' as const; // actor 22
export const GUI_ARM_RIGHT_ID = 'sinspawn-gui-arm-right' as const; // actor 23
export const GUI_ARM_IDS: readonly string[] = [GUI_ARM_LEFT_ID, GUI_ARM_RIGHT_ID];

/** The two formations of the chain. */
export const GUI_GROUP_1_ID = 'sinspawn-gui-1' as const;
export const GUI_GROUP_2_ID = 'sinspawn-gui-2' as const;

/** AI script ids, registered in `battle/ffx/ai/sinspawn-gui.ts`. */
export const GUI_BODY_SCRIPT = 'sinspawn-gui' as const;
export const GUI_HEAD_SCRIPT = 'sinspawn-gui-head' as const;
export const GUI_ARM_SCRIPT = 'sinspawn-gui-arm' as const;

/** The party actor Seymour plays as (the game's actor 7). */
export const SEYMOUR_GUEST_ID = 'seymour' as const;

/**
 * The art subject Seymour is painted from on the party side: `public/art/characters/seymour-guest`, a copy of his approved Macalania idle, cast, hurt and KO paintings plus three provisional
 * poses (attack, item, victory; `tools/gui-art-install.mjs`). A subject of its own so the approved `seymour-macalania` folder is never written to.
 */
export const SEYMOUR_GUEST_ART = 'seymour-guest' as const;
