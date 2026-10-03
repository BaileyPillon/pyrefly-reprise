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
