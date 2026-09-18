# Requests from the FFX-2 arranger

What the seven FFX-2 cues (`boss-ffx2-aeon`, `boss-vegnagun`, `boss-shuyin`,
`victory-ffx2`, `ending-ffx2`, `scene-bevelle-underground`, `scene-farplane`)
could not do, in the order the score would benefit. Nobody outside this group
had a file edited to get any of it; this is the list instead.

---

## 1. The sampled presets a score cannot actually name — the one real blocker

`src/audio/voices/presets/` defines **68** instruments. `INSTRUMENTS` in
`src/audio/instruments.ts` defines **35** playable ones (plus five `sfx-*`).
Thirty-three sampled presets therefore exist but **cannot be used by any cue**:

```
bass-drum  bass-pick  bass-upright  bassoon  cello-solo  chimes  choir-ooh
clarinet  cymbal-swell  drum-kit  glockenspiel  guitar-clean  guitar-lead
guitar-nylon  guitar-steel  harpsichord  horn  oboe  orchestra-hit
organ-drawbar  organ-rock  pad-synth  pizzicato  soprano  space-voice
strings-trem  synth-brass  tam-tam  triangle  trombone  trumpet  vibraphone
violin-solo
```

Naming one in a channel fails two ways at once: `tests/unit/audio-registry.test.ts`
asserts `INSTRUMENTS[channel.instrument]` is a function for every composed
track, and the browser's fallback path throws `Unknown instrument` for a cue
that has not been pre-rendered — which is the safety net the whole pipeline is
built on.

So these cues were arranged from the 35 that exist on both sides. What that
cost, concretely:

| Wanted | Used instead | Where it hurts |
|---|---|---|
| `soprano` | `choir` high and quiet | `scene-farplane` — "distant soprano" is a section singing softly, not one voice |
| `drum-kit` | `kick` + `snare` + `hat` + `tom` on four channels | `boss-ffx2-aeon`, `victory-ffx2` — a real kit would share one room and one player |
| `trumpet` / `trombone` / `horn` separately | `brass` and `brass-stab` (fixed section stacks) | every FFX-2 cue; the aeon's tune and its punches are the same two patches |
| `vibraphone` | `mallet` (marimba) | `victory-ffx2` — vibes are the jazz-results sound |
| `bass-pick` / `bass-upright` | `bass` (fingered) | `boss-ffx2-aeon` wants a pick; `victory-ffx2` wants an upright |
| `cello-solo` / `violin-solo` | `strings` / `strings-low` sections | `boss-shuyin` — one player would carry the grief better than a desk |
| `pizzicato` | none | no pizz anywhere in the FFX-2 material |

**The smallest fix** is an alias map in `instruments.ts`: point each unplayable
name at the nearest existing runtime voice (`soprano` → `choir`, `trumpet` →
`brass-stab`, `drum-kit` → `snare`, and so on). The offline renderer already
resolves by preset name, so the sampled render would immediately get the real
instrument while the browser fallback gets a reasonable stand-in. That is one
table and no new DSP.

## 2. Tempo map (`Track.tempo?: Array<[beat, bpm]>`)

Seconded from THEMES.md §Renderer requests. `boss-shuyin` writes its half-time
B section by doubling every note value, which works, and its rubato with
`agogic()`, which bends note lengths but cannot bend the pulse — so the
accompaniment stays on the grid under a melody that is trying to breathe. The
coda's ritardando is four notes getting longer while the left hand keeps
perfect time.

## 3. Per-channel `timingJitterMs` override

THEMES.md asks for `<= 3 ms` on Vegnagun. Jitter is a property of the *preset*,
so the only way to get machine timing today is to pick instruments that happen
to have none (`synth-bass`, `arp-pluck`, `kick-808`, `metal-hit`, `organ`).
That is what `boss-vegnagun` does, and it turned out to be a happy accident —
the machine layers are exact and the orchestral ones are not, which is the
reading — but it should be a choice, not a side effect of the instrument list.

A channel-level `humanise?: number` multiplier (0 = quantised, 1 = the preset's
own figure) would also let one cue pull a rock kit tighter without changing
every other cue that uses the same kit.

## 4. Per-note expression envelope

Also seconded from THEMES.md. Every long string and choir note in these seven
cues is dead straight inside itself. `ending-ffx2`'s last chorus and
`scene-farplane`'s whole bed are built out of held notes, and the tied-attack
workaround is audible on the choir's hard-ish attack, so neither uses it.

## 5. `chordMidis`'s `center` clusters extended chords

Not a request so much as a warning for the other arrangers. `center` pulls
every chord tone within a sixth of one note, which on a `maj7` puts the 7th a
semitone under the root and on an `m9` puts the 9th a semitone under the b3.
In a string pad that is a cluster, and it was the single biggest source of
avoidable dissonance in the first pass of these cues (59 sustained semitone
collisions in `boss-ffx2-aeon` alone).

`stackTones()` in `src/audio/tracks/ffx2-common.ts` is the fix used here: keep
the chord's own spacing, place the voicing by its TOP note relative to the
melody, and cap a bed at three tones. It is FFX-2-local so that no other
group's cues change under them, but it is eleven lines and belongs in
`harmony.ts` if the other arrangers want it.
