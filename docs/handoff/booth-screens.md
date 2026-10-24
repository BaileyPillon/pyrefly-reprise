# The booth screens: end card, attract card, press page (conference demo; branch `booth-screens`, from `r63-play`)

Written 2026-10-24 (overnight) by the booth sub-agent of the Echoes of Spira release driver. Bailey, 2026-10-22 ~22:20 to 22:50 EDT, decision 188b "Mixed read (Recommended)" (records: `D:/Tools/pyrefly-scratch/2026-10-07/decisions-to-record.md` items 178q, 186 to 189): the END CARD and the ATTRACT CARD in the Echo painting look (option A of each: `endcard-A`, `attract-A`), the PRESS PAGE and the TRAILER lead with the game (press option B, the dossier; trailer cut B, action-led, 62.8 s, 19 shots). His standing rule (189): FFX / FFX-2 as he knows them with an Expedition 33 spin. Nothing is printed (178q). **The trailer is not in this branch** (it is recorded after Saturday's lock); the press page has its row ready (below).

**Game case (AGENTS.md rule 14): both games.** These are the shared front door (the title, the end card, the attract card, the press page): they say nothing about either game and change no fight, rule or number. Chapter I (`seymour-flux`) is FFX and Chapter IV (`ffx2-bahamut`) is FFX-2; the end card after a won fight is the same picture for both; the press page tags each frame with its game (FFX gold, FFX-2 pink).

## What was built, and the picks it follows

| piece | what it is | where | the pick |
|---|---|---|---|
| **End card** | the demo's "Thanks for playing" card after a won fight, drawn as the Echo painting held with a slow push (scale 1 to 1.06 over 9 s), pyreflies drifting, "An unofficial fan tribute" and the pitch on the left, the QR with "Scan to play", the address and "Free, in your browser." on the right. After a fight it adds one line above the picked words, "Thanks for playing" (decision 173h), and builds up in 42 percent of the time (the card ends on a press or in 8 s). | `src/app/demo/demoThanks.ts` (the screen, unchanged flow), `boothCards.ts` + `boothCards.css` (the picture) | 188b, end card A |
| **The booth loop's end card** | the same card with no thanks line and the full 9 s build-up, as a page of its own: `?card=end` opens it instead of the title; a press after a 0.7 s guard goes on to the title. For the trailer's last 9 s and the card the booth screen returns to. | `src/app/demo/BoothCardScreen.ts`, registered in `main.ts` (`booth-end`) | 188b |
| **Attract card** | after 60 s with no one at the title, the Echo painting (still, breathing 2.5 percent), "Pick up the controller" in italic serif, the pad glyph with a ring breathing out of its A button every 1.5 s, "Press any button", "An unofficial fan tribute", and "Or play at home" with the QR. Any key, click, tap, wheel, a mouse that has really moved, a pad button or a pushed stick takes it away. It replaces the reel (`?attract=reel` keeps the reel). `?card=attract` opens it on its own. | `src/app/demo/boothAttract.ts`, started by the idle count in `src/app/demo/demoTitle.ts` | 188b, attract card A |
| **Press page** | the dossier: a static route at `/press/`. Left: the wordmark, the pitch and link rows (Play the game, Watch the trailer when it exists, Screenshots and key art, Fact sheet, Credits and legal, Source on GitHub). Right: a wall of real frames (Seymour Flux, FFX, gold; Bahamut, FFX-2, pink; the Farplane key art) and three facts. Under it: the screenshot gallery (eight pictures), the fact sheet, the credits the licences ask for, the game's own fan-work notice. | `public/press/index.html`, `press.json`, `frames/*.jpg`; `tools/press-frames.mjs` + `tools/press-frames.json` make the pictures | 188b, press B |

### How the site routes pages (the answer to "find how")

There is no router. The game is one page; the site is a Cloudflare Workers static-assets site (`tools/cloudflare/wrangler.jsonc`, `assets.directory` = the build, no script), so **a folder with an `index.html` in `public/` is a route**: `public/press/index.html` ships as `/press/`. Every address in it is relative (`../` is the game at either base, the Cloudflare root or the old `/pyrefly-reprise/` folder; fonts come from `../fonts/`). Verified: a production-style build with `BASE_PATH=/` (`vite build` with a small public folder) served by `vite preview` answers `/press/` with the press page, `/press/press.json` and the frames with 200. In `npm run dev` the address is `/press/index.html` (the dev server's fallback answers a bare `/press/` with the game); the Workers site is documented to redirect `/press` to `/press/` (auto-trailing-slash, the default); that is **not verified on a real deploy** (nothing deploys from this branch).

## The switch and the routes

| address | what it does |
|---|---|
| nothing | release 62 exactly: the cream thanks card, the self-playing reel after 60 s |
| `?demo=1&booth=new` | the Echo end card after a fight and the Echo attract card at 60 s idle |
| `?demo=1&pack=demo` | the same (the shared key every demo piece answers to); `?pack=demo&booth=today` is the A/B with today's cards |
| `?pack=demo&attract=reel` | the end card on, the 60 s idle still plays release 61's reel |
| `?card=end`, `?card=attract` | the page opens on that card instead of the title (works without demo mode) |
| `/press/` | the press page (always there; it needs no switch) |

Console (`window.__pyrefly`): `booth('new' | 'today')`, `boothOn()`, `boothCard('end' | 'attract')` (goes to the standalone card), `boothAttractNow()` (puts the attract card over the title as the idle does). The switchboard has no key for it (it is not an in-fight piece; the apostrophe was the last free key).

**How the attract card never starts the game:** a press is swallowed in the capture phase (the game's `Input` never hears it), the click and the release behind it are taken for 450 ms, and the title ignores its own input while the card is up or just gone (`DemoTitle.holding()`, one line at the top of `TitleScreen.handleInput`); a pad button, which raises no DOM event, is polled every 50 ms and the title is told to stand still. The title's own idle clock restarts at the press (60 s again). It writes nothing to the save.

## Differences from the picked mockups (what an eye comparing them will see)

All the mockup numbers were made at 1280 x 720 and 2x; the build sizes everything in the front end's grid unit (`--fe-k`: 1.78 px at 2560 x 1440), so it is the same picture at every window size.

1. **TEXT FLOOR (Bailey's 28 px at 1440p).** The mockups' small labels were 8.5 to 11 px at 1280 wide (17 to 22 px at 1440p). Every word on the cards is now at least 16 units (28.4 px at 2560 x 1440) and the press page's root is 28 px at 2560 (14 px at 1280, 16 px on a phone), no word under 1rem. So: the three tracked caps labels ("An unofficial fan tribute", "Scan to play", "Or play at home") are bigger and tracked 0.2em instead of 0.34em so they fit; "Free, in your browser." and the host line are bigger; the QR plates are 235 px (end) and 199 px (attract) instead of 224 and 168; "Press any button" is 20 units. The press page's labels, link sub-lines, tags and legal line rose to the same floor, which makes the dossier slightly taller than the mockup (the legal line sits just below the 1440p fold).
2. **End card after a fight adds "Thanks for playing"** (decision 173h's words) above the picked frame's words; the picked frame was drawn for the trailer's last 9 s and has no such line. `END_THANKS_ON_AFTER_FIGHT` in `boothCards.ts` takes it away. The card also has no draining bar and no "continue" chip (the old cream card had both).
3. **The painting is used as it is, 1682 x 932**, scaled 1.52x at 2560 x 1440. A GPU 2x upscale (the mockup notes ask) needs Bailey's yes and was **not run**; it would only soften less.
4. **Press page words:** "Play the game", not "Play the demo" (the public site is the whole game, five fights; the two-fight demo is the booth's address); the "Press kit .zip" row is not there (no zip exists): "Fact sheet" and "Credits and legal" take its place; the footer legal line is the game's own fan-work notice verbatim (`FAN_NOTICE`, the README's), not the mockup's "Not affiliated with or endorsed by Square Enix" sentence; the facts strip reads "five, from X (CTB) and X-2 (ATB)". Below the dossier the page also has a gallery, the fact sheet and the credits, which the header mockup did not show.
5. **The frames are from the playtest build r63-play** (F1 HUD, the new look), not release 62's: they show what Bailey plays tonight, which may change in his Saturday picks. The playtest switchboard's corner label (the key list at the top right of every capture) was taken out of each picture by a median over the label's box (`tools/press-frames.mjs`); nothing else in a picture is touched; the in-game "PAUSE" chip and ghosted enemy-move list are the game's own. Retake after the lock: `node tools/press-frames.mjs` (the config lists the sources) and the page needs no change.
6. The attract card is an overlay on the live title (the title, its music and its state stay), so there is no fade through black and no art to load; the mockup is a still. The music is not changed (agents cannot hear: AGENTS.md rule 13).

## What the press page claims, and where each line comes from

Every credit line is one of the game's own REQUIRED lines (`src/app/credits/creditsData.ts`); `tests/unit/booth-press-page.test.ts` holds the page to that file (the fan-work notice, the licence addresses, the seven required credits). The facts are the README's (five encounters; the chapter table; TypeScript, Three.js, Vite). No email address, mail link or phone number is on the page (the test refuses one); questions go to GitHub issues. The GitHub link is the public repository's, which the README already names.

**Trailer row:** hidden. When the trailer exists: copy it to `public/press/trailer.mp4` and set `public/press/press.json` to `{ "trailer": { "file": "trailer.mp4", "length": "1:03" } }`; the row appears (the page reads `press.json`, which is always there, so it never asks for a file that is not: a missing file would be a console error).

## Evidence (all in `D:/Tools/pyrefly-scratch/2026-10-24/booth/evidence/`)

Headless Chromium on the real GPU, 2560 x 1440, the dev server on :5375 (code = this branch); RIG-RECORD held for each run.

- `compare-endcard.jpg`, `compare-attract.jpg`, `compare-press.jpg`, `compare-press-phone.jpg`, `compare-endcard-afterfight.jpg` and `-ch4.jpg`: picked mockup on the left, the build on the right.
- `flow/` the real-input runs: `idle-flow.json` (60 s of nothing at the title: the card is up; a real Enter takes it away and the title is still the title 3 s later; 60 s again, a pad A press does the same; then Enter starts the game: `chapter-select`), `thanks-flow.json` (a won Chapter I and Chapter IV fight by the real flow, the results panel confirmed with a real Enter, the card, a press ends it).
- `press/` the press page at 2560 x 1440, 1280 x 720 and 390 x 844 (2x), full-page strips included; 0 console errors; text floor measured (smallest text 28 px at 2560, 14 px at 1280, 16 px at 390; no horizontal scroll at 390).
- Tests: `tests/unit/booth-switch.test.ts`, `booth-cards.test.ts`, `booth-attract.test.ts`, `booth-end-card-screens.test.ts`, `booth-press-page.test.ts` (new); `demo-title`, `demo-attract`, `r62-demo-thanks`, `r61-booth-*`, `behind-the-scenes-off*`, `css-comments`, `art-url-base` and the other demo and title suites pass unchanged.

## Not done, and questions for Bailey

- **The trailer** (cut B) is the trailer lane's, recorded after the lock. The press page and `?card=end` are ready for it.
- **The press-kit zip** (logo, key art, fact sheet) is not built; the page has the pieces (frames, key art, fact sheet) as separate downloads.
- **The Echo painting's 2x upscale** (a GPU job): your yes first.
- **Where the QR points:** it points to the game (`echoesofspira.com`), as the mockup says; the options book asked "the game, or a press page" and nothing records an answer. **The press address** is `/press/` (the options book suggested it) and there is **no contact line** on it (none was approved; I put none).
- Idle at the picker or in a fight does not show the card (only the title's 60 s count, as release 61's reel); the booth loop on a second screen is `?card=attract`.
- The frames are stand-ins until the Saturday lock; `node tools/press-frames.mjs` retakes the pictures from new captures (clean ones, without the switchboard label, are better than cleaned ones).
- No sound for either card. Nothing was deployed; nothing was sent.
