# r38-bushido: Bushido and Swordplay play the Overdrive chosen (PR-0308, morning ask 13)

Branch `r38-bushido` (from main 3fb1de85), release 38 candidate. Never merged into main by this lane.

**Game case: FFX only.** Auron's Bushido and Tidus's Swordplay exist only in FFX (chapters 1 to 3). FFX-2 has
neither overlay and reads none of the new data. One shared file moved: `src/ui/ffx/rawInput.ts` gained a
`square` button; FFX-2's command menu reads that watcher, ignores `square` (checked in its `press`), so FFX-2
behaviour is unchanged.

## What changed

1. **Bushido sequences per Overdrive.** `src/data/ffx/overdrives/inputs.ts` (new) holds `BUSHIDO_SEQUENCES`;
   each Auron ability publishes its own as `extra.minigameParams.sequence`, which `minigameParams` already
   merged over its defaults. Lengths 8 / 7 / 7 / 6 (Dragon Fang, Shooting Star, Banishing Blade, Tornado) are
   sourced (`research/ffx-overdrive-input-rules-2026-09-30.md` D2, 4 sources). Before, the overlay ignored
   `inputs: 7` and played its own 7-chip default for all four.
2. **Button order = the GameFAQs order, labelled "our estimate"** (Bailey, 2026-10-03, ask 13, "all your
   recommendations"). Dragon Fang down, left, up, right, L1, R1, Circle, Cross; Shooting Star Triangle, Circle,
   Square, Circle, left, right, Cross (GF-KB as D3 records it); Banishing Blade up, L1, down, R1, right, left,
   Triangle (no source disagrees); Tornado Cross, right, R1, left, L1, Triangle. Source notes are in the data
   header and in the research note ("Applied in release 38"). The GameFAQs page itself is behind a Cloudflare
   check that did not clear in headless Chromium (two 30 to 70 s tries); I did not work around it, and used only
   what research/ already transcribes (D3).
3. **Square button.** Shooting Star needs one and the HUD input watcher had none: keyboard `K`, pad button 2.
   The overlay draws it as a square chip; the route harness key table maps it to `k`.
4. **Swordplay zone and speed per tier: wiring only, numbers owed (repair cycle).** The overlay reads
   `zonePercent` and `travelMs` (`swordplayGeometry` in `src/ui/ffx/minigames/logic.ts`); the abilities publish each
   tier's pair from `SWORDPLAY_TUNING`. The ordering (narrower, faster, shorter timer as the Overdrive gets stronger) is
   sourced and the timers already carried it; the zone and speed numbers are NOT sourced (`ffx-combat-core.md` §5.3's
   table is `[estimate]`, and ask 13 was the button order only). So every tier holds today's pair, `zonePercent` 12.22,
   `travelMs` 1 059 (22 px half width and 340 px/s on the 360 px meter): live Swordplay plays exactly as before.
   The first cut of this branch shipped the §5.3 estimates (22/1 400, 16/1 150, 12/900, 9/700); the independent check
   flagged that as a blocker and it is reverted in data (commit message names it).
5. `rollDefaultMinigame` (AI, auto-battle) reports a full run as the Overdrive's own length, not 7.

## Proof

- `npx tsc --noEmit` clean. Orphans unchanged (24). `overdrive.ts` stays at 472 lines (it may not grow).
- Targeted: `tests/unit/ffx-overdrive-inputs.test.ts` (new, 33 cases: lengths, order, each ability carries its
  own, engine request params per Overdrive, real overlay chips and real-key completion for all four Bushidos,
  Dragon Fang not complete at 7, Swordplay zone and marker per tier, the Square key), plus the updated
  `ffx-overdrive-overlay-title`, `ffx-bushido-wrong-press-reset`, `ffx-swordplay-miss-restart`,
  `critic-route-harness`.
- Full suite: see the result line in the return message.
- **Real keys in a headless browser** (chapter II, seed 1, GPU Chromium, 1600x900; only setup hook: gauge 100 and
  every Overdrive unlocked for Tidus and Auron at each menu; the rest are real key presses through the menu and
  the PR-0261 route harness's `playMinigame`): Dragon Fang showed **8 chips** (down, left, up, right, L1, R1,
  Circle, Cross) and the engine received `correctInputs: 8, success`; Shooting Star (with the Square chip, key K)
  7 of 7; Banishing Blade 7 of 7; Tornado 6 of 6; (first cut, before the repair) Spiral Cut zone 22 %, Blitz Ace zone 9 %: superseded by the repair proof below. Records:
  `docs/screenshots/r38-bushido/proof-run-*.json`; overlay frames `*-overlay.png` beside them.

## critic-plan class

`node tools/critic-plan.mjs --paths <the shipped files>`: **DEEP** review (FFX CTB engine is a shared system,
`overdrive.ts`), focused before deploy, live verification and deep review after (obligations live + focused +
deep). **Not the save-data class** (no `SaveData.ts`, schema or migration), so no `-savedata` branch. Paper
preflight: `docs/plans/r38-bushido-review.md`.

## For Bailey

- **The Bushido button orders are our estimate.** Shooting Star's is the one GameFAQs guide (KeyBlade999) and
  matches no other source; if it is a typo in the guide the Steam copy will show it. One line each in
  `src/data/ffx/overdrives/inputs.ts`.
- **Swordplay is unchanged for the player.** The per-tier zone and speed wiring is in, but every tier holds today's
  12.22 % zone at 1 059 ms because the sourced ordering has no published numbers. Say yes to the §5.3 estimates
  (22 % / 1 400 ms down to 9 % / 700 ms; Blitz Ace's window would drop from about 129 ms to about 63 ms) or give
  numbers, and it is a four-row edit in `src/data/ffx/overdrives/inputs.ts`.
- Shooting Star adds a Square key (K) the game never had; there is no on-screen hint for it beyond the chip.
- Not done: the Steam HD check that would settle the orders (two earlier tries never got past a white window).

## Check (independent critic, 2026-10-03, branch tip adc648d5; the builder's report was not used as evidence)

**Game case: FFX only**, confirmed. The only shared file is `src/ui/ffx/rawInput.ts` (new `square`: K and pad button 2).
Its consumers were read: FFX-2's `CommandMenu` `press` returns false for it, `CoachMark` counts any other button as
"navigated" (harmless), `Briefing` and `TriggerPrompt` ignore it, and nothing else binds `KeyK` or pad button 2.
FFX-2 behaviour is unchanged.

**Verdict: one blocker (an unsourced Swordplay change, against the brief); everything else passes.**

### Ran and passed
- `npx tsc --noEmit`: clean. `node tools/orphans.mjs`: 24 (unchanged; `inputs.ts` is imported by the ability files).
- Targeted: the 5 lane files (90 tests) plus 18 more files on the same surfaces (every `ffx-bushido-*`,
  `ffx-overdrive-*`, `ui-ffx-minigames`, `ui-ffx-overdrive-*`, the FFX-2 command menu and gamepad tests, `input`,
  `data-ffx-tables-abilities`, `vis-fix-overdrive-name`, `ui-coach-input-leak`): 23 files, 291 tests, all pass.
- Full suite (`--maxWorkers=3`, machine at about 85 % CPU): 768 files passed, 11,304 tests passed, 1 failed:
  `tests/unit/strategy-ffx2-bahamut.test.ts` "heal-only route (no Shell, no Breaks) clears Mega Flare", which is a
  15 s **timeout, not an assertion**. It timed out again when run alone under the same load and passes (19 of 19)
  with `--testTimeout=90000` (that test takes 18.6 s here). FFX-2 Bahamut shares no code with this change.
  Load-related, as the builder said.
- Layering: `src/battle/ffx/overdrive.ts` imports no DOM or three; `inputs.ts` imports nothing. File sizes:
  `overdrive.ts` 472 (also 472 at 3fb1de85, it did not grow), `logic.ts` 194, `rawInput.ts` 227, `inputs.ts` 84.
- Merge with `origin/main` 53c63aa6 (docs, `policy.json`, artifact manifest only): `git merge-tree` is clean.
- The commit message carries the game case (FFX only), the critic-plan class (DEEP, not save-data) and the proof.
  The paper preflight `docs/plans/r38-bushido-review.md` exists. `critic-plan` on the shipped files: DEEP, obligations
  live + focused + deep (it prints `previous build c69de96a`; same class as the builder's).
- **Real keys, headless Chromium (GPU args), 1600x900, Yunalesca chapter, seed 1.** The only setup hook is gauge 100
  and every Overdrive unlocked for Auron and Tidus; every menu step and every minigame input is a real key press
  (chips typed through `keysForChips`, which maps the shown glyphs to keys). Script
  `D:/Tools/pyrefly-scratch/2026-10-03/r38-bushido-check/check.mjs`, records `chk3-run.json` and `chk4-run.json`:

  | Overdrive | Shown | Keys typed | Engine received |
  |---|---|---|---|
  | Dragon Fang | 8 chips: down left up right L1 R1 circle cross | ArrowDown ArrowLeft ArrowUp ArrowRight f r x Enter | `correctInputs: 8`, success |
  | Shooting Star | 7 chips incl. the square: triangle circle square circle left right cross | q x **k** x ArrowLeft ArrowRight Enter | 7, success |
  | Banishing Blade | 7 chips: up L1 down R1 right left triangle | ArrowUp f ArrowDown r ArrowRight ArrowLeft q | 7, success |
  | Tornado | 6 chips: cross right R1 left L1 triangle | Enter ArrowRight r ArrowLeft f q | 6, success |
  | Spiral Cut | zone starts 39 %, width 22 % | one Enter | success, timer 3000 |
  | Slice & Dice | zone starts 42 %, width 16 % | one Enter | success, timer 3000 |
  | Energy Rain | zone starts 44 %, width 12 % | one Enter | success, timer 2600 |
  | Blitz Ace | zone starts 45.5 %, width 9 % | one Enter | success, timer 2200 |

  No console errors in any run. **Live release 36** (`baileypillon.github.io/pyrefly-reprise`, same script): Dragon Fang
  shows **7 chips** (up down left right cross circle triangle) and Blitz Ace's zone is **12.2 %**, the same as every
  tier. So the defect reproduces live and the branch fixes it. Screenshots are in
  `D:/Tools/pyrefly-scratch/2026-10-03/r38-bushido-check/` (`chk3-*.png`, `chk4-*.png`, `live-*.png`); the builder's
  are in `docs/screenshots/r38-bushido/`. The Vite server I used (port 6311, PID 70940) was stopped.
- Every number against its source. Lengths 8/7/7/6 match `ffx-overdrive-input-rules` D2 (4 sources). The glyph to
  token mapping (cross = confirm, circle = cancel) was checked row by row against the `ffx-combat-core.md` §5.5
  table: Dragon Fang and Tornado equal the table's NA/JP variants; Shooting Star equals the GF-KB order written in
  D3; Banishing Blade equals the table's "unchanged across versions". The Swordplay values equal §5.3's table. The
  timers (3000, 3000, 2600, 2200; Tornado 3000) are untouched.

### Blocker
1. **Swordplay zone and speed are unsourced numbers, shipped against the brief.** The brief said zone and speed per
   tier "only where sourced; unsourced stays as today and is reported". `ffx-combat-core.md` §5.3 says the exact
   values "are not published anywhere"; its table is tagged `[estimate]` ("authored values ... Tune freely; they are
   not facts"), and rule 6 says an unsourced value is reported, not guessed. Bailey's ask 13 covers only the button
   order. The branch changes live gameplay on those estimates: Blitz Ace's window drops from about 129 ms to about
   63 ms (harder than live), and Spiral Cut and Slice & Dice get easier. Only the ordering (stronger tier means
   narrower zone and faster marker) is sourced.
   **Fix, one data edit:** make every `SWORDPLAY_TUNING` row today's values, `zonePercent: 12.22, travelMs: 1059`
   (today's overlay plays a 22 px half-width zone at 340 px/s on a 360 px bar), keep the `swordplayGeometry` wiring so
   the sourced numbers can be dropped in later, and report the ordering as sourced and the numbers as still owed.
   Or get Bailey's explicit yes to the §5.3 estimates. The builder disclosed this plainly in its handoff; I call it
   outside the brief, not hidden.

### Disclose (not blockers)
- **The GameFAQs order is only partly written in research/.** D3 records GF-KB's full order for Shooting Star only.
  For Dragon Fang and Tornado it records "ends Circle, X" and "starts X" (the rest is the NA/JP order in the §5.5
  table), and it records nothing from GF-KB for Banishing Blade. So "the GameFAQs order" is reconstructed from D3 plus
  the NA/JP table. The builder labelled it "our estimate" in the data header, the research note and the handoff. I
  tried the GF-KB page once in headless Chromium (up to 100 s): Cloudflare's bot check did not clear, and I did not
  work around it. Shooting Star's GF-KB order matches no other source (a possible typo in the guide).
- Square (K, or pad button 2) has no on-screen hint beyond the chip.
- `rollDefaultMinigame` (AI and auto-battle) now draws `int(0, len - 1)` instead of `int(0, 6)`: the same number of RNG
  calls, but a seeded auto-played Dragon Fang can differ from before. The suite passes and no replay log depends on it.
- The worktree has three tracked edits that are not this lane's (`src/engine/tactics/evrae-quiet.ts`, `sin-common.ts`,
  `sin-fins-core.ts`). I did not touch or stage them; my browser runs served the working tree including them, with no
  effect on the overlays.

## Repair cycle (after the independent check)

Blocker: unsourced Swordplay zone and speed. Fix: every `SWORDPLAY_TUNING` row is `{ travelMs: 1059, zonePercent: 12.22 }`
(today's play), `swordplayGeometry` wiring and the Bushido work kept; the engine's base `tidus-timing` params and the
research note say the same. Game case: FFX only. critic-plan class unchanged (DEEP, not save-data). Proof: see
`docs/screenshots/r38-bushido/repair-*.json`.
