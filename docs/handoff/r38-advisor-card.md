# r38-advisor-card: PR-0330, the move-advisor card keeps its detail lines under the colossus framing

Branch `r38-advisor-card` (from main 3fb1de85). Not merged, not deployed.

## Game case (AGENTS.md rule 14)
**Both games, each fixed in its own HUD** (same symptom, two different causes):
- FFX only: `src/ui/ffx/advisorRoomy.ts` (new), wired through `advisorStrip.ts`; `hudSafeZones.ts` only gained three `export` keywords (543 lines, did not grow). The FFX solver is the FFX HUD's.
- FFX-2 only: `src/ui/ffx2/advisorLane.ts` (`CHIP_GRAZE`). FFX does not use the lane solver.

## Cause (traced, not guessed)
- FFX Ch III (Braska's Final Aeon): colossus staging puts a boss part 12 grid px higher; the clear sky box beside the guide was 80 tall, 3 short of the 83 the designed pass asks (72 + chip 11), so the card fell to the 97-wide compact box.
- FFX Ch IX (Yojimbo): the compact pass ranked boxes by raw height, so it took a 96x128 slot (card 80x75, density 6) over a 121x109 slot (card 100x98, today's rig's card).
- FFX-2 Ch IV: Paine's feet stand 1 px inside the chip strip of the full card at the colossus framing, so the lane went `under` with a cap 2.6 px short of the full text; the cap sticks for the decision (a cap only tightens), dropping hit chance, status and reason.

## Change
1. `advisorRoomy.roomier`: only when the designed answer is `compact`, try the full-width card at `SHORT_ADVISOR_HEIGHT` (60) in a clear box, else the compact card in the clear box with the most card area. Full answers, declines (the E read-out, Sin strip) are untouched.
2. `advisorLane`: a girl whose feet only graze the chip strip (within `CHIP_GRAZE` = 4 grid px) is not in the card's band.
No `src/battle` change, no shared contract, no save data, no game data. Reduce motion and the FFX-2 menu rule: nothing animates or opens.

## Proof (production build of this branch vs r37 main 3fb1de85, headless Playwright GPU, seed 1, real keys to first menu)
Card px (w x h), text lines, density; overlap = px^2 of the card over tight fighter boxes (boss/party). Framing off = today's rig (live behaviour).

| chapter, size | today's rig | before (colossus) | after (colossus) |
|---|---|---|---|
| Ch III 1600x900 | 390x178, 10 lines, 0/0 | 293x188, 7 lines | 450x151, 10 lines, 0/0 |
| Ch III 2000x1012 | 437x193, 10 | 333x231, 10 (d2) | 505x164, 10, 0/0 |
| Ch IX 1600x900 | 284x159, 8 (d4) | 230x139, 5 (d6) | 300x231, 12 (d2), 0/0 |
| Ch IX 2000x1012 | 318x171, 8 | 318x171, 8 | 334x247, 12, 0/0 |
| Ch IV FFX-2 1600x900 | 490x130, 11, party 38 | 491x108, 8 (d4) | 493x130, 11, 0/0 |
| Ch IV FFX-2 2000x1012 | 548x143, 11, party 26 | 520x119, 8 | 632x143, 11, 0/0 |
Phone 390x844: 374x44 tip, identical before and after, every chapter. Controls (Flux, Yunalesca hero, FFX-2 Leblanc, Vegnagun): identical zones before and after at all three sizes (density can vary by one rung run to run; same zone). Matrix: 7 chapters x 3 sizes x framing on/off, before and after, in the scratch dir `D:/Tools/pyrefly-scratch/2026-10-03/r38-advisor-card/` (`card.mjs`, `new.jsonl`, `basem.jsonl`, `cmp.py`). Screenshots: `docs/screenshots/r38-advisor-card/` (target | before | after).

Checks: `tsc --noEmit` clean; new `tests/unit/ui-ffx-advisor-roomy.test.ts` (4) and 2 added cases in `ffx2-advisor-lane.test.ts`; full suite `--maxWorkers=3`: 768 files pass, 1 timeout (`strategy-ffx2-bahamut`, 15 s under load; passes alone, 19/19); orphans 24 (unchanged).

## critic-plan class
`node tools/critic-plan.mjs --paths ...` says DEEP for the tree (35 checkpoints since the last deep review, not this change); systems FFX HUD + FFX-2 HUD; checks CHK-003/004/006..010/015..017/020/021; not save-data class; no savedata branch.

## For Bailey
- Fixes PR-0330 (polish regression, round 19b). After the deploy the live check should rerun `cardrect.mjs` at 1600x900 and 2000x1012.
- Disclosure, not mine and unchanged: in the FFX-2 Vegnagun fight (Ch V) the card covers the boss by about 23,000 px^2 at 1600x900 in today's rig as well (FFX-2 lane has no boss obstacle).
- In Ch III and Ch IX the card now sits where the guide-side sky is free; at colossus Ch III it is wider and shorter than live.

## Check (independent critic, branch r38-advisor-card at bea033c5; 2026-10-03)
Method: own production build of bea033c5 served on 6300 (stopped), headless Playwright GPU, seed 1, real keys to the first menu via the round-19b `gaplib.mjs` driver, branch vs live release 36 (https://baileypillon.github.io/pyrefly-reprise/) vs the branch with the framing setting off (today's rig). Scratch: `D:/Tools/pyrefly-scratch/2026-10-03/r38-advisor-card-check/` (`check.mjs`, `clip.mjs`, `*.jsonl`). Card text, card box, px^2 over tight boss/party boxes, zone, and the card's own `scrollHeight` against `clientHeight` (clipping).

**Verdict: the three named chapters are fixed, but the change introduces a new regression in FFX Ch VII (Seymour Omnis). Not clean to merge as is.**

Verified, by running it:
- tsc clean; `ui-ffx-advisor-roomy` (4) and `ffx2-advisor-lane` (9) pass; orphans 24; `advisorRoomy.ts` 145 lines, `hudSafeZones.ts` 543 (same as main), `advisorStrip.ts` 65, `advisorLane.ts` 140. Layering fine (src/ui only, no game data, no contract file). Game case is in every commit message and the handoff.
- Ch III (1600x900, 2000x1012, 3 runs at 2000): 10 lines (NO MP, effect, number); live 36 at 1600 shows 7 lines. 0 px^2 on boss and party. 2000x1012 live 36 is compact 101x98; branch is a shelf card, full lines.
- Ch IX: branch 12 lines at 1600x900 (300x231) and 2000x1012 (334x247), live 36 5 and 8 lines; 0 px^2 on boss and party.
- Ch IV FFX-2: branch 11 lines with "100% TO HIT" at 1600x900 (live 36: 8 lines, no hit chance); 2000x1012 identical to live (11 lines). 0 px^2 on party (today's rig, framing off, 59 px^2 at 1600 and 22 at 2000).
- Phone 390x844: 374x44 tip, identical to live in all 7 chapters.
- Controls identical to live to the zone string: Flux, Yunalesca, Natus, Isaaru, Seymour/Anima, Sin Face, Sin Fins, FFX-2 Leblanc, Trema, Den of Woe, Fallen Aeons, Ixion (1600x900); Flux, Yunalesca, Leblanc, Vegnagun (2000x1012). Evrae differs by 0.4 grid px (noise).

**Blocker: FFX Seymour Omnis (hero framing) loses card content.** `roomier` takes the 60-grid-px short full card whenever one fits, even when the designed compact card was taller and printed more.
- 2000x1012: live 36 card 298x275 prints NEXT BEST MOVE, both moves, "It puts Cheer on the party; next, Mortiphasm Spells hits for about 4,400 in all" (11 lines). Branch: 478x174, only "Tidus / 1 Wakka / IN SWITCH / 2 Cheer -> the party / IN SPECIAL" (9 lines): the heading and the effect line are gone, the same loss PR-0330 describes. Picture: `docs/screenshots/r38-advisor-card/check-omnis-2000x1012-live-over-branch.jpg` (top live, bottom branch).
- 1600x900: same text as live, but the branch card is 62 grid px tall against a 68 px need (`scrollHeight` 68, `clientHeight` 61): the last line "IN SPECIAL" is clipped by about 3 px (`check-omnis-1600x900-branch-clipped-last-line.jpg`). Live is 250x173 (68/68, no clip).
- Zones: live `compact/170.4/85.2/245/98`, branch `shelf/166.6/156.8/245/62`. 0 px^2 on boss and party in both, so this is lost text, not coverage.
- Introduced by the candidate, regression against live; polish class like PR-0330, but the lane's acceptance was "every line it shows today". Other sizes for Omnis (1280x720, 1920x1080) and the other FFX chapters at 1280x720 were not measured.
- Suggested fix direction (not built; builder's call): in `roomier`, accept the short full card only if it yields at least as many printed lines as the designed compact card, for instance by comparing card area (`cardArea`) against the designed zone as the compact pass already does, or by requiring `maxHeight` of at least the compact card's. Add an Omnis case (the input the HUD hands the solver at 1600x900 and 2000x1012, hero framing) to `ui-ffx-advisor-roomy.test.ts`, then re-run the matrix on every FFX chapter at the three sizes.

Minor, not blocking: Ch III at 1600x900 prints 10 lines with `scrollHeight` 70 against `clientHeight` 68 (padding only, nothing clipped). The first-menu card is occasionally still hidden at 3.5 s on both branch and live under load (seen once on each for Ch III 2000x1012; present at 3 of 3 re-runs of the branch). FFX-2 Vegnagun still covers the boss by about 22,000 to 26,000 px^2 on live and branch alike (builder already disclosed). The FFX-2 `CHIP_GRAZE` lets a girl's feet sit up to 4 grid px inside the chip's strip, so the chip may touch her feet; the measured tight-box overlap with the party is 0 px^2 in Ch IV, so it is not visible in the matrix.
Not re-run: the full suite (the builder's one timeout, `strategy-ffx2-bahamut`, is load-related and unrelated to the diff).

## Repair (one cycle, answering the check's blocker; FFX only, Chapter VII and the shared FFX solver)
**Game case:** FFX only. `src/ui/ffx/advisorRoomy.ts` is the FFX HUD's solver; FFX-2 (`ffx2/advisorLane.ts`) is untouched by this repair.

**Blocker:** FFX Ch VII (Seymour Omnis) lost the card's heading and effect line at 2000x1012 and clipped its last line at 1600x900, because `roomier()` took the 60-grid-px short full card whenever one fit.

**Cause, measured:** the density ladder trims by *height*. Omnis's designed compact card is 85 wide and 98 (1600) / 104 (2000) tall and prints in full; the short full card the solver found is 157 x 62 (1600) / 132 x 66 (2000 in the check's run), below the 68 grid px the content measures (`scrollHeight` 68 at 1600, 98 at 2000 with the effect line). The area-ranked compact alternative (108 x 93 in the solver, 112 x 77 in the first repair try) trades height for width and prints less too. The inputs are the ones the HUD handed `advisorZone` on a real run (hook in `advisorStrip.ts`, removed before the commit), pinned in `tests/unit/ui-ffx-advisor-roomy.test.ts` as `OMNIS_1600` and `OMNIS_2000`.

**Change (`advisorRoomy.ts` 145 -> 173 lines, no other source file):**
1. `FULL_CARD_HEIGHT = 68` (measured: Omnis 68, Braska's Final Aeon 69-70) and `enoughHeight(designed) = min(designed.maxHeight, 68)`.
2. The short full card is taken only if `short.maxHeight >= enoughHeight(designed)` and it is not narrower than the designed card. Ch III's short card is 69 tall (it printed ten lines against seven for its 97-wide compact card), so it stays fixed; Omnis's is 62/66, so Omnis keeps its designed card.
3. The area-ranked compact card is taken only if it is wider **and** at least as tall as the designed one (Yojimbo: 100 x 98 against 80 x 75, still fixed). Omnis's 108 x 93 is shorter than 98, so it is refused.
Result: Omnis is exactly where release 36 puts it (zone `compact/170.4/85.2/245/98`, 2000: same), so it prints what live prints. Margin note: Ch III clears the 68 bar by 1 grid px (69), measured at 1280x720, 1600x900 and 2000x1012.

**Proof** (dev server of this branch, headless Playwright GPU, seed 1, real keys to the first menu; matrix 11 FFX chapters x 1600x900, 2000x1012, 1280x720 in `D:/Tools/pyrefly-scratch/2026-10-03/r38-advisor-card-repair/`, `branch2.jsonl`, `matrix.out.txt`; the solver is also re-run offline on every captured input):
- Omnis 1600x900: 9 lines, `scrollHeight` 68 = `clientHeight` 68 (no clip), card 250 x 173 px, zone identical to live. Omnis 2000x1012: 11 lines with NEXT BEST MOVE and "It puts Cheer on the party; next, Mortiphasm Spells hits for about 4,400 in all", 98 = 98, card 289 x 277 px (live 298 x 275). Omnis 1280x720: designed card kept, 9 lines, 72/72.
- Ch III: 10 lines at 1600x900 (445 x 173 px) and 2000x1012 (505 x 164 px, 10 lines), unchanged from the first repair; Ch IX: the roomy 100 x 98 slot kept at all three sizes (8 lines at 1600x900 and 2000x1012, 5 at 1280x720); Seymour/Anima (Macalania): its designed compact card, unchanged; Flux, Yunalesca, Natus, Isaaru, Evrae: the designed full card, solver output unchanged at all three sizes; Sin Face and Sin Fins: declined as before (the strip pass), unchanged.
- Screenshots: `docs/screenshots/r38-advisor-card/repair-omnis-1600x900.jpg`, `repair-omnis-2000x1012.jpg`, `repair-ch3-1600x900.jpg`.
- `tsc --noEmit` clean; `ui-ffx-advisor-roomy` 5 tests (1 new, 2 tightened); orphans 24; full suite `--maxWorkers=3`: 769 files pass, 5 skipped, 11,279 tests pass, no failures.

**critic-plan class:** unchanged: DEEP for the tree (35 checkpoints since the last deep review, not this change); systems FFX HUD; not save-data class.

**For Bailey:** nothing new to decide. Disclosure: the card's height need is content-dependent (59 to 98 grid px across the chapters), so 68 is the measured full-card height for the two chapters whose card the fallback touches, not a universal law; if a later chapter's fallback card loses lines, raise `FULL_CARD_HEIGHT` or measure the card in the HUD instead.

## Check 2 (independent critic, branch r38-advisor-card at a576bdef; 2026-10-03)
**Game case:** FFX for the repair (Ch III, VII, IX and the shared FFX solver); FFX-2 re-measured only (Ch IV, Leblanc, Vegnagun, Trema, Den of Woe, Fallen Aeons, Ixion) and unchanged by the repair.

Method: own production build of a576bdef served on 6300 (stopped by PID), headless Playwright GPU, seed 1, real keys to the first menu (round-19b `gaplib.mjs`), the check's card box, text, `scrollHeight` against `clientHeight` and px^2 over tight boss/party boxes. Branch against live release 36 (https://baileypillon.github.io/pyrefly-reprise/) and the branch with the framing setting off (today's rig). Matrix: 18 chapters (all 11 FFX fights incl. Sin Face and Fins, 7 FFX-2 fights) x 1600x900, 2000x1012, 1280x720, plus 6 chapters at 390x844. Repeats: Ch III 1600x900 x35, Ch III 2000x1012 x24, Ch IX 1600 and 2000 x10 each, Ch IV 1600 and 2000 x10 each, Omnis 1600 and 2000 x10 each. Scratch `D:/Tools/pyrefly-scratch/2026-10-03/r38-advisor-card-check2/` (`check.mjs`, `m.jsonl`, `o.jsonl`, `rep.out`, `om.out`, `cmp.mjs`, `full.log`). Pictures (live 36 on top, branch below): `docs/screenshots/r38-advisor-card/check2-{ch3,ch9,ffx2-ch4,omnis}-1600x900-live36-over-branch.jpg`.

**Verdict: the Omnis blocker is fixed and nothing regressed against live 36; PR-0330 is fixed in Ch IX and FFX-2 Ch IV, and in Ch III it holds about 93 percent of runs at 1600x900, not every run. No blocker; one disclosure to carry (below).**

Verified by running it:
- `tsc --noEmit` clean; `ui-ffx-advisor-roomy` (5) and `ffx2-advisor-lane` (9) pass; orphans 24 (unchanged); `advisorRoomy.ts` 173, `advisorStrip.ts` 65, `hudSafeZones.ts` 543 (same as main), `advisorLane.ts` 140, none grew an over-400 file (`FFXBattleHud.ts`, `FFX2BattleHud.ts` show only LF/CRLF warnings, `git diff --ignore-space-at-eol` is empty). No `src/battle` change, no shared contract, no game data, so no research number to source. Game case is in every commit and the handoff. Full suite `--maxWorkers=3`: 768 files pass, 5 skipped, 11,278 tests pass, 1 failure: `strategy-ffx2-bahamut` "heal-only route clears Mega Flare" timed out at 15,000 ms under load (the same test the first run timed out on); alone it passes, 19 of 19, in 10.7 s. The test is `src/battle` only, which this branch does not touch.
- **Omnis (Ch VII), the previous blocker, fixed and stable:** 10 of 10 runs at each size equal live 36. 1600x900 250x173, 9 lines, `scrollHeight` 68 = `clientHeight` 68 (no clip), zone `compact/170.4/85.2/245/98`. 2000x1012 298x275 (live 289x277), 11 lines with the heading and the effect line, 98 against 97. 1280x720 equal to live.
- **Ch III (FFX), 1600x900:** branch 445x173, 10 lines (NO MP, effect, numbers), 0 px^2 on boss and party; live 36 is 293x188, 7 lines; today's rig (framing off) 380x178, 10 lines. Today's rig text is matched exactly. 33 of 35 runs held (shelf zone `shelf/167.3/163.3/274/69`, `scrollHeight` 70 against `clientHeight` 68, padding only, no clipped child) and 2 of 35 came up as live 36's compact card (`compact/170.4/97.2/245/98`, 283x188 or 249x208, 7 lines). At 2000x1012 branch prints 10 lines (today's rig 10) in 17 of 18 visible runs; one run fell back to the 7-line compact card. Live 36 at 2000x1012 itself varies run to run (compact 333x231 with 10 lines, or a shelf with 11), so at that size the gain is small.
- **Ch IX (Yojimbo):** 8 lines at 1600x900 (284x159) and 2000x1012 (318x171, or 334x247 with 12 lines in 4 of 10 runs), 10 of 10, equal to today's rig (8 lines, 284x159 and 318x171); live 36 at 1600x900 prints 5 lines (230x139). 0 px^2 on boss and party. Note the first repair's 12-line card at 1600x900 (300x231) is gone: the repair's "dominates" test returns the designed 100x98 card, which equals today's rig. Meets the acceptance, shows less than the first repair did.
- **FFX-2 Ch IV (Bahamut):** 11 lines with "100% TO HIT", "+ SHELL" and the reason line at 1600x900 (493x130) and 2000x1012 (about 632x143), 10 of 10 each, 0 px^2 on boss and party; live 36 prints 8 lines at both sizes; today's rig 11 lines (party overlap 1 px^2).
- **390x844:** 374x44 tip, identical to live in all 6 chapters measured. **Controls** (Flux, Yunalesca, Natus, Isaaru, Seymour/Anima, Evrae, Sin Face, Sin Fins, Leblanc, Vegnagun, Trema, Den of Woe, Fallen Aeons, Ixion) at 1600x900, 2000x1012 and 1280x720: the same lines and the same zone as live 36, with run-to-run framing noise only (Flux, Evrae, Den of Woe, Ixion show field or hero framing on one side). Sin Fins 1280x720 once showed live as a 7-line card over the boss (51,740 px^2); two re-runs of each side were identical declines (strip, 3 lines), so that was a live outlier.
- Coverage: tight-box px^2 over boss and party is 0 for the branch in every named chapter and never more than live 36; Vegnagun (about 22,500 to 30,000 px^2 on boss, branch and live alike) and the Fallen Aeons and Ixion party grazes (6 to 21 px^2, within run noise) are the disclosed or pre-existing ones.

**Disclosures (not blockers):**
1. **Ch III's fix is probabilistic.** `FULL_CARD_HEIGHT = 68` against a shelf box of 69 leaves one grid px of margin, and the HUD snaps the boss rectangles to a 4 px quantum (`FFXBattleHud.solveAdvisorPlacement`), so a boss part that lands one quantum lower in the first frames makes the short box fall below 68 and the designed 97-wide compact card (7 lines, exactly live 36's card) is kept. Seen in 2 of 35 runs at 1600x900 and 1 of 18 at 2000x1012; live 36 shows the compact card in most of its runs. Not a regression; the acceptance "every line, in the chapters named" holds about 93 percent of runs, not all. A robust fix is to measure the card (print count or `scrollHeight`) in the HUD instead of a fixed height, or to take the short card when the designed compact is only 97 wide and 98 tall without the Omnis case (Omnis's designed card is 85 wide).
2. The first menu card is sometimes not on screen at all (`.mad__card` hidden, no card for 8 s) at Ch III 2000x1012: 7 of 24 branch runs and 2 of 17 live 36 runs. Same symptom on both builds, so not this branch's; the sample is small and the branch rate is higher, so worth a look in the next round (`cardHidden` and `menu` state, not traced).
3. Ch IX gets today's rig card (8 lines), not the first repair's 12.

**For Bailey:** nothing to decide. The branch is safe to merge for release 38; PR-0330 should be marked fixed with disclosure 1 carried (rerun `cardrect.mjs` for Ch III at 1600x900 a few times, expect 10 lines in all but about 1 in 15 runs).
