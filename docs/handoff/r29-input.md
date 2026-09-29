# r29-input: input and interface defects from critic round 15

Branch `r29-input` (worktree `D:/pyrefly-r29-input`), from `origin/main` c9c1c295.
Defect fixes only: no new screen, setting row or gameplay; no game datum touched.
Paper preflight: [docs/plans/r29-input-review.md](../plans/r29-input-review.md).
Evidence JPEGs: `docs/screenshots/r29-input/` (before-/after- pairs). Probes were
headless Playwright from node (PYREFLY_BROWSER=gpu) against a dev server on 7960.

| Issue | Game case | Result |
|---|---|---|
| PR-0219 FFX-2 menu ignores a gamepad | FFX-2 only | FIXED |
| PR-0232 taps meant for Yuna land elsewhere (Ch XII, phone) | both (shared cursor and coach layer) | FIXED |
| PR-0236 Orders opens with nothing choosable, illegible reasons (Ch VIII) | FFX only | FIXED |
| PR-0233 open enemy plate clips the turn list | FFX only | FIXED |
| PR-0237 coach lines over faces and weapons | both | FIXED on desktop; phone left as is (see below) |
| PR-0238 PAUSE chip grey, small, system font | both (FF7 hides it) | FIXED |
| FOC28-P02 Grand Summon subtitle past its panel on a phone | FFX only | FIXED |

## PR-0219 (FFX-2 only)

**Cause, proved:** `src/ui/ffx2/CommandMenu.ts` listened to `keydown` and clicks
only; FFX's menu polls the pad through `src/ui/ffx/rawInput.ts`. Before, ffx2-bahamut
seed 1 with an emulated standard pad: d-pad down, up, A, B, A, A changed nothing
(cursor stayed on the first row, no submenu, no action).
**Fix:** a pad-only `RawInputWatcher` (new additive option `keyboard: false`) feeds
the same `press(button)` the keys now go through. A confirms, B backs out, d-pad and
left stick move; the pause mute holds; the keyboard map is unchanged (no WASD).
**After:** pad only, White Magic > Cure > target: the engine logged
`yuna: x2-white-mage-cure`. Test `tests/unit/ffx2-command-menu-gamepad.test.ts`
(fails without the wiring). Full route: see "Route check" below.
**Not tested:** a real controller (Bailey).
Evidence: `before-pad-0-menu.jpg`, `before-pad-1-target.jpg`, `after-pad-1-target.jpg`, `after-pad-2-after.jpg`.

## PR-0232 (both; found in FFX Ch XII)

**Cause, proved at 390x844, seed 1:** two separate defects.
1. On a fresh profile, Auron's first coach line covers the party band, and
   `elementFromPoint` at Yuna's, Tidus's and Auron's bracket centres all returned
   `.coach-mark`: no tap reached a reticle while an ally was aimed
   (`coach-taps.css` only let taps through while an *enemy* was aimed).
2. With the line gone, Auron's bracket (drawn later) covers Yuna's centre: on every
   Tidus turn a Hi-Potion tapped at Yuna's centre healed Auron. Round 15's variant
   was a dimmed Mortiphasm's bracket in front of Yuna.
**Fix:** (1) `coach-taps.css` lets taps through while any single-target reticle is
up (`:has`). (2) `TargetCursor` resolves a click from the point
(`src/ui/ffx/targetHitPick.ts`): brackets containing it, the aimed-at side first,
then the nearest centre in each box's half-extents; and it draws the aimed-at side
last. **After:** 6 of 6 taps at Yuna's centre targeted Yuna (Tidus, Auron and Yuna
turns), with the coach line dismissed and with it left up. Tests:
`tests/unit/target-hit-pick.test.ts`.
**Note for the harness:** a Playwright `locator.tap()` on Yuna's bracket still
reports "intercepted" when a party bracket overlaps her centre, because stacking
cannot give every overlapping figure its own centre; the page resolves the point
correctly, so a coordinate tap (`page.touchscreen.tap`) is the faithful check.
Evidence: `before-omnis-t0.jpg`, `after-omnis-t0.jpg`, `after-omnis-coach-t0.jpg`.

## PR-0236 (FFX only, Ch VIII Evrae)

**Cause:** the folded top-level Orders row (`AirshipOrders.foldOrders`) was always
enabled, while the widget greys both rows when an order is standing for the other
range; the greyed reasons kept ivory-row ink `rgba(11,10,18,0.72)` on the flat
`#2a2a30` disabled slab.
**Fix:** the fold asks the widget's own rule (`engine/tactics/airship-orders.ts`):
if every order is refused, the row is disabled with reason `Ordered`; greyed
reasons use the disabled label colour `#d8d8de` (about 10:1 on `#2a2a30`).
**After, real clicks, seed 1, 1600x900:** Tidus ordered Pull back; on his next turn
(near, far pending) Orders was disabled, a click did not open the widget, and the
help read "Ordered - A one-off action this encounter offers". Test:
`tests/unit/evrae-orders-none-choosable.test.ts`.
Evidence: `after-orders-menu.jpg`, `after-orders-after-click.jpg`; before is round 15's `27-no-choosable-row.png`.

## PR-0233 (FFX only)

**Cause, measured on Ch I's first menu with the plate open (seed 1925036082):** the
plate's right edge sat 38 px into the turn-list names at 2000x1012, 41 at 2560x1080,
34 at 1600x900 (not only 2000; at 1600 it is folded by default).
**Fix:** `src/ui/ffx/sensorCtbClear.ts`, per frame: slide the plate left by what
clears the names in its rows plus 4 grid px, through its own `--ffx-sensor-cdx`
(the target steer's `--ffx-sensor-dx` untouched); no-op on phones.
**After:** no name box meets the plate, no name clips, at all three sizes. Test:
`tests/unit/sensor-ctb-clear.test.ts`.
Evidence: `before-ctbclip-2000x1012.jpg`, `after-ctbclip-2000x1012.jpg`.

## PR-0237 (both)

**Cause:** the coach line dodged HUD panels but never fighters.
**Fix:** `src/ui/coach/coachActorAvoid.ts`: every living fighter's silhouette
(`TargetingPort.rect`; top third weighted 4x as the face band) is an input; the
line takes the panel-clear place covering the least fighter, only when strictly
better (settles). Desktop only.
**Measured, fresh profile, first menu, fighter px under the line, before -> after:**
FFX Ch I 1600x900 68,835 -> 0; 2000x1012 66,992 -> 877 (face band 0); 2560x1080
62,065 -> 0; FFX-2 Ch IV 1600x900 5,612 -> 0; 2000x1012 11,165 -> 0.
Test: `tests/unit/coach-actor-avoid.test.ts`.
**Not fixed:** the phone layout (the line is centred in its own band there, and
moving it risks the phone command grid); and weapons are approximated by the body
box, since only Vegnagun has a face/weapon table. The critic's FFX-2 case was
Ch XI on Item targeting; I measured Ch IV's first menu (Ch XI's gauge line did not
appear on `gotoChapter` in the probe).
Evidence: `before-/after-coach-*.jpg`.

## PR-0238 (both; FF7 keeps it hidden)

**Cause:** the pause remake (8cf17246f) replaced `pause-screen.css` and dropped the
`.battle-pause-chip` rule, so every battle showed a bare browser button.
**Fix:** `src/ui/common/pause-chip.css` restores that rule (ink chip, accent edge,
display font, skew, left 22 / top 18) with only 14 px type and full paper ink
changed; loaded with `PauseScreen.ts`. Paper on `--ig-ink-chip` (0.62 ink) stays
above 4.5:1 even over a white backdrop (about 4.9:1). Test:
`tests/unit/pause-chip-style.test.ts`. Visible in `after-ctbclip-2000x1012.jpg`.

## FOC28-P02 (FFX only)

**Cause, measured at 390x844:** the head subtitle box ran to x 373 against the
panel's 362, at 5.33 px (about 6 px on screen); the selected row's x2 chip was
gold-on-paper on the gold accent.
**Fix:** on the FFX phone layout the subtitle takes its own line and wraps at 14 px;
the selected row's chip is ink. **After:** subtitle box right 342 (panel 366),
scrollWidth = clientWidth, 14 px. Test: `tests/unit/grand-summon-phone-subtitle.test.ts`.
Evidence: `before-gs-390x844.jpg`, `after-gs-390x844.jpg` (picker opened through the
HUD's own `openMinigame` with the engine's param shape, a labelled hook).

## Route check (PR-0219 acceptance)

`node critic/runner/lib/route.mjs ffx2-bahamut win --gamepad --seed=1` against the
branch on a dev server: **victory**, 35 turns, 0 fails, 0 console errors. 267 pad
presses (A 118, d-pad down 112, right 24, up 6, B 3, Start 2); the only keyboard
fallbacks were the N, E and G panel toggles, which the pad shim has no button for.
33 of 34 menu picks reached an engine action (`engineDid`). Round 15 measured 80 A
presses and 0 party actions on the same route. The run's own target probe logged
"no target cursor opened" before the fight (the first row it confirmed opened a
submenu, not a target), which is the probe's step, not the fight. run.json kept in
`D:/Tools/pyrefly-scratch/r29/input/route/ffx2-bahamut-win-pad/`.

## Checks

`npx tsc --noEmit` clean; full `npx vitest run` 618 files passed, 5 skipped;
`node tools/orphans.mjs` 24 (unchanged). Not pushed, not deployed.
