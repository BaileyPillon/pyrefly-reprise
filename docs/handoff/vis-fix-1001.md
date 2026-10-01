# vis-fix-1001: visual defects from the critic visual pass on release 33

Branch `vis-fix` from main f302f163 (worktree `D:/pyrefly-r29-text`). Source:
`critic/reviews/visual-pass-2026-10-01.md` (VP-1001-xx, main tree). Presentation only: nothing under
`src/battle/**`, no RNG, no settings schema, no SaveData, no approved painting or sidecar touched, no camera
motion, nothing that moves the HUD. Not pushed, not deployed.

Evidence for every item: `D:/Tools/pyrefly-scratch/2026-09-30-visual/vis-fix/` (`shots/*-before.jpg` from the
f302f163 production build served by `vite preview`, `shots/*-after*.jpg` / `*-final.jpg` from this branch on
the dev server, headless Playwright with `PYREFLY_BROWSER=gpu`; the capture scripts sit next to them).
Side-by-side PNGs: `docs/screenshots/vis-fix-1001-*.png`.

## Fixed (16 commits)

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
