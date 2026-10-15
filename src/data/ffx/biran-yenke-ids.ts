/**
 * The ids of the hidden Biran and Yenke chapter (FFX only; `../chapter-biran-yenke.ts`), in a module with no imports so that the scene, the door, the data, the guide and the tactic can all name them
 * without pulling each other's graphs in (a scene must not import the chapter record, which imports the story and the party's builds). The battle layer does not import `src/data`:
 * `battle/ffx/ai/biran-yenke-rules.ts` and `battle/ffx/ronso-rage.ts` keep their own copies of the combatant and script ids, and `tests/unit/chapters/biran-yenke-data.test.ts` pins that the copies agree.
 */

/** The chapter's id: its key in the experiments' store and on the board (the board has no card for it; its word is `gagazet`, `../../app/screens/frontend/gagazetDoor.ts`). */
export const BIRAN_YENKE_ID = 'biran-yenke' as const;

/** The chapter's scene key: Chapter I's Mt. Gagazet diorama with this fight's staging (`../../scenes/gagazet-ronso.ts`). */
export const GAGAZET_RONSO_SCENE = 'gagazet-ronso' as const;

/** The formation (one battle: Kimahri against both Ronso). */
export const BIRAN_YENKE_GROUP_ID = 'biran-yenke-duel' as const;

/** Combatant ids, which are also the art subjects (`public/art/characters/<id>`: provisional paintings, new subjects). */
export const BIRAN_ID = 'biran-ronso' as const;
export const YENKE_ID = 'yenke-ronso' as const;

/** AI script ids, registered in `battle/ffx/ai/biran-yenke.ts`. */
export const BIRAN_SCRIPT = 'biran-ronso' as const;
export const YENKE_SCRIPT = 'yenke-ronso' as const;

/** Kimahri's id in the party (the one member). */
export const KIMAHRI_ID = 'kimahri' as const;
