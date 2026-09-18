# Requests from the FFX-bosses arranger

Things the four FFX boss cues — `boss-seymour`, `boss-yunalesca`, `boss-jecht`,
`boss-yu-yevon` — wanted and could not have, plus two notes where the bible and
the data disagree. Nothing here blocks the cues; they all render, measure and
loop. This is the list of places where the result is a workaround rather than
the thing itself.

Ordered by how much each would improve what Bailey actually hears.

---

## 1. `instruments.ts` and the preset registry have drifted apart — and the gap is a runtime crash

**This is the one to fix first, and it affects every arranger, not just this group.**

The handoff to this group listed the instruments available to a score as sixty
names, taken from `src/audio/voices/presets/`. `src/audio/instruments.ts` — the
**synthesised** registry, which is what the browser falls back to — has forty.
A score channel naming one of the twenty sampled-only names:

- renders perfectly offline, passes every gate, and ships a correct MP3;
- and throws `Unknown instrument "organ-rock"` out of `renderTrack` the moment
  the runtime takes the fallback path.

That path is not an edge case. It is the reason the pipeline is safe:
PIPELINE.md says *"No manifest, a failed fetch, a codec the browser rejects, or
a cue nobody has rendered yet all fall back to the original oscillator render.
Audio never goes silent because of this pipeline."* With a sampled-only
instrument in the score, it does not go silent — it throws.

These four cues named **seven** of them before `tests/unit/audio-registry.test.ts`
caught it: `organ-rock`, `bass-pick`, `strings-trem`, `choir-ooh`, `cello-solo`,
`guitar-lead`, `guitar-clean`. Every one came straight off the handoff list.

**What shipped:** all four cues re-instrumented to the forty safe names, with a
comment at each substitution saying what it was written for. The costs, honestly:

| written for | now plays | what was lost |
|---|---|---|
| `organ-rock` (Seymour's band) | channel deleted; comping went to marcato strings | the drawbar-versus-church-organ contrast. The cue is arguably better — there is now exactly one organ in the room and it is his — but it was not a free choice |
| `cello-solo` (Yunalesca's one human voice) | `strings-low` | a soloist became a section. This is the most expensive one: the whole reading of that cue is one person singing against a machine |
| `choir-ooh` (Yu Yevon's tenor and bass) | `choir` | the darker closed vowel under the upper voices; SATB separation now comes only from register and pan |
| `guitar-lead`, `guitar-clean` (Jecht) | `guitar-dist` | one amp doing three jobs; the bridge's "clean-ish guitar an octave below" is a rolled-back overdrive |
| `bass-pick`, `strings-trem` | `bass`, `strings` | little — these two are close substitutes |

**The ask, in preference order:**

1. Add synthesised voices for those names in `instruments.ts` so the two
   registries agree. Most are small variations on voices that already exist
   (`bass-pick` is `bass` with a harder attack; `choir-ooh` is `choir` with a
   darker filter; `guitar-lead` is `guitar-dist` with less gain).
2. Failing that, make the mismatch impossible to ship: have `--list` mark which
   presets have no synthesised voice, and correct the arranger handoff so it
   lists the intersection rather than the preset registry.

`tests/unit/audio-ffx-bosses.test.ts` now asserts the intersection for these
four cues. It would be worth promoting that assertion to all twenty-one.

## 2. A `choir-rite` preset with `timingJitterMs <= 3`

**Wanted by:** `boss-yunalesca`.

THEMES.md says the Yunalesca canon is the one place in the score where machine
timing is the point — velocity locked at 0.62, jitter `<= 3 ms`, "the voices
never line up into a chord; they line up into a machine". The velocity half of
that is per-note and is done. The timing half is a preset field, and the only
choir presets we have are `choir` and `choir-ooh` at **34 ms** of jitter, which
is right for a congregation and wrong for a machine.

**The workaround shipped:** every canon entry is doubled at the unison by
`pluck` (violin pizzicato, 8 ms), which has a hard exact onset. The pizz says
where the note is and the choir blooms behind it. It works — it may even be a
better orchestration than the bare voices — but it is a different effect from
four voices arriving with inhuman precision, and it costs a channel.

**The ask:** one entry in a preset group —

```ts
'choir-rite': {
  name: 'choir-rite',
  about: 'Mixed choir with the section spread taken out — the rite, not the congregation.',
  seat: 'choir',
  layers: [{ lib: 'sonatina', name: 'Mixed Choir' }],
  attackSec: 0.09,
  releaseSec: 1.2,
  timingJitterMs: 2,
  velocityTilt: false,
  gain: 0.85,
},
```

I did not add it myself because a new preset group has to be registered in
`src/audio/voices/presets/index.ts`, which is a core file and which other
arrangers may be editing in this same tree. If you would rather I owned it,
say so and I will add `ffx-bosses.ts` and the two lines.

## 3. A preset group for the FFX bosses, if new instruments are wanted at all

Three more presets would earn their place, and all three are one library patch:

| name | layers | wanted by | instead we used |
|---|---|---|---|
| `music-box` | `fluidr3` **Music Box** (program 10) | `boss-yu-yevon` — "a music-box fragility" | `celesta`, which is close but has no mechanism in it |
| `contrabass` | `sonatina` **Basses Sustain** alone | `boss-seymour` — the bible says "pedal organ and contrabasses" | `strings-low`, which is cellos *and* basses, so the doubling is thicker and higher than intended |
| `organ-hollow` | `fluidr3` **Church Organ** at -12, 0 and +19 | `boss-seymour` — the 16' + 8' + 2 2/3' registration | three `organ` channels with `transpose` -12 / 0 / +19, which is the same sound but spends three channels and three copies of the note data on it |

The organ one is the interesting case: writing a drawbar registration as three
transposed channels turns out to be *legible* — an arranger can see the
registration in the score and a unit test can assert that the 4' is absent,
which is a real rule of the character. I would keep it that way even if the
preset existed. The other two are straightforwardly worse as workarounds.

## 4. Tempo map — seconded, and for a specific reason

Renderer request #1 in THEMES.md. Seconding it from this group because
`boss-yu-yevon` is the cue that needs it most in the whole score: at 40 bpm with
double augmentation, one hymn note lasts up to nine seconds, and the entire cue
is a single sixteen-bar phrase. Written rubato inside a fixed grid can move a
note but cannot let the last four bars *slow down*, and a prayer that ends at
exactly the tempo it started is a prayer nobody is singing.

`boss-yunalesca`'s solo cello is the same problem from the other side: it is the
one line in that cue allowed to breathe, and `agogic()` gets it most of the way,
but it is breathing against a grid that does not move.

## 5. Per-note expression envelope — seconded, strongly

Renderer request #2. Same cue, same reason. `swell()` in `boss-yu-yevon.ts`
fakes a hairpin inside a held note by splitting it into two or three tied
attacks at rising velocities, which THEMES.md sanctions for strings and choir.
It is audibly a re-articulation, not a crescendo. On a nine-second choir note
it is the difference between a choir and a sampler, and it is the single
biggest remaining quality gap in that cue.

---

## Two notes where the bible and `themes.ts` disagree

Neither is a bug in the data. Both are places where I followed the notes rather
than the prose, and someone should decide which is canonical.

### `FATHER_STAMP` cannot be used as roots for `motif()`

THEMES.md §FATHER says: *"Stamp the cell over `FATHER_STAMP` with `motif()` and
the same notes recolour on every chord — the blue b5 becomes a #11 over the bVI
and a third over the bVII."*

`motif(pattern, barStarts, roots)` adds the root to every offset, so stamping
FATHER over roots `Dm Dm Bb C ...` **transposes the riff**, and the riff in Bb
minor is `Bb Ab Bb Db` — outside D Aeolian, and outside the key of the cue.
Read as roots it does not work.

Read as *chords under a fixed riff* it works perfectly and is what the cue
does: `FATHER_STAMP` at one chord per bar is exactly `FATHER_CHORDS` at one per
half-bar, so bars 3-4 are `Bb - C - D`, the fingerprint, in the right metric
position. `boss-jecht` plays FATHER at written pitch throughout and moves the
accompaniment. Suggest the doc line changes "stamp with `motif()`" to "harmonise
with", or `FATHER_STAMP` gets a comment saying it is chord symbols and not
roots.

### `boss-yu-yevon` runs 3:30, not 70-150 s

The group brief asks for 70-150 s per cue. The cue map asks for HYMN whole at
`augment(…, 2)` at 40 bpm, which is 128 beats = 192 s of hymn before the intro
and the organum tail. Those cannot both be true, and I followed the cue map,
because "one ~3-minute statement, then organum" and "No end" are the cue's whole
reason to exist and a trimmed version of it is a different piece.

Shipped: **210 s**, 2.4 MB. The other three are 97-107 s. Total shipped audio is
still well inside the 60 MB budget. Flagging it rather than deciding it.

---

## One thing that was wrong in the data, now fixed in my cue

Not a request — a note, in case the same chord appears elsewhere.

`boss-yunalesca` harmonises HYMN in **F Phrygian**, and an early draft used a
plain `Eb` major triad for the bVII. `Eb - G - Bb` contains a natural G, which
is the 2nd degree the entire Phrygian transformation exists to flatten: one
major third quietly turned the cue back into F Aeolian with a decoration. It is
`Ebm` now. The unit test in `tests/unit/audio-ffx-bosses.test.ts` asserts that
no channel in that cue sounds a natural 2 or a leading tone, which is how it was
caught — worth copying for any other modal cue.
