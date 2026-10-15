/**
 * The ids of the hidden Angra Mainyu chapter (FFX-2 only; `./chapter-ffx2-angra-mainyu.ts`), in a module with no imports so that the scene, the door, the data, the guide and the tactic can all
 * name them without pulling each other's graphs in. The battle layer does not import `src/data`: `battle/ffx2/ai/angra-mainyu.ts` keeps its own copies of the combatant, script and command ids,
 * and `tests/unit/chapters/angra-mainyu-data.test.ts` pins that the two agree.
 *
 * Source of the fight: `research/ffx2-angra-mainyu.md` (Angra Mainyu and his two arms, Tawrich and Zarich, the Chapter 5 fight at the Al Bhed excavation camp in the Bikanel Desert).
 */

/** The chapter's id: its key in the experiments' store and on the board. */
export const ANGRA_MAINYU_ID = 'ffx2-angra-mainyu' as const;

/**
 * The chapter's scene key: the Machine Faction's grounds, the hidden Experiment's plate (`./experiment-plates.ts`, `EXPERIMENT_GROUNDS_PLATE`), the provisional stand-in for the excavation camp
 * (research §6: a dig site of the same kind). The key is also the plate's file name, so party prep and the cutscenes paint it too. Kept here as a literal (this module imports nothing); the data
 * test pins it to the plate's constant.
 */
export const ANGRA_MAINYU_SCENE = 'ffx2-experiment-grounds' as const;

/** The formation (the camp's one fight). */
export const ANGRA_MAINYU_GROUP_ID = 'ffx2-bikanel-angra-mainyu' as const;

/** Combatant ids: the body and its two arms (parts). `x2-` as every FFX-2 boss whose name could meet an FFX one. */
export const ANGRA_ID = 'x2-angra-mainyu' as const;
export const TAWRICH_ID = 'x2-tawrich' as const;
export const ZARICH_ID = 'x2-zarich' as const;

/** AI script ids (`battle/ffx2/ai/angra-mainyu.ts`). */
export const ANGRA_SCRIPT = 'x2-angra-mainyu' as const;
export const TAWRICH_SCRIPT = 'x2-tawrich' as const;
export const ZARICH_SCRIPT = 'x2-zarich' as const;

/** Angra Mainyu's moves (`./ffx2/enemies/angra-mainyu-abilities.ts`; research §3.1). */
export const ANGRA_ABILITY = {
  perditionsFlame: 'x2-angra-perditions-flame',
  demi: 'x2-angra-demi',
  flare: 'x2-angra-flare',
  curaga: 'x2-angra-curaga',
  fullLife: 'x2-angra-full-life',
  osmose: 'x2-angra-osmose',
} as const;

/** Tawrich's moves (research §3.2). */
export const TAWRICH_ABILITY = {
  punch: 'x2-tawrich-punch',
  bloodyBreath: 'x2-tawrich-bloody-breath',
} as const;

/** Zarich's moves (research §3.3): the four -ara spells, the four -aga spells (Fire, Ice, Thunder, Water, in that order) and Glimmer of Despair. */
export const ZARICH_ABILITY = {
  ara: ['x2-zarich-fira', 'x2-zarich-blizzara', 'x2-zarich-thundara', 'x2-zarich-watera'],
  aga: ['x2-zarich-firaga', 'x2-zarich-blizzaga', 'x2-zarich-thundaga', 'x2-zarich-waterga'],
  glimmer: 'x2-zarich-glimmer-of-despair',
} as const;

/**
 * The painting the body is drawn from: **Chapter XI's approved `x2-anima` set**, as a PROVISIONAL stand-in (research §9: no painting of Angra Mainyu exists and no source describes his look; a
 * new subject needs Bailey's pick, AGENTS.md rule 9). The arms have no painting: they are figure-less parts on his (the Vegnagun D-044 mechanism, `scenes/experiment-grounds.ts`).
 */
export const ANGRA_STAND_IN_ART = 'x2-anima' as const;
