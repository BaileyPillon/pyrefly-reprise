# Pyrefly Reprise — Architecture

Working title: **Pyrefly Reprise**. An unofficial HD-2D fan tribute that recreates five encounters from Final Fantasy X and X-2 with faithful combat.

## Engine decision

**Web: Vite + TypeScript + Three.js, painted 2.5D.** AI-painted matte backdrops and cut-out character key-poses composed as lit billboards in small 3D dioramas, with a post-processing chain (bloom, tilt-shift depth of field, vignette, colour grade), an HTML/CSS overlay for the FFX/FFX-2 menus ("Ink & Gold" cinematic chrome, see below), and Web Audio synthesis for original music and SFX. Deployed to GitHub Pages so it is a link friends can open.

Why not Unreal: the user has UE 5.8 installed, but Unreal would mean multi-GB builds to share, binary Blueprints that agents cannot iterate on, and slow screenshot loops. Web gives a same-day turnaround, deterministic headless testing (Playwright + WebGL), and a shareable URL.

The original plan was hand-authored pixel-art HD-2D sprites (`src/sprites/`, now legacy — see below). That pipeline produced flat, generic-looking characters agents couldn't iterate on fast enough to hit the visual bar. It was replaced with a painted 2.5D pipeline: a local ComfyUI (Animagine XL 4.0 + IP-Adapter for pose/identity consistency), driven offline by `tools/gen/comfy.mjs` against the roster work order in `tools/gen/cast.json` (full setup, prompt contract and troubleshooting: `docs/ART-PIPELINE.md`), paints each character's key poses and each location's backdrop; `rembg` cuts the characters out; and the engine composes the results as lit, shaded billboards in the same camera-and-diorama structure the HD-2D plan always called for. This reads as painted, pretty and modern — closer to Octopath Traveler's polygon-and-painting hybrid than to pixel art — and the offline art step keeps the runtime free of any network dependency.

## The five chapters

| # | Game | Encounter | Location | Party build point |
|---|------|-----------|----------|-------------------|
| 1 | FFX | Seymour Flux + Mortiorchis | Mt. Gagazet trail | Post-Ronso, pre-summit |
| 2 | FFX | Lady Yunalesca (3 forms) | Zanarkand Dome great hall | After the Chamber of the Fayth |
| 3 | FFX | Braska's Final Aeon (2 forms) → possessed aeons → Yu Yevon | Dream's End / Inside Sin | Endgame, no superboss grinding |
| 4 | FFX-2 | Bahamut | Bevelle Underground (Ch. 2) | Level ~25 |
| 5 | FFX-2 | Vegnagun parts → Shuyin | Farplane (Ch. 5) | Level ~48 |

## Runtime flow

```
Title → ChapterSelect → PartyPrep (Party / Sphere Grid / Equipment / Items / Overdrive modes, or Garment Grid for X-2)
      → Cutscene(pre) → Battle (with mid-battle script triggers) → Cutscene(post) → Results → ChapterSelect
```

`src/app/App.ts` is a screen state machine. Every screen is a class with `enter/exit/update/handleInput`. Progress (cleared chapters, best clear time, unlocked banter) is saved to `localStorage`.

## Layering rule (the most important constraint)

The battle engines are **pure TypeScript with zero DOM/Three.js imports**, deterministic under a seeded RNG, and fully unit-testable. They never animate. They emit an ordered list of `BattleEvent`s per resolved action; the presentation layer (`engine/` + `ui/`) plays those events with timing, then calls back for the next decision.

```
battle/ffx  (CTB)   ─┐
battle/ffx2 (ATB)   ─┼─ events ──▶ BattlePresenter ──▶ PaintedActors / VFX / HUD / Audio
battle/common        ┘   ◀─ commands ─ Command UI (player) or AI script (enemy)
```

## Directory map and ownership

```
index.html
src/
  main.ts                     boot
  app/                        App state machine, Screen base, SaveData, Input (keyboard+gamepad+mouse)
  engine/                     Renderer (Three + post chain), PaintedActor/PaintedArt/Backdrop/Lighting (painted 2.5D), BattleCamera, Particles, VFX, ScenePalettes; SpriteActor/Diorama (retired pixel path; see docs/ENGINE-API.md)
  sprites/                    legacy pixel-art sprite DSL + rasterizer + authored sprite data — unused, kept for reference only
  battle/common/              RNG, BattleEvent types, shared status/element enums
  battle/ffx/                 CTB engine: TurnQueue, Formulas, Statuses, Abilities, Items, Overdrives, Aeons, AI, BattleState
  battle/ffx2/                ATB engine: Gauges, Chain, Dresspheres, Spherechange, Formulas, AI, BattleState
  data/ffx/                   abilities, items, statuses, characters, aeons, overdrive modes, mixes, sphere grid, builds/, enemies/
  data/ffx2/                  dresspheres, abilities, items, garment grids, builds/, enemies/
  data/encounters.ts          the five Chapter definitions (scene key, build, enemy group, scripts, music)
  ui/common/                  Dialogue box, Title, ChapterSelect, Results, damage numbers, message bar, css
  ui/inkgold/                 shared "Ink & Gold" chrome layer: tokens.css, slabs.css, wipe.ts, cutin.ts, index.ts (see docs/handoff/presentation-ink-and-gold.md)
  ui/ffx/                     BattleHUD (CTB list, command window, party status), PartyPrep menus, Sphere Grid, overdrive minigames
  ui/ffx2/                    BattleHUD (ATB), Spherechange wheel, Garment Grid, Trigger Happy / reels minigames
  story/                      Cutscene DSL + runner; scripts/ per chapter (pre, post, mid-battle triggers)
  scenes/                     types.ts (scene-builder contract); one diorama builder per chapter (gagazet, zanarkand-dome, dreams-end, bevelle-underground, farplane), each with a debug variant; index.ts, placeholder-sprites.ts
  audio/                      Synth instruments, Sequencer, tracks/ (original compositions), sfx, AudioManager
  debug/                      window.__pyrefly test API (jump to chapter, force command, skip cutscene, set seed, snapshot state)
tools/                        render-sprite.mjs (legacy sprite → PNG preview), render-track.mjs (track → WAV), screenshot.mjs
tools/gen/                    painted-art generation: comfy.mjs (ComfyUI driver), cast.json (roster work order), rembg.py, sheet.py/sheet-poc.json (contact sheets), qc.py, strip.py, whitekey.py
tests/unit/                   vitest: formulas vs known values, CTB ordering, statuses, AI scripts, builds sanity
tests/e2e/                    playwright: boot, chapter select, scripted full wins per chapter, screenshot gallery
critic/                       RUBRIC.md, rounds/
research/                     the research corpus (source of truth for numbers; every data file cites it)
docs/                         this file, ART-PIPELINE.md, ENGINE-API.md, CONTROLS.md, CREDITS.md, handoff/ (presentation-ink-and-gold.md + mockups)
```

Ownership for parallel agents: one agent per top-level folder (or sub-folder for `data/` and `sprites/`). Shared contracts live in `src/battle/common/types.ts`, `src/scenes/types.ts`, `src/story/dsl.ts`, `src/data/encounters.ts` and are written **first**; other agents import them and do not edit them without a note in `docs/CONTRACT-CHANGES.md`.

## Battle engine contracts (summary; see `src/battle/common/types.ts`)

- `Combatant`: id, name, side (party/enemy/aeon), stats (hp, mp, str, def, mag, mdef, agi, luck, eva, acc), maxHp/maxMp, statuses (map → remaining turns), elemental affinities, overdrive gauge (0–100) and mode, equipment auto-abilities, `controller: 'player' | 'ai'`, sprite key.
- `Command`: `{ kind: 'attack' | 'ability' | 'item' | 'overdrive' | 'summon' | 'switch' | 'escape' | 'dismiss', id?, targets: CombatantId[] , extra? }` (extra carries minigame results, Mix ingredients, reel outcomes, dressphere choice).
- `BattleEvent` (discriminated union): `turn-start`, `action-start`, `damage`, `heal`, `miss`, `status-add`, `status-remove`, `ko`, `revive`, `overdrive-gauge`, `message`, `summon`, `dismiss`, `switch`, `form-change`, `counter`, `charge` (boss countdown), `script-trigger` (named hook for story), `victory`, `defeat`, `chain` (X-2), `atb` (X-2 gauge snapshot).
- FFX CTB: `TurnQueue.predict(n)` returns the next n actors given current agility/haste/slow and the pending action's rank, so the HUD list is always faithful. Ticks: each combatant has a counter; the tick-speed table maps agility → ticks per turn; rank adds `rank * tickSpeed`-style delay per the researched table.
- FFX-2 ATB: per-combatant gauge with agility-driven fill, charge time per ability, recovery; `Chain` tracks hits within the window and the multiplier.
- All numbers come from `data/` files that cite `research/*.md` by section.

## Sprite pipeline (legacy)

`src/sprites/` was the original pixel-art pipeline: `format.ts` defined `SpriteDef` (size, palette, named animation states → frames), rasterized to a canvas → `THREE.CanvasTexture` at runtime, rendered standalone via `tools/render-sprite.mjs`. It is unused by any current scene or screen and kept only for reference; do not add to it. Its runtime counterpart, `SpriteActor`, is documented in `docs/ENGINE-API.md` for the same reason.

## Painted art pipeline

Art is authored offline with a local ComfyUI (Animagine XL 4.0 checkpoint, IP-Adapter for pose/identity consistency across a character's states, `rembg` for cutouts) driven by `tools/gen/comfy.mjs`, one subject at a time from the work order in `tools/gen/cast.json`. Full setup, prompt contract and troubleshooting: `docs/ART-PIPELINE.md`. Nothing about this touches the network at runtime — the game only ever loads finished PNGs.

File conventions (no manifest to keep in sync; the engine resolves art by path):

```
public/art/characters/<id>/<state>.png   transparent cutout, variable size
public/art/characters/<id>/<state>.json  sidecar: width, height, baselineY, seed, prompt
public/art/backdrops/<scene>.png         wide matte painting, opaque
public/art/backdrops/<scene>.json        sidecar: seed, prompt
public/art/portraits/<id>.png            head-and-shoulders, for dialogue/CTB/menus
```

`<id>` is lowercase kebab; `<state>` is one of `idle, attack, cast, hurt, ko, victory`. `baselineY` is the bottom row of opaque pixels in the cropped PNG — the engine re-derives it from alpha at load time (`fitBaselineFromAlpha`) rather than trusting the sidecar's value, so a figure's feet land on the ground plane regardless.

## Painted 2.5D rendering

Perspective camera (fov 32–38°) looking slightly down at a diorama. Backdrops are turned into a parallax stack (`src/engine/Backdrop.ts`): the painting on a far plane, masked parallax layers cut from bands of the same painting, a lit 3D ground plane tinted from the painting's own bottom rows, drifting mist, matched fog and background. Characters are `PaintedActor`s (`src/engine/PaintedActor.ts`) — two crossfading textured planes plus a soft contact shadow, sized by world height rather than pixels, unlit (their material carries the painting's own lighting) but rim-lit and bounce-lit from a `LightRig` (`src/engine/Lighting.ts`) whose colours are sampled from the backdrop's own palette. `PaintedArt.ts` is the loader: it never rejects, falling back state→idle→a grey silhouette so a scene is composable and screenshot-able before any PNG exists.

Post chain: RenderPass → UnrealBloomPass (threshold ≈ 0.90 — raised from the visual bible's selective-bloom range because an AI-painted backdrop has bright paint everywhere) → tilt-shift depth of field (blur by depth band, focused on the actors) → vignette + grade, per-scene via `ScenePalette` (`src/engine/ScenePalettes.ts`). Particles via `THREE.Points` with custom shaders: pyreflies, snow, embers, petals. Every scene builds against the scene-builder contract in `src/scenes/types.ts` (full spec in `docs/ENGINE-API.md`): a `SceneFactory` owns the backdrop, light rig, particles, ground and camera rigs, and publishes four rigs (`intro`, `idle`, `action`, `victory`) plus seven party slots and a row of enemy slots; it owns no actors, battle state or UI, so scene, battle and presenter agents can build in parallel against one interface. All five chapter locations now have their own `SceneFactory` module (`src/scenes/gagazet.ts`, `zanarkand-dome.ts`, `dreams-end.ts`, `bevelle-underground.ts`, `farplane.ts`, each with a `-debug.ts` variant), registered in `src/scenes/index.ts#SCENE_FACTORIES`; `demo.ts` is the earlier "builder brings its own figures" prototype the contract was modelled on, kept only as the fallback `loadScene` reaches for on an unknown key.

## UI

DOM overlay, in the **"Ink & Gold" cinematic direction** the user chose (Persona-style chrome over the painted art, per Clair Obscur: Expedition 33) — full spec in `docs/handoff/presentation-ink-and-gold.md`, mockups in `docs/screenshots/mockups/`. Ink (`#0B0A12`) and paper (`#F4F1E8`) slabs, skewed −12° with counter-skewed content, one gold accent (`#E3B94A`, swapped for pyre-pink `#F7B6D9` in FFX-2 chapters) for acting/selected/ready state. CTB list right, command stack bottom-left (cascading rows), party status bottom-right, target brackets with hung name plates, ink-splash damage numerals in serif italic. FFX-2 mirrors the layout to the right with +12° skews. Diagonal ivory wipes between screens, a turn cut-in slab, and constant film grain tie chrome and painted backdrop into one surface. The shared layer (`src/ui/inkgold/`) supplies the tokens, slab classes, wipe and cut-in helpers; each HUD owner adopts it by adding `.ig` to its overlay root and mocks a new screen (`docs/screenshots/mockups/`) before integrating it. Damage numbers are DOM elements positioned from projected `PaintedActor` anchors. Fonts: Cormorant Garamond (serif, names/damage/results — new, OFL, `public/fonts/cormorant-garamond/`), Chakra Petch (commands/labels), Rajdhani (numerals), Exo 2 (dialogue/descriptions), chosen in `research/assets-and-tech.md` and declared in `src/ui/common/fonts.css`.

## Story

`src/story/dsl.ts`: a script is an array of steps — `say(who, text)`, `narrate(text)` (Tidus retrospective), `move(actor, rig)`, `camera(rig)`, `fx(name)`, `wait(ms)`, `music(track)`, `choice(...)`, `trigger` markers. Mid-battle triggers are declared per encounter (`onHpBelow`, `onStatus`, `onFormChange`, `onTurn`) and pause the presenter to play a short line. Writing follows `research/writing-bible.md`: original lines in the characters' voices; canonical events unchanged.

## Testing and the critic

- `vitest` unit tests pin formulas to researched values (e.g. a known Strength/Defense pair → expected damage range), CTB ordering with known agility pairs, Zombie semantics, Mega Death vs Zombie, Yu Pagoda healing, X-2 chain multipliers.
- Playwright e2e uses `window.__pyrefly` to run each chapter to victory with a fixed seed, asserting no console errors and capturing a screenshot gallery to `critic/screens/`.
- `critic/RUBRIC.md` weights: Combat fidelity 25, Encounter fidelity (stats/AI/forms) 15, Fun & pacing 15, Character & visual fidelity 15, Scene fidelity 10, Writing 10, UI fidelity & polish 5, Stability & performance 5. Gate: 9.6/10. The critic plays every chapter and reads the data files against `research/`.

## Legal

All code, art, music and text are original. No retail models, textures, audio, fonts or script transcripts are included. Names and characters belong to Square Enix; this is a non-commercial fan work.
