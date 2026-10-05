# r39-cloudflare: the Cloudflare hosting path

> **Update 2026-10-04: the switch was prepared on branch `cf-switch`; read [cf-switch.md](cf-switch.md).** Cloudflare is the default
> host, https://echoesofspira.com/ is the live address (a Workers Custom Domain), GitHub Pages is a legacy host with a "we've moved"
> note, wrangler 4.147.0 is found without `PYREFLY_WRANGLER_BIN`, and the preview Worker has its own config. Section 6 below is
> that switch checklist, done there; this file stays as the groundwork and the evidence.

Prepared 2026-10-04 by a Sonnet sub-agent for the driver. Game case: **both** (delivery tooling,
no gameplay, no game text; why: `docs/plans/r39-cloudflare-review.md`).

**Status: built, tested, rehearsed on the real build for both Cloudflare kinds, pushed on branch
`r39-cloudflare`; not merged; nothing deployed anywhere.** This work never touched the Cloudflare
account, the login or any token. Per D-369 Bailey has already created the account and completed
`wrangler login` on this PC. GitHub Pages stays the default host until Bailey says switch.

Bailey, 2026-10-04: "I'm ready for hosting beyond GitHub Pages' 1 GB file limit past the next few
releases. Where should I host." He chose "Cloudflare pages + r2" (D-369), allowed downloads (D-370),
said "I need super high resolution now," and renamed the game Echoes of Spira (D-368): the project
and address are named `echoes-of-spira`. The live build (release 37.1, main f4244e1f) is 1716 files,
761.3 MiB, at the 800 MB line of D-332.

## 1. Which Cloudflare product: Workers static assets is prepared as the default, Pages is built too

The brief said: if Cloudflare now steers new static sites to Workers, prepare that path instead and
say why. It does (all read 2026-10-04):

| What | Where | Updated |
|---|---|---|
| The Pages overview tells readers to start new projects on Workers, "Cloudflare's primary platform for building applications" | https://developers.cloudflare.com/pages/ | 2026-08-25 |
| Pages versus Workers static assets, feature by feature: preview deployments both; branch aliases Pages only ("coming soon" on Workers); 404 and single-page fallback automatic on Pages, configured on Workers; `_headers`, `_redirects`, custom domains, rollbacks both | https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/ | 2026-09-22 |
| Direct upload to Pages is still documented, with no Workers recommendation on that page | https://developers.cloudflare.com/pages/get-started/direct-upload/ | 2026-04-21 |
| In the pinned wrangler's own source (`wrangler-dist/cli.js`, read, not run as an agent): when it detects an AI coding agent (`CLAUDECODE` is one of the variables) and the Pages project is new, `pages deploy` and `pages project create` become a **Workers deploy of the current directory**, unless `--branch` or the commit flags are passed (deploy) or the hidden `--force` (create) | `maybeDelegatePagesToWorkers`, `getUnsupportedDeployDelegateArgs` | wrangler 4.147.0 |

Because D-369 names Pages and Bailey has already logged in, **both kinds are built behind one setting**
(`HOSTS.cloudflare.kind` in `tools/deploy-host.mjs`, or `--kind=workers|pages` for one run):

| | **workers** (the default) | **pages** (D-369's wording) |
|---|---|---|
| Address | `https://echoes-of-spira.<name>.workers.dev/`; `<name>` is the workers.dev name registered once per account in the dashboard (not known to be done) | `https://echoes-of-spira.pages.dev/` if the name is free; wrangler reports the real one |
| Preview | a second Worker, `echoes-of-spira-preview` | the `preview` branch of the same project, `https://preview.echoes-of-spira.pages.dev/` |
| First run | the first deploy creates the Worker; needs the workers.dev name | `--create-project` creates the project (with the hidden `--force`) |
| wrangler's local check | `deploy --dry-run` runs first | none exists; our own upload gate runs |
| Cloudflare's stance | the primary platform, where new projects are told to start | supported, documented, same limits; agent-run new deploys get converted (guarded) |
| Moving later | a custom domain can be pointed at either | the `pages.dev` address belongs to the Pages project; a Workers deploy answers at a `workers.dev` one |

**Recommendation: workers.** The address is permanent (saved games live under it), and the two
products answer at different hostnames, so the only way to keep one address across a later change of
product is a custom domain. Pages is the shorter name and matches Bailey's words, and it is safe to
use; it only means a later move to Workers would change the address unless he buys a domain first.
The driver decides with Bailey.

## 2. What was downloaded (D-370; nothing else was downloaded)

| | |
|---|---|
| Package | `wrangler`, Cloudflare's official CLI, from npmjs.com (registry.npmjs.org), licence MIT OR Apache-2.0, repository github.com/cloudflare/workers-sdk |
| Version | **4.147.0**, pinned exactly in `package.json` (`devDependencies`) and recorded in `package-lock.json`; the same version the driver fetched for the login (D-369) |
| Tarball | https://registry.npmjs.org/wrangler/-/wrangler-4.147.0.tgz, 2.66 MiB (15.5 MB unpacked), integrity `sha512-pQYRoiq8PTAxphaG69z8+GC1DkSGd19EDZehQ8zxjo/Ko3mRB6Qs1mTrd8ZuKAarLklIjTqr1lUdCK9r4q2hUg==` (a test pins the version, the source URL and an `sha512` field against the lockfile) |
| With its dependencies | 37 packages for Windows x64, **59.3 MiB** of tarballs, **183 MiB** unpacked (miniflare 5.20261001.0-alpha 5.07 MiB, workerd 1.20261001.1 32.89 MiB, esbuild 0.28.1 4.59 MiB, sharp's Windows binary 8.10 MiB). The lockfile gains 55 entries, all additive; no existing entry changed |
| Needs | Node 22 or newer (this machine has 24.12; the repo's `engines` still says `>=20.19`, untouched) |
| Where it landed | **Not in the shared tree.** A probe copy sits in `D:\Tools\pyrefly-scratch\2026-10-04\cloudflare\wrangler-probe` (and an npm cache beside it, on D:) for measuring and for the rehearsals |
| Never done | `wrangler login`, any token, any account, wrangler's `--temporary` mode (it creates a throwaway account) |

**Why the lockfile was written without installing, and what it broke.** `D:\pyrefly-aeonhp-check`
has `node_modules` as a junction into the shared `D:\Final Fantasy\node_modules`, and a plain
`npm install` through it would rewrite the shared tree. So `npm install --save-dev --save-exact
wrangler@4.147.0 --package-lock-only --ignore-scripts` was used. It still rewrote npm's hidden
lockfile in the shared tree (`node_modules/.package-lock.json`), listing 26 wrangler packages that
are not installed there. Repaired the same hour: the 26 phantom entries removed (97 remain, each
matching a directory on disk), the original modification time (2026-09-26 17:45:54) put back so npm
distrusts the file exactly as before (arborist rejects a hidden lockfile older than any package
directory), nothing else touched (82 top-level entries, 33 bin entries, no `wrangler` directory,
all unchanged). The file is 51,516 bytes where it was 52,970 (field formatting that could not be
recovered); npm rewrites it on the next real install. The polluted copy is kept in the scratch
folder. **Rule to remember: through a worktree junction even `--package-lock-only` writes the shared
hidden lockfile.** Run npm for such a change only on a copy of `package.json` and `package-lock.json`
in a folder with no `node_modules`.

## 3. What was built

| File | What |
|---|---|
| `tools/deploy-host.mjs` (+ `.d.mts`) | Where and what: the hosts, `DEFAULT_HOST`, the flags, the build base per host and `checkBuildBase`, the upload set per kind and its limits, the preview log line |
| `tools/deploy-wrangler.mjs` (+ `.d.mts`) | How wrangler is asked and read: argument lists for a Workers deploy, a Pages deploy and a Pages project, its environment and closed stdin, where its binary lives (`PYREFLY_WRANGLER_BIN`), its output file, `whoami` |
| `tools/deploy-cloudflare.mjs` (+ `.d.mts`) | The login check, the gate on what would be uploaded, publish and verify for both kinds; every side effect injected, so tests need no network |
| `tools/cloudflare/wrangler.jsonc` | An assets-only Worker named `echoes-of-spira`, serving `../../dist-release` |
| `tools/deploy-pages.mjs` | `--host`, `--kind`, `--preview`, `--create-project`, `--full-verify`; the record steps became `recordDeploy()` (a verbatim move, called by both hosts) |
| `package.json`, `package-lock.json`, `.gitignore`, `docs/DEV.md` | wrangler 4.147.0; `.wrangler/` ignored (an untracked one would count as a build-relevant dirty path and stop the next deploy); the flags documented |
| `tests/unit/deploy-host.test.ts`, `deploy-wrangler.test.ts`, `deploy-cloudflare.test.ts` | 80 tests, no network, mutation-checked |
| `docs/plans/r39-cloudflare-review.md` | The paper preflight (the change is classed deep by path) |
| `docs/screenshots/r39-cloudflare/` | The game rendered from the root-served build (section 9) |

**Every existing gate runs for both hosts**: tsc and vitest (unless `--skip-tests`), audio QA, the
dirty-tree check, the unshipped-file and source-map checks, the `public/fx` check, the manifest with
its decode and flat-image checks, the critic plan, the release gate with its owner override, and the
byte-for-byte live verification. Added for Cloudflare only:

1. **The login first**: `wrangler whoami --json` exits non-zero without a login, before the
   preflight and the build. A missing login stops the deploy; wrangler is never asked to deploy and
   never reaches its offer of a throwaway `--temporary` account. The email and account ids in the
   answer are never printed.
2. **`BASE_PATH=/`** for the build (Cloudflare serves from the root), set through Node's
   environment, and **`checkBuildBase`** on the built `index.html`: it must load `/assets/index-*.js`,
   every root-relative address must start with the base, and no GitHub base may remain.
3. **No `.nojekyll`** (a GitHub marker).
4. **The upload gate** on the finished `dist-release`: the throwaway `dist-release/.git` is removed
   (a Workers upload would send it, proved with a 26 MiB file hidden in a `.git` folder), then the
   files wrangler would send for the kind must fit the limits and **equal the artifact manifest
   exactly**; `_headers`, `_redirects` and the other root config files are refused (Cloudflare reads
   them instead of serving them, so the live byte check could never match).
5. **wrangler's own local check**, `deploy --dry-run` (Workers only), before the real deploy.
6. **wrangler is spawned with stdin closed**, so it is never interactive: no project prompt, no
   workers.dev prompt, and no offer to "install Cloudflare skills" into the coding agents it finds (a
   write to an agent's configuration, which it would otherwise ask on an interactive terminal).
7. **Verification against the address wrangler reports** (read from its output file; Pages gives the
   exact deployment first and its alias last): the bundle name, then the byte-for-byte check. A
   preview compares **every** file; production keeps the sampled check unless `--full-verify`.

**Rules that keep the records honest.** A production deploy goes **only to the default host**
(`--host=cloudflare` without `--preview` is refused until `DEFAULT_HOST` is switched; a dry run only
prints the refusal), because `critic-plan` and `critic-status` read the last `status=ok` line of
`docs/deploys.log` as "the live build", and the review briefs tell agents to read its last line. A
preview is logged in **`docs/preview-deploys.log`** with `status=preview` (and `override=owner` when
Bailey's words let it out) and records no marker, no ledger entry and no artifact. `docs/deploys.log`
lines gain a last field `host=github|cloudflare`. **A preview obeys the same release gate as any
deploy** (a validated focused or deep report for the commit, or Bailey's own words as the owner
override). Exempting previews would be a policy change; it needs Bailey's yes and was not made.

## 4. Limits (read from Cloudflare's documentation on 2026-10-04, proved with wrangler 4.147.0)

| Limit | Value | Source (page updated) | Our build (release 37.1) |
|---|---|---|---|
| Files per deployment | 20,000 on the free plan; 100,000 on paid plans (wrangler 4.34.0 or newer for more than 20,000); the same for Workers static assets and Pages | https://developers.cloudflare.com/workers/platform/limits/ (2026-09-05) and https://developers.cloudflare.com/pages/platform/limits/ (2026-09-05) | 1,716 files, 8.6% of the free limit |
| One file | 25 MiB = 26,214,400 bytes. Exactly 25 MiB passes; one byte more fails ("Asset too large", tested with the dry run) | same two pages | largest 8.73 MiB (`art/characters/yunalesca-2/idle@2x.png`) |
| Total size | **no total-size limit is stated** on either page | same | 761.3 MiB |

**"Super high resolution" against 25 MiB.** The painted PNGs cost about 1.3 to 1.4 MiB per megapixel
here (2688x1536 backdrops: 5.3 to 5.8 MiB; the 2464x2752 Yunalesca idle with alpha: 8.73 MiB), so
25 MiB is about 18 megapixels per PNG: 4K (3840x2160) is about 11 MiB and fits; 5K (5120x2880) is
about 20 MiB and fits; a 4096x4096 character with alpha is about 23 MiB and barely fits; 6K
(6144x3456) is about 29 MiB and 8K about 45 MiB, which do not. The count and total are not the
problem. Of the 761.3 MiB, the 59 backdrops are 119 MiB and the 1194 character files 443 MiB: 4K
backdrops alone would bring the site to about 881 MiB, with the characters doubled too about 1.3 GB,
and doubling the pixels of all the art about 1.4 GB. GitHub's 1 GB forbids the last two and Cloudflare
does not limit them. Pictures that do not fit one file need lossy WebP or AVIF
(the build already ships 32 WebP files), tiling, or R2 for the few biggest (D-369). The upload gate
stops a build with such a file, naming it, before anything is sent.

## 5. Bailey's two steps, and the driver's commands

**Bailey's two steps are already done** (D-369: the account was created and `wrangler login` completed on
this PC by about 00:10 EDT). Kept for the record, and for a second machine or an expired login:
1. Create the account at https://dash.cloudflare.com/sign-up (free plan). For the **workers** kind
   open Workers & Pages once and choose the **workers.dev name** when it asks; it becomes part of the
   permanent address. The **pages** kind needs nothing more.
2. Run `npx wrangler login` in `D:\Final Fantasy` and approve it in the browser.
The script never logs in, and agents never create an account or enter credentials.

**Before the first run (the driver):** merge this branch after the review it needs (deep by path), then
`npm install` once in `D:\Final Fantasy` (about 50 MiB to fetch, 170 MiB on disk; **never `npm ci`**;
check that `node_modules\wrangler\bin\wrangler.js` exists). The release worktrees share that
`node_modules` through a junction. Or skip the install: `PYREFLY_WRANGLER_BIN=<path to a wrangler.js>`
names any copy (the scratch probe at `D:\Tools\pyrefly-scratch\2026-10-04\cloudflare\wrangler-probe\node_modules\wrangler\bin\wrangler.js`
works while it exists; the folder is scratch, so do not count on it). The login is wrangler's own and
is shared by every copy.

**The driver's single command for a preview** (from a clean release worktree at a commit that has its
review; add `--skip-tests` only when the gates were already green there, as for a GitHub release):

```
node tools/deploy-pages.mjs --host=cloudflare --preview --message="Cloudflare preview"
```

for the **pages** kind (the first time it also creates the project):

```
node tools/deploy-pages.mjs --host=cloudflare --kind=pages --preview --create-project --message="Cloudflare preview"
```

Either checks the login, builds with `BASE_PATH=/`, runs every gate, deploys the preview, prints its
address, compares every file byte for byte, and logs one line in `docs/preview-deploys.log`. It touches
no critic record and no production address. Rehearse without a build or an account:
`node tools/deploy-pages.mjs --host=cloudflare --preview --dry-run --allow-dirty` prints the plan, the
release gate's answer and whether wrangler is found. Then judge the preview with a real-input smoke in
headless Playwright (never the user's Chrome); `critic/runner/live.js` carries the GitHub address in a
constant, so give it the preview address by hand or edit that line for the run. Delete a preview when
done: `npx wrangler delete echoes-of-spira-preview` (Workers; add `--dry-run` first to see what it
would do), or remove the deployment in the dashboard (Pages); Bailey's or the driver's call.

## 6. The switch (when Bailey says go): one commit, then the first production deploy

1. **Choose the permanent address first** (section 7: saved games are tied to it); a custom domain
   costs money, so ask. Then choose the kind (section 1).
2. **Run the preview** and look at it. Only then switch.
3. **The switch commit:** `DEFAULT_HOST = 'cloudflare'` (and `kind`, if it is `pages`) in
   `tools/deploy-host.mjs`, the production address in `HOSTS.cloudflare.liveUrl`, and the tripwire test
   `the default host` in `tests/unit/deploy-host.test.ts` changed in the same commit (that failing
   test is deliberate). Names that still say the GitHub address and want the new one (found by search):
   `critic/runner/live.js` line 8 and `critic/runner/deep.js` line 8 (`const LIVE`),
   `critic/runner/release.js` line 15, `learn/atlas/main.ts` line 20, `learn/exploded/main.ts` and
   `learn/studio/main.ts` line 32 (`FIGHT_URL`), `tools/audio/music-overlap-probe.mjs` line 19,
   `tools/audio/sfx-probe.mjs` line 17, `tools/pace-measure.mjs` line 13 (a comment), `README.md`,
   `AGENTS.md` (the "Live:" line and the Release section), `docs/handoff/NOW.md`. **Decide separately**
   whether `vite.config.ts`'s default `PROD_BASE` (`/pyrefly-reprise/`, also read by
   `playwright.config.ts`, `tools/screenshot.mjs`, three e2e specs and several tools) should become `/`,
   so local previews match production again; if it does, `hostBuildEnv` must then give GitHub its own base.
4. **The first production deploy** is `npm run deploy` (now the Cloudflare default) from the release
   worktree, with the usual gates, the review it needs, live verification, `critic-clear` and the copy
   of the records into main. The driver runs it (sub-agents refuse relayed consent).
5. **Publish the moved page** on the old address (section 7), then update the docs and the memory
   notes that name the GitHub address.

## 7. Keeping the old GitHub address alive: a "we've moved" page (a plan; nothing is published)

GitHub Pages serves the `gh-pages` branch of `BaileyPillon/pyrefly-reprise`. After the switch, replace
it with a two-file site, which also frees the 761 MiB artifact and makes the 1 GB limit moot.

**Saved games.** The game keeps them in the browser's `localStorage` under the address players used:
`pyrefly-reprise:save:v1`, `pyrefly-reprise:experiments:v1`, `pyrefly.board.lastChapter` and the coach
state (the keys keep "pyrefly" after the rename, D-368). **A new address starts with an empty save**, and
a later change of address would strand them again, which is why section 6 chooses the address first.
Options, each needing Bailey's yes (a new feature; touching saves is the save-data class that needs a
deep review before it goes public):

- **S0, nothing:** the page says saved games stay on the old address. Fine for Bailey and a few friends.
- **S1, a file:** the page offers a download of the old address's keys, and the game gets an import
  screen (new UI, so a mockup first, rule 9).
- **S2, no file:** the page hands the keys to a static `import.html` on the new address with
  `postMessage`; that page checks the origin and the save version, writes the keys and redirects. No
  game screen. Recommended only if Bailey wants existing saves carried.

**The page** (two copies of one file, `index.html` and `404.html`, so a deep link such as
`/pyrefly-reprise/art/x.png` lands on it, plus an empty `.nojekyll`). No external requests. It redirects
after four seconds only when no saved game exists on the old address; with one it stays and says what
happened. Replace `__NEW_URL__`:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Echoes of Spira has moved</title>
<link rel="canonical" href="__NEW_URL__">
<meta name="robots" content="noindex">
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0d0b09; color: #e9dfc7; font: 18px/1.5 Georgia, serif; }
  main { max-width: 34rem; padding: 2rem 1.25rem; text-align: center; }
  a.go { display: inline-block; margin: 1rem 0; padding: .6rem 1.4rem; border: 1px solid #c9a24b; color: #f3d98b; text-decoration: none; }
  small { color: #a89a78; }
</style>
</head>
<body>
<main>
  <h1>Echoes of Spira has moved</h1>
  <p>This game, once called Pyrefly Reprise, now lives at a new address.</p>
  <p><a class="go" id="go" href="__NEW_URL__">Play at the new address</a></p>
  <p id="saves" hidden><small>Saved games stay in the browser they were made in, under this old address, so the new address starts fresh. [the S0, S1 or S2 sentence goes here]</small></p>
</main>
<script>
  (function () {
    var target = '__NEW_URL__' + location.search + location.hash;
    document.getElementById('go').href = target;
    var hasSave = false;
    try { hasSave = localStorage.getItem('pyrefly-reprise:save:v1') !== null; } catch (e) {}
    if (hasSave) document.getElementById('saves').hidden = false;
    else setTimeout(function () { location.replace(target); }, 4000);
  })();
</script>
</body>
</html>
```

**Publishing it** is the tail of the GitHub deploy without the build, run by the driver: in a fresh
folder on D: put the three files, `git init -b gh-pages`, set Bailey's identity as `deploy-pages.mjs`
does, commit, `git push -f https://github.com/BaileyPillon/pyrefly-reprise.git gh-pages:gh-pages`,
`gh api -X POST repos/BaileyPillon/pyrefly-reprise/pages/builds`, poll
`repos/BaileyPillon/pyrefly-reprise/pages/builds?per_page=10` until a build for that commit says
`built`, then fetch the old address and a deep link and read the page. **How long to keep it** is
Bailey's call; it costs nothing, and friends' bookmarks are the reason.

## 8. Decisions that are not mine

1. **workers (recommended and prepared) or pages (D-369's wording)?** Section 1.
2. **The permanent address:** the workers.dev or pages.dev name, or a custom domain (money).
3. **Saved games across the move:** S0, S1 or S2.
4. **Previews and the release gate.** They obey it today. Exempting them is a policy change.
5. **The 800 MB rule (D-332)** can be retired or raised once Cloudflare is live; the 25 MiB per-file
   limit stays.
6. **How long the moved page stays up.**

## 9. Verification record (2026-10-04)

- `npx tsc --noEmit`: clean. `node tools/orphans.mjs`: output identical to before (24 orphans, all old;
  the scan starts at `src/main.ts`, and the new modules are imported by `deploy-pages.mjs`).
- 80 new tests, no network. Mutation check: seventeen deliberate breaks (the 25 MiB edge, the address
  filter, `.git` removal, wrangler's dry run, telemetry, production to any host, the preview line's
  status, the base check, the hidden `--force`, the `--branch` guard, the open stdin, project creation
  without consent, the wrangler-path override, the Pages walker's `.git`, the Pages alias, the exit
  status of `whoami`, root config files), each made 1 to 4 tests fail, each restored byte for byte, final
  run 80 of 80. One break survived the first pass (nothing pinned that a failing `whoami` exit beats its
  body); an assertion now does. The 9 existing related files (262 tests: critic policy, pending
  markers, release rules, owner override, artifact manifest, dist filter, pages outcome, dirty
  classification) pass, and so does the **full unit suite on the committed content** (773 files
  passed, 5 skipped; 11,386 tests passed, 41 skipped, 1 todo; `public/art` present through the junction).
- Dry runs of `deploy-pages.mjs`: the default host (unchanged output plus one `host:` line), and
  `--host=cloudflare` with and without `--preview` (the second prints "a real run would refuse"). Real
  runs of the early-failure paths: bad host, preview on GitHub, bare `--host`, `--preview=yes`, production
  on Cloudflare, and a Cloudflare preview with no wrangler installed (stops at the login check with the
  install instruction).
- **Rehearsals on the real build**, with only the uploads (and, for Pages, the project list) replaced. A
  real `vite build` with `BASE_PATH=/` (766 MiB, 1715 files; the page loads `/assets/index-DO0aRvVB.js`)
  passed `checkBuildBase`; its manifest (1715 files, 761.3 MiB, identical in size and count to release
  37.1; the two flat-colour images are the allow-listed Paine eye masks) and the upload gate for **both
  kinds**, with a planted `dist-release/.git` holding a 26 MiB pack, which the gate removed (1716 files,
  761.6 MiB, largest 8.73 MiB). wrangler's own `deploy --dry-run` (the pinned 4.147.0, selected by
  `PYREFLY_WRANGLER_BIN`, on the real `tools/cloudflare/wrangler.jsonc` and the real build) exited 0.
  The byte-for-byte check over HTTP against a local server serving the build from the **root**,
  redirecting `/index.html` to `/` as Workers assets do: Workers, every file, **1715 of 1715** passed;
  Pages, the sampled check, **46 of 46** passed on both the deployment address and the alias
  (`127.0.0.1` and `localhost`). 1816 requests, **0 not found**.
- The game, rendered from that root-served build in headless Chromium (software WebGL), with no console
  error: `docs/screenshots/r39-cloudflare/title.png` (painted key art, the title card, the UI fonts) and
  `chapter-select.png` (all 18 chapters, painted portraits and chapter art) and `scene-gagazet.png` (the
  painted Mt. Gagazet backdrop with the three party sprites and the boss). The scene's first attempt
  timed out inside Chromium's software screenshot while the machine was loaded by other agents' browsers
  (every request had answered 200); the retry on a quieter machine passed, 90 requests, none missing.
- A first rehearsal build started from Git Bash with `BASE_PATH=/` typed on the command line came out
  with `/Program Files/Git/` as its base (MSYS rewrote the value); `checkBuildBase` flags exactly that.
  The deploy script sets the variable through Node and is not affected; by hand use
  `MSYS_NO_PATHCONV=1` or PowerShell. A first screenshot attempt also failed because the harness
  blocked its own local server with a synchronous child process; fixed in the rehearsal script, no
  product change.
- This worktree (`D:\pyrefly-aeonhp-check`) carries a stray `public/art.broken-junction` entry that
  breaks Vite's copy of `public/`, so the rehearsals used a scratch config (`.r39cf-vite-tmp.config.mjs`,
  untracked) pointing `publicDir` at the main tree's healthy `public/`. Not committed.

## 10. Not done, on purpose

No deploy of any kind, no account, no login, no token; `tools/deploy-pages.mjs` was never run for real
(only the paths above that stop before doing anything, and dry runs). The branch is not merged,
`origin/main` moved to 77f0d157 (docs only) after the branch was cut, and `docs/handoff/NOW.md` was not
touched. **R2** (D-369: single files over 25 MiB) is not prepared: it needs a bucket, a public address
(a custom domain or r2.dev), CORS for the game's origin and base-URL handling in the asset loader; until
then the upload gate names an oversize file and stops. Also described, not built: `_headers` (long
caching for the hashed `/assets/*` and `X-Robots-Tag: noindex` for previews would be cheap wins, but a
root `_headers` file is refused by the upload gate for now), custom domains, a save-transfer path, and
the moved page itself. The critic runner scripts and the `learn/` pages still name the GitHub address
until the switch.
