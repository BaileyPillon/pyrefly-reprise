/**
 * MF-12 (`?hurtstring=hold`; both games): the stance a held string of blows hands the figure back to. A figure that is on its menu's `ready` (FFX-2) or on `idle` goes home to that stance when its
 * flinch ends. With the hold, the next blow of a string lands while the previous blow's `hurt` is still the requested pose, so the flinch that reads "what was I on" would read `hurt` and send the figure
 * home to `idle` (to `critical` at low HP) instead of `ready` (review F-1, 2026-10-27). This keeps the stance the string began from, for as long as the held flinch is the one in charge.
 *
 * Pure bookkeeping, no DOM, no `three`. With the default word nothing is ever held, so {@link back} returns the actor's own answer and the default is today's line for line.
 */
export class StringStance {
  private held: { token: number; pose: string } | null = null;

  /** The stance the flinch now starting hands back to: `requested`, unless the held flinch (`token` is still the actor's live one) is up, then the stance it began from. */
  back(requested: string, token: number): string {
    const h = this.held;
    return h !== null && h.token === token && requested === 'hurt' ? h.pose : requested;
  }

  /** The flinch `token` begins and will hand `pose` back; `hold` is true when more blows are expected, so the next flinch reads it. */
  begin(token: number, pose: string, hold: boolean): void {
    this.held = hold ? { token, pose } : null;
  }
}
