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

## r41-sfx2 (2026-10-11): the integration built out, inert until a pack ships

Branch `r41-sfx2` (from `origin/r40-rc` bc373d58), worktree `D:/pyrefly-r41-sfx2`. Not merged, not deployed. The driver's
brief (Bailey, 14:05 EDT: "keep going please ill be back at around 8 pm full speed ahead"): build what the list below this
section named as still to build, so a recorded original slots in the moment generation is unblocked. **With
`sfxParity.packs` empty nothing audible changes**, and a test pins it. Game case: the plumbing is both; each hook is one game's
(rule 14), the FFX hooks FFX only and the FFX-2 hooks FFX-2 only.

### 1. Per-actor and per-event cue names (`src/audio/sfxV2/eventCues*.ts`)

A recorded original used to answer by its stand-in's name, so one recording of `swing-katana` would have played for Auron and
for every FFX foe. Now a **hook** (one per spec row that has a moment in the presenter to answer it; 131 FFX, 65 FFX-2) says
"at this moment, for this actor, ability, item, status or tier, look up the original called `swing-ormi`". The voice's
stand-in is never changed: `battleSfxVoice.ts` asks `voiceBattle` for the stand-in exactly as before, then `battleVoice.voiceEvents`
adds the names. The mixer (`PlaySfxOptions.events`, `SfxSprites.pickEvent`) consults the packs **for those names only**, in
order; a v2 battle cue no hook covers lists none (`NO_RECORDING`), so a stand-in that many events share (`hit-1`, `flare`,
`swing-katana`, `boss-roar`) never picks up another event's recording. The menu keys are not battle moments and still look up
their own name. Details worth knowing:

* **Names.** 100 FFX and 53 FFX-2 names. A 1:1 row keeps the stand-in's name (`swing-sword`, `hit-katana`, `cure`, FFX-2's
  `fire-x2`, `cure-x2`); a row with no stand-in of its own gets a new one: tiers (`fire-2`, `fire-3`, `thunder-3`, `cure-2`),
  per-actor swings and blows (`swing-ormi`, `hit-fgoon`, `swing-flux`), per-move originals (`flux-cleave`, `fa-grasp`, `lady-metamorph`,
  `breath-stone`, `aeon-shiva`, `overdrive-tidus`, `appear-flux`, `boss-shiva`). `tests/unit/audio-sfx-parity-events.test.ts` keeps every name
  legal, answering one row, and in its own game.
* **Chains.** `fire-3` falls back to `fire-2`, then `fire`; `reflect` to `shell`; `regen` and the dark statuses to the generic
  buff or debuff; Demi, Ultima and Meteor to `flare`; Phoenix Down to `life`. The closest recorded sound plays, which is what
  they share today.
* **Covers.** An enemy's "attack and blow" is one sample (the Leblanc chapter's five foes, Seymour Flux's plain attack), Cross
  Cleave opens with one, and Total Annihilation, Hellbiter, the breaths, the aeon Overdrives and the final aeon's moves land with one.
  The cues of the same move that the sample covers carry `coveredBy`, and the mixer lets their stand-ins stay silent while the
  covering original is the one playing. The presenter passes `coveredBy` only for originals **this very action asked for**
  (`Action.asked`), so a move that never opened with its sample (an attack painting missing, a pack not decoded) is never
  silenced.
* **Where the moment is not an event.** `BattleMoments.revealBoss` (`appear-*`, `boss-*` roars) and `overdriveStart`
  (`overdrive-<character>`, `special-stinger`) are asked directly (`battleVoice.momentEvents`).
* **Rows with no hook** are listed with a reason in `FFX_UNHOOKED` / `FFX2_UNHOOKED` as `menu` (the key plays by its own
  name), `flow` (a screen plays it, item 2) or `open` (nothing in the presenter answers it yet): the FFX cast wind-up (Bailey's
  decision), Steal's result, the chants, the reels, Esuna and Dispel (a status removal plays no cue), the Leblanc signature
  slots (the spec says do not wire until a move is tied), the Ray and breath of Vegnagun (**no battle engine raises an `sfx`
  event at all**, so the old `laser-*` moments never fire), the Vegnagun "core". The test fails when a row is in none of the places.

### 2. The encounter and results flow slots (`flowSlots.ts`)

`ffx.flow.shatter` and `ffx.flow.fadein` play at `BattleScreen.enter` (cues `encounter-shatter`, `encounter-fadein`);
`ffx2.flow.results` loops while the tally counts and ends when the numbers land, and `ffx2.flow.stingers` sounds one stinger per
counted line, a little apart (`ResultsScreen`, cues `results-loop`, `results-ping`). `AudioManager.playParityOnly` plays a
recorded original **and nothing else** (looped inside its slice, with a fade-out stop); with no pack there is no sound at
all, which is what these moments have always had. The `v2:battle-start` cue still has no caller.

### 3. Phase-2 timing (`beatTiming.ts`, `StrikeBeat.ts`)

A pack cue's `peakMs` (else `onsetMs`) places its PEAK on the beat: the mixer starts it `beatMs - peakMs` after the ask, never
before it. The one beat the presenter knows ahead of its cue is the strike: the swing is asked for at the action's start and the
lunge's impact is `ATTACK_IMPACT` x `LUNGE_MS` = 255 ms later (scaled by speed, `timeScale` and pacing). A swell longer than
the wait starts at once and lands late by the difference (`peakLateMs`). Not done, and why: **pre-firing a swelling blow**
(the retail long hits peak 385 ms after onset) needs the hit asked for at the swing, with a look-ahead into `ctx.burst`; with
no recording and no ears to judge it, it is left for the day a pack ships. The shipped stand-ins are never moved.

### 4. The v2 repack and the pack layout, inside the 105 MB budget

* `tools/audio/sfx-parity-layout.mjs` (+ `sfx-parity-layout-lib.mjs`, `sfx-parity-coverage.mjs`, `docs/audio/sfx-parity-rows.json`):
  plans the 214 rows into packs and qualities against `AUDIO_BUDGET_BYTES`, in the order the rule gives (the v2 repack, boss
  packs at q3 biggest first, shorter long-tail rows, then a bigger budget) and reports the levers beyond the list (core at q3,
  boss at q5) as needing a yes. Measured rates: V0 25.7 KB/s, q3 17.2 KB/s, q5 12.4 KB/s. It also reads the game's data
  (`coverage`): a row heard in a chapter that does not load its pack is a PROBLEM (the test fails), and it lists the rows no
  chapter's build or foes carry (flare, Full-Life, three breaths, Death, three aeon Overdrives: only the Sphere Grid could reach
  them). **Today's numbers:** 100.85 MB shipped besides the packs, 4.15 MB of headroom; the planned set (open and held rows left
  out: 159 cues in ten packs) is 13.2 MB at V0 and 9.7 MB with the boss packs at q3 and `ffx-core` at q3 (it is 6.7 MB at V0, over the 5 MB
  sprite gate, a lever that needs Bailey's yes). That is 5.5 MB over the headroom. A v2 repack that gave back 4 MB (more than the
  strict rule will free until the core packs ship; the whole sprite is 4.9 MB) leaves it 1.5 MB over, and the 20 long beds the tool
  names to shorten (Slow, Dispel, the aeon Overdrives, the final aeon's moves) cover that exactly; leaving out the 9 rows no
  chapter's build or foes carry (`--reachable-only`, 47 s) it fits with room to spare. So the budget is a decision for Bailey, with
  numbers: `node tools/audio/sfx-parity-layout.mjs --repack 4000000 --coverage`.
* `tools/audio/sfx-parity-repack.mjs` (+ `sfx-parity-retire.mjs`, `src/audio/sfxV2/retired.ts`): which v2 stand-ins a recorded
  original has made unnecessary. A cue retires only when **every** way the game reaches it (the scripted fight plays every
  ability of both games by a party actor and by a foe) ends at an original in the game's **core** pack; a boss pack's
  recording retires nothing, a cue nothing was seen to use stays, and Auron's katana recording does not retire the katana swing
  while foes still swing it. `--write [--exclude-out f.json]` writes the generated `retired.ts` and the list for
  `python tools/audio/sfx-v2-sprite.py --work <dir> --exclude f.json --install` (smoke-tested: 98 cues from 100, 4.81 MB from
  4.89 MB), then `node tools/audio/sfx-parity-mix.mjs` (the trims come from the sprite's cues). A retired name stays in
  `V2_CUES` (the voice still asks for it, the mixer finds the original, the first-bank stand-in plays until the pack has decoded);
  `audio-sfx-v2.test.ts` keeps "the sprite plus the retired list is exactly `V2_CUES`" true. Empty today: no core pack ships.
* `sfx-parity-sprite.py` now refuses (before anything is encoded) a cue whose name no hook, flow slot or v2 stand-in of the pack's game
  asks for, or whose `specRow` is not the row the name answers (`tools/audio/sfx-parity-names.mjs --game <g>` lists the names), and
  `--install` refuses a pack that would put the shipped audio over the budget and says how far. Smoke-tested with a synthetic take.

### The pin (what makes "inert" a fact)

`tests/unit/audio-sfx-parity-pin.test.ts` plays about 2,200 scenarios of both games (`tests/unit/helpers/sfxFight.ts`: every
ability of both catalogues by a party actor and by a foe, every weapon, criticals, multi-hits, misses, statuses with and
without an action, KOs of every kind, a summon, a charge ladder, a form change, a counter, the Overdrive gauge, the data `sfx`
keys, the boss reveal and each character's Overdrive opening) through the **real presenter and the real chapter voice** on a
virtual clock, and compares each scenario's cues, volumes, delays and times with `tests/fixtures/sfx-parity-pin.golden.json`,
**recorded on the pristine `origin/r40-rc` before any of this**. The new options (`events`, `coveredBy`, `beatMs`) are asked of
the mixer and are not in the signature; `audio-sfx-parity-slots.test.ts` pins the mixer: with no pack, `playSfx` with them plays
the stand-in exactly as without. To re-record after a deliberate change to the presenter's own timing or to a cue choice, see the
header of the pin test.

### Owed before the release that carries this

`critic-plan --paths` for the audio-routing and presenter files (AudioManager, SfxSprites, BattlePresenterSfx, BattleMoments,
ResultsScreen, BattleScreen: expected focused before and deep after, no save-data class); a CHANGELOG entry tagged both the
day a pack ships (this branch changes no sound); the ledger rows. The browser proof (a Chapter I and a Chapter VI fight,
`audioDebug().sfxLog` showing `events` honoured and `via: 'parity'`) needs a pack to exist; the headless unit proof stands in
until then. Nothing here touched a save field, the buses, the limiter, an audio file or the manifest.

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
* ~~Per-actor cue names and their `battleVoice.ts` hooks; the phase-2 timing; the encounter shatter and fade-in hook; the
  results loop and stingers~~ **Built on `r41-sfx2`** (see the section above).
* The order the accepted rule gives: the core packs, then a repack of v2 (`sfx-v2-sprite.py --exclude`), then the boss
  packs, inside the 105 MB budget: **the repack tool and the layout planner are built** (above); run
  `node tools/audio/sfx-parity-layout.mjs --coverage` before generating, because it names the rows no chapter plays and the
  rows that would be silent where their pack is not loaded.
* **Owed before the release carrying this:** `tools/audio/sfx-v2-levels.py` and `sfx-probe.mjs` on a Chapter I and a
  Chapter VI fight at slider 100 percent (limiter gain reduction under 3 dB; none at the default slider), a headless
  proof that `sfxLog` shows `v2` with `trimDb`, `node tools/critic-plan.mjs --paths src/audio/AudioManager.ts,...`
  (audio routing: focused before, deep after), a CHANGELOG entry tagged both (FFX-2 for the cuts), and the ledger rows
  (D-nnn / A-nnn) for the choices above. The credits panel gets its "Sound effects from ElevenLabs" line the day a pack
  ships (the licence reading is the music's; confirm the plan and terms that day).
