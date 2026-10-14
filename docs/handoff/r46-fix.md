# r46-fix: the three findings of the focused review of r46-rc 0b0571d1 (FFX-2's defeat sound, the levels of the new takes, the paths in the sidecars)

Written 2026-10-13 by a Sonnet sub-agent of the release driver. Branch `r46-fix`, from origin/r46-rc `0b0571d1`; worktree `D:/pyrefly-r46-fix` (`node_modules` and `public/art` are junctions, both untracked: `cmd /c rmdir` each, no `/s`, before ever removing the tree). **Nothing is merged and nothing is deployed.** Parts 1 and 2 are pushed; part 3 was stopped (below) and has no commit.

Authority: the driver's brief under Bailey's standing delegation of the music and sound choices ("keep going please ill go with all your recommendations even for music and sound."), the standing rules "every change is game-aware" (AGENTS.md rule 14) and "public repo and site: no personal or PC details". Nobody has heard any of this (rule 13): the levels are by measurement and the ear can overrule every one.

| Part | Finding | Game | What | Commit |
|---|---|---|---|---|
| 1 | FOC46-02 | **FFX-2 only** is affected and fixed (FFX keeps its recorded original); the planner fix is shared plumbing, both | `dissolve-pyreflies` is back in the v2 sprite; the repack plan counts the games that ask for a cue, not only the cue's tag | 6fa0b979 |
| 2 | FOC46-03 | per row, each game its own: 9 FFX rows and 3 FFX-2 rows moved, 18 kept | 12 of the 30 new takes re-levelled to within 1.5 dB of the sound they replace; Petrify under the lane's limiter | 5b17456d |
| 3 | FOC46-01 | both (build plumbing) | **stopped, no commit**: the game reads path-bearing sidecars | none |

## Part 1: FFX-2's enemy-defeat sound (FOC46-02, FFX-2 only)

**Cause.** `dissolve-pyreflies` is the defeat sound of both games (`battleVoice.ts`, `ko()`: "Fiends disperse their pyreflies in both games"), but the set tags the cue FFX (`V2_CUES`). The final repack (`tools/audio/sfx-parity-retire.mjs`) decided which games to check from that tag alone, saw only FFX's scripted fight, found FFX's new recorded original in `ffx-core`, and took the v2 recording out of the sprite. FFX-2 asks for the cue with an empty event list (it has no original of its own, so no pack is consulted), and with the cue out of the sprite every ordinary FFX-2 defeat fell to the first-bank cue where the live build plays the v2 recording.

**Fix, the smallest that fits the design.** (a) `planRetirement` now judges a cue in the games its tag names **and every game whose fight asked for it**, and judges the names an earlier repack took out by the same rules, returning those that no longer qualify as `reinstate` (`--check` fails on one, and `--write` leaves it off the list). (b) `retired.ts` holds eight names; `sprite-v2.mp3` was rebuilt from the same set with the eight excluded (`sfx-v2-sprite.py`; the rebuild with the nine excluded is byte-identical to the shipped file, so the toolchain is deterministic): 92 cues, +105,208 bytes. The manifest differs by the one added cue (4.0 s, -22 LUFS, -14.26 dBTP, the same as live's), the trim table is unchanged, and the restored slice matches live's slice sample for sample up to the codec (same RMS, lag 0, 28 dB signal-to-difference where an untouched cue re-encoded in the same way reads 22 dB). FFX still plays its recorded original from `ffx-core`.

**The audit** (the real fights of both games through the real mixer, `tools/audio/sfx-answers-audit.mjs --base=d5bf2206`; the code under `src/audio` is the same on live and here except `retired.ts`, so a difference is the manifest's). Across 219 distinct asks and every pack set a chapter loads, the dissolve in FFX-2 was the **only** ask that lost its recording; none does now. The nine retired names, live against the candidate and against this tree:

| cue | game | ask (original names tried in order) | live d5bf2206 | candidate 0b0571d1 | r46-fix |
|---|---|---|---|---|---|
| `buff-generic` | FFX | buff-generic | ffx-core original `buff-generic` | ffx-core original `buff-generic` | ffx-core original `buff-generic` |
| `buff-generic` | FFX | regen > buff-generic | ffx-core original `buff-generic` | ffx-core original `buff-generic` | ffx-core original `buff-generic` |
| `buff-generic` | FFX-2 | never asked | - | - | - |
| `dissolve-pyreflies` | FFX | dissolve-pyreflies | v2 recording `dissolve-pyreflies` | ffx-core original `dissolve-pyreflies` | ffx-core original `dissolve-pyreflies` |
| `dissolve-pyreflies` | FFX-2 | (none: no pack consulted) | v2 recording `dissolve-pyreflies` | **FIRST BANK** `dissolve-pyreflies` | v2 recording `dissolve-pyreflies` |
| `gun-burst` | FFX | never asked | - | - | - |
| `gun-burst` | FFX-2 | gun-burst | v2 recording `gun-burst` | ffx2-core original `gun-burst` | ffx2-core original `gun-burst` |
| `hit-dagger` | FFX | never asked | - | - | - |
| `hit-dagger` | FFX-2 | hit-dagger | ffx2-core original `hit-dagger` | ffx2-core original `hit-dagger` | ffx2-core original `hit-dagger` |
| `hit-greatsword` | FFX | never asked | - | - | - |
| `hit-greatsword` | FFX-2 | hit-greatsword | v2 recording `hit-greatsword` | ffx2-core original `hit-greatsword` | ffx2-core original `hit-greatsword` |
| `hit-gun` | FFX | never asked | - | - | - |
| `hit-gun` | FFX-2 | hit-gun | v2 recording `hit-gun` | ffx2-core original `hit-gun` | ffx2-core original `hit-gun` |
| `hit-katana` | FFX | hit-katana | v2 recording `hit-katana` | ffx-core original `hit-katana` | ffx-core original `hit-katana` |
| `hit-katana` | FFX-2 | never asked | - | - | - |
| `hit-spear` | FFX | hit-spear | v2 recording `hit-spear` | ffx-core original `hit-spear` | ffx-core original `hit-spear` |
| `hit-spear` | FFX-2 | never asked | - | - | - |
| `water` | FFX | water | ffx-core original `water` | ffx-core original `water` | ffx-core original `water` |
| `water` | FFX | water-2 > water | ffx-core original `water` | ffx-core original `water` | ffx-core original `water` |
| `water` | FFX | water-3 > water-2 > water | ffx-core original `water` | ffx-core original `water-3` | ffx-core original `water-3` |
| `water` | FFX-2 | never asked | - | - | - |

(The other eight stay retired because every ask of both games ends at an original in the game's core pack, as on the candidate; `hit-gun`, `gun-burst`, `hit-greatsword`, `hit-katana`, `hit-spear` changed from the v2 recording to the lane's recorded original on purpose, in the game that asks for them.)

**Pinned by** `tests/unit/audio-sfx-retired-answers.test.ts` (every `v2:` ask of both games' scripted fights is answered by a recording in every pack set, never the first bank or the synth; FFX's defeat is the `ffx-core` original, FFX-2's the v2 cue), the planner cases in `audio-sfx-parity-repack.test.ts`, and the helper `tests/unit/helpers/sfxAnswer.ts`. A negative control (`control-answer.mjs`) shows the helper answering the candidate's FFX-2 defeat with the first bank.

## Part 2: the levels of the new takes (FOC46-03, per row)

**The rule** (the driver's): a new take ships within 1.5 dB of the sound it replaces on live, as the game plays it. **The measure** is the reviewer's (integrated loudness of the slice padded with silence, overall RMS, true peak) with two corrections: (1) the stand-in is measured **with its play-time P1 trim** (`parityTrims.ts`: a parity original is played untrimmed, a v2 slice takes its trim), and (2) the slice is cut out of the **whole decoded file by sample index**, as the game plays it. The review compared the chant with the untrimmed stand-in: as played, live's chant sits 4.9 dB under its sprite level, so the chant was never 3.0 LUFS under; it was 1.9 over. The review's `-ss offset` input seek on a VBR MP3 starts a few tens of ms off and misses the first part of a menu tick, so its error, cancel and menu rows read 2 to 5 dB low (they are within 1.3 dB). The rule is applied to the integrated loudness; RMS is in the table but follows the length of the tail (a 2.4 s Gunner hit has a lower RMS than a 0.6 s one at the same loudness) and is not the rule. `tools/audio/sfx-levels-audit.mjs --base=d5bf2206 --work=<dir>` reproduces the table.

**What was done.** 18 rows were inside the rule and kept. 12 were outside (or within 0.15 dB of the edge, the meter printing one decimal) and moved to 1.0 dB from live's level, on the side they were on: a plain gain on the lane's mastered file, except Petrify, which needed +14.2 dB of gain under the lane's own lookahead true-peak limiter (3 ms look-ahead, 80 ms release, -1.6 dBTP) to come up 7.2 dB, because its 30 dB crest left no headroom. The three packs were rebuilt by the packer from the lane's inputs with the re-levelled file in place of the lane's (the packer reproduces the shipped `ffx-core` byte for byte from unchanged inputs); the manifest differs in those 12 cues' levels only. No row had to be reverted; the worst remaining gap is 1.3 dB (and the final aeon's wave, which replaces two stand-ins 3.4 dB apart, is 2.1 from one and 1.3 from the other). `docs/audio/sfx-parity-levelfix.json` is the table, the record and CREDITS carry the new mastered hashes, and `audio-sfx-levels-2026-10-13.test.ts` pins the table to the manifest, the record and CREDITS.

| row | game | pack:cue | replaces on live | before (LUFS / RMS dB / TP dBTP) | after (LUFS / RMS dB / TP dBTP) | gap before > after (LUFS) | done |
|---|---|---|---|---|---|---|---|
| `ffx.ui.cancel` | FFX | ffx-core:cancel | cancel@v2 +1.3 dB trim (-25.3 LUFS) | -25.8 / -28.55 / -10.3 | -25.8 / -28.55 / -10.3 | -0.5 > -0.5 | kept |
| `ffx.ui.error` | FFX | ffx-core:error | error@v2 +6.9 dB trim (-20.1 LUFS) | -19.6 / -17.83 / -2.4 | -19.6 / -17.83 / -2.4 | +0.5 > +0.5 | kept |
| `ffx.weapon.katana.hit` | FFX | ffx-core:hit-katana | hit-katana@v2 (-19.9 LUFS) | -16.2 / -17.62 / -2.6 | -19 / -20.38 / -5.2 | +3.7 > +0.9 | re-levelled -2.7 dB |
| `ffx.weapon.spear.hit` | FFX | ffx-core:hit-spear | hit-spear@v2 (-18.4 LUFS) | -19.5 / -18.33 / -1.6 | -19.5 / -18.33 / -1.6 | -1.1 > -1.1 | kept |
| `ffx.item.grenade` | FFX | ffx-core:item-grenade | explosion@v2 +0.1 dB trim (-19.5 LUFS) | -18 / -19.91 / -5.8 | -18.4 / -20.42 / -6.4 | +1.5 > +1.1 | re-levelled -0.5 dB |
| `ffx.cure.t1` | FFX | ffx-core:cure | cure@v2 -4.1 dB trim (-22.4 LUFS) | -23.8 / -31.4 / -10.6 | -23.4 / -31.04 / -9.9 | -1.4 > -1 | re-levelled +0.4 dB |
| `ffx.cure.t2` | FFX | ffx-core:cure-2 | cure@v2 -4.1 dB trim (-22.4 LUFS) | -19.4 / -28.49 / -10.5 | -21.4 / -30.49 / -12.8 | +3 > +1 | re-levelled -2 dB |
| `ffx.item.ether` | FFX | ffx-core:item-ether | item-use@v2 +0.3 dB trim (-20.3 LUFS) | -20.4 / -28.68 / -13.1 | -20.4 / -28.68 / -13.1 | -0.1 > -0.1 | kept |
| `ffx.life` | FFX | ffx-core:life | phoenix-down@v2 -0.7 dB trim (-20.5 LUFS) | -18.8 / -25.72 / -9.4 | -19.4 / -26.4 / -10.4 | +1.7 > +1.1 | re-levelled -0.7 dB |
| `ffx.petrify` | FFX | ffx-core:petrify-shatter | petrify-shatter@v2 (-16.4 LUFS) | -24.8 / -31.12 / -1.6 | -17.6 / -23.37 / -1.2 | -8.4 > -1.2 | re-levelled +14.17 dB gain under the lane's limiter |
| `ffx.slow` | FFX | ffx-core:slow | slow@v2 +1 dB trim (-17.4 LUFS) | -16.2 / -18.96 / -5.8 | -16.2 / -18.96 / -5.8 | +1.2 > +1.2 | kept |
| `ffx.thunder.t3` | FFX | ffx-core:thunder-3 | thunder@v2 -3.6 dB trim (-24.1 LUFS) | -16.9 / -20.11 / -5.8 | -23.1 / -26.3 / -12.1 | +7.2 > +1 | re-levelled -6.2 dB |
| `ffx.water.t3` | FFX | ffx-core:water-3 | water@ffx-core (-20.6 LUFS) | -18.4 / -23.69 / -6.8 | -19.6 / -24.91 / -7.8 | +2.2 > +1 | re-levelled -1.2 dB |
| `ffx.ko.fiend` | FFX | ffx-core:dissolve-pyreflies | dissolve-pyreflies@v2 (-24.7 LUFS) | -25.8 / -27.72 / -18.3 | -25.8 / -27.72 / -18.3 | -1.1 > -1.1 | kept |
| `ffx2.ui.cancel` | FFX-2 | ffx2-core:cancel-x2 | cancel-x2@v2 +1.3 dB trim (-25 LUFS) | -25.8 / -28.55 / -10.3 | -25.8 / -28.55 / -10.3 | -0.8 > -0.8 | kept |
| `ffx2.ui.error` | FFX-2 | ffx2-core:error-x2 | error-x2@v2 +6.9 dB trim (-20.1 LUFS) | -19.6 / -17.84 / -2.4 | -19.6 / -17.84 / -2.4 | +0.5 > +0.5 | kept |
| `ffx2.ui.close` | FFX-2 | ffx2-core:menu-close-x2 | menu-close-x2@v2 (-27.3 LUFS) | -26.9 / -29.71 / -11.7 | -26.9 / -29.71 / -11.7 | +0.4 > +0.4 | kept |
| `ffx2.ui.open` | FFX-2 | ffx2-core:menu-open-x2 | menu-open-x2@v2 (-27.1 LUFS) | -28.4 / -29.93 / -14.7 | -28.4 / -29.93 / -14.7 | -1.3 > -1.3 | kept |
| `ffx2.special.trigger` | FFX-2 | ffx2-core:gun-burst | gun-burst@v2 (-20.1 LUFS) | -19.9 / -22.35 / -9.5 | -19.9 / -22.35 / -9.5 | +0.2 > +0.2 | kept |
| `ffx2.lb.warrior.hit` | FFX-2 | ffx2-core:hit-greatsword | hit-greatsword@v2 (-17.6 LUFS) | -16.3 / -24.2 / -5.7 | -16.3 / -24.2 / -5.7 | +1.3 > +1.3 | kept |
| `ffx2.lb.gunner.hit` | FFX-2 | ffx2-core:hit-gun | hit-gun@v2 (-18 LUFS) | -15.4 / -22.35 / -4.7 | -17.1 / -23.96 / -6.4 | +2.6 > +0.9 | re-levelled -1.6 dB |
| `ffx2.cure` | FFX-2 | ffx2-core:cure-x2 | cure-x2@v2 +1 dB trim (-17.3 LUFS) | -17.4 / -25.03 / -5.8 | -17.4 / -25.03 / -5.8 | -0.1 > -0.1 | kept |
| `ffx2.death` | FFX-2 | ffx2-core:death | status-applied@v2 (-26.9 LUFS) | -21.2 / -25.43 / -8.6 | -25.8 / -30.05 / -13.2 | +5.7 > +1.1 | re-levelled -4.7 dB |
| `ffx2.cast.chant` | FFX-2 | ffx2-core:magic-charge-x2 | magic-charge-x2@v2 -4.9 dB trim (-23.7 LUFS) | -21.8 / -28 / -13.2 | -22.7 / -28.92 / -14 | +1.9 > +1 | re-levelled -0.9 dB |
| `ffx2.boss.leg` | FFX-2 | ffx2-machina:boss-leg | machina-roar@v2 (-18.5 LUFS) | -17.8 / -18.26 / -4.4 | -17.8 / -18.26 / -4.4 | +0.7 > +0.7 | kept |
| `ffx2.boss.shuyin` | FFX-2 | ffx2-shuyin:boss-shuyin | boss-shuyin@ffx2-shuyin (-17.1 LUFS) | -17.3 / -18.09 / -4.6 | -17.3 / -18.09 / -4.6 | -0.2 > -0.2 | kept |
| `ffx.boss.flux.attack` | FFX | ffx-flux:swing-flux | swing-katana@v2 (-18.4 LUFS) | -18.9 / -17.45 / -3.3 | -18.9 / -17.45 / -3.3 | -0.5 > -0.5 | kept |
| `ffx.boss.flux.cleave` | FFX | ffx-flux:flux-cleave | magic-charge@v2 (-17.7 LUFS) | -18.4 / -22.12 / -6.3 | -18.4 / -22.12 / -6.3 | -0.7 > -0.7 | kept |
| `ffx.boss.fa.wave` | FFX | ffx-final-aeon:fa-wave | cure@v2 -4.1 dB trim (-22.4 LUFS) | -17 / -17.62 / -4.6 | -20.3 / -20.89 / -7.9 | +4.3 > +1 (and -1.3 from `flare@v2 +1 dB trim`) | re-levelled -3.27 dB |
| `ffx2.boss.shiva` | FFX-2 | ffx2-aeons:boss-shiva | boss-roar-aeon@v2 (-17.2 LUFS) | -17.5 / -26.78 / -6.9 | -17.5 / -26.78 / -6.9 | -0.3 > -0.3 | kept |

**Judgements this lane took, for the driver to keep or overrule** (each is one row of `sfx-parity-levelfix.json`; dropping it from the table and rebuilding with the lane's file restores the row's spec level):
- The rule was applied **both ways**. Of the twelve, nine were too **loud** (not too quiet) against the stand-in they replace, one was too quiet (Petrify) and two were nudged in from the edge (Cure at -1.4 and Grenade at +1.5, with the meter printing one decimal). The nine: Thundaga (+7.2), Death (+5.7), the final aeon's wave (+4.3), Auron's katana blow (+3.7), Cura (+3.0), the Gunner's hit (+2.6), Waterga (+2.2), the chant (+1.9) and Life (+1.7). Several are louder by the spec rows' design (a tier-3 spell, a real Death sound against the status bell it replaces) and now sit at their predecessor's level; the spec row levels are in `sfx-parity-mix.json`.
- The Gunner's hit is the most played new cue (209 in the scripted fight). It read the same as its stand-in on the loudest 400 ms (decision 52n, "today's level") and 2.6 dB louder on the integrated measure, with a lower RMS and peak: the metrics disagree. It follows the driver's rule (-1.6 dB); `audio-sfx-parity-mix.test.ts` was updated to say so.
- Petrify was 8.4 LUFS under live. The limiter that brings it back makes its crack less sharp (the record keeps the lane's `capped` flag and its 7.4 dB shortfall as history). Kimahri's spear was 1.1 dB under by the corrected measure and is untouched.

## Part 3: the paths in the painting sidecars (FOC46-01), **stopped before any commit**

The brief: leave provenance-only sidecars out of the build (or strip their path fields if something reads them), keep every JSON the game reads byte-identical, and add a gate. **The game reads path-bearing sidecars**, so the two requirements cannot both hold, and the brief says to stop at a judgement. What I found:

- **What the game requests.** `PaintedArt.tryLoadMeta` fetches `<image>.json` for every painting it loads (`preparePainting`: every pose, every backdrop), `portraits.ts` and `portrait.ts` fetch `art/characters/<id>/idle.json` and `art/portraits/<id>.json`, `restPoses.ts` and `chapterPanel.ts` fetch a plate's sidecar for its head or its focal point, and `ArtManifest.ts` fetches `art/manifest.json`. On the production build the walk from the title through the chapter board and party prep to the first command menu of FFX Chapter I requested **57 distinct art JSON files, all 200, all served byte for byte as the build holds them; 30 of the 57 carry a local path** (29 characters, 1 portrait). Over four walks of the production build (FFX Chapter I from the title to its first command menu; FFX Chapter I and FFX-2 Chapter IV through a won fight to the results; FFX-2 Chapter IV to the pause screen and out) the page requested **159 distinct art JSON files: all answered 200, all served byte for byte as the build holds them, 104 of them carrying a local path** (103 characters, 1 portrait). 0 404s and 0 console errors; the one failed request of the four is an image load the page itself cancelled on leaving the pause screen (`net::ERR_ABORTED`), not an HTTP error. The walks are `walk/net/*/result.json` (`artJson` lists every request with its status, size and sha-256).
- **What the build serves.** 1,365 art JSON files in the master folder; 952 carry a path of the build PC (staging, scratch and backup folders of a drive; one a user-profile folder), in 58 provenance field names (`candidateOf`, `status`, `controlnet.skeleton`, `ipadapter.images`, `img2img.init`, `installedFrom`, `scaleNote`, `replaces.backup`, `provenance`, `source` ...). No field the game reads (`width`, `height`, `baselineY`, `scale`, `anchorY`, `headTop`, `facing`, `focal`, `cropBox`, `canvas`) carries one, and nothing under `src/` names the path-bearing fields. No other text file of the build (the bundle, the stylesheet, the pages, the licences) carries a path.
- **The options.** (A) Leave out only sidecars the game never requests: cannot be proved from a walk (any painting loaded through `loadPainted` asks for its sidecar), and a miss turns into a missing baseline or scale. (B) **Recommended:** the build writes each shipped sidecar with the path substrings **inside string values** replaced (the matcher's drive and profile rules), every key and every non-path value untouched; prove it by a deep compare of the parsed file against its master with only the changed strings allowed, and gate the build on the matcher. The bytes of a read file then differ from the master's, which the brief forbids until the driver says so. (C) Strip the whole provenance fields, which also changes bytes and can lose information nothing needs.
- **A draft, not committed.** `tools/dist-local-paths.mjs` (the matcher: a drive-letter path or a user-profile path; a stricter drive rule for code so that `a:/regex/` in minified source does not trip it; the report names file, line and kind and never prints the path; `--dir <build>` exits 1 on a hit) and `tests/unit/dist-local-paths.test.ts` (29 cases: positive shapes, and https, ftp, data and file-less URLs, CSS declarations, SVG path data, times, regex literals, prose) are untracked in the worktree and copied to `D:/Tools/pyrefly-scratch/2026-10-13/r46-fix/part3-draft/`. The matcher passes its test and finds the 952 files on the baseline production build and nothing else. It is **not** wired into `tools/deploy-pages.mjs` (it would refuse every build until the sidecars are handled); the place is right after the `findUnshipped` check there. The scan of the art folder and the per-walk analysis are in the same scratch folder.

## Checks run

- `node node_modules/typescript/bin/tsc --noEmit -p .` (tsc 7.0.2): clean.
- Targeted vitest: every `tests/unit/audio*` file and `save-sfx*` (the SFX parity, v2, retire, repack, mix, levels, batch-2 and music files): 49 files, 840 tests, all pass; the new files are `audio-sfx-retired-answers` (5), `audio-sfx-levels-2026-10-13` (4) and the planner cases in `audio-sfx-parity-repack`.
- the full suite was not run
- `node tools/audio/qa.mjs`: **68.87 MB of the 105 MB budget**, 0 cue findings, 0 sfx findings; `sfx-parity-layout.mjs` fits; `sfx-parity-repack.mjs --check`: retired.ts is current; the prompt lint runs inside `audio-sfx-parity.test.ts` over all 319 prompts of the record (0 findings); `node tools/orphans.mjs`: 1,632 modules, 36 orphaned, the same 36 as before.
- **Production build and browser proof (parts 1 and 2).** `BASE_PATH='/'`, `node node_modules/vite/bin/vite.js build` from PowerShell (98 s, one `dist` of 10.06 GB; never `npm run build`), `vite preview` on port 5491, headless Chromium (`PYREFLY_BROWSER=gpu`), the reviewer's walker `walk2.mjs` (real keys from the title; `autoBattle('intended')` for the fight as a labelled setup hook), won fights, results screen reached, **0 console errors, 0 404s, 0 failed requests**:
  - FFX Chapter I (`seymour-flux`): packs requested and decoded ffx-flux, ffx-core (as expected; none of FFX-2's); 285 sounds in the log; the defeat ask was answered {"parity:dissolve-pyreflies":7} (the recorded original of `ffx-core`, 7 defeats) where live's own run of the same fight answered it with the v2 recording {"v2:v2:dissolve-pyreflies":7}; parity cues of FFX-2 played: none; asks that lost a recording since live: none.
  - FFX-2 Chapter IV (`ffx2-bahamut`): packs ffx2-bahamut, ffx2-core (as expected; none of FFX's); 182 sounds in the log; the ordinary enemy defeat was answered {"v2:v2:dissolve-pyreflies":1}, **the same answer as live's own run** {"v2:v2:dissolve-pyreflies":1}; the candidate answered it with the first-bank cue (`sprite:dissolve-pyreflies`, the reviewer's evidence); parity cues of FFX played: none; asks that lost a recording since live: none; the chant played 46 times from its re-levelled pack cue.
- The servers: the one `vite preview` (port 5491) was started by PID and stopped by PID at the end; no dev server was started; Chromium instances were launched and closed by the walker.
- Not run, because part 3 stopped: the new gate against a clean build, `tools/art-derive.mjs verify` and `audit`, `tools/art-browser-load.mjs` (the art of the build is the candidate's, unchanged).

## Working files (outside the repo)

`D:/Tools/pyrefly-scratch/2026-10-13/r46-fix/`: `audit-asks.mjs` and `analyse-asks.mjs` (the first version of the answers audit, now `tools/audio/sfx-answers-audit.mjs`), `measure-levels.mjs` (now `tools/audio/sfx-levels-audit.mjs`), `relevel.py` (the re-level: reads `levels-before.json`, the lane's pack inputs, writes `fixed/*.flac`), `make-picks-fix.py` (the pack inputs with the re-levelled files), `apply-levelfix.mjs` (writes `sfx-parity-levelfix.json` and edits the record and CREDITS), `control-answer.mjs` (the negative control), `proof-sfx.mjs` and `walk/walk.mjs` (the browser proof, a copy of the reviewer's walker with a record of every art JSON requested), `scan-art-json.mjs`, `analyse-walk-json.mjs` and `part3-draft/` (part 3), the live files and manifest of d5bf2206 (`live-files/`, `manifest-live-d5bf2206.json`), and every result. `PROGRESS-r46-fix.md` in the worktree is the step log (untracked).

## What the ear (and the driver) still owe

- Every re-levelled row, above all: **Petrify** (the limiter), the **Gunner's hit** (the most played, metrics disagree), **Thundaga**, **Death**, **Cura**, **Waterga** and **the final aeon's wave** (louder than their predecessors by design, now matched), and the **chant** (the most played cast sound). Nothing here was heard.
- The restored FFX-2 defeat is the sound live plays; whether FFX-2 should have its own recorded defeat is the owner's call, not this lane's.
- Part 3: A, B or C above, and with B the gate goes into the deploy.
- Left alone on purpose: `NOW.md`, `DECISIONS.md`, `ACTIONS.md` (the driver owns the ledgers); the 24 "keep today's" and 11 "try again" rows; Chapter XIII's one line after the tally.
