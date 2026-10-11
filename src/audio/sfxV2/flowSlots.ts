/**
 * SFX parity, the flow slots: the sounds of moments that have never had one, as data.
 *
 * The retail games sound the encounter's opening (the field shatters into the fight, then a bed rises under the first
 * seconds) and the results tally (a loop while the numbers count, a stinger as each line lands). Our build has played
 * nothing at those moments (`v2:battle-start` has no caller; the tally counts in silence), so there is no stand-in:
 * these slots play a recorded original WHEN A PARITY PACK HOLDS IT and are silent otherwise. With
 * `sfxParity.packs` empty nothing here makes a sound, which is exactly what the build did before.
 *
 * A slot names its hook (where a screen calls it), its pack cue and the spec row it answers. {@link startFlow} plays
 * every slot of one hook through a small port the mixer implements (`AudioManager.playParityOnly`), staggers the
 * repeats, and returns a handle that stops the loops (the tally ends when the numbers do, a fight can end early).
 *
 * Game case (AGENTS.md rule 14): the encounter slots are the FFX rows (`ffx.flow.*`), the results slots the FFX-2 rows
 * (`ffx2.flow.*`); a slot only plays in a chapter of its own game. Pure: no DOM, no Web Audio (the mixer is a port).
 */

import type { EventGame } from './eventCues.ts';

/** Where a screen calls the slots: the encounter opening, the results tally starting, and one tally line landing. */
export type FlowHook = 'encounter-open' | 'results-count' | 'results-line';

export interface FlowSlot {
  game: EventGame;
  /** The spec row this slot answers (`docs/audio/sfx-parity-rows.json`): the manifest cue's `specRow`. */
  row: string;
  /** The pack cue's name. */
  cue: string;
  hook: FlowHook;
  /** The cue loops (inside its slice) until the handle stops it. */
  loop?: boolean;
  /** Linear gain on top of the cue's mastered level; 1 unless the row calls for a bed under the action. */
  volume?: number;
}

export const FLOW_SLOTS: readonly FlowSlot[] = [
  // FFX: the field shatters into the fight, and a bed rises under the first six seconds of it.
  { game: 'ffx', row: 'ffx.flow.shatter', cue: 'encounter-shatter', hook: 'encounter-open' },
  { game: 'ffx', row: 'ffx.flow.fadein', cue: 'encounter-fadein', hook: 'encounter-open' },
  // FFX-2: a loop while EXP, gil and AP count, a stinger as each tally line lands.
  { game: 'ffx2', row: 'ffx2.flow.results', cue: 'results-loop', hook: 'results-count', loop: true },
  { game: 'ffx2', row: 'ffx2.flow.stingers', cue: 'results-ping', hook: 'results-line' },
];

/** The slots of one hook in one game, in table order. */
export function flowSlotsFor(game: string | null, hook: FlowHook): readonly FlowSlot[] {
  if (game !== 'ffx' && game !== 'ffx2') return [];
  return FLOW_SLOTS.filter((s) => s.game === game && s.hook === hook);
}

/** What the mixer offers a flow slot: play this recorded original if a pack holds it, and nothing else. */
export interface FlowPort {
  playParityOnly(events: readonly string[], options?: { volume?: number; delay?: number; loop?: boolean }): { stop(fade?: number): void } | null;
}

export interface FlowHandle {
  /** Stop everything this call started (a loop fades out over `fade` seconds; one-shots play out). */
  stop(fade?: number): void;
}

/** A handle that does nothing: the port had no pack, or the game has no slot at this hook. */
export const NO_FLOW: FlowHandle = Object.freeze({ stop: () => undefined });

/** Seconds between repeats of a one-shot slot played `repeat` times (the results stingers, one per tally line). */
export const FLOW_STAGGER_S = 0.09;

/**
 * Play every slot of `hook` for `game`, `repeat` times each (a one-shot repeated once per tally line, each a little
 * after the last so they do not stack into one). Never throws: a port that fails costs its sound, never the screen.
 */
export function startFlow(port: FlowPort | null | undefined, game: string | null, hook: FlowHook, repeat = 1): FlowHandle {
  const slots = flowSlotsFor(game, hook);
  if (!port || slots.length === 0) return NO_FLOW;
  const playing: Array<{ stop(fade?: number): void }> = [];
  for (const slot of slots) {
    const times = slot.loop ? 1 : Math.max(1, repeat);
    for (let i = 0; i < times; i++) {
      try {
        const voice = port.playParityOnly([slot.cue], {
          ...(slot.volume !== undefined ? { volume: slot.volume } : {}),
          ...(i > 0 ? { delay: i * FLOW_STAGGER_S } : {}),
          ...(slot.loop ? { loop: true } : {}),
        });
        if (voice) playing.push(voice);
      } catch {
        /* a flow sound is never worth a screen */
      }
    }
  }
  if (playing.length === 0) return NO_FLOW;
  return {
    stop: (fade) => {
      for (const voice of playing) {
        try {
          voice.stop(fade);
        } catch {
          /* already ended */
        }
      }
    },
  };
}
