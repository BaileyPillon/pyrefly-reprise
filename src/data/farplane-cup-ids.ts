/**
 * The ids of the hidden FFX-2 chapter **The Farplane Cup** (three fixed duels: Auron, Tidus and Seymour, the fighters of the Fiend Arena's block of `monster.bin` rows 308 to 327; branch `ch-farplane-cup`), in one
 * dependency-free place: the chapter record, its pause metadata, the story, the door word and the tests all read these, so none of them imports another's module just for a string. **FFX-2 only** [AGENTS.md rule 14].
 */

/** The chapter's id: its key in the experiments' store. */
export const FARPLANE_CUP_ID = 'ffx2-farplane-cup' as const;

/**
 * The scene key: the Den of Woe's own stage (`src/scenes/den-of-woe.ts`). The cup has no map of its own in the files (`research/re-ffx2-farplane-cup.md` §5), so the arena is a flagged stand-in (pick DU5): the
 * preflight's first choice, the `farplane` plate, belongs to the scene that stands Vegnagun's colossus behind the fight, which is no place for a duel between people; the Den's stage is a plain arena whose default
 * foe is human-sized (the post-clear copies of its shades, rows 321 to 323, are the cup's own block), with a clear boss spot and no edit to any scene file. The key is the plate's own id, so the cutscene screen and
 * the party prep (which draw `backdrops/<sceneKey>.png`) find the same painting.
 */
export const FARPLANE_CUP_SCENE = 'den-of-woe';

/** The three formations (the duel, then the fighter, as `ffx2-via-infinito-floor-20-aranea` is named), in play order. */
export const DUEL_1_GROUP_ID = 'ffx2-farplane-cup-1-auron';
export const DUEL_2_GROUP_ID = 'ffx2-farplane-cup-2-tidus';
export const DUEL_3_GROUP_ID = 'ffx2-farplane-cup-3-seymour';
export const FARPLANE_CUP_GROUP_IDS = [DUEL_1_GROUP_ID, DUEL_2_GROUP_ID, DUEL_3_GROUP_ID] as const;

/** The three fighters. The FFX-2 ids carry `x2-` because nothing of FFX shares them (FFX's own Auron, Tidus and Seymour are other data). */
export const X2_CUP_AURON_ID = 'x2-cup-auron';
export const X2_CUP_TIDUS_ID = 'x2-cup-tidus';
export const X2_CUP_SEYMOUR_ID = 'x2-cup-seymour';
/** Every fighter of the chapter, in duel order. */
export const FARPLANE_CUP_BODY_IDS = [X2_CUP_AURON_ID, X2_CUP_TIDUS_ID, X2_CUP_SEYMOUR_ID] as const;

/** The monster rows (`monster.bin`, `research/re-ffx2-farplane-cup.md` §0), in the same order. */
export const FARPLANE_CUP_ROWS = [311, 317, 319] as const;

/** The `script-trigger` names that play between the links: the fall of the first and the second duelist (the third's fall is the chapter's close). */
export const CUP_SEAM_1 = 'duel-1-fallen';
export const CUP_SEAM_2 = 'duel-2-fallen';

/**
 * The paintings: the three are already painted as party characters (`public/art/characters/<key>/`, facing the party's way; the painted actor mirrors a figure whose art faces the other side, `engine/PaintedActorPlacement.ts`).
 * Stand-ins for a foe-facing set (the chapter's art list names what an art lane would add).
 */
export const CUP_AURON_SPRITE = 'auron';
export const CUP_TIDUS_SPRITE = 'tidus';
export const CUP_SEYMOUR_SPRITE = 'seymour-guest';

/** The AI script ids (`src/battle/ffx2/ai/farplane-cup*.ts`; the data file names the same strings, a test pins them). */
export const CUP_AURON_SCRIPT_ID = 'x2-cup-auron';
export const CUP_TIDUS_SCRIPT_ID = 'x2-cup-tidus';
export const CUP_SEYMOUR_SCRIPT_ID = 'x2-cup-seymour';

/**
 * The name the HUD shows for the second duelist during the fight (pick DU3): the game's table masks it (four identical unmapped bytes where a name should be), and the chapter's story reveals the name after the
 * fight. The same string is the enemy's `name`.
 */
export const CUP_TIDUS_MASK = '????';
