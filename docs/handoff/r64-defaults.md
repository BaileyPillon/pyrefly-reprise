# r64 defaults: the conference pack on by default, the party's rim off, the booth's end-card hold and idle returns, the notice (branch `r64-defaults`, from `r63-play` `03116347d`)

Written 2026-10-24 by the "defaults" lane (a Sonnet sub-agent of the Echoes of Spira release driver). Bailey, 2026-10-24 ~13:40 EDT, verbatim: "you can make all the decisions for me, ill go with all your recommendations. i still cant play it unfortunately. time crunch." The driver's calls under it are items 200a to 200k in `D:/Tools/pyrefly-scratch/2026-10-07/decisions-to-record.md`; this lane built 200b, 200e, 200h and 200i. Each is the driver's recommendation, accepted in advance, Bailey's to overturn.

**Game case (AGENTS.md rule 14): BOTH games.** The plumbing is shared. Every piece acts in Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2) only (`engine/motion/DemoGate.ts`); the booth flow acts in demo mode (`?demo=1`) only; every other chapter, screen and address is release 62.

## What changed

| item | what it is | where |
|---|---|---|
| **200b** the pack is ON by default in Chapter I and IV | `DemoGate.packDemo(search)`, the one pack reader every lane's switch asks, answers: `?pack=demo` on; `?pack=off` (or `today`, `0`) off; **no pack word: `PACK_DEFAULT_ON` (new, `true`; the one line to flip back)**; `undefined` (no page: every node-environment unit test) off, as before. Every consumer already gated itself on the running chapter or on demo mode, so nothing outside the two chapters moves. The feel lane had its own `word('pack') === 'demo'`; it now asks `packDemo` too. | `src/engine/motion/DemoGate.ts`, `src/engine/feel/FeelSwitch.ts` |
| **200e** the party's edge light OFF by default | with no `?partyrim=` word the rim follows the pack: off while the pack is on (`?pack=demo` too), on under `?pack=off`; `?partyrim=on` brings it back, `?partyrim=off` still works. The switchboard key `'` is unchanged. | `src/engine/look/pro/PartyRimSwitch.ts` (+ comments in `RimFigures.ts`, `switchboardModel.ts`) |
| **200h** the notice | the sentence "All code, art, music, and writing here are original." is gone from `FAN_NOTICE`, the README and the press page (they stay equal to each other, as the tests hold them). Kept: the property line ("Final Fantasy X and X-2, their characters, worlds, and names are the property of Square Enix.") and the not-affiliated line ("This project is a non-commercial fan work, unaffiliated with Square Enix."); the press page keeps "An unofficial fan tribute" and its "unaffiliated with Square Enix" status row. | `src/app/credits/creditsData.ts`, `README.md`, `public/press/index.html` |
| **200i** the end card | the Echo end card after a won fight holds 8 s (`THANKS_MS`, unchanged) and carries a small pad glyph with **"Press any button"** at the foot of the left column, in the card's own label type (`.booth-scan`, 16 grid units: **28.4 px measured at 2560 x 1440**). A press after the 0.7 s guard goes to the picker at once, as it always did. **A card that runs out its 8 s untouched sends the flow to the TITLE** (`DemoThanksScreen.endedBy`; `GameFlow.start` reads it). | `src/app/demo/demoThanks.ts`, `boothCards.ts`, `boothCards.css`, `src/app/screens/BattleScreenFlow.ts` |
| **200i** the picker | 60 s with nobody at the fight picker (no key, click, touch, wheel, real mouse travel, pad button or stick; the title's own idle clock) returns to the title through the cancel's own path (`ChapterSelectScreen.settle(null)`, now `protected`). The title's own 60 s then puts the attract card up. | `src/app/demo/demoBoard.ts`, `demoIdle.ts` (`PICKER_IDLE_MS`) |

The booth flow (200i) is on with the booth screens: `boothNewOn()`, so `?booth=today` or `?pack=off` keeps release 62's cream thanks card and a picker that waits for ever.

## How to get the old behaviour

| word | what it does |
|---|---|
| `?pack=off` | the whole pack off: release 62 / r63-play's defaults (every lane, the HUD, the sound pass, the booth screens, the prebuild, the party's rim back on) |
| `?pro=off` `?hud=today` `?audio=today` `?boss=today` `?prebuild=off` `?booth=today` | one lane off, the rest on (each beats the pack, as it did) |
| `?partyrim=on` | the party's edge light back |
| `?pack=demo` | unchanged: the pack on (the playtest address `?demo=1&pack=demo&switchboard=1` plays as before, except the rim is now off by default there too) |

**`?switchboard=1` alone does not install the playtest keys** (it asked `packDemo`, which is now true everywhere; `switchboardWanted` names `?pack=demo` itself so a public address with the one word does not grow keys that swallow 1 to 9, 0, `-` and `=`).

## Tests

- `tests/unit/r64-defaults.test.ts` (new, 40): the pack reader; 20 lanes each on with no word / `?demo=1`, off with `?pack=off` / no page / its own word (and its word beats `?pack=demo`); the party rim; the end card's hint, its 28 px floor, `endedBy` for timer, press, click, leave; the flow to the title after a timer only (press, leave and booth-off go to the picker); the picker's idle (59.999 s waits, 60 s leaves, keys/clicks/touch/wheel/pad restart the minute, booth-off waits for ever); the notice gone from FAN_NOTICE, README and press page.
- Existing tests that pinned the old default, updated to the new one with the old behaviour kept under `?pack=off` (or the lane's word): `audio-pass`, `audio-pass-mixer`, `audio-pass-presenter`, `audio-pass-voice`, `booth-switch`, `booth-press-page`, `chapter-music-warm`, `demo-title`, `feel-motion-sfx`, `feel-punch`, `feel-shadow`, `feel-switch`, `fx-new-switch-guard`, `hud-f1-switch`, `prebuild-figures`, `pro-look-arena`, `pro-look-numbers`, `r61-visual-style`, `r62-demo-results-music`, `r62-demo-warm`, `engine/boss-clean`, `engine/demo-motion-int`, `engine/motion-core-curves`, `engine/motion-core-moments`, `engine/motion-core-smear`, `engine/pro-staging`, `engine/procam-core`, `engine/r63-int-switches`, `engine/real-motion`, `engine/rim-figures`.
- Run: `npx tsc --noEmit` clean; the 124 test files that import any touched module or the pack word: all pass; the other 415 jsdom files (the only ones with a page address): all pass except `exp-leblanc` (its art sha256 against the release tree: fails identically with `PACK_DEFAULT_ON = false`, it is the r63 art mirror). The node-environment files have no page address and read "today", so they cannot move; a full `npm test` is not run in this lane (1283 files; a run needs more than the 9-minute job limit).

## Evidence (dev server 5378, headless Chromium on the real GPU at 2560 x 1440; frames and reports in `D:/Tools/pyrefly-scratch/2026-10-24/defaults/evidence/`)

Entered from the chapter board with `window.__pyrefly.chapterSelect()`, `select:<id>`, `prep:begin`, the cutscene skipped, the first command menu up, **no query at all in the address**:

| chapter | F1 HUD (`hudF1On`, `.hud-f1` in the page) | party rim | pro look | pro camera | pro staging | boss edges | motion pack (curves, moments, smear, fx) | sound pass |
|---|---|---|---|---|---|---|---|---|
| Chapter I `seymour-flux` (FFX) | on | off | on | on | on | on | on | on |
| Chapter IV `ffx2-bahamut` (FFX-2) | on | off | on | on | on | on | on | on |
| Chapter II `yunalesca` (the control) | **off** | rim as today | off | off | off | off | off | off |

Booth flow (`?demo=1` only, no pack word): the picker came up with the booth screens on; a seed-7 fight to the results with the pass at skip speed; the end card showed "Press any button" at **28.44 px** (box 199,1353 to 564,1390 of 2560 x 1440, in view); left alone it went to the title after 8.4 s (`demo-thanks` then `title`).

Frames (2560 x 1440 PNG): `ch1-seymour-flux-FFX-3-first-menu.png`, `ch4-bahamut-FFX2-3-first-menu.png`, `ch2-yunalesca-control-*.png`, `booth-timer-3-endcard.png`; the booth press path and the picker idle are in the report (`report-B2.json`) when it ran (see the end of this file).

## What is not done, and what to know

- **No public deploy, no changelog entry, no NOW.md change** (the driver's): the changelog lines for this build are the table above, game case both.
- **Playwright e2e specs were not run.** Chapter I and IV now play with the F1 HUD, the new camera and the sound pass by default in `tests/e2e/*` too; a spec that reads the old HUD's selectors in those two chapters (`hud-collision`, `enemy-visibility`, `ffx2-wait-framing`, `advisor-*`, `sensor-immune-hidden`) may need `?pack=off` or the new selectors. Unit coverage is above; the real-input check is the evidence section.
- The brief named a not-affiliated wording "not affiliated with or endorsed by Square Enix"; that is the press mockup's sentence, which the build never used (it prints `FAN_NOTICE` verbatim, "unaffiliated with Square Enix"). The notice keeps its existing wording; adding "or endorsed by" is a one-line change in `creditsData.ts` (the README and the page must change with it: a test holds them equal).
- A different sentence in `docs/ARCHITECTURE.md` (line 127, "All code, art, music and text are original. No retail models ... are included.") and the historical entries in `CHANGELOG.md`, `docs/changelog/project-start.md` and `research/assets-and-tech.md` were left alone: they are history or internal docs, not the notice.
- After an idle return from the picker the title counts its own 60 s before the attract card appears (two minutes in all from the last press). Making the card come at once on an idle return is a few lines in `demoTitle.ts` if the driver wants it.
- `src/app/screens/BattleScreenFlow.ts` was 635 lines before this lane (over the 400-line house rule) and is 647 now; the new lines are the title return only.
- The governor (`DemoGovernor`) acts whenever a pro lane is on in a demo chapter, so it is now on by default there as well (part of the pack; `?govern=off` still stops it).
- Party rigs stay OFF (`?partyrigs=on` only), as 200a says; the pack never turned them on and still does not.
