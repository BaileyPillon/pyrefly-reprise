/**
 * THE ONE GATE FOR EVERY NEW MOTION PIECE (conference demo, motion pass, integration of the lanes "core", "feel" and "fx"; Bailey 2026-10-22: every new piece "behind switches, default OFF,
 * ON only in Chapter I and Chapter IV with ?pack=demo"). Pure: no `three`, no DOM, no imports (the one page read is the screen's width and pointer, once, at load).
 *
 * The three lanes each grew their own copy of the same two questions: WHICH chapter is running (`CurvesSwitch.setCurvesChapter`, `FeelSwitch.setFeelChapter`, `FxSwitch.setFxChapter`: three
 * variables the battle screen and the spell layer all set to the same id) and WHETHER `?pack=demo` is in the address. Now there is one chapter variable and one pack reader, here; each lane's
 * switch keeps its own name, its own key and its own default, and only points at this module. What each switch DOES is unchanged: the table below is the two demo chapters
 * (`src/data/encounters.ts` ids) and the game each one is.
 *
 * **r64 (Bailey 2026-10-24, item 200b): the pack is ON by default in those two chapters** ({@link PACK_DEFAULT_ON}); `?pack=off` and each lane's own off word keep the old behaviour reachable.
 *
 * **Release 69 (`booth-leblanc`; Bailey 2026-10-30: "the nice treatment you gave to the booth chapters you need to now apply to all live and selectable chapters (meaning ones that arent hidden) please start with leblanc"):** the
 * treatment no longer follows the two booth ids but {@link TREATED_CHAPTERS}, which grows one line per chapter (Leblanc first), with a written hold for any single piece a chapter is not ready for ({@link PIECE_HOLDS}) and `?treated=pack`
 * to put release 68's reach back. {@link DEMO_CHAPTERS} and {@link isDemoChapter} stay the booth pair, for the kiosk's own things (the picker, the seeds, the party rigs, the voiced lines).
 *
 * Game case (AGENTS.md rule 14): the gate is both games (shared plumbing); the chapter's game is read from the table (FFX Chapter I, FFX-2 Chapter IV, FFX-2 Chapter VI, FFX Chapter II).
 */

export type DemoGame = 'ffx' | 'ffx2';

/** The two demo chapters and the game each one is: Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2). */
export const DEMO_CHAPTERS: Readonly<Record<string, DemoGame>> = Object.freeze({
  'seymour-flux': 'ffx',
  'ffx2-bahamut': 'ffx2',
});

let chapter: string | undefined;

/** The battle screen (and, for a spell layer built without it, the layer) names the running chapter as a battle sets up, and `undefined` as it exits. */
export function setDemoChapter(id: string | undefined): void {
  chapter = id;
}

/** The chapter id last named, or undefined. */
export function demoChapter(): string | undefined {
  return chapter;
}

/**
 * Is this chapter id Chapter I or Chapter IV: the BOOTH PAIR? Booth-only things ask this (the kiosk's picker, its seeds, the party rigs, the voiced lines: `DEMO_CHAPTERS`); the treatment's own
 * pieces ask {@link isTreatedChapter}, which answers true for this pair too.
 */
export function isDemoChapter(id: string | undefined): boolean {
  return id !== undefined && Object.prototype.hasOwnProperty.call(DEMO_CHAPTERS, id);
}

// ---------------------------------------------------------------------------------------------------------------- THE TREATED CHAPTERS
//
// Bailey 2026-10-30: "the nice treatment you gave to the booth chapters you need to now apply to all live and selectable chapters (meaning ones that arent hidden) please start with leblanc"; 2026-10-29:
// "you make all executive decisions for the next few days. i'll go with all of your recommendations" (the driver's calls under it, his to overturn). Until release 69 the treatment (the F1 HUD, the pro look, camera
// and staging, the curves, the moments, the feel, the new effects, the sound pass, the governor) followed `DEMO_CHAPTERS`, two ids. It now follows ONE growing list: a chapter joins by one line in
// {@link TREATED_CHAPTERS}, and any single piece the chapter is not ready for waits behind a written hold in {@link PIECE_HOLDS}.

/** The pieces of the treatment a chapter can hold back one by one: each switch module names the one it is (`isTreatedChapter(id, piece)`). */
export type TreatedPiece =
  | 'hud' | 'hd2d' | 'arena' | 'look' | 'rim' | 'boss' | 'cam' | 'card' | 'ending' | 'opening' | 'breath'
  | 'curves' | 'real' | 'moments' | 'smear' | 'feel' | 'fx' | 'audio' | 'governor';

export const TREATED_PIECES: readonly TreatedPiece[] = [
  'hud', 'hd2d', 'arena', 'look', 'rim', 'boss', 'cam', 'card', 'ending', 'opening', 'breath', 'curves', 'real', 'moments', 'smear', 'feel', 'fx', 'audio', 'governor',
];

/** One treated chapter: its game (rule 14: which game's layout, profile and tables play) and when it joined. */
export interface TreatedEntry {
  readonly game: DemoGame;
  readonly since: string;
}

/**
 * THE LIST. The booth pair (release 60 and 64: the pair is on from the first release that had the pack), Leblanc (release 69, `booth-leblanc`: Chapter VI, `ffx2-leblanc`, FFX-2; the HIDDEN experiment
 * `exp-leblanc` is not this chapter and is never listed) and, in batch 2 (release 70, merged as `booth-b2`), Lady Yunalesca (the FFX lane `booth-ffx-yunalesca`: Chapter II, `yunalesca`, FFX; the first FFX chapter beyond Chapter I; built on the release 69 base, hence "release 69" in that lane's comments) and the three FFX-2 chapters named below, and, in batch 3 (release 71, the FFX-2 lane `booth-ffx2-b3`), Trema (Chapter XIII, `ffx2-trema`, FFX-2). A twentieth id fails `tests/unit/booth-treated-chapters.test.ts` until it names a chapter the registry lists, with the game the registry says.
 */
export const TREATED_CHAPTERS: Readonly<Record<string, TreatedEntry>> = Object.freeze({
  'seymour-flux': { game: 'ffx', since: 'r60' },
  yunalesca: { game: 'ffx', since: 'r70' },
  // Batch 3a, the FFX lane `booth-ffx-b3a` (all FFX only; Bailey 2026-10-30: the booth treatment for every listed chapter): Chapter VII (Seymour and Anima, the Macalania antechamber), Chapter X (Seymour Natus, the Highbridge of Bevelle) and Chapter IX (Yojimbo, the Cavern of the Stolen Fayth). Each holds the pieces
  // named in {@link PIECE_HOLDS} and plays every other piece. `since` is the batch's release number, the driver's to renumber (batch 3 ships after release 70).
  'seymour-anima-macalania': { game: 'ffx', since: 'r71' },
  'seymour-natus': { game: 'ffx', since: 'r71' },
  'yojimbo-cavern': { game: 'ffx', since: 'r71' },
  // Batch 3b (`booth-ffx-b3b`, FFX only; Bailey 2026-10-30: the booth treatment for every listed chapter): Chapter III (Braska's Final Aeon, seven links), Chapter XII (Seymour Omnis and the four Mortiphasm discs) and Chapter XIV (Isaaru's contest of aeons,
  // three links, Yuna alone). `since` is the batch's release number, the driver's to renumber.
  'braskas-final-aeon': { game: 'ffx', since: 'r71' },
  'seymour-omnis': { game: 'ffx', since: 'r71' },
  'isaaru-via-purifico': { game: 'ffx', since: 'r71' },
  'ffx2-bahamut': { game: 'ffx2', since: 'r60' },
  'ffx2-leblanc': { game: 'ffx2', since: 'r69' },
  // Batch 2, the FFX-2 lane `booth-ffx2-b2` (all FFX-2 only; Bailey 2026-10-30: the booth treatment for every listed chapter): Chapter V (Vegnagun and Shuyin, five links), Chapter XV (the Den of Woe, three shades) and Chapter XI (the Fallen Aeons,
  // three links). Each holds the pieces named in {@link PIECE_HOLDS} and plays every other piece. `since` is the batch's release number, the driver's to renumber.
  'ffx2-vegnagun-shuyin': { game: 'ffx2', since: 'r70' },
  'ffx2-den-of-woe': { game: 'ffx2', since: 'r70' },
  'ffx2-fallen-aeons': { game: 'ffx2', since: 'r70' },
  // Batch 3, the FFX-2 lane `booth-ffx2-b3` (FFX-2 only; Bailey 2026-10-30: the booth treatment for every listed chapter): Chapter XIII (Trema, Cloister 100 of the Via Infinito, two links: Paragon then Trema; the party Yuna Dark Knight, Rikku Alchemist, Paine Dark Knight, two dresses the
  // treatment has not met). It holds the pieces named in {@link PIECE_HOLDS} and plays every other piece. `since` is the batch's release number, the driver's to renumber.
  'ffx2-trema': { game: 'ffx2', since: 'r71' },
});

/**
 * Pieces a treated chapter does not play yet, each with the written reason and what lifts it (the shape of `SwapSwitch.SCOPE_EXCEPTIONS`: a reason of 80 characters or more, ending in "Lifts when ..."). A held
 * piece answers today's in that chapter and every other piece plays. The booth pair has none: they are the approved target.
 */
export const PIECE_HOLDS: Readonly<Record<string, Readonly<Partial<Record<TreatedPiece, string>>>>> = Object.freeze({
  // Chapter II (FFX only; release 69, `booth-ffx-yunalesca`): three pieces wait, every other plays. `smear` is the swap exception's other half: `SwapSwitch.SCOPE_EXCEPTIONS` (its own mechanism, untouched) holds her stance and cause picks, and the smear planner cuts the same swaps.
  yunalesca: Object.freeze({
    breath:
      'FFX, Chapter II: the held breath is the drain-and-flood built for Total Annihilation (and, in FFX-2, Mega Flare), and a move reaches it only by id (`StagingPort.BigMove`), so nothing Yunalesca does plays it today. Her sourced showpieces are Mega Death ' +
      '(`mega-death`: form 3\'s opener and every fifth turn, the Death status on the whole active party and no damage, research/ffx-yunalesca.md sections 3, 5.3 and 14.13) and Hellbiter (`hellbiter`: the Zombie rider that turns healing into a weapon, ' +
      'sections 3, 5.1 and 5.2), and neither has a telegraph painting held before it (`TelegraphHold` stages only Seymour Flux\'s Lance of Atrophy and Braska\'s Ultimate Jecht Shot), so there is no existing staging of the move to extend; a breath for them needs ' +
      'a tone, a sound and a shot, which are mockup decisions (hard rule 9; the driver call of 2026-10-30: never guessed). Lifts when Bailey or the driver picks a tone and a shot for Mega Death (and for Hellbiter) from a mockup, and `BigMove`, `NAME_OF` and ' +
      '`passRecipes.HEADLINE_BLOWS` are given rows for those ids (which hit, `first` or `last`, measured the way Mega Flare\'s was).',
    cam:
      'FFX, Chapter II: the pro camera\'s real shots were laid by the real-motion lane on Chapter I\'s Gagazet stage and clamped to 35 degrees of its plate\'s front, and the dome\'s plate is the one the MAX mix\'s colossus master pulled past its edge at every ' +
      'aspect (round 19, PR-0307, a ship-blocking regression: Chapter II keeps today\'s rig, `fx/mix/masters.ts`). The plate is flat and its slack is small (the header of `RIGS` in src/scenes/zanarkand-dome.ts says it first: a flat painting cannot be panned off, there is no slack to spend): today\'s own seven rigs show none of it past the plate at 16:9 except `enemy` (4.5 percent) and `yunalesca` ' +
      '(7.2 percent: 3.2 above, 4.0 at the sides; 18.4 percent at 21:9). The offline read of the real shots laid on the dome\'s slots (`ProTrack.registerKeys`, no browser) puts the median shot\'s worst frame at 57.6 percent past the plate against Gagazet\'s ' +
      '50.1 under the same model (both overstate it: no pillars, no director fit), which cannot call one safe. The piece holds the directed camera, its real shots and its soft background; the HD-2D look\'s own tilt-shift band stays. Lifts when job J4 of ' +
      'docs/handoff/booth-ffx-yunalesca.md (a cast, a landing, the killing blow and the victory at 16:9, 16:10, 21:9 and 4:3 on the real build) reads no plate edge, void or back of the plate beyond today\'s `yunalesca` rig in any frame, or the shots are clamped ' +
      'to the dome plate\'s own width and top margin.',
    smear:
      'FFX, Chapter II: the smear style is the planner that cuts a pose swap inside a brush-stroke trail whenever the figure moves (`SmearDirector.swap`, also the knock-out\'s cut), and it rides on the same chapter list as the stance and cause picks, which ' +
      '`SwapSwitch.SCOPE_EXCEPTIONS` holds back for her: the wide run of release 68 (seed 1, the whole 409 s fight) took ghost frames a minute from 287 to 98 but swap jerks of 40 px or more from 9 to 25 (worst 154 px) and made 63 planned cuts over 120 px across heads ' +
      '0.41 to 0.44 of the height apart (Yunalesca attack to cast, Auron follow to idle). A smear that played here would plan those cuts, so Chapter II keeps release 67\'s swap look as the exception says (`?swapscope=all` still reaches her). Lifts when her entry ' +
      'in `SwapSwitch.SCOPE_EXCEPTIONS` lifts: job `yunalesca-all-anchor` of docs/handoff/pc-scope.md (`?cutanchor=on` run in the chapter) reads no swap jerk of 40 px or more outside a named cut.',
  }),
  // Batch 3a (`booth-ffx-b3a`, FFX only; the driver call (a) of 2026-10-30 again: a staged breath that needs a tone or a sound pick is held with a reason and the candidate moves named, never guessed). Chapter VII holds `breath`, `cam` and `moments`; Chapter IX holds `breath`, `cam` and `moments`; Chapter X holds `breath` and `moments` (its camera plays).
  'seymour-anima-macalania': Object.freeze({
    breath:
      'FFX, Chapter VII: the held breath is the drain-and-flood built for Total Annihilation (and, in FFX-2, Mega Flare), and a move reaches it only by id (`StagingPort.BigMove`), so nothing in this fight plays it today. ' +
      'The sourced showpieces are the Pain of Anima (`anima-pain-boss`: Death at 100 percent on a party member and damage only on an aeon, the reason act two is an aeon duel, research/ffx-seymour-anima-macalania.md section ' +
      '4.3), her Overdrive Oblivion (`anima-oblivion`, sixteen hits on the party) and, in act three, the Multi-spells of Seymour (section 4.1); none has a telegraph painting held before it (`TelegraphHold` stages only the ' +
      'Lance of Atrophy of Seymour Flux and the Ultimate Jecht Shot of Braska), and a breath needs a tone, a sound and a shot, which are mockup decisions (hard rule 9; the driver call of 2026-10-30: never guessed). Lifts ' +
      'when Bailey or the driver picks the move, a tone and a shot from a mockup, and `BigMove`, `NAME_OF` and `passRecipes.HEADLINE_BLOWS` are given rows for its id (which hit, `first` or `last`, measured the way Mega ' +
      'Flare was).',
    cam:
      'FFX, Chapter VII: the scene authors camera beats the directed camera would cut across, and the plate is not the reason. Seymour dies and leaves a body (research/ffx-vs-ffx2-presentation.md section 3.2; D-046: it ' +
      'lies down and stays through the victory) and the pyreflies of the scene rise at his death and not before (D-225), so the victory rig of the scene is laid wide enough to hold the body; the directed victory is the ' +
      'real close-up of the last party actor, fitted to that actor and his company only (`ProPlays.victoryPlay`), and laid on this stage offline (`ProTrack.registerKeys`, docs/handoff/booth-ffx-b3a.md section 3) its 18 ' +
      'shots of Tidus, Yuna and Kimahri keep the body in frame at their last key in 2 (Tidus 0 of 6, Yuna 0 of 6, Kimahri 2 of 6: every variant of each character laid on each of the three slots; Rikku has no row of her own and plays the Tidus close-up laid on her feet, `ProShots.characterOf`, so she is among the Tidus 0 of 6). The arrival of ' +
      'Anima also moves the camera to two rigs of its own (`anima-low` and `anima`, `macalania-temple-arrival.ts`). The plate would not hold the piece back: under the plane model of Chapter II the real shots read a median ' +
      'worst frame of 40.0 percent past the plate against 47.7 for Chapter I, and today rigs show none at 16:9 but the victory rig (2.7 percent at the sides). The piece holds the directed camera, its real shots and its ' +
      'soft background; today rigs and the victory rig of the scene play. Lifts when job J1 of docs/handoff/booth-ffx-b3a.md (the victory with the body lying and the pyreflies rising, and the summon, on the real build with ' +
      'the camera on) shows the body and the rising pyreflies in frame, or the victory shot is given the body of the foe as a companion.',
    moments:
      'FFX, Chapter VII: the moments cut the knock-out of a party member from the hurt painting to the lying one inside a planned smear (`PaintedActorLife.koCutWindow`: the moments and the smear both on), and CHK-027 ' +
      'excuses that cut only up to 0.5 of the drawn height (`critic/policy.json`, `continuity.smear.maxJerkShare`). Where the body lies is set per stage (`ProneLay` slides it by up to half its length along the floor) and ' +
      'the recorded runs of the motion pass read the same FFX paintings at 0.09 to 0.11 (Tidus, Chapter I), 0.75 (Tidus, the dome of Chapter II, a hard cut with no planned smear), 0.495 to 0.499 (Kimahri, Chapter I: 0.001 ' +
      'under the cap) and 0.15 to 0.22 (Kimahri, Chapter II), a spread of eight to one that the registration table cannot predict (its head step reads 0.53 to 0.83 and its centroid step 0.28 to 0.45 for every member of the ' +
      'roster, against 0.18 to 0.63 measured for the FFX-2 dresses); Rikku, the third slot here, has one read in any FFX room, 0.21 on the deck of Chapter VIII, and that swap was a blend and not a hard cut, so it does not say what the cut does on this stage. The piece holds the knock-out cut and ' +
      'its rebound and the victory cheer; the plain knock-out cross and the victory of release 68 play. Lifts when a continuity run (CHK-027) of this chapter with the moments on, a knock-out of each of Tidus, Yuna and ' +
      'Rikku, reads no unexcused swap jerk (every cut at or under 0.5 of the drawn height).',
  }),
  'seymour-natus': Object.freeze({
    breath:
      'FFX, Chapter X: the held breath is the drain-and-flood built for Total Annihilation (and, in FFX-2, Mega Flare), and a move reaches it only by id (`StagingPort.BigMove`), so nothing in this fight plays it today. The ' +
      'sourced showpieces are Flare (`natus-flare`: one character, base 60, about every third turn in phase 3, research/ffx-seymour-natus-highbridge.md sections 3.1 and 4.1) and the Desperado of Mortibody ' +
      '(`mortibody-desperado`: 468 to 529 to the whole party with every buff stripped, section 3.2); neither has a telegraph painting held before it (`TelegraphHold` stages only the Lance of Atrophy of Seymour Flux and the ' +
      'Ultimate Jecht Shot of Braska), and a breath needs a tone, a sound and a shot, which are mockup decisions (hard rule 9; the driver call of 2026-10-30: never guessed). Lifts when Bailey or the driver picks a tone and ' +
      'a shot for Flare (and for Desperado) from a mockup, and `BigMove`, `NAME_OF` and `passRecipes.HEADLINE_BLOWS` are given rows for those ids (which hit, `first` or `last`, measured the way Mega Flare was).',
    moments:
      'FFX, Chapter X: the moments cut the knock-out of a party member from the hurt painting to the lying one inside a planned smear (`PaintedActorLife.koCutWindow`: the moments and the smear both on), and CHK-027 excuses ' +
      'that cut only up to 0.5 of the drawn height (`critic/policy.json`, `continuity.smear.maxJerkShare`). Where the body lies is set per stage (`ProneLay` slides it by up to half its length along the floor) and the ' +
      'recorded runs of the motion pass read the same FFX paintings at 0.09 to 0.11 (Tidus, Chapter I), 0.75 (Tidus, the dome of Chapter II, a hard cut with no planned smear), 0.495 to 0.499 (Kimahri, Chapter I: 0.001 ' +
      'under the cap, and an active slot here) and 0.15 to 0.22 (Kimahri, Chapter II), a spread of eight to one that the registration table cannot predict (its head step reads 0.53 to 0.83 and its centroid step 0.28 to ' +
      '0.45 for every member of the roster, against 0.18 to 0.63 measured for the FFX-2 dresses). Flare alone makes 5.3 of the 5.4 knock-outs a fight (measured on the shipped party, research update of 2026-10-10), ' +
      'so the cut plays often. The piece holds the knock-out cut and its rebound and the victory cheer; the plain knock-out cross and the victory of release 68 play. Lifts when a continuity run (CHK-027) of this chapter ' +
      'with the moments on, a knock-out of each of Tidus, Yuna and Kimahri, reads no unexcused swap jerk (every cut at or under 0.5 of the drawn height).',
  }),
  'yojimbo-cavern': Object.freeze({
    breath:
      'FFX, Chapter IX: the held breath is the drain-and-flood built for Total Annihilation (and, in FFX-2, Mega Flare), and a move reaches it only by id (`StagingPort.BigMove`), so nothing in this fight plays it today. ' +
      'The sourced showpiece is Zanmato (`yojimbo-zanmato`: 9,999 to the whole party once the gauge of Yojimbo is full, research/ffx-yojimbo.md section 4; the fight already warns the player with a story callout, ' +
      '`yojimbo-zanmato-next`, which is not a telegraph painting), with Wakizashi and Kozuka as his other named blows; none has a telegraph painting held before it (`TelegraphHold` stages only the Lance of Atrophy of ' +
      'Seymour Flux and the Ultimate Jecht Shot of Braska), and a breath needs a tone, a sound and a shot, which are mockup decisions (hard rule 9; the driver call of 2026-10-30: never guessed). Lifts when Bailey or the ' +
      'driver picks a tone and a shot for Zanmato from a mockup, and `BigMove`, `NAME_OF` and `passRecipes.HEADLINE_BLOWS` are given rows for its id (which hit, `first` or `last`, measured the way Mega Flare was).',
    cam:
      'FFX, Chapter IX: the scene authors its framing and its victory by hand, and the plate is not the reason. The victory rig takes in the lit pad behind the party (the pad wakes once Yojimbo is recalled, ' +
      '`cavern-stolen-fayth.ts` `PAD_GLOW`); the rigs were solved at 1600 by 900 against the FFX HUD and the resting place of the Sensor plate (the corridor between Yuna and the plate is where Yojimbo stands) and reopen ' +
      'their field of view by the shape of the screen (`cavernRigsFor`); and the size of Yojimbo on screen is held by BOSS SCALE (`fx/mix/masters.ts`, `scaleHeld`: 1.15 times the party, the HUD fit moving the camera and ' +
      'never the boss). The directed victory is the real close-up of the last party actor, fitted to that actor and his company only (`ProPlays.victoryPlay`), and laid on this stage offline (`ProTrack.registerKeys`, ' +
      'docs/handoff/booth-ffx-b3a.md section 3) its 18 shots of Tidus, Yuna and Kimahri keep the lit pad in frame at their last key in 4 (Yuna 0 of 6, Kimahri 4 of 6, Tidus 0 of 6: every variant of each character laid on each of the three slots; Lulu has no row of her own and plays the Tidus close-up laid on her feet, `ProShots.characterOf`, so she is among the Tidus 0 of 6). The plate would not hold the piece back (a median worst frame of 39.7 percent past it against 47.7 for Chapter I under the plane model of Chapter II; today rigs show none at 16:9 but 4.8 ' +
      'percent at the sides of the intro rig and 3.7 of the party rig). The piece holds the directed camera, its real shots and its soft background; today rigs play. Lifts when job J1 of docs/handoff/booth-ffx-b3a.md (the victory with the pad lit, ' +
      'and the size of Yojimbo and the clearance of the HUD, on the real build with the camera on, against `?treated=pack`) shows the pad in frame and the size and the clearance unchanged, or the victory shot is given the ' +
      'pad as a companion.',
    moments:
      'FFX, Chapter IX: the moments cut the knock-out of a party member from the hurt painting to the lying one inside a planned smear (`PaintedActorLife.koCutWindow`: the moments and the smear both on), and CHK-027 ' +
      'excuses that cut only up to 0.5 of the drawn height (`critic/policy.json`, `continuity.smear.maxJerkShare`). Where the body lies is set per stage (`ProneLay` slides it by up to half its length along the floor) and ' +
      'the recorded runs of the motion pass read the same FFX paintings at 0.09 to 0.11 (Tidus, Chapter I), 0.75 (Tidus, the dome of Chapter II, a hard cut with no planned smear), 0.495 to 0.499 (Kimahri, Chapter I: 0.001 ' +
      'under the cap, and an active slot here) and 0.15 to 0.22 (Kimahri, Chapter II), a spread of eight to one that the registration table cannot predict (its head step reads 0.53 to 0.83 and its centroid step 0.28 to ' +
      '0.45 for every member of the roster, against 0.18 to 0.63 measured for the FFX-2 dresses); Lulu, the first slot here, has no read under the cut at all. The piece holds the knock-out cut and its rebound and the ' +
      'victory cheer; the plain knock-out cross and the victory of release 68 play. Lifts when a continuity run (CHK-027) of this chapter with the moments on, a knock-out of each of Lulu, Kimahri and Yuna, reads no ' +
      'unexcused swap jerk (every cut at or under 0.5 of the drawn height).',
  }),
  // Batch 3b (`booth-ffx-b3b`, FFX only): each of the three holds the staged breath; after the first review III and XII also hold the moments (the reserve Rikku's KO step) and XII and XIV the directed camera (the killing blow's plate at the live positions; the aeon as the actor); every other piece plays (`docs/handoff/booth-ffx-b3b.md` has the offline reads). None of the three is in
  // `SwapSwitch.SCOPE_EXCEPTIONS`, so no `smear` hold is owed (`tests/unit/booth-hold-guard.test.ts` reads both lists). The breath is held where its moves are sourced but its tone, sound and shot are a mockup decision (hard rule 9; the driver call of 2026-10-30).
  'braskas-final-aeon': Object.freeze({
    breath:
      'FFX, Chapter III: the held breath is the drain-and-flood built for Total Annihilation, a mount\'s countdown, and a move reaches it only by id (`StagingPort.BigMove`: `total-annihilation` and `mega-flare`, and `bigMoveOf` stages Mega Flare for FFX-2 only; the possessed Bahamut\'s own is `possessed-bahamut-mega-flare`, in neither), ' +
      'so nothing in the seven links plays it today. The sourced candidates (research/ffx-bfa-yu-yevon.md sections 1.3 and 1.6) are Braska\'s Final Aeon\'s Ultimate Jecht Shot (`ultimate-jecht-shot`, form 2\'s Overdrive at half HP or less, the one move of these three chapters that already ' +
      'has a telegraph painting held before it: `TelegraphHold`), his form-1 Overdrive Triumphant Grasp and the anti-aeon Jecht Bomber. A father\'s last blow is not a mount\'s countdown, so its tone, sound and shot are a mockup decision (hard rule 9; the driver call of 2026-10-30: never guessed). ' +
      'Lifts when Bailey or the driver picks a tone and a shot for the Ultimate Jecht Shot (and for Triumphant Grasp and Jecht Bomber, if wanted) from a mockup, and `BigMove`, `NAME_OF` and `passRecipes.HEADLINE_BLOWS` are given rows for those ids (which hit, `first` or `last`, measured the way Mega Flare\'s was).',
    moments:
      'FFX, Chapter III: the moments hard-cut a party figure\'s hurt-to-KO swap (the KO cut into the lying painting, `PaintedActorLife.koCutWindow`: no blend frame, where release 68 blends five), and a cut whose step is over 0.5 of the drawn height fails CHK-027 (Leblanc\'s Rikku Thief, measured at 0.62, is the case). ' +
      'The offline estimate of the step (`docs/handoff/booth-ffx-b3b.md` section 4) reads the reserve Rikku at 0.52, Kimahri 0.43, Wakka 0.40 and Lulu 0.39 of the drawn height, and it under-reads the three FFX-2 dresses measured in the page (0.47, 0.33 and 0.37 against 0.62, 0.50 to 0.52 and 0.48: ' +
      'a ratio of 0.64 to 0.77), so Rikku would measure about 0.69. All seven can be fielded (the same seven as Chapter I\'s), so the chapter keeps release 68\'s KO (the plain cross, no rebound) and its victory; the curves, the smear and every other piece still play. ' +
      'Lifts when job J5 of docs/handoff/booth-ffx-b3b.md (a knock-out per dress, the reserve Rikku first, on the continuity harness) reads every dress\'s hurt-to-KO swap at or under 0.5 of its drawn height and reports no unexcused swap jerk (CHK-027).',
  }),
  'seymour-omnis': Object.freeze({
    breath:
      'FFX, Chapter XII: the held breath is the drain-and-flood built for Total Annihilation, and a move reaches it only by id (`StagingPort.BigMove`), so nothing Omnis does plays it today (research/ffx-seymour-omnis.md section 0.4: Total Annihilation is not in this fight, it is Seymour Flux\'s). ' +
      'His one sourced showpiece is the scripted Ultima (`omnis-ultima`, row 6:240, the whole party, magic DC 64, sections 3.1 and 4.4: it comes the turn after the Dispel that follows his attack counter filling), and no telegraph painting is held before it (`TelegraphHold` stages only Seymour Flux\'s Lance of Atrophy and ' +
      'Braska\'s Ultimate Jecht Shot); a breath for it needs a tone, a sound and a shot, which are mockup decisions (hard rule 9; the driver call of 2026-10-30: never guessed). Lifts when Bailey or the driver picks a tone and a shot for Ultima from a mockup, and `BigMove`, `NAME_OF` ' +
      'and `passRecipes.HEADLINE_BLOWS` are given a row for its id (which hit, `first` or `last`, measured the way Mega Flare\'s was).',
    cam:
      'FFX, Chapter XII: the pro camera\'s real shots were laid by the real-motion lane on Chapter I\'s Gagazet stage, and the Garden\'s killing blow, laid on the party where the live game stands it (CHAPTER FRAMING\'s row moves Tidus, Yuna and Auron 1.5 to 2 units back, CHAPTER_XII in `fx/mix/stageTable.ts`), ' +
      'puts more of the frame past the plate than the approved chapter\'s: the offline read (`ProShots.laidShot` and `fitDolly`, no browser, `docs/handoff/booth-ffx-b3b.md` section 4) gives 37.7 percent at 16:9 and 39.9 at 21:9 against Chapter I\'s 24.5 and 32.6 under the same model (13.2 and 7.3 points over, ' +
      'where the lane\'s tolerance is five and Chapter II\'s dome was held on 7.5); the cast and the Overdrive read no worse than Chapter I\'s, and a summoned aeon reads better. The model overstates (no pillars, no director clamp), which cannot call the push safe. The piece holds the directed camera, its real shots ' +
      'and its soft background; the HD-2D look\'s own tilt-shift band stays. Lifts when job J2 of docs/handoff/booth-ffx-b3b.md (a cast, a landing, the killing blow and the victory at 16:9, 16:10, 21:9 and 4:3 on the real build) reads no plate edge, void or back of the plate beyond today\'s rig in any frame, ' +
      'or the shots are clamped to the Garden plate\'s width and top margin.',
    moments:
      'FFX, Chapter XII: the moments hard-cut a party figure\'s hurt-to-KO swap (the KO cut into the lying painting, `PaintedActorLife.koCutWindow`: no blend frame, where release 68 blends five), and a cut whose step is over 0.5 of the drawn height fails CHK-027 (Leblanc\'s Rikku Thief, measured at 0.62, is the case). ' +
      'The offline estimate of the step (`docs/handoff/booth-ffx-b3b.md` section 4) reads the reserve Rikku at 0.52, Kimahri 0.43, Wakka 0.40 and Lulu 0.39 of the drawn height, and it under-reads the three FFX-2 dresses measured in the page (0.47, 0.33 and 0.37 against 0.62, 0.50 to 0.52 and 0.48: ' +
      'a ratio of 0.64 to 0.77), so Rikku would measure about 0.69. All seven can be fielded (the Switch brings the reserve into Tidus\'s, Yuna\'s or Auron\'s place), so the chapter keeps release 68\'s KO (the plain cross, no rebound) and its victory; the curves, the smear and every other piece still play. ' +
      'Lifts when job J5 of docs/handoff/booth-ffx-b3b.md (a knock-out per dress, the reserve Rikku first, on the continuity harness) reads every dress\'s hurt-to-KO swap at or under 0.5 of its drawn height and reports no unexcused swap jerk (CHK-027).',
  }),
  'isaaru-via-purifico': Object.freeze({
    breath:
      'FFX, Chapter XIV: the held breath is the drain-and-flood built for Total Annihilation, and a move reaches it only by id (`StagingPort.BigMove`), so nothing here plays it today: `bigMoveOf` stages `mega-flare` for FFX-2 only (FFX shares that id for the party Bahamut\'s Overdrive, which is never staged), and Spathi\'s own Mega Flare is `spathi-mega-flare`, which follows his Countdown (`spathi-countdown`: ' +
      'research/ffx-isaaru-bevelle.md section 3) and is in neither table. The sourced candidates are that Countdown to Mega Flare (an announced countdown like Chapter IV\'s), Grothia\'s Hellfire (`grothia-hellfire`) and Pterya\'s Energy Ray (`pterya-energy-ray`), ' +
      'each an aeon\'s blow in a duel of aeons, whose tone, sound and shot are a mockup decision (hard rule 9; the driver call of 2026-10-30: never guessed). ' +
      'Lifts when Bailey or the driver picks the move, a tone and a shot from a mockup, `BigMove` and its id table are given the id (the announced countdown `moveOfName` reads for FFX-2 would need its FFX counterpart), and `passRecipes.HEADLINE_BLOWS` its hit.',
    cam:
      'FFX, Chapter XIV: the pro camera\'s real shots were laid by the real-motion lane on Chapter I\'s Gagazet stage for human-sized actors, and here it is Yuna\'s summoned aeon (3.2 tall, `VIA_ACTOR_HEIGHTS`, from the party\'s second slot) that acts, in the treated rooms\' narrowest plate (40 wide at 20 back; Chapter I\'s is 82 at 48, ' +
      'the Garden\'s and Dream\'s End\'s 80 at 50: `VIA_BACKDROP`). The offline read (`ProShots.laidShot` and `fitDolly`, no browser, `docs/handoff/booth-ffx-b3b.md` section 4) with the aeon as the actor puts its killing blow\'s rectangle outside the viewport in 100 percent of the samples against Chapter I\'s aeon 44.4, ' +
      'with 33.4 percent of the frame past the plate at 16:9 (37.2 at 21:9) against 18.6 (28.5); Yuna herself reads better than Chapter I\'s party. The model overstates (no pillars, no director clamp; every aeon is cropped in the cast and the Overdrive in Chapter I too), which cannot call the push safe. ' +
      'The piece holds the directed camera, its real shots and its soft background; the HD-2D look\'s own tilt-shift band stays. Lifts when job J2 of docs/handoff/booth-ffx-b3b.md (the aeon\'s killing blow first, then a cast, a landing and the victory, at 16:9, 16:10, 21:9 and 4:3 on the real build) reads the aeon whole ' +
      'and no plate edge, void or back of the plate beyond today\'s rig in any frame, or the shots are clamped to the Via plate\'s width and top margin.',
  }),
  'ffx2-leblanc': Object.freeze({
    breath:
      'FFX-2, Chapter VI: the held breath is the drain-and-flood built for Mega Flare (and, in FFX, Total Annihilation), a solemn beat. Her sourced showpiece is No Love Lost (research/ffx2-leblanc-syndicate.md section 4.5: ' +
      'three timed stages, eight shots, the party knocked down, a finisher; "the perfect thing for a presentation layer to build around"), a three-beat comedy combo whose tone, sound and shot are a mockup decision ' +
      '(hard rule 9), and no move of this chapter is named in `StagingPort.BigMove`, so nothing here plays the breath today. Lifts when Bailey or the driver picks a tone and a shot for No Love Lost from a mockup and the breath ' +
      'plan (and, for the sound pass, `passRecipes.HEADLINE_BLOWS`, which hit) is given a row for its ids `x2-nll-1` to `x2-nll-3`.',
    cam:
      'FFX-2, Chapter VI: the directed camera follows her party on Bevelle\'s four candidates rebuilt about her room (`ProAutoStage.AUTO_STAGES`), which nobody scored for her group, and the follower crops Yuna at the left edge: ' +
      'job J6 of docs/handoff/booth-leblanc.md (the r69 review) sampled a party rectangle up to 155 px outside the viewport 17 times in 110 s at 2560 x 1440 (0.4 to 0.6 s each, as the follower cycles its candidates 1, 2, 3, 0), where Chapter IV ' +
      'crops no one (1 sampled frame of 796, the dragon, never a party figure). Her frame keeps the resting camera of release 68, and with it the soft background of the tilt-shift band. ' +
      'Lifts when `ProAutoStage` re-scores the candidates for her group (the lane\'s shot scores and the real fit rule) and 0 sampled frames of job J6 of booth-leblanc.md put a party rectangle outside the viewport.',
    moments:
      'FFX-2, Chapter VI: the moments hard-cut her Rikku Thief and Yuna Gunner at the hurt-to-KO swap (the KO cut into the lying painting, `PaintedActorLife.koCutWindow`): no blend frame, a swap jerk of 152 to 168 px for Rikku in 3 of 3 KOs ' +
      '(0.62 to 0.63 of her drawn height) and 152 to 156 px for Yuna (0.50 to 0.52), over the 0.5 cap that excuses a planned smear (CHK-027 fails; the Dark Knight KO of Chapter IV sits at 0.48 and passes; release 68 blends five frames here). ' +
      'Only `?moments=today` gives the blend back (`?smear=off` too, but it drops every planned smear; curves, real clips and feel leave the cut). She keeps the victory hop, the plain KO cross and the landing of release 68. ' +
      'Lifts when the KO cut stays inside the planned-smear cap for her Rikku Thief and Yuna Gunner paintings (or is skipped where it would not) and a continuity run of her KOs with the moments on reports no unexcused swap jerk (CHK-027).',
  }),
  // Batch 2 (FFX-2 only; the driver's call (a): a staged breath that needs a tone or a sound pick is held with a reason, never guessed; one plays only where the research sources the move and an existing telegraph hold already stages it, and
  // `TelegraphHold` holds Chapter I and Chapter III's moves alone, in FFX only).
  'ffx2-vegnagun-shuyin': Object.freeze({
    cam:
      'FFX-2, Chapter V: links 1 to 4 play the approved colossus staging (D-228, `scenes/farplane-colossus.ts`: a low fov-40 master camera looking up at a part drawn 9.7 to 12.6 times a girl\'s height (the table\'s scale of 4.3 to 5.6 on the stage\'s 4.1 default boss height, D-600), "no single camera frame ever contains it"), and ' +
      'the follower\'s never-crop fit (`ProFit`, the safe rectangle 0.84 by 0.9) would dolly that camera back to fit each part whole: at the master rig a part alone is 1.24 (the Body) to 1.94 (the Leg) times over the rectangle, up to the 2.2 cap, ' +
      'so the follower would undo the frame Bailey approved (`fx/mix/masters.ts` `keepsToday` keeps today\'s rig for the same reason). Lifts when the follower stands down while the colossus rig is staged (`VegnagunColossus.active`), so link 5, Shuyin, ' +
      'plays it on the plain Farplane frame, or a browser read shows the fit keeping the approved crop. Until then the chapter\'s follower row (`ProAutoStage.AUTO_STAGES`) is dormant and has never met a camera: re-read it against the scene\'s real figure heights (4.1 and 1.82) when the hold lifts.',
    breath:
      'FFX-2, Chapter V: the held breath is the drain-and-flood built for Mega Flare (and, in FFX, Total Annihilation), and no move of this chapter is named in `StagingPort.BigMove`, so nothing here plays it today. The sourced candidates are the Core\'s ' +
      'Memento Mori after three Charge Core turns (`x2-vegnagun-memento-mori`, `research/ffx2-vegnagun-shuyin.md` section 4.1) and the Head\'s Nemo Ante Mortem Beatus, each a solemn all-party blow whose tone, sound and shot are a mockup decision ' +
      '(hard rule 9). Lifts when Bailey or the driver picks the move, a tone and a shot from a mockup, `BigMove` is given its id and `passRecipes.HEADLINE_BLOWS` its hit.',
    moments:
      'FFX-2, Chapter V: the moments hard-cut a girl at the hurt-to-KO swap (the KO cut into the lying painting, `PaintedActorLife.koCutWindow`, which needs the smear too; release 68 blends five frames), and CHK-027 fails a planned cut whose swap jerk is over 0.5 of her drawn height. ' +
      'The Change menu of this chapter reaches Gunner and Thief on all three girls\' Garment Grids (`farplaneBuild` through `gridNodeContents`: Tempered Will, Flash of Steel and Pride of the Sword each hold Gunner, Thief, Warrior and Lady Luck beside the worn dress), and the harness read those very paintings over the cap in Leblanc: ' +
      'Rikku Thief 0.61 to 0.63 and Yuna Gunner 0.50 to 0.52 of the drawn height (Rikku Dark Knight 0.48 in Chapter IV); the other dresses on the grids have no read, and none was taken in this room (where the lying body lies is the stage\'s, `ProneLay`). ' +
      'The KO is release 68\'s plain cross here and the victory is release 68\'s (the cheer goes with the piece); the smear, the curves, the real clips and the quiet ending still play. Lifts when a continuity run of a KO per dress on the girls\' grids in this chapter, the moments on, reports no unexcused swap jerk (CHK-027: every hurt-to-KO cut at or under 0.5 of the drawn height); `tests/unit/engine/booth-b2-ko-rule.test.ts` binds the hold to the grids.',
  }),
  'ffx2-den-of-woe': Object.freeze({
    breath:
      'FFX-2, Chapter XV: the held breath is the drain-and-flood built for Mega Flare, and no move of this chapter is named in `StagingPort.BigMove`, so nothing here plays it today. None of the three shades has a move the research calls a showpiece; ' +
      'the one candidate is Nooj\'s Lightfall (`x2-den-nooj-lightfall`, 5,000 to everyone, `research/ffx2-gippal-den-of-woe.md` section 4.3 and C-4), a spell whose tone, sound and shot are a mockup decision (hard rule 9). Lifts when Bailey or the driver ' +
      'picks the move, a tone and a shot from a mockup, `BigMove` is given its id and `passRecipes.HEADLINE_BLOWS` its hit.',
    moments:
      'FFX-2, Chapter XV: the moments hard-cut a girl at the hurt-to-KO swap (the KO cut into the lying painting, `PaintedActorLife.koCutWindow`, which needs the smear too; release 68 blends five frames), and CHK-027 fails a planned cut whose swap jerk is over 0.5 of her drawn height. ' +
      'The Change menu of this chapter reaches Gunner and Thief on all three girls\' Garment Grids (`farplaneBuild` through `gridNodeContents`: Tempered Will, Flash of Steel and Pride of the Sword each hold Gunner, Thief, Warrior and Lady Luck beside the worn dress), and the harness read those very paintings over the cap in Leblanc: ' +
      'Rikku Thief 0.61 to 0.63 and Yuna Gunner 0.50 to 0.52 of the drawn height (Rikku Dark Knight 0.48 in Chapter IV); the other dresses on the grids have no read, and none was taken in this room (where the lying body lies is the stage\'s, `ProneLay`). ' +
      'The KO is release 68\'s plain cross here and the victory is release 68\'s (the cheer goes with the piece); the smear, the curves, the real clips and the quiet ending still play. Lifts when a continuity run of a KO per dress on the girls\' grids in this chapter, the moments on, reports no unexcused swap jerk (CHK-027: every hurt-to-KO cut at or under 0.5 of the drawn height); `tests/unit/engine/booth-b2-ko-rule.test.ts` binds the hold to the grids.',
  }),
  'ffx2-fallen-aeons': Object.freeze({
    breath:
      'FFX-2, Chapter XI: the held breath is the drain-and-flood built for Mega Flare, and no move of this chapter is named in `StagingPort.BigMove`, so nothing here plays it today. The sourced candidates are Shiva\'s Diamond Dust (`x2-shiva-diamond-dust`, ' +
      'the action counter\'s payoff), the three Sisters\' Delta Attack (`x2-magus-delta-attack`, the party to 1 HP, gone once any sister falls) and Anima\'s Oblivion (`x2-anima-oblivion`), three different tones that are a mockup decision (hard rule 9) ' +
      '(`research/ffx2-fallen-aeons.md` sections 4.1 to 4.3). Lifts when Bailey or the driver picks the move, a tone and a shot from a mockup, `BigMove` is given its id and `passRecipes.HEADLINE_BLOWS` its hit.',
    moments:
      'FFX-2, Chapter XI: the moments hard-cut a girl at the hurt-to-KO swap (the KO cut into the lying painting, `PaintedActorLife.koCutWindow`, which needs the smear too; release 68 blends five frames), and CHK-027 fails a planned cut whose swap jerk is over 0.5 of her drawn height. ' +
      'The Change menu of this chapter reaches Gunner and Thief on all three girls\' Garment Grids (`farplaneBuild` through `gridNodeContents`: Tempered Will, Flash of Steel and Pride of the Sword each hold Gunner, Thief, Warrior and Lady Luck beside the worn dress), and the harness read those very paintings over the cap in Leblanc: ' +
      'Rikku Thief 0.61 to 0.63 and Yuna Gunner 0.50 to 0.52 of the drawn height (Rikku Dark Knight 0.48 in Chapter IV); the other dresses on the grids have no read, and none was taken in this room (where the lying body lies is the stage\'s, `ProneLay`). ' +
      'The KO is release 68\'s plain cross in all three links and the victory is release 68\'s (the cheer goes with the piece); the smear, the curves, the real clips and the quiet ending still play. Lifts when a continuity run of a KO per dress on the girls\' grids in this chapter, the moments on, reports no unexcused swap jerk (CHK-027: every hurt-to-KO cut at or under 0.5 of the drawn height); `tests/unit/engine/booth-b2-ko-rule.test.ts` binds the hold to the grids.',
  }),
  // Batch 3 (FFX-2 only; `booth-ffx2-b3`, Chapter XIII). Three pieces wait, each with its reason; every other piece plays. The follower's row and its stand-down on the link rig are built and pinned (`ProAutoStage`), and wait behind the `cam` hold like Chapter V's.
  'ffx2-trema': Object.freeze({
    cam:
      'FFX-2, Chapter XIII: link 1 plays the approved giants frame (`fx/mix/giants.ts`, D-316: Paragon at his real height, 9.45 units, 5.4 times the girls, the camera 1.9 times as far and 2.4 higher, in a window up to 1.79 wide) and the follower, blended halfway to its candidates, undoes it: ' +
      'its never-crop fit (`ProFit`, the safe rectangle 0.84 by 0.9) sits on its 1.8 cap in every frame while he is in his cast painting (and in about 28 percent of the frames while he idles), the girls fall to 0.73 to 0.81 of the approved frame\'s size (about 35 to 39 percent of today\'s, the giants floor being 45), and Paragon\'s cast painting, whose ' +
      'box is 12 percent taller than his idle\'s, stands 0.10 of the half frame past the top edge (45 px at 1600x900, 72 px at 2560x1440) where the approved frame has 0.04 (19 and 30 px): 2.4 times as far out, both sides on one box (his idle painting is 3.049 high on the actor\'s nominal 3.1). The party is never cropped, in any dress ' +
      '(0 of 3,120 frames per case in either link at 16:9 and 21:9, so at 1600x900, 2560x1440 and 3440x1440, on the real follower and fit: the three dresses it starts in, and the envelope of every dress with a painting, standing or lying, so a Change mid-fight cannot push a girl out), and Trema\'s link on today\'s rig reads clean ' +
      '(0 frames, the girls at 0.87 or more of the rig\'s size), but `cam` is one switch for the chapter and a hold for one link would be a second mechanism. The chapter keeps release 68\'s resting cameras and, with them, the soft background of the ' +
      'tilt-shift band; the follower\'s row (`ProAutoStage.AUTO_STAGES`) and its stand-down on the kill link\'s rig (`SCRIPTED_RIGS`) are built and wait. Lifts when the follower stands down while the giants frame is staged (one line in `ProDirector`\'s `held`), so Trema\'s link plays it on the plain rig with ' +
      'the rows already built, or a browser read (job J2 of docs/handoff/booth-ffx2-b3.md) shows Paragon\'s cast painting inside the frame under the follower.',
    breath:
      'FFX-2, Chapter XIII: the held breath is the drain-and-flood built for Mega Flare (and, in FFX, Total Annihilation), and no move of this chapter is named in `StagingPort.BigMove`, so nothing here plays it today. The sourced candidates are Trema\'s Meteor (`trema-meteor`: twelve hits on ' +
      'random party members, each an eighth of their max HP, once at half and once at a quarter of his HP) and Ultima (`trema-ultima`, below a sixth), and Oversoul Paragon\'s Final Impact (`paragon-os-final-impact`, once, below a tenth of its HP) (`research/ffx2-trema.md` sections 4.2 and 12.2), ' +
      'each a different tone (a sky that falls, a spell, a last strike) whose sound and shot are a mockup decision (hard rule 9); no telegraph painting is held before any of them (`TelegraphHold` stages only FFX moves). Lifts when Bailey or the driver picks the move, a tone and a shot from a ' +
      'mockup, `BigMove` is given its id and `passRecipes.HEADLINE_BLOWS` its hit.',
    moments:
      'FFX-2, Chapter XIII: the moments piece turns a party knock-out into a hard cut (a planned smear cut from the hurt painting into the lying one, then a small landing rebound), and the continuity harness (CHK-027, `continuity.smear`) excuses such a cut only up to the larger of ' +
      '`maxJerkPx` (120 px at 1600 wide) and half the figure\'s drawn height (`maxJerkShare` 0.5). The step is the distance between the feet of the two planes, which includes the slide `ProneLay` gives the lying body (up to half its length), so the registration data cannot give it alone, and no offline model reproduces the browser\'s readings. ' +
      'What the data gives is the KO body\'s length against the idle\'s height: 0.900 (Yuna Dark Knight), 0.896 (Rikku Alchemist) and 0.918 (Paine Dark Knight); but the length does not predict the reading (Chapter IV Rikku Dark Knight, 0.859, read 0.48 in the release 69 jobs; Leblanc\'s Rikku Thief, 1.197, read 0.62; ' +
      'Yuna Gunner, the shortest at 0.588, read 0.50 to 0.52), so there is NO READING of these three dresses yet and which side of the cap each falls on is unknown. The cap has two regimes in this chapter: in link 1 (Paragon\'s giants frame, the girls about 0.18 of the frame height, 160 px at 900 high) the 120 px floor binds ' +
      'and a cut is excused up to 0.75 of the drawn height; in link 2 (Trema, today\'s rig, the girls about 0.31 of the frame height, 280 px) half the drawn height binds, about 140 px. With nothing to clear the three dresses, the piece is held: a knock-out is today\'s plain cross and the held victory keeps the stance without the stand-down\'s small settle (the quiet title and the pull-back belong to `ending` and stay). ' +
      'Lifts when a browser run of each girl\'s knock-out in BOTH links (job J7 of docs/handoff/booth-ffx2-b3.md) reads every hurt-to-ko swap jerk inside the cap that link applies (CHK-027 excused as a planned smear), or the cut is planned with a shorter step.',
  }),
});

/**
 * WHICH CHAPTERS THE TREATMENT REACHES, by the address (`?treated=`): `all` (the default on a page) is {@link TREATED_CHAPTERS}; `pack` is release 68's, the booth pair only, whatever else the list says (one word to put
 * Leblanc, and every chapter that joins later, back to the look it had). With no page at all (a unit test, a tool) it reads `pack`, as `packDemo` reads off with no page: a test that wants a joined chapter sets
 * {@link setTreatedScope}.
 */
export type TreatedScope = 'all' | 'pack';

/** `?treated=pack|all` from a search string (pure): the word if it names a scope; `pack` with no page; else `all`. `booth`, `today` and `68` are `pack`. */
export function treatedScopeFromSearch(search: string | undefined): TreatedScope {
  if (search === undefined) return 'pack';
  const w = queryWord(search, 'treated');
  return w === 'pack' || w === 'booth' || w === 'today' || w === '68' ? 'pack' : 'all';
}

let scopeNow: TreatedScope | null = null;

/** The scope the page asked for. Read once. */
export function treatedScope(): TreatedScope {
  if (scopeNow === null) scopeNow = treatedScopeFromSearch(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));
  return scopeNow;
}

/** Tests and `window.__pyrefly.treated(...)`: force the scope (`null` reads the address again). */
export function setTreatedScope(value: TreatedScope | null): void {
  scopeNow = value;
}

/** The written reason a treated chapter holds a piece back, or undefined. */
export function treatedHold(id: string | undefined, piece: TreatedPiece): string | undefined {
  return id === undefined || !Object.prototype.hasOwnProperty.call(PIECE_HOLDS, id) ? undefined : PIECE_HOLDS[id]![piece];
}

/**
 * Does the treatment reach this chapter (and, with `piece`, play that piece in it)? True for the booth pair always; for any other id only under the `all` scope, when the id is in {@link TREATED_CHAPTERS} and the
 * piece is not held. Pure but for the address, read once.
 */
export function isTreatedChapter(id: string | undefined, piece?: TreatedPiece): boolean {
  if (id === undefined) return false;
  if (isDemoChapter(id)) return true;
  if (treatedScope() !== 'all' || !Object.prototype.hasOwnProperty.call(TREATED_CHAPTERS, id)) return false;
  return piece === undefined || treatedHold(id, piece) === undefined;
}

/** The game of a chapter the treatment reaches (under the current scope), or `fallback` for any other id. */
export function demoGameOf(id: string | undefined, fallback: DemoGame = 'ffx'): DemoGame {
  return isTreatedChapter(id) ? TREATED_CHAPTERS[id!]!.game : fallback;
}

/** One key of an address, trimmed and lower-cased; '' when absent or when the address cannot be read. */
export function queryWord(search: string | undefined, key: string): string {
  if (search === undefined) return '';
  try {
    return (new URLSearchParams(search).get(key) ?? '').trim().toLowerCase();
  } catch {
    return '';
  }
}

/**
 * THE CONFERENCE DEFAULT (r64, Bailey 2026-10-24 ~13:40 EDT, item 200b: "you can make all the decisions for me, ill go with all your recommendations"; the driver's call under it, his to overturn):
 * the pack is ON by default in Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2), with no `?pack=demo` in the address, from the chapter board and the booth path alike. ONE line to flip:
 * `false` puts every address back to release 62 / r63-play's (the pack only with `?pack=demo`).
 *
 * Every consumer already gates itself on the running chapter (`isDemoChapter(demoChapter())`, or demo mode for the booth's screens), so this changes nothing in any other chapter, screen or mode.
 *
 * **On a desktop-class screen only (r63 focused review R63-P1, 2026-10-24).** The default holds where the pack was built and played, a desktop with a mouse and a keyboard; on a phone or a tablet it is OFF
 * ({@link packScreen}): the F1 HUD is authored on a 640 x 360 grid with key hints and no PAUSE button, so at 390 x 844 it dropped PAUSE, cut the command names (ATTA..., SPE...) and let the party numbers
 * overlap, and on a tablet or a phone held sideways it still has no way to pause by touch. `?pack=demo` forces the pack on anywhere (the booth address) and `?pack=off` forces it off anywhere.
 */
export const PACK_DEFAULT_ON = true;

/** The narrowest page the pack's default plays on, CSS px: the game's own phone breakpoint (`ui/common/phoneBattle.ts` PHONE_BATTLE_QUERY, `(max-width: 599px)`; party prep uses the same 599). */
export const PACK_PHONE_MAX_WIDTH = 599;

/**
 * The largest short side, CSS px, at which a touch-first screen still counts as a phone or a tablet: 1024 is an iPad's (and an iPad Pro 12.9's) short side held either way, so 768 x 1024, 1024 x 768 and
 * 1366 x 1024 are tablets, while a 1920 x 1080 touch monitor (a booth kiosk) is a desktop-class screen.
 */
export const PACK_TOUCH_MAX_SHORT_SIDE = 1024;

/** `desk` = a desktop-class screen (the pack's default applies); `phone` = a phone, a tablet or any narrow screen (the default is off: release 62's HUD and every other piece as it was). */
export type PackScreen = 'desk' | 'phone';

/** What the screen is read from; every field is optional, and a page with none of them (a unit test, a tool) reads as a desktop. */
export interface PackScreenGlobals {
  innerWidth?: number;
  innerHeight?: number;
  matchMedia?: (query: string) => { matches: boolean };
}

/**
 * The screen class from a window-like object (pure). `phone` when the page is narrower than the phone breakpoint ({@link PACK_PHONE_MAX_WIDTH}, upright or sideways), or the primary pointer is coarse
 * (`(pointer: coarse)`: a touch screen with no mouse, which has no key for the P the F1 HUD's pause hint names) on a screen whose short side is {@link PACK_TOUCH_MAX_SHORT_SIDE} or less (a phone, held
 * either way, or a tablet). `desk` otherwise, and `desk` where nothing can be read.
 */
export function readPackScreen(g: PackScreenGlobals = globalThis as PackScreenGlobals): PackScreen {
  const mm = (query: string): boolean => {
    try {
      return typeof g.matchMedia === 'function' && g.matchMedia(query).matches === true;
    } catch {
      return false;
    }
  };
  const w = typeof g.innerWidth === 'number' && g.innerWidth > 0 ? g.innerWidth : undefined;
  const h = typeof g.innerHeight === 'number' && g.innerHeight > 0 ? g.innerHeight : undefined;
  if ((w !== undefined && w <= PACK_PHONE_MAX_WIDTH) || mm(`(max-width: ${PACK_PHONE_MAX_WIDTH}px)`)) return 'phone';
  const short = Math.min(w ?? Infinity, h ?? Infinity);
  return mm('(pointer: coarse)') && short <= PACK_TOUCH_MAX_SHORT_SIDE ? 'phone' : 'desk';
}

/**
 * DECIDED AT LOAD, ONCE: the class of the screen the page opened on, read when this module is evaluated (the page's first script). Turning a phone sideways, resizing a desktop window or a pointer
 * appearing never changes it mid-session, so a fight is never switched from one HUD to the other in the player's hands; a reload decides again.
 */
let screenClass: PackScreen = readPackScreen();

/** The screen class the page opened on ({@link readPackScreen} at load). */
export function packScreen(): PackScreen {
  return screenClass;
}

/** Tests and tools: force the class (`null` reads the page again). */
export function setPackScreen(value: PackScreen | null): void {
  screenClass = value ?? readPackScreen();
}

/** Does the conference default apply on this page: the default is on ({@link PACK_DEFAULT_ON}) and the screen is a desktop-class one ({@link packScreen}). */
export function packDefaultOn(): boolean {
  return PACK_DEFAULT_ON && screenClass === 'desk';
}

/**
 * Is the conference pack asked for by this address? The one reader every lane's switch uses.
 *
 * | address | answer |
 * |---|---|
 * | `?pack=demo` | on, on any screen (the booth address) |
 * | `?pack=off` (or `today`, `0`) | off: every piece back to release 62's, the old behaviour |
 * | no `pack` word (r64) | {@link packDefaultOn}: on for a desktop-class screen, off for a phone or a tablet (r63 R63-P1) |
 * | `undefined` (no page at all: a unit test, a tool) | off, as it always was |
 *
 * A lane's own word still beats the pack for its piece in both directions (`?pro=off`, `?hud=today`, `?audio=today`, `?boss=today`, `?prebuild=off`, `?punch=today`, ...).
 */
export function packDemo(search: string | undefined): boolean {
  if (search === undefined) return false;
  const w = queryWord(search, 'pack');
  if (w === 'demo') return true;
  if (w === 'off' || w === 'today' || w === '0') return false;
  return packDefaultOn();
}

/**
 * The master word of the three "pro" lanes (the r63 integration, 2026-10-23; the look, the camera and the staging): `?pro=off` (or `today`) takes all three back to today's at once, beating each lane's
 * own key and the pack; `?pro=on` turns all three on without the pack, under each lane's own key (`?look=today` still wins over it). '' when the address does not name it. Read by `ProSwitch`,
 * `ProCamSwitch` and `StagingSwitch` and nothing else.
 */
export function proLanes(search: string | undefined): 'on' | 'off' | '' {
  const w = queryWord(search, 'pro');
  return w === 'off' || w === 'today' ? 'off' : w === 'on' || w === 'pro' ? 'on' : '';
}
