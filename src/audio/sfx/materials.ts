/**
 * The materials every effect in the game is built from.
 *
 * `docs/audio/THEMES.md` § "Sound-effect rules" names them: glass, bells, harp
 * harmonics, breath and choir — never oscillator character — tuned to FAREWELL's
 * key of B minor, with tails that bloom into the same hall as the orchestra.
 *
 * Keeping them here rather than inline in each cue is what makes a hundred and
 * thirty-four effects sound like one game. A designer writing a new spell
 * reaches for `choirBloom` and `shimmer`, and it is in the right key, at the
 * right brightness, with the right attack, without deciding any of that again.
 *
 * Everything returns layers for {@link SfxDesign}, so a cue is a list of
 * gestures rather than a page of DSP.
 */

import type { AirLayer, DesignLayer, NoteLayer, RingLayer, SubLayer } from './design.ts';
import type { Pitch } from '../score.ts';

// ------------------------------------------------------------- the pitch set

/**
 * B minor: the tonic triad plus the two degrees that ache in the farewell theme
 * — the 2 (C#) and the b6 (G). Nothing pitched in this game is allowed outside
 * this set, which is why an interface tick and a summon belong to each other.
 *
 * `UI` is the menu octave, `MAGIC` sits an octave below it where spells live,
 * `LOW` is the register for dread, and `SUB` is impact weight.
 */
export const UI = {
  /** Home, confirmation, completion. */
  home: 'B5' as Pitch,
  /** Question, hesitation, the ache. */
  ache: 'C#6' as Pitch,
  /** Neutral, informational. */
  neutral: 'D6' as Pitch,
  /** Movement, cursor, transit. */
  move: 'F#6' as Pitch,
  /** Tension, denial, damage. */
  tense: 'G6' as Pitch,
  /** An octave above home, for sparkle. */
  high: 'B6' as Pitch,
} as const;

export const MAGIC = {
  home: 'B4' as Pitch,
  ache: 'C#5' as Pitch,
  neutral: 'D5' as Pitch,
  move: 'F#5' as Pitch,
  tense: 'G5' as Pitch,
  high: 'B5' as Pitch,
} as const;

export const LOW = {
  home: 'B2' as Pitch,
  ache: 'C#3' as Pitch,
  neutral: 'D3' as Pitch,
  move: 'F#3' as Pitch,
  tense: 'G3' as Pitch,
  cello: 'B3' as Pitch,
} as const;

/** Impact weight. B1 61.74 Hz, D1 36.71, F#1 46.25, B0 30.87. */
export const SUB = {
  home: 61.74,
  neutral: 36.71,
  move: 46.25,
  deep: 30.87,
} as const;

/** The Bm triad, and the two chords everything resolves through. */
export const CHORDS = {
  tonic: ['B4', 'D5', 'F#5'] as Pitch[],
  tonicLow: ['B3', 'D4', 'F#4'] as Pitch[],
  /** The b6 chord — G major over B minor's world. Tension without a dominant. */
  flatSix: ['G3', 'B3', 'D4'] as Pitch[],
  /** The plagal step home: Em6 into Bm, the "amen" of the score. */
  amen: ['E4', 'G4', 'C#5'] as Pitch[],
  /** Widest tonic voicing, for arrivals. */
  open: ['B2', 'F#3', 'B3', 'D4', 'F#4'] as Pitch[],
} as const;

// ------------------------------------------------------------------- options

interface At {
  at?: number;
  gain?: number;
  pan?: number;
}

// ------------------------------------------------------------------ the kit

/**
 * Struck glass. The single most-used material in the interface: a celesta note
 * with 8 ms of attack, a short body and a tail that carries on into the hall.
 * Never instant, never bright enough to click.
 */
export function glass(pitch: Pitch, o: At & { dur?: number; vel?: number } = {}): NoteLayer {
  return {
    kind: 'note',
    instrument: 'celesta',
    pitch,
    dur: o.dur ?? 0.05,
    vel: o.vel ?? 0.55,
    attack: 0.008,
    at: o.at ?? 0,
    gain: o.gain ?? 0.7,
    pan: o.pan ?? 0,
    lowpass: 9500,
  };
}

/** The glassy top partial that sits over a struck note — a bowl, not a beep. */
export function glassHigh(pitch: Pitch, o: At & { dur?: number; vel?: number } = {}): NoteLayer {
  return {
    kind: 'note',
    instrument: 'glockenspiel',
    pitch,
    dur: o.dur ?? 0.08,
    vel: o.vel ?? 0.4,
    attack: 0.006,
    at: o.at ?? 0,
    gain: o.gain ?? 0.35,
    pan: o.pan ?? 0,
    lowpass: 11_000,
  };
}

/** A struck bell: the long, round tail behind holy magic and heavy moments. */
export function bell(pitch: Pitch, o: At & { dur?: number; vel?: number; lowpass?: number } = {}): NoteLayer {
  return {
    kind: 'note',
    instrument: 'bell',
    pitch,
    dur: o.dur ?? 0.5,
    vel: o.vel ?? 0.6,
    attack: 0.006,
    at: o.at ?? 0,
    gain: o.gain ?? 0.55,
    pan: o.pan ?? 0,
    lowpass: o.lowpass,
  };
}

/** Tubular bells — a peal, a cathedral, a toll. Heavier than `bell`. */
export function toll(pitch: Pitch, o: At & { dur?: number; vel?: number } = {}): NoteLayer {
  return {
    kind: 'note',
    instrument: 'chimes',
    pitch,
    dur: o.dur ?? 0.8,
    vel: o.vel ?? 0.7,
    attack: 0.004,
    at: o.at ?? 0,
    gain: o.gain ?? 0.6,
    pan: o.pan ?? 0,
  };
}

/**
 * Harp, rolled. The menu-open gesture: B D F# G up or down in 120 ms, with a
 * breath underneath so it is a hand on strings rather than four notes.
 */
export function harpRoll(
  pitches: Pitch[],
  o: At & { roll?: number; dur?: number; vel?: number } = {},
): NoteLayer {
  return {
    kind: 'note',
    instrument: 'harp',
    pitch: pitches,
    roll: o.roll ?? 0.03,
    dur: o.dur ?? 0.35,
    vel: o.vel ?? 0.55,
    attack: 0.005,
    at: o.at ?? 0,
    gain: o.gain ?? 0.55,
    pan: o.pan ?? 0,
  };
}

/**
 * Wordless choir, blooming. Slow in (60-160 ms), held, and left to decay into
 * the hall — this is what a spell is made of, not a filter sweep.
 */
export function choirBloom(
  pitches: Pitch[],
  o: At & { dur?: number; vel?: number; voice?: string; attack?: number } = {},
): NoteLayer {
  return {
    kind: 'note',
    instrument: o.voice ?? 'choir-ooh',
    pitch: pitches,
    dur: o.dur ?? 0.9,
    vel: o.vel ?? 0.6,
    attack: o.attack ?? 0.09,
    fade: 0.25,
    at: o.at ?? 0,
    gain: o.gain ?? 0.5,
    pan: o.pan ?? 0,
  };
}

/** One soprano line over the top — used where a cue needs a human in it. */
export function sopranoLine(pitch: Pitch, o: At & { dur?: number; vel?: number } = {}): NoteLayer {
  return {
    kind: 'note',
    instrument: 'soprano',
    pitch,
    dur: o.dur ?? 1,
    vel: o.vel ?? 0.5,
    attack: 0.12,
    fade: 0.3,
    at: o.at ?? 0,
    gain: o.gain ?? 0.45,
    pan: o.pan ?? 0,
  };
}

/** High motes of light: three or four glockenspiel notes scattered upward. */
export function shimmer(o: At & { dur?: number; spread?: number; vel?: number } = {}): DesignLayer[] {
  const at = o.at ?? 0;
  const spread = o.spread ?? 0.22;
  const notes: Pitch[] = [MAGIC.move, UI.home, UI.neutral, UI.move];
  return [
    ...notes.map((pitch, i): NoteLayer => ({
      kind: 'note',
      instrument: 'glockenspiel',
      pitch,
      dur: 0.12,
      vel: (o.vel ?? 0.4) * (1 - i * 0.12),
      attack: 0.007,
      at: at + (i * spread) / notes.length,
      gain: (o.gain ?? 0.3) * (1 - i * 0.1),
      pan: i % 2 === 0 ? -0.25 : 0.28,
      lowpass: 11_000,
    })),
    // Air under the motes: without it they are four separate events.
    {
      kind: 'air',
      at,
      dur: (o.dur ?? 0.9) * 0.8,
      freq: 5200,
      freqTo: 8000,
      q: 0.7,
      attack: 0.12,
      curve: 2,
      gain: 0.07,
      highpass: 3000,
    },
  ];
}

/** Cloth and body movement, 30-50 ms ahead of a hit. A swing has a wind-up. */
export function cloth(o: At & { dur?: number } = {}): AirLayer {
  return {
    kind: 'air',
    at: o.at ?? 0,
    dur: o.dur ?? 0.09,
    freq: 480,
    freqTo: 900,
    q: 0.8,
    attack: 0.018,
    curve: 3,
    gain: o.gain ?? 0.16,
    pan: o.pan ?? 0,
    highpass: 180,
  };
}

/** Air moving: a blade, a ball, a body passing the listener. */
export function whoosh(
  o: At & { dur?: number; from?: number; to?: number; panTo?: number; gain?: number } = {},
): AirLayer {
  return {
    kind: 'air',
    at: o.at ?? 0,
    dur: o.dur ?? 0.22,
    freq: o.from ?? 700,
    freqTo: o.to ?? 2600,
    q: 1.1,
    attack: 0.03,
    curve: 2.4,
    hold: 0.12,
    gain: o.gain ?? 0.3,
    pan: o.pan ?? -0.5,
    panTo: o.panTo ?? 0.5,
    highpass: 260,
  };
}

/** Breath — the layer that makes a menu, a spell or a room feel inhabited. */
export function breath(o: At & { dur?: number; reverse?: boolean } = {}): AirLayer {
  return {
    kind: 'air',
    at: o.at ?? 0,
    dur: o.dur ?? 0.3,
    freq: 900,
    freqTo: 2400,
    q: 0.6,
    attack: 0.06,
    curve: 1.8,
    gain: o.gain ?? 0.1,
    pan: o.pan ?? 0,
    highpass: 400,
    reverse: o.reverse,
  };
}

/**
 * Steel with a ring: the edge of a blade, a block, a parry. A short metallic
 * partial on the b6 over a hard transient, low-passed so it rings rather than
 * hisses.
 */
export function steelRing(o: At & { freq?: number; dur?: number; index?: number } = {}): RingLayer {
  return {
    kind: 'ring',
    at: o.at ?? 0,
    freq: o.freq ?? 1568, // G6 — the b6, tension
    ratio: 2.72,
    index: o.index ?? 1.6,
    indexTo: 0.15,
    dur: o.dur ?? 0.5,
    attack: 0.002,
    curve: 4.5,
    gain: o.gain ?? 0.3,
    pan: o.pan ?? 0,
    lowpass: 8500,
  };
}

/** Weight under an impact. Every impact has one; nothing else does. */
export function subImpact(o: At & { freq?: number; dur?: number; curve?: number } = {}): SubLayer {
  return {
    kind: 'sub',
    at: o.at ?? 0,
    freq: o.freq ?? SUB.home,
    toFreq: (o.freq ?? SUB.home) * 0.62,
    dur: o.dur ?? 0.45,
    attack: 0.004,
    curve: o.curve ?? 3.2,
    gain: o.gain ?? 0.55,
    pan: o.pan ?? 0,
  };
}

/** The recorded body of a hit: an orchestral bass drum, pitched to the cue. */
export function bodyHit(o: At & { pitch?: Pitch; vel?: number; speed?: number } = {}): NoteLayer {
  return {
    kind: 'note',
    instrument: 'bass-drum',
    pitch: o.pitch ?? 'B1',
    dur: 0.18,
    vel: o.vel ?? 0.8,
    at: o.at ?? 0,
    gain: o.gain ?? 0.55,
    pan: o.pan ?? 0,
    speed: o.speed,
    lowpass: 6000,
  };
}

/** Timpani — dread, arrivals, the floor under a stab. */
export function timpani(pitch: Pitch, o: At & { dur?: number; vel?: number } = {}): NoteLayer {
  return {
    kind: 'note',
    instrument: 'timpani',
    pitch,
    dur: o.dur ?? 0.5,
    vel: o.vel ?? 0.75,
    at: o.at ?? 0,
    gain: o.gain ?? 0.5,
    pan: o.pan ?? 0.1,
  };
}

/** The tam-tam wash: the biggest, saddest sound the orchestra owns. */
export function tamTam(o: At & { dur?: number; vel?: number; speed?: number } = {}): NoteLayer {
  return {
    kind: 'note',
    instrument: 'tam-tam',
    pitch: 'B2',
    dur: o.dur ?? 1.2,
    vel: o.vel ?? 0.7,
    attack: 0.01,
    fade: 0.4,
    at: o.at ?? 0,
    gain: o.gain ?? 0.4,
    pan: o.pan ?? -0.1,
    speed: o.speed,
    lowpass: 9000,
  };
}

/** A cymbal swelling up into an event, or falling away out of one. */
export function cymbalSwell(o: At & { dur?: number; vel?: number; reverse?: boolean } = {}): NoteLayer {
  return {
    kind: 'note',
    instrument: 'cymbal-swell',
    pitch: 'D3',
    dur: o.dur ?? 0.8,
    vel: o.vel ?? 0.55,
    attack: 0.15,
    fade: 0.2,
    at: o.at ?? 0,
    gain: o.gain ?? 0.28,
    pan: o.pan ?? 0.15,
    reverse: o.reverse,
    lowpass: 12_000,
  };
}

/**
 * An orchestral stab: brass and short strings on one chord over a drum. The one
 * place the rules allow something loud and fast, and it still has a bow in it.
 */
export function stab(
  chord: Pitch[],
  o: At & { vel?: number; dur?: number; withTimpani?: boolean } = {},
): DesignLayer[] {
  const at = o.at ?? 0;
  const gain = o.gain ?? 1;
  const layers: DesignLayer[] = [
    {
      kind: 'note',
      instrument: 'brass-stab',
      pitch: chord,
      dur: o.dur ?? 0.3,
      vel: o.vel ?? 0.85,
      attack: 0.012,
      at,
      gain: 0.5 * gain,
      pan: -0.12,
    },
    {
      kind: 'note',
      instrument: 'strings-short',
      pitch: chord,
      dur: (o.dur ?? 0.3) * 0.8,
      vel: (o.vel ?? 0.85) * 0.9,
      attack: 0.01,
      at,
      gain: 0.38 * gain,
      pan: 0.2,
    },
  ];
  if (o.withTimpani !== false) layers.push(timpani(chord[0] ?? 'B2', { at, gain: 0.4 * gain, vel: 0.8 }));
  return layers;
}

/** Low strings holding dread under a boss moment. */
export function lowStrings(
  pitches: Pitch[],
  o: At & { dur?: number; vel?: number; tremolo?: boolean } = {},
): NoteLayer {
  return {
    kind: 'note',
    instrument: o.tremolo ? 'strings-trem' : 'strings-low',
    pitch: pitches,
    dur: o.dur ?? 1.2,
    vel: o.vel ?? 0.55,
    attack: 0.1,
    fade: 0.3,
    at: o.at ?? 0,
    gain: o.gain ?? 0.4,
    pan: o.pan ?? 0,
  };
}

/** Pizzicato: a tick with a body, for counters and small mechanical events. */
export function pizz(pitch: Pitch, o: At & { vel?: number } = {}): NoteLayer {
  return {
    kind: 'note',
    instrument: 'pizzicato',
    pitch,
    dur: 0.12,
    vel: o.vel ?? 0.6,
    at: o.at ?? 0,
    gain: o.gain ?? 0.4,
    pan: o.pan ?? 0,
  };
}

/**
 * Scattered small noise events — fire crackle, debris, ice shards, sparks.
 * Deterministic from `seed`, band-limited well under the fizz ceiling, and
 * always soft: crackle is texture, never the sound itself.
 */
export function scatter(
  count: number,
  o: {
    at?: number;
    span: number;
    freq: number;
    freqSpread?: number;
    dur?: number;
    gain?: number;
    seed?: number;
    width?: number;
  },
): AirLayer[] {
  const out: AirLayer[] = [];
  let x = (o.seed ?? 7) | 0;
  const rand = (): number => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 10_000) / 10_000;
  };
  for (let i = 0; i < count; i++) {
    out.push({
      kind: 'air',
      at: (o.at ?? 0) + rand() * o.span,
      dur: o.dur ?? 0.05,
      freq: o.freq * (1 + (rand() - 0.5) * (o.freqSpread ?? 0.8)),
      q: 2.2,
      attack: 0.004,
      curve: 6,
      gain: (o.gain ?? 0.12) * (0.6 + rand() * 0.5),
      pan: (rand() - 0.5) * 2 * (o.width ?? 0.7),
      highpass: 400,
    });
  }
  return out;
}

/** A reversed swell that pulls toward the listener: charges, siphons, arrivals. */
export function suction(o: At & { dur?: number; low?: number; high?: number } = {}): AirLayer {
  return {
    kind: 'air',
    at: o.at ?? 0,
    dur: o.dur ?? 0.6,
    freq: o.low ?? 600,
    freqTo: o.high ?? 3200,
    q: 1.1,
    attack: 0.01,
    curve: 3,
    gain: o.gain ?? 0.22,
    pan: o.pan ?? 0,
    reverse: true,
    highpass: 240,
  };
}

/**
 * Play one of the score's own motifs as an effect.
 *
 * The story cues are not sound design, they are music heard from somewhere
 * else in the building — the fayth humming, Lenne's phrase carried on the wind.
 * They take their notes from `tracks/themes.ts` rather than inventing a tune,
 * which is the rule in `docs/audio/THEMES.md`: nothing gets retyped, and an
 * effect that quotes a theme quotes *the* theme.
 *
 * `notes` are `[startBeat, durationBeats, semitonesFromRoot, velocity?]`, the
 * shape the theme file exports.
 */
export function motif(
  notes: ReadonlyArray<readonly [number, number, Pitch, (number | undefined)?]>,
  o: {
    instrument: string;
    /** MIDI note the motif's degree 0 sounds as. A named pitch ignores it. */
    root: number;
    bpm: number;
    at?: number;
    gain?: number;
    pan?: number;
    vel?: number;
    attack?: number;
    legato?: number;
  },
): NoteLayer[] {
  const beat = 60 / o.bpm;
  return notes.map((note) => {
    const [start, dur, degree, vel] = note;
    return {
      kind: 'note',
      instrument: o.instrument,
      // A theme's notes are semitone offsets from its root; a named pitch (the
      // tracker's own spelling) is already absolute and passes straight through.
      pitch: typeof degree === 'number' ? o.root + degree : degree,
      dur: dur * beat * (o.legato ?? 1),
      vel: (vel ?? o.vel ?? 0.55),
      attack: o.attack ?? 0.05,
      at: (o.at ?? 0) + start * beat,
      gain: o.gain ?? 0.4,
      pan: o.pan ?? 0,
    } satisfies NoteLayer;
  });
}

/** A held low drone — dread, machina, the Farplane. Never a saw. */
export function drone(
  pitches: Pitch[],
  o: At & { dur?: number; vel?: number; voice?: string } = {},
): NoteLayer {
  return {
    kind: 'note',
    instrument: o.voice ?? 'pad',
    pitch: pitches,
    dur: o.dur ?? 1.5,
    vel: o.vel ?? 0.45,
    attack: 0.2,
    fade: 0.4,
    at: o.at ?? 0,
    gain: o.gain ?? 0.3,
    pan: o.pan ?? 0,
    lowpass: 6500,
  };
}
