# PROGRESS: ch-besaid-valefor (FFX-2 only; hidden chapter number 24, word "besaid")

Sub-agent of the release driver, building "Protect Besaid Temple!" (FFX-2 Chapter 3, Valefor possessed by Shuyin's pyreflies).
Append one entry per finished step. Times are EDT.

## 2026-10-14

- 00:40 Step 1 done: worktree `D:/pyrefly-ch-besaid-valefor` on branch `ch-besaid-valefor` (from origin/r46-rc ca9fd0b4).
  - D: had only 3.9 GB free (not the briefed 25 GB), so the usual full worktree (6.5 GB tracked, 3.7 GB of it docs/screenshots and 2.3 GB docs/concepts) failed with "No space left on device".
    Used the sparse recipe (2026-09-26 "lighter worktrees", MEMORY): sparse-checkout `--no-cone` skips docs/screenshots and docs/concepts (except
    `docs/concepts/pause-until-dawn/prototype-v2/src/`, its `art/rig.json` and `docs/concepts/chapters/macalania/unlock/party-layout/`, which tests import/read) and
    re-includes `docs/screenshots/ch-besaid-valefor/` for this chapter's frames. About 540 MB on disk.
  - Junctions: `node_modules` -> D:/Final Fantasy/node_modules, `public/art` -> D:/pyrefly-art-r44 (read only). `public/fx` restored from the local backup (1.8 MB, `fx-assets ensure`).
- Coordinator course corrections received while working:
  1. DISK: build OFF D: with vite `--outDir M:/pyrefly-builds/ch-besaid-valefor/dist`; never start a build or the full suite while D: is under 15 GB free (check `(Get-PSDrive D).Free` first);
     if a cross-drive output is refused, build in the tree only with D: at 15 GB+, then `robocopy /MOVE` the dist to M: and verify counts and bytes (never delete).
  2. The RE session will push `research/re-ffx2-yojimbo-valefor.md` on `origin/re-ffx2-yojimbo-valefor` (about 01:45): the game's own monster.bin rows for FFX-2 Valefor (and Yojimbo, Daigoro).
     PREFER its numbers for every field it proves, cite it in the fixture and the preflight, list every disagreement with the research used. Build now with the research in hand and re-pin when it lands.
     The RE session will review the battle code when I push: tell the coordinator when I do.

## Steps (brief)

1. [x] Worktree and junctions (above)
2. [x] critic-plan (DEEP: encounters.ts, the FFX-2 AI table, chapter registry) + paper preflight `docs/plans/ch-besaid-valefor-review.md` (PROCEED; flags the besaid/daigoro one-letter overlap against chapter-doors.test.ts)
3. [x] Build, pushed: data, row 164 record, AI (tagged), tactic, party, chapter record + meta, story, door (word VALEFOR since the driver moved it from besaid), guide card + page, scene spot (djose-chamber.ts), held items, registry tests updated. Tests written: valefor-door (22), besaid-valefor-data (24), besaid-valefor-engine (15); fixture besaid_valefor_rows.json (row 164, 200 raw bytes). TODO: flow/scene/store/bench tests, art pilot queue, CHANGELOG, CONTRACT-CHANGES, handoff.
4. [~] Tests, tsc, orphans, audio qa, full suite once (D: >= 15 GB first)
5. [ ] Browser proof on a production build (outDir on M:), screenshots
6. [ ] Handoff doc + CHANGELOG entry + push
