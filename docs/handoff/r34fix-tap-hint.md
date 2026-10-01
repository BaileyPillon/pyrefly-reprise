# r34fix-tap-hint: the phone tap that killed a Zombie ally, and the cure-hint card (round 18b)

Branch `r34fix-tap-hint` from `95e62e38` (rel34 before the audio fold), worktree
`D:/pyrefly-fb-camera`. Not pushed, not merged, not deployed (the driver does that).
Issues: round 18b PR-0264 (major), PR-0302, PR-0303, PR-0304 (polish), full text in
`critic/rounds/round-18b.json` on main.

Evidence scratch (headless Playwright, `PYREFLY_BROWSER=gpu`, seed 1, dev server on port
5400, stopped afterwards): `D:/Tools/pyrefly-scratch/2026-10-01-rel34/tap-hint/` (`ev-before/`,
`ev-final*/`; the critic's own scripts `sF-flux.mjs`, `sO3b.mjs` copied there, plus
`sX2tap.mjs`; `sum.mjs` prints the tables below).

| PR | Outcome | Commit | Game case |
|---|---|---|---|
| PR-0264 | fixed | `3b3999e9` | both (shared target plumbing) |
| PR-0302 | fixed | `094c038e` | both |
| PR-0303 | fixed (with a placement departure from the O3 phone frame, see askBailey 1) | `4e80c662` | both in code; only FFX takes the fallback |
| PR-0304 | fixed (cause was not the suspected one) | `2a8ce0f7` | FFX-2 in effect, code shared |

## PR-0264: a tap on a dimmed target confirmed it (fixed)

**Before (reproduced on 95e62e38):** 390x844 touch, Ch I, Kimahri Items > Hi-Potion (aimed
at Tidus), one tap on Yuna's figure: Yuna 750 HP to 0, KO, no forecast, no warning.

**Fix:** `src/ui/common/touchTapAim.ts` keeps the type of the latest `pointerdown` (capture,
on `window`). A click within 1.5 s of a touch or pen press, at a candidate that is not the
aimed one, only aims it. Then the O3 guard rails show, the same as after a swipe or an arrow
key. A second tap on the aimed figure, or CONFIRM, Enter or the pad commits. The FFX menu
(`CommandMenu.tryConfirmTargetById`) uses this for the bracket tap and for the CTB tile tap.
The FFX-2 menu (the cursor's click) uses it too. This is what the phone's own hint says:
"Tap another ally to switch". The mouse, keys and pad are unchanged.

**After (real input):**
- FFX 390x844 touch: first tap on Yuna shows "HI-POTION -1000 KO", the red warning in the
  target card and `stwarn-go` on CONFIRM ("HI-POTION -> YUNA"). HP stays 750. A second tap, or
  the CONFIRM button, uses it (HP 0, as the engine says).
  Screenshot: `docs/screenshots/r34fix-tap-hint-1-ffx-phone-first-tap-aims.png`.
- FFX-2 390x844 touch, Ch IV, Item > Potion (aimed at Yuna): first tap on Rikku moves the aim
  ("POTION -> RIKKU", no action), and the second tap commits.
  Screenshot: `docs/screenshots/r34fix-tap-hint-2-x2-phone-first-tap-aims.png`.
- Desktop 1600x900, unchanged: the arrows show the forecast and HP stays 750. A mouse click on
  Yuna still confirms at once (HP 0). That is the fb-0929 `guard` option, still off; see
  askBailey 2.

**Tests:** `tests/unit/pr0264-touch-tap-aim.test.ts` covers the helper, the FFX-2 menu, and
that a mouse click is unchanged. The FFX-2 case fails without the fix. A touch case on a real
Zombie Kimahri board was added to `tests/unit/fb0929-zombie-warning.test.ts`.

## PR-0302: the cure hint under 14 px (fixed)

The stage card now floors its stage px at `15 / --lb-scale`. It only grows where it was small.
The floor is 15, not 14, because the rendered-size read (box over offsetHeight) loses up to
5 % on a 9-px head. The phone card is 14.2 px and follows TEXT SIZE (FFX `data-text-size`,
FFX-2 `data-text-size-wide`, off per D-220 Q4).

Head / body effective px (critic `sO3b.mjs`, real keys and taps):

| Size | Before | After |
|---|---|---|
| 390x844 FFX / FFX-2 | 9.0 / 10.9 | 14.4 / 14.3 |
| 390x844 FFX TEXT SIZE 115 / 130 | 9.0 / 10.9 | 16.6 / 16.4, 18.9 / 18.4 |
| 1280x960 FFX / FFX-2 | 10.2 / 12.1 | 15.2 / 14.9, 15.2 / 14.8 |
| 1600x900 both | 12.8 / 15.2 | 14.2 / 15.2 |
| 2000x1012 both | 14.4 / 17.1 | 14.9 / 17.1 |
| 1600x900 FFX TEXT SIZE 130 | | 18.5 / 19.7 |

Command rows covered: 0 at every size. The card fits its box (`scrollFits`) everywhere.
Screenshot: `docs/screenshots/r34fix-tap-hint-4-ffx-1280x960-hint-floor.png`.

## PR-0303: the hint over the phone tap line (fixed)

**Before:** FFX 390x844 target step. The card sat at [8,685,374x59] and the tap line at
[8,727,374x17], an overlap of 6,241 px2.

There is no room in that column at 14 px. The target card, the hint, the tap line and
Back/Confirm need about 280 px, and the panel under the chips has 286 px including the 38-px
bottom margin. So the hint now stays under the target card only when it fits above the tap
line (or the bar). Otherwise it keeps the command menu's slot just above the party chips, where
it already sat one step earlier.

**After:** 0 px2 over the tap line, CONFIRM, the target card and the forecast, at TEXT SIZE 100,
115 and 130. FFX-2 (shorter card) keeps the under-card slot with 0 overlap.

**Disclosed:** in that slot the card covers the bottom corners of the aimed bracket and the
figures' feet, as it already does at the command menu. The name plate, the hand and the
forecast stay clear (see screenshot 1).

## PR-0304: the FFX-2 hint gone at some girls' menus with the guide open (fixed)

**Traced by running it.** The suspected cause (a collapsed or empty guide panel) is not what
happens. FFX-2's ATB plays an action while a menu is open. A-15's fade
(`src/ui/ffx2/actionFade.ts`) then puts `ffx2-actfade` (opacity 0) on the guide's
`.sgd__stack`, and the hint is a child of that stack, so it fades too.

**Before:** 1600x900 keys, Ch IV, 8 sampled girls' decisions. Yuna (twice) and Rikku had no
visible hint, with the stack faded.

**Fix:** while the stack carries the fade class, a solo copy shows in the hint's own stage
slot (the guide-folded slot). The copy in the guide stays put, so the guide's fit and the
fade's own box never change, and nothing flickers.

**After:** all 8 decisions show the hint (5 in the guide, 3 solo), with 0 console errors.
The commit message says 9 (6 + 3). It is 8; there is no amend.
Screenshot: `docs/screenshots/r34fix-tap-hint-3-x2-1600x900-solo-hint.png`.

## Gates

- `npx tsc --noEmit`: clean.
- Touched and related vitest files: 10 files, 149 tests, all green.
- Full `npx vitest run --testTimeout=60000`: 709 files passed, 5 skipped; 10,619 tests passed.
- `node tools/orphans.mjs`: `touchTapAim.ts` is reachable, and the 24 orphans are older.
- Rule 7: `ffx/CommandMenu.ts` stays at 865 lines and `ffx2/CommandMenu.ts` at 622 (each
  import line came out of a merged import or comment). New files are under 400 lines.
- No engine file was touched (rule 1). The forecast numbers are the engine's.
- I stopped the server I started, on port 5400.

## askBailey

1. **PR-0303 placement.** The approved O3 phone frame (`o3-vs-build-ffx-phone.jpg`) draws the
   hint under the target card, over the "Tap another ally" line. The fix moves it, on FFX, to
   the menu slot above the party chips at the target step. Alternatives: (a) keep it under the
   card and drop the tap line while a hint is up; (b) a one-line hint at the target step; or
   (c) move Back/Confirm into the 38-px bottom margin (fits only at TEXT SIZE 100).
2. **Desktop mouse click on a Zombie ally** still confirms at once. That is fb-0929's `guard`
   option (`?zombiewarn=guard`), built and off. The phone now aims first. Should the mouse
   match?
3. **The phone tap is now aim-then-confirm for every target that is not aimed**, enemies
   included, as the hint has always said. A tap on the aimed figure still commits at once.

## Not done / noticed

- The phone target card's red warning (`.stwarn`) is 13 px and the desktop slab is 6.8 stage
  px (about 17 at 1600x900, about 13.6 at 1280x960). Neither is in these PRs, so I left them.
- The fb-0929 `guard` and `word` options are unchanged and still off.
