Build / artifact / target version: ed5cf5224 (release 57 candidate, branch r57-release-d / origin/r57-rc, dist-gate via tools/candidate-build.mjs, bundle index-nBl6O4vJ.js) / vs live r56 5fae4e2bd / targets ba8a7e74a9d6
Review: focused
Deployment: NOT APPLICABLE (candidate review; the live artifact is the live review's)
Changed area: PASS (Valefor's rig and the IMMUNE numeral meet their targets with no regression; the failing continuity findings are not in the changed area)
Ship: SHIP. No critical, no regression against live r56. Discloses R57-001 (CHK-026, Shiva attack to idle in Braska's fight, same measure live), R56-002 (CHK-027 pose-swap jerks, live too)
Milestone: not assessed
Quality: not rescored (focused review)
Targets: 0 required / 0 matched / 0 failing / 0 unverified / 0 waiting
Top issues: R57-001 Shiva attack to idle feet shift 80 px (Shiva registration, suspected); R56-002 pose-swap jerks (candidate worst 134.9 px, live 159.2 px); R57-002 the continuity harness cannot see a rigged figure's KO (polish)
Coverage: tested FFX Flux (Yuna Summon to Valefor, Slow to IMMUNE) at 1600x900 and 390x844, FFX-2 Besaid at three sizes through the KO and Victory, Kimahri and Lulu still on, rig-gate --verify of three rigs, art verify and audit, continuity on Besaid and Braska's final aeon on both builds; reused none; not tested Valefor hurt/KO in an FFX chapter, a real physical miss in the browser, Ixion/Djose, taps, audio
Next required review and why: the deep review of the live build after the deploy (owed by this build)
Elapsed review time / repeated work avoided: about 165 minutes; none avoided

Browser: headless Chromium from node, PYREFLY_BROWSER=gpu (no black canvas), a vite preview on 127.0.0.1:5420 stopped by its PID (80884); the port was confirmed closed. Case: Valefor rig = both games (one art id serves FFX's aeon and FFX-2's hidden Besaid enemy); IMMUNE = FFX only.

What the change did, measured against live r56:
- Valefor's KO size jump is gone. Besaid, harness: largest head jump 0.2 percent on the candidate, 25.8 percent on live. Frames (besaid-ko-cand-sheet.jpg against besaid-ko-live-sheet.jpg): the live KO draws a visibly smaller bird; the candidate keeps full size and crouches. The harness records no swap for a rigged figure (R57-002), so the frames are the evidence for the KO itself.
- FFX Flux, Slow by real keys: IMMUNE on the candidate (1600x900 and 390x844), MISS on live. An injected miss with reason evaded, nullified or wrong-state still draws MISS; immune draws IMMUNE (candidate), MISS (live). In FFX-2 an injected immune miss draws MISS on both builds, as intended.
- Valefor summoned by Yuna in Flux with real keys: rig on ("gate ok, 8 parts, 24 bones, 6 keys"), Attack plays (253), the scripted Banish then dismisses it. Kimahri and Lulu: on, candidate and live.
- rig-gate --verify of kimahri, lulu and valefor against D:/pyrefly-art-r57: all three verified. art-derive verify and audit of dist-gate: PASS. verify-approved with ROOT the release tree: 917 ok, 0 mismatched, 0 missing. poseTrust: empty. No console error, no 4xx, save key pyrefly-reprise:save:v1 present.

Continuity (candidate / live r56), Besaid then Braska's final aeon: CHK-026 Besaid PASS / PASS, Braska FAIL (one Shiva swap, 80.4 px) / PASS (the same swap, 80.3 px, not gated); CHK-027 FAIL / FAIL (worst 134.9 / 159.2 px). Evidence: critic/reviews/ed5cf5224-focused/continuity and continuity-live.

Majors disclosed: R57-001 and R56-002 (neither introduced by this change, neither worse than live). Not tested: Valefor hurt, KO and Overdrive in an FFX chapter (Banish dismisses it in Flux), the 11 other chapters that summon it, Ixion/Djose (R56-001 not re-measured), taps on a phone, and any real physical evaded miss (24 seeds of Tidus attacks drew none).
