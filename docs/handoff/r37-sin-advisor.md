# Handoff: r37-sin-advisor (PR-0261 the route harness, PR-0269 the Sin advisor)

Branch `r37-sin-advisor` (worktree `D:/pyrefly-r29-harness`), from `origin/main` c69de96a. Pushed, not merged, not deployed.
2026-10-03, overnight batch, ADVISOR + HARNESS lane. Paper preflight: [docs/plans/r37-sin-advisor-review.md](../plans/r37-sin-advisor-review.md).

**Game case (AGENTS.md rule 14).** PR-0261 is **both** (shared critic tooling); the two overlays it types, Bushido
(Auron) and Swordplay (Tidus), are **FFX only**. PR-0269 is **FFX only** (Chapters XVII and XVIII; the files only the
FFX Sin tactics import). Nothing here touches an FFX-2 board.

**critic-plan class:** `node tools/critic-plan.mjs --paths <the changed files>` says `review: DEEP`, before deploy
FOCUSED, after deploy live verification then the DEEP review (this build owes it); systems "move advisor and enemy
intent"; 3 shipped files, 7 with no product effect. **Not the save-data class** (no `SaveData.ts`, no schema or
settings persistence), so there is no `r37-sin-advisor-savedata` branch.

## Items

| Key | Game | What changed | Proof | Left |
|---|---|---|---|---|
| **PR-0261** route harness | both (overlays FFX only) | `critic/runner/lib/route-minigame.mjs` (new): Bushido typed chip by chip from the glyphs on screen, Swordplay pressed when the marker, carried forward by the key's travel time, is in the gold zone; `route-pure.mjs#deriveOutcome`: the end of a route from the results screen's words, then the screen and the LAST link's event, and "stalled at link N, phase"; `route-scene.mjs#watchThenTap`: the post-results scene is watched with no input, then tapped, never held | `tests/unit/critic-route-harness.test.ts` 24 cases (12 new); real-key wins below; a 20 s budget run records `stalled at link 1, command:tidus` | see "Not done" |
| **PR-0269** Sin advisor | FFX only | XVII tactic gets the sensible line's race priorities (below); XVIII unchanged | table below | the Genais Sigh wipes on link 3 |

### PR-0261, what the three defects were and how each is closed

1. **Every Overdrive was confirmed with Enter after 3 s** (0 correct Bushido inputs, a Swordplay press at a random
   spot), which "understates what a human does" and made every Auron or Tidus Overdrive a floor. Now
   `route-minigame.mjs#playMinigame` reads the overlay (`.ffx-mg.ig-minigame`, its `data-role` parts), and each play is in
   `run.json.minigames` with the chips, the keys, where the marker was at every Enter against the zone (`pressLog`, `inZone`)
   and the outcome the engine received (`engine.extra`, read off the `action-start` event). The circle is `x`, never Escape
   (Escape opens the pause; `tests/unit/critic-route-harness.test.ts` also reads the key table against `AuronSequence.ts`'s own
   `GLYPH` table so the two cannot drift). Every other overlay (reels, fury, Mix, the pickers) keeps the old handling.
2. **`closeFight` took the first `victory` event in the log** (a chain logs one per link; the log read at the results
   screen holds none), so a stalled chain read "victory" with `fails: []`. `deriveOutcome` reads the results screen's words
   first; a fight loop that ended with the battle screen still up is `stalled`, with the link and playback phase it stopped in
   (`run.json.stalledAt`, a `fails` entry, `rec.lastChain`); a victory event counts only on the last link. Demo (a 20 s
   budget on Chapter XVIII, `run-stall-demo-sin-face-budget-20s.json`): `outcome: stalled`, "stalled at link 1,
   command:tidus". That demo shows the budget path; the other path (a chain that never reaches the next link) is the unit
   case "stalled at link 2, moment:battle-start". The original stall route (Den of Woe) was not re-run: it needs an FFX-2
   build that stalls, which the current main may no longer do.
3. **A 4 s Enter hold after the results fast-forwarded the post scene** (hold-to-skip is 550 ms), which produced round
   19's refuted "scene runs with no input" major. `route-scene.mjs#watchThenTap` watches 6 s with no input first and records
   whether the scene moved by itself (`run.json.post.scene.watch`), then advances with one Enter at a time. Both real-key runs
   below: the scene did not advance by itself (1 show in 6.1 s), and ended after 7 and 6 taps, 0 holds. The scene after CONFIRM
   uses the same reader (`run.json.afterConfirmScenes`).

### PR-0269, the cause and the fix (measured, nothing tuned)

The move advisor's card plays the shipped tactic as its top row (`advisor.ts` keeps the line on top unless a challenger proves
`saves-from-lethal`), so what the card did on Chapter XVII is what `src/engine/tactics/sin-fins-core.ts` said. Histograms of the
card chain against the sensible bench line (`tests/unit/helpers/sinFinsPolicies.ts`), seeds 1 to 20: Close in 167 and Pull back
154 times against 36 and 36; Al Bhed Potions 160 against 0, Hi-Potions 256 against 0; Pray 116 on link 2 against 0 on the sensible line; the front
row never changed on link 3 (the bare tactic: Lulu's Firaga 0 against 58 on the sensible line). The line walked the ship in and out until both Breaks stuck (the
Fin's Negation strips them again) and emptied the bag and the MP in link 1, so link 2 was 44 % carried (98 % rested).

Changes, each from the sensible line (the research §8 rows played as written):

1. `sin-common.ts#sinCare`: Curaga (Yuna) when two are under **50 %** (was 60), a single potion on the weakest under **40 %**
   (was 45); the Al Bhed Potion only as that member's last resort, no longer the first party heal for anyone.
2. `sin-fins-core.ts`: at most **two Close in trips** and **two Mental Break casts** a Fin (counted off the battle log, which is
   per link); "done breaking" is Armor Break on plus Mental Break on or tried twice.
3. `benchReach`: once the trips are made, Auron and Yuna make way for Wakka and Lulu at FAR (a switch costs no turn). The first
   draft kept Auron in front and stalled 12 of 40 chains (6 on link 1, 6 on link 2); the bench prints `escape` as its own cause,
   0 in the final 200.
4. `breaks`: a dry Auron drinks an Ether, Turbo Ether or Elixir for his Break (the carried-seam defect of 2026-09-29).
5. `swapForPhase` (link 3): Tidus, Yuna and Lulu while Genais is shelled (only Fire answers the shell), Tidus, Auron and Yuna
   otherwise and for the Core.
6. `sinHarmless`: a quiet turn is a Cheer, a Haste or a spare Potion, never a bag heal (`evrae-quiet.ts#healFromBag` drank a
   Hi-Potion for any scratch and an Al Bhed Potion for two members under 80 %). `evrae-quiet.ts` only gained three `export`s.

| Reading (FFX engine, same seeds and setup) | Before | After |
|---|---:|---:|
| XVII advisor card, whole chain, seeds 1-200 | 9/200 (4.5 %) (6/200 in the 2026-09-29 table) | **97/200 (48.5 %)** |
| XVII advisor card, whole chain, held-out seeds 201-400 | not run | **88/200 (44 %)** |
| XVII advisor card, link 1 -> 2 -> 3, seeds 1-200 | 190 -> 85 -> 6 (2026-09-29) | 200 -> 188 -> 97 |
| XVII sensible line, whole chain, seeds 1-200 (re-run, unchanged) | 51/200 (25.5 %) | 51/200 (25.5 %) |
| XVII card through the game's worker path (v3 drive, `critic/bench/advisor-v4/worker-path.test.ts`), seeds 1-100 | 4/100 (9/200 over 1-200) | **39/100** |
| XVII card through the game's worker path (v4, mini), seeds 1-23 (the run was stopped there: about 2 minutes a seed on the shared machine) | 8/80 (r17fix) | 23/23 (`bench/wp-sin-fins-core-v3-100-v4-23-partial.log`) |
| XVIII link-4 bench (`sin-bench.test.ts`, `PYREFLY_SIN_BENCH=1`), advisor card, 200 seeds, S-1 13th turn | not re-measured before: the XVIII code is unchanged (36.5 % in r17fix) | **79/200 (39.5 %)** against sensible 67/200 (33.5 %) |
| XVIII through the worker path, mini, seeds 1-100 (v3 / v4) | 73/200 (36.5 %) both (r17fix) | 38/100 / 35/100 (code unchanged) |

The card chain now beats the research-rows sensible line (48.5 % against 25.5 %), which is more than the acceptance asked for
("at least the sensible line's rate minus a small margin"). Two honest notes: (a) the tactic also does what the sensible line
does not model (the link-3 front row follows the phase, a dry Auron drinks), and the sensible line was left as it was so the
reference does not move; (b) every threshold is AUTHORED, as before, and nothing in `src/battle` or `src/data` changed: no boss
number, no game data, no card wording. D-282 (Sin's difficulty) is untouched. The chapter still does not clear the project's 90 %
bar as one chain; the largest remaining cause is Genais's Sigh on link 3 (60 of the 188 link-3 entries on seeds 1-200).

### Real keys, through the fixed harness (the dev server of this worktree, headless Chromium `PYREFLY_BROWSER=gpu`, 1600x900, seed 1)

| Route | Result | What the typed input did |
|---|---|---|
| `sin-face win` (XVIII) | **victory**, 64 turns, 5.4 min, results, aftermath, board, reload, 0 console errors, 0 fails | Bushido typed twice (Dragon Fang, Shooting Star): 7 of 7 correct inputs each, success, ~2.4 s left of 4 s |
| `sin-fins-core win` (XVII) | **victory**, 232 turns over 3 links, 17.9 min, 2 seams, 8 orders, 0 mismatches, 0 misses, 0 console errors, 0 fails | Bushido typed twice (Shooting Star, Dragon Fang) 7 of 7; Swordplay typed twice (Spiral Cut): the marker was inside the gold zone at both Enters (`pressLog.inZone`), the engine received `success: true` each time |

Screenshots (`docs/screenshots/r37-sin-advisor/`): `sin-face-bushido-typed`, `sin-fins-core-swordplay-typed`,
`sin-fins-core-bushido-typed`, the two results screens, `sin-face-post-scene`, `sin-fins-core-board-after`. There is no approved
visual target for this lane (nothing a player sees changed except the card's row on Chapter XVII), so no side-by-side. The
evidence JSONs are in `docs/handoff/r37-sin-advisor-evidence/` (run.json for both wins and the stall demo, the bench lines per
seed, the worker-path results).

## Checks run

- `npx tsc --noEmit`: clean (twice, after the tactic and after the tests).
- Targeted: `sin-tactic` (20 passed, 8 new), `critic-route-harness` (24 passed, 12 new), `tactics-lookup` (60), `sin-fins-core-bench`
  and `sin-bench` smoke, `evrae-advisor` (7).
- Full suite once, `npx vitest run --testTimeout=60000 --maxWorkers=4`: **750 files passed, 5 skipped (the gated benches), 0 failed;
  11,080 tests passed, 40 skipped, 1 todo** (`D:/Tools/pyrefly-scratch/2026-10-03/r37-sin-advisor/full-suite.log`; this worktree has
  the `public/art` junction, so the three art tests ran too).
- `node tools/orphans.mjs`: 24 orphaned, the same 24 as main (nothing added).
- Servers: the dev server on 5940 was stopped by PID after the last route run.

## Not done, and why

- **Swordplay's lead (30 ms) is one measured value on a loaded machine.** Both plays hit on the first press; on a slower
  machine a late press only costs a sweep (a miss restarts the marker, it is not a failure), up to 12 attempts in 6 s. Not tuned further.
- **The Leblanc seed-1 Wait-mode stall** (round 19 PR-0261 note 2: the remembered submenu differs from the advisor's) and the
  Chapter XIII Trema real-key win are not in this brief and were not touched.
- **PR-0308** (Bushido and Swordplay ignore the Overdrive chosen; the button order is Bailey's call) is not touched: the harness now
  types whatever sequence the overlay shows, so it will follow PR-0308's per-Overdrive sequences without a change.
- **The v4 card on XVII through the worker path** was stopped at 23 seeds (all 23 won); a 100-seed read is owed if the critic wants it
  (`V4W_CHAPTERS=sin-fins-core V4W_DRIVERS=v4 V4W_BUDGET=mini`, about 3 hours on this machine under load). Nothing relies on it.
- **Genais's Sigh** (link 3) is the largest remaining loss: the bag has no Eye Drops or Esuna in the preset (research §7.3 item 5
  names them for Sigh's Darkness), so a cure line is a data question, not built.

## For Bailey

1. **A line, not a boss.** Chapter XVII's card chain went from 4.5 % to 48.5 % on the same bench by playing the sensible line's
   priorities. Nothing about Sin or the Fins changed (D-282 is still only proposed). If you would rather the card teach the old,
   harder line, the six changes are in one commit (`git show e9ac8010`).
2. **Whether to add Eye Drops or Esuna to the Sin preset** (research §7.3 item 5 says the chapter's players carry them for Sigh's
   Darkness): it would be a data change to the party's bag, so it needs your yes (AGENTS.md rules 6 and 10). Not built.
3. The commit trailers say `Claude Sonnet 5.5`, the model that actually made them (the brief asked for Opus 5.5).
