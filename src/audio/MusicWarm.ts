/**
 * Music fetched and decoded ahead of the play, and kept until it is played (PR-0373; both games, shared audio plumbing).
 *
 * Round 25 found the chapter's scene cue not yet playing at the first spoken lines in 10 of 30 runs: nothing asked for the
 * cue until the scene opened, so its 3 MB file was fetched and decoded in front of the first line. A chapter run now asks
 * for its scene, boss and victory cues the moment its card is confirmed (`app/chapterMusicWarm.ts`), and the mixer
 * (`AudioManager.warmMusic`) fetches them in that order, behind the party-prep menu.
 *
 * Fetching ahead is not enough on its own, because `AudioManager.playMusic` keeps the cue it starts and drops every other
 * decoded buffer (a 90 second stereo cue is about 35 MB of float samples; `evictionPlan` keeps three). The scene cue's own
 * start would throw away the boss and victory cues fetched for it, and the battle would fetch the boss cue all over again.
 * So a warm leaves a hold: the cues asked for and not yet played. An eviction leaves them decoded; a cue that starts playing
 * is no longer owed; the hold ends when the chapter run ends or a newer run replaces it.
 *
 * Pure bookkeeping: no audio, no DOM, no timers.
 */

/**
 * What `warmMusic` needs of the gate that holds the rest of a chapter run behind its opening cue (`app/sceneCueGate.ts`,
 * r46-scenecue): `settle()` when the first cue's response has arrived, failed or turned out not to be needed, and `opened`,
 * which resolves when the gate opens by any route (including its cap), so the rest of the audio warm can go on.
 */
export interface WarmGate {
  settle(): void;
  readonly opened: Promise<void>;
}

export class MusicWarmHold {
  /** Cues asked for and not yet played, in the order the run needs them. */
  private owed: string[] = [];
  /** Which run holds them: a release from an older run does not end a newer run's hold. */
  private epoch = 0;

  /** A chapter run starts and asks for these cues. Replaces whatever an earlier run held; returns the run's token. */
  begin(names: readonly string[]): number {
    this.owed = [...new Set(names)];
    return ++this.epoch;
  }

  /** Is this still the newest run? A warm that finds it is not stops fetching. */
  isCurrent(token: number): boolean {
    return token === this.epoch;
  }

  /** This run ended. Ends the hold unless a newer run has already replaced it. */
  release(token: number): void {
    if (token === this.epoch) this.owed = [];
  }

  /** `name` started playing: it is no longer owed to anyone. */
  played(name: string): void {
    if (this.owed.includes(name)) this.owed = this.owed.filter((n) => n !== name);
  }

  /** What an eviction must leave decoded besides the cue now playing, most urgent first. */
  keep(current: string): string[] {
    return this.owed.filter((n) => n !== current);
  }

  /** The cues still owed, for the debug overlay and the tests. */
  held(): string[] {
    return [...this.owed];
  }
}
