# r38-keyart-fix: no art URL starts at the server root (release 38, both games)

**Branch:** `r38-keyart-fix` in `D:/pyrefly-fb-onboard`, from `origin/main` `54e44c23`. Not merged, not deployed; pushed as a branch only.
**Game case:** **both.** The page and the build are shared plumbing, the title card is the front door of both games (rule 14, CHK-020: a
shared bug fix is "both"). No game content, no pixel changes. **critic-plan class** (`node tools/critic-plan.mjs --paths index.html,...`):
DEEP, after deploy ("index.html: global layout, input and boot is a shared system"), the class release 38 already owes.

## The bug

A check of the release 38 candidate saw `GET /art/title/keyart.2x.webp` answered 404 when the site was served under `/pyrefly-reprise/`:
the 2x title master asked for at the server root, with no base. Release 38 ships on GitHub Pages under `/pyrefly-reprise/` and release 39
on Cloudflare at the root, so every art URL has to come from the base.

**Cause: `index.html`, not the code.** The page preloads the title plate by name, 1344w and 2688w candidates, written root-absolute
(`href="/art/title/keyart.png"`, `imagesrcset="/art/title/keyart.png 1344w, /art/title/keyart.2x.webp 2688w"`). Vite puts the base on such a
name only if the file is in `public/` while it builds (`checkPublicFile`); a name it does not find stays as written. So a build that does not see
`public/art/title/keyart.2x.webp` (a half-installed art tree, a copy made before the master landed, a worktree with no art) keeps
`/art/title/keyart.2x.webp` in the page, and at 1600x900, 1x or 2x, the browser picks that candidate for the preload
(`calc(1.11 * max(100vw, 1.750 * 100vh))` is 1776 px, more than the 1344w plate) and asks the root. Built with every file in place the page is
right, which is why live 37.1 (checked read-only: its page and its manifest, `generatedAt` 2026-10-03T14:22:43Z, which does list
`title2x`) and every earlier check looked fine. What Vite does to the old and the new text (a real Vite 8.3.0 build of the real `index.html`,
only the app script cut out; `D:/Tools/pyrefly-scratch/2026-10-04/keyart/mini.mjs`), the three URLs of the link, base `/pyrefly-reprise/`:

| page | art in `public/` | `href` and 1st candidate | 2nd candidate (the 2x master) |
|---|---|---|---|
| old | complete | `/pyrefly-reprise/art/title/keyart.png` | `/pyrefly-reprise/art/title/keyart.2x.webp` |
| old | no 2x master | `/pyrefly-reprise/art/title/keyart.png` | **`/art/title/keyart.2x.webp`** (the 404) |
| old | no art at all | `/art/title/keyart.png` | `/art/title/keyart.2x.webp` |
| new | any of the three | `/pyrefly-reprise/art/title/keyart.png` | `/pyrefly-reprise/art/title/keyart.2x.webp` |

At base `/` every URL in every row reads `/art/...`, which is right there.

## What changed (3 files)

- `index.html`: the three art URLs of the preload now start with `%BASE_URL%` (Vite fills it in: `/pyrefly-reprise/` on Pages, `/` on Cloudflare,
  `/` in dev, checked on a real dev server too), plus a comment saying why. With the art complete the built page differs from before in that
  comment only (1915 of 1916 files of the build identical, the one other being `index.html`, both bases).
- `tests/unit/art-url-base.test.ts` (new): a literal that begins with an absolute path into the art tree (`"/art/..."`, `url(/art/...)`, a
  second srcset candidate, or behind a hard-coded folder `/pyrefly-reprise/art/...`) fails the suite, in `index.html`, `src/` and `public/`
  outside `art|fonts|fx`; a name joined onto the base (`${base}/art/...`, `%BASE_URL%art/...`) and the one attribute selector
  `[src*="/art/portraits/"]` pass. 22 controls feed each shape to the scanner. When a build is there (`PYREFLY_SCAN_DIST=<dir>`, or a `dist/`
  newer than the source) it also reads the build's own base from its module script and fails any art URL in its pages, sheets and scripts that
  does not start with `<base>art/`; a base `/` build fails a hard-coded `/pyrefly-reprise/art/`.
- `tests/unit/title-reveal.test.ts`: the preload assertion now takes the `%BASE_URL%` form and checks the filled-in link equals what the title's
  planes carry (`href`, `srcset`, `sizes`), which the old regex only implied.

**Already right, audited, not changed:** `titleMarkup.ts` (`artUrl(TITLE_PLATE)`, `titleSrcsetNow`, `upgradeTitlePlanes`: the 2x URL is derived from the
base-prefixed plate URL), `ArtManifest.ts` (`artManifestPath()` from `BASE_URL`, `title2xUrlFor`), `ArtShipped.ts` (maps a name in place, keeps its
prefix), `PaintedArt.artUrl`, the art-derive plugin's page rewrite (swaps `.png` for `.webp`, keeps any prefix), `AudioManager`. CSS `url('/fonts/...')`
(15 of them) is rewritten by Vite and the fonts are tracked files, so always found (all 15 in the Pages build carry the base). `learn/` is a separate
app with its own `VITE_ART_BASE`. The built bundle holds one `"/art/portraits/"`, an attribute selector.

## Proof (headless Playwright from node, `PYREFLY_BROWSER=gpu`, a strict static server in the same process: exact-case names, a real 404, no SPA fallback, one fresh context per run)

Each run: the title at 1600x900 at device pixel ratio 1 and at 2, Enter to chapter select, Chapter I (`seymour-flux`) by real keys to its first command
menu. Same working tree and same art for both sides (`--html=old` puts origin/main's page in with a Vite pre hook). HTTP 400+ / console errors /
requests outside the base, per context (failed requests and page errors were 0 in every run):

| build | before (old page) | after (new page) |
|---|---|---|
| Pages base, art complete | 0 / 0 / 0 and 0 / 0 / 0; 2x key art 200 at `/pyrefly-reprise/art/title/keyart.2x.webp`; server 394 requests, 0 404 | 0 / 0 / 0 and 0 / 0 / 0; same file 200; server 382 requests, 0 404 |
| Root base, art complete | 0 / 0 / 0 and 0 / 0 / 0; 2x key art 200 at `/art/title/keyart.2x.webp`; server 375, 0 404 | 0 / 0 / 0 and 0 / 0 / 0; same; server 397, 0 404 |
| Pages base, 2x master not in `public/` at build, on the server (title only) | **1 / 1 / 1 in each context**: `GET /art/title/keyart.2x.webp` 404 at the server root, `Failed to load resource`; server 118 requests, 2 answered 404 | 0 / 0 / 0 in each; the 2x master 200 under the prefix; server 134, 0 |

Not run in a browser: root base with the master hidden (the table above says the page is `/art/...` before and after, which is right there).
`ERR_ABORTED` requests (0 to 4 per run, different each run, before and after alike) are lazy plates of other chapters that the page abandons as the
player moves on; none is the key art, none is a status. `tsc --noEmit` clean; the changed tests, the page, art and title tests around them pass;
`node tools/orphans.mjs` 24 orphaned, all older than this branch (it adds no module under `src`). **Full suite: 794 of 801 files and 11,694 tests
pass; 2 tests fail, neither from this change:** `strategy-ffx2-bahamut` "heal-only route clears Mega Flare" times out at the 15 s limit on the loaded
machine (19 s alone) and passes with `--testTimeout=90000`; `ui-portrait-face-crop` "Chapters 4 and 5, every owned sphere with a painting" lists six
painted dresspheres with no measured head row (`yuna-thief`, `rikku-warrior` and four more): the art install now landing in the shared `public/art`
painted them, and the rows are in the main tree's uncommitted `src/ui/common/face-crops.json`, where the test passes (126 of 126). Red/green on the real tests: with the pre-fix `index.html` put
back, the source scan fails naming `/art/title/keyart.png` twice and `/art/title/keyart.2x.webp`, and `title-reveal` fails; with this one both
pass. Run against the six builds above with `PYREFLY_SCAN_DIST`, the build scan passes the five good builds and fails the broken one with
`index.html: /art/title/keyart.2x.webp`.

Scripts, builds, logs, reports and frames (about 7 GB; `discard-mangled-base-1`, `before-gh` and `before-root` are superseded and safe to drop):
`D:/Tools/pyrefly-scratch/2026-10-04/keyart/` (`build.mjs --base=gh|root [--html=old] [--public=<dir>]`, `check.mjs`, `mini.mjs`, `mirror.mjs`
(hard-link mirror of `public/` minus one file), `devserve.mjs`, `dircmp.mjs`). A base typed as `/` in Git Bash is rewritten by MSYS into
`C:/Program Files/Git/`: the scripts spell it `gh` or `root` and turn it into the path in node.

## For the release

- Merge `r38-keyart-fix` into the release 38 line; nothing in `src/` changes, so the bundle hashes do not. Every other branch's `index.html` still
  has the old pair of lines (`git grep` on all 45 worktree branches: no branch has a root-absolute art URL in a script, sheet or page of `src/` or
  `public/` besides that pair), so the merge fixes them all and nothing else will trip the new scan. The one other place the pattern appears is
  `camera-lab`'s four mock data files, `public/mock-art/*/rear34.json` (`"path": "/art/characters/..."`): JSON, not read by this scan, an
  experiment, not a release line.
- A build made where `public/art` is complete is unchanged; one made where the 2x master is missing now asks for it under the right prefix and the
  deploy's own audit (`node tools/art-derive.mjs audit`, "no page names an art file the build left out") is what says the file is missing.
- **A blind spot the deploy keeps, for the release flow to close if it wants to:** that audit strips the leading slash of a name, so a page that
  names `/art/title/keyart.2x.webp` passes it whenever the file IS in the build, whatever the base. That is exactly the state a build racing an art
  install ends in (Vite scans `public/` once, when the config resolves; the folder is copied at the end), and probably what the check saw (inference:
  I could not see its build). The new build scan covers it: `PYREFLY_SCAN_DIST=<production candidate> node node_modules/vitest/vitest.mjs run
  tests/unit/art-url-base.test.ts -t "in a build"` (about 5 s; it fails naming the file and the URL).
