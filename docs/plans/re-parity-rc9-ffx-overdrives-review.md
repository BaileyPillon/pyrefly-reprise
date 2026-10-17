# Paper preflight: RC9 lane FFX-A, the Overdrive minigames (FFX only)

Written before the build (AGENTS.md rule 15; `critic-plan` classes the engine folder as deep). Branch `re-parity-rc9-ffx-overdrives`, cut from `origin/r49-rc`
(`f939b87f`). Plan: `wiring-plan-draft-2026-10-11.md` lane FFX-A (A1 to A8) and `wiring-plan-addendum-2026-10-13.md`; note `FFX-G01` sections 6 and 7.

**Game case (rule 14): FFX only.** Swordplay, Bushido, Fury and Wakka's reels do not exist in FFX-2. Nothing under `src/battle/ffx2`, `src/data/ffx2`
or `src/audio` is touched; `ff7-golden` is not affected.

**Bailey's answers (D-763 to D-765, "all your recommendations"):** Q1 Bushido orders follow the game's executable (three of four change); Q2 Fury follows
the game's digital rule (two left/right pairs a rotation); Q3 Swordplay takes the game's narrower window and its frame-stepped marker. Each is shown in
before and after pictures (`docs/screenshots/rc9-overdrives/`). The release driver owns every screen: no overlay is redesigned, no input is added.

## What changes

| Row | Change | Where |
|---|---|---|
| A1 | Energy Rain 3.0 s (was 2.6), Blitz Ace 2.0 s (was 2.2) | `overdrive.ts#TIMER_MS` |
| A2 | Swordplay: the game's frame-stepped marker (11/12/13/14 units a frame on a 275-unit bar) and window (24/20/20/18 wide, centred; 8.7/7.3/7.3/6.5 percent), the press frame reported | new kernel `kernel/minigame-swordplay.ts`; `TidusTiming.ts` drives it at 30 frames a second; `inputs.ts` |
| A3-A5 | Bushido orders: Shooting Star inputs 2 and 7, Dragon Fang's last two, Tornado's first | new kernel `kernel/minigame-bushido.ts`; `inputs.ts` derives the tokens from the game's pad words |
| A6-A7 | Fury casts from the game's 17 digit rows chosen by spell group and Magic (at least 1 cast), the digital rule for the keyboard | new kernels `minigame-fury-tables.ts`, `minigame-fury.ts`; `fury.ts`; `LuluFury.ts` |
| A8 | Wakka's line classifier ported and proven; wired only where the symbols are established (a pair of Aurochs symbols is a Power Shot) | `kernel/reel-line.ts`, `reels.ts` |
| B3 seam | the result carries the controller frame (additive) so the damage lane can build A and B in float32 seconds | `types.ts` (contract entry) |

## Acceptance

1. Each kernel replays the game's own machine code, run in the emulator, on its vectors: 1,000+ Swordplay scripts, 350+ Bushido scripts, 90+ Fury scripts and
   the ladders, all 4,864 (spell, Magic) rows, 4,913 + 1,500 reel lines; a small mutant list per kernel disagrees with them.
2. An engine-level test with an independent oracle: the headless engine's Energy Rain and Blitz Ace limits, Fury's hit count for a rotation count (restated
   from the note's table, not from the kernel), the Bushido sequences the abilities publish (restated from the note's words).
3. Overlay tests (jsdom, real key events, fake clock): the marker steps at 30 Hz and a press in the window hits; the Bushido run takes one word a frame and
   a wrong press resets; Fury counts two left/right pairs a rotation.
4. Goldens: only what a changed number can reach moves. 12 seeds on every FFX chapter; 500 on the chapters whose shipped line fires these Overdrives.

## Order

Kernels and vectors first (nothing wired), then the data and the engine seam (`overdrive.ts`, `fury.ts`, `overdriveShape.ts`), then the three overlays,
then the tests and the measurements, then the pictures and the handoff.

## Risks

- The headless engine rolls its minigames from a stand-in (`rollDefaultMinigame`). Its draws are kept as they are (same count, same order) so no
  stream moves; only the numbers they are read against change (the two limits, the Fury table).
- The pad bit to key mapping of the PC build (live read 2026-10-13) differs from this game's keys; the overlay keeps its own keys and glyphs (the screen
  is the driver's). Listed under decisions.
- Gamepad stick rotation would be a new input; the analog controller is proven in the kernel and left unwired.
- Wakka's four lines, his time and start-time floats and the Miss symbol are unread (note open questions 1 to 3): the reel overlay and the Attack Reels
  rule stay as they are.
