# PR-0090 preflight — CoachedHud drops setIntentSource

AGENTS.md hard rule 15: `critic-plan --paths src/ui/coach/CoachLayer.ts` classes
this as a DEEP-reviewed shared system, so it gets a short paper preflight before
the build.

## What's broken

`attachEnemyIntent(hud, engine)` (`src/ui/common/EnemyIntent.ts`) duck-types
its target: it only wires the panel when `typeof h.setIntentSource ===
'function'`. Every real battle's `hud` is `this.hud` in `BattleScreen`, which
is always `withCoach(game, realHud)` (`BattleScreenWiring.ts:119`) — the
`CoachedHud` wrapper, never the concrete `FFXBattleHud` / `FFX2BattleHud`
directly. `CoachedHud` implements `HudPort` plus delegation for the optional
members it knows about (`syncVitals`, `syncGauges`, `closeCommandMenu`,
`setAtbMode`, `setTargetingPort`, `update`) but has no `setIntentSource`
method at all, so the duck-type check fails silently and `attachEnemyIntent`
returns without ever calling the real HUD's `setIntentSource`. Both games:
`FFXBattleHud.setIntentSource` and `FFX2BattleHud.setIntentSource` exist and
work; only the wrapper in front of them is missing the forward. This is
shared plumbing, not a per-game mechanic (AGENTS.md rule 14: "both").

## Smallest fix

`setIntentSource` is intentionally NOT part of the typed `HudPort` interface
(`EnemyIntent.ts`'s own comment: "one optional panel is not worth a shape
change" to the five-file contract set in `docs/CONTRACTS.md`). So the fix
stays inside `CoachLayer.ts`: add a local duck-typed forward, same shape as
`EnemyIntent.ts`'s own `IntentAwareHud`, and call `this.inner.setIntentSource`
through it — matching the existing "three optional FFX-2 clock methods"
pattern already in `CoachedHud`. No change to `HudPort.ts` or
`docs/CONTRACTS.md` is needed or wanted.

Separately, pin every *actual* optional `HudPort` member (the typed ones) with
a test that enumerates `HudPort`'s optional keys against a full spy, so a
future optional method added to `HudPort` and left unforwarded fails CI
instead of shipping silently — the failure mode this exact bug is.

## Risk / blast radius

Additive only: one new always-present method on `CoachedHud`, forwarding to
`inner.setIntentSource?.(...)`. No behavior change for HUD mocks that lack the
method (still `undefined`, still skipped by `attachEnemyIntent`'s inner
`e.intent` check). Both games use the same wrapper and the same fix.

## Verify

`tests/unit/ui-coach-layer.test.ts` (new case: a spy HUD with
`setIntentSource` receives what `CoachedHud.setIntentSource` was given) plus a
real-browser proof: chapter 1, press E, the intent panel shows the boss's next
move.
