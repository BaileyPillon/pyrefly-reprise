# Paper preflight: r38-motion (SKILL TRAVEL for both games, RUN-IN for FFX-2 only)

Track `r38-motion`, branch `r38-motion` (from main 4b7adea6), 2026-10-03. Bailey, ~14:42 EDT, answering the Visual Options
page: "I'll go with all your recommendations thank you <3" (D-354: M1 run-in for FFX-2, sourced; M3 skill travel for both games
once the damage numeral waits for the landing; M1 for FFX held; M2 skipped). Deep-class paper preflight (AGENTS.md rule 15):
`node tools/critic-plan.mjs --paths <the changed files>` says **DEEP**, focused review of the production candidate before a
deploy, live verification and the deep review on the live build after it; both games; checks CHK-002, 003, 006, 008, 009, 010, 011,
013 to 017, 020 to 023; targets fight, pause, phone, presentation. **Not the save-data class**: no setting, no save key, no
`SaveData.ts` change (the two looks are sub-effects of BATTLE SPECTACLE for captures only).

**Honesty about timing.** This plan was written with the build, after the first browser pass, not before it: the prototype
(`opt-motion`) and D-354 had already fixed what to build, and the first pass found two design faults that changed it (section 5).

## 1. What is built

| Look | Game | What it does |
|---|---|---|
| SKILL TRAVEL | both | an `orb` (a spell, lifted arc), a `tracer` (a long-range shot) or a `beam` (Darkness) leaves the caster at the action's first blow and lands with an impact frame (starburst, ring, no full-screen wash); the damage numeral and the HP rows wait for it |
| RUN-IN | FFX-2 only | a short-range girl's plain Attack: she runs to the target along an arc, strikes, runs home; camera truck; smear |

Both sit under BATTLE SPECTACLE (`eyeCandyOn('battleSpectacle')` and the stage's spectacle port), no new setting, no save key.
REDUCE MOTION plays today's version. In FFX-2 nothing plays over an open command menu.

## 2. Game case (rule 14)

- **SKILL TRAVEL: both, ours.** The sources say nothing about spell travel in either game. One rule, two skins: FFX gold and round
  motes, FFX-2 pink and four-point sparkles, drawn larger in FFX-2's wider frame (`research/ffx-vs-ffx2-presentation.md` section 9 row 2;
  `spellfx/effects-shared.ts` `accentOf`). The tracer is for FFX-2's long-range dresspheres only (sourced flag); FFX has no ranged
  physical flag in its data, so an FFX physical blow flies nothing.
- **RUN-IN: FFX-2 only, sourced.** `research/ffx2-combat-core.md` line 264 ("a character standing far away spends ~2 s running in ...
  model an approach time proportional to distance for `short range` abilities, and zero approach time for `long range`") and line 266
  (Gunner, Lady Luck, Alchemist, Trainer and Gun Mage fire from their starting position). **FFX: none**, `[absence]` in
  `research/battle-camera-perspectives.md` A.2, and Bailey held it for his own yes. The run's length and arc are ours.

## 3. Rules kept

1. **Layering (rule 1).** The presenter side (`motion/MotionGate.ts`, `SkillTravel.ts`, `StageMotionPort.ts`, `StandOff.ts`, the beats)
   imports no `three` and no DOM. The drawing is in the spell layer (`spellfx/FlightFx.ts`, pure data into the existing draw list) and in
   `motion/StageMotion.ts` (`three`). Determinism: nothing reads or draws a random number that the engines see.
2. **No retail assets, no new texture, no new program.** The shot is atlas tiles the spell effects already use. The smear copies the figure's own
   painted plane with the actor's own vertex shader and a plain fragment; it never touches the figure's shader or geometry, so
   LIVING PAINTINGS' sway and cast shadow keep working.
3. **Never invent game data (rule 6).** Long range comes from the dressphere table; ability shape from the ability rows; every distance and
   time is labelled ours.
4. **Shared contracts additive (rule 2).** No file listed in `docs/CONTRACTS.md` is touched. New members are optional on
   `ActionMotionPort` (`strike`, `lungeFor`, `longRange`; `MotionCtx.still`), `VfxPort` (`travel`, `canTravel`, `markIn`) and `BattleStage` (`motion`).
5. **Line budget (rule 7).** Every new file is under 400 lines (the longest, `FlightFx.ts`, is 255); `BattleCamera.ts` is shorter than before
   (394, was 399) and `SpellFxLayer.ts` is at 392; the four files that were already over budget (`BattlePresenter.ts`, `BattlePresenterEvents.ts`,
   `BattlePresenterPorts.ts`, `BattlePresenterStage.ts`) gain wiring only (+13, +5, +19 and +30 lines).

## 4. The numeral hold, the one change to the loop

Both HUDs raise a blow's numeral and move its HP row *before* the blow's beat plays, so today a spell's number appears 0.42 s before its
bolt (measured: Thunder, numeral at the beat's start, the strike at its mark 420 ms later). The B1 effects hold the *presenter's own* numeral until
the mark, but FFX and FFX-2 draw theirs from the HUD. For a blow whose action sends a shot the loop skips the early HUD look and the early HP
rows (`blowHeld`), and the blow's beat shows both (`revealBlow`) once the shot has landed and the effect's own clock has drawn its strike
(`VfxPort.markIn`, the same idea as FF7's `pendingLand`). Everything else, and every blow with no shot, is byte for byte today's order.

## 5. What the first browser pass found (so the design changed)

- **A shot launched at `action-start` is wrong for FFX-2.** There `action-start` is the start of the CTIM charge and other girls' whole actions play
  before the damage lands (the trace of Rikku's Darkness holds Yuna's and Paine's moves): the shot would land 1 to 2 s before its numeral. It leaves
  at the action's first blow instead, sized to land just before the spell's own first mark, so it rides the wait the spell already has (Thunder stays 2.02 s).
- **The prototype's stand-off hid the runner.** The party stands in the lower left and the fiend is 4 to 17 world units deeper; a run at the fiend's
  plane is a run into the picture, and the camera truck followed her world-x (to the left). Paine ended behind Rikku. The stand-off is now a search
  over lanes and stops scored on what the picture shows, with the fiend's width read from its painting (section 5 of the handoff has the per-chapter table).

## 6. Risks and how they are checked

| Risk | Check |
|---|---|
| A held blow's numeral is lost or doubled | `revealBlow` is idempotent per event and the loop calls it again after the beat; unit tests count one `onEvent` per blow; the browser pass counts DOM numerals |
| ATB overlap credits a blow to the wrong action | a blow belongs to a plan only by its own `sourceId`; a cost or tick (no `sourceId`) belongs to none; unit test with an overlapping Yuna action |
| The FFX-2 menu rule | gate asked at the first blow and at the run's start and home; unit tests; a real-key session in Chapter IV (Wait mode) counts flights and runs under an open menu and with none |
| FF7 changes | `actionEnd(ctx, endedId)` re-keys the run home by the figure whose action ended; FF7's port is closed by the same id in a sequential fight; the hidden Guard Scorpion fight was played on the base and on the branch with identical events, port calls and outcome |
| REDUCE MOTION, skip, LOW EFFECTS | presenter gate plus the layer's `low` tier; browser run under the OS preference; unit tests |
| Frame cost | a vsync-free pass (`--disable-gpu-vsync --disable-frame-rate-limit`) over the move windows, today against the looks |
| The first run of a session hitches (the smear's shader program compiles when its first afterimage is drawn) | `hitch.mjs`: fresh sessions with the look on; 26 to 41 ms in 3 of 6 before, none in 14 after `StageMotion.warm` (one invisible afterimage in the opening, FFX-2 only); three unit tests |
| The fight gets longer | per-move and whole-fight timing, today against the looks, in every FFX-2 chapter (handoff section 4) |

## 7. Not built, and why

- **M1 for FFX**: no source (D-354 holds it for Bailey's own yes). **M2** (part motion): skipped by D-354.
- **A shot for a pure status spell**: it has no blow, so no release; today's look.
- **FFX physical shots** (Wakka's ball): no ranged flag in FFX's data.
- **A painted run key per girl** (the prototype's art suggestion): its own options round.
