# SFX parity: the third source, the P1 mix, one menu tick, and the pilot (2026-10-10)

Branch `r40-sfx` (from `origin/rel-3944` 72973096), worktree `D:/pyrefly-r40-sfx`. Not merged, not deployed. Bailey,
2026-10-10: "make the sound effects a 1:1 parity of the ffx/ffx-2 remaster on steam that i have installed", then
"Whatever you recommend for sound effects and music I'll go with those recommendations" and, about 23:05, "i'll go
with all your recommendations even as to music and sound effects. you recommend an dchoose it please. this is
extremely important." The accepted rules are 47k to 47n and 52a, 52d, 52i to 52m. The spec, the plan and the
evidence are in `D:/Tools/pyrefly-scratch/2026-10-10/sfx-parity/` (`spec.md`, `gen-plan.json`); the pilot is in
`D:/Tools/pyrefly-scratch/2026-10-10/sfx-pilot/`.

**Hard limits kept.** Parity is measured facts (which event sounds, when, how long, how loud against its neighbours,
how bright), never retail audio: nothing retail was copied, decoded to disk, resynthesised from or sent to the
generator. Every request body is `{text, duration_seconds, prompt_influence, model_id}` and every prompt passes
`tools/audio/sfx-parity-lint.mjs`. Agents cannot hear (rule 13): every pick is by measurement and stays open to
Bailey's ear.

## What landed

**Game case: both** (shared plumbing; each trim, pack and cue names its game). Nothing here touches `SaveData`, the
buses or the limiter; nothing ships a retail-derived byte; the audio total is unchanged (7.60 MB of sprites).

1. **The third source (52m).** `manifest.sfxParity.packs` (`src/audio/manifest.ts`, additive and tolerant; the shipped
   manifest declares `{ "packs": {} }`), `src/audio/sfxV2/packs.ts` (which packs a chapter loads: boss packs first,
   the game's `<game>-core` last, never another game's), `SfxSprites.loadPacks` / `setActivePacks` / `pick`
   (parity pack, then v2 slice, then first-bank stand-in; the pack is looked up only in an FFX or FFX-2 chapter and
   only for a cue of that game), `AudioManager.loadParityPacks` / `releaseParityPacks` called by `sfxChapter`
   (`src/app/sfxGame.ts`) for the length of a chapter run, never awaited, never at unlock. A pack that has not
   decoded, failed to load, or does not hold the cue leaves the v2 slice playing, and then the first-bank cue, so
   nothing is ever silent. `audioDebug().sfxLog` says `via: 'parity'` for a pack cue and carries `trimDb` for a v2 cue
   the mix trimmed; `audioDebug().prerendered.parity` lists the packs, the active ones and the decoded ones.
2. **The P1 mix (52i) as data.** `docs/audio/sfx-parity-mix.json` has one row per event that plays a v2 cue (162
   rows: id, game, cues, the retail-ratio level, whether the D-210 floor applies, the spec's evidence grade, plays per
   fight), `src/audio/sfxV2/parityDerive.ts` turns them into a trim in dB per (game, cue) with the cap (-14 LUFS), the
   floors (weapon -18.0, impact -14.1 since 52n; they were -24.0 and -20.1, D-210's level, as P1 was first accepted) and the true-peak guard (-1.1 dBTP after a boost), and
   `tools/audio/sfx-parity-mix.mjs` writes `src/audio/sfxV2/parityTrims.ts` (30 FFX and 17 FFX-2 trims, 23 before 52n;
   `--check` fails when it is stale, and a unit test runs it). `playSfx` multiplies a v2 slice's gain by the trim; a
   parity original is mastered to its own row and is never trimmed. The sprite is not re-encoded.
3. **HOLD rows keep today's sound (52j).** A row with no retail sound (28 rows: the miss whiff, the status bell, the
   critical flash, the guard and counter ticks, the generic hit, the Overdrive-full gauge, the phase shift...) moves
   nothing. So do cues no row names and every first-bank cue.
4. **One tick for cursor and confirm, about +5 dB (52k).** `confirm` voices to the cursor's tick in a chapter
   (`v2:cursor-move` in FFX, `v2:cursor-move-x2` in FFX-2) and the mix raises that tick 5.3 dB to -18.8 LUFS. The
   title, chapter select and FF7 keep the first bank's own confirm.
5. **Gates and tools.** `tools/audio/qa.mjs` audits every pack like the sprites (5 MB, -1 dBTP, no clipped samples,
   each cue held within 3.5 dB of its recorded row level; `--only=sfx` runs the sprite audits alone) and counts the
   packs in the budget; `tools/audio/sfx-parity-sprite.py` packs picked takes into a pack and merges it into the
   manifest (LAME V0, true-peak trim loop; tested end to end on the pilot take and removed again);
   `tools/audio/sfx-parity-measure.mjs` is the project's meter for it; `docs/audio/sfx-parity-record.json` is the
   provenance (empty `cues`, one `rejected` take).
6. **Tests.** `tests/unit/audio-sfx-parity.test.ts` (25) and `tests/unit/audio-sfx-parity-mix.test.ts` (14), plus the
   budget line in `audio-shipped-files.test.ts`.

## Choices the spec left open, and where to flip them

* **DECIDED (52n, driver, 2026-10-11, under 52a): the floors are -18 and -14.1, so the girls' hits keep today's level.** The paragraph below is the
  choice as it stood when P1 was first accepted; the switch it describes has been made, `parityTrims.ts` regenerated (the six -6 dB cuts are gone:
  `shot-gun`, `swing-dagger`, `hit-gun`, `hit-dagger`, `hit-greatsword`, `ko-fall`; `swing-greatsword` went from -0.3 to +0.1) and a test pins that no
  FFX-2 party hit takes a cut. `applyLow` stays false. FFX-2 only for the hit floor; both games for the held rows.
* **The P1 floor puts the girls' hits 6 dB under today (FFX-2).** (As first accepted; see the entry above.) P1 is "retail ratios with the D-210 floor", and
  the floor is D-210's level, which is today minus 6.02 dB: `shot-gun`, `swing-dagger`, `hit-gun`, `hit-dagger`,
  `hit-greatsword` and `ko-fall` all take about -6 dB, and `hit-heavy-enemy` -3.8 (FFX-2 enemy blows at the retail ratio).
  The 2026-09-29 friend's "no sound effects on attacks" was heard at D-210 with the old bus; D-293 raised the bus 6
  dB. So with P1 as accepted these FFX-2 cues are back at the level that complaint was about, relative to the music.
  **To keep today's level instead:** set `floors` in the header of `docs/audio/sfx-parity-mix.json` to `{"weapon": -18,
  "impact": -14.1}` and run `node tools/audio/sfx-parity-mix.mjs` (a test pins that this removes the cut).
* **Rows the spec grades `low` are held at today's level** (56 of 162: the FFX weapon swing/hit split, the cast
  wind-up, the KO fall and the fiend dissolve, the FFX-2 Special rows, the Bio and Holy single layers...). They are
  candidates offered for Bailey's ear, and the cast wind-up is an open decision (retail has it for three characters
  only). Applying them would take `magic-charge` down 18 dB. Set `"applyLow": true` and rerun to apply them.
* **A boss's signature row never moves a cue a generic row also names** (Flux's cleave must not make Auron's swing
  louder). Boss rows count only when every row naming the cue is one of them.
* **A cue several rows name takes the play-weighted mean of their applied targets** until each row has its own
  original (weight = plays per fight, at least 1).
* **First-bank cues are not trimmed** (52 of the plan's 214 rows play a first-bank cue or have no cue today: Regen,
  Dispel, Esuna, the dark magics, Meteor, the encounter shatter...). They take their level when their original lands.
* **FFX weapon orientation (52l)** is a pack-content decision (the short transient is the hit, the longer whoosh the
  swing); the FFX weapon rows are `low`, so nothing in the mix moves them.

## The pilot (Part 1): 6 credits, 1 take, rejected by measurement

Plan: 7 takes, 80 credits. The API key's own quota (45,000) had **6 credits left**, not 95 (the batch-2 log shows 95 at
02:50 UTC and `vx-a` billed 89 more after it). The first call succeeded (6 credits, as planned); the second was refused
(`quota_exceeded`, 0 remaining) and the run stopped, as instructed. The account itself has 84,068 credits left of
131,000: the limit that binds is the key's.

`ffx2.lb.warrior.swing` take v1 (Paine's heavy sword swing; replaces `v2:swing-greatsword`): length 365 ms (spec 340),
attack 70 ms (75), level -24.0 LUFS and -8.1 dBTP on target, but the spectral centroid is **74 Hz against 600 Hz** and 98
percent of the energy sits under 250 Hz (spec 53 percent): a pure sub-bass thump with no whoosh, further from the row
than the synth cue it would replace (378 Hz). **Not installed**; the pack list stays empty. The prompt's "heavy",
"low thud" and "deep whump" drove it to sub-bass; the next try names the midrange first and uses the "sharper and
drier" variation (`sfx-pilot/README.md`).

## What is left for the full generation once the key limit is raised

* Raise the key's limit (Bailey's account): about 8,400 credits for the plan at 11 per second (277 takes, 761 s),
  about 12,600 with a 50 percent re-roll allowance. Minus the 6 spent.
* The other six pilot takes (74 credits) and a re-roll of the warrior swing; then wave 1 (the Leblanc chapter, 33 takes),
  wave 2 (shared events, 184 takes), wave 3 (bosses). Prompts for the low-heavy weapon rows need the midrange named
  first; budget one re-roll per weapon row.
* For each pick: `process.py` (trim, fades, levelling; `sfx-pilot/tools/`) then `tools/audio/sfx-parity-sprite.py
  --pack <name> --picks <picks.json> --work <dir> --install`, then `tools/audio/qa.mjs --only=sfx`, then add the
  row to `docs/audio/sfx-parity-record.json` (the test fails until record and manifest agree).
* Per-actor cue names (`swing-ormi`, `hit-fgoon`...) and their `battleVoice.ts` hooks, so a recorded original replaces
  one event instead of every user of a shared cue; the phase-2 timing (`onsetMs`/`peakMs`), the encounter shatter and
  fade-in hook, the results loop and stingers.
* The order the accepted rule gives: the core packs, then a repack of v2 (`sfx-v2-sprite.py --exclude`), then the boss
  packs, inside the 100 MB budget.
* **Owed before the release carrying this:** `tools/audio/sfx-v2-levels.py` and `sfx-probe.mjs` on a Chapter I and a
  Chapter VI fight at slider 100 percent (limiter gain reduction under 3 dB; none at the default slider), a headless
  proof that `sfxLog` shows `v2` with `trimDb`, `node tools/critic-plan.mjs --paths src/audio/AudioManager.ts,...`
  (audio routing: focused before, deep after), a CHANGELOG entry tagged both (FFX-2 for the cuts), and the ledger rows
  (D-nnn / A-nnn) for the choices above. The credits panel gets its "Sound effects from ElevenLabs" line the day a pack
  ships (the licence reading is the music's; confirm the plan and terms that day).
