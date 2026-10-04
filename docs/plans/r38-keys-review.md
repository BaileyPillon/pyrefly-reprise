# r38-keys: paper preflight (critic-plan class DEEP after deploy, focused review before)

Two asks Bailey adopted on 2026-10-03 (D-355 and D-357, "I'll go with all your recommendations thank you <3"), one branch `r38-keys`
from `origin/main` (`a6b79313`). **Game case: FFX only.** The telegraph hold names two FFX bosses (Seymour Flux, Chapter I; Braska's
Final Aeon, Chapter III) and their FFX move ids; the family alias names two FFX families (Lulu's `<spell>-fury`, 19 ids; Rikku's
`mix-*`, 43 ids) and no FFX-2 or FF7 ability id matches either (pinned by `tests/unit/engine/r38-telegraph-hold.test.ts`, which
walks the three ability registries). The hook in `BattlePresenterBeats.actionStart` is shared plumbing (CHK-020 classes it "both"
for the plan), but no FFX-2 or FF7 id reaches it: the table is keyed by combatant id and the module also refuses an FFX-2 framing and
FF7's runner. Not the save-data class (no `SaveData.ts`, no schema, no settings key).

Written alongside the build, not before it: the brief put the design first (the `preview-picks` prototype). Every row below was then
checked by running.

## What changes, and what could go wrong

| Change | Failure it could cause | How it is bounded |
|---|---|---|
| `TelegraphHold.ts`: at the `action-start` of Lance of Atrophy (`seymour-flux`) and Ultimate Jecht Shot (`braskas-final-aeon`) the boss puts its `telegraph` painting up through `KeySlots.telegraphUp` and waits 950 ms | An added wait that moves the fight's rhythm; a hold on a move that should not have one; a stuck pose or heartbeat vignette; **a second, hidden wait** | A table of two (boss id, move id) rows, nothing else holds (Omnis is not in it); `ctx.sleep` scales with the speed and the pacing option like every beat (none at `skip`); the next pose swap (`attack`) replaces the painting and `action-end` returns the boss to idle; the zoom and heartbeat that play under the hold are closed when it ends (`telegraphEnd`). Found by measuring: left open until the move's end, `BattleMoments.actionClose` awaits their camera release (0.74 s at the default pacing; the move's `action-end` played 991 ms against today's 249, and REDUCE MOTION, which never opens them, ran 0.74 s faster per move than normal), so the hold cost about 1.9 s. Now the cost is the hold alone in both motion modes (`action-end` 241 ms) |
| It reads nothing but ports (`ctx.stage.paints`, `fx.enabled`, `sideOf`, `moments`) | A change to the engine log or the RNG | No `three`, no DOM, no engine state, no RNG; the engine's battle log is byte-identical in all 40 Node fights (seeds 1 to 20, both chapters, four configurations) and in the browser runs |
| No painting, or BATTLE SPECTACLE off, or FFX-2 / FF7: the move is today's | A visible or timing change nobody asked for | `telegraphUp` answers null before anything is set; the new tests compare the full ordered list of pose swaps, glows, moments and waits with and without the painting and require the painted run to be a pure prefix of it |
| REDUCE MOTION: the same pause, a single cut, no glow, no zoom, no heartbeat | A rhythm that differs between settings, or a warning that disappears | The project's own rule (`ComfortCamera.ts`: "no moment waits a different time"; `pace.ts`: "REDUCE MOTION never shortens these") is followed: same 950 ms authored wait, `immediate` swap, none of the motion layers (decision and proof in the handoff) |
| `odFamilyOf` in `KeySlots.ts`: a move's own `od-<id>` first, then `od-fury` (19 Lulu ids) / `od-mix` (43 Rikku ids) | A family painting shown for a move that is not in it; another figure borrowing it | The families are regexes that match exactly those 62 ids across all three registries; the painting is looked up on the acting figure only; with no `od-fury` / `od-mix` painting installed nothing changes (the unit tests) |

## What is not touched

The engine, the seeded RNG, every number, the CTB order, the `charge` beat and the r37 telegraph slot as they are, FFX-2's menu rule
(`FFX2_SUPPRESS_WHILE_MENU`), the camera code, the HUD, `BattlePresenterEvents.ts` (already over 400 lines), the art on disk
(`public/art` is read-only here; the candidate paintings play through a dev-only overlay in a scratch folder).

## Review asks (focused before deploy, deep after)

1. Chapter I seed 1 and Chapter III link 1: with the three paintings installed, Flux's Lance and Braska's Ultimate Jecht Shot hold the
   painting about 1.14 s at the default pacing (950 ms authored) and then strike; without them the moves are today's, and the
   autopilot digests do not move.
2. REDUCE MOTION: the painting is a single cut (crossfade 1), no vignette, the same pause.
3. A 390x844 phone frame: the painting fits and reads.
4. CHK-020/021: the case is written (FFX only; the hook is shared plumbing no other game's id reaches) in the handoff and the commits.
