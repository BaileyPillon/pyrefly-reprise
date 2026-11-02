# Chapter XVIII (Sin's face): CHK-027 lift proof (jobs J73-2 and J73-3)

Candidate `r73` 313e18dc2, dev server on the tree, seed 1, 1600x900, real keys, `?coach=off`. Each speed is read against `?treated=pack` at the same seed. FFX only (Chapter XVIII).

| speed | CHK-027 candidate | CHK-027 control | one-frame hops over 100 px (candidate / control) | worst hop (px) | playback speed log | re-assertions of fast | R presses |
|---|---|---|---|---|---|---|---|
| normal | PASS | PASS | 0 / 0 | 0 / 0 | as intended all fight | 0 | 1 |
| fast | PASS | PASS | 0 / 0 | 0 / 0 | as intended all fight | 2 | 1 |

CHK-026 (a carried class, not the lift criterion): candidate FAIL / FAIL against the control FAIL / FAIL (normal / fast); swaps over the head tolerance, candidate against control: normal 48 / 49, fast 46 / 46.

Seed 2 (candidate only, both speeds): normal PASS with 0 hops, fast PASS with 0 hops.

Sensitivity run (the same fight at fast with `?fastfloor=today`, release 72's strike): CHK-027 FAIL with 26 one-frame hops over 100 px (worst 400.9 px), so the candidate's zero hops are not a blind harness.

Read by `tools/owed-lifts.mjs`: `continuity.chapters` holds the four candidate runs (seed 1 and seed 2, normal and fast); the two control runs are under `continuity.controls`, the sensitivity run under `continuity.sensitivity`.
