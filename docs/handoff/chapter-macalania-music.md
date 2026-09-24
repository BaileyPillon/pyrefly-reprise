# Chapter VII (Macalania) battle music: handoff

**Game case: FFX only** (AGENTS.md rule 14). The cue belongs to
`seymour-anima-macalania`, an FFX encounter; no FFX-2 chapter names it. The four
runtime instrument stand-ins (below) are shared plumbing, so **both**.

## What Bailey picked

2026-09-24, answering the driver's recommendations ("All your recommendations"):
the Macalania battle music is mood **A, "The Courtesy"**
(`docs/audio/sketches/2026-09-21/macalania-a-court-dance.mp3`, score
`tools/audio/scores/2026-09-21/macalania-a-court-dance.mjs`). The driver told
Bailey it could not hear the sketches. Neither could this pass: every check
below is a measurement or a reading of the score, not a listening verdict
(hard rule 13).

## What was built

- `src/audio/tracks/boss-seymour-macalania.ts`: "The Courtesy", C# minor,
  126 bpm, 64 bars (2:02 plus tail), loop 16 → 256 beats (0:07.6 → 2:01.9).
  The sketch's material kept: harpsichord pavane, pizzicato on 2 and 4, `SEYMOUR`
  on oboe an octave above `boss-seymour`, the curdle, the held #4 at the end.
  What was added to reach the brief (research §9.8, preflight §6.3): an A′ for
  violins with `SEYMOUR_MIRROR` in the cellos; a B where the harpsichord bows
  and the oboe finishes the sentence; a longer written slither (violins, then
  the clarinet) that never lands on the tonic; **one rise** (the summon: the
  minor-third sequence takes a fourth step to A#, low brass, a struck bell,
  timpani roll, then a plagal amen iv → bVI); composure in the quartet.
  Anti-brief held by construction and by test: no organ, choir, synth or kit,
  and the dance rests on the last half-bar of every four-bar phrase and is
  silent through the curdle and the rise (no ostinato). The bell, the low
  brass and the plagal amen come from the research brief ("a struck metal or
  bell layer that reads as temple", "insincere liturgical cadences"), not from
  the sketch: they are this pass's reading, flagged for Bailey's ear.
- Registered: `MUSIC_KEYS` (21), `COMPOSED`, `TRACK_NOTES`; cue map row 24 in
  `docs/audio/THEMES.md`; `tools/audio/themes-audit.mjs`; `docs/AUDIO-GUIDE.md`;
  `docs/CONTRACT-CHANGES.md` (2026-09-24).
- `src/audio/instruments.ts`: runtime stand-ins `harpsichord` → pluck, `oboe`
  → flute, `clarinet` → flute, `string-quartet` → strings, so the browser's
  synthesised fallback can play the cue instead of throwing. Each is the voice
  `sfx/design.ts` `RUNTIME_STAND_INS` already used for that name, so no sound
  effect's fallback changes. Offline renders still use the sampled presets.
- Wired: `src/data/chapter-seymour-anima-macalania.ts` `music.battle`,
  `src/data/ffx/enemies/seymour-anima-macalania.ts` `musicCues` start,
  `src/data/chapter-meta-seymour-anima-macalania.ts` `musicKeys`.
- Rendered: `public/audio/music/boss-seymour-macalania.mp3` + manifest entry
  (`node tools/audio/render.mjs --only=boss-seymour-macalania`, CPU only).
- Audition: new section at the top of `docs/audio/audition.html`, with the
  sketch beside the full cue for comparison, and a score-collect button.
- Tests: `tests/unit/audio-seymour-macalania.test.ts` (new); key count in
  `audio-registry.test.ts`; `chapter-meta-seymour-anima-macalania.test.ts`.

## QA (docs/audio/PIPELINE.md gates)

| check | result |
|---|---|
| render | 2:04.9, 1.90 MB, −16.0 LUFS, −1.79 dBTP, ok |
| `tools/audio/qa.mjs` (decoded from disk) | −15.99 LUFS, −1.85 dBTP, 0 clipped, seam ok, flux 0.5x, tilt −7.1, 0 findings |
| `ffmpeg ebur128=peak=true` | I −15.8 LUFS, true peak −1.8 dBFS, LRA 5.9 LU |
| `tools/audio/seam-probe.mjs` | "rounding": a clean loop join (min step at offset 0) |
| section loudness | A −14.7, curdle −18.3, **rise −12.8 (the peak)**, composure −17.6 LUFS |
| `tools/audio/themes-audit.mjs` | SEYMOUR on the oboe at beat 16, SEYMOUR_MIRROR in the cellos at beat 48; key C# minor; 0 departures |

## Owed, not done here

1. **The story script still plays the Flux theme under the reveal.**
   `src/story/scripts/seymour-anima-macalania.ts` line ~189 is
   `music('boss-seymour', 1000)` right before `battleStart()`; the battle
   screen's start cue then cross-fades to `boss-seymour-macalania`. So the Flux
   chapter's theme is heard for the last lines of the reveal. `src/story/**`
   belongs to another agent this session: the fix is that one call →
   `music('boss-seymour-macalania', 1000)`, plus the expectation in
   `tests/unit/chapters/macalania-story.test.ts` ("routes Chapter 1's cues…").
2. **The scene cue** `scene-macalania-temple` still does not exist; the scene
   plays Chapter 1's `scene-gagazet` as a recorded stopgap. It needs its own
   options round (rule 9) before anyone composes it.
3. **The rise is inside the loop, not tied to the summon.** The brief says the
   music rises once at the summon; the cue rises once per loop pass (1:16).
   Firing it on Anima's arrival would need a second cue and a new hook: the
   app reads only a formation's `start` music cue today
   (`BattleEncounterChain.cueForGroup`), and no trigger fires on a hidden part
   appearing. Not built: new behaviour, needs Bailey's yes (rule 10).
4. **Bailey's ear.** The cue is a CANDIDATE until he scores it on the
   audition page.
