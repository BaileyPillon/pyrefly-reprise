# Independent check: phone results, option B (PR-0001), branch `r21-results-phone` at 294f039a

This check was done by an agent that did not build the change, on 2026-09-26.

**Game case: both.** The results screen is shared. The check covered one FFX chapter (I, `seymour-flux`) and one FFX-2 chapter (XI, `ffx2-fallen-aeons`).

**Verdict: PASS, no blockers.** The build matches the picked mockup (`docs/concepts/phone-2026-09-26/pr0001-victory-B.jpg`, `pr0001-defeat-B.jpg`). Desktop and landscape are unchanged. The two minor findings are listed below.

## What was run

1. **Type check.** `npx tsc --noEmit` is clean.
2. **Full unit suite.** `npx vitest run --testTimeout=60000`: 450 files passed (4 skipped), 8330 tests passed, 29 skipped. `results-phone.test.ts` and `results-inkgold.test.ts` also pass on their own.
3. **Orphans.** `node tools/orphans.mjs` flags none of the new modules.
4. **Own production build.** `vite build` of 294f039a went to a scratch folder and was served by `vite preview` on port 5920. The baseline was release 20's own build (`D:/pyrefly-rel20d/dist-release`, ce05b02c), served on port 5921. Both servers were stopped by PID.
5. **Browser.** Headless Chromium on the GPU (`GPU_ARGS`), 390x844, `hasTouch` and `isMobile`, DPR 2. The Claude browser pane and OS input were not used.

## Real runs at 390x844

In every run the outcome was reached with the debug API (`__pyrefly.gotoChapter`, auto `intended` for a win or `defend` for a loss, speed `skip`, `skipResults: false`). This is labelled on each frame. The results screen itself was driven by real Playwright touch taps and key presses.

| Run | Results screen | Real input | Outcome |
|---|---|---|---|
| FFX-2 XI win (seed 1) | EXP / AP / GIL / ITEMS, pink accent | touch tap on CONFIRM | dismissed, choice `continue` |
| FFX I win (seed 2) | AP / GIL / ITEMS, gold accent, quip kept | Enter key | dismissed, choice `continue` |
| FFX I loss | TURNS / ATTEMPTS / BEST, paper accent, S.LV chips | ArrowRight, ArrowLeft, then tap RETRY | the lit button moved each way, and the tap started a new battle (screen `battle`) |
| FFX-2 XI loss | same tallies, LV chips | turn to 844x390, turn back, ArrowRight, then tap CHAPTER SELECT | turned sideways it showed the desktop page (no scroll); turned back it showed the phone page; CHAPTER SELECT lit; the tap gave choice `chapter-select` |

Measurements, the same in all four runs:

- Smallest visible text: 14 px.
- Page scroll: 844 high by 390 wide, so no scroll either way.
- Text outside the viewport: none.
- Buttons: 58 px tall, from y 764 to 822. CONFIRM is 358 px wide; RETRY and CHAPTER SELECT are 176 to 180 px.
- Page errors and console errors: none.

## Target against build (mockup measured at 390x844, `results-mock.html?v=B`)

| Band | Mockup | Build (FFX-2 XI win) |
|---|---|---|
| Title top | 358 | 374 (title box; the glyph baselines line up in the side-by-side) |
| Tallies | 502 to 649 | 502 to 649 |
| Chips | 659 to 731 | 659 to 731 |
| Dock | 764 to 822 | 764 to 822 |

On a loss, the tallies and chips sit 4 px lower than the mockup (506 to 653, 663 to 731), because the BEST tally is taller. The side-by-sides show the painting, the title, the tags, the tallies, the chips and the dock matching the mockup.

## Desktop and landscape unchanged (against release 20's build)

Five results screens were compared: `results`, `results-silent`, `results-victory`, `results-defeat` and `results-ffx2`, at 1600x900 and at 844x390.

- **Markup.** The `.rres` outerHTML is byte-identical in all 10 cases.
- **Pixels.** 7 of the 10 cases are identical. The other 3 differ in at most 4 pixels, by 1/255 each.
- **Layout.** The phone class never applies at these sizes.

## Smaller phones (debug fixtures)

At 375x667 and 360x780, all five fixtures show:

- smallest text 14 px;
- no scroll and nothing off screen;
- buttons 58 px tall;
- no errors.

## Findings

1. **Minor (FFX-2 only in practice). Yuna's fallen pose loses her face on an FFX-2 loss.** The fallen pose uses a fixed `object-position: 50% 30%`, not the face-safe crop. On a Chapter XI loss her face sits cut by the left edge and partly under the RESULTS chip. This shows in the builder's own `side-by-side-defeat-ffx2.jpg` and in this check's frame. The mockup only showed an FFX loss (Tidus), where the fixed crop works.
2. **Minor (edge case). A 320x568 phone overflows on a four-member FFX win.** On a 320x568 phone (iPhone SE, first generation), the four-member FFX win fixture overflows. The title runs into the RESULTS chip, and CONFIRM is cut 20 px at the bottom edge; it can still be tapped. The other four fixtures fit at 320x568. The builder tested down to 360 wide.
3. **Note, inferred and awaiting Bailey. Choices the mockup did not show.** These are already listed in `docs/handoff/results-phone-B.md`:
   - the FFX-2 loss chip reads `LV n`;
   - the victory quip is kept on the phone page;
   - a level gained is shown on the chip;
   - a long caption wraps into two vertical columns (Chapter I: "MT. GAGAZET — THE PROMINENCE ·" / "FELL").

## Evidence

The brief allows only this file in the repo, so the frames and scripts are outside it, in `D:/pyrefly-r21-check-evidence/`:

- `check-side-by-side-victory.jpg` and `check-side-by-side-defeat.jpg` (target against build);
- the `*-landed.jpg` and `*-arrow-right.jpg` frames of each run;
- `ffx2-xi-defeat-sideways.jpg`;
- `fixture-*-320x568.jpg`;
- `report-{phone,desktop,mock,small}.json`;
- the scripts `check.mjs`, `small.mjs` and `sbs.mjs`.
