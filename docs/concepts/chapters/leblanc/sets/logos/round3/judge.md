# Logos round 3: independent judge pass (2026-09-22)

FFX-2 only (Chapter 6, Chateau Leblanc art; no shared tool or game file changed,
AGENTS.md hard rule 14). A different agent from the one that painted and installed
the round (`round3.md`, commit `a490609`) ran this pass. **No new renders were made,
and nothing was installed or approved.** `docs/target/approved-hashes.json` lists 115
files. All 115 hashed the same before and after this pass, and Logos has no entry there.

**Sheet built for this pass:** `judge-sheet.jpg` (`python judge-sheet.py`). There is
one row per installed state: the whole cutout scaled to 520 px tall, then **native 1:1
crops** (no resampling) of every region scored below. I also read every installed PNG
whole at native size, plus 2x nearest-neighbour crops of the head, hands, emblem and
feet. No score comes from a thumbnail or from the painter's `sheet.jpg`.

## Criteria

For attack, cast, hurt and ko the anchor is `public/art/characters/logos/idle.png`.
For idle it is Bailey's pick, `docs/concepts/chapters/leblanc/renders/logos-c.png`, with
the plume and crest removed as he asked, together with research
`ffx2-leblanc-syndicate.md` section 10.1:

- tall and slim
- a black-and-silver helmet with a chin protector, tied at the back with a purple strip
- a blue robe and coat with the Syndicate logo on both shoulders, and kimono sleeves
- a purple sash and ankle wraps
- two revolvers
- poses: a side-on duellist stance with both revolvers low; Double Shot is two aimed
  shots; Russian Roulette is one deliberate shot after a spin

Pilot 2's criteria, translated to Logos, each scored 0 to 10:

- hair (black, short)
- face
- skin tone
- **helmet**: one design in every state. This was the named failure of the two earlier
  passes, so it gets its own score.
- outfit colours and pattern (robe, sash, hakama, wraps, sandals)
- marks (shoulder emblem, strap, accessories)
- weapon (two revolvers, one in each hand, each with a single barrel)
- style and framing (line and shading; nothing cut off by the frame)
- whether the pose reads as its state

**The score is the worst criterion. Pass is 7.**

What idle shows at 1:1, the target for the other four states:

- a smooth silver dome with ribbed sides and a short front visor that shades the eyes,
  held by a thin grey jaw strap
- short black hair
- a saturated blue robe that fades to violet at the hem, over a navy under-robe
- a purple sash
- a **slate blue-grey hakama**
- a black shoulder strap with a brass ring
- a **white radial disc** emblem on the shoulder
- grey-white ankle wraps with black bands, and black slide sandals
- a blued revolver in the far hand (black fingerless glove) and a silver revolver in
  the near hand

## Scores

| State | Hair | Face | Skin | Helmet | Outfit | Marks | Weapon | Style / framing | Pose as state | **Score** |
|---|---|---|---|---|---|---|---|---|---|---|
| idle | 8 | 7 | **5** | 6 | 7 | 6 | **5** | 8 | 8 | **5** |
| attack | 8 | 8 | 7 | 5 | 6 | **4** | 8 | **4** | 9 | **4** |
| cast | 7 | 7 | 6 | **4** | 5 | 5 | 8 | 8 | 8 | **4** |
| hurt | 7 | 5 | 7 | 7 | 6 | **4** | 5 | 8 | 7 | **4** |
| ko | 8 | 8 | 7 | 5 | 5 | 4 | **3** | 7 | 9 | **3** |

**No state reaches 7, so the set fails on all 5 states.** The painter scored them 6, 6,
5, 6 and 4. This pass scores each state one or two points lower, the same direction as
pilot 2's judge.

## Per-state findings (1:1)

**idle (5; skin and weapon).** This is clearly better than the two earlier passes. The
crest is gone, and the repaint left a smooth dome with no visible seam at 1:1. The pose
is the stance research describes: side-on, both revolvers low.

What fails at 1:1:
- The skin tones do not belong to one person. The far hand and both shins are tan; the
  near hand and near foot are pale. The near leg is pale below the wrap and tan above it.
- The near revolver hangs from one finger through the trigger guard, while the fist
  closes on an unexplained grey stub.
- The two revolvers have different finishes (blued and silver).
- Helmet 6: there is no chin protector beyond a thin strap, and no purple tie strip
  (research 10.1). The tie strip may be hidden from this side; the chin protector
  should show.

**attack (4; marks and framing).** This is the best pose in the set: a lunge with both
revolvers aimed forward, a serious face, and the idle's robe and sash. It reads as
Double Shot at a glance.

What fails:
- Where idle shows the white emblem, the near shoulder has a black claw-edged guard
  (a pauldron in all but name). No emblem is visible anywhere.
- An invented charm chain and a gold shape hang below the sash.
- **The back of the coat is cut off by the frame.** The cutout's last column is opaque
  for 376 rows (y 542 to 917), so in battle the coat tail ends in a straight vertical
  edge.
- The helmet is a fully banded bucket dome: the same family as idle's, but a different
  surface.
- The hakama is light grey where idle's is slate.

**cast (4; helmet).** The Russian Roulette moment reads: one revolver raised beside the
face with the barrel up, a smirk, and the other revolver held low.

What fails:
- The helmet is a different design: a slotted visor that juts forward like a brim.
  This repeats the failure of headgear changing between states.
- The shoes are closed strap shoes, not idle's slide sandals.
- The emblem is a grey spiral with a pointed pendant, not the white radial disc.
- The skin is chalk white, where idle's is warmer.
- The hakama is light grey.

**hurt (4; marks).** The head is thrown back, the teeth are clenched and the body leans
away from the party: it reads as a hit. The helmet is the closest to idle's of the four
(a plain dome, no ribs).

What fails:
- The emblem has moved from the shoulder to the chest strap and turned gold.
- The strap and an armband are purple, where idle's strap is black.
- The far revolver sticks out of the robe at the hip with no hand on it.
- A black beak-like spike juts from the chin: a chin guard drawn detached from the
  helmet.
- The hakama is light grey.

**ko (3; weapon).** The head points toward the party, the eyes are shut, both revolvers
are on the floor, and the helmet is on but pushed back: it reads as KO.

What fails:
- The second revolver has two barrels and a hooked grip.
- The strap is brown leather (idle's is black).
- The emblem is a dark grey wheel (idle's is a white disc).
- The ankle wraps are black with white bands (idle's are white with black bands).
- The helmet is a cage with a grille visor, not idle's dome.

The edit recorded in the sidecar (a white shard removed from the floor) is clean at 1:1.

## Scale overrides

Measured at 1:1 on the installed PNGs, idle's head is about 145 px from helmet top to
chin and attack's is about 210 to 230 px, so `scale: 0.62` on attack is in the right
range. Ko's `scale: 0.7` is consistent with its larger helmet. Neither has been seen in
a running battle; if any of these candidates survives, that check is still owed.

## What this means (hard rule 15 and pilot 2's rule)

This is the **third** failed pass on Logos (`920dac8`, `2e5672d`, `a490609`), and it came
after the written method check (`docs/plans/leblanc-art-method-check.md` section 6).
Pilot 2's rule applies: **no fourth blind pass**. Show Bailey the best of each state
next to the anchor (this sheet, or the painter's `sheet.jpg`) and let him say which
defects matter at battle size.

What round 3 did fix, checked at 1:1:
- no plume, crest or brim in any state
- two revolvers in every state
- no helmet swapped for a hat
- the robe and sash hold across the set

Most of what is left is **local**: small defects that a fresh whole-figure render keeps
re-rolling. So if Bailey wants another attempt, it should be local fixes, not another
text pass:

- **Colour-only defects:** the ko strap (brown, should be black), the ko wraps (colours
  reversed), the hurt emblem (gold, should be white) and strap (purple, should be black),
  and idle's tan hand and shins (should match the pale skin). Fix these by recolouring
  the pixels deterministically (hue and value inside a hand-drawn mask), not with a
  diffusion repaint: the round's own repaint of the ko strap at 0.5 left it brown.
- **Shape defects:** the cast helmet, the ko helmet and double barrel, the attack
  shoulder guard, the hurt chin spike, and idle's hanging revolver. Fix these with a
  masked repaint at higher denoise, using the idle's own head or gun crop as the
  reference, one box at a time, judged at 1:1.
- **Attack framing:** re-render or outpaint on a wider canvas so the coat tail is whole.
  A repaint inside the frame cannot fix a straight cut at the edge.
- **Hard rule 6, still open:** the shape of the Syndicate logo is unsourced (every state
  draws a different disc). The purple tie strip is sourced, but no state shows it.

`public/art/portraits/logos.png` was not judged here; it predates round 3.
