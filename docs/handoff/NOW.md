# NOW — where Pyrefly Reprise stands

> **Snapshot: 2026-09-21 00:20 EDT**, written by the driver session ("FFX/FFX-2 2.5D game recreation").
> **THE PAUSE IS LIFTED.** On 2026-09-20 Bailey wrote to the driver: "continue on with work please but do not forget
> our delegation policy and carefully monitor token usage, weekly usage, 5 hour session usage so that we still meet our
> goals with this project". The driver now runs on a fresh Claude account (weekly 16 percent used at this snapshot,
> resets 2026-09-26 07:00 EDT). Work, releases and reviews are authorised; keep them economical (about 15 weekly
> points a day, Sonnet for well-specified tracks, one browser capture owner, stop servers by their own PID only).

## Live (Build A)

- https://baileypillon.github.io/pyrefly-reprise/ = `main 7191674`, bundle `hko3Xov1`, deployed 2026-09-19 21:18 EDT
  (recorded in `9a56d80`). Rounds 02 and 03 are rubric v1 history.
- **Critic policy v2 is in force and committed** (`4ccba89`, `d7b9dcb`): `critic/RUBRIC.md`, `node tools/critic-plan.mjs`,
  release through `critic/runner/release.js`.

## In flight: Build A.2 (release candidate = `main` HEAD)

- Build A.1 fixes (`dd12561` .. `bc2571c`): Threaten and Sleep expire, Yu Yevon's counters and Gravija, letter tags per
  name group, HUD rows move with each blow, honest wording, saved volumes at boot, FFX-2 menu fixes. Handoffs
  `builda1-*.md`.
- **Deep review round 04** (`critic/rounds/round-04.md`, `0ed1e8b`) judged that candidate BEFORE deploy: changed area
  FAIL (PR-0003 results ledger, PR-0004 Threaten counters, PR-0009 guide slices), so nothing was deployed.
- Repairs, verified twice (`c7072ac`, `b7fcc34`, `1b0f274`, `959577d`, `c278f71`, `82e924a`, `ee49fc3`, verifier notes
  `builda1-repair-verify.json`, `builda1-repair-verify2.md`): all five issues confirmed fixed; tsc clean, 4290 tests green.
- **Onboarding, Bailey's pick "C: Auron's briefing"** (2026-09-20; targets.json tiles C1-C3; `5e8eca5`, `b8a905f`,
  `e30ea5e`; handoff `onboarding-c.md`): built, adversarially verified, fix pass done.
- **Next step: release this candidate** with `critic/runner/release.js`, round `05` (shared systems changed, so a deep
  review of the production candidate comes first; reuse round 04's evidence for what these commits did not touch).
- Portrait candidates for the eight missing speaker portraits are with Bailey (`docs/concepts/portraits/sheet.png`,
  `d57aa41`); nothing ships until Bailey picks. `fayth-boy` also has a file-name mismatch to fix then.

## Waiting on Bailey (none of these blocks the release)

Portrait picks; FFX-2 Active versus Wait ATB (the engine stops the ATB while a command menu is open, and the Build A
chip says ACTIVE); the cost of a denied turn (marked `[estimate]`); whether FFX-2 letters a boss's same-named parts;
whether the advisor may overrule the guide's pinned pick when a revive scores far higher; a mute row in OPTIONS;
whether the never-wired "Turn cut-in" tile still stands; options rounds for the defeat screen, the advisor card, the
enemy-move panel and the phone layout; an audio score out of ten; Chapter 5 length and Chapter 1 difficulty (bring
measured options).

## Machine

- D: is flagged dirty and RAM runs XMP 6400 past AMD's 5200 limit: crashes and in-place file corruption. Boot-time
  chkdsk is scheduled for C: and D:. Bailey is turning XMP off in the BIOS, then updating the BIOS (FA2 to FC4c) and
  trying 6000. Guides: `C:\PyreflyBackup\BIOS-quick-guide.pdf` (2 pages), `PC-stability-guide.pdf` (full).
  After the repair: run `git fsck`, re-hash the ComfyUI models (ART-PIPELINE section 9), re-run the approved-art check.
- Never run `npm ci` in this tree while dev servers are up (it half-deleted `node_modules` on 2026-09-19;
  `npm ci --offline` restored it). Releases are cut from `D:\pyrefly-release`; delete its `dist-gate/` before deploying.

---
*Older snapshot (2026-09-19 08:05 EDT) kept below for the track tables; where it disagrees with the block above, the block above wins.*

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
| targeting | Bailey's criticism 8, built to the approved option B (`docs/concepts/targeting/b-ring-and-dim/`): bracket scaled to the figure, ink name plate with its letter tag, FFX's hand / FFX-2's flower, accent pool + quiet dim, spread formation measured against the camera | **done**, `83ea60a` `177c0ac` `8653b63` `764528e`; verified live in all five chapters (107/109 checks, GPU mode), two open questions for Bailey | [fix3-targeting](fix3-targeting.md) |
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

- **Critic policy v2 (Bailey, 2026-09-20): every deployed build is evaluated, and the depth of the review
  follows what changed.** Deployment verification, changed-area acceptance and milestone acceptance are
  separate verdicts; one weighted score (9.60 unrounded, every category at least 9.0) plus gates;
  approved-target comparison is a gate; unknown or stale evidence is never a pass; an old score never
  certifies a new build. `critic/RUBRIC.md`; `node tools/critic-plan.mjs` says which review a change needs.
  The "full round after every deploy" rule is replaced by this; rounds 02 and 03 stay as rubric v1 history.

- **Standing rule from 2026-09-19 (Bailey): every change is specific and game-aware.**
  True to FFX but not FFX-2: it does not apply to FFX-2. True to FFX-2 but not FFX: it
  does not apply to FFX. True to both: it applies to both. Decide from the sources
  (`research/*.md`, `research/ffx-vs-ffx2-presentation.md`), write the case in the plan,
  handoff and commit. AGENTS.md hard rule 14; the critic checks it as CHK-021.

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

### 2026-09-20 (afternoon) — Claude Code sub-agent (onboarding option C: adversarial fix pass; nothing deployed)
- Did: an adversarial verifier refuted four properties of the onboarding build `b8a905f` on the running game, and this pass fixed each at its root. (1)+(2) Enter and Escape skipped Auron's briefing **and** were acted on by the screen behind it one frame later — first launch went title → briefing → party prep with the chapter board never seen, Escape backed the board out to the title, and the pause replay re-raised itself on every confirm, forever. The cause was in `src/app/Input.ts`: `claimKeyboard` stopped the DOM event in the capture phase but `onKeyDown` still latched the abstract button. `claimKeyboard` now takes `{ exclusive: true }`: a swallowed key latches no button, screens behind read no button/axis/action while the claim is up, and the frame after it is handed back drops every pending edge (which also settles the gamepad, where the two poll loops' order used to decide the outcome). `PauseScreen` forwards the briefing nothing; `Briefing.handleInput` and the `driven` option are gone; the briefing's pad watcher ignores the HUD mute (`RawInputWatcher { ignoreSuspend }`) so the pause replay is still dismissible by pad. (3) The FFX-2 line's badge claimed "Nothing paused · gauges running" while the gauges were measurably frozen (8189 ticks → 8189 across 1.5 s in both X-2 chapters, **identical with `?coach=off`** — `BattlePresenter` awaits `HudPort.chooseCommand` and ticks the FFX-2 engine only in its `waiting` branch). The badge now reads "Keep playing · nothing to press", which is what the line itself does. (4) The test meant to prove the clock kept running ticked the engine itself and then asserted it had moved; replaced by two mutation-checked assertions that can fail. Commits `e30ea5e` (code + tests) and `6cd337e` (handoff, the C3 target tile's knowing departure from the mockup's badge label, re-captured shots and pairs). Game case: **both** — `Input.ts` is shared plumbing and these are bug fixes (CHK-020); the badge wording is FFX-2 only.
- Verified by: `npx tsc --noEmit` clean; full suite **158 files / 4 229 tests green** (4 221 before); `node tools/orphans.mjs` clean for `src/ui/coach/`. New `tests/unit/ui-coach-input-leak.test.ts` (7) drives a real `Input`, a real `Briefing`, real `KeyboardEvent`s and a stubbed `getGamepads`. One browser pass on my own Vite server (port 5731, `--strictPort`, stopped afterwards), `PYREFLY_BROWSER=gpu` throughout, **re-running the verifier's own probes unchanged**: first-launch Enter now lands on `chapter-select` (was `party-prep`), Escape/click/wait-out all `chapter-select` (Escape was `title`), title replay stays on `title`, the pause replay's first Enter dismisses with `created 0` (was an endless loop) and Escape leaves `.pause__row` 12 → 12 with `screen: pause` (was the pause menu closed). Shots and the three target-versus-build pairs rebuilt under `docs/screenshots/onboarding/` and looked at.
- Left uncommitted: nothing of mine.
- Next: **a question for Bailey before anything else here** — should the FFX-2 ATB run while you are choosing a command? It does not today, teaching or no teaching; that is the Active/Wait setting (`research/ffx-vs-ffx2-presentation.md` §4.2, row "Command input"), which the build does not implement. FFX-2 only, combat-core, changes every X-2 fight's difficulty, so hard rule 10 applies. Then: this is a shared-system change (`src/app/Input.ts`), so `tools/critic-plan.mjs` will ask for a **deep review before going public**, and the first-time-player pass is still unrun.

### 2026-09-20 01:45 EDT — Claude Code side session (critic policy v2 integrated; nothing deployed, the pause stands)
- Did: Bailey approved the consolidated critic ("my approval of the proposed scoring, gates, cadence, and resource controls"). Integrated it: `critic/RUBRIC.md` is now policy v2 (three verdicts, a schedule where review depth follows the change, ONE weighted score over ten categories, acceptance gates, the approved-target gate that replaces Part C as a number); the old rubric is `critic/archive/RUBRIC-v1-ABC.md` and rounds 02 and 03 stay rubric v1 history. `critic/policy.json` holds the same rules as data. `critic/CHECKS.md` keeps CHK-001 to CHK-021 and B1 to B4 and adds CHK-022 (outcomes reach their destination), CHK-023 (subsystems are invoked through the real path), CHK-024 (saves survive an upgrade). New tools: `tools/critic-policy.mjs` (plan, score, gates, report validation), `critic-plan.mjs`, `critic-clear.mjs` (the only way an obligation is settled), `critic-score.mjs`, `artifact-manifest.mjs` (identity of every shipped file + byte-for-byte live verification); `critic-pending.mjs`, `critic-status.mjs` and `deploy-pages.mjs` reworked: a deploy now plans its review, refuses a shared-system change with no passing deep report, verifies the exact live artifact, and records separate `live` / `focused` / `deep` / `milestone` obligations; a replaced build's unsettled deep review moves to the new build. Review workflows: `critic/runner/release.js`, `focused.js`, `live.js`, `deep.js`; the driver's `pyrefly-release-clean.js` is now a copy of `release.js`, and the old `pyrefly-critic-round-2.js` and `pyrefly-critic-gate.js` refuse to run for a new build (backups beside them as `.pre-policy-v2.bak`). Seeded `critic/ledger.json` (baseline: round 03 on `7191674`, evidence only) and `critic/artifacts/7191674.json` (720 files, 367.7 MB, all media decode).
- Verified by: `tests/unit/critic-policy-v2.test.ts` (51) and `tests/unit/artifact-manifest.test.ts` (10) plus the 19 existing marker tests, `npx tsc --noEmit` clean; `node tools/critic-plan.mjs` on the real tree (docs-only since `7191674`: LIVE; a pause caption: FOCUSED; `src/battle/ffx/ctb.ts`: DEEP before deploy); `verify-live` against the real site compared 48 files byte-identical and still answered UNVERIFIED because build `7191674` published no manifest (fail closed, as designed); `deploy-pages.mjs --dry-run` prints the plan; all workflow scripts pass a syntax check. **Not executed: the four review workflows and a real deploy with the new script** (paused, allowance at 99 percent).
- Left uncommitted: everything above. **The release worktree is cut from committed `main`, so none of this applies to a release until it is committed;** `release.js` stops at the cut with that message if the tools are missing.
- Next: commit the critic integration; at the next release watch the first `live.js` and `focused.js` runs and tune the time budgets after three real runs (RUBRIC §4).

### 2026-09-19 (afternoon) — Claude Code side session (targeting pick on the board)
- Did: at the driver session's request, recorded Bailey's targeting pick ("B: hand, ring and a quiet dim") in `docs/target/targets.json` as three approved tiles (`docs/concepts/targeting/b-ring-and-dim/s1..s3.png`) with their game-aware cases and build hints; updated the Leblanc tile (Chateau Leblanc), the battle-transition tile (canon by situation) and the chapters note (they wait for the 25 Sep allowance reset). Board republished: 50 approved, 0 awaiting a verdict, 9 gaps, 2 rejected.
- Verified by: the three pictures viewed on a contact sheet before publishing.
- Left uncommitted: `docs/target/targets.json`, this entry.
- Next: remaining gaps are the move advisor card, the enemy next-move panel, the defeat screen, the cold open, the phone layout, the three chapters' concept sheets and one finished minute of play.

### 2026-09-19 (afternoon) — Claude Code side session (game-aware rule)
- Did: recorded Bailey's new standing rule (every change is FFX-only, FFX-2-only or both; see "Owner decisions in force") as `AGENTS.md` hard rule 14, `critic/CHECKS.md` CHK-021, a note in `docs/PRODUCT-BRIEF.md`, and memory `game-aware-changes`; told the busy driver session by message.
- Verified by: nothing to run; docs only. CHK-021 is written to sit beside CHK-020 (shared plumbing and bug fixes are "both").
- Left uncommitted: those four files and this entry.
- Next: every plan, handoff note and commit states its case and its source.

### 2026-09-19 (afternoon) — Claude Code side session (Bailey approved the end-state board)
- Did: Bailey said "i approve everything you listed in the end state board and please let the other agents know". `docs/target/targets.json` now has 47 approved tiles, 0 awaiting a verdict, 10 gaps, 2 rejected. Newly approved: the four other scene backdrops, ten cast tiles (FFX party portraits, Tidus, Yuna, Auron, Seymour Flux, Yunalesca 1, Braska's Final Aeon 1, Shiva, Yuna Gunner, Shuyin), the rebuilt pause screen and every pause plate, the concept key art, and audio as a direction ("Right direction, keep refining" still stands). Also filed the 12 concept boards Bailey picked as approved tiles (with their FFX-only / FFX-2-only notes), and the three new chapters and the cold open as gaps. Board republished (same URL, version 3).
- **What it means for every agent:** an approved painting is never replaced on an agent judge's say-so; a change needs Bailey's yes (the approved face pass on the weak close-ups is such a yes for the close-ups it names). sha256 of the 94 shipped files behind the approved tiles: `docs/target/approved-hashes.json`; backup copy: `D:\Tools\pyrefly-art-backup\approved\2026-09-19-board` (public/art has no git history). Part C of the rubric scores every approved tile from its `build` hint. **Targeting is still a gap: Bailey has not picked a look**, so a cheap options round comes before the staged targeting track builds.
- Also new: `docs/PRODUCT-BRIEF.md`, a draft from Bailey's picks (faithful recreation + 2026 showpiece; "faithful core, showpiece surface" settles conflicts; seasons; "one more try" from the fight itself), waiting for Bailey's yes.
- Verified by: none of the board's pictures or the shipped files behind them changed after the board Bailey looked at was generated (mtime check); the 12 concept mockups viewed on a contact sheet before publishing.
- Left uncommitted: `docs/target/targets.json`, `docs/target/approved-hashes.json`, `docs/PRODUCT-BRIEF.md`, `AGENTS.md`, `critic/RUBRIC.md`, `tools/end-state-board.mjs`, this entry.
- Next: when Bailey picks a new target, record it in `targets.json` (state, their words, date, `build` hint), run `node tools/end-state-board.mjs`, republish to the same artifact URL.

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
