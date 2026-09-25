# Chapter XII, Seymour Omnis: the ship layer (UNLISTED)

**Game case: FFX only** (AGENTS.md rule 14): Seymour's last form, inside Sin
(`research/ffx-seymour-omnis.md` §0.3). The HUD tap, the speaker id and the departure entry are
shared plumbing (both games), inert everywhere but Chapter XII.

Branch `chapter-omnis-ship-0925` (worktree `D:/pyrefly-ch-omnis-ship`), built on the engine branch
`chapter-omnis-0925` with `main` merged in (Trema listed on main; both chapters kept). Bailey's words:
2026-09-25 ~01:40 EDT "I'll go with all your recommendations" (B1-B23, O-1..O-6; D-145), ~10:20 EDT
the same for the hero plate A and portrait A (D-154, locked), ~12:35 EDT "all recommendations please"
(Omnis ships first, D-162).

## What is built

| Piece | File | Picks it follows |
|---|---|---|
| Ship layer over the engine record (scene, story, music) | `src/data/chapter-omnis-ship.ts` → `UNLISTED_CHAPTERS` | B8 (unlisted), B18 stand-ins, B21 |
| The Garden of Pain scene | `src/scenes/garden-of-pain.ts`, `-rigs.ts`, `-discs.ts` | O-3 C plate, O-1 A Omnis, O-2 B discs, B2 a line-up |
| Disc colours on the field | `src/engine/OmnisDiscTap.ts`, wired in `BattleScreenWiring.createHud` (FFX HUD) | O-2 B, plan O-G8 |
| Story: pre, post, nine callouts | `src/story/scripts/seymour-omnis.ts` | B15, B16 a, B3 a, B17 c; draft lines 1-17 unchanged |
| Callout hooks in the engine | `src/battle/ffx/ai/seymour-omnis-callouts.ts` (+2 calls in the AI, +5 lines in the rules) | B15; research §4.4 (lines before Dispel and each Ultima) |
| Speaker `seymour-omnis` | `src/story/dsl.ts`, `DialogueBox.defaultName`, `speaker-roles.ts` | B17 c (portrait A) |
| Pause card (unlisted) | `src/data/chapter-meta-seymour-omnis.ts` → `UNLISTED_CHAPTER_META` | hero plate A `pause/ch12-seymour-omnis`, portrait fallback |
| Guide and tactic | `src/data/guides/seymour-omnis.ts`, `src/engine/tactics/seymour-omnis.ts` | the bench's intended line (127/200, same seeds) |
| Departure | `'seymour-omnis': 'held'` in `BattlePresenterDepartures.ts` | research §4.6: he is sent in the post scene |
| Cutscene figure | `CUTSCENE_FIGURES['seymour-omnis']` (`cutsceneFigures.ts`) | O-1 A idle, unsent glow |

**Music.** B18 = a (a new cue spending `SEYMOUR_UNMOORED`) is not written: it needs sketches Bailey
judges by ear (rules 9, 13). The battle plays B18's named stand-in `boss-seymour`; the scene cue is
`scene-dreams-end`, the score's one cue for the inside of Sin (also a stand-in).

**Departures from the draft or the plan, all said in the code.** The dive line plays as the plate
fades in (the cutscene's black fade also hides the dialogue box); the first-disc callout has a Tidus
variant without Wakka's "ya" (our words) for when someone else turned the disc; the discs are drawn
7 % closer to him than the O-2 composite so the right pair clears the CTB list at 2000x1012; Tidus's
and Auron's slots sit 0.62 and 0.4 right of Dream's End's (the art round's judged staging), because
there the first slot stood behind the FFX command stack's lower rows (FLEE, SWITCH) at all three
wide sizes; a scene test pins the party right of the stack at 16:9.

## Not built (owed)

- **The HUD disc strip and the intent line** (O-2 B's chips, O-4 C, plan T8). The painted discs turn
  on the field; the HUD does not list them yet.
- **The red glow** as a live effect (O-8): the engine's telegraph message and Auron's first-glow line
  carry it.
- **B18's own cue** (O-6 sketches on `docs/audio/audition.html`).
- **The listing** (B8): Bailey confirms the ring order and the reset cycle first; the listing step is
  the Trema precedent (`5c8706d6`).

## Proof

- `tsc --noEmit` clean; the three new test files (`tests/unit/chapters/omnis-ship-{story,scene,content}.test.ts`)
  and the four re-pinned shared suites pass; the Omnis bench prints the same 127/200 and key moments
  as before the hooks; the tactic alone wins 127/200 on the same seeds.
- `node tools/orphans.mjs`: 24 orphans, the same as main.
- Frames (JPEG, real engine via `window.__pyrefly.gotoChapter('seymour-omnis', { seed: 1 })` from a
  fresh load, private Vite on 5761 with HMR and the watcher off, headless GPU Chromium, server stopped
  by its PID): `docs/concepts/chapters/omnis/ship/` — `fight-1280x720`, `fight-1600x900`,
  `fight-2000x1012`, `fight-390x844`, `disc-turned-1600x900` (Wakka's blow turned the upper-left disc
  to Water; his callout), `story-pre-1600x900` (line 3) and `story-post-1600x900` (line 12, the
  sending). No page errors and no bad art responses in any run.
