Build / artifact / target version: main cc0fea14a, bundle BAH_qvc7, artifact 8c31cde9e3e986fc5e4e3f593c25d6668e4922c5d99bbca62242831ea053446d
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE (live pass)
Ship: not applicable (a live pass); no majors found, one minor disclosed (LIVE-78-1)
Milestone: not assessed
Quality: not scored in a live pass
Targets: not assessed in a live pass
Top issues: LIVE-78-1 (minor): art/characters/wendigo/idle.png 404 x2 on loading the wendigo chapter; battle unaffected; evidence smoke-words-results.json
Coverage: tested = artifact identity (199 changed files vs 6429ff15e), title/board, words bluelight/ifrit/wendigo to a player turn and a command, Chapter I and IV turns with rigs, cone marker and cancel, pause/H, music, reload smoke, pose census; reused = none; not tested = full byte comparison (--full stopped after ~40 min), 3D look/performance, results counts and Sphere bar cap, multi-hit fix, hidden 41-43, Special Eject, link-4 anchor, upgrade matrix, touch
Next required review and why: deep review of affected chapters and systems (owed, carried from 6429ff15e)
Elapsed review time / repeated work avoided: about 60 minutes, most of it the stopped --full download

CHK-017 PASS, CHK-016 PASS, CHK-024 PASS (lightweight). Mode: headless Playwright, PYREFLY_BROWSER=gpu (no black canvas). Console errors 2 and 404s 2, both the single wendigo idle.png URL; 0 elsewhere. Pose census totals: {"subjects":176,"paintings":1257,"pass":948,"waived":101,"rigged":0,"fail":0,"exempt":208,"byClass":{"idle":176,"standing":642,"ko":114,"low":71,"wide":16,"staged":176,"part":62},"byGame":{"FFX-2":819,"FFX":314,"unknown":92,"FF7":32},"byRowStatus":{"ok":862,"held":86,"waived":101,"none":208}}.
