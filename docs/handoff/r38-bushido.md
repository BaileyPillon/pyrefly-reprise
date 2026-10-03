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
4. **Swordplay zone and speed per tier.** The overlay now reads `zonePercent` and `travelMs`
   (`swordplayGeometry` in `src/ui/ffx/minigames/logic.ts`); the abilities publish each tier's pair. The
   ordering (narrower, faster, shorter timer as the Overdrive gets stronger) is sourced; the numbers are
   `ffx-combat-core.md` §5.3's own `[estimate]` shipping table (22 % / 1 400 ms, 16 % / 1 150, 12 % / 900,
   9 % / 700). Before, every tier played a 12.2 % zone at 1 059 ms a crossing.
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
  7 of 7; Banishing Blade 7 of 7; Tornado 6 of 6; Spiral Cut zone 22 % (39 to 61), hit; Blitz Ace zone 9 %
  (45.5 to 54.5), the harness missed twice and the timer failed it (see For Bailey). Records:
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
- **Blitz Ace got harder** (about 63 ms window against about 129 ms today); Spiral Cut and Slice & Dice got easier
  (about 308 and 184 ms). These Swordplay numbers are the research note's estimates, not facts; you asked for
  only the button order, so say if you would rather keep Swordplay as it was or soften Blitz Ace.
- Shooting Star adds a Square key (K) the game never had; there is no on-screen hint for it beyond the chip.
- Not done: the Steam HD check that would settle the orders (two earlier tries never got past a white window).
