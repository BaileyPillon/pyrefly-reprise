# FF7 Guard Scorpion · options round (2026-09-27)

**Game case: FF7 only** (AGENTS.md rule 14). Everything here is for the hidden, experimental Guard
Scorpion fight on branch `ff7-integration`. Nothing here changes an FFX or FFX-2 chapter.

**Why:** the FF7 purist review's open majors that need Bailey's pick (rule 9), listed in
`docs/handoff/ff7-guard-scorpion.md` (branch `ff7-integration`), Open item 1: effects (review item
5), results (7), phone framing (9), the way in (15); plus the attack motion and the victory moment
the review asked for. **Nothing is built.** A pick approves only what Bailey names.

## The sheet (phone-readable, 1080 px wide, each part under 1 MB and at most 2000 px tall)

| Part | Item | Options | Recommendation |
|---|---|---|---|
| `sheet-1-overview.jpg` | all | the table below, and today's frames | |
| `sheet-2-A1-effects-hard-light.jpg` | A · effects | **A1 Hard light**: flat polygon shapes, additive, no bloom | **A1** (closest to FF7 as we read it) |
| `sheet-3-A2-effects-painted-glow.jpg` | | A2 Painted glow: the house spell-FX option B method in FF7 colours | |
| `sheet-4-A3-effects-hybrid.jpg` | | A3 Hard core, painted light: A1 plus a glow pass and cast light | |
| `sheet-5-B-attack-motion.jpg` | B · attack motion | **B1** painted key poses (Cloud 3, Barret 2); B2 one strike pose + code smear; B3 no paintings | **B1**, with a white hit flash and a short knock-back |
| `sheet-6-C-results-two-windows.jpg` | C · results | **C1** two windows: EXP/AP with a row per member, then Gil and Items (Assault Gun), confirm to advance | **C1** |
| `sheet-7-C-results-compact-and-game-over.jpg` | | C2 one compact window; Game Over **G1** pan up then GAME OVER, G2 today's panel, G3 G1 + our own reel | **G1** |
| `sheet-8-D-victory.jpg` | D · victory | **D1** win poses + a hold in silence; D2 + an original sting; D3 camera push-in | **D1** (D2 later, once a sting passes Bailey's ear) |
| `sheet-9-E-phone-framing.jpg` | E · phone | **E1** formation drawn in, camera moved in; E2 zoom 1.3x + window on the scene; E3 keep the letterbox | **E1** |
| `sheet-10-F-entry-swirl-and-camera.jpg` | F · way in | **F1** FF7 swirl + a short opening camera; F2 swirl only; F3 today | **F1** |

Every effect moment is shown at its key frame: Bolt, Ice, Cure, Braver, Big Shot, Search Scope's
lock-on ("Locked On Target"), Rifle, Scorpion Tail, Tail Laser (one beam swept across both
members). Damage numbers are illustrative values inside the research ranges
(the damage tables in `research/ff7-guard-scorpion.md`, branch `ff7-integration`).

## What the sources say, and what is ours

Read 2026-09-27 through the FF Wiki `api.php` (built-in browser pane), text only:

- **Braver** (FF Wiki "Braver (Final Fantasy VII)", revid 3921199): "a jump upwards followed by a
  downward slash". **Big Shot** ("Big Shot (Final Fantasy VII)", revid 3683856): "charging up a
  large fireball and then releasing it at the target".
- **Tail Laser**, **Scorpion Tail**, **Rifle**, **Search Scope** ("Final Fantasy VII enemy
  abilities", revid 4052059; research §3): Tail Laser from the raised tail on all opponents;
  Scorpion Tail and Rifle are Shoot-element single-target attacks; Search Scope "chooses a target
  for its next attack" and prints "Locked On Target". That Scorpion Tail is a **shot from the tail**
  is our reading of its Shoot element; its look is unsourced.
- **Bolt, Ice, Cure:** no written source describes their look. A1's polygon look is our reading of
  how a 1997 PlayStation game draws effects (real-time polygons with additive semi-transparency);
  an in-game check on Bailey's Steam copy (with Bailey's go-ahead) would settle it.
- **Results** ("Battle Results", revid 4050832; "Final Fantasy VII battle system", revid 4039023):
  gained EXP beside each member's menu portrait with a gauge that fills; Limit Breaks gained;
  materia gain AP; gil; dropped items listed to take or reject. The window arrangement is our
  estimate. Next-level fills are illustrative (levels gained are not computed).
- **Game Over** ("Game Over (term)", revid 4032692): the camera pans up over the fallen party, then
  cuts to a destroyed film reel, with the track "Continue?". The reel picture and the music are
  retail: G1 keeps the pan and the black, silent.
- **Victory poses** ("Final Fantasy VII victory poses", read 2026-09-27): Cloud pumps his fist
  twice, spins his sword in one hand, places it on his back; Barret squats, stands and punches the
  air with his normal hand, looping. The fanfare is retail: silence (Bailey's pick, music silent)
  or an original sting.
- **Swirl:** Lifestream Encore's `docs/research/scenes.md` §1.3 cites a beetle-psx issue (#199) and
  a Steam thread for FF7 grabbing the field screen and applying a rotating, zooming distortion; not
  re-checked here. The opening camera path is our estimate; FF7's default camera moves during
  battle (`research/ff7-battle-staging.md` §4).
- **Staging** (`research/ff7-battle-staging.md` §6, §7): both face screen-left; Cloud's pauldron on
  his left shoulder (near side); Barret's gun-arm is his right arm (far side), posed forward, never
  mirrored. The pose sketches follow this.

## How it was made (no game code changed; no retail material)

- **Frames:** the builder's committed frames of the fight (`docs/screenshots/ff7/game-*.jpg` at
  `ff7-integration` 3d68c9f3, read from git into scratch, since that worktree was mid-merge).
- **Clean plate:** our backdrop painting fitted to the frame (`src/plate/match4.py`: scale 0.605 x
  0.61, offset 12, 286), colour-matched (`cut.py`, `tall.py`, which also keeps the painting's crown
  above the frame for the phone and Game Over views). Fighters are our paintings fitted to their
  screen rects and colour-matched (`fitpaint.py`, `cut2.py`); portraits are crops of the same
  paintings. The window material follows `docs/plans/ff7-hud-faithful-a-spec.md` §3.1 / §5.3; the
  body face is M PLUS Rounded 1c (OFL, the branch's `public/fonts/ff7`).
- **Drawing:** Canvas 2D in `src/` (`base.js` scene and windows, `fx.js` the three effect
  treatments, `poses.js` blocking sketches, `ui.js` results, Game Over, phone and swirl,
  `parts.js` the sheet). Pose sketches are silhouettes to paint later, not art.
- **Render:** `node docs/concepts/ff7-options-2026-09-27/src/render.mjs [part ...]` with
  `PYREFLY_BROWSER=gpu`: one headless Chromium, a static server on 127.0.0.1:6610 (this folder at
  `/`, the scratch assets at `/s/` from `D:/Tools/pyrefly-scratch/ff7-options`), closed at the end.
