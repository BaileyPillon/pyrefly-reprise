# r44-entrance: bosses and aeons arrive as pyreflies gathering (E-PYRE, decision 61e; round 25's PR-0380, the three entrances)

Date 2026-10-13. Written by the r44-entrance lane for the release driver; branch `r44-entrance` (off `origin/r43-rc` 7b2582e7), two commits (the code and tests, then this note and the proof). No ledger, NOW.md
or CHANGELOG was edited (they are the driver's); suggested text is at the end. Bailey, 2026-10-12 ~23:15 EDT, answering "E-PYRE: the boss entrances": "I'll go with all of your recommendations"; decision 61e:
bosses and aeons that pop in over one frame arrive as pyreflies gathering, the fallback is E-FADE (300 ms) if E-PYRE cannot be made to read well. His pick approves the look on the Boss Entrance Options page only.

**Game case (rule 14): both** (shared plumbing). FFX and FFX-2 both have pyreflies, and `research/ffx-vs-ffx2-presentation.md` section 3 gives the same body rule for both games (below). Neither game's sources describe an
entrance animation (section 2: "No source describes an entrance animation or entry pose at the start of an FFX-2 battle"), so the look is ours in both and Bailey's pick, not fidelity. Everything per-game is in the figure
table. The Save Sphere card, the camera plans and every boss number are untouched; `PaintedActor.ts` is untouched.

## What was wrong, found by running the game (headless GPU Chromium, a per-frame log of every stage figure)

Every enemy and aeon `PaintedStage.stage` builds (the first formation, and every link of a chain, which re-stages the field) is on the canvas at full strength from the frame it is built. What the continuity probe then sees
is a scene re-sizing the figure in ONE frame: Overdrive Sin is built small at its slot and the head's painting is loaded and placed 380 ms (dev server) to 1.7 s (the live site, slowed) later (scale 1 to 3.471, place to
(11.05, 2.57, -30): round 25's 341.8 px); CHAPTER FRAMING's giant plan lands Paragon's size 1.4 s after he is built (1 to 3.047: 355.4 px) and Anima's 0.6 to 0.7 s after the Save Sphere's swap (1 to 2.824: 967.7 px,
under the wash, which the canvas copy does not show). The Left Fin has the same step (the airship director's range placement, 1.656 to 3.85, 0.9 s after it is built). Under the battle-start card and the wash the player
does not see these; the probe does, and a player never sees an entrance at all, because the boss is simply there when the card lifts.

## What changed

- `src/engine/entrance/entranceLook.ts` (pure): the timing, the sweep, the motes. The options page's E-PYRE is the game's own pyrefly dissolve run backwards (the figure built from the head down behind the gold burn
  edge) over 900 ms (54 frames at 60 fps). E-FADE 300 ms; REDUCE MOTION a plain 200 ms fade (observed in the real game with `prefers-reduced-motion`: kind `reduced`, 200 ms, no motes, no dissolve); LOW EFFECTS keeps the sweep
  and drops the motes (as the death's erosion at that tier); the phone tier releases 0.6 of them.
- `src/engine/entrance/entranceCanon.ts` (pure): who gathers and who fades (below), and whose scene stages its own entrance.
- `src/engine/entrance/StageEntrances.ts`: the seam. `hold` (called by `PaintedStage.add` for an enemy or aeon built inside `stage()`, before it can be drawn): alpha 0.004, dissolve up, the death's release muted for it. Alpha 0.004
  is under every "is it showing" line (the probe's and the art governor's 0.02) and over the plane's own invisibility (0.001), so the figure is not on the field to the player or the harness, and its meshes, painting and shader stay
  warm (nothing is built or uploaded on the frame the gather starts). Whatever a scene does to its size and place while it is held is unseen. `enter` (called by `BattleMoments.battleStart`, nothing awaits it) plays each
  held figure once it has stood still: 300 ms with no change of scale or place and 900 ms since it was built, or 1.6 s after the opening began, whichever is first (so a plan that lands late is not played over; the Anima seam's
  plan lands about 0.6 s after the swap (live: built at 358 ms, planned at 1025 ms), the Fin's 0.9 s). A hurried or skipped opening shows the figures at once; an ordinary opening's end lets an entrance still playing finish beside the first menu; a watchdog on the stage's
  own clock lets in a figure held 30 s. The gather's motes are the stage's own (`PyreflyStage.emitter`), spawned in the air round the figure and flown INTO the burn edge (a death's mote rises away: the page's own risk,
  "an arrival and a death could read alike").
- `PyreflyStage.hush` and `tracks`; two optional `BattleStage` methods (`enter`, `settleEntrances`); `PaintedStage.setEntrances` (off by default); `BattleScreen` turns it on for a real FFX or FFX-2 fight (a preview, which has no
  opening to let a figure in, and FF7, which is not Spira, keep today's behaviour). `tests/unit/battle-screen-teardown.test.ts`'s stage mock gains `setEntrances`.

### Where the build differs from the page's raw reversal, and why (Bailey's pick approves the page's look; these are mine, small, and reversible)

1. The sweep runs on a 1.5 power (`1 - p^1.5`) where the page ran `quadInOut`. In a scene whose grade crushes a figure that is not drawn true (`figureTrue.ts`: a dissolving figure is graded like the scene, a whole
   one shows its own colour; Overdrive Sin's deck) the page's curve left the painting a near-black silhouette for the last 350 ms and then stepped it back to its own colour (the page's note calls it "the game's own burn edge").
   Measured on the head's canvas luma: 270 ms at 34 (nothing but the eye lit) then 34 to 95 in a frame; now about 100 ms, bridged by 2. The 900 ms and the slow first moments (the pyreflies are seen before the painting) are kept.
2. The figure's own opacity (and so its shadow and ring) comes up in the first 110 ms; the painting itself comes up through the sweep.
3. A short gold flash (`PaintedActor.flash`, 260 ms) lands on the frame the dissolve reaches 0, so the figure's brightness stepping back to itself reads as a beat. REDUCE FLASHES leaves it out.
4. The motes are drawn larger the farther the figure is (Overdrive Sin's head is painted at depth -30 and a mote at the stage's size is a speck there): `distance / 14`, at most 4 times.
In scenes without that grade (Paragon's Cloister, Anima's Road) there is no dark phase at all, and the gather reads as the page's frames do.

## Which figures, and the body rule (research section 3)

Run, not grepped: `tests/unit/entrance-census.test.ts` plays every chapter (the 18 on the board and the three hidden ones; FF7's Guard Scorpion is not Spira) to its end through the REAL engines, `BattlePresenter`, chain loop
and `PaintedStage`, twice (the stage as it was, and as it is) on a virtual clock. **89 figures in 21 chapters (FFX 54, FFX-2 35)**: before, every one is whole on its first frame; after, every one is held, let in by the entrance
below, and whole at its link's first menu. The first menu comes at exactly the same virtual time with and without it, in all 21 chapters. The rows (link, then figures; "(fade)" is E-FADE):

| Game | Ch | Chapter | Figures |
|---|---|---|---|
| FFX | I | `seymour-flux` | seymour-flux, mortiorchis |
| FFX | II | `yunalesca` | yunalesca |
| FFX | III | `braskas-final-aeon` | link 1: braskas-final-aeon, yu-pagoda-left, yu-pagoda-right; link 2: possessed-valefor, yu-pagoda-left, yu-pagoda-right; link 3: possessed-ifrit, yu-pagoda-left, yu-pagoda-right; link 4: possessed-ixion, yu-pagoda-left, yu-pagoda-right; link 5: possessed-shiva, yu-pagoda-left, yu-pagoda-right; link 6: possessed-bahamut, yu-pagoda-left, yu-pagoda-right; link 7: yu-yevon, yu-pagoda-left, yu-pagoda-right |
| FFX-2 | IV | `ffx2-bahamut` | bahamut |
| FFX-2 | V | `ffx2-vegnagun-shuyin` | link 1: vegnagun-tail (fade); link 2: vegnagun-leg (fade); link 3: vegnagun-body (fade); link 4: vegnagun-head (fade); link 5: shuyin |
| FFX-2 | VI | `ffx2-leblanc` | link 1: ormi-entrance (fade), dr-goon (fade), fem-goon (fade); link 2: logos-room (fade), ormi-logos-room (fade); link 3: leblanc (fade), logos (fade), ormi (fade) |
| FFX | VII | `seymour-anima-macalania` | guado-guardian-a (fade), seymour-macalania (fade), guado-guardian-b (fade) |
| FFX | VIII | `evrae-airship` | evrae, cid (fade) |
| FFX | IX | `yojimbo-cavern` | ginnem |
| FFX | X | `seymour-natus` | seymour-natus, mortibody |
| FFX-2 | XI | `ffx2-fallen-aeons` | link 1: x2-shiva; link 2: sandy, cindy, mindy; link 3: x2-anima |
| FFX | XII | `seymour-omnis` | seymour-omnis |
| FFX-2 | XIII | `ffx2-trema` | link 1: paragon; link 2: trema |
| FFX | XIV | `isaaru-via-purifico` | link 1: isaaru, grothia; link 2: isaaru, pterya; link 3: isaaru, spathi |
| FFX-2 | XV | `ffx2-den-of-woe` | link 1: shade-baralai; link 2: shade-gippal; link 3: shade-nooj |
| FFX-2 | XVI | `ffx2-ixion-djose` | x2-ixion |
| FFX | XVII | `sin-fins-core` | link 1: left-fin, cid (fade); link 2: right-fin, cid (fade); link 3: sinspawn-genais, sin-core |
| FFX | XVIII | `sin-face` | overdrive-sin |
| FFX-2 | (hidden: Leblanc preview) | `exp-leblanc` | link 1: ormi-entrance (fade), dr-goon (fade), fem-goon (fade); link 2: logos-room (fade), ormi-logos-room (fade); link 3: leblanc (fade), logos (fade), ormi (fade) |
| FFX-2 | (hidden: the Experiment) | `ffx2-masterpiece-theatre` | link 1: x2-experiment-prototype; link 2: x2-experiment |
| FFX | (hidden: Sinspawn Gui) | `sinspawn-gui` | link 1: sinspawn-gui, sinspawn-gui-head, sinspawn-gui-arm-left, sinspawn-gui-arm-right; link 2: sinspawn-gui-2, sinspawn-gui-head, sinspawn-gui-arm-left, sinspawn-gui-arm-right |

Not entrances: Yojimbo and Daigoro (Chapter IX) are left to their scene's own night-sakura arrival (D-072: it holds them off the field until the opening shot and fades them in over the petals; a second entrance would set their
opacity against its own every frame); Vegnagun's seven Nodes, Bulwarks and Redoubts and Seymour Omnis's four discs are figure-less parts on their parent's painting (`PartAnchors.ts`) with nothing to bring in; what the presenter
adds itself (a summon, a switch-in, a mid-fight reveal such as Macalania's Anima) already fades in (620 and 520 ms) and is unchanged, before and after, in the census.

**The body rule** (`entranceCanon.ts`, from section 3.1 and 3.2 and the departures table): fiends, the unsent and aeons are made of pyreflies and gather; machina "are not spirits. No pyreflies" and living humans "lose and the
scene continues. Nothing dissolves", so they take E-FADE. The way in follows the way out: the figures the departures table sends off by `yields` or `body` (Leblanc, Logos, Ormi, the Guado Guardians, the living Seymour), the goons
(`NEVER_PYREFLIES`), Cid (never drawn) and Vegnagun with its parts fade. Everyone else gathers, including Paragon, Trema, Evrae, Mortiorchis, the Sin of both chapters and every aeon. It is the combatant that decides, never the
room: the Fahrenheit's deck has "Open sky. Nothing pyrefly-like" for its air (`pyreflyCanon.ts`) and Overdrive Sin gathers there all the same, because the pyreflies are his body (as the stage releases a dissolving fiend's whatever
the scene's verdict; Bailey's pick was made on Sin on that deck).

**Fell back to E-FADE: where and why.** For reading: nowhere (the gather reads in all three scenes proved below, with the one dark phase in Sin's scene mitigated as above). By lore: 26 of the 89 (FFX: the two Guado
Guardians, the living Seymour, Cid x3; FFX-2: Chapter VI's Syndicate and its hidden twin 16, Vegnagun's four links). By setting: every figure under REDUCE MOTION (200 ms).

## Added time before the first menu: none

The entrance plays inside the opening (the party's slide 520 ms, the hold 240 ms, the reveal's 1.5 s push: about 2.3 s at normal speed) and nothing waits for it: `battleStart` calls `enter` and never awaits it
(`tests/unit/entrance-opening.test.ts` hands it a promise that never settles); a hurried opening (a Confirm press) and a skipped one show the figures at once. Three proofs: (1) the census: the first menu's time after its link began
is identical with and without the entrances in all 21 chapters (the virtual clock moves only by the presenter's own waits and the camera and party moves it asks for); (2) the browser, FFX Chapter XVIII, seed 1, the live site against
this build: opening to first menu **8083 ms live, 8066 ms here**, and the gather ran 1983 to 2883 ms inside it (the menu came 7.2 s after the figure was whole); (3) the page stated 900 ms and the gather is 883 to 900 ms.

## Measured, before and after (the real `PaintedActor`, the harness's own `figureTrack` and `detectJerks` at `critic/policy.json`'s thresholds, 60 fps; `tests/unit/engine/entrance-jerk.test.ts`)

The pop is what the running game does (the constants above, from the probes); the camera is a camera that holds the placed figure (Overdrive Sin's is the Fahrenheit deck's own FAR `idle` rig, which the head's framing was
cast from); the paintings' own alpha through the harness's `decodeMask`. "Before": the figure on the canvas through the one-frame step. "After": held through the same step (alpha under 0.02, which the probe does not record: no
frame), let in 2.5 s later by the gather. Two readings, because the harness reads planes and not pixels, and **no "staged arrival" flag was added to it** (the definition of a jerk is Bailey's):

| | before: biggest single-frame step of the tracked figure | after: the PLANE track (what the probe records) | after: the EYE track (the centroid of what the sweep has revealed so far, once 2 percent is) | the round's own reading |
|---|---|---|---|---|
| Overdrive Sin (FFX, XVIII) | **391.3 px**, 1 jerk | **0 px**, 0 jerks | 14.6 px, 0 jerks | 341.8 px |
| Paragon (FFX-2, XIII) | **254.5 px**, 1 jerk | **0 px**, 0 jerks | 11.3 px, 0 jerks | 355.4 px |
| Anima (FFX-2, XI link 3) | **176.2 px**, 1 jerk | **0 px**, 0 jerks | 13.3 px, 0 jerks | 967.7 px |

The jerk line is 40 px. The plane never steps because the figure is held through the step and then does not move on its plane; the eye reading is the sweep itself, from the head down, at most 15 px a frame. (The eye reading
without the 2 percent rule fires once for Paragon at the sweep's very first frames, where the revealed shape is a few horn tips and its centroid moves as the back comes in: a centroid of dust, not a reading.)
The before numbers are this test's camera (the strips' camera is not on record); Sin's, from its own rig, is within the round's ballpark.

## Browser proof (`docs/screenshots/r44-entrance/`, with its README)

Before (the live site, build a061e9dc) and after strips of each of the three, 8 frames each, and one clip of Paragon: `sin-before.jpg`, `sin-after.jpg`, `paragon-before.jpg`, `paragon-after.jpg`, `anima-before.jpg`,
`anima-after.jpg`, `paragon-entrance.mp4` (2.7 s, 0.7 MB). The live runs show the pops as the harness saw them (Sin: 1 to 3.471 at 1.67 s; Paragon: 1 to 3.047 at 333 ms; Anima: built at 358 ms, 1 to 2.824 at 1.02 s, under the
wash); the runs here show the same figures held (alpha 0.004, dissolve 1) through the same steps and gathering when the opening begins: Anima's at the card's end at her final size, 2.3 s after the swap.

## Not done, and questions

1. **No gather sound.** The page said "plus a gather sound you would audition, since none exists": none was built (agents cannot hear, rule 13; nothing in the brief). The entrance is silent apart from what the opening already plays.
2. **It is a new visible beat in every fight** (the opening: the party slides on, the boss gathers, the reveal pushes in), where today the boss is simply there when the card lifts. That is what 61e asks for ("bosses and aeons"),
   and the table is every figure the stage builds; if Bailey wants it on the headline bosses only, `entranceCanon.ts` is where the list goes.
3. **The four small differences from the page's raw reversal** (above) are mine. If he wants the page's exact `quadInOut`, it is one constant (`GATHER_CURVE`; the quad curve is `1 - Easing.quadInOut(p)`); the near-black tail
   in Sin's scene comes back with it.
4. **Chapter IX's Ginnem gathers** at the opening while Yojimbo and Daigoro's sakura arrival waits for the opening shot beside it: not seen together in a browser run here (the Chapter IX scene was not run).
5. The live critic's continuity harness has not been re-run on this build; the unit numbers above are the harness's own functions on the real actor. A candidate review should see no entrance jerk in Chapters XI, XIII and XVIII,
   and the Left Fin's 0.9 s range placement (Chapter XVII) is held too.
6. The full unit suite (`npx`-free, `vitest run --maxWorkers=2`, on this branch's first commit plus the teardown mock): 1127 files and 17,645 tests passed, 1 failed: `advisor-floor.test.ts` "holds across 12. Seymour Omnis",
   a 15 s timeout while the machine was also running browsers and other lanes; alone it passes (22 of 22, 67 s). The one real failure the change caused, `battle-screen-teardown`'s stage mock lacking `setEntrances`, is fixed in the first commit.

## For the release notes (both games)

"Bosses and aeons now arrive as pyreflies gathering instead of appearing whole in a single frame: at the start of every fight and every link, the figure is built unseen and the opening lets it in, the painting coming up from
the head down behind a gold edge while pyreflies stream in from the air around it (a plain fade for living people and machines; a short fade with Reduce Motion). Nothing waits for it: the first menu comes at the same time as
before."

## Suggested ledger text (not edited here)

- Action row: r44-entrance: E-PYRE built (decision 61e): the stage holds each enemy and aeon it builds and the opening lets it in by pyreflies gathering (E-FADE for people and machines, 200 ms fade under REDUCE MOTION); 89
  figures in 21 chapters from a census of the real engines and presenter; 75 new tests; added time before the first menu 0 ms (8083 ms live, 8066 ms here, FFX Chapter XVIII, seed 1). Evidence: this note, `tests/unit/entrance-census.test.ts`,
  `tests/unit/engine/entrance-jerk.test.ts`, `docs/screenshots/r44-entrance/`. Game case: both.
- PR-0380: the three entrances (Anima 967.7 px, Overdrive Sin 341.8 px, Paragon 355.4 px) are expected to read 0 px on the next harness run (the figure is not recorded until the gather starts, then does not move on its plane);
  to be confirmed on a candidate. The other PR-0380 items (pose swaps, run-ins, Bahamut's 1.5 times, Yuna's Chapter XV swap, lunges) are not this lane's.
