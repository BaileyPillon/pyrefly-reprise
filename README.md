# Pyrefly Reprise

An unofficial HD-2D fan tribute that recreates five of the most memorable encounters from *Final Fantasy X* and *Final Fantasy X-2*: the Conditional Turn-Based battles, the Sphere Grid, dresspheres, Overdrives, and the scenes around each fight.

**Play it:** https://baileypillon.github.io/pyrefly-reprise/

Final Fantasy X and X-2, their characters, worlds, and names are the property of Square Enix. This project is a non-commercial fan work, unaffiliated with Square Enix. All code, art, music, and writing here are original.

## The five chapters

| # | Game | Encounter | Location | Party at |
|---|------|-----------|----------|----------|
| 1 | FFX | Seymour Flux + Mortiorchis | Mt. Gagazet trail | Post-Ronso, pre-summit |
| 2 | FFX | Lady Yunalesca (three forms) | Zanarkand Dome | After the Chamber of the Fayth |
| 3 | FFX | Braska's Final Aeon → possessed aeons → Yu Yevon | Dream's End / Inside Sin | Endgame, no superboss grinding |
| 4 | FFX-2 | Bahamut | Bevelle Underground (Ch. 2) | Level ~25 |
| 5 | FFX-2 | Vegnagun → Shuyin | Farplane (Ch. 5) | Level ~48 |

Each chapter is: party prep (Sphere Grid, equipment, items, Overdrive modes, or the Garment Grid for X-2) → pre-fight cutscene → the battle with mid-fight story triggers → post-fight cutscene → results.

## How it was made

I set the constraints, chose the engine, stack, encounters, and art direction, and then directed roughly a dozen Claude Code agents working in parallel in one repository, each owning one folder. The sections below explain the three decisions that shaped everything else.

### The battle engine

The combat engine is the part of the game that knows the rules, and it is deliberately blind. It is pure TypeScript with zero DOM or Three.js imports, deterministic under a seeded random number generator, and it never animates anything. You hand it a `Command` (attack, ability, item, Overdrive, summon, switch, escape, dismiss, with targets) and it returns an ordered list of `BattleEvent`s: `damage`, `heal`, `miss`, `status-add`, `ko`, `form-change`, `counter`, `charge` for boss countdowns, `script-trigger` for story hooks, `victory`, `defeat`, and so on. A separate presentation layer plays those events with timing, animation, sound, and menus, then calls back for the next decision. The player's command menu and each boss's AI script are both just producers of commands.

There are two engines that share that event format:

- **FFX, Conditional Turn-Based (CTB).** Every combatant has a tick counter. A researched tick-speed table maps Agility to ticks per turn, and each action's rank adds a delay on top, so Haste, Slow, and slow-but-strong actions reorder the queue the way the real game does. `TurnQueue.predict(n)` returns the next n actors so the on-screen turn list is always truthful, not decorative. Statuses, Overdrive gauges and modes, Aeons, Mixes, and equipment auto-abilities all live here.
- **FFX-2, Active Time Battle (ATB).** Per-combatant gauges filled by Agility, charge time per ability, recovery time after acting, and a `Chain` tracker for the hit-count damage multiplier. Dresspheres and Spherechange are data plus a state transition, not special cases.

Every number in `src/data/` cites the research corpus in `research/` by section. Nothing is guessed. The unit tests pin formulas to known values: a specific Strength and Defense pair must land in a specific damage range, known Agility pairs must order the CTB queue a known way, Zombie must invert healing, Mega Death must fail against Zombie, Yu Pagodas must heal Braska's Final Aeon. Boss AI scripts (Seymour Flux, Yunalesca's three forms, Bahamut, Vegnagun's parts, Shuyin) are tested the same way, by running the engine and asserting on the events it emits. Sixty-plus test files cover this at the time of writing.

One detail that fell out of the research: magical actions and every Overdrive always hit. Only physical Strength attacks roll, players against their Accuracy stat and enemies against their own per-action accuracy byte, and only those suffer Darkness. The engine reads that rule from the data rather than assuming it.

### The stack

Vite 8, TypeScript 7, Three.js 0.186 as the only runtime dependency, Vitest for unit tests, Playwright for end-to-end runs, and GitHub Pages for hosting. The game boots through a screen state machine (Title → Chapter Select → Party Prep → Cutscene → Battle → Cutscene → Results) and saves progress to `localStorage`.

The 3D side is small on purpose. Each location is a diorama: a perspective camera looking slightly down at a parallax stack cut from one painting, a lit ground plane tinted from the painting's own bottom rows, drifting mist, matched fog, and a particle system for pyreflies, snow, embers, or petals. Characters are `PaintedActor`s, two crossfading textured planes plus a contact shadow, sized by world height rather than pixels. They are unlit, because the painting already carries its lighting, but they receive rim and bounce light from a `LightRig` whose colours are sampled from the backdrop's palette so a figure on Gagazet reads cold and a figure in the Farplane reads violet. A post-processing chain finishes the frame: bloom, tilt-shift depth of field focused on the actors, vignette and colour grade, all tuned per scene.

The menus are not 3D at all. They are an HTML and CSS overlay in a cinematic direction I chose from three mockups: ink and paper slabs skewed twelve degrees with counter-skewed content, one gold accent for whatever is acting, selected, or ready (pink in the X-2 chapters), diagonal ivory wipes between screens, a turn cut-in, and constant film grain so the chrome and the painting sit on one surface. Fonts are Cormorant Garamond, Chakra Petch, Rajdhani, and Exo 2, all open-licensed. Music and sound effects are original, synthesised at runtime with Web Audio from a sequencer and instrument set in `src/audio/`, so the build ships no audio files.

Why the web and not Unreal, which I have installed: Unreal would have meant multi-gigabyte builds to share, binary Blueprints that agents cannot read or edit, and a slow loop between changing something and seeing it. On the web an agent can change code, run a headless Playwright pass that plays a chapter to victory with a fixed seed, and hand me a screenshot within a minute. That feedback loop was the actual product. It also gives a link that anyone can open.

### The art style

The first pass was pixel-art HD-2D sprites drawn from a small DSL. It looked like a retro prototype, not a 2026 game, and I said so after the first screenshots. The pipeline was rebuilt the same afternoon as **painted 2.5D**, and the old sprite code stays in `src/sprites/` as a record of what did not work.

Every backdrop and every character pose is a painting generated on my own machine with ComfyUI running Animagine XL 4.0, an anime-tuned SDXL checkpoint. Identity consistency across a character's six states (idle, attack, cast, hurt, ko, victory) comes from IP-Adapter with a per-character reference image. `rembg` with the `isnet-anime` weights cuts each figure out; RealESRGAN upscales backdrops. A single driver script, `tools/gen/comfy.mjs`, owns the style contract: one shared style block, one shared quality block, one shared negative prompt, and a composition block that forces a straight-on, full-body, feet-visible frame on a white cyclorama so cutouts land on their feet. Identity tags say who a character is; pose tags say what they are doing; nothing else is allowed through, because a cast only looks like a cast when every member is rendered through the same blocks. Tags like "painterly" and "clean lineart" were tested on a fixed seed and rejected, and the reasons are written down in `docs/ART-PIPELINE.md` so nobody re-adds them.

The engine reads art by path convention with no manifest to keep in sync. Each cutout ships with a sidecar recording width, height, baseline, seed, and prompt, and the engine re-derives the baseline from the alpha channel at load time rather than trusting the file, so a figure's feet always meet the ground plane. The loader never rejects: a missing state falls back to idle, then to a grey silhouette, so a scene is composable and screenshot-able before any painting exists. Around 700 painted assets ship in the live build. Nothing is ripped from the games, nothing is fetched at runtime, and the paintings are original work in the spirit of the characters rather than copies of any retail asset.

The reference point is Octopath Traveler's mix of painting and geometry, but painted rather than pixelled, with menus in the spirit of Persona and Clair Obscur: Expedition 33. Those are influences, not sources: no UI was copied from any game.

### The process

- **Ownership by folder.** Agents worked in one tree at once, one agent per top-level folder. Shared contracts (`src/battle/common/types.ts`, `src/scenes/types.ts`, the story DSL, the encounter table) were written first, and everyone else imported them.
- **Screenshots at every milestone.** I looked at every one. The pixel-art rejection, the three UI mockups, and every scene approval came from that.
- **Run it, do not reason about it.** Twice the agents built a complete, tested subsystem that nothing in the game called. A green test suite did not catch either one; looking at the running game did. The coordinating agent was also wrong four times in one day about bugs it had reasoned about from memory, and the agent that actually ran the engine was right every time. That became the rule.
- **A critic gate.** An independent critic agent plays every chapter, reads the data files against the research, and scores against `critic/RUBRIC.md`. Nothing ships under 9.6 out of 10.

Started on 2026-09-15. First public alpha the next day.

## Docs

- `docs/ARCHITECTURE.md`: layering rule, directory map, engine contracts
- `docs/ENGINE-API.md`: renderer, painted actors, scene-builder contract
- `docs/ART-PIPELINE.md`: ComfyUI setup, the prompt contract, troubleshooting
- `docs/handoff/presentation-ink-and-gold.md`: the UI spec with exact values
- `docs/screenshots/`: the gallery the agents sent back as they worked

## Running it

```bash
npm install
npm run dev
```

`npm test` runs the unit suite, `npm run test:e2e` plays every chapter headlessly. The build needs the painted art in `public/art/`, which is generated locally and not committed to `main`; see `docs/ART-PIPELINE.md`.
