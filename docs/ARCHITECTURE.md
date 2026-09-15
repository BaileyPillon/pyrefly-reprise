# Pyrefly Reprise — Architecture

Working title: **Pyrefly Reprise**. An unofficial HD-2D fan tribute that recreates five encounters from Final Fantasy X and X-2 with faithful combat.

## Engine decision

**Web: Vite + TypeScript + Three.js (HD-2D).** Pixel-art billboard sprites over small 3D dioramas, with a post-processing chain (bloom, tilt-shift depth of field, vignette, colour grade), an HTML/CSS overlay for the FFX/FFX-2 menus, and Web Audio synthesis for original music and SFX. Deployed to GitHub Pages so it is a link friends can open.

Why not Unreal: the user has UE 5.8 installed, but Unreal would mean multi-GB builds to share, binary Blueprints that agents cannot iterate on, and slow screenshot loops. Web gives a same-day turnaround, deterministic headless testing (Playwright + WebGL), and a shareable URL. HD-2D is the natural "2.5D" look (Octopath Traveler / Live A Live) and reads as cute, pretty and modern.

## The five chapters

| # | Game | Encounter | Location | Party build point |
|---|------|-----------|----------|-------------------|
| 1 | FFX | Seymour Flux + Mortibody | Mt. Gagazet trail | Post-Ronso, pre-summit |
| 2 | FFX | Lady Yunalesca (3 forms) | Zanarkand Dome great hall | After the Chamber of the Fayth |
| 3 | FFX | Braska's Final Aeon (2 forms) → possessed aeons → Yu Yevon | Dream's End / Inside Sin | Endgame, no superboss grinding |
| 4 | FFX-2 | Bahamut | Bevelle Underground (Ch. 3) | Level ~32 |
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
battle/ffx2 (ATB)   ─┼─ events ──▶ BattlePresenter ──▶ SpriteActors / VFX / HUD / Audio
battle/common        ┘   ◀─ commands ─ Command UI (player) or AI script (enemy)
```

## Directory map and ownership

```
index.html
src/
  main.ts                     boot
  app/                        App state machine, Screen base, SaveData, Input (keyboard+gamepad+mouse)
  engine/                     Renderer (Three + post chain), SpriteActor, BattleCamera, Particles, VFX, Diorama helpers
  sprites/                    sprite DSL types + rasterizer + authored sprite data (characters/, bosses/, aeons/, ffx2/, portraits/, fx/)
  battle/common/              RNG, BattleEvent types, shared status/element enums
  battle/ffx/                 CTB engine: TurnQueue, Formulas, Statuses, Abilities, Items, Overdrives, Aeons, AI, BattleState
  battle/ffx2/                ATB engine: Gauges, Chain, Dresspheres, Spherechange, Formulas, AI, BattleState
  data/ffx/                   abilities, items, statuses, characters, aeons, overdrive modes, mixes, sphere grid, builds/, enemies/
  data/ffx2/                  dresspheres, abilities, items, garment grids, builds/, enemies/
  data/encounters.ts          the five Chapter definitions (scene key, build, enemy group, scripts, music)
  ui/common/                  Dialogue box, Title, ChapterSelect, Results, damage numbers, message bar, css
  ui/ffx/                     BattleHUD (CTB list, command window, party status), PartyPrep menus, Sphere Grid, overdrive minigames
  ui/ffx2/                    BattleHUD (ATB), Spherechange wheel, Garment Grid, Trigger Happy / reels minigames
  story/                      Cutscene DSL + runner; scripts/ per chapter (pre, post, mid-battle triggers)
  scenes/                     one diorama builder per chapter (gagazet, zanarkand-dome, dreams-end, bevelle-underground, farplane)
  audio/                      Synth instruments, Sequencer, tracks/ (original compositions), sfx, AudioManager
  debug/                      window.__pyrefly test API (jump to chapter, force command, skip cutscene, set seed, snapshot state)
tools/                        render-sprite.mjs (sprite → PNG + 8x preview), render-track.mjs (track → WAV), screenshot.mjs
tests/unit/                   vitest: formulas vs known values, CTB ordering, statuses, AI scripts, builds sanity
tests/e2e/                    playwright: boot, chapter select, scripted full wins per chapter, screenshot gallery
critic/                       RUBRIC.md, rounds/
research/                     the research corpus (source of truth for numbers; every data file cites it)
docs/                         this file, CONTROLS.md, CREDITS.md
```

Ownership for parallel agents: one agent per top-level folder (or sub-folder for `data/` and `sprites/`). Shared contracts live in `src/battle/common/types.ts`, `src/sprites/format.ts`, `src/story/dsl.ts`, `src/data/encounters.ts` and are written **first**; other agents import them and do not edit them without a note in `docs/CONTRACT-CHANGES.md`.

## Battle engine contracts (summary; see `src/battle/common/types.ts`)

- `Combatant`: id, name, side (party/enemy/aeon), stats (hp, mp, str, def, mag, mdef, agi, luck, eva, acc), maxHp/maxMp, statuses (map → remaining turns), elemental affinities, overdrive gauge (0–100) and mode, equipment auto-abilities, `controller: 'player' | 'ai'`, sprite key.
- `Command`: `{ kind: 'attack' | 'ability' | 'item' | 'overdrive' | 'summon' | 'switch' | 'escape' | 'dismiss', id?, targets: CombatantId[] , extra? }` (extra carries minigame results, Mix ingredients, reel outcomes, dressphere choice).
- `BattleEvent` (discriminated union): `turn-start`, `action-start`, `damage`, `heal`, `miss`, `status-add`, `status-remove`, `ko`, `revive`, `overdrive-gauge`, `message`, `summon`, `dismiss`, `switch`, `form-change`, `counter`, `charge` (boss countdown), `script-trigger` (named hook for story), `victory`, `defeat`, `chain` (X-2), `atb` (X-2 gauge snapshot).
- FFX CTB: `TurnQueue.predict(n)` returns the next n actors given current agility/haste/slow and the pending action's rank, so the HUD list is always faithful. Ticks: each combatant has a counter; the tick-speed table maps agility → ticks per turn; rank adds `rank * tickSpeed`-style delay per the researched table.
- FFX-2 ATB: per-combatant gauge with agility-driven fill, charge time per ability, recovery; `Chain` tracks hits within the window and the multiplier.
- All numbers come from `data/` files that cite `research/*.md` by section.

## Sprite pipeline

`src/sprites/format.ts` defines `SpriteDef` (size, palette, named animation states → frames). A frame is either rows of palette characters (pixel grid) or a list of shape ops (`ellipse`, `rect`, `poly`, `line`, `pixels`) rasterized to the grid with an automatic 1px outline and optional light/shadow passes. `tools/render-sprite.mjs` renders any sprite to PNG with an 8x nearest-neighbour preview so an agent can look at its work and iterate. At runtime the same rasterizer produces a canvas → `THREE.CanvasTexture` (NearestFilter) per frame.

Targets: party members 48×64 logical px (about 6 heads tall, anime proportion), aeons 96×96 to 160×128, bosses 128×160 to 256×192, portraits 32×32. Palette ≤ 24 colours per sprite. States: idle, ready, attack, cast, item, hurt, ko, victory, defend; bosses add per-attack states and forms.

## HD-2D rendering

Perspective camera (fov 32–38°) looking slightly down at a diorama built from procedural-texture planes and simple meshes. Sprites are billboards with pixel snapping and a blob shadow. Post chain: RenderPass → UnrealBloomPass (threshold ≈ 0.82, strength ≈ 0.55) → tilt-shift depth of field (blur by depth band) → vignette + grade. Particles via `THREE.Points` with custom shaders: pyreflies, snow, embers, petals. Every scene defines a light rig (key, fill, rim, one or two coloured point lights) and 2–3 camera rigs (idle, action, victory).

## UI

DOM overlay. FFX: blue→black gradient windows with a thin light border, finger cursor, CTB list right, command window bottom-left, party status bottom-right (name, HP, MP, Overdrive gauge). FFX-2: ATB gauges, dressphere icons, chain popup, spherechange wheel. Damage numbers are DOM elements positioned from projected sprite positions. Fonts: OFL fonts chosen in `research/assets-and-tech.md`.

## Story

`src/story/dsl.ts`: a script is an array of steps — `say(who, text)`, `narrate(text)` (Tidus retrospective), `move(actor, rig)`, `camera(rig)`, `fx(name)`, `wait(ms)`, `music(track)`, `choice(...)`, `trigger` markers. Mid-battle triggers are declared per encounter (`onHpBelow`, `onStatus`, `onFormChange`, `onTurn`) and pause the presenter to play a short line. Writing follows `research/writing-bible.md`: original lines in the characters' voices; canonical events unchanged.

## Testing and the critic

- `vitest` unit tests pin formulas to researched values (e.g. a known Strength/Defense pair → expected damage range), CTB ordering with known agility pairs, Zombie semantics, Mega Death vs Zombie, Yu Pagoda healing, X-2 chain multipliers.
- Playwright e2e uses `window.__pyrefly` to run each chapter to victory with a fixed seed, asserting no console errors and capturing a screenshot gallery to `critic/screens/`.
- `critic/RUBRIC.md` weights: Combat fidelity 25, Encounter fidelity (stats/AI/forms) 15, Fun & pacing 15, Character & visual fidelity 15, Scene fidelity 10, Writing 10, UI fidelity & polish 5, Stability & performance 5. Gate: 9.6/10. The critic plays every chapter and reads the data files against `research/`.

## Legal

All code, art, music and text are original. No retail models, textures, audio, fonts or script transcripts are included. Names and characters belong to Square Enix; this is a non-commercial fan work.
