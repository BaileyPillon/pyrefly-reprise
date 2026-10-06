# r392-boss-scale: paper preflight (critic-plan class DEEP after deploy)

Branch `r392-boss-scale`, from `origin/main` 9c690231 (code identical to the live 39.1 build d3fe9fe5). Written before the review, in the 5-to-10-minute form AGENTS.md rule 15 asks
for. The class is DEEP because 41 substantial checkpoints sit since the last deep review (`node tools/critic-plan.mjs --paths src/engine/fx/mix/...`), not because the branch touches
the save-data class (it does not). Lane: CHAPTER FRAMING's BOSS SCALE, from Bailey's question "Yojimbo looks huge compared to the party. Are the proportions accurate?" and his pick of
2026-10-06, "About 1.15x the party (Recommended)", held until a real FFX screenshot settles it.

## What the change can break, and how it was made to fail soft

| Change | Game case | What could go wrong | Guard |
|---|---|---|---|
| Yojimbo's BOSS SCALE target 2.2 -> 1.15, held (`masters.ts` `scaleTarget`, `scaleHeld`): full target in every plan, on today's rig as well as under the master, read from the painted box through today's camera | FFX only (Chapter IX) | He reads a few percent off 1.15 under another camera; a smaller boss changes the colossus master's fit (the camera moves for it) | The reading is the picture's, not a distance (`Staging.planScale` `view`): 1.15 exactly at today's rig, within 1.4 percent under the master; measured by real keys at three sizes; the master and the HUD clearance are unchanged and still answer for the camera |
| A boss is sized once per phase of a link (`scaleLock.ts`, `framing.ts`): the factor the first plan put on it is kept; every later plan plays it and the fit moves the camera | both (shared plumbing; it reaches FFX-2's Bahamut and FFX's Natus, Braska's Final Aeon, Evrae) | A later menu the colossus master cannot clear at that size gets today's rig at that size (the party a little more under a panel than a smaller boss would allow); a lock that outlives its phase | The colossus master is tried again at the phase's step after any plan that fell back to today's rig (`stepOf`); a phase ends when the sized bosses, today's resting rig (Evrae's range) or the layout change (`scaleKey`); the first plan is untouched (a test pins `planScale` against the old method over 200 random scenes), so every first-menu size is the 39.1 build's except Yojimbo's |
| A held boss takes its size before the first plan lands (`holdEarly`) | FFX only (only Yojimbo is held) | A pop when the plan lands; a size left on with CHAPTER FRAMING off or on the phone | The plan plays the size already there (the lock the early hold sets); released when the framing is switched off before the plan, and never applied on the upright phone or with the part off (tests) |
| Today's rig is held to the colossus gate (no member inside the boss, the Sensor card off him) when it plays a size the phase holds (`framing.ts`) | both (shared plumbing) | A different candidate wins at a menu in a locked phase | Only a locked or held size triggers it, so no first plan changes (today's rig is exempt because it draws the stage's own boss; with a larger boss that no longer holds): measured on the Bahamut stand-in, where a girl leaning into the boss kept the master over today's rig at the same size at every step |
| The phase key carries TEXT SIZE and whether the table pins the master (`scaleLock.ts` `phaseLayout`) | FFX (Natus's pin) and both for TEXT SIZE | A size set under Natus's pin outliving the pin (TEXT SIZE 115 plays today's search) | A different pin state or text size is a new phase: the next plan searches as it did on the 39.1 build |

## Not changed, with the reason

The upright phone keeps today's rig and its own fit (`framing.ts` has never applied BOSS SCALE there): Yojimbo reads 1.0 times the party on the phone. The Zanmato gauge card over him on the
phone is a layout question with a picture to approve (rule 9): frames and options in the handoff, nothing built. Evrae's PULL BACK and CLOSE IN and Sin's own phases re-size those bosses
by the scene, not by the framing; they are different phases and are reported, not touched. The colossus master, the HUD clearance, the pinned Natus master and every first plan are as before.

## Review order for the deep round

1. Chapter IX at 1600x900, 2560x1440 and 1280x720: Yojimbo at every command menu of the first two rounds (`docs/screenshots/r392-boss-scale/`).
2. Chapter IV (FFX-2 Bahamut): the same sequence; the girls against the boss at menus 4 to 7 (the control run's fallback).
3. Natus, Braska's Final Aeon, Evrae, Vegnagun, Sin: the sizes are the 39.1 build's (first plan unchanged), steady between menus except where the scene itself re-sizes them.
