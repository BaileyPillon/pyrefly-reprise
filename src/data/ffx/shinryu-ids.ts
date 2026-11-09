/**
 * The ids of the hidden **Shinryu** chapter (FFX only; `../chapter-shinryu.ts`; hidden chapter number 48; branch `ch-shinryu`, 2026-11-07), in a module with no imports so that the scene, the door, the data, the guide,
 * the tactic and the battle layer's seams can all name them without pulling each other's graphs in. The battle layer does not import `src/data`: `battle/ffx/ai/shinryu.ts` keeps its own copy of the combatant,
 * script and ability ids, and `tests/unit/chapters/shinryu-data.test.ts` pins that the copies agree.
 *
 * Source of the fight: `research/re-ffx-shinryu.md` ("RE n"; the game's own files: monster file `m283` Shinryu and the formation `zzzz02_83`). The paper preflight is `docs/plans/ch-shinryu-review.md`
 * (SH1 to SH9, kept with the handoff `docs/handoff/ch-shinryu.md`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: Shinryu is a creature of the FFX Monster Arena (CTB, the FFX monster files, the swimmers' water rules); FFX-2 has no such row.
 */

/** The chapter's id: its key in the experiments' store (the board has no card for it; its word is `shinryu`, `../../app/screens/frontend/shinryuDoor.ts`). */
export const SHINRYU_CHAPTER_ID = 'shinryu' as const;

/** The chapter's scene key: the Via Purifico's stage on its submerged plate, with Shinryu staged (`../../scenes/shinryu.ts`). */
export const SHINRYU_SCENE = 'shinryu' as const;

/** The formation (`zzzz02_83` in the game), the combatant (monster file `m283`, the game's actor 20) and its script. */
export const SHINRYU_GROUP_ID = 'shinryu' as const;
export const SHINRYU_ID = 'shinryu' as const;
export const SHINRYU_SCRIPT = 'shinryu' as const;

/**
 * Shinryu's painting (`public/art/characters/shinryu/<pose>.png`, the five poses of {@link SHINRYU_POSES}), installed in release 79 (the art-w4 kit, `docs/handoff/r79-art-install.md`): painted over the game's own model (m283),
 * posed by the airship Evrae's motion bank (the same 250 bones). It replaces the stand-in the chapter was built with, the airship Evrae's approved painting (`characters/evrae/`).
 */
export const SHINRYU_SPRITE = 'shinryu' as const;
/** The five poses the art lane owes, each a file `characters/shinryu/<pose>.png` (with its sidecar: `width`, `height`, `baselineY`, `pose`, `facing`): the presenter picks by the action's kind. */
export const SHINRYU_POSES = ['idle', 'attack', 'cast', 'hurt', 'ko'] as const;

/**
 * The move rows (`../enemies/shinryu-abilities.ts`), the game's `monmagic1` rows 0x40F0, 0x40F6 and 0x40BF (RE 3). The ids carry the chapter's prefix: the game's plain "Attack" row is not the engine's own default Attack.
 */
export const SHINRYU_ROWS = {
  attack: 'shinryu-attack', // 0x40F0
  eraser: 'shinryu-eraser', // 0x40F6
  shining: 'shinryu-shining', // 0x40BF
} as const;

/** The three swimmers: the only ones who can swim (Jegged), and the three the Flooded Ways chapter fields. */
export const SHINRYU_SWIMMERS = ['tidus', 'wakka', 'rikku'] as const;

/** The plate the stage draws (the submerged variant of the Via Purifico, installed in release 76's art): a stand-in for the game's stage 106, a sea stage that is not rendered (RE 5). */
export const SHINRYU_PLATE = 'via-purifico-flooded-3' as const;
