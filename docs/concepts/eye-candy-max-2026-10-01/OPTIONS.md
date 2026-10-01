# Maximum eye candy: the options round (2026-10-01)

**Status: options for Bailey. Nothing here is built into the game.** This is an end-state round (AGENTS.md rule 9):
Bailey picks one option or a mix, and a pick approves only the properties Bailey names. Each option will be shown as a
flag-gated prototype on the scratch branch `candy-max-proto` (never merged until Bailey picks). Pilot renders, where
an option needs them, are candidates in `D:/Tools/pyrefly-art-backup/candidates/2026-10-01-max/` and are never installed.

**Bailey, 2026-09-30 ~18:45 EDT:** "I need another pass on visuals and maxing out eye candy. The critic needs to be
involved as well and I need updated scores."
**Bailey, 2026-10-01 ~00:20 EDT:** "I need another pass on visuals and maxing out eye candy with special emphasis on
character models, enemy models, animations, visual fidelity, and camera perspective in relation to characters,
enemies, and the battlefield as a whole."

"Models" here means our painted figures as they are rendered, posed, rigged, animated, lit and framed in the Three.js
scene. The direction stays painted 2.5D (rule 9, settled). Option D is the one labelled hybrid DEPARTURE, and it is
not recommended.

## Where we start (release 33, main f302f163, live 2026-10-01)

The critic's visual pass on release 33 gave these provisional sub-scores (owner lens first, reconciled):

| Area | Score | Biggest reasons |
|---|---|---|
| Character models | 7.6 | KO fallback and scale; White Mage costume split; missing dressphere poses; no key-light floor |
| Enemy models | 7.1 | two designs per boss (Vegnagun Tail, FFX-2 Bahamut, Flux); 1 to 3 paintings per boss, so attacks re-show the idle; colossi at party height |
| Animation | **6.2** | 9 painted stills per figure, no in-betweens; idles read as stills (breathing amplitude 0.016); crossfades instead of cuts; no KO collapse |
| Visual fidelity | 7.9 | rim and fringe; Den of Woe off target; Vegnagun Tail 0.91 texels/px at 1x and 0.45 at 2x; Sin 1.2 |
| Camera | 7.5 | party and boss overlap on screen in 13 of 20 framings; Ixion's plate painted from above, camera near level; Natus and Yojimbo at about 25 % of the frame |

Numbers from the capture (`D:/Tools/pyrefly-scratch/2026-09-30-visual/capture2/manifest.json`, headless GPU, seed 1):

- **Camera.** One master per chapter at FOV 28 to 40 and 1.2 to 5.1 m high. The pitch runs from 7° up (Vegnagun) to
  10.7° down (Natus). The party always stands left (D-167). The party/boss screen gap is negative, so they overlap, in
  13 of the 20 framings: Ch II, III, IV (desktop and phone), V, VII, VIII, IX, X, XII, XIII, XVII and XVIII; the
  worst is -473 px in XVII. The boss stands
  0.5 times the party's height (Leblanc's Syndicate) up to 5.5 times (Vegnagun). Natus is 0.96 and Yojimbo 0.61.
- **Animation.** The median time in each pose: FFX attack 695 ms, cast 1773, hurt 435; FFX-2 attack 626, hurt 396.
  Every move between paintings is procedural on a flat plane: lunge, squash, recoil, flinch, hop, shake, fall and
  dissolve. Pose changes crossfade in 120 ms (party) and 140 ms (enemies).
- **Fidelity.** Painted textures use LinearMipmapLinear filtering with anisotropy 16. There is no MSAA on the canvas
  (`antialias:false`) and no tone mapping. The renderer pixel ratio is capped at 2. Party figures have 3.1 to 7.5
  texels per screen pixel at 1x and 1.5 to 2.0 at 2x. The bosses below 1.5 at 2x are Vegnagun Tail 0.45, Bahamut 1.20
  and BFA 1.29; Sin (1.2 at 1x) and Evrae (1.8 at 1x) fall below 1 at 2x.
- **Frame time.** With D on, desktop p95 is 16.7 to 16.8 ms (vsync-capped), and the uncapped cost is 1.2 to 2.9 ms on
  an RTX 5070 Ti. Phone tier at 4x CPU throttle: p95 16.8 ms, p99 33.3. No real phone GPU has been measured yet. **The
  desktop GPU has a lot of headroom. The phone is the unknown.**

Eye candy D (Golden-Hour Cinema, Living Paintings, Spectacle Combat; D-287, with each look's own switch per D-297) is
the floor these options build on. None of them removes or re-tunes D.

## Rules every option obeys

- **Comfort.** The calm camera stays the default (D-291): moves of at least 700 ms on a sine curve, capped at
  20°/s, no roll, no shake on a routine hit. A new framing is a **cut to a held shot**, never a new move or orbit.
  The HUD is pinned and is never laid out through a camera in flight (fb2-0929). REDUCE MOTION stills every new
  motion; light is the only thing that may still change. LOW EFFECTS takes the lighter tier. No full-screen flash
  runs faster than 3 per second, and REDUCE FLASHES, where present, removes the flash.
- **Switches.** Every effect below names its own settings switch, default ON (D-297, Bailey: "in the settings I want
  to be able to turn each one off. Default will be on."). Settings fields live in `SaveData.ts`, so **any option that
  adds rows is in the save-data class: deep review before deploy**. The SETTINGS column already scrolls at 14 rows.
  A new switch group therefore needs its own layout, an EYE CANDY sub-page reached from the OPTIONS tab, and that
  layout gets a mockup first.
- **Paintings.** Approved paintings are never replaced or altered (`docs/target/approved-hashes.json`). Every
  derived file (masks, rigs, depth, normals) is generated and gitignored like `public/fx/`. New paintings are
  candidates until Bailey picks.
- **Faithful core.** Presentation never touches engine state, the RNG, damage, turn order or an Overdrive input timer
  (hard rule 1, PRODUCT-BRIEF "Faithful core, showpiece surface"). **FFX-2 caveat:** under Active ATB, gauges fill in
  real time while an action plays. Any added anticipation or follow-through in an FFX-2 chapter therefore has to fit
  inside today's action length, re-timed within it and never added to it, unless Bailey decides otherwise (the D-294
  'steady' pacing multipliers stay as they are). In FFX's CTB, presentation length changes nothing in the fight.
- **Per game (rule 14).** Each option has its own FFX and FFX-2 column, taken from
  `research/ffx-vs-ffx2-presentation.md` and `research/battle-camera-perspectives.md`. FF7 draws none of this.
- **Budget.** Desktop p95 ≤ 16.7 ms and throttled phone p95 ≤ 33 ms with everything on. Each option has a quality
  tier plan: **full** (desktop), **phone** (the phone tier) and **low** (LOW EFFECTS). Before anything ships, one
  GPU-bound measurement is owed (a real phone, or a GPU-throttled run), as the eye-candy judge asked on 2026-09-29.
- **Defects are not options.** The critic's confirmed defects are fixed on their own branch under every option:
  KO scale (VP-04, -05), impact timing (VP-06), Den of Woe (VP-03), hit tint (VP-21) and the rest. The options are
  what goes past 9.0 toward 9.5.

---

## Option A · Living Canvas

**Pitch: every approved painting becomes a puppet. Figures breathe, blink, carry hair and cloth, and move with weight,
and the bosses come alive part by part. No new paintings are needed.**

Each figure is a painting rendered on a deformable mesh instead of a flat quad, and nothing on disk changes. Masks
for head, torso, arms, hair and cloth hem are derived from the painting's alpha, from a local Depth Anything V2 Small
depth pass (Apache-2.0, already in `tools/fx/depth.py`) and from colour. A small per-figure rig file holds tuned
control points. Its 2D cousin in other games is Live2D.

| Area | What A does |
|---|---|
| **Character models** | Chest-only breathing: shoulders rise, the belt line stays put, and nothing below the hips moves. Hair and cloth hang on damped springs driven by the figure's own lunge, hop and recoil (Tidus' hair, Yuna's sleeves and obi, Auron's coat tail, Lulu's belts, Rikku's braids, Paine's coat). The weight shifts between feet every 6 to 9 s. A blink every 3 to 7 s comes from a closed-eye overlay painted as a separate candidate layer, so the approved PNG is untouched. |
| **Enemy models** | Part rigs on the headline bosses. Vegnagun's Tail sways and its Head lifts (EC-06). Bahamut's and Evrae's wings breathe, Mortiorchis's tendrils coil, Sin's fins flex and Yunalesca's hair floats. Colossi breathe on a slow 4 to 6 s period with a larger amplitude, so they read as heavy. Each telegraph is a windup bend plus a light, and REDUCE MOTION keeps only the light. |
| **Animation** | The idle loop becomes visible (EC-01). Attacks gain anticipation, a wind-back of 80 to 120 ms, a contact hold (C's hit-stop) and follow-through with overshoot and settle (EC-04). Lunges travel on arcs. Each KO buckles, sinks and cuts to the KO painting (EC-09), and enemies then leave by their **departure kind** from research §3.2: pyreflies (Flux; Yunalesca as a rising column), Shuyin gently, falls-away (Evrae), body (human Seymour), machina-wreck (Vegnagun) and yields (the Syndicate and the Guado). Victory gestures are keyed on the victory painting (EC-10). Pose changes are hard cuts on the impact frame (VP-20); only idle and ready warp into each other, because their silhouettes match. |
| **Visual fidelity** | Figures get soft edges: alpha-to-coverage on the figure layer and a premultiplied-alpha defringe (VP-17, -18). A deformation guard keeps any texel stretch at or below 1.15 times, so the warp never smears paint. |
| **Camera** | Only the critic's 9.0 items: a static lens shift into the HUD-free area (VP-46), a positive party/boss gap (VP-02) and formation spacing so the third member shows (VP-44). The calm master is otherwise unchanged. |

**Switches** (LIVING FIGURES group, each its own row, default on): `breath` BREATHING, `hair` HAIR AND CLOTH, `blink`
BLINKS, `weight` ATTACK WEIGHT (anticipation, arcs, follow-through), `bosslife` BOSS LIFE (part motion and windups),
`kocollapse` KO COLLAPSE, `victorygest` VICTORY GESTURES. REDUCE MOTION stills breathing, hair, cloth, weight shifts,
blinks and part motion. A KO becomes a cut to the KO painting, and a telegraph keeps its light only.

**Per game.**

| | FFX | FFX-2 |
|---|---|---|
| Tempo | Calm: heavier springs, longer holds, breathing at today's speed | Quicker: periods at 0.8 times FFX (the D precedent, VP-49), lighter springs. Anticipation and follow-through fit inside today's action length (the Active ATB caveat) |
| Victory | One gesture per character. Ch II (Zanarkand) holds the battle stance: "no one will pose" (research §2.1). Breathing continues | Per dressphere (research §2.2). **No pose after Bahamut (IV), Shuyin (V) or Trema (XIII)**: the gesture is suppressed there and breathing continues |
| Defeat | Departure kinds: Flux pyreflies, Yunalesca's column, Seymour at Macalania leaves a body, Evrae falls away | Vegnagun machina-wreck, Shuyin's gentle fade, and the Syndicate **yields**: slumps, kneels, never dissolves (VP-47) |

**Budget.** A figure mesh is a 32x48 grid, about 1.5k vertices, so ≤ 12 figures make about 18k. The springs run on the
CPU at about 0.05 ms. Estimate: +0.2 ms desktop and +1 ms phone tier (an estimate, to be measured in the prototype).
The phone tier uses a 16x24 grid with breathing and blinks only, and no springs. Low does breathing only.

**Three moments per game.**
- FFX: **Ch I, Gagazet at rest.** Flux's hair and robe lift in the blizzard gusts D already draws, Mortiorchis
  coils, and Tidus breathes and blinks. **Ch VII, Macalania.** Seymour buckles and falls, and his body stays
  (research §3.2, the newly approved fall painting). **Ch II, Yunalesca.** Her hair floats while she casts; at
  her defeat she buckles and dissolves upward into the pyrefly column; nobody poses.
- FFX-2: **Ch V, Vegnagun.** The Tail sways, the Head lifts on its windup, and Shuyin's coat moves.
  **Ch IV, Bahamut.** The wings breathe; Rikku's braids and Paine's coat spring on the lunge. **Ch VI, Leblanc.** The
  Syndicate yields instead of dissolving, then the girls' per-dressphere gestures play.

**Re-offers** (each needs its own yes): the goal of `cutout-animation`, declined on 19 Sep (B's sway since adopted
under D-287). `hit-feel` is partly re-offered through anticipation and follow-through.
**Art cost:** blink overlays only. Rigs are derived and hand-tuned: about 25 party subjects, 19 FFX-2 dressphere
idles and about 20 bosses, one or two hours each, done chapter by chapter.
**Covers:** EC-01, -04, -06, -09, -10, VP-17, -18, -20, -44, -46, -47, -49.
**Leaves open:** VP-11 (bosses still own 1 to 3 paintings), the colossus scale and the camera's heavier items.

---

## Option B · Painted Motion

**Pitch: hand-painted animation. Each swing has three or four painted keys with a smear frame, and every headline boss
attacks, casts, reels and falls in its own paintings, all repainted at twice the resolution.**

Animation the way anime does it: more painted keys per action, held on twos, with a painted smear on impact. The
pipeline already produces these: the ComfyUI pose recipe with OpenPose, identity taken from the shipped idle sidecar,
body-only pose tags, and a 3 to 5 pose pilot looked at before any batch (the 2026-09-21 lessons).

| Area | What B does |
|---|---|
| **Character models** | A complete, identity-locked pose set per figure: attack as anticipation, smear and follow-through keys; cast as windup and release; a mid-fall KO key; two victory keys. Painted Overdrive key poses for FFX and Special key poses for each FFX-2 dressphere (EC-12). Each set is colour-locked to the idle (one palette per figure, VP-40), and the art gaps are closed: the White Mage look Bailey picks (VP-07), the dressphere sets awaiting D-177 picks (VP-10), and a Kimahri broken-horn candidate (VP-41, a candidate beside the approved idle, never painted over it). |
| **Enemy models** | Every headline boss gets attack, cast, hurt and KO paintings (VP-11). The off-design paintings are redone to the approved idle: Vegnagun Tail in steel (VP-08), FFX-2 Bahamut on a canvas that fits (VP-09). Vegnagun Tail, Sin, Evrae, Bahamut and BFA are repainted at 2x, as candidates (VP-42). Every aeon Overdrive and boss Special splash carries painted art (EC-02). The cheapest route needs no render: the approved attack or cast painting cropped by a focal box. |
| **Animation** | Stepped keys with smear frames, timed so the hit lands on the impact key (VP-06). Per-move Overdrive choreography replaces the plain Attack lunge (EC-03): leap, spin smear, down-stroke and landing for a Tidus Overdrive, with the beats taken from research or the Steam HD copy and labelled "ours" where neither says. **The FFX-2 spherechange beat** (VP-01, -15) gets painted keys: a twirl, the old outfit going and the new one manifesting (research §6). Time halts and the girl shows as invulnerable during it. It plays in full the first time, then instantly, behind the Spherechanges switch. |
| **Visual fidelity** | Every new painting is made at 2x, so figures keep ≥ 1.5 texels per screen pixel at 2x, against 0.45 to 1.3 for today's worst bosses. Mattes are decontaminated at the cutout (no fringe). Large textures are compressed with KTX2, using the transcoder in the `three` package already installed. The phone tier loads the 1x mip. |
| **Camera** | Cuts are timed to the painted keys. The FFX Overdrive input window gets a three-quarter hero shot of the actor at about 50 % frame height (EC-07), and the shot cuts back when the input ends. Impact gets a close cut and follow-through a pull-back. All of these are cuts to held shots within D-291. |

**Switches** (PAINTED MOTION group, default on): `keys` EXTRA POSE KEYS (off = today's one painting per action),
`smear` SMEAR FRAMES, `odchoreo` OVERDRIVE CHOREOGRAPHY, `splashart` SPLASH ART, `hd2x` HIGH-RES PAINTINGS (forced off
on the phone tier), `herocut` OVERDRIVE HERO SHOT. FFX-2's existing SPHERECHANGE setting governs the spherechange
keys. REDUCE MOTION holds the main keys, drops the smears and makes each action a single cut.

**Per game.**

| | FFX | FFX-2 |
|---|---|---|
| Signature | Overdrive choreography and the aeon Overdrive splash. FFX has no spherechange | The spherechange keys and the dressphere Special keys. FFX-2 has no aeons of its own (research §6.1) |
| Pose sets | 7 characters, about 9 new keys each | 3 girls across 19 dresspheres, about 6 keys each. Victory keys only where a pose is allowed (VI and the ordinary fights; none after IV, V or XIII) |
| Timing | Keys can hold as long as they read well (CTB) | Keys fit inside today's action length (Active ATB) |

**Budget.** No GPU cost per frame. Memory: 2x paintings are about 4 times the texels, so preloads are per chapter
with a budget of about 400 MB of GPU texture on desktop, the 1x mip on phone and KTX2 everywhere. Load time
within +1 s on desktop. The shipped art grows, measured against the deploy size before anything ships.
**Art cost: the largest of the four.** About 250 new paintings: 63 FFX party, 114 FFX-2 dressphere and 80 boss. At
about 8 candidates each, that is about 2,000 renders, roughly 22 GPU hours, plus a Bailey review round per set,
chapter by chapter.

**Three moments per game.**
- FFX: **Ch I, a Tidus Overdrive.** The hero shot for the input window, then the leap key, the spin smear, the
  down-stroke and the landing. **Ch III, BFA.** It attacks in its own attack painting, no longer its idle, and is
  crisp at 2x. **Ch XVII, Sin's fins.** Repainted at 2x, they read as paint, not blur.
- FFX-2: **The first spherechange of a fight.** The painted twirl and manifest, time halted, played in full.
  **Ch V, Vegnagun.** The Tail is one steel design across idle, hurt and KO, at 2x. **Ch IV, Bahamut.** It reels
  and falls in paintings that match the approved dragon, and Mega Flare's splash carries its painting (the D-298
  splash is already approved).

**Re-offers:** `overdrive-cinematic` (declined 19 Sep), EC-03.
**Covers:** EC-02, -03, -07, -12, VP-06, -07, -08, -09, -10, -11, -40, -41, -42, and the spherechange VP-01, -15.
**Leaves open:** the idle reading as a still (EC-01), the camera's scale and staging items, and relighting.

---

## Option C · Diorama Director

**Pitch: shoot each fight like a film. Each room gets a composed master, held shots cut on the beats, giants that
look giant, and figures lit by the room and by the spells.**

Option C changes where the camera stands and how the figures take light; it adds no new paintings. It draws on the
four framing families the critic listed (EC-05) and the perspectives round of 2026-09-27, whose judges favoured "hold
still while choosing, cut on the action".

| Area | What C does |
|---|---|
| **Camera** | **One authored master per chapter**, chosen by the boss's class: <br>- **colossus**, a low camera with the boss at 1.5 to 3 times party height: Natus, Yojimbo, BFA, Yunalesca, Evrae, Bahamut, Vegnagun and Sin (VP-43, -45); <br>- **three-quarter hero**, for human-scale duels: Seymour at Macalania, Omnis, Isaaru, Trema and Gippal; <br>- **across the field**, with a wide, tilted diorama, for the multi-enemy fights. <br>Every master keeps a positive party/boss gap (VP-02), with a static lens shift into the area the HUD leaves free (VP-46). **Cuts per battle state, each to a held shot**: command (the master), party action (a side shot of the actor), enemy windup (a close cut on the boss, which doubles as a telegraph), the FFX Overdrive input (a three-quarter hero shot at about 50 %, EC-07), and victory (a whole-figure low shot, VP-25). The push rigs keep the whole figure in frame (VP-26). **Phone:** a static alternate framing fills the black lower third during beats with no input (EC-14); nothing moves or resizes. |
| **Character models** | Figures are **relit from derived normals** (EC-11). Depth Anything V2 Small depth goes through a Sobel filter to make a normal map per painting, so the room's key light, D-224's phase lighting and each spell's colour shape the figure's form instead of a fixed rim. A key-light floor per figure (VP-22), screen-space contact shadows and ambient occlusion at the feet, and slot spacing so nobody hides (VP-44, PR-0002/VP-27). |
| **Enemy models** | Scale and staging per boss (VP-13, -43). The Syndicate steps forward at true height. Fog layers sit between the party and the colossi for depth, and the bosses' own lights (Vegnagun's reds, Bahamut's core) spill onto the party through emissive masks taken from the paintings' bright pixels. **Ixion: the camera is pitched to the painted plate** (VP-14); the plate stays as approved. Mortiorchis and the summons are staged in their own depth slots (VP-28, -29). |
| **Animation** | The rhythm comes from the cuts: the hit lands on the impact frame (VP-06), and every shot holds at least 1.2 s, with at most one cut per action beat. The boss windup cut gives the telegraph a frame of its own. |
| **Visual fidelity** | SMAA on the figure layer, a defringe and a rim measured in screen pixels (VP-17, -18), a depth-of-field band shaped per master (an extension of today's tilt-shift) and per-room fog. |

**Switches** (DIRECTOR CAMERA group and FIGURE LIGHT group, each row default on): `masters` CHAPTER FRAMING (off =
today's calm master), `scale` BOSS SCALE, `cuts` ACTION CUTS, `herocut` OVERDRIVE HERO SHOT, `lensshift` HUD-AWARE
FRAMING, `phonefill` PHONE FULL FRAME, `normals` FIGURE RELIGHTING, `spelllight` SPELL LIGHT ON FIGURES, `contact`
CONTACT SHADOWS, `aa` SMOOTH EDGES. REDUCE MOTION keeps the master and at most one cut per action, within the D-220
definition, and holds the depth-of-field band still. Comfort stays: no roll, no orbit, and moves keep the calm caps
(20°/s, at least 700 ms, sine).

**Per game.**

| | FFX | FFX-2 |
|---|---|---|
| Grammar | Cuts between held shots on meaningful beats. This is the one sourced pattern ("reframes per action", research §2.1 and perspectives §A.2), so FFX's master holds and cuts | **A view of its own** (EC-13): a wider lens, a looser spread of the three girls (free positions and back attacks are FFX-2's, perspectives §B.1) and a short, showy reframe on the cut into battle (research §9 row 6). The party stays left (D-167) |
| Big beats | Hero shot for the Overdrive input. The full aeon-arrival framing is Shiva's (Ch VII, research §7) | The spherechange gets a held close shot of the girl (research §6.1). Vegnagun keeps D-228's low camera with per-link part scale |
| Light | Gold hour; spells tint the party | Pink hour; the bosses' machina and possession light tints the girls |

**Budget.** Normal-mapped figures with up to 4 dynamic lights add about +0.5 to 1.5 ms on desktop, SMAA about +0.3 ms
and the depth-of-field band about +0.5 ms (estimates). The phone tier drops the normals (a flat key tint) and the
bokeh depth of field (the existing tilt-shift stays) and uses FXAA instead of SMAA. Low has no relighting and no
depth of field.
**Art cost:** no ComfyUI renders. The depth and normal maps are derived locally and gitignored.
**Approved targets:** new masters change the composition of approved battle tiles. A pick updates those targets
chapter by chapter, side by side, and D-167's party-left stays.

**Three moments per game.**
- FFX: **Ch X, Natus.** The colossus master makes Natus loom; today it stands at 24 % of the frame. **Ch I, a Tidus
  Overdrive input.** A three-quarter hero shot, Tidus relit blue-white by the snow light; then the cut back to the
  master. **Ch VIII, Evrae.** An across-the-field master down the airship deck, with Evrae far and large; the far
  layer can follow Pull Back (research §9 row 11).
- FFX-2: **Ch XVI, Ixion.** The camera pitched to the plate, so the room finally agrees with itself. **Ch VI,
  Leblanc.** The Syndicate at true height in FFX-2's own wider view. **Ch V, Vegnagun.** The low colossus master with
  fog between the girls and the machine, and the girls lit red by Vegnagun's lights.

**Re-offers:** `depth-normal-lighting` (declined 19 Sep). Camera families from the 2026-09-27 perspectives round.
**Covers:** EC-05, -07, -11, -13, -14, VP-02, -13, -14, -17, -18, -22, -25, -26, -27, -28, -29, -43, -44, -45, -46.
**Leaves open:** idle life and attack weight (EC-01, -04), and the boss paintings (VP-11).

---

## Option D · Sculpted Figures (hybrid, a DEPARTURE from painted 2.5D)

**Labelled a departure (rule 9). Not recommended without Bailey's explicit pick.**

**Pitch: turn each painting into a sculpted relief body with a skeleton. The camera can then see figures from three
quarters, arms swing in depth, and light and shadow wrap around them.**

| Area | What D does |
|---|---|
| **Character models** | Each figure becomes a relief mesh extruded from its derived depth, to about 15 to 25 % of its width, with the painting projected from the front. Bones are placed at the OpenPose keypoints the pose pipeline already extracts. A full image-to-3D body would need a model download, which needs Bailey's yes and a licence check, and is not part of the pilot. |
| **Enemy models** | Wings, tails and fins become real geometry that bends. Colossi cast true shadow maps over the party. |
| **Animation** | Skeletal keys, so arms swing and torsos twist in depth with true in-betweens. |
| **Visual fidelity** | True lighting and shadows. **Off-axis, the paint smears:** there is no painted side or back, so anything past about 30° is invented by stretching. |
| **Camera** | Three-quarter and over-the-shoulder masters work without rear paintings, up to the smear limit. |

**Switch:** SCULPTED FIGURES (off = paintings), `sculpt`. REDUCE MOTION gives held poses only.
**Per game:** the same for both games, which is part of its problem: it adds no game-aware treatment of its own.
**Budget:** skinning plus per-figure shadow maps, estimated at +2 to 4 ms on desktop. The phone tier falls back to
flat paintings, so phone players see a different game.
**Moments:** FFX: Tidus at three quarters at command, Flux's arms casting in depth, Yunalesca's light wrapping
round her. FFX-2: Yuna's Gunner arms swinging, Bahamut's wings as geometry, Paine seen from behind in a
shoulder master.
**Why not:** it trades "the approved paintings are the star" for "the paintings are textures". It risks the clay
look the 2026-09-27 judges marked down as "cardboard". Every approved board tile would have to be re-approved, and
it needs a download to go all the way.

---

## Side by side

| | A Living Canvas | B Painted Motion | C Diorama Director | D Sculpted (departure) |
|---|---|---|---|---|
| Centre of gravity | animation, without new art | paintings, more and sharper | camera, staging, light | 3D bodies |
| Character models | breathing, hair, cloth, blinks | full pose sets, Overdrive keys, 2x | relit form, contact shadows, spacing | relief bodies |
| Enemy models | part life, windups | own attack, cast, hurt and KO paintings, 2x, one design each | scale, fog depth, emissive spill | bending geometry |
| Animation | anticipation, follow-through, KO collapse, victory | painted keys, smears, choreography, spherechange | rhythm from cuts | skeletal |
| Visual fidelity | soft edges, defringe | 2x paint, clean mattes | SMAA, relighting, depth of field | true light, off-axis smear |
| Camera | lens shift, gap, spacing | key-timed cuts, hero shot | per-chapter masters, cuts, phone fill | three-quarter masters |
| New paintings | blink overlays | about 250 | none | none (download for full 3D) |
| Approved tiles changed | no | the action poses (new tiles) | the battle compositions | all |
| Frame cost (desktop, estimate) | +0.2 ms | ~0 per frame, more memory | +1 to 2.3 ms | +2 to 4 ms |
| Re-offers | cutout-animation (goal), hit-feel (part) | overdrive-cinematic | depth-normal-lighting | — |
| Time to a prototype | days | days for the pilot, weeks of art rounds | days | a week, pilot only |

## Recommendation: C + A now, B's paintings in art rounds, not D

1. **C and A together are the end state to prototype first.** Animation is the lowest score (6.2), and A fixes it
   with no new painting: visible idles, weight in every swing, KO collapse and per-class departures. Camera (7.5) and
   enemy presence (7.1) are C's: colossus scale, the Ixion plate, the Syndicate, the hero shot, figures that take
   the room's light, and the phone's empty lower third. Both are code over derived files. Neither touches an approved
   painting, both prototype in days, and both measure honestly on today's art. They also stack cleanly. A moves
   vertices; C changes light and framing. They meet in the figure shader, which must be injected by a scene walk
   like `fx/b/Figures.ts` (PaintedActor is 2022 lines and must not grow, rule 7).
2. **Then B, as art rounds, highest payoff first.** The splash art crops need no render (EC-02). After them, in order:
   each headline boss's own attack, hurt and KO paintings and the single-design fixes (VP-08, -09, -11); the 2x
   repaints of the five lowest-density bosses; the FFX-2 spherechange keys; then Overdrive key poses and the full
   pose sets. Each set is shown to Bailey before it is installed. B has the highest ceiling (the critic's 9.5 items for
   enemy models and animation need its paintings), but it is about 250 paintings, so it is phased, not one build.
3. **D is not recommended.** It gives up the settled painted direction for a look the earlier judges already
   found weaker, and the phone would get a different game.

The prototype order on `candy-max-proto`: `?max=a`, `?max=c`, `?max=a,c`, then B's pilot keys composited into
`?max=a,b,c`. Each will be captured at the six moments above on desktop 1600x900 and phone 390x844, with frame times
measured on and off.

## Pilot art (smallest honest set, candidates only, never installed)

| Option | Pilot renders | Where |
|---|---|---|
| A | Closed-eye blink overlays: Tidus idle (FFX) and Yuna Gunner idle (FFX-2), 4 inpaint candidates each, as separate layers | `candidates/2026-10-01-max/a-blinks/` |
| B | Tidus attack (FFX) as anticipation, smear and follow-through keys; Yuna Gunner attack (FFX-2), the same three; a Tidus Overdrive leap key; Vegnagun Tail attack plus a 2x idle in the approved steel design; 4 candidates each (about 36 renders). Splash art: a focal-box crop of approved paintings, no render | `candidates/2026-10-01-max/b-keys/` |
| C | None. The derived depth and normal maps come from the local Depth Anything V2 Small, not from ComfyUI | — |
| D | None. A depth-relief pilot (Tidus, Seymour Flux) is derived locally; a full image-to-3D model would be a download needing Bailey's yes | — |

## What Bailey decides

1. Which option, or which mix (recommended: C + A, then B's paintings in rounds).
2. Each re-offer, on its own: the cutout-animation goal (A), overdrive-cinematic (B), depth-normal-lighting (C).
3. For FFX-2 under Active ATB: should added anticipation fit inside today's action length (the recommendation), or may
   actions grow?
4. For B, if it is picked: the White Mage look (VP-07) and Flux's direction (VP-12) come before any pose set for
   those figures.
5. Where the new switches live: an EYE CANDY sub-page under OPTIONS (it gets a mockup first).
