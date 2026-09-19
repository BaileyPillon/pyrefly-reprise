# NOW — where Pyrefly Reprise stands

> **Snapshot: 2026-09-19 08:05 EDT**, written by a side session from `git`,
> `docs/deploys.log` and the driver session's 22:15 notes. Whoever drives the project
> refreshes this file at the end of every work block. If this date is more than a
> day old, trust `git log -15` and `tail docs/deploys.log` over anything below.

## Live

- https://baileypillon.github.io/pyrefly-reprise/ = `main 5a82e71`, bundle `CF_L2xLd`, deployed
  2026-09-19 04:52 EDT (recorded in `97b1e56`), verified live with real key presses (Esc, P, H, N, E),
  prerendered audio playing, 0 console errors, 0 404s. Refreshed by the driver session 08:05 EDT.
- **Critic round 02 is complete** on that build: [critic/rounds/round-02.md](../../critic/rounds/round-02.md).
  Headline **3.5** (Part A 5.6, Part B 3.5, Part C 5.3; gate 9.6; Part C coverage incomplete). 45 ranked
  issues (26 blockers) and 5 proposals that need Bailey's yes. `critic/pending/` is clear.
- **Bailey's standing instruction (2026-09-19): everything is PAUSED except the concept boards**
  (`docs/concepts/polish/`, workflow running in the driver session). Do not start fixes from the critic's
  list, the fix-round-3 tracks, targeting, the audio fix pass or art until Bailey says resume.

## Who is active

- The Claude Code driver session "FFX/FFX-2 2.5D game recreation" runs the fix-round-3
  workflows. Its agents leave uncommitted work in the tree. At this snapshot:
  ~370 files under `docs/screenshots`, 60 under `tools/gen`, 21 under `src/audio`, and
  a few each in `src/ui`, `tests/unit`, `public/audio`, `src/app`, `src/data`, `src/story`.
- **If Claude's weekly allowance has run out, those agents are dead and their edits
  are still here.** Do not clean up. Before touching a modified file, read the matching
  `docs/handoff/fix3-*.md` and continue that work.

## In flight: fix round 3 (Bailey's criticisms of the `822ae16` build)

States are the driver's 22:15 notes plus `git log`; confirm before relying on one.

| Track | Fixes | State | Handoff |
|---|---|---|---|
| advisor | Never names a move the acting character lacks; state-aware revive; plain-words card | `01d4f6c`, `3aa5440`; verifier refuted 3 points once, fix pass under way | [fix3-advisor](fix3-advisor.md) |
| ffx-hud | Stale "Ronso Rage" banner, card and chips over sprites, CTB names truncated | `ffc516b`; builder still running | [fix3-ffx-hud](fix3-ffx-hud.md) |
| ffx2-hud-prep | FFX-2 party-row portraits, measured face crops, prep tabs | fix pass 2 (`bf0e017`) | [fix3-ffx2-hud-prep](fix3-ffx2-hud-prep.md) |
| pause | Full-bleed 2x plates, viewport-relative type | in verification; `PauseScreen.ts` modified, uncommitted | [fix3-pause](fix3-pause.md) |
| audio | Sampled-orchestra prerender: 21 cues + 134 SFX (`e7a6ed5`); fix pass for QA's 7 findings (`6e8c145`) under way | **Bailey judges by ear**: `docs/audio/audition.html` | [AUDIO-GUIDE](../AUDIO-GUIDE.md), [THEMES](../audio/THEMES.md) |
| targeting | Ground ring + chevron + name plate on targets, no enemy hidden behind another, visibility matrix per chapter | **staged, not started**; begins after both HUD tracks are final (same files) | criticism 8 in the owner's list |
| art track 3 | X-2 cast and the X-2 bosses fix remain | Earlier art was painted with a corrupt checkpoint and IP-Adapter (replaced 21:43, checksums in `811682d`): check the A/B before spending GPU on re-rolls | `art3-*.md`, [ART-PIPELINE](../ART-PIPELINE.md) |
| concept boards | 22 polish ideas as mockups in `docs/concepts/polish/` | **mockups only**; nothing is built until Bailey picks | |

## Next tasks any agent can take (no GPU, each one testable)

From the pre-deploy gate at 22:15. **Reproduce each one first**; another agent may
have fixed it since.

1. Party prep ITEMS / EQUIPMENT print raw ids (`strength-10` reads as a penalty): show display names.
2. Sphere Grid shows `K1`-`K4` labels and a debug zoom readout to players: hide them.
3. The polaroid caption still ships with an ellipsis.
4. Chapter select's hint says LEFT/RIGHT for a vertical list and overflows at 390 px wide.
5. Phone viewport (390x844) is a letterboxed strip with unreadable text on every screen
   except pause. Needs a layout decision: mockup first, then Bailey.
6. Chapter 1 did not reach a first player turn within 40 s on a saturated machine
   (unproven). Re-test on a quiet machine before calling it a bug.

Then, in the owner's order: advisor correctness → pause screen → audio → layout
collisions → targeting.

## Closed recently (do not redo)

All four engine follow-ups from 09-16 are done and verified in this snapshot: the timed
Overdrive bare re-submit loop in both engines, the possessed-aeon data (Passado is
15 hits), the `effectiveStats` export (`src/battle/ffx/effectiveStats.ts`), and the
`PartyPrepScreen.ts` split (372 lines). Details: [play-engine-followups](play-engine-followups.md).

## Owner decisions in force

- Release order: the gameplay-fix build first, the audio build second, then **pause all
  work** until Bailey says go.
- Local art generation is **on** (resumed the evening of 09-18) until that pause.
- Run two or three workflows at a time, and the release gate alone on a quiet machine.
  Six at once exhausted the 5-hour allowance at 21:45 and killed every agent mid-work.
- A release gate stops only for regressions; pre-existing defects get labelled and listed.

## Log (newest first; keep the last ten)

Template:

```
### YYYY-MM-DD HH:MM — <tool / session>
- Did:
- Verified by:
- Left uncommitted:
- Next:
```

### 2026-09-18 23:40 — Claude Code side session (rubric Part C)
- Did: on Bailey's word ("you can add that to the rubric as part C") added **Part C: fidelity to the approved end state** to `critic/RUBRIC.md` (Parts A and B untouched). It scores only `approved` tiles in `docs/target/targets.json`, from target-vs-build composites; the gate is now 9.6 on all three parts plus complete coverage of the board. The staged round script `pyrefly-critic-round-2.js` gained one Part C auditor (sonnet, medium effort), three totals in the chief's report and a "Waiting on the owner" list; backup beside it as `.pre-partc.bak`. `tools/end-state-board.mjs --pair <target> <build> --out <file.jpg>` makes the side-by-side; approved tiles carry a `build` hint and the Zanarkand tile its `sha256`.
- Verified by: the script's body passes `node --check` (wrapped in an async function) and its `meta` still evaluates as a literal; `--pair` run on the title mockup vs the live title frame; `targets.json` parses. **The edited round script has not been run yet.**
- Left uncommitted: `critic/RUBRIC.md`, `AGENTS.md`, `docs/target/targets.json`, `tools/end-state-board.mjs`, this entry.
- Next: the next full critic round is the first with Part C; check its `part-c/` composites and the chief's three totals.

### 2026-09-18 23:15 — Claude Code side session (end-state board)
- Did: Bailey approved "end state first" as a standing rule (AGENTS.md hard rule 9). Added `docs/target/targets.json` (approved targets, pictures awaiting Bailey's verdict, gaps) and `tools/end-state-board.mjs`, which renders it to `docs/target/board.html` (gitignored). Published copy for Bailey: https://claude.ai/artifact/2qt2ZqrrdjRDwa5crZ4ifg
- Verified by: every picture on the board viewed on a contact sheet; one desktop and one phone screenshot of the page (no sideways scroll at 400 px); the game's Zanarkand backdrop has the same sha256 as the approved copy.
- Left uncommitted: `AGENTS.md` (rule 9 + map row), `.gitignore` (one line), `docs/target/targets.json`, `tools/end-state-board.mjs`, this entry. No product code touched.
- Next: **targeting needs an options round before its track launches** (it exists only in words). When Bailey gives a verdict, record it in `targets.json` with their words and the date, then rerun the script.

### 2026-09-18 22:55 — Claude Code side session
- Did: wrote `AGENTS.md`, `CLAUDE.md` (imports it) and this file so any agent can start cold.
- Verified by: every path and command in `AGENTS.md` checked against the repo; the four closed follow-ups checked in the source.
- Left uncommitted: `AGENTS.md`, `CLAUDE.md`, `docs/handoff/NOW.md` (docs only; nothing else touched).
- Next: the driver session owns this file from here.
