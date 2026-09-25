# Party pose worklist audit (FFX-2 only), 2026-09-25 overnight GPU session

Scope: continue the Trema pose method (`docs/concepts/chapters/trema/poses/`) onto the rest of
the FFX-2 party's `PARTY_POSES` gaps (`attack, cast, item, hurt, ko, victory` —
`src/engine/BattlePresenterArt.ts`). Requested by Bailey overnight; this file records what was
actually audited and rendered, and — as important — what was **not** rendered and why.

`node D:/Tools/pyrefly-lora/tools/verify-approved.mjs` before and after this session:
185 ok, 0 mismatched, 0 missing, both times. Nothing was installed into `public/art/` and
`docs/target/approved-hashes.json` was not touched.

## 1. Empty-slot audit

Live-chapter dresspheres, in the order the brief asked for (Chapter IV Bahamut = `bevelleBuild`,
Chapter V Vegnagun = `farplaneBuild`, Chapter VI Leblanc = `chateauBuild`,
`src/data/encounters.ts`; Chapter XI (`chapter-ffx2-fallen-aeons.ts`) reuses `farplaneBuild` —
there is no `chapter-fallen-aeons-*` branch, it is already on `main`):

| Dressphere | Chapters | Empty slots (of attack/cast/item/hurt/ko/victory) |
|---|---|---|
| yuna-white-mage | IV, V, XI | none — all 6 already painted |
| rikku-dark-knight | IV, V, XI | ko, victory (attack/cast/item have 3 candidates each, hurt has 1) |
| paine-warrior | IV, VI | all 6 |
| yuna-gunner | VI | item only (the other 5 are painted) |
| rikku-thief | VI | all 6 |
| paine-dark-knight | (V, XI) | skipped — done in tonight's Trema batch |
| rikku-alchemist | — | skipped — done in tonight's Trema batch |

Chapter XIII (Trema) dresspheres are already covered by tonight's earlier batch
(`docs/concepts/chapters/trema/poses/`) and are not repeated here.

The rest of the roster (no live chapter uses these dressphere combinations yet): `paine-black-mage`,
`paine-gunner`, `paine-samurai`, `paine-white-mage`, `rikku-berserker`, `rikku-black-mage`,
`rikku-gunner`, `rikku-white-mage`, `yuna-black-mage` (item only empty), `yuna-songstress`
(cast/item/hurt/ko/victory empty — only attack exists), `yuna-warrior` (all 6). None of these
were touched this session; see §3.

## 2. Why no renders went out tonight

The Trema method's skeleton set (`skeletons.py` in that folder) only defines two weapon kinds:
`sword` (two-handed greatsword) and `flask` (single potion bottle), because that was Chapter
XIII's line-up. Checking the new worklist against that:

- **rikku-dark-knight** and **paine-warrior** both fight one-handed with a single blade, close
  enough to the `sword` kind to reuse, but their identity words need to be read off the actual
  installed idle image, not the idle's stored generation prompt — the stored `idle.json` prompt
  for `rikku-dark-knight` (horned helmet, black armor with gold trim) does not match the
  installed picture at all (bare head, blonde hair in a long braided ponytail, navy-blue armor,
  gold-engraved greatsword held point-up). This is exactly the failure Trema's own METHOD.md
  section 1 already hit and fixed by reading identity from the picture instead of the sidecar —
  it would need to happen again here, per character, before any candidate is queued.
- **yuna-gunner** (dual pistols) and **rikku-thief** (dual daggers) have no matching skeleton
  kind at all. `sword` and `flask` are both single-weapon poses; a dual-wielded ranged/melee
  pose needs its own arm rig in `skeletons.py`, which is new tooling, not a worklist change.

Rule 15 asks for a paper preflight before a change like this, and the Trema round's own
retrospective (METHOD.md §1) shows what happens when a pose batch skips straight from a stored
prompt to a full render round: two failed pilots before the identity-from-picture fix landed.
Running Bailey's overnight GPU time against 8 dresspheres' worth of freshly-guessed identity
prompts and one unbuilt skeleton kind, unreviewed until morning, risked spending the whole night
on the same mistake at ~14x the scale with nobody able to catch it early. So: **0 GPU jobs queued
this session.** ComfyUI was left idle and untouched (never restarted, queue was empty throughout).

## 3. What this leaves for the next pass

1. **Identity-from-idle for `rikku-dark-knight` and `paine-warrior`**: read tags off the
   installed idle pictures (as Trema's identity2 did), pilot 1 slot each at `--n 1,2` before a
   full round, same as the Trema method.
2. **A new `dual` (or two) skeleton kind** in a copy of `skeletons.py` for `yuna-gunner`
   (dual pistols) and `rikku-thief` (dual daggers) before either can render — arm angles for a
   two-gun or two-dagger stance are not in the current rig.
3. The 11 dresspheres with no live chapter yet (`paine-black-mage` through `yuna-warrior`) stay
   last in priority per the brief; none were looked at closely this session beyond the empty-slot
   count in §1.

No files changed under `src/`, `public/art/`, or `critic/`. This folder (`docs/concepts/art5/`)
is the only new path from this session.
