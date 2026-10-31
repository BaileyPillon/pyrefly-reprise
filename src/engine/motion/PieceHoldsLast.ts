/**
 * THE HOLDS OF THE LAST FIVE LISTED CHAPTERS (`booth-b4-last`, release 71; Bailey 2026-10-30: "the nice treatment you gave to the booth chapters you need to now apply to all live and selectable chapters (meaning ones that arent hidden)";
 * 2026-10-29: "you make all executive decisions for the next few days. i'll go with all of your recommendations"; every call is the driver's, delegated, and Bailey's to overturn). `PieceHolds.PIECE_HOLDS` spreads this table in, so every reader
 * keeps importing the holds from `DemoGate.ts`; the rows live in their own file because `PieceHolds.ts` carries fifteen chapters' reasons and the shape of the earlier batches (`ProGradeFfx.ts`) is one data file per batch.
 * Pure data: no DOM, no `three`, no randomness (AGENTS.md hard rule 1); type-only import, so no runtime cycle.
 *
 * Four of the five join the treated list, each with the pieces below held (a reason of 80 characters or more that ends in its "Lifts when ..."): Chapter VIII (Evrae, FFX only), Chapter XVIII (Sin's face, FFX only), the Mirror Aeons chapter
 * (Chapter 27 in the list, FFX only) and Chapter XVI (Ixion at Djose, FFX-2 only). **Chapter XVII (Sin's Fins and Core, FFX only) does NOT join** (`tests/unit/booth-treated-chapters.test.ts` `NOT_YET` carries its reason): its Fin plate meets the F1 turn strip
 * and its flight plate is the brightest in the game, so it has no rows here. Each row is game-aware (rule 14): the FFX chapters hold what the FFX sources and recordings say, Chapter XVI what the FFX-2 sources say.
 */

import type { TreatedPiece } from './DemoGate.ts';

export const LAST_HOLDS: Readonly<Record<string, Readonly<Partial<Record<TreatedPiece, string>>>>> = Object.freeze({
  // Chapter VIII (FFX only; `research/ffx-evrae-airship.md`): the deck is the range director's, so the camera waits; the breath and the knock-out cut wait as everywhere beyond the booth pair. Every other piece plays, the smear and the stance picks among them (Evrae
  // left `SwapSwitch.SCOPE_EXCEPTIONS` in release 69, so no `smear` hold is owed: `tests/unit/booth-hold-guard.test.ts` reads both lists).
  'evrae-airship': Object.freeze({
    breath:
      'FFX, Chapter VIII: the held breath is the drain-and-flood built for Total Annihilation (and, in FFX-2, Mega Flare), and a move reaches it only by id (`StagingPort.BigMove`), so nothing Evrae does plays it today. His sourced showpiece is Poison Breath ' +
      '(`evrae-poison-breath`, the move that his Inhale, `evrae-inhale`, announces one turn ahead, and that whiffs as "Out of breath range." at FAR: research/ffx-evrae-airship.md sections 3.1 and 4.5), and the chapter already stages that telegraph itself: the range director rests his ' +
      'painting on `breath-charge` at NEAR while the flag `airship.breathCharged` stands (`scenes/evrae-airship-director.ts`), so there is no existing hold (`TelegraphHold` stages only Seymour Flux\'s Lance of Atrophy and Braska\'s Ultimate Jecht Shot) to extend; a breath for it needs a tone, a sound and a ' +
      'shot, which are mockup decisions (hard rule 9; the driver call of 2026-10-30: never guessed). Lifts when Bailey or the driver picks a tone and a shot for Poison Breath from a mockup, and `BigMove`, `NAME_OF` and `passRecipes.HEADLINE_BLOWS` are given rows for ' +
      'its id (which hit, `first` or `last`, measured the way Mega Flare\'s was).',
    cam:
      'FFX, Chapter VIII: the deck\'s camera is the range director\'s (`scenes/evrae-airship-director.ts`): it replaces the scene\'s `idle`, `action` and `enemy` rigs with the range\'s own (NEAR\'s and FAR\'s, `RANGE_STAGING`), moves the camera to the current one, and refits NEAR ' +
      'to the window\'s shape (`evrae-airship-aspect.ts`: the stand-back that keeps the coil clear of the turn rail below 16:9), so a directed camera laid over it would cut across a camera the scene already authors; and the pro camera\'s real shots were laid by the real-motion ' +
      'lane on Chapter I\'s Gagazet stage and clamped to 35 degrees of its plate\'s front, not on a plate that stands 45 units out, 90 wide and rolled 11.6 degrees. The piece holds the directed camera, its real shots and its soft background; the range director\'s rigs play, and ' +
      'the HD-2D look\'s own tilt-shift band stays. Lifts when a browser run with the hold lifted in a scratch build (a cast, a landing, the killing blow and the victory at 16:9, 21:9 and 4:3, at NEAR and at FAR) shows no frame whose plate edge, party or Evrae stands worse than ' +
      'the range director\'s own rig, and `__pyrefly.procam()` agrees with the director\'s rig at each range change.',
    moments:
      'FFX, Chapter VIII: the moments cut the knock-out of a party member from the hurt painting to the lying one inside a planned smear (`PaintedActorLife.koCutWindow`: the moments and the smear both on), and CHK-027 excuses that cut only up to 0.5 of the drawn height (the ' +
      'critic policy\'s `continuity.smear.maxJerkShare`). Where the body lies is set per stage (`ProneLay` slides it by up to half its length along the floor) and the recorded runs of the motion pass read the same FFX paintings at 0.09 to 0.11 (Tidus, Chapter I), 0.495 to 0.499 ' +
      '(Kimahri, Chapter I: 0.001 under the cap, and the sixth member here) and 0.15 to 0.22 (Kimahri, Chapter II), a spread of eight to one that the registration table cannot predict; Rikku, the third slot here, has one read in any FFX room, 0.21 on this very deck, and that swap was a ' +
      'blend and not a hard cut; Wakka, Lulu and Auron have no hard-cut read here. All six can be fielded (Tidus, Wakka and Rikku in front, Lulu, Auron and Kimahri by Switch). The piece holds the knock-out cut and its rebound and the victory cheer; the plain knock-out cross and the ' +
      'victory of release 68 play. Lifts when a continuity run (CHK-027) of this chapter with the moments on, a knock-out of each of the six, reads no unexcused swap jerk (every cut at or under 0.5 of the drawn height).',
  }),
  // Chapter XVIII (FFX only; `research/ffx-sin.md` sections 3.4 and 5.4): Sin's face, one link on the deck over the Bevelle plate, and a swap exception, so four pieces wait (the breath, the camera, the knock-out cut and the smear planner).
  'sin-face': Object.freeze({
    breath:
      'FFX, Chapter XVIII: the held breath is the drain-and-flood built for Total Annihilation (and, in FFX-2, Mega Flare), and a move reaches it only by id (`StagingPort.BigMove`), so nothing Overdrive Sin does plays it today. His one sourced showpiece is Giga-Graviton ' +
      '(`overdrive-sin-giga-graviton`: Percentage Total on the whole party, Death 255, the scripted Game Over on the last turn of the mouth clock, research/ffx-sin.md sections 3.4 and 5.4), and the chapter already announces it turn by turn with its own clock (`SinHud`, `sinHudModel.ts`); ' +
      'no telegraph painting is held before it (`TelegraphHold` stages only Seymour Flux\'s Lance of Atrophy and Braska\'s Ultimate Jecht Shot), it ends the fight in a defeat (the pro defeat card\'s frame, not a breath\'s), and a breath for it needs a tone, a sound and a shot, which are ' +
      'mockup decisions (hard rule 9; the driver call of 2026-10-30: never guessed). Lifts when Bailey or the driver picks a tone and a shot for Giga-Graviton from a mockup, and `BigMove`, `NAME_OF` and `passRecipes.HEADLINE_BLOWS` are given rows for its id (which hit, `first` or `last`, ' +
      'measured the way Mega Flare\'s was).',
    cam:
      'FFX, Chapter XVIII: Sin\'s face stands on the Fahrenheit\'s deck (`scenes/evrae-airship-sin.ts`: Evrae\'s layout, rigs and party arc over the Bevelle plate at golden dusk, rolled as Evrae\'s is), so the scene\'s own NEAR rigs author the camera (the range director binds nothing in this ' +
      'link, `BattleScreenAirship`, but its rigs and its refit by window shape are the scene\'s), and the pro camera\'s real shots, laid by the real-motion lane on Chapter I\'s Gagazet stage and clamped to 35 degrees of its plate\'s front, have not been laid on this plate or against a head that ' +
      'is drawn wider than the party stands tall. The piece holds the directed camera, its real shots and its soft background; the scene\'s rigs play, and the HD-2D look\'s own tilt-shift band stays. Lifts when a browser run with the hold lifted in a scratch build (a cast, a landing, ' +
      'the killing blow and the victory at 16:9, 21:9 and 4:3) shows no frame whose plate edge, party or head stands worse than the scene\'s own rig.',
    moments:
      'FFX, Chapter XVIII: the moments cut the knock-out of a party member from the hurt painting to the lying one inside a planned smear (`PaintedActorLife.koCutWindow`: the moments and the smear both on), and CHK-027 excuses that cut only up to 0.5 of the drawn height (the critic ' +
      'policy\'s `continuity.smear.maxJerkShare`). Where the body lies is set per stage (`ProneLay` slides it by up to half its length along the floor) and the recorded runs of the motion pass read the same FFX paintings at 0.09 to 0.11 (Tidus, Chapter I), 0.495 to 0.499 (Kimahri, Chapter I: ' +
      '0.001 under the cap) and 0.15 to 0.22 (Kimahri, Chapter II), a spread of eight to one that the registration table cannot predict; Rikku has one read in any FFX room, 0.21 on the deck of Chapter VIII, and that swap was a blend and not a hard cut. All seven can be fielded here ' +
      '(Tidus, Yuna and Auron in front). The piece holds the knock-out cut and its rebound and the victory cheer; the plain knock-out cross and the victory of release 68 play. Lifts when a continuity run (CHK-027) of this chapter with the moments on, a knock-out of each of the seven, reads ' +
      'no unexcused swap jerk (every cut at or under 0.5 of the drawn height).',
    smear:
      'FFX, Chapter XVIII: the smear style is the planner that cuts a pose swap inside a brush-stroke trail whenever the figure moves (`SmearDirector.swap`, also the knock-out\'s cut), and it rides on the same chapter list as the stance and cause picks, which ' +
      '`SwapSwitch.SCOPE_EXCEPTIONS` holds back for Sin\'s face: the wide run of release 68 (seed 1) took ghost time a minute from 2,390 ms to 1,116 but Auron\'s lunge returns to his stance in one frame (224 px) and that return IS a planned cut (style paint, 38 ms, heads 0.40 of his ' +
      'height apart), which the harness refused to excuse by 1.2 percent (224.4 px against a cap of half his drawn height, 221.8). A smear that played here would plan that cut, so the chapter keeps release 67\'s swap look as the exception says (`?swapscope=all` still reaches it). Lifts when ' +
      'his entry in `SwapSwitch.SCOPE_EXCEPTIONS` lifts: job `sin-face-all-held-anchor` of docs/handoff/held-chapters.md (anchor on by the chapter word alone) reads no swap jerk of 40 px or more outside an excused planned cut and the anchored look has been judged in the clips.',
  }),
  // The Mirror Aeons chapter (FFX only; `research/ffx-mirror-aeons.md`; Chapter 27 in the list, listed 2026-10-15): one scene, two plates, no @2x master for the first, and the grade applied once at the scene's entry, so the room looks and the full-bleed card wait.
  'mirror-aeons': Object.freeze({
    hd2d:
      'FFX, Chapter 27 (Mirror Aeons): the HD-2D bold look is graded per room, keyed by the chapter\'s scene (`mirror-aeons`), and this scene is TWO plates under one key: Act I\'s Mushroom Rock Road (a provisional stand-in, 2688 x 1536 with no @2x master on disk; mean luminance 0.600 against ' +
      'Chapter I\'s 0.418, brighter than every approved room and within 0.03 of the Farplane\'s 0.628, the plate the bold look clipped to a flat white halo in the r70 run) and Act II\'s Cavern of the Stolen Fayth (mean 0.215, a dark cave), swapped under a white pulse with the grade applied ' +
      'once, at the scene\'s entry (`scenes/mirror-aeons.ts`: "the cavern is lit with the road\'s daylight grade"). One room row cannot grade both, and which grade each act gets is a look decision (hard rule 9), so the look waits. Lifts when Bailey picks a grade for each act from a ' +
      'still pair (the road\'s daylight with its highlights held under 235, the cavern\'s cold stone) and the scene grades per plate (`SceneBuild.swapBackdrop`), or the road\'s real plate is installed with its @2x master.',
    arena:
      'FFX, Chapter 27 (Mirror Aeons): the pro arena grade (one strong light, the rest to deep shadow and haze) is the same per-room row as the HD-2D look and has the same two problems: one key (`mirror-aeons`) for two plates, the road\'s daylight and the cavern\'s dark, and a first plate that is a ' +
      'provisional stand-in with no @2x master and a mean luminance of 0.600 (the Farplane\'s 0.628 clipped under the bold look); the arena\'s light is a point on the painting (the road\'s brightest cloud, plate u 0.517, v 0.293; the cavern\'s shaft, u 0.586, v 0.431), which differs per act. ' +
      'Lifts when the HD-2D hold lifts and a pro arena row (`PRO_ARENA`) for each act is picked from a still pair and graded through the engine\'s own LUT beside Chapter I, with the highlights held under 235.',
    card:
      'FFX, Chapter 27 (Mirror Aeons): the boss card is the chapter\'s own backdrop drawn full-bleed and still, lit high key, with the boss large (`BattleScreenCard`, `proCard.css`), the one place a plate stands large and unmoving, and the road\'s plate has no @2x master on disk (the booth ' +
      'pair\'s plates ship one): at 3440 x 1440 the 2688-wide master is drawn 1.28 times its size, and the second link\'s card names the cavern after the plate swap. No art is written (hard rule 8). Lifts when the road\'s plate is installed with its @2x master (`backdropTiers` lists it) and a ' +
      'browser read of the card of each link at 2560 x 1440 and 3440 x 1440 shows no soft edge beyond Chapter I\'s.',
    breath:
      'FFX, Chapter 27 (Mirror Aeons): the held breath is the drain-and-flood built for Total Annihilation (and, in FFX-2, Mega Flare), and a move reaches it only by id (`StagingPort.BigMove`), so nothing here plays it today. The sourced showpieces are Act I\'s Mega Graviton ' +
      '(`dark-mega-graviton`, the pair\'s group move on each sister\'s sixth turn, since their gauges start at 0 and the trio\'s Delta Attack is not in the pair: research/ffx-mirror-aeons.md section 2) and Dark Yojimbo\'s Zanmato (`dark-zanmato`, at a full gauge: section 3); none has a telegraph ' +
      'painting held before it (`TelegraphHold` stages only Seymour Flux\'s Lance of Atrophy and Braska\'s Ultimate Jecht Shot), and a breath needs a tone, a sound and a shot, which are mockup decisions (hard rule 9; the driver call of 2026-10-30: never guessed). Lifts when Bailey or the ' +
      'driver picks a move, a tone and a shot from a mockup, and `BigMove`, `NAME_OF` and `passRecipes.HEADLINE_BLOWS` are given rows for its id (which hit, `first` or `last`, measured the way Mega Flare\'s was).',
    cam:
      'FFX, Chapter 27 (Mirror Aeons): the stage is Mushroom Rock Road\'s with this chapter\'s staging (`scenes/mirror-aeons.ts`: the party held, the enemy spots pinned, the figure heights estimates), and its second link swaps the plate under the same rigs (`swapBackdrop`); the pro camera\'s ' +
      'real shots were laid by the real-motion lane on Chapter I\'s Gagazet stage and clamped to 35 degrees of its plate\'s front, and no model of them has been laid on either of this chapter\'s plates, so a plate edge, a void or a cropped actor beyond today\'s rigs cannot be ruled out. The ' +
      'piece holds the directed camera, its real shots and its soft background; today\'s rigs play. Lifts when a browser run with the hold lifted in a scratch build (a cast, a landing, the killing blow and the victory at 16:9, 21:9 and 4:3, in both acts) shows no frame whose plate edge, party or ' +
      'foe stands worse than today\'s rig.',
    moments:
      'FFX, Chapter 27 (Mirror Aeons): the moments cut the knock-out of a party member from the hurt painting to the lying one inside a planned smear (`PaintedActorLife.koCutWindow`: the moments and the smear both on), and CHK-027 excuses that cut only up to 0.5 of the drawn height (the critic ' +
      'policy\'s `continuity.smear.maxJerkShare`). Where the body lies is set per stage (`ProneLay` slides it by up to half its length along the floor) and the recorded runs of the motion pass read the same FFX paintings at 0.09 to 0.11 (Tidus, Chapter I), 0.495 to 0.499 (Kimahri, Chapter I: ' +
      '0.001 under the cap) and 0.15 to 0.22 (Kimahri, Chapter II), a spread of eight to one that the registration table cannot predict. All seven can be fielded here, and Yuna\'s four optional aeons (Yojimbo and the three Sisters) never take the cut. The piece holds the knock-out cut and its ' +
      'rebound and the victory cheer; the plain knock-out cross and the victory of release 68 play. Lifts when a continuity run (CHK-027) of this chapter with the moments on, a knock-out of each of the seven, reads no unexcused swap jerk (every cut at or under 0.5 of the drawn height).',
  }),
  // Chapter XVI (FFX-2 only; `research/ffx2-ixion-djose.md`): Ixion in the Chamber of the Fayth at Djose, one link and a story close, on a PROVISIONAL plate and a swap exception: the room looks, the follower, the breath, the knock-out cut and the smear planner wait.
  'ffx2-ixion-djose': Object.freeze({
    hd2d:
      'FFX-2, Chapter XVI (Ixion at Djose): the Chamber\'s plate is a PROVISIONAL one (`data/ixion-plates.ts`: option C2, "Storm-lit stone", installed as `djose-chamber-provisional` until Bailey picks the real plate; mean luminance 0.265), so a look graded on it (the HD-2D bold row, the light ' +
      'the shafts follow, the sharp band on the girls\' feet) would be graded on a painting that is going to change under it, and a re-grade is owed the day it does. Lifts when the real plate is installed (`DJOSE_CHAMBER_PLATE` moves off `djose-chamber-provisional`) and a room row (`CHAPTER_LOOKS`, ' +
      '`ROOM_LOOKS`, `BOLD_ROOMS`, `ROOM_BOLD`) is authored for it and read in a still pair beside Chapter IV.',
    arena:
      'FFX-2, Chapter XVI (Ixion at Djose): the pro arena grade is a per-room row (`PRO_ARENA`: one strong light, the rest to deep shadow and haze) and the room\'s plate is a PROVISIONAL one (`data/ixion-plates.ts`, `djose-chamber-provisional`), so the row would be graded on a painting that is going ' +
      'to change under it. Lifts when the real plate is installed, the HD-2D hold lifts, and an arena row for it is graded through the engine\'s own LUT and read in a still pair beside Chapter IV.',
    breath:
      'FFX-2, Chapter XVI: the held breath is the drain-and-flood built for Mega Flare (and, in FFX, Total Annihilation), and a move reaches it only by id (`StagingPort.BigMove`; `bigMoveOf` stages Mega Flare for FFX-2), so nothing Ixion does plays it today. His sourced showpiece is Thor\'s Hammer ' +
      '(`x2-ixion-thors-hammer`, his Overdrive, the move that follows Recharge, research/ffx2-ixion-djose.md section 4.1 and 4.2), and the chapter already gives its tell on screen (`x2-ixion-recharge` is an FFX-2 told move, `ui/ffx2/toldMoves.ts`); a breath for it needs a tone, a sound and ' +
      'a shot, which are mockup decisions (hard rule 9; the driver call of 2026-10-30: never guessed). Lifts when Bailey or the driver picks a tone and a shot for Thor\'s Hammer from a mockup, and `BigMove`, `NAME_OF` and `passRecipes.HEADLINE_BLOWS` are given rows for its id (which hit, `first` ' +
      'or `last`, measured the way Mega Flare\'s was).',
    cam:
      'FFX-2, Chapter XVI: the follower camera (`ProAutoStage.AUTO_STAGES`: the FFX-2 auto camera\'s decoded constants with four ranked eye candidates laid on each room\'s plate and rigs, `tools/procam/gen-pro-shots.mjs`) has no row for this plate, and the plate is provisional, so a row would be laid on a ' +
      'painting that changes; Leblanc and the Den of Woe hold the same piece for the same crop of Yuna at the frame\'s edge. The piece holds the follower and the soft background; release 68\'s resting camera plays. Lifts when the real plate is installed and `ProAutoStage` has a row for it ' +
      'that reads 0 sampled frames with a party rectangle outside the viewport at 2560 x 1440 and 3440 x 1440 (the sampler of the Leblanc review\'s job J6).',
    moments:
      'FFX-2, Chapter XVI: the moments cut the knock-out of a girl from the hurt painting to the lying one inside a planned smear (`PaintedActorLife.koCutWindow`: the moments and the smear both on), and CHK-027 excuses that cut only up to 0.5 of the drawn height (the critic policy\'s ' +
      '`continuity.smear.maxJerkShare`). The recorded reads of the same paintings are Rikku Thief 0.608 to 0.634 and Yuna Gunner 0.504 to 0.520 (Leblanc, over the cap) and Rikku Dark Knight 0.480 to 0.484 (Chapter IV, under it), and the chapter\'s grids (the dresspheres owned by the end of Chapter 3: ' +
      'Gunner, Thief, Warrior, Songstress, Black Mage, White Mage, Dark Knight and usually Gun Mage and Alchemist, research/ffx2-ixion-djose.md section 5) field Gunner and Thief on all three girls; the party starts as Yuna White Mage, Rikku Dark Knight and Paine Dark Knight. The piece ' +
      'holds the knock-out cut and its rebound and the victory cheer; release 68\'s knock-out cross and victory play. Lifts when a continuity run (CHK-027) of this chapter with the moments on, a knock-out of each dress the grids offer, reads no unexcused swap jerk (every cut at or under 0.5 ' +
      'of the drawn height).',
    smear:
      'FFX-2, Chapter XVI: the smear style is the planner that cuts a pose swap inside a brush-stroke trail whenever the figure moves (`SmearDirector.swap`, also the knock-out\'s cut), and it rides on the same chapter list as the stance and cause picks, which `SwapSwitch.SCOPE_EXCEPTIONS` holds back ' +
      'for Ixion at Djose: the wide run of release 68 (seed 1) took ghost time a minute from 4,873 ms to 2,144 but a KO kneel cut steps 146, 140 and 138 px against caps of 145.5, 132.6 and 137.6, a planned cut (smear paint, 38 ms, cause critical: Rikku hurt to critical and back, heads 0.38 of her ' +
      'height apart sideways and 0.30 up) refused by 0.1 to 5.7 percent. A smear that played here would plan those cuts, so the chapter keeps release 67\'s swap look as the exception says (`?swapscope=all` still reaches it). Lifts when his entry in `SwapSwitch.SCOPE_EXCEPTIONS` lifts: a third run ' +
      '(the job ixion-all-held) has no snap and either the job ixion-all-held-anchor (`?cutanchor=on`) reads the kneel cuts inside their cap and the look is judged, or a repeat reads them inside it with no change.',
  }),
});
