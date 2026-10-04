# Paper preflight: the rename to "Echoes of Spira" (release 38, both games)

Rule-15 preflight for track `r38-rename` (branch `r38-rename` in `D:/pyrefly-r38-rename`, from `f3389dfc`, which is
`origin/main` after release 37.1). Written before any source was edited.

Bailey, 2026-10-04: "I need a new working title for my game I dont like pyrefly reprise", then, choosing from the
driver's list: "I'll go with Echoes of Spira. The name change should take place immediate in our next build please."
Release 38 is the next build.

## 1. What `critic-plan` says

```
node tools/critic-plan.mjs --paths index.html,src/main.ts,src/app/screens/frontend/titleMarkup.ts,
  src/app/screens/pause/PauseView.ts,tests/unit/frontend-title-motion.test.ts,...
  review:        DEEP
  before deploy: FOCUSED review of the production candidate
  after deploy:  live verification, then the DEEP review on the live build (this build owes it)
  obligations:   live + focused + deep
  because:       index.html and src/main.ts are "global layout, input and boot", a shared system
  games:         both, all 18 chapters
```

Not the save-data class: no deep review is owed before the deploy, and `src/app/SaveData.ts`, the save schema and its
migration are not touched (section 4). The deep review is owed after the deploy, on the live build.

## 2. Game case (rule 14)

Both. The title is the product's name, one string for the whole tribute, not content of one game: the page title, the
boot and error screens, the title card and the pause serve FFX and FFX-2 alike. Bailey chose the name for the whole game.
Two things follow from that and are disclosed rather than decided here:

- The hidden FF7 experiment's pause now reads "Echoes of Spira · Final Fantasy VII". Spira is FFX's world, so that line
  is odd; it is the same single brand string the pause always printed, and FF7 stays hidden. A Bailey call, not an
  agent's.
- The approved Title tile (`docs/screenshots/mockups/A-title.jpg`, `docs/concepts/polish/showpiece-frontend/after.png`)
  shows the old name. The text now differs from that picture by Bailey's decision; the target registry is not edited by
  this track (it is Bailey's).

## 3. What changes, and the risk of each

| # | Change | Risk | Guard |
|---|---|---|---|
| 1 | `index.html`: `<title>`, meta description, the no-script fallback line | a stale tab title, or the old name in the static HTML a crawler or a no-JS visitor reads | the built `index.html` is scanned; a no-JS capture reads the served HTML |
| 2 | `titleMarkup.ts`: the two stacked wordmark lines become "Echoes" and "of Spira" | the longer line wraps or leaves the slab, most likely on the 390 px phone block (slab content 184 k wide) | measured on the live page's own DOM and CSS at 390x844, 360x740, 1024x768, 1280x720, 1600x900, 2000x1012 and 2560x1080: every line stays on one row; the widest line ("of Spira") uses 62 percent of the slab's text box on desktop and 86 percent on the 390 px phone; the font size, line height and weight are unchanged, so **no CSS changes** |
| 3 | `PauseView.ts`: the brand line | the line gets longer and collides with the tab strip | "Echoes of Spira" has the same 15 characters as "Pyrefly Reprise"; measured in the pause at 1600x900 and 390x844 |
| 4 | `main.ts`: the fatal-error heading | untested path | forced by a page whose WebGL contexts are refused; heading and message read on screen |
| 5 | A test that scans the shipped source and a build for the old name | a false positive on an internal identifier, or a build the test cannot see | allowed forms: the hyphenated kebab id (`pyrefly-reprise:save:v1`, the base path), `__pyrefly`, `PYREFLY_*`; the build scan runs when a build is named or `dist/` exists, and the source scan always runs |
| 6 | A release 37.1 save fixture and test | the rename touches storage and loses progress | the fixture is a blob the live 37.1 build wrote itself; the test seeds the literal key and loads it through the real `SaveStore`; the same blob is put in localStorage before boot of the new build and the board is read |
| 7 | Docs: README, ARCHITECTURE and DEV headlines, one AGENTS.md line | none | text only; history, critic and handoff files untouched |

## 4. Not renamed on purpose

The repo and folder names, `window.__pyrefly`, `PYREFLY_*` variables, CSS class prefixes, the tools and critic files, the
GitHub repo and the live URL, the `/pyrefly-reprise/` base path, **`SAVE_KEY` `pyrefly-reprise:save:v1`** and
**`EXPERIMENTS_KEY` `pyrefly-reprise:experiments:v1`** (renaming either would lose a player's progress). In-world
"pyrefly" (the spirit-light effect, the `pyrefly` SFX id) is not the title and stays.

## 5. What the deep review should check

- Tab title, title card, chapter select and pause at 1600x900 and 390x844, and the title also at 1024x768 and 2000x1012;
  "Echoes of Spira" everywhere and the old name nowhere in the visible text.
- The no-script text and the WebGL-refused heading.
- A save from release 37.1 in localStorage before boot: the board shows its clears, a chapter plays, the pause opens.
- The built output holds no player-facing copy of the old name (the scan test, run on the deploy candidate).
- Zero console errors on the real-input path.

## 6. Follow-ups for Bailey, not built

- A painted "Echoes of Spira" logo to replace the text wordmark. The title card's wordmark is HTML text in the Ink & Gold
  typography, not a painting, so there is no image to retire; a logo is a new piece of art and needs options first.
- Typographic options for the wordmark ("of" smaller or lighter is the usual treatment); the plain stack ships.
- The owner-facing tool pages (`docs/audio/audition.html`, the art-watch gallery) still carry the old name in their
  titles; they are tools, not the game.
