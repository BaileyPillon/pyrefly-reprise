# Paper preflight: r38-evrae, Evrae re-staged to E1-H (Chapter VIII, FFX only)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15). Written 2026-10-03 by the r38-evrae lane (a Sonnet sub-agent of the driver), **after the numbers below were
read in the running build** (the brief arrived as a build order; the preflight records what the build then had to answer). **Verdict: PROCEED.**

## Game case (rule 14): FFX only
Evrae is Chapter VIII's boss (`evrae-airship`); the airship range mechanic "has no X-2 counterpart" (`research/ffx-evrae-airship.md` §0.4). Where FFX puts the fiend on screen
is `[absence]` in `research/battle-camera-perspectives.md` (our slots are `[ours]`), and FFX has fixed formations, so moving a slot or repainting the fiend changes the picture,
never a rule. Decision: D-360 (Bailey, 2026-10-03 ~16:25 EDT, "I'll go with all your recommendations", the driver's recommendation E1-H). Nothing here is read by an FFX-2 chapter.
**Chapters XVII and XVIII (Sin, FFX)** share the deck scene and its slot object (`EVRAE_AIRSHIP_DECK_SLOTS`): they must not move. They do not: the generic enemy slot table keeps
its pre-E1-H point, and the pin names only `evrae` and `cid`.

## What changes
- **Art (candidates only, no write under `public/art`):** the E1-H idle set (idle, idle-near twin, idle@2x) plus every installed Evrae key re-derived to its geometry (attack, hurt,
  breath-charge; ko is never drawn; cast is not installed): `D:/Tools/pyrefly-art-backup/candidates/2026-10-03-day/evrae-restage/install-ready/` (manifest.json inside).
- **Code (`src/scenes/evrae-airship-range.ts`, `evrae-airship-deck.ts`):** `RANGE_STAGING.near.evrae` x moves to the resolved centre it had plus 0.9743 world, and the deck pins
  Evrae and Cid on that spot (`SceneSlots.enemySpots`). No new settings key, no new switch, no type change.
- **Tests:** `evrae-e1h-slot.test.ts` (new), `evrae-deck-hold-party.test.ts` and `evrae-scene.test.ts` (their old assumptions: no pin; the 1171 px canvas; the 0.79 planning rail).

## The one thing the build had to answer first: what is "today's" spot?
The mockup round (`candidates/2026-10-03-day/evrae-restage/README.md`) said "slot x +0.97" and pinned at "today's resolved spot (x 3.02)". On this base the data spot is 2.3, and the
plane's centre in the running build is **3.018** at all four sizes: Evrae's wide idle counts as prone by its shape, so `ProneLay` slid its plane 0.718 right along the floor, and a
**pinned** figure is never slid (`layProneFigures(.., pinned)`). So the pin has to carry that slide: 3.018 + 0.9743 = **3.9923**, not 2.3 + 0.9743. Pinning at 3.2743 (read first, then
measured: the head lands 0.68 world left of today's and the rest gap stays at -281) is the trap. Both numbers are constants with their reasons next to them.

## Acceptance cases (measured in the running build, headless GPU Chromium, real keys, seed 1, first menu)
| Case | Target | How |
|---|---|---|
| Rest gap at 1600x900, 2000x1012, 2560x1440, 2560x1080 | >= 1 (nobody inside the coil) | the repo's `restGap` (`fx/mix/plate.ts`), live = the same worktree serving the two edited files as on origin/main |
| Tidus / Rikku box covered by the painted figure | live 27 % / 56 % -> ~1 % / 0 % | the painting's alpha projected through the recorded plane corners |
| The head stays | within a few px of today | snout position, world and screen |
| Colossus / framing rules elsewhere | unchanged | the mix framing report (class, plans, lens) live vs branch |
| HUD clear | no visible painted pixel under a panel; the coil's right edge short of the turn rail | panels from `hudPanels`, mask above the deck edge |
| Phone 390x844 | party whole, head and neck on screen, no plate edge or void | first-menu still, live and branch |
| FAR swap and back | Evrae at the FAR spot, then on the pin again | the director, unit test and a browser flip |
| First turn | the poses play over the new geometry | one clip |

## Risks and what answers them
1. **The slot value is only right with the E1-H canvas.** The branch must land in the same release as the art install (the manifest says so); `evrae-e1h-slot.test.ts` checks the
   installed canvas against the numbers once the art is E1-H, and skips on the older art (public/art is gitignored).
2. **The generated parts:** the 165 px neck pipe (idle: mockup cand-2; attack: a new masked SDXL repaint) is the one place any pixel is invented; hurt, breath-charge and cast are
   pure pixel derives from the E1-H idle (each approved call was first reproduced to 0 differing pixels on the approved idle).
3. **The 800 MB line:** the package is 1.26 MB smaller than what it replaces.
4. **Locked art:** six approved-hashes entries change (manifest lists old and new sha256); the installer re-locks them, this branch does not touch `docs/target/approved-hashes.json`.
5. **Not covered:** FAR's own painting (`idle-far`, unchanged), a real defeat on the new hurt (Evrae's `ko` points at `hurt`, D-031), the advisor card's behaviour next to the longer figure.

## Evidence that stays reusable
The mockup round's frames, numbers and sheets (candidates/2026-10-03-day/evrae-restage/) for E1-H; its E1-H idle pair is this package's idle, byte for pixel (re-saved lossless).

## Repair preflight (2026-10-04): the critic's check of `3b709a4f` FAILED on B1 and B2

Written by the repair cycle (a Sonnet sub-agent of the driver) after the causes were measured (the checker's tables and the instrumented runs named below) and before the final proof run; the handoff's Repair section holds that proof. **Verdict: PROCEED.**

**Game case (rule 14): FFX only.** Chapter VIII's Evrae. The new stage reads (`src/scenes/evrae-airship-aspect.ts`) are applied by the range director only when it binds Evrae's own fight (`id === 'evrae'` with an actor), never to Sin's Fins (Chapter XVII), never to Chapter XVIII's face (no foe bound), never on the phone, never by an FFX-2 chapter. The one shared-engine line, a filter in `ShotRules.fitPhone` for an actor whose `userData.phoneFit === false`, is inert for every other figure of both games: only Evrae's director sets it.

**What the two blockers are made of (measured, not guessed).**
- **B1:** a slot move cannot fix the narrow windows. On the 1600x900 masks of the checked build the whole figure may move 20 to 40 px left before it touches the party (Rikku's painted pixels under it: 0.01 % at 20 px, 1.4 % at 40, 7.5 % at 60, 19.5 % at 80); 16:10 needs about 80 px of room and 4:3 about 150. The lever left is the camera: below 16:9 the NEAR rigs stand back along their own view line until the coil stands where it does at 16:9 in the window's width (Hor+, sized for the coil's depth), the house answer to a frame too narrow for its fight (the phone's A-12 refit). The alternatives were measured: a widened field of view puts the plate's edge in the corner (0.9 % of the frame at 16:10, 3.4 % at 4:3, the mix's plate gate); a smaller Evrae changes the one scale D-360 fixes.
- **B2:** the phone's A-12 refit includes every enemy narrower than the slice at the tried distance. The checked figure is 0.74 of the render wide against a slice room of 0.776, so it joined the fit and pulled the camera back until party and coil fitted one slice (k 1.43, z 14.78). The old figure measures 0.771 to 0.779, within 0.005 of the room: left out on the real site (z 9.40 in 7 of 7 loads at 390x844), in at origin/main built locally (z 12.91). The fix is a flag on the actor, read by the refit.
- **ProneLay's +0.70 or -0.70:** an ordering race, not the base path or the seed (below, in the handoff): the choice is made once, on the first frame the wide idle is on screen, from whichever figures the concurrent staging has produced by then.

**Acceptance cases** (the production build served under the live base path `/pyrefly-reprise/`, the package over `public/art` by a dev-only overlay, headless GPU Chromium, real keys, seeds 1 to 3, menus 1 to 3, against the real live site and origin/main):

| Case | Target |
|---|---|
| B1 at 1280x800, 1440x900, 1680x1050, 1024x768, 1600x900, 2000x1012, 2560x1440, 2560x1080 | no visible coil pixel inside the turn rail's rect at menus 1 to 3 |
| B2 at 390x844 and 360x780 | camera z 9.40 and the party as live's (Tidus 161 px at 390x844) |
| Kept | rest gap 1 at the first menu, painted overlap about 1 % or less, poses, FAR swap, Chapters XVII and XVIII unchanged, package verifies |
| ProneLay | the pinned placement identical on localhost at `/`, under `/pyrefly-reprise/`, and on the real live origin |

**Risks.** The party is smaller below 16:9 (the price of the camera lever, reported with numbers; a smaller Evrae is the alternative for Bailey to pick). The MAX mix keeps its own lens policy (a 4 % shift of the width at one of the first menus): the trim and the stand-back margin are sized to leave the coil clear of it, and where they cannot (a few px at one size) the table says so. The repo's rest gap at menu 3 is a coarse 6x8 cell count against a KO'd Tidus's lying box and the figure's hidden strip below the deck line; any left shift moves it across its threshold while the visible painted overlap stays 0.0 %.
