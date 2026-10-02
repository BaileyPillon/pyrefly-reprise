# vis-fix-1001: visual defects from the critic visual pass on release 33

Branch `vis-fix` from main f302f163 (worktree `D:/pyrefly-r29-text`). Source:
`critic/reviews/visual-pass-2026-10-01.md` (VP-1001-xx, main tree). Presentation only: nothing under
`src/battle/**`, no RNG, no settings schema, no SaveData, no approved painting or sidecar touched, no camera
motion, nothing that moves the HUD. Not pushed, not deployed.

Evidence for every item: `D:/Tools/pyrefly-scratch/2026-09-30-visual/vis-fix/` (`shots/*-before.jpg` from the
f302f163 production build served by `vite preview`, `shots/*-after*.jpg` / `*-final.jpg` from this branch on
the dev server, headless Playwright with `PYREFLY_BROWSER=gpu`; the capture scripts sit next to them).
Side-by-side PNGs: `docs/screenshots/vis-fix-1001-*.png`.

## Fixed (11 defects, 16 code and test commits plus this handoff)

| VP | Game | What changed | Proof |
|---|---|---|---|
| 16 major | FFX only | `src/ui/ffx/minigames/index.ts` names the Swordplay, Bushido and Slots overlays from the ability data (`abilityId` → name); the engine event is unchanged | live: the overlay opened for `spiral-cut` read "Slice & Dice" on f302f163 and "Spiral Cut" here (`shots/odname-swordplay-{before,after}.jpg`); `tests/unit/vis-fix-overdrive-name.test.ts` |
| 05 major | both | `src/engine/KoPoseScale.ts`: head-matched KO scales in src (Yuna 0.52, Auron 0.45, Wakka 0.58, Lulu 0.47, Kimahri 0.58, Rikku 0.56; Yuna Gunner 0.60, Black Mage 0.66, White Mage 0.64; Rikku Black Mage 1.15 replacing its sidecar 0.75). Applied in `PaintedArt.tryLoadMeta` | head sheets `vis-fix/ko-scale/*-compare.jpg`; live Ch I and Ch VI KO frames (`shots/seymour-flux-ko-*`, `shots/ffx2-leblanc-ko-*`); `tests/unit/engine/ko-pose-scale.test.ts` |
| 04 major | FFX-2 in practice | `src/engine/KoFallback.ts`: a party figure whose `ko` resolves to another painting is laid down with the shipped `lieDown` (FF7's readable 0.55 tip) at the KO beat, at defeat and when staged already down; the revive stands it up | live Ch XIII: Yuna DK and Rikku AL stood at 0 HP before, lie down after; revive stands Yuna up (`shots/ffx2-trema-{ko,revive-yuna}-*`); `tests/unit/engine/ko-fallback.test.ts` |
| 28 polish | FFX only | `src/engine/SentCompanions.ts`: Mortiorchis is dissolved 200 ms after Seymour Flux and removed before the victory (research `ffx-seymour-flux.md` §5 "one creature", post-battle row 9 "dissolves into pyreflies") | live: at 1.3 s Mortiorchis still stood before, gone after; staged list `[tidus,yuna,kimahri,mortiorchis]` → `[tidus,yuna,kimahri]` (`shots/seymour-flux-death-*`); `tests/unit/presenter-sent-companions.test.ts`, the M1 test in `natus-ship-content.test.ts` updated |
| 03 major | FFX-2 only | eye-candy A room entry `den-of-woe` (`fx/a/sceneLooks.ts`): no star streak, light look, no extra vignette, and an optional per-room grade correction (gain per channel, black-point lift, less split tone) that `GoldenHour` applies and `applyPalette` restores | live Ch XV: navy void with four-point flares → teal floor, rock walls readable, round motes (`shots/ffx2-den-of-woe-rest-{before,final}.jpg`; floor RGB 0.006/0.086/0.307 → 0.043/0.256/0.401 against the A frame's 0.134/0.267/0.325). Partial: still darker than the mockup; the plate itself reads darker in the pipeline than its PNG in every room, which is not this item's to change. `tests/unit/den-of-woe-look.test.ts` |
| 31 polish | both | `src/engine/ShadowCutout.ts`: three r186 copies the object material's `map`/`alphaTest` onto custom depth materials each shadow pass, emptying the figure cut-out; the figure ShaderMaterial now carries both | live Ch XIII: depth material read `map null, alphaTest 0` before, `map set, 0.4` after; quad slabs → figure shadows (`shots/ffx2-trema-rest-{before,final}.jpg`); `tests/unit/engine/shadow-cutout.test.ts`. Every room whose rig casts shadows changes the same way |
| 30 polish | FFX-2 only | `src/engine/PlateSkirt.ts` + `road-to-the-farplane.ts`: a mirrored strip of the plate under it, so the stone continues below the frame; the approved sky does not move | live Ch XI bottom band gone (`shots/ffx2-fallen-aeons-rest-{before,after2}.jpg`); `tests/unit/engine/plate-skirt.test.ts` checks every rig's lowest ray |
| 17 polish | both | `fx/a/KeyRim.ts`: the key rim width is capped at 1.5 screen px from each figure's texels per pixel (0.75-texel floor); the dense party keeps its width | live Ch V and III (`shots/ffx2-vegnagun-shuyin-rest-*`, `shots/braskas-final-aeon-rest-*`); `tests/unit/engine/key-rim-width.test.ts` |
| 23 polish | FFX-2 only | eye-candy A room entry `farplane`: bloom 0.86 / x0.9 (the scene's own palette blooms only above 0.9; D's default 0.45 / x1.5 washed the girls) | live Ch V: Rikku DK's face readable (`vis-fix/rikku-v2.jpg`); `tests/unit/farplane-look.test.ts` |
| 06 major | both | `src/engine/ContactBeat.ts`: the attack lunge runs to its impact frame and holds there until the first hit or miss on someone else releases it; an early hit waits for the apex (both capped). `PaintedActor.lunge` gained an optional contact (CONTRACT-CHANGES 2026-10-01); the miss beat moved into the beats (`missed`) | live Ch I with real keys, three attacks: attacker extension on the recoil frame 0.40 / 1.01 / 0.86 of 1.4 before, 1.4 / 1.4 / 1.4 after, after a ~100 ms contact hold (`vis-fix/contact-seymour-flux-{before,after}.json`); `tests/unit/engine/contact-beat.test.ts`. Per-command lunge profiles not done (a new look, EC-1001-04) |
| 38 polish | both | `nextLifeState('down', 'victory')` stays down: a KO'd member no longer stands up and cheers at the victory | proved first: on f302f163 a KO'd Kimahri went to pose/life `victory`; here `ko`/`down` (`shots/seymour-flux-victory-ko-kimahri-*`); `tests/unit/engine/actor-life.test.ts` |

## Skipped, and why

| VP | Why |
|---|---|
| 01 major | The approved 1.4 s spherechange beat needs its own Full/Short/Off settings row (settings schema is out of scope here) and the fix hint asks to confirm the target with Bailey first. |
| 02 major | Party/enemy depth staging across 9-12 chapters: the hint itself says show Bailey framing options first (EC-1001-05). |
| 15 major | Traced: the white card is `SpherechangeFlourish`'s §4.5.4 light column (HUD DOM, `spherechange-flourish.css`), built to the approved visual-bible spec ("a vertical #FFFFFF light column ... the new outfit resolving on frame 9"), not a texture-load placeholder. Changing it is a look decision; fold into 01 for Bailey. |
| 21 polish | The 0.35 actor cap is REDUCE FLASHES' value (D-220; `docs/concepts/spell-fx-2026-09-26/README.md` lines 38 and 51-52, `SpellFxParams.REDUCED_FLASH_PARAMS`), not the default; the default glow is the approved option B as mocked. The REDUCE FLASHES row is unbuilt (PR-0032). |
| 24 polish | Traced: `yunalesca-1/attack.png` has a binary alpha (no sub-0.15 pixels); the haze is opaque pale matte residue painted into the approved PNG between hair strands (`vis-fix/yl-attack-magenta.jpg`), so an alpha floor does nothing. Needs a colour-key defringe (VP-1001-18 class) or a repaint: Bailey's call. |
| 22 polish | A key/fill floor per figure changes the approved D look on every FFX-2 figure; Ch XV is lifted by the VP-1001-03 room grade, IV and XVI are left for Bailey. |
| 20 polish | The fix asks for a switch (settings schema out of scope) and is a per-game tempo choice. |
| 25, 26, 27 polish | Camera framing (victory rig, push clamp, slot 0 in Ch III): 25 is contested; moving Ch III's slot 0 right crowds the dais (scene note in `zanarkand-dome.ts`); all three belong with the framing options (EC-1001-05). |
| 32, 33, 34 polish | The splash layer sits under every HUD layer by D's design; fading HUD layers is a new behaviour of approved chrome. 34 traced: the title already draws above the painting (DOM order); the dark title loses contrast on Ixion's dark flank at that size, a placement choice. |
| 35, 36, 37 polish | HUD layout and results chrome (hudAvoid slots, phone cut-in contrast, portrait defringe at load, caption wrap): interface work outside a visual-defect pass that may not move the HUD. |

## Gates (run here)

- `npx tsc --noEmit`: clean.
- Full `npx vitest run --testTimeout=60000`: 704 files passed, 5 skipped; 10526 tests passed.
- `node tools/orphans.mjs`: 24 orphans, all pre-existing; none of the six new modules.
- Rule 7: no file over 400 lines grew (PaintedActor 2026 → 2017, BattlePresenterEvents 436 → 434, Stage 861,
  PaintedArt 860, Ports 472, Actors 505 unchanged); every new file is under 70 lines.

## Game case summary (rule 14)

FFX only: 16, 28. FFX-2 only: 03, 23, 30 (and 04 in practice). Both: 04 (plumbing), 05, 06, 17, 31, 38.

## Check (independent, 2026-10-01; did not build this)

Checked a0d5c5da against f302f163. Both were production builds (`vite build`), served by `vite preview`: the branch on 5330, f302f163's `D:/Tools/pyrefly-scratch/2026-09-30-visual/dist` on 5331, one at a time. Headless Playwright ran with `PYREFLY_BROWSER=gpu` and real keys from the title. Evidence is in `D:/Tools/pyrefly-scratch/2026-09-30-visual/check-visfix/`: `capture/` holds the new set, `pairs/` the side-by-sides and diffs, `shots/` the per-item frames and JSON, `scripts/` the drivers, and `logs/`. KO, revive, victory and spherechange beats are synthetic presenter events (presentation only), and they are labelled as such. One capture aid was injected and labelled: Tidus's gauge set to 100 for the Overdrive check.

**Gates.** The following were re-run here:
- `npx tsc --noEmit` is clean.
- `npx vitest run --testTimeout=60000`: 704 files passed (5 skipped), 10526 tests passed.
- `node tools/orphans.mjs`: 24 orphans, all pre-existing; none of the six new modules is among them.
- `verify-approved.mjs`: 365 ok, 0 mismatched, 0 missing.
- `git diff f302f163..a0d5c5da -- src/battle` is empty.
- No SaveData, save schema or settings file is touched.
- No new presenter module imports three or touches the DOM.
- Every commit names its game case.
- Rule 7: no src file over 400 lines grew. One test file did: `tests/unit/engine/actor-life.test.ts` went from 495 to 501 lines (minor).

**Per item.** Reach, hold and staged lists were measured in-page per rAF. "Synthetic" means presenter events.

| VP | Verdict | What I saw |
|---|---|---|
| 16 | fixed | Real keys in Ch I: Overdrive, then Spiral Cut. The f302f163 overlay read "Slice & Dice"; the branch reads "Spiral Cut" (`shots/fd-od-{base,fix}.json`, `od-overlay-fix.jpg`). |
| 04 | fixed | Synthetic KO in Ch IV, VI, XIII and XVI. Rikku DK and AL, Paine Warrior and Yuna DK reach `lieRoll` 1, and a revive returns it to 0 (`shots/ko-*-fix.json`, `pairs/k-trema.jpg`). The laid idle reads as a rotated standing plank (Paine Warrior in Ch VI, Rikku DK's sword in IV). It has no dim or desaturation, which the fix hint asked for (polish). |
| 05 | fixed in part | Ch I and III: Yuna, Kimahri and Auron KOs now sit near standing scale, and the phone KO stays clear of the party panel. Two subjects are not settled (`pairs/k-heads-flux.jpg`, `pairs/k-rbm-heads.jpg`): <br>- **Tidus is not in the table, and his KO head reads about 1.3x his standing head** (by eye). The handoff says "within 10 %", and the critic named Tidus in Ch I and VIII. <br>- Rikku Black Mage at 1.15 reads about 0.8x standing (by eye). That is much better than the sidecar's 0.75, but it contradicts the D-194 head-match note in its sidecar. Bailey or the critic should settle which measurement holds. |
| 28 | fixed | Synthetic Flux KO then victory: by 1.3 s the staged list is `tidus,yuna,kimahri`. Real fight (seed 3, intended): neither Mortiorchis nor Flux is in the victory frames (`pairs/synthdeath-fix.jpg`, `pairs/fd-death-fix-s3.jpg`). That run had Mortiorchis already drained when Flux fell. |
| 03 | partial | Ch XV now has a teal floor and round motes, with no four-point flares. The walls are still dark against the O-3 A frame (`pairs/r-den.jpg`). The cyan glow at the right edge is now a large soft half-disc, which is more prominent than before (polish). |
| 31 | fixed | The depth material read `map false, alphaTest 0` on f302f163 in I, IV and XIII, and `map true, 0.4` here. Trema's slabs are now figure-shaped (`pairs/r-trema.jpg`). |
| 30 | fixed | The violet band at 1600x900 is gone, and at 390x844 the floor reaches the canvas bottom. The mirrored skirt shows V-shaped crack reflections at the seam (polish, `pairs/r-fallen-seam.jpg`). |
| 17 | fixed | Rim width in texels: Vegnagun 1.44, Bahamut 3.65 and Sin 2.15, against 4.32 on f302f163. The party and dense bosses stay at 4.32, so they are unchanged. The Vegnagun halo is gone (`pairs/r-veg.jpg`). Bahamut and other dark summons now read as darker silhouettes; the "black cut-out" half of the item stays open. |
| 23 | fixed | Ch V bloom is now held to the hot light only, and Rikku's face reads. |
| 06 | fixed in part | Reach at the target's recoil was 0.86, 0.69 and 0.86 of 1.4 on f302f163 (Ch VI, FFX-2). It is 1.4 every time on the branch, in Ch VI and in Ch I (FFX, including Seymour Flux's own swing). Recoil comes 64 to 118 ms after the apex in both builds; the branch now holds the pose until it. The critic's acceptance (apex to recoil 0 to 30 ms) is not met: the hit still lands where it did, and the attacker now holds a pose at full reach for about 0.1 s. Turn pacing is unchanged, but the attacker gets home about 80 ms later. REDUCE MOTION: hold 17 to 24 ms, no added wait. |
| 38 | fixed | Synthetic KO of the whole party, then victory, in seven chapters: the fallen stay `down`/`ko` and only the revived member cheers. |

**No regression elsewhere.** All 18 chapters were captured (idle and spell at 1600x900, Ch I and IV at 390x844) and compared with the 2026-09-30 capture (`pairs/*-pair.jpg`). Each difference falls into one of four groups:
- **Explained by a fix.** The rim on low-density bosses and summons narrowed (17): Bahamut in IV and III, Vegnagun, Sin, Grothia, the Guado. Ch V bloom (23). Den grade (03). Figure-shaped shadows (31). Ch XI floor (30). Smaller KO paintings in the phone Ch I spell frame (05).
- **Capture timing, not the branch.** HP values, ATB timing, which coach card is up, and which spell was first differ in V, VI, XI, XIII, XV and the Ch I and II spell frames. Repeated runs of the same build vary as much. A Ch I idle parameter dump on both builds matches, and its rim crops match too. The first Yojimbo spell looked warmer on f302f163, but f302f163 itself repeats it warm once and cool once.
- **One consistent difference, at the same moment.** In Ch XVIII (Sin, the Face), the Fire frame on the branch is warmer and hazier: mean R 127 against 113, repeated twice on each build, with identical fx counters and clocks. The only render parameter that differs is Sin's rim width (2.15 against 4.32), so this comes from 17: the narrower rim unmasks more bright sky for the selective bloom (polish, disclosed).
- **Nothing unexplained.** No new artefact appeared in any chapter.

Frame times (rAF over 20 s, gpu, vsync 60):
- **p50 and p95 match the 2026-09-30 table in every row.**
- Ch I at 1600x900 needed three runs. Run 1 had one 1.5 s stall at idle and a 1.9 s one in the fight. Another agent's python process was holding the CPU at the time (279,000 CPU-seconds). Runs 2 and 3 were clean: idle had 0 frames over 33 ms; the fight had 2 over 33 ms, with a max of 83 to 100 ms (baseline: 3 over, max 99.9).
- Ch IV is within the baseline numbers.
- Phone at 4x: Ch I had 5 frames over 33 ms (baseline 12); Ch IV had 3 (baseline 4).

**Other observations (not this branch).** On the Ch I seed-3 victory, "Mortiorchis USES MORTIBSORPTION" and the advisor card stay on screen through the victory frames. The engine logs `heal:mortiorchis` after Seymour Flux's KO.
