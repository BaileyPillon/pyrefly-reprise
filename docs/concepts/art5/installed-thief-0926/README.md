# The three installed Rikku Thief poses (D-199, 2026-09-26)

**Game case: FFX-2 only.** The Thief dressphere; Rikku wears it at the start of Chapter VI
(Chateau Leblanc).

**Bailey, 2026-09-26 ~11:30 EDT, verbatim:** "I’ll take all your recommendations", answering the
driver's question "Rikku Thief: install item, hurt and victory? Yes, or no." after the sheet
`../round2/sheet3-rikku-thief.jpg` was sent to him. A pick approves only the pose as shown.

## What was installed

| Slot | Candidate (byte for byte) | Judge (`../round2/judge2.json`, `thiefBodyGate`) | Scale |
|---|---|---|---|
| item | round 1 cand-3, `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu5/rikku-thief/item/cand-3.png` | PASS 7.38 | 1.25 |
| hurt | round 2 try c cand-11, `.../2026-09-25-day1/pose-round2/rikku-thief/hurt/cand-11.png` | PASS 7.06 (narrow) | 1.15 |
| victory | round 1 cand-3, `.../2026-09-25-gpu5/rikku-thief/victory/cand-3.png` | PASS 7.44 | 1.21 |

- **Sidecars** have the same shape as the D-194 install (`../installed-0926/`), with
  `decision: "D-199"` and a `scaleNote` that starts "Body height 2026-09-26".
- **Nothing was replaced:** all three slots were empty. `public/art/manifest.json` was
  regenerated; `rikku-thief` now lists hurt, idle, item, ko and victory.
- **Backups:** `D:/Tools/pyrefly-art-backup/approved/2026-09-26-thief/` (`installed/`, and
  `replaced/`, which holds only a note saying nothing was replaced).
- **Lock:** `docs/target/approved-hashes.json`, set `bailey:2026-09-26-thief`.
  `verify-approved.mjs`: 255 ok, 0 mismatched, 0 missing.
- **Not installed:** Thief attack and cast. They have no pick after three tries (rule 15), so
  they stay on the standing painting.

## The scales (`body-measure.json`, `body-scale.jpg`, `hurt-unfolded.jpg`)

Bailey's D-195 answer to JUDGE.md Question 1 sets the gate for the Thief: **body height, not
head match**. The shipped Thief idle draws her head large, so a head match would shrink the
whole figure. The engine rule is pose pixels × scale = idle pixels, so:

**scale = idle body / pose body.**

The measurement:

- **Eye line.** The midpoint of the two irises, each found by colour (the 09-25 repair's iris
  search). Where the far eye has no clean iris (item, victory), it was read on a 5x crop.
- **Soles.** The planted foot's alpha bottom.
- **Standing poses** (item, victory). Eye line to soles is compared with the idle's 887.4 px.
- **The bent hurt.** Measured unfolded, eye to buckle to knee to sole, against the idle's
  unfolded 892.9 px.

| Pose | Body (px) | Idle (px) | Measured | Judge | Installed | Head at scale (gate 0.45 to 0.85) |
|---|---|---|---|---|---|---|
| item | 711.6 | 887.4 | 1.247 | 1.239 | 1.25 | 0.61 |
| hurt | 773.8 (unfolded) | 892.9 | 1.154 | 1.183 | 1.15 | 0.55 |
| victory | 731.0 | 887.4 | 1.214 | 1.213 | 1.21 | 0.55 |

**Why hurt differs from the judge.** The judge read the hurt eye point at (225, 115). That is
about 20 px right of the iris midpoint, (204.9, 113.5), and it shortens the first segment.

`body-scale.jpg` draws each pose at its installed scale beside the idle. The soles and the idle
eye line are aligned. The disclosed D-195 trade-off shows here: at the same body height, her
head is about 0.55 to 0.6 of the idle's.

**Confidence.** About 3 percent for the standing poses. About 5 percent for the bent hurt,
because its knee point is read by eye.

## In game (`docs/screenshots/thief-0926/`)

**The build.** A production build (`vite build` into a scratch folder), served with
`vite preview` on port 5900.

**The run.** Headless, gpu mode. Real keys from the title through chapter select and party
prep into Chapter VI, then real-key commands in battle: Item (Potion) for the item pose;
Attack as filler until an enemy hit brings the hurt pose. The script is scratch,
`D:/Tools/pyrefly-scratch/thief-install-0926/run.mjs`, a copy of the D-194 verifier.

**`contact-1600x900.jpg`.** The target (the picks at their body scale beside the idle) is shown
above the build. The build row has the idle and the three poses at 1600x900, each in its own
moment.

**`contact-390x844.jpg`.** All three poses on the phone.

**Checks on every capture:**
- The painting's URL is the installed file.
- It is never a placeholder.
- The in-game units per pixel over the idle's equals the sidecar scale: 1.25, 1.15, 1.21.
  Converted to world units, her body height is:

  | Pose | Body height (world units) |
  |---|---|
  | idle (standing) | 1.246 |
  | item | 1.248 |
  | victory | 1.241 |
  | idle (unfolded) | 1.253 |
  | hurt (unfolded) | 1.249 |

  This is the same height to within 0.5 percent.
- 0 console errors and 0 HTTP 4xx in any run.

**The idle frame.** It was taken at the same stage position as the item pose, (-1.3, 0, 0.1).
It falls on her own turn, and the camera frames wider then, so she reads smaller on screen in
that crop. The units-per-pixel check above is the size measure.

**Labelled debug step, the only one.** Enemy HP was set to 1 for the victory (the clear of the
first wave). No pose was staged with `setPose`; no party HP top-up was needed.
