/**
 * The ids of the hidden FFX-2 chapter **The Youth League Tournament** (Mushroom Rock Road, Chapter 5: seven fights in a row, Yaibal, four mobs, Elma and Lucil; branch `ch-youth-league`), in one dependency-free place:
 * the chapter record, its pause metadata, the story, the door word and the tests all read these, so none of them imports another's module just for a string. **FFX-2 only** [AGENTS.md rule 14].
 *
 * The game's own structure (`research/re-ffx2-youth-league-tournament.md` section 0): seven formations on the map "Mushroom Rock Road side path (first half)", in the order the road's event package starts them:
 * Yaibal with two League Warriors (`kino01_223`), two League Mages and a Veteran (`kino01_220`), a Warrior and two Veterans (`kino01_219`), two Slashers and a Master (`kino01_218`), four Veterans (`kino01_217`),
 * Elma with two Veterans (`kino01_221`), Lucil alone (`kino01_222`).
 */

/** The chapter's id: its key in the experiments' store. */
export const YOUTH_LEAGUE_ID = 'ffx2-youth-league' as const;

/**
 * The scene key: the Den of Woe's own stage (`src/scenes/den-of-woe.ts`), a flagged stand-in (the preflight's pick YL7 was a derived `mushroom-rock-road-league` plate, an art item; until it exists the Den's stage, the
 * cave under the same road, is the one FFX-2 stage with human-sized foes and a clear boss spot, as the Farplane Cup's is). The key is the plate's own id, so the cutscene screen and the party prep, which draw
 * `backdrops/<sceneKey>.png`, find the same painting.
 */
export const YOUTH_LEAGUE_SCENE = 'den-of-woe';

/** The seven formations (the act, then who is in it), in play order. */
export const ACT_1_GROUP_ID = 'ffx2-youth-league-1-yaibal';
export const ACT_2_GROUP_ID = 'ffx2-youth-league-2-mages';
export const ACT_3_GROUP_ID = 'ffx2-youth-league-3-veterans';
export const ACT_4_GROUP_ID = 'ffx2-youth-league-4-slashers';
export const ACT_5_GROUP_ID = 'ffx2-youth-league-5-four-veterans';
export const ACT_6_GROUP_ID = 'ffx2-youth-league-6-elma';
export const ACT_7_GROUP_ID = 'ffx2-youth-league-7-lucil';
export const YOUTH_LEAGUE_GROUP_IDS = [ACT_1_GROUP_ID, ACT_2_GROUP_ID, ACT_3_GROUP_ID, ACT_4_GROUP_ID, ACT_5_GROUP_ID, ACT_6_GROUP_ID, ACT_7_GROUP_ID] as const;

/** The three named fighters. The FFX-2 ids carry `x2-` because nothing of FFX shares them. */
export const X2_YAIBAL_ID = 'x2-yl-yaibal';
export const X2_LUCIL_ID = 'x2-yl-lucil';
export const X2_ELMA_ID = 'x2-yl-elma';

/**
 * Every enemy of every act, by act (the act's members in slot order). A League fighter is `x2-yl-<type>-<act><letter>`: the ids differ by act and letter because a formation holds two or four of one type and the engine
 * needs one id for each; the type is the part between `x2-yl-` and the act digit.
 */
export const ACT_ENEMY_IDS = [
  [X2_YAIBAL_ID, 'x2-yl-warrior-1a', 'x2-yl-warrior-1b'],
  ['x2-yl-mage-2a', 'x2-yl-mage-2b', 'x2-yl-veteran-2'],
  ['x2-yl-warrior-3', 'x2-yl-veteran-3a', 'x2-yl-veteran-3b'],
  ['x2-yl-slasher-4a', 'x2-yl-slasher-4b', 'x2-yl-master-4'],
  ['x2-yl-veteran-5a', 'x2-yl-veteran-5b', 'x2-yl-veteran-5c', 'x2-yl-veteran-5d'],
  [X2_ELMA_ID, 'x2-yl-veteran-6a', 'x2-yl-veteran-6b'],
  [X2_LUCIL_ID],
] as const;

/** The fighter type of each member of ACT_ENEMY_IDS, in order, act by act (the keys of `YL_ROWS`, `YL_SPRITES` and `YL_SCRIPTS`). */
export const ACT_TYPES = [
  ['yaibal', 'warrior', 'warrior'],
  ['mage', 'mage', 'veteran'],
  ['warrior', 'veteran', 'veteran'],
  ['slasher', 'slasher', 'master'],
  ['veteran', 'veteran', 'veteran', 'veteran'],
  ['elma', 'veteran', 'veteran'],
  ['lucil'],
] as const satisfies readonly (readonly (keyof typeof YL_ROWS)[])[];

/** The monster rows (`monster.bin`, `research/re-ffx2-youth-league-tournament.md` section 0), by fighter type. Elma is row 279, not 185: row 185 is the Chapter 2 miniboss of the other path. */
export const YL_ROWS = { yaibal: 183, lucil: 184, elma: 279, warrior: 210, veteran: 211, slasher: 193, mage: 214, master: 215 } as const;

/**
 * The `script-trigger` names that play between the acts: the fall of the last fighter of act 1 to 6 (act 7's fall is the chapter's close). The first four are the acts the game fights with the road between them, the
 * last two the unbroken run (`research/re-ffx2-youth-league-tournament.md` section 2); the chapter plays all seven without a break (pick YL3) and the seam says so.
 */
export const YL_SEAM_IDS = ['act-1-fallen', 'act-2-fallen', 'act-3-fallen', 'act-4-fallen', 'act-5-fallen', 'act-6-fallen'] as const;

/** The paintings, installed in release 79 (the art-w4 kit, `docs/handoff/r79-art-install.md`): one set per fighter kind, each painted over its own game model (m183, m184, m279, m210, m211, m193, m214, m215). */
export const YL_SPRITES = {
  yaibal: 'x2-yaibal',
  lucil: 'x2-lucil',
  elma: 'x2-elma',
  warrior: 'x2-league-warrior',
  veteran: 'x2-league-veteran',
  slasher: 'x2-league-slasher',
  mage: 'x2-league-mage',
  master: 'x2-league-master',
} as const;

/** The AI script ids (`src/battle/ffx2/ai/youth-league*.ts`; the data file names the same strings, a test pins them). */
export const YL_SCRIPTS = {
  yaibal: 'x2-yl-yaibal',
  lucil: 'x2-yl-lucil',
  elma: 'x2-yl-elma',
  warrior: 'x2-yl-warrior',
  veteran: 'x2-yl-veteran',
  slasher: 'x2-yl-slasher',
  mage: 'x2-yl-mage',
  master: 'x2-yl-master',
} as const;
