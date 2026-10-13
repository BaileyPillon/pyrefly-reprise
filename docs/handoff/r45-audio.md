# r45-audio: music batch 2 (27 ElevenLabs originals), the results screen's cues, and the SFX parity loose set (18 cues)

Written 2026-10-13 by a Sonnet sub-agent of the release driver. Branch `r45-audio`, from origin/r43-rc `7b2582e7`; sparse worktree `D:/pyrefly-r45-audio` (`node_modules` and `public/art` are junctions, both untracked: `cmd /c rmdir` each, no `/s`, before ever removing the tree). **Nothing is merged and nothing is deployed.** `public/audio` is tracked in git, so the branch carries the files.

Authority (Bailey): "you need to use eleven labs"; "for music create originals that closely resemble the mood and atmosphere of the songs playing at each respective encounter"; 2026-10-10 23:05 EDT: "i'll go with all your recommendations even as to music and sound effects. you recommend an dchoose it please. this is extremely important."; 2026-10-12: "I'll go with all of your recommendations". The driver's decisions are items 47, 52, 53, 58 and 61 in `D:/Tools/pyrefly-scratch/2026-10-07/decisions-to-record.md`; the music is the batch-2 lane's `D:/Tools/pyrefly-scratch/2026-10-10/music-batch2` (27 picks) and the sound effects the SFX lane's `D:/Tools/pyrefly-scratch/2026-10-12/sfx-gen` (the loose set, 18 cues). Nobody has heard any of it (rule 13): the picks are the driver's, by brief and measurement, and Bailey can overrule any of them by ear.

Commits, in order: `fe7fb87c` (audio tooling: the manifest writer adds and removes entries as text, `oneShot`), `974ee7a5` (music batch 2: the 27 files, the routing, the results screen, the retirements, the records), `f6885f10` (this note, part 1), `1e6253b0` (SFX parity: the loose set, the v2 repack, the repack-tool fix) and the last commit (this note finished, and the one test the full suite found still pinning Chapter II's old cue).

## Part 1: music batch 2 (27 ElevenLabs originals), the results screen's cues, three MP3s retired

Game case, per cue (rule 14): FFX only for the FFX cues, FFX-2 only for the FFX-2 cues; the plumbing (results music, `oneShot`, the retire list, the warm list) is both. The commit messages carry the per-cue lists; `docs/audio/music-batch2-2026-10-12.json` has every cue's game, prompt, hashes and what it replaced.

### Decisions followed, one by one

| Decision | What was done |
|---|---|
| 47f / 52b: one original per distinct real-game track | 27 picks, 27 files. "Challenge" is one cue (`boss-challenge`); the Aeons track was already one cue (batch 1); the Bevelle bed and the Paragon fight are one (`scene-bevelle-underground`, 52g). |
| CH-A to Yunalesca (FFX Ch II) and the second Gui fight ONLY | `boss-challenge` is played by `yunalesca` and by `sinspawn-gui` link 2, and by no other chapter (pinned by the engine). |
| 58d: Chapter I keeps `boss-seymour`, the board keeps `chapter-select` | Neither file, entry nor routing was touched; Chapter XII and the Gui chapter stopped borrowing `boss-seymour` (`boss-seymour-omnis`, `boss-challenge`). |
| 52g: BU-2 is the Bevelle bed AND the Paragon fight | In place under `scene-bevelle-underground`: Chapters IV, XIII (the walk down and Paragon), XV, XVI and the Experiment's scene. |
| 47h: the chateau bed CB-1 in Ch VI and the hidden Leblanc chapter only | New cue `scene-chateau-leblanc`; the Bevelle bed no longer plays in either (they share one chapter record). |
| The other scene beds go to their scenes; both endings | Gagazet, Zanarkand dome, Dream's End, Macalania temple, Fahrenheit, Farplane, `ending-ffx`, `ending-ffx2`: in place. |
| 53d / 58f: VF-L2 and VX-L1 are an intro plus a loop for the results screen | In place under `victory-ffx` and `victory-ffx2`. See "Victory". |
| VB-A is Chapter IV's victory cue | New cue `victory-bahamut`, `FFX2_BAHAMUT.music.victory`. See "Victory". |
| 58e: DF-A (FFX) and DX-A (FFX-2) play once on a defeat | New cues `defeat-ffx`, `defeat-ffx2`. See "Defeat". |

### Routing, before and after

Printed from the real data and the real engine (`cueForGroup` over every link of every chapter, the chapter records, the pre scenes' music steps, and the results screen's rule), before this branch (the unmodified r43-rc base) and after it. A cell with an arrow changed; "Scene beds the pre script starts" lists the music steps of the chapter's opening scene other than its boss cue. The same table, as assertions, is `tests/unit/audio-music-batch2-2026-10-12.test.ts` ("the engine routes each chapter to its cues") and `tests/unit/results-music.test.ts`; the printing itself was a throwaway test, not committed. "none" in Victory is a chapter with no victory music (FF7's hidden chapter); "none" in Defeat before is the old behaviour (the battle theme just stopped).

| Ch | Chapter | Game | Scene (record) | Scene beds the pre script starts | Boss, link by link | Victory | Defeat |
|---|---|---|---|---|---|---|---|
| I | `seymour-flux` | FFX | `scene-gagazet` | `scene-gagazet` | `boss-seymour` | `victory-ffx` | `none` -> `defeat-ffx` |
| II | `yunalesca` | FFX | `scene-zanarkand-dome` | `scene-zanarkand-dome` | `boss-yunalesca` -> `boss-challenge` | `victory-ffx` | `none` -> `defeat-ffx` |
| III | `braskas-final-aeon` | FFX | `scene-dreams-end` | `scene-dreams-end` | `boss-jecht, (carries), boss-yu-yevon x5` | `victory-ffx` | `none` -> `defeat-ffx` |
| IV | `ffx2-bahamut` | FFX-2 | `scene-bevelle-underground` | `scene-bevelle-underground` | `boss-bahamut` | `none` -> `victory-bahamut` | `none` -> `defeat-ffx2` |
| V | `ffx2-vegnagun-shuyin` | FFX-2 | `scene-farplane` | `scene-farplane` | `boss-vegnagun x4, (carries)` | `victory-ffx2` | `none` -> `defeat-ffx2` |
| VI | `ffx2-leblanc` | FFX-2 | `scene-bevelle-underground` -> `scene-chateau-leblanc` | `scene-bevelle-underground` -> `scene-chateau-leblanc` | `boss-leblanc x3` | `victory-ffx2` | `none` -> `defeat-ffx2` |
| VII | `seymour-anima-macalania` | FFX | `scene-macalania-temple` | `scene-macalania-temple` | `boss-seymour-macalania` | `victory-ffx` | `none` -> `defeat-ffx` |
| VIII | `evrae-airship` | FFX | `scene-fahrenheit` | `scene-fahrenheit` | `boss-evrae` | `victory-ffx` | `none` -> `defeat-ffx` |
| IX | `yojimbo-cavern` | FFX | `scene-gagazet` | `scene-gagazet` | `boss-yojimbo` | `victory-ffx` | `none` -> `defeat-ffx` |
| X | `seymour-natus` | FFX | `scene-gagazet` | `none` | `boss-seymour-natus` | `victory-ffx` | `none` -> `defeat-ffx` |
| XI | `ffx2-fallen-aeons` | FFX-2 | `scene-farplane` | `scene-farplane` | `boss-ffx2-fallen-aeons x3` | `victory-ffx2` | `none` -> `defeat-ffx2` |
| XII | `seymour-omnis` | FFX | `scene-dreams-end` | `scene-dreams-end` | `boss-seymour` -> `boss-seymour-omnis` | `victory-ffx` | `none` -> `defeat-ffx` |
| XIII | `ffx2-trema` | FFX-2 | `scene-bevelle-underground` | `none` | `scene-bevelle-underground, boss-trema` | `victory-ffx2` | `none` -> `defeat-ffx2` |
| XIV | `isaaru-via-purifico` | FFX | `scene-gagazet` | `scene-gagazet` | `boss-isaaru x3` | `victory-ffx` | `none` -> `defeat-ffx` |
| XV | `ffx2-den-of-woe` | FFX-2 | `scene-bevelle-underground` | `scene-bevelle-underground` | `boss-shuyin x3` -> `boss-den-of-woe x3` | `victory-ffx2` | `none` -> `defeat-ffx2` |
| XVI | `ffx2-ixion-djose` | FFX-2 | `scene-bevelle-underground` | `scene-bevelle-underground` | `boss-ffx2-fallen-aeons` | `victory-ffx2` | `none` -> `defeat-ffx2` |
| XVII | `sin-fins-core` | FFX | `scene-fahrenheit` | `scene-fahrenheit` | `boss-sin-assault x3` | `victory-ffx` | `none` -> `defeat-ffx` |
| XVIII | `sin-face` | FFX | `scene-fahrenheit` | `scene-fahrenheit` | `boss-sin-countdown` | `victory-ffx` | `none` -> `defeat-ffx` |
| hidden (FF7) | `ff7-guard-scorpion` | FF7 | `none` | `none` | `boss-ff7-guard` | `none` | `none` |
| hidden | `exp-leblanc` | FFX-2 | `scene-bevelle-underground` -> `scene-chateau-leblanc` | `scene-bevelle-underground` -> `scene-chateau-leblanc` | `boss-leblanc x3` | `victory-ffx2` | `none` -> `defeat-ffx2` |
| hidden | `ffx2-masterpiece-theatre` | FFX-2 | `scene-bevelle-underground` | `scene-bevelle-underground` | `boss-ffx2-aeon, boss-vegnagun` -> `boss-experiment x2` | `victory-ffx2` | `none` -> `defeat-ffx2` |
| hidden | `sinspawn-gui` | FFX | `scene-gagazet` | `none` | `boss-dread, boss-seymour` -> `boss-gui, boss-challenge` | `victory-ffx` | `none` -> `defeat-ffx` |

### Files that changed under an unchanged cue id

Eighteen cues kept their key and changed their MP3 and manifest entry (the composition stays as the synth fallback). Bytes are the file before and after.

| Cue | Game | Pick | Before | After | Plays in |
|---|---|---|---|---|---|
| `victory-ffx` | FFX | VF-L2 | 2.32 MB | 0.63 MB | The results screen of every FFX chapter (1 to 3, 7 to 14, 17, 18) and the hidden Sinspawn Gui chapter, on a win: a fanfare opening of 7.9 s into a 26.7 s results body that loops (loopStart where the body begins). Only the last link of an encounter reaches the results screen, so only the last link stings. |
| `victory-ffx2` | FFX-2 | VX-L1 | 2.40 MB | 0.99 MB | The results screen of every FFX-2 chapter except IV (5, 6, 11, 13, 15, 16) and the hidden Leblanc preview and Experiment, on a win: a fanfare opening of 7.8 s into a 38.0 s results body that loops. |
| `boss-jecht` | FFX | JE-A | 3.53 MB | 1.64 MB | Chapter III, Braska's Final Aeon, battle 1 (Jecht). |
| `boss-yu-yevon` | FFX | YY-A | 6.42 MB | 1.50 MB | Chapter III, Braska's Final Aeon, battle 2 (Yu Yevon and the possessed aeons). |
| `boss-vegnagun` | FFX-2 | VG-A | 3.07 MB | 1.51 MB | Chapter V, Vegnagun, links 1 to 4 (tail, leg, body, head). The hidden Experiment no longer plays it (it has boss-experiment). |
| `boss-shuyin` | FFX-2 | SH-A | 3.32 MB | 1.51 MB | Chapter V, Shuyin (link 5). The Den of Woe no longer plays it as a stand-in (it has boss-den-of-woe). |
| `boss-seymour-macalania` | FFX | SA-A | 3.77 MB | 1.41 MB | Chapter VII, Seymour and Anima. Chapter X has its own (boss-seymour-natus) since batch 1. |
| `boss-evrae` | FFX | EV-A | 2.72 MB | 1.78 MB | Chapter VIII, Evrae. Chapters XVII and XVIII have their own since batch 1. This file replaces the one whose loop points batch 1 re-cut. |
| `boss-yojimbo` | FFX | YO-A | 2.65 MB | 1.52 MB | Chapter IX, Yojimbo. Chapter XIV has its own (boss-isaaru) since batch 1. |
| `scene-bevelle-underground` | FFX-2 | BU-2 | 3.21 MB | 1.49 MB | The Bevelle Underground bed AND the Paragon fight (decision 52g): Chapter IV's scene, Chapter XIII's walk down and Paragon (phase 1), Chapter XV's and Chapter XVI's field bed, the hidden Experiment's scene. Not Chapter VI or the hidden Leblanc preview (they have scene-chateau-leblanc). |
| `scene-gagazet` | FFX | GA-1 | 3.01 MB | 1.36 MB | The Gagazet bed: Chapters I, IX, X, XIV and the hidden Sinspawn Gui chapter. |
| `scene-zanarkand-dome` | FFX | ZD-1 | 3.94 MB | 1.06 MB | Chapter II's scene. |
| `scene-dreams-end` | FFX | DE-1 | 3.16 MB | 1.31 MB | Chapter III's scene and Chapter XII's. |
| `scene-macalania-temple` | FFX | MT-1 | 1.97 MB | 1.20 MB | Chapter VII's scene. |
| `scene-fahrenheit` | FFX | FH-1 | 2.41 MB | 1.21 MB | Chapter VIII's scene and Chapters XVII's and XVIII's. |
| `scene-farplane` | FFX-2 | FP-1 | 3.49 MB | 1.39 MB | The Farplane bed: Chapters V, XI, XVI's Abyss and Chapter VI's after-scene. |
| `ending-ffx` | FFX | EN-FFX | 3.60 MB | 1.49 MB | Chapter III's coda (the FFX ending). |
| `ending-ffx2` | FFX-2 | EN-FFX2 | 3.58 MB | 1.76 MB | Chapter V's coda (the FFX-2 ending). |

New cues (nine), over the composition each stands in for (the synth fallback when the MP3 cannot load):

| Cue | Game | Pick | Over | Bytes | Plays in |
|---|---|---|---|---|---|
| `defeat-ffx` | FFX | DF-A | `pause` | 0.13 MB | The defeat panel of every FFX chapter and the hidden Sinspawn Gui chapter, once: 7.0 s of cue, then 2 s of held silence (oneShot). Not on a withdrawal. |
| `defeat-ffx2` | FFX-2 | DX-A | `scene-farplane` | 0.11 MB | The defeat panel of every FFX-2 chapter and the hidden Leblanc preview and Experiment, once: 6.0 s of cue, then 2 s of held silence (oneShot). Not on a withdrawal. |
| `victory-bahamut` | FFX-2 | VB-A | `pause` | 0.51 MB | Chapter IV's results screen (FFX-2, Bahamut), on a win: a quiet, bittersweet resolve of 6.5 s into a 25.3 s body that loops, under a results screen that stays silent in every other way (no pose, no tally flourish, no quips). |
| `boss-challenge` | FFX | CH-A | `boss-yunalesca` | 1.56 MB | Chapter II's Yunalesca (all three forms) and the hidden Sinspawn Gui chapter's second fight: the game plays one 'Challenge' track at both, so one cue. Chapter I keeps boss-seymour (Bailey chose it by ear); chapter-select keeps its loop. |
| `boss-seymour-omnis` | FFX | OM-A | `boss-seymour` | 1.52 MB | Chapter XII, Seymour Omnis (it played Chapter I's boss-seymour as a stand-in). Chapter I keeps boss-seymour. |
| `boss-den-of-woe` | FFX-2 | DW-A | `boss-shuyin` | 1.48 MB | Chapter XV, the Den of Woe, all three links (it played Chapter V's boss-shuyin as a stand-in). |
| `boss-gui` | FFX | G1-A | `boss-dread` | 1.79 MB | The hidden Sinspawn Gui chapter, fight 1 (it played boss-dread). |
| `boss-experiment` | FFX-2 | EX-A | `boss-ffx2-aeon` | 1.56 MB | The hidden Experiment (FFX-2), both acts: one cue, which carries on across the act change (Act I played boss-ffx2-aeon and Act II boss-vegnagun). |
| `scene-chateau-leblanc` | FFX-2 | CB-1 | `scene-bevelle-underground` | 1.80 MB | Chapter VI (FFX-2) and the hidden Leblanc preview: the chateau's pre scene (it played Chapter IV's cathedral-basement bed). No other chapter. |

### Victory (53d, 58f)

How it played before: the presenter's own sting (the SFX `victory-fanfare`) plays at the victory event of the LAST link only (`BattlePresenterBeats.victory`: `if (!ctx.moreLinks)`; `presenter-victory-seam.test.ts` pins it, a chained link takes its theme on instead), the post scene runs to its `results()` marker, and `BattleScreenFlow.showResults` then starts the chapter's `music.victory` cue with a 0.4 s fade. The old cues were already a fanfare into a loop (`loopStart` after the fanfare). So the intro plus loop is the manifest's own: `victory-ffx` (VF-L2) opens with 7.9 s of fanfare and loops a 26.7 s body, `victory-ffx2` (VX-L1) 7.8 s and 38.0 s, `victory-bahamut` (VB-A) 6.5 s of resolve and 25.3 s; the player loops `loopEnd` back to `loopStart` (`clampLoopPoints` keeps them, pinned in `results-music.test.ts`). No code decides where the body starts. Only the last link reaches `showResults`, so "only the last link stings" holds without a new rule; `results-music.test.ts` also pins that the chain and the presenter never request a victory or defeat cue.

Chapter IV: its results screen is silent (no pose, no tally flourish, no quips: `isSilentResultsChapter`), and the script cuts the music before `results(true)`. `showResults` took "silent" from `chapter.music.victory === undefined`, so giving Chapter IV a cue would have turned its screen loud. `silent` now comes from `resultsScreenSilent(chapter)` (`isSilentResultsChapter` or no cue), Chapter IV's record has `victory: 'victory-bahamut'`, and the screen is exactly as silent as before with the quiet resolve under it. The pick's note "replaces the fanfare there only" is read as: instead of `victory-ffx2`, which the critic's PR-0410 asked about; Chapter IV had no fanfare to replace.

### Defeat (58e)

The defeat flow: the presenter's `defeat` beat (party KO'd, screen darkens, no music change) -> `playChapter` gets `outcome: 'defeat'` -> `showResults` puts up the results panel (RETRY / CHAPTER SELECT) -> the choice loops back through prep (`continue`) or ends the run. Today the battle theme just stops: `BattleScreen.exit()` calls `audio.stopMusic(0.6)` when the results screen replaces it. The cue is asked for AFTER that swap (asked for earlier, the exit would cut it and drop a still-decoding request), so the theme fades under it and the cue enters as the theme goes; `playMusic(..., { fade: 0.3 })`. It ends with the player's choice: `handle.end()` fades a defeat cue that is still sounding or still loading (0.5 s; `stopMusic` also bumps the request id, so a late-arriving MP3 is dropped), and does nothing if something else has been asked for since. A withdrawal (`escape`, the FFX stalemate) plays none. The cue is a one-shot: 7.0 s (FFX) or 6.0 s (FFX-2) of cue and 2 s of digital silence that the player loops (`oneShot: true`). Unit-tested for both games, including a request that finishes decoding after the RETRY (`results-music.test.ts`).

### Retired MP3s

- `boss-ffx2-aeon` (4.07 MB): its last chapter, the hidden Experiment, has boss-experiment (batch 1 had moved Chapters IV, VI, XI, XIII, XVI off it).
- `boss-dread` (2.62 MB): its only chapter, the hidden Sinspawn Gui, fight 1, has boss-gui.
- `boss-yunalesca` (3.06 MB): its only chapter, Chapter II, has boss-challenge.

`git rm`'d, manifest entries removed, compositions kept as the synth fallback of the cues over them (`RETIRED_MUSIC_CUES`), left out of the pause jukebox, skipped by `render.mjs` unless named.

### Budget

`node tools/audio/qa.mjs` (no cue finding, no manifest problem): shipped audio **100,798,034 bytes (100.80 MB) before**, **67,702,100 bytes (67.70 MB) after** the music (budget 105 MB, unchanged); the music alone went from 93,196,705 to 60,100,771 bytes (the old synth-era renders were V0 files of 2 to 6 MB; the originals are 0.5 to 1.8 MB).
## Part 2: SFX parity, the loose set (18 recorded originals in six packs)

Decision: the driver's call (in this lane's brief) installs the LOOSE set of the generation run (`D:/Tools/pyrefly-scratch/2026-10-12/sfx-gen`: the 7 picks that passed every check and the 11 that came within 1.5 times the tolerance) and no other take. The run was stopped by the API key's own quota; 214 events were planned, 153 generated, 7 pass strictly, 11 are near, 135 failed, 61 were skipped (36 HOLD rows, 16 rows no battle moment answers, 9 no chapter carries), so most of the parity set is still the v2 synth sprite. Nothing here is a listening verdict (rule 13); the near picks are best efforts and Bailey's ear decides them.

Game case, from the pack's own game (rule 14): FFX only for the `ffx-` packs (9 cues), FFX-2 only for the `ffx2-` packs (9 cues); the repack plan's idempotence is both.

| Pack (quality, bytes) | Loaded by | Cue | Spec row | Pass | Active ms (got/row) | Centroid Hz (got/row) | LUFS (got/row) |
|---|---|---|---|---|---|---|---|
| `ffx-core` (q3, 329,971) | every FFX chapter | `cursor-move` | `ffx.ui.tick` | near | 280 / 150 | 1955 / 2700 | -18.8 / -18.8 |
| `ffx-core` (q3, 329,971) | every FFX chapter | `swing-katana` | `ffx.weapon.katana.swing` | near | 305 / 365 | 1829 / 2200 | -18 / -18 |
| `ffx-core` (q3, 329,971) | every FFX chapter | `fire-2` | `ffx.fire.t2` | strict | 1505 / 1890 | 135 / 200 | -14.3 / -14.3 |
| `ffx-core` (q3, 329,971) | every FFX chapter | `water` | `ffx.water.t1` | strict | 1860 / 1765 | 1389 / 1800 | -16.6 / -16.6 |
| `ffx-core` (q3, 329,971) | every FFX chapter | `shell` | `ffx.shell` | near | 1450 / 1615 | 9332 / 8700 | -16 / -16 |
| `ffx-core` (q3, 329,971) | every FFX chapter | `buff-generic` | `ffx.buff` | near | 1515 / 1690 | 7895 / 7200 | -16.9 / -16.9 |
| `ffx-core` (q3, 329,971) | every FFX chapter | `darkness` | `ffx.darkness` | strict | 920 / 1030 | 64 / 100 | -14.2 / -14.2 |
| `ffx-lady` (q5, 111,935) | Chapter II (Yunalesca) | `lady-metamorph` | `ffx.boss.lady.metamorph` | near | 10825 / 11825 | 255 / 400 | -14 / -14 |
| `ffx-core` (q3, 329,971) | every FFX chapter | `meteor` | `ffx.dark.meteor` | strict | 6225 / 6140 | 229 / 200 | -14 / -14 |
| `ffx2-core` (q3, 184,746) | every FFX-2 chapter | `hit-dagger` | `ffx2.lb.thief.hit` | near | 1695 / 2251 | 8353 / 9200 | -14.1 / -14.1 |
| `ffx2-core` (q3, 184,746) | every FFX-2 chapter | `cursor-move-x2` | `ffx2.ui.tick` | near | 280 / 170 | 1955 / 2700 | -18.8 / -18.8 |
| `ffx2-core` (q3, 184,746) | every FFX-2 chapter | `confirm-x2` | `ffx2.ui.confirm` | near | 280 / 170 | 1955 / 2700 | -18.8 / -18.8 |
| `ffx2-core` (q3, 184,746) | every FFX-2 chapter | `menu-page-x2` | `ffx2.ui.page` | near | 280 / 170 | 1955 / 2700 | -24 / -24 |
| `ffx2-core` (q3, 184,746) | every FFX-2 chapter | `flare-x2` | `ffx2.flare` | strict | 3710 / 4695 | 46 / 100 | -15 / -15 |
| `ffx2-core` (q3, 184,746) | every FFX-2 chapter | `cura-x2` | `ffx2.cura` | near | 2430 / 3103 | 769 / 900 | -15 / -15 |
| `ffx2-machina` (q5, 13,852) | Chapter V (Vegnagun) | `machina-destroy` | `ffx2.boss.machina.ko` | strict | 1955 / 2356 | 122 / 100 | -14 / -14 |
| `ffx2-bahamut` (q5, 20,096) | Chapter IV (Bahamut) | `boss-bahamut` | `ffx2.boss.bahamut` | strict | 2685 / 2942 | 215 / 300 | -14 / -14 |
| `ffx2-shuyin` (q5, 29,881) | Chapter V (Shuyin) | `boss-shuyin` | `ffx2.boss.shuyin` | near | 2445 / 4973 | 57 / 100 | -14.1 / -14.1 |

The packs hold the cue the game asks for by name (`tools/audio/sfx-parity-names.mjs` refuses a name no hook asks for), each at its row's level within the unit test's +/-0.3 LUFS and under -1.1 dBTP with no trim. The three `ffx2.ui.*` rows share one take (`ffx.ui.tick.v9`) mastered at each row's own level. The cue names are the ones the presenter's event table already asks for, so no game code changed.

### What was done, with the repo's own tools

1. `python -I tools/audio/sfx-parity-sprite.py --pack <pack> --picks packs/<pack>.loose.picks.json --q <3|5> --install`: the core packs (`ffx-core`, `ffx2-core`) at q3 and the four boss packs at q5 (58c), core first, boss last. Each install checks the budget and the 5 MB gate; the manifest was rewritten by the packer (it adds the six packs and nothing else; the music and first-sprite entries are identical to before, checked by parsing both).
2. `node tools/audio/sfx-parity-layout.mjs` (the plan for the whole set): it fits and no pack is unloaded; `--coverage` finds no row heard in a chapter that does not load its pack.
3. `node tools/audio/sfx-parity-repack.mjs`: with the two core packs shipped it retires three stand-ins, **buff-generic, water (FFX) and hit-dagger (FFX-2)**, because every way the scripted fight reaches them ends at a recorded original in the game's core pack. `--write` regenerated `src/audio/sfxV2/retired.ts`; `D:/Tools/venvs/sfx-0930/Scripts/python.exe tools/audio/sfx-v2-sprite.py --exclude --install` rebuilt `sprite-v2.mp3` (100 -> 97 cues, 4,891,552 -> 4,725,444 bytes); `node --experimental-transform-types tools/audio/sfx-parity-mix.mjs` re-derived `parityTrims.ts` (the two FFX trims of the retired cues went with them).
4. `node tools/audio/qa.mjs --only=sfx`: 0 findings (each pack's peak is -2.85 dBTP or lower, nothing clipped).

**A defect in the repack tool, fixed:** `planRetirement` planned on the sprite as it is now, so on the repacked sprite it planned nothing, `--write` would have regenerated `retired.ts` as the empty list, and `--check` (and `audio-sfx-parity-repack.test.ts`) could never pass again. The plan now takes `already` (the key space minus the sprite): those names stay in the generated list and the exclude file and are reported apart from what is retired now. A second run says `retire 0: (nothing)` and `already out of the sprite (retired.ts keeps them): buff-generic, hit-dagger, water`; `--check` says `retired.ts is current`. Tests: one new unit test on the pure plan; the shipped-list tests say what is true now.

### The golden pin: not re-recorded

`tests/fixtures/sfx-parity-pin.golden.json` pins what the presenter asks the mixer for (key, volume, delay, pan) over the scripted fight. A recorded original is chosen inside the mixer from the `events` option, which the pin leaves out on purpose, and the repack changes only which names the sprite holds, so no scenario moved: `audio-sfx-parity-pin.test.ts` passes on the unchanged golden (the FFX half and the FFX-2 half). The task said to re-record only the events that now play a recorded original, the way the test header says; none of them changes the trace, so nothing was re-recorded. The events that now play a recorded original are the 18 spec rows in the table above (FFX: `ffx.ui.tick`, `ffx.weapon.katana.swing`, `ffx.fire.t2`, `ffx.water.t1`, `ffx.shell`, `ffx.buff`, `ffx.darkness`, `ffx.boss.lady.metamorph`, `ffx.dark.meteor`; FFX-2: `ffx2.lb.thief.hit`, `ffx2.ui.tick`, `ffx2.ui.confirm`, `ffx2.ui.page`, `ffx2.flare`, `ffx2.cura`, `ffx2.boss.machina.ko`, `ffx2.boss.bahamut`, `ffx2.boss.shuyin`).

### Budget and record

Shipped audio (`qa.mjs`, all of it): **100,798,034 bytes before this branch, 68,226,473 bytes (68.23 MB of 105 MB) after both parts**: the music 60,100,771, the first sprite 2,709,777, the v2 sprite 4,725,444 and the six packs 690,481. `docs/audio/sfx-parity-record.json` holds the 18 shipped cues (the exact request, the character cost, both hashes, the measurements, strict or near) and the 295 turned-down takes; `CREDITS.md` carries every prompt as sent.

## Checks run

- `npx tsc --noEmit` (the repo's own: `node node_modules/typescript/bin/tsc --noEmit -p .`): clean after every step.
- `node tools/orphans.mjs`: 1,560 modules, 36 orphaned, none of them a file of this branch (`resultsMusic.ts` is reachable from `BattleScreenFlow`).
- The audio, music, themes, flow, presenter, results, chapter, story and chapters test files (benches left out), the pause, ui, cutscene and screen files, then **the full suite once**, last: 1,138 files (1,124 passed, 13 skipped, 1 failed) and 17,709 tests (17,635 passed, 72 skipped, 1 todo, 1 failed) in 2,083 s on two workers, with other agents' runs on the same machine. The one failure, `learn-exploded-frame.test.ts` (it pinned `boss-yunalesca` as Chapter II's cue), was fixed and re-run alone: 10 of 10 pass. Every failure along the way was a test that pinned an old cue, an old total or the empty-packs world, and was updated to the new fact, never loosened.
- `node tools/audio/qa.mjs` (all of it): **100,798,034 bytes before the branch, 68,226,473 bytes (68.23 MB of 105 MB) after**, 41 music cues and 6 packs, 0 cue findings, 0 sfx findings, no manifest problem.

## Not done, guessed, or worth knowing

- **Chapter IV, "replaces the fanfare there only".** Chapter IV had no fanfare to replace: its results screen was silent and the script cuts the music before `results(true)`. I read the pick as PR-0410's question ("should the Chapter IV victory play `victory-ffx2`?") answered with VB-A instead, wired as a cue of its own under a screen that stays silent in every other way (pose, tally flourish, quips). That needed `silent` to stop following from an absent `music.victory` (`resultsScreenSilent`); two older tests that pinned "Chapter IV has no victory key" now pin the new fact. If Bailey wants the screen itself loud, `isSilentResultsChapter` is the one switch.
- **The Experiment's Act II.** VG-A's pick lists `ffx2-masterpiece-theatre (act 2)` among its chapters (today's user), EX-A's lists `boss-vegnagun (act 2)` as the cue it replaces. I followed EX-A and decision 47f ("one cue for the Experiment"): both acts play \`boss-experiment\`, and \`boss-vegnagun\` is Chapter V's alone. Act II asks for the same cue again with its 1.4 s fade; the mixer carries on instead of restarting it (a fake mixer in the test records both asks).
- **No defeat cue on a withdrawal** (the FFX stalemate, \`escape\`): it is not a defeat, and today's behaviour (the theme stops with the battle screen) is unchanged. One line in \`resultsCueFor\` if the driver wants it.
- **Fallbacks of the results cues** are existing scores that loop (\`pause\` for \`victory-bahamut\` and \`defeat-ffx\`, \`scene-farplane\` for \`defeat-ffx2\`), and only play if the MP3 cannot load. A one-shot's "play once" is the file's own 2 s of silence; the synth fallback would not stop.
- **The warm list.** \`chapterWarmCues\` now ends with the loss's cue (0.12 MB). The mixer keeps three decoded cues (\`evictionPlan\`, \`keep = 3\`), so the decoded buffer is dropped when the scene bed starts and the cue is decoded again at the defeat; what the warm buys is the fetch (the browser's cache), not the decode. Harmless, small, and easy to take out (\`chapterMusicWarm.ts\` and its test).
- **Not re-run:** the headless-browser decode proof (\`music-v2-browser-proof.mjs\`) on the new files; the batch-2 lane ran its own and found all 47 staged files decode to the same frames as ffmpeg. \`docs/audio/audition.html\` was not regenerated (it was last built at music v2 and carries none of the 2026-10-07 or 2026-10-10 cues either); its links to \`boss-ffx2-aeon.mp3\`, \`boss-dread.mp3\` and \`boss-yunalesca.mp3\` are dead now. Bailey's listening page for the music is the lane's artifact, not that file.
- **NOW.md, DECISIONS.md and ACTIONS.md are not touched** (the driver owns the ledgers and the other tree has uncommitted edits to them); the decisions this implements are already items 47, 52, 53, 58 and 61.
- **The manifest** was written as text by the house writer for the music (every other byte kept, CRLF kept) and by the packers for the SFX (\`sfx-parity-sprite.py\` and \`sfx-v2-sprite.py\` rewrite it whole with LF endings; with \`core.autocrlf\` git sees only the real changes: music and first-sprite entries identical to before, checked by parsing both).
- **An incident of mine, 01:28 EDT:** a hung \`python -\` call of mine made me run \`taskkill /F /IM python.exe\` once, which ended two python.exe processes (PIDs 54884 and 79692). One was my own call; the other was very probably the ComfyUI server of the overnight art lane: ComfyUI was not listening a minute later, and the \`PyreflyComfyUI\` task shows a restart at 01:32:41 and it is listening again. A render in flight at that moment was lost; nothing else was touched (Mirage's \`pythonw\` and the other lanes' processes were not python.exe). I did not restart anything myself and stopped using image-name kills.
- **Servers:** none started by me (no dev or preview server); the full suite and the QA runs have exited.
