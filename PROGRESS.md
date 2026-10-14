# PROGRESS: ch-besaid-valefor (FFX-2 only; hidden chapter number 24, word "valefor"; the first pick, "besaid", was moved by the driver)

Sub-agent of the release driver, building "Protect Besaid Temple!" (FFX-2 Chapter 3, Valefor possessed by Shuyin's pyreflies).
Append one entry per finished step. Times are EDT.

## 2026-10-14

- 00:40 Step 1 done: worktree `pyrefly-ch-besaid-valefor` (a sibling folder of the main tree) on branch `ch-besaid-valefor` (from origin/r46-rc ca9fd0b4).
  - D: had only 3.9 GB free (not the briefed 25 GB), so the usual full worktree (6.5 GB tracked, 3.7 GB of it docs/screenshots and 2.3 GB docs/concepts) failed with "No space left on device".
    Used the sparse recipe (2026-09-26 "lighter worktrees", MEMORY): sparse-checkout `--no-cone` skips docs/screenshots and docs/concepts (except
    `docs/concepts/pause-until-dawn/prototype-v2/src/`, its `art/rig.json` and `docs/concepts/chapters/macalania/unlock/party-layout/`, which tests import/read) and
    re-includes `docs/screenshots/ch-besaid-valefor/` for this chapter's frames. About 540 MB on disk.
  - Junctions: `node_modules` -> the main tree's `node_modules`, `public/art` -> the approved art tree (read only). `public/fx` restored from the local backup (1.8 MB, `fx-assets ensure`).
- Coordinator course corrections received while working:
  1. DISK: build off the project drive with vite `--outDir` on the second drive (a folder named for this lane); never start a build or the full suite while the project drive is under 15 GB free (check its free space first);
     if a cross-drive output is refused, build in the tree only with the project drive at 15 GB+, then `robocopy /MOVE` the dist to the second drive and verify counts and bytes (never delete).
  2. The RE session will push `research/re-ffx2-yojimbo-valefor.md` on `origin/re-ffx2-yojimbo-valefor` (about 01:45): the game's own monster.bin rows for FFX-2 Valefor (and Yojimbo, Daigoro).
     PREFER its numbers for every field it proves, cite it in the fixture and the preflight, list every disagreement with the research used. Build now with the research in hand and re-pin when it lands.
     The RE session will review the battle code when I push: tell the coordinator when I do.

## Steps (brief)

1. [x] Worktree and junctions (above)
2. [x] critic-plan (DEEP: encounters.ts, the FFX-2 AI table, chapter registry) + paper preflight `docs/plans/ch-besaid-valefor-review.md` (PROCEED; flags the besaid/daigoro one-letter overlap against chapter-doors.test.ts)
3. [x] Build, pushed: data, row 164 record, AI (tagged), tactic, party, chapter record + meta, story, door (word VALEFOR since the driver moved it from besaid), guide card + page, scene spot (djose-chamber.ts), held items, registry tests updated. Tests written: valefor-door (22), besaid-valefor-data (24), besaid-valefor-engine (15); fixture besaid_valefor_rows.json (row 164, 200 raw bytes). TODO: flow/scene/store/bench tests, art pilot queue, CHANGELOG, CONTRACT-CHANGES, handoff.
4. [x] Tests, tsc, orphans, audio qa, full suite once: tsc exit 0; orphans 36 older, none mine; audio qa 0 findings; full suite 1,220 files (1,206 passed, 14 skipped, none failed), 18,930 tests passed, 03:34
5. [x] Browser proof on a production build (vite directly, BASE_PATH=/, outDir on M:, port 5531, headless Chromium, my PAUSE created and released): board, win, loss with retry, phone: all passed; screenshots under docs/screenshots/ch-besaid-valefor/ looked at (the prep tip was cut by its box: shortened)
6. [x] Handoff doc (docs/handoff/ch-besaid-valefor.md), CHANGELOG entry, contract entry, push; the RE re-review's list (SCENES pin, the 'every move' wording, TBDs, disclosures, the cadence test) applied; the final tip goes to the coordinator

## 2026-10-14, the end: what was found late and fixed

- A broader doc run after the tip change caught `guide-doc` (a page paragraph of 273 characters against the 260 limit): split in two.
- The preview server must be started with BASE_PATH=/ too, or vite preview redirects `/` to `/pyrefly-reprise/` and every asset is a 404 (the first proof series of the evening failed for this); and Git Bash turns `export BASE_PATH=/` into a Windows path for node: set it from PowerShell.
- The first browser loss run stalled because the debug `defend` strategy has no Defend row on the FFX-2 menu; the loss is now a party that answers nothing on the Active clock.
- The advisor's 'MP damage' wording was tried in `intent.ts` and taken back: it would change Chapters V, VI and XIII's lines too (the driver's call; handoff section 6).

