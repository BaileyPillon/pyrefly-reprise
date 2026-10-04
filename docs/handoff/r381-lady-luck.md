# r381-lady-luck: Lady Luck in the FFX-2 Garment Grids with the recommended swaps, checked by real keys, and what her paintings cost in room

**Branch:** `r381-lady-luck` (from `origin/r38-lady-luck-grid` 68cc4153, merged with `origin/main` 12075232 = release 38 live plus the
Camera Lab note; pushed, **never merged into main, never deployed**: Bailey has not answered the morning-page question (c), "Lady Luck
with the recommended swaps"). **Game case: FFX-2 only.** Lady Luck is an X-2 dressphere; the grids, the reels and the HUD layer are FFX-2
data and UI; nothing under `src/battle/ffx`, `src/data/ffx` or the FFX HUD changed. **critic-plan class:** focused review before
deploy, deep review after (shared FFX-2 HUD and data), **not the save-data class** (no `SaveData`, schema, migration or setting).
**Not done here, by the brief:** her 90 paintings are **not installed** (`public/art` is the shared, gitignored tree; they live at
`D:/Tools/pyrefly-art-backup/candidates/2026-10-03-day/lady-luck/install-ready/`); every browser check below served them from a
dev-only overlay of a scratch server, nothing was written under `public/art`.

Earlier notes for this lane: [r38-lady-luck-grid.md](r38-lady-luck-grid.md) (the build), `research/ffx2-lady-luck-availability.md` (the
sourcing and the swaps, section 3), the independent check `D:/Tools/pyrefly-scratch/2026-10-04/checks-b/check-ll.md`.

## The final swap table (worn dressphere on node 0; the ring's neighbours of node 0 are node 1 and the last node)

| Chapters | Yuna | Rikku | Paine |
|---|---|---|---|
| V, XI, XV (`farplane.ts`) | White Mage, Gunner, Thief, Warrior, **Lady Luck** (Black Mage off) | Dark Knight, Gunner, Thief, Warrior, **Lady Luck** (Black Mage off) | Dark Knight, Gunner, Thief, Warrior, **Lady Luck** (node 4), **White Mage** (node 5, kept; Black Mage off). Lady Luck is two Changes away |
| XIII (`via-infinito.ts`), as built | Dark Knight, White Mage, Gunner, Thief, **Lady Luck** (Warrior off) | Alchemist, Gunner, Thief, Warrior, **Lady Luck** (Songstress off) | Dark Knight, Warrior, Gunner, Thief, **Lady Luck** (Songstress off) |
| XVI (`djose.ts`) | White Mage, **Lady Luck** (node 1), Thief, Warrior, Black Mage (Gunner off) | Dark Knight, **Lady Luck** (node 1), Thief, Warrior, Black Mage (Gunner off) | Dark Knight, **Lady Luck** (node 1), Thief, Warrior (Gunner off) |
| IV, VI | nothing (Chapter 2 story points; no source lets the girls own her) | | |

Why (sources and the `[estimate]` labels are in the research note, section 3): Paine's Farplane ring keeps White Mage because the
Chapter V guide page (Jegged, Heart of the Farplane, Core and Bulwarks) names a White Mage to swap in before Memento Mori and hers is the
one ring where a Dark Knight has one a Change away; Yuna and Rikku at Djose give up Gunner, not Black Mage, because the Chapter XVI page
says Water hurts Ixion and Watera and Waterga are the Black Mage's. Where she sits is ours (no source says what a girl sets on a grid).

## Numbers (the builder's harness, run again from this tip; `D:/Tools/pyrefly-scratch/2026-10-04/r381-prep/measure/`)

- **The autopilot's line is untouched.** `intendedStrategy` over each chapter's own build and link chain, Wait, seeds 1 to 200, sha256 of
  every link's event log over **all 200 seeds**, origin/main 12075232 against this tip: **identical in all seven FFX-2 chapters**:
  IV 200/200 `10be3653d65ace71`; V 188/200 `a2bdf7ce055958dd`; VI 198/200 `2c17fadc43601d6b`; XI 174/200 `0e47b91402fcb4f1` (427
  spherechanges); XIII 14/200 `9aebd9f707d6cd9c` (6,117); XV 111/200 `c5e43cb264008c79`; XVI 197/200 `545d43dfeae497c5` (0). XVI has
  zero spherechange events in 200 seeds, so the node-1 placement there is read by nothing the autopilot does.
- **Party prep** (dresspheres owned, "also owned" chips): identical in IV, V, VI, XI, XIII, XV; **XVI +1 per girl** (Yuna and Rikku 11 to 12,
  Paine 10 to 11; she was not owned there on main). Nodes as in the table.
- `tests/unit/ffx2-lady-luck-grid.test.ts` rewritten for the swaps (17 tests); full suite below.

## The real-key check (headless Chromium, `PYREFLY_BROWSER=gpu`, keyboard only; the debug API starts a chapter and reads the log)

Served: a production build of this tip (`vite build`, 1,288 modules) on a scratch static server with the dev-only Lady Luck overlay
(the three girls' paintings, the picks of D-363). Driver: the checks-b `ll-run.mjs` extended (two-Change route for Paine, a silenced
caster's Item row, a numeral probe). Frames: `docs/screenshots/r381-lady-luck/`.

| Check | Result |
|---|---|
| **Ch V Change menus** | Yuna: Gunner, **Lady Luck**. Rikku: Gunner, **Lady Luck**. Paine: Gunner, **White Mage** (no Lady Luck in the first menu, as the table says). Read by real keys, Wait. |
| **Ch XI, XV** (same preset) | The same three menus. |
| **Paine's second Change** (V, XV) | Change to White Mage, then her next menu offers **Lady Luck, Dark Knight**; Change to Lady Luck; Skill shows Attack Reels and Magic Reels; the reels open and stop on three Enters. XV ran four times through both Changes to the reels; V reached Lady Luck by the second Change in two runs, and neither reached the reels inside its time limit (Vegnagun's fight is slow and Paine's turn came late): not a defect found. Frame `xv-paine-second-change-lady-luck`. |
| **Ch XVI Change menus** | Yuna: **Lady Luck**, Black Mage. Rikku: **Lady Luck**, Black Mage. Paine: **Lady Luck**, Warrior. Lady Luck is the first row. Each changed into her by one Change, Attack Reels or Magic Reels thrown. |
| **Ch XIII** | Yuna: White Mage, Lady Luck. Rikku: Gunner, Lady Luck. Paine: Warrior, Lady Luck (as built). |
| **Ch IV, VI** | No Lady Luck for any girl (IV Paine's Change row is Cursed in that fight). |
| **Reels, Wait ATB** | V Yuna (attack), XVI Yuna (attack), Rikku (magic), Paine (attack), XV Paine (magic, after two Changes), XI Rikku and XIII Yuna (numeral runs). Every run: the overlay opens inside the viewport, **nothing paints over it** (occluded list empty at three samples), the guide and the intent card are under it (the minigame layer is z 15, `.ffx2hud > .ffx2hud__minigame`, from release 38's `minigames.css`), three Enters stop three reels. |
| **Reels, Active ATB** (chip "ACTIVE - ATB RUNNING", setting read back) | V Rikku (attack) and XVI Yuna (magic): changed into Lady Luck, reels thrown, nothing over the overlay. |
| **Phone 390x844, by keys under touch emulation** (`data-phone-battle` set) | V Yuna, XI Rikku, XIII Yuna, XV Yuna, XVI Rikku: the slab opens at the top left (x 11.6 to 358, y 56 to 181), inside the viewport, nothing over it. The reel labels read 14.2 px (release 38's floor). |

### Can a damage numeral rise into the reels on the phone? Answer: it can come within about 3 px of the slab; it never reaches a reel, and it paints under the slab

Method: with the reels open, a real `damage` event (a critical, 99,999, the worst case in size) is pushed through the HUD's own path
(`battlePresenter.deps.hud.onEvent`; display only, the engine is untouched) onto every combatant, and the visible numeral is sampled
every ~40 ms for 2.6 s: its rect, its gap to the slab's bottom edge, the overlap with the slab, the three reel cells and the DUD line,
and which of the two paints on top at its centre (`elementsFromPoint`). First links only (the reels open there); the party's own
numerals sit at y 250 to 340, far below the slab.

| Chapter (390x844) | The boss's numeral at its apex | Gap to the slab's bottom edge | Overlap with the slab, the three reel cells, the DUD line |
|---|---|---|---|
| V Vegnagun (tail) | y 184.6 | **3.4 px** (an earlier 8,888 sample overlapped the slab's bounding box by 74 px2, 1.4 px, at the same spot) | 0, 0, 0 on the critic-size numeral |
| XIII Paragon | y 193.9 | 12.7 px | 0, 0, 0 |
| XI x2-Shiva | y 198.1 | 16.9 px | 0, 0, 0 |
| XVI Ixion | y 199.9 | 18.7 px | 0, 0, 0 |
| XV Baralai's shade | y 212.0 | 30.8 px | 0, 0, 0 |

The numeral layer is z 6 and the minigame layer z 15 in the same stacking context, so where they ever touch **the slab is on top**; the
reels and the DUD line stay readable (frame `phone-v-numeral-99999-under-reels-390x844`: the numeral sits just under the slab's lower edge; `phone-xiii-numeral-near-reels`).
Desktop 1600x900 (V, XVI): the numerals clear the slab by 28 to 258 px (the boss stands to the right of it). So **no fix is needed**; the
tightest case is V's first link on a phone. Not covered: V's later links (leg, head, body, Shuyin) and Paragon's other forms, whose
boss positions differ; the reels cannot be opened there without playing through the earlier links. The `DamageLayer` panel-avoid list
(`PANEL_SELECTORS`) does not include the slab, so if a later boss stands higher a numeral could cross it; it would still paint under it.

### Driver defects found (not game defects; the numbers above were taken after they were fixed)

1. A **silenced** Yuna (Baralai's Silence in XV) shows a disabled first row; an Enter on it does nothing, and the driver stalled on it.
   A player takes Item or Change; the driver now does.
2. An extra Enter at the end of one girl's turn can land on the next girl's menu and open a target step on her Attack; the driver now
   backs out with one Escape (two Escapes open the pause screen). The two older "Paine's Change ran late in XV" reports (the independent check's and mine) were
   both driver stalls of kind 1; the game executed every Change it was given.

## ROOM: her paintings against the 800,000,000-byte line (while on GitHub Pages)

Release 38 is **797,953,690** bytes as the deploy counts it, **2,046,310 under the line**. Her package is 14,896,702 raw bytes, 90 files
(45 paintings and 45 sidecars); as it would ship (lossless WebP where every decoder draws it the same, a recompressed PNG elsewhere, plus the
manifest entries) the whole package is **12,558,482**, so about **10.5 MB must be freed** (11.5 MB to keep the install note's 1,000,000-byte
margin). The held 2x masters are `idle@2x` paintings (`art-install-2026-10-04.md`, step 7); parking one means that figure's idle falls back
to its 1x painting on a 2x or 3x display and nothing else changes (its other poses are 1x already). Bytes are measured
(`D:/Tools/pyrefly-scratch/2026-10-04/r381-prep/measure/room.json`, `room2.mjs` beside this lane's scratch): shipped image + sidecar + manifest entries.

Where each master's figure is the one on screen (party members' first dressphere and the first formation's enemies, from the chapter data):

| Master | Freed (bytes) | Chapters where its figure is drawn |
|---|---|---|
| Seymour Omnis | 6,132,344 | XII |
| Mortiorchis | 5,247,853 | I (Seymour Flux's second form) |
| Rikku (FFX) | 3,941,342 | I, II, III, VII, VIII, IX, X, XII, XVII, XVIII |
| Tidus | 4,110,911 | I, II, III, VII to X, XII, XVII, XVIII |
| Yuna (FFX) | 4,073,430 | I, II, III, VII, IX, X, XII, XIV, XVII, XVIII |
| Auron / Lulu / Wakka | 4,663,149 / 2,813,164 / 4,387,125 | I, II, III, VII, VIII, IX, X, XII, XVII, XVIII |
| Seymour at Macalania / Guado Guardian | 4,601,267 / 4,415,434 | VII |
| Seymour Flux | 4,466,708 | I |
| Seymour Natus | 4,529,394 | X |
| x2-Shiva | 4,266,823 | XI |
| Isaaru | 4,125,107 | XIV |
| Yojimbo | 3,950,669 | IX |
| Mortiphasm | 2,884,571 | XII |
| Baralai's shade | 2,169,002 | XV |
| Yu Pagoda | 2,111,954 | III |
| Yuna White Mage | 3,082,949 | IV, V, XI, XV, XVI |
| Paine Dark Knight | 4,022,531 | V, XI, XIII, XV, XVI |
| Yuna Dark Knight / Rikku Alchemist | 3,607,598 / 3,329,479 | XIII |
| Yuna Gunner / Rikku Thief | 2,897,685 / 3,672,923 | VI (Yuna's Gunner also whenever she Changes to it: the first Change row in V, XI, XV) |
| Paine Warrior | 2,402,814 | IV, VI |

**The smallest sets** (fewest masters, then the fewest chapters touched, then the fewest bytes over; each keeps at least 1,000,000 bytes of margin):

| What she ships | Cost | Park | Freed | Headroom after | Chapters that lose 2x sharpness |
|---|---|---|---|---|---|
| **A** idle only (3 paintings) | 808,647 | nothing | 0 | 1,237,663 | none |
| **B** idle + seven keys (24 paintings) | 5,953,838 | Mortiorchis | 5,247,853 | 1,340,325 | I (the second form's idle only) |
| **C** B + follow-through (27) | 6,682,538 | Seymour Omnis | 6,132,344 | 1,496,116 | XII (the boss's idle) |
| C, no FFX boss touched | 6,682,538 | Yuna Gunner + Rikku Thief | 6,570,608 | 1,934,380 | VI |
| **D** C + the four twirl keys (39) | 10,229,097 | Seymour Flux + Mortiorchis | 9,714,561 | 1,531,774 | I (both of Chapter I's bosses) |
| **E** everything (45 paintings) | 12,558,482 | **Seymour at Macalania + Yuna Dark Knight + Rikku Alchemist** | 11,538,344 | 1,026,172 | VII (the boss), XIII (two girls) |
| E | | Mortiorchis + Yuna Gunner + Rikku Thief | 11,818,461 | 1,306,289 | I (second form), VI (two girls) |
| E | | Seymour Flux + Mortiorchis + Yu Pagoda | 11,826,515 | 1,314,343 | I (both forms), III (the two Pagodas) |
| E, the install note's tail (D-315's last four) | 12,558,482 | Paine Dark Knight + Rikku Thief + Paine Warrior + Rikku Alchemist | 13,427,747 | 2,915,575 | V, XI, XIII, XV, XVI (Paine), VI, IV: **seven FFX-2 chapters**, the ones she is in |

The fewest-masters answer for E is two (Seymour Omnis + Wakka frees 10,519,469) but leaves 7,297 bytes of headroom and costs the widest
FFX chapters Wakka is in, so it is not offered. **Recommendation:** ship **B or C** now (one master parked, one chapter touched, her idle
and her seven working poses, which is what a player sees in the reels), and the rest with the Cloudflare move: the
Cloudflare Pages option (morning-page question (l); no total cap) removes the line and nothing needs parking. If Bailey wants all 45 now,
**E with Mortiorchis + Yuna Gunner + Rikku Thief** touches two chapters and keeps 1.3 MB of margin. Parking is a move to
`held-2x/` and a manifest regenerate (`node tools/gen/manifest.mjs`), reversible; nothing is parked by this lane.

## Gates

`npx tsc --noEmit` clean (TS 7.0.2); `tests/unit/ffx2-lady-luck-grid.test.ts` 17 pass; the **full suite** (`--maxWorkers=3 --testTimeout=60000`, the two
untracked `zz-tmp-r381-*.test.ts` harness files excluded): **800 files passed, 5 skipped (805); 11,773 tests passed, 46 skipped, 1 todo; 0 failed**, 2,051 s;
`node tools/orphans.mjs`: no new orphan (this lane adds no module). Servers started: a static server on 7071, stopped at the end.

## Not run

Item Reels and Random Reels (not shipped); the later links of V and Paragon's other forms for the numeral question; real taps on the phone
(keys under touch emulation, as the independent check did); each of her 45 painted poses frame by frame (they load, HTTP 200, the check's
earlier 2,028 requests plus this lane's).
