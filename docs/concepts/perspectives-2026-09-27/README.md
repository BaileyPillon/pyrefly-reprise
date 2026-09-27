# Battle perspectives: options round (2026-09-27)

**Bailey, 2026-09-27 ~01:00 EDT:** "I need very novel mock ups of how the game could look from different
perspectives, right now the characters are turned a certain way toward enemies, explore all the possible
ways it could look and which renders are likely to be perceived as quality and presentable and visually
appealing eye candy to the player playing the game."
**Then, ~01:35 EDT:** "also which one would similar games pick? which looks the most presentable and
polished with the most eye candy? which one is most faithful and most canon? camera-moves-per-command
idea? true-over-the-shoulder angle??? please elaborate and more mockups please" / "continue what you're
doing and do that in parallel as well please"

**Nothing is built.** This is an end-state options round (AGENTS.md rule 9): Bailey picks or mixes, and a
pick approves only what Bailey names. The brief the agents worked from is [SHOT-SPEC.md](SHOT-SPEC.md).

**Game case (rule 14):** the camera placements are ours in both games: no source describes FFX's or
FFX-2's command-input framing. FFX's per-action camera is sourced (it cuts between held shots on
meaningful beats). "In the Round" is FFX-2 only (free positions and back attacks are FFX-2's). FF7 is
not in this round: its staging is sourced and settled separately (`research/ff7-battle-staging.md`).

## Start here

- `sheets/06-final-all.jpg`: every option, both chapters (25 each), labelled with provenance.
- `sheets/05-ots-family.jpg`: the over-the-shoulder family side by side.
- `motion/M4-ffx-ch1.mp4`, `motion/M4-ffx2-ch4.mp4`: the per-action camera (the judges' favourite).
- `motion/M2-ffx-ch1-cut.mp4`: the camera per command with a true over-the-shoulder.
- The gallery page: https://claude.ai/artifact/MEURPqmFE2CdqSZwbe6CN9 (private to Bailey; every frame, clip and score).

## The short answers

**What similar games pick** (`research/battle-camera-perspectives.md` §C, sourced per row). Modern
turn-based showpieces (Clair Obscur, Persona 5, Metaphor) frame the acting character from behind or beside
while you choose, and move the camera with the action. The 2D line (FF IV-VI, Bravely Default, FF7 by
informal sources) stages a side view with the party on the right. Dragon Quest XI S lets the player choose
"Classic" or "Free Move"; DQ VIII and the DQ III remake go third person while choosing and first person
while the turn plays. FF8 swings from caster to target on spells, with a setting for how often. FFXIII's
following camera was criticised for hiding the fight.

**Most eye candy** (three blind judges: an FFX veteran, a modern JRPG player, a first-time viewer; 46
stills and 14 clip strips, shuffled and unlabelled; scores in `judges/aggregate.json`). All three agree:
hold the camera still while the player chooses, and cut on the action. The per-action camera (M4) is the
top clip in both chapters (eye candy 8.5 and 8.8, comfort 7.5, as comfortable as today's still camera).
The over-the-shoulder family and the Cinematic Shoulder top the stills (7.5). Moving the camera on every
menu step tires them (comfort 5.5-6.3); whip pans score worst (2.3-3.2). Tabletop, Diorama and the
giant-face Split-Diopter come last.

**Most faithful and canon.** FFX's battle camera is never player-controlled (4 sources) and cuts between
held shots on meaningful beats (single source), so a camera that changes angle per action is the
canon-shaped one. No text source says how FFX frames command input, or which side the party stands on;
only the game can show it (a check in Bailey's Steam copy needs his yes: it takes over his screen). The
series convention in sources is party on the right (FF1, FF7 informally); ours stands left. FFX-2's
positions are mechanical (a hit from behind does double damage); its camera is not described in sources.

**Camera per command.** Opening Attack, Magic or Items moves the camera (low and close / high and wide /
close with the field soft). It works with today's paintings (M1) and with rear paintings (M2). The judges
liked the look but found a move on every menu step tiring; move per action instead. If it is kept, use
hard cuts: the whip pan scored worst of all 14 clips.

**True over-the-shoulder.** The camera behind the party, the boss facing the player. The characters are
flat paintings with only a front, so without new art they seem to turn their backs on the boss
(`P02w`). With rear paintings it works (the P2 family), and a hard cut hides the front-to-rear swap. The
whole game needs rear paintings for 26 subjects: 7 FFX characters and 19 FFX-2 dresspheres.

## Pick one, or mix

| | While choosing | On action | Frame | Phone | Art to make | Game case |
|---|---|---|---|---|---|---|
| **A · Showpiece** (recommended target) | still over-the-shoulder (P2h / P3 / P21) | per-action camera (M4), hand-off behind the next actor (M3) | film bands with the menus in them (P21), if picked | Portrait Duel (P15) | 26 rear paintings, reverse plates per arena | ours in both; the per-action camera is canon-shaped for FFX |
| **B · Showpiece on today's paintings** | today's angle, dressed (P0 / P1) | per-action camera (M4, with today's paintings) | today's | today's | reverse plates per arena; bosses as silhouettes (optional rear paintings) | as A |
| **C · Today** | today's | today's | today's | today's | none | — |

- **Moments for any of them:** the Hero Poster (P22) for a fight's intro or victory (the judges' highest
  eye candy, 7.75, but a moment, not a battle screen); the Colossus angle (P7) for giant bosses, already
  approved for Vegnagun (D-220).
- **Recommendation:** A as the end state, built in steps that each ship something visible. First the
  per-action camera on today's paintings (B, no party art), then rear paintings chapter by chapter
  (each set shown to Bailey first, like every art round), then the film bands and the phone layout if
  picked.
- **Engine work (A and B):** an action-camera grammar in the presenter (side hit, reverse angle on enemy
  turns, looking up for big attacks, low hero angle on victory), computed from positions, as cuts; paintings
  turned square to the lens for those cuts (today the eased yaw stops at 26-34°); a reverse plate behind
  each arena; a "battle camera: cinematic / fixed" setting (FF7, FF8, DQ XI and Clair Obscur all have
  one; D-212's reduce-motion rule already turns camera moves into cuts). A only: rear-painting swap on the
  master, the hand-off cuts, the band layout, the phone layout. The presenter and camera are shared
  presentation core: a focused review before the deploy and a deep review after (AGENTS.md, Release).
- **Conflicts with approved targets:** FFX-2 holds the wide shot while a menu is open (PR-0150, targeting
  tile B, 2026-09-19); A changes the picture that hold shows, and the hold itself stays (under Active ATB a
  fiend can act under an open menu). The film bands move the approved Ink & Gold HUD into bands: a new
  layout, which this round is the mockup of.

## Every option, scored (mean of 3 judges x 2 chapters)

| # | Option | Eye candy | Readable | Not cardboard | Boss | Hero | Verdict |
|---|---|---|---|---|---|---|---|
| P22 | Hero Poster (moment) | 7.75 | 3.0 | 6.25 | 8.0 | 8.17 | moment shot only |
| P21 | Cinematic Shoulder | 7.5 | 7.83 | 6.92 | 6.42 | 6.75 | top: A with film bands |
| P2h | Over the Shoulder, high | 7.5 | 6.83 | 6.75 | 8.0 | 6.08 | top: A's master |
| P3 | Hero Shoulder | 7.5 | 7.0 | 7.17 | 6.92 | 6.92 | top: A's command shot |
| P11 | Cinemascope | 7.25 | 7.67 | 6.33 | 6.25 | 7.17 | strong; film bands on today's angle |
| P2 | Over the Shoulder | 7.25 | 6.17 | 6.75 | 8.17 | 6.08 | strong |
| P0 | Today | 7.0 | 7.42 | 6.17 | 6.92 | 6.75 | baseline |
| P1 | Today, dressed | 7.0 | 7.42 | 6.08 | 6.92 | 6.75 | treatment alone adds little |
| P15 | Portrait Duel (phone) | 6.92 | 7.92 | 5.75 | 8.33 | 5.67 | the phone pick (first-time viewer's #1) |
| P0m | Today, mirrored | 6.92 | 7.0 | 6.17 | 6.92 | 6.92 | no gain; flipping needs chiral repaints |
| P2l | Over the Shoulder, low | 6.92 | 5.58 | 6.42 | 7.75 | 6.33 | great in FFX-2 (7.83), weak in FFX |
| P14 | Panels | 6.83 | 5.0 | 4.67 | 7.5 | 7.17 | a special-moment cut-in at most |
| P7 | Colossus | 6.75 | 5.67 | 4.25 | 9.17 | 4.0 | big attacks and giant bosses |
| P4 | Reverse Angle | 6.67 | 4.42 | 6.33 | 6.92 | 3.58 | enemy turns, inside M4 |
| P2r | Over the Shoulder, right | 6.25 | 5.08 | 6.42 | 7.0 | 6.0 | chiral paintings face away |
| P10 | In the Round (FFX-2) | 6.17 | 5.0 | 4.5 | 6.67 | 4.17 | no |
| P8 | Party's Eyes | 6.0 | 7.33 | 4.17 | 8.67 | 4.83 | no: loses the party |
| P2wd | Over the Shoulder, wide | 5.92 | 5.58 | 6.0 | 5.5 | 5.5 | no |
| P13 | Proscenium | 5.83 | 5.5 | 5.33 | 5.83 | 5.17 | no |
| P5 | Side Stage | 5.83 | 6.67 | 5.17 | 6.25 | 4.0 | no |
| P12 | Split-Diopter | 5.58 | 4.67 | 2.83 | 5.67 | 7.25 | no as a screen; maybe an Overdrive cut-in |
| P5m | Side Stage, mirrored | 5.42 | 5.42 | 5.17 | 6.75 | 3.92 | no |
| P6 | Diorama | 5.33 | 5.33 | 4.33 | 4.75 | 3.58 | no |
| P9 | Tabletop (FFX) | 1.67 | 6.0 | 1.0 | 2.17 | 2.5 | no |

Per chapter, the best still is P22 in FFX (8.17) and P2h in FFX-2 (8.0). `P02w` (over the shoulder with
today's paintings) is an explanation, not an option, and was not judged. `P16` is a storyboard of the M4
beats. P20 (canon reconstruction) is on hold: no text source describes the input framing.

## Clips (mean of 3 judges; "comfort" = would this feel good every turn)

| Clip | What | Eye candy | Readable | Comfort |
|---|---|---|---|---|
| M4 FFX-2 / FFX | per-action camera: over the shoulder → side hit → reverse on the enemy turn → looking up for the big attack → low hero victory | 8.83 / 8.5 | 6.17 / 6.67 | 7.5 / 7.5 |
| M3 FFX / FFX-2 | hand-off: a cut behind whoever acts next | 8.17 / 8.0 | 6.5 / 6.0 | 6.5 / 5.67 |
| M1 FFX / FFX-2 | camera per command, today's paintings | 7.67 / 7.0 | 6.0 / 5.67 | 5.83 / 5.5 |
| M2 cut FFX / FFX-2 | camera per command, true over-the-shoulder, hard cut | 7.17 / 6.83 | 7.0 / 6.17 | 6.33 / 5.67 |
| M6 FFX | M2's cuts inside film bands | 7.0 | 7.5 | 6.17 |
| M0 FFX / FFX-2 | today's still camera, same key presses | 5.83 / 5.33 | 8.17 / 7.83 | 7.33 / 7.33 |
| M5 FFX-2 | 60° orbit round Bahamut | 6.17 | 4.33 | 4.0 |
| M2 whip FFX / FFX-2 | camera per command, whip pan | 5.67 / 5.17 | 4.17 / 3.33 | 3.17 / 2.33 |

Also filmed: M0 and M1 on a 390x844 phone (Chapter I). FFX-2 clips run on the shipped Wait setting;
`motion/motion.json` says what changes under Active.

## New art made for this round (candidates, not installed)

In `art/` (sheets, `METHOD.md`, `READY.json`); files in `D:/pyrefly-mock-persp/public/mock-art/`; every
render in `D:/Tools/pyrefly-art-backup/candidates/2026-09-27-perspectives/`. 128 renders, 31 GPU minutes.

- Rear three-quarter paintings: Tidus, Yuna, Kimahri (FFX); White Mage Yuna, Dark Knight Rikku, Warrior
  Paine (FFX-2); high-resolution Tidus and White Mage Yuna. Method: OpenPose rear skeleton plus the
  IP-Adapter identity reference; nothing mirrored. Weak points per painting in `art/METHOD.md` (Tidus's
  red sleeve is on the wrong arm; Yuna holds her staff upright).
- The far side of each arena (Gagazet, Bevelle Underground), Seymour Flux and Bahamut from behind, a gold
  proscenium arch (crimson alternate), and two floors painted from above.

## Found along the way (not fixed here)

- The enemy's action banner stays up through the last blow and about 1 s of the victory poses (unmodified
  build, Chapter I seed 42; `motion/evidence/`). Offered as a separate task.
- The shipped `ffx2-bahamut/idle.png` has white background trapped between wings and body. Offered as a
  separate task.
- In Chapter I the enemy panel covers the turn-order tiles when open; on the phone, today's slide-picker
  jumps the canvas on every aim (M0 phone clip).

## Limits

- The judges are AI personas scoring images and strips, a structured proxy for players, not players.
- Stand-ins are tagged on every sheet: mirrored paintings (P0m, P5m), band and card HUDs (P8, P11, P21),
  composite panels (P14). The paintings were turned to face the lens for the side and reverse shots,
  which the engine cannot do yet.
- Clips in the repo are 1280x720 web encodes; the 1600x900 masters are in
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-27-perspectives/motion-masters/`.
- The mock worktree `D:/pyrefly-mock-persp` (detached at d74b53f7, junctions `node_modules` and
  `public/art`, listed in `D:/Tools/disk-cleanup/keep.txt`) stays until Bailey picks. Unlink both
  junctions before anyone removes it.

## Questions for Bailey

1. Which package, or which mix (while choosing / on action / frame / phone)?
2. If a proscenium or any gold frame survives: tint it pink in FFX-2 chapters, as the HUD accent is?
3. May we check FFX's real command-input framing in your Steam copy (takes over the screen ~10 min)?
