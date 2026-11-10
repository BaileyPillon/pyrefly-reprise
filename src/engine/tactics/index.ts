/**
 * Encounter tactics: the line each boss was designed to be beaten with.
 *
 * `intendedStrategy` asks here first. A tactic sees the live state and the rows
 * the engine offered — it never invents a command, only chooses among legal
 * ones — and returns `null` to fall through to the generic rules.
 *
 * Every rule cites the research that makes it the intended play rather than a
 * heuristic that happens to win. Where the obvious play is the losing one —
 * Yunalesca's Zombie inversion above all — the tactic says so, because an
 * auto-battler that "fixes" it would be encoding the failure mode the encounter
 * exists to teach.
 *
 * **One file per chapter**, so several agents can work in parallel:
 * `./seymour-flux.ts`, `./yunalesca.ts`, `./braskas-final-aeon.ts`,
 * `./ffx2-bahamut.ts`, `./ffx2-vegnagun-shuyin.ts`, `./ffx2-leblanc.ts`, with the reading helpers
 * they share in `./common.ts`. `src/engine/BattlePresenterTactics.ts` is now a
 * re-export of this module, so every existing import keeps working.
 *
 * A chapter with no line yet exports `null` rather than a tactic that returns
 * `null` every turn, and {@link TACTICS} drops those. The two are **not** the
 * same: `intendedStrategy` reads a registered tactic's `null` as "swing" and
 * skips its own revive/heal ladder, which is exactly what an encounter tactic
 * exists to do — so registering an empty one would quietly change how four
 * chapters play.
 */

import type { BattleEngine, CombatantId } from '../../battle/common/types.ts';
import type { Tactic } from './common.ts';
import { SEYMOUR_FLUX_ID, seymourFlux } from './seymour-flux.ts';
import { YUNALESCA_ID, yunalesca } from './yunalesca.ts';
import {
  BRASKAS_FINAL_AEON_CHAIN_IDS,
  BRASKAS_FINAL_AEON_ID,
  braskasFinalAeon,
} from './braskas-final-aeon.ts';
import { FFX2_BAHAMUT_ID, ffx2Bahamut } from './ffx2-bahamut.ts';
import { FFX2_VEGNAGUN_CHAIN_IDS, ffx2VegnagunShuyin } from './ffx2-vegnagun-shuyin.ts';
import { LEBLANC_BOSS_IDS, ffx2Leblanc } from './ffx2-leblanc.ts';
import { SEYMOUR_MACALANIA_ID, seymourAnimaMacalania } from './seymour-anima-macalania.ts';
import { EVRAE_ID, evrae } from './evrae.ts';
import { YOJIMBO_CAVERN_BOSS_ID, yojimboCavern } from './yojimbo-cavern.ts';
import { TREMA_CHAPTER_BOSS_IDS, ffx2Trema } from './ffx2-trema.ts';
import { DEN_OF_WOE_TACTIC_IDS, ffx2DenOfWoe } from './ffx2-den-of-woe.ts';
import { IXION_DJOSE_BOSS_IDS, ffx2IxionDjose } from './ffx2-ixion-djose.ts';
import { EXPERIMENT_BOSS_IDS, ffx2Experiment } from './ffx2-experiment.ts';
import { TOURIST_TRAP_BOSS_IDS, ffx2TouristTrap } from './ffx2-tourist-trap.ts';
import { VALEFOR_BESAID_BOSS_IDS, ffx2ValeforBesaid } from './ffx2-valefor-besaid.ts';
import { ANGRA_MAINYU_BOSS_IDS, ffx2AngraMainyu } from './ffx2-angra-mainyu.ts';
import { YUNAS_BALLAD_BOSS_IDS, ffx2YunasBallad } from './ffx2-yunas-ballad.ts';
import { YOUTH_LEAGUE_BOSS_IDS, ffx2YouthLeague } from './ffx2-youth-league.ts';
import { IFRIT_KILIKA_BOSS_IDS, ffx2IfritKilika } from './ffx2-ifrit-kilika.ts';
import { GARIK_RONSO_BOSS_IDS, ffx2GarikRonso } from './ffx2-garik-ronso.ts';
import { FALLEN_AEONS_BOSS_IDS, ffx2FallenAeons } from './ffx2-fallen-aeons.ts';
import { SEYMOUR_OMNIS_BOSS_ID, seymourOmnis } from './seymour-omnis.ts';
import { SEYMOUR_NATUS_BOSS_IDS, seymourNatus } from './seymour-natus.ts';
import { ISAARU_CHAPTER_BOSS_IDS, isaaruViaPurifico } from './ffx-isaaru.ts';
import { SIN_TACTIC_ENTRIES } from './sin-tactics.ts';
import { SINSPAWN_GUI_BOSS_IDS, sinspawnGui } from './sinspawn-gui.ts';
import { BIRAN_YENKE_BOSS_IDS, biranYenke } from './biran-yenke.ts';
import { MIRROR_AEONS_BOSS_IDS, mirrorAeons } from './mirror-aeons.ts';
import { DARK_AEONS_BOSS_IDS, darkAeons } from './dark-aeons.ts';
import { LAST_SUMMONING_BOSS_IDS, lastSummoning } from './last-summoning.ts';
import { SANCTUARY_KEEPER_BOSS_IDS, sanctuaryKeeper } from './sanctuary-keeper.ts';
import { SPHERIMORPH_BOSS_IDS, spherimorph } from './spherimorph.ts';
import { OMEGA_RUINS_BOSS_IDS, omegaRuins } from './omega-ruins.ts';
import { WENDIGO_BOSS_IDS, wendigoLine } from './wendigo.ts';
import { BELGEMINE_CHAPTER_BOSS_IDS, belgemineLine } from './belgemine.ts';
import { SHINRYU_BOSS_IDS, shinryu } from './shinryu.ts';
import { GAUNTLET_BOSS_IDS, gauntlet } from './gauntlet.ts';
import { chapterOnBoard } from './lookup.ts';

export type { Tactic } from './common.ts';
export {
  activeParty,
  aim,
  cheerUp,
  has,
  hasAeonLeft,
  holdOverdrive,
  hpFraction,
  revive,
  row,
  stacksOf,
} from './common.ts';
export { yunalesca, YUNALESCA_ID } from './yunalesca.ts';
export { seymourFlux, SEYMOUR_FLUX_ID } from './seymour-flux.ts';
export {
  braskasFinalAeon,
  BRASKAS_FINAL_AEON_ID,
  BRASKAS_FINAL_AEON_CHAIN_IDS,
} from './braskas-final-aeon.ts';
export { ffx2Bahamut, FFX2_BAHAMUT_ID } from './ffx2-bahamut.ts';
export { ffx2VegnagunShuyin, FFX2_SHUYIN_ID, FFX2_VEGNAGUN_CHAIN_IDS } from './ffx2-vegnagun-shuyin.ts';
export { ffx2Leblanc, LEBLANC_BOSS_IDS } from './ffx2-leblanc.ts';
export { seymourAnimaMacalania, SEYMOUR_MACALANIA_ID } from './seymour-anima-macalania.ts';
export { evrae, EVRAE_ID } from './evrae.ts';
export { yojimboCavern, YOJIMBO_CAVERN_BOSS_ID } from './yojimbo-cavern.ts';
export { ffx2Trema, TREMA_CHAPTER_BOSS_IDS } from './ffx2-trema.ts';
export { ffx2DenOfWoe, DEN_OF_WOE_TACTIC_IDS } from './ffx2-den-of-woe.ts';
export { ffx2IxionDjose, IXION_DJOSE_BOSS_IDS } from './ffx2-ixion-djose.ts';
export { ffx2Experiment, EXPERIMENT_BOSS_IDS } from './ffx2-experiment.ts';
export { ffx2TouristTrap, TOURIST_TRAP_BOSS_IDS } from './ffx2-tourist-trap.ts';
export { ffx2ValeforBesaid, VALEFOR_BESAID_BOSS_IDS } from './ffx2-valefor-besaid.ts';
export { ffx2AngraMainyu, ANGRA_MAINYU_BOSS_IDS } from './ffx2-angra-mainyu.ts';
export { ffx2YunasBallad, YUNAS_BALLAD_BOSS_IDS } from './ffx2-yunas-ballad.ts';
export { ffx2YouthLeague, YOUTH_LEAGUE_BOSS_IDS } from './ffx2-youth-league.ts';
export { ffx2IfritKilika, IFRIT_KILIKA_BOSS_IDS } from './ffx2-ifrit-kilika.ts';
export { ffx2GarikRonso, GARIK_RONSO_BOSS_IDS } from './ffx2-garik-ronso.ts';
export { ffx2FallenAeons, FALLEN_AEONS_BOSS_IDS } from './ffx2-fallen-aeons.ts';
export { seymourOmnis, SEYMOUR_OMNIS_BOSS_ID } from './seymour-omnis.ts';
export { seymourNatus, SEYMOUR_NATUS_ID, SEYMOUR_NATUS_BOSS_IDS } from './seymour-natus.ts';
export { isaaruViaPurifico, ISAARU_CHAPTER_BOSS_IDS } from './ffx-isaaru.ts';
export { sinFinsCore, sinFace, SIN_FINS_CORE_BOSS_IDS, SIN_FACE_BOSS_IDS } from './sin-tactics.ts'; // XVII and XVIII (FFX), unlisted
export { sinspawnGui, SINSPAWN_GUI_BOSS_IDS } from './sinspawn-gui.ts'; // the hidden Sinspawn Gui chapter (FFX only)
export { biranYenke, BIRAN_YENKE_BOSS_IDS } from './biran-yenke.ts'; // the hidden Biran and Yenke chapter (FFX only)
export { mirrorAeons, MIRROR_AEONS_BOSS_IDS } from './mirror-aeons.ts'; // the hidden Mirror Aeons chapter (FFX only)
export { darkAeons, DARK_AEONS_BOSS_IDS } from './dark-aeons.ts'; // the hidden Dark Aeons chapter (FFX only, 2026-11-06)
export { lastSummoning, LAST_SUMMONING_BOSS_IDS } from './last-summoning.ts'; // the hidden Last Summoning chapter (FFX only)
export { sanctuaryKeeper, SANCTUARY_KEEPER_BOSS_IDS } from './sanctuary-keeper.ts'; // the hidden Sanctuary Keeper chapter (FFX only)
export { spherimorph, SPHERIMORPH_BOSS_IDS } from './spherimorph.ts'; // the hidden Spherimorph chapter (FFX only)
export { omegaRuins, OMEGA_RUINS_BOSS_IDS } from './omega-ruins.ts'; // the hidden Omega Ruins chapter (FFX only)
export { wendigoLine, WENDIGO_BOSS_IDS } from './wendigo.ts'; // the hidden Wendigo chapter (FFX only)
export { belgemineLine, BELGEMINE_CHAPTER_BOSS_IDS } from './belgemine.ts'; // the hidden Belgemine's Challenge chapter (FFX only)
export { shinryu, SHINRYU_BOSS_IDS } from './shinryu.ts'; // the hidden Shinryu chapter (FFX only, 2026-11-07)
export { gauntlet, GAUNTLET_BOSS_IDS } from './gauntlet.ts'; // the hidden Gauntlet chapter (FFX only, 2026-11-10)

/** One registered boss id: the chapter it belongs to (`./lookup.ts` knows its game) and its line. */
export interface TacticEntry<T extends Tactic | null = Tactic> {
  chapterId: string;
  bossId: CombatantId;
  tactic: T;
}

/**
 * Every chapter's slot, in encounter order. `null` = no line written yet.
 *
 * Chapter 7 (`seymour-anima-macalania`) is registered under all four of its
 * combatant ids, the same four its guide lists as `bossIds`
 * [docs/handoff/chapter-macalania-guide.md §5].
 */
const REGISTRY: ReadonlyArray<TacticEntry<Tactic | null>> = [
  { chapterId: 'seymour-flux', bossId: SEYMOUR_FLUX_ID, tactic: seymourFlux },
  { chapterId: 'yunalesca', bossId: YUNALESCA_ID, tactic: yunalesca },
  // The hidden Last Summoning (FFX only, chapter 28) fields Chapter III's possessed aeons and Yu Yevon under the very same ids, so its eleven entries come FIRST: `chapterOnBoard` finds them only on
  // the chapter's own board (the "Taken by Yu Yevon" locks, `./lookup.ts#onLastSummoningBoard`), and Chapter III's entries below answer every other board exactly as they did.
  ...LAST_SUMMONING_BOSS_IDS.map((bossId) => ({ chapterId: 'last-summoning', bossId, tactic: lastSummoning })),
  { chapterId: 'braskas-final-aeon', bossId: BRASKAS_FINAL_AEON_ID, tactic: braskasFinalAeon },
  // Chapter 3 is a seven-battle chain and fields a **different** boss in every
  // link, so one registration would have left the possessed-aeon gauntlet and
  // Yu Yevon to the generic ladder — which loses Yu Yevon outright by swinging
  // into his 9,999 Curaga counter [ffx-bfa-yu-yevon §3.4.1]. Same tactic, one
  // entry per boss the chain can field.
  ...BRASKAS_FINAL_AEON_CHAIN_IDS.map((bossId) => ({ chapterId: 'braskas-final-aeon', bossId, tactic: braskasFinalAeon })),
  { chapterId: 'ffx2-bahamut', bossId: FFX2_BAHAMUT_ID, tactic: ffx2Bahamut },
  // Chapter 5 is five chained battles with a different boss id in each
  // [ffx2-vegnagun-shuyin §2], and `tacticFor` keys on the boss that is on
  // the field — so the one tactic is registered under all five ids, or four
  // of its five links would quietly fall back to the generic strategy.
  ...FFX2_VEGNAGUN_CHAIN_IDS.map((bossId) => ({ chapterId: 'ffx2-vegnagun-shuyin', bossId, tactic: ffx2VegnagunShuyin })),
  // Chapter 6 is a three-act chain that fields eight distinct enemy ids
  // across its own bestiary records (`leblanc-syndicate.ts`,
  // `leblanc-syndicate-acts.ts`) — same reasoning as Chapter 5 above.
  ...LEBLANC_BOSS_IDS.map((bossId) => ({ chapterId: 'ffx2-leblanc', bossId, tactic: ffx2Leblanc })),
  // Chapter 7 is one battle in three acts. Seymour is in the record the
  // whole fight (untargetable in act two), so his id alone would find it; the
  // other three are listed so the tactic and guide claim the same ids.
  ...[SEYMOUR_MACALANIA_ID, 'anima-macalania', 'guado-guardian-a', 'guado-guardian-b'].map(
    (bossId) => ({ chapterId: 'seymour-anima-macalania', bossId, tactic: seymourAnimaMacalania }),
  ),
  // Chapter 8 is one battle against one fighter. Cid is on the enemy side as
  // a non-combatant turn-taker and is never a target, so Evrae's id alone
  // finds it — the same single id the guide lists as `bossIds`
  // [docs/handoff/chapter-evrae-engine.md].
  { chapterId: 'evrae-airship', bossId: EVRAE_ID, tactic: evrae },
  // Chapter IX (FFX only): Yojimbo alone finds it; Ginnem and Daigoro are untargetable bystanders.
  { chapterId: 'yojimbo-cavern', bossId: YOJIMBO_CAVERN_BOSS_ID, tactic: yojimboCavern },
  // Chapter X (FFX only, listed 2026-09-25): Natus and Mortibody, one tactic under both ids.
  ...SEYMOUR_NATUS_BOSS_IDS.map((bossId) => ({ chapterId: 'seymour-natus', bossId, tactic: seymourNatus })),
  // Chapter XIII (FFX-2 only, unlisted): Paragon then Trema, one tactic under both ids.
  ...TREMA_CHAPTER_BOSS_IDS.map((bossId) => ({ chapterId: 'ffx2-trema', bossId, tactic: ffx2Trema })),
  // Chapter XI (FFX-2 only, listed 2026-09-26): Shiva, the Sisters, Anima; one tactic under all five ids.
  ...FALLEN_AEONS_BOSS_IDS.map((bossId) => ({ chapterId: 'ffx2-fallen-aeons', bossId, tactic: ffx2FallenAeons })),
  // Chapter XV (FFX-2 only, listed 2026-09-26): the three shades, one tactic under all three ids.
  ...DEN_OF_WOE_TACTIC_IDS.map((bossId) => ({ chapterId: 'ffx2-den-of-woe', bossId, tactic: ffx2DenOfWoe })),
  // Chapter XVI (FFX-2 only, listed 2026-09-27): Ixion at Djose, one fighter.
  ...IXION_DJOSE_BOSS_IDS.map((bossId) => ({ chapterId: 'ffx2-ixion-djose', bossId, tactic: ffx2IxionDjose })),
  // The Experiment (FFX-2 only, hidden chapter, 2026-10-10): the Machine Faction's weapon, one fighter.
  ...EXPERIMENT_BOSS_IDS.map((bossId) => ({ chapterId: 'ffx2-masterpiece-theatre', bossId, tactic: ffx2Experiment })),
  // The Tourist Trap (FFX-2 only, hidden chapter, 2026-10-14): Yojimbo and his count; Daigoro is never a target.
  ...TOURIST_TRAP_BOSS_IDS.map((bossId) => ({ chapterId: 'ffx2-tourist-trap', bossId, tactic: ffx2TouristTrap })),
  // Valefor at Besaid (FFX-2 only, hidden chapter, 2026-10-14): the possessed aeon, one fighter.
  ...VALEFOR_BESAID_BOSS_IDS.map((bossId) => ({ chapterId: 'ffx2-valefor-besaid', bossId, tactic: ffx2ValeforBesaid })),
  // Angra Mainyu (FFX-2 only, hidden chapter, 2026-10-14): the body and its two arms; the line is one healer and two Dark Knights.
  ...ANGRA_MAINYU_BOSS_IDS.map((bossId) => ({ chapterId: 'ffx2-angra-mainyu', bossId, tactic: ffx2AngraMainyu })),
  // Yuna's Ballad (FFX-2 only, hidden chapter, 2026-11-06): the possessed Rikku, then the possessed Paine; the line is a Warrior Yuna who heals at half HP.
  ...YUNAS_BALLAD_BOSS_IDS.map((bossId) => ({ chapterId: 'ffx2-yunas-ballad', bossId, tactic: ffx2YunasBallad })),
  // The Youth League Tournament (FFX-2 only, hidden chapter, 2026-11-07): twenty fighters in seven acts, one tactic under all of them; the line is Darkness from both Dark Knights and Yuna healing and raising.
  ...YOUTH_LEAGUE_BOSS_IDS.map((bossId) => ({ chapterId: 'ffx2-youth-league', bossId, tactic: ffx2YouthLeague })),
  // Ifrit at Kilika Temple (FFX-2 only, hidden chapter, 2026-11-07): the possessed fire aeon, one fighter; no Fire, Shell and Protect, Darkness and Breaks.
  ...IFRIT_KILIKA_BOSS_IDS.map((bossId) => ({ chapterId: 'ffx2-ifrit-kilika', bossId, tactic: ffx2IfritKilika })),
  // Garik Ronso and the Ronso Youths (FFX-2 only, hidden chapter, 2026-11-08): five bodies for the two fights; Protect, Darkness, never Black Mage.
  ...GARIK_RONSO_BOSS_IDS.map((bossId) => ({ chapterId: 'ffx2-garik-ronso', bossId, tactic: ffx2GarikRonso })),
  // Chapter XII (FFX only, unlisted): Seymour Omnis alone finds it; the discs are his parts.
  { chapterId: 'seymour-omnis', bossId: SEYMOUR_OMNIS_BOSS_ID, tactic: seymourOmnis },
  // Chapter XIV (FFX only, listed 2026-09-25): his three aeons, one a link; Isaaru is an untargetable bystander.
  ...ISAARU_CHAPTER_BOSS_IDS.map((bossId) => ({ chapterId: 'isaaru-via-purifico', bossId, tactic: isaaruViaPurifico })),
  ...SIN_TACTIC_ENTRIES, // Chapters XVII and XVIII (FFX only, unlisted): the Fins and the Core under four ids, the Face under one
  // The hidden Sinspawn Gui chapter (FFX only): the body of each of its two fights; the head and arms are parts of whichever body is on the field.
  ...SINSPAWN_GUI_BOSS_IDS.map((bossId) => ({ chapterId: 'sinspawn-gui', bossId, tactic: sinspawnGui })),
  // The hidden Biran and Yenke chapter (FFX only): the two brothers; Kimahri's line is Lancet, then the Rages.
  ...BIRAN_YENKE_BOSS_IDS.map((bossId) => ({ chapterId: 'biran-yenke', bossId, tactic: biranYenke })),
  // The hidden Mirror Aeons chapter (FFX only): the three Dark Magus Sisters and Dark Yojimbo; the line is the aeon as fodder for the big move, Mindy first.
  ...MIRROR_AEONS_BOSS_IDS.map((bossId) => ({ chapterId: 'mirror-aeons', bossId, tactic: mirrorAeons })),
  // The hidden Dark Aeons chapter (FFX only): the six other Dark Aeons; the line is Yojimbo's Zanmato against the two long fights, an aeon as fodder for the Overdrive, Auto-Life on everyone.
  ...DARK_AEONS_BOSS_IDS.map((bossId) => ({ chapterId: 'dark-aeons', bossId, tactic: darkAeons })),
  // The hidden Sanctuary Keeper chapter (FFX only): the beast on the summit; the line is Poison, then Reflect, Shell before the breath (plain blows win 0 of 200).
  ...SANCTUARY_KEEPER_BOSS_IDS.map((bossId) => ({ chapterId: 'sanctuary-keeper', bossId, tactic: sanctuaryKeeper })),
  // The hidden Spherimorph chapter (FFX only): the guardian of the spring; the line probes with a plain blow, reads the spell that answers and casts its opposite (a blind caster feeds it).
  ...SPHERIMORPH_BOSS_IDS.map((bossId) => ({ chapterId: 'spherimorph', bossId, tactic: spherimorph })),
  // The hidden Omega Ruins chapter (FFX only): Auto-Life on the line against Nemesis, never an Overdrive, a swing for the two Weapons (plain blows from Nemesis's side lose to nothing but its count).
  ...OMEGA_RUINS_BOSS_IDS.map((bossId) => ({ chapterId: 'omega-ruins', bossId, tactic: omegaRuins })),
  // The hidden Wendigo chapter (FFX only): the brute on the frozen lake; the line is a Petrify Grenade for the Guardians, Power Break and Dark Attack on Wendigo, Protect on the party, and no swing while its arms are up (plain blows win 0 of 100).
  ...WENDIGO_BOSS_IDS.map((bossId) => ({ chapterId: 'wendigo', bossId, tactic: wendigoLine })),
  // The hidden Belgemine's Challenge chapter (FFX only): her eight aeons; the line is Shield before the foe's big move, the heaviest aeon first (Shiva or Ixion against Ifrit), the Overdrive when it is full, and no Dismiss (the bench measured it counterproductive).
  ...BELGEMINE_CHAPTER_BOSS_IDS.map((bossId) => ({ chapterId: 'belgemine', bossId, tactic: belgemineLine })),
  // The hidden Shinryu chapter (FFX only): the Monster Arena's deep-water dragon; the line is a Phoenix Down or a potion first, then Tidus's Quick Hit and the plain Celestial blow (the shipped party wins every battle; the line is the fastest).
  ...SHINRYU_BOSS_IDS.map((bossId) => ({ chapterId: 'shinryu', bossId, tactic: shinryu })),
  // The hidden Gauntlet chapter (FFX only): the Monster Arena's nine creations; one line under the nine ids, the bench's advisor (a Phoenix Down or a heal first, Quick Hit, Auron alone against a standing Earth Eater, no Overdrive on the Greater Sphere, Lulu switched in for Neslug and the Ultima Buster, an Arm before its body); the shipped party wins the nine-act chain 200 of 200.
  ...GAUNTLET_BOSS_IDS.map((bossId) => ({ chapterId: 'gauntlet', bossId, tactic: gauntlet })),
];

/** Keyed by the chapter's game, then by a boss combatant id that only that encounter fields. */
export const TACTICS: ReadonlyArray<TacticEntry<Tactic>> = REGISTRY.filter(
  (entry): entry is TacticEntry<Tactic> => entry.tactic !== null,
);

/**
 * The tactic for whatever encounter is on the field, if it has one.
 *
 * The battle's game picks the chapters first and the boss must be on the enemy
 * side (`./lookup.ts`): FFX's aeon Bahamut shares the id `'bahamut'` with
 * Chapter IV's FFX-2 boss, and used to hand every turn of an FFX fight without
 * a tactic of its own (IX, X) to the FFX-2 Bahamut line.
 */
export function tacticFor(engine: BattleEngine): Tactic | null {
  const state = engine.state();
  return TACTICS.find((t) => chapterOnBoard(state, t.chapterId, [t.bossId]))?.tactic ?? null;
}
