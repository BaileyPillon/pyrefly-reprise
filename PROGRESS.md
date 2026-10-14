# PROGRESS: ch-tourist-trap (hidden FFX-2 chapter, Yojimbo and Daigoro, mission "Tourist Trap")

Branch `ch-tourist-trap` from `origin/r46-rc` (ca9fd0b4). Worktree `D:/pyrefly-ch-tourist-trap`. Game case: FFX-2 only.
Word `daigoro`, hidden chapter number 23 (fayth is 22). Not merged, not deployed.

## Standing rules from the coordinator (2026-10-14 ~00:50 EDT)

- Production build goes OFF D: : `--outDir M:/pyrefly-builds/ch-tourist-trap/dist` (M: has ~225 GB). Serve that folder for the browser proof.
  If a step refuses a cross-drive output, build in the tree only when D: has at least 15 GB free, then MOVE the dist to M: with robocopy /MOVE and verify file count and bytes (never delete).
- Never start a build or a full suite while D: is under 15 GB free: check `(Get-PSDrive D).Free` first.
- RE session will push `research/re-ffx2-yojimbo-valefor.md` on `origin/re-ffx2-yojimbo-valefor` (~01:45 EDT): the game's own rows for FFX-2 Yojimbo and Daigoro. PREFER its numbers over the wiki's for every field it proves; cite it in the fixture and the preflight; list every disagreement with the research used. Build with the research at hand and re-pin when it lands. The RE session reviews the battle code on push: tell the driver when I push.

## Steps

- [x] Step 1 (00:40): worktree created, junctions (node_modules, public/art -> D:/pyrefly-art-r44 read only), public/fx ensured (26 restored, verify PASS).
- [x] Step 2 (01:10): `node tools/critic-plan.mjs` says DEEP; paper preflight `docs/plans/ch-tourist-trap-review.md` written before any code (data table with tags, the readings chosen where the research is silent, the engine model of the counter, Zanmato, Kozuka, Daigoro, the word's keys, risks, tests). RE rows (research/re-ffx2-yojimbo-valefor.md) not yet landed: re-pin when they do.
- [x] Step 3a (01:50): built the data, AI and registrations in the existing patterns: `data/ffx2/enemies/tourist-trap{,-abilities}.ts` (Yojimbo + Daigoro as an untargetable part, five abilities, group `ffx2-cavern-yojimbo`, action time 3 s like the other possessed aeons), `battle/ffx2/ai/tourist-trap.ts` (the +8 counter, bands, Zanmato at 100, Daigoro's endless wait), chapter record (`ffx2-tourist-trap`, number 23, experimental) + pause meta, story, scene (`tourist-trap-cavern.ts`, Chapter IX's plate under the FFX-2 camera), guide card + document, tactic, the word `daigoro` (door row + `daigoroDoor.ts`), registrations (one line each). tsc clean. Door table test updated (six words). Still to do: tests, bench, scene framing in a browser, RE-row re-pin.
- [x] Step 3b (01:10): RE rows landed (origin/re-ffx2-yojimbo-valefor 91ef1fd3); data RE-PINNED to monster.bin row 170 (Yojimbo) and row 174 (Daigoro): `monster-records/records-tourist-trap.ts` + `tests/fixtures/parity/ffx2/tourist_trap_rows.json`. Changes vs the wiki-based build: Reflect immunity REMOVED (row 170 group-2 index 2 = 0); Bribe flag REMOVED (unproven; special word wired as the proven bits 0, 1, 6 = 0x43, bit 9 left out); Gravity null kept (row 170 element byte 0x10); Accuracy 95 / Evasion 0 now read; Daigoro is his own record (Lv 30, HP 1, MP 1, 42/50/61/106/120/95/0/7, Curse only, no rewards, no ability list) and stays untargetable on the wiki's word (single source); unmapped columns (group-1 17 and 18, sound id, type word, special bits 7 and 8) not wired. Yojimbo's own list has no Daigoro move: the strike stays the sourced table's, run as Yojimbo's selection (handoff). Tests: `tourist-trap-engine` (20), `daigoro-door` (19), door table (six words) pass; tsc clean.
