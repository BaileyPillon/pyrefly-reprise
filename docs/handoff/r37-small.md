# r37-small: the approved small items lane (2026-10-03 overnight)

Branch `r37-small` (worktree `D:/pyrefly-r29-options`), from `origin/main` `d154486c`, pushed, **not merged, not
deployed**. Written by a Sonnet sub-agent of the driver session under Bailey's 2026-10-03 ~00:40 EDT "ok overnight you
need to do through the visual pass, max out the eye candy, involve the critic, and implement any unimplemented chapters
or unimplemented but approved ideas" and ~00:50 "all your recommendations, godspeed"; standing goal 2026-09-26 "Focus on
meeting all score thresholds iteratively. Godspeed. I have plenty of usage." (class A defect repairs). Backlog:
`D:/Tools/pyrefly-scratch/2026-10-03/backlog/backlog.json`. Paper preflight: `docs/plans/r37-small-review.md`.
Frames: `docs/screenshots/r37-small/` (JPEG; the full-size PNGs are parked in `F:/pyrefly-parked/2026-10-03/r37-small/screens/`).

**critic-plan class (all 20 changed src and research paths): DEEP after the deploy, FOCUSED before it; live + focused +
deep owed; no item is save-data class** (`SaveData.ts`, the save schema and settings persistence are untouched), so there
is no `r37-small-savedata` branch.

## Items

| # | Key | Game | Commit | Status |
|---|---|---|---|---|
| 1 | D-216 + D-248 Chapter XII Auron disc line | FFX only | `fa2ffece` | built, browser-proved |
| 2 | D-247 Chapter III 0.6 line card | FFX only | `09165aec` | built, browser-proved |
| 3 | PR-0326 title press-start cue | both | `c25ca3e8`, `8f956b9f` | built, browser-proved |
| 4 | PR-0322 + PR-0323 EYE CANDY copy | both | `4f5e11c6` | built, browser-proved; PR-0305 and PR-0292 already on main |
| 5 | PR-0324 Ronso Rage "timed input" | FFX only | `03127e3e` | built, browser-proved |
| 6 | PR-0258 overkill drop multiplier | FFX only | `7607bd64` | built (source row confirmed), engine-proved |
| 7 | D-249 Q12 KO weight, Chapter XI | FFX-2 only | `be8e4bea` | built, unit-proved; no browser movement measured |
| 8 | visual bible 1.6, one broken horn (D-324) | FFX only | `f52120b7` | built (docs) |
| 9 | BR-BANNER-END-OF-FIGHT | FFX-2 only | `b5753733` | built, browser-proved |
| 10 | BR-BULWARK-STR-MAG | FFX-2 only | `437c9a33` | built, 40 chains byte-identical |
| 11 | POLISH-12-VERIFY | both | (no code) | verified and reported; no clear defect fixed |

### 1. Chapter XII disc line (D-216 + D-248, FFX only)
- **Changed.** New FFX coach mark `ffx-omnis-disc` (Auron, held like every FFX line) with Bailey's wording (c) verbatim:
  "Hit a disc. Three alike, and his spell reaches everyone." `src/ui/coach/coachDisc.ts` asks right after the HUD has been
  handed the menu (the card's top row exists only then). `advisor-omnis.ts#topRowDiscTurn` re-previews the card's top row on
  the engine's own simulator and is `null` unless the board carries `omnis.discs`, so Chapter I and every other fight stay
  silent. Said once (seen-set).
- **Proof.** `tests/unit/coach-omnis-disc.test.ts` (4: wording and game, real Omnis engine and real card, once, quiet in
  Chapter I and with coaching off). Browser, real arrows and Enter following the live card (`check1`): seed 1, menu 2
  (Wakka's turn, top row Attack to Mortiphasm A, discs fire x4): line up, one Enter took it down, the next disc row at menu 6
  did not repeat it. `item1-omnis-disc-line-seed1-1600x900.jpg`.
- **Left.** Nothing. **For Bailey:** Bailey picked the words and the speaker (Auron); "holds until one confirm" follows the
  FFX deck's rule and was not named by him.

### 2. Chapter III opening line card at 0.6 (D-247, FFX only)
- **Changed.** `LineCardInput.sizes` (additive) and `SMALL_CARD_BEATS = {'bfa-talk'}` in `midbeatLineCard.ts`:
  that beat always wears the 0.6 card; `--lc-scale` default stays 0.7 everywhere else, phones unchanged.
- **Proof.** `line-card-placement.test.ts` (+1). Browser (`check2`): the Talk beat's card is `top-left`, `--lc-scale 0.6` at
  1280x720, 1600x900 and 2000x1012. `item2-chapter3-talk-card-*.jpg`.
- **For Bailey:** I read "Chapter III's opening" as the Talk beat, the one beat that plays at the opening camera, where the
  pick already fell back to 0.6 as a fallback (`iter2-b4` handoff). D-247's own text says "Macalania Woods pursuit", but in the
  code Chapter III is Braska's Final Aeon and the Talk beat is the beat the decision's origin (the 0.6 question) measured. If
  more beats should be small it is one name in `SMALL_CARD_BEATS`.

### 3. Title press-start cue (PR-0326, both)
- **Changed.** `AudioManager.playSfxFromSprite` (additive): waits for the first sprite's decode (not the v2 set), at most
  1.2 s, plays from the sprite or not at all; the synth-only build (no sprite at all) still plays its synth. `TitleScreen`
  calls it without awaiting it. The first commit waited on both sprites and a headless check showed silence at a 300 ms
  delay, so `8f956b9f` waits on the first sprite only.
- **Proof.** `audio-sprite-only-cue.test.ts` (4). Browser (`check3`, fresh profile, a real Enter on the title): no delay,
  `sfxLog[0]` is `battle-start via sprite` at 0.88 s; 300 ms delay: `via sprite` at 1.26 s; 900 ms and 5 s delay: nothing
  logged, never `synth`. The critic's 27 of 27 runs read `via synth`.
- **Left.** PR-0263, PR-0220, PR-0039, PR-0260, PR-0278 (audio bookkeeping) not touched. **For Bailey:** PR-0298 (music
  78.2 MB) and PR-0299 (SFX level move) are his questions, untouched.

### 4. EYE CANDY copy (PR-0322 + PR-0323, both); PR-0305 and PR-0292
- **Changed.** A part ON under an OFF look prints `ON · LOOK OFF`; dim and OFF text is a flat paper tint (0.50 to 0.55)
  instead of 0.4 opacity; "today's calm camera / splash / size" now read "the standard battle camera", "the plain splash",
  "their usual size". **PR-0305 (U4, `924fbfab0`) and PR-0292 (F6, `d112c8e4`) are already on main with their own tests**
  (`u4-command-help-sync`, the F6 tests, which ran green); nothing to change, the critic's "carried, not re-observed" can be
  re-observed on the next build.
- **Proof.** `pause-eye-candy-page.test.ts` 40 of 40 (+2, five expectations updated for the new strings). Browser (`check4`,
  real Esc, a click on OPTIONS, ArrowLeft on ALL LOOKS): after ALL OFF the head reads 0 OF 11 ON and every part row reads
  `ON · LOOK OFF` or OFF; contrast measured from the screenshot's own pixels: worst dim or OFF text 3.64:1 at 1600x900 (FFX),
  3.10:1 at 390x844 (FFX-2, over Yuna's bright painting); the two help lines read as above. Target vs build:
  `sbs-item4-eyecandy-target-left-build-right-*.jpg` (the target is the all-ON page; the build is the new all-OFF state).
- **Left.** **For Bailey:** PR-0289 (keep the spot on Chapter I or reword), PR-0032 (REDUCE FLASHES row) and PR-0329 (a look
  turned back ON keeps new parts OFF) are questions, not built.

### 5. PR-0324 (FFX only)
- `describeAbility` skips "timed input" for `kimahri-rage`. `advisor.test.ts` (+1: no rage says it, every Swordplay and
  Bushido row still does). Browser (`check5`, Chapter I, Kimahri's Overdrive menu): JUMP "Damage", MIGHTY GUARD "Inflicts
  Protect, Shell, ...", WHITE WIND "Restores HP to the party" (was "Damage · timed input"). `item5-*.jpg`.
- **For Bailey / next batch:** `rikku-mix` and `yuna-grand-summon` are also pickers by `types.ts#MinigameKind` and still read
  "timed input"; the brief named only the rage, so they are unchanged.

### 6. PR-0258 overkill drops (FFX only)
- **Source row confirmed.** `research/ffx-vs-ffx2-presentation.md` §9 (Overkill "doubles AP and item drops ... does not affect
  gil or equipment drops", verified, 2 sources) and the chapter rows (Guardians "Ability Sphere x1 (x2 on overkill)",
  Anima, Flux, Evrae, Yojimbo, Yunalesca x1 then x2, Natus x2 then x4, Omnis x1/x2 then x2/x4).
- **Changed.** `collectRewards` multiplies an overkilled enemy's drop `count` by `OVERKILL_DROP_MULTIPLIER = 2` (cap 99); no
  RNG; gil, steals, equipment untouched. Chapter VII's three Guardians with one overkilled now read x4.
- **Proof.** `ffx-overkill-drops.test.ts` (3, real engine). `ffx-engine-golden.test.ts`: with the multiplier stubbed to 1,
  18 of 18 on the old values; on, exactly Anima's two digests move (the line overkills a Guardian on both seeds), re-pinned
  with that reason in the file's header. `chapters/` suite 113 of 114 files (the one failure was the 15 s default timeout on
  the Sin bench under load; it passes with the full-suite timeout).
- **For Bailey:** Natus and Omnis x4 rows are single-source (decompile) in the research; the rule itself is two-source.

### 7. D-249 Q12 (FFX-2 Chapter XI only)
- **Changed.** `phoneFraming.ts`: `FRAME_WEIGHTS.ko = 2` (between a plain enemy 1 and a party member 6) for a KO'd party member
  when the board is FFX-2 and carries one of the road's enemy ids (`KO_FRAMING_SCOPE`: x2-shiva, sandy, cindy, mindy, x2-anima).
  A presentation weight of my choosing, not game data. Other chapters unchanged.
- **Proof.** `phone-framing-ko.test.ts` (5: scope read off the shipped groups, other chapters and an FFX board unchanged,
  the slide follows the girls still fighting). **Browser (`check7`): no visible movement.** At 390x844 and 360x780 the Shiva
  framing already shows every figure, so `--phud-left` was identical before and after a KO (-220.4 and -193.3 px, all
  three girls tried); the Chapter V control with Paine down moved by 10 px (sprite sway), proving the field re-frames.
  Unit-proven; not shown moving in a browser.

### 8. visual bible 1.6 (D-324, FFX only, docs)
`research/visual-bible.md`: the pixel-art spec, the silhouette line and the icon crop no longer ask for two horns.

### 9. BR-BANNER-END-OF-FIGHT (FFX-2 only)
- **Changed.** Ported from `5126f7a31`, FFX-2 half only (the FFX half is on main as F5): `src/ui/ffx2/fightDecided.ts`
  and `FFX2BattleHud#endOfFight` (menu, message line, telegraph), run at the victory/defeat beat and at a KO played while the
  live state already carries the result; an escape keeps its line and loses only its menu.
- **Proof.** `ffx2-hud-end-of-fight.test.ts` (3: the predicate, the real Chapter IV seed-9 ending, defeat and escape; red
  with the sweep disabled, green with it). Browser (`check9`, Chapter IV seed 9, `intended`, fast playback, a probe after
  every HUD event): before (sweep disabled) "Bahamut5" is still up at the deciding KO and the action-end; after it is up
  through the damage and chain events and gone at the KO. `item9-*-before-*.jpg` / `-after-*.jpg`. FFX-2 HUD tests (43 files,
  368 tests) green.

### 10. BR-BULWARK-STR-MAG (FFX-2 Chapter V only)
- **Changed.** `git cherry-pick -n 18fcabef9`: new `ACC_EVA_LUCK_MOD_IMMUNITY` used only by the two Bulwarks
  (`research/ffx2-vegnagun-shuyin.md` §3.3, "Str/Mag/Def/MDef Up-Down all land", verified, 2 sources); `STAT_MOD_IMMUNITY_5`
  untouched. The one conflict was in `docs/handoff/NOW.md`, left exactly at main's version.
- **Proof.** 18 new tests (`data-ffx2-vegnagun-stat-immunities.test.ts`). **40 Chapter V chains (seeds 1 to 40, shipped line,
  Wait) with the old record and the new produce byte-identical event logs, 40 of 40** (39 of 40 wins both ways), run on
  main's engine (scratch test parked in `F:/pyrefly-parked/2026-10-03/r37-small/`). `ffx2-atb-golden` and the Vegnagun
  strategy test green.

### 11. POLISH-12-VERIFY (both): verified, reported, nothing fixed
The tiles are in `docs/target/targets.json` group `polish`; their pictures in `docs/concepts/polish/<id>/after.png`.
- **CTB preview (FFX only): PARTIAL.** Browser (`check11a`, Chapter I, Tidus's menu, cursor over every row): the queue reorders
  for the actor's own recovery (Cheer pulls Tidus's next turn into the six rows), but Delay Attack and Delay Buster show the
  **same queue as a plain Attack**, the target-side Delay, Haste and Slow the build-b review's REQUIRED 3 named
  (`turnQueue.ts#predictTurnOrder` applies only the actor's own rank). The tile's "+N / WAS" markers and the "IF YOU USE
  THIS" card are not in the build at all (`sbs-item11a-*`). Closing it needs the engine extension first (FFX combat core,
  deep review): **For Bailey**, build it or let the tile stand as partly delivered.
- **Close-up face pass: NOT INSTALLED.** The shipped `public/art/pause/wakka.png` (Sep 18) is the pre-pass plate; the approved
  Wakka pass is `docs/concepts/polish/closeup-likeness/_src/wakka-plate-after.png` (1344x768, only the face box differs:
  bbox 403,110 to 974,690). Auron's pass was judged "not better" and is not wanted. `item11c-*.jpg` is shipped (left) against
  the pass (right). Installing is the art-install lane (approved paintings, hashes, backup), and `public/art` is read-only for
  this lane: **For Bailey / the integrator.**
- **Living backdrops (A-7): not built.** The scenes draw their own painting and props (frames `item11b-*`); there is no
  plate recomposition or drift, as the backlog says. Not touched.
- **Arena camera sweep: built, with a different title treatment.** The 2.2 s battle-start card ("ANY KEY"), then the opening
  push from wide to the party (frames `item11b-arena-sweep-plain-f1/f4/f7`). The tile's letterbox bars and title laid over the
  scene are not what ships (the title is on the battle-start card; `sbs-item11b-*`). Acceptance 8 (skippable within 100 ms): a
  real Enter 1.5 s in did not shorten the time to the first menu (11.7 s against 12.1 s, each with screenshot overhead): not
  proven either way, reported as observed.
- **Animated ink wipes: code present, not caught.** `wipe.ts` plays on the title's advance; 90 ms sampling after a real Enter
  jumped from the title to Auron's briefing between two frames (`item11d-*`).

## Gates (at the hand-off)
`npx tsc --noEmit` clean. `node tools/orphans.mjs`: 24 orphans, as before (coachDisc.ts and fightDecided.ts are imported).
Targeted suites green: coach (20 files), omnis advisor, line card (2), audio (3), EYE CANDY page (40), advisor, overkill and
goldens, phone framing, FFX-2 HUD (43 files), Vegnagun, chapters (113 of 114, the one a 15 s timeout). Full suite once at the
end with `--testTimeout=60000 --maxWorkers=4`: 752 files passed, 5 skipped (11,080 tests passed, 40 skipped, 1 todo), nothing failed. One dev server (port 5930) was started and stopped by
PID; one headless Chromium at a time, GPU mode, never the browser pane.

## For Bailey (collected)
1. D-216: the line holds until one confirm like every FFX line (he named words and speaker only).
2. D-247: "Chapter III's opening" read as the Talk beat; one name in `SMALL_CARD_BEATS` to change.
3. PR-0289, PR-0032, PR-0329: questions, not built. PR-0298 and PR-0299: his audio questions, untouched.
4. PR-0324: Mix and Grand Summon rows still say "timed input" (also pickers); add them if he agrees.
5. PR-0258: Natus and Omnis x4 are single-source; the doubling rule itself is two-source; Anima's goldens re-pinned.
6. Q12: the KO weight 2 is mine; at the shipped Shiva framing nothing moves, so the visible gain is small.
7. POLISH: CTB preview target-side effects need an engine extension; the Wakka face pass is approved but not installed;
   living backdrops unbuilt; the arena sweep differs from the tile's title treatment.
8. A worktree glitch for the integrator: this worktree's sparse-checkout pattern is the mangled
   "!C:/Program Files/Git/docs/screenshots/" (the MSYS path conversion in the 2026-09-26 recipe); harmless here, but
   `git add --sparse` may be needed for frames elsewhere.
