/**
 * MF-12 (`?hurtstring=hold`; both games): the stance a held string of blows hands the figure back to. A figure that is on its menu's `ready` (FFX-2) or on `idle` goes home to that stance when its
 * flinch ends. With the hold, the next blow of a string lands while the previous blow's `hurt` is still the requested pose, so the flinch that reads "what was I on" would read `hurt` and send the figure
 * home to `idle` (to `critical` at low HP) instead of `ready` (review F-1, 2026-10-27). This keeps the stance the string began from, for as long as the held flinch is the one in charge.
 *
 * Pure bookkeeping, no DOM, no `three`. With `?hurtstring=today` nothing is ever held, so {@link back} returns the actor's own answer (release 67's line for line); `hold` is the default since release 68, so a string of blows is held and this is what keeps its stance.
 */
export class StringStance {
  private held: { token: number; pose: string; paint: string | undefined } | null = null;

  /** The stance the flinch now starting hands back to: `requested`, unless the held flinch (`token` is still the actor's live one) is up, then the stance it began from. */
  back(requested: string, token: number): string {
    const h = this.held;
    return h !== null && h.token === token && requested === 'hurt' ? h.pose : requested;
  }

  /**
   * The painting the stance is drawn with (MF-05, `?stance=v1a|v1b`: `ready` on the idle painting): `requestedPaint` unless the held flinch is up, then the painting the string began from. Release 66 merge of
   * mf-l1-swaps (the paint) and mf-l2-moves (the held string): a second blow of a string must not hand `ready` back on its own painting. With `?hurtstring=today` (or `?stance=today`) nothing is held and this returns `requestedPaint`.
   */
  paint(requested: string, requestedPaint: string | undefined, token: number): string | undefined {
    const h = this.held;
    return h !== null && h.token === token && requested === 'hurt' ? h.paint : requestedPaint;
  }

  /** The flinch `token` begins and will hand `pose` (drawn with `paint`, when it is not its own painting) back; `hold` is true when more blows are expected, so the next flinch reads it. */
  begin(token: number, pose: string, hold: boolean, paint?: string): void {
    this.held = hold ? { token, pose, paint } : null;
  }
}
