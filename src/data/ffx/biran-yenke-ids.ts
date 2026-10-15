/**
 * The ids of the hidden Biran and Yenke chapter (FFX only; `../chapter-biran-yenke.ts`), in a module with no imports so that the scene, the door, the data, the guide and the tactic can all
 * name them without pulling each other's graphs in (a scene must not import the chapter record, which imports the story and the party's build). The battle layer does not import `src/data`:
 * `battle/ffx/ai/biran-yenke-rules.ts` keeps its own copies of the combatant, script and command ids, and `tests/unit/chapters/biran-yenke-data.test.ts` pins that the two agree.
 *
 * Source of the fight: `research/ffx-biran-yenke.md` (monster records m134 and m135, formation `biran_&_yenke`, forced party Kimahri).
 */

/** The chapter's id: its key in the experiments' store and on the board. */
export const BIRAN_YENKE_ID = 'biran-yenke' as const;

/**
 * The chapter's scene key: Mt. Gagazet, Chapter I's approved plate (`../../scenes/gagazet.ts`), the provisional stand-in for the mountain gate (research §6, §9). The key is also the
 * plate's file name (`art/backdrops/gagazet.png`), so party prep and the cutscenes paint it too.
 */
export const BIRAN_YENKE_SCENE = 'gagazet' as const;

/** Combatant ids (the monsters m134 and m135). */
export const BIRAN_ID = 'biran-ronso' as const;
export const YENKE_ID = 'yenke-ronso' as const;

/** The formation (the game's `biran_&_yenke`). */
export const BIRAN_YENKE_GROUP_ID = 'biran-yenke' as const;

/** AI script ids, registered in `battle/ffx/ai/biran-yenke.ts`. */
export const BIRAN_SCRIPT = 'biran-ronso' as const;
export const YENKE_SCRIPT = 'yenke-ronso' as const;

/** The Ronso's own command rows (`./enemies/biran-yenke-abilities.ts`; research §3.2). */
export const RONSO_BULLDOZE_ID = 'ronso-bulldoze' as const; // 0x60a5
export const YENKE_FIRE_BREATH_ID = 'yenke-fire-breath' as const; // 0x60a2
export const YENKE_AQUA_BREATH_ID = 'yenke-aqua-breath' as const; // 0x60a3
export const BIRAN_BERSERK_ID = 'biran-berserk' as const; // 0x400f
export const BIRAN_MIGHTY_GUARD_ID = 'biran-mighty-guard' as const; // 0x3072, both Ronso
export const BIRAN_MIGHTY_GUARD_SELF_ID = 'biran-mighty-guard-self' as const; // 0x3072, Biran alone
export const YENKE_WHITE_WIND_ID = 'yenke-white-wind' as const; // 0x3070, both Ronso
export const YENKE_WHITE_WIND_SELF_ID = 'yenke-white-wind-self' as const; // 0x3070, Yenke alone

/**
 * The art subject both Ronso are painted from: **Kimahri's own approved paintings** (`public/art/characters/kimahri`), the one Ronso the approved set holds, as a PROVISIONAL stand-in
 * (research §9; no painting of Biran or Yenke exists, and a new subject needs Bailey's pick, AGENTS.md rule 9). A subject of their own replaces it by changing this one id.
 */
export const RONSO_STAND_IN_ART = 'kimahri' as const;
