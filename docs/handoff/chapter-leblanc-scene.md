# Chapter — The Leblanc Syndicate: the Last Room scene

**Game case: FFX-2 only** [AGENTS.md rule 14]. Nothing here exists in FFX; the
absence check is `tests/unit/chapters/leblanc-scene.test.ts`'s last `describe`
block (no import from `src/battle/ffx/**` or `src/data/ffx/**`).

Built against the picked target (`docs/target/targets.json` "The Leblanc
Syndicate (FFX-2)", `docs/target/decisions.json` D-018) and the engine's own
formation data (`src/data/ffx2/enemies/leblanc-syndicate.ts`, group id
`ffx2-leblanc-last-room`). Attempt 3 of this workflow (the first died on API
overload, the second on an Opus incident); this track ran on Sonnet.

---

## Status: scene built and staged, not yet a registered chapter

Same shape as `docs/handoff/chapter-leblanc-engine.md`: **built standalone,
wired in the integrator's single commit.** `src/data/encounters.ts` has no
`Chapter` record for Leblanc yet, so nothing in the live game points at this
scene's key today. That is expected, not a defect — chapter select still shows
*Coming* and no player-facing route reaches it.

## 1. What was built

| File | What |
|---|---|
| `src/scenes/leblanc-last-room.ts` | The real `SceneFactory` (`buildLeblancLastRoomScene`) — backdrop, lights, particles, camera rigs, the trio's and party's marks. Owns no actors. 337 lines. |
| `src/scenes/leblanc-last-room-painted.ts` | The staged preview (`buildLeblancLastRoomPainted`): Yuna/Rikku/Paine on the party slots, Leblanc/Logos/Ormi on the trio's, an FFX-2 battle camera, VFX and the debug screen's action beats. **Preview-only** — a real battle stages its own actors against the `SceneFactory`'s published slots and never calls this file. 285 lines. |
| `src/scenes/leblanc-last-room-debug.ts` | The throwaway `Screen` for `__pyrefly.goto('scene-leblanc-last-room')` and `tools/screenshot.mjs --screen=scene-leblanc-last-room`. 66 lines. |
| `tests/unit/chapters/leblanc-scene.test.ts` | 7 cases against the pure, DOM-free exports (see §4 on why nothing else in `src/scenes/` has more coverage than this). |
| `src/scenes/index.ts` (+16/-0) | Registered `leblanc-last-room` in both `SCENES` and `SCENE_FACTORIES`, exactly the pattern `bevelle-underground`/`farplane`/`dreams-end` used. **Not** a `docs/CONTRACTS.md` file, so this track edited it directly rather than leaving a TODO — the brief's "leave a TODO if it's a contract file" condition does not apply here. |
| `src/debug/api.ts` (+4/-0) | One import + one `app.register('scene-leblanc-last-room', ...)` line, matching every other scene agent's own addition to this file. |
| `src/engine/ScenePalettes.ts` (+21/-0) | `chateauLeblanc` grade — hot magenta bloom over a cold machina base, tuned so the heart-shaped door inlay reads as the scene's own light source. |

Split across three files (rather than one ~700-line file the way
`farplane.ts`/`bevelle-underground.ts` do it) specifically to respect house
rule 7's 400-line cap — every other scene module in this repo is 850–2,265
lines and none of them meets that rule. This track's own files stay under it
without cutting anything the others have; it is offered as a pattern the
next scene agent could reuse, not a claim that the older files are wrong.

## 2. The picks this scene reads, and where they came from

- **Backdrop C** (`public/art/backdrops/leblanc-last-room.png`) — mixed
  magenta/cyan, the heart-shaped door inlay, re-rendered stronger than the
  concept round per `docs/concepts/chapters/leblanc/production.md`. The
  concept-round `renders/backdrop-c.png` (paired against this scene's build in
  `docs/screenshots/chapters/leblanc-scene-target-vs-build.png`) is visibly
  cooler and has no heart glow at all — that gap is the production pass's own
  documented fix, not a regression this track introduced.
- **Leblanc pose B, Ormi A (re-rendered heavier), Logos C (re-rendered with a
  plainer helmet)** — installed at `public/art/characters/{leblanc,ormi,logos}/`.
  Per `production.md` these are `CANDIDATE, not approved` (identity drift
  between states, redone twice, still below the judge's bar on three of four
  non-idle states) — this scene stages whatever is installed there today and
  will pick up a future re-render automatically (dev-mode asset watching,
  same as every other scene).
- **The formation** — Leblanc centre-back, Ormi and Logos flanking — is this
  track's own presentation call, not sourced. Neither `research/ffx2-leblanc-
  syndicate.md` nor `options.json` specifies battle-stage geometry; the slot
  **index** (0 Leblanc, 1 Logos, 2 Ormi) comes from
  `leblanc-syndicate.ts`, and which side each henchman stands on is this
  track's own choice, recorded here rather than silently guessed.

## 3. Staging, camera and the HUD safe area

Camera framing follows the FFX-2 convention Bevelle Underground and Heart of
the Farplane both use (fov 30–34, party lower-left arc, trio right-of-centre
and back) rather than the picture's own dead-centre symmetry — see the class
doc in `leblanc-last-room.ts` for why. The party arc (`PARTY_SLOTS`) is
carried over verbatim from `bevelle-underground.ts`'s HUD-safe-area-measured
numbers rather than re-derived with `stage.project`, because this track did
not have a way to call that instrumented measurement outside a live battle;
the browser pass below is a **visual** check, not a pixel-measured one, and
that is a real gap against the rigor `bevelle-underground.ts`'s and
`farplane.ts`'s own comments document for their own slots.

The trio (`ENEMY_SLOTS`) sits closer to camera than either chapter's single
boss slot, because Leblanc/Ormi/Logos are human-sized, not Bahamut- or
Vegnagun-scale. In the browser pass's screenshot (§5) the trio's rightmost
figure (Logos) reads at roughly 59% of frame width, comfortably inside the
0.72 FFX-2 HUD rail with margin to spare — a live HUD was not present to
confirm against (this screen has no HUD mock), so that 59% is read off the
screenshot by eye, not measured with the project's own `stage.project`
convention. Flagging this as a follow-up for whoever registers the chapter
and can screenshot it with the real HUD on.

## 4. Why the tests are what they are

Nothing in `src/scenes/` has ever had unit coverage of the actual
`SceneFactory` build function — `buildFarplaneScene`, `buildGagazetScene`,
`buildBevelleUndergroundScene` are not imported anywhere under `tests/`.
`vitest.config.ts` runs `environment: 'node'`, and every one of those
factories calls `document.createElement('canvas')` to paint textures
(`Backdrop.create`, `PaintedArt.load`), which throws with no DOM. This
track's own factory has the same shape and the same limitation — it is the
standing state of the whole directory, not a gap this track opened.

What **is** tested: the module's pure, DOM-free exports (`LEBLANC_LAST_ROOM_
SLOTS`, `LEBLANC_LAST_ROOM_ACTOR_HEIGHTS`) import cleanly in Node (proving the
module has no accidental top-level DOM call) and describe a formation that
actually matches `leblanc-syndicate.ts`'s slot order, keeps every actor on
its own side of the field, and gives Ormi/Logos heights consistent with
`options.json`'s "short and stout" / "tall and slim". The real-input check is
the browser pass in §5, exactly as `docs/ENGINE-API.md`'s contract expects
for something Three.js has to actually run to prove.

## 5. How it was verified

- `npx tsc --noEmit` — clean.
- `npx vitest run tests/unit/chapters/leblanc-scene.test.ts` — **7 passed**.
- One full `npm test` — **225 files, 5,306 passed, 2 skipped** (includes other
  agents' concurrent, uncommitted work in this shared tree — nothing here
  broke any of it).
- `node tools/orphans.mjs` — this track's three new files are all reachable
  from `src/main.ts` (through `src/scenes/index.ts` and `src/debug/api.ts`);
  no new orphan.
- **One browser pass**, own vite dev server on `:5400` (found free in
  5400-5990, stopped by PID after), `tools/screenshot.mjs` against it:
  - `docs/screenshots/chapters/leblanc-scene.png` — the idle framing, 1600x900.
    Looked at 1:1: Leblanc centre-back under the glowing heart, Ormi wide and
    stout in front-left, Logos tall in back-right with his revolver visible,
    Yuna/Rikku/[Paine] staged left, contact shadows grounding every figure,
    no clipping into the crate towers or the floor seam.
  - `docs/screenshots/chapters/leblanc-scene-target-vs-build.png` — the picked
    concept frame (`renders/backdrop-c.png`) beside the build.
  - Also shot the `action` rig and an `attack` beat to confirm the camera and
    VFX wiring do not error; the attack's peak lunge landed just before the
    frame this run's `--wait-ms` captured, so those two frames read close to
    idle — a screenshot-timing miss, not a beat that failed to fire (no
    console errors either shot; not kept, since they show nothing an
    integrator needs beyond what the idle shot already proves).
  - This was a **visual** look, not `stage.project`-measured — see §3.

## 6. A known gap: Paine has no painted art yet

`public/art/characters/paine/` does not exist in this repo. The staged
preview (`leblanc-last-room-painted.ts`) follows the same pattern
`farplane.ts` uses for a missing subject: `PaintedActor.fromSubject('paine',
...)` falls back to a placeholder silhouette (logged, never throws), and the
scene adopts Rikku's pose set onto it with a tint (`#8a7cc9`) so the party
still reads as three figures rather than two-plus-a-blob. This does **not**
block the scene itself — `SceneSlots.party` publishes three real world
positions regardless of which subject id is loaded there — but it does mean
the screenshot in §5 shows a tinted stand-in, not Paine, third from the left.

## 7. Not done in this track

- **Chapter registration.** `src/data/encounters.ts`, `chapter-meta.ts` (via
  `src/data/chapter-meta-ffx2-leblanc.ts`, already built and deliberately
  orphaned by an earlier track, not this one — see that file's own header),
  `src/engine/tactics/index.ts`, `src/data/guides/index.ts` and
  `src/audio/tracks/index.ts` are all integrator-only, same as the engine
  track's own list.
- **`stage.project`-measured slot positions.** §3's gap.
- **Paine's painted art.** §6's gap — an art-track item, not a scene one.
- **The three music cues** (`scene-chateau-leblanc`, `boss-leblanc`,
  `scene-disquiet`) — `docs/handoff/chapter-leblanc-script.md` already flags
  these as owed; this scene does not play music itself (that is the story
  runner's job).
- **A live-HUD-safe-area screenshot.** §3.

## 8. Questions for Bailey

None new. This track inherited (and did not need to re-ask) the open items
`chapter-leblanc-engine.md` §8 already lists — chapter number/select order,
Not-So-Mighty Guard's duration, and the rest are unaffected by staging work.
