# THEMES — the thematic bible

Every arranger and the sound designer works from this file. It fixes the six
themes, says which of them appears in each cue and how, and gives the harmonic,
performance and sound-effect rules that make twenty-one cues sound like one
score instead of twenty-one demos.

The note data lives in [`src/audio/tracks/themes.ts`](../../src/audio/tracks/themes.ts).
**Import it. Do not retype it, and do not edit `motifs.ts` or any existing
track to get at it.** This document explains what the data means and what you
are allowed to do to it.

- How notes become sound: [`PIPELINE.md`](PIPELINE.md)
- How to write a track at all: [`../AUDIO-GUIDE.md`](../AUDIO-GUIDE.md)
- Licences and attribution: [`CREDITS.md`](CREDITS.md)

---

## The rule that outranks everything else

> Every note in this score is **original**. No melody, hymn, fanfare, riff or
> lyric from Final Fantasy, Clair Obscur: Expedition 33 or any other
> copyrighted work may be quoted, transcribed or paraphrased — not as a tribute,
> not "just the first four notes", not transposed, not in an inner voice.

What we *are* copying is the **language**: instrumentation, mode, meter,
texture, the way a phrase breathes. A piano-and-strings lament in B Aeolian
with a plagal cadence is a genre, not a theft. A recognisable tune is a theft.

Each theme below ends with a **Resemblance guard** listing the specific shapes
that theme must never drift into. Those are not suggestions; they are the
reason Bailey can ship this.

---

## Why these six, and what holds them together

Six themes, and three of them are secretly the same four notes.

**The fingerprint — `bVI - bVII - i`.** Approached by stepwise ascent, landing
the melody's highest note on the `i`. It is HYMN bars 10-11 (`C - D - Em`),
FAREWELL bars 10-11 (`G - A - Bm`) and FATHER bars 3-4 (`Bb5 - C5 - D5`) — the
same frame, in the same metric position, in three different themes. That is why
the son's lament and the father's riff can be played simultaneously in the Final
Aeon fight without a single note being bent to make them fit. The collision is
structural, not cosmetic.

**The amen.** Scale degree 2 held over the `iv`, falling to the tonic. Plagal,
never authentic. It closes HYMN twice, FAREWELL once, and — in the major — the
victory fanfare. One cadence, four appearances, the whole score's punctuation.
Exported once as `AMEN`.

**The shared incipit.** `FAREWELL_RISE` is `5(below) - 1 - 2 - b3`, which is the
shipped `PYREFLY_RISE` cell the title cue has always used. FAREWELL is that
cell's full form, so "Tide, Remembered" is retroactively the score's first,
incomplete statement of its central theme. And `SONGSTRESS_RISE` is the same
four degrees with a **major** third — which is the shipped
`PYREFLY_RISE_MAJOR`. FFX's goodbye and FFX-2's pop hook open on the same four
scale degrees, one minor, one major, at wildly different tempi. Nobody will
consciously notice. Everybody will feel that the two games belong to one score.

**The straightening.** FATHER's swagger is HYMN's head with every note shoved
onto the off beat. Push them back on the beat and the riff turns into the
prayer. `scene-gagazet` does exactly that, on one unaccompanied horn, and says
nothing about it.

---

## 1. HYMN — "Still Water"

> A congregation's prayer that was old before anyone alive learned it: five
> chords, no dominant anywhere, a falling neighbour that lifts, and a plagal
> amen that sounds like permission to stop.

|  |  |
|---|---|
| Key | **E Aeolian** (natural E minor). No leading tone, ever, in any transformation. |
| Meter / tempo | 4/4, `checkBars: 4`, **52 bpm**. Broad and congregational — this is sung by a crowd, not a soloist, so *no rubato* (it is the only lyrical theme with none). |
| Length / form | 16 bars, 64 beats. A(1-4) A′(5-8) B(9-12) A″(13-16). |
| Range | Soprano D4-E5; the singable body is one octave, E4-E5, with a single lower neighbour. |
| Climax | Bar 11, 69% through, on **E5** over `Cmaj7` — the highest note arrives from the flat side, never from the tonic. |
| Data | `HYMN_HEAD`, `HYMN_FOURTH`, `HYMN_ANSWER`, `HYMN_SIGH`, `HYMN_SOPRANO/ALTO/TENOR/BASS`, `HYMN_CHORDS`, `HYMN_CHORDS_HALF`, `HYMN_SYLLABLES` |

**Scale degrees** (1 = E):

```
A   1 b7 1 b3 | b3 1   | 1 4    | b3 –
A′  1 b7 1 5  | 4 b3   | 2 b3 4 | 2 1        <- bar 8: THE SIGH
B   b3 4      | 5 4 5  | 8 b7   | 5 4        <- bar 11: THE CLIMAX
A″  1 b7 1 b3 | 4 b3   | 5 b3   | 2 1        <- bar 16: THE SIGH again
```

**The head is four notes: `1 - b7 - 1 - b3`.** A lower neighbour that falls and
then lifts. Bar 3's low rising fourth (`E4 - A4`) is answered at bar 11 by the
same interval an octave and a fifth higher (`B4 - E5`), so the whole hymn is one
gesture asked low and answered at the top. Bar 5 does **not** repeat bar 1: its
fourth note leaps to the 5th instead of the b3, which both varies the phrase and
plants the B4 that the climax will come back for.

**Harmony — five chords, and not one of them is a dominant.**

```
 1 Em          the head over an open fifth; the third is in the soprano only
 2 G           bIII, warm, then G6 as the tune settles
 3 Am          iv — the rising fourth lands on the subdominant
 4 Em          home; ALL FOUR VOICES REST on beat 4. That is the breath.
 5 Em
 6 Am | C      iv then bVI
 7 D           bVII
 8 Am | Em     iv6 (the F#4 is a 6th against Am — the ache) then i: THE AMEN
 9 C           bVI — the climb starts inside the flat sixth, which is why it lifts
10 G  | D      bIII then bVII, stepwise ascent in the tune: THE FINGERPRINT begins
11 Cmaj7       THE ARRIVAL. E5 held 3 beats. Alto opens from a 3rd below to a 4th
               below, so the sound physically widens where the tune peaks.
12 G  | Am     descent out of the climax, both plagal, no dominant anywhere
13 Em          the head returns unchanged — that is what makes it a hymn
14 Am | G
15 C  | G      Cmaj7 again, echoing the climax one last time
16 Am | Em     iv6 - i. Identical to bar 8. Let the tail run 6 s.
```

There is no `B` or `B7` in this hymn. The absence of a dominant is what makes it
sound like a rite rather than a song; if you add one you have written something
else.

**Voicing.** Never double the third in a three-voice chord. Bars 1, 5 and 13 are
an open fifth in the lower voices with the third in the soprano alone — that
hollowness is the sound of a congregation, not a choir. The alto shadows the
soprano a third below for fifteen bars and opens to a fourth only at bar 11.

**Syllables.** Invented, non-lexical, open vowels only (`ai e i o u`), one per
struck note, ties carry the vowel; the renderer only needs the vowel for its
formant filter. `HYMN_SYLLABLES` has a set that works. **Rule:** no
four-syllable group may recur more than twice in a cue and none may scan as a
name. If a listener could mishear it as a word, change it.

**Transformations.**

- **pause** — bars 1-8 only. Solo soprano on the tune, tenor drone at volume
  0.25, no alto, no bass, no percussion. 46 bpm, `reverb { room: 0.94, damp:
  0.2, preDelay: 0.05 }`. Loop 0→32 beats; the phrase ends on the tonic at bar 8
  so it circles with no seam. The silence around it is the cue.
- **boss-yu-yevon** — the full 16 bars at `augment(…, 2)`: 32 bars at 40 bpm,
  one statement ≈ 3 minutes. Choir only over a single low drone, no attack, no
  percussion. **Strip bars 12-16 of their harmony**: from the climax on, the
  voices sing unaccompanied, and the final `Am | Em` amen is replaced by `Am`
  held and never resolved. A second choir enters a fifth above, 8 beats late, for
  the last statement, so the hymn ends as bare organum. No cadence. He has no end.
- **scene-zanarkand-dome** — harmonised and warm, the only time it ever is.
  Strings take the SATB as written; a solo soprano floats `HYMN_ANSWER` an octave
  up over bars 9-12; piano plays `arpLine(HYMN_CHORDS, { pattern: [0,2,4,5,4,2],
  step: 0.25, octave: 2 })`. 56 bpm. Harp glissando into bars 10 and 11.
- **boss-yunalesca** — cold and canonic. Transpose +1 to **F Phrygian** and
  replace the 2 with Seymour's **b2** everywhere, so `AMEN` becomes
  `AMEN_PHRYGIAN`: two notes, and the prayer now belongs to the villains. Take
  `HYMN_HEAD` alone as a canon subject and stack four entries 3 beats apart
  (matching that cue's 6/8 `checkBars: 3`) at the **octave and the fourth** — not
  the tritone; a tritone canon on a modal tune reads as noise, not as rite. The
  voices never line up into a chord; they line up into a machine. Velocity
  constant at **0.62** — deliberately unhumanised *here and nowhere else*,
  because the rite does not breathe.
- **chapter-select** — `HYMN_HEAD` alone, four notes, solo flute, unaccompanied,
  at the top of the cue before the waltz starts, then two beats of silence. Four
  notes is enough to name the world.
- **ending-ffx** — bars 13-16 only, full choir and orchestra, and the last `Em`
  becomes **E major**: one Picardy third, one chord, at the very end, with a
  timpani roll under it.
- **scene-bevelle-underground** — `HYMN_POISONED`, once. Seymour's chromatic
  passing notes are pushed between the prayer's steps until it no longer scans.
  Low clarinet or pedal organ, quiet, unaccompanied, never mentioned again.

**Resemblance guard.** This is the highest-risk theme in the score: a slow modal
a cappella minor prayer on invented open vowels is exactly the design space of
the famous one. Therefore — the head is `1 b7 1 b3`, **not** `1 b3 4 5` (the most
worn shape in modal prayer writing and the closest to the source); the 7th is
never sharpened, in any transformation, for any reason (Yunalesca's brittleness
comes from the b2, not a leading tone); syllables never form a repeated
name-like four-syllable cell; and no solo female voice ever sings the tune
straight over a sustained pad. **Bailey hears the head on its own before anyone
renders a full cue.**

---

## 2. FAREWELL — "The Dream That Has To End"

> Sixteen bars about a dream that knows it is ending: it starts already falling,
> climbs once with everything it has to an octave it cannot hold, and comes home
> by the same road, a step slower, with the leading tone withheld the whole way
> so nothing is ever forced to resolve.

This is the emotional heart of the score and the theme that visits every
register. If only one cue is beautiful, make it this one.

|  |  |
|---|---|
| Key | **B Aeolian**, with exactly one borrowed leading tone (bar 12, and it is suspended away). |
| Meter / tempo | 4/4, `checkBars: 4`, **58 bpm** with real rubato. |
| Length / form | 16 bars, 64 beats. A(1-4) A′(5-8) B(9-12) A″(13-16). |
| Range | F#3-B4. The singable body is one octave, B3-B4; the F#3 is the low approach note. |
| Climax | Bar 11, 66% through. The only bar in the theme that quickens. |
| Data | `FAREWELL_RISE`, `FAREWELL_FALL`, `FAREWELL_CLIMB`, `FAREWELL_AMEN`, `FAREWELL_RH`, `FAREWELL_WALTZ`, `FAREWELL_CHORDS`, `FAREWELL_CHORDS_HALF`, `FAREWELL_CHORDS_RELEASED`, `FAREWELL_DYNAMICS` |

**Scale degrees** (1 = B):

```
A   5 1 2 b3 | 4 b3    | 2 b3 1 | 1 –
A′  5 1 b3 4 | 5 4     | b3 4 2 | 1 –
B   b3 4 5   | b6 5    | 8 b7 8 b6 | 5 4 b3     <- bar 11: the octave, then THE ACHE
A″  – 5 1 2  | b3 2    | 1 b3   | 2 1           <- bar 16: THE AMEN
```

**Three things make this theme, and all three are easy to render wrong.**

1. **One rhythm at four heights.** Hold three beats, step down one —
   `FAREWELL_FALL` — at bars 2, 6, 10 and 14, on `E4→D4`, `F#4→E4`, `G4→F#4`,
   `D4→C#4`. Four statements of one shape at four pitch levels is what makes a
   tune hummable after a single hearing. Bar 14 is the *lowest* of the four: the
   theme comes home below where it started.
2. **Every one of those is an appoggiatura, and the HELD note must be LOUDER
   than the note it falls to.** `+0.08` velocity on the leaning note. Machines
   always get this backwards, and getting it backwards is the single loudest
   tell of a synthetic performance. Use `lean()` from `themes.ts`.
3. **The climax refuses to resolve.** Bar 11 is the only bar with eighth notes;
   it touches the octave B4 twice and then lands on **G4 — the b6 — sounded over
   the tonic chord** while `bVI - bVII - i` closes underneath it. The harmony
   arrives home and the melody will not. That instant is the theme.

**Harmony.** Root motion is by step and third; there is no circle of fifths
anywhere, and a modal minor `v` (`F#m`) sits in every place a dominant is
expected.

```
 1 Bm             the incipit; C#4 is a passing 9th
 2 Em             iv — the E4 is its root, the D4 a m7: the ache
 3 A              bVII, warm and open
 4 Gmaj7          bVI with its major 7th; the tune rests on its 3rd. BREATHE — beat 4 is a rest.
 5 Bm
 6 D              bIII — the escape hatch
 7 Em | F#m       iv, then the MODAL MINOR v. Withholding the leading tone here is
                  why the phrase sounds resigned instead of dramatic.
 8 Bm             first close, arrived at from the minor v. Rest on beat 4.
 9 D              bIII — the climb starts inside the relative major, which is why it feels like hope
10 G  | A         bVI then bVII: THE FINGERPRINT
11 Bm             i. Whole bar, bass on B1 doubled at B2. THE ARRIVAL, and the tune's b6 hangs over it.
12 Gmaj7 | F#7sus4  bVI, then a dominant with its third suspended away. The leading
                  tone is withheld even at the moment of maximum pull, and resolves
                  in bar 13 without ever having asserted itself.
13 Bm             the reprise opens on a REST — displaced by one beat, so it does not
                  begin identically to bars 1 and 5. The F#7sus4 resolves into silence.
14 Em | A         the held D4 is a m7 over Em and then a 4-3 suspension over A
15 Gmaj7 | Em7
16 Em6 | Bm       iv6 - i. The C#4 is a 6th against the chord and a 2nd against the
                  key, and it is the last ache before home. Let the pedal blur it.
```

**Dynamics.** `FAREWELL_DYNAMICS` is not decoration; it is half the theme. Bar 9
deliberately steps *back* to 0.66 before the climb, so bar 11 has somewhere to
come from. Bar 11's downbeat at **0.94** is the loudest note in the score outside
the boss fights. The reprise falls to 0.44 by the last two notes.

**The re-harmonisation reserve.** `FAREWELL_CHORDS_RELEASED` changes three
chords — bar 7's `F#m` to `F#7`, bar 12's `F#7sus4` to `F#7`, bar 16's `Bm` to
`B` major — and not one note of the melody. The lament becomes a benediction.
**Spend it once,** in `ending-ffx`'s second statement, or it is worth nothing.

**Transformations.**

- **title** — bars 1-8 only, solo piano, in **A minor** (a tone below home) and
  the phrase never finishes. The theme only reaches its true key in the ending.
- **chapter-select / menus / pause music** (the Clair Obscur register) —
  `FAREWELL_WALTZ`: 3/4, `checkBars: 3`, 84 bpm, same pitches re-barred. The
  theme survives the meter change because its cells are three- and four-note
  groups. Bass root on beat 1 (octave, velocity 0.5), chord on beats 2 and 3; from
  bar 9 the chord is voiced *above* the melody's register so the texture inverts
  at the climb. String quartet doubles the tune from bar 9. A distant wordless
  soprano (volume 0.22, reverb 0.6) takes bars 9-12 alone and stops.
  **Chapter-select uses bars 1-8 only and loops there** — the theme's heart is
  saved for the Dome and the ending, which is also how you stop a menu loop
  wearing it out.
- **scene-zanarkand-dome** (nocturne) — 48 bpm, melody `transpose: +12`, left
  hand in rolling sextuplet broken chords: `arpLine(FAREWELL_CHORDS, { pattern:
  [0,2,3,4,5,4,3,2], step: 0.3333, dur: 0.4, octave: 2, velocity: 0.34 })`. Quiet,
  pedalled, never accented. Celesta doubles bar 11's peak an octave up and lets it
  ring 8 beats. Wordless soprano takes bars 9-12 and **the piano drops out
  entirely under her**. No strings until bar 13.
- **boss-jecht** (lament over heavy guitars) — transpose +3 to **D minor**,
  matching the shipped cue. In the half-time bridge, bars 9-12 only, every
  duration doubled: melody in unison on strings, brass and a clean-ish guitar an
  octave below, over `Bb5 - C5 - D5` power chords — which is FAREWELL's own bar
  10-11 progression played as a rock riff, and simultaneously FATHER's bars 3-4.
  In the climax, superimpose them literally: FAREWELL bars 9-12 in strings and
  choir at half-time above, FATHER's four bars in guitars and bass below at full
  speed, entered **2 beats late** so the syncopations land against the lament's
  downbeats rather than with them. Do not smooth this out. It is supposed to be
  two people talking over each other.
- **ending-ffx** (full orchestra release) — statement 1: bars 1-8, solo piano,
  alone. Statement 2: bars 1-16 on `FAREWELL_CHORDS_RELEASED`, full strings, violas
  doubling the tune an octave below **from bar 9 onward** so the sound physically
  widens at the climb, horns on `HYMN_HEAD` in augmentation, timpani roll into
  bar 11. Let the final B major ring 8 seconds over a held string chord and
  nothing else.
- **scene-gagazet / scene-dreams-end** — `FAREWELL_RISE` alone, four notes, solo
  cello, once, unaccompanied, then thirty seconds of a single drone before
  anything else happens. Silence is the instrument here.
- **victory-ffx** — `PYREFLY_RISE_MAJOR` (the same four degrees, major) on solo
  flute over the last two bars of the relaxed loop. At ease, and unremarked.

**Resemblance guard.** The melody is safe; the **texture** is the risk, because
slow minor solo piano over pedalled broken chords is the famous piece's own
texture. So: the left hand stays on the six- or eight-note rolling pattern and
**never** on a repeated-note ostinato; the melody is never doubled by a solo
female voice singing the tune straight; and the nocturne's soprano gets bars
9-12 only, wordless, and never the head.

---

## 3. SEYMOUR — "Noble Rot"

> Six notes that look down on you: a courteous bow up a minor sixth, then a
> chromatic decline, and a leading tone held forever without ever condescending
> to resolve.

|  |  |
|---|---|
| Key | **C# minor**, treated Baroque-chromatically (the shipped `boss-seymour` key — no transposition needed). |
| Meter / tempo | 4/4, `checkBars: 4`, stated at 132 bpm but in half- and quarter-notes, so it moves at its own pace, unbothered by the band. |
| Length | 2 bars, 8 beats, **6 notes**. Register C#3-A3 — deliberately low. |
| Data | `SEYMOUR`, `SEYMOUR_MIRROR`, `SEYMOUR_UNMOORED`, `SEYMOUR_LINE`, `SEYMOUR_COUNTER`, `SEYMOUR_CHORDS`, `SEYMOUR_SEQUENCE`, `HYMN_POISONED` |

**Scale degrees** (1 = C#): `1 — b6 — 5 — #4 — 4 — b3`.

One rhetorical gesture: a bow up a minor sixth, then a chromatic decline. The
courtesy and the insincerity in one line, carried by a **double-dotted
French-overture snap** (`1.75 + 0.25`) that is aristocratic by idiom rather than
by description. The `#4` is *dotted*, not passing: it is the only pitch in the
motif that belongs to no key, and it carries weight.

**Velocity shape.** `0.74 / 0.52 / 0.72 / 0.78 / 0.68 / 0.62`. The snap up to the
b6 is **quieter than the note before it** — thrown away, like a remark. The whole
character lives in that dropped note. Do not let a compressor put it back.

**Counter-subject.** `SEYMOUR_MIRROR` is the strict inversion — genuine contrary
motion, not a decorative line. As the motif bows up and declines, the mirror
descends and climbs, and the two converge on a minor ninth exactly where the `#4`
falls. Manuals answer the pedal with it. The organ pedal holds C#1 under bar 1
and **G1 under the `#4`** — the tritone lives there, in the floor, not in the tune.

**Harmony** (half-bar changes): `C#m — Amaj7 — Gdim7 — G#7`, i.e.
`i — bVI — #iv°7 — V`. The `#iv°7` belongs to no key and resolves wherever it
likes. The `G#7` is a dominant that never arrives: the two-bar cell loops back to
its own `C#m`, so the dominant is always *technically* resolved and never
*audibly* resolved. The motif's last note hangs over it as a b13 and is not
written into the chord.

**This is the only functional Baroque progression in the score, and it belongs
to the only character who believes the world has rules.**

**The eight-bar period.** Sequence the two-bar cell up in minor thirds and throw
it home — `motif(SEYMOUR, [0, 8, 16, 24], SEYMOUR_SEQUENCE)` gives C#, E, G, C#.
Two bars of material become an eight-bar period that arrives back where it
started having proved nothing. That is the character.

**Registration.** Drawbars 16′ + 8′ + 2⅔′ (hollow, no 4′); pedal doubling at
C2/C1 on the first note of each statement only. `strings-low` doubles an octave
up at volume 0.5, no vibrato until the last note, which gets a slow wide vibrato
starting 0.4 s in. **He is never loud.** The band shouts; the organ sits at
volume ≤ 0.55 throughout. That contrast is the reading.

**Transformations.**

- **boss-seymour A** — motif in pedal organ and contrabasses at written pitch,
  mirror in the manuals, the eight-bar sequence underneath the band.
- **boss-seymour final form** — `SEYMOUR_UNMOORED`, once. The chromatic decline
  keeps going and turns **whole-tone**, so his scale stops containing a tonic at
  the same moment the harmony loses its floor. Drop the pedal on the first
  whole-tone note. Use it once and never again.
- **boss-dread** — the motif as a two-bar counter-line in the bass under the
  choir, at half volume. He is in the room before you meet him.
- **boss-yunalesca** — his **b2** is what turns the prayer Phrygian. That is the
  cheapest and best way to tie the two villains together, and it costs one
  accidental.
- **scene-bevelle-underground** — `HYMN_POISONED`, once. See HYMN above.

**Resemblance guard.** The pitches are common property — chromatic descents and
Neapolitans belong to everyone. The risk is the **arrangement**: rock organ plus
chanted choir over a fast chromatic bass ostinato is this character's
recognisable sound in the source. So: **no chanted choir text of any kind**, and
the ostinato never goes in the organ's left hand at speed.

---

## 4. FATHER — the riff

> A swagger with a four-bar arc: rough, proud, entirely off the beat, and
> standing on the farewell's own ground without knowing it.

|  |  |
|---|---|
| Key | **D minor** (the shipped `boss-jecht` key — do not move it). |
| Meter / tempo | 4/4, `checkBars: 4`, **144 bpm**. |
| Length | 4 bars, 16 beats. Register D2-D3. |
| Data | `FATHER`, `FATHER_RIFF`, `FATHER_STRAIGHTENED`, `FATHER_CHORDS`, `FATHER_STAMP` |

**Bar 1's pitch skeleton is `1 - b7 - 1 - b3` — `HYMN_HEAD` — with every note
shoved onto the off beat.** Straighten it and the swagger turns back into the
prayer. Nobody has to notice.

- **Bars 1 and 3 share an identical rhythm at different pitches.** That
  repetition is what makes a swagger a hook rather than a noodle. Do not vary it.
- **Bar 2 has air in it** — a rest on beat 4's first half — and every attack in
  the bar lands off the beat.
- **Bar 4 is the only bar with no rest**, and lands the octave `D3` on its
  downbeat: three quarters of the way through the phrase, late on purpose.
- **The blue b5 is rationed to exactly two grace notes per statement** — one
  climbing (bar 2, `Ab→A`), one falling (bar 4, `A→Ab→G`). Never more. A riff
  that plays its blue note constantly has no blue note.

**Ground.** `D5 | D5 | Bb5 C5 | D5`. Bars 3-4 are `bVI - bVII - i` in the same key
and the same metric position as FAREWELL bars 10-11. That is not a coincidence,
it is the design.

**Development for free.** Stamp the cell over `FATHER_STAMP` with `motif()` and
the same notes recolour on every chord — the blue b5 becomes a `#11` over the bVI
and a third over the bVII. Four bars become eight with no new material.

**The one renderer constraint, verbatim: the and-of-beat is LOUDER than the
downbeat.** `0.95` against `0.80`. No humaniser, compressor or normaliser may
level that out; if one does, turn it off for this channel. Syncopation that is
quieter than the beat it displaces is not syncopation, it is a mistake.

**Transformations.**

- **boss-jecht** — the riff in double-tracked guitars and bass, as the cue
  already does it. In the climax it plays at full speed **2 beats late** under
  FAREWELL at half-time. See FAREWELL above.
- **scene-gagazet** — `FATHER_STRAIGHTENED`: every note pushed back onto the
  beat, which is `HYMN_HEAD`. One unaccompanied horn, once, then let it sit.
- **battle-ffx** — the riff's *rhythm* only, in the kit and the bass, never its
  pitches. The regular battle borrows his energy, not his theme.

**Resemblance guard.** No repeated-note chug — the riff never restrikes the same
pitch on consecutive subdivisions. No shouted or chanted male vocal over it. No
descending chromatic tag at the end of the phrase. Those three features, not the
pitches, are what identify the source cue.

---

## 5. SONGSTRESS — FFX-2's hook, and its two dark children

> A bright pop hook whose whole identity is one interval — and flattening both
> ends of that interval turns the pop song into the tragedy and then into the
> machine.

|  |  |
|---|---|
| Key | **Db major** (spelled Db for readability; the same pitch as C#, which is the shipped `boss-shuyin` key, so Shuyin is the PARALLEL minor with the tonic unmoved). |
| Meter / tempo | 4/4, `checkBars: 4`, **132 bpm**. |
| Length / form | 8-bar hook + 8-bar jazz-fusion bridge. |
| Range | Hook Ab3-Bb4 (ceiling Bb4, and nothing in the hook goes above it). Bridge peaks Gb5. |
| Data | `SONGSTRESS_HOOK`, `SONGSTRESS_DARK`, `SONGSTRESS_RISE`, `SONGSTRESS_LEAD`, `SONGSTRESS_BRIDGE`, `SONGSTRESS_CHORDS`, `SONGSTRESS_BRIDGE_CHORDS`, `SHUYIN_CHORDS` |

**The identity is bar 3: the leap from the 3 up to the 6, a perfect fourth, then
home to the 5.** `F4 - Bb4 - Ab4`. That leap is the family's fingerprint, and
flattening both of its notes — `b3` up to `b6`, the same perfect fourth, the
opposite world — is Shuyin and Vegnagun. A transformation that costs two
accidentals and changes everything is the definition of a good leitmotif hinge.

**Two deliberate ceilings.** The hook's peak is `Bb4` (the 6 — the identity
note); the bridge's peak is `Gb5`, a sixth above it. The bridge genuinely goes
somewhere the hook could not, which is what a bridge is for.

**Bar 7 is the joy.** One bar of **bVII major** (`Cb`) dropped in at the climax
and walked back as if nothing had happened. All three melody notes of that bar
land on it — `Bb` is its major 7th, `Gb` its 5th, `Eb` its 3rd — so the brightest
bar in the score costs nothing. It is the bar that makes the tune sound like it
is enjoying itself.

**Harmony.** Hook: `Dbmaj7 | Bbm7 | Gbmaj7 | Ab7sus4 | Dbmaj7 | Bbm7 | Cb | Db6`.
Bridge: `Ebm9 | Ab9 | Dbmaj7 | Gbmaj7 | Fm7 | Bbm7 | Ebm9 | Ab7sus4` — functional
ii-V motion, which only FFX-2 is allowed.

**Transformations.**

- **boss-ffx2-aeon** — `SONGSTRESS_DARK` as supersaw stabs, Bb minor, 160 bpm.
  The bridge keeps its ii-V: FFX-2 keeps its jazz even when it is fighting a god.
- **boss-shuyin** — the **parallel** minor, tonic unchanged (C# minor), at half
  speed, solo piano and strings, rubato. Not a move to the mediant: the darkening
  has to be unmistakable, and only the parallel minor does that. **And the bar
  that was joy is now merely diatonic** — in the minor, bVII major is just the
  mode doing its job. The brightest bar in the score becomes ordinary. That is
  the cruellest thing the transformation does, and it costs nothing.
- **boss-vegnagun** — the same intervals, mechanised. Low brass and pulses,
  F minor, constant note lengths, no rubato, no jitter beyond 3 ms, the leap in
  bare octaves. The bridge's ii-V is stripped to a single static pedal: the
  machine does not modulate.
- **victory-ffx2** — `SONGSTRESS_HOOK` as a bright brass fanfare, Eb major, the
  identity leap intact and major.
- **ending-ffx2** — the hook complete with its bridge, then the last chorus up a
  step, where `FAREWELL_RISE` visits on solo flute.
- **scene-farplane** — `FAREWELL_RISE` answered by `SONGSTRESS_RISE`: the two
  games' opening gestures side by side, minor then major, on the same four
  degrees. Say nothing about it.

**Resemblance guard.** Keep the hook pentatonic-leaning and syncopated but never
built on a repeated-note riff; no scat or vocalised syllables over it (that is
the source's signature, not ours); no brass-shout-and-answer figure between the
phrases.

---

## 6. BATTLE — the fight, and the results

|  |  |
|---|---|
| Key / tempo | Hook: **E minor**, 4/4, **150 bpm** (the shipped `battle-ffx` key). Fanfare and loop: **C major**, **120 bpm**. |
| Data | `BATTLE_HOOK`, `BATTLE_CHORDS`, `VICTORY_FANFARE`, `VICTORY_FANFARE_CHORDS`, `VICTORY_LOOP`, `VICTORY_LOOP_CHORDS` |

**The hook** is eight bars: a four-bar question that climbs to the octave over
`C - D - Em` (the fingerprint again, at speed), and a four-bar answer that ends
on the **one authentic cadence in the entire FFX material** — `B7` to `Em`, bar 8,
with the leading tone `D#5` resolving up to `E5`. There are four real V-i
cadences in the whole score and this is the first. It only lands because
nothing else does it.

**The victory fanfare is built to be unlike the famous one on purpose.**

| The famous one | Ours |
|---|---|
| Three fast repeated notes on one pitch, then a long one | Opens on its **longest** note, three beats |
| Rises through an arpeggio | **Falls**, then arches by step |
| Authentic cadence, triumph | **Plagal** — `F` to `C`, relief |

Four bars, brass and horns, and the melody's closing `4 - 3` over the `IV` is
`AMEN` in the major. The victory belongs to the same story as the prayer.

**The relaxed loop** that follows is eight bars, warm, low stakes, pluck and
piano, with no dominant anywhere — a results screen should feel like rest, not
arrival. Bars 7-8 are the tag: FAREWELL's incipit in the major on solo flute.

**Resemblance guard.** No repeated-note upbeat, no rising arpeggio, no authentic
cadence in the fanfare, and the fanfare is never longer than four bars.

---

## The cue map

Twenty-five cues: the twenty shipped music keys, the new **pause** cue, Chapter VIII's two (rows 22-23, FFX only, added 2026-09-23 and awaiting Bailey's ear), Chapter VII's battle cue (row 24, FFX only, added 2026-09-24 from the sketch Bailey picked, awaiting his ear on the full cue) and Chapter IX's battle cue (row 25, FFX only, the same day, the same way). Every
row says which themes appear, how they are transformed, and — the column that
actually matters — **the one thing the cue must leave behind**.

| # | Cue | Themes and transformation | Key | BPM | Form | The one emotion |
|---|---|---|---|---|---|---|
| 1 | `title` | FAREWELL bars 1-8 only, solo piano, the phrase never finishes; `HYMN_HEAD` on flute at the very top | A minor (a tone below home) | 58 | flute cameo → A → A′ → stop | A story that is already over, being told anyway |
| 2 | `chapter-select` | `HYMN_HEAD` alone, 4 notes, flute, then silence; `FAREWELL_WALTZ` bars 1-8, loops there | B minor, 3/4 | 84 | cameo → waltz A A′ → loop | Unhurried choosing; nothing here can hurt you yet |
| 3 | **`pause`** (new) | HYMN bars 1-8, solo soprano + tenor drone at 0.25. No alto, no bass, no percussion | E Aeolian | 46 | one 8-bar phrase, loop 0→32 | The game holding its breath |
| 4 | `battle-ffx` | `BATTLE_HOOK` in full; FATHER's *rhythm* (not its pitches) in kit and bass | E minor | 150 | intro 4 · hook 8 · answer 8 (the V-i) · B 8 · loop | We can win this |
| 5 | `boss-dread` | HYMN in canon at the octave, choir over a pedal; SEYMOUR as a bass counter-line at half volume | D minor | 90 | A · A′ · canon · A | Something is watching, and it is patient |
| 6 | `boss-seymour` | SEYMOUR in pedal organ + contrabasses; `SEYMOUR_MIRROR` in the manuals; the minor-third sequence; `SEYMOUR_UNMOORED` once in the final section | C# minor | 132 | intro · A · B (mirror) · sequence · final form | Contempt that has convinced itself it is mercy |
| 7 | `boss-yunalesca` | HYMN at +1 in **F Phrygian**, `HYMN_HEAD` as a 4-entry canon 3 beats apart at the octave and the fourth, velocity locked at 0.62; `AMEN_PHRYGIAN` | F Phrygian, 6/8 | 132 | ostinato · canon entries 1-4 · brass augmentation · no cadence | A rite that will finish with or without you |
| 8 | `boss-jecht` | FATHER in full; FAREWELL bars 9-12 at half-time in the bridge; the two superimposed in the climax, FATHER entering 2 beats late | D minor | 144 | intro · A · A2 · solo · **bridge (FAREWELL)** · **climax (both)** · solo 2 · final · turn | Two people talking over each other, and both of them are right |
| 9 | `boss-yu-yevon` | HYMN whole at `augment(…, 2)`, choir over one drone; bars 12-16 unaccompanied; the amen replaced by a held `iv` that never resolves; second choir a fifth above, 8 beats late | E Aeolian | 40 | one ~3-minute statement, then organum | No end |
| 10 | `scene-gagazet` | `FATHER_STRAIGHTENED` (= `HYMN_HEAD`) on one unaccompanied horn, once; `FAREWELL_RISE` on solo cello, once; then 30 s of drone | B minor | 72 | horn · silence · cello · drone | The mountain does not care |
| 11 | `scene-zanarkand-dome` | FAREWELL as a nocturne (melody +12, sextuplet left hand, soprano alone on bars 9-12); HYMN harmonised in strings — the only time it is ever warm | B minor | 48 | nocturne A A′ · hymn (strings) · B (soprano) · A″ | Warmth remembered, which is worse than cold |
| 12 | `scene-dreams-end` | `FAREWELL_RISE` alone on celesta, bent; whole voicings planing in parallel, no functional logic | no tonic | 76 | drift · cell · drift | Unmoored |
| 13 | `scene-bevelle-underground` | `HYMN_POISONED`, once, on low clarinet; `SONGSTRESS_DARK` fragment on synth bass | G minor | 100 | pulse · fragment · poisoned prayer · pulse | The machine under the cathedral |
| 14 | `scene-farplane` | HYMN harmonised in quartal stacks, distant; `FAREWELL_RISE` answered by `SONGSTRESS_RISE` | E major | 92 | bed · call · answer · bed | Rest without forgetting |
| 15 | `victory-ffx` | `VICTORY_FANFARE` (one shot) → `VICTORY_LOOP`; FAREWELL's incipit in the major on flute at bars 7-8 | C major | 120 | 4-bar fanfare · 8-bar loop | Relief, not triumph |
| 16 | `ending-ffx` | FAREWELL complete, twice: solo piano bars 1-8, then bars 1-16 on `FAREWELL_CHORDS_RELEASED` with full orchestra; HYMN bars 13-16 with one Picardy third in the last bar | B minor → **B major** | 58 | piano statement · orchestral statement · hymn coda | Permission to stop |
| 17 | `boss-ffx2-aeon` | `SONGSTRESS_DARK` as supersaw stabs; the bridge keeps its ii-V | Bb minor | 160 | intro · A · chorus · bridge · A | A pop star fighting a god, and enjoying it |
| 18 | `boss-vegnagun` | `SONGSTRESS_DARK` mechanised: constant note lengths, jitter ≤ 3 ms, bare octaves in low brass, bridge stripped to a static pedal | F minor | 168 | ostinato · A · lurch · A′ | Something enormous, and nobody is driving |
| 19 | `boss-shuyin` | SONGSTRESS in the **parallel** minor, tonic unmoved; bar 7's borrowed joy becomes merely diatonic; piano and strings, rubato in the half-time B | C# minor | 154 (B at 77) | A · B (half-time) · A′ · coda | Grief that has curdled |
| 20 | `victory-ffx2` | `SONGSTRESS_HOOK` as a brass fanfare, identity leap intact and major | Eb major | 128 | fanfare · results groove | That was fun |
| 21 | `ending-ffx2` | SONGSTRESS complete with its bridge; last chorus up a step, `FAREWELL_RISE` visiting on flute | Bb major → C | 84 | verse · chorus · bridge · chorus +1 | The second game says goodbye more gently, because it can |
| 22 | **`boss-evrae`** (new) | `FAREWELL_RISE` driven at speed as the head of a two-bar **ship figure** with a rest in every bar (`fahrenheit.ts`), so the fight can interrupt it anywhere; at range, `FAREWELL_RISE` and `FAREWELL_FALL` at double length on a distant flute. No HYMN, no choir, no organ: Bevelle's holiness is the scene's irony, not its sound (research §12.6). No dominant; `bVI - bVII - i` at every seam. Two range balances of the same notes (`rangeVariant`: NEAR dry and percussion forward, FAR thin and wide) | A minor | 144 | engine · A · A′ (horns) · B (air, a dead stop) · C (sixteenths, same tempo) · D (piano) · turn | The ship is the weapon; keep your distance |
| 23 | **`scene-fahrenheit`** (new) | `FAREWELL_RISE` at double length then `FAREWELL_FALL` on violins — Yuna, who is not on the deck; the ship figure on flute a fourth up, foreshadowing the fight; the peak closes on `AMEN` over the iv6. No kit: the engine is a piano in open fifths and a taiko heartbeat | D minor | 104 | wind · A (violins) · B (the figure) · C (Bevelle, the amen) · wind | No time, and no way back |
| 24 | **`boss-seymour-macalania`** (new) | `SEYMOUR` an octave above `boss-seymour`'s register, on **oboe**, over a harpsichord pavane and pizzicato on 2 and 4 (Bailey's pick of sketch A, 2026-09-24); the period passed to violins with `SEYMOUR_MIRROR` in the cellos; the bow split between harpsichord (the snap up to the b6) and oboe (the decline); a written chromatic decline, violins then clarinet, that never reaches the tonic; the rise takes the minor-third sequence one step further (C# - E - G - **A#**) with low brass and a struck bell, then a plagal amen, iv to **bVI**. No organ, no choir, no synth, no kit, no ostinato: the dance bows on the last half-bar of every four-bar phrase and is silent through the curdle and the rise. `SEYMOUR_UNMOORED` is not spent | C# minor | 126 | dance · A (oboe) · A′ (violins, mirror) · B (the bow) · curdle · dance · rise (the summon) · composure · turn | Polite, and wrong |
| 25 | **`boss-yojimbo`** (new) | **No shared theme cell: its own line**, the sketch Bailey picked (O-6 A, 2026-09-24): a rising fifth that leans on the flat sixth and falls back, on **solo cello** over felt piano with no pulse; when a bowed-eighths pulse and taiko join, the violin takes it an octave up and the cello answers in roots and thirds; the line moved two steps up the mode on **one horn** ("the duty", this pass's guess); violin and cello in octaves (also a guess); the strain climbs in steps with horns; **the crack**: one tutti `Abmaj7` with the violin on Ab5, pulse and drums cut, then two beats of piano alone; control returns quieter and closes on `AMEN`, iv to i. In the game this fight plays Lulu's own theme: nothing here quotes or imitates it. **No dominant and no leading tone anywhere**; Aeolian, never Dorian | C minor | 132 | grief (cello) · pulse (violin) · the duty (horn) · octaves · strain · the crack · control, amen | Grief under control, and it cracks once |

**Anti-fatigue rule.** `chapter-select` and `pause` are the two cues a player
hears most, and neither is allowed the theme's heart: chapter-select loops bars
1-8 of the waltz and pause loops bars 1-8 of the hymn. Bars 9-12 of FAREWELL —
the climb and the ache — appear in exactly four cues in the whole game
(zanarkand-dome, jecht, ending-ffx, and once in title as an unfinished
gesture). Rationing is what keeps them worth hearing.

---

## Harmonic language, by world

### FFX — Spira

Natural minor (**Aeolian**) is home. The `bVI` and `bVII` are structural chords,
not borrowings, and **the flat sixth is reserved for Spira** — it never appears
in the FFX-2 material.

- **Plagal motion carries every ending.** `iv - i` closes HYMN and FAREWELL; the
  victory fanfare closes `F - C` rather than `G - C` so the release reads as
  relief rather than triumph.
- **`bIII` is the warm escape hatch** (HYMN bar 2, FAREWELL bars 6 and 9).
- **Pedal points under everything slow.** HYMN over a drone, SEYMOUR over C#,
  VEGNAGUN over a static root.
- **Dominants are rationed to four in the whole score**: BATTLE's `B7-Em`,
  Seymour's permanently unresolved `G#7`, Shuyin's, and the last bar of
  `ending-ffx2`. Everywhere else, cadence by `iv-i`, `bVII-i` or `bVI-bVII-i`.
  That rationing is precisely what stops this sounding like library music.
- **Hamauzu colour where the mood is tender:** added 6ths and 9ths instead of
  sevenths; `Em6` and `Am6` as pre-tonic chords (the 6th aching against the 5th);
  `maj7` on the `bVI` so the flat sixth shimmers rather than thuds; **quartal
  spacing** (stacked 4ths) for scene beds and for Yu Yevon's hollowness;
  **planing** — a whole voicing moved in parallel by step for two bars with no
  functional logic — where the scene should feel unmoored (dreams-end, farplane).
- **Chromaticism belongs to Seymour and only Seymour.** The `#iv°7` hinge, the
  dominant that never resolves, the borrowed major third. He is the only
  character in the score who believes the world has rules, so he gets the only
  functional Baroque motion.

### FFX-2

**Dorian is reserved for the FFX-2 material** — the raised 6th is how you know
which game you are in. Major-key pop-jazz for the Songstress: `maj7`, `m7`, `m9`,
`7sus4`, `6/9`, real ii-V motion, a borrowed **bVII major** for one bar of joy.
Electric bass and kit, brass, electric piano. When it darkens, it darkens to the
**parallel** minor, never the relative and never the mediant. Vegnagun is the
same harmony with the motion taken out: a static pedal, and intervals instead of
progressions.

### The Clair Obscur register — menus, chapter select, pause, scenes

**Ternary meter.** FAREWELL's waltz is the menu spine: oom-pah-pah with the bass
on 1 and the chord on 2 and 3, and the chord voiced *above* the melody's register
in the second half of each phrase so the texture inverts.

- **`7sus4` as a hanging dominant** instead of a plain V7 — the leading tone is
  withheld.
- **Chromatic inner-voice descent inside a static harmony** (an alto falling
  `B - A# - A - G#` under a held `Bm`) is the chanson gesture. Put it under the
  soprano's long notes.
- Solo piano, string quartet, a distant wordless soprano, French-impressionist
  colour, and silence used as an instrument.

**Engine note.** Every chord symbol in this document parses with `QUALITIES` in
[`src/audio/harmony.ts`](../../src/audio/harmony.ts) — `m`, `maj7`, `m7`, `m7b5`,
`dim7`, `6`, `m6`, `add9`, `madd9`, `9`, `m9`, `maj9`, `7sus4`, `sus2`, `sus4`,
`5`, and slash bass. **Nothing here needs a new quality added.**

---

## Performance rules

Agents cannot hear. These numbers are how a rendered cue becomes a *performed*
one anyway. Everything in this section is supported by the renderer today unless
it is under "Renderer requests".

### What the renderer already gives you

| Capability | Where | Use it for |
|---|---|---|
| Per-note velocity | `Note[3]` | Every rule below that says "velocity" |
| Free-float start and duration | `Note[0]`, `Note[1]` | Written rubato, agogic accents, legato overlap |
| `gate` | `tracker()` option | Articulation: 0.5 staccato, 0.95-1.0 pedalled legato |
| `releaseSec` | voice preset | The tail past note-off — **this is what makes legato legato** |
| `attackSec` | voice preset | Slow bows, breathy entries |
| `timingJitterMs` | voice preset | Deterministic per-note humanisation |
| `velocityCurve` / `velocityTilt` | voice preset | Soft notes get darker as well as quieter |
| `fx.reverb` send + seating `depth` | channel / `seating.ts` | Distance, and "pedal" as resonance |

### Rubato and tempo

The renderer has one `bpm` per track, so **rubato is written into the note
values**, not into a tempo curve. Use `agogic()` from `themes.ts`.

| Gesture | Number |
|---|---|
| Breath at a phrase end (FAREWELL bars 4, 8, 12; HYMN bar 4) | lengthen the final note by **8%**, steal it from the next attack |
| Ritardando you can hear (FAREWELL bar 16, ending-ffx coda) | **18%** across the last two notes |
| Push into a climb (FAREWELL bars 9-10) | shorten each note by **4%**, so the climb arrives slightly early and *eager* |
| Pull at the climax (FAREWELL bar 11) | lengthen the first note by **12%** |
| Absolute ceiling | **25%.** Past that it reads as a glitch, not as expression |
| HYMN, and the Yunalesca canon | **zero.** A congregation does not rubato, and the rite does not breathe |

### Dynamics and hairpins

- **Never render a phrase at constant velocity** except the two places this
  document names (the Yunalesca canon at 0.62, Vegnagun's machine).
- A four-bar phrase swells and falls: **0.62 → 0.78 → 0.58** is the default arch.
- **The appoggiatura rule: the leaning note is LOUDER than its resolution**,
  `+0.08`. Use `lean()`. This is the single most important number in this file.
- Boss-fight accents: **0.95 on the and-of-beat, 0.80 on the downbeat**, and no
  humaniser may level it.
- A held note the renderer cannot swell (see requests) is faked by **splitting
  it into two tied attacks** at 0.55 and 0.72 with a 0.15-beat overlap — but only
  on strings and choir, never on piano, where the restrike is audible.

### Legato, pedal and silence

- **Legato is overlap.** Melodic lines use `gate: 0.98-1.02`; a wind or string
  line with `gate: 0.85` is a series of events, not a phrase.
- **Piano pedal** is `gate: 0.98` plus `fx.reverb: 0.3` held through the bar, and
  the left hand cleared on the barline (shorten the last arp note of the bar to
  0.4 of its step). Piano left hand stays **above C2** except for octave
  doublings on downbeats.
- **String legato** overlaps by **60-90 ms**; a section entry gets
  `attackSec: 0.08-0.12`, a solo line 0.05.
- **Breaths are written as rests.** HYMN bar 4 beat 4 is a rest in all four
  voices. FAREWELL bars 4, 8 and 13 have rests. Do not fill them.
- **Silence is an instrument.** `scene-gagazet` gets 30 seconds of one drone
  after four horn notes. `pause` is mostly air. Resist the urge to score it.

### Humanisation

| Instrument | `timingJitterMs` | Why |
|---|---|---|
| Section strings, choir | 14-18 | A section is never exactly together |
| Solo piano | 6-9 | A player's hands are not a grid, but they are close |
| Solo strings, winds | 8-12 | |
| Rock kit, bass | 4-6 | Tight, but not quantised |
| Vegnagun, the Yunalesca canon | ≤ 3 | The only places machine timing is the point |

Velocity jitter: **±0.04** on top of the written shape, deterministic per note.
Never more — beyond that the arch stops reading.

### Voicing

- Never double the third in a three-voice chord.
- Put the ache — the 6th, 9th or b6 — in the **top** voice of strings and the
  **bottom** voice of piano, never both at once.
- The melody is doubled at the octave below by violas **only from the climax
  onward**, so the climax is where the sound physically widens.

### Renderer requests

These do not exist yet. Listed in the order they would improve the score, so the
arrangers can put the top two in their requests file first.

1. **Tempo map** — `Track.tempo?: Array<[beat, bpm]>` with linear interpolation
   between points. Written rubato inside a fixed grid can shift a note but cannot
   *bend the pulse*, and bending the pulse is half of what makes a piano sound
   played rather than typed. This is the single biggest quality item left.
2. **Per-note expression envelope** — a fifth `Note` slot or a channel-level
   curve, so a held string or choir note can swell and fall inside itself.
   Hairpins within a note are how string writing breathes; the tied-attack
   workaround above is audible on anything with a hard attack.
3. **Vibrato with onset delay** — `vibratoDelaySec`, `vibratoDepthCents`,
   `vibratoRateHz` per preset. "Vibrato that blooms on long notes" is currently
   not expressible at all; every long string note is dead straight.
4. **Sustain-pedal events** — a per-channel `pedal: Array<[beat, boolean]>`, so
   piano resonance is a real pedal rather than a reverb send, with pedal
   clearing on the barline.
5. **Per-note legato / portamento flag** — a slight pitch slide into the note
   for `violin-solo` and `cello-solo` only. Small, but it is the difference
   between a solo string and a sampled one.

---

## Sound-effect rules

The effects have to sound like they were recorded in the same building as the
music. Three rules do most of that work: **one pitch set, one room, soft
attacks.**

### The pitch set

Every pitched UI and magic sound is drawn from **FAREWELL's key, B minor** — the
Bm triad plus the two notes that ache in the theme, the 2 (`C#`) and the b6 (`G`).
Nothing else is allowed to be pitched.

| Degree | Note | Hz (UI octave) | Hz (magic octave) | Meaning it carries |
|---|---|---|---|---|
| 1 | B | 987.77 (B5) | 493.88 (B4) | Home, confirmation, completion |
| 2 | C# | 1108.73 (C#6) | 554.37 (C#5) | Question, hesitation, the ache |
| b3 | D | 1174.66 (D6) | 587.33 (D5) | Neutral, informational |
| 5 | F# | 1479.98 (F#6) | 739.99 (F#5) | Movement, cursor, transit |
| b6 | G | 1567.98 (G6) | 783.99 (G5) | Tension, denial, damage |

Sub-octave for impacts: `B1` 61.74, `D1` 36.71, `F#1` 46.25, `B0` 30.87.

### The catalogue

| Family | Material | Pitches | Shape |
|---|---|---|---|
| Cursor move | Glass, struck softly | F# alone | 8 ms attack, 45 ms body, 300 ms tail into the hall |
| Confirm | Glass + a bell partial | D → F# (rising third) | Two attacks 50 ms apart, the second quieter |
| Cancel | Glass, damped | F# → D (falling third) | The confirm, reversed and shorter |
| Denied | Two soft bells, a whole tone apart | G over F# (the b6 against the 5) | **Never a buzz.** Damped in 200 ms, no re-strike |
| Menu open / close | Harp harmonics, glissando | B D F# G up / down | 120 ms, breath layer underneath |
| Cure / heal | Choir "oo" + shimmer | G blooming to B | 300 ms rise, 1.5 s bloom into the hall |
| Elemental magic | Choir + bowed glass + air | B D F# in the magic octave | Body 400 ms, tail 2 s |
| Overdrive / limit break | Orchestral stab + sub | Bm triad over `B1` | 12 ms attack, 2.5 s tail; the one place loud is allowed |
| Physical hit | Steel with a ring, plus cloth movement | ring on F#6 | Transient + 1.2 s ring, cloth 40 ms before it |
| Heavy impact | Sub + air + a low tam-tam wash | `B0`/`B1` | 60-80 Hz weight, 8 ms attack, 2 s decay |
| Footstep, cloth, equip | Pure foley, unpitched | — | Nothing above 9 kHz |

### The hard rules

1. **Nothing is harsh, buzzy or 8-bit.** No unfiltered square or saw, no pulse
   waves, no bit-crush, and no "error buzz" anywhere in the game. A denial is
   two soft bells a whole tone apart, not a raspberry.
2. **Soft attacks on UI.** Minimum **6 ms** attack on every menu sound, 12 ms on
   anything a player hears more than once a minute. Instant attacks are what
   make an interface feel cheap.
3. **Weight and air on impacts.** Every impact has a sub component below 90 Hz
   **and** a movement layer (cloth, air, a bow scrape) that starts 30-50 ms
   before the transient. A hit with no anticipation is a click.
4. **Tails bloom into the hall.** Every effect sends into the same
   `ConvolverNode` as the music (`src/audio/dsp/hall.ts`) — UI at 0.12, magic at
   0.35, impacts at 0.25. A sword and the strings behind it decay into one room.
5. **Roll off the top.** Nothing but cymbals and breath has meaningful energy
   above 10 kHz. The spectral tilt gate in `PIPELINE.md` exists for the music;
   apply the same instinct by ear-free rule here.
6. **Nothing shorter than 30 ms.** A 12 ms tick is an artefact, not a sound.
7. **Duck, do not fight.** Music drops **3.5 dB** under dialogue, 120 ms attack,
   400 ms release. A master limiter sits after everything.
8. **Loudness.** SFX peak 6 dB below the music's ceiling. If an effect has to be
   loud to be noticed, it is in the wrong frequency range, not too quiet.

---

## For Bailey — what to listen for

One page, no jargon.

**There are six tunes in the whole game, and they are all related.**

1. **The prayer.** A crowd singing with no instruments. Sixteen slow bars, and
   it never uses the chord that would make it sound like a *song* — so it sounds
   like something people have done for a thousand years instead. You hear it in
   the pause screen (just one voice and a drone), in the Zanarkand dome (warm,
   with strings, the only time it is ever kind), and in the Yu Yevon fight, where
   it is stretched to three minutes and the last chord never arrives.

2. **The goodbye.** This is the one. Solo piano, sixteen bars. It starts already
   falling, climbs once with everything it has, reaches a note it cannot hold,
   and comes home a step slower. If you only love one piece of music in this
   game, it should be this one — and if you don't, tell us, because everything
   else is arranged around it. You have already heard four notes of it: it is the
   title theme, finished at last.

   It turns into a **waltz** in the menus, a **nocturne** in the dome, a **lament
   over heavy guitars** in the fight against the father, and at the very end the
   full orchestra plays it with three chords changed — nothing else — and it
   stops being sad.

3. **Seymour.** Six notes on a church organ, low and quiet. A polite little bow
   upward and then a slither downward. He never gets loud; the band around him
   does. In his last form the tune walks off the edge of its own scale.

4. **The father.** A rock riff, entirely off the beat, proud of itself. Its
   secret is that it is the prayer with every note shoved sideways — and in the
   mountain scene a single horn plays it *straight*, and it turns back into the
   prayer. In the Final Aeon fight the riff and the goodbye play **at the same
   time**, on purpose, over each other. It is supposed to sound like an argument.

5. **The pop hook.** FFX-2. Bright, jazzy, and its whole identity is one jump
   upward. Flatten the two notes of that jump and you get Shuyin's tragedy;
   mechanise it and you get Vegnagun. Same jump, three worlds. There is one bar
   in the middle of the happy version that is pure joy — a chord that doesn't
   belong, dropped in and taken straight back out. In Shuyin's version that bar
   is just... ordinary. That's the whole story of the character in one bar.

6. **The battle music and the victory fanfare.** Both original. The fanfare
   deliberately does the opposite of the famous one: it starts on a *long* note
   instead of three short ones, it falls instead of rising, and it ends on a
   gentle "amen" chord rather than a triumphant one — so winning feels like
   relief rather than a trophy.

**Three things to check if something feels wrong:**

- **Does it breathe?** There should be rests you notice — a beat where everything
  stops. If a cue never stops, it will feel like a synthesiser.
- **Are the sad notes loud?** In this music the note that *aches* is meant to be
  louder than the note it falls to. If the aching note is the quiet one, we got
  it backwards and it will sound mechanical.
- **Does it sound like one room?** Sword hits, menu clicks and the orchestra all
  go through the same concert hall. If an effect sounds pasted on top, that is a
  bug, not a taste question.

**Nothing in this score quotes anything.** Every tune here was written for this
game. What we copied is the *language* — the instruments, the modes, the waltz
meters, the way phrases breathe — never the melodies.

---

## Sign-off checklist for an arranger

Before you commit a cue:

- [ ] Every theme it uses is imported from `themes.ts` — nothing retyped.
- [ ] The cue map's "one emotion" is something you could defend out loud.
- [ ] The phrase has rests in it, and you did not fill them.
- [ ] Appoggiaturas are louder than their resolutions.
- [ ] No channel is at constant velocity, unless this document names it.
- [ ] `timingJitterMs` is set per the table.
- [ ] The resemblance guard for each theme used has been re-read, this time.
- [ ] `npx tsc --noEmit` clean, targeted vitest green.
