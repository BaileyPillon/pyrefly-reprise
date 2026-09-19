# Pre-release pass, advisor track (2026-09-19)

Browser mode: **gpu** (`PYREFLY_BROWSER=gpu`, `tools/browser-mode.mjs`, ANGLE
D3D11), vite dev server on port 5487, stopped after the run. Chapter 1
(`seymour-flux`), natural play only — nothing was poked into the battle state.

| shot | what it shows |
|---|---|
| `ffx-advisor-card-1600x900-card.png`, `…-full.png` | the NEXT BEST MOVE card at 1600×900 after the fix: *Hastega → the party · GUIDE'S PICK · IN WHITE MAGIC · 30 MP · ALWAYS HITS · + HASTE* |
| `ffx-advisor-card-1280x720-card.png`, `…-full.png` | the same card at 1280×720 |
| `advisor-floor-prerelease.json` | the run's own report (`captured: null` — see below; the `ffx-ally-down-*` tags in it are the driver's old file names) |

**What is *not* here, honestly:** a photograph of the new floor note. Driving
natural play to an actual KO takes more turns than this pass allowed, so no
board with an ally down was reached in the browser; the round-3 critic hit the
same wall and resorted to mutating the state, which leaves the party strip
stale and is why its own live shots were treated as inconclusive. The
load-bearing evidence for the fix is the headless replay in
`tests/unit/advisor-floor.test.ts`, which mutates nothing: Chapter 1, twelve
seeds, 108 decisions with an ally on the floor, **0 silent** (was 138 of 166).

A separate probe on the same server did catch the note channel painting live —
*"While Yuna is a Zombie the next Full-Life is a kill, not a heal — clear it
now"* above the Holy Water — so `.mad__warn--lead` is confirmed to render what
`AdvisorView.note` says.

For the next agent in a browser: **the fight runs on a real clock**.
`window.__pyrefly.frames(n)` alone never opens a player decision — the battle
sat at `battleLog().length === 0` through 300 frames and produced its first
card after ~8 s of `page.waitForTimeout`.
