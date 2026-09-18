# bp1 — actor facing and the life layer

**Round:** bp1 (`actor-life`). **Owner:** engine.
**Files:** `src/engine/BattlePresenterActors.ts` (new), `src/engine/PaintedActor.ts`,
`src/engine/PaintedArt.ts`, `src/engine/BattlePresenterStage.ts`,
`docs/ENGINE-API.md`, `tests/unit/engine/actor-life.test.ts` (new).
**Captures:** `docs/screenshots/bp1/actor-*.png` + `actor-report.json`.
**Read with:** `docs/handoff/art3-contract.md` (the art side of the facing
change), `docs/ENGINE-API.md` §`BattlePresenterActors`.

---

## 1. What was wrong

A painted actor had exactly one number for facing:

```ts
// BattlePresenterStage, before
facing: kind === 'party' ? 1 : -1,
// PaintedActor, before
mesh.scale.x = width * this.facing;   // -1 == mirrored
```

So "which way is this fighter turned" and "is this painting drawn flipped" were
the same value, and **every enemy in the game was being mirrored** whether or
not it needed to be. That was harmless while all the art was straight-on and
symmetric-ish. It stops being harmless the moment the art fleet ships v3, where
party art is painted facing right and enemy art facing left: the engine would
have taken every correct enemy painting and turned it back to front.

Second problem, unrelated to facing: the actors were still. Breathing and sway
existed, but the pose was a texture swap and nothing else. A turn began, a blow
landed, a character died, and the only thing that moved was which PNG was on the
quad.

## 2. The shape of the fix

A new module, `src/engine/BattlePresenterActors.ts`, holds both rule sets as
plain functions. **It imports nothing** — no `three`, no DOM, the same rule
`BattlePresenterPorts.ts` follows — so the whole state machine runs in Node and
is unit-tested directly instead of being inspected in screenshots. `PaintedActor`
became a thin renderer of what those functions decide.

That split is the reason this round has 41 tests and not three. The interesting
behaviour — what a `ready` fighter's posture is, which one-shots a transition
fires, whether a corpse is allowed to flinch — is now assertable without a
canvas.

### Facing is two numbers

| | What it is | Owner |
| --- | --- | --- |
| **World facing** `1 \| -1` | Which way along ±x the *body* is turned. Aims the lunge, the lean, the posture tilt. Never touches the texture. | The side: party and aeons `+1`, enemies `-1`. |
| **Art facing** `'right' \| 'left' \| 'front' \| 'auto'` | Which way the *painting* was painted. | The PNG, via its sidecar's `"facing"`. |

`mirrorFor(art, want)` flips the plane **only when the two disagree**. Frontal
art is never flipped (a figure meeting the camera has no wrong side), and
undeclared art reads as `'auto'` — "assume it already obeys the contract for its
side" — which is also never flipped. Under the v3 contract nothing is mirrored
at all, which is the whole point.

Facing is **per pose, not per subject**: `PaintedArt` carries `facing` through
`PoseMeta`, so one leftover frontal `cast.png` in an otherwise right-facing set
declares itself and is left alone while its neighbours are not.
`parseArtFacing` also accepts the art pipeline's own spelling — the contract
writes `none` for untuned art, which is our `'front'`.

Call sites get `side: 'party' | 'enemy' | 'aeon'` and never think about it:

```ts
const actor = await PaintedActor.create({ side: c.side === 'enemy' ? 'enemy' : 'party', ... });
```

### The pose name is also a state

`setPose('ready')` no longer just crossfades to a painting. `lifeStateForPose`
maps the name to one of seven life states; the state carries a resting posture
(`POSTURES`) the body eases into; the *transition* fires one-shot cues.

| Pose | State | Posture | Cue |
| --- | --- | --- | --- |
| `idle` / unknown | `idle` | square, normal breath, ring out | — |
| `ready` | `ready` | half-step forward, weight up, quicker breath, **ring lit** | `step` |
| `attack` `cast` `item` `pray` | `act` | slight lean, breath held | — |
| `defend` `guard` `sentinel` | `guard` | braced **back**, low, very still | — |
| `hurt` | `hurt` | rocked back | `flinch` (warm tint + knock-back) |
| `ko` `dead` | `down` | tilted over, all but no breath | `fall` |
| `victory` | `victory` | up on the toes | `hop`, staggered per fighter |
| leaving `down` | | | `rise` + a soft glow |

Every distance is a **fraction of the figure's world height**, so the same
numbers read the same on a 1.8-unit summoner and a 4.1-unit boss. Postures ease
with an exponential `approach`, so they are framerate-independent and never
snap — except under `{ immediate: true }`, which is what staging an
already-KO'd party member uses so nobody watches a corpse topple over on frame
one.

**The presenter did not have to learn any of this.** Not one call site changed:
`BattlePresenterBeats` still names poses, and the life comes out of the names it
was already using.

### The attack is four beats, not one ease

`lunge()` used to be a single ease out and back. That is a *drift*: it reads as
the figure sliding into the enemy and sliding home. `attackOffset(t)` replaces
it with punctuation (`ATTACK_BEATS`, fractions of the move):

```
step   0.26   quick step in, cubic-out, to 86% of the distance
hold   0.20   a beat of stillness — the wind-up, and where the eye catches up
strike 0.12   the push through the top of it, peaking at 1.0
settle 0.42   smoothstep home
```

The peak is still the `distance` passed in and the move still takes `ms`, so
every existing call keeps its staging. The unit test asserts the *shape*, not
the numbers: the hold has to be more than four times slower than the step on
either side of it, or the move is a drift again.

### The turn ring

A soft additive annulus on the ground, brightest just inside its rim, squashed
0.46 in z so it lies on the floor rather than facing camera. Up fast (τ 0.09 s),
down slow (τ 0.2 s), so the highlight never flickers between two events of one
turn — and left *alone* by the `guard` and `hurt` postures (`ring: null`) so
being hit mid-turn does not put it out.

It is **off unless the actor asks for it**. `BattlePresenterStage` opts in —
gold under the party, colder violet under the fiends. "Whose decision is this?"
is a question only a battle has; a scene demo drives the same poses for staging
reasons, and a ring under a character who is not taking a turn is a lie in every
screenshot it lands in.

## 3. Two rules worth arguing about

**A body on the ground does not flinch.** A stray area attack lands on a party
member who is already KO'd, and the presenter still names `hurt` for it.
Without a rule, the body sits up to wince — and worse, `cuesFor` reads that as
*leaving* `down` and plays the **revive rise, glow and all**, on a character who
is still dead. `nextLifeState(current, wanted)` is the one override in the
machine: `down` + `hurt` stays `down`, and `PaintedActor.setPose` drops the
painting too, so the body keeps its `ko` pose. Everything else passes through,
including `down` → `idle`, which is exactly the revive this must not block.

**The enemy KO falls before it dissolves.** `dissolveTo(1)` already put the
fiend into its `ko` pose; the fall and the dissolve then started on the same
frame, and the drop was lost inside the fade — it read as a figure evaporating
on its feet. The dissolve now takes a short delay (60% of the fall, capped at a
quarter of the move) *out of* its own duration rather than adding to it, so
`TIMING.ko` is unchanged and nothing downstream re-times.

## 4. What the captures show

`docs/screenshots/bp1/actor-*.png`, chapter 1 (Seymour Flux) at 1280x720,
driven directly against the staged actors so each state is caught on the frame
it reads best. `actor-report.json` carries the machine-readable side —
`{ name, pose, life, facing, mirrored }` per actor at each beat.

| Shot | What to look at |
| --- | --- |
| `actor-01-facing-idle` | Party `facing: 1`, enemies `facing: -1`, **`mirrored: false` on all five**. The roster is still v2 straight-on art, and it is drawn exactly as painted. |
| `actor-02-ready-ring` | Tidus has stepped forward and the gold ring is lit under his feet. Compare against `-01`: same figure, same frame, no ring. |
| `actor-03-attack-hold` / `-04-attack-strike` | The pause at the top of the step, then the push through it. |
| `actor-05-guard` | Braced the other way — back and low, the opposite shape from `ready`. |
| `actor-06-hurt-recoil` | Knock-back with the warm tint over the painting. |
| `actor-07-ko-falling` / `-08-ko-down` | The tip-over, then the body settled. |
| `actor-09-revive-glow` | Up, with the Phoenix Down's glow still on him. |
| `actor-10-enemy-fall` / `-11-enemy-dissolve` | The fiend goes **down first**, then the pyreflies take it. |
| `actor-12-victory-hop` | The pose swap on the hop. |

## 5. For the art fleet

Two things the engine now honours, and one it cannot.

1. **Ship `"facing"` in every sidecar.** `right`, `left`, `none` — all three
   are read (`none` maps to the engine's `front`). An absent field is treated
   as "correct for its side", which is right today and is the thing that will
   quietly mis-draw the one file you forget.
2. **A pose may declare its own facing.** You do not have to re-render a whole
   subject to fix one state; mark the odd one out and it is handled alone.
3. **The engine will not turn a frontal painting into a three-quarter one.** A
   mirror is all it has. Everything in `public/art/characters/` is still v2
   straight-on, which is why the captures above look front-on: that is the
   re-render `art3-contract.md` §6 flags as outstanding, not an engine bug.

## 6. Not done here

- **`Sentinel` does not reach the guard pose from a real fight.** The pose
  vocabulary handles it (`lifeStateForPose` maps `sentinel`, `guard` and
  `defend`), but `poseForCommand` in `BattlePresenterEvents.ts` routes every
  ability to `cast`, so only the plain Defend command gets there. That file is
  another agent's this round; the one-line map entry is theirs to add.
- **No per-subject motion tuning.** Every fighter breathes at the same tempo
  and leans the same fraction of their height. A boss that should loom rather
  than lean wants its own `POSTURES` override, and there is no hook for one yet.
- **The ring is a fixed ellipse.** It does not follow a wide prone footprint
  the way the contact shadow now does. Nothing needs it to — a downed fighter's
  ring is out — but it would be wrong on anything long and standing.
