# ch-anime: the hidden anime chapter, Chapter 33 (FFX-2 only): part 2 (the look and the motion) first, then part 1 (the code)

Lane `ch-anime`, the sparse worktree of the Wind Waker lane, branch `ch-anime` (cut from `origin/r75-boss-art` b98906229), written 2026-11-06 by the lane's sub-agent for the release driver. **Nothing is deployed.** Part 1 (sections 1 to 10 below) is the code, the models in place, the tests and the first GPU smoke; **part 2 (the next section) is built on top of it: the proportion pass, the retargeted idle and victory, a Valefor of her own, the wet floor and the air, the clips for Bailey, and the finish pass that checked it (P2.11).** Where part 2 says a part-1 statement no longer holds, part 2 wins; part 1 is left as it was written.

Authority: Bailey, 2026-10-22 00:00 EDT, "make a genshin / guilty gear version of the chapter"; 2026-11-01 14:30 EST, "Meshy toon (Recommended)" (the models: "the only set that reads as anime"); 2026-11-06 ~00:30 EST, "implement all unimplemented chapters please", ~00:55 EST, "you can spend as much meshy credits as you see fit. use your own judgment."; 2026-10-31, "you make the executive decisions for the next few days. i'll go with all of your recommendations". The look, the word, the number and the title were never answered by him: they are **driver picks, his to overturn** (section 4).

**Game case: FFX-2 only.** It is hidden chapter 24's Valefor fight (`ffx2-valefor-besaid`, `research/ffx2-fallen-aeons.md` section 7.1, `[verified: 2 sources]`) by reference, as the Wind Waker chapter is: Yuna (Gunner), Rikku (Thief), Paine (Warrior) against Valefor, the same build, formation, scripts, music, Sensor line and card words. **No battle data of its own (rule 6): no number in this lane comes from anywhere but chapter 24's record; the staging numbers (slots, heights, camera) are ours, not game data.** The registries, the door row and the optional-config seam on the ww3d modules are shared plumbing ("both", CHK-020), additive and inert for every other chapter (section 3).

## Part 2 (2026-11-06, the look and the motion): the taller cast, an upright idle, a victory, a feathered Valefor of her own, a wet floor and some air, six clips for Bailey

Authority: the same as part 1 (Bailey 2026-11-06 ~00:30 EST "implement all unimplemented chapters please", ~00:55 EST "you can spend as much meshy credits as you see fit. use your own judgment.", 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations"); the picks below are the driver's, his to overturn. Branch `ch-anime`, still **nothing deployed**.

**Game case: FFX-2 only** (unchanged: hidden chapter 24's Valefor fight by reference; no battle data of its own, rule 6). Every number in part 2 is staging (proportions, clips, a floor, a model), none is game data. The seam additions are shared plumbing ("both", CHK-020), additive and inert for every other chapter (section P2.3).

### P2.1 What changed

| What | Where | Notes |
|---|---|---|
| **The taller cast** | `tools/anime/proportion.mjs` (pure node, no Blender, no credits) over the stored LOD1 files; the three girls' files in `public/models-exp/windwaker/anime/` are replaced | head 0.78 / 0.80 / 0.84 about the Head joint, legs 1.10 / 1.10 / 1.08 long, spine 1.02, slimmer 0.97, neck 1.10. Height over the head's length (Head to `head_end`): Yuna 6.08 to **7.90**, Rikku 7.20 to 9.02, Paine 5.82 to 7.01 (Yuna measured chin to crown: 5.4 to **7.0** heads) |
| **An upright idle and a victory** | `tools/anime/retarget.mjs` (by bone name) | the Wind Waker cast's `idle` (upright, the head level) replaces each girl's crouched, head-bowed `idle`; its `victory` is new (Yuna 8.6 s, Rikku 9.4 s, Paine 1.5 s). The feet are lifted by a forward-kinematics read of the toe joints (within 3 cm of the rest feet in every clip but Rikku's jumping victory) |
| **A Valefor of her own** | `public/models-exp/windwaker/anime/valefor.glb` (new), `tools/anime/valefor-fit.mjs`, `animeLayout.ts` (`ANIME_FILES`, `ANIME_WING`, `ANIME_BOSS_POINTS`) | feathered, with gold armour and blue plumes, after concept frame A: a **Flux 2 klein** edit of the frame (on the local ComfyUI, four candidates, no credit) made a clean symmetric front view on plain grey; **Meshy** image-to-3D from it (35 credits, 25 thousand triangles, a 2048 px map); fitted to the file convention of v2 (3.5 m, claws on y 0 and z 0, centred, specks dropped, the map regraded 1.35 times as saturated, the BIN repacked: 2.96 MB). The Wind Waker chapter keeps its own `valefor.glb`; v2 stays in the lab as `ANIME_VALEFOR_V2` |
| **The wet floor** | `engine/ww3d/stageAnime.ts` (new), `scenes/exp-anime-stage.ts` | the temple's sand floor is a polished blue-grey stone and a planar mirror lies 1 cm over it (the figures, Valefor, the door, the torches and the waterfalls stand on their own reflection); drawn **once per game frame**; `?reflect=0` leaves the mirror out; a low-quality build has none |
| **The air** | `stageAnime.ts` `addAtmosphere` | the waterfalls' thin ribbons are widened to 2.6 times (their streaks repeat across, the curtain dimmed to 0.82), a soft mist at the foot of each, 140 dust motes drifting in the light shaft (a seeded field) |
| **The cast aura** | `engine/ww3d/cel.ts` | the outer step of the rim band halved (0.4 to 0.2): a cast Yuna's white top washed yellow in part 1 |
| **The files' recipes** | `tools/anime/cast.mjs`, `valefor-fit.mjs` | `cast.mjs` reproduces the three shipped girls **byte for byte** from the stored LOD1 files; `valefor-fit.mjs` makes `anime/valefor.glb` from the stored raw Meshy model |
| **Delivery** | `tools/ww/ww-models.json` (15 files now: the Wind Waker chapter's eleven, the three girls, her Valefor), the models store (a part-2 folder: the four files, and the raw Meshy model with its map and the four klein candidates, all hashed), the second-disk backup of it (hash-checked), the older ww backup | the pre-pass girls are untouched in the store (the part-1 folder's LOD1 files); the raw Meshy Valefor, its map and the four klein candidates exist only there and on its backup |
| **Clips for Bailey** | the lane's scratch (outside the repo, nothing from it is committed) | idle, attack, cast, hit, ko, victory (1600x900 mp4, under 10 MB each), two bonus rig clips, one contact sheet (section P2.5) |

Commits on `origin/ch-anime` after part 1's `3cee026d7`: `f1718ce63` (the cast, the tools, the floor), `cd2d0b0d6` (Valefor, the air, the staging seam) and this handoff.

### P2.2 Picks, with the alternative of each ("driver pick, his to overturn")

| # | Pick | Alternative |
|---|---|---|
| P12 | **The proportions: Yuna about 7 heads** (head 0.78, legs 1.10), Rikku a little smaller-headed than that (0.80: she is the youngest and her hair mass is large), Paine 0.84 (she is already the tallest). The preview sheets (the pilot's sheets, in the lane's scratch) showed no neck seam, no face damage, no hair loss at 5 cm per pixel | head 0.86 (6.1 heads: a mild change), head 0.75 plus slim 0.97 (7.0 with a smaller face), legs 1.16 (6.9, very long legs); each is one line in `tools/anime/cast.mjs` `RECIPES`; or a Meshy rebuild at 7 heads (150 to 250 credits, if his eye on this fails: the pilot passed mine, not his) |
| P13 | **A pure-node pass, not Blender** (the brief named a Blender pilot): the same maths as "pose-bone scale, apply pose as rest", run on the glTF directly, every step testable (`anime-tools.test.ts`), no python and no permission prompt | the Blender route (`lifelike/pipeline/build_glb.py` is the model for it) |
| P14 | **The upright `idle` of the Wind Waker cast** replaces the crouched one. At the idle rig the girls stand relaxed with the weapons at the hip; an attack runs in from the stance and returns | the Wind Waker `idle_combat` (a combat stance: it reads like the toon's own crouch in the preview sheet, so it was not taken); keep the crouch (the store has the originals) |
| P15 | **The Wind Waker `victory`** is retargeted (it was missing: a won fight left the girls in the stance) | none needed; a Meshy library action is 3 credits a girl |
| P16 | **A polished blue-grey stone with a planar mirror at 0.55 strength**, a Fresnel-like curve, a few taps of blur and a slow ripple | the part-1 sand (no switch: it is the Wind Waker chapter's floor); a stone with no mirror (`?reflect=0`); a stronger or weaker mirror (`ANIME_FLOOR.strength`, one number) |
| P17 | **Valefor is rebuilt** (the survey's single best spend): the Flux 2 klein edit of frame A, then Meshy, then the fit; the map regraded 1.35 times as saturated (the Meshy map is flat-lit and pale beside the frame). **35 credits (balance 4,440 to 4,405)**; the ledger is the Meshy run's own state file and log in the lane's scratch. The path was chosen because GPT Images is paused ("do not collaborate with codex") and a crop of the frame has the right wing cut by its edge and a busy background (a mirrored crop was tried and gave a double-headed bird) | keep `valefor-v2` (`ANIME_FILES` names the file; one line); a second Meshy run from another klein candidate (the other three klein candidates are in the models store; 35 credits each); the real FFX-2 Valefor m164 (dark, fallen: faithful, not the concept) |
| P18 | **The wing numbers and the points** of the new file are measured by `valefor-fit.mjs` (`ANIME_WING`: the bend starts 0.7 m from her centre line and is full at 2.4 m, nothing under 1.4 m bends, the shoulder pivot 2.2 m up, 22 degrees at 0.6 Hz; the mouth at the beak 0.98 m forward of the claws and 2.86 m up, the chest at 1.9 m, 0.55 m forward) | tune them by eye in `animeLayout.ts` (the wing's tearing, if any, shows first at the shoulders) |
| P19 | **The slots and the camera are unchanged**: the upright cast fits the lab's framing inside the bands predicted in part 1 (section P2.4, J1), and the NEXT BEST MOVE card no longer overlaps Paine (the part-1 overlap was the crouched stance's width: 48 px then, 0 px now, 11 px of clearance) | the layout re-fit part 1 held back |
| P20 | **The aura's outer step halved**; **the waterfalls widened and dimmed** | leave them (0.4; 0.62 m, undimmed: `AIR` in `stageAnime.ts`) |

### P2.3 The seam, and why nothing else changed

| file | change | why every other chapter reads exactly as before |
|---|---|---|
| `engine/ww3d/stage.ts` | the floor mesh gets the name `ww-floor` | a name; nothing reads it but `stageAnime.ts` (`stage.test.ts` and `stage-anime.test.ts`) |
| `engine/ww3d/stageAnime.ts` | new | imported only by the anime scene |
| `engine/ww3d/layout.ts` | `WwStaging` gains optional `wing` and `bossPoints` | `WW_STAGING` has neither (`staging.test.ts`) |
| `engine/ww3d/wing.ts` | `WingShape` (an interface) types the flap's numbers; `WING` is the same object | a type |
| `engine/ww3d/model.ts`, `skin.ts` | read `staging.wing` and `staging.bossPoints`, fall back to `WING`, `MOUTH_LOCAL`, `CHEST_LOCAL` | omitted, the same constants |
| `engine/ww3d/cel.ts` | the outer glow step 0.4 to 0.2 | the cel material is the anime chapter's alone |
| `engine/ww3d/animeLayout.ts` | `ANIME_NATIVE_HEIGHT`, `ANIME_FILES`, `ANIME_WING`, `ANIME_BOSS_POINTS` | the anime chapter's table |
| the four models' files | the three girls replaced, `anime/valefor.glb` added | same names and rig for the girls; the new file is the anime chapter's alone |

Not changed: `src/battle/**`, `BattlePresenter*.ts`, the Wind Waker chapter's files, `tools/dist-filter.mjs`, `tools/vite-ww-models.mjs`. The Wind Waker chapter's own pixel A/B against a base build is **still owed** (part 1, A4): it needs a second tree; the 15 ww3d suites and `exp-windwaker.test.ts` are green.

### P2.4 Browser jobs, predictions first (rule 15)

Predictions were written at 08:03 UTC (03:03 EST), **before the first part-2 GPU job ran** (the predictions file in the lane's scratch, for the cast; the floor, the air and Valefor were not predicted in writing: they were looked at as stills and then judged); the harness is part 1's (copied, with a high-quality recorder added: Chrome's screencast, JPEG frames piped to ffmpeg, because Playwright's own video caps at about 1 Mbps). Headless Chromium on the RTX 5070 Ti (ANGLE D3D11), 1600x900, seed 7, REDUCE MOTION off, one job at a time under `RIG-RECORD`. Every run: console 0, page 0, failed requests 0.

**J1 (var-genshin, the new cast, the old sand floor): PASS, every band held.**

| Prediction | Result |
|---|---|
| 1. same opening, errors 0, no patch failure, `own` and `cel` throughout | **Held** (`carrying` own for all four, every material `cel`, `playing: "idle"` for the three girls) |
| 2. Yuna's head 0.14 of her height (before about 0.185) | **Held by eye** on the idle-rig still (hair top to chin about 70 px of 555); measured on the file: 7.0 heads chin to crown |
| 3. hair tops Yuna .36 +- .03, Rikku .47 +- .04, Paine .52 +- .04 (part 1's crouch: .406, .505, .542) | **Yuna .359, Rikku .478, Paine .519: all in band.** Yuna's root projects at y 1.01 (her stance's feet are in front of her origin, as in part 1) |
| 4. no girl looks at the floor | **Held** |
| 5. the weapons may look held low in the upright idle | **Partly**: at the idle rig the pistols and daggers sit at the hips, the sword runs level at Paine's hip; acceptable; at the party rig they read as "ready at the hip". A polish item (A6) |
| 6. mean luma 137 +- 6 | **136.4** (party rig 143.4, enemy rig 135.8) |
| 7. no neck seam or stretched texture band | **Held** at this size (stills `13`, `14`, `15`) |

**J2 (the wet floor): PASS.** The mirror drew first time: the door's wheel, the flames, the waterfalls, Valefor's claws and the girls' boots stand on their reflections; mean luma **129.5** idle rig (the sand's 136.4 was the brighter floor), 122.5 party rig; hair tops unchanged (.358).

**J3 (hudfit): the part-1 overlap is gone.** The NEXT BEST MOVE card [773, 675, 1137, 835]; Yuna [122, 313, 255, 837], Rikku [447, 436, 581, 804], Paine [702, 468, 762, 790]: overlap 0 px for all three (Paine's right edge is 11 px from the card's left edge; part 1: 48 px inside it).

**J6 (the air) and J7 (the new Valefor): looked at as stills.** The waterfalls first drawn 3.4 times as wide with their picture stretched were a blocky white-blue wall, the brightest thing in the room: they are 2.6 times as wide now, the picture repeats across them and the colour is dimmed to 0.82 (they read as cascades, like the concept frame). The new Valefor stands in the same place at the same 5 m: her wings, plumes and armour read, her colours are the frame's (teal body, green and yellow wings, gold armour, blue plumes) rather than the flat v2's; her hull outline follows the wing flap.

**J8 (the clips): PASS.** One job: the showcase rigs (idle, party, enemy; the battle layer hidden), a full fight to a win with the battle layer drawn invisible by CSS (the menus still take the keys), and a knock-out run, all recorded in high quality. The fight by real keys: Valefor's Attack on a girl, Yuna's Protect (cast), Paine's and Rikku's attacks, Sonic Wings, the Energy Ray, a last blow (the harness brought Valefor low), `victory`, the victory poses (the engine holds them 3.3 s, then the results screen), back to the board. The girls return to the upright idle after each action; the strike runs in and back; no spin or pop at a cut in the sampled frames. **Not frame-stepped**: the clips are for Bailey's eye.

### P2.5 The clips

In the lane's scratch (nothing from it is committed): `1-idle.mp4` (the target shot), `2-attack.mp4`, `3-cast.mp4`, `4-hit.mp4`, `5-ko.mp4`, `6-victory.mp4` (5 s: the engine's own pose time), bonus `7-party-closeup.mp4` and `8-valefor-closeup.mp4`, and `contact-sheet.png` (a row per clip, three frames each). 1600x900, H.264, no sound, each under 10 MB.

### P2.6 What is a stand-in (part 2's view; part 1's list stands where not replaced)

- **The temple** is still the Wind Waker chapter's stage (R 12 m, blue brick, procedural, the Meshy kit), now with a stone floor, a mirror, wide waterfalls, mist and motes. Still missing against the concept frame: the steps up to the door, a real pool, natural vines.
- **Valefor** is a static mesh (one file, no skeleton): the flap is the vertex shader's, the hover and bob are code, as for v2. Her colours are Meshy's, regraded; her face (a beak and a red gem) is small on screen.
- **The idle** is the Wind Waker cast's, retargeted; **the victory** likewise; **the attack, hit, cast and ko clips are still the Meshy toon girls' own** (gestures, not weapon actions: the strike does not meet the weapon).
- **The weapons** are the Wind Waker chapter's files at 1.3; no thumb mount.
- **The proportions** are a free geometric pass, not a remodel: the head is a uniform scale (the face keeps its look), the arms and legs are stretched along their bones, nothing is re-sculpted; a sleeve, a skirt or a boot is stretched with the limb it hangs on.
- **The mirror** reflects everything including the light shaft's additive cards; it is blurred a few taps and rippled, not a true rough reflection.

### P2.7 Tools and how to regenerate

```
node tools/anime/cast.mjs --orig <dir of the stored LOD1 files> [--out <dir>] [--report]            # the three girls, byte for byte
node tools/anime/proportion.mjs in.glb out.glb --head 0.78 --leg 1.10 --spine 1.02 --arm 1.5 --slim 0.97 --neck 1.1 [--report]
node tools/anime/retarget.mjs target.glb source.glb --map idle:idle,victory:victory [--calib median|first] [--report]
node tools/anime/valefor-fit.mjs <the raw Meshy model.glb> <out.glb> --height 3.5 --min-tris 12 --saturation 1.35 [--report]
node tools/ww-models.mjs record     # after the files change: the list's hashes
```

`glbkit.mjs` is the small GLB reader and writer under them (`compactGlb` repacks a file a rewrite left bytes behind in). Valefor's picture: `Flux 2 klein 9B` (`flux-2-klein-9b-kv-fp8`, text encoder `qwen_3_8b_fp8mixed`, VAE `flux2-vae`) on the local ComfyUI from concept frame A with the prompt "remove the three girls, the temple, the waterfalls, the vines and all the scenery; keep only the large feathered winged creature; alone, full body, seen exactly from the front, symmetrical, both wings spread wide and level, the claws pointing down; plain flat light grey background; same colours, same gold armour, same feather style" (4 steps, cfg 1, seeds 11 to 14, the fourth taken). The part-1 harness is not committed (scratch); its additions in part 2 are a `--hq` recorder (CDP screencast to ffmpeg), `--hud-css`, a `showcase` mode (the rigs held for a time) and an event log with times (`cut-clips.mjs` cuts the clips by them).

### P2.8 Tests

`tsc --noEmit` clean. New or changed: `ww3d/stage-anime.test.ts` (20: the curve, the floor's name, the stone, the mirror, once per frame, low quality, dispose, the mote field, the air), `anime-tools.test.ts` (15, a synthetic rig and a synthetic static mesh: the head scaled about its joint, the soles on the floor, the IBMs the inverses of the bind pose, the clips' translations, a retarget by bone name with its lift, a replaced clip, a report that changes nothing, the Valefor fit and the repack), `ww3d/anime-files.test.ts` (15, three new: the proportion band per girl, the idle's hips, the victory window; the clip list now has `victory`), `ww3d/anime-layout.test.ts` (14: her file, the wing numbers, the points), the two models-list pins (fifteen). `node tools/orphans.mjs`: 24 modules, the same as the base, none new. **The suite:** the anime and Wind Waker files were re-run in the finish pass (P2.11): 34 files, 500 tests, all pass; the full suite was not.

### P2.9 What part 3 needs (the art list)

| # | Need | What | Cost / route |
|---|---|---|---|
| A3 | **A rigged Valefor** | the new mesh is static: a skeleton and clips (idle, Energy Ray cast, Blast charge, Sonic Wings, hurt, KO) so her wings and tail move as feathers, not as a bend | Meshy rig (5 credits) and animations (3 each) do not fit a winged biped well: Blender weight painting by hand; or keep the shader |
| A4 | **Temple v3** | the steps up to the door, a pool at the waterfalls' feet, natural vines | about 200 lines in `stageAnime.ts`, 3 to 5 hours; the kit 35 credits a piece |
| A5 | **A toon Besaid plate** for the board, prep and cutscenes | in place of chapter 24's painted Djose chamber | one ChatGPT Images frame (or a Flux 2 klein edit, as for Valefor); Bailey alone approves |
| A6 | **Weapon mounts and weapon-true attacks** | the lab's "thumb" mount; the strike meeting the weapon; the pistols aimed by the arm, not by the wrist | a `mount` field on `PropSpec`; clips by retarget from the Wind Waker cast's `attack` (it carries the weapon action) |
| A7 | **Bailey's eye** | the proportions (P12), the upright idle (P14), the floor and the air (P16, P20), the new Valefor (P17), the look default and the cast in motion | the clips |

### P2.10 Open issues

1. **Bailey's eye** on all of it (the clips are in the lane's scratch): a miss on "AI slop" is a written method check (rule 15), not a third try.
2. **The upright idle may read as a pose, not a stance**: the girls stand relaxed until a command; if he wants a ready stance, the choice is P14's alternatives.
3. **The mirror's cost**: it draws the room once more per game frame; measured only as "no console error and about 40 captured frames a second on the RTX 5070 Ti" (with the new Valefor's 25 thousand triangles and her hull drawn twice). Not measured on a weak GPU (the low-quality build has none); the door is desktop only.
4. **Valefor's wing flap on a new mesh**: the numbers are measured, not tuned in motion; a tear at the shoulders on a hard flap would show in the clips first (none in the sampled frames).
5. **The Wind Waker chapter's pixel A/B** is still owed (needs a second tree).
6. **The suite's one pre-existing failure** (`chapters/boss-art-r75.test.ts`, held-card file name) is on the branch's base as well: r75's own.
7. **Release slot**, unchanged: the chapter classes DEEP. The shipped size grew by 2.96 MB (her Valefor) and about 1.4 MB (the girls: two clips each); the build's check lists 15 files.
8. **Harness additions are scratch**: `play.mjs` is about 900 lines in the lane's folder; if the chapter is reviewed again, the clips' recorder (`--hq`) is worth moving into `tools/`.

### P2.11 The finish pass (2026-11-06, a second agent: the notes above checked against the code, the files and the clips, then merged here)

The part-2 builder pushed its code and stopped before merging these notes. This pass changed no code and no model file; it re-ran the checks below, looked at the clips, corrected two statements (C1 and C2) and wrote this section. Game case unchanged: FFX-2 only (records only).

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| the anime and Wind Waker suites | **34 files, 500 tests, all pass**: the whole `tests/unit/ww3d/` folder (`stage-anime` 20, `anime-files` 15, `anime-layout` 14, `skin` 31, `stage` 16, `staging` 8, `layout` 23, `model` 16 among them), `anime-tools` 15, `anime-door` 13, `windwaker-door` 22, `vite-ww-models` 14, `ww-models-tool` 14, `chapter-doors` 10, `chapters/exp-anime` 19, `chapters/exp-windwaker` 19, `chapters/prep-tip-band` 15. The counts in P2.8 hold. The Wind Waker chapter's own suites (`exp-windwaker`, `windwaker-door`, the `ww3d/` folder) are among them and green, as the byte-identical rule asks. The full `npm test` was **not** re-run in this pass (open issue 6 stands) |
| `node tools/orphans.mjs` | 24 orphaned modules, the base's own; none is an anime module |
| the three girls | `tools/anime/cast.mjs` re-run on the stored LOD1 files: the three files it writes equal the shipped ones **byte for byte** (the same sha256 as `tools/ww/ww-models.json`) |
| the models | `node tools/ww-models.mjs verify`: PASS (15 files). The store's part-2 folder and its second-disk backup: all 11 files equal their `SHA256SUMS` |
| the numbers in the code | `ANIME_WING`, `ANIME_BOSS_POINTS`, `ANIME_FILES`, `ANIME_NATIVE_HEIGHT`, `ANIME_FLOOR.strength` 0.55, `AIR` (2.6 times, tone 0.82, 3 mist sprites a fall, 140 motes), the aura step 0.2, the floor's name: all as P2.1 to P2.3 say. `git diff 3cee026d7 HEAD` over the shared engine files (`stage`, `layout`, `wing`, `model`, `skin`, `cel`) is exactly the table of P2.3 (a name, two optional fields, a type, fallbacks, one constant) |
| the committed diff | adds no local path, scratch folder name or account name |

**The Meshy spend, part 2.** One task, **35 credits**: the Valefor image-to-3D (Meshy 7.1, 4k geometry, 2k textures, PBR off, a 15,000 quad remesh target, image enhancement on) from the fourth klein candidate; the run's own balance reads 4,440 before and 4,405 after (a delta of 35; the run set itself a cap of 70 and made no second task). Its ledger lists that one step only: the mirrored-crop try that gave a double-headed bird is not in it. **Part 1 spent none.** Everything else in part 2 was free: Flux 2 klein on the local ComfyUI, the proportion pass, the retarget and the fit are pure node and local. No rig, animation, retexture or girl-rebuild task was bought (the 150 to 250 credit 7-head rebuild of P12 stays an option). The raw Meshy model, its map and the four candidates are in the models store and its backup.

**The clips, sampled with ffmpeg (six frames a clip, then a few at full size).** All eight are 1600x900, H.264, 30 fps, no sound, 4.4 to 9.4 MB: idle 9.5 s, attack 8 s, cast 8 s, hit 6.5 s, ko 12 s, victory 5.2 s, party close-up 6.5 s, Valefor close-up 5.5 s. What they show:

- **idle (the target shot):** the three girls stand upright and relaxed, the weapons at the hip, the heads level; Valefor hovers and flaps in front of the door; the floor mirrors everything; the waterfalls read as wide cascades with the vines and the shaft's light. No neck seam, no face damage at this size.
- **attack, cast and hit are cuts of the one recorded fight** (the girls act, Valefor takes the blows and answers), not three separate takes. **attack:** Yuna aims her pistol arm, Paine steps in and slashes, Rikku runs in, strikes and returns; grey smoke puffs and a gold star burst mark the blows on Valefor, a white wind curl sweeps from her toward the party near the end, and every girl is back in the upright idle afterwards. No spin or pop at a cut in the sampled frames (not frame-stepped).
- **cast:** Yuna's spell gesture (an arm swept out and up), Rikku's leap, cloud puffs over Valefor, the white curl; then the idle again.
- **hit:** the blow's reaction: Valefor flashes orange with a gold star on her chest at the moment of the blow, smoke puffs at Rikku's strike, Yuna aiming and Paine lunging; no girl is hurt in this cut (the girl that goes down is in the ko clip).
- **ko:** Rikku jumps, falls and lies on the floor for the rest of the clip while Yuna and Paine stand and Valefor flaps on; the lying pose rests on the floor.
- **victory (5 s, the engine's own pose time):** after the last blow Valefor is gone and the camera pushes in on the three; Yuna stands with both arms raised, Rikku with her hands up and her feet off the floor, Paine still with the sword held low.
- **party close-up:** the three at a low angle in the upright idle with a slight sway; the mirror and the torches behind; the weapons held at the hips.
- **Valefor close-up:** wings spread level, the gold armour, the blue plumes and the red gem read; the flap bends at the shoulders and no tearing shows in the sampled frames (open issue 4 stays: this is a look, not a frame-by-frame proof).

**Corrections found in the finish pass**

- **C1. The idle clip is not a pure hold.** The showcase mode holds the camera rig, but the real fight keeps running underneath with its layer hidden, so two battle effects show in the 9.5 s clip: a gold hit star in front of Rikku at about 3 s and a white curl over Valefor at about 8 s. The poses themselves are the upright idle throughout. If Bailey wants a pure hold for the target shot, the recorder pauses the battle first (a harness change, no game change).
- **C2. Only Yuna reaches 7 heads on the face measure.** P2.1's bands (Yuna 7.90, Rikku 9.02, Paine 7.01) measure the Head joint to `head_end` (the bone length; the files test pins it). The tool's own `heads` (chin to crown, the hair included, `proportion.mjs --report`) reads, before the pass and after: **Yuna 5.41 to 7.02, Paine 5.18 to 6.29, Rikku 3.45 to 4.29**. Rikku's hair mass counts as head, and she reads short and big-headed in the clips beside Yuna. That fits the Rikku of the game (the youngest, the shortest) but it is the proportion to watch for Bailey's eye (open issue 9).

**Open issues added by the finish pass** (the list of P2.10 stands)

9. **Rikku (4.3 heads) and Paine (6.3) sit below Yuna's 7.0 by the face measure** (C2): one line each in `tools/anime/cast.mjs` `RECIPES` and a re-run, then `tools/ww-models.mjs record`, if Bailey wants them taller; the alternative is the Meshy rebuild at 7 heads.
10. **The idle clip carries two ambient battle effects** (C1).
11. **No full `npm test` on the final tree**; the targeted suites above are green and `tsc` is clean.

---

# Part 1 (2026-11-06, the code), as written

## 1. What is on the branch

| sha | what |
|---|---|
| `1d4558b4d` | M0 and M1 code: the chapter, the cel material, the outlines, the face mask, the staging seam, the door, the registrations, the models list, the tests, `docs/plans/ch-anime-review.md`, the CONTRACT-CHANGES entry |
| `73edf86b7` | the real LOD1 girls run through the chapter's own code in Node (`ww3d/anime-files.test.ts`; tests only) |
| `986c11ce1` | `model.ts` and `chapter-meta.ts` back under the 400-line limit (`ModelShading` moved to `toonify.ts`) |
| `b270fdfad`, `84e7cb009` | the other hidden chapters' door, side-table, audio-routing and prep-tip suites list the anime chapter (found by the full suite; tests only) |
| (the last commit) | this handoff and the preflight's post-GPU addendum (records only) |

Branch `origin/ch-anime`, off `origin/r75-boss-art` `b98906229`; never touched `main`, the release trees or any other lane's branch.

M0 (done): the Meshy toon cast copied, never moved, into the model store (a dated folder with `hashes.json` and `SHA256SUMS.txt`, 44 files, 193,635,953 bytes, every sha256 equal to the source) and to the F: backup in the same layout (`pyrefly-models-backup/<date>/`, proved by `models-hash.mjs check`); the paper preflight (rule 15) is `docs/plans/ch-anime-review.md`.

## 2. What is playable now

Type `gear` on chapter select (no card on the board; the arrow keys never find it; on a phone the word opens nothing: the door is `desktopOnly`, decision 219q). It opens party prep, chapter 24's cutscenes and music by reference, then the fight in the Wind Waker chapter's temple stand-in: the three Meshy toon girls (about five heads, 1.60 / 1.55 / 1.70 m, the LOD1 files, 2048 px) under the anime cel material with an outline hull on their skeletons and a face that takes no shadow, Valefor (the v2 Meshy file, scaled to 5 m) with the same material, an outline that bends with her wings and the vertex-shader flap, the Wind Waker weapons on the hand bones at 1.3, the lab's low camera at (1.5, 0.37, 3.8), the hit stars and smoke and Valefor's moves of the Wind Waker chapter. The numeral is `EXP`; the title is the working title "Valefor at Besaid (Anime Style)" (no trademark).

Dev-only switches: `?look=genshin|gg|blend` (the three looks, one shader: Genshin is the default), `?look=painted` (chapter 24's own scene, the comparison), `?outline=0` (no lines), `globalThis.__ww3d` (the debug handle, with `cel` and `look`; `__ww3d.cel.style.uniforms.uADbg.value = 1` shows the face mask, 2 the raw colour).

## 3. The seam, and why nothing else changed

Every shared (non-chapter) source file the chapter touches, and why it is inert elsewhere:

| file | change | why every other chapter reads exactly as before |
|---|---|---|
| `engine/ww3d/layout.ts` | `WwStaging` (+ `WW_STAGING`, `HeadPitchFix`, `heightFactorIn`); `modelUrl`'s fourth argument | `WW_STAGING`'s every field is the constant it stands for (`ww3d/staging.test.ts`); the argument defaults to `MODEL_FILE` |
| `engine/ww3d/model.ts` | `ModelContext.staging` and `.shading` (`ModelShading`, defined in `toonify.ts` and re-exported); reads yaw, turns, hover and boss height from the staging; `prefetchModels`' fourth argument | omitted, `staging` is `WW_STAGING` and the figure is made by `toonify` exactly as before; the 15 ww3d suites and `exp-windwaker.test.ts` are unchanged and green |
| `engine/ww3d/skin.ts` | `WwSkinOptions.staging`; slots, heights, aim point and chest from it | the same |
| `engine/ww3d/pose.ts` | `HeadTurn.apply`'s optional fourth argument (raise a bowed head) | the Wind Waker chapter passes none (`staging.test.ts`: the default only yaws; the fix raises a bowed head to the limit and leaves a level one alone) |
| `engine/ww3d/props.ts` | `PropStyle` as `attachProps`' and `chooseProp`'s last argument | omitted or empty: the same scales, rotations and positions (`staging.test.ts`) |
| `engine/ww3d/toonify.ts` | `ToonSet.extras` (`SetExtras`: `drive`, `dispose`) | `toonify` returns none; `driveToon` and `disposeToon` call them only when present |
| registries, door table, canon, lookup, `artNamespace`, `experiment-scenes`, `route-pure.mjs` | one row each | additive; the door word is checked against all fifteen others |

Not changed: `src/battle/**` (rule 1), `BattlePresenter*.ts`, `tools/dist-filter.mjs` (it already ships `models-exp/windwaker/**`, so the girls' `anime/` folder ships with no new rule), `tools/ww-models.mjs` and `tools/vite-ww-models.mjs` (the list grew to 14 files; the build restores and checks them as before). **Not proven by a pixel diff: that the Wind Waker chapter still DRAWS the same pixels** (job A4 owed in full); the unit proof plus A4-lite (the chapter read on this code: the same materials, hair tops within .02 and luma 135.0 against polish 2's 135.6) is the evidence so far.

## 4. Driver picks, with the alternative of each ("driver pick, his to overturn")

| # | Pick | Alternative |
|---|---|---|
| P1 | **Number 33** (29 Keeper, 30 Maesters, 31 yrp, 32 waker); the card and the prep header say `EXP` | any free number |
| P2 | **Word `gear`**: passes `chapter-doors.test.ts`'s rule against all fifteen words (G is bound to nothing, E start, A left, R r1: the shape of `waker`). `genshin` fails it (its last two letters are the first two of `infinito`) | `guiltygear`, `genshingear`, `sumeru`, `ember` also pass; one constant in `animeDoor.ts`; the door suite's loops are the only other place the word appears (they read the constant) |
| P3 | **Title "Valefor at Besaid (Anime Style)"**: no brand on a public site | any title; one string in `chapter-exp-anime.ts` |
| P4 | **Look default A (Genshin)**, `?look=gg` and `?look=blend` as switches: the survey's evidence (A is the clearest of the three concept frames and has the least artefact risk; B has the most; C is his own phrase) and the lowest rung of his "raise the fidelity" ladder: he picks by playing, not from one more picture round | default B or C: `DEFAULT_CEL_LOOK`; or ask the 11-01 question again |
| P5 | **Desktop only** (the door's `gate`, the third hidden 3D chapter) | list it for phones after a budget check (three 2048 px skinned girls are 64 MB of GPU texture, a quarter of the Wind Waker chapter's) |
| P6 | **Hidden**: no card, not in "of 19", the save, the veteran check or play time | a card (needs a board painting; D-848) |
| P7 | **No new Meshy spend in part 1**: the plan needs none. Bailey lifted the cap on 2026-11-06 ~00:55 ("spend as much as you see fit"), so the 250 credits (a Valefor rebuild, 35; three 7-head girls, about 200) stay a part-2 option if the Blender proportion pass fails | spend now on a Valefor rebuild: the single best use if he allows any (she fills half the frame) |
| P8 | **M1 is "no proportion change"**: the girls stand at their own heights (about 5 heads), Valefor is `valefor-v2` scaled 1.43, the temple is the Wind Waker stage stand-in, the idle is the Meshy one with its bowed head raised in code | M2 (section 8) |
| P9 | **One word, one record, no second chapter**: the chapter is a spread of chapter 24 (like the Wind Waker one), with its own id, number, scene key and title and nothing else | a chapter record of its own (new data: rule 10) |
| P10 | **The girls ship in the production build** (`models-exp/windwaker/anime/`, 7.8 MB, under the allow-list that ships the Wind Waker folder) | keep them out and let the live chapter draw capsules (pointless) |
| P11 | **The girls' files are the LOD1 ones** (2048 px, 20k triangles, 2.5 to 2.7 MB each), not the 4096 px 80k-triangle masters (18 to 20 MB each) | the masters: 55 MB more on the wire and 240 MB of texture for no visible gain at 1600x900 |

## 5. What is a stand-in

- **The temple** is the Wind Waker chapter's procedural stage with its Meshy kit (R 12 m, blue brick): a stand-in in both chapters (our sources do not describe Besaid's chamber). The anime concept frames' chamber (a bigger round hall, a wet reflective floor, waterfalls, vines, god rays) is part 2.
- **Valefor** is `valefor-v2` (teal and gold, flatter and simpler than the concept frames' feathered, armoured Valefor; no skeleton: the hover, bob and flap are code and a vertex shader).
- **The idle** is the Meshy toon girls' own (a crouched combat stance, head bowed about 30 degrees: raised in code by `HeadPitchFix`); all three share it; there is no victory clip (a won fight leaves them in the stance); the `attack` clips are gestures, not weapon actions.
- **The weapons** are the Wind Waker chapter's Meshy files at 1.3 on the Wind Waker chapter's grip frame; the lab used a second mount ("thumb") for the daggers and the sword that this lane did not port: stills decide whether they need it.
- **The face fit** (`FACE_FIT`) is the lab's, read off point-cloud previews of the girls as exported; the proportion pass must re-fit it.
- **The framing**: the lab's camera tipped 2.0 degrees further to cancel the engine's lens lift of 0.04 (an assumption from the Wind Waker chapter's polish 2, to be measured: section 6).

## 6. Browser job specs, predictions first (rule 15)

The predictions were written to the lane's scratch folder at 01:33 EST, **before the first GPU job ran** (`PREDICTIONS.md`); they are copied here with the results. Harness: the Wind Waker polish-2 harness, copied into the lane's folder and adapted (`job.mjs` takes `RIG-RECORD` through `tools/rig-record-lock.mjs`, starts vite from this tree on 5311 to 5314 and stops it by pid; `play.mjs` plays by real keys from the title with the word `gear` and `?look=`); headless Chromium on the GPU (`PYREFLY_BROWSER=gpu`), 1600x900, seed 7, REDUCE MOTION off; `node tools/fx-assets.mjs ensure` first. A harness failure is not a chapter failure (the debug API may have drifted since r60).

All runs 2026-11-06 06:33 to 07:22 UTC (01:33 to 02:22 EST) on the RTX 5070 Ti (ANGLE D3D11), one job at a time under `RIG-RECORD`. Evidence (the stills, the logs, the JSON) stays in the lane's scratch folder; nothing from it is committed.

### A1 and A2. Smoke by real keys, three looks, three rigs (RESULT: PASS; one prediction band missed)

`--mode var-genshin`, `var-gg`, `var-blend` (the battle layer hidden, the idle, party and enemy rigs, 3 stills each, plus the measure read of `__ww3d`, the camera and the renderer's books).

| Prediction | Result |
|---|---|
| 1. `gear` opens prep, EXP numeral, no card; cutscenes chapter 24's; the fight in the temple | **Held.** `confirmed "exp-anime"`; the prep header reads "EXP . VALEFOR AT BESAID (ANIME STYLE) . BESAID TEMPLE"; the board still draws the 19 cards (still `05`); BATTLE START card 560 ms, loading card 1,214 ms after |
| 2. console errors 0, page errors 0, failed requests 0; no `cel patch failed` or `outline patch failed` | **Held** in all three looks (counts 0/0/0, HTTP errors 0, the run's only `[ww3d]` line is `swapped in: props/pistol, props/sword, props/dagger, temple/wall, temple/brazier, temple/door, temple/pillar`) |
| 3. the girls and Valefor carry their own files, cel | **Held.** `skin.carrying` is `own` for yuna, rikku, paine and x2-valefor; every material of all four is `cel`; no capsule line in the log. (The harness counts failures, not requests: 11 files under `models-exp/windwaker/` were not counted one by one; none failed) |
| 4. idle rig, HUD off: Yuna's hair top .36 +-.04, Rikku .47 +-.05, Paine .52 +-.05, Yuna's boots .93 to .99, Valefor's claws .71 +-.04, luma 120 to 145 | **Yuna .406 (MISS of the band by .006: the band was the idealised box's .357; the number is the crouched stance's, and equals the lab's own still, .405, taken with no engine at all)**, Rikku .505, Paine .542 (both in band), Valefor's claws .706 and mouth .15, Yuna's boot soles about .96 in the still (her root origin projects at .997 to 1.011: the stance's feet are in front of it), mean luma **137.0** genshin, 125.2 gg, 130.9 blend (over 240: 3.4, 2.7, 3.5 percent) |
| the lens lift | **Confirmed**: the engine camera carries a view offset of (64, 36) of 1600x900, i.e. 0.04 of the frame's height; the 2.0 degree extra tilt (17.6 against the lab's 15.6) cancels it, and the hair top lands on the lab's number to within .001 |
| 5. the looks differ as written | **Held** (stills `look-*`): Genshin a thin brown line and a soft lilac shadow; GG a thick near-black line, ONE flat violet shadow on cloth, no bloom, the hardest read; blend GG's lines on Genshin's light with bloom. Faces clean (no blotch, no line across the eyes) in all three; hair keeps its own colour; the flames and the shaft are the only glows |
| 6. the heads are raised | **Held**: no girl looks at the floor in any rig |

Valefor's outline follows her wings in the stills (the hull vertex hook ran). The mask view (`?look=genshin` with `__ww3d.cel.style.uniforms.uADbg.value = 1`, still `debug-face-mask-party`) puts the face disc on each girl's face and nowhere else.

### A3. Leaving the fight and entering again (RESULT: no growth worth a finding; one data point, not a proof)

`--mode stills --reenter` (a full fight to a win, back to the board, `gear` again, prep, the fight's opening). `renderer.info`: first entry 62 geometries, 49 textures, 51 programs, JS heap 257 MB; second entry **66, 50, 55, 257 MB**. Prediction was "within 10 of the first": held. Not claimed: that nothing leaks (two points); the hulls' geometry and the shared skeleton are freed once, pinned by `celify.test.ts`; the four extra programs and one geometry are the fight's own effects compiled and built at their first use and kept by the renderer's cache. A third entry would say whether it is flat.

### A4 (lite). The Wind Waker chapter on this code (RESULT: unchanged within the noise; NOT a pixel diff)

The pixel-for-pixel proof against a build of `origin/r75-boss-art` was not run (it needs a second tree and `node_modules`, and this lane may not create junctions). Instead the Wind Waker chapter itself (`?ww=hd`, the same harness, `waker` typed) was read on this branch's code: carrying `own` for all four, materials `toon` (not `cel`), idle-rig hair tops **.326 / .485 / .537** (polish 2's mask measure: .330 / .468 / .553; this read is the head bone plus the hair's rise, a different method: within .02), Valefor's claws .705, **mean luma 135.0** with the HUD off (polish 2: 135.6; prediction +-8), console 0/0/0. The seam did not move it. The full A/B stays owed to the release's focused review (W5 in `ch-waker.md`).

### A5. A full fight to a win by real keys (RESULT: PASS)

`--mode stills --seed 7`: title, board, `gear`, prep, the four cutscene beats, the fight (the party's attacks, a Protect cast, Valefor's attack, Sonic Wings, Energy Ray and Energy Blast, all four seen), the boss brought low by the harness's HP hook, `result: victory` at 102.6 s, the victory poses, the results screen, back on the board. Console 0/0/0, no HTTP error. Every hit draws the Wind Waker star burst and smoke on the girl or on Valefor (stills `fight-*`); a girl's cast shows a warm gold fill and rim (`fight-cast-protect`: **a little strong: Yuna's white top reads yellow for the cast's length; the toon's fill (`GLOW_FILL`) is the same number, but the cel's lit colour is nearer the ceiling, so it shows more; a polish item, not a defect**); the girls return to the stance after each action (no victory clip: they hold it). Mean luma 104 to 114 in the HUD-on fight stills (the menus darken the frame).

**Found in the fight (not fixed here, see section 9):** with the command menu open the **NEXT BEST MOVE card overlaps Paine's legs** (stills `fight-sonic-wings`, `fight-energy-blast-hit`): the Wind Waker chapter moved Paine's slot 0.26 m left in its polish 2 to clear this card; the anime lab's layout never had a HUD.

### A6. The HUD against the girls (read only; RESULT: one overlap found, not fixed)

`--mode hudfit`: once the NEXT BEST MOVE card is up (the first command menu), the card's rectangle and each girl's box of projected bones (px at 1600x900; boots, hair and weapons reach a little past it): card **[773, 675, 1137, 835]**; Yuna [31, 345, 364, 832], Rikku [454, 438, 582, 808], Paine [663, 489, 821, 783]. Overlap with the card: Yuna 0, Rikku 0, **Paine 5,184 px^2: the card's left edge stands 48 px inside her right edge**. The Wind Waker chapter's polish 2 cleared the same card by 26 px by moving Paine's slot 0.26 m left. Here 26 px of clearance is about 75 px, about 0.4 m (the frame is 8.3 m wide at her depth, 193 px a metre): her slot (1.1, -1.3) would go to about (0.7, -1.3), which tightens the diagonal against Rikku (x 0.15) and changes the picture the lab approved; **left for the layout re-fit after the proportion pass (M2: the slots move then anyway), with this number as the target to clear**. Not a defect of the code: a staging number the lab never measured against the HUD.

### A7. The knock-out (RESULT: PASS)

`--mode kotest`: the three girls put at 1 HP by the debug hook, the harness plays the command menu by keys so that Valefor acts. A girl goes down: `actor.lifeState` is `down`, her model's `playing` is `ko` and `falls` is true, i.e. **she lies down by her own Meshy `ko` clip and the skin does not tip her over**; she falls, lies on the floor and holds there (stills `ko-sequence-sheet`: Rikku hit mid-air, the Yuna cut-in, then Rikku on her side on the floor, the stance of the others undisturbed). Paine and Yuna fell the same way, 10 s apart, and the fight ended in the engine's `defeat`. Not checked: the revive's stand-up. (The first four runs of this job failed on the harness, not the chapter: it hid the HUD, which removes the command menu the loop plays, and its state read threw on a field the skin does not publish.)

### What was not run

The pixel A/B of the Wind Waker chapter against a build of the base (A4 above), a third entry for A3's trend, a frame-accurate motion review (one clip WAS recorded, `--mode video`, 1 min 44 s at 25 fps with the fight to the win, console 0/0/0: a 16-second excerpt of the first attack round, the Genshin look, was cut to an mp4 and 16 frames of it sampled at 1.5 per second into a contact sheet: the girls run in, strike and return to the stance, Yuna's Protect cast, Valefor's Sonic Wings swirl and her wings flapping, no spin or pop at a cut in those frames; the clip is for Bailey's eye, which is the next step, and was not frame-stepped here), the phone (the door refuses it, `anime-door.test.ts`), a production build (`vite-ww-models` and the dist filter are pinned by `ww-models-tool`, `vite-ww-models` and `dist-filter` tests; no build was made).

## 7. Tests

`npx tsc --noEmit`: clean. `node tools/orphans.mjs`: 24 orphaned modules, all the same ones as on the base, none new. Run with `TEMP=TMP=<the scratch tmp>` and `--maxWorkers=4`.

- **New (110 tests in 9 files, all green):** `ww3d/cel.test.ts` (12: the patch against three's own chunks, the three looks, the ramp, the material), `ww3d/outline.test.ts` (10), `ww3d/face-mask.test.ts` (9), `ww3d/celify.test.ts` (16: the cel on a girl, Valefor's hull and wing hook, `driveToon` and `disposeToon` over a cel set, a `WwModel` and `loadWwModels` handed the anime staging and shading), `ww3d/anime-layout.test.ts` (11: the lab's composition after the lens lift, every rig), `ww3d/staging.test.ts` (8: the seam's defaults), `ww3d/anime-files.test.ts` (12: the real LOD1 girls through the real code, skipped on a disk without them), `chapters/exp-anime.test.ts` (19: hidden, chapter 24 by reference, the same event log on seeds 1 and 2 and a defeat with the real content registered, the scene row, the canon row, the models ship), `anime-door.test.ts` (13: G unbound, E start, A left, R r1; the word against every other, the board, the phone gate). Helper: `helpers/animeFixtures.ts`; `helpers/wwRealFiles.ts` `stripImages` now also drops the normal, occlusion and emissive references.
- **Changed existing tests (pins that list the hidden chapters, all additive):** `chapter-doors`, `critic-route-doors`, `r74-hidden-3d-phone-doors`, `gagazet-door`, `yojimbo-door`, `summon-door`, `scene-backdrop-file`, `ui-ffx-guide-folded-scenes`, `art-url-sources`, `ww-models-tool` and `vite-ww-models` (11 files to 14), `chapters/exp-windwaker`, `exp-fayth`, `exp-yrp-3d` (the side table's order and length), `audio-music-batch1` and `batch2`, `chapters/prep-tip-band` (33 chapters).
- **The Wind Waker chapter's own proofs, unchanged and green:** its 15 `ww3d/*` suites and the 19 tests of `chapters/exp-windwaker.test.ts` (one pin moved: its scene row is now second to last in the side table).
- **The full suite on the final tree** (`npx vitest run --maxWorkers=4`, run in the background and polled; the first full run, made before the pins were fixed, found twelve failing tests and one file that would not load: eight tests were this lane's pins in the list of hidden chapters (fixed), three tests in two files and the file that would not load read doc files missing from this sparse worktree (`art-ref-defaults`, `macalania-party-layout`, `pause-living-portrait-warp`; those few files are checked out with `git sparse-checkout` now, nothing committed), and one is explained below): **1,979 files: 1,949 passed, 29 skipped, 1 failed; 30,626 tests: 30,397 passed, 227 skipped, 1 todo, 1 failed.** The one failure is `chapters/boss-art-r75.test.ts` "nothing under src/ names any of them" (`pause/ch29-spectral-keeper-card.png` is named in `src/data/chapter-spectral-keeper.ts`): it fails identically on `origin/r75-boss-art` `b98906229` (that file is unchanged by this lane) and is r75's own to settle. No load flake appeared in the final run.

## 8. What part 2 needs (the art it needs, as a list)

Nothing blocks the part-1 build; it plays with what is on disk. Does not exist, would improve it, in the survey's order (M2, M2b) and the part-1 build's own findings:

| # | Need | What | Cost / route |
|---|---|---|---|
| A1 | **Taller proportions** | the girls from about 5 to about 6.5 or 7 heads (the concept frames'): head x0.75 and the body 5 to 12 percent taller, by a rest-pose proportion pass in headless Blender (one girl as the pilot, with a preview sheet), baked into the mesh and the inverse-bind matrices; then `animeLayout.ts`, the camera and `FACE_FIT` re-fitted | 5 to 7 CPU hours for the three girls, zero credits; if the pilot fails his eye, a Meshy rebuild: 150 to 250 credits (cap lifted 2026-11-06) |
| A2 | **An upright idle and a victory** for the three girls | the Wind Waker cast's "Idle 9" and victory clips retargeted by bone name (the toon girls share the Wind Waker cast's 24 Meshy bone names; a bone-name retarget exists in the lab's `build_glb.py`); or 3 credits per girl for a Meshy library action | 2 to 3 CPU hours, zero credits |
| A3 | **A rigged, feathered, armoured Valefor** | the concept frames' Valefor: idle, Energy Ray cast, Blast charge, Sonic Wings, hurt, KO; or the real FFX-2 Valefor (m164, dark and fallen: faithful to the game, not teal and gold) | 35 credits for a new Meshy mesh; the rig and clips are Blender work |
| A4 | **Temple v2** | the concept frames' chamber: a planar reflection floor, a scrolling water shader, instanced vines, longer light shafts, a moss and stone palette; optionally four new kit pieces | `stageAnime.ts`, about 300 lines, 8 to 10 hours; the kit 35 credits a piece |
| A5 | **A toon Besaid plate** for the board, prep and cutscenes | in place of chapter 24's painted Djose chamber | one ChatGPT Images frame; Bailey alone approves |
| A6 | **Weapon mounts** | the lab's "thumb" mount for the daggers and the sword, if the stills show them held wrong | a `mount` field on `PropSpec` |

## 9. Open questions for the driver (none blocks the next step; all are his to overturn)

1. **Bailey's eye**: the look default (Genshin), the cast in motion (the cast he called "AI slop" on 2026-10-20 under another shader, picked for this chapter on 2026-11-01), Valefor against the concept frame, the title and the word. A miss is a written method check (rule 15), not a third try.
2. **Release slot**: the chapter classes DEEP (`critic-plan`: a focused review before the deploy, a deep review on the live build after). Bundle with release 75 or its own release 76 behind the focused review: the driver's call; at most two deploys may go out while a deep review is owed.
3. **Door suites** cost the square of the number of doors (16 now): this lane's `anime-door.test.ts` is the short form; the full ones (`windwaker-door` and its siblings) are untouched (the table's own tests cover the new row). Three of the siblings (`gagazet-door`, `yojimbo-door`, `summon-door`) pin the whole word list and now say `gear` too; each full door suite still costs about 14 s on a quiet machine and over 60 s on a busy one against the 15 s default: a load flake there is re-run alone, not a failure.
4. **Ledger rows** (the driver's): the branch, the models store and F: copy, the models list growth, the picks P1 to P11 as "driver pick".
5. **The NEXT BEST MOVE card overlaps Paine's legs** with the command menu open (section 6, A6: 48 px, her slot would move about 0.4 m left): a staging number for the M2 layout re-fit, the number to clear is in A6. Also a polish item: **the cast aura reads a little strong on a cel girl** (Yuna turns yellow for the cast's length).
6. **One test fails on the branch's base, not on this lane's change**: `tests/unit/chapters/boss-art-r75.test.ts` "nothing under src/ names any of them" (`pause/ch29-spectral-keeper-card.png` is named in `src/data/chapter-spectral-keeper.ts` at `b98906229`); the lane did not touch either file.
7. **A lane slip, harmless**: one browser job (the HUD read) was started from a shell with `&` inside a subshell instead of the tool's background mode; it took and released the lock normally and left no server running.
8. **Correct D-1438's time** (the question stood open from 2026-10-22 21:32 EDT, the answer arrived 2026-11-01 14:30 EST) and note in the promises tracker that the Genshin version is built in part 1 (D-1225's first hit was false).

## 10. CHANGELOG lines (game tag; for the release that carries the chapter; not applied to `CHANGELOG.md`, which belongs to the release driver)

The player note (`src/app/changelog/releaseNotes.ts`) names no hidden chapter and no secret word, so none is owed; the lines below are the engineering CHANGELOG's, and they leave the typed word out too.

- **FFX-2 only, a new hidden chapter in an anime cel-shaded style: "Valefor at Besaid (Anime Style)" (Chapter 33, branch `ch-anime`, no card on the board).** Yuna, Rikku and Paine, about five heads tall with an outline, a flat-lit face and a soft violet shadow, fight Valefor (5 m, her wings outlined) in the temple chamber of the Wind Waker chapter; three looks of one shader (Genshin by default, Guilty Gear, a blend) are switched with a query word. The fight is chapter 24's (the same numbers, moves and music); only the picture is new. Desktop only. It has no card on the board and is not part of any count or the save.
- **Both (plumbing): the ww3d models, skin, weapons, head turn and shading take an optional staging table, shading and weapon style; omitted, every value is the Wind Waker chapter's own constant.** No other chapter changes. The build now ships three more model files (`models-exp/windwaker/anime/`, 7.8 MB) and `tools/ww-models.mjs` lists them.
