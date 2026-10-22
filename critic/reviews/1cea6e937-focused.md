Build / artifact / target version: 1cea6e937 (release 60 candidate, dist-gate index-CXbIrsG6.js) / ba8a7e74a9d6
Review: focused
Deployment: NOT APPLICABLE
Changed area: FAIL (CHK-026 head gate on the new rigs; everything else met its target)
Ship: SHIP, better than live r59. Discloses FOC60-01 (major, inside the new rigs).
Milestone: not assessed
Quality: not scored in a focused review
Targets: 0 / 0 / 0 / 0 / 0 (no tile composites; hand comparison with live)
Top issues: FOC60-01 rig head size gate (major, new feature); FOC60-02 battle-start gap, same as live (polish); FOC60-03 touch route cannot win Ch I at 390, same on live (polish)
Coverage: Ch I and IV at three sizes, demo and not; II, V, VI vs live; look/motion off; reduce flashes; orb and spark; continuity on both builds. Not tested: 2000x1012, demo seeds 10 and 12, CHK-004/5/6/8/9, tile composites.
Next required review and why: deep review on the live build (shared systems changed)
Elapsed review time / repeated work avoided: about 330 minutes; no earlier evidence reused

- No critical defect: Ch I and Ch IV (and II, V, VI) won with real keys at 1600x900 and 2560x1440 (Ch IV also 390x844), 0 console errors, 0 missing files, 59 to 60 fps, no stall beyond live's own battle-start gap.
- No regression against live in shipped behaviour: the other chapters match live r59 side by side (no look); look on only in Ch I and Ch IV; ?look=off and ?motion=off switch exactly their own parts; the REDUCE FLASHES run shows no blow-out.
- The one gate FAIL (CHK-026 head metric on the new Seymour and Bahamut rigs) is inside brand-new features (the rigs), so it is disclosed and does not block; CHK-027 motion is better than live (4 jerks and no double image against 10 and 4).
- Demonstrated fixes: first Attack in Ch I opens on Seymour; no damage to a girl after Bahamut falls in four Ch IV routes; the Potion orb and spark play.
