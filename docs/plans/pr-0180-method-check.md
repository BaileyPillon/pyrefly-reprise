# PR-0180 method check (rule 15): FFX never names an action

Written 2026-09-26, paper only. **Game case: FFX only** (the FFX HUD; FFX-2's `.ffx2hud__message`
banner already prints its messages). Every FFX chapter; most visible in IX (Zanmato), X (Natus's
party-wide hit and follow-up) and XII.

## The issue as the critic measures it

Round 12 (R12-FN-01, new) and round 13: an enemy's action lands with no name on screen. In X,
three hits land 0.04-0.74 s in, the camera cuts to Natus, a second strike lands at 1.9-2.1 s, and
nothing names either. Expected (the critic's words): "the enemy's action name is readable as it
begins (FFX shows it top-centre)". Acceptance: in X and XII the enemy's ability name is in the DOM
and on screen within 200 ms of action-start.

## Traced

- The FFX HUD already owns the approved `.ig-banner` (paper slab with a name slab and a chip,
  `FFXBattleHud.ts:280`), shown by `setMessage` on `message` events. `bannerSpeaker.ts` decides who
  the banner names.
- The FFX engine emits `action-start` with the actor and ability, but no `message` for an enemy
  ability, and `setMessageBarFactory` (`BattlePresenterFallbacks.ts`) is never called for FFX
  (round 13's tag note). So there is a surface and a hook, and no line between them.

## Why it stalled

It is **blocked on a source, not on code.** "FFX shows it top-centre" is the critic's memory.
`research/ffx-vs-ffx2-presentation.md` is silent on where or whether FFX prints an enemy's ability
name, and no other research file says it (searched for "ability name", "action name", "message",
"banner", "help window"). Rule 6 forbids building a presentation rule from memory, rule 14 needs the
FFX case from a source, and rule 9 asks whether the banner's use here is approved. No batch could
take it as class A, and nobody wrote down that the block was the source, so it was carried twice.

## Alternatives

1. **Build it now from memory.** Rejected (rule 6).
2. **Build it behind an OFF switch now, source it in parallel** (the program's route). A new module
   `src/ui/ffx/actionBanner.ts`: on an enemy `action-start` whose ability is not a plain Attack,
   show the ability name in the existing `.ig-banner` (no new element, so no new look), held for
   the action; a flag in the module, OFF. The approved Steam session (D-205, Bailey 2026-09-26,
   plan `docs/plans/steam-session-2026-09-26.md` item 5) or a GameFAQs citation (D-214 makes
   GameFAQs acceptable where research is silent, labelled as our estimate) decides the switch, the
   position and which actions are named (enemy only, or party skills too).
3. **Close as not retail** if the source shows FFX prints no enemy ability names. Then PR-0180 is
   refuted with the citation, and the Zanmato banner (PR-0191, approved O-5 / D-062) stays the only
   named action.

## The smallest test that tells them apart

The source question itself: one early FFX battle on the Steam HD Remaster (the prologue has enemies
with named abilities), noting whether a name appears, where, and for how long; or one GameFAQs page
that says so. No code can answer it. For the build, a unit test that an enemy `action-start` with a
non-Attack ability sets the banner text when the switch is on and does nothing when it is off.

## Recommendation

**Change method: build OFF, source in parallel, then switch.** Batch 2 builds alternative 2 with
the unit test and leaves it OFF (the banner already exists, so it is not a new perceivable element).
The driver records the Steam or GameFAQs answer as a research line with its source note; if it
confirms, one commit turns the switch on (a focused review, FFX only) and round 14 or 15 checks the
200 ms acceptance in X and XII; if it refutes, PR-0180 is closed with the citation.
