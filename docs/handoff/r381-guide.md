# r381-guide: the strategy guide's reading view, re-synced onto release 38 for 38.1

**Branch** `r381-guide` (from `origin/r38-guide-jegged` 8e85c1e2, merged with `origin/main` 22dae67d, release 38). **Game case: both**
(AGENTS.md rule 14): the sheet, its scrolling and the hint card's slot are shared plumbing proved in all 18 chapters, FFX (I, II, III, VII,
VIII, IX, X, XII, XIV, XVII, XVIII) and FFX-2 (IV, V, VI, XI, XIII, XV, XVI); the documents follow Jegged's FFX or FFX-2 guide per
chapter exactly as `docs/handoff/r38-guide-jegged.md` records. Nothing is merged to `main` and nothing is deployed. Bailey's yes:
"all your recommendations" (2026-10-04 ~13:20 EDT), answer (a) on the morning page: ship the reading view in 38.1.

Read `docs/handoff/r38-guide-jegged.md` for what the guide is (sections 1 to 12). This note only records the re-sync.

## 1. What the merge did

- `git merge origin/main` into the guide branch: **no conflicts**. The only file both sides touched, `src/ui/ffx2/FFX2BattleHud.ts`,
  merged by git (the guide's three removed calls and the `held` option; release 38's minigame layer, `FOC371-02`). Merge commit f8edae34.
- **One semantic fix, forced by the merge** (27534efe, a test only): `tests/unit/guide-doc-separation.test.ts` read
  `src/ui/common/advisorGuideBadge.ts`, which release 38 deleted with the "Guide's pick" tag (D-359 done). The test's list is now
  `MoveAdvisor.ts`, `advisorChipFollow.ts` and `src/ui/ffx/advisorRoomy.ts` (new in 38): the advisor still imports no guide panel.
- **The guide is byte-identical to 8e85c1e2.** `git diff 8e85c1e2 HEAD` over `src/data/guides/`, `src/ui/common/StrategyGuide.ts`,
  `strategy-guide.css`, `guideDoc.ts`, `guideDocHtml.ts`, `guideScroll.ts` and `statusHintCard.ts` is empty. No layout change was
  needed. Release 38's other edits (advisor card, z 15 minigame slabs, rename, art) do not touch these files.

## 2. Gates

| Gate | Result |
|---|---|
| `tsc --noEmit` | clean (exit 0) |
| `node tools/orphans.mjs` | 24 orphaned modules, the same 24 as main |
| Full vitest, `--maxWorkers=2`, 804 files | 11,889 tests: 11,830 passed, 46 skipped, 1 todo, 12 failed. One failure was real (the separation test above, fixed). The other 11 are 15 s timeouts or temp-file contention while the machine ran the critic's capture, the hires batch and other agents: each file passes alone (`art-exact`, `strategy-ffx2-bahamut` heal-only and `ui-ffx2-atbmode` at `--testTimeout=180000`; `audio-manifest-io`, `critic-release-rules`, `ui-pause-stack` at the default) |
| Forbidden-words guard (`guide-doc-words.test.ts`, 37 tests) | passes in the full run; and 0 matches in the visible guide text of all 72 browser runs below |
| **Advisor separation** (`advisor-digest.mjs`, seeds 1 to 5, cap 700) | overall `cc10c48f8757f72d07c44a7986c06e4b69b3d9d42e53cef6757dd8cb77ae425d` on origin/main (the release-38 tree, D:/pyrefly-rel38, src identical to main 22dae67d) and on this branch: **identical**, 90 of 90 per-run digests, 8,256 decisions. Also the same hash 8e85c1e2 produced (so release 38 did not move the advisor either) |
| `git diff 8e85c1e2 HEAD -- src/engine/tactics src/battle` | empty |

## 3. Browser proof

Headless Chromium from node, `PYREFLY_BROWSER=gpu`, real input only (mouse wheel, `[` `]` `Home` `End` `G` keys, mouse click on the
chip, touch tap on the phone), Vite dev server on port 7080 (stopped by its PID afterwards), BATTLE HELP on, seed 1, the first command
menu. Scripts and raw JSON: `D:/Tools/pyrefly-scratch/2026-10-04/guide/` (`check18.mjs`, `out-A.json`, `out-B.json`).
Frames: `docs/screenshots/r381-guide/` (34 files, 7.1 MB; 18 chapters at 1600x900, five at 2560x1440, Bahamut at 2000x1012, three at
1280x720, the hint card, the phone).

**The reading view, all 18 chapters at 1280x720, 1600x900, 2000x1012 and 2560x1440 (72 runs, 0 failed):**

| Check | Result |
|---|---|
| Console errors / non-2xx responses | **0 / 0** over 128,633 responses |
| Column against every other HUD panel (advisor card, intent slab, command stack and help, party list, turn rail, boss strip, banner, minigame slabs) | **0 px2 in all 72** |
| Column against painted figures | 0 in **68 of 72**; the four exceptions are Chapter VI (FFX-2), section 5 problem 1 |
| Column inside the window | yes in all 72 |
| Opens on the boss on the field | yes in all 72: the boss's header is the first thing in the sheet, with 3.2 to 5.0 grid px of gap above it and none of the block before it; the same block at all four sizes; the heads that open: Seymour Flux, Yunalesca, Braska's Final Aeon, Bahamut, Vegnagun (Tail), Hidden Passageway (VI has no boss card), Seymour (VII), Evrae, Yojimbo, Seymour Natus, Shiva, Seymour Omnis, Paragon, Isaaru's Aeons, Baralai, Ixion, Left Fin, Overdrive Sin (the Head) |
| Mouse wheel | one notch moves the text **100.0 to 101.2 screen px at every scale** (2.0, 2.5, 2.81, 4.0), in all 72 |
| `[` and `]` | a page (85 percent of the sheet) up and down, `End` reaches the foot (`scrollTop` = max), `Home` the top, in all 72; the battle stayed at its command menu through every key and notch |
| Text | smallest type 14.25 px at 1600x900, 16.0 at 2000x1012, 22.8 at 2560x1440; **11.4 px at 1280x720** (5.7 grid px at scale 2; see section 5, problem 3); no horizontal overflow anywhere |
| Column box at 1600x900 | FFX 330x178 at (53,110); FFX-2 at (53,220) 172 to 260 px high, Chapter VI at (53,335) 140 px high; **identical to the branch before the merge in all 18 chapters** (`out-pre.json`, port 7082 on D:/pyrefly-aeon-hp), and the sheet opens at the same scroll offset in all 18 |
| `G` and the chip | `G` hides and brings back the guide, which opens on the boss again after a scroll (scroll 300 then G, G: back at 107, 84, 67, 28, 20 in Chapters I, II, IV, V, VII); the chip by a real click works except where the advisor's chip covers it (section 5, problem 2) |

**FFX-2 fence gap** (clearance of the column's bottom edge above the nearest figure that stands under it, grid px, smallest and largest
over the four sizes): IV Bahamut 19.7 to 22.7, V Vegnagun nothing under it at 1600x900 and up (24.8 at 1280x720), XI Fallen Aeons
19.7 to 20.9, XIII Trema **5.9 to 6.9**, XV Den of Woe 17.8 to 20.6, XVI Ixion 19.7 to 21.6; **VI Leblanc: overlaps Yuna** (problem 1).
Against origin/main's rail on the same release-38 build at 1600x900 and 1280x720: Bahamut covered Yuna on main (43 and 133 px2) and
does not here; Fallen Aeons 10.8 / 9.2 on main, 20.9 / 20.1 here; Trema 9.9 / 4.4 on main, 6.2 / 5.9 here; Den of Woe 11.1 / 11.8 on
main, 19.9 / 18.5 here; Ixion 11.7 / 11.5 on main, 21.6 / 20.3 here. The branch is clearer than main everywhere except Trema at
1600x900 (the girls stand a little differently from run to run and release 38's new art stands a little higher: the branch
measured 7.7 before the merge).

**The hint card in its own box** (BATTLE HELP on, a status held on a party member by the labelled presentation probe; Ch I Zombie on
Kimahri, Ch II Zombie on Tidus, Ch IV Curse on Paine, Ch V Sleep on Rikku; 1600x900, 1280x720, and 2560x1440 for Ch I and IV):
the card is a child of `.sgd__slot`, never of the sheet, 0 px2 against the sheet and 0 against any figure in all 10 cases, the column
over no figure; the sheet beside it keeps its scroll offset and the sizes equal the pass-three table (330x85 at (53,110) in Ch I and II,
330x85 at (53,220) in Ch IV, 330x106 in Ch V at 1600x900; at 1280x720 in FFX the card stands alone and the sheet steps aside, as
designed); folded with `G` the card stands at its approved place ((53,78), (53,230), and (42,62) / (42,184) at 1280x720). Frames
`hint-*`.

**Phone (390x844, touch):** the sheet's geometry, every unit's box and computed type, its text, scroll offsets, the folded and closed
states and the console, read unit by unit in Ch I, II, IV and V, are **byte-identical** to the branch before the merge (`phone-pre-sheet.json`
against `phone-r381-sheet.json`): column 370x410 at (10,66), sheet 367x410 at (13,66), opens at 235 / 215 / 152 / 69, ends at 981 / 908 / 301 / 4446. 0 console
errors. Frames `phone-*`.

## 4. For the 38.1 integrator

- **ui-floor (r381-ui-floor 9584aecd).** `merge-tree` says the three branches combine without a textual conflict. But
  `src/ui/common/hud-floor.css` on that branch holds a block "the strategy guide (both)" written for the pre-sheet panel: it raises
  `.sgd__panel`, `.sgd__head`, `.sgd__actor`, `.sgd__timing`, `.sgd__cite`, `.sgd__phase-label`, `.sgd__toggle`, `.sgd__title`,
  `.sgd__arrow`, `.sgd__cmd`, `.sgd__more` to the 14.1 px floor. Several of those classes no longer exist (the sheet has `.sgd__u`,
  `.sgd__t`, `.sgd__doc-head`, `.sgd__flabel`, `.sgd__hint-*`, `.sgd__lname`, `.sgd__thead`). On this branch the sheet's own type is 5.7
  grid px (11.4 px at 1280x720, 9.1 at 1024x768). After merging, re-measure the sheet's type at 1280x720 and 1024x768 and at TEXT SIZE
  115 and 130, and re-point that block at the sheet's classes (or the panel's font-size, if the units inherit it). The sheet scrolls,
  so a bigger type costs lines, not cut text. Not tested here: it is the integration's job.
- **Lady Luck (r381-lady-luck bba4ec41):** textual merge clean; nothing in it touches the guide.
- Screenshots in a sparse worktree need `git add --sparse docs/screenshots/...`.

## 5. Problems found (none introduced by the merge; none fixed here, none touch the guide's text or data)

1. **FFX-2 Chapter VI (Leblanc Syndicate): the column's lower right corner covers the tip of Yuna's raised pistol at every size**
   (her painted box, 1,957 px2 at 1280x720, 2,288 at 1600x900, 4,724 at 2000x1012, 4,716 at 2560x1440; the barrel and the end of the
   last text line, not her face; frame `ffx2-leblanc-1600x900-open.jpg`). Cause: the room between the three-enemy boss strip (column
   top 335 px at 1600x900) and the fence 28 grid px above the girls' heads is 44.8 grid px, under `MIN_PANEL_HEIGHT` (56), so the
   minimum wins and the column runs 11 grid px past the fence into her raised arm. It is the same on the branch before the merge
   (1,774 px2 at 1600x900) and **worse on origin/main's rail** (5,300 px2 at 1600x900, 3,354 at 1280x720: live today). Options for
   Bailey's integrator: (a) leave it (smaller than live); (b) let the minimum give way below 56 grid px in this one case (the column
   would be 112 px, six lines, still scrollable); (c) park the fence on the painted box's top (`FFX2BattleHud.layoutFences`, the shared
   fence the advisor's lane also reads; a larger change). I did not pick one: it is a shared-layout call, not a conflict.
2. **FFX, guide folded with `G` (also on origin/main, so live): the move advisor's chip lands on the folded GUIDE chip and takes its
   click.** The advisor gives way to the guide's column when the guide is folded (release 38's `advisorRoomy.ts`) and its toggle stands
   at (38, 39 to 106), over the GUIDE chip at (51, 83). Overlap of the two chips at 1600x900, guide folded: 763 px2 in I, III, IX and
   XVIII, 2,543 in XIV, 509 in VII, 254 in VIII and XVII; the advisor's card also covers the GUIDE chip by 1,708 px2 in VII and 2,670
   in XII. A real click on the chip does not reopen the guide in Chapter I (`G` does). Identical numbers on origin/main (Chapters I,
   VII, XII, XVIII re-measured). The guide and the move advisor are separate: this is the advisor's placement, so it is reported, not
   changed here.
3. **The sheet's type is under 14 px below 1600x900** (11.4 px at 1280x720), by the original design (5.7 grid px); Bailey's answer (b)
   (a 14 px floor) is a 38.1 item on the ui-floor branch, see section 4.
4. **Release 38's dev console** shows `[fx-b] depth plates unavailable EncodingError` warnings in the Vite dev server (a warning, not an
   error; this worktree's `public/fx` depth maps are the 16-bit ones the release notes mention; not a guide matter).

## 6. Run record

Worktree `D:/pyrefly-r381-guide` (sparse, junctions `node_modules` and `public/art`; `cmd /c rmdir` both before any removal). Servers
started and stopped by PID: 7080 (this branch), 7081 (D:/pyrefly-rel38, for the main comparison), 7082 (D:/pyrefly-aeon-hp, the branch
before the merge). Parked: 15 surplus 1280x720 frames in `F:/pyrefly-parked/2026-10-04/guide/`. Untracked scratch left in the worktree:
`.r381-guide-vite-tmp.config.mjs` (not committed).
