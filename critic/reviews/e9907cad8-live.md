Build / artifact / target version: main e9907cad8, bundle BygGxbJE, artifact d764fe0e...c9966 (Release 64), https://echoesofspira.com/
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE (the focused/deep review owns it)
Ship: not a ship gate (live review); no majors found or disclosed by this pass
Milestone: not assessed
Quality: not assessed (last full score unchanged)
Targets: not assessed in this pass
Top issues: none from this pass; observation only: Chapter I's opening dialogue box can sit over the boss ribbon for a few seconds (disclosed in the release 64 entry as carried from 63)
Coverage: tested: whole-artifact identity (7168 files), Chapter I and IV title to player turn plus one action, boss-bar and Intel counts, cancel paths, pause/H, music fetch, reload; not tested: full CHK-024 matrix, dim-plane effects, phone/tablet, other chapters
Next required review and why: the deep review this build still owes (marker review=deep; shared systems changed)
Elapsed review time / repeated work avoided: about 50 min (about 42 of it the full byte comparison of 7168 files); release 63's smoke driver reused

# Live verification, release 64 (e9907cad8)

**Identity (CHK-017): PASS.** verify-live --full: 7168 files checked, 0 mismatched, 0 missing, 0 wrong type; the diff run from release 63 also PASS (56 files). Hash equals the deploy marker.

**Smoke (CHK-016): PASS.** 1600x900, fresh profile, GPU headless Chromium, real keys. Chapter I first menu: 1 boss bar, 0 Intel panels, no coach card. Chapter IV first menu: 1 boss bar (ribbon only), 0 Intel panels, guide folded; the Skill list opened and cancelled; an action resolved and the HUD stepped back to the ribbon plus slim party cards. Pause, H hide and resume worked. Prerendered music was fetched in both chapters. 0 console errors, 0 404s.

**Reload (CHK-024): PASS (lightweight).** Master volume 80 to 60 survived a reload. Upgrade matrix not run.

**Pose census (data):** {"subjects": 146, "paintings": 1106, "pass": 829, "waived": 79, "rigged": 0, "fail": 0, "exempt": 198, "byClass": {"idle": 146, "standing": 565, "ko": 90, "low": 71, "wide": 4, "staged": 176, "part": 54}, "byGame": {"FFX-2": 777, "FFX": 307, "FF7": 22}, "byRowStatus": {"ok": 745, "held": 84, "waived": 79, "none": 198}}

Frames: D:/Tools/pyrefly-scratch/2026-10-25/live64/ (owner-1-ch4-first-menu.jpg, owner-2-ch4-action.jpg, owner-3-ch1-first-menu.jpg; also 2-ch1-attack-a/b, 3d-ch4-list)
