# Chapter IX (Yojimbo): installed character idles (CANDIDATES)

**Game case: FFX only.** This is Lady Ginnem's Yojimbo in the Cavern of the Stolen Fayth (B1). Nothing here applies to an FFX-2 chapter.

Installed 2026-09-24 after Bailey's "All your recommendations" (O-1 A, O-2 B, O-3 B). These are **candidates**: self-judged at 1:1 and in a real battle frame, never judged independently, and not in `approved-hashes.json`. Nothing under `src/` was edited. **No spriteKeys existed when these were installed** (nothing under `src/data` names these ids), so the ids below are the ones the chapter's data should use.

| Subject id (new) | File | Size, baselineY | From the pick | Suggested world height |
|---|---|---|---|---|
| `yojimbo-cavern` | `public/art/characters/yojimbo-cavern/idle.png` + `.json` | 730x1093, 1076 | O-1 A, render `yojimbo-a2`, seed 902102 | 2.55 (visual bible: 84 px against a 60 px party member, `[estimate]`) |
| `daigoro` | `public/art/characters/daigoro/idle.png` + `.json` | 853x897, 846 (paw contact) | O-2 B koma-inu, render `daigoro-b`, seed 903202 | 0.73 (visual bible: 24 px, `[estimate]`) |
| `ginnem` | `public/art/characters/ginnem/idle.png` + `.json` | 757x1164, 1100 | O-3 B pyrefly-edged, render `ginnem-a`, seed 904101, plus the options round's edge treatment | 1.82, human scale (a palette swap of Belgemine, `[estimate]`); untargetable (B3) |

- **`public/art/characters/yojimbo` was not touched.** It is the player's aeon (`src/data/ffx/aeons` uses it).
- Every idle faces **left** (the enemy contract), and each sidecar says so (`facing: "left"`, `facingObserved: true`).
- sha256 values: yojimbo-cavern `bc8f5c1e…6c1f`, daigoro `b9d952d3…49c8`, ginnem `061d0021…1bee` (the full values are in each sidecar).
- `public/art/manifest.json` was regenerated (`node tools/gen/manifest.mjs`: 62 subjects). `public/art` is gitignored, so the manifest and the PNGs stay on this disk only.
- Backup: `D:/Tools/pyrefly-art-backup/candidates/2026-09-24-yojimbo/<id>/`. It holds the installed idle and sidecar, the picked concept cut-out it came from, the scabbard mask and, for Ginnem, `idle.solid.png` (the painting without the glow).

## Method (r3, `docs/plans/art-method-r3/METHOD-CHECK.md`)

The picked pixels are the painting. Each idle is the options round's own cut-out of the picked render, reframed with a 16 px margin like the other enemy idles. The repairs erase pixels and never paint any. **0 GPU minutes**: nothing was queued on ComfyUI.

- **Yojimbo:** the options README said the pick "still needs a clean pass" because "a second scabbard crosses behind him". That scabbard (3,702 px between the robe and the hat tassel) is erased inside a strip polygon. The robe's edge follows its own straight line through the cut, and the tassel and its ink outline are kept. 95 px of grey-white matte halo were peeled.
  - **Left as picked, disclosed:** he is a side profile, and turning him would need a re-render. Two hilts stay at his hip, a katana and a short sword; his attacks include Wakizashi.
- **Daigoro:** the render had a baked blue floor shadow under the paws and tail. It is erased (7,281 px, plus 78 px of specks), because the engine draws its own contact shadow. `baselineY` is the front-paw contact row. The tail lies on the floor in front of him, 34 px below that row.
  - Everything about his look is ours. The data only names him Koma Inu.
- **Ginnem:** the idle is the O-3 B pixels exactly: a soft cool rim glow, 140 motes on the outline and the body at 0.88 alpha. **It is the one soft-alpha idle.** The engine's `alphaCut` is 0.02, and I checked the auto matte: a glow that faint does not trigger it.
  - The options README said the motes "would be live particles in game". That effect does not exist yet, and `src/engine` belongs to another track. So the picked look is baked for now, and `idle.solid.png` in the backup is ready for the day the live effect lands.
  - **White make-up** is sourced (wiki Ginnem, revid 3963153). I tried it as a pixel lift of the face skin (`scripts/gn_face.py`) and dropped it: it made no visible change, because the face is already near white.
  - Her hair came out fair, not brunette. Brunette was only our own prompt word, and it is unsourced.

## In the game

`production/battle-frame.jpg` (HUD) and `battle-frame-clean.jpg` (HUD off) come from the real game at 1600x900.

- Setup: real GPU, own Vite server on port 5821 with HMR off, stopped by PID.
- Stage: Chapter I (the Cavern chamber backdrop is not built). The chapter's fiends are hidden from the console.
- The three candidates were added through the engine's own `stage.add` at the world heights above. Their bytes were served by Playwright request interception (`scripts/shot.mjs`).
- Projected feet and top positions are in `battle-frame.json`. All three read at battle scale. Ginnem's navy and lavender robe goes dark under the scene's blue light, and her glow reads as a pale outline.

The sheet, with 1:1 crops of every repair and of the untouched parts, is `production/characters.jpg`.

## Owed, and not decided here (keep under `inferred` until Bailey names them)

- **World heights and positions** belong to the chapter's data and stage, in the other track. The numbers above are the visual bible's estimates. The options frames showed Yojimbo at about twice party height.
- **No state other than idle** was made. Under the r3 state map, an enemy's cast is the only other painting worth making, and hurt, attack and ko fall back to the idle.
- **Ginnem's live unsent effect** (motes, and possibly the translucency) belongs to the engine.
