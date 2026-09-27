# FF7 art candidates: Guard Scorpion, Cloud, Barret, No. 1 Reactor core (2026-09-27)

**These are candidates, not approved art.** Nothing is installed in `public/art/`. The picks
below are **an agent's look**. Bailey picks. Game case: **FF7 only**. The encounter is a hidden,
experimental chapter (Bailey, 2026-09-27: "make it a hidden selectable encounter since it's
experimental").

Full-size cut-outs, raw renders and sidecars (seed, prompt, negative) are in
`D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7/<subject>/`. This folder only holds
phone-readable sheets, each under 1 MB.

## Recommended per subject (an agent's look)

| Subject | Pick | Seed | Why | Caveat |
|---|---|---|---|---|
| Guard Scorpion, idle (tail lowered) | `guard-scorpion/idle-a.3` | 603731044 | Compact red shell, twin rifles and a sensor eye on the front, six legs, segmented tail, clean cel finish | Reads small and a little sleek for a boss; its size on the field is a presentation choice. The tail tip came out as a blade, not a laser emitter |
| Guard Scorpion, tail raised | `guard-scorpion/raised-a.2` | 250647137 | Clearest "tail up" silhouette with the tip aimed forward at the party, so the tail-up state reads at a glance | Blade tip again. None of the 8 raised renders showed a clear laser emitter, even with the emitter weighted and "stinger, blade" banned (`raised-c.*`) |
| Cloud | `cloud/idle.1` | 1708326207 | Faces right as the facing contract asks. The single pauldron is on his **left** shoulder (the near side), there is a Buster Sword-sized broadsword, indigo sleeveless top and baggy trousers, brown boots | Very close to the familiar look; judge whether it is ours enough |
| Barret | **no clean pick** | | See below | |
| Backdrop | `reactor-core/core.1` | 383424147 | Tubular reactor with a green mako glow in the centre, brown industrial tint, grated floor in the foreground for the party to stand on | Generic reactor. No "1998" lettering, because text is banned |

`06-composite-1600.jpg` and `07-composite-phone-390.jpg` put the picks together on `core.1`
(rough, no HUD, scale is a guess) so they can be judged as one scene.

## Barret: the gun-arm is not solved

Canon (FF Wiki): his **right** arm is replaced by the gun-arm, and the skull tattoo is on his
**left** shoulder. The facing contract puts the party facing right, so his right arm is on the
far side. Four rounds (15 attempts, 12 passed the cut-out guard) gave three kinds of near miss:

- `barret/idle.3` faces right with the tattoo on the correct shoulder, but he **holds** a
  gatling with both hands. It is a hand-held gun, not a grafted arm. This is the one used in the composite.
- `barret/idle.4` has the gatling **grafted** to the right forearm (canon), but he faces
  **left**. Mirroring would move the gun to the wrong arm, and the rule is to reroll a chiral
  subject, never flip it.
- `barret/idle-arm.1.raw` (the cut-out guard rejected this one, so only the raw render exists)
  faces right with a grafted gun, but it is on the **left** arm, the mirror image of canon.

Next method, if Barret is wanted: an original layout sketch with the gun-arm on the far arm
pointing forward, followed by img2img. That approach fixed the Guard Scorpion (below). Alternatively,
Bailey may accept a left-facing Barret for FF7 only.

## How the Guard Scorpion was made (rule 8: original art)

Text-only prompts gave humanoid gunpla robots holding rifles (`pilot.*`, `pilotb.*`,
`pilotc.*` in the backup folder). The layout comes from **our own flat-colour sketches**
(`08-guard-scorpion-layout-sketches.jpg`, drawn in code by `scripts/gs-sketch*.py` from the
wiki text: low red shell, six legs, long segmented tail, twin rifles, a sensor eye). They go
through `comfy.mjs boss --img2img` at denoise 0.80 to 0.86. At 0.6 to 0.72 the result stayed
flat and toy-like. At 0.8 and above it took on the house cel finish. No retail image was used
as a reference, img2img source or IP-Adapter input anywhere in this set. Cloud, Barret and the
reactor are plain txt2img through the house style contract (`tools/gen/comfy.mjs`, Animagine XL
4.0, the same STYLE/QUALITY blocks as the installed FFX art).

## Sources for the look (FF Wiki via the MediaWiki API, read 2026-09-27)

- *Guard Scorpion (Final Fantasy VII)*: first boss, fought by Cloud and Barret at the **Core**
  of the No. 1 Reactor. It has two forms, tail lowered and tail raised. Tail Laser is its counter
  while the tail is raised.
- *Guard Scorpion* (series page): "a heavily armed guard robot that resembles a scorpion ... six
  legs and a long tail". Its FFBE description calls it a "red monstrosity".
- *No. 1 Reactor (FF7 field)*: the core is "a large, tubular structure built into a wall ...
  a set of pipes leading to a valve at the bottom". The reactor has "a brown-ish tint".
- *Cloud Strife* and *Barret Wallace*, "Appearance" sections: the costume details used in the prompts.

**Note for the driver:** the brief said "Sector 1 reactor **bridge**". The sources put the fight
at the reactor **Core**, reached by a walkway. So the backdrop candidates show the core, and
two walkway renders (`walkway.1`, `walkway.2`) are included. Neither walkway render shows a
clear catwalk, and I would not use them.

No game numbers are in this folder. The battle data (HP 800 etc.) belongs in the encounter's
research note, with its sources.

## Files

- `01-guard-scorpion-idle.jpg`, `02-guard-scorpion-raised.jpg`, `03-cloud.jpg`, `04-barret.jpg`, `05-reactor-core.jpg`: candidate sheets
- `06-composite-1600.jpg`, `07-composite-phone-390.jpg`: the picks together (rough)
- `08-guard-scorpion-layout-sketches.jpg`: our original layout sketches (3/4 on top, profile below; tail low on the left, raised on the right)
- `scripts/`: the sketch, sheet and batch scripts that made all of this (`run1.sh` and `run2.sh` hold every prompt)

Checks: `node D:/Tools/pyrefly-lora/tools/verify-approved.mjs` gave 0 mismatched and 0 missing. `approved-hashes.json` and
`judge-locked-hashes.json` are untouched. ComfyUI was never restarted, and there were no black frames.

## Bailey 2026-09-27

Bailey, verbatim: "full speed ahead please. godspeed. ill go with all your recommendations."
Said after seeing the rough composite `06-composite-1600.jpg`. Recorded as `docs/target/decisions.json`
D-240 (state: adopted, delivery: in-progress, game: FF7 only — schema gap noted there, same as D-237/D-238).

Accepted: the driver's four recommendations —

1. Barret is never mirrored (mirroring puts the gun on the wrong arm); FF7's canon puts his
   gun-arm on his **right** arm; follow FF7's own battle staging (which side the party stands
   on and which way it faces) and paint Barret fresh with the gun on the right arm for that
   facing, using the method that worked for Guard Scorpion (our own flat layout sketch drawn in
   code, then the pipeline's img2img).
2. If FF7's staging faces the party the other way from the current candidates, Cloud is
   repainted for that facing; his single pauldron stays on his **left** shoulder, never mirrored.
3. Guard Scorpion's tail tip becomes a laser emitter, not a blade, and the body reads bulkier,
   boss-sized.
4. The other agent's per-subject picks above (Guard Scorpion `idle-a.3` and `raised-a.2` as the
   base identity, Cloud `idle.1`, reactor core `core.1`) are accepted as Bailey's picks on
   recommendation, except where (2) or (3) changes them.

**reaction** — named: "all your recommendations" (the four items above). inferred (agent
guesses, not yet named by Bailey): the per-subject picks under (4), and the practical read of
(1) to (3) as repaint instructions for the next art round. undecided: the final Barret painting
(no clean candidate exists yet — see "Barret: the gun-arm is not solved" above) and, if FF7's
staging flips the facing, the final repainted Cloud.

Nothing here is installed in `public/art/`. `approved-hashes.json` and `judge-locked-hashes.json`
are untouched.
