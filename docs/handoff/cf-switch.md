# cf-switch: Cloudflare is the live address (echoesofspira.com), GitHub Pages is the old one

Prepared 2026-10-04 by a Sonnet sub-agent for the driver, on branch `cf-switch` (from `origin/main` 7e069f4d, merged with
`origin/cf38-preview`, the branch whose preview Worker deployed fine). Game case: **both** (hosting; shared plumbing; no
gameplay, no game text except one title-screen line, which is the same for FFX and FFX-2). Nothing was deployed, nothing was
merged into main, no token was read, printed or moved.

Bailey, 2026-10-04: **"Yes I will go with your recommendation"**, answering the recommendation to put release 38 on echoesofspira.com
now as the production Cloudflare site:

- echoesofspira.com is the game's permanent address (Bailey bought it; it is Active in the same Cloudflare account as the Workers);
  `www` forwards to it.
- The deploy tools default to Cloudflare from now on.
- The GitHub address stays up with a "we've moved" note on its title screen, and saves there stay there (saves option **S0** of
  [r39-cloudflare.md](r39-cloudflare.md) section 7).
- Release 39 later updates echoesofspira.com in place.

Branch tip and what is in it: section 1. **The commands the driver runs: section 2. The dashboard steps for www: section 3.**

## 1. What the switch changed

| Where | What |
|---|---|
| `tools/deploy-host.mjs` | `DEFAULT_HOST = 'cloudflare'`. `HOSTS.cloudflare.liveUrl` is `https://echoesofspira.com/` (`customDomain`, `wwwHost`, and a separate `previewWranglerConfig`). `HOSTS.github` is `legacy: true`. `LIVE_URL` is the one constant every tool reads. `hostRequestRole` decides, for a host, default / legacy / refused. `hostBuildEnv` now sets BOTH bases (`BASE_PATH=/` for Cloudflare, `/pyrefly-reprise/` for GitHub), so a `BASE_PATH` left in the shell can no longer build GitHub a blank page; `deploy-pages.mjs` checks the built base for every host, not only Cloudflare. |
| `tools/cloudflare/wrangler.jsonc` | The **production** Worker `echoes-of-spira`: its only route is the Custom Domain `{ "pattern": "echoesofspira.com", "custom_domain": true }`; `workers_dev: true` stays (the backup address; without that line wrangler 4.147.0 turns workers.dev **off** as soon as `routes` exist, `getSubdomainValues`). Read by wrangler's own `unstable_readConfig`: accepted. |
| `tools/cloudflare/wrangler.preview.jsonc` (new) | The preview Worker `echoes-of-spira-preview`, **no routes**. A separate file on purpose: wrangler (no terminal) overrides an existing Custom Domain without asking, so a preview deployed from the production file would have moved echoesofspira.com onto the preview Worker. `checkWranglerConfig` refuses that mix-up before wrangler runs. |
| `tools/deploy-cloudflare.mjs` | Verifies the canonical address byte for byte **whether or not wrangler lists it** (it prints a Custom Domain as `echoesofspira.com (custom domain)`, which is not a URL), last, with ten minutes of patience for a fresh domain; records it as live. Looks at `www` and warns (never fails, never changes anything). |
| `tools/deploy-wrangler.mjs`, `tools/cloudflare/wrangler-install.json`, `.../wrangler-install/` | The pinned wrangler 4.147.0 is found with **no** environment variable (section 4). |
| `tools/deploy-pages.mjs` | `--host=github` is a **legacy** deploy: every gate, the same review evidence or Bailey's override, the same byte-for-byte check, but it records one line in `docs/legacy-deploys.log` and **no** `docs/deploys.log` line, critic marker, ledger entry or stored manifest. (The live build, for `critic-plan` and `critic-status`, stays the default host's.) |
| `src/app/screens/frontend/movedNotice.ts` (+ css, `titleMarkup.ts`) | The "we've moved" note, drawn only on host `baileypillon.github.io` (section 5). |
| Critic and tools | One literal per Workflow script (`critic/runner/live.js`, `deep.js`, `release.js`: `const LIVE = (args && args.live) \|\| '<address>'`), the probes import `LIVE_URL`, `verify-live` defaults `--url` to it, the learn pages link it, and `tests/unit/live-url-follows-host.test.ts` pins every literal to it and sweeps `tools/`, `critic/runner`, `critic/bench`, `learn/`, `src/` for the old address. `critic/RUBRIC.md`, `critic/CHECKS.md` (CHK-017), `docs/DEV.md`, `AGENTS.md`, `README.md` name the new address. Reports, markers and rounds from before 2026-10-04 keep the GitHub address as history. |

Commits (all end with the Sonnet co-author line): `bf5362b7` merge of `origin/cf38-preview`; `ac107b4c` **the switch**;
`70c944f8` critic, probes and learn pages follow the address; `cd5fabee` the note; `769fbe73` the note's screenshots and the check's
hardening; `3431d621` `verify-live` defaults to the live address and a legacy deploy's critic plan says it is for information;
`972cc5d0` merge of `origin/main` (c3c4daba the round 21 record, 105105c3 the CHANGELOG backfill: records only, no product change since
release 38); then this handoff (docs only). **Deploy from the tip of `cf-switch`**: the note rides along on the Cloudflare build,
invisible there (checked, section 6), so the later GitHub deploy is the same commit. (To keep the Cloudflare build to the code of
release 38 exactly, `70c944f8` is the same switch without the note.) The product diff against `origin/main` is the note's three files.

Decided separately, as the r39 handoff asked: **`vite.config.ts` keeps `PROD_BASE` defaulting to `/pyrefly-reprise/`.** Ten or so
consumers read it (`playwright.config.ts`, `tools/screenshot.mjs`, three e2e specs, `tools/art-play-audit.mjs` and others), the GitHub
legacy build still needs it, and Cloudflare gets `/` from an explicit `BASE_PATH`. A plain `npm run build` / `npm run preview`
therefore still makes the GitHub-base artifact; the live artifact is the same files built for the root.

## 2. The commands (cwd, environment, flags) and what each does

Both run from a **clean** worktree of this branch with `node_modules` and `public/art` junctioned to the main tree's (this one,
`D:\pyrefly-cf-switch`, is such a worktree; `public/fx` is restored by the deploy itself). Never type `BASE_PATH=/` in Git Bash
(MSYS rewrites it to `C:/Program Files/Git/`); the deploy sets the base through Node, so you never need to.

### 2.1 Before the first production run (the driver, a few minutes)

1. **DNS tab of the zone** (dashboard, Websites > echoesofspira.com > DNS > Records): there must be **no A, AAAA or CNAME record
   named `echoesofspira.com`** (the apex). Mail records (MX, TXT) are fine. Why: wrangler run without a terminal (and with its stdin
   closed, as ours always is) answers its own "replace the existing DNS record?" question with **yes** (`publishCustomDomains`:
   `override_existing_dns_record = true` when `!process.stdout.isTTY`; the interactive `confirm` also falls back to yes without a
   terminal). A fresh Cloudflare-registered zone has none.
2. The zone is **Active** (Bailey's note says it is) and in the same account the login sees. If wrangler's login sees more than one
   account it says so; then set `CLOUDFLARE_ACCOUNT_ID` for the run.
3. `git status` clean at the tip (the dry run in 2.4 says "working tree clean"); no other deploy running.

### 2.2 The production deploy, now

```
cd D:/pyrefly-cf-switch
PYREFLY_BROWSER=gpu node tools/deploy-pages.mjs --host=cloudflare --kind=workers --full-verify --skip-tests --message="Release 38 on echoesofspira.com" --owner-override="Yes I will go with your recommendation"
```

(`--host=cloudflare --kind=workers` are the defaults now; they are spelled out so the line says what it does. `--full-verify` compares
EVERY one of the 1,932 files on both addresses, as the preview run did, the first time bytes reach the new domain: about 1.5 GB of
downloads; drop it for later releases, where the default check (the page, all code, the changed files, a sample) is enough. `--skip-tests`
because tsc and the full suite were green on this branch, section 6. PowerShell: `$env:PYREFLY_BROWSER='gpu'` first. Run it where
nothing times out: a deploy is long, mostly the upload. The override words are Bailey's own, quoted; an agent never invents them.)

What it does, in order:

1. Prints the host plan and what earlier live builds still owe; reads the pinned wrangler (4.147.0, the standing install); **checks the
   Cloudflare login first** (`wrangler whoami --json`; the email and account ids are never printed); stops if there is none.
2. `tools/gen/manifest.mjs`, `tools/fx-assets.mjs ensure`, `vite build --outDir dist-release --emptyOutDir` with `BASE_PATH=/` (source
   maps kept in `D:/Tools/pyrefly-sourcemaps/<sha>`, none ship).
3. Every gate: unshipped files, source maps, art identity (every WebP equals its master's pixels), art references, the load of every
   image in WebKit and Chromium, the base check (`index.html` must load `/assets/index-*.js`), the manifest with its decode checks, the
   Cloudflare upload gate (25 MiB a file, 20,000 files, `dist-release/.git` removed, the files wrangler would send must equal the
   manifest), the critic plan and the release gate (the override turns each refusal into one loud warning, settles nothing).
4. `wrangler deploy --dry-run` (its own local check), then the real `wrangler deploy` of `echoes-of-spira` with
   `tools/cloudflare/wrangler.jsonc` (after `checkWranglerConfig` approved it). **This is the step that attaches echoesofspira.com.**
5. Verifies the workers.dev address, then **`https://echoesofspira.com/`**: the bundle name first (up to 20 tries 30 s apart, because a
   fresh Custom Domain needs its DNS record and certificate), then the page, all code, the changed files and a sample, byte for byte
   (every file, with the `--full-verify` of the command above). Then looks at `https://www.echoesofspira.com/` and **warns** until section 3 is done.
6. Records, as for any live build: a `host=cloudflare` line in `docs/deploys.log`, `critic/artifacts/<sha>.json`, a
   `critic/pending/<sha>.json` marker (`liveUrl` is `https://echoesofspira.com/`; the marker of 6461999e is superseded, its deep review
   carried to the new build), `critic/ledger.json`.

If it stops after step 4 (for instance the Custom Domain is late), the Worker is already live on workers.dev. Fix the cause and run the
same command again: wrangler skips the files Cloudflare already holds. To look without redeploying:
`node tools/artifact-manifest.mjs verify-live --manifest dist-release/artifact-manifest.json --full` (the address defaults to the live one;
`ipconfig /flushdns` first if this PC looked the name up before it was attached).

After it (the usual release record, as in the deploy procedure): copy the new `docs/deploys.log` line, `critic/ledger.json`,
`critic/artifacts/<sha>.json`, `critic/cleared/`, `critic/pending/` into main, `git rm` the superseded marker, commit, push main; merge
`cf-switch` into main (it is `origin/main` plus these commits, so a fast-forward unless main moved); add the CHANGELOG entry (2.5).
To look at the live address with real input (and prove the old-address note is not there):
`PYREFLY_BROWSER=gpu node tools/moved-notice-check.mjs --url=https://echoesofspira.com/ --expect=hidden --out=docs/screenshots/cf-switch/live`
(8 checks; the live critic review, `critic/runner/live.js`, now aims at this address by default).

### 2.3 The GitHub "we've moved" deploy, later (round 21 is finished: it is recorded on main as c3c4daba)

```
cd D:/pyrefly-cf-switch            (the same tip, or a clean worktree at the same commit)
PYREFLY_BROWSER=gpu node tools/deploy-pages.mjs --host=github --skip-tests --message="Old address: we've moved note" --owner-override="<Bailey's own words for this deploy>"
```

Needs the `gh` CLI at `D:/Tools/GitHubCLI/gh.exe`, logged in for `BaileyPillon/pyrefly-reprise`, and Bailey's words again (or a
validated focused or deep report for that commit): the release gate applies to a legacy deploy as to any other. It builds with
`BASE_PATH=/pyrefly-reprise/` (explicit, and the base is checked), force-pushes a throwaway single-commit `gh-pages`, kicks the Pages
build and polls every build for that commit, compares the live files byte for byte, and records **one line in
`docs/legacy-deploys.log`** (copy that line into main; there are no critic files to copy). Round 21 has
finished (recorded on main), so the GitHub address may change; make sure no other review is still capturing on it, since this replaces the
build under the reviewers. Then look at it for real:

```
PYREFLY_BROWSER=gpu node tools/moved-notice-check.mjs --url=https://baileypillon.github.io/pyrefly-reprise/ --out=docs/screenshots/cf-switch/live
```

(12 checks at 1600x900 and 390x844: the note is there and clear of the card, a real click leaves for echoesofspira.com and starts nothing,
a click elsewhere and Enter still start the game.)

### 2.4 Rehearsals done (2026-10-04, at 6e3c1647 and, before the merge of main, at 769fbe73; nothing was built, pushed or deployed)

`node tools/deploy-pages.mjs --host=cloudflare --kind=workers --skip-tests --dry-run --owner-override="Yes I will go with your recommendation"`:
prints the production plan, "working tree clean", the critic plan (a DEEP review, because `package.json` and the lockfile changed: focused
BEFORE the deploy, deep AFTER it), the release gate refusing for two reasons (no review report for this commit; 38 live builds carried as
owing a deep review, an old condition that every deploy has overridden), "DRY RUN: would proceed under the owner override", and
`wrangler: 4.147.0 found (tools: D:\Tools\wrangler\4.147.0\...)`. The same with `--host=github` prints the legacy plan (the old
address, `legacy-deploys.log`, no obligation recorded). `--host=github --preview` fails with "--preview needs --host=cloudflare".

### 2.5 The CHANGELOG entry (after it is live; `CHANGELOG.md` is the driver's: text only, each entry there now also has a picture and an "All pictures" page)

```
## 2026-10-04 · Release 38 on echoesofspira.com

Address: https://echoesofspira.com/ (main <sha>)

- **Both:** Echoes of Spira now lives at its own address, https://echoesofspira.com. It is release 38, unchanged, served from
  Cloudflare, and every file was checked byte for byte after the upload.
- **Both:** saves are kept per address, so echoesofspira.com starts with no saves. The old address,
  https://baileypillon.github.io/pyrefly-reprise/, stays up with a note that the game has moved, and saves made there stay there.
```

## 3. www must forward to the apex (the dashboard steps; wrangler cannot make a redirect rule)

Saves live in the browser, **per origin**: if `www.echoesofspira.com` served the game itself, a player's save made there would not be the
save on the apex. So `www` is not a second address. It is a **Redirect Rule** at Cloudflare's edge (free: 10 Single Redirects on the Free
plan), which runs before the Worker and never lets `www` reach it. Two things in the dashboard, in this order, on the zone
**echoesofspira.com** (docs read 2026-10-04: developers.cloudflare.com, "Redirect from WWW to root", "Create a single redirect rule in the
dashboard", Workers "Custom Domains", Fundamentals "Redirect one domain to another"):

1. **A proxied DNS record for www**, because a redirect only applies to traffic that passes through Cloudflare, and `www` has no record
   until you make one. DNS > Records > **Add record**: Type `AAAA`, Name `www`, IPv6 address `100::`, **Proxy status: Proxied** (orange
   cloud), TTL Auto, **Save**. (`100::` and the IPv4 twin `192.0.2.1` are placeholders that Cloudflare's own docs give for "no server, only
   redirects"; nothing is ever sent to them. If the dashboard offers to create this record when you save the rule, accept it.)
   Do **not** add `www` as a second Custom Domain of the Worker: then, until the rule works, `www` would serve the game and split saves.
2. **The rule.** Rules > **Overview** > **Create rule** > **Redirect Rule**. Either pick the template **Redirect from WWW to root**
   (Rules > Overview > Templates; its own values, from Cloudflare's example page of that name, are the generic wildcard `https://www.*` to
   `https://${1}`, 301, Preserve query string, which does the same on this zone) or set the zone's own values by hand:
   - Rule name: `www to the apex`
   - When incoming requests match: **Wildcard pattern**, Request URL `https://www.echoesofspira.com/*`
   - Then: **Target URL** `https://echoesofspira.com/${1}`, **Status code** `301`, **Preserve query string** checked
     (the same rule as a custom filter expression: Hostname equals `www.echoesofspira.com`; Type Dynamic; Expression
     `concat("https://echoesofspira.com", http.request.uri.path)`; 301; Preserve query string)
   - **Deploy**.
3. Recommended: SSL/TLS > Edge Certificates > **Always Use HTTPS** on, so `http://www...` and `http://echoesofspira.com` are upgraded
   before the rule sees them (the template's pattern matches HTTPS only). It is a zone setting, so it is Bailey's to say yes to.

Check (no tool needed): `curl.exe -sI https://www.echoesofspira.com/` answers `HTTP/2 301` with `location: https://echoesofspira.com/`;
`curl.exe -sI "https://www.echoesofspira.com/?a=1"` keeps `?a=1`. The next deploy prints "www check: ... forwards to the apex", and a
WARNING saying `serves the game itself` if it ever does not.

**Worker-side redirect instead? No, and why.** An assets-only Worker has no script, and its `_redirects` file cannot do it (wrangler
4.147.0's parser refuses an absolute source URL, "Only relative URLs are allowed", so a rule cannot tell www from the apex). A script
would need `main`, `assets.run_worker_first` and `www` attached as a second Custom Domain: every page load becomes a Worker invocation
(the free plan allows 100,000 requests a day; asset requests that never touch the script are free), a bug in the script could take the
whole site down where an assets-only Worker has no code to fail, and a mistake would make `www` serve the game and split saves. The
Redirect Rule costs nothing, needs no code and no deploy, and cannot take the game down.

## 4. Wrangler is pinned and found by itself (and why not the shared node_modules)

`wrangler` 4.147.0 is an exact `devDependency` in `package.json` and `package-lock.json` (already, from r39). The deploy now finds it with
no `PYREFLY_WRANGLER_BIN`, in this order: the variable if set (any copy, version reported); the repo's `node_modules/wrangler` if it
holds the pinned version; the standing install named by `tools/cloudflare/wrangler-install.json`, **`D:/Tools/wrangler/4.147.0`**. A copy
that is not the pinned version is skipped, with the reason. The dry run says which one it found.

**Why not `npm install` into the shared `node_modules`** (the first choice, tried read-only): `npm install --dry-run --offline` through
this worktree's junction **rewrote the shared hidden lockfile** (`node_modules/.package-lock.json`, 51,516 bytes to 67,012) and reported
26 packages to add and **all 97 existing packages as changed**: a real install would have re-extracted every package other agents are
running from, on Windows where native `.node` and `.exe` files are held open. The hidden lockfile was put back **byte for byte** (sha256
77b736a9147109b41b27f231476ac0fd3db9d8c974113d056c17dfaa65d0e333, from the r39 agent's repaired copy, modified time 2026-09-26 17:45:54);
the top-level listing of `node_modules` is identical before and after. **Rule, now in `docs/DEV.md` and in the error message:** never run
`npm install`, `npm ci` or even `npm install --dry-run` in the main tree or through a worktree junction.

**What was downloaded (D-370, Bailey: "yes you can download anything you want"; D: only):** nothing new. The packages (wrangler 4.147.0
and 36 dependencies for Windows x64, 59.3 MiB of tarballs, from `registry.npmjs.org`, MIT OR Apache-2.0) were fetched once, on
2026-10-04 00:15, by the r39 session. The standing install was made with `npm ci --offline --ignore-scripts` from `tools/cloudflare/wrangler-install/package-lock.json`
(a copy of the probe's lockfile, renamed, 90 of its 91 packages byte-identical in integrity to the repo's own lockfile; the 91st is a
hoisting difference), from that session's npm cache: 37 packages, 1,702 files, 188,357,336 bytes, every tarball checked against its sha512
on extraction. Recorded in `D:/Tools/downloads.md`. It reports `4.147.0`, and wrangler's own config reader (`unstable_readConfig`, local,
no network) accepts both configs. To rebuild it, copy `tools/cloudflare/wrangler-install/package.json` and `package-lock.json` into an empty
`D:/Tools/wrangler/4.147.0` and run `npm ci --ignore-scripts` there. `D:/Tools/wrangler` is not under any worktree, so a worktree clean-up
cannot reach it (the D: clean-up session's `keep.txt` is not touched here).

## 5. The "we've moved" note

One line (two, on a phone: three) on the **title screen**, shown **only when the page is served from `baileypillon.github.io`**:
"Echoes of Spira has moved to **echoesofspira.com**" and, dimmer, "Saves made here stay here", the whole chip a link to
`https://echoesofspira.com/`. Never on echoesofspira.com or its www, the workers.dev backup and preview addresses, localhost or a
lookalike (`onOldAddress` is one pure function; the same build ships everywhere and the hostname decides at run time).

- **Look.** The title card's own language, nothing invented: the hint row's ink chip, gold left rule, Chakra Petch tracked capitals, the
  gold bold for the part to act on, every size a `--fe-k` multiple, type at the 14px floor. Top right at 1600x900, on the strap's margin
  (34) at the height the chapter board's top chip uses (22); full width at the top on a phone, three lines at 390 wide, clear of the slab
  (14 px of air at 390x844; packed tighter on a 360x640 so it still clears).
- **Behaviour.** It sits **outside** the plate's `data-action="confirm"` element, so a click on it cannot also start the game; it is out of
  the tab order (Enter always belongs to the game; the game blocks Tab anyway); it drops focus on click.
- **Screenshots** (production builds, real GPU, headless Chromium): `docs/screenshots/cf-switch/title-baileypillon.github.io-1600x900.png`
  and `...-390x844.png` (the GitHub build, with the note); `title-echoesofspira.com-1600x900.png` and `...-390x844.png` (the Cloudflare
  build, without it).
- **Real input**, `tools/moved-notice-check.mjs` (serves a build to headless Chromium as if it came from any host, or loads a live address):
  old address 12 of 12 (note drawn and clear of the slab and the hint row, in the frame, at 14px or more; a real click or tap on it
  leaves for echoesofspira.com; with the navigation held back it starts nothing; a click elsewhere on the plate does start the game, the
  control that gives "starts nothing" its meaning; Enter still starts it); new address 8 of 8 and the preview Worker's host 4 of 4, with
  no note.
- Rule 9 (End state first): the brief gave the words and the place, so one version was built, not options; the screenshots are what to
  show Bailey before the GitHub-only deploy that publishes it. The look is a handful of lines in `moved-notice.css` if he wants it
  elsewhere.

## 6. Gates (2026-10-04, on this branch)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | clean at the tip |
| Deploy tests (host, wrangler, cloudflare) | 125 tests in 3 files (80 before); 20 single-line mutations of the new logic, **all caught** (default host, legacy, preview config, base env, canonical address, live address recorded, ten-minute wait, config check, www check, custom-domain targets, preview routes, workers_dev, version pin, tools install, runner literal, learn link, old-host rule, note inside the plate) |
| `live-url-follows-host` / `moved-notice` | 14 / 15 tests (the note commit's message says 21 for the second; it is 15) |
| Full unit suite, `--maxWorkers=3 --testTimeout=60000`, TEMP on D: | **805 files passed, 5 skipped (810); 11,970 tests passed, 46 skipped, 1 todo; exit 0** (448 s), run at `6e3c1647`. Later commits touch only this handoff, the `AGENTS.md` Live line, `tools/moved-notice-check.mjs` and one log wording in `deploy-cloudflare.mjs`; the three deploy files, the pin test and the note test (154 tests) and tsc were run again after them: green. The first full run, at `769fbe73`, was 805 passed, 11,969 tests. |
| `node tools/orphans.mjs` | 1221 modules, 1197 reachable, **24 orphaned: the same 24 as before** (`movedNotice.ts` is reachable) |
| Production Cloudflare build, `BASE_PATH=/` | 1,932 files, 760.73 MiB, bundle `X5kGUd9G`; base check ok; `art-derive verify` PASS (1005 masters, 539 WebP, 862 pixel-compared); `audit` PASS (0 dangling); the load gate PASS (1049 of 1049 in Chromium 153 and WebKit 26.6, 0 failed, 21 s) |
| Cloudflare limits | 1,932 files of 20,000; largest `art/characters/yunalesca-2/idle@2x.png` 8.11 MiB of 25 MiB; no `.git`, no `_headers`/`_redirects`/`.assetsignore`; total 760.73 MiB (no total limit is stated) |
| GitHub build, `BASE_PATH=/pyrefly-reprise/` | 1,932 files, 760.73 MiB, bundle `DySQmN_B`; the same three art gates PASS; the real-play audit of the frontend (title, 19 chapter tiles) PASS, 77 image requests, 0 errors; the note shows (section 5) |
| Save key | `pyrefly-reprise:save:v1` (`SaveData.ts`, untouched; the product diff against `origin/main` is the note's three files, 140 added lines) is in both bundles |

Not run: the whole real-play audit of all 19 chapters, `art-browser-identity`, and any real deploy or upload.

## 7. Risks, and decisions that are not mine

1. **wrangler overrides existing DNS without asking** (2.1). Look at the DNS tab first. If a conflicting record is there, deleting it is Bailey's call.
2. **A fresh Custom Domain can be late** (DNS record and certificate): the deploy waits ten minutes and then stops with the Worker already live on
   workers.dev; run it again. A negative DNS answer cached on this PC (`ipconfig /flushdns`) can outlast that.
3. **Custom Domains are replaced as a list.** wrangler sends `replace_state=true` and `override_scope: true`: a Custom Domain added to
   this Worker in the dashboard and not listed in `routes` may be removed by the next deploy. `www` is deliberately not one (section 3).
4. **workers.dev stays on** (`https://echoes-of-spira.<account>.workers.dev/`): a backup that is a **separate origin**, so a save made there
   stays there. Nothing links to it; do not hand it out. (The preview Worker `echoes-of-spira-preview` also still exists; `wrangler delete
   echoes-of-spira-preview` with the pinned wrangler removes it when Bailey says so. Not done here.)
5. **Saves.** echoesofspira.com starts empty (S0, Bailey's pick); saves on the GitHub address stay there and the note says so. S1 and S2
   of r39 section 7 (carry saves over) are not built and would be a save-data change (a deep review before going public).
6. **Round 21 and the marker of 6461999e.** Round 21 is recorded on main (c3c4daba: SHIP, deployment PASS, changed area FAIL, "focused and
   deep still pending on coverage gaps"). The production deploy **supersedes the marker of 6461999e** (moved to `critic/cleared/`, its deep
   obligation carried to the new build as for every earlier deploy; the carried list is 38 long). `critic-clear --report <file>` settles only
   against a **pending** marker for the report's own build (read in `tools/critic-clear.mjs`: otherwise "no pending marker ... kept as
   candidate evidence"), so **if round 21 should settle anything on 6461999e, run `node tools/critic-clear.mjs --report critic/rounds/round-21.json`
   in main BEFORE the production deploy**; after it, a report for 6461999e settles nothing, and the carried deep review is settled only by a
   deep report for the new build. Edited `critic/runner/deep.js` and `live.js` default to the new address; pass `args.live` to aim any run
   at the old one.
7. **Review evidence.** The plan is a DEEP review (package.json and the lockfile changed): a focused review before the deploy, a deep one
   after. The deploy needs a validated report for the commit, or Bailey's words as the override. The legacy deploy needs the same again.
8. **The note ships in the Cloudflare build too**, inert (the hostname decides). Checked on `echoesofspira.com` and the preview host; the
   rule is unit-tested against the new address, `www`, workers.dev, localhost and lookalikes.
9. **Caching.** Workers static assets answer `max-age=0, must-revalidate` by default, so repeat visits revalidate each of the ~1,900 files
   (GitHub Pages used ten minutes). A root `_headers` file would fix that but the upload gate refuses it today (the live byte check could
   never match a file Cloudflare reads instead of serving). A follow-up, not part of the switch.
10. **Left alone on purpose:** `learn/shared/urls.ts` keeps `/pyrefly-reprise/` as the learning sites' default art base (a folder, not a
    host; those sites have no deploy yet); `docs/handoff/NOW.md` (not staged); `CHANGELOG.md` and the ACTIONS and DECISIONS ledgers (written
    when it is live); `docs/handoff/r39-cloudflare.md` stays as history.
11. **Pages kind** (D-369's wording) is not wired to the Custom Domain: only the Workers kind serves echoesofspira.com.
12. **Zone security applies to the Custom Domain, not to workers.dev.** The preview and workers.dev checks passed outside the zone. If the live
    check of echoesofspira.com ever sees a 403 or a challenge page, look at Security > Bots (Bot Fight Mode), Browser Integrity Check and the WAF
    managed rules: a Node client is not a browser. Not seen; flagged because nothing here could be tried against the zone.
13. Nothing was verified against Cloudflare itself: no login was used, nothing was uploaded, no DNS or dashboard state was read. The first
    real run is the first time wrangler meets this config and the Custom Domain.
