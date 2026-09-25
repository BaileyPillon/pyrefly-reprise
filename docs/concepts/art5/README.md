# FFX-2 party battle-pose candidates, art5 (GPU batch 5), 2026-09-25

**FFX-2 only.** These are paintings of the FFX-2 girls' dresspheres (Yuna, Rikku, Paine), so they
apply only where those dresspheres are used (Chapters IV, V, VI, XI and the prep screen's lists).
**Everything here is a CANDIDATE. Nothing was installed in `public/art/`, and
`docs/target/approved-hashes.json` was not touched.** Nothing is approved until Bailey names it
(rule 9). `node D:/Tools/pyrefly-lora/tools/verify-approved.mjs`: 185 ok, 0 mismatched, 0 missing,
both before and after.

The first pass (commit 80d0d3ab) audited the gaps and rendered nothing, because of two blockers.
This pass fixed both and ran the renders:

- **(a) Identity is read off each installed idle picture** (`public/art/characters/<id>/idle.png`),
  never off its stored `idle.json` prompt. The words are in [girls.json](girls.json). For example,
  `rikku-dark-knight` is described as bare-headed with a blonde braided ponytail, navy plate armour,
  chainmail and a gold-engraved dark-blue greatsword. Her sidecar's "horned helmet, black armour"
  was not used.
- **(b) A `dual` skeleton kind** was added to [skeletons.py](skeletons.py). It is a copy of the
  Chapter XIII file with `sword` and `flask` unchanged. In the idles, the Gunners hold one pistol
  in each hand, pointing down, and the Thief holds a dagger in each hand in reverse grip at the
  hips. So in every dual pose both hands keep a weapon: `attack` drives both arms forward (both
  pistols aimed, or both daggers thrust), `cast` and `victory` raise the near hand's weapon,
  `item` holds a bottle out, and `hurt` flings both arms down. Two pose-tag sets use these
  skeletons, `guns` and `daggers` ([poses.json](poses.json)).

## Method (Chapter XIII's, unchanged apart from the worklist)

The method is `docs/concepts/chapters/trema/poses/METHOD.md`. It uses Animagine XL 4.0 Opt with
the xinsir OpenPose ControlNet (0.65 / 0.75 / 0.85 / 0.75). The skeletons face right and are drawn
at 0.8 of the idle's size (0.85 for ko). IP-Adapter is forced on at 0.5, ease in, 0.2 to 0.8, K+V,
with two inputs: the idle square-padded on white ([make-refs.py](make-refs.py)) and a head crop.
Pose tags describe the body only, with no effect words. The cutout guard runs on every frame, and
an all-black frame stops the queue.

The cast/item/hurt second-try variant was the one that passed for Paine in Chapter XIII, so the
sword kind uses it from the start. Three pose-tag sets are new, and each reuses an existing
skeleton:

- `staff` (the mages) uses the sword skeletons.
- `mic` (Songstress) uses the flask skeletons.
- `claws` (Berserker) uses the flask skeletons.

The queue was one long background process, [render.mjs](render.mjs) `queue`. It worked through
[worklist.json](worklist.json) in order and never had more than 3 prompts pending. ComfyUI was
never restarted.

- **Pilots, looked at 1:1 beside the idle before the dual kind ran:** `yuna-gunner/item` and
  `rikku-thief/attack`, 4 frames each. The pose held (a two-weapon lunge, a bottle held out) and
  the identity held. The Thief's legs came out orange-red, so `(bare legs:1.2)` and a
  leggings/tights negative were added for her other slots.
- **Second tries (rule 15, from my own look; the guard never rejected all four in any slot):**
  - `rikku-dark-knight/ko` and `victory`: her default outfit came back in place of the armour.
    The second try weighted the armour and negated bikini, midriff and bare legs. ko then passed.
    **victory failed twice and is stopped.** The slot stays empty and the engine falls back to
    the idle.
  - `rikku-thief/hurt` and `rikku-berserker/hurt`: "off balance" came out as a flip with the legs
    in the air. The second try said "feet on ground" and negated jumping and flips, and both
    passed. The same tag change went into `guns`, `mic` and `claws` hurt before they ran.
- **Totals:** 316 renders (284 passed the guard, 32 rejected), no black frame, no ComfyUI error.
  Every frame has a `cand-N.json` sidecar with its seed and every setting.

Files are in `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu5/<id>/<slot>/`: `cand-N.png`
(the cutout), `.raw.png` and `.json`. The refs are in `refs/` there and the log is `queue.log`.

## Per slot: which candidates passed the guard, and my pick

**The "pick" column is my own quick look at sheet size. It is not a judge's verdict and it is not
Bailey's.** One sheet per dressphere shows the idle beside every candidate at one pixel scale, with
the guard's result and my note under each frame, plus a strip at game size: `sheet-<id>.jpg` in
this folder. The looks are recorded in [verdicts.json](verdicts.json). Order: live Chapters IV, V
and VI first (Chapter XI reuses Chapter V's line-up), then the rest of the roster.

| Dressphere | Slot | Frames | Guard ok | Pick | Look |
|---|---|---|---|---|---|
| rikku-dark-knight | ko | 8 | 1, 2, 3, 4, 5, 6, 7, 8 | cand-7 | PASS on the second try (cand 5 to 8, armour weighted): on her side, head right, navy armour; round 1 lost the armour |
| rikku-dark-knight | victory | 8 | 2, 3, 4, 6, 7, 8 | none | FAIL twice: her default outfit (bikini, bare midriff) replaces the armour both times; stopped (rule 15), slot left empty |
| paine-warrior | attack | 4 | 1, 2, 3, 4 | cand-2 | PASS: lunge toward screen-right, red sword; the boots come out red, the idle's are black |
| paine-warrior | cast | 4 | 1, 2, 3, 4 | cand-4 | PASS: arm up, sword held low |
| paine-warrior | item | 4 | 1, 2, 3, 4 | cand-3 | PASS: bottle held out, one sword at her side |
| paine-warrior | hurt | 4 | 1, 2, 3, 4 | cand-4 | PASS, weak: leaning back, wincing |
| paine-warrior | ko | 4 | 1, 3, 4 | cand-3 | PASS: on her side, eyes shut |
| paine-warrior | victory | 4 | 1, 2, 3, 4 | cand-3 | PASS: sword over the shoulder, hand on hip |
| yuna-gunner | item | 4 | 1, 2, 3, 4 | cand-4 | PASS, weak: bottle held out, short skirt; the second pistol is missing in every frame |
| rikku-thief | attack | 4 | 3, 4 | cand-3 | PASS: lunge, a dagger in each hand; legs come out orange-red (the pilot ran before the leg words) |
| rikku-thief | cast | 4 | 1, 2, 3, 4 | cand-3 | PASS: one dagger raised, the other low |
| rikku-thief | item | 4 | 1, 2, 3, 4 | cand-3 | PASS: bottle held out |
| rikku-thief | hurt | 8 | 2, 4, 5, 6, 7, 8 | cand-6 | PASS on the second try (feet on ground, flips negated); round 1 read "off balance" as a flip |
| rikku-thief | ko | 4 | 1, 2, 3, 4 | cand-3 | PASS: on her side, eyes shut |
| rikku-thief | victory | 4 | 1, 2, 3, 4 | cand-1 | PASS: dagger raised high |
| paine-black-mage | attack | 4 | 2, 4 | cand-2 | PASS: staff thrust forward; the staffs are more ornate than the idle's |
| paine-black-mage | cast | 4 | 1, 2, 3, 4 | cand-1 | PASS: arm and staff up |
| paine-black-mage | item | 4 | 2, 3, 4 | cand-4 | PASS: bottle and staff |
| paine-black-mage | hurt | 4 | 1, 3, 4 | cand-1 | PASS, weak: wincing, little lean |
| paine-black-mage | ko | 4 | 1, 2, 3, 4 | cand-4 | PASS: on her side, hat on |
| paine-black-mage | victory | 4 | 3, 4 | cand-4 | PASS: hand on hip, staff |
| paine-gunner | attack | 4 | 1, 3, 4 | cand-1 | PASS: both pistols aimed toward screen-right |
| paine-gunner | cast | 4 | 1, 2, 3, 4 | cand-2 | PASS: pistol raised |
| paine-gunner | item | 4 | 1, 2, 3, 4 | cand-2 | PASS: bottle held out, pistol at the hip |
| paine-gunner | hurt | 4 | 1, 2, 3, 4 | cand-2 | PASS, weak: she doubles over forward more than she reels back |
| paine-gunner | ko | 4 | 1, 2, 3, 4 | cand-2 | PASS: on her side, eyes shut |
| paine-gunner | victory | 4 | 1, 2, 3, 4 | cand-3 | PASS: pistol raised |
| paine-samurai | attack | 4 | 1, 2, 4 | cand-4 | PASS: katana drawn, shoulder armour, hakama |
| paine-samurai | cast | 4 | 1, 2, 4 | cand-2 | PASS: arm up, katana low |
| paine-samurai | item | 4 | 1, 2, 3, 4 | cand-4 | PASS: bottle held out |
| paine-samurai | hurt | 4 | 1, 2, 3, 4 | cand-4 | PASS, weak: little lean |
| paine-samurai | ko | 4 | 1, 2, 3, 4 | cand-2 | PASS: on her side, katana beside her |
| paine-samurai | victory | 4 | 1, 2, 3, 4 | cand-4 | PASS: katana on the shoulder |
| paine-white-mage | attack | 4 | 1, 2, 3, 4 | cand-2 | PASS: hood, white robe with the zigzag hem, staff swung |
| paine-white-mage | cast | 4 | 1, 2, 3, 4 | cand-4 | PASS: staff raised |
| paine-white-mage | item | 4 | 1, 2, 3, 4 | cand-1 | PASS: bottle and staff |
| paine-white-mage | hurt | 4 | 3, 4 | cand-3 | PASS, weak: head back, staff held |
| paine-white-mage | ko | 4 | 1, 2, 3, 4 | cand-4 | PASS: on her side, hood on |
| paine-white-mage | victory | 4 | 2, 3, 4 | cand-3 | PASS: staff on the shoulder, hand on hip |
| rikku-berserker | attack | 4 | 1, 2, 3, 4 | cand-3 | PASS: claw lunge, tail, bandana |
| rikku-berserker | cast | 4 | 1, 2, 3, 4 | cand-4 | PASS: fist up, hand on hip |
| rikku-berserker | item | 4 | 1, 2, 3, 4 | cand-3 | PASS: bottle held out |
| rikku-berserker | hurt | 8 | 2, 3, 4, 5, 6, 7, 8 | cand-7 | PASS on the second try (feet on ground, flips negated); round 1 read the hurt as a flip |
| rikku-berserker | ko | 4 | 1, 2, 3, 4 | cand-2 | PASS: on her side, claws, tail |
| rikku-berserker | victory | 4 | 1, 2, 3, 4 | cand-2 | PASS: both fists up |
| rikku-black-mage | attack | 4 | 2, 4 | cand-4 | PASS: staff thrust, witch hat, leotard |
| rikku-black-mage | cast | 4 | 1, 2, 3, 4 | cand-4 | PASS: arm up, staff held |
| rikku-black-mage | item | 4 | 2, 3, 4 | cand-4 | PASS: bottle and staff |
| rikku-black-mage | hurt | 4 | 2, 4 | cand-2 | PASS, weak: little lean |
| rikku-black-mage | ko | 4 | 1, 2, 3, 4 | cand-3 | PASS: on her side, hat by her head |
| rikku-black-mage | victory | 4 | 1, 2, 3, 4 | cand-3 | PASS: staff held, hand on hip |
| rikku-gunner | attack | 4 | 1, 2, 3, 4 | cand-2 | PASS: both pistols aimed toward screen-right |
| rikku-gunner | cast | 4 | 1, 2, 3, 4 | cand-1 | PASS, weak: the raised hand often holds no pistol |
| rikku-gunner | item | 4 | 1, 2, 3, 4 | cand-2 | PASS: bottle held out |
| rikku-gunner | hurt | 4 | 1, 2, 3, 4 | cand-4 | PASS, weak: bent over more than reeling back |
| rikku-gunner | ko | 4 | 1, 2, 3, 4 | cand-3 | PASS: on her side, pistol by her hand |
| rikku-gunner | victory | 4 | 1, 2, 3, 4 | cand-3 | PASS, weak: arm up, pistol small or missing |
| rikku-white-mage | attack | 4 | 1, 4 | cand-1 | PASS: staff swung, bandana, white coat tails |
| rikku-white-mage | cast | 4 | 1, 3, 4 | cand-4 | PASS: arm up, staff held |
| rikku-white-mage | item | 4 | 2, 3, 4 | cand-3 | PASS: bottle held out |
| rikku-white-mage | hurt | 4 | 2, 3, 4 | cand-4 | PASS, weak: head back, staff up |
| rikku-white-mage | ko | 4 | 1, 2, 3, 4 | cand-3 | PASS: on her side, eyes shut |
| rikku-white-mage | victory | 4 | 2, 3, 4 | cand-3 | PASS: staff held, arms crossed |
| yuna-black-mage | item | 4 | 1, 2, 3, 4 | cand-4 | PASS: bottle held out, staff, blue witch hat with the pink flower |
| yuna-songstress | cast | 4 | 1, 2, 3, 4 | cand-4 | PASS: microphone raised, hand on hip |
| yuna-songstress | item | 4 | 1, 2, 3, 4 | cand-2 | PASS: bottle held up |
| yuna-songstress | hurt | 4 | 1, 2, 3, 4 | cand-2 | PASS: head back, one eye shut |
| yuna-songstress | ko | 4 | 1, 2, 3, 4 | cand-1 | PASS: on her side, eyes shut |
| yuna-songstress | victory | 4 | 1, 2, 3 | cand-1 | PASS: both arms up, microphone |
| yuna-warrior | attack | 4 | 1, 2, 3, 4 | cand-4 | PASS: blue longsword swung toward screen-right; the red hood comes out worn UP in most frames (the idle wears it down) |
| yuna-warrior | cast | 4 | 1, 2, 3, 4 | cand-3 | PASS: arm up, sword low |
| yuna-warrior | item | 4 | 1, 2, 3, 4 | cand-2 | PASS: bottle and sword |
| yuna-warrior | hurt | 4 | 1, 2, 3, 4 | cand-2 | PASS: head back, sword low |
| yuna-warrior | ko | 4 | 1, 2, 3, 4 | cand-2 | PASS: on her side, eyes shut |
| yuna-warrior | victory | 4 | 1, 2, 3, 4 | cand-2 | PASS: sword on the shoulder |

## What looked wrong (for whoever judges next)

- **Scale.** Standing candidates come out at about 0.75 of the idle's pixel height. The 0.8
  skeleton shrink that Chapter XIII needed for its Dark Knights is too much for these idles.
  If any of these are installed, they need rescaling to the idle's height.
- **Frames the guard passes but a look fails.** A second figure in the frame (paine-black-mage
  hurt cand-4, paine-samurai hurt cand-2, paine-gunner hurt cand-3), painted scenery
  (paine-white-mage item cand-2), a dragon shape (yuna-warrior cast cand-1), and scarves or tails
  that grow to the edge of the frame. None of these are picks.
- **Weapons.** In the Gunner cast, victory and item frames the second pistol is often missing,
  and the mages' staffs come out more ornate than the idles' staffs.
- **Details off the idle.** Hurt poses read weakly (a small lean). Rikku's hair is bigger than in
  her idles. Paine Warrior's boots come out red (the idle's are black). Yuna Warrior's hood is up
  (the idle's is down; the identity word "red hood" did it).
- **Stopped:** rikku-dark-knight victory (rule 15). The engine keeps showing her idle for victory.

## Not done

- ready and defend (skipped per the brief, as in Chapter XIII).
- Already painted slots were left alone. The Chapter XIII line-up (yuna-dark-knight,
  paine-dark-knight, rikku-alchemist) was done in batch 4.
- `yuna-white-mage` has all six slots painted.

## Empty-slot audit (from the first pass, re-checked this pass)

The slots below had no `<slot>.png` and no `<slot>.N.png` before this batch.

- **Live chapters** (Chapter IV = `bevelleBuild`, V = `farplaneBuild`, VI = `chateauBuild`,
  `src/data/encounters.ts`; XI reuses `farplaneBuild`):
  - rikku-dark-knight: ko, victory
  - paine-warrior: all 6
  - yuna-gunner: item
  - rikku-thief: all 6
- **The rest of the roster:**
  - paine-black-mage, paine-gunner, paine-samurai, paine-white-mage: all 6 each
  - rikku-berserker, rikku-black-mage, rikku-gunner, rikku-white-mage: all 6 each
  - yuna-black-mage: item
  - yuna-songstress: cast, item, hurt, ko, victory
  - yuna-warrior: all 6
