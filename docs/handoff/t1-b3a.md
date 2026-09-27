# Handoff: t1-b3a (thresholds program, batch 3a: advisor, intent, tactics, FFX-2 HUD)

Branch `t1-b3a`, worktree `D:/pyrefly-t1-b3a` (from `main` at 76f19bdb). Plan:
`docs/plans/thresholds-program-2026-09-26.md` section 2, Batch 3 (the advisor / intent /
tactics / FFX-2 HUD half). Issue records: `critic/rounds/round-13.json`, FOC19-05 from
`critic/reviews/43dca986-focused.json`. Nothing deployed; NOW.md untouched (the driver owns it).

## Method check, PR-0126 (stalled in round 13; rule 15)

Two passes had already fixed the chip's desktop half (fee2033b, then 19001778: the menu chip
survives every density rung), and round 13 still saw every phone tip without a menu. Both
passes worked on the density ladder in `MoveAdvisor.moveHtml`, and the phone never reads that
ladder's output: `phone-battle-parts.css` hides every `.mad__stats` line and shows only the
lead's `.mad__line`. So a third pass on the ladder could not have closed it. The method this
time: read what the phone sheet actually shows, put the menu inside the one element it shows
(`.mad__line` gets a `.mad__where` span), hide that span on desktop so the approved card is
unchanged, and check the rendered phone tip at 390x844 by real run rather than the HTML string.

## Fixed (each with a failing test first, then the fix)

| Issue | Game | What changed | Evidence |
|---|---|---|---|
| PR-0126 phone half | both | `.mad__where` on the label line, shown on the phone tip as "· White Magic", never truncated; hidden on desktop | `advisor-phone-tip-menu.test.ts`; `docs/screenshots/t1-b3a/phone-tip-*.jpg` (XI "Shell → the party · White Magic", XII "Wakka · Switch", VI "Grenade → all enemies · Item") |
| PR-0026 | FFX | Ch I Haste hint: "Haste roughly doubles your turns against theirs" (no "ctb x") | `intent-guide-plain-copy.test.ts` (every guide line) |
| PR-0027 | FFX | Yunalesca counter line: no `*she*` | same test (all three forms; every FFX group's predicted intent) |
| PR-0162 | FFX | "Cid pulls the ship out of reach" (no actor in a possessive) | `guide-evrae-orders-copy.test.ts` |
| PR-0163 | FFX | a self-targeting trigger row prints no target in either panel (`targetLabel.isSelfOrder`) | same test, engine seeds 1-3, guide NEXT and every advisor row |
| PR-0192 | FFX-2 | revive reason's "call an aeon" only in FFX | `advisor-revive-reason-game.test.ts` (Ch VI, Ch IV none; Ch I still says it) |
| PR-0169 | both | "Guide's pick" withdrawn on the sync where the guide's NEXT stops naming the card's tactic row (`advisorGuideBadge.ts`); the move stays | `advisor-guide-badge.test.ts` (real Ch V board; fails without the sync hook) |
| PR-0074 | both | second clause templated by kind ("with 565 damage", "; next, Glint hits for about 1,300 in all", ", but it costs..."); a status the reason names is taken off the effect line (`advisor-copy.ts`); "Max HP x2" | `advisor-copy-sweep.test.ts` (six chapters, both games, 300+ cards); live frame: "It finishes Fem-Goon with 565 damage." in `all-label-ffx2-leblanc-*.jpg` |
| PR-0130 | both (seen FFX) | the N chip goes down with a HUD-folded card (`advisorChipFollow.ts`, MutationObserver); stays when the player pressed N | `advisor-chip-lifecycle.test.ts`; real E in Ch I and II at 1600x900 and 2000x1012: card and chip both down (`intentE-*.jpg`) |
| PR-0110 | FFX-2 | chip fades with the card under an FFX-2 coach line | same test; real run Ch VI and Ch IV fresh profile: chip opacity 0 under the coach (`coach-*.jpg`) |
| PR-0193 FFX-2 half + FOC19-05 | FFX-2 | ALL label max(14px, 5.6 grid px); the label steps off the slab and panels by the smallest clear shift (`allLabelClear.ts`, from `plateRedock.ts`) | `ui-ffx2-all-target-label.test.ts`; real keys: Ch VI Grenade 1280x720 14 px, 2560x1440 22.4 px, Den Pray 1600x900 14 px, 0 px² with the slab (`all-label-*.jpg`). A first try that made the slab dodge the label pushed the slab onto Yuna; reverted in the same batch |
| PR-0175 | FFX-2 | `chooseCommand` tears down a still-open menu before the next (its orphaned cursor was the corner reticle); plates name from board, else FFX-2 data, never the id (`displayName.ts`) | `ui-ffx2-stale-reticle.test.ts` (two cursors before the fix). No real-key link 4-to-5 capture (needs the batch 5 harness) |
| PR-0135 | FFX-2 | vignette and grain on the HUD root (full window), help band over both pillars (`commandHelpBand.ts` `pillar`) | `ui-ffx2-wide-band.test.ts`; real run Ch IV 2000x1012 band 71..2000, 2560x1080 band 72..2560, no edge (`wide-ch4-*.jpg`) |
| PR-0146 FFX-2 half | FFX-2 | slab held (`intentOpeningHold.ts`) until the battle-start moment hands the HUD back or the first menu opens; no new presenter hook | `ui-ffx2-intent-opening-hold.test.ts`; real run Ch IV and VI: 0 frames of slab before the moment ends (battle screen at ~0.5 s, moment 3.2-7.6 s) |
| PR-0197 disc half | FFX | a landed Mortiphasm hit that removes a -ga is not inert and scores 2,500 per -ga (`advisor-omnis.ts`, engine's own turn rule) | `chapters/omnis-advisor-discs.test.ts`; 40-seed bench: disc turned in 40/40 runs (was 0/40) |

Verified, no change needed (class X):
- **PR-0010**: at Ch I and II, 1600x900 and 2000x1012, E shows "J hold · +N more" when the body is clipped, and holding J shows every line (`scrollHeight <= clientHeight + 1`). Frames `intentE-J-*.jpg`.
- **PR-0139**: fixed on main by b1f4fd96 (the FFX-2 HUD re-reads the engine on the named enemy's `ko`), pinned by `ui-ffx2-intent-ko-clear.test.ts`. A real-key Ormi-first capture still needs the batch 5 retarget route.

## Stopped

- **PR-0197, win-rate half**: the advisor top row now wins 25/40 on Omnis (24 before) against the intended line's 27/40. The remaining divergence is not disc turning: it is the revive refusal (Life on Auron refused, Curaga instead) and the saves-from-lethal override (Al Bhed Potion over the line), both Bailey's 2026-09-21 policy. Changing either is a design choice (rule 10).
- **PR-0131**: the forty-seed measuring stick is in (`advisor-degenerate-boards.test.ts`: 22/40 wins, the round's 20 bar holds). But the card still leads with raises its own forecast refuses: 54 onto a Zombie and 8 into a sweep over forty seeds, and 10 of 42 re-KOs came from the forecast's scripted move. Two attempts: (1) nothing (already on main) and (2) dropping a refused chapter-line raise from the top, which fell to 18/40. Needs a method check before a third try (rule 15): the chapter tactic (`seymour-flux.ts`) raises into a Zombie on purpose, and the card places the tactic first by policy.
- **PR-0193 FFX half (Ch III)** and **PR-0146 FFX half**: the files are `ui/ffx/ffx-hud.css`, `ui/ffx/TargetCursor.ts` and `ui/ffx/FFXBattleHud.ts`, batch 2's. The FFX-2 modules (`allLabelClear.ts`, `intentOpeningHold.ts`) are written to be reusable there.

## Noticed, not in this batch

- Ch II fresh profile: the FFX coach line ("He moves after you...") sits over the intent slab's IF YOU ATTACK list at 1600x900 (`intentE-yunalesca-1600x900.jpg`). Coach is batch 4's.
- `src/battle/ffx2/intent.ts` `statusWord` still title-cases "Hp" (not this batch's file).
- `advisor-revive.ts` still weights FFX-2 Yuna as a Summoner (2,500) in `ROLE_VALUE`; only the sentence was gated. A ranking change needs a bench.

## Checks

- `npx tsc --noEmit` clean.
- Touched vitest files pass. Full suite `vitest run --testTimeout=60000`: exit 0, 462 files passed, 4 skipped; 8,361 tests passed, 29 skipped, 1 todo. (`strategy-ffx2-bahamut.test.ts` once timed out at the default 5 s under load in a partial run and passed alone at 60 s: load flake.)
- `node tools/orphans.mjs`: 24 orphaned, same as main; the seven new modules are reachable.
- Real input: production build (`vite build`) served by `vite preview` on port 5940 (stopped by PID), Chromium with `GPU_ARGS`; chapters entered by the debug API, then real keys (E, J, Enter, arrows) and a touch context for the phone. Results `docs/screenshots/t1-b3a/checks-all.json`.
- No art touched.

## Commits

See `git log main..t1-b3a`. Every commit states its game case (rule 14).

## CHECK (independent, 2026-09-26; not the builder)

Verdict: **no blockers.** Every claimed fix meets its round-13 acceptance check on a fresh production
build. I found no regression in the chapters these fixes touch, in either game. Every change is class A:
no new perceivable element beyond the menu word the issue's fix names, no invented data and no boss
number. The disc weight is an advisor score, not game data.

- `tsc --noEmit` is clean. The full `vitest run --testTimeout=60000` exits 0: 462 files passed and 4 skipped; 8,361 tests passed, 29 skipped and 1 todo. There were no flakes this run.
- Real input: I built with `vite build` in the worktree and served it with `vite preview` on port 5945, which was stopped by its PID. I used headless Chromium with `GPU_ARGS`, entered chapters through the debug API, then drove them with real keys (E, J, N, G, arrows, Enter) or a touch context at 390x844. The frames and JSON are in `docs/screenshots/t1-b3a-check/`, which is not committed (this commit holds only this section).

| Issue | Acceptance check, as I ran it | Result |
|---|---|---|
| PR-0126 phone half | 390x844 touch, first card in XI, XII, VI, I and II | Pass. Every tip shows the menu (`White Magic`, `Switch`, `Item`) in view at 15 px, not clipped. `.mad__where` is hidden at 1600x900 and 2000x1012. The desktop 67-of-2,032 half was not re-measured, because this batch does not claim it. |
| PR-0130 | Ch I and II at 1600x900 and 2000x1012: E, then E, then N, then E | Pass. After E the card and chip are both down. A second E brings both back. With the advisor off, the chip stays up ("best move") through E. N brings both back. |
| PR-0110 | Ch VI and IV fresh profile, first menu | Pass. Chip opacity is 0 while the coach line is up (the rects overlap, but nothing shows) and 1 once the line goes. |
| PR-0010 (verify) | Ch I and II at 1600x900 and 2000x1012, E then hold J | Pass. The MORE chip reads "+4" or "+2 more". Holding J fits the body (`scrollHeight <= clientHeight + 1`). |
| PR-0193 (FFX-2) and FOC19-05 | Ch VI Item > Grenade at 1280x720, 1600x900 and 2560x1440; Den White Magic > Pray at 1600x900 | Pass. 14, 14, 22.4 and 14 px. Zero overlap with the slab, its chip, the party, the menu, the card, the guide, the help band and the plates. In view each time; shifts of -81, -78, -119 and +30 px. |
| PR-0135 | Ch IV first menu at 2000x1012 and 2560x1080 (plus 1600x900 and 1280x960 for regressions) | Pass. The band runs 71 to 2000 and 72 to 2560 (only the PAUSE chip sits to its left), and the surface covers the full window. There is no flat strip in either frame. 16:9 and 4:3 are unchanged. |
| PR-0146 (FFX-2) | Ch IV and VI from the story, holding Enter, sampled every frame | Pass. 0 frames of slab, slab chip, card or party before the battle-start banner ends. The first slab frame comes 3.8 s after it. FFX Ch I still shows the `.eint__toggle` chip during the banner (132 frames). That is the stopped FFX half, and it is not new. |
| PR-0169 | Ch V from the first menu, real Enter, about 70 s, 213 samples, guide open | Pass. 54 badged frames, 0 that disagree with the guide's NEXT. This is a short route: every badge was on Black Sky. |
| PR-0175 | Ch V: auto to head under 12% HP, then the head killed under an open menu, then real Enter through the link 5 dialogue and menus | Pass. Over 255 samples: no reticle part inside the 60 px corner, no plate matching `/^[a-z]+-[a-z-]+$/`, and link 5 menus reached. The head kill was forced (`forceCommand`) under the open menu, so the link ended under the menu, the case the fix handles. |
| PR-0197 disc half | My own 40-seed advisor top-row bench | Pass. A disc turns in 40/40 runs, with 361 disc picks, all of them Attack and all landed as turns. Wins are 25/40, the same as the builder's figure. The win-rate half is correctly stopped. |
| PR-0026, 0027, 0162, 0163, 0192, 0074 | Unit tests re-run; I checked for `ctb x`, `*…*` and the actor possessive in the source | Pass. |
| PR-0131 (stopped) | `advisor-degenerate-boards.test.ts` | 22/40 against a bar of 20. Taken literally, the acceptance check is met (the test covers the Ch I telegraphed re-kill). The stop is still right, because the refused raises remain. |

Findings (none blocking):
1. `advisor-omnis.ts#discTurnOf` credits any landed hit on a disc. The engine's `discTurnFor` excludes items, all-target actions and status-only rows. So a Grenade or a -ga on a disc would earn the 2,500 bonus and escape the inert guard although nothing turns. The bench never hit this case (every disc pick was Attack). It is latent: mirror `discTurnFor` when the win-rate half is taken up.
2. The FFX-2 guide polls `buildGuideView` on every `sync` while a card with a tactic row is open (`MoveAdvisor.sync`), because the ATB clock runs under the menu. I saw no stutter in these runs, but nobody has measured the cost.
3. Seen, not caused by this batch: in Ch II, on a fresh profile at 1600x900, Auron's coach line covers the intent slab's IF YOU ATTACK list and its MORE chip (the builder noted this; it is batch 4's). In Ch V link 5 the guide's header still reads "Vegnagun" over Shuyin.
