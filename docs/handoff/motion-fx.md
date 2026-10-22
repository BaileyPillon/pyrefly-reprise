# motion-fx: spell, hit and Overdrive effects for the demo chapters (lane fx, branch `motion-fx`)

Bailey, 2026-10-22 00:10 to 01:30 EDT: spell effects "Faithful shape, painted finish": each effect's shape, colour and timing follow its own game (FFX in Chapter I, FFX-2 in Chapter IV), drawn with a brushy painted finish; reference "Official videos"; scope "Demo chapters first" (Chapter I Seymour Flux and Chapter IV Bahamut only, only when switched on); perf guard "Trim particles first"; motion SFX and hit-stop belong to the other lanes.
Base: `origin/main` 3e520971e (release 61 + records). Tree `D:/pyrefly-rig-auron2`, dev port 5303. Notes folder (scratch, not in the repo): `D:/Tools/pyrefly-scratch/2026-10-22/motion/fx/`.

## State

| Step | What | State |
|---|---|---|
| 1 of 3 | Reference notes: shape, motion, colour, timing, layering and caster/target for every effect in scope, per game, from research and official videos | **DONE** (this note and `docs/handoff/motion-fx-reference.md`; no code) |
| 2 of 3 | The switch module, the Cure column, the FFX Overdrive start, the Swordplay strike grammar, the FFX-2 name slab and dress change, the neutral painted finish on the gaps | not started |
| 3 of 3 | The painted finish as an asset family or a shader, the perf guard, the recorder clips | not started |

No source file, test, art file or setting changed in step 1. The only repo changes are these two documents.

## What step 1 found (the short version; the full file is `docs/handoff/motion-fx-reference.md`)

* **The research has no spell shapes** ("nothing in research/ describes the retail spell animations", `docs/handoff/iter2-spellfx-b.md:10`). It has timings (FFX party casts, attacks and items from the game's motion tables; FFX-2 effect lengths measured on the running game) and one live item reading.
* **Square Enix's own videos give shapes for some effects and nothing for others.** Read: the FINAL FANTASY channel's "Battles" video, the Gamescom and TGS trailers, the Square Enix JP "FFX-2 battle" short and others (list and times in the reference).
  * **Sourced shape:** the FFX Cure column (pale mint and white crystalline column per target, a ground ring, cyan darts, one column per character in turn, about 1.5 s each, the scene dims while it plays); the FFX Overdrive start (name banner, OVERDRIVE tab, translucent violet band with LCD countdown, gold "GOOD", hard cut, calm beat) and the Swordplay strike grammar (sword-tip flash plus cyan ring, magenta rods or ribbons, smoke and debris); Kimahri's Jump beat; Lulu's cast pose; **FFX-2's Darkness** (floor ring, violet-black haze with floating black spheres, red-orange ground band, target thrown up and down, about 1.5 s), FFX-2's name slab, chain counters, dress change and Special dress up.
  * **[gap] (no official video shows it):** every Seymour Flux and Mortiorchis move, Bahamut's Curse, Impulse and Mega Flare (and the FFX-2 Bahamut at all), Haste, Shell, Protect, Reflect and Dispel, FFX-2's White Mage spells and the Warrior's moves, plain physical hit sparks per weapon, items on foes.
* **FFX-2 has no Overdrive;** its "special moment" is the dress change; the Special dress up needs every grid node worn this battle and is unreachable in the demo.

## Game case (AGENTS.md rule 14), per effect

FFX only: the Cure column, the FFX Overdrive start and Swordplay strike, Kimahri's Jump, Lulu's casts, the item orb (already built), the Seymour Flux moves. FFX-2 only: Darkness, the name slab and chain counters, the dress change, the item spark (secondhand), Bahamut's moves. Both: the cast structure (FFX numbers are FFX only; FFX-2's are its own), shared plumbing (the switch module, the perf guard), the "no effect may hold the fight" rule is FFX-2 only (measured) while FFX holds for the cast.

## Switches (planned, nothing written yet)

Convention from the brief: a lane-owned pure module reading its own URL key once (suggested `?fx=cure|intro|swordplay|all`, default OFF) plus the shared `?pack=demo`; chapter gate = Chapter I (`seymour-flux`) and Chapter IV (`ffx2-bahamut`); a `window.__pyrefly` setter for the recorder. Pattern: `src/engine/PoseSwap.ts`, `HitRecoil.recoilLegacy`.

## What is [ours]

Everything marked [ours] in the reference: today's effect shapes (`spellfx/effects-*.ts`), the design table in `research/visual-bible.md` (pixel-era estimates), the data agent's `vfx-*` ids, the neutral versions proposed for the gaps. Nothing marked [ours] is a fact about the original.

## Open questions (for the driver)

See section 6 of the reference. The ones that matter first: (1) a Steam capture to close the gaps, or [ours] shapes (recommended [ours] for Thursday); (2) replacing the approved option-B Cure (motes) with the retail column needs Bailey's yes; (3) the FFX Overdrive start vs the build's letterbox start needs a mockup first (rule 9); (4) aeons in Chapter I; (5) the painted-finish asset path (rule 8 against his 2026-10-18 lift).

## Not done in step 1

* Fine (0.5 s) frame reads for a second Cure in HD, Lulu's second spell, Thunder and the late FFX-2 clips (headless playback stalls late in a video; the machine's browser lock queue did not clear): they are read at the videos' 1 to 2 s storyboards instead, and the reference says so (section 6 item 8).
* No code, so no tsc and no tests were run; nothing in src, tests, tools or art changed.
* NOW.md, ACTIONS.md and DECISIONS.md are not touched (hot files shared by every lane); the driver adds the rows.

## Evidence and downloads

Only YouTube storyboard JPEGs and in-memory frames of a headless browser were read; no video file, no account, no retail asset is stored. The tools (`yt-search.mjs`, `yt-sb.mjs`, `yt-frames2.mjs`, `rr-run.mjs`) and `downloads.log` are in the notes folder.
