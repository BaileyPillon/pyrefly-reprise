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
