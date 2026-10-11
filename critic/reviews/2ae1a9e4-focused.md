Build / artifact / target version: 2ae1a9e4 (RC2, dist-gate built in D:/pyrefly-r3945) / targets ba8a7e74a9d6
Review: focused (headless Playwright, PYREFLY_BROWSER=gpu, no black canvas)
Deployment: NOT APPLICABLE (pre-deploy)
Changed area: FAIL (CHK-027 motion, a pre-existing failure identical on live)
Ship: SHIP. Better than live, no critical, no regression. Discloses FOC3945-01 (motion continuity fails on four FFX chapters, same on live).
Milestone: not assessed
Quality: no full score for this build
Targets: required 1 / matched 1 / failing 0 / unverified 0 / waiting 0
Top issues: FOC3945-01 major (CHK-027, not introduced), FOC3945-02 polish (tile text stale after D-659), FOC3945-03 suggestion (menus tool assumes Tidus first)
Coverage: see below
Next required review and why: live verification after the deploy; deep review afterwards on the live build
Elapsed review time / repeated work avoided: about 115 minutes (70 the continuity harness on both builds); tsc and the full suite reused from the driver

# Focused review of RC2 2ae1a9e4 (FFX only)

Game case: FFX only (research/re-ffx-*.md). FFX-2 sources are identical to live.

## Key risk: the advisor after the slower engine
Real key presses, 7 menus per chapter, seed 7, candidate against https://echoesofspira.com/ (72973096). The card is on screen within a frame of every menu in Ch II, III, X and XVIII on both. Long tasks and frame gaps are equal or lower on the candidate: first N press worst gap 160/150/175/152 ms (Ch II/III/X/XVIII) against 172/185/240/345 ms live; later menus under 35 ms on both. No visible stall.

## Changed flows
- Cid Orders (Ch VIII): one order at a time (Pull back at NEAR, Close in at FAR, Cancel while one stands); Cancel drops it and Pull back is offered again. Checked at 1600x900, 2000x1012, 390x844.
- Braska Talk (Ch III): greyed while a Talk waits, a third Talk offered, then spent.
- Lines: debug-auto in the bundle, seeds 1-3: Ch XVIII 3 victories (live 3 defeats), Ch X 3 (live 2), Ch IX 3 (live 2). Real-key fights of Ch II, III, VIII, IX, X, XVIII and FFX-2 Ch V reach results without errors.
- Data audit passes.

## Issues
See the JSON: FOC3945-01 to 03.

## Not tested
- The 500-seed win-rate claims (relied on the driver and 24-seed unit tests; the browser sample is 3 seeds)
- A human following the advisor through the Ch XVIII, X and IX lines by hand
- Continuity on the other chapters (presenter code untouched)
- Phone layout beyond the Orders widget
- Audio (untouched)
- Live deployment verification (after the deploy)
