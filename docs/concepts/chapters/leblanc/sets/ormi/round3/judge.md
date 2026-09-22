# Ormi round 3: independent judge (2026-09-22)

FFX-2 only (Chateau Leblanc, Act III). Art review only; no game file, shared
tool or render changed (AGENTS.md hard rule 14). This is a second pass by a
different agent than the one that painted the set. The painter's report,
scores and file list were moved unchanged to `production.md`.

**Verdict: FAIL. No state reaches the bar of 7. No winner.** Every installed
file stays a CANDIDATE. Nothing was added to `docs/target/approved-hashes.json`.
Its 115 files hash the same before and after this pass (checked both times).

**Sheet:** `judge-sheet.jpg` (built by `judge-sheet.py`).
- Row 1: idle, attack, cast, hurt and ko, all at **one pixel scale**, which is
  how the engine sizes them (`computePoseScale` takes idle's pixels per world
  unit).
- Row 2: native 1:1 head crops.
- Row 3: shield and costume crops, cut at native pixels.

All four installed files hash identical to the `candidateSource` their
sidecars name (`attack.940001.heart950002`, `cast.940105`, `hurt.940204`,
`ko.940302.heart950304`). I viewed all 24 first-batch contenders as whole
figures. The six ko seeds, the round-2 files that were replaced (from the
backup) and every installed file were also checked at 1:1.

## Method

- **Anchor:** `public/art/characters/ormi/idle.png`. It sits between Bailey's
  picked concept `renders/ormi-a.png` and the research line in
  `research/ffx2-leblanc-syndicate.md` §10.1: "short and stout", a large
  shield on his back with the Syndicate heart, purple samurai attire.
- **Scoring:** each criterion is 0 to 10. A candidate's score is its worst
  criterion, and the bar is 7. The criteria are those of the pilot judge,
  adapted to Ormi:
  - head and topknot (colour, tie, tassel)
  - face (green eyes, scowl, idle's cheek mark, no invented paint)
  - costume (purple armour, crimson sleeves, gold collar, yellow sash, teal
    pelvic curtain with its ornament, long purple hakama with a gold diamond
    hem)
  - shield (one, round, gold studded rim, heart)
  - build
  - line and shading style
  - pose reads as its state
- **Facing** is judged as a separate, set-level check (see below). It is not
  counted inside the per-state score, because a sidecar edit fixes it without
  a render.

**The idle's shield has no heart.** At 1:1 its face is a purple and blue
sunburst with a gold boss inside a red, gold-studded rim. So the heart
criterion is judged against the research and the brief, not against idle.
Every heart in this round is new relative to the anchor, and that alone keeps
the shield criterion off 8.

## Scores

| State | Pick | Head | Face | Costume | Shield | Build | Style | Pose | **Score** | Worst |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| attack | 940001 + heart 950002 | 6: dark brown topknot, no tassel | 7: green eye, bared teeth; idle's cheek mark gone | **5**: sheer lilac hakama, not idle's deep purple; invented red heart-bow on the belly; no teal curtain; blue sandal straps | 6: one round red shield, gold studded rim, a clear heart. The heart is glossy and 3D with a swirl inside, unlike the flat cel shield, and the old gold line shows around it | 7 | 7: nearest to idle's painterly shading | **5**: the shield arm is flung *behind* him while head, belly and lead foot drive the other way. It reads as a back-swing or wind-up, not a shove delivered with the shield | **5** | costume, pose |
| cast | 940105 | 6: magenta topknot, yellow band, no tassel | 7 | 5: invented pink and rainbow collar scarf, lilac shoulder plates, orange-red sleeves, no teal curtain | **4**: one round shield, but purple with a red boss and **no heart**. The heart moved to the chest clasp | 7 | 6 | 6: low braced stance, clenched fists. It reads as bracing or a body-check charge, which suits Supercollider's wind-up | **4** | shield |
| hurt | 940204 | 5: lavender ball topknot, no tassel | 6: eyes shut, mouth open, head thrown back, no marks. Could also read as a shout to the sky | 5: brown-orange sleeves, not crimson; rainbow-gradient collar; sash fringe fades yellow to green; orange hem band in place of the gold diamond hem; no teal curtain | 6: one round red shield with a clean flat heart. It hangs at his front, not on his back, and the lower rim bleeds green | 7 | **5**: heavy black outlines and flat fills. Beside idle it looks like a different illustrator | 6: a recoil, hand to the belly | **5** | head, costume, style |
| ko | 940302 + heart 950304 | **4**: pale beige brush topknot (the red tie and tassel are right) | 7: eyes screwed shut, frown | **4**: the top sleeve and the back plate fill the frame in orange-red; purple only in the hakama | 6: one round shield with a clear heart. The heart is a glossy "jelly" with a white inner ring, a finish no other state has | 7 | 5: the same thick-outline, flat style as hurt | 8: collapsed on his side, unmistakable | **4** | head, costume |

Against the painter's own scores (`production.md`):
- **Attack 6 → 5.** At 1:1 the shield trails behind the lunge, so the pose does
  not show a shield bash.
- **Hurt 6 → 5.** Hurt and ko have drifted to a flatter, heavily outlined style,
  and the painter did not score style.
- **Cast 4 and ko 4:** I agree.

## Set-level findings the painter's report does not have

1. **Ormi turns round between states.**
   - Measured at 1:1 on the head crops: idle and attack face **screen-right**;
     cast, hurt and ko face **screen-left**.
   - Every sidecar says `facing: "left"`. `PaintedActor.mirrorOf` passes the
     per-pose `facing` to `mirrorFor`, and `mirrorFor('left', -1)` returns 1,
     so none of the five is mirrored. An enemy's world facing is -1 under the
     facing contract in `tools/gen/comfy.mjs`.
   - Result: in battle he would face away from the party at idle and during
     his attack, then about-face when he braces, is hit or falls.
   - I read this from the code; I did not see it in a running battle.
   - **Fix, no render needed:** mark idle and attack `facing: "right"` so the
     engine mirrors them. `tools/gen/flip.py` also works. Ormi has no
     one-sided feature that mirroring would break.
   - Changing the sidecar of the idle Bailey saw is his call.
2. **Idle no longer matches the set in size.** Row 1 of the sheet shows it:
   - Idle is narrow. The poses are heavy and round, with heads about 1.5 times
     idle's.
   - Figure area (opaque pixels): idle 334,758; cast 452,799; hurt 562,545;
     ko 541,554.
   - Hurt stands as tall as idle but is nearly twice as wide. In game Ormi
     swells when he is hit.
   - This confirms the painter's open item 1. The round-3 build is the one
     Bailey asked for ("heavier, from A"), so **idle is the file that is off**.
3. **Two finishes.** Attack and cast keep idle's painterly shading. Hurt and ko
   have moved to thick black outlines and flat fills, and their shields are
   glossy in two different ways. Even with every colour fixed, the four states
   would not look like one set.
4. **Colour drift nobody has named.**
   - Idle's sleeves are a deep crimson. Cast, hurt and ko have orange-red to
     brown-orange sleeves.
   - The teal pelvic curtain and its jewelled ornament are missing from all
     four states.
   - Idle's cheek mark (a pale circle on the cheekbone) is missing from all
     four states.
5. **Unlisted contender.** Ko 940305 is not in the painter's rejection list.
   - It is the only purple-torso ko seed with a shield.
   - It fails anyway: a teal ball for a topknot, purple sleeves, a garbled
     card-suit emblem, an arm bent backwards, and the feet at the frame edge.
   - The installed pick stays the better of the six.

## Against the files it replaced (round 2, from the backup)

Round 2 drew a slim, muscular swordsman type with red chest panels, a pointed
shield and face paint. Round 3 is plainly Ormi in every state: bald, a
topknot, heavy, purple armour, one round shield, no face paint, and a heart on
the shield in three of four states. **The round-3 picks beat the files they
replaced and should stay installed as CANDIDATES.**

## Redo, in order (the next method, not another blind pass)

This is the third failed pass on the Ormi set (rounds 1, 2 and 3). Hard rule
15 applies: no fourth word-only batch. Show Bailey this sheet.

1. **Facing** (sidecar or `flip.py`; no render). Ask Bailey before touching
   idle.
2. **Idle at the round-3 build.** Re-render idle with method F and this
   round's words (arms crossed, shield on back), so the anchor, scale and
   shield match. This changes the anchor Bailey saw: his call.
3. **Masked repaints, the tool that already worked here** (`repaint-heart.mjs`):
   - cast: repaint the shield *face* on a pose that shows the face, or accept
     a new cast pose with the shield brought round to the front;
   - ko: repaint the torso at denoise about 0.5 with `purple armor`;
   - ko: recolour the topknot;
   - attack: repaint the hakama and remove the belly heart-bow.
4. **Style unification for hurt and ko:** img2img at low denoise (0.15 to 0.2,
   the "last-mile" pass the pilot judge kept for method B), with idle as the
   style reference. Or re-roll hurt from the attack/cast seeds' finish.
5. **Attack pose:** the shield must lead. A pose word or an OpenPose control
   with the shield arm forward, on the facing side.

## Hard rule 6

§10.1 of the research supports only these: stout build, a large shield on his
back with the Syndicate heart logo, and purple samurai-style attire.

The topknot colour, the red sleeves, the sash, the teal curtain and the
shield's own colours come from the installed idle, not from a source. The
same holds for the idle's heartless sunburst shield, which contradicts §10.1.
