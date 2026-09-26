# Boss action poses, 2026-09-26 (ART-1 of `docs/plans/presentation-program-2026-09-26.md`)

Bailey, 2026-09-26 about 18:00 EDT: *"I need addition work in graphics, presentation, and polish for
next release."* The plan's ART-1: bosses in seven chapters have no attack, hurt or KO painting, so
every hit lands on a statue. This folder holds **options for Bailey to pick from**. Nothing was
installed into `public/art`; `approved-hashes.json` and `judge-locked-hashes.json` were not touched,
and `node D:/Tools/pyrefly-lora/tools/verify-approved.mjs` reads 0 mismatched, 0 missing before and
after. Each pick becomes a tile once Bailey names it (rule 9).

**Who looked:** the maker (this agent), then a **second, cold look by the same agent** against the
art5 rubric (`../art5/JUDGE.md`: eight categories, identity to the installed idle, pass at a mean of
7.0, the head-match scale gate 0.75 to 1.30 upright and at least 0.60 in a lunge, border alpha 0).
It is not an independent judge.

## Sheets (phone-readable, each under 1 MB and 2000 px)

Each sheet shows the installed idle, then the candidates: on top fit to a grey/navy tile, in the
middle over the chapter's own backdrop at game scale (the candidate's pixel scale is its head-match
scale, so a lunge stands lower than the idle, as in battle), and below it the maker's look and the
second look.

| Sheet | Boss, slot | Game |
|---|---|---|
| `yojimbo-attack.jpg` | Yojimbo, attack (the Zanmato draw) | FFX only, Chapter IX |
| `yojimbo-hurt.jpg` | Yojimbo, hurt | FFX only, Chapter IX |
| `trema-hurt.jpg` | Trema, hurt | FFX-2 only, Chapter XIII |
| `logos-hurt.jpg` | Logos, hurt | FFX-2 only, Chapter VI |
| `leblanc-hurt.jpg` | Leblanc, hurt | FFX-2 only, Chapter VI |
| `ormi-hurt.jpg` | Ormi, hurt | FFX-2 only, Chapter VI |
| `natus-tries.jpg` | Seymour Natus, hurt and KO: the three failed tries, nothing to pick | FFX only, Chapter X |

## Read this first: which painting a boss actually shows

Measured by running the engine (rule 3; scratch bench `tools/zz-bossposes.tmp/poses.test.ts`, 30
seeds per chapter, every enemy `action-start` passed through the presenter's own `poseForCommand`):

| Chapter (FFX) | Enemy actions seen | Pose drawn | Hits taken by the boss |
|---|---|---|---|
| IX Yojimbo | Daigoro, Kozuka, Wakizashi (Yojimbo); the bite (Daigoro) | `cast` every time | 354 |
| X Natus | Multi-Blizzara/Thundara/Watera (Natus); Blizzard/Thunder/Water (Mortibody) | `cast` every time | 169 |
| XII Omnis | Firaga, Waterga, Blizzaga, Ultima, Dispel | `cast` every time | 449 |

Every enemy action is sent as `{ kind: 'ability' }`, and `poseForCommand('ability')` is `cast`. An
enemy draws its **`attack`** painting only on a counter (`BattlePresenterEvents.ts`, `'counter'`).
The FFX-2 AI files send `{ kind: 'ability', id: 'attack' }` too (read, not run: `src/battle/ffx2/ai/`).
So, **today, a new boss `attack` painting would almost never be seen**; a **`hurt`** painting shows on
every hit the boss takes. That is why this run spent its GPU on hurt after Yojimbo. For Yojimbo's
attack options (and any later boss attack) to reach the screen, the presenter would need a small
mapping, for example "a physical enemy ability draws `attack`" (Kozuka, Wakizashi, Zanmato, Shattering
Claw, Paragon's Normal Attacks). That is a `src/` change for a fix batch, not made here.

## Results

| Boss | Pose | Pick | Score (second look) | Passed / failed | Residuals of the pick |
|---|---|---|---|---|---|
| Yojimbo (IX, FFX) | attack | **c45** (alt c48 7.62, c44 7.62) | 7.69 | 3 pass, 1 fail (c46 6.81: purple cloth fans out behind him like wings) | The hilt runs past the rear fist over the forearm; sleeves lighter violet than the idle; a hakama where the idle trails a long robe; the hat's red cords are cut at the brim |
| Yojimbo (IX, FFX) | hurt | **c35** (alt c34 7.38) | 7.44 | 4 pass (c28 7.31, c29 7.12 narrowly) | The hat is tipped almost vertical, more than the lean asks; lilac hakama paler than the idle's purple |
| Yojimbo (IX, FFX) | ko | not made | - | - | Yojimbo's departure is `'dismissed'` (Bailey D-076, `src/engine/BattlePresenterDepartures.ts`): `departurePoses` maps his `ko` to `hurt`, so a KO painting would never be drawn. The plan lists only attack and hurt for him. |
| Daigoro (IX, FFX) | - | not made | - | - | Daigoro already has a painted `cast` (his bite) and is untargetable (D-051), so he never takes a hit and has no hurt slot to fill. |
| Seymour Natus (X, FFX) | hurt, ko | **none** | - | 0 of 24 renders usable, 21 guard rejects | Three tries, all the same failure: feathered wing fans spray across the canvas (`METHOD-CHECK-natus.md`, `natus-tries.jpg`). Stopped by the method check's own rule. No attack slot: Natus has no physical attack (research §3, `[decompiled]`). |
| Trema (XIII, FFX-2) | hurt | **c7** (alt c10 for the costume, c8 for the hat) | 7.38 | 4 pass (c8 7.31, c10 7.25, c6 7.19) | The eboshi is a tall pointed cone with two trailing ribbons (the idle's is shorter and rounded, with a red and white band); the lower hand grips a loose black strap; the fur lapels are gone |
| Logos (VI, FFX-2) | hurt | **c2** (alt c3 7.50) | 7.56 | 4 pass (c6 7.38, c4 7.38) | The near sleeve is short, the forearm bare; the helmet turns with a purple emblem on its side |
| Leblanc (VI, FFX-2) | hurt | **c10** (alt c1 7.19) | 7.38 | 2 pass, 2 fail (c6 6.88 reads as a curtsey, c8 6.94 no hit read) | The fan is white and blue (the idle's is red and silver), the robe pastel instead of purple, pink hair tips. c1 keeps the red fan but the hit reads mildly |
| Ormi (VI, FFX-2) | hurt | **c7** (alt c11 7.12) | 7.25 | 3 pass (c6 7.00 narrowly), 1 fail (c1 6.69, bare belly) | He faces screen-left; the idle faces right, so an install would flip him horizontally (no repaint). White pantaloons and a green bow the idle lacks |

**Not reached this run** (plan order), and why: Mortibody (X) and the Mortiphasms (XII) are
non-biped (no OpenPose skeleton fits a floating skull or a machine); Seymour Omnis (XII) is a torso on
a tentacle mass with no legs, the same problem; Paragon (XIII) is a four-legged beast; FFX-2 Bahamut's
attack (IV) would not be drawn (see above); the Den of Woe shades (XV) and Isaaru's aeons (XIV) were
not started. The non-bipeds need a different method (for example an img2img pass from the idle at a
low denoise), which is new and would need its own pilot.

Scale gate (stature at the hat's head-match scale, idle = 1.00): Yojimbo attack 0.78 to 0.79 (lunge, at
least 0.60), hurt 0.93 to 0.96 (upright, 0.75 to 1.30). The FFX-2 hurts are single renders at the idle's
head size; their figure height is 0.88 to 1.01 of the idle's for Trema and judged by eye to sit inside
the gate for the Ch VI three (eye-to-chin was not measured for any FFX-2 hurt; disclosed). Border alpha is 0 on every candidate and every
candidate passes the cutout guard.

## Method (and why it changed for Yojimbo)

The proven pose pipeline (`../art5/round2/render2.mjs` header): Animagine XL 4.0 Opt, xinsir OpenPose
SDXL, IP-Adapter from the installed idle (square-padded on white, plus a head crop), body-only pose
tags, the cutout guard, a black frame stops everything. The sword follows
`../art5/round2/METHOD-CHECK.md` method 1: the body is rendered with no sword and the approved
painting's own katana is composited into the fists (the drawn blade from the installed `cast.png`,
the hilt from the idle; the sheathed katana on the hurt is the idle's own, cut by polygon).

**The hat got the same treatment** (`METHOD-CHECK-yojimbo-hurt.md`, written after three failed hurt
tries, rule 15). Yojimbo's jingasa is 45% of his height, and the model redrew it in every frame: tall
cones, round crowns, a purple crown, flat discs when the head tipped back, gold sheets when an arm
came near it. So the bodies are rendered **hatless** (a hat-free, sword-free reference square and head
crop; hat words in the negative), the render's own head is erased (alpha only), and the idle's own
jingasa and gold menpo mask are composited onto the neck, turned to the pose (tipped back 37 to 40
degrees on the hurt, pitched forward about 8 degrees on the attack). The hat and mask are therefore
the approved pixels and cannot drift. The flat 2D turn is the method's limit: the brim cannot
foreshorten.

**Reused from the stopped run** (`D:/Tools/pyrefly-art-backup/candidates/2026-09-26-bosses/`, copied
to `2026-09-26-bosses-v2/yojimbo/_prev/`, nothing deleted): its tooling (`render.mjs`, `bosses.py`,
the skeletons, the katana and sheath cut-outs) and its hurt skeleton. Its attack composites c7 to c10
(model-drawn hats; copies in `v2/yojimbo/attack/`) were set aside at the maker's look: white skull
masks instead of the gold menpo, and a tall cone, a round crown or a purple crown in three of four.
Its hurt renders all lost the hat's shape.

## Where the files are

- Candidates: `D:/Tools/pyrefly-art-backup/candidates/2026-09-26-bosses-v2/<boss>/<slot>/`:
  `body-N.png` the hatless, weaponless render (`.raw.png` before the cutout), `cand-N-comp.png` the
  composite, `cand-N.png` the final cut, `cand-N.json` the full recipe (seed, prompts, ControlNet and
  IP-Adapter settings, every composited piece with its angle and scale, the erase polygons, the guard).
  Yojimbo's attack is in the `attack-h` folder.
- Render log: `D:/Tools/pyrefly-art-backup/candidates/2026-09-26-bosses-v2/<boss>/render.log`.
- Tools here: `render.mjs` (GPU; submits only while fewer than 3 prompts are pending, never restarts
  ComfyUI), `bosses.py` (refs, skeletons, cut-outs, `comp2` composite), `sheets.py` (`sheet2`),
  `katana.py` (Yojimbo's drawn katana from approved pixels), `bosses.json`
  (per-boss identity and per-slot recipe, with every earlier try's recipe kept under `v1`, `v2a`,
  `v2b`), `looks.json` (the looks and scores behind the sheets).

GPU in this run: Yojimbo 34 renders (4 attack, 20 hurt, 10 hatless attack), Natus 24, Trema 12, Logos 8,
Leblanc 12, Ormi 12: 102 renders, no black frame, ComfyUI never restarted.
