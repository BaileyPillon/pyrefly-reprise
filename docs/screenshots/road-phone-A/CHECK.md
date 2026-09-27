# Independent check: r21-road-phone (PR-0201 option A), commit 9bc8115e

This check was run on 2026-09-26 by a separate agent that did not build the change. **Game case: FFX-2 only**
(Chapter XI, the Road to the Farplane). The one shared line (`SceneBuild.bindCamera`) is optional
additive plumbing that no other scene sets.

**Verdict: the build matches the picked option A frames, and desktop is unchanged. No blocker.**
One major issue is carried over from the builder's own report: a reachable state where Mindy slips
off the right edge after a party KO. It is disclosed below. It was not introduced by this change and
is not a regression against live.

## How this was checked

- **Type check:** `tsc --noEmit` is clean.
- **Tests:** the full vitest run with `--testTimeout=60000` passed (450 files, 8318 tests, 4
  files skipped). `road-phone-camera.test.ts` passes (7 tests). `tools/orphans.mjs` found no new
  orphans; the two it lists, `MessageBar.ts` and `ui/ffx2/PartyPrep.ts`, are not touched by the branch.
- **Production build:** built myself (`vite build` in the worktree) and served on 5925. The server is stopped.
- **Browser:** headless Chromium on the GPU (`PYREFLY_BROWSER=gpu`) at 390x844 with touch, DPR 2 and
  seed 1, entered through the title and chapter select with real keys.
- **Real input:** each command was a real `touchscreen.tap` on the first enabled command, then a
  tap on the target step's Confirm (`.phud-target__go`).
- **Reaching later links:** as the builder did, the earlier links were skipped with
  `autoBattle('intended')` at skip speed. Control was then handed back before the new link's first menu.
- **Baseline:** "before" is live release 20 (ce05b02c, the branch's parent), run with the same script.
- **Scratch frames:** in `tools/zz-r21-check.tmp/`, untracked and not committed. Only this file is committed.

## Phone, 390x844: every living fighter whole at every menu

"Whole" means the figure's on-screen box lies inside 0..390 px (from `__pyrefly.targeting().rects`).

| Link | Menus checked (actor) | Build (idle z) | Live today |
|---|---|---|---|
| Shiva | Yuna, Paine, Rikku, Yuna | all whole (13.2) | Shiva 57-73% shown, Yuna 47-79% |
| Sisters | Yuna, Rikku, Paine, Yuna, Paine, Yuna | all whole (15.5) | Cindy and Mindy 0% shown in every menu, Yuna 72-94% |
| Sisters, Paine KO'd (menu left open until the Sisters knocked her out) | Yuna, Rikku, Yuna, Rikku, Yuna | all whole (15.5), lying Paine inside the frame | Rikku KO'd instead: Cindy and Mindy 0% |
| Anima | Yuna, Rikku, Paine | all whole (13.2) | n/a (the live run was defeated before Anima) |

- **Yuna acting in the Sisters link:** the README's case where "Cindy and Mindy fall off" today
  is now whole every time.
- **Sizes:** Yuna is 137 px tall in the Shiva link and 115 px in the Sisters link, which matches
  the builder's 139 and 116 and the option's stated 72% and 60%.
- **Target vs build:** checked against `pr0201-{shiva,sisters,anima}-A.jpg` and the builder's
  `compare-*.jpg`. The layout, sizes and order match. The fighters stand a few px higher than in the
  target, as the builder disclosed; this is cosmetic.
- **The slide:** it still runs. The Shiva and Anima links move it between -196 and -206 px by actor.
  In the Sisters link every actor's best slide is the home slide (-220 px), because the whole
  formation now fits.
- **KO and victory:** Anima's fall plays on the unchanged enemy close-up, and the chapter
  continues to its closing cutscene. There were no page errors in the clean run.
- **Retry after a defeat:** after a defeat in the Sisters link, pressing Enter (Retry) goes back
  to the Sisters link at z 15.5, and every fighter is whole at its menus.

## Desktop, 1600x900: unchanged

Live (before) against the build (after), at each link's first menu:

- **Camera:** idle z is 9.8 in all three links, and `matchMedia(PHONE_BATTLE_QUERY)` is false.
- **Figure boxes:** they match within 0-10 px, except the acting Yuna (13-21 px), who is in her
  breathing ready pose. The frames are visually identical.
- **Code path:** `roadOnPhone()` is false, so `phoneCamera` is null. `bindCamera` is then never
  set, and `update` does nothing.

## Text and tap targets, 390x844 (HUD not changed by this branch)

- **Text:** the smallest visible text is 14 px at the menu and at the target step.
- **Tap targets:** commands are 183x56 at the top menu and 183x48 in sub-menus, and PAUSE is 46x46.
  The Guide button is 77x32; this is pre-existing and shared.
- **Layout:** no horizontal scroll.

## Findings

1. **Major, disclosed; not introduced; not a regression against live.** After a party KO, a
   fallen girl lies wider. The shared slide weights in `src/ui/common/phoneFraming.ts` keep her
   (party weight 6) over Mindy (enemy weight 1), so Mindy can end up about 80% off the right edge.
   - Seen in the builder's `build-sisters-after-ko-menu.jpg` (Yuna and Sandy down, Paine acting).
   - Not reproduced in my run with Paine down, where everyone stayed whole.
   - Live cuts Cindy and Mindy completely in every Sisters menu.
   - It breaks the option's "everyone stays whole" promise in that state. It needs Bailey's or the
     driver's choice between the builder's (a) and (b) in `docs/handoff/road-phone-A.md`.
2. **Minor.** `roadOnPhone()` is read once, when the scene is built. Turning the phone mid-fight
   keeps whichever framing the fight started with. This is the same precedent as the Cloister rigs.
3. **Minor.** The brief asked for the scene file only. The branch adds one optional hook to the
   shared `src/scenes/types.ts` and `src/scenes/index.ts`. The scene has no other way to reach the
   battle camera, and the hook is additive. `types.ts` is not in `docs/CONTRACTS.md`.
   `src/scenes/index.ts` is now 399 lines, right at the 400-line house limit.
4. **Minor; seen once, not reproduced, not attributable.** In one run with heavy debug-API
   driving (a defeat, `setAutoPlay(null)` during the results screen, an Enter-retry, then
   `autoBattle`), the presenter logged "the engine produced 400 decisions in a row without emitting
   a single event" and abandoned the battle. A clean repro of defeat, Retry, real turns and then
   `autoBattle` showed no error. The branch touches no engine code.
5. **Minor, pre-existing, shared HUD.** In the Anima link, when members carry three or more status
   chips, the chip row on the party plates overflows. The first chip is clipped at the left edge at 390 px.
