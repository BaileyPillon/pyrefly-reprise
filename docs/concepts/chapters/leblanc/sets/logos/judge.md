# Logos — independent judge pass on the identity-drift fix (2026-09-21/22)

FFX-2 only (Chateau Leblanc chapter, per-character art recipe — AGENTS.md hard
rule 14, not shared plumbing). This is a **second, independent** pass over the
`logos` re-render recorded in `docs/handoff/fix-ffx2-logos-render.md` (commit
`920dac8`) and in the `logos` row of `tools/gen/cast.json`, run by a different
agent than the one that rendered and installed the candidates. No new renders
were made here. Sibling independent passes: Leblanc production set (FAIL,
4/4 states, commit `5416df8`) and Ormi's Method-A re-render (FAIL, 4 states
under 7, commit `bb26fe5`).

## Note on scope (checked before scoring)

The brief this run started from carried a judging-criteria block (blonde bob,
blue-and-white triangle robe, heart-mark-on-chest, red-and-silver fan,
`docs/concepts/chapters/leblanc/pilot/identity.txt`) that belongs to
**Leblanc**, not Logos — confirmed by reading `identity.txt` directly (it is
Leblanc's prose identity block verbatim) and Logos's own sourced description
(`research/ffx2-leblanc-syndicate.md` §10.1: tall/slim, black-and-silver
helmet with chin protector and purple tie-strip, dark blue robe and coat with
the Syndicate logo on both shoulders, purple sash, ankle wraps, sandals, two
revolvers, age 26; `tools/gen/cast.json`'s `logos` subject row). Scoring below
uses Logos's own criteria (hair, face, outfit colours/pattern, marks, weapon,
style, pose-reads-as-state) against his own installed `idle.png` as anchor,
never Leblanc's.

**A separate, smaller sourcing note worth flagging under hard rule 6:**
`cast.json`'s `logos.tags` string calls the shoulder emblem "the syndicate
**heart** logo" — research §10.1 only says "the Syndicate logo on both
shoulders" and never specifies a heart shape (the heart is Leblanc's chest
mark, research §10.1's Leblanc paragraph, not Logos's). In practice none of
the five installed renders draw anything recognisable as a heart on the
shoulder (see per-state notes below — it reads as an abstract disc/ring/swirl
in every state that shows it), so no image is disqualified for inventing a
heart mark, but the prompt text itself should be corrected to drop "heart"
before the next re-render pass.

## Method

Anchor: `public/art/characters/logos/idle.png`. Every one of the five
installed PNGs (`idle`, `attack`, `cast`, `hurt`, `ko`) was opened at native
pixel size and again as targeted crops (`sharp`, nearest-neighbour 2x, head
and torso/ground regions) — not judged from the shrunk `sets/logos/sheet.png`
thumbnails alone, though that sheet was reviewed first as an overview. Seven
criteria, each scored 0–10: hair (colour + length/cut); face; outfit colours
and pattern; marks (the shoulder Syndicate logo, the helmet's explicitly
"no crest/no plume" requirement, and any other emblem/accessory); weapon (two
revolvers, one per hand, both hands visible — research's and the tags'
identity-defining prop); style; and whether the pose actually reads as its
named state. **A state's score is its worst criterion**, not an average, per
the sibling pilots' rule — one blown criterion sinks the whole candidate.

## Scores

| State | Hair | Face | Outfit colour/pattern | Marks | Weapon | Style | Pose-as-state | **Score (worst)** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| idle | 8 | 8 | 7 | **5** | 9 | 9 | 9 | **5** |
| attack | 8 | 8 | 6 | 4 | **3** | 8 | 9 | **3** |
| cast | 4 | 7 | 4 | **2** | 8 | 6 | 4 | **2** |
| hurt | 3 | 6 | 3 | 6 | 3 | 6 | **3** | **3** |
| ko | 7 | 8 | 7 | 4 | **1** | 8 | 9 | **1** |

**Pass bar is 7. All five states fail.**

## Per-state findings

**idle (score 5, marks).** The base identity is otherwise solid: correct
navy/blue robe and coat, purple sash and ankle wraps, sandals, both revolvers
held low and both hands clearly visible (confirmed at full resolution — this
does **not** repeat the old idle's cup/box failure the fix was written to
solve). The miss is that a small but distinct dark spiked/winged crest shape
survives at the top-left of the helmet despite `negAdd` explicitly listing
"crest, plume, feathered helmet, ornate helmet decoration" and `tags`
explicitly stating "no helmet crest, no plume, no feathers" — this is the same
gap `fix-ffx2-logos-render.md` already flagged as "faint," but at full
resolution it reads as a clear, unambiguous pointed shape, not a subtle
sheen artefact, so it is scored as a real miss rather than a cosmetic one.
The shoulder emblem is a round white/blue disc with an abstract swirl — not a
heart, but research never asks for one, so this is not scored down.

**attack (score 3, weapon).** Confirms `cast.json`'s own note: only the right
hand and its revolver are visible; the left arm is tucked behind the body,
fully out of frame, so the render does not show "two revolvers, one in each
hand, both hands visible" — the character's single defining prop is only
half-present. Secondary drift, not scored as the worst criterion but worth
recording: the helmet's crest is markedly larger here than idle's (a full
back-swept fin, not a faint remnant), and the shoulder emblem has changed
from a round disc to an elongated oval with a new gold buckle/clasp neither
present on idle. Pose reads clearly as an aiming lunge (9).

**cast (score 2, marks) — the most severe finding in this pass, and one not
previously disclosed.** `cast.json`'s note for this state only mentions hair
reading "lighter/more silver" and "a small unrequested gold shoulder accent."
At full resolution and in a head-region crop, the finding is larger than
that: **the helmet is completely absent.** There is no silver metal, chin
protector or purple tie-strip anywhere on the head — only long, loose,
flowing hair, worn far past the length and looseness of every other installed
state. The shoulder area is not a variant of idle's disc emblem at all; it is
an unrelated yellow/gold ribbed epaulette with a red sliver beneath it. Both
revolvers are held, and both hands are visible (weapon: 8, a genuine
strength), but the pose does not clearly perform the "spinning the cylinder
of one revolver, holding it up beside his face" beat from the pose tags —
both guns are held low near the waist, not raised to the face (pose: 4). This
state should not be treated as a minor identity nudge; it drops the single
most identity-defining accessory of the character entirely.

**hurt (score 3, pose — tied with hair and weapon).** Three co-equal misses,
not just the one `cast.json` recorded. (1) Pose: confirmed as the handoff
already found — the stance stays close to idle's own standing posture, one
gun lowered, and the face reads more neutral/coy than "recoiling, staggering,
pained... one eye closed." (2) Weapon: same failure mode as attack — only one
revolver is visible, the other hand and gun are hidden behind the body. (3)
Hair: not previously flagged — visible hair strands under the helmet read as
dark brown/near-black in this state, a clear colour break from idle's
silver-white, on top of the already-documented unrequested rainbow ribbon
streamers (red/gold/teal/pink/blue) on the hakama hem, which is the "outfit
colour/pattern" miss (scored 3). The shoulder armour plate itself is a
reasonable match to idle's silhouette (marks: 6).

**ko (score 1, weapon) — the second-most severe finding.** The pose tag calls
for "revolvers fallen beside him." A targeted crop of the ground area around
the character's hands and torso shows **no revolvers anywhere in frame** —
not held, not dropped, not partially visible. This is a harder failure than
attack/hurt's "one gun visible": here the character's core weapon identity is
absent from the image entirely. The lying-down, eyes-closed defeat read is
otherwise convincing (pose: 9; face: 8), and the robe/sash colours hold up
reasonably well (outfit: 7), but the same oversized helmet crest/wing seen in
attack reappears here, larger than idle's (marks: 4).

## Cross-state pattern

Every state after idle drops or halves the two-revolver identity in some way
(attack and hurt show only one gun; ko shows none), and every state's helmet
crest is either present-but-small (idle) or clearly larger than idle's
(attack, ko) — the `negAdd`/`tags` "no crest" instruction is not holding
across re-renders even though it is present in every state's prompt
construction via the shared subject `tags` block. Cast is the outlier and the
worst case: it does not merely drift the identity, it drops the helmet
outright. None of these five images should be treated as an approved
delivery; `fix-ffx2-logos-render.md` already correctly labelled the set
"candidate, not approved," and this independent pass confirms that call
rather than clearing it.

## Recommendation

Do not add any of the five to `docs/target/approved-hashes.json`. If a
follow-up render pass is authorised: re-roll `cast` from scratch off the fixed
`idle.png` with an explicit re-roll trigger for "is the black-and-silver
helmet with chin protector visible" (not just skimmed on a thumbnail);
re-roll `attack`/`hurt`/`ko` with an explicit trigger for "are both revolvers
visible, held or dropped"; and tighten `negAdd` further for the crest, since
the current wording is not preventing it and the artefact is growing (idle to
attack/ko), not shrinking. Per the pace rule (AGENTS.md hard rule 15), none of
this was re-rolled in this pass — this is a judge-only pass, no renders were
made.

## Sheet

`docs/concepts/chapters/leblanc/sets/logos/sheet.png` — one row per state
(picked concept where one exists, installed whole body, 1:1 face/detail crop,
1:1 torso/hands crop). Additional targeted crops used for this pass (head and
ground regions at 2x nearest-neighbour, to check the helmet and dropped-weapon
questions specifically) were built to the session scratchpad for review and
are not committed — they reproduce directly from the installed PNGs listed
above with a simple crop, nothing hidden in them changes the verdict.
