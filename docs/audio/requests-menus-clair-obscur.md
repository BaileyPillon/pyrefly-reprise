# Requests from the menus arranger

Group `menus-clair-obscur` — cues `title`, `chapter-select`, `pause`.

Things the arranger cannot do from inside their own files, in the order they
would improve the score. Nothing here is blocking a render; everything here is
the difference between a good mock-up and a performance.

---

## 1. A sampled-only instrument name is not safe to put in a score (score-wide)

**What happens today.** `docs/audio/PIPELINE.md` tells an arranger that a new
preset "is immediately available as a channel's `instrument`". It is not — not
safely. The synthesised registry in `src/audio/instruments.ts` has 40 voices;
`voices/presets/` has 73. A channel naming one of the 33 sampled-only voices
renders beautifully offline and then:

- fails `tests/unit/audio-registry.test.ts` ("composed tracks loop on barlines
  with valid notes and instruments", which asserts `INSTRUMENTS[instrument]` is
  a function), and
- **throws at runtime** in the synthesised fallback, because
  `getInstrument()` throws on an unknown name. `MusicLoader` falls back to that
  path whenever a cue's MP3 404s, arrives corrupt, or hits a decoder the browser
  dislikes — exactly the cases the fallback exists for. The cue would go silent
  instead of synthesising, which is the one outcome `PIPELINE.md` promises
  cannot happen.

**What it costs me.** `soprano`, `violin-solo`, `cello-solo`, `choir-ooh`,
`harpsichord` and the five presets in `voices/presets/menus-clair-obscur.ts` are
all unusable in a shipped score. My three cues are written on the dual-registered
palette instead (`piano`, `harp`, `flute`, `strings`, `strings-low`, `choir`,
`pad`, `celesta`), so the pause screen's "solo soprano" is the mixed choir
written high and quiet, and the "string quartet" is the section. It is close,
because in this library they are literally the same samples — but it is not the
same intimacy, and every other arranger is about to hit the same wall (the cue
map asks for `guitar-clean`, `violin-solo`, `cello-solo` and `choir-ooh` by
name).

**The fix, cheapest first.**

1. A fallback map in `instruments.ts`: `SYNTH_ALIASES: Record<string, string>`
   giving each sampled-only name its nearest oscillator voice (`soprano` →
   `choir`, `string-quartet` → `strings`, `flute-alone` → `flute`,
   `piano-felt` → `piano`, `harp-close` → `harp`, `cello-solo` → `strings-low`
   …). `getInstrument()` consults it before throwing; the registry test asserts
   every preset name resolves either directly or through an alias. Ten lines,
   and the safety net covers the whole preset library at once.
2. Or real synthesised stand-ins for the dozen voices the cue map actually
   names. More work, better fallback, same unblocking.

Either way I flip one `VOICE` map at the top of each of my three track files and
re-render. The map is already there with the wanted name in a comment.

---

## 2. The pause cue needs one line in `PauseScreen.ts` to be heard at all

`pause` is registered, rendered and in the manifest, and nothing plays it.
`src/app/screens/PauseScreen.ts` belongs to the UI agent, so the hook is theirs
to make, and it is a real design decision rather than a wiring detail:

Today `PauseScreen.enter()` ducks the fight's music to 0.35 and leaves it
playing, with a comment saying that is what makes the menu feel like a held
breath. The cue map has a different idea of the same held breath — one voice and
a drone, `docs/audio/THEMES.md` row 3 — and the two cannot both happen.

If the owner wants the cue:

```ts
// PauseScreen.enter(), in place of `audio.duck(PAUSE_DUCK, 0.2)`
this.resumeTrack = audio.nowPlaying;             // whatever was playing
void audio.playMusic('pause', { fade: 0.8 }).catch(() => {});
// PauseScreen.exit()
if (this.resumeTrack) void audio.playMusic(this.resumeTrack, { fade: 0.8 }).catch(() => {});
```

**My recommendation: keep the duck in battle, use the cue everywhere else.**
Pausing mid-fight and losing the fight's music costs tension; pausing on the
world map, in a cutscene or on the chapter screen is where "the game holding its
breath" lands. That is a one-argument decision (`usePauseTheme: boolean` on the
screen's options), not a rewrite.

---

## 3. Tempo map (seconding the architect's own request #1)

`docs/audio/THEMES.md` §Renderer requests item 1, from the menus' point of view:
the waltz is the cue that loses most to a fixed grid. `agogic()` can lengthen
the last note of a phrase and steal the time back, but a waltz does not breathe
by holding one note — it breathes by the whole bar arriving late and the next
one catching up. Four passes of the same eight bars would sound like four
different performances with a tempo map and currently sound like four different
orchestrations of one performance.

`Track.tempo?: Array<[beat, bpm]>` with linear interpolation, as specified
there. Nothing in my files would need rewriting: I would add a dozen points per
cue.

---

## 4. Per-note swell, for the distant voice

§Renderer requests item 2. The voice in `title` A′ and `chapter-select` P3 holds
whole notes, and a held choir note that cannot grow inside itself is the one
place in these cues where a listener can hear the sampler. The documented
workaround — split the note into two tied attacks at 0.55 and 0.72 — is audible
on a voice, because a re-articulated vowel is a new syllable. I have left those
notes plain rather than fake them.

---

## 5. A dynamics facility per channel, or a `velocityScale` on `Channel`

Small one. Three of my channels exist twice in a cue at different weights (the
same phrase, softer), which today means calling the builder twice with a scaled
copy of the dynamics table. A `velocityScale?: number` on `Channel` — applied in
`render.ts` next to `volume`, which is a gain and not the same thing, because
velocity also changes timbre — would delete a layer of plumbing from every
arranger's file and make "the reprise is played more gently" one number.
