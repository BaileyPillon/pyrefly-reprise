# Chapter VIII (Evrae) unlock: independent verification (FFX only)

2026-09-23, after Bailey's "I'll go with your recommendations let's get to work".
Verifier edited nothing under `src/`, `tests/` or `critic/`.

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Commits `4ce8a94b`, `0a61d546`, `38478077` (the apply report wrote `3847807a`: a typo) | PASS | The only product change is removing `'evrae-airship'` from `LOCKED_CHAPTER_IDS` plus comments. The tests pin VIII unlocked and `seymour-anima-macalania` locked. `tsc` is clean; grid, select-screen and critic-policy tests pass (42/42). |
| 2 | `verify-approved.mjs` | PASS | ok 124, mismatched 0, missing 0. The set `chapter:evrae:2026-09-23` has 6 files, and each sha256 matches `public/art` (backdrop `2679b8ef…`, which is byte-identical to `renders/backdrop-b.png`). |
| 3 | Records | PASS | Both JSON files parse. D-037/038/039 are present. OWNER-VERDICT.md says "This is not an ear verdict" and marks CHK-B1 unverified. |
| 4 | Real keys, GPU (RTX 5070 Ti, D3D11), own vite :5720 with HMR stubbed, stopped by PID | PASS | Title → board (VIII playable, VII COMING) → prep → cutscene (held Enter) → first menu → a real Enter submitted Tidus's action → Esc → OPTIONS → Chapter select → board (mean luminance 53, not black) → Chapter I prep → its cutscene. 0 console errors and no HTTP errors on `/art/` or `/audio/`. Two requests were net::ERR_ABORTED (screen teardown), none returned 404. Shots are in `docs/screenshots/ch8-unlock-verify/` (not committed). |

## Disclosures (not failures)

- Two paintings appear in the game but are **outside the approved set**. Neither is on the r3 sheet:
  - `characters/evrae/ko.png` (the manifest state, shown on KO)
  - `pause/evrae-chapter-card.png` (the chapter-select hero and pause art, marked CANDIDATE in `chapter-meta-evrae.ts`)
- The handoff still has a stale note saying the backdrop is "darker than concept B". The installed plate is byte-identical to concept B.
