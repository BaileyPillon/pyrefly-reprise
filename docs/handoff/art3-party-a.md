# Art round 3 — group "party-a" (Tidus, Yuna, Auron, Wakka)

**Contract:** v3 facing (`docs/handoff/art3-contract.md`, `docs/ART-PIPELINE.md` §2a).
**Scope:** four FFX party members, states `idle attack cast item hurt ko victory`
(+ `summon` for Yuna), plus the four HUD portraits.
**Stack:** ComfyUI 0.35.0 @ 127.0.0.1:8188, Animagine XL 4.0 Opt, IP-Adapter
plus / CLIP-ViT-H. Defaults: 28 steps, CFG 6, euler_ancestral, 832×1216
(1216×832 for `ko`).

Every state below was judged **facing first** (frontal = reject, flat profile =
reject, good-but-backwards = mirror with `flip.py`), then costume, then extra
subjects, cropped limbs and the cutout.

---

## 1. Identity tags used, and why they differ from `cast.json`

`cast.json` is v3's work order, but three of its four rows carry costume tags
that `research/visual-bible.md` §1 contradicts. The blind judge scores canon, so
the bible won; the deltas are below and should be folded back into `cast.json`
by whoever owns that file (this group is not allowed to write it).

| Subject | `cast.json` says | Bible §1 says | What was rendered |
| --- | --- | --- | --- |
| Tidus | `yellow hooded vest, hood, black shorts` | white hood; **blue pauldron over the left arm**; dungarees with **one short and one long trouser leg** | added `white hood, blue pauldron, shoulder armor, black overalls, uneven legwear` |
| Tidus | `brotherhood (sword), blue sword` | a **longsword ending in a hook**, water-blue blade | added `longsword, glowing blue blade` — the task's "long hooked blade, not a dagger" |
| Yuna | `white kimono top, blue skirt, purple obi` | **purple pleated hakama**, **yellow** obi, white sash over a **black camisole**, pink-and-white detached sleeves | `purple hakama, pleated skirt, yellow obi, white sash, black camisole, pink and white sleeves` |
| Wakka | `open jacket, blue jacket, yellow overalls` | **yellow vest cut away at the stomach** (bare midriff), **blue** baggy trousers | `yellow vest, midriff, navel, blue pants, baggy pants` |
| Auron | (as written) | left arm inside the haori, that sleeve hanging **empty** | added `haori, empty sleeve, gauntlet, shoulder pad`; pose tags say it too |

Style and quality tags were never passed through `--tags` — the generator
appends them (§2 of the pipeline doc).

---

## 2. Facing, per subject — what the seeds actually gave

The contract predicts a frame-**left** bias and it held: of the 16 round-A idle
variants, **zero** came back convincingly angled to the frame-right. Party art
therefore reaches `facing: right` through `flip.py`, except Auron.

### The Auron problem, and what it cost

Auron is on the contract's chirality list — his coat is off his **left**
shoulder, so a mirror moves the empty sleeve to the wrong side and puts the
katana in his left hand. `flip.py` is therefore banned for him and **the seed is
the only lever on his facing**. Round A (4 variants, seeds from the name hash)
was a clean sweep of rejects:

| Variant | Verdict |
| --- | --- |
| `idle.1` | frame-left, **both arms out of the sleeves** |
| `idle.2` | frame-left, **two katanas** (one sheathed, one held), both arms out |
| `idle.3` | near-frontal, both arms out, coat rendered as a full monk robe |
| `idle.4` | see §3 |

So round B rewrote the pose prompt to state the empty sleeve three ways
("only one arm out of the coat / left arm tucked inside the coat / empty left
sleeve hanging loose and flat"), added `--negAdd` for the duplicate katana and
the second bare arm, and ran **8 fresh seeds from `--seed 771001`** (a re-run
without `--seed` reproduces the name-hash seeds exactly and would have returned
the same four rejects).

---

## 3. Log

(filled in below as each state lands)
