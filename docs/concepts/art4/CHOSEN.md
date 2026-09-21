# Art round 4 - what was installed

Owner, 2026-09-21, on the five contact sheets in this folder:

> I already selected Braska why am I selecting it again with a reroll? Keep the one you already have. I approve everything else.

So **group A did not ship**: `public/art/portraits/braska.png` is untouched and stays as Bailey picked it. Every pose in groups B and C below is installed; which of the three candidates shipped was delegated to the install agent and is listed here so any row can be vetoed at a glance from `chosen.png`.

Order of judgement for each pose, as briefed: canon per `research/visual-bible.md` and `tools/gen/cast.json` (costume, hair, eye colour, weapon, silhouette), then the v3 facing contract, then consistency with that subject's approved idle, then a clean cut-out.

**Game (hard rule 14):** FFX only for Lulu, Rikku, Kimahri, Yunalesca, the Yu Pagoda and Jecht; FFX-2 only for the dresspheres, Paine, the possessed Bahamut, the Vegnagun parts and Lenne. Nothing here is shared plumbing, so no row applies to both games.

**Undo:** the painting each row replaced is in `D:\Tools\pyrefly-art-backup\replaced\2026-09-21-art4\<same path>`; the installed files are backed up in `D:\Tools\pyrefly-art-backup\approved\2026-09-21-art4` and hashed in `docs/target/approved-hashes.json` under the set `art4:2026-09-21`.

**Facing:** nothing in this round had been mirrored yet, so 18 of the 42 were mirrored with `tools/gen/flip.py --set-facing` after installing, to satisfy the v3 contract (party and dresspheres face right, enemies face left, a downed figure's head points at the enemy that felled it). The mirrored rows are marked below.

| # | Pose | Game | Candidate | Replaced | Mirrored | Why this one |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `lulu/attack` | FFX | cand-3 | yes | no | Full-length stacked belt skirt, brown fur collar, jet-black hair, tiny moogle doll held out in one open hand; cand-2 bares a leg (short skirt, off canon) and cand-1 adds white lace cuffs the fix pass banned. |
| 2 | `lulu/hurt` | FFX | cand-1 | yes | yes | Only candidate that keeps the stacked leather belt skirt to the floor; torso bent, head down, doll still in hand. cand-2/3 drift into a smooth gown. |
| 3 | `lulu/ko` | FFX | cand-2 | yes | no | Head toward the enemy (frame right, party KO orientation), whole silhouette inside the frame, moogle doll present; cand-1 lies head-left, cand-3 crops tight. |
| 4 | `rikku/cast` | FFX | cand-2 | yes | yes | Full body with feet visible, green skirt / orange top / green eyes, small compact spell spark at the hand; cand-3 is a bust crop with the banned orange colour cast, cand-1 points away. |
| 5 | `rikku/hurt` | FFX | cand-2 | yes | yes | Body-mechanics hurt that actually reads: torso bent back, head thrown back, eyes shut; canon claw and Al Bhed palette intact. |
| 6 | `rikku/ko` | FFX | cand-3 | yes | yes | Whole body inside the frame (the FRAME-FULL defect the shipped file was flagged for), compact composition, no bleed at the corners. |
| 7 | `kimahri/attack` | FFX | cand-1 | yes | yes | Exactly two arms, both on the spear, the single broken horn asymmetry preserved, body angled toward the enemy. |
| 8 | `kimahri/victory` | FFX | cand-2 | yes | yes | Exactly two arms, spear raised, one horn broken and one intact — and it is the only strong variant already facing right, which matters because Kimahri is chiral and must never be mirrored. |
| 9 | `yunalesca-2/cast` | FFX | cand-3 | yes | no | Only candidate that keeps form 2's canon silhouette: blue bandeau over black, green/gold sashes, ornate headdress, silver hair; cand-1/2 dissolve into the pale form-3 hair mass. |
| 10 | `yunalesca-3/attack` | FFX | cand-2 | yes | no | Full upright figure with the gorgon hair mass, face readable, pale form-3 palette; cand-3 is a landscape sprawl that will not plant on a ground line. |
| 11 | `yunalesca-3/cast` | FFX | cand-1 | yes | no | The only vertical full figure of the three; cand-2 and cand-3 are landscape close-ups that lose the body. |
| 12 | `yu-pagoda/attack` | FFX | cand-1 | yes | no | The single-pillar re-roll: one structure only, tiered, no fused second tower (the 'extra subjects' failure in the other two). |
| 13 | `yu-pagoda/cast` | FFX | cand-1 | yes | no | Best of a weak row — vertical gold-and-white spire; cand-2 reads as a limb and cand-3 as a lantern on a stand. FLAGGED for veto. |
| 14 | `yu-pagoda/hurt` | FFX | cand-1 | yes | no | Keeps a single tiered vertical mass tilting over; cand-2 is limb-shaped, cand-3 is a parasol disc. FLAGGED for veto. |
| 15 | `jecht/ko` | FFX | cand-1 | yes | no | Prone with the head toward the party (frame left, enemy KO orientation), whole body in frame, no floor puddle or shadow streak baked into the cut-out. |
| 16 | `yuna-white-mage/attack` | FFX-2 | cand-2 | yes | yes | Canon white robe with the red zigzag hem, purple/pink trim, hood, staff swung toward the enemy; cand-1 carries the detached floating shape the round noted, cand-3 shortens the robe. |
| 17 | `yuna-white-mage/cast` | FFX-2 | cand-1 | yes | yes | Full-length white robe, red zigzag hem, yellow obi, pink mantle, rod held up — the cleanest cut-out of the row. |
| 18 | `yuna-white-mage/item` | FFX-2 | cand-2 | yes | yes | Hood up with the canon pink hood trim, white robe with red zigzag, item held out; the most legible 'item' read of the three. |
| 19 | `yuna-white-mage/hurt` | FFX-2 | cand-2 | yes | yes | Torso arched, head thrown back, rod dropping — end-state phrasing landed here; cand-1 turns into a back view, which the facing contract rejects. |
| 20 | `yuna-white-mage/victory` | FFX-2 | cand-1 | yes | yes | Rod planted upright, full robe and mantle, clean silhouette and a quiet stance that matches her approved idle. |
| 21 | `yuna-white-mage/ko` | FFX-2 | cand-1 | yes | no | Head toward the enemy (frame right) and the whole body inside the frame; cand-2 has a detached floating fragment, cand-3 lies head-left. |
| 22 | `paine-warrior/idle` | FFX-2 | cand-1 | yes | yes | Long straight silver sword with the skull at the ricasso and the skull belt buckle — the documented canon fix; cand-2 over-scales the blade into a greatsword, cand-3 curves it. |
| 23 | `paine-dark-knight/idle` | FFX-2 | cand-2 | yes | yes | Black-and-red layered Dark Knight coat with the crescent crest rather than the unsourced horned helm; cand-1 drops the armour, cand-3 swaps the sword for a scythe. |
| 24 | `ffx2-bahamut/idle` | FFX-2 | cand-1 | yes | no | Upright bipedal stance with blue-white wing insides, repainted post-checkpoint-fix and consistent with the FFX Bahamut idle it was referenced against. |
| 25 | `ffx2-bahamut/hurt` | FFX-2 | cand-1 | yes | yes | Clearest silhouette of the row: body recoiling, wings readable, no blown-out white mass. |
| 26 | `ffx2-bahamut/ko` | FFX-2 | cand-1 | yes | no | Downed body reads as one whole creature with no detached floating fragments; cand-2/3 dissolve into an abstract wing mass. |
| 27 | `vegnagun-tail/idle` | FFX-2 | cand-3 | yes | no | Reads as one jointed metal tail — no legs, no head, no whole-insect drift; cand-2 grows legs. |
| 28 | `vegnagun-tail/hurt` | FFX-2 | cand-2 | yes | no | Segmented metal tail with no blown-white region (the exact defect on the shipped file); cand-1 still has the white blowout. |
| 29 | `vegnagun-tail/ko` | FFX-2 | cand-3 | yes | no | Whole part inside the frame, metal segments, no extra legs and no full-bleed tangle. |
| 30 | `vegnagun-leg/idle` | FFX-2 | cand-1 | yes | no | One jointed limb only, no head, no face, no teeth — the documented defect on the shipped file. |
| 31 | `vegnagun-head/idle` | FFX-2 | cand-2 | yes | no | All metal with a mechanical lens eye; cand-1 still reads as bone/organic skull, cand-3 is a full-bleed blur. |
| 32 | `yuna-gunner/hurt` | FFX-2 | cand-2 | none (new pose) | no | Canon Gunner livery (white top, pink/blue pleated skirt, twin pistols) with the body turning off balance; cand-3 carries a large rainbow streak artefact. |
| 33 | `yuna-gunner/ko` | FFX-2 | cand-1 | none (new pose) | yes | Whole body in frame with both pistols and the pink mantle readable. |
| 34 | `yuna-gunner/victory` | FFX-2 | cand-1 | none (new pose) | no | Pistol raised, full Gunner costume, feet on the ground line, clean cut-out. |
| 35 | `yuna-black-mage/attack` | FFX-2 | cand-1 | none (new pose) | no | Hat, ringed rod and layered skirt all read; the cleanest attack silhouette of the three. |
| 36 | `yuna-black-mage/cast` | FFX-2 | cand-1 | none (new pose) | yes | Rod with the gold ring held high, no baked-in ground magic circle (cand-3 paints one under her feet, which would float in the scene). |
| 37 | `yuna-black-mage/hurt` | FFX-2 | cand-1 | none (new pose) | yes | Leaning back off balance with the rod trailing; cand-2 is the variant with the large swirling colour artefact the round flagged. |
| 38 | `yuna-black-mage/ko` | FFX-2 | cand-3 | none (new pose) | yes | Head toward the enemy (frame right), whole body and hat inside the frame. |
| 39 | `yuna-black-mage/victory` | FFX-2 | cand-1 | none (new pose) | no | Rod raised in a settled victory stance, full skirt, no colour streaking. |
| 40 | `yuna-songstress/attack` | FFX-2 | cand-2 | none (new pose) | no | Songstress layered blue/pink skirt and microphone, full body with feet visible; cand-1 grows a large plume artefact behind her. |
| 41 | `yuna-songstress/dance` | FFX-2 | cand-2 | none (new pose) | no | Arms out, mic in hand, skirt in motion — the only candidate that reads as a dance rather than a stand. |
| 42 | `lenne/portrait` | FFX-2 | cand-1 | none (new pose) | no | Long side-parted brown hair, brown eyes and the blue high-collar songstress top with gold trim, matching her shipped idle; cand-2 lightens the hair and adds lace sleeves, cand-3 adds shoulder armour. |

## Rows worth a second look

- `yu-pagoda/cast` and `yu-pagoda/hurt` - no candidate holds the tiered pagoda silhouette the shipped paintings have; the round itself flagged this and spent its one reroll on `attack`, which did land. These two are the rows most worth a veto.

- `yuna-white-mage/*` - the purple/pink trim recolour landed, but the ankle-length red braid the bible calls the strongest FFX-2 tell still does not read at full length on any candidate. An emphasis pass is owed.

- `kimahri/attack` and `kimahri/victory` - both were mirrored. `docs/ART-PIPELINE.md` warns against mirroring a chiral subject because of his one broken horn, but every shipped Kimahri pose on disk (`idle`, `cast`, `hurt`, `ko`) is already `flipped: true`, so mirroring keeps the new poses on the same side as the ones Bailey has been looking at. Worth a word if that reads wrong.
