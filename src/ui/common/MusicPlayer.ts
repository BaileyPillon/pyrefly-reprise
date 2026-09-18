/**
 * The pause menu's MUSIC PLAYER — a jukebox for the score.
 *
 * Every track in this game is original and rendered in-browser by
 * `src/audio/**` (there is no streamed audio and no licensed music), so a
 * sound test costs nothing but a list and two verbs: play a track, stop it.
 * The list is `trackNames()` itself, which means a composer adding a cue gets
 * it here with no edit to this file.
 *
 * ## Track titles
 *
 * `TRACKS` is keyed by cue name — `'boss-seymour'`, `'scene-gagazet'` — which
 * is what the engine asks for and not what anyone would call the piece.
 * `TRACK_BLURBS` already carries the real title, because most blurbs were
 * written as `"Ascension of the Unmaker" - a demonic mass at battle tempo...`.
 * {@link trackTitle} lifts that leading quoted title out when it is there and
 * falls back to a de-slugged cue name when it is not, so an untitled cue
 * ('battle-ffx') still reads as "Battle FFX" rather than as a key.
 */

import { audio } from '../../audio/index.ts';
import { TRACK_BLURBS, trackNames } from '../../audio/index.ts';
import { escapeHtml } from './html.ts';

/** `"Iron Verdict" — a never-ending...` -> `Iron Verdict`. */
export function trackTitle(name: string): string {
  const blurb = TRACK_BLURBS[name];
  const quoted = blurb?.match(/^["“]([^"”]+)["”]/);
  if (quoted?.[1]) return quoted[1];
  return name
    .split('-')
    .map((word) => (word === 'ffx' ? 'FFX' : word === 'ffx2' ? 'FFX-2' : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

/** One row in the jukebox. */
export interface MusicTrackRow {
  /** Cue name, as `audio.playMusic` wants it. */
  name: string;
  title: string;
  /** True for the tracks this chapter actually uses. */
  chapter: boolean;
}

export interface MusicPlayerOptions {
  root: HTMLElement;
  /**
   * Cue names this chapter uses (`ChapterMeta.musicKeys` plus the chapter's
   * own `Chapter.music` values). They sort to the top and carry a gold dot,
   * because "the music from the fight I am in" is what a player opening this
   * panel mid-battle is looking for.
   */
  chapterKeys: readonly string[];
}

/**
 * A list of tracks with a cursor, and the two things you can do to one.
 *
 * Owns no input of its own: the pause screen drives it through {@link move}
 * and {@link confirm}, exactly the way `PartyPrepScreen` drives its panels, so
 * there is one place in the menu that decides what Up/Down mean.
 */
export class MusicPlayer {
  readonly el: HTMLElement;
  private readonly rows: MusicTrackRow[];
  private index = 0;
  /** The cue this panel started, so STOP knows whether it owns the music. */
  private playing: string | null = null;

  constructor(opts: MusicPlayerOptions) {
    const chapterKeys = new Set(opts.chapterKeys);
    this.rows = trackNames()
      .map((name) => ({ name, title: trackTitle(name), chapter: chapterKeys.has(name) }))
      // Chapter tracks first, then everything else, each group alphabetical by
      // title so the list does not reshuffle when a cue is added.
      .sort((a, b) => Number(b.chapter) - Number(a.chapter) || a.title.localeCompare(b.title));

    this.el = document.createElement('div');
    this.el.className = 'pause__music';
    opts.root.appendChild(this.el);
    this.render();
  }

  get trackCount(): number {
    return this.rows.length;
  }

  get selected(): MusicTrackRow | null {
    return this.rows[this.index] ?? null;
  }

  get nowPlaying(): string | null {
    return this.playing;
  }

  move(delta: number): void {
    if (this.rows.length === 0) return;
    this.index = (this.index + delta + this.rows.length) % this.rows.length;
    this.render();
    this.scrollIntoView();
  }

  /** Select a row by cue name. Returns false for an unknown one. */
  select(name: string): boolean {
    const i = this.rows.findIndex((r) => r.name === name);
    if (i < 0) return false;
    this.index = i;
    this.render();
    return true;
  }

  /**
   * Play the selected track, or stop it when it is the one already playing —
   * one button, the way a sound test works.
   *
   * `playMusic` rejects an unknown cue and can reject while rendering; a sound
   * test must never take the menu down with it, so the promise is swallowed
   * and the row simply does not light up.
   */
  confirm(): void {
    const row = this.selected;
    if (!row) return;
    if (this.playing === row.name) {
      this.stop();
      return;
    }
    this.playing = row.name;
    this.render();
    void audio.playMusic(row.name, { fade: 0.6 }).catch(() => {
      this.playing = null;
      this.render();
    });
  }

  stop(): void {
    if (this.playing === null) return;
    this.playing = null;
    audio.stopMusic(0.5);
    this.render();
  }

  /** `data-action` names this panel answers to, for mouse and touch. */
  handleAction(action: string): boolean {
    if (!action.startsWith('music:')) return false;
    const name = action.slice('music:'.length);
    if (name === 'stop') {
      this.stop();
      return true;
    }
    if (!this.select(name)) return false;
    this.confirm();
    return true;
  }

  private scrollIntoView(): void {
    const row = this.el.querySelector<HTMLElement>('.pause__music-row--sel');
    row?.scrollIntoView({ block: 'nearest' });
  }

  private render(): void {
    const rows = this.rows
      .map((row, i) => {
        const sel = i === this.index ? ' pause__music-row--sel' : '';
        const live = row.name === this.playing ? ' pause__music-row--playing' : '';
        const dot = row.chapter ? '<span class="pause__music-dot" aria-hidden="true"></span>' : '<span class="pause__music-dot pause__music-dot--off" aria-hidden="true"></span>';
        return `<div class="pause__music-row${sel}${live}" data-action="music:${escapeHtml(row.name)}" role="button" tabindex="0">
          ${dot}
          <span class="pause__music-title">${escapeHtml(row.title)}</span>
          <span class="pause__music-state">${row.name === this.playing ? 'PLAYING' : ''}</span>
        </div>`;
      })
      .join('');
    this.el.innerHTML = `
      <div class="pause__music-head">
        <span class="pause__music-head-label">SOUND TEST</span>
        <span class="pause__music-head-act" data-action="music:stop" role="button" tabindex="0">STOP</span>
      </div>
      <div class="pause__music-list">${rows}</div>`;
  }

  dispose(): void {
    this.el.remove();
  }
}
