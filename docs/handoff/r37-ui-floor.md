# r37-ui-floor: the interface lane (14 px floor, the phone coach badge, the HUD overlap cluster)

Branch `r37-ui-floor` from `origin/main` `d154486c`, worktree `D:/pyrefly-advisor-v4`, pushed, not merged, not deployed. Written
2026-10-03 by a Sonnet sub-agent of the driver session. No save-data file, no settings schema, no `SaveData.ts`; no
`docs/handoff/NOW.md`, `decisions.json`, `targets.json` or `public/art` touched. Layering held: no engine file; the presenter
change is one optional port call (rule 1).

Evidence scratch (headless Playwright, `PYREFLY_BROWSER=gpu`, seed 1, dev server on port 5900, stopped by PID at the end):
`D:/Tools/pyrefly-scratch/2026-10-03/r37-ui-floor/` (`measure.mjs` text-floor walk, `lv35.mjs`, `hint.mjs`, `phonetarget.mjs`,
`ffx2hint.mjs`, `coachrow.mjs`, `intentgirls.mjs`, `sensor.mjs`, `odsub.mjs`, `x2change.mjs`, `shell.mjs`, `shellphone.mjs`, the
JSON runs and frames). Screenshots (target-vs-build pairs, JPEG) under `docs/screenshots/r37-ui-floor/`.

Honest framing: most of the cluster's carried issues were **already repaired by r35-fix-ui** (`docs/handoff/r35-fix-ui.md`) and
the critic's round 19 only "carried" them. Each was re-measured here against the current build; a defect that no longer
reproduces was not "fixed" again, and is listed as such.

## Items

| Key | Game case | What changed | Proof | critic-plan class | Left |
|---|---|---|---|---|---|
| PR-0321 (phone pause 12/13 px) | both | `--pu-fs` 14, `--pu-fs-v` 15 on the phone; `pause-phone.css`: brand on two tight lines, word rows and objectives take the empty bar cell back | 390x844 Ch I and Ch IV, every pause tab and the EYE CANDY page: 0 text nodes under 14 px, 0 clipped, 0 horizontal overflow; before/after frames `pause-phone-*.jpg` | deep after deploy | none for the phone pause |
| PR-0251 (4:3 HUD labels) | both (per game, each in its own selector) | new `hud-floor.css`: `--hud-floor` = 14.1 px / `--lb-scale`, each stage label `max(authored, floor)`; CTB name cap grows, Sensor chips to two columns and the plate rises 15 grid px | min 14 px, 0 under, at 1024x768, 1280x960, 1440x900 and 1600x900 in Ch I and Ch IV: first menu, seven submenus, the FFX target step. Before at 1280x960: FFX 9.8 px (31 under), FFX-2 9.3 px (21 under); at 1024x768 7.8 px. Frames `hud-*-before-after.jpg` | deep after deploy | Not measured: TEXT SIZE 115 with the floor, TEXT SIZE 130 at other sizes, chapters other than I and IV, the pause at 4:3. At 1024x768 the strategy guide drops its NEXT block (its own density ladder) and the advisor card reflows to two lines |
| PR-0302 (cure hint) | both | none needed: already 14.2 px (phone) and 15 px (desktop) in code | injected Zombie (Ch I) and Curse (Ch IV): phone head/body 14.2/14.2, 1280x960 15/15, hint over command rows, tip line, chips, advisor 0 px2 | n/a | none |
| LV-35-01 | FFX-2 only (the badge) | `coachIntentAvoid.markBox` = slab plus its "Gauges running" badge | Ch IV 390x844: badge over the intent card 5,632 px2 before, 0 after (12 px clear), steady over 12 samples; Ch I phone line clear (no badge). Frames `lv35-01-*.jpg` | deep after deploy | none |
| PR-0325 | both (measured in both) | `cmd-od-selected.css`: a selected `.ig-cmd--overdrive` row takes the accent fill and ink label (it lost the cascade to `.ig-cmd--overdrive`) | FFX Kimahri's OVERDRIVE list and FFX-2's CHANGE row, real keys, 1600x900: selected row `rgb(11,10,18)` before, `rgb(227,185,74)` / `rgb(247,182,217)` after, moves with the cursor. Frames `pr-0325-*.jpg` | deep after deploy | phone OD rows not measured (phone has its own sheets, excluded) |
| PR-0249 | FFX-2 only | `placeSlab` party tier (chrome, then the girls, then the other fighters; may rise above the natural row only to clear a girl's head box); `fighterBoxes` flags the party | 1600x900 and 2000x1012, Ch IV White Magic list: Rikku/Paine overlap 2,639/589 and 3,537/610 px2 before, 0 after, also 0 at the menu, on Shell and at the Cure target step (3.5 s settled). Frames `pr-0249-*.jpg` | deep after deploy | Not fully zero: a mid-transition frame of the Shell party step read 302+690 px2 (1600x900) and 3,660 px2 (2000x1012) once; the card's resting place also moves with the camera |
| PR-0104 (STALLED) | FFX-2 only | method check `docs/plans/pr-0104-method-check.md`, then `QueuedChips` + optional `HudPort.syncQueued` (CONTRACT-CHANGES) | real keys 1600x900 Wait, White Magic > Shell > all allies: chip first at 135 to 175 ms (before, first named at about 1.65 s); real taps 390x844: 153 to 166 ms; 14 px; chip stays while the command is queued (Wait holds the charge under the next menu) and goes 0.7 s after it ends. Frames `pr-0104-*.jpg` (the "before" half is the same frame with the chip hidden by a DOM script, labelled) | deep after deploy | the next review decides; a second failed attempt at this method goes to Bailey (method check section 4). Chip over a face in other chapters not measured |
| PR-0291 | FFX only | none | repaired by r35 U2 (`7da56510`); not re-run here | n/a | none |
| PR-0286 | both | none | repaired by r35 U3 (status line moves above the banner at 1280x960; phone did not reproduce); not re-run | n/a | none |
| PR-0303 | FFX phone | none | Ch I 390x844 target step with an injected Zombie, TEXT SIZE 100/115/130: hint docks above the chips, over the tap line 0, bar 0, confirm 0, card 0 px2 | n/a | none |
| PR-0304 | FFX-2 desktop | none | 80 s real-key play, Ch IV 1600x900, Curse injected on Paine, guide open: the hint was visible at 51 of 52 open-menu samples; the stand-in solo copy was seen while the guide faded | n/a | the one miss is a single sample, not traced |
| PR-0252 | FFX | none | Ch X 2000x1012 and 2560x1080, Ch I, Ch XII: coach over any command row and the selected row 0 px2 | n/a | see For Bailey 3 (first-run guide card over the advisor card) |
| PR-0271 | FFX | none | did not reproduce in r35 (three Attack and four Special turns, 0 frames); not re-run | n/a | none |
| PR-0276 | FFX-2 | none | repaired by r35 U6 (sticky header); not re-run | n/a | none |
| PR-0239 | FFX-2 (shared rail) | none | already repaired in round 15 text batch (`guide-inflight.ts`, `tests/unit/r29-rail-heal-inbound.test.ts`) | n/a | none |
| PR-0248 | FFX only | **not built** | Ch VII, real keys: the open Sensor card at rest covers Guardian B (37,489 px2 at 1600x900, 48,864 at 2000x1012) and the folded chip after a cancel still covers 5,590 / 3,934 px2 | n/a | For Bailey 1 |
| PR-0277 | FFX | **not built** | wording depends on the mechanics (raise then cure vs cure first), which the combat auditor owns; critic confidence low; the sentence is pinned by three advisor tests | n/a | For Bailey 2 |

Folded legibility items (PR-0295, 0288, 0246, 0250, 0247, 0296, 0237, FOC28-P02, 0293): 0288, 0246, 0250, 0247, 0296, 0237 and
FOC28-P02 were repaired in r35 (U5/U6 tables); not re-run. PR-0295 (four phone prep tabs show the letterboxed desktop board)
and PR-0293 (4K pause painting not full-bleed) were **not taken**: 0295 is a new phone page per tab (a look), 0293 is a
deliberate 1.25x cap in `PortraitStage` (stretching masters past it is a design decision).

## Gates

- `npx tsc --noEmit`: clean at the last code commit.
- Targeted: `hud-floor-css`, `cmd-od-selected-css`, `lv35-coach-badge-intent`, `ui-ffx2-intent-party-tier`,
  `ui-ffx2-queued-chip`, `presenter-queued-hud` (new) and the pause, HUD type-floor, status, intent, coach, presenter and
  command-menu files around them: all green.
- Full suite (`npx vitest run --testTimeout=60000 --maxWorkers=4`): 752 files passed, 5 skipped; 11,064 tests passed, 40 skipped, 1 todo; nothing failed.
- TEXT SIZE 130 % at 1280x960 (set through `app.save.setSettings`, an injected setting), Ch I and Ch IV: 0 text under 14 px; in Ch I the guide's MORE row touches the help slab (the existing grown-column behaviour), frame `ts/`.
- `node tools/orphans.mjs`: the same four as before (`placeholder-sprites`, `tidus`, `MessageBar`, `PartyPrep`); `QueuedChips.ts`
  is imported.
- Rule 7: `FFX2BattleHud.ts` (1,276 lines before) grew by 20 lines for the chip wiring; the chip itself is its own file.

## For Bailey

1. **PR-0248 (Ch VII Sensor card).** The Sensor card's resting place is over Guardian B in Chapter VII, and after a cancel the
   folded chip still touches him. D-249 (your pick 2026-09-27) folds the card while aiming **in Chapter III only** and says every
   other chapter keeps its card as approved. Extending that to Chapter VII (or moving the card's rest) changes an approved look:
   a yes or a pick?
2. **PR-0277 (advisor sentence).** The Ch I card can read "Phoenix Down -> Yuna, GUIDE'S PICK ... cure the Zombie first". Whether
   the order is raise-then-cure or cure-first is a combat call, not wording; I left the sentence alone (rule 6).
3. **First-run guide over the advisor card (new, FFX).** On a fresh profile at 2000x1012 in Chapter X the Auron "3 of 3" guide
   card (placed beside the ATTACK ring by `firstRunGuide.ts`, D-289) covers the lower part of the advisor card by about
   8,500 px2 (3,700 at 2560x1080). It is the approved O2 placement; say if the advisor should yield.
4. **The 4:3 HUD is small, not rebuilt.** The floor keeps every label at 14 px, but a 4:3 window still draws the 16:9 stage at
   the window's width. If 4:3 matters, a taller stage layout is a look and wants a mockup round.

## Next batch

Run the focused review on the candidate; the deep review (owed after deploy) should start with CHK-003 at 1280x960 and 390x844 in
all five chapters, the Sensor plate against the party rows and the CTB plates against the enemy at 4:3, and TEXT SIZE 130 with
the floor.
