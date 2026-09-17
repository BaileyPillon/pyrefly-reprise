# Fix: ffx2-sensor

Key: `ffx2-sensor`. Scope: `src/battle/ffx2/**` (engine only — no FFX-2 data
file was touched), plus two **additive** fields in the shared contract
`src/battle/common/types.ts` and one new test directory.

## The defect

Nothing anywhere in the project emitted a `'sensor'` `BattleEvent`.

`grep -rn "type: 'sensor'" src/` matched exactly one line before this change:
the union member's own declaration in `src/battle/common/types.ts`. Both
consumers were already written and both were dead:

- `src/ui/ffx2/FFX2BattleHud.ts` keeps a `revealed: Set<CombatantId>` that is
  only ever added to in `case 'sensor':`. `src/ui/ffx2/BossGauges.ts` prints
  `<span class="ffx2boss__hint">SCAN</span>` where the HP numerals go for any
  enemy not in that set. With no event, **the boss strip could never leave its
  SCAN state in real play** — the whole Vegnagun chain, Bahamut and Shuyin
  showed `SCAN` for their entire fights.
- `src/ui/ffx/SensorPanel.ts` and `src/engine/BattlePresenterEvents.ts` have
  the same problem on the FFX side (see "FFX is not equivalent" below).

`x2-gun-mage-scan` (`src/data/ffx2/abilities/gun-mage.ts`) is `power: 0`,
`formula: 'none'`, no `statusEffects`, no `flags`. `resolveAbility` ran it
through the ordinary pipeline: it rolled a hit check, rolled a crit, drew the
step-7 randomiser, hit the `formula === 'none'` branch, called `applyRiders`
against an empty rider list, and returned. The action spent the girl's turn,
burned three RNG draws, and did nothing observable.

## What research says this action is

- **Scan** — Gun Mage support ability, `init` AP: "reveals target HP, MP,
  elemental affinities, status resistances" [ffx2-combat-core §3.7].
- **Scan Lv. 2** (20 AP) "lets you rotate/zoom the enemy model in the Scan
  screen"; **Scan Lv. 3** (100 AP) "Scan can also target your own party"
  [§3.7]. Both are *screen* upgrades, not actions — they must never reveal.
- **Libra** (Floral Fallal main part, 4 AP) and the Machina Maw right-crusher
  **Scan** (10 AP) are listed as "Scan-equivalent"; **Ma'at's Feather** (Full
  Throttle sinistral wing, 10 AP) as "Libra / Scan equivalent"
  [ffx2-combat-core §2.9.2].
- **There is no Sensor auto-ability and no Sensor accessory in FFX-2.**
  `sensor` is an FFX `AutoAbilityId` only (`types.ts` §5). The nearest-looking
  X-2 entry, Beaded Brooch's **Sense Preserver** [§5.4], belongs to the
  `*-Preserver` family alongside Health / Sanity / Time / Life Preserver and
  has nothing to do with revealing an enemy. So the task's "the Sensor
  auto-ability/accessory if research defines one" resolves to: **it does not,
  and nothing was added for it.** The one-line `full: false` bar is still
  implemented so the shared event contract has one working implementation.

## The fix

### `src/battle/ffx2/sensor.ts` (new)

`src/battle/ffx2/**` imports nothing from `src/data/ffx2/**`
(`docs/CONTRACT-CHANGES.md`), so the engine recognises a reveal from the
`AbilityDef` shape alone:

- `sensorKind(ability)` returns `'scan' | 'sensor' | null`.
  1. **Explicit marker first**, so data can always overrule the heuristic:
     `extra: { reveals: 'scan' | 'sensor' }`, or the shorthands
     `extra: { scan: true }` / `extra: { sensor: true }`. **Data agent: this is
     the hook to set** — no engine change is needed to add a new reveal.
  2. Otherwise: reject anything carrying `extra.passive` or
     `targeting: 'self'` (that is the shape every support upgrade has in this
     data — `x2-gun-mage-fiend-hunter-lv2` is the live example, and Scan
     Lv. 2 / Lv. 3 will land in it), then whole-word match `scan` or `libra`,
     or the literal `maats feather`, in the ability's name or id.
- `weaknessesOf(target)` — `ELEMENT_IDS` filtered to `affinity === 'weak'`,
  `none` excluded, HUD display order preserved.
- `revealTarget(emit, sourceId, target, kind)` — emits the event and latches
  the reveal. Returns whether the target came out revealed.
- `resolveSensor(emit, user, pool, kind)` — the whole action over a pool.

### `src/battle/ffx2/resolve.ts`

One early exit in `resolveAbility`, placed **after** the target pool is
resolved and MP is spent and **before** the hit loop:

```ts
const reveals = sensorKind(ability);
if (reveals) {
  resolveSensor(ctx.emit, user, pool, reveals);
  return 0;
}
```

A reveal is a pure information action, so it rolls nothing: no accuracy
check, no crit, no step-7 randomiser, no `registerHit`. It therefore consumes
**zero draws** from the seeded RNG and cannot shift a replay — the draw-order
rule in that file's header is preserved. FFX models its own Scan the same way
(`canMiss: false`, `src/data/ffx/abilities/special-utility.ts`).

### Secrecy rules, from the contract's own flag docs

| Target state | Scan (`full: true`) | Sensor bar (`full: false`) |
|---|---|---|
| ordinary | `sensor` + numerals, `revealed = true` | same, `full: false` |
| `immune-to-scan` ("Scan fails") | `miss` / `reason: 'immune'`, not revealed | unaffected — a bar is not a Scan |
| `immune-to-sensor` ("Sensor returns `- - -`") | `sensor` with **no** numeral fields, not revealed | same |
| `flags.hideHpBar` ("parts whose HP is a secret") | `sensor` with no numerals, not revealed | same |

Braska's Final Aeon's final form carries both immunity flags
(`src/data/ffx/enemies/braskas-final-aeon.ts`), which is the shape this table
was written against.

Panel text: `full` prefers `scanText` then `sensorText`; the one-line bar
prefers `sensorText` then `scanText`. `misleadingSensor` is deliberately **not**
consulted — writing-bible §5.3 says sensor text is in-world advice and is
allowed to be wrong, and the engine's job is to print it, not to correct it.

## Contract changes (both additive, both optional)

1. `BattleEvent` `'sensor'` gains optional `hp`, `maxHp`, `mp`, `maxMp`,
   `weaknesses?: ElementId[]`. A snapshot at reveal time, so a panel can print
   numerals from the event alone. Absent = "kept secret", which is how the
   `- - -` rows above are expressed.
2. `Combatant.revealed?: boolean`. Latched on reveal, **never cleared** — it
   survives KO, form changes, gauge ticks and a chained link, so the boss strip
   cannot fall back to `SCAN` mid-fight. `state().combatants[id]` holds the same
   object the engine mutates, so `state()` exposes it immediately.

No existing field changed shape; `npx tsc --noEmit` is clean across the repo.

### Optional follow-up for the FFX-2 HUD owner

`FFX2BattleHud` still keeps its own `revealed` Set built purely from events.
That is correct and needs no change, but it means a HUD mounted *mid-battle*
(a re-mount, a resume) starts blank. Seeding it from
`state().combatants[id].revealed` on the first `render` would close that gap.
Left alone here — `src/ui/**` is not this key's scope.

## FFX is not equivalent — read-only finding, nothing edited

The task asked for a read-only check of the FFX engine's Sensor behaviour.
**It is broken in the same way, and in two places:**

1. **The `scan` ability emits nothing.** `src/data/ffx/abilities/special-utility.ts`
   applies `{ status: 'scan', chance: 254, duration: 254 }` and that is all.
   The `scan` status is otherwise inert — `src/battle/ffx/statuses.ts` only
   lists it in `SURVIVES_KO`, and `equipment.ts` / `setup.ts` only ever use the
   id as a *resistance* key (Aeon Ribbon, aeon innate immunities). So FFX's
   Scan sets a flag nobody reads and never opens `src/ui/ffx/SensorPanel.ts`,
   whose `show()` is reachable only from `case 'sensor':` in
   `src/ui/ffx/FFXBattleHud.ts`. `BattlePresenterEvents.ts`'s `case 'sensor':`
   banner is dead for the same reason.
2. **The `sensor` auto-ability does nothing at all.**
   `autoAbilitiesOf` / `hasAutoAbility` in `src/battle/ffx/equipment.ts` have
   no caller that looks for `'sensor'`. Kimahri's Spear carries it in three
   shipped builds (`src/data/ffx/builds/zanarkand.ts`, `gagazet.ts`,
   `dreams-end.ts`), and it is inert in all three.

The FFX fix is the mirror of this one and is small: in the FFX resolver, when
an ability applies the `scan` status (or the actor has the `sensor`
auto-ability and the action is a targeted one), emit
`{ type: 'sensor', targetId, full, text, … }` with the same secrecy table, and
set `Combatant.revealed`. `full: true` for the Scan ability, `full: false` for
the auto-ability bar — that split is exactly what the `full` field was added
for. **Not done here:** `src/data/ffx/builds/zanarkand.ts` is owned by the
Yunalesca-repair agent this session, and the task scoped FFX to a read-only
check. Recommend spinning this out as `ffx-sensor`.

## Tests

`tests/unit/ffx2/sensor.test.ts` — 16 tests, new directory.

- **Detection against the real data table.** The suite imports
  `src/data/ffx2/abilities/gun-mage.ts` itself, so it fails if the real
  `x2-gun-mage-scan` ever stops being recognised. It also asserts the negative
  cases: Attack, 1000 Needles, Mighty Guard, `fiend-hunter-lv2`, and a
  synthesised `Scan Lv. 2` all return `null`.
- **Through the whole engine**, with the real Gun Mage table injected as an
  `AbilityRegistry` exactly as `BattleScreen` injects it: one `sensor` event
  per target carrying HP / MP / weaknesses / text; no `damage`, `chain` or
  `miss`; the turn is still spent; `state().combatants[id].revealed` flips from
  `undefined` to `true` and is still `true` after twelve further turns of play.
- **A party-wide reveal** (`targeting: 'all-enemies'`) reveals every enemy.
- **The secrecy table**, one test per row, plus the `sensorText` / `scanText`
  split and the "a bar is not a Scan" case.
- **`weaknessesOf`** ordering, `none` exclusion, and empty-array-not-undefined.
