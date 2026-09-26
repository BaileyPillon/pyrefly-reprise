# Pose round 2: method check (FFX-2 only, 2026-09-26)

AGENTS.md rule 15: two failed attempts on the same failure mean a written method check before a
third try. Two problems failed twice in round 2 (README "Open method questions"). This is the
paper preflight for both, and the pilot result for A. Agent look only; nothing here is Bailey's
pick, nothing was installed to `public/art`, and `approved-hashes.json` /
`judge-locked-hashes.json` were not touched (`verify-approved.mjs`: 0 mismatched, 0 missing).

## A. Paine Warrior: the sword floats, doubles, stands unheld or sits in the wrong hand

### Why more prompt tweaks cannot fix it

I read the recipes (`cand-N.json` for all 36 round 2 Paine Warrior renders) and the skeletons.

1. **Nothing in the recipe places the sword.** The OpenPose skeleton
   (`skeletons/paine-warrior/*.png`, from `skeletons2.py`) draws the 18 body keypoints only: no
   sword, and no hand keypoints either. ControlNet pins the wrist; where the blade goes, how long it
   is and whether a hand closes on it is left entirely to the text. So the sword is the one object
   in the picture the model has to invent from words alone, every time.
2. **The IP-Adapter reference carries a different sword pose.** The reference square is the idle,
   whose sword is a tall red vertical line from the floor to her chest, standing in front of her
   with the hand resting on the pommel. IP-Adapter (0.5, 0.2 to 0.8) pushes that silhouette into
   every render. When the pose puts the hand somewhere else (cast: arm hanging; hurt: arm flung
   back; ko: lying down), the model paints the idle's vertical stripe where the idle had it,
   and paints a second one near the hand. That is exactly the "floats beside her", "stands unheld"
   and "doubles" in the looks: cast c1, c4 and c8 show the idle's vertical floor-to-chest sword
   standing beside her, not in her hand.
3. **The prompt fights itself.** The same prompt names "sword" 3 to 6 times in the positive and
   14 to 19 times in the negative (floating sword, extra sword, multiple swords, raised sword,
   oversized sword, sword behind her...). The negatives were each added to kill one bad frame, but
   they all carry the token "sword", so the negative conditioning pulls against the very object the
   positive asks for. The cast b recipe also asks for "empty hand" and "one hand holding longsword"
   in the same line. Each tweak adds words to both sides and makes this worse.
4. **The sword drives the edge rejects.** 14 of Paine Warrior's 36 round 2 renders were guard
   rejects, nearly all because the blade grew past the canvas (ko: every frame).

A third word tweak attacks none of these. The fix has to take the sword's placement away from
the model.

### Method options

| # | Method | Cost | Risk |
|---|---|---|---|
| 1 | **Composite the idle's own sword.** Render the body with no sword at all (a sword-free copy of the reference square, every sword word in the negative, a clenched fist where the grip goes). Cut the sword out of the approved idle once, then rotate and scale it into the fist. A disc of the body's own hand pixels goes back over the grip so the fingers are in front of it. Optional: a masked img2img pass on the hand disc only. | No new models. Same GPU cost per render as now (~15-18 s); the composite is CPU only. One agent look per candidate to set the grip point and angle. | Flat 2D rotation: no foreshortening (no sword pointing at the camera). The grip can look pasted when the fist is not closed. The sword's shading is the idle's. |
| 2 | **A sword-shaped second ControlNet** (lineart, canny or depth) drawn from the idle's sword silhouette, placed in the hand, stacked on OpenPose. | **Needs a download**: only `xinsir-controlnet-openpose-sdxl-1.0` is installed (checked `/object_info`). Rule 11: ask first. | The model still paints its own sword, only guided; the reference and the "sword" negatives still pull. A second try-and-see loop. |
| 3 | **Inpaint the sword** into a sword-free body: mask a sword-shaped strip from the hand and let the model paint inside it. | 1 body + 1 inpaint per candidate. No inpaint checkpoint is installed, so it is SetLatentNoiseMask on the base model. | The model decides the design again (the idle's ornate winged guard is what it keeps getting wrong). |
| 4 | **Reference crop without the sword** only (the IP-Adapter square with the sword painted out), prompts unchanged. | Free. | Removes cause 2 only; causes 1 and 3 remain, so the sword is still invented freely. Useful as a part of 1, not alone. |

**Picked: 1, which includes 4.** It is the only option that removes all three causes: the model
never draws a sword, so nothing can float or double, and the sword is the approved idle's own
design, so it cannot drift. No download, no new model.

### Pilot (8 GPU renders, 2 slots: cast and attack)

`pilot-warrior.mjs` (next to `render2.mjs`, same model, OpenPose skeletons, IP-Adapter settings and
guard). Candidates are in `D:/Tools/pyrefly-art-backup/candidates/2026-09-26-method/paine-warrior/`
(`<pose>/body-N.*` = the sword-free render, `cand-N-comp.*` = the composite, `cand-N-grip.*` =
after the grip pass, `body-N.json` = the full recipe, grip point and guard). The picture is
`pilot-warrior-sheet.jpg`.

- **GPU jobs: 8.** 3 cast bodies and 3 attack bodies (ControlNet 0.85, seeds 36611-36613 and
  36601-36603), plus 2 masked grip passes (cast 3 and attack 3, denoise 0.5). No black frame.
  ComfyUI was idle throughout (0 pending); it was not restarted.
- **Body renders: 6 of 6 have no sword anywhere and 6 of 6 pass the guard.** Round 2 had 14 of 36
  guard rejects for this girl, nearly all from the blade.
- **Composites: 4 of 4 carry exactly one sword, the idle's own ornate red longsword with the winged
  guard, in the hand that the pose puts it in.** Cast 1 and cast 3: held low in the lowered hand,
  point trailing back to the floor (131 and 128 degrees). Attack 1: a two-handed low thrust
  (53 degrees). Attack 3: a two-handed rising guard toward the enemy (-50 degrees), the clearest
  attack read of the set. All 4 pass the guard. The named fault (floats, doubles, unheld, wrong
  hand) is gone in every frame.
- **The grip pass is mixed.** Cast 3: the hilt now reads wrapped in the fist (a small gain).
  Attack 3: the two fists merged into one smeared blob (a loss). The composite alone already reads
  as held at game size, so the grip pass should be optional, used only where the look finds a gap,
  and at a lower denoise (0.3-0.35).
- **What the method does not fix** (the round 2 identity faults, all still there): heeled thigh
  boots instead of the idle's chunky buckled boots (cast), lower legs grading to red (attack 1 and
  3), a spiky mane instead of the swept crest. Both cast bodies also raise a **fist** instead of an
  open palm because "clenched fist" leaked to the wrong hand; the next cast body prompt should name
  the fist on the lowered hand only.
- **Smaller issues:** attack 1's rear fist sits a little off the grip line (a red strip shows
  between the fists); the blade's tip ends in two points (the red spine and the silver edge are cut
  to different lengths), a one-line fix in the cut-out.

**Verdict (agent look): the method works for the named fault.** It is not yet a judged pass; the
judge would still mark the identity faults above.

### What a full run would cost

Paine Warrior's five slots (attack, cast, item, hurt, ko): 4 bodies per slot = **20 GPU renders
(~6 minutes)**, plus at most 5 optional grip passes. One look per candidate to set the grip point
and angle (about a minute each, no GPU; the grip points drift ±20 px from the skeleton's wrists, so
they are read off the render). ko needs no hand: the sword lies beside her. The composite step is
already written; item and hurt need only their body prompts added to `BODY` in the pilot script.
The same method would suit the other weapon faults of round 2 (Yuna Warrior's unheld sword, the
Rikku mages' split staffs) with each idle's own weapon, but that is a separate decision.

## B. Rikku Thief: the head-scale gate (JUDGE.md Question 1, Bailey's question)

### The numbers

Head size is measured from the eye line to the chin, as a share of the figure's height (top of
the picture to the feet), from `judge/measure.json` and the round 2 candidates:

| picture | eye to chin | figure height | head share |
|---|---|---|---|
| **Thief idle (approved)** | 85 px | 1180 px | **7.2%** |
| Gunner idle | 43 px | 1030 px | 4.2% |
| Alchemist idle | 49 px | 1162 px | 4.2% |
| White Mage idle | 59 px | 1185 px | 5.0% |
| Black Mage idle | 58.5 px | 1158 px | 5.1% |
| Thief victory c2 (round 2, her natural head) | 52 px | 991 px | 5.2% |
| Thief item c8 (round 2 try b, head forced big) | 70 px | 1156 px | 6.1% |

The Thief idle's head is 1.4 to 1.7 times the share of every other Rikku idle. It leans toward the
camera, so its head is foreshortened large. The gate sizes a pose by matching its head to the
idle's head and then asks that the figure stand 0.75 to 1.30 of the idle, so every Thief pose drawn
with Rikku's normal head fails it: she would stand 1.4 to 1.9 times the idle. Try b forced a bigger
head ("big head, from above, foreshortening", head factor 1.45): the gate then passed numerically
on four frames, but the renders went chibi or close-up, two grew a second head, and the Thief look
was lost. Only item c8 passed the judge, narrowly. That was the second failure.

### The answers

1. **Keep the Thief idle and size her poses by body height, not head (re-scale the gate for the
   Thief only).** The poses keep Rikku's normal head, like every other dressphere. The 4 stopped
   slots can be re-judged on the candidates that already scored above the bar (round 1 item 7.44,
   victory 7.38). Cost: when she swaps from the idle to a pose, her head visibly shrinks (to about 0.6-0.7
   of the idle's) at the same height.
2. **Keep the Thief idle and let the poses match its big head** (what try b did). This failed twice:
   chibi bodies, close-ups, second heads. Not recommended.
3. **Re-paint the Thief idle with a normal head.** This removes the size jump for good, but it
   replaces an approved painting, so it needs Bailey's explicit word, and the new idle needs its own
   approval before any pose is fitted to it.

**Recommendation: answer 1 now.** It unblocks the four stopped Thief slots without touching an
approved painting, and Rikku already changes head size between dresspheres (4.2% to 5.1%). If
Bailey finds the jump from idle to pose too visible in a fight, answer 3 is the real fix and needs
Bailey's word. The picture is `question-rikku-thief.jpg` (the Thief idle beside the Gunner and
White Mage idles and the two Thief poses above, all at the same figure height, heads marked).
