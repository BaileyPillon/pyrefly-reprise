# Paper preflight: the one-time Wait migration and the mode-aware briefing line

Paper preflight under `critic/RUBRIC.md` §4 / AGENTS.md rule 15, written **before** any
product code, 2026-09-23, by a sub-agent of the orchestrator. Track: `ffx2-wait-mode`
(follow-ups). `node tools/critic-plan.mjs --paths src/app/SaveData.ts,src/ui/coach/coachCopy.ts,src/ui/coach/Briefing.ts`
says **DEEP, before deploy** (save-data class). Follows `docs/plans/ffx2-wait-mode-review.md`.

Bailey, verbatim, 2026-09-23 00:00 EDT, on the three follow-ups in
`docs/handoff/ffx2-wait-mode.md` §6 (1 migrate existing saves to Wait; 2 keep the
whole-menu hold or build the faithful split; 3 the approved briefing line A keep / B show
only when Active / C reword):

> "1, 2, 3 I'll take your recommendations on all please"

So: (1) a one-time migration to Wait, adopted; (2) the whole-menu hold stays, the faithful
top-level/submenu split is **deferred** to the next release (nothing built here); (3) B + C,
the fourth briefing line is mode-aware, his approved words when Active, a new Wait line
recorded as INFERRED.

**Verdict: PROCEED.**

## 1. Game case (rule 14)

| Piece | Case | Why |
|---|---|---|
| The migration of `Settings.ffx2Atb` | **FFX-2 only** | Only the FFX-2 engine reads the field (`BattleScreenWiring.applyAtbMode`); ATB Mode is an FFX-2 Config entry (`research/ffx2-combat-core.md` §1.5). |
| The marker field | shared save plumbing, no behaviour of its own | It only records that the rule above has run. |
| The fourth briefing line | **FFX-2 only** in content | The briefing is the one shared surface (C1), but line 4 ("In hers, ...") is the sentence about FFX-2's clock. Lines 1 to 3, including FFX's "In mine, nothing moves until you move", do not change. |

## 2. The exact rule

In `migrate()` (every load goes through it; `SaveStore.load` → `migrate(parsed)`):

- `raw.settings.ffx2AtbMigrated === true` → the player's `ffx2Atb` is kept as stored
  (normalised only if it is not `'active'`/`'wait'`: garbage reads as the default, CHK-024).
- anything else (absent, `false`, a non-boolean) → `ffx2Atb = 'wait'`, `ffx2AtbMigrated = true`,
  **whatever `ffx2Atb` held**: before this release Active was the only behaviour the engine
  had and `'active'` was the stored default, so a stored `'active'` is not a choice anybody
  made (handoff §6.1).
- `defaultSettings()` carries `ffx2AtbMigrated: true`, so a fresh save is Wait with the marker
  and the rule never fires on it.

**Name and place.** `Settings.ffx2AtbMigrated?: boolean`, beside the field it guards, named
like its neighbours (`ffx2Atb`, `ffx2AtbSpeed`). Optional in the type so a hand-built
`Settings` in a test or an older caller still compiles.

**No version bump.** `SAVE_VERSION` has been 1 since the first save; the file's own
convention for every later field is *presence decides* (`seenCoach`'s veteran rule fires
once because the field's absence is the signal). A bump would also change `version` in
every blob, which the deep-equality proof below forbids, and buys nothing: the marker is
per-rule and cannot be confused with another migration's.

The rule lives in its own small module (`src/app/saveFfx2Atb.ts`), called from `migrate`,
because `SaveData.ts` is already over the 400-line house cap (551); `SaveData.ts` only gains
the import, the call and the doc changes.

## 3. Idempotence

Let `M = migrate`. For the two fields the rule touches:

- After one pass the marker is `true` (both branches set or keep it).
- A second pass sees the marker `true` and takes the keep branch, so `ffx2Atb` is what the
  first pass wrote. So `M(M(x)).settings` equals `M(x).settings`; every other field of
  `migrate` was already idempotent (spreads over defaults, `sanitizeChapters` is a fixpoint
  after one pass, the veteran rule fires only when `seenCoach` is absent, and the first pass
  writes it).
- Across the disk: `load()` does not write. If the player changes nothing, the blob on disk
  still has no marker and the next load migrates again, to the same answer (Wait): still
  one decision, deterministic. The first `save()` of any kind (a clear, an attempt, play
  time, any setting) writes the marker with the whole blob. A player who flips the row to
  ACTIVE writes `ffx2Atb: 'active'` **and** the marker in the same `setSettings` → `save()`,
  so the next load keeps Active. There is no write path that serialises settings without the
  marker, because every in-memory `settings` came out of `migrate` or `defaultSettings`.
- Downgrade (the live release-08 build reading a migrated blob): its `migrate` spreads
  `raw.settings` over its defaults, so the unknown marker survives and is written back; a
  choice made there under the old build is kept by this build. Safe.

## 4. What could lose progress, and how we prove it does not

Progress = `chapters` (cleared, best time, best turns, attempts, play time), `unlocked`,
`seenCoach`, `flags`, and every other setting (volumes, guide / advisor / intent, help,
text speed, reduce motion, ATB speed, pause panels).

Risks and the proof for each:

1. **The rule clobbers something besides `ffx2Atb`.** Proof: a fixture built from the
   *current writer* (a real `SaveStore`, a cleared chapter with times, play time, an unlock,
   a flag, a seen coach id, non-default volumes, ATB speed Fast, `ffx2Atb: 'active'`),
   serialised, then the marker deleted from the JSON (= release 08's shape). Loading it must
   deep-equal the fixture except `settings.ffx2Atb` → `'wait'` and
   `settings.ffx2AtbMigrated` → `true`. Also the same as `toStrictEqual` after a
   `save()`→reload.
2. **The rule re-fires and overrides a later choice.** Proof: migrate, flip to ACTIVE via
   `adjustSetting`, reload from the same storage: ACTIVE. Twice.
3. **A corrupt value throws or leaks.** Proof: marker present with `ffx2Atb: 'banana'` →
   `'wait'`; `settings: null`, marker `'yes'` (non-boolean) → migrates to Wait with the marker.
4. **The veteran rule or play-time sanitising interacts.** They read different fields; the
   fixture in (1) has a cleared chapter and a `seenCoach`, so the veteran path is covered.

Tests are written first and must be seen failing against the current `migrate`.

## 5. The mode-aware line

- `coachCopy.ts` keeps `BRIEFING_LINES` exactly as approved (the Active reading) and adds
  `BRIEFING_WAIT_LINE`, plus a pure `briefingLines(mode)`: Active → the approved four;
  Wait → the first three approved lines and the Wait line.
- The Wait line, same shape (lead "In hers, ", gold half, closing quote):
  **"In hers, *the clock holds while you choose*."** True of the build: under Wait the
  engine moves nothing while a command menu is open (`docs/handoff/ffx2-wait-mode.md` §1),
  and the clock runs between turns, which the line implies and which FFX does not do. No
  game fact is claimed beyond the build. Recorded in `docs/target/targets.json`, tile C1,
  `reaction.inferred`, "Wait-mode fourth line drafted by the agent, awaiting Bailey".
- The mode is read **when the briefing is shown** (`Briefing.show()`), through
  `coachState.ts` (the one module in `src/ui/coach/` that reads the save), so a first launch,
  the title replay and the pause replay all print the line for the mode the save holds at
  that moment, including a flip made in the same pause.

## 6. Out of scope, recorded

- The faithful Wait split (top level runs, submenu freezes): **deferred to release 10**
  (D-029 follow-up 2). Nothing here touches the engine, the presenter or the HUD.
- `docs/CONTRACT-CHANGES.md`: only if `SaveData.ts` is a listed contract (it is not listed in
  `docs/CONTRACTS.md` at the time of writing; checked again before commit).
