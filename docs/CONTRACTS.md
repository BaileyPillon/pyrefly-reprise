# Shared contracts — how to build against them

Five files are written first and imported by everyone else:

| File | Owns |
| --- | --- |
| `src/battle/common/types.ts` | Combatants, statuses, abilities, commands, events, the engine facade |
| `src/battle/common/rng.ts` | The one seeded RNG both engines use |
| `src/story/dsl.ts` | Cutscene steps, speakers, builder helpers, `ChapterScripts` |
| `src/data/encounters.ts` | The five `Chapter` records |
| `src/data/ffx/ids.ts`, `src/data/ffx2/ids.ts` | Every string-literal id union |

`src/sprites/format.ts` and `src/engine/SpriteActor.ts` were on this list while
the game was pixel-art. They are **retired** — the game renders painted 2.5D
through `src/engine/PaintedActor.ts` — and nothing in the app imports them any
more. Do not build against them; see `docs/ENGINE-API.md`.

**Do not edit a contract file without adding a note to
`docs/CONTRACT-CHANGES.md`, newest first.** Additive changes (a new optional
field, a new union member) are fine and only need the note. Renames and removals
need a note *and* a heads-up, because ~30 agents are compiling against this.

The layering rule from `docs/ARCHITECTURE.md` still governs everything here:
`src/battle/**` imports nothing from `src/engine/**`, `src/ui/**` or `three`, and
the engines never animate. They emit events; the presenter plays them.

---

## The playback protocol

This is the single most important thing to get right. The engine is a pure state
machine that answers one question — *what happens next?* — and the presenter is
the only thing that knows about time.

```ts
engine.init(setup);

for (;;) {
  const decision = engine.nextDecision();

  switch (decision.kind) {
    case 'battle-over':
      await results.show(decision.result);
      return;

    case 'resolved':
      // An AI turn, a counter, a status tick. Nothing to ask the player.
      await presenter.play(decision.events);
      break;

    case 'waiting':
      // FFX-2 only: nobody's gauge is full. Advance the clock.
      await presenter.play(engine.tick(decision.nextEventMs));
      break;

    case 'player-input': {
      const command = await ui.chooseCommand(decision.actorId, decision.commands);
      await presenter.play(engine.submit(command));
      break;
    }
  }
}
```

Rules that keep this honest:

1. **`nextDecision()` never mutates state** for `'player-input'` or
   `'battle-over'`. Calling it twice in a row is safe and idempotent for those
   two cases. For `'resolved'` and `'waiting'` it *does* advance, and returns
   what it advanced past.
2. **Events are ordered and numbered.** Every `BattleEvent` carries a monotonic
   `seq`, unique for the whole battle, and `state().log[i].seq === i`. The
   presenter plays them in order and never reorders or drops one.
3. **Events are pure data.** No functions, no class instances, JSON-serialisable.
   e2e tests snapshot them; the debug API prints them.
4. **The presenter owns timing.** `wait`, `camera`, `vfx` and `sfx` events are
   pacing hints the engine emits so that a data agent can tune a boss's rhythm
   without touching the presenter. The presenter may also insert its own timing.
5. **No healing event for damage-formula healing.** A `heals`-flagged action
   emits a `damage` event with a **negative** `amount`. The separate `heal`
   event is only for restoration that never went through the damage chain
   (a Regen tick, Auto-Potion, Mortibsorption). This mirrors the decompile,
   where healing is negative damage, and it is what makes Zombie work.

### Minigame protocol

Overdrives with a timed input suspend the loop:

```
engine.submit({ kind: 'overdrive', id: 'blitz-ace', targets: [...] })
  -> [ ..., { type: 'minigame-request', who: 'tidus', kind: 'tidus-timing', params: {...} } ]
```

The presenter plays events up to and including the `minigame-request`, then
**stops**. The UI opens the overlay named by `kind`, using `params` for tuning
(timer length, zone width, reel strip, the ingredient list). When the player
finishes, the UI re-submits the *same* command with the outcome attached:

```ts
engine.submit({
  kind: 'overdrive',
  id: 'blitz-ace',
  targets,
  extra: { kind: 'tidus-timing', timing: { success: true, timeRemainingMs: 1820, timerMs: 2200 } },
});
```

The engine resolves the Overdrive for real and returns the rest of the events.
If `extra` is absent — AI, auto-battle, a deterministic test — the engine rolls a
default outcome from the seeded RNG and never emits a `minigame-request` at all.
That is what lets e2e run a chapter to victory headlessly.

### Mid-battle story triggers

`MidBattleTrigger`s are evaluated by the engine after each resolved action. When
one fires it emits `{ type: 'script-trigger', name, payload }`. The presenter
pauses playback, hands `name` to the story runner, plays the referenced script,
then resumes the remaining events. `once: true` disarms the trigger; the engine
tracks fired ids in `state().firedTriggerIds`.

---

## How each kind of agent uses this

### Engine agents (`src/battle/ffx/**`, `src/battle/ffx2/**`)

You implement `FFXBattleEngine` or `FFX2BattleEngine`. Everything you need is in
`types.ts`; everything you must *not* import is in `src/engine/` and `src/ui/`.

- Use `SeededRng` from `battle/common/rng.ts`. **Never `Math.random()`.** Draw in
  a fixed order — reordering draws changes replays at the same seed, so if you
  add a roll, add it at the end of the step.
- The FFX damage chain floors toward negative infinity (Python `//`). Write one
  `ifloor()` helper and use it everywhere the research prints `//` on a value
  that can be negative. `Math.floor` is only correct for non-negative operands.
- Status `chance` is a **raw 0–255 byte**, not a percentage. Resistance
  **subtracts**, it does not multiply. The exact branch order is in
  `FFXStatusId`'s doc comment and `research/ffx-combat-core.md` §4.1.
- `ActionFlag` is a **closed set**. If you need a behaviour that is not on it,
  add the flag to `types.ts` and record it in `CONTRACT-CHANGES.md` — do not
  invent an ad-hoc boolean on `AbilityDef`.
- Genuinely one-off scripted rules (Mega Death, Jecht Beam, Mortibsorption, the
  Vegnagun head's fail timer) go in `AbilityDef.extra`, with the keys documented
  in the data file that sets them.
- Do not share status *logic* between the two games. `haste` means different
  things in FFX (recovery `//2`, instant CTB halving) and X-2 (tick rate x1.05).
  The ids are shared; the rules are not.

### Data agents (`src/data/ffx/**`, `src/data/ffx2/**`)

You fill in the stubs. Every one of them is already typed and already compiles,
so `npx tsc --noEmit` tells you when you have finished.

**Every number must cite its research section in a comment.** The form is a
section reference, on the line or the block it applies to:

```ts
// §1.1 [verified: 2 sources] — decompile + wiki agree.
stats: { hp: 70000, mp: 512, str: 30, def: 40, /* ... */ },
```

Carry the research's own confidence tags through: `[verified: 2 sources]`,
`[single source]`, `[estimate]`. A table with no tag anywhere is a defect
(`research/ffx-combat-core.md` §12.4). Where the research records a conflict,
cite the resolution, not the losing side — and where it says *do not fix this
against the wiki* (the Vegnagun Mag/Def transposition), say so in the file.

Ids come from `data/ffx/ids.ts` and `data/ffx2/ids.ts`. If you need an id that
is not in the union, add it there rather than widening a field to `string`.

### UI agents (`src/ui/**`)

You read `engine.state()` and you render `BattleEvent`s. You never mutate state
and you never compute damage.

- **FFX CTB list**: `engine.predictTurnOrder(10)` returns `TurnPreview[]`, already
  sorted ascending by `tickValue` and carrying everything `visual-bible` §3.2
  asks for (`portraitKey`, `isParty`, `letterTag`, `statusIcons`,
  `overdriveReady`, `chargeStage`). Re-sorting is your only job. Pass the
  highlighted row's command as `previewCommand` to re-render the list with that
  command's rank applied — the forecast assumes every *other* actor uses a
  rank-3 action, which is a projection, not a promise.
- **FFX-2 ATB bars**: `engine.gaugeSnapshot()` returns `AtbSnapshot`. Bar
  **length** encodes Agility (`required`), fill rate is global — draw the track
  at a width proportional to `required` so a fast character visibly has a
  shorter runway (`visual-bible` §4.3).
- **Command menu**: `Decision.commands` is `AvailableCommand[]` with `validTargets`
  already resolved, `enabled` already computed and `disabledReason` already
  written. Do not re-derive legality in the UI.
- **Telegraph banner**: the `charge` event carries `{ actorName, stateText,
  stage }` — exactly the payload `visual-bible` §3.13 specifies. The banner is
  transient; the CTB pip (`TurnPreview.chargeStage`) is the state.
- **Damage numbers**: `damage` events carry `hitIndex` and `hitCount`, so a
  multi-hit action stacks on one rising diagonal ladder. Negative `amount` is
  healing. `affinity` tells you when to print IMMUNE / ABSORBED.

### Story agents (`src/story/scripts/**`)

You export one `ChapterScripts` per chapter: `pre`, `post`, `victoryQuips`,
`mid` and `midScripts`.

- Build scripts with the helpers, not raw object literals:
  `say('auron', 'It is not over.')`, `beat(1400)`, `camera('action')`,
  `battleStart()`, `results(true)`.
- `pre` must end with `battleStart()`. `post` must contain `results()`.
- `lintScript()` enforces the house rules from `writing-bible` §2.1 — the
  60-character line cap, one ellipsis per line, no space before an ellipsis. Run
  it in your own unit test.
- `beat()` is the reaction-shot silence. It is a line, not filler: allocate real
  time and do not let the box auto-advance.
- Mid-battle triggers live in `mid` as `MidBattleTrigger[]`, and the scripts they
  name live in `midScripts` keyed by the same id, so a chapter is one importable
  unit.
- Two chapter-specific rules the contract encodes for you: Chapter 4 passes
  `results(true)` and keeps `victoryQuips` **empty** (the Bahamut fight serves no
  flourish at all); Chapter 5's inter-battle Win-slot lines are **scripted** in
  `midScripts`, not sampled from `victoryQuips`, because the limb-pun gag has to
  run in order.

---

## Vocabulary notes

A few places where the contract deliberately does not use the first name a
planning doc reached for, so nobody spends an afternoon looking for the wrong
identifier:

| You might look for | It is actually |
| --- | --- |
| `'thunder'` element | `'lightning'` — same element, X-2's spelling, used for both games |
| `'delay'` status | not a status: the `'weak-delay'` / `'strong-delay'` `ActionFlag`s |
| `'death-pending'` status | not a thing: `doom` is the countdown, `ko` is the result |
| `'sensor'` status | `'scan'` is the status; `'sensor'` is an `AutoAbilityId` |
| formula `'physical'` / `'magical'` | `'strength'` / `'magic'` — decompile-faithful names, matching the research tables the data agents transcribe |
| formula `'drain'` / `'osmose'` / `'absorb'` | not formulas: the `drains` / `drains-mp` `ActionFlag`s on a `magic` action |
| formula `'demi'` | `'percent-current'` with `power: 4` |
| formula `'heal'` | `'healing'`; and a healing *action* is `heals`-flagged negative damage |
| formula `'overdrive-multiplied'` | `'strength'` with `damageType: 'other'` plus the timing bonus |
| `'no-mp'` status (X-2) | `'spellspring'` |
| `Mortibody` | `mortiorchis` — Mortibody is Seymour **Natus**'s servant, not Flux's |

The `FormulaKey` doc comment in `types.ts` carries the full mapping.
