# Polish: mid-battle story triggers

Owner of this pass: `src/story/scripts/**`, `src/story/registry.ts`,
`tests/unit/story-triggers.test.ts`. Nothing outside those was edited.

## The defect

The presenter was logging three things during a fight:

```
[presenter] no mid-battle script for trigger "yunalesca-last-quarter"
[presenter] no mid-battle script for trigger "yunalesca-first-zombie"
[presenter] mid-battle script "yunalesca-form-2" did not finish within 30000ms
```

All three are the same bug wearing different hats. A mid-battle beat is wired by
**plain string**, twice over, and neither wire is typed:

1. The engine evaluates each `MidBattleTrigger` and emits
   `{ type: 'script-trigger', name: trigger.id }` — the **`id`**, never the
   `script` field (`battle/ffx/triggers.ts:100`, `battle/ffx2/triggers.ts:77`).
2. Some AI scripts emit `script-trigger` with names of their own invention and
   no `MidBattleTrigger` at all (`battle/ffx2/ai/vegnagun.ts`,
   `vegnagun-head.ts`, `shuyin.ts`).

Either way the presenter does `midScripts[name]`, logs on a miss and fights on
(`engine/BattlePresenterUtil.ts:113`). Nothing connects a trigger id to a
`midScripts` key, so drift is invisible to `tsc`. The timeout is the same bug in
the time dimension: a `say` with no `auto` waits on a Confirm that auto-battle,
a gallery capture or a distracted player never presses, and the presenter
abandons the beat at `SCRIPT_BUDGET_MS` (30 s).

## What is in place now

`src/story/registry.ts` holds the invariants and
`tests/unit/story-triggers.test.ts` (22 tests) enforces them:

- `id === script` for every trigger, and both resolve to a registered script.
- Every AI-emitted name in `AI_EMITTED_TRIGGERS` resolves too. That list is
  hand-maintained on purpose — `vegnagun-head.ts` builds names by template
  (`shuyin-line-${line}`), so no static scan can be trusted.
- No registered script is unreachable (a typo cannot hide as dead content).
- Every mid-battle `say`/`narrate` carries an explicit `auto`; no `choice` and
  no `jump` anywhere in a mid-battle script.
- Worst-case duration is under `MID_SCRIPT_BUDGET_MS` (8 s) for a beat that
  interrupts a live fight, or `SEAM_BUDGET_MS` (26 s) for one of the six
  declared **chain seams** — the scenes between links of a chained encounter,
  where no combat is in flight and the scene *is* the point.

All five chapters carry mid-battle scripts: 4 (Seymour Flux), 5 (Yunalesca),
15 (Braska's Final Aeon -> possessed aeons -> Yu Yevon), 3 (FFX-2 Bahamut) and
22 (Vegnagun/Shuyin, 8 through `mid` and 14 emitted straight from the AI).

## What this pass changed

### 1. Chapter 3's possessed-aeon gauntlet was wired to ids that do not exist

Ten triggers — one entrance and one farewell for each of the five mandatory
aeons — named `valefor`, `ifrit`, `ixion`, `shiva`, `bahamut`. The formations
`buildPossessedAeonChain` produces call those combatants `possessed-valefor` …
`possessed-bahamut` (`data/ffx/enemies/braskas-final-aeon.ts`). Ten grief beats,
all registered, all budgeted, none able to fire. Now wired to the prefixed ids.

This class of bug is invisible to the old test suite *and* to `tsc`, because
`CombatantId` and `AbilityId` are both `string`.

### 2. `bfa-talk-inert` named an ability that does not exist

The trigger was `{ ability-used, who: 'tidus', ability: 'talk-inert' }`. No
ability record anywhere defines `talk-inert`; Talk's only published id is
`'talk'` (`data/ffx/abilities/special-menu-markers.ts`). Renamed the trigger and
its script to `bfa-talk` and pointed it at `'talk'`, which fires on the first
Talk rather than the third — no trigger condition can count uses, and `once:
true` retires it after one. The lines are unchanged; Tidus calling out and
getting `"..."` back reads at least as well on the first attempt.

**This beat still cannot fire, for a reason outside this pass's files** — see
Blockers.

### 3. Two header comments that no longer matched the code

Chapter 5's header claimed no line ever names a duration, while Shuyin's
`shuyin-line-2` says "four minutes". The bible (§3 E7, line 1099) marks that
taunt `[ORIGINAL]` and explicitly calls it *not* a UI value; the comment now
says what the rule actually is ("never as a UI value", reference the meter).

### 4. Nine new tests, in two new `describe`s

**Ids resolve against the chapter they run in.** Walks each chapter's formation
chain the way `BattleScreen` does and holds every trigger against the ids that
can really be on the field:

- the chain resolves end to end, with dangling `nextGroupId`s listed and
  explained rather than warned about at runtime;
- the walk reaches the last formation each chapter is written for (guards the
  walk itself);
- every `who` is a combatant in that chapter;
- every `ability-used` names a real ability;
- the possessed-aeon gauntlet specifically is wired to the prefixed ids.

**The hand-maintained AI list still covers the emitters.** Scans
`src/battle/*/ai/*.ts` for `type: 'script-trigger'` emits and checks every
literal `name` against `AI_EMITTED_TRIGGERS`, plus every templated name
(`shuyin-line-${line}`) against a prefix on the list. The list stays
hand-maintained — a name *disappearing* from the AI is a writing decision — but
a name **added** and not registered is now a test failure rather than a log line
in a fight nobody is watching.

## Verification

- `npx tsc --noEmit` — clean, no errors in any file.
- `npx vitest run` over `story-triggers`, `story-scripts`,
  `story-runner-cutscene`, `presenter-playback`, `presenter-events` —
  **123 passed**.
- Played all five chapters headlessly against a dev server on :5209 with
  `gotoChapter(id, { auto: 'intended', speed: 'skip', seed: 7 })`, watching the
  console: **zero** `no mid-battle script` and **zero** `did not finish within`
  lines. Triggers observed firing at that seed: `seymour-lance`,
  `first-zombie`, all five Yunalesca beats, `first-mega-flare-countdown`,
  `farplane-voice-braska`. Nine of the beats that did *not* fire are gated on
  HP thresholds the party never reached — see the balance note below.
- Shot the beats on the live battle stage with auto-advance off, so the
  dialogue box really draws: `docs/screenshots/polish/story-trigger-*.png`,
  plus the raw audit in
  `docs/screenshots/polish/story-triggers-report.json`. The clean ones to look
  at are `seymour-flux-seymour-half` (Seymour, MAESTER, "It's quieter on the
  other side."), `seymour-flux-first-zombie` and `yunalesca-first-zombie`
  (Rikku, GUARDIAN, caught mid-typewriter), `yunalesca-last-quarter` (Lulu,
  "Stay grey. Her kindness kills the living.") and
  `braskas-final-aeon-bfa-sword` (Jecht, FINAL AEON, on the form change),
  `ffx2-bahamut-first-mega-flare-countdown` (Paine, SPHERE HUNTER) and
  `ffx2-vegnagun-shuyin-shuyin-taunt` (Shuyin, UNSENT) — the last of those is
  an AI-emitted name that had no script at all before this work.

  Two caveats on those files. The capture waits for the box to be showing typed
  text, so a shot can catch the *tail* of the beat before it rather than the
  one in its filename — `yunalesca-last-quarter.png` is Lulu's line from
  `yunalesca-first-zombie`. And a few frames say `no runner`: the battle screen
  had not finished mounting when the tool asked for it. Neither is a product
  defect; both are the capture tool
  (`scratchpad/trigger-audit.mjs`, not checked in).

## Blockers (all outside `src/story/**`)

1. **`Talk` emits no `abilityId`, so `bfa-talk` can never fire.**
   `battle/ffx/execute.ts`, `case 'trigger'`, emits
   `{ type: 'action-start', actorId, command, abilityName: 'Talk', targets }`
   with no `abilityId`; `collectSignals` only records an ability use
   `if (e.abilityId)` (`battle/ffx/triggers.ts`). One-line fix in
   `execute.ts`: add `abilityId: command.id` to that emit.

2. **Chapter 3's chain stops dead after Braska's Final Aeon.**
   `braskasFinalAeonGroup.nextGroupId` is the placeholder `'possessed-aeons'`,
   which no formation exports, so `findEnemyGroup` returns null and
   `BattleScreen` logs `chapter chains to "possessed-aeons" but no formation
   exports that id` and breaks the loop. The possessed aeons and Yu Yevon — and
   therefore twelve of this chapter's fifteen mid-battle beats — are unreachable
   in play. Fix in `data/ffx/enemies/braskas-final-aeon.ts:130`: point it at
   `possessedAeonGroups[0].id` (`'possessed-valefor'`). The test records this as
   `DANGLING_CHAIN_LINKS`; delete the entry when the data is fixed.

## Notes for whoever picks this up next

- **Name collision worth knowing about.** `'yunalesca-form-2'` is both a story
  trigger id and an AI script id (`battle/ffx/ai/yunalesca.ts:245`,
  `data/ffx/enemies/yunalesca.ts:94`). Different namespaces, no interaction, but
  it is exactly the sort of thing that made the original bug hard to read.
- **Seam headroom is thinner than it looks.** `shuyin-appears` models at
  24.5 s against the presenter's 30 s abandon budget, and 9.0 s of that is
  typewriter time at `textSpeed === 1`. Nothing in the UI offers a slower text
  speed today, but `SaveData.settings.textSpeed` is an unbounded number: at 0.5
  that seam models at ~33.5 s and would be abandoned mid-scene. Either clamp
  `textSpeed` at the settings end or trim the seam before that setting ships.
- **The `'intended'` strategy loses all five chapters at seed 7.** Every run in
  the audit above ended `defeat: 1` — Chapter 5 in 15 turns, Chapter 3 in 228
  without Braska's Final Aeon ever reaching his second form. That is why so few
  beats fired: `bfa-sword`, `bfa-low`, `jecht-falls` and the whole gauntlet are
  gated on damage the party never dealt. Nothing to do with the story layer, but
  whoever owns tactics and balance should see it; the per-chapter event
  breakdown is in `docs/screenshots/polish/story-triggers-report.json`.
- **Paine has no portrait.** `story-trigger-ffx2-bahamut-first-mega-flare-countdown.png`
  shows her line typing under a grey placeholder slab where the portrait goes,
  while Seymour, Rikku, Lulu and Jecht all have theirs. `DialogueBox` degrades
  silently on a missing `public/art/portraits/<id>.png`, so this only shows up
  in a picture. One for the art fleet.
- **A damage number can land on top of the dialogue box.** Visible in
  `story-trigger-yunalesca-first-zombie.png`: a floating `240` sits inside the
  box's text area while Rikku's line types. `ui/common/DamageNumbers.ts` is not
  this pass's file, but the mid-battle box mounts into the battle screen root
  and the two layers do not know about each other. Worth a z-order or a pause
  on the numbers while a beat plays.
- **Benched members speak.** `first-zombie` gives its two lines to Rikku and
  Lulu, neither of whom is in Chapter 1's opening trio, so the portrait that
  comes up is of someone not on the field. It reads fine in a Persona-style box
  and the voices are right for the line (Lulu is the caster, Rikku the
  squeamish one), but if the presentation owner wants only active members to
  speak, these are the beats to revisit.
- **`hp-below` at `fraction: 1` is the "enters the field" idiom.** There is no
  entrance condition in the trigger vocabulary, and `matches` returns false when
  `tryActor` cannot find the combatant, so the trigger fires on the first
  evaluation after that unit is in play. Chapters 3 and 5 both rely on it.
- **Port 5209 already had a Vite dev server on it** when this pass started (a
  node process from 14:07, before this session), so `npx vite --port 5209
  --strictPort` refused to start and the captures ran against the existing one.
  It is still running. It is on this pass's assigned port, so it is almost
  certainly a leftover from an earlier crashed run of this same task — but
  since this pass did not start it, it was left alone rather than killed out
  from under whatever might be using it.
