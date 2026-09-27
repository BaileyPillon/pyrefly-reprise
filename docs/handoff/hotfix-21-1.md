# Hotfix 21.1: "the menu display broke" (release 21, d8837334)

Bailey, 2026-09-27 ~00:15 EDT: "the menu display broke for some reason please fix
hotfix". The screenshot was from the live build in Chapter XIII (Paragon, FFX-2), in a
wide, short desktop window. The help band was across the top, the command slab was cut
at the right edge (only "CHANG" showed), and the party panel was cut at the bottom right.

Game case: FFX-2 only (reported in Chapter XIII). No source change.

## Diagnosis (commit e31d0de0, branch hotfix-21-1)

This is not a HUD regression. Bailey's frame shows the Chrome infobar
"\"ChatGPT\" started debugging this browser". The whole page, WebGL field included, is
drawn at a 1.25 page scale and cropped to its top-left. That is a visual-viewport zoom,
and the page is never told about it: no resize event fires and `innerWidth` stays the
same. The same crop reproduces on the release 20 build (ce05b02c), so efbe052d (PR-0135)
is not the cause. Evidence frames are in `docs/screenshots/hotfix-21-1/`.

What Bailey should do: click Cancel on the debugging bar (or end that agent's
session), then reload.

## CHECK (independent, 2026-09-27)

I did not write e31d0de0. I checked it on my own production build of the worktree at
e31d0de0: `vite build`, served by `vite preview` on port 6210 and stopped by PID
afterwards. The browser was headless Chromium (`PYREFLY_BROWSER=gpu`), one at a time. The
probe was `.hotfix211-check-tmp.mjs`, untracked scratch.

**Gates.**
- `npx tsc --noEmit` is clean.
- `npx vitest run --testTimeout=60000`: 482 files passed and 4 were skipped (486). 8518
  tests passed, 29 were skipped and 1 is todo. Exit 0.

**Window shapes.** I tested 9 window sizes in each of four chapters, 36 cases in all.
- Sizes: 2000x890, 2560x1080, 3440x1440, 1920x1080, 1600x900, 1280x720, 1024x768, 390x844
  and 844x390.
- Chapters: IV (`ffx2-bahamut`), V (`ffx2-vegnagun-shuyin`), XIII (`ffx2-trema`) and the
  FFX control, Chapter I (`seymour-flux`).
- Each case opened the first command menu. First, a real Enter dismissed the onboarding
  coach mark, which takes that first Enter.
- The probe measured the rectangle that is actually visible, clipped by every scrolling
  or clipping ancestor. That covered the command slab, party panel, help band, enemy
  plates, intent slab, guide, advisor, PAUSE chip and coach mark. It also covered every
  element that carries text, anywhere on the page.
- Results: on the top menu, nothing was off screen in any of the 36 cases. In the
  submenus, nothing was off screen either, with the one phone-only exception listed
  under "Found" (not a regression).

**Command menu by real keys, at every shape.**
- FFX-2: I walked the cursor with ArrowDown and ArrowUp to CHANGE, pressed Enter and
  the dressphere list opened. Escape went back to the top list with the cursor still on
  CHANGE. I did the same for one ability list: Skill in Chapter XIII (13 rows) and White
  Magic in Chapters IV and V (7 and 16 rows). It opened, then Escape went back.
- All 27 FFX-2 cases passed. No Escape leaked into the pause screen.
- A long list scrolls inside the slab with the ▾ fold marker, as designed. At 2000x890
  in Chapter XIII the slab shows Darkness to Doom, and the rest are reached by scrolling.
- FFX, Chapter I: Special (4 rows) and White Magic (3 rows) each opened with Enter and
  closed with Escape at all 9 shapes. No regression.
- There were no page errors in any run.

**Bailey's frame, re-derived.**
- I reproduced it myself with CDP `Emulation.setPageScaleFactor(1.25)` at 1600x752, DPR
  1.25. `innerWidth` stays 1600 and `visualViewport.scale` becomes 1.25, so only 1280x602
  CSS px are visible. The command slab sits at CSS x 1172 to 1443, so it is cut at 1280.
  The frame matches his: "CHANG" at the right edge, the Yuna row cut, the field magnified.
- His slab shows **only** the CHANGE row, with nothing above it, while our repro shows
  four rows. That is game behaviour, not a layout fault. Chapter XIII ships the
  Oversoul Paragon (`TREMA_PARAGON_FORM = 'oversoul'`). Its Attack inflicts Itchy at
  chance 255: `src/data/ffx2/enemies/paragon-oversoul.ts`, with
  `OVERSOUL_ESTIMATES.attackItchy: true`. That is a wiki estimate. SinirothX lists the
  same on the plain Paragon, as `paragon-attack-itchy`. An Itchy girl's menu has only
  the spherechange rows (`src/battle/ffx2/targeting.ts` `buildCommands`). The slab is anchored at the
  bottom, so a single row sits where ITEM would be, which is where his CHANGE is.
- His Yuna at 0 HP under a 99999 is the enemy turn playing out under the open Active
  menu. The pump checks whether her menu is still valid only after the animation
  (`BattlePresenterActive.ts`).

**Found, not blocking (both existed in release 20 ce05b02c, checked on its build).**
1. Phone portrait (390x844), FFX-2 Change submenu: the "White Mage" label overflows its
   tile to the left. It shows as "TE MAGE", and the `GRANTS: YELLOW` line overlaps it.
   Measured: label x -25 to 88, tile x 8 to 191. The same happens on release 20 in
   Chapter XIII. The Chapter IV and V Change destinations (Gunner, Black Mage) are not
   affected. This is a candidate for the phone HUD batch and is not part of this hotfix.
2. Phone portrait, Chapter V White Magic: "White Magic Lv. 2" and "Lv. 3" are a little
   wider than their label box (text overflow). These rows are below the fold of the
   scrolling list. The same happens on release 20.

**Verdict:** no blockers. There is nothing to deploy for this report. The optional
`visualViewport` follow (in the diagnosis above) still needs Bailey's yes and is not
built.
