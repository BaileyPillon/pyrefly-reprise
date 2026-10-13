# r45-audio: music batch 2 (27 ElevenLabs originals), the results screen's cues, and the SFX parity loose set (18 cues)

Written 2026-10-13 by a Sonnet sub-agent of the release driver. Branch `r45-audio`, from origin/r43-rc `7b2582e7`; sparse worktree `D:/pyrefly-r45-audio` (`node_modules` and `public/art` are junctions, both untracked: `cmd /c rmdir` each, no `/s`, before ever removing the tree). **Nothing is merged and nothing is deployed.** `public/audio` is tracked in git, so the branch carries the files.

Authority (Bailey): "you need to use eleven labs"; "for music create originals that closely resemble the mood and atmosphere of the songs playing at each respective encounter"; 2026-10-10 23:05 EDT: "i'll go with all your recommendations even as to music and sound effects. you recommend an dchoose it please. this is extremely important."; 2026-10-12: "I'll go with all of your recommendations". The driver's decisions are items 47, 52, 53, 58 and 61 in `D:/Tools/pyrefly-scratch/2026-10-07/decisions-to-record.md`; the music is the batch-2 lane's `D:/Tools/pyrefly-scratch/2026-10-10/music-batch2` (27 picks) and the sound effects the SFX lane's `D:/Tools/pyrefly-scratch/2026-10-12/sfx-gen` (the loose set, 18 cues). Nobody has heard any of it (rule 13): the picks are the driver's, by brief and measurement, and Bailey can overrule any of them by ear.

Commits, in order: `fe7fb87c` (audio tooling), `974ee7a5` (music batch 2), then the handoff note and the SFX commits listed under Part 2.

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
