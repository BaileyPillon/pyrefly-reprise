# SFX v2: the recorded set, full hookup (D-302)

Branch `sfx-v2` (from main `d0d6f312`), worktree `D:/pyrefly-r29-options`. Not pushed, not merged, not
deployed. Bailey, 2026-09-30 ~14:25 EDT: "I'll go with all your recommendations" (the driver's SFX
recommendation: the new 98-sound recorded, layered set with the full hookup, not the drop-in). Bailey
has heard none of it; everything is reversible (below) and he vetoes by ear after it ships.

**Game case (rule 14): both, each its own voice.** FFX chapters get the FFX cues and weapons, FFX-2
chapters the `-x2` twins and FFX-2 weapons, `both` cues in both. FF7, the title and chapter select keep
the first sprite exactly (THEMES.md assigns the menus to neither game). The victory fanfare, the
Overdrive minigame ticks and the story ambiences are not in the set and did not change.

## What shipped on the branch

- **A second sprite**, `public/audio/sfx/sprite-v2.mp3` (100 cues: the set's 98 plus `item-use` /
  `item-use-x2`, 190.3 s, 3,296,589 bytes, `libmp3lame -q:a 3`), manifest key `sfxV2`. The first sprite is
  byte-identical to main. Built by `tools/audio/sfx-v2-sprite.py --q 3 --install` from the set's lossless
  FLACs in `D:/Tools/pyrefly-scratch/audio-0930/sfx/set/flac`; three cues are trimmed a few tenths of a dB
  for the encoder's overshoot (`hit-spear` -0.25, `swing-dagger` -0.09, `swing-blitzball` -0.04; `trimDb`
  in the manifest).
- **The item-use cues** did not exist in the set; the brief asked for "an item-use sound at action
  start". Added to the set as `tools/recipes_item.py` there (leather pouch, a glass clink, a B-D-F#
  figure; FFX glockenspiel, FFX-2 FM tines + sleigh bell), built and screened by the set's own tools
  (`build.py`, `qa.py`: 100 cues, 0 flagged). The set's README does not list them yet.
- **The hookup** (every file and the full mapping: `docs/AUDIO-GUIDE.md` "The recorded set"):
  `src/audio/sfxV2/` (cue table with first-bank stand-ins, voicing, battle mapping, weapons, families,
  statuses), `src/audio/SfxSprites.ts` (both sprites + the play log), `src/engine/BattlePresenterSfx.ts`
  (every presenter cue asks the chapter's voice), `src/app/screens/battleSfxVoice.ts` (engine state +
  ability rows), `src/app/sfxGame.ts` (the voice for a chapter run). Edits in place: `AudioManager.ts`,
  `manifest.ts`, `BattlePresenterEvents.ts`, `BattlePresenterBeats.ts` (item cue), `BattlePresenterPorts.ts`
  (`sfxVoice` dep), `BattleMoments.ts` (boss roar, Overdrive / Special stinger), `BattleScreenFlow.ts`,
  `BattleScreenGameDeps.ts`, `battleAbilityFacts.ts`, `tools/audio/qa.mjs` (audits both sprites, counts
  both), `tests/unit/audio-shipped-files.test.ts` (budget counts both). No file over 400 lines grew.
- **Data, not invented:** FFX weapons from the characters' `weaponType`; FFX-2 by dressphere where its name
  or commands name a weapon (Gunner, Gun Mage: gun; Warrior "Swordplay": greatsword), else the girl's
  default-dressphere weapon (research/ffx2-combat-core.md §3.1-3.3); Rikku's daggers are the set's
  proposal Bailey accepted. FFX landings from the rows' own `sfxKey` (via `sfx/aliases.ts`); FFX-2 by
  element / damage type, plus Curaga and Full-Cure by id. Aeon and machina voices from
  research/ffx2-fallen-aeons.md line 35 and research/ffx-vs-ffx2-presentation.md line 135; fiends
  dissolve into pyreflies in both games (same file, line 132), so `dissolve-pyreflies` (tagged FFX by the
  set) also plays for FFX-2 fiends.
- Docs: `docs/AUDIO-GUIDE.md`, `docs/audio/CREDITS.md` (sources, the three CC BY 4.0 credits, Voxengo now
  owed), `docs/plans/sfx-v2-review.md` (the paper preflight rule 15 asks for; critic-plan classes this
  DEEP), `docs/audio/sfx-v2-proof-2026-09-30.json` (the proof numbers).

## Measured

- `npx tsc --noEmit` clean. `tests/unit/audio-sfx-v2.test.ts` 22 tests (every party weapon maps, every
  element, every status, unknown falls back, rule 14 sweep, no-voice = old cues, the presenter + chapter
  voice end to end). Full suite: 10,497 passed; 2 failed only under full-suite load and pass alone
  (`strategy-ffx2-bahamut` timed out at 15 s in both full runs, before and after the change;
  `ui-ffx2-atbmode`).
- `node tools/audio/qa.mjs --strict`: **0 findings**, first sprite -1.13 dBTP, v2 sprite -1.12 dBTP,
  **84.22 MB of the 85 MB budget**.
- **Encode choice.** V0 (4.89 MB) would make the total 85.82 MB and break the 3.5 MB per-sprite gate;
  q1 4.22 MB and q2 3.64 MB also break a gate; **q3 3.30 MB** passes both. Coding noise against the
  lossless twin, 6-12 kHz: V0 -28.3 dB, q2 -22.8, q3 -21.3 (the music's V0, D-292: -17.9); whole-file
  signal over error 37.1 / 31.9 / 30.5 dB. V0 needs Bailey to raise the budget by about 0.9 MB (to 86 MB)
  and the per-sprite gate to 5 MB.
- **Production build, headless, real input** (`tools/audio/sfx-v2-proof.mjs`, GPU): title and board by
  Enter / arrows, prep, the scene skipped by holding Enter, the pause menu by P / Escape, a submenu
  opened and cancelled, Chapter I: Attack by a **tap**; Chapter IV: an Item by keys and Attack by a tap;
  then the intended route. Plus the intended route from the start (Chapter I seed 3 for a win: the route
  wins about half its seeds, seeds 1 and 2 lost). 0 console errors, 0 404s in all four runs; no missing
  sprite key; no v2 cue fell back after the sprite decoded; no cross-game cue; every play the check
  could attribute matched the brief's mapping (138 checked, 0 problems). First-sprite cues still heard
  in a battle: only the victory fanfare.
- Seen in the runs: swings and hits for Tidus (sword), Auron (katana), Kimahri (spear, Overdrive), Paine
  (greatsword), Rikku FFX-2 (daggers); enemy swings and `hit-heavy-enemy`; `magic-charge`(-x2),
  `item-use`(-x2), fire / thunder / ice, `flare`(-x2) then `hit-1`, `critical`, `whiff`, `cure`(-x2),
  `cure-3`, protect, shell, haste, slow, poison, `buff-generic`, `debuff-generic-x2`, the status bell,
  `ko-fall`, `dissolve-pyreflies`, `phoenix-down`, `overdrive-full`, `overdrive-stinger`, `summon`,
  `boss-roar` (FFX), `boss-roar-aeon` (Bahamut), `boss-overdrive-warning`, `counter`; the menu set voiced
  FFX in Chapter I and FFX-2 in Chapter IV, unvoiced on the title and board. **Not exercised in a
  browser** (unit-tested only): Yuna's FFX-2 gun (she only cast in these runs), `gun-burst`, Wakka, Lulu,
  Yuna FFX staff, Rikku FFX claws, water / holy, `life`, `spherechange`, `special-stinger`, the machina
  cues (Chapter V), `explosion`, `breath-attack`, `laser-*`, `boss-phase-shift`, `guard`, sleep / silence
  / stop.
- **Levels** (`tools/audio/sfx-v2-levels.py`: the captured fight re-mixed as AudioManager mixes it from
  the build's own files; D-293's measures): SFX peak minus music peak +0.3 / +1.0 dB (Chapter I) and
  +1.2 / +0.9 dB (Chapter IV); SFX loudest 43 ms minus music average 9.0 to 9.6 dB; mix peak before the
  -2 dBFS limiter -2.4 to -4.8 dBFS, **limiter never active**. The same plays with the first-bank
  stand-ins: +0.1 to +2.4 dB and 9.2 to 12.8 dB. THEMES rule 8 asks +1 to +2 dB and 7 to 8 dB: the peak
  sits at or just under the target, the loudest 43 ms 1 to 1.6 dB over it (the shipped mix measured 9.5
  in Chapter I on the same meter, README of the set).

## Reversible

Nothing was deleted or moved. Removing the `sfxV2` key from `public/audio/manifest.json` makes every v2
cue play its first-bank stand-in; reverting the branch's commit restores the old presenter cues exactly.

## Not done / open

- Bailey has not heard it. The set's README reels (`D:/Tools/pyrefly-scratch/audio-0930/sfx/reels`) are
  the way to audition before a release.
- The encode (q3, not V0): Bailey's call (above).
- The mapping choices Bailey may veto by ear: FFX humans (Seymour, Yunalesca) roar the set's big-cat
  `boss-roar` in the slot the old roar had; an Overdrive plays the stinger and the swing; Defend / Guard /
  Sentinel play `guard`; FFX-2 human bosses keep the old roar.
- The combat-presenter / audio-routing change is DEEP for the critic (focused before deploy, deep after).
- The set's README should list the two item-use cues (scratch, not repo).

## CHECK (independent, 2026-09-30, did not build it)

Verdict: **no blocker.** Every claim below was re-run or re-measured on commit `dac3bff5`; nothing
was taken from the builder's report. Game case: both, each its own voice (confirmed by running).

- **Type check and tests.** `tsc --noEmit` clean. `audio-sfx-v2` (22) and `audio-shipped-files` (9) pass.
  Full suite once: 10,498 passed, 1 failed (`strategy-ffx2-bahamut` "heal-only route" timed out at 15 s
  under full-suite load). It passes alone, together with `ui-ffx2-atbmode` (25/25). It is an engine
  strategy test that none of this change touches.
- **Scope.** 32 paths, all under the brief. `sprite.mp3` is byte-identical to main. `manifest.json`
  `version`, `sampleRate`, `music` and `sfx` are deep-equal to main; the only addition is `sfxV2`.
  `git merge-tree --write-tree main HEAD` is clean against main `770823bc`. `tools/orphans.mjs`
  reports 24 orphans on both the branch and main, so the 10 new modules are all reachable.
- **Files over 400 lines.** None grew (by `wc -l`): AudioManager 660 to 634, BattlePresenterEvents
  436 to 426 (the report says 427), Ports 472 to 470, BattleMoments 553 to 550; BattleScreenFlow 525
  and qa.mjs 512 are unchanged.
- **qa.mjs --strict:** 0 findings. sfxV2 sprite: 100 cues, 190.3 s, 3.30 MB, -1.12 dBTP. Total
  84.22 MB of the 85 MB budget.
- **Sprite re-measured independently** (ffmpeg decode + ebur128 true peak, 12 cues). True peaks match
  the manifest within 0.15 dB: swing-sword -1.7, hit-spear -1.2, swing-dagger -1.2, fire-x2 -5.4,
  boss-roar -6.0, item-use -10.9, item-use-x2 -11.8, overdrive-stinger -5.7, special-stinger -3.7,
  cursor-move-x2 -15.8, machina-roar -4.6, thunder -5.8. The whole sprite is -1.1 dBTP. No cue overlaps
  another. The loudest gap between cues is -64.8 dBFS (no bleed). The loudest last 20 ms of any cue is
  laser-charge at -41.4 dBFS; all others are at or below -51.6 (no tail cut audibly short).
  Loudness is checked by qa's momentary gate against the category targets, and every v2 category
  (ui, weapon, impact, spell, flourish, ambience) has a target. SFX have no loops or seams, and the
  music is unchanged.
- **Fresh production build, headless GPU, my own script** (`D:/Tools/pyrefly-scratch/sfx-v2-check/check.mjs`,
  port 4497, stopped afterwards). Real keys on the title and board, then `gotoChapter` with the intended
  route, reading `audioDebug().sfxLog`:
  - Chapter I (seed 3): victory. 376 plays, 375 from v2, 0 synth, 0 cross-game. The only first-sprite cue
    was victory-fanfare.
  - Chapter IV Bahamut (seed 1): victory. 194 plays, 194 from v2, 0 cross-game, `-x2` twins throughout,
    greatsword and dagger hits, aeon roar.
  - FF7 Guard Scorpion: victory. 64 plays, **0 v2**, all from the first sprite.
  - Title and board: 3 or 4 plays in each run, 0 v2, voice `null`. The voice returns to `null` after
    every chapter.
  - All runs: 0 console errors and 0 4xx responses. The v2 sprite decoded with 100 cues.
- **Licences.** Every archive the recipes load (`recipes.py`, `recipes_item.py`) is in the CREDITS table,
  with its licence and a SHA-256 in `tools/sources.json`. They are CC0, PD or CC BY 4.0, and the three
  CC BY credits and Voxengo are in the verbatim credit block. `80-CC0-creature-SFX_0` is referenced only
  as a fallback that does not trigger; it is CC0. The downloads are recorded in `D:/Tools/downloads.md`.
  I found no retail audio.
- **Rule 1.** `BattlePresenterSfx.ts` and the `sfxV2/*` modules import no DOM and no `three`.

### Findings

1. **major, disclosed: not LAME V0.** The v2 sprite is `-q:a 3`, while the brief says V0. V0 does not fit
   the 85 MB budget or qa's 3.5 MB per-sprite gate. My re-encode of the decoded sprite at V0 gives 4.30 MB;
   the builder measured 4.89 MB from the lossless source. The builder kept the budget, did not raise it
   silently, and wrote down what V0 would need (about 86 MB total, a 5 MB sprite gate). This is Bailey's
   call before release.
2. **minor: two licences outside the brief's list.** The Sonatina choir (CC Sampling Plus 1.0, used by
   magic-charge, cure-3, summon and other cues in `recipes.py`) and the Voxengo IR licence (royalty-free,
   no redistribution of the IRs) are not CC0/PD/MIT/Apache/BSD/CC-BY. Both already ship in the music
   with the same attribution, so there is precedent, but the brief's list does not name them.
3. **minor: the set's `battle-start` cue is shipped but never played.** No code path produces
   `v2:battle-start`, because the only `battle-start` call is the title screen, which is correctly
   unvoiced. It costs a few KB of dead sprite.
4. **minor: two report details.** BattlePresenterEvents is 426 lines, not 427. The "only old-sprite cue
   in a battle" claim holds for the battle proper, but in the real-input runs the story cutscene cues
   (`kimahri-roar`, `machina-groan`) also play from the first sprite, as the set has none.
