# r43-prepphone: the eight heavy party-prep tabs on a phone, PREP-A (PR-0295): frames and numbers

Written 2026-10-12 by the lane's continuing Sonnet sub-agent and refreshed at 23:50 by the lane's first sub-agent, resumed after its freeze. Branch `r43-prepphone`; the build every frame here was taken from is the code of `98bcc847` (the lane's first commit is `f060d152`; `98bcc847` is the one CSS file after `e0f66efa`: the colours are the nearest Ink & Gold tokens, the brief's rule, so every frame was retaken on it; the layout did not move); this folder and the notes are the commit after it. **Nothing is merged and nothing is deployed.**
Handoff: [docs/handoff/r43-prepphone.md](../../handoff/r43-prepphone.md). Paper preflight: [docs/plans/r43-prepphone-review.md](../../plans/r43-prepphone-review.md).

Every capture is headless Chromium on the real GPU (`PYREFLY_BROWSER=gpu`), a fresh profile, seed 1, the first-run guide skipped, device scale factor 1, the screen reached by the player's keys (title, board, Enter).
On a phone each tab is opened by a **real touch tap** and every scroll is a **real touch drag** (CDP touch events that end at rest), not a script. "Today" is a pristine export of origin/main `2868c195`
(live `a061e9dc`) served beside the branch with the same art. The sweep is CHK-003's walk (`tools/text-floor-probe.mjs` on origin/r43-textfloor, plus off-screen text): every visible text node, its font size times every
ancestor's scale. Every JPEG here is a re-encode of a PNG capture; the pixel comparisons were made on the PNGs.

## Side by side (target left, build right: [pairs/390x844/](pairs/390x844/); today | target | build: [side-by-side/](side-by-side/))

The five PREP-A frames as plain two-up pictures, the target on the left and the build on the right, each 390x844 (the target PNGs are 390x845):
[A-ffx-stats.jpg](pairs/390x844/A-ffx-stats.jpg), [A-ffx-equipment.jpg](pairs/390x844/A-ffx-equipment.jpg), [A-x2-stats.jpg](pairs/390x844/A-x2-stats.jpg), [A-x2-stats-scrolled.jpg](pairs/390x844/A-x2-stats-scrolled.jpg), [A-x2-accessories.jpg](pairs/390x844/A-x2-accessories.jpg).
The three-up frames below add origin/main as it is today on the left.

### Today | target | build

The target is the PREP-A frames of `critic/scratch/prep-phone-options-2026-10-12/` (Bailey picked PREP-A on 2026-10-12; the pick approves the layout). The mockup drew five frames; the other four tabs have no frame, so they are built in the same recipe
and shown today | build. All at 390x844 in [side-by-side/390x844/](side-by-side/390x844/):

- [A-ffx-stats.jpg](side-by-side/390x844/A-ffx-stats.jpg), [A-ffx-equipment.jpg](side-by-side/390x844/A-ffx-equipment.jpg), [A-x2-stats.jpg](side-by-side/390x844/A-x2-stats.jpg), [A-x2-stats-scrolled.jpg](side-by-side/390x844/A-x2-stats-scrolled.jpg), [A-x2-accessories.jpg](side-by-side/390x844/A-x2-accessories.jpg): the five PREP-A frames.
- [ffx-items.jpg](side-by-side/390x844/ffx-items.jpg), [ffx-overdrive.jpg](side-by-side/390x844/ffx-overdrive.jpg), [x2-dresspheres.jpg](side-by-side/390x844/x2-dresspheres.jpg), [x2-items.jpg](side-by-side/390x844/x2-items.jpg): the four with no frame.
- 430x932, today | build, for all eight tabs: [side-by-side/430x932/](side-by-side/430x932/).

## The text sweep (390x844)

| Game | Tab | Text elements today | Smallest today (px) | Under 14 px today | Text elements now | Smallest now (px) | Under 14 px now | Overprint / cut now | Page height / screen |
|---|---|---|---|---|---|---|---|---|---|
| FFX | Stats | 73 | 2.98 | 73 | 38 | 14 | 0 | 0 / 0 | 844 / 844 |
| FFX | Equipment | 56 | 2.98 | 56 | 34 | 14 | 0 | 0 / 0 | 844 / 844 |
| FFX | Items | 105 | 2.98 | 105 | 73 | 14 | 0 | 0 / 0 | 1408 / 844 |
| FFX | Overdrive | 54 | 2.98 | 54 | 27 | 14 | 0 | 0 / 0 | 844 / 844 |
| FFX-2 | Dresspheres | 63 | 2.98 | 63 | 42 | 14 | 0 | 0 / 0 | 844 / 844 |
| FFX-2 | Stats | 177 | 2.98 | 177 | 82 | 14 | 0 | 0 / 0 | 1138 / 844 |
| FFX-2 | Accessories | 43 | 2.98 | 43 | 32 | 14 | 0 | 0 / 0 | 844 / 844 |
| FFX-2 | Items | 54 | 2.98 | 54 | 37 | 14 | 0 | 0 / 0 | 844 / 844 |
| FFX | Chapter (unchanged) | 39 | 14 | 0 | 39 | 14 | 0 | 0 / 0 | 961 / 844 |
| FFX | Sphere Grid (unchanged) | 57 | 14 | 0 | 57 | 14 | 0 | 0 / 0 | 1131 / 844 |
| FFX-2 | Chapter (unchanged) | 38 | 14 | 0 | 38 | 14 | 0 | 0 / 0 | 961 / 844 |

"Overprint / cut" does not count text that scrolls under the pinned START BATTLE button or the MORE BELOW cue (the page is a scroller; the probe sees the whole page, not the screen). The three unchanged rows are the same
numbers as today: the Chapter pages' cue and the Sphere Grid's own legend read as overlapping because they scroll under the dock, on origin/main too.

## The text sweep (430x932)

| Game | Tab | Text elements today | Smallest today (px) | Under 14 px today | Text elements now | Smallest now (px) | Under 14 px now | Overprint / cut now | Page height / screen |
|---|---|---|---|---|---|---|---|---|---|
| FFX | Stats | 73 | 3.29 | 73 | 38 | 14 | 0 | 0 / 0 | 932 / 932 |
| FFX | Equipment | 56 | 3.29 | 56 | 34 | 14 | 0 | 0 / 0 | 932 / 932 |
| FFX | Items | 105 | 3.29 | 105 | 73 | 14 | 0 | 0 / 0 | 1408 / 932 |
| FFX | Overdrive | 54 | 3.29 | 54 | 27 | 14 | 0 | 0 / 0 | 932 / 932 |
| FFX-2 | Dresspheres | 63 | 3.29 | 63 | 42 | 14 | 0 | 0 / 0 | 932 / 932 |
| FFX-2 | Stats | 177 | 3.29 | 177 | 82 | 14 | 0 | 0 / 0 | 1138 / 932 |
| FFX-2 | Accessories | 43 | 3.29 | 43 | 32 | 14 | 0 | 0 / 0 | 932 / 932 |
| FFX-2 | Items | 54 | 3.29 | 54 | 37 | 14 | 0 | 0 / 0 | 932 / 932 |
| FFX | Chapter (unchanged) | 39 | 14 | 0 | 39 | 14 | 0 | 0 / 0 | 961 / 932 |
| FFX | Sphere Grid (unchanged) | 57 | 14 | 0 | 57 | 14 | 0 | 0 / 0 | 1131 / 932 |
| FFX-2 | Chapter (unchanged) | 38 | 14 | 0 | 38 | 14 | 0 | 0 / 0 | 941 / 932 |

## Every function by touch and by keys

55 of 55 checks pass at 390x844 and 55 of 55 at 430x932 (`scripts/proof-input.mjs`); the 390x844 list:

**FFX**

- pass: tab stats: a tap opens it, with its phone page ({"tab":"stats","phone":"page","hosts":1})
- pass: tab equipment: a tap opens it, with its phone page ({"tab":"equipment","phone":"page","hosts":1})
- pass: tab items: a tap opens it, with its phone page ({"tab":"items","phone":"page","hosts":1})
- pass: tab overdrive: a tap opens it, with its phone page ({"tab":"overdrive","phone":"page","hosts":1})
- pass: faces: a tap on each of the 7 selects that member, the page names her, and the section left open stays open (0:Tidus 1:Yuna 2:Kimahri 3:Auron 4:Wakka 5:Lulu 6:Rikku)
- pass: faces: every number on the phone page equals the one on the board for each member (labels ten stats)
- pass: Stats DEFENSE (folded): one tap on the header opens the section (open false -> true, aria=true, body shown=true, digest shown=false)
- pass: Stats DEFENSE (folded): a second tap puts it back (open true -> false)
- pass: Stats HP · MP (open): one tap on the header folds the section (open true -> false, aria=false, body shown=false, digest shown=true)
- pass: Stats HP · MP (open): a second tap puts it back (open false -> true)
- pass: Stats: a tap on the ivory body of an open section leaves it open
- pass: tab strip: a touch swipe along it scrolls the tabs sideways (scrollLeft 0 -> 275 (width 802 in 390))
- pass: tab strip: the last tab (overdrive) is reachable by touch after the swipe
- pass: Overdrive: a tap equips stoic (was warrior); the EQUIPPED tag, the board's row and the digest agree ({"phone":["stoic"],"tag":"EQUIPPED","board":["stoic"],"digest":"Stoic equipped"})
- pass: Overdrive: the chosen mode is still equipped after another face and back (["stoic"])
- pass: page: a touch drag scrolls the items page and the strip and faces stay pinned ({"top":327,"scrolled":true,"strip":0,"roster":45})
- pass: page: a tap on a pinned face works while the page is scrolled (selected 1 (Yuna))
- pass: page: a drag back to the top clears the pinned bar's ground ({"top":0,"scrolled":false})
- pass: keys: Down and Up walk the party, and the phone page follows (0 -> 1 -> 0)
- pass: keys: Right and Left walk the tabs (stats -> sphere-grid -> stats)
- pass: keys: Tab (Triangle) opens every folded section, and once none is folded it folds them all (2 open of 4 -> 4 -> 0)
- pass: keys: PageDown pages the items page (a screen of its own content, or to its end) and PageUp pages it back; the browser does not scroll it a second time (scrollTop 0 -> 564 -> 0 (max 564))
- pass: keys: Esc leaves the prep screen (back to the chapter board) (screen=chapter-select)
- pass: no page errors
- pass: START BATTLE (a touch tap on the pinned button, from the equipment page) begins the fight (screen party-prep -> cutscene in 403 ms)

**FFX-2**

- pass: tab dresspheres: a tap opens it, with its phone page ({"tab":"dresspheres","phone":"page","hosts":1})
- pass: tab stats: a tap opens it, with its phone page ({"tab":"stats","phone":"page","hosts":1})
- pass: tab accessories: a tap opens it, with its phone page ({"tab":"accessories","phone":"page","hosts":1})
- pass: tab items: a tap opens it, with its phone page ({"tab":"items","phone":"page","hosts":1})
- pass: faces: a tap on each of the 3 selects that member, the page names her, and the section left open stays open (0:Yuna 1:Rikku 2:Paine)
- pass: faces: every number on the phone page equals the one on the board for each member (labels ten stats)
- pass: Stats GUNNER (folded): one tap on the header opens the section (open false -> true, aria=true, body shown=true, digest shown=false)
- pass: Stats GUNNER (folded): a second tap puts it back (open true -> false)
- pass: Stats WORN (open): one tap on the header folds the section (open true -> false, aria=false, body shown=false, digest shown=true)
- pass: Stats WORN (open): a second tap puts it back (open false -> true)
- pass: Dresspheres GARMENT GRID (folded): one tap on the header opens the section (open false -> true, aria=true, body shown=true, digest shown=false)
- pass: Dresspheres GARMENT GRID (folded): a second tap puts it back (open true -> false)
- pass: Dresspheres ALSO OWNED (folded): one tap on the header opens the section (open false -> true, aria=true, body shown=true, digest shown=false)
- pass: Dresspheres ALSO OWNED (folded): a second tap puts it back (open true -> false)
- pass: Dresspheres LEARNED (open): one tap on the header folds the section (open true -> false, aria=false, body shown=false, digest shown=true)
- pass: Dresspheres LEARNED (open): a second tap puts it back (open false -> true)
- pass: Accessories SLOT 1 (open): one tap on the header folds the section (open true -> false, aria=false, body shown=false, digest shown=true)
- pass: Accessories SLOT 1 (open): a second tap puts it back (open false -> true)
- pass: tab strip: a touch swipe along it scrolls the tabs sideways (scrollLeft 95 -> 328 (width 718 in 390))
- pass: tab strip: the last tab (items) is reachable by touch after the swipe
- pass: page: a touch drag scrolls the stats page and the strip and faces stay pinned ({"top":294,"scrolled":true,"strip":0,"roster":45})
- pass: page: a tap on a pinned face works while the page is scrolled (selected 1 (Rikku))
- pass: page: a drag back to the top clears the pinned bar's ground ({"top":0,"scrolled":false})
- pass: keys: Down and Up walk the party, and the phone page follows (0 -> 1 -> 0)
- pass: keys: Right and Left walk the tabs (stats -> accessories -> stats)
- pass: keys: Tab (Triangle) opens every folded section, and once none is folded it folds them all (1 open of 10 -> 10 -> 0)
- pass: keys: PageDown pages the stats page (a screen of its own content, or to its end) and PageUp pages it back; the browser does not scroll it a second time (scrollTop 0 -> 618 -> 0 (max 2166))
- pass: keys: Esc leaves the prep screen (back to the chapter board) (screen=chapter-select)
- pass: no page errors
- pass: START BATTLE (a touch tap on the pinned button, from the accessories page) begins the fight (screen party-prep -> cutscene in 404 ms)

Layout checks per tab (`scripts/proof-shots.mjs`): 98 of 98 at 390x844, 98 of 98 at 430x932: opened by a tap, the stacked page on and the two own pages off, no text under 14 px, no sideways scroll, no overprint or cut text, sections 12 px in from each edge
(366 px at 390), the strip 45 px and the faces 65 px under it, a touch drag scrolls to the end with the strip and faces pinned on a solid ground, the last row ends above START BATTLE, MORE BELOW at the top and gone at the end, START BATTLE
uncovered and 44 px or taller, no page errors.

## Desktop is unchanged

Pixel comparison of the PNG captures (every tab of both games, the first member and the third), origin/main against this build, same machine, same art:

| Window | Result | Differs |
|---|---|---|
| 1600x900 (the brief) | 18 of 19 identical | seymour-flux-02-sphere-grid-m0.png (3055 px, bbox [315,502,660,652]) |
| 1280x720 | 18 of 19 identical | seymour-flux-02-sphere-grid-m0.png (1585 px, bbox [252,402,527,521]) |
| 600x900 (the first width that is not a phone) | 18 of 19 identical | seymour-flux-02-sphere-grid-m0.png (826 px, bbox [117,469,247,525]) |
| 1600x900 control: origin/main against itself | 18 of 19 identical | seymour-flux-02-sphere-grid-m0.png (3080 px, bbox [315,502,660,652]) |
| 1600x900 control: this build against itself | 18 of 19 identical | seymour-flux-02-sphere-grid-m0.png (3410 px, bbox [315,502,660,652]) |
| 390x844 phone: Chapter and Sphere Grid, origin/main against this build | 2 of 3 identical | seymour-flux-02-sphere-grid.png (1355 px, bbox [30,333,278,441]) |
| 430x932 phone: Chapter and Sphere Grid, origin/main against this build | 2 of 3 identical | seymour-flux-02-sphere-grid.png (1060 px, bbox [30,331,278,439]) |
| 390x844 phone control: Chapter and Sphere Grid, origin/main against itself | 2 of 3 identical | seymour-flux-02-sphere-grid.png (1668 px, bbox [30,333,278,441]) |

The one capture that differs is the Sphere Grid tab, and it differs the same way between two runs of the same build, on the desktop and on the phone (a marching-ants route preview and a pulsing node: bounding box about x 315 to 660, y 502 to 652 at 1600x900,
x 30 to 278, y 333 to 441 on the phone, the same box in the origin/main-against-itself control): it is that tab's own animation, not this change. The Chapter pages are pixel-identical at the phone. The first sub-agent's earlier pair had also shown a difference of at most 2 levels in a 1112 x 76 px band of the FFX-2 Items capture; it did not reproduce in either fresh pair against the pristine export (that tab is identical in both). [identity.json](identity.json) has every file with the SHA-256 of its pixels. The desktop pairs (before = origin/main, after = this build) are in [desktop/1600x900/](desktop/1600x900/).
`scripts/proof-desktop-input.mjs` on the final code at 1600x900: 18 of 18 checks (a mouse click on every heavy tab and on a roster row, Up, Esc; the phone page is never shown; the hidden phone page follows the Overdrive board's `click()`). Not part of the count and unchanged from origin/main: a real mouse click on a desktop Overdrive mode row does nothing there (the rows inherit `pointer-events: none`); the log line says so.

The colour commit (`98bcc847`) was desktop-checked again by an independent pair of captures taken before it, on the code of `5a780295` (origin/main against the build: 18 of 19 identical at 1600x900, only the Sphere Grid's own animation differing). Its own 1280x720 capture read 16 of 19 on a first run, a difference of at most 2 levels
(of 255) on the FFX Stats capture, in the soft shadow under the sheet; a second run of the same code read 18 of 19 like the origin/main pair, and the table above is that run: GPU shadow noise between launches, not a layout change (the commit changes custom properties inside the phone query only). The 430x932 input proof crashed once
at its very end (the page closed under it, after 54 passing checks) and read 55 of 55 on a second run.

## Other widths and engines

- 599x900 (the last phone width): 365 text elements on the eight tabs, smallest 14 px, 0 under 14 px; 98 of 98 checks.
- 360x740: 367 text elements on the eight tabs, smallest 14 px, 0 under 14 px; 104 of 104 checks.
- 320x640 (the narrowest checked: the seven heads shrink to 35 px, the girls' names set at 16 px): 369 text elements on the eight tabs, smallest 14 px, 0 under 14 px; 109 of 110 checks. The one check that does not pass is the unchanged Sphere Grid page running past the window at 320 (348 px of content in 320 here, 348 px of content in 320 on origin/main); it is not part of this change.
- WebKit (Playwright's Safari engine, 390x844, layout and sweep; no touch drags there): 64 of 64 checks.
- The Sphere Grid tab by touch (`scripts/proof-sphere.mjs`: open it, zoom with +, CENTRE, a tap on one of its own heads, START BATTLE uncovered, no errors): 6 of 6 checks on this branch and 6 of 6 checks on origin/main.

## Where the build differs from the target

See the handoff's list ([docs/handoff/r43-prepphone.md](../../handoff/r43-prepphone.md), "Where the build differs from the PREP-A target"). In short: the four shades the tokens lack are the nearest tokens (the small accent text on ivory is `--ig-accent-deep`, 3.4:1 against the page's 5.4:1; the up and down counts on a dark plate are ivory); the section plate is the token (0.84, not 0.90) and the stuck bar's ground is the
Chapter page's; the seven heads are about 45 px (not 46) because they share the row; START BATTLE is within 1 px of the frames'; the scrolled frame rests 3 px short of the target's offset (227, not 230); four tabs have no frame to match.

## Folders

`pairs/390x844/` (the five PREP-A frames, target left and build right), `side-by-side/` (today | target | build), `now/390x844/`, `now/430x932/` (this build: every tab, and the end of each long page; not called `build/` because .gitignore ignores that name), `today/` (origin/main), `target/` (the five PREP-A frames), `webkit/`, `small/` (320 and 360 wide), `desktop/1600x900/{before,after}/`,
`identity.json`, `summary.json` (every sweep and every check), `scripts/` (the Playwright scripts, with a README).
