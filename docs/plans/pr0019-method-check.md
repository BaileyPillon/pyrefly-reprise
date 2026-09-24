# PR-0019 method check (AGENTS.md rule 15, third attempt)

**Defect:** the "ALL ALLIES"/"ALL ENEMIES" group-target chip (`TargetCursor.ts`'s
`.ffx-target__all`) can paint over the tail of the command help slab's sentence
(`.ffx-cmd-info`). FFX only — FFX-2's command help slab is switched off
(`FFX2_COMMAND_HELP_PLACEMENT_RESOLVED = false`), so it has no slab to cover.

**Attempt 1 (c2ab3db, round 10):** `z-index: 2` on `.ffx-cmd-info`, reasoning
that neither `.ffxhud__stage` nor `.ffxhud__overlay` establishes a stacking
context, so the z-index alone would be enough to out-rank `.ffx-targeting`
(`z-index: 36`).

**Attempt 2 (de254bdf, round 11's "verify"):** re-ran the round-10 repro and
declared it fixed on the strength of `elementFromPoint` never returning the
chip. The round-12 verifier refuted this: `elementFromPoint` can't return the
chip regardless of paint order because the chip is `pointer-events: none` —
the check passes whatever is actually painted, and a screenshot (never taken)
would have shown the chip still over "party." at 1280x720 and 1600x900. No
source change was made in this attempt; it only re-asserted attempt 1.

**Why both failed — the actual mechanism:** `LetterboxStage` sets an inline
`transform` on `.ffxhud__stage` (the letterbox scale/offset). A transformed
element establishes a stacking context of its own. `.ffx-cmd-info`'s
`z-index: 2` is scoped *inside* that context — it can reorder paint among
`.ffxhud__stage`'s own descendants, but it cannot reach out and out-rank
`.ffx-targeting` (a sibling of `.ffxhud__stage` under `.ffxhud`, `z-index:
36`), because `.ffxhud__stage` itself participates in `.ffxhud`'s stacking
order at its own (unset, i.e. `auto`) level. Verified live by reading
`getComputedStyle(stage).transform` on the running app (`translate(0px, 0px)
scale(2.5)` at 1600x900) and confirming `.ffx-cmd-info`'s and the chip's real
boxes still overlap after attempt 1's CSS.

**Options considered for attempt 3:**
1. Raise `.ffxhud__stage`'s own `z-index` above `.ffx-targeting`'s 36. Rejected:
   this would lift *everything* in the stage above *all* of `.ffx-targeting`,
   including the single-target brackets, hand and name plates — a real,
   untested regression risk with no target/decision covering it, for a fix
   that only needs to move one chip.
2. Move the chip's own markup out of `.ffx-targeting`'s overlay into the
   stage's stacking context, converting its screen-space coordinates into the
   stage's scaled grid space. Rejected: needs `LetterboxStage`'s own scale/
   offset math duplicated or exposed, and `LetterboxStage.ts` is outside this
   pass's ownership (`src/ui/common/transitions/**` only, for the chip).
3. **Chosen:** measure both elements' real, already-scaled boxes with
   `getBoundingClientRect()` after the chip renders, and nudge the chip
   vertically the minimum distance to clear the slab if they overlap. This
   never touches stacking order (so it cannot regress anything else
   `.ffx-targeting` draws), never touches the slab's own tuned position, and
   is correct at any letterbox scale without knowing what that scale is.

**Fix:** `src/ui/ffx/targetChipClear.ts` (new module, kept small per rule 7 —
`TargetCursor.ts` and `FFXBattleHud.ts` are both already over 400 lines and
only gained a few lines each to wire it in), called from
`TargetCursor.reposition()` right after the group chip's HTML is inserted.

**Proof:**
- `tests/unit/target-chip-clear.test.ts` — the pure nudge logic, with stubbed
  `getBoundingClientRect()` boxes reproducing the verifier's live finding.
- Live, real-GPU (`PYREFLY_BROWSER=gpu`, ANGLE/NVIDIA RTX 5070 Ti D3D11)
  Playwright run against the `ffx-hud-demo` screen (`FFXBattleHud` mounted
  with real fixtures, no full battle sim needed) at exactly the verifier's
  three sizes — 1280x720, 1600x900, 3840x2160. At all three, forcing the
  group chip toward the slab is clamped to a 4px gap
  (`docs/screenshots/fix12/verify12-PR-0019-hud-demo-*.png`), never allowed to
  overlap, confirming the fix holds at every letterbox scale, not just the
  scale it was written against.
- `npx tsc --noEmit` clean; full `npm test` (296 files, 6057 tests) green;
  `node tools/orphans.mjs` shows the new module imported, not orphaned.

**Not re-driven this pass:** the round-09b re-observation (the chip landing on
an item list's HI-POTION row rather than the selected item, Chapter 3,
1600x900) is a different collision — the chip vs. the command *list*, not vs.
the help slab — and this fix does not address it. Left open, as the previous
pass also left it; `clearChipOfSlab` only reads `.ffx-cmd-info`.
