/**
 * Whose figure is it on the floor right now (r38-motion repair, FFX-2 RUN-IN; no `three`, no DOM).
 *
 * The MAX mix's staging (`fx/mix/staging.ts`) writes a share into a figure's own `position.x` (BOSS SCALE's spacing,
 * CHAPTER FRAMING's spread) and tells a re-seat by the stage (an arrival, a formation relax) from its own write by
 * comparing the figure's x with what it wrote last: any other x is read as the stage's new seat, the record of the share
 * is dropped, and the share is put on top of the new value. That is right for a re-seat and wrong for a **run**: she
 * leaves her place and comes back to it, so her `moveTo` is no re-seat. Read as one, her home (captured with the share
 * already in it) gained the share again at the end of every run: in Chapter IV Rikku walked 0.071 world units left and Paine
 * 0.022 right with every plain Attack, onto Yuna and away from the line (the check of r38-motion, `docs/handoff/r38-motion.md`).
 *
 * So a figure that moves under its own steam says so: `ownPlace(figure, true)` while it is out, `ownPlace(figure, false)`
 * when it is home. While it is owned, staging neither writes the figure nor reads its position back as a re-seat, and
 * keeps its record of the share, which is exactly right when it returns to the place it left. An explicit hand-over, not a
 * guess from a position change, so it holds whatever the staging learns to treat as a re-seat later (r38-restage's slots
 * read x-only moves as a formation nudge and z moves as a re-seat; neither reaches an owned figure).
 *
 * Keyed by the figure object (weakly), so nothing is left behind when a figure goes, and no setting, no save key.
 */
const owned = new WeakSet<object>();

/** `on`: this figure's place is its own until it is given back (`false`). */
export function ownPlace(figure: object, on: boolean): void {
  if (on) owned.add(figure);
  else owned.delete(figure);
}

/** Is this figure out on its own account (staging leaves it alone)? */
export function placeOwned(figure: object): boolean {
  return owned.has(figure);
}
