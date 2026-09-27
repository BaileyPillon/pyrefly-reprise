# Battle perspectives: shot spec for the options round (2026-09-27)

**Request (Bailey, 2026-09-27 ~01:00 EDT, verbatim):** "I need very novel mock ups of how the game could
look from different perspectives, right now the characters are turned a certain way toward enemies,
explore all the possible ways it could look and which renders are likely to be perceived as quality and
presentable and visually appealing eye candy to the player playing the game."

**What this round is:** an end-state options round (AGENTS.md rule 9). Nothing is built into the game.
Bailey picks; a pick approves only what Bailey names. This file is the brief the production agents
work from; `README.md` in this folder is what Bailey reads at the end.

**Today (the baseline):** facing contract v3 (`docs/ART-PIPELINE.md` §2a). The party stands on the
left in three-quarter FRONT view, bodies turned about 45° toward the right edge and faces toward the
viewer; bosses stand on the right turned toward the left edge. The camera is a level, fairly long-lens
master from the party's side. The contract calls a flat 90° profile a reject ("reads as cardboard").
Live frames: `docs/screenshots/hotfix-21-1/r21-live-ch1-2000x890.jpg` (FFX), `...-ch4-2000x890.jpg`
(FFX-2).

## Game case (AGENTS.md rule 14), per option, from the sources

- `research/ffx-vs-ffx2-presentation.md` §2.1: FFX's battle camera is authored and never
  player-controlled; it reframes per action `[single source]`. §9.1: FFX-2 has free battle positions and
  a physical hit from behind does double damage `[single source]`, so a turning arena is mechanical in
  FFX-2 and purely cinematic in FFX, where it must not imply a facing rule the engine does not have.
- Neither source describes a fixed master angle for either game in words; every master shot below is
  **ours** (showpiece surface) unless a line says otherwise. Say so to Bailey; never sell one as fidelity.
- FF7 is out of this round: its staging is sourced and settled separately
  (`research/ff7-battle-staging.md`, party on the right facing left, a moving camera; D-240).

## The fairness rules (every frame)

1. Same two encounters for every option: **Chapter I (FFX)** and **one FFX-2 chapter** (picked from the
   inventory: approved art, a boss big enough to show scale).
2. Same moment: the lead member's first command menu, seed 1, presenter paused.
3. Same HUD state: the tutorial panels (guide, moves, coach line) hidden; what a player sees in normal
   play stays (command list, party rows, boss plate, turn order). An option that moves the HUD moves
   the same elements, as a mock, and says so.
4. Same size: 1920x1080 for every desktop frame; the phone option at 390x844 (DPR 3 capture is fine).
5. No strawmen: each option gets 2 or 3 framings tried and the best one kept (alternates kept in
   `frames/alt/`). Compose every option as if it were the one we ship.
6. Provenance on every frame, in its caption and in the README table: `REAL ENGINE / existing art`,
   `REAL ENGINE + NEW ART (candidate)`, `REAL ENGINE + POST` (an effect done offline, not in the
   engine yet), or `COMPOSITE` (assembled in 2D). The frame itself stays clean for the judges.
7. Effects must be things the engine could do in real time (Three.js passes: bokeh or tilt-shift,
   letterbox, grade, fog, rim light, contact shadows). If an effect was done offline, the tag says POST.

## The options

Coordinates are relative to the battle axis: `P` = party centroid on the ground, `B` = boss feet,
`u` = unit vector P→B on the ground, `s` = u turned 90° toward the camera side today, `D` = |B−P|,
`h` = one party member's height. Map these to world units from the stage code.

| # | Name | Camera | What the frame shows | Art it needs | Game case |
|---|---|---|---|---|---|
| P0 | **Today** | the live master | as live | none | both (ours) |
| P1 | **Today, dressed** | the live master | same angle, plus depth and light: soft background bokeh, contact shadows, a rim light from the boss side, a blurred foreground rock or crystal, a little haze. Separates "the angle" from "the treatment" | none | both (ours) |
| P2 | **Over the Shoulder** | behind the party, `P − 0.45D·u + 0.3D·s`, height `1.3h`, looking at the boss's chest, fov 35-40 | the party in rear three-quarter view in a shallow arc across the lower left third; the boss large (55-65 % of frame height), facing the player | party REAR 3/4 idles | both (ours) |
| P3 | **Hero Shoulder** | tight behind the active member, height `1.1h`, fov 40 | the active member huge in the near left foreground (rear 3/4, cropped mid-thigh), the other two small in the middle distance, the boss centre-right; background soft | active member REAR 3/4 at high resolution | both (ours) |
| P4 | **Reverse Angle** | behind the boss, `B + 0.35D·u` offset toward `+s`, height `0.9h`, looking at the party's chests | the boss as a rim-lit silhouette in the near right foreground, cropped; the party in the middle distance facing us (today's 3/4 front art already faces right, toward that foreground) | the far side of the arena as a plate (stand-in: today's plate mirrored and blurred, tagged); optional boss rear | both (ours) |
| P5 | **Side Stage** | perpendicular to the axis at its midpoint, height `0.6h`, fov 18-22 (long lens, flat) | party and boss on one line across the frame, facing each other; horizon in the upper third. Variant P5m mirrors it (party right, facing left) | none (3/4 art, never flat profiles) | ours for FFX and FFX-2; this is FF7's own framing (not in this round) |
| P6 | **Diorama** | elevated 35-45°, long lens (fov 20-25), pulled back | a painted miniature: the whole arena as a little stage, tilt-shift band sharp across the actors, top and bottom soft, contact shadows, slight saturation lift | a ground that holds up from above (test today's; else a floor plate) | both (ours) |
| P7 | **Colossus** | near the ground behind and beside the party, height `0.2h`, pitched up 15-20°, fov 45 | the boss towering past the top edge, the party small in the lower left corner | none | both (ours); strongest for big bosses |
| P8 | **Party's Eyes** | at the party's eye line, looking straight at the boss, fov 35 | first person: the boss fills about 70 % of the height, facing the player; no party figures; the party as three portrait cards along the bottom | none (portraits exist) | both (ours) |
| P9 | **Tabletop** | straight down or 75° down, long lens | a board game: the party and the boss as portrait medallions with gold rings on a painted floor | a floor plate from above (stand-in: today's ground) | FFX case shown; outlier, for completeness |
| P10 | **In the Round** | 30° elevation, fov 35, orbiting 45° off the axis | the girls around the boss on three sides: the near one in rear view, one side-on (3/4), one on the far side facing us | REAR 3/4 of the near girl | **FFX-2 only**: free positions and back attacks are FFX-2's (§9.1); in FFX it would imply a facing rule the engine does not have |
| P11 | **Cinemascope** | low (`0.5h`) behind-and-beside the party, wide lens (fov 50-55) | a 2.39:1 film frame inside 16:9 with black bands; a soft foreground element; haze or god rays; the HUD moved into the bands (party rows in the bottom band, boss plate and turn order in the top band, the command list slim over the image) | none | both (ours) |
| P12 | **Split-Diopter** | today's axis, long lens | "face and foe": the active member's painted head and shoulders huge and sharp on the left, the boss sharp and far on the right, a soft band between | none (portrait paintings) | both (ours) |
| P13 | **Proscenium** | today's master, pulled back | the battle as a stage play: a painted gold proscenium arch and curtains, footlights, a spotlight on the active member. Today's front-facing art becomes deliberate: actors face the audience | a painted arch and curtains (Ink & Gold) | both (ours); FFX-2 opens on a concert stage, a reason it may suit X-2 most |
| P14 | **Panels** | several cameras | the frame cut into three angled Ink & Gold panels: active member close, boss close, the whole stage | none | both (ours) |
| P15 | **Portrait Duel** | phone, upright 390x844 | the boss in the top half facing down at the player, the party at the bottom in rear view, the phone HUD | party REAR 3/4 | both (ours) |
| P16 | **Director's Cut** | a camera language, not one angle | a storyboard strip of 5 frames from the options above: command = Over the Shoulder, the swing = Side Stage low, enemy turn = Reverse Angle, a big attack = Colossus, victory = a low hero shot | as its parts | FFX: sourced in spirit (its camera reframes per action, §2.1); FFX-2: not sourced here, ours |

## Added after Bailey's follow-up (2026-09-27 ~01:35 EDT, verbatim)

"also which one would similar games pick? which looks the most presentable and polished with the most
eye candy? which one is most faithful and most canon? camera-moves-per-command idea?
true-over-the-shoulder angle??? please elaborate and more mockups please" / "continue what you're
doing and do that in parallel as well please"

So the round grows by these mockups (same fairness rules):

| # | Name | What | Who makes it |
|---|---|---|---|
| P2-without | **Over the Shoulder with today's paintings** | the P2 camera, no new art: every figure still shows its painted front, so the party seems to face away from the boss. The picture that explains why a true over-the-shoulder needs new paintings | stills rig |
| P2-high / P2-low / P2-wide / P2-right | **Over-the-shoulder family** | high (`1.8h`, the whole party readable), low (`0.9h`, boss towering), wide (fov 45, whole arena), right shoulder (camera on the other side, party lower right) | stills rig |
| M1 | **Camera per command** (today's paintings) | master → open Attack: crane down and dolly in low on the attacker with the target soft behind → Esc back → open Magic: crane up and truck wide so the whole line and the boss read → Esc → open Item: push in on the actor and rack focus until the field is soft → Esc. Starting point: `docs/concepts/polish/clair-command-camera/card.json` (shown 2026-09-19, not picked then), now in the real engine with the HUD, both chapters | motion rig |
| M2 | **Camera per command, true over-the-shoulder** | opening a command takes the camera behind the acting member's shoulder with the REAR painting swapped in. The swap cannot be a smooth orbit (flat paintings), so show it both ways: a hard cut, and a fast whip pan that hides the swap | motion rig |
| M3 | **Shoulder hand-off** | the turn passes (Tidus to Yuna; Yuna to Rikku): the camera cuts or slides from one shoulder to the next | motion rig |
| M4 | **Director's Cut in motion** | P16 as a 10-14 s clip: command (over the shoulder) → the hit (side stage, low) → enemy turn (reverse angle) → a big attack (colossus) → victory (low hero shot) | motion rig |
| M5 | **In the Round orbit** (FFX-2) | a slow 60° orbit round Bahamut with the girls on three sides, paintings swapped at hidden cuts | motion rig |
| M0 | **Today in motion** | the same beats with today's camera, for comparison | motion rig |
| P21 | **Cinematic Shoulder** | the best P2 or P3 framing inside P11's 2.39:1 bands with the HUD in the bands: the two strongest ideas together (added after stage 1) | stills rig |
| P22 | **Hero Poster** | a MOMENT shot, not a master: the party facing the camera in the foreground, the boss looming behind them, for the intro or victory beat. Found by accident in Ch IV's P02w (added after stage 1) | stills rig |
| P0m | **Today, mirrored** | today's camera with the party on the RIGHT facing left, the boss on the left: the only sourced series convention (FF1 per Wikipedia, FF7 informally; `research/battle-camera-perspectives.md` §A.3). FFX's own screen side is unattested. Chiral figures mirrored as a tagged stand-in | stills rig |
| P20 | **Canon reconstruction** | ON HOLD (2026-09-27 ~02:10): `research/battle-camera-perspectives.md` found no text source that describes FFX's or FFX-2's command-input framing (§A.2, open question 1). Only the game itself can show it: a check in Bailey's Steam copy, which takes over his screen and needs his yes | — |

## Engine facts the rigs work from (survey, 2026-09-27)

- Camera: one `PerspectiveCamera` (`src/engine/Renderer.ts:145-147`, fov 34, `(0,3.4,9)` looking at
  `(0,1.4,0)`), wrapped by `BattleCamera` (`src/engine/BattleCamera.ts`) with named rigs
  `{position, lookAt, fov, sway}`, `moveTo`/`snapTo`, sway, shake, push/punch, roll. Scene rigs in
  `src/scenes/*.ts` (idle fov 32). Colossus precedent: `src/scenes/farplane-colossus.ts:94-105`.
- Actors: fixed vertical planes, NOT full billboards (`src/engine/BattlePresenterActors.ts`): world
  facing party +x, enemies −x; mirroring by negative `scale.x`; an eased yaw toward the enemy up to 26°,
  clamped to 34° off the camera's azimuth (`window.__pyrefly.interimYaw(false)` turns it off). Party
  height 1.82, enemy default 4.1 (`BattlePresenterStage.ts:190`), contact-shadow blob per actor, real
  cast shadows, a per-actor rim-light uniform.
- Set: ONE forward-facing painted plane (`src/engine/Backdrop.ts`: width 118 at z −46, two parallax
  layers at z −26 and −12.5, a hue-matched ground plane 150 wide, three mist planes, fog 16-62). A
  camera turned 180° sees nothing painted: the reverse angle needs a plate added behind (a new painting,
  or a tagged stand-in).
- Post: `Renderer.ts:149-176` bloom (figures masked out) → tilt-shift H and V (banded, not depth
  DoF: `src/engine/shaders/TiltShiftShader.ts`) → grade (lift/gamma/gain, saturation, vignette, grain;
  `src/engine/shaders/GradeShader.ts`). Reachable at `window.__pyrefly.app.renderer`
  (`.tiltH`, `.tiltV`, `.gradePass`, `.bloomPass`, `.composer`, `.camera`).
- Debug API (`src/debug/api.ts`): `await __pyrefly.waitReady(); __pyrefly.setSeed(1);
  await __pyrefly.gotoChapter('<id>', {skipCutscenes:true, auto:'intended', speed:'skip'});
  const b = __pyrefly.battle(); b.setPresenterPaused(true); b.stage.opts.{battleCamera,camera,scene};
  b.stage.actor('<combatant id>')`. Chapter ids: `seymour-flux` (Ch I, FFX), `ffx2-bahamut` (Ch IV,
  FFX-2).
- Prior mock kit to start from: `docs/concepts/vegnagun-colossus-2026-09-26/mock-scripts/`
  (`repl.mjs.txt` Playwright REPL with /eval /shot /key /cast; `stage-lib.js.txt` place/rigs/grade/bg/
  restore; `drive.mjs.txt`; `build-sheets.py.txt`).

## Art facts (survey, 2026-09-27)

- Ch I party idles (right-facing 3/4 front): Tidus 730x1132, Yuna 803x1075, Kimahri 768x1198; boss
  `seymour-flux-body` idle 750x1211 (left); add `mortiorchis`; plate `gagazet` 2688x1536. Approved hash
  sets: tidus, yuna, auron, seymour-flux-body. Kimahri is not hash-locked.
- Ch IV party: `yuna-white-mage` 581x1183, `rikku-dark-knight` 787x1205, `paine-warrior` 408x1180;
  boss `ffx2-bahamut` 1024x1024; plate `bevelle-underground`. All candidates (not hash-locked).
- No rear, back or profile battle painting exists. A from-behind Cindy and a full-profile Sandy were
  tried and withdrawn in the Fallen Aeons round. The pause-screen Living Portrait rig has head turns
  and turnaround clips (`docs/concepts/pause-until-dawn/prototype-v2/...`), heads only.
- Pipeline: ComfyUI + Animagine XL 4.0 Opt + IP-Adapter "Method F" (square-padded idle + head crop,
  weight about 0.3-0.4, ease in, window 0.2-0.6), rembg isnet-anime cut-out, sidecar JSON; about 15 s a
  render. The facing contract bans back views in the negative prompt, so rear views need their own
  phrasing. Chiral subjects are rerolled, never mirrored (Kimahri's broken horn; Auron's coat).

## Shared worktree and hand-off between the agents

- Worktree `D:/pyrefly-mock-persp` (detached at `d74b53f7`, sparse: no `docs/screenshots`), junctions
  `node_modules` and `public/art` → the main tree (READ ONLY: never write under `public/art`).
  New candidate art goes to `D:/pyrefly-mock-persp/public/mock-art/<subject>/<view>.png` (a real
  folder, served by the dev server at `/mock-art/...`).
- Ports: stills rig vite 5241 + REPL 5251; motion rig vite 5242 + REPL 5252. Each rig uses its own
  scratch vite config inside the worktree with its own `cacheDir`
  (`D:/pyrefly-mock-persp/.vite-cache-<rig>`), so the two servers and the main tree's servers never
  share a dependency cache.
- The art agent writes `docs/concepts/perspectives-2026-09-27/art/READY.json` (main tree), listing each
  picked painting: subject, view, path under `/mock-art/`, pixel size, baselineY, facing, and whether
  it is chiral. The rigs read it when they reach an option that needs new art; until then they shoot
  every other option first.
- Deliverables go to the main tree under `docs/concepts/perspectives-2026-09-27/` (`frames/`,
  `motion/`, `art/`, `sheets/`, `mock-scripts/`), JPEG q88 for stills, H.264 mp4 for clips. Raw
  captures go to `D:/Tools/pyrefly-scratch/persp-<rig>/` and are deleted by the agent at the end.

## What each option is judged on (the README reports all of these)

- **Eye candy:** would a player screenshot it; does it read as a premium 2026 game.
- **Readability in play:** who is who, what is targetable, where the HUD is.
- **Cardboard risk:** do the painted figures read as flat cut-outs at this angle.
- **Boss presence** and **hero presence.**
- **Cost:** new paintings (how many, per character and per dressphere), engine work.
- **Fidelity:** the game case above.
- **Phone:** does it survive an upright phone.
