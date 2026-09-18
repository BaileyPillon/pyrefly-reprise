# Art round 3 — group "x2-cast" (the three Gullwings, build-equipped dresspheres)

**Contract:** v3 facing (`docs/handoff/art3-contract.md`, `docs/ART-PIPELINE.md` §2a).
**Scope:** every dressphere the two X-2 chapter builds actually equip, plus the
three HUD portraits. States `idle attack cast item hurt ko victory`, facing
`right`.
**Stack:** ComfyUI 0.35.0 @ 127.0.0.1:8188, Animagine XL 4.0 Opt, IP-Adapter
plus / CLIP-ViT-H, rembg `isnet-anime`. Defaults: 28 steps, CFG 6,
euler_ancestral, 832×1216 (1216×832 for `ko`).
**Status:** _in progress — this file is written as the round runs._

---

## 0. What "the dresspheres those builds equip" resolves to

Read from `src/data/ffx2/builds/bevelle.ts` and `.../farplane.ts`
(`spriteKey` / `currentDressphere` per member):

| Build | Yuna | Rikku | Paine |
| --- | --- | --- | --- |
| `bevelle.ts` (Ch. 4 — FFX-2 Bahamut) | `yuna-white-mage` | `rikku-dark-knight` | `paine-warrior` |
| `farplane.ts` (Ch. 5 — Vegnagun → Shuyin) | `yuna-white-mage` | `rikku-dark-knight` | `paine-dark-knight` |

So **four** sprite subjects, not six: Yuna and Rikku keep one dressphere across
both chapters, Paine changes. Every other dressphere in each girl's `owned`
list keeps whatever idle it already had — out of scope by the brief.

Three portraits: `yuna-ffx2`, `rikku-ffx2`, `paine`.

`public/art/characters/rikku-dark-knight/` **did not exist** before this round.
`cast.json` v3 added the subject row (art3-contract §6 says so explicitly) but
nothing had ever been rendered for it, so Rikku was going into two chapters with
no Dark Knight art at all.

---

## 1. Identity tags used, and where they diverge from `cast.json`

`cast.json` is the work order, but the blind judge scores canon and
`research/visual-bible.md` §1 is the canon of record. Where the two disagree the
bible won. This group may not write `cast.json`; the deltas below should be
folded back by whoever owns it.

| Subject | `cast.json` says | Bible §1 says | What was rendered |
| --- | --- | --- | --- |
| `yuna-white-mage` | `white robe, hooded robe, hood, red trim, long sleeves` | §1.14: white robe with **purple** trim, **pink** lining with **yellow circle** designs, hood rimmed pink with **yellow crescent moons**, **yellow flame** pattern on the cuffs, white gloves and boots | `purple trim, pink lining, yellow circle pattern, pink hood trim, yellow crescent moon pattern, yellow flame pattern on cuffs, white gloves, white boots` — **`red trim` dropped**, it is not her livery |
| `yuna-white-mage` | (silent) | §1.14: X-2 Yuna's hair is cropped short with a **red braid hanging to her ankles** | added `very long red braid` — it is the single strongest X-2-vs-FFX tell in a cutout |
| `paine-warrior` | `black leather outfit, bare shoulders, armor, pauldron, greatsword` | §1.16: **no armour at all** — sleeveless fold-over top with silver studs and an x-brooch, black shorts, **skull belt buckle**, red belt with circle studs, **red suspenders**, black thigh-highs, elbow-length gloves, studded choker, silver pendant | `sleeveless fold-over top, silver studs, studded choker, black shorts, skull belt buckle, red belt, red suspenders, black thighhighs, elbow gloves, silver pendant` — **`armor, pauldron` dropped**, they were pulling her toward a knight |
| `paine-warrior` | `greatsword` | §1.16: a long straight sword held point-down | `longsword` — `greatsword` was over-scaling the blade and eating the baseline |
| `rikku-dark-knight` | (as written) | bible has no Rikku Dark Knight sheet | kept `cast.json`'s row, which is emphatic: black plate, almost no skin. See §2 |

Style and quality tags were never passed through `--tags`; the generator appends
them (pipeline §2). Exact strings are recoverable from any sidecar's `prompt`.

---

## 2. Rikku Dark Knight — the round that `cast.json` predicted

`cast.json`'s note is the only place the failure is written down and it is
exactly right: "the model keeping Rikku's Thief look … and adding a sword to it;
that is a reject."

**Round A** (4 variants, name-hash seeds, `--negAdd` as `cast.json` gives it:
`bikini, midriff, scarf, goggles, bare shoulders, revealing clothes`) came back
**4/4 with a bare midriff**. The orange was gone — the ban worked on colour —
but the *silhouette* was still Thief: crop top, shorts, bare thighs, black
armour applied as trim rather than as plate.

The ban list was not the lever. `--negAdd` removes named garments; it does not
add coverage. **Round B** (seed `882001`) said the positive out loud instead:

```
--extraTags "full plate armor, fully armored, no skin exposed, armored long sleeves,
             chainmail, faulds, greaves, armored skirt"
--emphasis  "(full plate armor:1.35), (fully covered in black armor:1.25)"
--negAdd2   "midriff, navel, bare midriff, crop top, short shorts, bare thighs,
             bare skin, bikini armor, cleavage, bare arms, thighhighs"
```

`--emphasis` matters here for the reason its docstring gives: the same weights
typed into `--tags` would have been paren-escaped into literal characters and
weighed nothing. 4/4 came back in full plate. `idle-b.3` is the keeper.

**The helmet was deliberately not chased.** `cast.json` asks for a horned helm;
every variant that grew one also lost the face, and the blind judge has to name
her. `full face helmet, face covered, mask, visor down` are banned instead, and
the keeper reads as Rikku on the blonde braided ponytail and the green
swirl-pupil eyes above a black-and-gold gorget. Canon loses a helmet; the judge
keeps a subject.

---

## 3. Facing — what the seeds actually gave

The contract predicts a frame-**left** bias and it held again: **all four
approved idles came back angled frame-left** and were mirrored with `flip.py
--set-facing right`. None of the four subjects is chiral — no empty sleeve, no
one broken horn, no legible insignia — so mirroring is safe for all of them.
Paine's skull buckle and Rikku's gorget read the same either way.

`--ref` did not carry facing, again, exactly as contract §4 says: referenced
states off already-mirrored (frame-right) idles still came back in a mix of
directions and were judged for direction one at a time.

---

## 4. Log — every state, what was picked and why

Seeds are the seed of the **chosen** variant, recoverable from each sidecar.
"flip" means `flip.py --set-facing right` was run on the promoted file.

_(filled in per subject below as the round completes)_
