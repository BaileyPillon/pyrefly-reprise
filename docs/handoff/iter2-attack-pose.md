# iter2 attack-pose: an enemy's physical ability draws its attack painting

Branch `iter2-attack-pose` (worktree `D:/pyrefly-iter2-attackpose`), not merged, not deployed.
**Game case (rule 14): both games.** Shared presenter plumbing (`critic/CHECKS.md` CHK-020): FFX
and FFX-2 ability rows mark a physical blow the same way (`damageType: 'physical'`; FFX-2's own
engine reads it in `src/battle/ffx2/execute.ts` `attackClass`), and every enemy in both games sends
its action as `{ kind: 'ability' }`. Checked in Chapter IX and I (FFX) and Chapter VI and XI (FFX-2).

## What Bailey approved

Bailey, 2026-09-26 ~19:30 EDT: *"i'll go with all your recommendations, i love it."* Recommendation 3
included "the presenter mapping so a boss's PHYSICAL ability draws its attack painting (today every
enemy action is kind 'ability' and poseForCommand maps it to 'cast')", from
`docs/concepts/boss-poses-2026-09-26/README.md` ("Read this first"). This branch is only that
mapping. Installing the seven painted picks is a separate batch; nothing under `public/art` changed.

## The rule (built)

`src/engine/EnemyActionPose.ts`, called from `actionStart` in `src/engine/BattlePresenterBeats.ts`:

- **Physical** means the ability's own row has `damageType: 'physical'`, or it has a `strength` /
  `piercing-strength` formula and is not `magical`. The second case is FFX's
  `overdrive-multiplied` family (`types.ts` `FormulaKey`), e.g. Braska's Final Aeon's Jecht Bomber
  and Ultimate Jecht Shot and Anima's Oblivion at Macalania. The name is never read.
- An **enemy's** physical ability draws `attack` when that enemy has an attack painting of its
  **own**. Otherwise it draws `cast`, whose existing chain (`cast`, `attack`, `idle`) ends on the
  idle, exactly as before.
- Magic, a row the table does not have, and every party and aeon action keep `poseForCommand`.
  Counters are unchanged: they already draw `attack` (`BattlePresenterEvents.ts`).
- The beat follows the painting. `attack` gets the existing attack beat: the lunge (1.4, 440 ms),
  the squash, the `attack` cue, the camera roll and the `windUp` hold. A fallback to `cast` gets
  today's cast beat. So **an enemy with no attack painting looks, sounds and times exactly as it
  did before**.

The plumbing, all additive and optional:

- `PresenterDeps.abilityFacts` gives `{ damageType, formula }` by ability id. It is built by the new
  `src/app/screens/battleAbilityFacts.ts` for the chapter's own game: FFX uses core plus data, with
  data overriding by id as `FFXContentRegistry` does. FFX-2 uses data, then the engine's fallback
  table, as `chainRegistries` does. `BattleScreen.ts` passes `abilityFactsFor(chapter.game)` (one
  line plus one import).
- `BattleStage.paints?(id, pose)` answers "own painting, not a fallback". `BattlePresenterStage.ts`
  records the set when it stages an actor or swaps its art (`setArt`), from the resolved pose map:
  a pose whose URL is its own file. A figure that is all stand-in answers no.
- **No engine change and no contract change.** `types.ts` is untouched, so the FFX-2 log-hash
  goldens are unchanged. I dropped an earlier plan to put `damageType` on `action-start` for that
  reason.

## Every enemy ability, every listed chapter

`tests/unit/enemy-action-pose.test.ts` walks each of the 15 chapters' formations (following
`nextGroupId`), every enemy and part, and every `abilityIds` entry. Every id has a row in its game's
table. The rows that draw `attack` are pinned in `tests/unit/helpers/enemyPhysicalRows.ts`, which is
the full list. In summary:

| Chapter | Physical (draws attack when painted) | Everything else draws cast |
|---|---|---|
| I Seymour Flux (FFX) | Lance of Atrophy, Cross Cleave | Full-Life, Total Annihilation, Flare, Banish, Slowga, Protect, Reflect, Dispel, Mortibsorption |
| II Yunalesca (FFX) | Dispelling Slap, Hellbiter | Absorb, Osmose, Mind Blast, Mega-Death, the counters, Cura, Curaga, Regen |
| III Braska's Final Aeon (FFX) | Left Arm Strike (both), Triumphant Grasp (both), Jecht Bomber (both), Blade Blitz, Ultimate Jecht Shot; the possessed aeons' Sonic Wings, Meteor Strike, Aerospark, Heavenly Strike, Impulse | Jecht Beam, the Yu Pagodas, the aeons' specials, all of Yu Yevon |
| IV Bahamut (FFX-2) | x2-bahamut-attack | Curse, Impulse (percent-current, magical), Countdown, Mega Flare |
| V Vegnagun / Shuyin (FFX-2) | Node Missile and Dies Irae (nodes A, B, C), Redoubt Lacrimosa (both), Shuyin's Attack, Spin Cut, Run and Slash, Terror of Zanarkand | the tail, leg, body, Bulwarks (fractional, `other`), head, Force Rain |
| VI Leblanc (FFX-2) | Ormi's Shield Bash, Dr. Goon's Strike, Leblanc's Fan Slap (hers and the fem-goon's), Logos's Double Shot | the goons' spells, Supercollider, Huggles, Concussive Blast, Russian Roulette, Hail of Bullets, the rest of Leblanc's list |
| VII Macalania (FFX) | Anima's Oblivion | every Guardian and Seymour row, Anima's Pain |
| VIII Evrae (FFX) | Evrae's attack, Swooping Scythe | the breaths, Stone Gaze, Photon Spray, Haste, Cid's missiles |
| IX Yojimbo (FFX) | Kozuka, Wakizashi, Daigoro's bite | the Daigoro order, **Zanmato** (`other`, `fixed-no-variance`) |
| X Natus (FFX) | Mortibody's Shattering Claw | every Natus and Mortibody spell, Break, Desperado, Mortibsorption |
| XI Fallen Aeons (FFX-2) | Shiva's Kick and Triple Attack, Sandy's attack, Cindy's Camisade, Anima's Oblivion | Heavenly Strike (percent-current, `other`), Diamond Dust, Delta Attack, Mindy's whole list |
| XII Omnis (FFX) | none | all eleven |
| XIII Trema (FFX-2) | Paragon's attack; Trema's Dying Star, Falling Leaf, Thundering Wave, Choking Mist, Beguiling Mire | Judgement, Genesis, Big Bang, Final Impact, the -aga spells, Waning Moon, Demi, Flare, Ultima, Meteor |
| XIV Isaaru (FFX) | Grothia's and Pterya's attacks (both targets), Sonic Wings | Fira, Hellfire, Energy Ray, Spathi's two |
| XV Den of Woe (FFX-2) | Baralai's Attack, Glint, Triple Attack; Gippal's Attack, Grinder, Mortar; Nooj's Attack | the rest |

The data says **Zanmato is not physical**: it is `other` and `fixed-no-variance`, and the file
explains why (`src/data/ffx/enemies/yojimbo-abilities.ts`, the note at line 23). So Zanmato keeps
`cast`, even though the concept README listed it as an example. I followed the row; if Bailey wants
the Zanmato draw on the attack painting, that is a named per-ability exception and needs a yes.

## Proof by running (rule 3)

- **Real engine, real presenter, in unit tests.** Chapter IX runs 30 seeds of the FFX engine and
  Chapter VI runs the FFX-2 Leblanc chain on Wait. Each log is played event by event through
  `BattlePresenter` on a fake stage, and the test reads the pose each enemy `action-start` left.
  With an attack painting: Kozuka, Wakizashi and Daigoro's bite draw `attack`, and the Daigoro order
  draws `cast`. With today's art: every one falls back to `cast`. In VI, every physical action draws
  `attack` when painted and `cast` when not, and magic always draws `cast`.
- **Real keys, headless GPU Chromium, 1600x900, dev server on port 6060 from this worktree** (stopped
  by its PID afterwards). From the title, real keys go to the chapter, and the party only presses
  Enter (Attack, first target). A rAF gate holds the frame once the enemy's painting has finished
  its crossfade; the fight itself is untouched. Frames and JSON are in `docs/screenshots/attack-pose/`.
  The scratch driver is `tools/zz-attackpose.tmp/capture.mjs` (not committed).

| Frame | Ability (row) | Painting shown | Why |
|---|---|---|---|
| `IX-...-yojimbo-yojimbo-kozuka.jpg` (seed 1) | Kozuka (physical) | `yojimbo-cavern/cast.png` | **fallback**: the Ch IX boss art (`yojimbo-cavern`) has no attack painting yet |
| `IX-...-yojimbo-yojimbo-wakizashi.jpg` (seed 4) | Wakizashi (physical) | `yojimbo-cavern/cast.png` | fallback, same reason |
| `IX-...-daigoro-daigoro-attack.jpg` | Daigoro's bite (physical) | `daigoro/cast.png` | fallback: Daigoro has no attack painting (his bite *is* his cast painting) |
| `IX-...-yojimbo-yojimbo-daigoro.jpg` | the Daigoro order (`other`, `none`) | `yojimbo-cavern/cast.png` | magic-side, unchanged |
| `VI-...-dr-goon-x2-goon-strike.jpg` | Strike (physical) | `ffx2-dr-goon/idle.png` | fallback: the goon has neither attack nor cast, so the idle, as before |
| `VI-...-ormi-*-x2-ormi-shield-bash.jpg` (two links) | Shield Bash (physical) | `ormi/cast.png` | fallback |
| `VI-...-logos-room-x2-logos-double-shot.jpg` | Double Shot (physical) | `logos/cast.png` | fallback |
| `VI-...-fem-goon-x2-fem-goon-fire.jpg` | Fire (magical) | `ffx2-fem-goon/idle.png` | unchanged |
| `I-...-seymour-flux-lance-of-atrophy.jpg` | Lance of Atrophy (physical) | **`seymour-flux-body/attack.png`** | the attack painting shows: it exists. Before this branch this was `cast.png` |
| `I-...-mortiorchis-cross-cleave.jpg` | Cross Cleave (physical) | **`mortiorchis/attack.png`** | same; before, `cast.png` |
| `XI-...-x2-shiva-x2-shiva-kick.jpg` | Kick (physical) | **`x2-shiva/attack.png`**, attack beat | same painting as before (Shiva has no cast, so her cast chain already fell to attack); the beat is now the attack beat |
| `XI-...-x2-shiva-x2-shiva-blizzaga.jpg` | Blizzaga (magical) | `x2-shiva/attack.png`, cast beat | unchanged |

Chapter VI never reached the last room, so Leblanc's Fan Slap was not seen live: the seed-1 run,
pressing Enter alone, ended in the Logos room. The unit table covers it.

## Target vs build

| | Target (the recommendation Bailey approved) | Build |
|---|---|---|
| Physical enemy ability | draws the actor's `attack` painting | yes, from the row's `damageType` / `formula` (Ch I and XI frames) |
| No attack painting | falls back to `cast`, then the idle | yes (Ch IX and VI frames: `cast.png`, and the idle for the goon) |
| Magic | keeps `cast` | yes (Blizzaga, Fire, the Daigoro order) |
| Party actions | unchanged | yes: party and aeon go through `poseForCommand` untouched |
| Yojimbo's attack (c45) on screen | shows once installed | **not yet**: no `yojimbo-cavern/attack.png` in `public/art`. The fallback is proved instead. The unit test proves Kozuka and Wakizashi switch to `attack` the moment that painting is there |

The picture target for Yojimbo is `docs/concepts/boss-poses-2026-09-26/yojimbo-attack.jpg` (c45).
Today's build frame for the same move is `docs/screenshots/attack-pose/IX-1600x900-yojimbo-yojimbo-wakizashi.jpg`.

## For the merge and the install batch

- **The install must land in `yojimbo-cavern/` and in the manifest.** The Ch IX boss's art id is
  `yojimbo-cavern`, so the pick goes to `public/art/characters/yojimbo-cavern/attack.png`, not
  `yojimbo/`, which is the aeon's. Then re-run `tools/gen/manifest.mjs`: `resolvePoseMap` trusts
  `public/art/manifest.json` when it exists, so a file missing from the manifest is not seen.
- Files touched: `src/engine/EnemyActionPose.ts` (new), `src/app/screens/battleAbilityFacts.ts`
  (new), `src/engine/BattlePresenterBeats.ts`, `src/engine/BattlePresenterPorts.ts` (397 lines),
  `src/engine/BattlePresenterStage.ts` (was already over 400 lines; +14 net here),
  `src/app/screens/BattleScreen.ts` (+4). No file owned by t1-b2a or t1-b2b was edited.
- **Disclosed, for Bailey's eye:** an enemy with an attack painting now gets the party's lunge
  (1.4 world units). Mortiorchis swoops about a third of the frame toward the party on Cross Cleave
  (the Ch I frame). That is the existing attack beat, not a new number. If it reads too far for a
  boss, scaling the enemy lunge is a presentation choice to put to Bailey; I did not tune it.
- Checks: `npx tsc --noEmit` clean; the new file passes 26 of 26; full `vitest --testTimeout=60000` was still running when this was committed (553 passing checks so far, no failure yet): re-run it before the merge;
  `node tools/orphans.mjs` is still 24 orphaned (both new modules reachable).
