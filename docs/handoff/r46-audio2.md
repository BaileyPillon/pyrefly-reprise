# r46-audio2: the second audio lane (29 recorded sound effects, Chapter IV's silence, results loops without a breath, title proposals)

Written 2026-10-13 by a Sonnet sub-agent of the release driver. Branch `r46-audio2`, from origin/r45-rc `d5bf2206`; worktree `D:/pyrefly-r46-audio2` (`node_modules` and `public/art` are junctions, both untracked: `cmd /c rmdir` each, no `/s`, before ever removing the tree). **Nothing is merged and nothing is deployed.** `public/audio` is tracked in git, so the branch carries the files.

Authority (Bailey): 2026-10-10 23:05 EDT: "i'll go with all your recommendations even as to music and sound effects. you recommend an dchoose it please. this is extremely important."; 2026-10-13, after the driver published its sound-effect picks (29 use the new take, 24 keep today's, 11 try again): "keep going please ill go with all your recommendations even for music and sound." Nobody has heard any of it (rule 13): every pick is by measurement, the driver's by brief, and Bailey can overrule any of it by ear. No ElevenLabs call was made in this lane: the takes were generated on 2026-10-12 and 13 and are only installed here.

Game case, part by part (rule 14): **Part 1** FFX 17 cues in FFX packs, FFX-2 12 cues in FFX-2 packs, never a cue of the other game in a chapter's pack. **Part 2** FFX-2 only (Chapters IV, XI, XV). **Part 3** both games (`victory-ffx` is FFX; `victory-ffx2` and `victory-bahamut` are FFX-2). **Part 4** proposal only, both games, no player-facing text changed.

## What changed, in one table

| Part | What | Game | Files |
|---|---|---|---|
| 1 | The driver's 29 "use the new take" rows installed, and the newer Shuyin take (v3 for v1) | FFX 17, FFX-2 12 (+ Shuyin, FFX-2) | `public/audio/sfx/parity-*.mp3` (9 packs, 3 new), `sprite-v2.mp3`, `manifest.json`, `retired.ts`, the record and CREDITS |
| 2 | FOC45-01: Chapter IV's results cue is cut when the scene resumes; the same gap closed in Chapters XI and XV | FFX-2 only | `src/story/scripts/ffx2-bahamut.ts`, `ffx2-fallen-aeons.ts`, `ffx2-den-of-woe.ts` |
| 3 | FOC45-02: the three results loops re-cut so the loop closes on body music | both | `public/audio/music/victory-{ffx,ffx2,bahamut}.mp3`, `manifest.json`, the batch-2 record, THEMES.md rows |
| 4 | FOC45-03: proposed SOUND TEST titles (below; nothing in the game changed) | both | this note |

## Part 1: the 29 rows (and Shuyin v3)

Method, reproduced from r45 (`docs/handoff/r45-audio.md`, part 2): the lane's own pack inputs (`D:/Tools/pyrefly-scratch/2026-10-12/sfx-gen/packs/<pack>.all.picks.json`, the mastered FLAC the lane levelled to each row: nothing was re-levelled or re-trimmed here) cut into the nine packs by `python -I tools/audio/sfx-parity-sprite.py --pack <pack> --picks <file> --q <3|5> --install`: the two core packs at q3, the boss packs at q5 (58c). The input files and the builder are in `D:/Tools/pyrefly-scratch/2026-10-13/audio2/` (`build_picks.py`, `picks/`); every installed cue is the lane's entry for its row (the script refuses a mismatch of pack, cue name, take or file with `picks.json`, and an entry whose game is not its pack's). Every cue passed the packer's encode check in the first pass (0 cues over -1.1 dBTP, no trim). Then the repo's own follow-ups: `node tools/audio/sfx-parity-layout.mjs` (the whole set fits; no pack over the 5 MB gate), `node tools/audio/sfx-parity-repack.mjs --write` and `sfx-v2-sprite.py --exclude --install` (below), `node --experimental-transform-types tools/audio/sfx-parity-mix.mjs` (the trim table did not move), `node tools/audio/qa.mjs`, and the prompt lint over all 319 prompts of the record (0 findings).

### The 29 rows

| # | Row | What it is | Game | Pack | Cue | Take | Fit (worst deviation, 1.0 = edge of tolerance) | Level shipped (LUFS) |
|---|---|---|---|---|---|---|---|---|
| 1 | `ffx.ui.cancel` | Menu cancel | FFX | `ffx-core` | `cancel` | `ffx.ui.cancel.v4` | failed (2.40) | -22.77 |
| 2 | `ffx.cure.t1` | Cure (tier 1, also Potion) | FFX | `ffx-core` | `cure` | `ffx.cure.t1.v1` | failed (2.40) | -19.05 |
| 3 | `ffx.cure.t2` | Cura (tier 2, also Hi-Potion) | FFX | `ffx-core` | `cure-2` | `ffx.cure.t2.v1` | failed (1.87) | -16.96 |
| 4 | `ffx.ko.fiend` | A fiend is defeated | FFX | `ffx-core` | `dissolve-pyreflies` | `ffx.ko.fiend.v1` | failed (3.86) | -21.98 |
| 5 | `ffx.ui.error` | Refused action | FFX | `ffx-core` | `error` | `ffx.ui.error.v2` | failed (2.89) | -17.29 |
| 6 | `ffx.weapon.katana.hit` | Auron's katana blow | FFX | `ffx-core` | `hit-katana` | `ffx.weapon.katana.hit.v5` | failed (2.24) | -14.06 |
| 7 | `ffx.weapon.spear.hit` | Kimahri's spear blow | FFX | `ffx-core` | `hit-spear` | `ffx.weapon.spear.hit.v2` | failed (2.28) | -17.46 **(peak-limited: 3.1 dB below its row)** |
| 8 | `ffx.item.ether` | Ether (item) | FFX | `ffx-core` | `item-ether` | `ffx.item.ether.v2` | failed (1.87) | -18.66 |
| 9 | `ffx.item.grenade` | Grenade (item) | FFX | `ffx-core` | `item-grenade` | `ffx.item.grenade.v1` | failed (3.00) | -14.00 |
| 10 | `ffx.life` | Life and Phoenix Down | FFX | `ffx-core` | `life` | `ffx.life.v2` | failed (2.87) | -15.71 |
| 11 | `ffx.petrify` | Petrify | FFX | `ffx-core` | `petrify-shatter` | `ffx.petrify.v1` | failed (2.27) | -21.47 **(peak-limited: 7.4 dB below its row)** |
| 12 | `ffx.slow` | Slow | FFX | `ffx-core` | `slow` | `ffx.slow.v1` | failed (2.38) | -14.00 |
| 13 | `ffx.thunder.t3` | Thundaga (Thunder, tier 3) | FFX | `ffx-core` | `thunder-3` | `ffx.thunder.t3.v1` | failed (2.09) | -13.99 |
| 14 | `ffx.water.t3` | Waterga (Water, tier 3) | FFX | `ffx-core` | `water-3` | `ffx.water.t3.v4` | near (1.32) | -14.58 |
| 15 | `ffx.boss.fa.wave` | Final aeon, Power Wave and Gravija | FFX | `ffx-final-aeon` | `fa-wave` | `ffx.boss.fa.wave.v1` | failed (1.89) | -14.40 |
| 16 | `ffx.boss.flux.cleave` | Seymour Flux, Cross Cleave | FFX | `ffx-flux` | `flux-cleave` | `ffx.boss.flux.cleave.v1` | failed (1.52) | -13.82 |
| 17 | `ffx.boss.flux.attack` | Seymour Flux, attack and blow | FFX | `ffx-flux` | `swing-flux` | `ffx.boss.flux.attack.v1` | failed (2.67) | -15.97 |
| 18 | `ffx2.boss.shiva` | Dark Shiva's attack | FFX-2 | `ffx2-aeons` | `boss-shiva` | `ffx2.boss.shiva.v1` | failed (2.33) | -14.01 |
| 19 | `ffx2.ui.cancel` | Menu cancel | FFX-2 | `ffx2-core` | `cancel-x2` | `ffx.ui.cancel.v4` | failed (2.40) | -22.77 |
| 20 | `ffx2.cure` | Cure (tier 1, also Potion) | FFX-2 | `ffx2-core` | `cure-x2` | `ffx2.cure.v3` | failed (2.56) | -13.94 |
| 21 | `ffx2.death` | Death | FFX-2 | `ffx2-core` | `death` | `ffx2.death.v1` | failed (3.13) | -15.03 |
| 22 | `ffx2.ui.error` | Refused action | FFX-2 | `ffx2-core` | `error-x2` | `ffx.ui.error.v2` | failed (2.89) | -17.31 |
| 23 | `ffx2.special.trigger` | Trigger Happy shots | FFX-2 | `ffx2-core` | `gun-burst` | `ffx2.special.trigger.v2` | failed (3.00) | -17.99 |
| 24 | `ffx2.lb.warrior.hit` | Warrior hit | FFX-2 | `ffx2-core` | `hit-greatsword` | `ffx2.lb.warrior.hit.v4` | failed (2.00) | -14.03 |
| 25 | `ffx2.lb.gunner.hit` | Gunner hit | FFX-2 | `ffx2-core` | `hit-gun` | `ffx2.lb.gunner.hit.v1` | failed (2.13) | -13.97 |
| 26 | `ffx2.cast.chant` | Spell chant | FFX-2 | `ffx2-core` | `magic-charge-x2` | `ffx2.cast.chant.v1` | failed (4.90) | -19.87 |
| 27 | `ffx2.ui.close` | Window closes | FFX-2 | `ffx2-core` | `menu-close-x2` | `ffx.ui.cancel.v4` | failed (2.40) | -23.92 |
| 28 | `ffx2.ui.open` | Window opens | FFX-2 | `ffx2-core` | `menu-open-x2` | `ffx.ui.turn.v3` | failed (2.81) | -23.97 |
| 29 | `ffx2.boss.leg` | Machina leg attack | FFX-2 | `ffx2-machina` | `boss-leg` | `ffx2.boss.leg.v1` | failed (2.93) | -14.01 |

Six of the rows use a menu take that was generated for an FFX row and is mastered at each game's own row level (the lane's `mastered/<take>@<row>.flac`): `ffx.ui.cancel.v4` (FFX `cancel` -22.8, FFX-2 `cancel-x2` -22.8, FFX-2 `menu-close-x2` -24.0), `ffx.ui.error.v2` (FFX `error`, FFX-2 `error-x2`, both -17.3) and `ffx.ui.turn.v3` (FFX-2's `menu-open-x2` only, -24.0). The FFX row `ffx.ui.turn` itself was dropped by the driver (today's `turn-ready` is no further from the target than the new take), so no FFX cue uses that take.

**Two takes are quieter than the cue they replace** (the lane flags them `capped`: they are sharp, short transients, and a limiter would have had to take more than 3 dB to reach their rows' level, which the lane's rule refuses): `ffx.petrify` ships at -21.47 LUFS against -14.1 today (7.4 dB quieter) and `ffx.weapon.spear.hit` at -17.46 against -14.36 (3.1 dB quieter). Both are `low`-confidence rows, so the unit test that holds a pack cue to its row's level (which skips `low` rows) passes; the record marks them (`levelFlags: ["capped"]`, `levelShortfallDb`) and `audio-sfx-batch2-2026-10-13.test.ts` pins exactly those two. They are installed because the driver's pick was "use the new take" for both rows; the quickest reversal is to take the cue out of `ffx-core` (`hit-spear`, `petrify-shatter`) and rerun the packer. If the driver prefers them gone, that is a method decision this lane did not take.

### The cues by pack, before and after

| Pack (quality) | Cues before | Cues after | Bytes before | Bytes after |
|---|---|---|---|---|
| `ffx-core` (q3) | 8 | 22 | 329,971 | 777,011 |
| `ffx2-core` (q3) | 6 | 16 | 184,746 | 352,125 |
| `ffx-lady` (q5) | 1 | 1 | 111,935 | 111,935 (unchanged) |
| `ffx2-bahamut` (q5) | 1 | 1 | 20,096 | 20,096 (unchanged) |
| `ffx2-machina` (q5) | 1 | 2 | 13,852 | 28,206 |
| `ffx2-shuyin` (q5) | 1 (take v1) | 1 (take v3) | 29,881 | 33,049 |
| `ffx-flux` (q5), new | 0 | 2 | - | 94,948 |
| `ffx-final-aeon` (q5), new | 0 | 1 | - | 75,150 |
| `ffx2-aeons` (q5), new | 0 | 1 | - | 21,964 |
| packs total | 18 | 47 | 690,481 | 1,514,484 |

The three new packs were already in `BOSS_PACKS` (`src/audio/sfxV2/packs.ts`: Chapter I, Chapter III; Chapters XI and XVI), so no game code changed; the chapters that load them are pinned in the new test. The 18 cues of the first batch come from the same mastered files (the packs were re-encoded and re-laid out in class and name order, so their offsets in the manifest moved; their levels read the same to 0.1 LUFS).

### The v2 repack (the r45 method, run again)

With 14 and 10 more recorded originals in the two core packs, `sfx-parity-repack.mjs` retired six more stand-ins because every way the scripted fight reaches them now ends at a recorded original in the game's core pack: **FFX** `dissolve-pyreflies`, `hit-katana`, `hit-spear`; **FFX-2** `gun-burst`, `hit-greatsword`, `hit-gun`. `retired.ts` now holds nine (`buff-generic`, `dissolve-pyreflies`, `gun-burst`, `hit-dagger`, `hit-greatsword`, `hit-gun`, `hit-katana`, `hit-spear`, `water`), `sprite-v2.mp3` went from 97 to 91 cues, 4,725,444 to 4,512,497 bytes (0.21 MB back). The re-encode's true-peak pass moved two surviving cues by 0.07 dB (`hit-1` +0.07, `hit-sword` -0.07). A stand-in that has left the sprite still plays the first-bank cue until the pack has decoded, so nothing is silent.

### Budget

`node tools/audio/qa.mjs`: **68,226,473 bytes (68.23 MB) before, 68,773,141 bytes (68.77 MB of the 105 MB budget, `AUDIO_BUDGET_BYTES` 105e6) after**: music 60,100,771 -> 60,036,383, first sprite 2,709,777, v2 sprite 4,725,444 -> 4,512,497, packs 690,481 -> 1,514,484; 0 cue findings, 0 sfx findings; each pack well under the 5 MB gate (the largest, `ffx-core`, is 0.78 MB). Headroom 36.23 MB.

### The 11 rows waiting for the driver's method check (not touched, not generated)

`ffx.silence`, `ffx.debuff`, `ffx.water.t2`, `ffx.reflect`, `ffx.boss.fa.bomber`, `ffx.boss.flux.annihilation`, `ffx.boss.lady.hellbiter` (FFX); `ffx2.shell`, `ffx2.bio`, `ffx2.slow`, `ffx2.fire` (FFX-2). The FFX and FFX-2 cues of the same names are different rows: the new test pins that `ffx2-core` has no `shell`, `slow`, `bio` or `fire-x2` while `ffx-core` ships `shell` and `slow`. The 24 "keep today's" rows are untouched too (`audio-sfx-batch2-2026-10-13.test.ts` pins that none of them is in a pack).

### Not wired, on purpose

- `ffx2.ui.open` also lists `alsoCovers: turn-ready-x2` in the lane's record: the same recording would answer FFX-2's "your turn starts" tick. A menu key has no `coveredBy` mechanism (that is for a boss's swing and its blow), so covering it means a second pack cue with the same take. The driver's row is "Window opens" and the FFX row `ffx.ui.turn` was dropped, so I installed `menu-open-x2` only. One more cue in `ffx2-core` if the driver wants it.
- The other `alsoCovers` of the 29 are already carried by the game's hooks: `hit-flux` stays silent while `swing-flux` plays (`coveredBy`), and Phoenix Down asks `life` after its own name (`then`).

### Record and credits

`docs/audio/sfx-parity-record.json` now holds 47 cues (7 `strict`, 11 `near`, 29 `driver`, each with the exact request body, character cost, both hashes, measurements, fit and deviations; Shuyin's carries `replaces` for v1) and 272 takes turned down (24 that now ship were taken off the list; Shuyin's v1 is on it with `supersededBy`). `docs/audio/CREDITS.md` carries the 29 prompts as sent, the raw-take and mastered-file hashes, and the Shuyin swap. The unit test `audio-sfx-parity.test.ts` holds both to the manifest and the CREDITS text.

## Part 2: FOC45-01, Chapter IV's results cue (FFX-2 only)

The finding: the results screen of Chapter IV is silent in every way except the new quiet cue `victory-bahamut`, and the post script's `music(null, 700)` runs before `results(true)`, so it only reaches the marker: `showResults()` starts the cue on its own, and it looped under the whole scene that follows (the review measured it ending 24 s after Continue). The FFX posts handle exactly this with a `music(null, 300)` right after `results()` (`seymour-flux.ts`, `yunalesca.ts`, `seymour-anima-macalania.ts`, pinned by `flow-post-music.test.ts`).

Done, with the same step and the same number: `ffx2-bahamut.ts` has `music(null, 300)` right after `results(true)`. `flow-post-music.test.ts` had Chapter IV in its "intentionally not silenced" list (true while the chapter had no victory cue); it now holds it in the fixed list, plus a test that the first step after the marker is the cut with the FFX posts' 300 ms and that `results(true)` is still silent.

The other FFX-2 posts that show the tally mid-scene, read one by one (each post's steps after `results()`, and the music the script starts before it):

| Chapter | After the tally | Verdict |
|---|---|---|
| IV `ffx2-bahamut` | silent scene, no cue ever follows | **fixed**: `music(null, 300)` |
| XI `ffx2-fallen-aeons` | the Glen's own bed, `scene-farplane`, is started before the tally, replaced by `victory-ffx2` at the tally, and never came back; lines 20 to 23 ran under the victory loop | **fixed**: `music('scene-farplane', 900)` after `results()` (the scene has its own cue, so it is put back, not stopped) |
| XV `ffx2-den-of-woe` | the bed the scene opened with, `scene-bevelle-underground`, is replaced the same way; line 16 ran under the victory loop (the review measured 4.2 s after Continue) | **fixed**: `music('scene-bevelle-underground', 900)` after `results()` |
| V `ffx2-vegnagun-shuyin` | `fade('black')`, then `music('ending-ffx2', 1800)` | nothing to fix: the ending cue is the first music after the tally |
| VI `ffx2-leblanc` (and the hidden Leblanc chapter, same script) | "let them celebrate, loudly": the victory loop plays under the first lines, then `scene-farplane` arrives by itself | **left**: the script's own note asks for it |
| XVI `ffx2-ixion-djose`, the hidden Experiment | `music(null, 800)` right after `results()` | already cut |
| XIII `ffx2-trema` | the post opens with `music(null, 1200)` (unscored), the tally comes after the farewell, then ONE line, "Hole in the floor. Out." The victory loop plays under it (the review measured 4.2 s after Continue) | **left, for the driver**: no note and no music table says that line is silent or has a cue of its own, and it is one line. If wanted: one step, `music(null, 300)` after `results()` in `ffx2-trema.ts`, and the id in the test's fixed list. |

`flow-post-music.test.ts` pins all of it (IV cut; XI and XV put their own bed back as the first music step after the tally; V, VI, XVI and XIII as they were). The browser check is below.

## Part 3: FOC45-02, the three results loops (both games)

**Cause, found in the lane's chain** (`D:/Tools/pyrefly-scratch/2026-10-10/music-batch2/tools/loopkit.py` `build_loop`): the finished loop fades the last beat before the loop end, equal-power, into "the audio just before the loop start". For a results loop that audio is the near-silent gap after the fanfare (-44 to -60 dBFS), so every pass ends in a fade to near silence and re-enters at full level. The review's numbers reproduce on the shipped files exactly (below). The lane recorded the levels (`levelAcrossWrap`) but nothing gated them; the 12-bar loop also happened to end in a lull of the raw take.

**Fix: the loop points move, the sound does not.** The wrap cannot be made level by moving only the end: a loop cut at the body's first attack steps in level at every pass because the music itself does (an attack out of near silence, +4 to +16 dB on 200 ms windows even with no fade at all; Chapter IV's cue has a 20 dB bar line). So both loop points move together by whole beats into the body (one beat for FFX and FFX-2, three for Chapter IV), where the audio before the loop start is real body music, and the chain's own crossfade, take, bar grid and mastering are unchanged. The search is `D:/Tools/pyrefly-scratch/2026-10-13/audio2/mb/tools/reloop_search.py` over a sandbox copy of the lane's chain (`MB_ROOT`, the lane's directory untouched): every beat offset and bar count, each built with the lane's `build_loop`, scored on the level step (50 ms and 200 ms windows, both must be 3 dB or less), the lane's click ratio (0.8 or less), spectral flux across the seam (1.05 or less), the wrap step gate, and chroma and spectral similarity of the bar before the end and the bar before the start. The chosen pair then went through the lane's own `batchloop.py master` (one gain to -16 LUFS, the stereo gate, LAME V4, the 3 s run-on, the seam gates; all three accepted). Constraints kept: the intro stays 6 to 9 s and the body 20 to 40 s (`results-music.test.ts`), the file runs 3 s past the loop end, and the loop is a whole number of bars.

| Cue | Loop before | Loop after | Bars | Bytes before / after |
|---|---|---|---|---|
| `victory-ffx` | 7.902 -> 34.587 (26.7 s) | 8.458 -> 35.143 (26.7 s) | 12 / 12 | 634,232 / 643,980 |
| `victory-ffx2` | 7.765 -> 45.764 (38.0 s) | 8.264 -> 40.263 (32.0 s) | 19 / 16 | 986,317 / 875,248 |
| `victory-bahamut` | 6.516 -> 31.798 (25.3 s) | 8.885 -> 34.157 (25.3 s) | 8 / 8 | 514,225 / 551,158 |

`victory-ffx2` is 16 bars (four-bar phrases) now, 32 s, where the lane had picked 19 bars (38 s, not phrase-aligned) for length; 16 bars gave the smaller level step, and a results screen rarely holds a loop that long.

**The numbers** (the level of the file around the wrap, dBFS RMS, both channels; "step" = after minus before; the first rows are the files the review measured, reproduced):

| Cue | | 50 ms before | 50 ms after | step 50 | 200 ms before | 200 ms after | step 200 | click ratio |
|---|---|---|---|---|---|---|---|---|
| `victory-ffx` | before | -53.6 | -29.4 | +24.2 | -40.2 | -21.5 | +18.7 | 0.08 |
| | **after** | -20.2 | -19.9 | **+0.3** | -19.5 | -20.3 | **-0.8** | 0.20 |
| `victory-ffx2` | before | -40.3 | -27.5 | +12.8 | -25.6 | -26.7 | -1.0 | 0.03 |
| | **after** | -14.0 | -15.8 | **-1.8** | -15.4 | -16.6 | **-1.2** | 0.35 |
| `victory-bahamut` | before | -36.2 | -13.1 | +23.1 | -35.3 | -10.9 | +24.4 | 0.01 |
| | **after** | -29.8 | -29.2 | **+0.5** | -29.9 | -28.9 | **+1.1** | 0.67 |

(`D:/Tools/pyrefly-scratch/2026-10-13/audio2/wrapmetrics.py`, ffmpeg decode of the shipped MP3s; the click ratio is the wrap's sample step against the 99th percentile of the steps within 50 ms, the project gate is under 1.) For scale, the music's own 200 ms level step at the other positions of the body has a median of 0.6 to 1.1 dB and a 90th percentile of 1.8 to 3.1 dB, so the wrap now steps like any other place in the loop. **The repo's own proof, with the page's decoder** (`tools/audio/music-v2-browser-proof.mjs` on the production build, Chromium; `acrossWrapDb` is the 50 ms level across the wrap, `loopAddedJumpDb` what the wrap adds to the file's own continuation): `victory-ffx` +0.34 / 0.01, `victory-ffx2` -1.81 / 0.05, `victory-bahamut` +0.51 / 0.00 dB (the review had +24.2, +12.8, +23.1); click `wrapOverP99` 0.20, 0.35 and 0.66, `wrapErrorOverP99` 0.26, 0.36 and 0.44 (under 1: smaller than the music's own steps); the run-on against the loop head -37.6, -24.9 and -40.1 dB; decoded lengths within 2 samples of the manifest. `qa.mjs` passes the three (0 findings). The lane's gates on the new masters: click ratio 0.26, 0.16, 0.58, flux ratio 0.26, 0.23, 0.41, step ok, stereo gate PASS (`victory-ffx2` is left alone, side gain +0.8 dB, as before).

`docs/audio/music-batch2-2026-10-12.json` carries the three re-cut files (bytes, sha256, manifest entry, master and stereo figures) and a `recut` object on each (why, what, the file as it was, the wrap measured before and after); the THEMES.md "How each cue ships" rows and the batch-2 test follow. `audio-sfx-batch2-2026-10-13.test.ts` pins the wrap numbers (3 dB or less on both windows, more than 10 dB before), the manifest equal to the record, the intro and body windows and the 3 s run-on.

**Ear-owed.** I measured this and cannot hear it. What the ear should judge: the entry after the wrap now lands a beat (a few beats for Chapter IV) into the body rather than on its first downbeat, so a pass re-enters on a continuing phrase instead of a fresh attack; it should read as a loop with no breath, but only an ear can say whether the join is a hair too smooth, and whether Chapter IV's quiet resolve wants its old longer lead-in at the first pass (the first pass is the same sound; only where the loop closes moved). If the owner prefers the old files they are in git history (`git show d5bf2206:public/audio/music/victory-ffx.mp3`).

## Part 4: FOC45-03, proposed SOUND TEST titles (proposal only)

**Nothing on screen changed.** The list below is for Bailey to accept, change or refuse; if he says yes, the titles go into `TRACK_NOTES` in `src/audio/tracks/index.ts` (each as the `title` of a note, which `trackTitle` then lifts) and the two tests that read titles follow. The SOUND TEST row of a cue without a note reads as its id with spaces, which is what `FOC45-03` flagged; these 17 are the music cues the pause jukebox can list for FFX and FFX-2 chapters (`boss-ff7-guard` belongs to the hidden FF7 chapter and gets no proposal here). Two to three words each, in the voice of the existing composed titles ("Iron Undertow", "Still Water", "Sphere Shine"), written from each cue's brief (its mood and the fight it plays in), none a retail track name.

| Cue | Game | Plays in | Shows today | Proposed |
|---|---|---|---|---|
| `boss-bahamut` | FFX-2 | Chapter IV, the fight Yuna cannot celebrate | Boss Bahamut | **Mercy Withheld** |
| `victory-bahamut` | FFX-2 | Chapter IV's results (quiet resolve) | Victory Bahamut | **Quiet Reckoning** |
| `boss-leblanc` | FFX-2 | Chapter VI, Leblanc | Boss Leblanc | **Brass Bravado** |
| `scene-chateau-leblanc` | FFX-2 | Chapter VI's chateau, the hidden Leblanc preview (a swaggering big band) | Scene Chateau Leblanc | **Strut in Velvet** |
| `boss-ffx2-fallen-aeons` | FFX-2 | Chapters XI and XVI (a duel with a summoned god, lavish and relentless) | Boss FFX-2 Fallen Aeons | **Gilded Requiem** |
| `boss-trema` | FFX-2 | Chapter XIII, Trema (a cold, stately march) | Boss Trema | **Cold Liturgy** |
| `boss-den-of-woe` | FFX-2 | Chapter XV (a battle against old comrades turned enemies) | Boss Den Of Woe | **Hollow Reunion** |
| `boss-experiment` | FFX-2 | the hidden Experiment (a strange machine, both acts) | Boss Experiment | **Rogue Prototype** |
| `defeat-ffx2` | FFX-2 | the defeat panel (soft, wistful, solo piano) | Defeat FFX-2 | **Falling, Gently** |
| `boss-challenge` | FFX | Chapter II, Yunalesca, and the hidden Gui chapter's second fight (cold, clipped ostinato) | Boss Challenge | **Unhearing Cold** |
| `boss-seymour-natus` | FFX | Chapter X (a colossal, tragic monster that was a refined nobleman) | Boss Seymour Natus | **Lord Unmade** |
| `boss-seymour-omnis` | FFX | Chapter XII (a final reckoning, past all courtesy) | Boss Seymour Omnis | **Past All Courtesy** |
| `boss-isaaru` | FFX | Chapter XIV (a duel between summoners and their gods) | Boss Isaaru | **The Gods Answer** |
| `boss-sin-assault` | FFX | Chapter XVII (an aerial assault on something the size of a mountain) | Boss Sin Assault | **Skyward Siege** |
| `boss-sin-countdown` | FFX | Chapter XVIII (a fight against a clock) | Boss Sin Countdown | **Borrowed Seconds** |
| `boss-gui` | FFX | the hidden Sinspawn Gui chapter, fight 1 (a camp under threat from something huge) | Boss Gui | **Camp Under Shadow** |
| `defeat-ffx` | FFX | the defeat panel (a single bell tolls, slow strings) | Defeat FFX | **One Bell Tolled** |

Notes for the choice: `Past All Courtesy` answers the existing "The Courtesy" (Chapter VII's `boss-seymour-macalania`) and "Noble Rot" (Chapter I) in the Seymour family; `Strut in Velvet` and `Brass Bravado` keep Leblanc's two cues as a pair; `Mercy Withheld` and `Quiet Reckoning` do the same for Chapter IV's fight and its results. Any of these can be swapped for another two or three words; the cue ids and the music stay as they are.

## Checks run

- `node node_modules/typescript/bin/tsc --noEmit -p .`: clean.
- Unit tests: the files whose path holds audio, sfx, music, story, results, flow-, chapter-meta, learn-exploded, presenter-victory, pause or chapters (all the chapter engine files, benches included): **257 files, 3,693 tests: 3,661 passed, 22 skipped, 10 failed** with `Test timed out in 15000ms` (a loaded machine: 4,000-seed benches on two workers beside other agents' runs). Run again alone, with a 120 s timeout, **all of the nine files pass** (168 tests) except that `audio-manifest-io.test.ts` hit an `EPERM` on a lock file in the temp folder once under that load and passes alone, twice (21 tests). The one that reads a script this lane touched, `chapters/den-of-woe-ship-story.test.ts`, passes. Before the sweep, the 14 SFX files (237 tests), the 10 story, flow, results and music-routing files (270) and the music-record files (119) were green after the changes below, and the new `audio-sfx-batch2-2026-10-13.test.ts` has 15 tests. Three older tests were updated to what is now true, none loosened: `audio-sfx-parity-repack` (the nine retired cues), `audio-sfx-parity-mix` (the three blows that left the sprite; the dissolve) and `flow-post-music` (Chapters IV, XI and XV); `audio-music-batch2-2026-10-12` is unchanged and reads the updated record and THEMES.md rows.
- `node tools/audio/qa.mjs`: 68,773,141 bytes (68.77 MB of 105 MB), 0 cue findings, 0 sfx findings, no manifest problem.
- `node tools/audio/sfx-parity-layout.mjs` (fits; the largest pack 0.78 MB) and `--coverage` (no row heard in a chapter that does not load its pack; the findings it prints are the shared-core listing it always prints); `node tools/audio/sfx-parity-repack.mjs --check` (`retired.ts` is current); the prompt lint over 319 prompts (0 findings); `node tools/orphans.mjs` (1,570 modules, 36 orphaned, the same 36 as before; no module of this branch).
- **Headless Chromium on a production build** (`BASE_PATH='/'`, built once, `vite preview` on port 5271, `D:/Tools/pyrefly-scratch/2026-10-13/audio2/proof/proof.mjs`, results in `proof-fights.json` and `proof-rest.json` there):
  - **Decode.** All 13 changed or new audio files (the nine packs, `sprite-v2`, the three loops) fetched with HTTP 200, byte counts equal to the manifest's, decoded by the page's own `AudioContext` to the manifest's length within 0.6 ms, and every one of the 47 pack cues audible (RMS above -60 dBFS) and under 0 dBFS. 0 console errors, 0 page errors, 0 failed requests.
  - **Every new cue asks for its recording.** At the first command menu of Chapter I (FFX; packs `ffx-flux`, `ffx-core`) 16 of 16 FFX cues, of Chapter III (packs `ffx-final-aeon`, `ffx-core`) the Power Wave, of Chapter XI (FFX-2; packs `ffx2-aeons`, `ffx2-core`) 11 of 11, of Chapter V (packs `ffx2-machina`, `ffx2-shuyin`, `ffx2-core`) the leg strike: each asked by name through the game's own mixer (menu keys by their key) and answered by its recorded original (`via: parity`, the cue it should be). The other game's new names asked in each (10 to 12 per chapter) never resolved to a parity original, although the other game's core pack was still decoded in the page.
  - **Real fights** (`autoBattle('intended')` at skip speed, seed 1, both won): Chapter I played 82 recorded originals, all FFX cues from the two packs the chapter loads, and of this lane's additions Auron's katana blow (5), the fiend dissolve (7), Kimahri's spear blow, Life and Cross Cleave; Chapter XI played 72, all FFX-2 cues from its two packs, and of this lane's additions the Warrior hit (8), the Gunner hit (6), the spell chant (43: the most played new cue by far, and the worst-fitting of the 29), Cure and the window open; no cue of the other game was played in either.
  - **Chapter IV's cue** (real flow through the cutscenes, `autoBattle`, the tally, then the real Continue): `victory-bahamut` playing on the results screen at full gain; after Continue the music is gone in 444 ms (the last audible sample 297 ms, the 300 ms fade), and nothing played for the 14 s that were sampled across the post scene.
  - The repo's `music-v2-browser-proof.mjs` (limited to Chapter IV): the 41 cues fetch with 200 and the lengths agree; its two "clicks" (`boss-sin-countdown`, `boss-vegnagun`) and the `defeat-ffx2` "jump" are findings of cues this lane did not touch; its Chapter IV row says CHECK only because the tool reads a cue's source from the composed-track list, which has no entry for the nine batch-2 cue ids (`source: null`), so it cannot count them; the sequence it logged for the chapter is the scene bed, `boss-bahamut`, `victory-bahamut` on the results screen, then nothing.
- Servers: one `vite preview` per proof run, each started with its Chromium by the script and stopped by PID (taskkill on the PID, after reading its command line), none left; no dev server; port 5271 is free.

## What Bailey's ear still owes

- Every one of the 29 recorded sounds (and Shuyin's newer take): they are chosen by measurement against the spec rows, and `failed`/`near` in the table means the take is not close to its row on one measure or more. The worst-fitting: `ffx2.cast.chant` (deviation 4.9, and it is played on every cast), `ffx.ko.fiend` (3.9), `ffx2.death` (3.1), `ffx.item.grenade` and `ffx2.special.trigger` (3.0).
- The two quieter takes (Petrify, Kimahri's blow).
- The three loops' wraps (Part 3).
- The proposed titles, if he wants any of them (Part 4).
- The 11 waiting rows are the driver's method check, not Bailey's ear.

## Not done, guessed, or worth knowing

- `ffx2.ui.open`'s second name (`turn-ready-x2`) is not wired (above). XIII's single line after the tally is left (above).
- The grid search for the loops used the lane's chain on the raw takes; the sandbox and its outputs are in `D:/Tools/pyrefly-scratch/2026-10-13/audio2/mb` (not in the repo; the lane's directory under `2026-10-10` was only read).
- `parityTrims.ts` was regenerated and did not change (git shows it as touched only because of line endings; it is not in the commit). `NOW.md`, `DECISIONS.md` and `ACTIONS.md` are not touched (the driver owns the ledgers).
- A full `npm test` was not run (the candidate assembly runs it); the relevant files are listed above.
