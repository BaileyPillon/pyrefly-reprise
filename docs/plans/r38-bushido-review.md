# r38-bushido paper preflight (AGENTS.md rule 15; `critic-plan` class DEEP)

**Game case: FFX only.** Bushido (Auron) and Swordplay (Tidus) exist only in FFX, chapters 1 to 3.
FFX-2 has neither overlay and does not read `src/data/ffx/overdrives/inputs.ts`. The one shared
piece is `src/ui/ffx/rawInput.ts` (a new `square` button): FFX-2's command menu reads the same
watcher, and no FFX-2 handler acts on `square`, so FFX-2 behaviour is unchanged.

**What breaks if this is wrong.**

1. A sequence the player cannot finish: every token in `BUSHIDO_SEQUENCES` must be a button the
   watcher can raise (keyboard and pad). `square` was missing; it is added (K, pad 2). A test types every
   sequence with real `keydown` events and a browser run typed all four.
2. The engine rolling its default outcome (AI, auto-battle) with the old 7: `rollDefaultMinigame`
   now reads the length from the ability's own `minigameParams.sequence`.
3. The route harness (critic tooling) typing a chip it has no key for: `BUSHIDO_KEYS` gains the square
   glyph (`k`); the existing test that reads the overlay's glyph table against the key table pins it.
4. Making Swordplay harder than live: Spiral Cut and Slice & Dice get easier (zone 22 % and 16 % against
   12.2 % today), Energy Rain is about the same, Blitz Ace is harder (about 63 ms against about 129 ms).
   Blitz Ace needs 80 cumulative Overdrives, so it is rare. The harness missed it twice in the proof run.
   Disclosed to Bailey; retuning is one number in `inputs.ts`.

**What is sourced and what is not.** Sequence lengths and the Swordplay ordering are sourced. The button
order is our estimate (GameFAQs order, Bailey 2026-10-03) and the Swordplay numbers are
`research/ffx-combat-core.md` §5.3's own `[estimate]` table. Both are labelled so in the data header.

**Not touched:** the camera grammar, the engine's damage rows, timers (Tornado 3 s stays), save data.
