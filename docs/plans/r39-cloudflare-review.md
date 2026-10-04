# Cloudflare hosting path (r39-cloudflare): paper preflight (AGENTS.md rule 15)

Track `r39-cloudflare`, branch from `origin/main` f3389dfc, 2026-10-04. Bailey: "I'm ready for
hosting beyond GitHub Pages' 1 GB file limit past the next few releases. Where should I host."
He chose Cloudflare (D-369: "Cloudflare pages + r2"), said "yes you can download anything you
want" (D-370), and "I need super high resolution now." The project and address are named after
the new title, `echoes-of-spira` (D-368, D-369). The live build (release 37.1) is 1716 files and
761.3 MiB against the 800 MB rule (D-332) and GitHub's 1 GB.

`node tools/critic-plan.mjs --paths ...` classes this change **deep**, for one reason: it edits
`package.json` and `package-lock.json` ("build configuration and dependencies is a shared
system"). Focused review before any deploy, live verification and the deep review after. This
note is the paper preflight rule 15 asks for. Nothing in `critic/policy.json` was changed to
soften that; wrangler is a devDependency and never reaches the bundle, but the planner cannot know.

## Game case (rule 14)

**Both games, and no game.** Delivery tooling: no gameplay, text, art or audio changes, so FFX
chapters 1 to 3 and FFX-2 chapters 4 and 5 (and every later chapter) are identical. The shipped
files are byte-identical on either host except `index.html` and `assets/*`, which carry the
base path (`/pyrefly-reprise/` on GitHub Pages, `/` on Cloudflare).

## What changes for the default path

Nothing a player or a release can see. GitHub Pages stays the default host (pinned by a test);
a production deploy goes only to the default host, so a Cloudflare production deploy is refused
until Bailey says switch. The one edit inside the GitHub path is a verbatim move of the record
steps (log line, stored manifest, critic marker, ledger, banner) into `recordDeploy()`, called by
both hosts; the diff shows three intended swaps (a `host=` field, the live address as a
parameter, the marker's address) and nothing else.

## Architecture

Layering untouched: no `src/` file changes. New: `tools/deploy-host.mjs` (hosts, flags, base and
upload rules), `tools/deploy-wrangler.mjs` (wrangler's arguments, environment and output, pure),
`tools/deploy-cloudflare.mjs` (login check, upload gate, publish and verify for both kinds, every
side effect injected), `tools/cloudflare/wrangler.jsonc` (an assets-only Worker). Edited:
`deploy-pages.mjs` (`--host`, `--kind`, `--preview`, `--create-project`, `--full-verify`),
`package.json` and the lockfile (wrangler 4.147.0, exact), `.gitignore` (`.wrangler/`), `docs/DEV.md`.
Two Cloudflare kinds are built: **workers** (the default: Cloudflare's own Pages overview now tells
new projects to start on Workers) and **pages** (the host D-369 names). One setting picks between them.

## Risks and how each is checked

1. **The GitHub deploy regresses**, the path every release uses. Checked by the diff above, a
   dry run of the default host, the 262 existing tests in the nine deploy and critic test files, the
   full unit suite, and a test that `formatDeployLogLine` without a host is byte-identical. A real
   GitHub deploy was not run (it publishes); the publishing steps themselves are untouched.
2. **Wrong base on Cloudflare** serves a blank page. `BASE_PATH=/` is set through Node's spawn
   environment, and a gate (`checkBuildBase`) reads the built `index.html`. Proved the hard way:
   a build started from Git Bash with `BASE_PATH=/` on the command line was rewritten by MSYS to
   `/Program Files/Git/`; the gate flags exactly that, and the deploy script is immune.
3. **wrangler uploads `.git`** (Workers only; the Pages walker skips it). Proved with a 26 MiB
   file hidden in a `.git` folder. The throwaway `dist-release/.git` is removed and the upload set
   must equal the artifact manifest, or the deploy stops.
4. **A preview mistaken for the live build.** `critic-plan` and `critic-status` read the last
   `status=ok` line of `docs/deploys.log`, and the review briefs say "the last line". Previews go
   to `docs/preview-deploys.log` with `status=preview`; a test feeds a preview line to
   `lastDeployedSha`.
5. **Credentials, accounts, prompts.** No code path logs in, creates an account, reads a token, or
   passes wrangler's `--temporary` (a throwaway account). A missing login stops the deploy before
   wrangler is asked to deploy; email and account ids are never printed (tested). wrangler is
   spawned with stdin closed, so it is never interactive: no project prompt, no workers.dev prompt,
   and no "install Cloudflare skills for your coding agents" prompt, which would write into an
   agent's configuration (read in its source: it runs only on an interactive terminal or `--install-skills`).
6. **wrangler's agent conversion.** Read from its 4.147.0 source: when it detects an AI coding agent
   (`CLAUDECODE` is one) and the Pages project is new, `pages deploy` and `pages project create` become
   a Workers deploy of the current directory. The Pages kind passes `--branch` and the commit flags (which
   disable it for `pages deploy`) and the hidden `--force` on `project create`; all three are pinned by
   tests and the project is created only with `--create-project`.
7. **The shared tree.** The worktree's `node_modules` is a junction into the main tree. A lock-only
   npm run was used to avoid installing through it, and still rewrote the shared hidden lockfile
   with the wrangler tree; repaired (see the handoff). After the merge: `npm install` once in the
   main tree, never `npm ci`; or `PYREFLY_WRANGLER_BIN` points at any copy of wrangler.
8. **The 25 MiB per-file limit** against "super high resolution": gated before every upload; the
   handoff gives the megapixel arithmetic.
9. **What cannot be verified without a real upload**: the upload itself, first-time workers.dev
   registration, and the exact `targets` and `alias` of a real deploy entry (read from wrangler's
   source, not seen). A preview comes first for exactly that reason.

## Checks done

`npx tsc --noEmit` clean; 80 new tests, mutation-checked (seventeen deliberate breaks, each caught);
the full unit suite green (773 files, 11,386 tests) with the nine related existing files (262 tests)
among them; `node tools/orphans.mjs` unchanged; dry runs of both hosts; rehearsals on the real build
for both kinds, with wrangler's own `--dry-run` and a byte-for-byte check against a local root-served
copy. Results are in `docs/handoff/r39-cloudflare.md`.
