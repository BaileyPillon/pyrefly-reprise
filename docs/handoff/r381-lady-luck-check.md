# r381-lady-luck: independent check (verdict PASS, one minor to tidy, none blocking)

**Checked:** `origin/r381-lady-luck` tip `550bf40e` (code identical to `bba4ec41`; the two later commits are docs and frames), by an agent that did not build it.
**Game case: FFX-2 only** (Lady Luck, the Garment Grid data and the FFX-2 HUD layer; nothing under `src/battle/ffx`, `src/data/ffx` or the FFX HUD changed).
**Nothing merged, nothing deployed, nothing pushed to main.** The merge test below was a local `git merge --no-commit` in a detached worktree and was aborted.
**Worktree:** `D:/pyrefly-r381-ll-check` (detached at the tip; `node_modules` and `public/art` junctions read only; her paintings came from a dev-only overlay of a scratch static server, never written under `public/art`). Scratch: `D:/Tools/pyrefly-scratch/2026-10-04/r381-ll-check/`. Servers started: one static server on 7081, stopped by PID 77800.

## Verdict: PASS

| # | Check | Result |
|---|---|---|
| 1 | Swap table in code equals the handoff and Bailey's recommendation (D-373) | PASS (read from the engine's own `gridNodeContents` for all 7 chapters, below) |
| 2 | Autopilot digests, 200 seeds, 7 chapters, vs origin/main | PASS, identical per seed in all seven; XVI has 0 spherechanges |
| 3 | Real keys: Change to Lady Luck in V and XVI; reels in Wait and Active; no collisions at 1600x900, 2000x1012, 390x844 | PASS (one cosmetic note on the phone, below) |
| 4 | `tsc` and the full suite on a merge-test against origin/main | PASS: tsc clean (TS 7.0.2); 800 files passed, 5 skipped; 11,773 tests passed, 46 skipped, 1 todo; 0 failed |

## 1. The swap table (read from the shipped builds, not from the handoff)

A scratch test (parked, never committed) loaded each chapter's `buildRef` and printed `gridNodeContents(member, grid.nodeCount)` from both trees (origin/main src and this tip):

| Chapters | Yuna | Rikku | Paine | Equals handoff and D-373 |
|---|---|---|---|---|
| V, XI, XV | White Mage, Gunner, Thief, Warrior, **Lady Luck** | Dark Knight, Gunner, Thief, Warrior, **Lady Luck** | Dark Knight, Gunner, Thief, Warrior, **Lady Luck**, **White Mage** | yes: Black Mage is the one off the grid for all three; **Farplane Paine keeps White Mage** |
| XIII | Dark Knight, White Mage, Gunner, Thief, **Lady Luck** | Alchemist, Gunner, Thief, Warrior, **Lady Luck** | Dark Knight, Warrior, Gunner, Thief, **Lady Luck** | yes, as built (`via-infinito.ts` is untouched since r38-lady-luck-grid) |
| XVI | White Mage, **Lady Luck**, Thief, Warrior, Black Mage | Dark Knight, **Lady Luck**, Thief, Warrior, Black Mage | Dark Knight, **Lady Luck**, Thief, Warrior | yes: **Gunner is off for all three**, Black Mage kept on Yuna and Rikku |
| IV, VI | unchanged, no Lady Luck | | | yes |

The guide pages (`research/jegged-encounter-guides-ffx2.md` sections 3 to 8) agree with the table: V names a Warrior's Armor Break and a White Mage swap-in (both on Paine's ring), XVI says Water hurts Ixion (Black Mage kept) and Warrior Breaks work (Warrior kept), XIII names Dark Knight and Alchemist (on the rings; Mascot is past the end of every ring and was already). Party-prep counts (`owned.length`): identical in IV, V, VI, XI, XIII, XV; **XVI 11 to 12 (Yuna, Rikku) and 10 to 11 (Paine)**, as D-373 named.

## 2. Digests (my own harness, written fresh; `Wait`, `intendedStrategy`, each chapter's own build and link chain, seeds 1 to 200, sha256 of every link's event log)

| Chapter | Wins | Spherechange events | Digest (origin/main = this tip) |
|---|---|---|---|
| IV bahamut | 200/200 | 0 | `10be3653d65ace71` |
| V vegnagun-shuyin | 188/200 | 0 | `a2bdf7ce055958dd` |
| VI leblanc | 198/200 | 0 | `2c17fadc43601d6b` |
| XI fallen-aeons | 174/200 | 427 | `0e47b91402fcb4f1` |
| XIII trema | 14/200 | 6,117 | `9aebd9f707d6cd9c` |
| XV den-of-woe | 111/200 | 0 | `c5e43cb264008c79` |
| XVI ixion-djose | 197/200 | **0** | `545d43dfeae497c5` |

All 200 per-seed hashes equal, chapter by chapter, between `origin/main` (src identical to 12075232; main's e2e33e0b changed docs only) and the tip. The numbers also equal the handoff's, reached by a different script.

## 3. Real keys, headless GPU Chromium (`PYREFLY_BROWSER=gpu`), a production build of this tip, keys only; the debug API starts the chapter

**Change menus (Wait, seed 3, all by Enter and arrows):**

- V: Yuna `Gunner / Lady Luck`; Rikku `Gunner / Lady Luck`; Paine `Gunner / White Mage` (no Lady Luck in the first menu).
- XVI: Yuna `Lady Luck / Black Mage`; Rikku `Lady Luck / Black Mage`; Paine `Lady Luck / Warrior`. Lady Luck is the first row. All three changed into her and threw reels at 1600x900 and 2000x1012.
- **Paine's two Changes** (Dark Knight to White Mage, then the next menu offers `Lady Luck / Dark Knight`): reached the reels in V seed 1, XI seed 1, XV seeds 1, 2, 3 (second try) and 4. One earlier XV seed-3 run stalled at the first Change (three of four Enter presses did nothing while a build and the full suite were running on the machine; Yuna was Silenced by the time the menu moved); the identical seed ran clean when repeated, so I count it as a load stall of the driver, not a game defect, but I could not prove it from that run alone.

**Reels resolve:** Wait ATB (V Yuna attack, Rikku magic; XVI all three girls; XV, XI, V Paine after two Changes; every viewport) and **Active ATB** (chip "ACTIVE - ATB RUNNING", setting read back as `active`: V Rikku attack, XVI Yuna magic). Three Enters stop three reels every time. 0 console errors and 0 non-2xx in all 15 runs; her paintings loaded (26 to 78 overlay requests per run).

**Collisions** (every run: `elementsFromPoint` at five points of the title, subtitle, three reel cells, DUD line, ring and bonus; the slab and the intent card; plus a 99,999 critical numeral pushed through the HUD's own event path, display only, onto every combatant, sampled every ~40 ms for 2.6 s):

| Viewport | Chapter | Overlay inside viewport | Anything painted over a reel, label or the DUD line | Numeral vs reel cells and DUD line | Closest numeral, gap to slab's bottom edge |
|---|---|---|---|---|---|
| 1600x900 | V | yes | none (3 samples) | 0 and 0 | Vegnagun tail: 256.8 px clear (numeral right of the slab) |
| 1600x900 | XVI | yes | none | 0 and 0 | Paine's numeral 28.6 px below |
| 2000x1012 | V | yes | none | 0 and 0 | 284.6 px clear (right of the slab) |
| 2000x1012 | XVI | yes | none | 0 and 0 | Paine's numeral 31.4 px below |
| 390x844 | V first link | yes | none | 0 and 0 | **-6.2 px: the Vegnagun tail numeral's top 6.2 px slides under the slab's bottom edge** (472 px2 of its box); see note |
| 390x844 | XVI Ixion | yes | none | 0 and 0 | 18.9 px below |

The slab (the minigame layer) is z 15 and the numeral layer z 6 in the same context, so the slab is on top; the intent card is under the slab wherever they meet (the FOC371-02 design, "overlay-over-card"), and the guide card likewise. The effective layer z-index read back in every run was 15.

**Note (cosmetic, phone only, V's first link):** at the 99,999 worst case the numeral's top 6.2 px is hidden behind the slab's lower edge at its apex (frame `phone-v-numeral-under-slab-edge-390x844.jpg`). It never reaches a reel cell or the DUD line. The builder measured a 3.4 px gap at the same spot; the difference is animation timing against a ~40 ms sampler, so treat the true range as -6 to +3 px. Not covered here either: V's later links and Paragon's other forms.

## 4. Gates on a merge-test against origin/main (e2e33e0b)

`git merge --no-commit --no-ff origin/main` merged cleanly (docs/target and NOW.md only), then: `npx tsc --noEmit` clean (0 bytes of output, exit 0); full `vitest run --maxWorkers=3 --testTimeout=60000` (my two scratch files excluded): **800 passed, 5 skipped (805 files); 11,773 passed, 46 skipped, 1 todo; 0 failed**, 1,259 s. The merge was then aborted; nothing was committed from it.

## Minor finding: a stale z-index block and test (not blocking, smallest fix below)

`src/ui/ffx2/ffx2-hud.css` gains a `.ffx2hud__minigame { z-index: 5 }` block (+10 lines), and `tests/unit/ui-ffx2-minigame-layer.test.ts` pins "minigame above the guide and advisor and **below the damage numerals** (6)". Both come from `r38-lady-luck-grid`, written before release 38's FOC371-02 moved the layer beside the stage and gave it `z-index: 15` in `minigames.css` (`.ffx2hud > .ffx2hud__minigame`, higher specificity). In the build the 5 never applies (read back: 15), the slab paints **over** the numerals, and the test's "below the numerals" comment and assertion describe something the shipped HUD does not do. It passes only because it parses the exact selector `.ffx2hud__minigame`. Release 38's own `ui-ffx2-minigame-stacking.test.ts` already pins the real order.

**Smallest fix (does not change any behaviour):** drop the 10-line hunk from `ffx2-hud.css` and delete `tests/unit/ui-ffx2-minigame-layer.test.ts` (park it, do not delete), or leave both and say so in the commit. Not required before 38.1.

## What was not covered

Item and Random Reels (not shipped); V's later links and Paragon's other forms for the numeral probe; real taps on a phone (keys under touch emulation, as the builder did); timing (frame times, cold load): the critic's round 21 was capturing, so none was taken; her 45 painted poses frame by frame (they load, 0 failed requests).

## Frames (`docs/screenshots/r381-lady-luck-check/`)

`v-paine-change-gunner-whitemage-1600x900`, `v-yuna-reels-overlay-1600x900`, `xvi-paine-reels-over-intent-card-1600x900`, `xvi-yuna-change-lady-luck-first-2000x1012`, `xv-paine-reels-after-two-changes-1600x900`, `phone-v-numeral-under-slab-edge-390x844`, `phone-xvi-rikku-reels-390x844`.
