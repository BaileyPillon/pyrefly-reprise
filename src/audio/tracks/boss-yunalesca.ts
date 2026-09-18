/**
 * "Rite Without End" — Yunalesca boss theme.
 *
 * ORIGINAL COMPOSITION. A ceremony performed a thousand times already and due
 * to be performed a thousand more, indifferent to the two people about to die
 * inside it. Compound 6/8 at 132 bpm (one bar = 3 beats in this engine's
 * internal unit, `checkBars: 3`).
 *
 * Per `docs/audio/THEMES.md` §HYMN, transformation *boss-yunalesca*: the
 * prayer, taken. HYMN is moved up a semitone to F and its 2 is replaced
 * everywhere by Seymour's b2, which turns E Aeolian into **F Phrygian** and
 * hands the congregation's hymn to the villains for the cost of one
 * accidental. `AMEN` becomes `AMEN_PHRYGIAN` by the same single change: the
 * Gb leaning on the iv, falling home.
 *
 * `HYMN_HEAD` is then taken alone as a canon subject and stacked four entries
 * deep, three beats apart — the cue's own bar — at **the octave and the
 * fourth**, never the tritone: a tritone canon on a modal tune reads as noise
 * rather than as rite. The entries never line up into a chord. They line up
 * into a machine. Their velocity is locked at 0.62, flat, deliberately
 * unhumanised *here and nowhere else in the score*, because the rite does not
 * breathe.
 *
 * One thing in the cue does breathe: the solo cello. It is the only line with
 * rubato (`agogic`), the only line whose velocity is shaped, and it sings the
 * prayer as a tune rather than as a mechanism — once at the top, alone, before
 * the canon starts, and once more in the third form, where it is simply
 * overrun. That contrast is the reading of the character. Everything else here
 * is indifferent; one voice is not, and it loses.
 *
 * Craft note: the choir is a section and carries 34 ms of timing jitter, which
 * is right for a congregation and wrong for a machine. Every canon entry is
 * therefore doubled at the unison by pizzicato, which has a hard, exact onset:
 * the pizz defines where the note *is* and the choir blooms behind it. A
 * `choir-rite` preset with jitter <= 3 ms would do this properly — filed in
 * `docs/audio/requests-ffx-bosses.md`.
 *
 * Form (6/8, 74 bars, 222 beats, 100.9 s) — three sections for her three forms:
 *   bars  1- 8  ostinato   beats   0- 24  harp alone, then the cello names the
 *                                         prayer, unaccompanied and in time
 *   bars  9-28  form 1     beats  24- 84  canon entries 1-2 only              <- loop start
 *   bars 29-48  form 2     beats  84-144  all four entries; brass, taiko
 *   bars 49-68  form 3     beats 144-204  brass states the head in augmentation
 *                                         over the canon; the cello tries again
 *   bars 69-74  no cadence beats 204-222  everything thins to the bII, held
 * Loop 24 -> 222. The last bar is Gb — the Phrygian b2 — and it is never
 * resolved: it simply turns back into the Fm the canon starts on. The rite
 * will finish with or without you.
 */

import {
  barStarts,
  chordLine,
  chordRoots,
  concatNotes,
  drumLine,
  motif,
  scaleVelocity,
  toMidi,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import {
  agogic,
  augment,
  HYMN_HEAD,
  HYMN_SOPRANO,
  lean,
  type Note as ThemeNote,
} from './themes.ts';
import { withVelocity } from './motifs.ts';

const BAR = 3; // beats per bar in 6/8

/**
 * A phrase that swells and falls, plus the deterministic +-0.04 velocity
 * jitter THEMES.md asks for. A line rendered at one velocity is the single
 * most machine-like thing a mock-up can do, and a sixteenth-note ostinato at
 * one velocity is the "wall of constant-velocity sixteenths" the brief bans
 * outright. The arch is the bible's default: 0.62 -> 0.78 -> 0.58 over a
 * phrase, written here as a sine so it applies to any line.
 *
 * NOT applied to anything carrying a written accent — the boss off-beat
 * rule, the motif's thrown-away snap, the locked canon — because levelling
 * those out is exactly what this rule exists to prevent.
 */
function breathe(notes: Note[], phraseBeats: number, depth = 0.1): Note[] {
  return notes.map((n, i): Note => {
    const phase = ((n[0] % phraseBeats) + phraseBeats) % phraseBeats / phraseBeats;
    const arch = Math.sin(phase * Math.PI) * depth - depth * 0.3;
    const jitter = ((((i * 2654435761) >>> 0) % 2000) / 2000 - 0.5) * 0.08;
    const v = (n[3] ?? 0.8) + arch + jitter;
    return [n[0], n[1], n[2], Math.max(0.05, Math.min(1, v))];
  });
}

/**
 * THE ONE TRANSFORMATION. Move HYMN up a semitone into F, then flatten every
 * resulting G — the 2nd degree — to Gb. E Aeolian becomes F Phrygian, the
 * hymn's sigh becomes `AMEN_PHRYGIAN`, and the prayer belongs to the villains.
 * The 7th is never sharpened here or anywhere: her brittleness is the b2, not
 * a leading tone.
 */
const SECOND_DEGREE = 7; // pitch class of G, the 2nd of F
function phrygian(notes: ThemeNote[]): Note[] {
  return notes.map((n): Note => {
    const midi = toMidi(n[2]) + 1;
    return [n[0], n[1], midi % 12 === SECOND_DEGREE ? midi - 1 : midi, n[3]];
  });
}

// --------------------------------------------------------------- the canon

/** The subject: `HYMN_HEAD`, four notes, untouched by the Phrygian change
 *  because it contains no 2nd degree. F - Eb - F - Ab. */
const SUBJECT = HYMN_HEAD;

/** Entries at the octave and the fourth. Never the tritone. */
const ENTRIES = ['F3', 'Bb3', 'F4', 'Bb4'];

/** The rite does not breathe: flat, and the only flat velocity in the score. */
const RITE_VELOCITY = 0.62;

/** Entries three beats apart, a statement every four bars, forever. */
const ENTRY_GAP = 3;
const CANON_PERIOD = 12;

function canon(start: number, bars: number, voices: number[]): Note[] {
  const notes: Note[] = [];
  for (let at = start; at < start + bars * BAR; at += CANON_PERIOD) {
    for (const v of voices) {
      notes.push(
        ...withVelocity(
          motif(SUBJECT, [at + v * ENTRY_GAP], [ENTRIES[v]!]),
          RITE_VELOCITY,
        ),
      );
    }
  }
  return notes;
}

// -------------------------------------------------------------- the harmony

/**
 * HYMN's own chords, moved to F Phrygian. Five chords and no dominant, exactly
 * as the hymn has none — plus the bII (`Gb`), which is what Phrygian sounds
 * like and where the b2 in the tune is harmonised rather than merely passing.
 * One symbol per bar.
 */
const P1 = ['Fm', 'Ab', 'Bbm', 'Fm']; // i bIII iv i          — HYMN bars 1-4
const P2 = ['Fm', 'Bbm', 'Db', 'Bbm']; // i iv bVI iv          — bars 5-8, the amen
const P3 = ['Db', 'Ab', 'Dbmaj7', 'Ab']; // bVI bIII bVImaj7 bIII — the climb
const P4 = ['Fm', 'Bbm', 'Gb', 'Fm']; // i iv bII i           — the b2, harmonised
// bVI bVII iv i. The bVII is Eb MINOR, not Eb major: a major triad on the
// flat seventh contains a natural G, which is the 2nd degree this whole cue
// exists to flatten. One chord quality, and it is the difference between F
// Phrygian and F Aeolian with a decoration.
const P5 = ['Db', 'Ebm', 'Bbm', 'Fm'];
const SECTION_CHORDS = [...P1, ...P2, ...P3, ...P4, ...P5]; // 20 bars

/** The close that is not one: iv, then the bII, and nothing after it. */
const TAIL_CHORDS = ['Bbm', 'Bbm', 'Gb', 'Gb', 'Gb', 'Gb']; // 6 bars

const INTRO_BARS = 8;
const SECTION_BARS = 20;
const TAIL_BARS = 6;
const BARS = INTRO_BARS + SECTION_BARS * 3 + TAIL_BARS; // 74

const FORM1 = INTRO_BARS * BAR; // 24
const FORM2 = FORM1 + SECTION_BARS * BAR; // 84
const FORM3 = FORM2 + SECTION_BARS * BAR; // 144
const TAIL = FORM3 + SECTION_BARS * BAR; // 204
const LENGTH = BARS * BAR; // 222 beats = 100.9 s

const INTRO_CHORDS = ['Fm', 'Fm', 'Fm', 'Fm', 'Bbm', 'Bbm', 'Fm', 'Fm'];

// -------------------------------------------------------------- the ostinato

/** Root - fifth - octave only, so it is safe over every chord quality that
 *  passes underneath and never once has an opinion about the harmony. */
const GALLOP_UP: Note[] = [
  [0, 0.5, 0, 0.85],
  [0.5, 0.5, 7, 0.68],
  [1, 0.5, 12, 0.8],
  [1.5, 0.5, 7, 0.68],
  [2, 0.5, 0, 0.84],
  [2.5, 0.5, 7, 0.66],
];

const GALLOP_DOWN: Note[] = [
  [0, 0.5, 12, 0.6],
  [0.5, 0.5, 7, 0.54],
  [1, 0.5, 0, 0.64],
  [1.5, 0.5, 12, 0.58],
  [2, 0.5, 7, 0.54],
  [2.5, 0.5, 0, 0.64],
];

function ostinato(pattern: Note[], chords: string[], start: number, octave: number, velScale: number): Note[] {
  const notes = motif(pattern, barStarts(start, chords.length, BAR), chordRoots(chords, octave));
  return velScale === 1 ? notes : scaleVelocity(notes, velScale);
}

function harpLine(): Note[] {
  return concatNotes(
    ostinato(GALLOP_UP, INTRO_CHORDS, 0, 3, 0.5),
    ostinato(GALLOP_UP, SECTION_CHORDS, FORM1, 3, 0.8),
    ostinato(GALLOP_UP, SECTION_CHORDS, FORM2, 3, 0.95),
    ostinato(GALLOP_UP, SECTION_CHORDS, FORM3, 3, 1.1),
    ostinato(GALLOP_UP, TAIL_CHORDS, TAIL, 3, 0.45),
  );
}

/** The harp breathes across each four-bar phrase; the canon above it does not. */
function harpBreathing(): Note[] {
  return breathe(harpLine(), 12, 0.1);
}

function stringsShortLine(): Note[] {
  return concatNotes(
    ostinato(GALLOP_DOWN, SECTION_CHORDS, FORM2, 4, 0.8),
    ostinato(GALLOP_DOWN, SECTION_CHORDS, FORM3, 4, 1),
    ostinato(GALLOP_DOWN, TAIL_CHORDS.slice(0, 2), TAIL, 4, 0.4),
  );
}

function stringsShortBreathing(): Note[] {
  return breathe(stringsShortLine(), 12, 0.1);
}

// ------------------------------------------------------------- the solo cello

/**
 * The one human being in the room. HYMN's own soprano line in F Phrygian,
 * half speed, with real rubato — a breath at the end of each phrase, a
 * ritardando at the last two notes — and the appoggiatura rule applied to the
 * Phrygian amen, so the Gb that leans is LOUDER than the F it falls to.
 *
 * Bars 1-4 in the intro, unaccompanied over the harp, before any canon exists;
 * bars 5-8 in the third form, where the machine simply plays over the top.
 */
function celloPhrase(hymnBarFrom: number, hymnBars: number, start: number, velocity: number): Note[] {
  const sung = phrygian(tracker(HYMN_SOPRANO, { checkBars: 4, gate: 1.0 }));
  const from = (hymnBarFrom - 1) * 4;
  const to = from + hymnBars * 4;
  const window = sung
    .filter((n) => n[0] >= from && n[0] < to)
    .map((n): Note => [(n[0] - from) * 1.5, n[1] * 1.5, n[2], velocity]);
  // A breath at the end of each 4-bar phrase, and a ritardando into the last.
  const breathed = agogic(window, [6 * 1.5, 12 * 1.5], 0.08);
  const shaped = agogic(breathed, [(to - from - 1) * 1.5], 0.18);
  // The one line in the cue that is allowed to be a person: it swells and
  // falls across each of its two six-bar phrases while the machine does not.
  const played = breathe(shaped, 18, 0.14);
  return played.map((n): Note => [n[0] + start, n[1], n[2], n[3]]);
}

function celloLine(): Note[] {
  const intro = celloPhrase(1, 4, 12, 0.6);
  // The Phrygian amen, bar 8 of the hymn: the leaning Gb is louder than the F.
  const overrun = lean(celloPhrase(5, 4, FORM3 + 24, 0.72), [[24, 27]]);
  return concatNotes(intro, overrun);
}

// --------------------------------------------------------------- the choir

/** Entries 1-2 through form 1, all four from form 2 on. */
function choirLow(): Note[] {
  return concatNotes(
    canon(FORM1, SECTION_BARS, [0]),
    canon(FORM2, SECTION_BARS, [0, 1]),
    canon(FORM3, SECTION_BARS, [0, 1]),
    canon(TAIL, 2, [0]),
  );
}

function choirHigh(): Note[] {
  return concatNotes(
    canon(FORM1, SECTION_BARS, [1]),
    canon(FORM2, SECTION_BARS, [2, 3]),
    canon(FORM3, SECTION_BARS, [2, 3]),
  );
}

/** The exact onset the choir cannot give: every canon entry doubled pizzicato. */
function pluckLine(): Note[] {
  return scaleVelocity(concatNotes(choirLow(), choirHigh()), 0.75);
}

// ---------------------------------------------------------------- the brass

/**
 * Form 3's brass states the canon subject in augmentation — twice as slow as
 * the entries grinding underneath it, so the same four notes are heard as
 * ceremony and as mechanism at once.
 */
function brassLine(): Note[] {
  const augmented = augment(SUBJECT, 3);
  const heads: Note[] = [];
  for (let i = 0; i < 5; i++) {
    heads.push(...withVelocity(motif(augmented, [FORM3 + i * 12], ['F2']), 0.62 + i * 0.05));
  }
  return concatNotes(
    chordLine(SECTION_CHORDS.slice(8), {
      start: FORM2 + 8 * BAR,
      barBeats: BAR,
      octave: 3,
      center: 53,
      velocity: 0.42,
      dur: 2.2,
      roll: 0.12,
    }),
    heads,
    chordLine(TAIL_CHORDS, { start: TAIL, barBeats: BAR, octave: 3, center: 55, velocity: 0.3, dur: 2.4 }),
  );
}

// ----------------------------------------------------------- the percussion

/** Fixed pitch, forever. The rite does not care what chord is under it. */
function timpaniLine(): Note[] {
  return concatNotes(
    drumLine('X..X..', { start: 0, step: 0.5, pitch: 'F2', velocity: 0.5, times: INTRO_BARS }),
    drumLine('X..X..', { start: FORM1, step: 0.5, pitch: 'F2', velocity: 0.68, times: SECTION_BARS * 2 }),
    drumLine('X..X..', { start: FORM3, step: 0.5, pitch: 'F2', velocity: 0.78, times: SECTION_BARS }),
    drumLine('X.....', { start: TAIL, step: 0.5, pitch: 'F2', velocity: 0.32, times: TAIL_BARS }),
  );
}

function taikoLine(): Note[] {
  return concatNotes(
    drumLine('x.x.x.', { start: FORM1, step: 0.5, pitch: 'F2', velocity: 0.34, times: SECTION_BARS }),
    drumLine('XxXx.x', { start: FORM2, step: 0.5, pitch: 'F2', velocity: 0.58, times: SECTION_BARS }),
    drumLine('XxXxXx', { start: FORM3, step: 0.5, pitch: 'F2', velocity: 0.74, times: SECTION_BARS }),
    drumLine('x.....', { start: TAIL, step: 0.5, pitch: 'F2', velocity: 0.26, times: TAIL_BARS }),
  );
}

export const yunalescaTrack: Track = {
  name: 'boss-yunalesca',
  bpm: 132,
  timeSig: [6, 8],
  loop: { start: FORM1, end: LENGTH },
  length: LENGTH,
  tailSec: 4,
  fx: {
    reverb: { room: 0.78, damp: 0.3, width: 0.94, preDelay: 0.02 },
    delay: { timeBeats: 1.5, feedback: 0.24, damp: 2600 },
  },
  channels: [
    { name: 'choir canon low', instrument: 'choir', volume: 0.85, pan: -0.12, notes: choirLow(), fx: { reverb: 0.42 } },
    { name: 'choir canon high', instrument: 'choir', volume: 0.6, pan: 0.18, notes: choirHigh(), fx: { reverb: 0.46 } },
    { name: 'canon onsets', instrument: 'pluck', volume: 0.34, pan: 0.04, notes: pluckLine(), fx: { reverb: 0.16 } },
        // Written for `cello-solo`, which has a sampled preset but no synthesised
    // voice, so naming it would throw on the runtime fallback path. `strings-low`
    // is cellos and basses together; the line is written high in the cello's
    // singing register and kept quiet so it still reads as one player.
    { name: 'cello solo', instrument: 'strings-low', volume: 0.72, pan: -0.06, notes: celloLine(), fx: { reverb: 0.34, delay: 0.1 } },
    { name: 'harp ostinato', instrument: 'harp', volume: 0.62, pan: -0.3, notes: harpBreathing(), fx: { reverb: 0.14 } },
    { name: 'strings ostinato', instrument: 'strings-short', volume: 0.5, pan: 0.3, notes: stringsShortBreathing(), fx: { reverb: 0.18 } },
    { name: 'brass', instrument: 'brass', volume: 0.62, pan: -0.2, notes: brassLine(), fx: { reverb: 0.32 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.8, pan: 0.08, notes: timpaniLine(), fx: { reverb: 0.22 } },
    { name: 'taiko', instrument: 'taiko', volume: 0.62, pan: -0.16, notes: taikoLine(), fx: { reverb: 0.16 } },
  ],
};

export default yunalescaTrack;
