# AGENTS.md — Pyrefly Reprise

An unofficial fan tribute that recreates five boss encounters from Final Fantasy X
and X-2 as a painted 2.5D web game: TypeScript (strict, ESM) + Vite + Three.js,
HTML/CSS HUDs, vitest + Playwright. Owner: Bailey. Windows 11, repo at
`D:\Final Fantasy` (the space in the path is real: quote it).
Live: https://baileypillon.github.io/pyrefly-reprise/ · Repo: `BaileyPillon/pyrefly-reprise` (public).

This file is the entry point for **any** coding agent (Claude Code, Codex, Gemini,
Jules, ...). `CLAUDE.md` only imports it. Keep it short; details live in `docs/`.

## Start of every session

1. Read [docs/handoff/NOW.md](docs/handoff/NOW.md): what is live, what is in flight, what to do next.
2. Run `git status --short | head -30`. Modified files you did not touch are
   **another agent's unfinished work**. See "Shared working tree" below.
3. Read the governing doc for the area you are about to change (map below).

## Commands (run from the repo root; Node 24)

| What | Command |
|---|---|
| Type check | `npx tsc --noEmit` |
| One test file | `npx vitest run tests/unit/<file>.test.ts` |
| Full unit suite (110 files) | `npm test` |
| Modules nothing imports | `node tools/orphans.mjs` |
| Dev server | `npm run dev` (5173; if taken: `npx vite --port 5190`) |
| Production build to the shared `dist/` | `npm run build` |
| Screenshot | `npm run screenshot -- --url=http://localhost:5173/ --out=docs/screenshots/<name>.png` |
| What each live build still owes the critic, and which issues have stalled | `npm run critic:status` |
| Which review a change needs, and why | `node tools/critic-plan.mjs` (`--paths a,b` to ask about files) |
| Settle a review obligation with a report | `node tools/critic-clear.mjs --report <report.json>` (never delete a marker) |
| Release | `npm run deploy` (read "Release" first) |

Everything else (ports, base path, the screenshot flags, the `window.__pyrefly`
debug API that plays a chapter to an outcome from the console) is in
[docs/DEV.md](docs/DEV.md). The `gh` CLI is `D:\Tools\GitHubCLI\gh.exe` (on the user PATH since
2026-09-20; an app or terminal opened before then still needs the full path).

## Map

| Path | What it is | Read first |
|---|---|---|
| `src/battle/common`, `ffx` (CTB), `ffx2` (ATB) | Pure battle engines | [ARCHITECTURE](docs/ARCHITECTURE.md), [ENGINE-API](docs/ENGINE-API.md) |
| `src/data/**`, `src/data/encounters.ts` | Sourced game data, the five chapters | `research/*.md` |
| `src/engine` (`tactics/` = move advisor) | Three.js presentation, battle presenter, HUD port | [ARCHITECTURE](docs/ARCHITECTURE.md) |
| `src/scenes`, `src/sprites`, `tools/gen` | Painted scenes, billboards, ComfyUI pipeline | [ART-PIPELINE](docs/ART-PIPELINE.md) |
| `src/ui/ffx`, `ffx2`, `inkgold`, `common` | HUDs and the "Ink & Gold" chrome | [presentation-ink-and-gold](docs/handoff/presentation-ink-and-gold.md) |
| `src/app/screens` | Title, chapter select, party prep, pause, results | |
| `src/story` | Cutscene DSL and scripts | `research/writing-bible.md` |
| `src/audio`, `public/audio`, `tools/audio` | Prerendered sampled music + SFX, synth fallback | [AUDIO-GUIDE](docs/AUDIO-GUIDE.md), [THEMES](docs/audio/THEMES.md) |
| `public/art/` | Painted PNGs. **Gitignored on main**, local only, backed up to `D:\Tools\pyrefly-art-backup` | |
| `critic/` | `RUBRIC.md` (policy v2: verdicts, schedule, one score, gates), `policy.json` (the same rules as data, enforced by `tools/critic-*.mjs`), `CHECKS.md` (CHK-001 to CHK-024, B1 to B4), `runner/` (the review workflows), `pending/` `cleared/` `reviews/` `rounds/` `artifacts/` `ledger.json` (obligations and evidence) | `RUBRIC.md` §4 and §10 before any release |
| `docs/handoff/<track>.md` | One file per finished or in-flight track | the one for your area |
| `docs/PRODUCT-BRIEF.md` | North star, the priority order when goals collide, what "finished" means, what is out of scope (draft until Bailey approves it) | before proposing or planning anything |
| `docs/target/targets.json`, `decisions.json` | Bailey's approved end states, pictures awaiting a verdict, and the gaps; per tile, whether it is built (`delivery`) and what Bailey named versus what an agent guessed (`reaction`). `decisions.json` holds the decisions that are not pictures, with their state. `node tools/end-state-board.mjs` renders the board | before building anything Bailey will see, hear or feel (hard rule 9) |
| `docs/CONTRACTS.md` | The shared files everyone imports | before touching any of them |

## Hard rules (each of these cost a day once)

1. **Layering.** `src/battle/**` and `src/engine/BattlePresenter*.ts` import no DOM and
   no `three`, and are deterministic under the seeded RNG. Engines emit
   `BattleEvent`s; presentation animates them.
2. **Shared contracts are additive.** Any change to a file listed in
   `docs/CONTRACTS.md` gets an entry in `docs/CONTRACT-CHANGES.md`, newest first.
3. **Prove a bug by running the engine, not by grepping.** Fields arrive through
   object spread, so text search misses them. Never summarise output that was cut off.
4. **Built but wired to nothing.** Twice a complete, tested subsystem had zero
   importers. After adding a module run `node tools/orphans.mjs`; a green suite
   does not catch this.
5. **Hit rule.** Magic and every Overdrive always hit (`canMiss: false`); only
   physical attacks roll. The engine reads only `canMiss === false`, so an unset
   field silently rolls. Guards test `!== false`, never `=== true`.
6. **Never invent game data.** Numbers come from `research/*.md` with their
   source notes. If something is unsourced, leave it alone and say so.
7. **House style** ([DEV.md](docs/DEV.md) "House rules"): strict TS, explicit `.ts` on
   relative imports, every source file under 400 lines.
8. **Original assets only.** No retail Square Enix assets, ever. `public/art/` never goes to `main`.
9. **Direction is settled:** painted 2.5D (pixel art was rejected) and the Ink & Gold
   interface. A new screen gets a mockup and Bailey's approval before it is integrated.
   **End state first (Bailey, 2026-09-18):** the same holds for anything Bailey will
   see, hear or feel, not only screens. Before building, show 2 to 4 options of the end
   state (mockup, concept frame, faked screenshot plus a few lines of play, audio
   sketch); build nothing until Bailey picks; save the pick as the target; report
   target and build side by side. Blind iteration ends in something Bailey does not
   want. When Bailey cannot put a preference into words, **raise the fidelity of the
   choices** instead of asking more abstract questions: written concepts, examples,
   rough layouts, mockups, one high-fidelity target, a small prototype. Start cheap
   and broad, spend more only on the options that survive, and treat a pick as
   approving only what Bailey names.
10. **Ideas need a yes.** Critic proposals and new gameplay or content get presented
    to Bailey; build none of them without an explicit yes.
11. **Ask before spending money or downloading anything.**
12. **GPU.** Queue ComfyUI renders only if NOW.md says art generation is on. All-black
    renders mean a bad GPU state: restart ComfyUI (scheduled task `PyreflyComfyUI`,
    see ART-PIPELINE) instead of re-rolling.
13. **Agents cannot hear.** Bailey judges audio from `docs/audio/audition.html`.
14. **Every change is specific and game-aware (Bailey's rule, 2026-09-19).** A change
    true to FFX but not FFX-2 does not apply to FFX-2. A change true to FFX-2 but not
    FFX does not apply to FFX. A change true to both applies to both. Decide which case
    it is from the sources (`research/*.md`, `research/ffx-vs-ffx2-presentation.md`),
    never from memory; if the sources do not say, say so and ask Bailey. Write the case
    (FFX only / FFX-2 only / both, and why) in the plan, the handoff note and the
    commit. Shared plumbing and bug fixes are "both" (see `critic/CHECKS.md` CHK-020);
    FFX chapters are 1 to 3, FFX-2 chapters are 4 and 5, plus the new ones by game.
15. **Pace the work and stop repeating it (Bailey, 2026-09-21; `critic/RUBRIC.md` §8 and §9).**
    Read the usage allowance and write the mode at the top of NOW.md: normal above 50
    percent of the week left, conserve from 20 to 50, protect at 20 or below; Bailey sets
    the mode by word and agents may only tighten it. Two failed attempts on a failure, or
    two reviews that leave the same issue open, mean a written method check before a third
    try. A change `critic-plan --paths` classes as deep gets a 5-to-10-minute paper
    preflight (`docs/plans/<track>-review.md`) before it is built. When Bailey reacts to
    options, record liked / disliked / must remain / must change / undecided in the
    tile's `reaction`, and keep your own guesses under `inferred`: ask before building one.

## Shared working tree

One tree, often several agents at once; ownership is by folder and NOW.md says who
is active.

- Never `git checkout -- <file>`, `git restore`, `git reset`, `git stash` or `git clean`,
  and never `git add -A` / `git commit -a`. Stage only the paths you changed.
- If your task needs a file that is already modified, read its `docs/handoff/` note
  and continue that work; do not start it over.
- `tools/zz-*.tmp.*` and the root `.*-tmp.mjs` files are agent scratch. Leave them.
- `npm run build` rewrites the shared `dist/`. If another agent may be running e2e or
  screenshots against the preview, verify with `tsc` + targeted vitest instead.
- Commit subjects say what changed and why, in the style of `git log`.

## Done means

`npx tsc --noEmit` is clean; the vitest files for what you touched pass (full
`npm test` before any push); a UI change has a real-input check in a browser and a
screenshot under `docs/screenshots/`; NOW.md is updated. Bailey likes screenshots
and a short progress fact with each milestone.

## Release (the owner's standing rule)

**Critic policy v2 (Bailey, 2026-09-20; `critic/RUBRIC.md`): every deployed build is
evaluated, and the depth of the review follows what changed.** Green tree → push `main`
→ `node tools/critic-plan.mjs` says which review the change needs → review the
production candidate (focused for a local change; a **deep review before going public**
when a shared system changed: combat core, presenter, save schema, asset loader, global
layout, audio routing, a new chapter) → `npm run deploy` → **live verification of the
exact artifact** → tell Bailey (URL, main sha, what changed, what to try, the usage
readings) → any deep review still owed. Three separate verdicts: deployment, changed
area, milestone. The finished milestone needs the single weighted score at 9.60
unrounded, every category at least 9.0, and every gate (evidence complete, no critical
or major defect, every encounter through its real flow, every required target in
`docs/target/targets.json` matched, the exact artifact verified live). An old score never
certifies a new build; rounds 02 and 03 are rubric v1 history.

- `npm run deploy` builds locally (the art is only on this disk), force-pushes a
  one-commit `gh-pages`, kicks the Pages build, appends to `docs/deploys.log`. It also
  hashes and decode-checks every shipped file (`artifact-manifest.json`), refuses a
  shared-system change that has no passing deep report for that commit, compares the live
  files with the build byte for byte, and leaves `critic/pending/<sha>.json` listing the
  separate obligations that build owes (`live`, `focused`, `deep`, `milestone`). Only
  `node tools/critic-clear.mjs --report <file>` settles one: a focused pass never settles
  a deep review, UNVERIFIED settles nothing, and a deep review a replaced build still
  owed moves to the new build. The GitHub Actions workflow is manual-only; ignore it.
- While other agents are active, cut releases from the clean worktree
  `D:\pyrefly-release`, never from this tree.
- The reviews are Claude Code workflows in `critic/runner/` (`release.js` runs the whole
  sequence; `focused.js`, `live.js`, `deep.js`). **If you cannot run the review the plan
  asks for, do not deploy:** commit, push `main` if green, and write "deploy + review
  owed" in NOW.md. Honour Bailey's pause instructions and check the usage allowance first.
- Bailey alone can override the "no passing deep report" deploy refusal, by passing
  `--owner-override="<Bailey's own words>"` to `tools/deploy-pages.mjs` (or `ownerOverride`
  to `critic/runner/release.js`); it never settles a review obligation, and the next
  candidate still owes the open changed-area issues (`critic/RUBRIC.md` section 10).

## End of every session

Update [docs/handoff/NOW.md](docs/handoff/NOW.md) using the template at the bottom of
that file. If you finished a track, write or update `docs/handoff/<track>.md`.
