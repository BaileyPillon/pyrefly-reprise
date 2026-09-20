# Missing speaker portraits — candidates

Nothing here ships. This is candidate art for Bailey to pick from, per the
approved local-art-session request on 2026-09-20 ("Yes, paint candidates").
Details of what's missing and where each key is read from are in
[`missing.json`](missing.json). The contact sheet is [`sheet.png`](sheet.png)
(built with `tools/gen/sheet.py`, spec in `sheet-spec.json`).

Pipeline check before rendering: ComfyUI was down, started via
`schtasks /Run /TN PyreflyComfyUI` (answered in 24s). All five model files in
`docs/ART-PIPELINE.md` §9 re-hashed and matched the published table exactly
(the checkpoint, IP-Adapter, CLIP-Vision — the one that rotted in place on
2026-09-19 — RealESRGAN and rembg's isnet-anime). A tiny 12-step test render
confirmed the pipeline and the black-frame guard are healthy before spending
GPU time on the real batch. All 24 renders (8 keys x 3 candidates) came back
clean; none were black frames, so ComfyUI was never restarted.

Every candidate uses the pipeline's own portrait recipe
(`--composition portrait`, same style/quality tags in `tools/gen/comfy.mjs`,
`--facing none`) and, where an approved full-body painting already exists,
`--ref` at the pipeline's default weight (0.65), or 0.45 for `young-auron`
where the identity is deliberately a variant of `auron`, not a copy of him.

## paine (ffx-2)

Ref: `public/art/characters/paine-warrior/idle.png`. All three keep the
canon read well — short silver hair, red eyes, black leather, the studded
choker. **cand-1**'s hair picks up a cool teal tint from the rim light rather
than reading as clean silver-white; **cand-2** and **cand-3** are closer to
neutral silver. All three are recognizably the same character as the
approved full-body painting.

## shuyin (ffx-2)

Ref: `public/art/characters/shuyin/idle.png` (this is `tools/gen/cast.json`'s
own queued `portrait-shuyin` recipe, reused verbatim — it had never been
rendered). Blond spiky hair and blue eyes land on all three. **Off-canon
note:** `research/visual-bible.md` #1.19 calls for a "colder and desaturated"
palette versus Tidus; **cand-1** goes the opposite way, with a strongly
saturated orange/blue duotone rim-light treatment that reads more dramatic
than "cel shading, soft shading" house style. **cand-2** and **cand-3** are
closer to a normally-lit portrait and better candidates on that count.

## yuna-x2 (ffx-2)

Ref: `public/art/characters/yuna-gunner/idle.png`. Heterochromia, short hair
and the pink hood all read across the three; no defects spotted. Distinct
from her FFX self mainly by the gunner-styled hood and slightly sharper
expression per the pose tag ("confident smirk" vs. FFX-Yuna's "gentle
smile").

## rikku-x2 (ffx-2)

Ref: `public/art/characters/rikku-thief/idle.png`. Blonde hair pulled up,
blue headband, green eyes and an open cheerful grin on all three, matching
the Thief-look canon. No defects spotted.

## braska (ffx)

No existing painting to `--ref` — he has never been rendered before (he is a
staged-presence character per `research/visual-bible.md` #1.22.1, not a
fought one). Blue eyes and a mature, robed, staff-holding summoner all land.
**Off-canon note, all three candidates:** the canon headdress is a **dark
blue** keffiyeh-style band with a blue stone and pale-blue trailing tassels,
and the sash is **grey** with a Yevon "A" glyph. What rendered instead is a
much more ornate gold-and-white/gold-and-purple crested crown — striking, but
neither the color nor the silhouette match the sourced description. Whoever
picks a candidate should expect a follow-up pass on the headdress if Braska
is rendered for real.

## young-auron (ffx)

Ref: `public/art/characters/auron/idle.png` at a lowered weight (0.45) so the
render keeps the family resemblance without inheriting present-day Auron's
scar and sunglasses — both were also explicitly banned in `--negAdd`. All
three came back with no scar and no sunglasses, matching the canon delta in
`research/visual-bible.md` #1.22.2. **Worth a second look:** on **cand-1**
the two eyes don't read as quite the same color at this resolution (one leans
warmer/amber, the other cooler) — canon calls for both eyes the same amber.
Could be a lighting artifact on the iris rather than true heterochromia;
flagging rather than guessing.

## fayth-boy (ffx)

No existing painting to `--ref`. This id has a naming problem worth fixing
independently of which candidate gets picked: `tools/gen/cast.json` already
has a fully-specified, never-rendered subject for this exact character —
`portrait-bahamut-fayth`, writing to `public/art/portraits/bahamut-fayth.png`
— but `src/story/dsl.ts` and every script call the speaker `fayth-boy`, and
`src/ui/common/portrait.ts` looks up the id it's actually given. The two
filenames can never meet as the manifest is written today. These candidates
reuse the `portrait-bahamut-fayth` tags verbatim, rendered under the id the
code reads. **cand-1** is the best canon match — reads clearly as a young
child's face under the hood. **cand-2** and **cand-3** have the same hood and
glowing eyes but read older and more overtly monstrous/adult, closer to a
mysterious spirit than "the child who explains the dream."

## yu-yevon (ffx)

Ref: `public/art/characters/yu-yevon/idle.png`. **This is the candidate set
most worth a hard look before picking.** `research/visual-bible.md` #1.12 is
explicit that Yu Yevon "has no dialogue and is never shown in human form" —
he's a tick-like floating parasite with hooked legs and a flat, glowing
Yevon-glyph disc standing in for a face. Asking for a `--composition
portrait` ("head and shoulders, looking at viewer") on a subject with no
head pulls hard against that, and it shows: all three candidates rendered as
ornate glowing insignia/crest artwork — striking, on-palette (purple/gold,
a bright glyph-like core), but none of them read as a creature with a body,
legs or the tick silhouette the bible calls for. This isn't a broken render
in the technical sense (no extra limbs, no text, no crop, no black frame),
so it wasn't rerolled, but it may be the wrong approach entirely — a
non-portrait framing (or accepting that this speaker never actually gets a
close-up, since no shipped line was found for him — see `missing.json`) may
serve the game better than picking one of these three.

## Rerolls

None. Nothing in the 24 renders hit the reroll-worthy failure list (extra
fingers, unambiguous wrong hair/eye colour, text/watermarks, cropped heads,
black frames) clearly enough to spend the budget — the notes above are canon
and style observations for Bailey to weigh, not defects to fix by rerolling.
