# r63-rc: release 63 assembled (the conference build)

Written 2026-10-24 by the assemble lane (a Sonnet sub-agent of the Echoes of Spira release driver). Branch `r63-rc`, tree `D:/pyrefly-rig-rikkudk`, from `origin/main` `56efaf81c` (release 62 `c8ecbcb31` plus its records). Nothing here deploys (the driver runs `tools/deploy-pages.mjs`). Bailey, 2026-10-24 ~18:00 EDT: "I'll go with all of your recommendations. You make the calls please." Earlier standing words: "deploy every release as soon as its review says it can ship".

**Game case (AGENTS.md rule 14):** both games for the plumbing; every piece acts in Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2) only, the booth flow in demo mode only. Each lane's own case is in its handoff note and in the CHANGELOG entry (FFX only / FFX-2 only / both per line). The three driver calls below: 201a both (docs), 201b FFX-2 only, 201c both (demo mode).

## What merged (all `--no-ff`, one merge commit each)

| order | branch (tip) | merge commit | conflicts | resolution |
|---|---|---|---|---|
| 1 | `origin/r63-play` (`03116347d`; includes the fight-prebuild merge `1bc679554` and the booth kit) | `35ab1b1d4` | none | |
| 2 | `origin/r64-fixes` (`145e2221c`) | `27ec77049` | none | |
| 3 | `origin/r64-defaults` (`cf1c91876`) | `5d343382b` | `src/app/screens/BattleScreenFlow.ts`, the import block: r64-fixes added `retryTheme`, `retryThemeSwitchedOff` to the `demoDefeat` import; r64-defaults added the `ThanksEnd` type and `boothNewOn` | both sides kept (one `demoDefeat` import with all four of r64-fixes's names; one `demoThanks` import with the type; the `boothSwitch` import) |
| 4 | `origin/r64-art` (`f819d4cde`) | `a7d0820a0` | none (`boothCards.ts` was touched by both r64-defaults and r64-art and merged cleanly; its tests pass) | |
| 5 | `origin/r64-numbers` (`1fa8a2d4c`) | `0bdb21d11` | none | |

r64-fixes, r64-defaults, r64-art and r64-numbers are each r63-play plus a few commits, so the order only mattered for the one conflict. The merge commit of r64-fixes says "fixes F1 to F6"; that is loose (F1 to F4 are fixed, F5 and F6 are open, see `r64-fixes.md`): a message cannot be changed without an amend, which the rules forbid, so this note is the correction.

The tree's `public/art` junction points at `D:\pyrefly-art-r64` now (it pointed at `D:\pyrefly-art-r63`). The untracked `tools/rig/subjects/*.json` belong to another lane and were left alone.

## The driver calls (each its own commit)

| item | commit | case | what |
|---|---|---|---|
| **201a** | `2b08c23aa` | both, docs only | README (the music, sound and painting paragraphs) and `docs/ARCHITECTURE.md` (the engine decision line, the Legal section) no longer claim "original", "synthesised at runtime, so the build ships no audio files" or "nothing is ripped". They say what is true: an unofficial, non-commercial fan tribute; Final Fantasy X and X-2, their characters, worlds and names belong to Square Enix; the music is composed as code and rendered to audio files (some tracks AI-generated), the effects are layered from freely licensed libraries, the Chapter I voices are AI-generated, the paintings are AI-generated on Bailey's machine; the Credits screen lists every third-party source. The README's notice paragraph (the FAN_NOTICE text) is untouched. One line beyond the brief: `ARCHITECTURE.md` line 7 said "Web Audio synthesis for original music and SFX" and now says "Web Audio for music and SFX (rendered audio files, with a synthesiser as the fallback)". Historical entries (`CHANGELOG.md`, `docs/changelog/project-start.md`, `research/assets-and-tech.md`) are history and were left alone. |
| **201b** | `c4e6eff3b` | FFX-2 only | Chapter IV, non-booth path, first command menu: the Intel slab was drawn across the active girl's header ("Paine WARRIOR") and brushed the cue. `intentBoard.BOARD_SELECTORS` now lists `.f1-hero` and `.f1-cue`, so the placement solver steers the slab off them (they are `display: none`, zero size and skipped, when the F1 HUD is off or no menu is open). **Real run** (`D:/Tools/pyrefly-scratch/2026-10-24/r63-rc/check-intel.mjs`, vite on 5391, headless GPU Chromium, 2560 x 1440, no address word, the chapter board to the first menu): slab over the hero 43,264 px squared and over the cue 523 before; 0 and 0 after, 0 over the command stack, party cards, guide, advisor card and ribbon; the slab sits left of Bahamut (box 617..1217 x 304..702), 0 console errors. Frames `docs/screenshots/r63-rc-intel-ch4-before.jpg` and `-after.jpg`. Test `tests/unit/r63-rc-intel-hero.test.ts` (3); the 11 intent, text-size and F1 HUD test files around it pass (149 tests). Side effect to know: the chain counter's obstacle list is the same list (`chainObstacles`), so the chain chip also keeps off the hero and cue. |
| **201c** | `7a12e65d7` | both, demo mode with the booth screens | After the picker idles back to the title the attract card is up at once. `demoIdle.noteIdleReturn` / `takeIdleReturn` (a latch, fresh for 10 s); `DemoBoardScreen.checkIdle` makes the note before `settle(null)`; `enterDemoTitle` starts its `IdleClock` already run out when it takes a fresh note. A visitor's Esc makes no note (the title counts its minute from the press, as before). With `?attract=reel` the reel starts at once instead. **Real run** (`check-picker-idle.mjs`, `?demo=1`, 1280 x 720): title, Enter, the picker, the page clock skewed +61 s: the title at 258 ms and the card at 259 ms, 0 console errors (`docs/screenshots/r63-rc-picker-idle-card.jpg`). Test `tests/unit/r63-rc-picker-idle-title.test.ts` (10); the six neighbouring files (demo-title, booth-attract, booth-switch, r64-defaults, r64-defaults-card) pass. |

One test fix from the first full run, `cb928dadb`: `number-spacing-layer.test.ts` pinned "the glass numbers are off with only the chapter set"; the pack is on by default now, so it names `setProMode('today')` (tests only).

Calls with no change, recorded in the CHANGELOG entry: B at the top of the command menu keeps today's behaviour (it opens the pause; unsourced); the party-swap ease (FFX) and the retry theme stay on (`?partyswap=off`, `?retrytheme=off`); `?livingpre` stays off.

## The CHANGELOG entry and the player note

`CHANGELOG.md`: one "Release 63" entry (dated 2026-10-24, three pictures), the entry count 85 to 86. `src/app/changelog/releaseNotes.ts`: the 63 note, six lines (Both x4 counting the booth line, FFX, FFX-2), each under 200 characters, no hidden chapter named; `tests/unit/release-notes.test.ts` and `tests/unit/deploy-release-gate.test.ts` pin 63 (63 goes, 64 is refused until its note is written). `node tools/candidate-build.mjs --dry-run` reads release 63. **If the deploy goes past midnight, the note's date (`2026-10-24`) may need the live day; the validator only needs it not to be before 62's.**

## Checks (on the final tree)

`tsc --noEmit` clean; `node tools/orphans.mjs`: 24 orphans, none new; `node tools/audio/qa.mjs --strict --quiet` exits 0; `promises.mjs --release-check origin/main..r63-rc`: closes 0, names 0, touches 0, 26 built promises wait, 81 untouched (the tool reads the repo `D:/Final Fantasy`, so it needs the branch name, not `HEAD`). **Full unit suite:** run 1 had one red file (`number-spacing-layer.test.ts`, a pin on the old default; fixed in `cb928dadb`, tests only); runs 2 and 3 had only 15 s timeouts under another lane's Blender render (`advisor-floor`, `advisor-menu`, `tourist-trap-bench`, `demo-kit`), all passing alone; **run 4 with `--maxWorkers=8` on the final code: exit 0, 1,623 files passed, 25,802 tests passed**. Logs: `D:/Tools/pyrefly-scratch/2026-10-24/r63-rc/runs/fullsuite{,2,3,4}.out`. The deploy preflight runs `npx vitest run` itself and meets the same timeouts if a render is running.

## Open, for the driver

- **Playwright e2e specs were not run** (r64-defaults m4): Chapter I and IV now play with the F1 HUD, the new camera and the sound pass by default in `tests/e2e/*` too; a spec reading the old HUD's selectors in those two chapters (`hud-collision`, `enemy-visibility`, `ffx2-wait-framing`, `advisor-*`, `sensor-immune-hidden`) may need `?pack=off` or the new selectors.
- The limiter chain is built on every page, Chapter II too (r64 review m7), not measured.
- `BattleScreenFlow.ts` (649 lines), `Input.ts`, `demo.css` and `DamageNumbers.ts` (912) were over the 400-line house rule before this release and are still.
- r64-fixes F5: OTHER FIGHT from a lost fight takes 10 to 12 s to the first menu (both builds, not prebuilt).
- Mega Flare's wash eases out over 260 ms when a menu opens mid-breath (r64-numbers question 1; not measured live).
- No production build was made in this lane (`dist-gate` untouched); the deploy builds it, hashes the art and runs the preflight.
- NOW.md, the ledgers and `ACTIONS.md` are the driver's records and were not touched here.
