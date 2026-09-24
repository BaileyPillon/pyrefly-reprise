/**
 * PR-0019 repair (round 12, FFX only — the "ALL ALLIES"/"ALL ENEMIES" group
 * chip, `TargetCursor.ts`'s `.ffx-target__all`). FFX-2 never calls this:
 * `FFX2_COMMAND_HELP_PLACEMENT_RESOLVED` is `false`, so FFX-2 has no command
 * help slab to clear.
 *
 * ## Why round 10's fix (a `z-index` on `.ffx-cmd-info`) could not work
 *
 * `.ffx-cmd-info` is a descendant of `.ffxhud__stage`, and `LetterboxStage`
 * sets an inline `transform` on that element — which makes it a stacking
 * context of its own. A `z-index` set inside that context can only reorder
 * paint *within* it; it cannot lift the slab above `.ffx-targeting`
 * (`ffx-hud.css`, `z-index: 36`), a sibling stacking context the slab's
 * ancestor chain never escapes. `.ffx-targeting` — and the chip inside it —
 * always paints after the whole stage, regardless of that inner `z-index`.
 * Verified live (round 12): the chip still covers the tail of the sentence
 * at 1280x720 and 1600x900, Chapter 1, Special > Cheer.
 *
 * ## Why this fixes it without touching stacking order
 *
 * Raising `.ffxhud__stage` itself above `.ffx-targeting` would fix this one
 * overlap but put every other target mark (single-target brackets, hand,
 * plates) *underneath* the stage's own content — a real regression this repo
 * has no coverage for and no target/decision approving. Instead, this reads
 * both elements' real, already-scaled boxes with `getBoundingClientRect()`
 * (correct at any letterbox scale, without duplicating `LetterboxStage`'s own
 * math) and nudges only the chip, vertically, the minimum distance needed to
 * clear the slab — never touching the slab's own position, which
 * `ffx-hud.css`'s own comment on `.ffx-cmd-info` says is tuned and fixed.
 */
export function clearChipOfSlab(chip: HTMLElement, slab: HTMLElement | null): void {
  if (!slab || slab.hidden) return;
  const slabBox = slab.getBoundingClientRect();
  if (slabBox.width === 0 || slabBox.height === 0) return;
  const chipBox = chip.getBoundingClientRect();
  const overlapX = Math.min(chipBox.right, slabBox.right) - Math.max(chipBox.left, slabBox.left);
  const overlapY = Math.min(chipBox.bottom, slabBox.bottom) - Math.max(chipBox.top, slabBox.top);
  if (overlapX <= 0 || overlapY <= 0) return;

  const gap = 4;
  // Two candidate nudges — above the slab's top, or below its bottom —
  // measured in real screen px (the overlay this chip lives in applies no
  // scale of its own, so a viewport-px delta is exactly a local `top` delta).
  const upShift = -(chipBox.bottom - slabBox.top + gap);
  const downShift = slabBox.bottom - chipBox.top + gap;
  const shift = Math.abs(upShift) <= Math.abs(downShift) ? upShift : downShift;
  const currentTop = parseFloat(chip.style.top || '0');
  chip.style.top = `${currentTop + shift}px`;
}
