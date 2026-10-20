Build / artifact / target version: 5fae4e2bd (release 56 candidate, dist-gate via tools/candidate-build.mjs, bundle index-DXrkBaKj.js) / vs live r55 b24614c05 / targets ba8a7e74a9d6
Review: focused
Deployment: NOT APPLICABLE (candidate review; the live artifact is the live review's)
Changed area: FAIL (three disclosed majors, none introduced by this change)
Ship: SHIP. No critical, no regression against live r55. Discloses R56-001 (CHK-026 one swap), R56-002 (CHK-027 jerks, live too), R56-003 (an immune status shows MISS, not IMMUNE, live too)
Milestone: not assessed
Quality: not rescored (focused review)
Targets: 0 required / 0 matched / 0 failing / 0 unverified / 0 waiting
Top issues: R56-003 MISS shown for an immune status (src/ui/ffx/FFXBattleHud.ts miss path ignores the reason); R56-002 pose-swap jerks FFX-2 XVI; R56-001 one stature swap FFX-2 XVI
Coverage: tested FFX-2 X, XV, XVI, Angra Mainyu (Wait and Active), FFX III phone taps, Flux Slow, hidden-chapter voice, Pilgrimage phone, layouts at three sizes, continuity on XVI both builds; reused none; not tested a greyed-aeon tap in the browser, a human holding a menu in Active, the 500-seed rates, the data notes
Next required review and why: the deep review of the live build after the deploy (owed by this build)
Elapsed review time / repeated work avoided: about 120 minutes; none avoided

Browser: headless Chromium from node, PYREFLY_BROWSER=gpu (no black canvas), a vite preview on 127.0.0.1:5410 stopped by PID afterwards (port confirmed closed). Case: FFX-2 only (action time per command, Den of Woe drink), FFX only (Grand Summon tap, immune miss, Overdrive help), both (voice index, review tooling).

FFX-2 with the new action timing (seed 2, Wait, candidate against live r55): Angra Mainyu won in 338 game seconds with 62 boss acts (11 a minute) while live r55 was still fighting after 487 s with 124 acts (15 a minute); Den of Woe won through all three links; Ixion and Djose won; Trema won through Paragon and Trema where live r55 lost at Paragon on the same seed. No stalls, no double turns, no console errors, no 400s. Wait and Active gave the same battles because the autoplay decides at once.
FFX phone: the Grand Summon picker takes taps (candidate rows 44 px at 14 px; live r55 22 px at 10 px and the title tap does nothing); Defend adds no IMMUNE; the hidden FFX chapters make no voice request that 404s (live r55: one 404 each); the Pilgrimage route and prep have 44 px targets, 14 px text and a pinned Begin button (live r55: 11 px text and the Begin button off screen), and its first fight plays boss-seymour-macalania.
