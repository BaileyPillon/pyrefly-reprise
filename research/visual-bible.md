# Pyrefly Reprise — VISUAL & UI BIBLE

**Scope:** art direction, sprite design sheets, location sheets, battle-UI specification, title/chapter-select, and Three.js HD-2D technique notes for the five recreated encounters.
**Audience:** pixel artists working in code (sprites authored as pixel grids / shape lists) and Three.js scene builders who have **not** played *Final Fantasy X* or *X-2*.
**Last updated:** 2026-09-15 (gap-fill pass — see **§7.1** for the nine resolved conflicts and **§10** for the log)

> **Read §7.1 before implementing anything in §2, §3, §4 or §6.** Nine implementation-blocking conflicts between this document and `assets-and-tech.md` were arbitrated on 2026-09-15. The renderer architecture (§6.7), the post-processing chain (§6.4), the font stack (§3.9), the design canvas (§3.0, §6.1) and the camera presets (§2.0, §6.3) all changed. Where a value was superseded, the old value and the reason are kept inline so nothing is silently lost.

---

## 0. How to read this document

### 0.1 Confidence tags

Every load-bearing number or factual claim carries one of:

| Tag | Meaning |
|---|---|
| `[verified: 2 sources]` | Two or more independent sources agree (URLs in §8). |
| `[single source]` | One source, cited. |
| `[estimate]` | **Not published anywhere.** Derived by me from screenshots/artwork memory, from the design rules in §0.3, or from proportional maths. Treat as a *starting value the art director may change*, not as ground truth. |

**Almost every hex value in this document is `[estimate]`.** Square Enix has never published palette values for either game. What *is* verified is the *named colour* ("red haori", "yellow obi", "blue fur"), sourced to the Final Fantasy Wiki appearance sections; the hex is my interpretation of that named colour tuned for a pixel-art palette. Where a wiki sentence names the colour, the row says so.

### 0.2 Legal / originality constraint

All art described here must be **drawn from scratch**. Nothing in this document instructs anyone to rip, trace, or re-encode Square Enix assets. Descriptions are functional specifications ("red coat, worn off the left shoulder") so an artist can produce an original pixel sprite in the house style. Do not ship extracted textures, fonts, or UI atlases. Fonts recommended in §3.9 are OFL/Apache only.

### 0.3 House pixel-art rules (apply to every sprite)

| Rule | Value | Note |
|---|---|---|
| Logical pixel grid | 1 logical px = 3 device px at 1080p | §6.1 |
| Palette ramp per material | 4 steps: shadow / base / light / rim | `[estimate]` |
| Shadow derivation | `base × 0.68`, then hue-shift **−12° toward blue/violet** | HD-2D convention `[estimate]` |
| Light derivation | `base × 1.16`, hue-shift **+8° toward yellow** | `[estimate]` |
| Rim light | scene rim colour at 60% alpha, 1 px on the key-light-opposite edge | §6.7 |
| Outline | **selective outline**, not full. Dark outline (`#1A1526`) only where the sprite meets background; interior edges use ramp contrast | `[estimate]` |
| Eyes | 2×2 px block minimum on 64 px sprites; iris colour + 1 px white catchlight | `[estimate]` |
| Anti-aliasing | manual only, max 1 intermediate step, never on the silhouette edge | `[estimate]` |
| Max colours per party sprite | 24 incl. outline + transparent | `[estimate]` |
| Max colours per boss sprite | 40 | `[estimate]` |

### 0.4 Canonical size system

Body height in logical pixels is derived from the character's published in-fiction height:

```
body_px = round(height_cm × 0.343)
```

0.343 px/cm is chosen so Tidus (175 cm) is exactly 60 px tall inside a 48×64 cell, leaving 4 px of headroom/hair and a 1 px contact shadow row.

| Character | Published height | Source confidence | `body_px` | Sprite cell |
|---|---|---|---|---|
| Tidus | 175 cm (5'9") | `[single source]` FF Wiki | 60 | 48×64 |
| Yuna (FFX) | 161 cm (5'3") | `[single source]` | 55 | 48×64 |
| Yuna (X-2) | 162 cm (5'4") | `[single source]` | 56 | 48×64 |
| Auron | 183 cm (6'0") | `[single source]` | 63 | 56×72 |
| Wakka | 188 cm (6'2") | `[single source]` | 64 | 56×72 |
| Lulu | 167 cm barefoot / 173 cm in heels | `[single source]` | 57 / 59 | 48×64 |
| Kimahri | 204 cm (6'8") | `[single source]` | 70 | 64×80 |
| Rikku (FFX) | 157 cm (5'2") | `[single source]` | 54 | 48×64 |
| Rikku (X-2) | 160 cm (5'3") | `[single source]` | 55 | 48×64 |
| Seymour | 187 cm (6'2") | `[single source]` | 64 | 56×72 |
| Paine | 165 cm (5'5") | `[single source]` | 57 | 48×64 |
| Shuyin | 176 cm (5'9") | `[single source]` | 60 | 48×64 |
| Lenne | 169 cm (5'7") | `[single source]` | 58 | 48×64 |

**Head units.** Party sprites are drawn at **5.25 heads**. On a 60 px body: head 11 px, neck 2, torso 17, hips 4, legs 22, feet 4. Kimahri and Auron are drawn at **5.6 heads** (more heroic); Yuna/Rikku/Paine at **5.0 heads** (slightly larger head reads friendlier at small size). `[estimate]`

**Boss sizes** (on-screen sprite height in logical px, before any scene scaling):

| Boss | Sprite px (H) | Cell | Note |
|---|---|---|---|
| Seymour Flux (rider only) | 80 | 96×96 | sits on Mortiorchis |
| Mortiorchis (mount) | 120 | 192×160 | wider than tall |
| Yunalesca form 1 | 72 | 96×96 | human scale |
| Yunalesca form 2 | 112 | 128×128 | tendrils lift her |
| Yunalesca form 3 | 176 | 224×192 | gorgon body dominates |
| Braska's Final Aeon f1 | 160 | 192×192 | |
| Braska's Final Aeon f2 | 176 | 208×208 | wing-spikes added |
| Yu Pagoda (×2) | 56 | 64×64 | flanking pillars |
| Jecht (human, cutscene) | 62 | 48×64 | ~181 cm `[estimate]` |
| Yu Yevon | 96 | 128×128 | floats, no ground contact |
| FFX-2 Bahamut | 168 | 192×192 | |
| Vegnagun (leg) | 240 | 256×256 | only a leg fits the frame |
| Vegnagun (head/cannon) | 288 | 384×320 | frame-filling |
| Shuyin (boss) | 60 | 48×64 | same rig as Tidus |
| Valefor | 110 | 160×128 | wingspan wider than height |
| Ifrit | 120 | 128×128 | |
| Ixion | 100 | 160×128 | quadruped |
| Shiva | 96 | 96×128 | |
| Bahamut (FFX) | 150 | 192×192 | |
| Anima | 200 | 160×256 | tall and narrow |
| Yojimbo | 84 | 96×96 | + Daigoro 24 px |
| Magus Sisters — Sandy | 104 | 96×128 | tall, slim, praying-mantis armour; the tallest of the three `[single source]` |
| Magus Sisters — Cindy | 88 | 112×112 | **rotund**, ladybug armour; wider than tall `[single source]` |
| Magus Sisters — Mindy | 64 | 80×96 | **smallest**; bee armour; **hovers** — no ground contact, so no blob shadow, a 0.35 px/frame hover bob instead `[single source]` |

**Magus Sisters note (gap fix).** They were absent from this table although §1.13 and the Braska's-Final-Aeon possessed-aeon roster require them. The wiki gives no heights, only relative size and body type: "Sandy is tall and slim… Cindy is rotund… Mindy is the smallest of the group… and hovers during battle" `[single source]`. The px figures above are `[estimate]` derived from that ranking against the aeon band in this table (Shiva 96 / Ifrit 120): Sandy above Shiva, Cindy below her but wider, Mindy below both. Armour colours are verified: **Sandy red, Cindy blue-and-red, Mindy orange**; all three wear *insectoid* armour and resemble their *Final Fantasy IV* incarnations `[single source]`. Their **fayth** statues are the same height and body type as one another with **blonde hair**, unlike the aeons `[single source]`.

### 0.5 Master scene-neutral palette (UI-safe tokens)

These are the project's named tokens. Scenes may tint, but UI never does. `[estimate]`

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#0B0A12` | deepest shadow, outline core |
| `--ink-soft` | `#1A1526` | sprite outline |
| `--paper` | `#F4F1E8` | UI light text, bone/ivory |
| `--pyre-green` | `#8BE8B0` | pyrefly core (Spira) |
| `--pyre-white` | `#E9FFF4` | pyrefly hot core |
| `--pyre-pink` | `#F7B6D9` | Farplane pyrefly variant |
| `--yevon-gold` | `#E3B94A` | Yevon glyphs, obi, seals |
| `--blood` | `#B02A2A` | Auron coat, Braska's Final Aeon accents |
| `--spira-sky` | `#7FC6E8` | Spiran daylight |

---

## 1. Character design sheets

Reading the tables: **Ramp** columns are `shadow / base / light` unless noted. Each sheet ends with a 3–4 sentence **silhouette summary** — that paragraph is the single most important line for the artist, because at 48×64 the silhouette is what reads.

---

### 1.1 Tidus — FFX, Brotherhood sword

**Verified appearance facts** (FF Wiki *Tidus* §Appearance, `[single source]`): disheveled blond hair with spiky layers; yellow-and-black shoes; a gauntlet on his **left** hand and a black glove on the other; a yellow jacket with a **white hood**; a **blue pauldron and armour over his left arm**; the Zanarkand Abes logo as a silver pendant and printed on his right trouser leg; **one shorter and one longer trouser leg**; a dark dungaree-type overall fastened with a black belt carrying a metal chain. Hair brown as a child, blond with dark roots as an adult; eyes blue; right-handed.

| Part | Ramp (shadow / base / light) | Confidence |
|---|---|---|
| Hair (blond, dark roots) | `#8A6B1F` / `#E8C55C` / `#FFF0A8` | name verified, hex `[estimate]` |
| Hair roots (2 px at part line) | `#5A4416` | `[estimate]` |
| Skin (tanned) | `#B07A55` / `#E8B48A` / `#FFD9BC` | `[estimate]` |
| Eyes | iris `#3E9BD6`, catchlight `#FFFFFF` | name verified |
| Jacket / overall yellow | `#B8811A` / `#F2B62E` / `#FFDD73` | name verified |
| Hood (white) | `#B9B3A4` / `#F0EDE2` / `#FFFFFF` | name verified |
| Dungaree navy-black | `#171A26` / `#2B3145` / `#464E68` | `[estimate]` |
| Left pauldron/armour (blue) | `#20486E` / `#3C79AE` / `#6FAFDC` | name verified |
| Black glove (right hand) | `#14141A` / `#24242E` | name verified |
| Shoes yellow+black | `#F2B62E` + `#1A1A20` | name verified |
| Abes pendant / logo | `#9BA3AD` / `#D8DEE4` | name verified (silver) |
| Belt chain | `#7C8290` / `#BFC6CF` | `[estimate]` |

**Brotherhood sword.** Verified (FF Wiki *Brotherhood (weapon)*, `[single source]`): a **longsword terminating in a long hook**, with a **shimmering blue, water-like blade**; grip wrapped in **brown** material; a **red ribbon** hangs from the pommel; the guard is **black** and extends only over the **back** of the blade.

| Sword part | Ramp | Pixel note |
|---|---|---|
| Blade body | `#1E5F8C` / `#3FA3D6` / `#9BE4FF` | 3 px wide, 30 px long; inner 1 px column is the light step to fake translucency `[estimate]` |
| Blade caustics | animate a 1 px `#C9F4FF` band drifting tip→hilt over 1.2 s | `[estimate]` |
| Hook tip | blade curves forward 4 px at the last 6 px of length | verified shape |
| Guard (back only) | `#101018` / `#26262F` | verified |
| Grip | `#5A3C22` / `#8A5C33` | verified |
| Pommel ribbon | `#8E2020` / `#D33A3A` — 2 px wide, 7 px long, sine-sways ±2 px | verified |

**Idle stance.** Weight on the back (right) foot, left shoulder (the armoured one) angled forward toward camera, sword held low in the right hand with the tip near the ground and slightly behind, left hand loose and open. 4-frame breathing loop at 6 fps: torso rises 1 px on frames 2–3, hair fringe lags 1 frame behind. `[estimate]`

**Attack animation idea (6 frames, 10 fps).** Frame 1 anticipation — crouch 2 px, sword drawn back past the right hip; frame 2 step-in 4 px toward target; frames 3–4 rising diagonal slash with a 5-frame arc-trail sprite in `#9BE4FF` at 50%→0% alpha; frame 5 overshoot with hair and ribbon streaming; frame 6 recovery into idle. A 3-frame water-droplet burst (`--pyre-white`, 1 px motes) on contact sells the "liquid blade". `[estimate]`

**Victory pose idea.** Throw the sword up, catch it, sweep it once in front of the body, then rest it on the shoulder with a grin — this is the canonical Tidus victory gesture, confirmed indirectly by FF Wiki's *Warrior (X-2)* entry, which describes Yuna's Warrior victory pose as "mimicking Tidus's pose in *Final Fantasy X*" `[single source]`.

> **Silhouette.** A spiky sunburst of hair on a lean, athletic teenager with one heavy, blocky shoulder (the blue pauldron) and one bare — that asymmetry is the whole read. His legs are deliberately mismatched: one trouser leg cropped high at the thigh, the other long to the ankle, so the lower silhouette is never symmetrical. The Brotherhood hangs low and forward, a long straight bar that kinks into a hook at the tip, with a 2 px ribbon flickering off the pommel. If you squint, he is: sunburst / one square shoulder / uneven legs / hooked bar.

---

### 1.2 Yuna — FFX, summoner with staff

**Verified** (FF Wiki *Yuna* §Appearance, `[single source]`): a **purple pleated, flower-patterned hakama**; **black boots**; a **black spaghetti-strap camisole** under a **white sash** that wraps around her neck and over her chest; a **yellow patterned obi** with a chōchō-musubi knot and a decorative obidome; two separate **kimono-like pink and white sleeves** secured by **purple cords**; shoulder-length brunette hair; a **blue-beaded earring** on her right ear with gold rings around the middle bead; a **silver hibiscus necklace** and matching pinky ring; a silver ring on the left middle finger and two bracelets (one beaded, one silver) on the right wrist. **Heterochromia: left eye blue, right eye green** — the green marks her half-Al Bhed heritage but *without* the Al Bhed spiral. Her staff design is based on the Buddhist **khakkhara**.

| Part | Ramp | Confidence |
|---|---|---|
| Hair (brunette) | `#4A2E1E` / `#7A4B2E` / `#A9714A` | name verified |
| Skin (fair) | `#C08A6A` / `#F0C4A2` / `#FFE4CC` | `[estimate]` |
| Left eye | `#2E7FC4` | verified |
| Right eye | `#4FA860` | verified |
| Hakama (purple) | `#3A2350` / `#5E3C7E` / `#8B64AD` | name verified |
| Hakama flower print | `#C9A0DD` 1 px dots, 5 px lattice | `[estimate]` |
| Obi (yellow) | `#B08418` / `#EFC133` / `#FFE58A` | name verified |
| White sash / chest wrap | `#B9B3A4` / `#F2EFE6` / `#FFFFFF` | name verified |
| Camisole (black) | `#131018` / `#221E2B` | name verified |
| Sleeves — pink half | `#A9556B` / `#E8899F` / `#FFBACB` | name verified |
| Sleeves — white half | `#C4BFB2` / `#F6F3EA` | name verified |
| Sleeve cords (purple) | `#4A2E68` / `#7A4FA6` | name verified |
| Boots (black) | `#15131C` / `#282433` | name verified |
| Hibiscus necklace | `#9BA3AD` / `#DCE2E8` | verified (silver) |
| Earring beads | `#2E6FA8` bead, `#E3B94A` ring | verified |

**Staff (khakkhara-derived).** Shaft 34 px, 2 px wide, `#6B4A2C` / `#9A6E42`. Head is a 9 px ring of `--yevon-gold` with 4 small pendant rings inside, each 2×2 px; the rings jingle — offset each by 1 px on alternate frames when she moves. A teal gem `#4FD0C0` sits at the ring's crown. `[estimate]` for hex; khakkhara basis verified.

**Idle stance.** Feet together and slightly pigeon-toed, staff planted vertically in the right hand (she wields it right-handed, per the wiki's laterality note `[single source]`), left hand resting at her chest. 4-frame idle: the sleeve hems and hakama pleats sway 1 px out of phase with the body's 1 px rise.

**Attack / cast animation idea (7 frames).** Staff raised overhead in a slow two-frame lift, a ring of Yevon glyph pixels (`--yevon-gold`, 1 px, 8 points on a 14 px radius) expands and fades beneath her feet, then she brings the staff down and forward; the summon/spell VFX spawns at the glyph centre. For the **Summon** action, she walks 6 px forward, spins the staff once overhead, and holds — the aeon's descent VFX then takes over the frame.

**Victory pose idea.** The prayer gesture of Yevon: feet together, staff cradled in the crook of the left arm, hands brought together in front of the chest, a shallow bow, then head lifted with a small smile. Two pyreflies (`--pyre-green`) drift upward past her on the last frame.

> **Silhouette.** A small, narrow figure whose upper body is a soft double-triangle: two wide bell sleeves that hang free of the shoulders and read as separate shapes with a gap of background visible between arm and sleeve. Below the waist she is a solid, near-rectangular column — the pleated hakama — so she has no visible leg separation at all until the black boots peek out at the hem. The vertical staff makes a hard 1-shape beside her, capped by a small gold ring. Squint read: two hanging bells / a skirted column / a gold-ringed pole.

---

### 1.3 Auron — FFX, katana, jug, sunglasses, coat

**Verified** (FF Wiki *Auron* §Appearance, `[single source]`): a **red haori** closed with a **black and blue strap** and **two brown belts**; his **left arm is tucked inside the haori** so it looks slung, and he **frees the left arm only when fighting** while the right arm stays in its sleeve; a **black armoured gauntlet on the right hand**, an armour brace on the left forearm; a **brown left shoulder pad** decorated with **tan, green and blue** patterns with a beaded ornament dangling from it; **black pants and shoes** with **brown straps and triangular metal plating**; a **black shirt with a high grey collar** and intersecting brown straps; **black hair with grey streaks** held back by a **gold ribbon**; stubble; a **scar on the right half of his face** over a permanently shut right eye; **left eye amber**; **black sunglasses**; a **jug on his right hip** marked "Nog" in Spiran script. His common katana model is a **steel-grey shobu-zukuri backsword** with **floral gold embossing** and a **long light-green handle wrap** with **golden fullers** and a pommel cap. Height 183 cm, age 35, black hair with grey streaks, brown eyes (infobox), right-handed.

| Part | Ramp | Confidence |
|---|---|---|
| Haori red | `#6E1414` / `#B02A2A` / `#D95A4E` | name verified |
| Haori inner lining | `#3A0F12` | `[estimate]` |
| Strap black+blue | `#14141C` + `#2A4E82` | name verified |
| Belts (brown ×2) | `#4A3118` / `#7A5228` | name verified |
| Shoulder pad brown | `#513418` / `#7E5626` | name verified |
| Pad pattern tan/green/blue | `#C9A868` / `#4E7A4A` / `#37628F` (1 px each) | name verified |
| Shirt black | `#101018` / `#1E1E28` | name verified |
| High collar grey | `#5C6068` / `#8B9099` / `#BCC2CA` | name verified |
| Hair black + grey streaks | `#141319` / `#26242E`, streak `#8E8C97` | name verified |
| Gold hair ribbon | `#A87C1C` / `#E3B94A` | name verified |
| Skin (weathered) | `#9A6749` / `#CF9A72` / `#EFC3A2` | `[estimate]` |
| Scar | `#8E5A4A` 1 px vertical over right eye | verified |
| Sunglasses | lens `#1B1B24` at 88% alpha, frame `#3A3A46` | name verified |
| Left eye (visible above lens) | `#D9A23A` amber | verified |
| Jug | body `#B9A87E`, band `#6A5230`, glyph `#3A2C18` | `[estimate]` |
| Gauntlet (right) | `#1C1C24` / `#333340` / `#54546A` | name verified |

**Katana.** Blade 40 px long, 3 px wide, **steel grey** `#6E7480` / `#A9B0BC` / `#E2E7EE`, with a 1 px `#E3B94A` floral embossing running the lower third; back-edge (mune) drawn as a 1 px `#4A4E58` line so the *back* sword shape reads. Handle 12 px, **light green** wrap `#7E9A6A` / `#A7C48C` crossed by 1 px gold fullers `#E3B94A`, plus a 2×2 gold pommel cap. Verified description; hex `[estimate]`.

**Idle stance.** Absolutely still — Auron never bobs. He stands 3/4 to camera, katana resting **on his right shoulder** (the blade's grooved back is literally designed for this, per the wiki), right hand on the grip, **left arm inside the haori** so the left sleeve hangs empty and flat. Idle loop is 2 frames at 3 fps and moves only the haori hem and the pendant bead 1 px.

**Attack animation idea (5 frames, 9 fps).** Frame 1 the left arm bursts out of the haori (the sleeve snaps outward 3 px — this single frame is the character's signature); frame 2 a two-handed downward chop; frame 3 impact with a thick 1-frame white flash quad and a 4 px screen shake; frames 4–5 he returns the blade to the shoulder and the left arm back inside. For **Banishing Blade**, insert three frames of him tipping the jug to his mouth and spraying a 6 px cone of `#D8C79A` droplets along the blade — verified as the in-game behaviour.

**Victory pose idea.** He turns his back three-quarters to camera, sheathes/shoulders the blade, and the coat settles; a single 2-frame head-turn brings the amber eye and the lens glint toward the player. No flourish, no smile.

> **Silhouette.** The widest, heaviest upper body in the party: a red slab of coat with one enormous squared shoulder pad and, critically, **one empty sleeve** — his left arm is inside the coat, so that side of the silhouette is a smooth, armless curtain while the right side has a gauntleted arm and a blade lying across the shoulder. A jug bulges off the right hip, breaking the coat's line. Squint read: red trapezoid / one square shoulder / one limp sleeve / a long bar angled up-right off the shoulder.

---

### 1.4 Wakka — FFX, blitzball

**Verified** (FF Wiki *Wakka* §Appearance, `[single source]`): tall and muscled, **tan skin, brown eyes**, **long reddish-orange hair styled into a coif** and girt with a **blue headscarf**; the **Besaid Aurochs** uniform with captain's alterations — a **yellow vest top cut away at the stomach**, a **yellow shoulder pad on the left shoulder**, **blue and yellow baggy trousers gathered above the ankle**, **brown wristbands** with a **blue-and-yellow armguard over the left arm**, and **open sandals**; a **dolphin necklace** and a **silver stud earring on the left ear**. Age 23, height 188 cm, weapon: blitzballs.

| Part | Ramp | Confidence |
|---|---|---|
| Hair reddish-orange | `#8E3A12` / `#DB6A22` / `#FF9C4E` | name verified |
| Headscarf blue | `#1E3F6E` / `#345F99` / `#5C8FC9` | name verified |
| Skin (tan) | `#8A5636` / `#C08252` / `#E3AA7C` | name verified |
| Vest yellow | `#B8811A` / `#F0BC2E` / `#FFE07A` | name verified |
| Shoulder pad yellow | same ramp, +1 px `#6E4A0E` outline | name verified |
| Trousers blue | `#1B3A63` / `#2F5E96` / `#4F8AC4` | name verified |
| Trouser yellow banding | `#F0BC2E` 2 px stripes at hem | name verified |
| Wristbands brown | `#4E341A` / `#7C5528` | name verified |
| Armguard (left) blue+yellow | `#2F5E96` + `#F0BC2E` | name verified |
| Sandals | `#5A3F22` strap, bare toes in skin ramp | name verified |
| Dolphin necklace | `#C9CFD6` | name verified |
| Tattoo (Aurochs mark, chest/arm) | `#2E4A6B` 1 px | `[estimate]` — pattern not documented |

**Blitzball weapon.** 9 px diameter sphere. Verified as the Besaid Aurochs ball; render as a panelled ball: base `#E8E2D2`, panel seams `#2E4A6B` 1 px, two `#DB6A22` curved bands, 2 px specular `#FFFFFF` upper-left. `[estimate]`

**Idle stance.** Feet wide, knees loose, chest open, the ball spinning slowly on the fingertips of his right hand (4-frame seam rotation). His coif does **not** move — it is treated as a solid helmet-like shape, which is exactly what makes him readable.

**Attack animation idea (6 frames).** A blitzball throw: wind-up with the ball drawn behind the head (frame 1–2), a full step-through, then the ball **leaves the sprite as its own projectile entity** that arcs to the target with a 3-sample motion trail, bounces off, and returns to his hand on the recovery frames. The ball projectile is the cheapest and most readable ranged attack in the game — reuse the same entity for his Overdrive (Slots) with a `#F0BC2E` glow added.

**Victory pose idea.** He bounces the ball off his knee, catches it, tucks it under one arm and throws a thumbs-up at the camera with a wide grin.

> **Silhouette.** Tallest of the human party and built like a swimmer: broad triangular shoulders narrowing to a tight waist, with a bare midriff band of skin splitting the yellow vest from the blue trousers — that horizontal skin stripe is his fastest identifier. The hair is a single solid orange wedge swept up and back off a blue headband, a shape more like a flame or a fin than hair, and it should never be broken into strands at 64 px. One shoulder carries a yellow pad, and a small bright ball sits at the end of one hand. Squint read: orange fin / wide yellow triangle / skin stripe / blue trousers / one dot.

---

### 1.5 Lulu — FFX, belt dress, moogle doll

**Verified** (FF Wiki *Lulu* §Appearance, `[single source]`): a **low-cut dark-grey and black dress**, with **two crossed belts on the upper part of each sleeve**; the décolletage is **trimmed in fur**; hem and sleeves have **ornate lace edges**; the **lower front of her gown is made of a collection of interlaced belts**; she wears a **corset** and **lace-trimmed thigh-high stockings**; **her in-game models have no legs** beneath the dress (they were never modelled). **Red irises** — one of very few in the series. Hair **braided in cornrows leading into a bun and long braids**, with a long forelock; the braids are tied with **four ornamented pins** (possibly the four elements) and **four bead-tipped braids** fall from the knot. Accessories: a necklace of **purple round beads**, a small **white bead** necklace, another of **red and blue beads**, rings, many earrings. **Purple makeup and nail polish.** Weapon class: dolls. Height 167 cm barefoot.

| Part | Ramp | Confidence |
|---|---|---|
| Dress dark grey/black | `#100F16` / `#22202B` / `#3A3746` | name verified |
| Belt lattice (lower gown) | `#2C2733` strap, `#7A7280` buckle 1 px | name verified |
| Fur trim (décolletage) | `#3A3644` / `#6A6474` / `#9C96A6` (dithered edge) | name verified |
| Lace edging | `#8E86A0` 1 px alternating with transparent | name verified |
| Corset | `#191720` with `#5C5468` lacing | name verified |
| Stockings | `#1A1822` with `#8E86A0` lace band at thigh | name verified |
| Hair black | `#0E0D14` / `#1E1C28` / `#36323F` | name verified |
| Hair pins (×4) | `#E3B94A` / `#FFE79B` | name verified |
| Braid beads | `#B5486E`, `#3E6FA8`, `#E3B94A`, `#D8D2C4` | name verified (red/blue/etc.) |
| Skin (pale) | `#B98D78` / `#E8BFA6` / `#FFE0CC` | `[estimate]` |
| Eyes | `#C7343C` iris | verified (red) |
| Lips / eyeshadow | `#7E3A72` / `#A8558F` | name verified (purple) |
| Bead necklaces | purple `#7A4FA6`, white `#EFEAE0` | name verified |

**Moogle doll weapon.** 14 px tall, held at hip height. Body `#F2ECDF` / `#FFFFFF`; wing flaps `#E8B7C8`; the antenna bobble is a 3 px `#F05A7E` sphere on a 1 px `#C9C3B6` stalk; two black 1 px eyes; a small purple stitched mouth. It is a **doll**, not a live moogle: give it slack, floppy limbs that lag 2 frames behind her motion, and let it dangle from one hand in idle. `[estimate]` for hex.

**Idle stance.** Essentially motionless from the waist down (she has no legs to animate). All the idle life is in: the forelock swaying 1 px, the four bead-braids swinging on a 1-frame offset from each other, the fur trim breathing, and the doll rotating slowly on its hand. 6-frame loop at 5 fps.

**Attack / cast animation idea (8 frames).** She raises the doll in her left hand and snaps her right hand open; the doll flails, and the spell's element erupts from **above** the target rather than from her body — Lulu's magic in this game reads as "she conducts, the sky obeys". Charge tell: a ring of 6 elemental motes orbits her at 10 px radius for 3 frames before release. Her Overdrive (Fury) repeats the cast 3–8 times, so build the cast as a loopable 4-frame sub-clip.

**Victory pose idea.** She turns her head away from the camera, tosses the forelock, and hugs the moogle doll to her chest with both arms — the single softest gesture in the party.

> **Silhouette.** A tall black teardrop: narrow, corseted waist flaring into a floor-length gown that never shows a foot or a leg, so she appears to hover on a solid dark base. The top of the silhouette is spiky and ornamental — a bun crowned with four gold pins and four long bead-tipped braids that swing independently — which contrasts hard against the smooth black cone below. A small pale lumpy shape (the moogle doll, with its tiny pink pom) hangs off one hand, the only bright value on her. Squint read: spiky crown / thin waist / black cone / one pale blob at hip height.

---

### 1.6 Kimahri Ronso — FFX, broken horn, spear

**Verified** (FF Wiki *Kimahri Ronso* §Appearance and *Ronso* §Profile, `[single source]` each): **blue fur**, **white hair and beard**, leonine, tall, muscular, with a **tail**; a **broken horn on his forehead**, a source of great shame among Ronso; **pierced ears**; hair **held back in a ponytail and braided on the sides**; he wears no clothing for warmth because of the fur — only **leather straps holding arm guards and a chest piece with a skull motif**, **ankle guards**, and a **sash tied around his waist with a red belt**; his **shoulder guards have tufts of white feathers or fur**. Height 204 cm, hair grey, **eyes yellow**, age 25, weapon class: spears.

| Part | Ramp | Confidence |
|---|---|---|
| Fur (blue) | `#22467A` / `#3D74B8` / `#6BA3DC` | name verified |
| Fur belly/chest lighter | `#4C83C0` / `#84B6E0` | `[estimate]` |
| Mane / hair / beard (white) | `#8C93A6` / `#D8DDE8` / `#FFFFFF` | name verified |
| Horn (broken stump) | `#8E7A52` / `#C6AE78` / `#EBD9A8` | `[estimate]` |
| Eyes | `#F2C63A` with a 1 px black slit pupil | verified (yellow) |
| Leather straps | `#3E2A14` / `#6A4620` | name verified |
| Chest piece (skull motif) | plate `#7B8290` / `#B6BDC8`; skull `#E9E3D2` 3×3 px | name verified |
| Shoulder tufts | `#D8DDE8` fluffy dithered edge | name verified |
| Sash | `#2C3E5E` / `#456489` | `[estimate]` |
| Waist belt (red) | `#7E1F1F` / `#BE3434` | name verified |
| Ankle guards | `#7B8290` / `#B6BDC8` | name verified |
| Nose / inner ear / palms | `#2A2F4A` | `[estimate]` |

**Broken horn — the single most important detail.** Draw the **left** horn as a full, curved 9 px spiral and the **right** as a **4 px jagged stump with a flat, chipped top**. The asymmetry must survive at 64 px; at smaller sizes, exaggerate the intact horn's length by 2 px rather than lose the contrast. Verified.

**Spear.** 46 px haft (`#4E3418` / `#7E5626`) with a leaf-shaped 10 px head in `#A9B0BC` / `#E2E7EE` and a `#E3B94A` collar where head meets haft. Two blue feather-charms hang from the collar. `[estimate]`

**Idle stance.** Low, wide, quadruped-adjacent: knees deeply bent, torso pitched forward ~15°, spear held diagonally across the body in both hands, tail sweeping a 4 px arc on a slow 8-frame loop. His shoulders rise 2 px on the breath (double the human party's 1 px) to sell his mass.

**Attack animation idea (5 frames).** A leaping overhead **Jump**: frame 1 crouch, frames 2–3 the sprite **leaves the frame entirely** (offscreen for ~0.35 s), frame 4 he re-enters from the top of the frame with the spear point down and a 3 px impact ring of dust, frame 5 recovery. For basic attacks, a two-handed horizontal sweep with a wide crescent trail in `#6BA3DC`.

**Victory pose idea.** He plants the spear butt-first into the ground with a small dust puff, folds his arms, and gives a single slow nod — then touches the broken horn once, briefly, with two fingers.

> **Silhouette.** The biggest and heaviest party shape by far: a hunched, wide-shouldered blue cat-man whose outline is dominated by a shaggy white mane erupting from the shoulders and neck, so his upper half reads as a fluffy irregular cloud sitting on a hard-edged muscular body. The head profile is unmistakable because it is **asymmetric** — one long curved horn, one blunt broken stump — and a tail loops out behind the legs. A long straight spear crosses the body diagonally. Squint read: shaggy cloud / lopsided horns / thick crouching body / tail loop / diagonal pole.

---

### 1.7 Rikku — FFX, Al Bhed, claws

**Verified** (FF Wiki *Rikku* §Appearance, `[single source]`): slender and athletic; **medium-length blonde hair in a high ponytail with two braids hanging down, decorated with orange feathers**; two shorter sections part to her **left** and frame the face; a pair of **bobby pins, one blue and one green**, crisscross the left side; **Al Bhed trademark green eyes with swirled pupils**. Outfit: **flared green dolphin shorts** with an **orange belt**, an **orange sleeveless tank-top** with side straps and **two long blue ribbons hanging from the back**, a pair of **goggles around her neck**, boots, a **gauntlet and arm guard on the right arm**, a **large protective forearm mitt on the left**, a **pouch on the right thigh** for alchemy materials, and **yellow-painted fingernails**. Height 157 cm, age 15, weapon class: claws.

| Part | Ramp | Confidence |
|---|---|---|
| Hair blonde | `#A88420` / `#EFD055` / `#FFF3A6` | name verified |
| Feather charms (orange) | `#C25A16` / `#F58A2E` | name verified |
| Bobby pins | `#3E7FC4` (blue), `#4FB05E` (green) | name verified |
| Eyes (Al Bhed green + spiral) | iris `#5FC96A`, spiral 1 px `#1E5A2A` | verified |
| Skin (tanned) | `#A8704A` / `#E0A87C` / `#FFD2AC` | `[estimate]` |
| Tank top orange | `#B04E12` / `#EC7B22` / `#FFAA5C` | name verified |
| Shorts green | `#2C6B3A` / `#4CA05C` / `#7DC98C` | name verified |
| Belt orange | `#C25A16` / `#F58A2E` | name verified |
| Back ribbons (blue ×2) | `#2C63A0` / `#4E92D4` — 2 px wide, 16 px long | name verified |
| Goggles | lens `#F0C24A`, rim `#5C5C68`, strap `#3A3A44` | `[estimate]` |
| Right gauntlet/arm guard | `#7B8290` / `#B6BDC8` | name verified |
| Left forearm mitt | `#6A5230` / `#9A7A48` | name verified |
| Thigh pouch (right) | `#5A4022` / `#8A6636` | name verified |
| Boots | `#4A3A26` / `#7A6242` | name verified |
| Fingernails | `#F0C24A` 1 px | name verified |

**Claws.** Not blades — a **bladed gauntlet**: three 6 px talons projecting past the knuckles of the right hand, `#9BA3AD` / `#E2E7EE`, with an `#EC7B22` wrap at the wrist. `[estimate]` for hex; weapon class verified.

**Idle stance.** Bouncy. She is the only party member with a 2 px vertical bounce in idle and she shifts weight foot-to-foot on an 8-frame loop. Hands at hip height, fingers splayed. The ponytail and the two blue back-ribbons trail on a 2-frame delay from every motion — this trailing is her signature and should be implemented as a simple 3-segment verlet chain if the engine allows.

**Attack animation idea (6 frames).** A fast three-hit flurry: two claw swipes at 12 fps plus a spinning backhand, with a 2-frame `#FFD2AC` after-image ghost of the previous pose at 35% alpha. Her **Mix / Item** action instead has her pull two items from the thigh pouch, shake them together overhead, and lob the result — 5 frames, with a 4 px `#5FC96A` flask silhouette.

**Victory pose idea.** She leaps, punches the air with both fists, lands in a crouch, then springs up flashing a V-sign next to her face.

> **Silhouette.** The smallest and springiest party outline: a compact teenager whose head is topped by a high, fan-shaped blonde ponytail with two thin braids and a pair of feathers dropping from it, plus **two long blue ribbons that trail behind her from the back of the top** and give her motion a comet-tail. Her arms are deliberately mismatched — a slim metal gauntlet with talons on one side, a bulky padded mitt on the other — and a goggle ring sits at her throat. Legs are bare and short below flared shorts. Squint read: fan ponytail / two trailing streamers / one spiky hand, one fat hand / short bare legs.

---

### 1.8 Seymour Flux (with Mortiorchis)

> **CORRECTION TO THE BRIEF.** The brief says "Seymour Flux (with Mortibody)". This is not right and implementers should not follow it. Per the Final Fantasy Wiki: **Seymour Flux** is fought at **Mt. Gagazet (the Prominence)** and "summons **Mortiorchis**, upon which he sits" `[single source]`. **Mortibody** is a *different* companion entity, fought with **Seymour Natus** at the **Bevelle Highbridge** `[single source]`. Since our encounter is the Gagazet fight, the correct mount is **Mortiorchis** (Japanese 幻光祈機, lit. "Pyre-praying Machine"). Mortibody is 幻光異体, "Pyrebody". Both entities share the `Mortibsorption` self-revive mechanic, which is probably the source of the confusion.

**Seymour base design (verified, FF Wiki *Seymour Guado* §Appearance, `[single source]`):** tall Guado–human hybrid, **purple eyes**, **light blue hair** with **two long horn-like locks running down his back** and a **large bang falling over his face**; **ornate robes predominantly dark blue with red trimmings and a green sash**; the robe **above the waist is open, exposing his chest with leonine tattoos**; **sleeves fall to partially cover his hands**; as a half-Guado his **fingers are more pointed** than a human's but not as long as a full Guado's, his **ears are rounded** (unlike Guado elf ears), and the **veins on his face are pronounced**, with more veins **arching over his stomach**. Height 187 cm.

| Part | Ramp | Confidence |
|---|---|---|
| Hair light blue | `#4E7FA8` / `#8FC3E0` / `#C6E6F6` | name verified |
| Skin (pallid) | `#9E7E8E` / `#D4B4BE` / `#F0DCE2` | `[estimate]` |
| Facial veins | `#6E4E78` 1 px, branching from temples | verified as feature |
| Eyes | `#7E5FC4` purplish-blue | verified |
| Robe dark blue | `#141E42` / `#26386E` / `#42589E` | name verified |
| Robe red trim | `#7E1A1A` / `#C03030` | name verified |
| Sash green | `#2C5E3E` / `#4E9060` | name verified |
| Chest tattoos (leonine) | `#3E2A4E` 1 px scrollwork | verified as feature |
| Fingertips (pointed) | darken last 1 px to `#6E5060` | verified |

**Flux transformation.** In this third unsent form Seymour sits enthroned on the machine. Practical spec: he is **cross-legged, floating in the mount's cradle at ~55–65% of the frame height**, arms spread wide, robes billowing downward into a 20 px tattered fringe that fades to 40% alpha at the bottom. Add 4 detached, slowly-orbiting robe fragments as separate 6×10 px billboards to sell the unsent/pyrefly dissolution. `[estimate]` for the specific staging; "sits upon Mortiorchis" verified.

**Mortiorchis (the mount).** No published visual description exists beyond the name (which decodes as "pyre-praying machine") and one third-party characterisation as a "strange-looking knight creature" `[single source, weak]`. **Design directive (declared `[estimate]`):** a wide, ribbed, skeletal machina *reliquary* — a bone-and-brass cage shaped like a ribcage/censer, ~192 px wide and 120 px tall, with:

| Element | Spec |
|---|---|
| Cage ribs | 7 curved 2 px ribs, `#A99060` / `#D8C089`, framing a hollow centre |
| Inner void | `#0B0A12` at 85%, with 3 drifting `--pyre-green` motes |
| Arm blades (×2) | long curved scythe arms, 40 px, `#7B8290` / `#C6CDD8` |
| Hanging censer | a swinging 10 px brass bowl beneath centre, emitting a smoke column |
| Yevon glyph | `--yevon-gold` rosette, 14 px, floating 6 px above the cage, always facing camera |
| Idle motion | the whole mount **counter-rotates** ±4° on a 3 s sine; the glyph rotates the other way |

**Attack animations.** *Lance of Atrophy* — Seymour thrusts an arm forward and a 30 px violet spear (`#6E3A8E` / `#B072D8`) lances the target, leaving the green `Zombie` icon; *Cross Cleave* — the mount's two scythe arms sweep an X across the whole party, 4 frames, full-width `#C6CDD8` cross flash; *Total Annihilation* — a 2-turn charge where the inner void brightens from `#0B0A12` to `#E9FFF4` over two turns, then a full-screen white-out. These attack *names and mechanics* are verified `[single source]`; the visual staging is `[estimate]`.

> **Silhouette.** Read as one composite object, not two: a wide, horizontal, ribbed metal cradle — like a ribcage laid on its side or a swinging censer — with a slender seated man floating inside its mouth, arms flung open, robes streaming down through the cage into a ragged fringe. Two long curved blades extend from the cradle's sides like insect mandibles, and a small gold rosette hovers above the whole assembly. The man's head is topped by a heavy forward-falling bang with two long horn-like locks trailing behind. Squint read: wide ribbed bowl / small crucified-looking figure in its centre / two curved pincers / one gold dot above.

---

### 1.9 Yunalesca — forms 1, 2, 3

**Verified form-1 appearance** (FF Wiki *Yunalesca* §Appearance, `[single source]`): **long silver hair that splays out around her in tendrils during battle**; a **blue headband with four ribbons finished with blue beads and yellow tassels**; the headdress has **two long plumes that zigzag into an 'M' shape**; **yellow eyes**; a **blue-and-black bra with a curlicue design linked in front by a yellow chain**; a **black thong**; a **thin yellow-tasselled belt**; **gold bracelets**; **blue armbands and wristbands**; **green sashes decorated with Yevon symbols**; **silver anklets**; a **blue garter on the left thigh**; a **blue bead necklace resembling seashells or fangs**; **barefoot**.

**Forms 2 and 3** (`[single source]`, secondary wiki + guide summary): form 2 is "more demonic, with **tendrils emanating from her body and elevating her into the air**"; form 3 reveals "a **Medusa-like creature attached to her body**, comprised of a **gigantic gorgon-esque face** and **snake-like locks of 'hair'**, while her original diminutive form sits **on a bed of hair above**". It is compared to the Gorgons of Greek myth and to the *Final Fantasy VI* Goddess sprite.

| Part (all forms) | Ramp | Confidence |
|---|---|---|
| Hair silver | `#8E93A8` / `#D6DAE6` / `#FFFFFF` | name verified |
| Skin (porcelain) | `#B08E8E` / `#E6C8C4` / `#FCEAE4` | `[estimate]` |
| Eyes | `#F2D24A` yellow, no visible pupil | verified |
| Headband blue | `#1F3E78` / `#36609E` | name verified |
| Headdress plumes | `#D6DAE6`, zigzag 'M', 18 px span | verified |
| Head beads / tassels | `#3E6FA8` bead, `#E3B94A` tassel | verified |
| Bra blue+black | `#26407A` + `#12121C`, curlicue in `#4E7FC0` 1 px | name verified |
| Chest chain | `#E3B94A` 1 px links | verified (yellow chain) |
| Sashes green | `#2E5E44` / `#4F9068`, Yevon glyphs `#E3B94A` 3×3 px | name verified |
| Armbands / wristbands blue | `#2E568E` / `#5289C2` | name verified |
| Bracelets / anklets | gold `#E3B94A`, silver `#C9CFD6` | name verified |
| Bead necklace | `#3E6FA8` shells | name verified |

**Form 1 — "The Liberator" (72 px).** Standing, barefoot, weight on one hip, one arm raised in an inviting gesture. **Her hair is the animation**: 8 independent 1 px tendrils, each 20–30 px long, drifting on offset sine waves at 0.4 Hz, so she is never still even though her body is. Her counters (Blind/Silence/Sleep) should each flash a different 1-frame full-body tint: `#3A2E2E` blind, `#5E5E9E` silence, `#4E7E9E` sleep. `[estimate]` for staging.

**Form 2 — "Ascension" (112 px).** She is **lifted off the ground** by a root-mass of tendrils that erupt from below her hips; feet dangle, arms hang outward, head tilted back. The tendril mass is a 40×50 px organic clump: `#3E2A46` / `#6A4570` / `#9E6E9E`, with 1 px `#F2D24A` pulses travelling up individual strands every ~2 s. Her silver hair now merges visually with the tendrils at the crown. Attack tell for **Hellbiter** (the Zombie party-wide attack): the tendril mass opens into a 24 px toothed maw for 3 frames. `[estimate]` for staging; transformation verified.

**Form 3 — "Gorgon" (176 px).** The frame is now dominated by a **huge downward-facing gorgon face** occupying the lower 2/3 of the sprite — brow ridge, hollow sockets with `#F2D24A` glow, a wide lipless mouth — from which **dozens of snake-locks** radiate outward like a sunburst. Yunalesca herself is a small (36 px) figure reclining on a mat of hair at the **top** of the composition, tiny and serene. Colour the gorgon mass in a desaturated bone/violet: `#463A52` / `#7E6E86` / `#B8ADBE`, with snake-lock highlights in `#D6DAE6`. **Mega Death** tell: every socket and every snake eye lights `#F2D24A` simultaneously for 2 frames, then the screen tints `#2A0E1E` for 6 frames. `[estimate]` for staging; form verified.

> **Silhouette (progression).** Form 1 is a slim, nearly-nude dancer whose outline is mostly *hair* — a slow-moving corona of long silver tendrils around a small still body, crowned by a zigzag 'M' headdress that gives her a horned, moth-like head shape. Form 2 keeps that body but plants it on top of a writhing root-clump, so she becomes a figure impaled on a fountain of tentacles with her feet hanging free. Form 3 inverts the composition entirely: a colossal, radiating gorgon head fills the frame like a dark sunflower of snakes, and the woman is now a tiny reclining accent at its crown. The reading across the fight must be **small-and-elegant → suspended-and-wrong → enormous-and-monstrous**.

---

### 1.10 Braska's Final Aeon (forms 1 & 2) + Yu Pagodas

**Verified** (FF Wiki *Jecht* §Appearance and *Braska's Final Aeon* §Battle, `[single source]`): as Braska's Final Aeon, Jecht is "a **large, deformed version of his former self** with **brown scales and horns**, with **crests of spikes emerging from his back and shoulders**. He wears a **larger version of his headband**, his **hair is white** and emerges in **tufts from the spikes around his head**, and his **eyes glow**. His **Zanarkand Abes tattoo is white** and his body **below the waist has another large crest of spikes partially covering his legs**. His **right hand is of normal proportions** and wields his sword, while his **left hand is a large claw**." In the **second form** he "**draws a mighty sword from his chest** and **spikes that resemble wings emerge from his back**". Jecht's sword is "a **black sword with red markings that resemble dolphins**"; the Final Aeon wields a **larger version** of it.

| Part | Ramp | Confidence |
|---|---|---|
| Scales (brown) | `#4A3016` / `#7E5A2E` / `#B08A52` | name verified |
| Spike crests | `#332210` / `#5E4420` / `#8E6C38` | `[estimate]` |
| Horns | `#7E7058` / `#BCAE8E` | `[estimate]` |
| Hair tufts (white) | `#9A9A96` / `#E8E8E2` / `#FFFFFF` | name verified |
| Headband (enlarged) | `#8E1E1E` / `#CE3434` | name verified (red, from Jecht) |
| Eyes (glowing) | `#FF6A2E` core, `#FFD2A0` bloom | verified "glow"; hue `[estimate]` |
| Abes tattoo (white) | `#F2EFE6` on chest, 10 px | name verified |
| Left claw | `#5E5448` / `#96897A` / `#CFC3B2` | verified as feature |
| Sword — blade | `#101018` / `#26262E` / `#4A4A56` | name verified (black) |
| Sword — dolphin markings | `#C03030` / `#F06060`, 1 px, 3 dolphin curls | name verified |

**Form 1 (160 px).** Hulking, hunched, standing on thick digitigrade legs veiled by a downward spike-crest skirt. The **asymmetry is the whole design**: a human-proportioned right arm holding a huge black sword, and a grotesquely oversized left claw. Idle at 4 fps, 2 px shoulder rise, glowing eyes pulse on a 1.6 s sine between 70% and 100% brightness.

**Form 2 (176 px).** Transition animation (8 frames, plays once): he plants the claw, arches back, **reaches into his own chest** and draws the sword out of it in a 3-frame pull with a `#F06060` light bleed from the wound, then **wing-spikes erupt from his back** in 2 frames — six 30–40 px spike blades fanned in a half-circle. After the transformation, his idle silhouette is ~40% wider. `Blade Blitz` (the all-party sweep) is a single 5-frame full-width horizontal slash with a 3-sample `#F06060` trail plus a CTB delay icon on every party entry.

**Yu Pagodas (×2, 56 px each).** These are the two flanking supports that heal him for 1,500 HP with *Power Wave* `[single source]`. No published visual description; **design directive `[estimate]`:** ornate floating stone-and-gold **pagoda finials** — a stack of three tapering tiers (widths 20/14/8 px) in `#6E6250` / `#A99A7E` / `#D8CBAB`, each tier ringed with `--yevon-gold` and hung with 4 tiny bells. They hover 10 px above the ground and bob out of phase with each other. *Power Wave* fires a concentric ring pulse of `--yevon-gold` from each pagoda toward the centre, converging on Braska's Final Aeon over 6 frames — this is a **critical readability requirement**, because the player must instantly see that killing the pagodas stops the healing.

> **Silhouette.** A mountain of a creature, hunched and top-heavy, with a hedge of long spikes bristling off the shoulders, back, and hips so its outline is jagged everywhere except the smooth scaled chest. It is violently **asymmetric**: one arm is a normal-looking man's arm gripping a huge black slab of a sword, the other is a swollen, oversized claw nearly as big as its torso. A red headband and a corona of white hair-tufts sit on a horned head with two burning points for eyes. In form 2 a fan of six wing-like spikes erupts behind the shoulders, roughly doubling the width. Squint read: spiked mountain / one small arm + one giant claw / black slab / two orange dots / (form 2) spike fan.

---

### 1.11 Jecht (human)

**Verified** (FF Wiki *Jecht* §Appearance, `[single source]`): dark-skinned, muscular, with **long unruly black hair** and **red eyes**; **black shorts** with an **orange and red sash covering his right leg**; a **red headband**; a **metal gauntlet and pauldron covering his left arm**; **barefoot**; **no shirt**; his outfit is a **Zanarkand Abes jumper with the straps undone**; a **black Zanarkand Abes tattoo on his chest**.

| Part | Ramp | Confidence |
|---|---|---|
| Skin (dark, muscular) | `#5E3A22` / `#96613A` / `#C68B5C` | name verified |
| Hair black, unruly | `#0E0D12` / `#1E1C24` / `#3A3742` | name verified |
| Headband red | `#8E1E1E` / `#CE3434` / `#F06A6A` | name verified |
| Eyes | `#D8302E` | verified (red) |
| Shorts black | `#131318` / `#24242C` | name verified |
| Sash orange+red | `#E07A1E` over `#B02A2A` | name verified |
| Left pauldron + gauntlet | `#5E6470` / `#98A0AC` / `#D2D8E0` | name verified |
| Chest tattoo (Abes) | `#111015`, 10 px | name verified |

**Staging note.** Jecht appears only in the Dream's End pre-battle scene, standing on the central platform with his back half-turned. Use a 3-frame turn-to-camera, then the transformation wipe into Braska's Final Aeon (a vertical column of `--pyre-white` motes rises around him over 10 frames and the BFA sprite crossfades in behind it).

> **Silhouette.** Tidus's design run through ten more years and thirty more kilos: shirtless, heavily muscled, barefoot, with a mane of black hair held off the face by a headband. The **left arm alone is armoured** — a blocky pauldron and gauntlet — mirroring his son's asymmetry, and a sash hangs down over the **right** leg only, so both the shoulder line and the leg line are lopsided in opposite directions. Squint read: bare dark triangle of torso / one metal shoulder / mane / one draped leg.

---

### 1.12 Yu Yevon

**Verified** (FF Wiki *Yu Yevon* §Profile, `[single source]`): "a bizarre, **floating creature with hooks** and a **glowing emblem of Yevon for a face**"; he also briefly appears as "**a floating ball of light similar to a pyrefly**"; compared in the same source to a **tick** — a parasite. He has **no dialogue** and is never shown in human form. Note also that the Yevon script derives from Siddham/Sanskrit bonji and **Yevon's emblem is the script's first letter, "A"**, which on close inspection resembles a robed figure with long sleeves and a large collar, its head at the centre of the "eye".

| Part | Ramp | Confidence |
|---|---|---|
| Body carapace | `#2A2438` / `#463A56` / `#6E5E80` | `[estimate]` |
| Hooks / legs (6–8) | `#1A1622` / `#38303E` | verified as feature |
| Face emblem (Yevon glyph) | glow core `#FFF6D2`, ring `#E3B94A`, halo `#F7E08E` at 40% | verified "glowing emblem" |
| Pyrefly form | 6 px `--pyre-white` core + 14 px `--pyre-green` halo | verified |

**Design directive (`[estimate]` for everything but the face and hooks):** a 96 px floating tick-like body — a swollen, segmented abdomen hanging beneath a small thorax, with **six to eight long hooked legs** curling forward like grapples. The **face is not a face**: it is a flat, front-facing, self-illuminated Yevon glyph disc, 22 px across, that always billboards toward camera regardless of the body's rotation. The body rotates slowly (±8° over 4 s) and **never touches the ground**; it casts no contact shadow, only a faint `--pyre-green` ground glow. When it possesses an aeon, spawn a stream of 12 `--pyre-green` motes from the glyph into the aeon over 0.8 s.

> **Silhouette.** A bloated floating parasite: a heavy, segmented sac of a body with a cluster of long, curling hooks reaching forward from beneath it, like a tick or a grappling claw. Where a head should be there is instead a flat, bright, perfectly circular glyph hanging in front of the mass, brighter than anything else in the scene, so the eye goes straight to it. The thing never rests on the ground and its legs never brace — it hangs. Squint read: dark sac / forward-curling hooks / one blazing gold disc.

---

### 1.13 Aeons (FFX)

Aeons are summoned, so each needs a **descent animation** as well as idle/attack. Common descent grammar (`[estimate]`): the camera tilts up, a 30 px Yevon seal glyph in `--yevon-gold` unfurls in the air (verified: each aeon has an associated Yevon-script symbol annotated with a kanji — Valefor 無 *nothing*, Ifrit 炎 *flame*, Ixion 雷 *thunder*, Shiva 氷 *ice*, Bahamut 光 *light*, Anima 闇 *darkness*, all `[single source]`), the aeon arrives through it, the glyph shatters into motes.

| Aeon | Verified appearance | Palette | Seal kanji |
|---|---|---|---|
| **Valefor** | "a large, **avian** creature notable for her **dragon-like wings**… attacks with her **strong talons**. Some of her body is covered in **red feathers** and she has a **long lizard-like tail**." `[single source]` | Feathers `#8E2A22`/`#C94A38`/`#E8836A`; underwing membrane `#E0B06A`; beak/talons `#E8DCC0`; eyes `#F2D24A` `[estimate]` | 無 `[single source]` |
| **Ifrit** | "a **humanoid, demonic-looking beast**… **reddish brown complexion** with **light red hair**, and a **bulky** appearance. He always appears **hunchback**." `[single source]` | Hide `#5E2A1A`/`#96442A`/`#C4704A`; mane `#E0603A`/`#FF9A6A`; horns `#D8C8A8`; flame `#FF7A2E`→`#FFE08A` `[estimate]` | 炎 `[single source]` |
| **Ixion** | "resembles a **unicorn**, with a **long, golden horn** and **dark blue skin** and **grey mane and tail**. He has **gold bracers on his front legs**." `[single source]` | Hide `#1E2A52`/`#33477E`/`#546BAE`; mane `#8E94A4`/`#D2D8E4`; horn + bracers `#E3B94A`/`#FFE79B`; arc VFX `#B8E4FF` `[estimate]` | 雷 `[single source]` |
| **Shiva** | "**slim**… **feminine and humanoid**, wears **limited clothing**… notable for her hair, **tied up in long, bright blue dreadlocks**." `[single source]` | Skin `#9EC6D8`/`#D2EAF4`/`#FFFFFF`; dreadlocks `#1E6FA8`/`#3FA8DC`/`#84D8F6`; ice `#C6ECFF` at 70% alpha `[estimate]` | 氷 `[single source]` |
| **Bahamut** | "a large, **black dragon** with **enormous red wings**. He can stand or move in either a **bipedal or quadrupedal** fashion." `[single source]` | Scales `#0E0E16`/`#22222E`/`#3E3E4E`; wings `#7E1414`/`#BE2A2A`/`#E85A4A`; horns `#C6BCA6`; Mega Flare core `#B8E4FF`→`#FFFFFF` `[estimate]` | 光 `[single source]` |
| **Anima** | "a **towering two-part creature** whose **top half is heavily restrained**. The **lower half is a horned demon**. A **picture of her fayth hangs from her neck**, portrayed with a **glowing halo like a saint**." `[single source]` | Bandage/restraint `#6E6858`/`#A39A84`/`#CFC6AC`; chain `#5A5E68`/`#9298A4`; demon hide `#2A2038`/`#4A3A5E`; fayth frame `--yevon-gold`; halo `#FFF2C0` `[estimate]` | 闇 `[single source]` |
| **Yojimbo** | Entrance verified in detail: "With a wave of the summoner's staff, a **night-time dimension** forms, featuring a **single sakura tree in bloom with blue flowers**. A **bark** is heard, and Yojimbo's dog, **Daigoro**, appears… Yojimbo emerges from behind the tree, **turns with a sweep of his coat**… His **victory pose has him make a hand gesture and bow his head**. When dismissed… he **disappears into dust and cherry blossom petals**." `[single source]` | Coat `#1A1E2E`/`#2E3650`/`#4E5876`; hat brim `#2A2418`/`#4E4432`; mask `#B8A882`; blade `#D8DEE8`; sakura `#8FC8F0` (blue!) `[estimate]` | — |

**Aeon implementation notes.**
- **Anima** is the tallest and narrowest aeon (200×160 px cell) and should be **framed vertically**: the camera must tilt up on summon. Only her lower demon half touches the ground.
- **Ixion** is a quadruped; give him the widest ground-contact footprint (4 feet, contact shadow 60 px wide).
- **Yojimbo's arena is its own micro-scene**: swap the scene background to a night gradient (`#0A0E22` → `#1E2A4E`) with one silhouetted tree and a falling-petal particle emitter using **blue** petals (`#8FC8F0`) — the wiki explicitly says blue flowers, which is easy to get wrong.
- **Daigoro** the dog: 24 px, `#6E6258` / `#A89A88`, sits beside Yojimbo in idle, runs the frame for the *Daigoro* attack.

---

### 1.14 FFX-2 Yuna — Gunner (default) + dressphere looks

**Gunner (verified, FF Wiki *Yuna* §Appearance and *Gunner (Final Fantasy X-2)* §Profile, `[verified: 2 sources]`):** a **white top with pink lace trim** at the bottom bearing the **Zanarkand Abes insignia** in the middle, and a **pink hood**; **denim shorts**; a **brown belt with a brown, fringed pouch**; an **ankle-length cornflower-blue-and-white sash on her left hip**; **yellow arm bands on the upper arms**; a **black band on the left wrist**; **knee-high black boots with white laces**. She wields the **Tiny Bee** pistols. X-2 Yuna also keeps the **beaded earring** and **silver hibiscus necklace**, and her hair is **cropped shorter with a red braid hanging down to her ankles**.

| Part | Ramp | Confidence |
|---|---|---|
| Hair brunette (short) | `#4A2E1E` / `#7A4B2E` / `#A9714A` | verified |
| Red braid (ankle-length!) | `#7E1F22` / `#BE3034` / `#E86A6A` — 2 px wide, 40 px long | verified |
| Top white | `#B9B3A4` / `#F4F1E8` / `#FFFFFF` | verified |
| Pink lace trim | `#C46A8E` / `#F49BB8` | verified |
| Hood pink | `#B85E82` / `#EC8FAE` / `#FFC0D4` | verified |
| Abes insignia | `#2E3A52` 6 px | verified |
| Denim shorts | `#2E4468` / `#48679A` / `#6E8FC0` | verified |
| Belt + pouch brown | `#4E3418` / `#7E5626` | verified |
| Sash cornflower+white | `#6E90D8` + `#F4F1E8` | verified |
| Arm bands yellow | `#B08418` / `#EFC133` | verified |
| Wrist band black | `#18161E` | verified |
| Boots black, white laces | `#15131C` / `#282433`, laces `#F4F1E8` | verified |

**Tiny Bee pistols.** Two 10 px pistols, `#C9CFD6` / `#F0F4F8` with `#E3B94A` accents and a `#EC8FAE` grip wrap. Held one per hand; the second is drawn only for *Trigger Happy* (verified: "Gunners wield dual guns, with the second used during Trigger Happy").

**Gunner victory pose (verified):** "imitate shooting her gun and blow out smoke at the end of the barrel."

**Other Yuna dressphere looks** (all `[verified: 2 sources]` — FF Wiki dressphere pages + *Yuna* §Appearance):

| Dressphere | Verified Yuna look | Key hexes `[estimate]` | Victory pose (verified) |
|---|---|---|---|
| **White Mage** | Shin-length **white robe with purple trim** and **pink lining on the chest with yellow circle designs**; hood rimmed **pink with yellow crescent moons**; sleeve cuffs decorated with **yellow flames**; **white boots and gloves**; **hood up** | robe `#F2EFE6`, trim `#7A4FA6`, lining `#F49BB8`, circles/flames `#EFC133` | hops twice, then jumps with hands raised above her |
| **Black Mage** | Long **purple dress with brown trim and belt**, **slit on the right side**, a **pink strapped garment around the waist**; **pink legwarmers**; **black ankle boots**; a **large purple hat**; **black fishnet gloves** | dress `#5E3C7E`, trim `#7E5626`, straps `#F49BB8`, hat `#4A2E68` | jumps up in the air |
| **Warrior** | **Dark grey top with red x-shaped collar and teal accents**; **large shoulder pads**; dark grey sleeves that **cover her hands**; dark pants with **red belt and straps** and a **skirt-like front flap**; **grey-brown knee-high boots**; wields **Tidus's Brotherhood** | top `#3A3A44`, collar `#B02A2A`, teal `#3E9E96`, boots `#6E6252` | throws her sword up, catches it, swings it in front of her (mimics Tidus) |
| **Thief** | **White and red bikini top** with **blue and white ruffled sleeves**, **red gloves**; **white and blue miniskirt with red straps**; **blue t-strap shoes with white ruffles**; **red knee-high socks**; daggers are **teal and silver-purple** | white `#F4F1E8`, red `#C93A42`, blue `#4E8FD0`, daggers `#3ECBBC`/`#A99AC4` | jumps slashing the air, sheathes daggers on landing, hands behind her back |
| **Dark Knight** | **Indigo-tinted armour** over chest, arms, hips with **pink and teal accents**; **smoother** armour than the others'; **pink bikini bottoms**, **pink thigh covers**, **knee-high armoured boots**, a **crescent-shaped helmet**; wields **Tidus's Caladbolg** | armour `#2E2E5E`/`#4A4A88`, accents `#F49BB8` + `#3E9E96`, helm crest `#4A4A88` | drives her sword into the ground and rests arms + head on the hilt |
| **Samurai** | **Long blue dress with purple sides**, **slit in the front**, **bronze armour on hips and shoulders**; **black and orange flat boots**; a **bronze helmet with two long black adornments on the front**; wields **Spider's Kiss** | dress `#26386E`, sides `#5E3C7E`, bronze `#A9762E`/`#D8A354`, boots `#1E1E26`/`#E07A1E` | spins and holds her sword in front of her face |

**Spherechange transformation (see also §4.5).** Verified mechanic: spherechange can be done at any time, halts time, grants immunity to enemy attacks during the change, and permits an action immediately afterward `[single source]`. Visual spec `[estimate]`: a vertical column of light swallows the sprite for 12 frames — silhouette goes to pure `#FFFFFF` at frames 4–7 while a ring of 8 rotating dressphere motes orbits her — then the new outfit resolves. Budget ~0.8 s.

> **Silhouette (Gunner).** Much lighter and sharper than her FFX summoner shape: bare arms, bare midriff, short denim shorts, tall boots — all legs and angles where FFX-Yuna was all fabric. Two shapes define her: a **pointed pink hood** sitting behind the neck, and a single **very long red braid** that drops from the back of the head nearly to her ankles and trails behind every movement. A long pale sash hangs off her left hip to ankle length, giving one side a soft vertical drape against an otherwise crisp outline. Squint read: hood point / two small pistols / long red whip of braid / one hanging sash.

---

### 1.15 FFX-2 Rikku — Thief (default)

**Verified** (`[verified: 2 sources]`, FF Wiki *Rikku* §Appearance + *Thief (Final Fantasy X-2)*): her **longer hair is worn loose and braided, tied atop her head, adorned with colourful beads and held by a blue bandana**; she wears **earrings with pink upper halves and white lower halves**. Thief look: a **yellow bikini top** with **tan ruffled sleeves** and **brown fingerless gloves**; a **long red-and-yellow scarf** loose around the neck; a **blue headband**; **yellow bikini bottoms under a green mini-skirt** with a **yellow pouched belt**; **blue and white ankle boots**; **two red dagger-like blades** (described elsewhere as **red and gold**) for rapid attacks. Note one source says "yellow g-string bikini and olive green mini-skirt" — treat the skirt as **olive/mid green**.

| Part | Ramp | Confidence |
|---|---|---|
| Hair blonde (up) | `#A88420` / `#EFD055` / `#FFF3A6` | verified |
| Bandana blue | `#2C63A0` / `#4E92D4` | verified |
| Hair beads | `#EC7B22`, `#4E92D4`, `#4FB05E` 1 px each | verified ("colourful") |
| Earrings | top `#F49BB8`, bottom `#F4F1E8` | verified |
| Bikini yellow | `#B08418` / `#EFC133` / `#FFE58A` | verified |
| Ruffled sleeves tan | `#9A7A4E` / `#CFAF80` | verified |
| Gloves brown | `#4E3418` / `#7E5626` | verified |
| Scarf red+yellow | `#C93A42` + `#EFC133`, 3 px wide, 26 px long | verified |
| Mini-skirt olive green | `#4A5E24` / `#75913A` / `#A2BC62` | verified |
| Pouch belt yellow | `#EFC133` with `#7E5626` pouches | verified |
| Boots blue+white | `#4E92D4` + `#F4F1E8` | verified |
| Daggers | blade `#C93A42`, fittings `#E3B94A` | verified |

**Idle / attack / victory.** Same bounce-and-trail idle as FFX Rikku (§1.7) but the trailing element is now the **long scarf** rather than back-ribbons. Attack: a 4-hit dagger flurry at 14 fps with a `#C93A42` cross-slash overlay on the final hit. **Victory pose (verified):** "punches the air as she staggers forward, before pumping both arms and holding a dagger in front of her."

> **Silhouette.** Tiny, bare-limbed and spiky: hair piled and tied on top of the head so her head shape is a small ragged bun rather than FFX's fan-ponytail, wrapped with a headband. The defining accessory is a **long two-tone scarf** that loops the neck and streams out sideways, giving her a constant diagonal motion line. Skirt is a short flared trapezoid, legs bare to short boots, one small blade in each hand. Squint read: bun / streaming scarf / flared skirt / two short spikes at the hands.

---

### 1.16 FFX-2 Paine — Warrior (default)

**Verified** (`[verified: 2 sources]`, FF Wiki *Paine* §Appearance + *Warrior (Final Fantasy X-2)*): 18 years old, **red eyes**, **short silver hair**; she "most commonly wears a **black leather ensemble** complete with a **choker**, a **folded top**, **elbow-length gloves**, **leather pants held by a belt**, and **high-heeled boots**"; she wears a **silver pendant threaded with a barbed-wire chain**; her **swords have a skull motif at the base of the blade** that also appears on her **Warrior belt buckle**. Warrior detail: a **black sleeveless fold-over top with silver studs closed with an x-shaped brooch**; **black shorts**; a **black belt with a skull buckle**; a **red belt with circle studs**; **two black straps around the waist**; **red suspenders attaching to black thigh-high socks**; **black fold-over boots**; **elbow-length black gloves**; a **black studded choker**. Height 165 cm.

| Part | Ramp | Confidence |
|---|---|---|
| Hair silver (short) | `#7E8496` / `#C6CCD8` / `#F2F5FA` | verified |
| Eyes | `#C7343C` | verified (red) |
| Skin (pale) | `#A88A86` / `#DCBAB2` / `#F6DED4` | `[estimate]` |
| Leather black | `#0E0D14` / `#1E1C26` / `#34313E` | verified |
| Silver studs / brooch | `#9BA3AD` / `#DDE3EA` | verified |
| Red belt / suspenders | `#7E1F22` / `#BE3034` / `#E05C5C` | verified |
| Skull buckle | `#E9E3D2` 4×4 px | verified |
| Thigh-high socks | `#18161E` | verified |
| Pendant + barbed chain | `#C9CFD6`, chain 1 px zigzag | verified |
| Sword blade | `#8E94A4` / `#D2D8E4` / `#FFFFFF` | `[estimate]` |
| Sword skull motif (base) | `#E9E3D2` 3×3 px at the ricasso | verified |

**Idle.** The opposite of Rikku: minimal. Arms crossed or one hand on hip, sword point-down beside her, 2-frame idle at 3 fps, only the hair fringe and the barbed chain move. **Attack:** a single heavy two-handed downward cleave, 5 frames, with a thick `#F2F5FA` arc. **Victory pose (verified across four dresspheres):** "**flicks her hair**" — she turns her head sharply, hair flicks, arms stay folded. Use this as her universal victory across all dresspheres; it is documented as her Gunner, Warrior, Thief, and Black Mage default `[verified: 2 sources]`.

> **Silhouette.** A near-monochrome black wedge: tight from ankle to shoulder with no loose fabric anywhere, so her outline is the cleanest in the cast — straight legs in thigh-high socks and heeled boots, a fold-over top, elbow-length gloves. The only shape that breaks the column is the **short, sharply layered silver hair**, bright against everything else, and a long straight sword held point-down at her side. Small bright accents (studs, pendant, skull buckle) punctuate the black but never change the outline. Squint read: bright spiky hair / narrow black column / long vertical blade.

---

### 1.17 FFX-2 Bahamut (Bevelle Underground)

Mechanically verified `[single source]`: a possessed Bahamut fought in the **Bevelle Underground** after Baralai flees; he **counts down from 5 to 0** before **Mega Flare**; *Impulse* hits the whole party for 3/8 of remaining HP.

Visually he is the FFX Bahamut (§1.13) — **large black dragon, enormous red wings** — with a possession overlay. **Design directive `[estimate]`:**

| Overlay | Spec |
|---|---|
| Possession veins | 1 px `#B048F0` glowing tracery over scales, pulsing 0.8 Hz |
| Eyes | switch from `#F2D24A` to `#C64AF0` |
| Aura | a 6 px `#7A2ED8` rim at 45% alpha, plus 8 drifting violet motes |
| Mega Flare countdown | a large numeral **5→0** in `#F2F5FA` with a `#B048F0` outline, floating 20 px above his head, one digit per turn, scaling 1.3×→1.0× on each change with a 2-frame flash |

The countdown numerals are a **UI requirement, not decoration** — the player must be able to read the timer without the enemy name plate.

---

### 1.18 Vegnagun (parts)

**Verified design commentary** (FF Wiki *Vegnagun* §Behind the scenes, `[single source]`): "Vegnagun's design, particularly its **moth-like wings on a locust body**, refer[s] to a popular design of… **Beelzebub**… **Lord of Flies**, taking the form of a demonic fly or locust." It is "a colossal **cannon**" and its pilot sits at an **organ** facing *away* from the main cannon. Verified fight structure: the party must disable **tail → leg → body (core) → head (main cannon)** before Shuyin appears, and **Vegnagun battles open with a black hole sucking in the screen** instead of the normal shatter transition. The head battle has a **time limit**; if it expires the cannon fires and Spira is destroyed (game over). The leg is accompanied by **Nodes** that cycle colour — **Red = offensive magic, Yellow = buffs/status, Green = recovery magic** — and change colour when hit with offensive magic or gun attacks. The body has **two arms** that cast and regenerate.

| Part | Sprite px | Verified content | Palette `[estimate]` |
|---|---|---|---|
| **Tail** | 240 (H) × 256 cell | plants into terrain to draw Farplane energy during the head fight | plating `#4E5A66`/`#7E8C9A`/`#B4C0CC`; energy conduit `#8BE8B0` running its length |
| **Leg** | 240 × 256 | flanked by 3 Nodes | chitinous `#3E4A52`/`#66767E`; hydraulics `#A9762E`; joint glow `#C46A2E` |
| **Node ×3** | 26 px orbs | colour = behaviour | Red `#D83A3A`, Yellow `#EFC133`, Green `#4FB05E`; each a glass orb with a `#FFFFFF` 2 px specular and a 4 px halo in its own hue |
| **Body (core)** | 260 × 320 | two casting arms, regenerating | thorax `#3A4450`/`#5E6E7C`; core chamber `#B048F0` glow behind 3 px grating; wings `#8E96A8` at 35% alpha, moth-scalloped edge |
| **Head (main cannon)** | 288 × 384 | fires the world-ending shot | cannon barrel `#6E7A88`/`#AAB6C4`; muzzle bloom builds `#F49BB8`→`#FFFFFF` over the timer; **Redoubts** as 4 small turret pods `#5E6A78` |

**Design directive.** Keep the **insect grammar** consistent across all four parts so the player can tell they are fighting one creature: every part uses the same three materials (dull blue-grey plate, warm brass hydraulics, and a translucent moth-wing membrane), the same 1 px rivet pattern on a 6 px grid, and the same violet core glow bleeding through grates. The **moth wing** silhouette — a scalloped, veined, semi-transparent fan — should appear at least once on every part so the reference is unmistakable.

**Vegnagun battle-open transition (verified as different from the rest of the game):** instead of the standard shatter, implement a **black hole suck-in** — the whole framebuffer is radially pinched toward a point at screen centre over 0.6 s while desaturating to 0, then the battle scene fades up from black.

> **Silhouette.** Not a robot — an **insect the size of a cathedral**. Every part reads as locust or moth: a segmented plated body, brass hydraulic joints where limbs fold at hard insect angles, and huge scalloped, semi-transparent wings that cast dappled shadows. It is so large that no single camera frame ever contains it; the player fights a leg that fills the screen, then a tail, then a chest, then a cannon-headed skull. Squint read per part: one colossal jointed limb entering from off-frame / a ribbed abdomen / a grated chest with something violet burning inside / a barrel aimed out of frame at the world.

---

### 1.19 Shuyin

**Verified** (FF Wiki *Shuyin* §Appearance, `[single source]`): **shoulder-length dishevelled blond hair**, **blue eyes**; a **jacket with a yellow back and pale dark-green front**, a **blue armlet**, **red-and-black elbow-length square sleeves**; on his **left** hand a **black glove with a green cuff and red elbow-length sleeve**; his **right** glove is **plain black**; **black shorts**; **yellow boots with high footings**. His **sword has a black hilt and a light-blue-to-black blade**. Height 176 cm.

| Part | Ramp | Confidence |
|---|---|---|
| Hair blond | `#8A6B1F` / `#E8C55C` / `#FFF0A8` | verified |
| Eyes | `#3E9BD6` | verified |
| Skin (pallid, unsent) | `#9E8272` / `#D6B4A0` / `#F2DCCE` — **desaturate 20% vs Tidus** | `[estimate]` |
| Jacket back yellow | `#B8811A` / `#F0BC2E` | verified |
| Jacket front pale dark green | `#3A4E3A` / `#5E7A5E` / `#8AA88A` | verified |
| Armlet blue | `#2E568E` / `#5289C2` | verified |
| Sleeves red+black (square) | `#B02A2A` + `#14141C`, blocky 4 px panels | verified |
| Left glove cuff green | `#4E7A4E` | verified |
| Shorts black | `#131318` / `#24242C` | verified |
| Boots yellow | `#B8811A` / `#F0BC2E` / `#FFDD73` | verified |
| Sword blade | gradient `#9BE4FF` (tip) → `#101018` (base) | verified |
| Sword hilt | `#0E0D14` / `#26262E` | verified |

**Critical art-direction note.** Shuyin must read as **"Tidus, but wrong"**. Use the same rig, the same silhouette skeleton, and the same blond spiky-hair shape; change only (a) the palette — he is colder and desaturated, (b) the pose — Tidus is open and bouncy, Shuyin is closed, shoulders forward, head slightly down, and (c) a constant faint `#8FA8C0` unsent shimmer: 2 px of the sprite's edge cycles to 60% alpha on a 1.2 s loop.

**Attacks (verified names/derivations `[single source]`):** *Spin Cut* (single target, from Tidus's Spiral Cut), *Run & Slash* (6 random hits, from Slice & Dice), *Force Rain* (magic, all targets, from Energy Rain), *Terror of Zanarkand* (9 hits on one target, from Blitz Ace — **and during it he thrusts his sword into the ground, yet lands holding it again**, an in-game animation error the wiki notes). Reproduce these as recoloured Tidus Overdrive animations in `#8FA8C0`/`#B048F0` instead of `#9BE4FF`/gold. **Do not give the party a victory pose after this fight** — the wiki states "The party will not pose upon winning this battle" `[single source]`; skip straight to the fade.

> **Silhouette.** Tidus's outline reproduced almost exactly — spiky blond crown, lean frame, one long sword — but everything is closed rather than open: shoulders rolled forward, head tipped, blade held low and behind. The one hard difference at silhouette scale is the **sleeves**: both arms carry blocky, square, elbow-length cuffs that give his arms a stepped, mechanical outline where Tidus's are smooth. His edges shimmer faintly and never fully settle. Squint read: Tidus shape / stepped square forearms / hunched, closed posture / glowing rim.

---

### 1.20 Lenne

**Verified** (FF Wiki *Lenne* §Appearance, `[single source]`): slender, **long straight brown hair**, **brown eyes**, **violet lipstick**; a **blue top with white ruffles extended to her knee on the left side**; a **short black lace skirt with a blue belt**; **knee-high brown boots**; **black ribbons on her upper arms**; **blue glovelets held on by black straps**; **long dangling beaded earrings**. Yuna wears this exact outfit as the **Songstress** dressphere. Height 169 cm. She was a **summoner and songstress** of ancient Zanarkand.

| Part | Ramp | Confidence |
|---|---|---|
| Hair brown (long, straight) | `#3E2A1A` / `#6B4728` / `#9A6A42` | verified |
| Eyes | `#6B4728` | verified (brown) |
| Lips | `#8E4A96` / `#B876BE` | verified (violet) |
| Top blue | `#1E4A86` / `#3A78BE` / `#6AA6DE` | verified |
| White ruffles (left, to knee) | `#C4BFB2` / `#F6F3EA` / `#FFFFFF` | verified |
| Skirt black lace | `#12111A` with `#5C5468` 1 px lace holes | verified |
| Belt blue | `#3A78BE` | verified |
| Boots brown | `#4E3418` / `#7E5626` / `#A8793E` | verified |
| Arm ribbons black | `#14141C` | verified |
| Glovelets blue + black straps | `#3A78BE` + `#14141C` | verified |
| Earrings (beaded, dangling) | `#3E6FA8` beads, 8 px drop | verified |

**Staging.** Lenne appears only as a memory/spirit. Render her at **70% opacity with an additive `--pyre-pink` rim** and a trail of 4 pink pyreflies. Her only animation need is the final scene: she walks 8 px toward Shuyin and reaches out. If a singing beat is used, a 6-frame arms-open pose with a ring of `--pyre-pink` motes rising is sufficient.

> **Silhouette.** Asymmetric by design: a big cascade of white ruffles falls from the **left** side of her top all the way to the knee, while the right side stays clean, so the figure is visually heavier on one side — the opposite hip from Yuna's Gunner sash. Long straight brown hair reaches past the shoulder blades, and two long beaded earrings swing free of the jaw. Below the ruffles, a short dark skirt and tall boots leave a thin band of leg. Squint read: one-sided white cascade / long straight hair / two dangling drops at the jaw / tall boots.

---

### 1.21 Battle-menu portrait / face icons (CTB list)

The CTB list on the right of the FFX battle screen shows **one icon per upcoming turn**, and the FF Wiki infoboxes confirm the game shipped **small square avatar portraits** for each character — the *Yuna* infobox alone lists a PS2 avatar, a PS3 avatar, and separate PS3 avatars for **each of her 16 X-2 dresspheres** (`|portrait=…50px|Final Fantasy X-2 Gunner avatar (PS3)…`) `[single source]`. Our implementation mirrors that: **one icon per character per dressphere/form.**

**Icon spec** (`[estimate]` for all values):

| Property | Value |
|---|---|
| Canvas | **24×24 logical px**, drawn at 3× = 72×72 device px |
| Framing | head + shoulders, head occupies ~14 px of the 24 |
| Crop | slight down-tilt, chin at y=19, eyes on the y=10 line (the "eye line" must match across **all** icons so the list reads evenly) |
| Background | flat `#101828` at 80% alpha behind the bust, so icons read on any scene |
| Border | 1 px `#5A7FA8`; current actor's border becomes 1 px `#FFF0A8` (see §3.2) |
| Palette | reuse the character's face/hair ramps exactly; **no** extra colours |
| Enemy icons | a cropped 24×24 of the enemy's head silhouette on `#2A1420`, border `#A83A3A` |
| Letter tag | enemies get a 6×8 px capital letter (A, B, C…) in `#F4F1E8` bottom-right — verified behaviour: enemies "display a letter next to their name to help you better identify which is which" `[single source]` |

**Per-character icon notes** (what must survive the 24 px crop):

| Character | Must-read feature in 24 px |
|---|---|
| Tidus | spiky blond sunburst + blue pauldron edge at the bottom-left corner |
| Yuna (FFX) | asymmetric eyes (1 px blue left, 1 px green right — **draw them, they are her identity**) + white chest sash |
| Auron | black lens band across the eyes + red collar + grey high collar |
| Wakka | solid orange coif wedge + blue headband line |
| Lulu | four gold pins above the hairline + purple lips |
| Kimahri | blue face + yellow slit eyes + **the broken horn stub**, cropped so both horns are visible |
| Rikku | fan ponytail top-edge + green swirl eyes |
| Yuna (Gunner) | pink hood point behind the neck + red braid crossing one shoulder |
| Rikku (Thief) | top-knot bun + red/yellow scarf across the chest |
| Paine (Warrior) | silver layered fringe + black choker |
| Seymour Flux | light-blue bang over one eye + facial veins |
| Yunalesca (1/2/3) | three separate icons: headdress 'M' / tendril halo / gorgon brow |
| Braska's Final Aeon | horned head + orange eye glow (icon background `#2A1420`) |
| Yu Yevon | the gold glyph disc, filling the icon |
| Aeons | each aeon's head, on a background tinted to its element |

---

### 1.22 FFX supporting cast with staged scene presence

These six sheets exist because the chapter beat sheets stage them on screen, not because they fight. **None of them needs an attack rig**; each needs an idle, a "staged" pose, and (for the Ronso) a death pose. Cell sizes follow the §0.4 formula where a height is published and are `[estimate]` where it is not.

Reading note: as everywhere in §1, the **named** colours are verified from the FF Wiki Appearance sections; the **hex** is `[estimate]`.

---

#### 1.22.1 Braska — High Summoner, Yuna's father (Zanarkand Dome pyrefly memory; Farplane voices)

**Verified** (FF Wiki *Lord Braska* §Appearance, `[single source]`): at the age of **35**, a **tall** man with **blue eyes** — "from whom Yuna inherited her one blue eye". He wore an **elaborate robe in shades of red made of broad overlapping petals with wide sleeves that covered his hands**; over it a **wide grey sash with a pattern of connecting circles**, the sash bearing the **letter "A" in the Yevon alphabet**, which symbolises Yevon. He wore an **elaborate dark-blue headdress resembling an Arabian keffiyeh**, held by a **band with a blue stone at the front and a long trail curving behind him**, with a **pale-blue tassel hanging on each side**; a **white beaded bracelet**; and he wields a **summoner's staff**.

| Property | Value | Confidence |
|---|---|---|
| Assumed height | **185 cm** — "tall man", no published figure; placed between Auron 183 and Wakka 188 | `[estimate]` |
| `body_px` | **63** (185 × 0.343) | `[estimate]` |
| Sprite cell | **56×72** (same class as Auron) | `[estimate]` |
| Head units | 5.6 (heroic, matches Auron/Kimahri) | `[estimate]` |

| Part | Ramp (shadow / base / light) | Confidence |
|---|---|---|
| Robe red (petal layers) | `#6A1A1E` / `#A82C30` / `#D8595A` | name verified |
| Robe petal edge (upper layer) | `#C1494B` 1 px separating each petal row | `[estimate]` |
| Sleeve interior (hands hidden) | `#4A1014` | `[estimate]` |
| Sash grey | `#5A5A62` / `#8A8A94` / `#B6B6C0` | name verified |
| Sash circle pattern | `#3E3E46` 1 px rings, 5 px pitch | `[estimate]` |
| Yevon "A" glyph on sash | `--yevon-gold` `#E3B94A` | name verified |
| Headdress dark blue | `#15224A` / `#24376E` / `#3B57A0` | name verified |
| Head band stone | `#4FA8E8` with a 1 px `#E9FFF4` catchlight | `[estimate]` |
| Tassels pale blue (×2) | `#9CC4E8` | name verified |
| Beaded bracelet white | `#E8E4DC` 1 px beads | name verified |
| Skin | `#9A6A4C` / `#CF9E78` / `#EFC6A6` | `[estimate]` |
| Eyes blue | `#3E7FC4` | name verified |
| Staff | shaft `#7A6440`, rings `--yevon-gold`, 34 px tall | `[estimate]` |

**Memory treatment.** Braska only ever appears inside a **pyrefly memory** (Zanarkand Dome, beat 1 / beat 6). Render him at **62% opacity** with an additive `--pyre-green` fringe 1 px wide on every silhouette edge, and drive a 0.4 Hz ±1 px vertical drift. Do **not** give him a blob shadow — memories do not touch the floor. `[estimate]`

> **Silhouette.** A broad red bell: overlapping petal rows widen the robe steadily from shoulder to hem so the outline is a smooth triangle with a scalloped edge, and the hands never break it because the sleeves swallow them. On top, a squared dark-blue headdress block with a long trailing tail streaming behind — the only asymmetric element. Squint read: red triangle / dark block / one trailing ribbon / a vertical staff line.

---

#### 1.22.2 Auron (ten years ago) — the young, two-eyed, unscarred guardian

**Verified** (FF Wiki *Auron* §Appearance, `[single source]`): Auron "was **25 when he died** and became an unsent", and has visibly **aged since** — the memory Auron of the pilgrimage is therefore a **25-year-old**, not the mid-30s man of §1.3. The **scar over the right eye, the shut right eye and the sunglasses are all acquired**; the §1.3 sheet's "scar `#8E5A4A` 1 px vertical over right eye" and "sunglasses lens `#1B1B24` at 88%" rows **must be deleted** for this variant. The HD Remaster remodel that made his skin "resemble more of a real-life mid-30s man" and his hair "elongated and more dishevelled" is likewise a *present-day* treatment `[single source]`.

**Delta sheet from §1.3** — everything not listed is identical to §1.3:

| Change | Value | Confidence |
|---|---|---|
| Sprite cell | **56×72**, `body_px` **63** — unchanged (he is already adult) | `[estimate]` |
| **Right eye** | **open**, amber `#D9A23A`, mirrored to the left eye; both eyes drawn as 2×2 px + catchlight | verified by absence (scar is acquired) |
| **Scar** | **absent** | verified |
| **Sunglasses** | **absent** — the eye band is skin, not a lens bar. This is the single most important read | verified |
| Hair | **black only**, no grey streaks: `#141319` / `#26242E`, no `#8E8C97` streak row; neater, 2 px shorter at the nape | `[estimate]` |
| Stubble | **absent** — clean jaw | `[estimate]` |
| Skin | 1 ramp step lighter and less weathered: `#A5714F` / `#D9A47C` / `#F4CBAB` | `[estimate]` |
| Haori | same red, but **both arms in their sleeves** in the memory's non-combat staging (the empty-sleeve rōnin read is a *later* habit in our staging) | `[estimate]` — the wiki does not date the habit |
| Jug | present (it is his from the start) | `[estimate]` |

**Why this matters.** The Yunalesca chapter's beats 1 and 6 cut between the memory and the present. The cut only works if the two Auron sprites are unmistakable in **one frame at 48 px**: the present-day sprite has a solid black horizontal bar across the eyes and a grey-streaked fringe; the memory sprite has two amber eye pixels and a flat black fringe. Author them as **two separate atlases**, never as a layer toggle.

> **Silhouette.** Identical mass to §1.3 — red slab, one square shoulder pad, jug on the right hip — but with **both sleeves filled**, so the left side of the outline gains an arm and the "limp curtain" cue disappears. At 48 px the silhouette alone is near-identical to present-day Auron; the differentiation is entirely interior (eyes, no lens bar), which is why the icon crop in §1.21 must get its own entry.

---

#### 1.22.3 Zaon — Yunalesca's husband, the first Final Aeon's vessel

**Verified** (FF Wiki *Zaon*, `[single source]`): "Zaon is depicted wearing a **golden knight's armour with four horn-like ornaments and a white cape**." He lived in Zanarkand over 1,000 years before FFX and was sacrificed by Yunalesca as the vessel for the first Final Aeon. He appears in Spira only as a **sphere projection** (the Seymour/Yunalesca recordings).

| Property | Value | Confidence |
|---|---|---|
| Assumed height | **180 cm** (armoured warrior, no published figure) | `[estimate]` |
| `body_px` | **62** | `[estimate]` |
| Sprite cell | **56×72** | `[estimate]` |

| Part | Ramp | Confidence |
|---|---|---|
| Armour gold | `#7A5A14` / `#C79A28` / `#F2D471` | name verified |
| Armour gold specular | 1 px `#FFF6D0` on every upward-facing plate edge | `[estimate]` |
| Four horn ornaments | same gold ramp; 2 horns forward-swept from the temples, 2 back-swept from the crown, each 7–9 px | verified (count = 4) |
| Cape white | `#BFC2CC` / `#E8EAF0` / `#FFFFFF` | name verified |
| Cape interior | `#8C9098` | `[estimate]` |
| Visor shadow (face unreadable) | `#0B0A12` at 85%, with 2 px `#E9FFF4` eye-slit glow | `[estimate]` |

**Projection treatment.** Zaon is only ever a **sphere recording**. Render at **55% opacity**, tinted 20% toward `#8FD0F0`, with a 1 px horizontal scan-line mask at 3 px pitch scrolling upward at 8 px/s, and a 1-frame horizontal tear every 2.5 s. `[estimate]`

> **Silhouette.** A gold column crowned with a four-point antler crest — the horn count is the whole identity, so draw them long enough to break the head's bounding box on all four diagonals. Below, the white cape falls to a wide flare, giving a squat triangle under a spiky head. Squint read: spiky crown / narrow gold torso / wide pale skirt.

---

#### 1.22.4 The slain Ronso — Kelk, Biran and Yenke (Prominence staging)

These three stage the **entire opening of the Seymour Flux encounter**: the party arrives at the Prominence to find the Ronso dead. They need **one corpse pose each**, not a rig. The living Biran/Yenke variants are also useful for the pre-Gagazet memory if a chapter wants it.

Shared construction: the Ronso base is §1.6's Kimahri sheet — blue fur ramp, feline muzzle, digitigrade legs, single forehead horn — at **`body_px` 70, cell 64×80** for a standard adult Ronso. Kelk is drawn 2 px shorter and stooped (elderly). `[estimate]`

| Ronso | Verified appearance | Fur / hair ramp | Horn | Attire |
|---|---|---|---|---|
| **Kelk Ronso** | "a **tall elderly Ronso with white hair and beard**. His **horn is almost black**. He is the **only Ronso witnessed wearing Yevonite attire** rather than typical tribal outfits of leather armour. He wears an **orange Yevon attire with the elaborate front with the symbol of Yevon in the centre** that maesters wear." `[single source]` | fur `#3B4E74` / `#5A7099` / `#8296BE`; hair **and beard** `#B9BCC4` / `#E4E6EC` / `#FFFFFF` | **near-black** `#1A1720` / `#2C2836` — 1 horn, intact, 12 px | robe orange `#8E4212` / `#D9741F` / `#F4A75A`; centre Yevon emblem `--yevon-gold`, 9×9 px; maester's stiff elaborate front panel |
| **Biran Ronso** | "a **tall muscular blond Ronso**. In contrast to many of his brethren, his **fur is more grey than blue**. He wears the typical Ronso tribe attire of **leather armour on torso, arms and legs, as well as a loincloth**." `[single source]` | fur **grey-shifted** `#454A55` / `#6B7180` / `#9AA0AE`; mane **blond** `#8E6A1E` / `#D4A93C` / `#F5DA8E` | intact, 14 px, the largest of the three | leather `#42301C` / `#6B4E2C` / `#99764A`; loincloth `#7A2A22` |
| **Yenke Ronso** | "a **tall muscular light-skinned Ronso with brownish hair**… leather armour covering his **forearms and chest**, as well as a **loin cloth**. The **horn** on his forehead… is **dark in contrast to Biran and Kimahri's**." `[single source]` | fur **light** `#5A6C8C` / `#8EA0BE` / `#BFCDE4`; hair **brown** `#4A3118` / `#7A5228` / `#A87C46` | **dark** `#241F2C` / `#3A3346`, 11 px | leather on **forearms and chest only** — bare upper arms, which is his silhouette tell |

**Corpse staging spec** (this is the scene, so it is specified precisely) `[estimate]`:

| Property | Value |
|---|---|
| Pose count | 1 static frame each; **no idle loop** — stillness against the falling snow is the point |
| Kelk | on his back, arms out, head toward camera, the orange robe the brightest thing on the ledge; place him **nearest the camera at world (−4.2, 0, +1.8)** so the player's eye lands on him first |
| Biran | face-down, one arm under him, at world (+0.6, 0, −1.4) |
| Yenke | slumped **sitting against the rock face** at world (+2.4, 0, −2.6), head fallen forward — the only vertical of the three |
| Colour treatment | multiply each corpse sprite by `#8494B4` at 22% (drains warmth) and drop saturation 18%; **Kelk's robe is exempt** so the orange still reads |
| Blood | **none.** Use snow-drift accumulation instead: a 2 px `#E8F0FA` rim along each body's upper edge, implying they have lain there a while |
| Contact | full blob shadow at 0.5 alpha (they are heavy and on the ground) |
| Pyreflies | **0 before the fight, 40 after** — the post-fight `--pyre-green` column in §2.1 rises **from these three positions**, not from the centre of the ledge. Bind the emitter transforms to the corpse transforms |
| Sprite budget | 3 single-frame sprites at 64×80 = 3 draw calls; they are props, not actors |

> **Silhouette.** Three horizontal masses in a field that is otherwise all verticals (party, boss, rock spur). That contrast is the staging: at a glance the ledge reads as *littered*. Kelk is the only one with a colour accent; Biran is the biggest lump; Yenke is the one with a raised head.

---

#### 1.22.5 Wantz — the Mt. Gagazet merchant

`ffx-seymour-flux.md` §7.7 calls the shop "part of the encounter" (he sells the **Holy Water** and the two **Zombie Ward** armours that answer Seymour Flux's Zombie combo), so he needs a sprite and a shopkeeper pose.

**Verified** (FF Wiki *Wantz* §Appearance, `[single source]`): "Wantz wears a **green and yellow headband**, a **blue striped shirt**, and **yellow bandana tied around his waist**, **dark fingerless gloves**, **green baggy trousers**, and **red sandals**. He has **light skin and red hair.** He also has a **necklace**." He speaks with a **Cockney accent**, like his brother O'aka.

| Property | Value | Confidence |
|---|---|---|
| Assumed height | **172 cm** (no published figure; ordinary adult male) | `[estimate]` |
| `body_px` | **59** | `[estimate]` |
| Sprite cell | **48×64** | `[estimate]` |
| Head units | 5.0 (slightly larger head — he is comic relief) | `[estimate]` |

| Part | Ramp | Confidence |
|---|---|---|
| Hair red | `#7A2A14` / `#C24A22` / `#EE8452` | name verified |
| Headband green + yellow | `#3E6B2E` / `#63A24A` and `#B8811A` / `#F0BC2E` — two 2 px bands | name verified |
| Shirt blue stripes | base `#25436E`, stripe `#4E7FBE` every 3 px vertical | name verified |
| Waist bandana yellow | `#B8811A` / `#F0BC2E` / `#FFE07A` | name verified |
| Gloves (dark, fingerless) | `#1E1A22` / `#332E3C` | name verified |
| Trousers green, baggy | `#2F4A22` / `#4E7238` / `#79A05C` | name verified |
| Sandals red | `#7A1E1E` / `#B53232` | name verified |
| Necklace | 1 px `#C9A868` cord + a 2×2 `#8BE8B0` bead | name verified (colour `[estimate]`) |
| Skin (light) | `#A5734F` / `#DCAE85` / `#F6D6B8` | name verified |

**Pose set.** Three frames only: **idle** (hands on hips, 4-frame 6 fps bob of the bandana ends), **hail** (one arm raised, used the instant the player enters shop range), **sale** (both hands offering, played once per purchase). No walk cycle.

> **Silhouette.** Small, round-headed and bottom-heavy: a striped torso over very baggy trousers that flare to almost the sprite's full width, so he reads as a bell with a red tuft on top. The waist bandana's two hanging ends are the only moving pixels on the sprite. Against the Gagazet palette he is the **only warm-red-and-yellow object on the trail**, which is exactly how the player finds him.

---

#### 1.22.6 Magus Sisters — Sandy, Cindy, Mindy (BFA possessed-aeon roster)

**Verified** (FF Wiki *Magus Sisters (Final Fantasy X)* §Profile, `[single source]`): "The Magus Sisters **resemble their incarnations from *Final Fantasy IV*, but wear insectoid armour**. **Sandy is tall and slim and wears red armour**. She is **modelled after a praying mantis**. **Cindy is rotund and wears blue and red armour, modelled after a ladybug**. **Mindy is the smallest** of the group. She wears **orange armour modelled after a bee** and **hovers during battle**." Their **fayth** are "roughly the same height and body type" as each other, with **blonde hair** — unlike the aeons.

Sizes and cells are in the §0.4 table. Per-sister palettes:

| Sister | Insect | Armour ramp | Signature shapes | Confidence |
|---|---|---|---|---|
| **Sandy** | praying mantis | red `#6E1216` / `#B4262C` / `#E2585A` | two **scythe forearms** raised in the mantis prayer, each 22 px; a narrow wedge head with 2 px antennae; a very long, slim thorax | name verified, shapes `[estimate]` |
| **Cindy** | ladybug | blue `#1B2F6E` / `#2F50A8` / `#5A7ED8` **with red** `#B4262C` elytra spots (4 spots, 5 px) | a near-circular shelled back, short limbs, the widest sprite of the three; a low centre of mass | name verified |
| **Mindy** | bee | orange `#8A4410` / `#D9761F` / `#F5AA5C` with 3 px `#1A1720` abdominal bands | a stinger point, two 18 px translucent wings at `#E9FFF4` 35% with a 24 Hz blur frame pair, **hovering** | name verified |

**Hover rule (Mindy only).** No blob shadow at ground level; instead a **half-alpha blob at 0.55× scale offset 0.6 world units below her**, plus a ±1.5 px, 0.5 Hz vertical bob. Verified that she hovers; the numbers are `[estimate]`.

**Composite framing.** The three are summoned together and act as three entities. Stage them as a **descending diagonal**: Sandy tallest at the back-left of the summon mark, Cindy widest at front-centre, Mindy hovering above and right. Their combined bounding box must not exceed **240 px wide × 128 px tall** or the CTB list's three simultaneous entries will not fit the frame with the boss. `[estimate]`

> **Silhouette.** Three deliberately non-overlapping shapes: a tall thin V with raised blades (Sandy), a squat dome (Cindy), a small hovering teardrop with wing blur (Mindy). If any two read as the same blob at 48 px, redraw — the whole point of the trio is instant per-sister identification in the CTB list.

---

### 1.23 FFX-2 supporting cast (both X-2 chapters)

Nine named characters with scripted lines in the beat sheets and the writing bible's E5 comm script. **Leblanc, Logos and Ormi** are staged in-scene throughout the Bevelle Underground infiltration and the Vegnagun chamber; **Nooj, Gippal and Baralai** appear at the finale (Baralai possessed by Shuyin, collapsing on screen); **Brother, Buddy and Shinra** are **voice-only over comms** and therefore need a **portrait only**, not a body sprite.

| Character | Body sprite needed? | Portrait needed? | Published height | Published age | `body_px` | Cell |
|---|---|---|---|---|---|---|
| Leblanc | **yes** | yes | not published | not published | **57** | 48×64 |
| Logos | **yes** | yes | not published | **26** `[single source]` | **62** | 48×64 |
| Ormi | **yes** | yes | not published | **22** `[single source]` | **50** | 48×56 |
| Nooj | **yes** | yes | **188 cm** `[single source]` | **21** `[single source]` | **64** | 56×72 |
| Gippal | **yes** | yes | not published | **18** `[single source]` | **59** | 48×64 |
| Baralai | **yes** | yes | **176 cm** `[single source]` | **20** `[single source]` | **60** | 48×64 |
| Brother | no | **yes** | not published | **20** (X-2) `[single source]` | (58) | 48×64 if ever staged |
| Buddy | no | **yes** | not published | not published | (59) | 48×64 if ever staged |
| Shinra | no | **yes** | not published | not published | (40) | 40×48 if ever staged |

Where no height is published the `body_px` is `[estimate]`, derived from the body-type words in the wiki Appearance text and anchored to the §0.4 scale: Logos "tall slim" → between Baralai 176 and Nooj 188, call it 180 cm; Ormi "short stout" → 146 cm; Leblanc reads as Yuna's height class → 166 cm; Gippal reads as Tidus's class → 173 cm; Shinra is a **child in a full bodysuit** → ~116 cm.

---

#### 1.23.1 Leblanc

**Verified** (FF Wiki *Leblanc* §Appearance and infobox, `[single source]`): **blonde** hair, **purple** eyes, a **round face** and **short** hair. She wears a **pinkish-purple robe that exposes her chest** — showing the **tattoo of the Leblanc Syndicate's logo**, which is a **heart** — **and her right thigh**. The robe has a **high, curved tasselled collar** and **long sleeves reminiscent of a Japanese furisode kimono**, with the **cuffs separated from the ends of the sleeves by white crisscrossed material**. She wears **thigh-high stockings of the same colour** and **purple ankle boots**. The attire is **decorated in blue and white triangular and swirl patterns**. She wields a **red-and-silver fan** in her **right** hand. The wiki also notes her outfit **resembles a Lady Luck dressphere** because the heart is one of the four card suits, matching the spade/club/diamond that Yuna/Rikku/Paine wear as Lady Luck.

| Part | Ramp | Confidence |
|---|---|---|
| Robe pinkish-purple | `#5E2350` / `#9A3D84` / `#C96FB4` | name verified |
| Robe pattern (blue) | `#3A6FB8` 1 px triangles | name verified |
| Robe pattern (white swirls) | `#F2ECF4` 1 px | name verified |
| Collar (high, curved) | robe ramp + `#F7C8E4` 1 px top edge; 2 px tassel drop at each side | name verified |
| Sleeve cuff crisscross | `#F4F1E8` 1 px lattice, 3 px pitch | name verified |
| Stockings (same colour) | `#5E2350` / `#9A3D84` | name verified |
| Ankle boots purple | `#3E1A4E` / `#6A2E80` | name verified |
| Hair blonde (short) | `#8E6A1E` / `#D9B34A` / `#F7E294` | name verified |
| Eyes purple | `#9A5AD0` | name verified |
| Skin | `#A5734F` / `#DCAE85` / `#F6D6B8` | `[estimate]` |
| Syndicate heart tattoo | `#C1233E`, 5×5 px on the exposed chest | name + shape verified |
| Fan (red and silver) | ribs `#BFC4CE` / `#EDF0F5`, leaf `#8E1620` / `#C93A42`, 16×10 px open | name verified |

**Pose set.** Idle (hand on hip, fan closed, 4 frames 6 fps), **fan-open taunt** (her signature; 3 frames, the open fan covering the lower face), and a **fluster** frame used when Nooj is mentioned. `[estimate]`

> **Silhouette.** Hourglass with two enormous hanging sleeve bells — the furisode cuffs are wider than her hips, so the outline is a narrow head and torso between two heavy pendulums. The **right thigh is bare**, so one leg is a light column and the other a dark stocking: the asymmetry is her cheapest identifier at 48 px. Short blonde hair keeps the head small and round. Squint read: round head / hourglass / two sleeve bells / one light leg, one dark.

---

#### 1.23.2 Logos

**Verified** (FF Wiki *Logos (Final Fantasy X-2)* §Appearance, `[single source]`): "Logos is a **tall slim man** who wears a **black and silver helmet with a chin protector tied round the back of his head with a purple strip**, and a **blue robe and matching coat** that features the **Leblanc Syndicate logo on the shoulders** and the **sweeping, kimono-like sleeves**. He has a **purple sash around his waist** and wears **wraps around his ankles**." He **wields two revolvers**. Age **26**.

| Part | Ramp | Confidence |
|---|---|---|
| Helmet black + silver | `#15151C` / `#26262F` with `#9AA0AE` / `#DDE2EA` plate edges | name verified |
| Helmet chin protector | same ramp, a 6 px bar across the jaw | name verified |
| Purple tie strip (behind head) | `#6A2E80` / `#9A5AD0`, 2 px, trailing 6 px | name verified |
| Robe / coat blue | `#1B2F5E` / `#2F4E92` / `#4E77C4` | name verified |
| Syndicate heart on shoulders | `#C1233E` 5×5 px, one per shoulder | name verified |
| Syndicate heart on sleeves | `#C1233E` 4×4 px on each kimono sleeve | name verified |
| Waist sash purple | `#4A2060` / `#7A3AA0` | name verified |
| Ankle wraps | `#C8CCD6` 1 px bands | name verified |
| Revolvers ×2 | barrel `#6E7480`, grip `#4A3118`, 9×4 px each | verified (two revolvers) |

> **Silhouette.** The tallest, thinnest shape in the Syndicate: a narrow blue column, a hard-edged helmet block with a chin bar that squares the whole head, and a trailing purple ribbon off the back of the skull. The kimono sleeves flare but stay tight to the body compared with Leblanc's. Two small gun shapes at the hips. Squint read: tall thin blue / square head / one ribbon whip.

---

#### 1.23.3 Ormi

**Verified** (FF Wiki *Ormi* §Appearance, `[single source]`): "Ormi is a **short stout man** who wears a **large shield on his back** adorned with the **heart logo of the Leblanc Syndicate**. He wears **predominantly purple samurai-style attire**." He **uses a massive shield as a weapon**. Age **22**.

| Part | Ramp | Confidence |
|---|---|---|
| Samurai attire purple | `#3E1A4E` / `#6A2E80` / `#9A5AD0` | name verified |
| Lamellar plate lacing | `#E3B94A` 1 px horizontal at 3 px pitch | `[estimate]` — "samurai-style" implies lamellar |
| Shield face | `#5A5A62` / `#8A8A94` / `#B6B6C0`, **28×30 px** — nearly as tall as he is | verified ("massive", "large") |
| Shield heart logo | `#C1233E`, 9×9 px, dead centre | name verified |
| Shield rim | `#3E3E46` 2 px | `[estimate]` |
| Skin | `#9A6A4C` / `#CF9E78` | `[estimate]` |

**Proportions.** Draw at **4.2 heads**, not 5.25 — "short stout" is his entire read. Head 12 px on a 50 px body; torso is 60% of the body height; legs are 14 px. `[estimate]`

> **Silhouette.** A squat purple barrel with an enormous grey disc strapped to its back, so from three-quarter view the shield reads as a second, larger body behind the first. At 48 px he is the **only** wide-and-short shape in the cast — pair him next to Logos in every staged frame and the two silhouettes do the comedy for free. Squint read: big disc / small barrel / almost no legs.

---

#### 1.23.4 Nooj

**Verified** (FF Wiki *Nooj* §Appearance and infobox, `[single source]`): height **188 cm**, age **21**, meyvn of the Youth League. "Nooj has **long brown hair kept in two loops and a ponytail tied with a red band**. He has **blue eyes** and wears **blue glasses**. He wears **red long johns with multiple red and black belts** used to **secure his prosthetic arm and leg**. Over his **right shoulder is a purple sleeve with fur at the top**. He wears **purple boots** and carries a **silver cane**." His **left arm and leg** were destroyed in a battle with Sin and **replaced with machina prosthetics**.

| Part | Ramp | Confidence |
|---|---|---|
| Hair brown (two loops + ponytail) | `#3A2616` / `#6B4A28` / `#9C7448` | name verified |
| Hair tie red | `#B02A2A` | name verified |
| Glasses blue | lens `#3A6FB8` at 70%, frame `#2A3246` | name verified |
| Eyes blue | `#3E7FC4` | name verified |
| Long johns red | `#6E1414` / `#B02A2A` / `#D95A4E` | name verified |
| Belts red + black | `#8E2020` and `#14141C`, 2 px each, **five visible** | name verified ("multiple") |
| Right-shoulder sleeve purple | `#3E1A4E` / `#6A2E80` / `#9A5AD0` | name verified |
| Shoulder fur (top of sleeve) | `#8E8C97` / `#C4C2CC`, ragged 2 px edge | name verified |
| **Machina prosthetic arm (LEFT)** | `#4A4E58` / `#7E848F` / `#B4BAC4`, with `#E3B94A` 1 px joint rings and a 2×2 `#6EC8F0` power cell at the elbow | verified (machina, left side); hex `[estimate]` |
| **Machina prosthetic leg (LEFT)** | same ramp, exposed piston 3 px wide at the shin | verified |
| Boots purple | `#3E1A4E` / `#6A2E80` | name verified |
| Cane silver | `#8A8E98` / `#C8CCD6` / `#F0F2F6`, 30 px, held in the **right** hand | name verified |

**Staging rule.** Nooj's **left side is metal and his right side is cloth**. Always stage him **facing three-quarter left** so the prosthetic arm and leg are toward camera, and give the cane a 1 px contact tick on the ground every time he shifts weight. He never stands square. `[estimate]`

> **Silhouette.** Asymmetry is the character: one arm is a thin articulated stick with visible gaps, the other is a thick furred purple shoulder; one leg is a piston, the other a boot. A cane extends the outline down-right past the feet. Above, two hair loops flank the skull like handles with a ponytail behind. Squint read: tall red column / one furred shoulder / one skeletal arm / a third leg (the cane).

---

#### 1.23.5 Gippal

**Verified** (FF Wiki *Gippal* §Appearance, `[single source]`): "Gippal is an **Al Bhed with green eyes with spiral pupils** and an **eye-patch over his right eye**. He has **short spiky blond hair**. He wears **armour over a blue jumpsuit and purple overalls and indigo boots**. He wields a **large machina mortar with a rounded saw blade** as his weapon." Age **18**; leader of the Machine Faction.

| Part | Ramp | Confidence |
|---|---|---|
| Hair blond (short, spiky) | `#8E6A1E` / `#D4A93C` / `#F5DA8E` | name verified |
| **Eye-patch (RIGHT eye)** | `#1E1A22` / `#332E3C`, strap 1 px across the brow | name verified — side verified |
| Left eye green + **spiral pupil** | iris `#5EA85A`, pupil drawn as a 3×3 px `#1A2A16` spiral (the Al Bhed tell; 3×3 is the minimum that reads) | name verified; px `[estimate]` |
| Jumpsuit blue | `#1B3A63` / `#2F5E96` / `#4F8AC4` | name verified |
| Overalls purple | `#3E1A4E` / `#6A2E80` / `#9A5AD0` | name verified |
| Armour plates (over the suit) | `#5A5E68` / `#8E949E` / `#C2C8D2` — chest, both shoulders, both shins | name verified |
| Boots indigo | `#20204E` / `#3A3A80` | name verified |
| Machina mortar + saw blade | barrel `#6E7480`, blade disc `#C8CCD6` with 8 teeth, 20×20 px | name verified |

> **Silhouette.** Boxy and mechanical where the other X-2 men are draped: hard armour plates square off the shoulders and shins, and a fat cylindrical weapon with a toothed disc hangs off one arm. The spiky blond crown and a single dark eye-patch rectangle across half the face are the head's whole story. Squint read: square shoulders / round saw disc / spiky crown / one dark eye block.

---

#### 1.23.6 Baralai

**Verified** (FF Wiki *Baralai* §Appearance and infobox, `[single source]`): height **176 cm**, age **20**, praetor of New Yevon. "Baralai is a **dark-skinned young man with brown eyes and short silver hair styled in a quiff, held back with a blue headband**. He wears clothing typical of a **Yevonite priest** but with alterations; rather than a robe he wears a **yellow-trimmed green coat with orange panels and glyphs on the chest** and **black-and-white panels bearing glyphs on the lower portion**. **The collar comes up to his chin.**"

| Part | Ramp | Confidence |
|---|---|---|
| Hair silver (short quiff) | `#6E7480` / `#A9B0BC` / `#E2E7EE` | name verified |
| Headband blue | `#2A4E82` / `#4E86C8` | name verified |
| Eyes brown | `#5A3A20` | name verified |
| Skin (dark) | `#4A2E1E` / `#7A4E30` / `#A87450` | name verified |
| Coat green | `#1E3A22` / `#356A38` / `#5C9A5E` | name verified |
| Coat trim yellow | `#B8811A` / `#F0BC2E` 1 px along every edge | name verified |
| Chest panels orange | `#8E4212` / `#D9741F` / `#F4A75A` | name verified |
| Chest glyphs | `--yevon-gold` `#E3B94A`, 1 px | name verified |
| Lower panels black + white | `#14141C` and `#F4F1E8`, alternating 6 px blocks with 1 px `#E3B94A` glyphs | name verified |
| High collar | coat ramp, rises to **chin height** — 5 px above the shoulder line | name verified |
| Staff (New Yevon rod) | `#7A6440` shaft, `#C8CCD6` head | `[estimate]` |

**Possession variant (required — the finale's hinge).** When Shuyin takes him, author a **second atlas**, not a tint:

| Change | Value | Confidence |
|---|---|---|
| Eyes | brown → **`#8BE8B0` glowing**, 2×2 px with a 1 px additive bloom dot on the emissive layer (§6.7) | `[estimate]` |
| Skin | shift 25% toward `#6E7A9A` (drained) | `[estimate]` |
| Rim light | forced to `#8BE8B0` at 80% alpha on **all** edges, not just the key-opposite edge | `[estimate]` |
| Pyreflies | 12 `--pyre-green` motes orbiting his head at radius 14 px, 0.3 Hz | `[estimate]` |
| Posture | head tilted back 1 px, arms loose — author 2 frames, held, never looping | `[estimate]` |
| **Collapse** | a **4-frame collapse at 8 fps** (buckle at the knees → fold forward → hands down → prone), then the 12 orbiting motes **detach and stream off-screen toward the Vegnagun chamber** over 0.8 s. The collapse is the beat; do not cut away from it | `[estimate]` |

> **Silhouette.** A green priest's coat that stops at the knee with a collar that swallows the jaw, so the head sits low and forward between high shoulders. The silver quiff points forward and up, the single element that breaks the coat's clean rectangle. At 48 px the read is: pale tuft / dark face / green box with a bright yellow outline.

---

#### 1.23.7 Brother, Buddy and Shinra — comm portraits only

The writing bible's E5 script has all three speaking **over comms from the Celsius**. They are never on the field in either X-2 chapter, so they need **only** a portrait cell and a talking-mouth variant — no body sprite, no rig.

**Portrait spec (shared).** **40×40 logical px** (larger than §1.21's 24×24 CTB icon, because comm portraits are a dialogue affordance and must read at a glance), drawn at 3× = 120×120 device px. Framing: head and shoulders, eye line at y=17, chin at y=31. Background is **not** the CTB `#101828` but the X-2 chrome's `#3A1A4E` → `#12060E` diagonal gradient at 0.85 alpha (§4.2), with the §4.2 1 px `#F7C8E4` / `#B0489E` double border and one `#F7B6D9` petal ornament at the top-left. Each portrait ships **two frames**: mouth-closed and mouth-open, alternating at **8 fps while that speaker's line is typing out**, frozen closed otherwise. `[estimate]`

| Character | Verified appearance | Must-read features in 40 px | Palette highlights |
|---|---|---|---|
| **Brother** | "**green eyes with the trademark spiral pupil of the Al Bhed**, **blond mohawk**, and **ears adorned with multiple earrings**. He wears long, **grey pants held by blue-and-red suspenders** and **black gloves with iron buttons and red-and-black cuffs**. His **chest and arms are heavily tattooed**." `[single source]` | the **mohawk** (a 6 px blade of blond standing off a shaved skull), earrings (3 × 1 px `#E3B94A` dots per ear), the spiral pupil, and the top of a **tattooed** bare chest with the suspender straps crossing it | mohawk `#8E6A1E` / `#D4A93C` / `#F5DA8E`; scalp `#B08A62`; tattoos `#2A4E82` 1 px linework; suspenders `#2F5E96` + `#B02A2A`; eyes `#5EA85A` + spiral `#1A2A16` |
| **Buddy** | "an **Al Bhed man with dark blond hair** who wears a **purple shirt and blue pants**. He is **always wearing goggles**." `[single source]` | the **goggles** — never remove them; two 9 px lenses on a 2 px strap, worn **on the eyes**, so his "eyes" are two bright discs; plus the purple collar | hair `#6E5426` / `#A8873E` / `#D2B674`; goggle lens `#E3B94A` at 55% over `#2A3246` frame; shirt `#6A2E80` / `#9A5AD0`; strap `#1E1A22` |
| **Shinra** | "He wears a **mask with an ochre visor**, and a **brown full-body suit with lime green mittens**. His suit has a **blue collar**." His face is **never seen** — the wiki notes this is a running joke `[single source]` | the **ochre visor** filling most of the head — a blank ochre rounded rectangle with a 1 px `#FFF6D0` specular streak; the **blue collar** ring; **no mouth**, so his "talking" frame is a **2 px visor brightness pulse** instead of a mouth swap | visor `#8A6A14` / `#C79A28` / `#EDC862`; suit `#3A2A1A` / `#6B4E2C` / `#99764A`; mittens `#4FB05E` / `#86D88E`; collar `#2F5E96` |

> **Silhouette (portraits).** Brother is a vertical blade on a round head; Buddy is a head with two bright circles where the eyes should be; Shinra is a featureless ochre oval. Three completely different head shapes at 40 px, which is the entire requirement — the player must know who is talking before reading the name plate.

---

## 2. Location design sheets

### 2.0 Shared battle-camera convention (all five scenes)

FFX battles do **not** use a fixed side view; the camera sits at a low three-quarter angle behind and to one side of the party, and cuts to per-action angles. For an HD-2D reconstruction we approximate this with one **base camera** plus a small set of **cut cameras**. `[estimate]` for every number below — no source publishes FFX's camera parameters.

> **RESOLVED CONFLICT (was a blocker).** An earlier revision of this section specified **FOV 38** with the base camera at `(+2.6, +3.1, +6.4)` and a **−14°** pitch, while `assets-and-tech.md` §2.4 fixes **FOV 35** with the battle camera at `(0, 6.4, 11.2)` and warns that changing FOV per shot changes the texel→pixel ratio (§2.5 there) and makes sprites shimmer. **The tech document wins on FOV**, because a variable FOV is mathematically incompatible with an integer texel ratio, which is the thing that keeps pixel art crisp. But the tech document's own preset positions do **not** produce its stated target of `S ≈ 2.0` texels-to-pixels — at `(0, 6.4, 11.2)` looking at `(0, 1.5, 0)` the distance is 12.23 units and `S` is **2.92**, and its other four presets land on 4.73, 2.04, 5.39 and 6.45. That is an error in the tech doc, and it is why the table below **re-derives every preset distance from an integer `S`.**

**The single camera contract (authoritative for both documents).**

| Constant | Value | Why |
|---|---|---|
| **FOV** | **35°**, vertical, **fixed for every preset and every cut** | `assets-and-tech.md` §2.4 — never animate it; dolly instead |
| Aspect | 16 : 9 | |
| Near / far | 0.1 / 200 | keep far tight for depth precision |
| Roll | 0, always | |
| Render buffer | **1280 × 720** | = `assets-and-tech.md` §2.5 design canvas = §6.1 internal resolution; one buffer, not two |
| `PPU` (texels per world unit) | **32** | a 64-texel party sprite = 2.0 world units |
| Texel ratio at a preset | `S = (H / (2·d·tan(FOV/2))) / PPU`, `H = 720`, `tan(17.5°) = 0.315299` | `assets-and-tech.md` §2.5 |
| **Distance for an integer `S`** | `d = 720 / (2 · S · 32 · 0.315299) = 35.68 / S` | derived |

Integer-`S` distances: **S=2 → d = 17.84**, **S=3 → d = 11.89**, **S=4 → d = 8.92**, **S=5 → d = 7.14**, **S=6 → d = 5.95** world units from the look-at point. Every preset below sits on one of them, so **no preset ever produces a fractional texel scale.** `[estimate]` — engineering derivation, not a claim about the original game.

| Camera | Position | Look-at | `S` | Distance | Pitch | Use |
|---|---|---|---:|---:|---:|---|
| **`battle` (base/default)** | `(0, 6.27, 10.90)` | `(0, 1.5, 0)` | **3** | 11.89 | **−23.6°** | default CTB camera; party and enemies both in frame |
| **`battle_close`** | `(0, 4.71, 8.28)` | `(0, 1.4, 0)` | **4** | 8.92 | **−21.8°** | attack / ability beats |
| **`boss_wide`** | `(0, 9.64, 16.31)` | `(0, 2.4, 0)` | **2** | 17.84 | **−23.9°** | Mortiorchis, Yunalesca f3, BFA, Vegnagun |
| **`boss_reveal`** | `(0, 0.90, 11.71)` | `(0, 3.0, 0)` | **3** | 11.89 | **+10.2°** (looks **up**) | the one shot that tilts up, replacing the old FOV-44 reveal |
| **`cutscene_low`** | `(2.37, 2.46, 6.69)` | `(0, 1.7, 0)` | **5** | 7.14 | **−6.1°** | dialogue beats |
| **`overdrive`** | `(0, 3.09, 5.81)` | `(0, 1.8, 0)` | **6** | 5.95 | **−12.5°** | Overdrive and summon flourishes |

**Overdrive orbit.** The old "orbit ring, radius 7.0, FOV 30→26 dolly" is replaced by an orbit **at the `overdrive` preset's fixed distance of 5.95** around the actor, at **22°/s**, with the camera height held at the preset's y. FOV never moves. To get the dolly-in feel, lerp `d` from the `battle` distance 11.89 to the `overdrive` distance 5.95 over 1.2 s — `S` passes through non-integers *during the move*, which is acceptable because motion hides shimmer; it must land exactly on 5.95. `[estimate]`

**Party and enemy layout on the ground plane** (unchanged, and it still fits): three party sprites in a shallow left-facing arc at world x = `-1.6, -2.3, -3.0`, z = `+0.5, 0.0, -0.5`; enemies mirrored at x = `+1.8 … +3.4`. At the `battle` preset the visible world height at the look-at plane is `720/(32·3) = 7.5` units and the visible width is `7.5 × 16/9 = 13.33` units, i.e. x from **−6.67 to +6.67** — both groups clear the frame edge by more than 3 units. Sprites are billboards that yaw-lock to the camera but never pitch (see §6.2).

**Idle drift.** `x += sin(t·0.17)·0.12`, `y += sin(t·0.23 + 1.1)·0.06`, driven from the injected clock so Playwright screenshots stay deterministic (`assets-and-tech.md` §2.4/§5.4). This is a **position** drift only; it perturbs `d` by well under 1%, so `S` stays inside the tech doc's ±8% assert. `[verified: 2 sources — both project documents specify the same drift]`

**Typical battle-start framing:** the `battle` camera begins **1.5 units further back along its own view vector** (d = 13.39) and dollies in to 11.89 over 0.5 s as the swirl transition (§3.8) resolves.

**Dev assert (keep the tech doc's, with the per-preset expectation).**

```ts
if (import.meta.env.DEV) {
  const S = (720 / (2 * d * Math.tan(35 * Math.PI / 360))) / 32;
  if (Math.abs(S - preset.expectedS) > 0.08 * preset.expectedS)
    console.warn(`[hd2d] texel ratio drifted on ${preset.name}: S=${S.toFixed(3)}`);
}
```

---

### 2.1 Mt. Gagazet — trail near the summit (Seymour Flux)

**Verified context.** Gagazet is the sacred mountain of the **Ronso**, connecting the Calm Lands to Zanarkand `[single source]`. Its named sub-areas are **Mountain Trails**, **Gagazet Summit**, and **Fayth Scar** `[single source]`. The party climbs past **monuments left by previous summoners marking those who fell**; the Seymour Flux fight happens at the section called **the Prominence**, where Seymour has just murdered dozens of Ronso including Kelk, Biran and Yenke `[verified: 2 sources]`. Further up is a **wall of thousands of fayth** used for the group summoning of Dream Zanarkand. At the summit the party "views the **ruins of Zanarkand against the setting sun**" `[single source]`. In X-2, the peak's perpetual **fog lifted** after the Fayth Scar went dormant, revealing **Floating Ruins** `[single source]`.

**Composition.** A narrow ledge of wind-scoured rock running left-to-right across the lower third, dropping away into cloud on the camera side. Behind the ledge, the mountain face rises as a near-vertical wall of blue-grey stone, cut by long horizontal snow shelves. Two or three **summoner memorial stones** — rough standing slabs carved with Yevon script — stand along the trail; place one at frame-left as a foreground occluder. The sky is a cold high-altitude gradient with the sun low and behind the peak.

**Palette** (`[estimate]`):

| Layer | Hex |
|---|---|
| Sky top | `#1E2C52` |
| Sky horizon | `#7A8FBE` |
| Sun glow band | `#E8C489` at 55% alpha |
| Far peaks (fog-lerped 70%) | `#8FA2C4` |
| Mid rock face | `#4E5A70` / `#6E7B92` / `#96A3BA` |
| Near rock (playfield) | `#3A4456` / `#576480` / `#7C8AA6` |
| Snow | `#C6D4E6` / `#E8F0FA` / `#FFFFFF` |
| Snow shadow (blue) | `#8FA6C8` |
| Memorial stone | `#5E5A54` / `#867F74`, glyphs `--yevon-gold` at 60% |
| Ronso shrine accents | `#7E2A2A` used **sparingly**, 3 or 4 pixels only |

**Lighting rig.**

| Light | Type | Colour | Intensity | Direction |
|---|---|---|---|---|
| Key | Directional | `#FFD9A8` | 1.05 | azimuth 250 deg, elevation 16 deg (low, from behind-left) |
| Fill | Hemisphere | sky `#A8C0E8` / ground `#4A5468` | 0.55 | — |
| Rim | Directional | `#BFE0FF` | 0.7 | azimuth 70 deg, elevation 30 deg |
| Practical | Point at Mortiorchis core | `#8BE8B0` | 1.4, radius 6 m, flickers +/-12% | — |

**Particles.**
- **Snow:** 300 billboards, size 1-2 px, fall speed 0.4-0.9 m/s, horizontal wind 1.2 m/s with +/-0.4 gusts, colour `#E8F0FA` at 70% alpha. Two depth bands (near band 2x size, 1.6x speed, 40% alpha) to create parallax.
- **Wind streaks:** 12 long thin quads, 24x1 px, `#D4E2F4` at 25%, crossing the frame every 2-4 s.
- **Pyreflies (post-fight):** 40 `--pyre-green` motes rising from the ledge when the Ronso are sent — this is the emotional beat of the scene.

**Key set pieces.** (1) A **Ronso memorial cairn** of stacked stones with a broken spear planted in it — foreground left. (2) The **Prominence** itself: a jutting rock spur behind the enemy position, silhouetted against the sky, giving Mortiorchis something to be framed against. (3) **Snow-buried summoner statues**, half-effaced, receding into the fog.

**Money shots.**
1. **Low three-quarter from the party's heels**, ledge line running to the lower-left corner, Mortiorchis framed dead-centre against the sky with the Prominence spur behind it, snow streaking diagonally across the whole frame.
2. **Silhouette wide** — camera pulled to 12 units, the entire ledge in near-black against the `#E8C489` sun band, party and boss both reduced to outlines, with only the mount's `--pyre-green` core glowing. Take this as the loading/chapter-card image.
3. **Aftermath vertical** — camera tilts up from the empty ledge; a column of 40 green pyreflies rises past a memorial stone toward the dark sky. No characters in frame.

---

### 2.2 Zanarkand Dome — great hall (Yunalesca)

**Verified context.** The Zanarkand Dome (Japanese name transliterates as "Yevon Dome") is a **temple** in the Zanarkand ruins `[single source]`. After Yu Yevon turned Zanarkand's citizens into fayth, **Yunalesca became master of the dome**, and after killing Sin with her husband **Zaon** as the first Final Aeon she "died, but remained in the dome as an unsent", existing only to preserve Yu Yevon's secret and to make new Final Aeons `[single source]`. The chamber contains a **Cloister of Trials** and, in later versions, is where **Dark Bahamut** is fought `[single source]`. The dome sits inside the wider **Zanarkand ruins**, which the party first sees **against the setting sun** from Gagazet's summit `[single source]`.

**Composition.** A vast, dead ceremonial hall. A long processional floor of cracked pale stone runs from the camera to a raised circular dais where Yunalesca waits. Rows of broken pillars line both sides, most snapped at half height, receding into darkness. Overhead, the dome is ruptured: a ragged oculus admits one shaft of cold light that lands exactly on the dais. Behind the dais, a wall of Yevon glyphs and the faded silhouettes of statues. Everything is monumental and **too large for people** — that scale mismatch is what sells the scene.

**Palette** (`[estimate]`):

| Layer | Hex |
|---|---|
| Ambient darkness | `#0E0C18` |
| Floor stone | `#3A3444` / `#5A5268` / `#82788E` |
| Floor inlay (Yevon spirals) | `#A98A3E` at 50% |
| Pillars | `#2E2A3A` / `#4A4458` / `#6E6680` |
| Light shaft | `#C8D8F0` at 22% alpha, additive |
| Dais | `#6E6480` / `#9A8FAA`, ringed `--yevon-gold` |
| Wall glyphs | `#E3B94A` at 35%, dimly self-lit |
| Deep background void | `#08070E` |
| Yunalesca accent bloom | `#F2D24A` |

**Lighting rig.**

| Light | Type | Colour | Intensity |
|---|---|---|---|
| Key (the oculus shaft) | Spot, 18 deg cone, from `(0, 14, -2)` | `#D8E4F8` | 2.2, soft shadows |
| Ambient | Hemisphere sky `#3A3450` / ground `#14101C` | — | 0.35 |
| Glyph practicals | 6 Point lights along the back wall | `#E3B94A` | 0.45 each, radius 4 m |
| Yunalesca rim | Point attached to the boss | `#F2D24A` | 0.9, radius 5 m — **brightens by 30% with each form change** |

**Particles.** Slow **dust motes** in the light shaft (80 motes, `#E8EEFA` at 35%, drifting 0.06 m/s, brightness modulated by proximity to the shaft volume). No wind. When form 2 begins, add 30 **violet motes** `#9E6E9E` rising from the dais; at form 3, the dust in the shaft **reverses direction** and falls upward — a cheap, striking wrongness cue.

**Key set pieces.** (1) The **dais** with a spiral Yevon inlay, 6 m across, raised two steps. (2) A **shattered statue pair** flanking the back wall — Yunalesca and Zaon, faces eroded away. (3) **Hanging stone chains** from the broken dome, swaying imperceptibly. (4) A scatter of **old summoner staves** left on the floor at the hall's edges.

**Money shots.**
1. **Symmetric processional** — camera on the hall's centre axis, low, the two pillar rows converging on the dais, the light shaft dropping straight down onto Yunalesca's silver hair. Perfect one-point perspective; use it for the fight's opening.
2. **Form-3 tilt-up** — camera at the dais floor looking almost straight up as the gorgon head fills the frame against the ruptured dome, the party as tiny silhouettes in the lower corner.
3. **The reveal from behind Yuna** — over-the-shoulder on Yuna (staff planted, back to camera) with Yunalesca small and centred in the shaft far ahead: the composition that states the scene's question.

---

### 2.3 Dream's End (Braska's Final Aeon, then Yu Yevon)

**Verified context.** Dream's End is the innermost area of Sin and is described as "**a ruined version of Zanarkand's blitzball stadium with a platform leading to the centre of the arena**"; "**the pyreflies in the surrounding area reflect Jecht's thoughts**, and thus Sin's core looks like a warped version of Dream Zanarkand with a **flaming Zanarkand Abes logo** on the background" `[single source]`. The connected areas set the palette of the whole interior: the **Sea of Sorrow** is "a **haunting, red-tinged sea** winding through a **cloudless vista** ... traversed through a series of waterfalls and watering blue platforms. **Symbols of Yevon surround this place**"; **the Nucleus** is "a surreal environment of **crystalline floors and walls**" where "**the camera angle is always moving**" `[single source]`. Here the party meets Jecht, fights Braska's Final Aeon, and then Yu Yevon appears and possesses the aeons one by one `[verified: 2 sources]`. **The name of the area where the aeons and the final boss are fought is never revealed** `[single source]` — so we are free to author that space.

**Composition.** A circular arena floor floating in a red void: the warped memory of a blitzball stadium seen from inside the water. Concentric tiers of ghost-seating rise and dissolve into nothing. Above and behind, a colossal **burning Zanarkand Abes emblem** hangs in the sky like a brand. Below the arena rim there is no ground, only red depth with slow luminous currents. Broken stadium struts drift, unattached, at odd angles.

**Palette** (`[estimate]`):

| Layer | Hex |
|---|---|
| Void deep | `#2A0A12` |
| Void mid (haunting red) | `#6E1A22` |
| Void upper haze | `#B04A3E` |
| Arena floor | `#4A3038` / `#6E4A50` / `#96706E` |
| Floor Yevon inlay | `#E3B94A` at 45% |
| Ghost seating (60% alpha) | `#8E5A5E` |
| Abes emblem core | `#FFE08A` |
| Abes emblem flame | `#FF7A2E` to `#C93A1E` |
| Drifting struts | `#3E2A30` / `#5E4448` |
| Pyrefly accents | `--pyre-white`, `--pyre-green` |

**Lighting rig.**

| Light | Type | Colour | Intensity |
|---|---|---|---|
| Key | Directional from behind the emblem | `#FF9A5E` | 1.3 |
| Underlight | Directional from below the arena | `#8E1A22` | 0.6 — the key wrongness cue: faces lit from beneath |
| Ambient | Hemisphere sky `#8E2A2E` / ground `#2A0A12` | — | 0.5 |
| Emblem practical | Area light on the emblem plane | `#FF7A2E` | 2.0, **pulses with Braska's Final Aeon's Overdrive gauge** |

**Particles.** **Embers** rising (not falling): 120 motes, `#FF7A2E` to `#FFE08A`, 0.5-1.1 m/s upward, with 0.2 m/s lateral drift and a 1.5 s fade. Plus **pyreflies**: 50 `--pyre-white` motes on slow bezier paths, which **converge on the arena centre** during the Yu Yevon phase. During the Yu Yevon fight only, add a 5% screen-space chromatic wobble.

**Key set pieces.** (1) The **central platform** reached by a narrow causeway — Jecht stands on it in the pre-fight scene. (2) The **flaming Abes emblem** — the single most important background element; make it large (35% of frame height) and always visible over the boss's shoulder. (3) **Floating stadium fragments**, including a recognisable curved section of goal ring. (4) For the Yu Yevon phase, the arena floor **cracks open** and the aeon-possession fights take place over an exposed core of white light.

**Money shots.**
1. **Father and son on the causeway** — long lens, camera level with the platform, Jecht at frame-right in silhouette against the burning emblem, Tidus small at frame-left, embers filling the space between them.
2. **Transformation upshot** — camera drops to the arena floor and tilts up as Braska's Final Aeon's spike-wings erupt, the emblem directly behind its head so the fan of spikes cuts across the fire.
3. **Yu Yevon's glyph** — near-macro on the gold glyph disc filling a third of the frame, the party as three tiny silhouettes far below, all pyreflies streaming inward. Near-monochrome: red void, gold disc, white motes.

---

### 2.4 Bevelle Underground (FFX-2 Bahamut)

**Verified context.** A **hidden complex beneath Bevelle, filled with machina remaining from the Machina War**, reached by jumping into a hole in the Chamber of the Fayth `[single source]`. Named sub-areas: **Restricted Area**, **Labyrinth**, **Gaol**, **Limbo** `[single source]`. The party fights **Baralai** here, he flees, and then "the Gullwings are **confronted by a possessed Bahamut**, and forced to fight it"; afterwards **Vegnagun is missing from its chamber, with a large hole in the ground in its place** `[single source]`. The **Dark Knight dressphere** is found here in a treasure chest `[single source]`.

**Composition.** A cathedral of machinery. Bevelle's surface style is white stone and blue banners; underground it becomes the same architecture stripped to its steel skeleton — long ribbed vaults of riveted plate, catwalks at multiple heights, thick cable bundles hanging in catenaries. The fight takes place in **Vegnagun's empty chamber**: a circular pit of graduated machina plating with a vast **hole torn in the floor** at the far side (the weapon's exit), venting light from below. Bahamut is framed hovering over that hole.

**Palette** (`[estimate]`):

| Layer | Hex |
|---|---|
| Ambient dark | `#0A0E16` |
| Machina plate | `#2A3442` / `#44526A` / `#68798E` |
| Rivets / trim | `#8A96A6` |
| Bevelle white stone (inserts) | `#B8BCC4` / `#DCE0E6` |
| Bevelle blue banner | `#1E3E8E` / `#3A64C8` |
| Cable bundles | `#1A1E28` / `#30364A` |
| Emergency lamp | `#E0742E` |
| Hole light from below | `#5EC8E8` to `#C8F2FF` |
| Possession violet | `#7A2ED8` / `#B048F0` |

**Lighting rig.**

| Light | Type | Colour | Intensity |
|---|---|---|---|
| Key | Spot from the floor hole, pointing **up** | `#6ED2EE` | 2.4 — underlights everything, the signature look |
| Fill | Hemisphere sky `#2A3A58` / ground `#0A0E16` | — | 0.4 |
| Practicals | 8 Point lamps along the catwalks | `#E0742E` | 0.5 each, radius 5 m, 3 of them flicker |
| Boss aura | Point attached to Bahamut | `#B048F0` | 1.2, **pulses once per countdown tick 5 to 0** |

**Particles.** **Steam jets** from wall vents: 4 emitters, cone 25 deg, `#C8D8E4` at 30% alpha, 1.8 s bursts every 6-9 s. **Dust in the up-shaft**, 60 motes. **Electrical arcs**: 1 px `#C8F2FF` zigzags between exposed conduits, 3 frames, every 2-5 s. During Mega Flare charging, add violet motes converging on Bahamut's chest at an accelerating rate synchronised to the countdown.

**Key set pieces.** (1) The **torn floor hole**, about 8 m across, with bent plate teeth around the rim and light pouring up. (2) A **dead machina gantry** that once cradled Vegnagun — an empty, Vegnagun-shaped negative space, which tells the story without dialogue. (3) **Yevon-glyph stone inserts** that show Bevelle deliberately built its holy city on top of a war machine. (4) A **prison-gaol corridor** visible behind bars at frame-edge for depth.

**Money shots.**
1. **The empty cradle** — camera behind the party looking across the pit at the vast Vegnagun-shaped gantry and the torn hole; light from below rakes up the walls. Establishing shot, no boss yet.
2. **Bahamut over the hole** — three-quarter low, Bahamut's wings spread wide enough to exceed the frame, up-light turning the underside of the wings cyan and the topside near-black, violet veins glowing.
3. **Countdown close** — tight on Bahamut's head with the `5` ... `0` numeral hanging beside it, the party out of focus in the bottom corner. Use at countdown = 1.

---

### 2.5 Farplane / Vegnagun's chamber (Vegnagun and Shuyin)

**Verified context.** The Farplane is the underworld beneath Spira's surface; in FFX it is "a **small rocky landmass**" and an FMV shows it "**surrounded by a rich vibrant environment**" `[single source]`. In X-2 its areas are **Road to the Farplane**, **Farplane Abyss**, **Heart of the Farplane**, and **Vegnagun** `[single source]`. Shinra's theory is that the Farplane holds energy that "would power countless cities of light" `[single source]`. Vegnagun fled here and, at the heart of the Farplane, "could absorb untold amounts of energy" `[single source]`. The concept draws on Japanese **yomi** — neither paradise nor hell, a shadowy continuation `[single source]`. The final Shuyin fight happens here, and **the party does not pose on victory** `[single source]`.

**Composition.** Inverted, dreamlike, un-gravitied. A floating island of pale rock hangs in an open sky of layered colour; **waterfalls of light fall upward** from its edges into a bright haze above. Flower fields carpet the rock in impossible colours. Far below and around, more landmasses drift at wrong angles. For the **Vegnagun** phases the framing changes entirely: a colossal insect-machine occupies the space, so we cut to **part-scale** compositions (a leg fills the frame; the head is a cannon aimed out of frame). For the **Shuyin** fight, return to an empty flower-field platform with Vegnagun's dead bulk as a distant silhouette.

**Palette** (`[estimate]`):

| Layer | Hex |
|---|---|
| Sky zenith | `#3E2A6E` |
| Sky mid | `#7A5AB8` |
| Sky horizon glow | `#F7B6D9` |
| Upper haze | `#FFE4F2` at 40% |
| Rock (pale, chalky) | `#8E86A0` / `#BCB4C8` / `#E2DCEA` |
| Flower field A | `#F7B6D9` / `#FFD9EC` |
| Flower field B | `#B8A0F0` |
| Flower field C | `#8BE8B0` |
| Upward light-falls | `#E9FFF4` at 55%, additive |
| Distant landmass (fogged) | `#9E8ECC` |
| Shuyin unsent shimmer | `#8FA8C0` |

**Lighting rig.**

| Light | Type | Colour | Intensity |
|---|---|---|---|
| Key | Directional from **below** (elevation -20 deg) | `#FFD2EA` | 1.2 — the Farplane is lit from underneath |
| Counter-key | Directional from above | `#B8A0F0` | 0.6 |
| Ambient | Hemisphere sky `#C8A8F0` / ground `#F7B6D9` | — | 0.8 (unusually high — this place has almost no real shadows) |
| Vegnagun core | Point inside the machine | `#B048F0` | 1.8, radius 12 m |

**Particles.**
- **Farplane petals:** 200 billboards, 2x2 px, colours cycling `#F7B6D9` / `#FFD9EC` / `#B8A0F0`, drifting **upward** at 0.3-0.7 m/s with a 0.4 Hz lateral sine — petals here must rise, never fall.
- **Pink pyreflies:** 60 motes of `--pyre-pink` with `--pyre-white` cores, longer trails (8 samples) than elsewhere in the game.
- **Light-fall spray:** at the island edges, 3 upward emitters of 1 px `#E9FFF4` particles at 1.8 m/s that fade over 2.5 s.
- **Vegnagun scale-dust:** during Vegnagun phases only, large slow `#8E96A8` moth-scale flakes, 3x3 px, 25 of them.

**Key set pieces.** (1) The **upward waterfalls** at the island rim. (2) A **field of impossible flowers** that parts as characters walk. (3) **Vegnagun's dead silhouette** on the horizon for the Shuyin fight — a mountain-sized insect corpse, fogged to 65%. (4) A single **pair of footprints ending in nothing** near the platform edge — Shuyin and Lenne's place. (5) For the head battle, the **cannon muzzle** pointing off-frame toward the viewer's left, building light.

**Money shots.**
1. **Arrival wide** — party silhouetted on the island's lip against an enormous pink-violet sky, petals and light rising through the whole frame. This is the game's prettiest single image; make it the chapter-5 card.
2. **Vegnagun leg scale shot** — camera at ground level, the leg's foot alone taller than the frame, the three girls as small dark shapes in the lower-left eighth, moth-wing shadow dappling the rock.
3. **Shuyin and Lenne** — two-shot at eye level, both at 70% opacity, pink pyreflies streaming between them, the background blown to near-white. Hold on it; no UI, no damage numbers.

---

## 3. FFX battle UI specification

### 3.0 UI canvas and scaling

All FFX UI is authored on a **640 x 360 logical canvas** and drawn with integer scaling. All coordinates below are in logical px, origin top-left. `[estimate]` — this is our convention, not the original game's.

> **RESOLVED CONFLICT (was a blocker).** `assets-and-tech.md` §2.5 declares the design canvas to be **1280 × 720 letterboxed**, and this section declared it to be **640 × 360 at 3×**. These are **the same canvas** and the tech doc says so itself — its own rationale line reads "integer 2× of 640×360". The resolution is therefore a naming fix, not a choice:
>
> | Layer | Resolution | Scale |
> |---|---|---|
> | **UI authoring grid** | **640 × 360** — every rect in §3, §4 and §5 is in these units | 1× (authoring only; nothing is ever *drawn* at 1×) |
> | **Composite / render buffer** (3D scene **and** UI) | **1280 × 720** | UI atlas blitted at exactly **2×** the authoring grid |
> | **Presentation** | the display, `object-fit: contain`, **letterboxed**, nearest blit | ×1.5 at 1080p ⇒ **3 device px per UI-authoring px**, which is what §0.3's "1 logical px = 3 device px at 1080p" always meant |
>
> There is **one** framebuffer at 1280 × 720, not a 3D buffer plus a separate native-resolution UI pass. §6.1's older "draw the UI at native 1080p on top from its own 3× bitmap atlas" is superseded: ship the UI atlas at **2×** (1280 × 720 space) and let the single final blit handle the display scale. This also makes Playwright screenshots (`assets-and-tech.md` §5.3) byte-comparable, because there is only one resolution in the pipeline.
>
> If the viewport is not an integer multiple of 1280 × 720, **letterbox and scale the whole composite**; never fractionally scale the UI relative to the scene.

**Verified layout facts.** These four are sourced:

| Fact | Source |
|---|---|
| "The turn order, or **Act List**, is shown on the **right side of the screen**" and shows both characters and enemies | Gamer Guides `[verified: 2 sources]` (also Jegged, Game8) |
| "The **picture at the top of the list** indicates which character's turn is coming next" | Jegged `[single source]` |
| Enemies "display a **letter next to their name**" to disambiguate multiples | Jegged `[single source]` |
| "The **bottom right** corner displays each character's **HP and MP** values alongside their **Overdrive bar**" | Gamer Guides `[single source]` |
| The **Command Window** shows the available commands; the **Status Window** shows party HP and MP; the **Help Window** shows information about the thing the cursor points at | Game8 `[single source]` |
| Haste / Hastega **move characters forward in the CTB window** | Jegged `[verified: 2 sources]` (also Game8) |
| **L1 / LB** swaps active party members mid-battle (the Switch flow) | Gamer Guides `[single source]` |

Everything else in section 3 — every coordinate, every hex, every duration — is `[estimate]`.

### 3.1 Screen map

```
0,0                                                          640,0
 +--------------------------------------------------------------+
 |  [HELP WINDOW]  x16 y10 w608 h26   (only when a cursor is on) |
 |                                                               |
 |                                            +---------------+  |
 |                                            | CTB / ACT     |  |
 |                                            | LIST          |  |
 |                                            | x548 y44      |  |
 |                                            | w84 h236      |  |
 |                 (3D scene)                 +---------------+  |
 |                                                               |
 |  +-------------------+                                        |
 |  | COMMAND WINDOW    |          +---------------------------+ |
 |  | x16 y214 w164 h132|          | PARTY STATUS  x296 y284   | |
 |  +-------------------+          | w328 h64                  | |
 |                                 +---------------------------+ |
 +--------------------------------------------------------------+
                                                            640,360
```

Sub-menus (Skills / Black Magic / White Magic / Items / Overdrives / Summon) open as a **second panel immediately to the right of the command window**: `x188 y150 w232 h196`. The command window stays visible and its selected row stays highlighted, so the player always sees the path they took.

### 3.2 CTB / Act List (right side)

The single most important UI element in the game — the whole battle system is legible only through it.

| Property | Value |
|---|---|
| Panel | `x548 y44 w84 h236`, **no window chrome** (the list floats directly over the scene) |
| Entries visible | **up to 10**, top = soonest to act |
| Entry size | icon 24x24, row height 23 (1 px overlap so the column reads as a stack) |
| Row x | party rows at `x = 556`; enemy rows indented to `x = 564` (a 8 px stagger makes friend/foe scannable at a glance) |
| Current actor (row 0) | icon scales to **28x28**, shifts **left by 8 px** (to `x = 548`), border becomes `#FFF0A8` 1 px + a 2 px `#F2C21E` outer glow at 50% alpha, and pulses brightness 100% to 78% on a 0.9 s sine |
| Non-current rows | border `#5A7FA8` 1 px; fill behind icon `#101828` at 80%; rows 5-9 fade alpha 100% to 45% linearly so the list dissolves downward |
| Enemy rows | border `#A83A3A`; a 6x8 px capital letter (A, B, C ...) drawn bottom-right of the icon in `#F4F1E8` with a `#0B0A12` 1 px shadow — **verified behaviour** |
| Name label | optional 5x7 px text to the left of the icon, `#C8D4E4`, only for the top 3 rows |
| Status pips | up to 3 tiny 4x4 px status icons stacked on the icon's left edge (see 3.6) |
| Insert animation | when the order recomputes, rows **slide** to their new y over 0.22 s with an ease-out cubic; a newly inserted row fades in over 0.15 s. Never snap — the slide is how the player perceives Haste/Delay |
| Haste / Delay feedback | on a Haste, flash the moved row `#7EE8B0` for 3 frames as it slides up; on a Delay, flash `#B048F0` as it slides down |
| Overdrive-ready marker | a 5x5 px `#F2C21E` diamond at the icon's top-right corner |

**Data contract.** The list renderer needs, per entry: `{ iconId, isParty, letterTag?, statusIcons[], overdriveReady, tickValue }`, sorted ascending by `tickValue`. Re-sorting is the renderer's only job; all timing lives in the battle sim.

### 3.3 Command window (bottom-left)

| Property | Value |
|---|---|
| Rect | `x16 y214 w164 h132`, corner radius **4 px** |
| Background | vertical gradient, **top `#1B3A6B` to bottom `#050912`**, plus a 1 px inner top highlight row of `#2E5A9E` |
| Panel alpha | 0.88 |
| Border | **2 px**: outer 1 px `#DCE8F5` (near-white), inner 1 px `#4E86C8` (blue). Corners drawn with a 4 px rounded quarter-arc, mitred so no pixel is orphaned |
| Corner ornament | a 3x3 px `#9FC4E8` notch inset 3 px from each corner — the FFX windows read "official" because of small corner detailing |
| Row height | 22 px; 5 rows visible; up to 6 items scroll with a 2 px `#4E86C8` scrollbar on the right inner edge |
| Text | 10 px UI face (section 3.9), colour `#EDF3FA`, 1 px `#08101E` drop shadow at offset (1,1) |
| Selected row | text `#FFFFFF`, plus a horizontal gradient bar behind the row from `#2E5A9E` (left, 70% alpha) to transparent (right) |
| Disabled row | text `#6C7B90`, no shadow |
| MP cost | right-aligned in the row, `#8FD0F0`; greyed to `#4A6A80` if unaffordable |

**Default command set** (verified as the game's base actions `[single source]`): **Attack**, **Item**, **Defend**, **Switch**; plus character-specific: **Skill** (Tidus/Auron/Wakka/Rikku special commands), **Black Magic** (Lulu), **White Magic** (Yuna), **Summon** (Yuna only), **Overdrive** (when the gauge is full). Changing equipment is also a turn action for everyone except Seymour `[single source]`.

**The finger cursor.** A right-pointing gloved hand, **13 x 11 px**, drawn to the **left** of the selected row at `x = row.x - 16`.

| Cursor part | Hex |
|---|---|
| Glove fill | `#F4F1E8` |
| Glove shading | `#B9C4D2` |
| Cuff band | `#4E86C8` |
| Outline | `#0B0A12` 1 px |
| Motion | idles bobbing **+/-1 px horizontally** on a 0.6 s sine; on row change it moves instantly (no tween) but plays a 2-frame squash |

**Sub-menu panel.** `x188 y150 w232 h196`, identical chrome, 2-column grid for Items (icon 12x12 + name + quantity `xNN` right-aligned in `#C8D4E4`). Magic lists show element colour chips: Fire `#F2712E`, Blizzard `#6EC8F0`, Thunder `#F2D24A`, Water `#3A8FD0`, Holy `#FFF2C0`, non-elemental `#C8D4E4`.

**The Switch flow (party swap).** Verified: **L1 / LB** opens it `[single source]`, and swapping in a character costs that character's turn while still granting them AP `[single source]`. UI spec `[estimate]`:

1. Pressing the trigger (or choosing **Switch**) dims the scene by 35% and slides a **roster strip** up from the bottom: `x16 y268 w608 h72`, same chrome.
2. All seven characters appear as 40x40 portraits in a row; the three currently active are marked with a `#F2C21E` bar under the portrait; KO'd characters are desaturated with a red `#C7343C` cross.
3. A **triangle marker** — a 9x9 px `#F2C21E` equilateral triangle pointing **down**, outlined `#0B0A12` — hovers 4 px above the highlighted portrait, bobbing +/-1 px vertically at 0.7 s. This triangle is the swap affordance; confirm swaps the highlighted character into the slot of the character whose turn it is.
4. On confirm: 0.3 s cross-dissolve of the two sprites on the field, the CTB list re-sorts with the slide animation, and the roster strip slides away.

### 3.4 Party status window (bottom-right)

Verified: the bottom-right corner shows each character's HP and MP plus the Overdrive bar `[single source]`.

| Property | Value |
|---|---|
| Rect | `x296 y284 w328 h64`, same chrome as the command window but **alpha 0.80** |
| Rows | 3, height 20, starting `y = 288` |
| Name | `x306`, width 62, 10 px text, `#EDF3FA`; the **acting** character's name goes `#FFF0A8` |
| HP label | tiny 7 px `HP` in `#8FA4BC` at `x372` |
| HP value | `x386`, **right-aligned at x430**, format `cur/max` with `cur` at 12 px and `/max` at 9 px in `#9FB0C4` |
| MP label + value | `x440`, value right-aligned at `x486`, same two-size treatment |
| Overdrive gauge | `x494 y+6 w112 h6` |

**HP / MP colour states** (`[estimate]` hexes; the **yellow-at-critical** rule is `[single source]`):

| State | Condition | Colour |
|---|---|---|
| Normal HP | HP > 50% max | `#F4F1E8` (near-white) |
| Critical HP | **HP < 50% max** — verified that FFX turns HP digits yellow at this threshold | `#F2D24A` |
| Near-death HP | HP <= 12.5% max (our addition for readability) | `#F28A2E`, digits pulse alpha 100% to 60% at 1.4 Hz |
| KO | HP = 0 | `#C7343C`, the whole row desaturates to 35% and the name gets a 1 px `#C7343C` strikethrough |
| MP normal | any | `#8FD0F0` |
| MP zero | MP = 0 | `#4A6A80` |
| Value tick | on any change, the number **rolls** to its new value over 0.35 s and flashes `#FFFFFF` for 2 frames |

**Overdrive gauge.**

| Part | Hex / spec |
|---|---|
| Track (empty) | `#2A3246`, 1 px `#141A28` inner shadow along the top |
| Fill | vertical gradient `#F2C21E` (bottom) to `#FFF0A8` (top) |
| Fill leading edge | 1 px `#FFFFFF` |
| Fill animation | eases to the new width over 0.4 s |
| **Full** | the whole bar flashes between `#FFF0A8` and `#FFFFFF` at 3 Hz, a 2 px `#F2C21E` glow appears around it, and the word `OVERDRIVE` (7 px, `#FFF0A8`) fades in above the bar for 1.2 s the moment it fills |
| Charge modes | FFX has selectable Overdrive Modes (Stoic, Warrior, Comrade, ...) that change the fill trigger; the UI does not distinguish them — only the fill rate differs. Mode selection lives in the pre-battle menu, not the battle HUD |

**Status icons.** 4 columns of 12x12 px icons at `x300..x348`, wrapping to a second row if more than 4. Each is a flat glyph on a 10x10 rounded chip:

| Status | Chip | Glyph |
|---|---|---|
| Haste | `#2E7A4E` | double chevron `#7EE8B0` |
| Slow | `#4A3A6E` | single chevron down `#B48FE0` |
| Protect | `#2E4A7A` | shield `#9FC4E8` |
| Shell | `#4A2E6E` | hex shell `#C8A0F0` |
| Reflect | `#6E5A1E` | mirror arc `#FFE08A` |
| Regen | `#2E6A4A` | plus `#8BE8B0` |
| Poison | `#4A6A1E` | bubble `#A8D84A` |
| Silence | `#5A5A5A` | crossed note `#C8C8C8` |
| Darkness | `#2A2A34` | closed eye `#8E8E9E` |
| Sleep | `#2E4A6A` | Z `#9FC4E8` |
| Zombie | `#3E5A2E` | skull `#A8C48A` |
| Berserk | `#6E2A1E` | fang `#F28A6A` |
| Petrify | `#4E4A42` | cracked block `#B4AE9E` |
| Curse | `#3A1E3A` | broken circle `#C04AC0` |
| Auto-Life | `#6E5A1E` | feather `#FFF0A8` |
| Doom | `#1E1E28` | countdown numeral `#C7343C` |

### 3.5 Target selection

| Element | Spec |
|---|---|
| Reticle | a **4-corner bracket**, 28x28 px around a single target (scaled to the sprite's bounding box for bosses, min 28, max 200), each corner 8x8 px of 2 px `#F2C21E` lines |
| Reticle motion | rotates 0 deg (it never spins); instead the four corners **breathe inward/outward by 2 px** on a 0.8 s sine |
| Reticle colour | ally target `#7EE8B0`, enemy target `#F2C21E`, self `#8FD0F0` |
| Multi-target | every valid target gets a dimmer bracket (`alpha 0.55`) and the whole set pulses in sync |
| Name plate | below the target, centred: 9 px text, `#F4F1E8`, on a `#0B0A12` 70% pill with 3 px padding. Enemies show `Name A` with the letter tag |
| Switch target | left/right on the stick moves the reticle; it **jumps instantly** with a 2-frame `#FFFFFF` flash on the new target |
| Out-of-range / invalid | reticle turns `#6C7B90` and the confirm is refused with a 2-frame shake |

**Sensor info panel.** Verified: Sensor is an auto-ability that "allows the player to view an opponent's **current HP, maximum HP, and elemental resistances** whenever targeting an enemy"; as long as one character in the active party has it, **any** character can see the data; aeons, Dark Aeons, Monster Arena specials, and various Omega Ruins enemies are **immune** `[single source]`.

| Property | Value |
|---|---|
| Rect | `x360 y44 w180 h78`, opens **only while an enemy is targeted and Sensor is active** |
| Chrome | same gradient/border, alpha 0.86 |
| Line 1 | enemy name, 10 px `#FFF0A8` |
| Line 2 | `HP  cur / max` with a 120x5 px HP bar beneath: track `#2A3246`, fill gradient `#C7343C` to `#F28A2E` |
| Lines 3-4 | six elemental chips in two rows of three: Fire, Ice, Thunder, Water, Holy, Gravity. Each chip is 24x14 px showing the element glyph plus one of `WEAK` (`#F2C21E`), `RES` (`#6C7B90`), `NULL` (`#4E86C8`), `ABS` (`#7EE8B0`), or blank for neutral |
| Sensor-immune enemy | the panel still opens but shows `- - -` for HP and all chips blank, with a 9 px `#6C7B90` caption `SENSOR FAILED` |
| Open / close | 0.18 s slide-in from the right with alpha fade |

### 3.6 Damage, healing and miss numerals

FFX's floating numbers are the most-seen UI element in the game. All values `[estimate]`.

| Property | Value |
|---|---|
| Face | a dedicated **numeral-only bitmap font**, 16 px cap height, heavy geometric slab-ish digits with flat terminals |
| Base fill | vertical gradient `#FFFFFF` (top) to `#D8DEE8` (bottom) |
| Outline | **2 px** `#141420`, drawn as an 8-direction dilation so it survives scaling |
| Drop shadow | `#0B0A12` at 55%, offset (0, +2) |
| Spawn point | target sprite's head anchor + `(0, -6)` with a `+/-6 px` random x jitter so simultaneous hits do not overlap |
| Motion | **bounce**: initial velocity `(rand(-18,18), -140) px/s`, gravity `+520 px/s^2`, one bounce at 45% restitution off an invisible floor 18 px below the spawn, total life **0.9 s**, last 0.25 s fades alpha 1 to 0 while drifting up 8 px |
| Scale pop | spawns at 1.35x, eases to 1.0x over 0.12 s |

**Variants:**

| Variant | Fill | Size | Extra |
|---|---|---|---|
| Normal physical/magic damage | white gradient above | 16 px | — |
| **Critical hit** | `#FFF0A8` to `#F2C21E` | **24 px (1.5x)** | spawns at 1.7x, screen shake 3 px for 0.1 s, plus a 1-frame full-screen `#FFFFFF` flash at 25% alpha |
| **Healing** | `#8BE8B0` to `#3FA870` | 16 px | prefixed with a 8x8 px `+` glyph; floats **straight up** (no bounce), life 1.0 s |
| **MP damage / MP restore** | `#8FD0F0` to `#3A8FD0` | 14 px | suffixed with a small `MP` tag, 7 px |
| **MISS** | `#C8D4E4` to `#8FA4BC` | 14 px, letters not digits | no bounce; slides 14 px to the side and fades over 0.5 s |
| **Immune / no effect** | `#6C7B90` | 12 px | text `IMMUNE` |
| **Overkill** | white numerals plus the word `OVERKILL` in `#F2C21E`, 12 px, appearing 0.3 s after the number, sliding in from the right | | verified that Overkill doubles item drops `[single source]` |
| **Damage to the party** | identical styling; the receiving party row in the status window flashes `#C7343C` at 40% alpha for 3 frames | | |
| **Break Damage Limit** | numbers above 9999 render at 20 px with an additional 1 px `#F2C21E` inner outline | | |

**Multi-hit stacking.** For an N-hit attack, spawn each numeral 0.08 s apart and offset each by `(+4, -3) * i` so they form a rising diagonal ladder — this is how the player counts hits in Blitz Ace / Trigger Happy.

### 3.7 Help window

| Property | Value |
|---|---|
| Rect | `x16 y10 w608 h26`, same chrome, alpha 0.86 |
| Content | one line of 10 px `#EDF3FA` text describing whatever the cursor rests on (verified role `[single source]`) |
| Visibility | fades in over 0.12 s when a menu cursor appears; fades out when the menu closes |
| Overflow | text scrolls horizontally at 26 px/s after a 1.2 s hold if it exceeds the width |

### 3.8 Transitions: battle start, and victory

**Battle start ("the swirl").** FFX's field-to-battle transition is a spiral distortion of the last field frame into the battle scene. Implementation (`[estimate]`, but see the verified contrast note below):

| Step | Timing | Spec |
|---|---|---|
| 1. Freeze | 0.00 s | capture the field framebuffer to a texture |
| 2. Swirl | 0.00-0.55 s | full-screen shader on that texture: polar warp with `angle += strength * (1 - r)` where `strength` ramps 0 to 4.2 rad; simultaneously `scale` 1.0 to 1.35 and saturation 1.0 to 0.25 |
| 3. Shatter/flash | 0.42-0.62 s | a 1-frame `#FFFFFF` flash at 70%, then the swirled texture breaks into 24 wedge quads that spin outward and fade |
| 4. Scene in | 0.45-0.95 s | battle scene fades up from `#0B0A12` while the base camera dollies in 1.5 units |
| 5. UI in | 0.80-1.15 s | command window slides up from `y+40`, status window slides in from `x+40`, CTB rows fade in top-to-bottom 0.04 s apart |

> **Verified contrast note:** Vegnagun's battles deliberately **do not** use this transition — "instead of the screen shattering and the view switching to battle mode, Vegnagun's battles open with a **black hole sucking in the screen**" `[single source]`. Implement that as the radial pinch described in section 1.18.

**Victory.** Verified sequence `[verified: 2 sources]`: the **victory fanfare plays**, the party performs **victory poses**, and the spoils are shown — "increases to gil, stats, and skills are shown on the battle screen **after the party has done their victory poses and have started walking away**", and "**if any items were dropped... a separate screen will open** showing the spoils". AP goes to every participant who took any action including Defend; enough AP grants a **Sphere Level (S.Lv)**.

| Step | Timing | Spec |
|---|---|---|
| 1. Last enemy dies | 0.00 s | enemy sprite dissolves into 30 `--pyre-green` motes rising over 0.8 s; combat music ducks to 0 over 0.3 s |
| 2. Fanfare | 0.35 s | victory fanfare starts. **Target length 6-9 s**; the results panel must not outlast it |
| 3. Victory poses | 0.45-2.20 s | each party member plays their pose animation, staggered 0.15 s apart |
| 4. Walk-off | 2.20 s | characters begin walking toward camera-left; UI windows slide out |
| 5. Results panel | 2.45 s | slides up from the bottom: `x96 y96 w448 h168`, same chrome, alpha 0.92 |
| 6. Counters | 2.45-3.60 s | numbers count up rather than snapping |
| 7. Sphere Level | on crossing the AP threshold | the row flashes `#FFF0A8`, a 12 px `SPHERE LEVEL UP!` caption appears in `#F2C21E`, and a short chime plays; `S.Lv` increments with a scale pop |
| 8. Item spoils | 4.20 s | a **second panel** replaces the first (verified: items get a separate screen), listing `icon + name + xQty` |
| 9. Dismiss | on input, or auto at 8.0 s | panel slides down, screen fades to the post-battle scene |

**Results panel contents** (verified fields: AP, gil, items, weapons/armour, Sphere Levels `[verified: 2 sources]`):

```
+----------------------------------------------------------+
|  VICTORY                                    GIL  +  1200  |
|----------------------------------------------------------|
|  [icon] TIDUS     AP +  36    S.Lv  22 -> 23   [LEVEL UP] |
|  [icon] YUNA      AP +  36    S.Lv  19                    |
|  [icon] AURON     AP +  36    S.Lv  21                    |
|----------------------------------------------------------|
|  OVERKILL                                                 |
+----------------------------------------------------------+
```

| Element | Colour |
|---|---|
| `VICTORY` heading | `#FFF0A8`, 14 px, letter-spaced +1 px |
| Character name | `#EDF3FA` |
| `AP +NN` | `#8BE8B0` |
| `S.Lv` | `#C8D4E4`; the arrow and new value `#FFF0A8` |
| `LEVEL UP` tag | `#F2C21E` on a `#3A2E0E` pill |
| `GIL +N` | `#F2D24A` |
| `OVERKILL` tag | `#F2C21E` |
| Divider rules | 1 px `#2E5A9E` at 60% |

### 3.9 Text styling and fonts

**No one has published the FFX or FFX HD Remaster UI typeface.** A dafont thread asking exactly this went unanswered `[single source]`, and the FF Wiki's version-differences page notes only that "a new typeface is used for the game's text in the HD Remaster" alongside "a new user interface... including a new menu cursor" `[single source]`. Square Enix does not publish the names of its in-game faces `[single source]`.

So: **do not chase an exact match.** Match the *character* of the UI instead — a slightly condensed, open-aperture **humanist sans** with tall x-height, generous counters, and clean digits, used at small sizes with a hard 1 px shadow.

> **RESOLVED CONFLICT (was a major blocker).** This section previously recommended **Jost / Archivo Black / Cinzel / EB Garamond**, while `assets-and-tech.md` §1.2 recommends **Exo 2 / Chakra Petch / Rajdhani / Silkscreen** and ships an npm install list and a `tokens.css` for them. Two complete, non-overlapping systems cannot both be authoritative.
>
> **Decision: `assets-and-tech.md` §1.2 wins for every functional role** (UI body, FFX-2 chrome, numerals, pixel/debug). Reasons, in order: (1) the tech doc's picks are already backed by a self-hosting decision, a Fontsource install list, and a CSS token block that the implementation agents will actually run; (2) Chakra Petch is the only candidate on either list with a **true italic at 700**, which the damage-numeral spec in §3.6 requires; (3) Rajdhani is a **tabular-figure condensed** face, which §3.9's own "numerals must be tabular so counters do not jitter" rule requires and neither Jost nor Archivo Black guarantees.
>
> **The only surviving picks from the old list are the two roles the tech doc leaves empty:** it names **no display serif**, and the title lockup and chapter cards need one. **Cinzel** (title) and **EB Garamond** (chapter/lore cards) are therefore **kept as additions**, not alternatives, and must be added to the tech doc's install line.

**The single font contract (authoritative for both documents).**

| Role | Font | Weight / style | Licence | Self-host package |
|---|---|---|---|---|
| **Primary UI / menus / dialogue (FFX)** | **Exo 2** (variable) | 400 / 600 | OFL 1.1 `[verified: 2 sources]` | `@fontsource-variable/exo-2` |
| **FFX-2 UI, dressphere menus, Garment Grid** | **Chakra Petch** | 500 / 700 | OFL 1.1 `[verified: 2 sources]` | `@fontsource/chakra-petch` |
| **Damage / healing / MISS numerals (both games)** | **Chakra Petch** | **700 italic** | OFL 1.1 `[verified: 2 sources]` | `@fontsource/chakra-petch/700-italic.css` |
| **Counters, HP/MP readouts, gauge labels, CTB tick values** | **Rajdhani** | 500 / 600 | OFL 1.1 `[single source]` | `@fontsource/rajdhani` |
| **Pixel UI — tooltips, debug HUD, 7 px labels** | **Silkscreen** | 400 | OFL 1.1 `[verified: 2 sources]` | `@fontsource/silkscreen` |
| Pixel display — arcade/title flavour only | **Press Start 2P** | 400 | OFL 1.1 `[verified: 2 sources]` | `@fontsource/press-start-2p` |
| **Title / logo lockup** *(addition — tech doc names none)* | **Cinzel** | 700 | OFL 1.1 `[single source]` | `@fontsource/cinzel` |
| **Chapter cards / lore** *(addition)* | **EB Garamond** | 400 / 500 italic | OFL 1.1 `[single source]` | `@fontsource/eb-garamond` |
| Al Bhed / Spiran glyph accents | **Noto Sans Symbols 2** | 400 | OFL 1.1 `[single source]` | `@fontsource/noto-sans-symbols-2` |

Extend the tech doc's install line to:

```bash
npm i -D @fontsource-variable/exo-2 @fontsource/chakra-petch @fontsource/rajdhani \
         @fontsource/silkscreen @fontsource/cinzel @fontsource/eb-garamond
```

```css
/* src/ui/tokens.css — extends assets-and-tech.md §1.4 */
:root {
  --font-ui:      'Exo 2 Variable', 'Exo 2', system-ui, sans-serif;
  --font-x2:      'Chakra Petch', var(--font-ui);
  --font-damage:  'Chakra Petch', var(--font-ui);   /* 700 italic */
  --font-numeral: 'Rajdhani', var(--font-ui);       /* tabular figures */
  --font-pixel:   'Silkscreen', monospace;
  --font-title:   'Cinzel', Georgia, serif;         /* addition */
  --font-lore:    'EB Garamond', Georgia, serif;    /* addition */
}
```

**Metric impact on the §3–§5 rects — read before building any window.** Every coordinate in §3, §4 and §5 was sized against **Jost** at 10 px. **Exo 2 is wider**: at the same optical size its lowercase advance averages **≈6% greater** and its digits **≈9% greater** than Jost's. `[estimate]` — measured-by-eye comparison of the two specimens, not a published metric. The rects were not re-derived, so apply these compensations rather than moving the windows:

| Surface | Compensation |
|---|---|
| Command-window rows (§3.3, 164 px wide, 22 px rows) | render at **10 px with `letter-spacing: -0.2px`**; longest base label is `Overdrive` (9 chars) and fits with 38 px spare even uncompensated |
| Party-status `cur/max` (§3.4, right-aligned at x430 / x486) | **use `--font-numeral` (Rajdhani), not `--font-ui`** — Rajdhani is condensed and tabular, and is *narrower* than Jost, so this row gains room rather than losing it |
| CTB name labels (§3.2, 5×7 px, top 3 rows only) | switch to **`--font-pixel` (Silkscreen) at 8 px** — below 9 px Exo 2 is not legible after nearest-downsampling, and Silkscreen is designed for exactly this size |
| Help window (§3.7, 608 px wide) | no change; it has ample room |
| X-2 status rows (§4.3, HP at x468, MP at x612) | Chakra Petch is wider still; **use `--font-numeral` for the values** and `--font-x2` only for the name |
| Damage numerals (§3.6) | no change — they are a **pre-rasterised bitmap atlas** (§3.9 rendering rule and `assets-and-tech.md` §1.5), so the face's metrics affect the atlas, not any rect |

**Rasterisation rule is unchanged and binding:** every string in the UI is **pre-rasterised to a bitmap atlas at 2×** (the §3.0 composite scale) and drawn with **nearest** filtering. No live webfont text is ever drawn into the WebGL canvas. `[estimate]`

> **Do not** use the Final Fantasy wordmark itself, or any font marketed as "the Final Fantasy font" that is a trace of it.

**Text rendering rules** (`[estimate]`):

| Rule | Value |
|---|---|
| Sizes | 14 px headings, 10 px body/menu, 9 px secondary, 7 px labels — all on the 640x360 canvas |
| Rendering | pre-rasterise to a bitmap atlas at **2x** (the §3.0 composite scale, 1280x720) and draw with **nearest** filtering; the single final letterbox blit takes it the rest of the way to the display. **Changed from 3x** — see the §3.0 canvas resolution |
| Shadow | 1 px `#08101E` at (1,1) on all light-on-dark text |
| Letter spacing | +0.5 px on headings, 0 elsewhere |
| Line height | 1.4x |
| Numerals | tabular/lining figures only, so counters do not jitter while rolling |

### 3.10 Base UI colour tokens (FFX)

| Token | Hex | Use |
|---|---|---|
| `--ffx-win-top` | `#1B3A6B` | window gradient top |
| `--ffx-win-bottom` | `#050912` | window gradient bottom |
| `--ffx-win-highlight` | `#2E5A9E` | inner top rule, selection bar |
| `--ffx-border-outer` | `#DCE8F5` | outer 1 px border |
| `--ffx-border-inner` | `#4E86C8` | inner 1 px border |
| `--ffx-corner` | `#9FC4E8` | corner ornament |
| `--ffx-text` | `#EDF3FA` | body text |
| `--ffx-text-dim` | `#6C7B90` | disabled text |
| `--ffx-text-hi` | `#FFF0A8` | headings, active actor |
| `--ffx-cursor` | `#F4F1E8` | finger cursor fill |
| `--ffx-cursor-cuff` | `#4E86C8` | cursor cuff |
| `--ffx-hp` | `#F4F1E8` | HP normal |
| `--ffx-hp-critical` | `#F2D24A` | HP below 50% |
| `--ffx-hp-danger` | `#F28A2E` | HP below 12.5% |
| `--ffx-hp-ko` | `#C7343C` | KO |
| `--ffx-mp` | `#8FD0F0` | MP |
| `--ffx-od-fill-lo` | `#F2C21E` | Overdrive gauge |
| `--ffx-od-fill-hi` | `#FFF0A8` | Overdrive gauge top |
| `--ffx-od-track` | `#2A3246` | Overdrive empty track |
| `--ffx-target-enemy` | `#F2C21E` | enemy reticle |
| `--ffx-target-ally` | `#7EE8B0` | ally reticle |
| `--ffx-enemy-accent` | `#A83A3A` | enemy CTB border |

**Additional tokens introduced by §3.11–§3.16:**

| Token | Hex | Use |
|---|---|---|
| `--ffx-od-zone` | `#FFFFFF` | Swordplay success zone fill (see the source conflict in §3.11.1) |
| `--ffx-od-zone-alt` | `#F2D24A` | Swordplay success zone, "yellow" reading |
| `--ffx-od-bar-track` | `#101828` | minigame bar / reel background |
| `--ffx-od-frame` | `#F2C21E` | Overdrive overlay frame and header rule |
| `--ffx-od-fail` | `#C7343C` | failure flash on any Overdrive minigame |
| `--ffx-od-success` | `#7EE8B0` | success flash on any Overdrive minigame |
| `--ffx-telegraph-warn` | `#F2A33A` | telegraph banner, charge stage 1 |
| `--ffx-telegraph-crit` | `#E8412E` | telegraph banner, "ready to fire" stage |
| `--ffx-trigger` | `#8BE8B0` | Trigger Command prompt accent |
| `--ffx-shop-gil` | `#F2D24A` | gil figures |

---

### 3.11 Overdrive minigame UI

Seven distinct interactive surfaces (six FFX plus Kimahri's non-interactive Rage list), all of which the FFX chapters require and none of which existed in this document before. **Every number below is `[estimate]`** unless a row says otherwise: the *mechanics* are sourced (timers, sequences, reel symbols, caps — see `ffx-combat-core.md` §5), but **no source publishes the pixel geometry, the cursor speed, or the zone widths.** Where a mechanic source exists it is cited inline.

> **Recorded source conflict.** `ffx-combat-core.md` §5.3 describes Tidus's target as a **white zone** in the middle of the bar; Jegged's Swordplay page calls it "the highlighted **yellow** centre section of the bar" `[single source]`. Both are single-sourced and neither is decompile-derived. **Implement the zone as `--ffx-od-zone` `#FFFFFF` with a 2 px `--ffx-od-zone-alt` `#F2D24A` inner border**, which satisfies both readings and is more legible than either alone.

#### 3.11.0 Shared Overdrive overlay frame (all six)

Every Overdrive minigame is drawn inside the same frame, so the player learns one set of affordances.

| Property | Value |
|---|---|
| Trigger | the acting character's Overdrive is confirmed; the scene **dims 45%** and desaturates to 60% over **0.12 s**; the CTB list, command window and party-status window all slide off-screen over the same 0.12 s |
| Camera | cut to the `overdrive` preset (§2.0, `S = 6`), actor framed centre-left |
| Overlay rect | `x104 y112 w432 h136`, centred horizontally on the 640×360 grid, **no window chrome** — a 2 px `--ffx-od-frame` `#F2C21E` rule along the top edge only, with an 8 px inward fade at each end |
| Header | the Overdrive's name, 14 px `--font-ui`, `#FFF0A8`, letter-spaced +0.5 px, centred at `y118`; a 1 px `#08101E` shadow at (1,1) |
| Sub-header | the input hint, 9 px, `#C8D4E4`, centred at `y136` — e.g. `PRESS  ✕  IN THE ZONE`, `ENTER THE SEQUENCE`, `STOP EACH REEL`, `ROTATE THE RIGHT STICK` |
| **Timer ring** | a **28 px diameter** ring at `x496 y128` (overlay's top-right), 3 px stroke, drawn as an arc depleting **clockwise from 12 o'clock**. Track `#2A3246`; fill gradient `#7EE8B0` → `#F2D24A` → `#E8412E` as remaining time crosses 60% and 25%. Centre shows the remaining seconds to one decimal in 10 px `--font-numeral` |
| **Timer ring is the damage bonus** | `ffx-combat-core.md` §5.2: `damage × (1 + ½ · timeRemaining / totalTime)` for Tidus (3 000 ms), Auron (4 000 ms) and Wakka (20 000 ms) `[verified: 2 sources]`. Show this literally — under the ring, print `+NN%` in 9 px `#F2C21E`, updating every frame. **Lulu's Fury gets no ring and no `+%`** because her timer always reaches 0 `[verified: 2 sources]` |
| Success resolution | 3-frame `--ffx-od-success` `#7EE8B0` flash across the whole overlay at 55% → 0, overlay slides up and out over 0.18 s, `SUCCESS` never printed as a word |
| Failure resolution | 3-frame `--ffx-od-fail` `#C7343C` flash, plus a **6 px horizontal shake** of the overlay over 0.20 s, then the same slide-out. Still never prints a word — the weaker attack that follows is the feedback |
| Input buffering | inputs are consumed only after the overlay's 0.12 s open completes, so a mashed confirm from the menu cannot instantly fail the minigame |
| Accessibility | a project setting `overdriveAssist` widens every success window by 60% and slows every cursor by 35%; it must not change any damage number |

#### 3.11.1 Tidus — Swordplay (moving cursor + success zone)

Mechanic `[verified: 2 sources]`: a bar with a moving cursor and a highlighted central zone; press confirm inside the zone; **the zone narrows for stronger Overdrives**; success and failure resolve **different action rows** (`ffx-combat-core.md` §5.3). Timer **3 000 ms**.

| Element | Spec |
|---|---|
| Bar | `x140 y176 w360 h20`, fill `--ffx-od-bar-track` `#101828` at 90%, 1 px `#4E86C8` inner border, 1 px `#0B0A12` outer |
| Tick marks | 1 px `#2E5A9E` verticals every 30 px, full height, at 40% alpha — they give the eye a speed reference |
| **Success zone** | centred at `x320`; fill `#FFFFFF` at 88%, **2 px `#F2D24A` inner border**, full bar height; a 4 px `#FFF0A8` outer glow at 35% |
| **Cursor** | a **5 px wide, 26 px tall** vertical bar, `#F4F1E8` core with a 1 px `#0B0A12` outline, overhanging the bar by 3 px top and bottom; trails a 3-sample 2 px-wide ghost at 40/25/12% alpha behind its direction of travel |
| Motion | **ping-pong**, constant speed, reversing at the bar's inner edges with **no ease** — easing at the ends would make the ends easier and change the difficulty curve |
| Sound cue | a 1-frame tick at each bar end, so a player can time by ear |

**Per-Overdrive zone width and cursor speed** `[estimate]` — derived so that the *expected* fraction of bar length inside the zone falls roughly as the published difficulty ordering does ("Spiral Cut has the largest timing window… Blitz Ace has the smallest" `[single source]`, Jegged), and so that each still permits at least one full sweep inside the 3 000 ms timer:

| Overdrive | Zone half-width | Zone total | Cursor speed | Sweeps in 3 000 ms | Window per pass |
|---|---:|---:|---:|---:|---:|
| **Spiral Cut** | 34 px | 68 px | **260 px/s** | 2.2 | 262 ms |
| **Slice & Dice** | 22 px | 44 px | **340 px/s** | 2.8 | 129 ms |
| **Energy Rain** | 14 px | 28 px | **430 px/s** | 3.6 | 65 ms |
| **Blitz Ace** | 8 px | 16 px | **540 px/s** | 4.5 | 30 ms |

Blitz Ace's 30 ms window is two frames at 60 Hz. That is intentional — it is the game's hardest input — but it means the **input latency budget for the whole Overdrive path must be under one frame**; read the confirm on the input event, not on the next tick.

**Failure presentation.** The cursor **freezes where it stopped** for 6 frames with a `#C7343C` fill before the overlay shakes out, so the player sees exactly how far off they were. If the timer expires with no press, the cursor freezes at its current position and the zone itself flashes `#C7343C`.

#### 3.11.2 Auron — Bushido (button-sequence prompt)

Mechanic `[verified: 2 sources]`: enter a button sequence before a **4 000 ms** timer expires; faster entry ⇒ larger remaining-time bonus; failure resolves the "(Fail)" row (`ffx-combat-core.md` §5.5). All four sequences are **7 inputs** long.

| Element | Spec |
|---|---|
| Chip row | **7 chips**, each **34 × 34 px**, 8 px gutter ⇒ total 286 px, centred: first chip at `x177 y168` |
| Chip (pending) | fill `#101828` at 88%, 1 px `#4E86C8` border, glyph `#C8D4E4` centred |
| Chip (next required) | scales to **40 × 40** (grows 3 px in each direction, chips do **not** reflow), border becomes 2 px `#FFF0A8`, plus a 3 px `#F2C21E` outer glow at 50%, pulsing 100→78% on a 0.5 s sine |
| Chip (entered correctly) | fill `#1E4A38`, border 1 px `#7EE8B0`, glyph `#7EE8B0`, and a 2-frame scale pop to 1.2 |
| Chip (wrong input) | the **whole row** flashes `#C7343C` for 3 frames and the run ends immediately — Bushido has **no partial credit** |
| Progress rule | the sequence advances **only on the correct input**; wrong inputs end the attempt, they do not merely stall it |
| Glyph set | direction chips are 13 px arrow glyphs in `#C8D4E4`; face-button chips are the platform glyph (`✕ ○ □ △` / `A B X Y`) in the platform's colour band (`#4E86C8` / `#C7343C` / `#B048F0` / `#7EE8B0`) drawn as a 2 px ring, glyph letter inside in `#F4F1E8`; shoulder chips read `L1` / `R1` in 12 px `--font-numeral` |
| Sequence source | `ffx-combat-core.md` §5.5 `[verified: 2 sources]` — Dragon Fang `↓ ← ↑ → L1 R1 ○ ✕` is 8 inputs in that table; render **8 chips at 30 × 30 with a 6 px gutter** for that one row (total 282 px) rather than shrinking the others |
| Sub-header | `ENTER THE SEQUENCE` |

**Speed feedback.** Because the damage bonus is purely remaining time, put a **thin horizontal drain bar** directly under the chip row — `x177 y212 w286 h4`, track `#2A3246`, fill gradient `#7EE8B0`→`#F2D24A`→`#E8412E` — in addition to the shared timer ring. Auron is the only Overdrive where a player can meaningfully *rush*, so give it two readouts.

#### 3.11.3 Wakka — Slots (three reels)

Mechanic `[verified: 2 sources]`: **three reels**, a **20 000 ms** timer, the player stops each reel with the confirm button; 3-of-a-kind hits every enemy, 2-of-a-kind hits one random enemy, no match resolves Power Shot (`ffx-combat-core.md` §5.6). Jegged names the three-match result "**Jackpot!**" `[single source]`.

| Element | Spec |
|---|---|
| Reel housing | `x188 y156 w264 h68`, fill `#101828` at 92%, 2 px border (outer `#DCE8F5`, inner `#4E86C8`), corner radius 4 px |
| Reels | **three**, each **76 × 56 px**, 8 px gutter, first at `x196 y162` |
| Reel window | shows **3 symbols** vertically (the centre one is the result); symbols are **40 × 40 px**, centre symbol at full alpha, the partial symbols above and below at 45% and clipped |
| Pay line | a 1 px `#F2C21E` horizontal rule across all three reels at the centre-symbol's vertical midpoint, with a 5 px `#F2C21E` triangle pointing inward from each end of the housing |
| Spin | symbols scroll **downward** at **760 px/s**; motion blur is a 3-sample vertical smear at 50/30/15% alpha — never a real blur (pixel art) |
| Stop | on confirm the reel decelerates over **0.18 s** with an ease-out and **snaps to the nearest symbol centre**; a 2-frame `#FFF0A8` flash on that reel |
| Stopped reel | its border thickens to 2 px `#FFF0A8`; already-stopped reels do not spin |
| Result banner | on the third stop, a banner appears at `x188 y230 w264 h22`, fill gradient `#1B3A6B`→`#050912`, 1 px `#F2C21E` border, holding for **0.7 s** before resolution: **`JACKPOT!`** (3-match, 14 px `#FFF0A8` with a 2 px `#F2C21E` glow, plus 12 hit-spark motes) · **`PAIR`** (2-match, 12 px `#F2D24A`) · **`MISS`** (no match, 12 px `#6C7B90`, no flourish) |
| Timer | the shared ring, but scaled for 20 s: print the remaining seconds with **no decimal** above 10 s, one decimal below |
| Auto-stop | if the timer expires with reels still spinning, the remaining reels stop **instantly and randomly**, then resolve normally |

**Reel symbols** — 40 × 40 px each, drawn on a `#141C2E` tile with a 1 px `#2E5A9E` rounded frame `[verified: 2 sources for the symbol sets; art is `[estimate]`]`:

| Reel set | Symbols | Symbol art |
|---|---|---|
| **Element Reels** | Fire / Ice / Water / Thunder | element sigils in `#F2712E` / `#6EC8F0` / `#3A8FD0` / `#F2D24A`, each with a 2 px darker inner shadow |
| **Attack Reels** | hit counts **1** or **2** | a single large numeral in `--font-numeral` 30 px, `#F4F1E8`, on a `#2A3246` disc |
| **Status Reels** | Skull / Down-arrow / Timer | `#C8D4E4` skull; `#B048F0` down-arrow (the Break symbol); `#8FD0F0` hourglass |
| **Aurochs Reels** | mixed Aurochs symbols | the Besaid Aurochs blitzball crest in `#F0BC2E` on `#2F5E96`, three colourway variants |

Show the **reel set's name** in the overlay header (`ELEMENT REELS`, `ATTACK REELS`, …) rather than "Slots", because the four sets have completely different payoffs.

#### 3.11.4 Lulu — Fury (rotation counter)

Mechanic `[verified: 2 sources]`: after choosing a learned Black Magic spell, rotate the right stick clockwise for **≈4 s**; each completed rotation increments a counter and the spell is cast that many times, **capped at 16**; the required rotation size **grows** with Lulu's Magic stat and with the number of rotations already made, so a "rotation" can become 720° (`ffx-combat-core.md` §5.7). **No timing damage bonus** — so **no `+%` readout and no timer ring colour ramp**; a plain depleting ring only.

| Element | Spec |
|---|---|
| **Rotation dial** | a **96 px diameter** ring centred at `x260 y188`; track 4 px `#2A3246`; the **current** rotation's progress drawn as a 4 px arc in a `#B048F0`→`#F7B6D9` gradient, sweeping clockwise from 12 o'clock |
| Stick indicator | a **9 px** `#FFD9EC` disc riding the ring at the player's current stick angle, with a 3-sample trail; if the stick is centred (no input) it greys to `#5A4A60` and the arc stops advancing |
| Multi-turn rotations | when the required rotation exceeds 360°, draw **concentric arcs**: turn 1 on the 96 px ring, turn 2 on an inner 78 px ring, so a 720° requirement is visibly two laps. Completed laps stay lit at 45% |
| **Counter** | to the right of the dial at `x340 y170`: a large numeral in `--font-numeral` **40 px**, fill gradient `#FFF0A8`→`#F2C21E`, 2 px `#08101E` outline; beneath it the word `CASTS` at 9 px `#C8D4E4`, letter-spaced +1 px; and beneath that `/ 16` at 12 px `#6C7B90` |
| Counter increment | scale pop 1.0 → 1.45 → 1.0 over 0.16 s, 2-frame `#FFFFFF` flash, and **one spell-element mote** spawns and orbits the counter (so the ring of orbiting motes *is* the count, readable without reading the digit) |
| Cap reached | at **16** the counter switches to `#7EE8B0`, the dial ring fills solid `#F7B6D9`, and further rotation is ignored — do not let the player keep spinning into nothing |
| Spell identity | the chosen spell's element chip (§3.3's element colours) sits inside the dial at 24 × 24 px, so the player can see what they are about to cast ×N |
| Sub-header | `ROTATE THE RIGHT STICK CLOCKWISE` |
| Keyboard fallback | alternate `←`/`→` (or `A`/`D`) presses count as half-rotations each; **this is the only Overdrive that needs a non-stick fallback**, so it must be specified rather than invented |

#### 3.11.5 Rikku — Mix (two-ingredient picker)

Mechanic `[verified: 2 sources]`: **two items are consumed** and one result fires; recipes are an **unordered pair** lookup; every Mix is rank 6 although the CTB preview shows 5 (`ffx-combat-core.md` §5.9). Mix has **no timer** and **no failure state** — every pair yields *something* — so this is a menu, not a reflex test, and it gets the sub-menu chrome rather than the Overdrive overlay.

| Element | Spec |
|---|---|
| Panel | `x188 y120 w264 h226`, standard §3.3 chrome, corner radius 4 px |
| Header | `MIX` in 14 px `#FFF0A8` at `y126`, with the step indicator `1 / 2` or `2 / 2` right-aligned at `x440` in 10 px `#8FD0F0` |
| Item list | 8 rows visible, height 20, starting `y148`; each row = 12 × 12 px item icon at `x196`, name at `x214` in 10 px `#EDF3FA`, quantity `xNN` right-aligned at `x440` in `--font-numeral` 10 px `#C8D4E4` |
| Scrollbar | 2 px `#4E86C8` on the right inner edge |
| **Slot A / Slot B** | two **32 × 32 px** sockets side by side at `x452 y140` and `x452 y180` (outside the list panel, in a companion strip `x444 y120 w92 h110` with the same chrome). Empty socket = `#101828` fill, 1 px dashed `#4E86C8`. Filled = the item icon at 24 × 24 centred, 1 px `#FFF0A8` border, name beneath at 8 px |
| Selection flow | pick A → the row grey-dims by one quantity and the list stays open → pick B. **B may be the same item** if quantity ≥ 2 (Potion + Potion is a real recipe) — the list must not lock the row |
| Cancel | `△`/back removes slot B, then slot A, then closes; never dumps both at once |
| **Result preview** | beneath the sockets at `x444 y236 w92 h40`: once both slots are filled, print the **result name** in 12 px `#FFF0A8` with a 1 px `#F2C21E` underline, and a one-line 8 px `#C8D4E4` effect summary. **Unknown pairs preview as `? ? ?` in `#6C7B90`** — this preserves the discovery loop while still letting a player confirm a known recipe |
| Confirm | a 0.35 s flourish: the two socket icons slide together, collide with a 12-mote `#8BE8B0` burst, and are replaced by the result icon at 1.3× before the panel closes |
| Known-recipe marker | a 4 × 4 px `#7EE8B0` dot at the top-right of any item icon that forms a **known** (already-brewed) recipe with the item currently in slot A — this is the single UI affordance that makes Mix playable for someone who has not memorised the chart |

#### 3.11.6 Yuna — Grand Summon (aeon picker)

Mechanic `[verified: 2 sources]`: rank 5, costs the full gauge, summons any owned aeon **with a full Overdrive gauge**; the aeon's **own stored gauge is restored** after the temporary one is spent, so an already-full aeon can fire two Overdrives back to back (`ffx-combat-core.md` §5.4). **The UI must make the double-Overdrive case legible or the player will never notice it.**

| Element | Spec |
|---|---|
| Panel | `x188 y150 w232 h196` — the standard §3.3 sub-menu rect, so Grand Summon reads as a sibling of Summon, not a new mode |
| Header | `GRAND SUMMON` 12 px `#FFF0A8`; sub-line `AEON ARRIVES WITH A FULL OVERDRIVE` 8 px `#8BE8B0` |
| Rows | one per **owned** aeon, height 26, starting `y186`; each row = **24 × 24 aeon portrait** (§1.21 spec, background tinted to the aeon's element) at `x196`, name at `x226` in 10 px, and the aeon's **stored** Overdrive gauge as a `w72 h5` bar right-aligned at `x412` |
| Stored-gauge bar | track `--ffx-od-track` `#2A3246`; fill `--ffx-od-fill-lo`→`--ffx-od-fill-hi` |
| **Temporary-gauge overlay** | over that same bar, draw a **full-width `#8BE8B0` 5 px bar at 55% alpha with a 1 px `#E9FFF4` leading edge** — the granted temporary gauge, visually stacked *in front of* the stored one. Two gauges, one bar, so the relationship is obvious |
| **Double-Overdrive flag** | if an aeon's **stored** gauge is already 100, put a **`×2` chip** (16 × 12 px, `#FFF0A8` on a `#4A3A0E` pill, 1 px `#F2C21E`) immediately right of the bar, and add the help-window line `This aeon can use two Overdrives.` This is the entire reason Grand Summon exists; do not leave it to the player to deduce |
| Locked rows | aeons not owned are **absent**, not greyed — the roster is chapter-scoped |
| Confirm | the panel closes, the standard summon sequence plays, and the arriving aeon's Overdrive gauge bar in the party-status window (§3.4) **fills from 0 to 100 over 0.4 s** so the grant is seen happening |
| Dismiss safety | if the aeon is dismissed **before** spending the temporary gauge, the stored value must be restored, not overwritten `[verified: 2 sources]`. Show it: the temporary green overlay **drains away** over 0.3 s, revealing the original stored fill underneath |

#### 3.11.7 Kimahri — Ronso Rage (no minigame)

Ronso Rage has **no timed input**; it is a plain ability list (`ffx-combat-core.md` §5.8). Use the §3.3 sub-menu panel unchanged (`x188 y150 w232 h196`), with one addition: each learned Rage row carries an 8 px `#8FA4BC` suffix naming the enemy it was **Lancet**-ed from, because that is the only place the game teaches the mechanic. Unlearned Rages are **absent**. `[estimate]`

#### 3.11.8 Overdrive Mode selection screen

`ffx-combat-core.md` §5.1 documents **17 modes** with per-character unlock counts `[verified: 2 sources]` for the list and triggers. The screen is reached from the pre-battle menu (§5.4), not from combat.

| Element | Spec |
|---|---|
| Panel | `x64 y40 w512 h280`, §3.3 chrome, header `OVERDRIVE MODE` 14 px `#FFF0A8` |
| Character strip | seven 32 × 32 portraits across the top at `y56`, 8 px gutter, centred; the selected one gains the §3.3 `#F2C21E` underbar |
| Mode list | left column `x80 y100 w200`, rows height 20, 9 visible with a scrollbar; unlocked rows `#EDF3FA`, **locked rows `#6C7B90`** |
| Locked-row progress | right-aligned in the row, `47/150` in 9 px `--font-numeral` `#8FA4BC`, plus a `w40 h3` progress bar in `#2A3246` / `#F2C21E`. The unlock counts are per character `[verified: 2 sources]`, so this readout changes when the portrait changes |
| Detail pane | right column `x296 y100 w264 h204`: the mode name 12 px `#FFF0A8`; the **trigger sentence** in 10 px `#C8D4E4` (e.g. "Charges when an ally is KO'd"); the **gauge gain** in 10 px `#8BE8B0` (e.g. "+30% per KO"); and the current equipped indicator |
| Equipped marker | a 9 px `#F2C21E` filled circle to the left of the equipped row, and the word `EQUIPPED` 8 px `#F2C21E` in the detail pane |
| Default | every character starts on **Stoic** `[verified: 2 sources]` — render Stoic as always-unlocked with no progress bar |

---

### 3.12 Trigger Command prompt

A **named mechanic in two of the five encounters** and previously unspecified. Two distinct flavours, one widget.

**Sourced behaviour:**

| Encounter | Behaviour | Confidence |
|---|---|---|
| Braska's Final Aeon | **"Talk" (Tidus only)** resets BFA's Overdrive gauge; the effect lands on **his next turn**, which he then **loses entirely**; **usable twice**; the command **appears a third time but has no effect** | `[verified: 2 sources]` (`ffx-bfa-yu-yevon.md` §1.6) |
| Seymour Flux | **pre-battle Talk**: **Kimahri → +10 Strength**, **Yuna → +10 Magic Defense**, for this battle | `[verified: 2 sources]` (`ffx-seymour-flux.md` §4.7) |

#### 3.12.1 Pre-battle Trigger (Seymour Flux)

| Element | Spec |
|---|---|
| When | after the battle-start transition resolves (§3.8) and **before** the first CTB turn; the CTB list is visible but frozen |
| Panel | `x160 y96 w320 h96`, §3.3 chrome but with the border's inner rule in `--ffx-trigger` `#8BE8B0` instead of `#4E86C8` |
| Header | `TRIGGER COMMAND` 12 px `#8BE8B0`, letter-spaced +1 px, centred |
| Rows | one per eligible speaker, height 26, starting `y130`: 24 × 24 portrait at `x172`, `Talk` in 12 px `#EDF3FA` at `x202`, and the **bonus preview** right-aligned at `x468` in 10 px `#8BE8B0` — literally `STR +10` / `MDEF +10`. Previewing the bonus is a deliberate deviation from the original, which does not; without it the mechanic is invisible |
| Skip row | a final row `— Say nothing —` in `#6C7B90` |
| Confirm | the portrait slides 4 px right, a 0.4 s speech beat plays over the battlefield (the speaker's sprite gets a 2-frame mouth-open variant), then a **stat-up flourish**: the bonus text rises 12 px from the speaker's sprite in 12 px `#8BE8B0` with a 1 px `#0B0A12` outline while 6 `--pyre-green` motes spiral off them |
| Persistence | the granted bonus is shown for the rest of the battle as a **4 × 4 px `#8BE8B0` chevron** in the speaker's party-status row (§3.4), tooltipped in the help window |
| Multiple speakers | both bonuses may be taken; the panel stays open until every eligible row is used or `Say nothing` is chosen |

#### 3.12.2 In-battle Trigger with a charge counter (Braska's Final Aeon)

This is the harder case: the command **appears three times but only works twice**, and its effect is **delayed**.

| Element | Spec |
|---|---|
| Placement | a **row inside the command window** (§3.3), inserted directly under `Attack`, labelled **`Talk`**, with the `--ffx-trigger` `#8BE8B0` text colour rather than `#EDF3FA` so it never reads as an ordinary command |
| **Charge counter** | right-aligned in that row: **two 6 × 6 px diamonds**, `#8BE8B0` filled when available, `#2A3246` hollow with a 1 px `#3A4456` border when spent. Two diamonds, always — the counter's *maximum* is the information |
| **The inert third appearance** | after both charges are spent the row **remains present and selectable** (faithful to the original), but both diamonds are hollow and the label desaturates to `#5A7A6C`. On confirm it consumes the turn and prints `…` above Tidus with no effect. **Do not hide the row and do not grey it out as disabled** — the third, useless Talk is a designed piece of characterisation, and the hollow diamonds are the honest warning |
| Help-window text | charge available: `Resets the boss's Overdrive. Tidus loses his next turn.` · charges spent: `He has nothing left to say.` |
| Confirm flourish | Tidus's sprite plays a 3-frame call-out; a `#8BE8B0` ring expands from him to radius 60 px over 0.3 s and **travels to the boss**, arriving in 0.25 s |
| **Delayed-effect indicator** | because the reset lands on the **boss's next turn**, not now, mark it: the boss's CTB row (§3.2) gains a **pulsing `#8BE8B0` 1 px border** and a 5 × 5 px `#8BE8B0` diamond at its **bottom**-right corner until the effect fires. When it fires, the boss's Overdrive gauge visibly **drains to 0 over 0.35 s** and the marker clears |
| **Turn-loss indicator** | Tidus's own next CTB row simultaneously gains a 1 px `#B048F0` border and a `⊘` glyph, the same treatment as a Delay — the player must see the cost before it happens |

---

### 3.13 Enemy telegraph banner

**The contract that makes Total Annihilation survivable.** `ffx-seymour-flux.md` §4.5/§4.6 specifies a **two-stage** charge telegraph: turn 1 announces **`Auto-Attack Mode`** (Command 150, no damage, the first charge turn), then **`Ready To Annihilate`**, then the attack. After the first Total Annihilation, Mortiorchis **stays** in Auto-Attack Mode and needs only **one** charge turn per subsequent use `[verified: 2 sources]`. The banner is the player's only warning, so it is load-bearing UI, not flavour.

| Element | Spec |
|---|---|
| Rect | `x96 y64 w448 h34`, horizontally centred, sitting just under the help window's band so the two never collide |
| Shape | a **parallelogram**, skewed 12° (leading edges slanted right) — deliberately *not* the rounded window chrome, so a telegraph is never mistaken for a menu |
| Fill | horizontal gradient, transparent at both ends to the stage colour at 80% in the centre |
| Border | a 2 px rule along the **top and bottom edges only**, in the stage colour, fading to 0 over the outer 40 px each side |
| Text | the enemy name in 9 px `#C8D4E4` on the first line (`MORTIORCHIS`), the state in 14 px on the second, all-caps, letter-spaced +1.5 px, with a 1 px `#0B0A12` shadow |
| **Stage 1 — charging** | state text `AUTO-ATTACK MODE`, colour `--ffx-telegraph-warn` `#F2A33A`; the banner slides in from the left over 0.22 s (ease-out), holds 1.4 s, slides out right over 0.18 s; a slow 0.8 Hz brightness pulse |
| **Stage 2 — imminent** | state text `READY TO ANNIHILATE`, colour `--ffx-telegraph-crit` `#E8412E`; same slide, but the pulse goes to **2.4 Hz**, a 4 px `#E8412E` outer glow is added, and the **whole screen gains a 1 px `#E8412E` border inset 2 px** that persists until the attack resolves |
| **Persistent charge pip** | independently of the banner, while the boss is charging, its **CTB row** (§3.2) carries a filled 6 × 6 px diamond in `#F2A33A` (stage 1) or `#E8412E` (stage 2) at the icon's bottom-left, and its **on-field sprite** gets a matching 1 px rim in the same colour. The banner is transient; the pip is the state |
| **Single-charge variant** | once Mortiorchis is permanently in Auto-Attack Mode, stage 1 is **skipped**: the banner shows only `READY TO ANNIHILATE`, and to signal the shortened fuse the screen border appears **immediately**. `[verified: 2 sources]` for the mechanic |
| Audio hook | one rising two-note sting on stage 1, the same sting a fourth higher on stage 2 |
| Reuse | the same widget serves any scripted enemy wind-up: Yunalesca's Mega Death, BFA's Ultimate Jecht Shot, Vegnagun's cannon charge. Pass `{ actorName, stateText, stage: 1 \| 2 }` |

---

### 3.14 Shop screen (Wantz)

`ffx-seymour-flux.md` §7.7 states outright that the Mt. Gagazet merchant is "part of the encounter": he sells the **Holy Water** and the two **Zombie Ward** armours that answer Seymour Flux's Zombie → Full-Life kill combo. The shop therefore has to exist and has to make that answer findable.

| Element | Spec |
|---|---|
| Entry | Wantz's sprite (§1.22.5) plays his `hail` frame; a 10 px `#F2C21E` `▲` bobs above him; confirm opens the shop over the diorama (the scene stays visible, dimmed 35%) |
| Frame | `x48 y36 w544 h288`, §3.3 chrome, header `WANTZ` 14 px `#FFF0A8` with `GIL 123,456` right-aligned at `x576` in `--font-numeral` 12 px `--ffx-shop-gil` `#F2D24A` |
| Tabs | three, `WEAPONS` / `ARMOR` / `ITEMS`, 76 × 20 px at `y62` starting `x64`; active tab has the §3.3 selection gradient and a 2 px `#F2C21E` bottom rule |
| List | `x64 y92 w300`, rows height 24, 8 visible: 16 × 16 icon at `x72`, name 10 px at `x94`, price right-aligned at `x356` in `--font-numeral` 10 px `#F2D24A`, **greyed to `#6C7B90` if unaffordable** |
| **Ability chips** | beneath each weapon/armor name, up to 4 chips of 10 px height, 1 px border, holding the ability name at 7 px — e.g. `Zombie Ward`, `Magic Def +10%`, and **empty slots rendered as a dashed `#4E86C8` chip reading `—`**. FFX gear is defined by its abilities; a shop list without them is unusable |
| **Encounter-relevant highlight** | any item whose ability answers the **current chapter's** scripted threat carries a **2 px `#8BE8B0` left edge** on its row and a `#8BE8B0` `!` glyph. For the Gagazet shop that is **Blessed Ring**, **Blessed Bracer** and **Holy Water**. This is our addition, not the original's, and it is the difference between the shop being part of the encounter and being scenery |
| Detail pane | `x376 y92 w200 h208`: item name 12 px `#FFF0A8`; a 32 × 32 icon; the full ability list; a **comparison block** showing the equipped item's stats with `▲`/`▼` deltas in `#7EE8B0`/`#C7343C`; and for consumables, the one-line effect |
| Quantity | for items, a `×NN` stepper at the bottom of the detail pane, `◀ 03 ▶`, with the running cost updating in `#F2D24A` |
| Confirm | gil counter rolls down over 0.4 s in `--font-numeral`; a 6-mote `#F2D24A` burst at the counter; the purchased row's quantity increments |
| Price note | prices shown are the **undiscounted** figures; the real price scales with how much gil was given to O'aka `[single source]`. If the chapter preset does not model O'aka, show the undiscounted price and say nothing |
| Exit | `△`/back, or a `LEAVE` row pinned to the bottom of the list |

---

### 3.15 Item, equipment and customisation screens

Reached from the pre-battle menu (§5.4). All three share the §3.14 frame (`x48 y36 w544 h288`) and a **list-left / detail-right** split, so they are one screen with three modes.

| Screen | Left list | Detail pane | Notes |
|---|---|---|---|
| **Items** | all held items, rows height 20, `×NN` right-aligned in `--font-numeral` `#C8D4E4`; a 2-column layout for the icon grid variant | name, 32 × 32 icon, effect line, and **`USE` / `DISCARD`** actions | Key items get a separate tab and cannot be discarded |
| **Equipment** | seven character portraits down the left at `x64` (32 × 32, 8 px gutter, vertical); the selected character's **weapon** and **armor** slots as two 48 × 48 sockets | the candidate list for the selected slot, each row showing its ability chips (§3.14) and, critically, **the delta versus the currently equipped item** | Changing equipment **is a turn action in battle for everyone except Seymour** `[single source]`; out of battle it is free. The screen must state which context it is in, in the header |
| **Customise** | the item to be customised, then the ability to add | the **ability cost table**: ability name, the required item and count (e.g. `Zombie Ward — Holy Water ×1`, `Blessed — Holy Water ×2`), held count in `#C8D4E4`, and a `#C7343C` shortfall figure when short | Empty slots are the constraint — show `SLOTS 2 / 4` prominently in 12 px `#F2C21E`. Abilities that would overwrite an existing one must confirm |

Colours, chrome, cursor and text sizes are §3.3's and §3.10's throughout; nothing new is introduced.

---

### 3.16 Help window content contract

§3.7 gives the help window's rect but not what fills it. It is the only surface that can carry a mechanic's explanation, so its content is specified here rather than left to each screen.

| Cursor is on | Help line |
|---|---|
| A command row | the command's one-sentence effect |
| An ability row | effect, MP cost, and **rank** (the CTB cost) — e.g. `Rank 4 · 12 MP · Delays the target's next turn.` |
| An enemy target | name, and (if Scan/Sensor is active) `HP 4,000 / 4,000 · Weak: Fire` |
| A party target | name, and any statuses spelled out in words, not icons |
| A **Trigger Command** row | §3.12's two strings |
| An **Overdrive** row | the Overdrive's name plus its input hint, so the minigame is never a surprise |
| A locked Overdrive Mode | the trigger sentence and the remaining count |
| A shop row | the item's effect, and for gear the **first** ability chip expanded into a sentence |

Text is 10 px `--font-ui` `#EDF3FA`, single line, ellipsised at the rect's width; a second line is never allowed, because a growing help window would reflow the CTB list.

---

## 4. FFX-2 battle UI specification

FFX-2 is a different game visually: faster, brighter, girlier, and pink/violet where FFX is navy/gold. Same 640x360 canvas.

**Verified mechanics that the UI must express:**

| Fact | Source |
|---|---|
| The **ATB gauge is a bar that fills up under the HP and MP data**; when full the character can act. **Agility sets the bar's length; the fill rate is fixed.** | StrategyWiki via search `[single source]` |
| It is "the classic Active Time Battle **but faster**", and **party members can act simultaneously**, unlike earlier one-at-a-time ATB | `[single source]` |
| **Dresspheres determine the character's weapon, base stats, and appearance**; there is **no equipment** controlling those | `[single source]` |
| **Garment Grids** allocate which dresspheres each character may use | `[single source]` |
| ~~**Spherechange can be done at any time**, **halts time**, grants **immunity to enemy attacks** during the change, and is the **one action that still permits a normal action immediately afterwards**~~ — **SUPERSEDED, see §4.5.** The guide-derived flow in `ffx2-combat-core.md` §4.2 is explicit that spherechange is available **only on the girl's full-ATB turn**, is opened with **L1**, **consumes the entire turn**, and is restricted to a destination **one link away**. The time-halt is the general **Wait-mode** submenu rule, not a property of spherechange. Use the corrected table in §4.5 | ~~`[single source]`~~ superseded by `[verified: 2 sources]` |
| **Chaining**: landing multiple hits on an enemy within a short window produces a chain, shown by a chain counter | `[single source]` |
| Each character/dressphere combination has its **own avatar portrait** (the wiki lists 16 separate X-2 avatars for Yuna) | `[single source]` |

Everything else in section 4 is `[estimate]`.

### 4.1 Screen map

```
0,0                                                          640,0
 +--------------------------------------------------------------+
 |                                                               |
 |                                                               |
 |                      (3D scene)            CHAIN POPUP        |
 |                                            x430 y70           |
 |                                                               |
 |  +-------------------+                                        |
 |  | COMMAND WINDOW    |                                        |
 |  | x16 y206 w172 h140|                                        |
 |  +-------------------+   +----------------------------------+ |
 |                          | PARTY STATUS   x276 y278          | |
 |                          | w348 h72   (3 rows of 24)         | |
 |                          +----------------------------------+ |
 +--------------------------------------------------------------+
```

There is **no CTB list** — the turn order lives inside the three ATB bars.

### 4.2 Window styling (the pink/violet chrome)

| Property | Value |
|---|---|
| Corner radius | **8 px** (rounder and softer than FFX's 4) |
| Background | diagonal gradient at 20 deg: `#3A1A4E` (top-left) to `#12060E` (bottom-right), alpha 0.85 |
| Secondary sheen | a 45 deg `#7A2E6E` band at 18% alpha sweeping the upper third |
| Border outer | 1 px `#F7C8E4` (pale pink) |
| Border inner | 1 px `#B0489E` (magenta) |
| Corner ornament | a 5 px `#F7B6D9` teardrop/petal at the top-left and bottom-right corners only |
| Text | `#FBEAF4`; dim `#8E6E84`; highlight `#FFD9EC` |
| Selection bar | horizontal gradient `#B0489E` (70% alpha) to transparent |
| Cursor | **not** a finger — a 10x10 px **four-point sparkle/star** in `#FFD9EC` with a `#B0489E` core, rotating 90 deg per 0.5 s in 4 steps |

### 4.3 Party status rows + ATB gauges

Three rows, height 24, at `x276 y278 w348 h72`. Verified layout requirement: **the ATB bar sits under the HP and MP data** `[single source]`.

```
 [24x24 dressphere icon] NAME        HP 1240/1980   MP  88/120
                         [=================ATB=============---]
```

| Element | Spec |
|---|---|
| Dressphere icon | 24x24 at `x280`; see 4.4 |
| Name | `x308`, 10 px, `#FBEAF4` |
| HP | value right-aligned at `x468`; normal `#FBEAF4`, **critical (below 50%) `#F2D24A`**, KO `#C7343C` |
| MP | right-aligned at `x612`; `#8FD0F0` |
| ATB track | `x308 y+14 w306 h5`, fill `#2A1A30`, 1 px `#140A18` inner top shadow |
| ATB fill | horizontal gradient `#B0489E` to `#F7B6D9`, 1 px `#FFFFFF` leading edge |
| **ATB full** | fill switches to a `#FFD9EC`/`#FFFFFF` 4 Hz shimmer, the row's name brightens to `#FFD9EC`, and a 5 px `#F7B6D9` glow appears behind the whole row |
| **Bar length encodes Agility** | verified: higher Agility = **shorter** bar to fill. Render this literally — draw the track at `306 * (agility_reference / agility)` px clamped to `[120, 306]`, right-aligned, so a fast character visibly has a shorter runway |
| Spherechange lock | during a spherechange the row's ATB track greys to `#4A3A50` and a small `#FFD9EC` orbit ring spins on the icon |
| Status icons | 10x10 px chips in a row beneath, max 5, same glyph set as FFX but on pink chips (`#5A2A4E` base) |

### 4.4 Dressphere icons

**24 x 24 logical px**, one per character per dressphere (the wiki confirms the game ships a distinct avatar per dressphere `[single source]`). Two acceptable styles — pick one and be consistent:

- **Style A (recommended): sphere-emblem.** A glass sphere with the job's emblem floating inside. Sphere body is a radial gradient from the job colour (centre) to `#1A0E1E` (rim), with a 3 px `#FFFFFF` specular highlight at the upper-left and a 1 px `#F7C8E4` rim light. Emblem drawn in `#FFF6FA` at 10x10 px.
- **Style B: mini-portrait.** The character's head in that dressphere, cropped as in section 1.21, on a job-coloured ring.

| Dressphere | Job colour | Emblem (10x10) |
|---|---|---|
| Gunner | `#F7B6D9` | crossed pistols |
| Warrior | `#C93A42` | sword + shield |
| Thief | `#75913A` | dagger + coin |
| White Mage | `#F4F1E8` | crescent + circle |
| Black Mage | `#5E3C7E` | pointed hat |
| Dark Knight | `#2E2E5E` | crescent helm |
| Samurai | `#A9762E` | katana + hexagon |
| Songstress | `#3A78BE` | musical note |
| Alchemist | `#4FB05E` | flask |
| Gun Mage | `#3E9E96` | winged rifle |
| Berserker | `#E0742E` | fang |
| Trainer | `#8E6A3E` | paw |
| Lady Luck | `#E3B94A` | spade / club / diamond by character |
| Mascot | `#F49BB8` | moogle pom |
| Festivalist | `#F2712E` | fan |
| Psychic | `#7A5AB8` | spiral eye |

**Garment Grid strip** (**pre-battle menu only** — see §4.5 for the in-battle screen): the equipped grid drawn as a small graph of 2-6 nodes connected by 1 px `#B0489E` lines, each node a 14 px dressphere icon; the currently active node gets a `#FFD9EC` ring and the path travelled so far is drawn in `#F7B6D9` while untravelled links stay `#5A2A4E`. This strip is a **read-only summary widget** for the party screen (§5.4). It is **not** the spherechange interface.

### 4.5 Spherechange — the in-battle Garment Grid overlay

> **RESOLVED CONFLICT (was a major blocker).** An earlier revision of this section specified a **radial wheel of up to 8 dressphere icons on a 72 px radius centred on the acting character**. That is wrong, and not merely stylistically: a wheel **cannot express adjacency or gate traversal, which are the mechanic**. `ffx2-combat-core.md` §4.2 and §6.6 document the real flow `[single source, consistently]`:
>
> 1. On a girl's **full ATB turn**, press **L1**.
> 2. **The Garment Grid fills the screen; the live battle shrinks to a window in the upper-right corner.** In Wait mode, time freezes here.
> 3. Move the cursor to a dressphere **exactly one link away** from the one currently worn, press confirm.
> 4. The transformation animation plays; **the ATB gauge has been consumed and refills from zero** — the change costs the **whole turn**.
> 5. If the traversed link carried a **gate**, its temporary effect applies **on arrival** and **the line is redrawn blue**.
> 6. Control returns with the new dressphere's commands and stats.
>
> Also corrected: the wheel spec claimed spherechange "halts time, grants immunity, and still allows a normal action afterwards". `ffx2-combat-core.md` §4.2 is explicit that **it consumes the whole turn** `[verified: 2 sources]`. The "free action" reading came from the FFX-2 *StrategyWiki* summary quoted in §4.0 and is **superseded by the guide-derived flow**. The **time-halt** is real but conditional: it is the general **Wait-mode** rule that time freezes whenever a submenu is open `[single source]`, not a property of spherechange. §4.0's verified-facts table is corrected accordingly below.

**Correction to the §4.0 verified-facts table.** Replace the row reading *"Spherechange can be done at any time, halts time, grants immunity to enemy attacks during the change, and is the one action that still permits a normal action immediately afterwards"* with:

| Fact | Source |
|---|---|
| Spherechange is available **only on the girl's turn** (full ATB), opened with **L1**, and **consumes the entire turn** — the ATB gauge is spent and refills from empty while the transformation plays | `ffx2-combat-core.md` §4.2 `[verified: 2 sources]` |
| Destination must be **one link away** on the equipped Garment Grid; a gate on that link is **passed through**, it is not a step | `[verified: 2 sources]` |
| Passing a gate grants a **temporary (T-) effect** — `T-STAT+`, `T-ACTA` or `T-PASA` — that **lasts the whole battle**, survives KO and revival, and is lost at battle end | `[verified: 2 sources]` |
| Gate **combinations** (`GR`, `RGY`, `GRYB`) require having passed all listed gates **this battle**, in **any order** | `[verified: 2 sources]` |
| **Already-travelled lines are drawn blue** | `[single source]` |
| **Curse** disables the L1 menu entirely; **Itchy** seals every command *except* L1 and Escape | `[verified: 2 sources]` |
| In **Wait mode**, time freezes while this screen is open; in **Active mode** it does not | `[single source]` |

#### 4.5.1 Screen layout (640 × 360)

```
0,0                                                          640,0
 +--------------------------------------------------------------+
 | GARMENT GRID  x24 y14        +-------------------------------+|
 |                              |  LIVE BATTLE WINDOW           ||
 |  +------------------------+  |  x424 y30 w200 h114           ||
 |  |                        |  |  (scene rendered at 0.3125x)  ||
 |  |    GRID CANVAS         |  +-------------------------------+|
 |  |    x24 y44 w376 h236   |  | GATE BUFFS EARNED  x424 y156  ||
 |  |                        |  | w200 h78                      ||
 |  +------------------------+  +-------------------------------+|
 |  DETAIL STRIP  x24 y288 w376 h56   | ATB  x424 y242 w200 h18  |
 +--------------------------------------------------------------+
                                                            640,360
```

| Region | Rect | Contents |
|---|---|---|
| Title | `x24 y14` | `GARMENT GRID` 14 px `--font-x2` `#FFD9EC`, letter-spaced +1.5 px; the grid's own name right-aligned at `x400` in 10 px `#F7B6D9` (e.g. `HEART OF FLAME`) |
| **Grid canvas** | `x24 y44 w376 h236` | the node/link graph — see §4.5.2 |
| **Live battle window** | `x424 y30 w200 h114` | the running battle, rendered to a second render target at **0.3125×** (200/640) and blitted with **nearest**; 2 px §4.2 border (outer `#F7C8E4`, inner `#B0489E`), corner radius 8 px, plus a 1 px `#12060E` drop shadow. Verified requirement: the battle is minimised to the **upper right** `[single source]` |
| Battle-window overlay | inside the above | only the three ATB bars, drawn at 1/3 scale along its bottom edge — **never** the full HUD, which is illegible at this size |
| **Wait/Active badge** | `x424 y30`, inset 4 px | `WAIT` on a `#5A2A4E` pill (time frozen) or `ACTIVE` on a `#8E2A2A` pill (time running). This badge is the difference between a free look and a dangerous one, and `ffx2-combat-core.md` §6.1 confirms the game shows a mode indicator in the upper right `[single source]` |
| **Gate-buffs-earned panel** | `x424 y156 w200 h78` | §4.2 chrome; header `THIS BATTLE` 9 px `#8E6E84`; then one row per temporary effect already earned, 14 px tall: a 10 px gate orb in its colour, the effect name in 10 px `#FBEAF4`. Empty state: `— none yet —` in `#8E6E84`. This panel is what makes the gate system visible; without it the buffs are invisible state |
| **Actor ATB readout** | `x424 y242 w200 h18` | the acting girl's portrait at 16 × 16, her name, and her **full** ATB bar with the caption `THIS CHANGE COSTS YOUR TURN` in 8 px `#F2D24A`. The cost must be stated on the screen where it is paid |
| Detail strip | `x24 y288 w376 h56` | see §4.5.4 |

Backdrop: the live scene behind the overlay darkens **55%** and desaturates to **30%** over 0.14 s. The overlay itself slides in from the left over 0.18 s (ease-out-cubic) while the battle window scales down from full-frame to its rect over the same 0.18 s — that single move *explains* the screen.

#### 4.5.2 Grid canvas — nodes, links and gates

A Garment Grid has **2 to 6 nodes** connected by lines, with **0 to 4 coloured gates** sitting **on** the lines `[verified: 2 sources]`.

| Element | Spec |
|---|---|
| Layout | nodes are placed on a **circle** inscribed in the canvas: centre `(212, 162)`, radius **88 px**, first node at 12 o'clock, the rest spaced evenly clockwise. A 2-node grid is a vertical pair; a 6-node grid is a hexagon. Deterministic placement means a player recognises a grid by shape |
| **Node (empty)** | 40 × 40 px: a `#2A1A30` disc, 2 px dashed `#5A2A4E` ring, and a 12 px `#5A2A4E` `+` glyph |
| **Node (filled)** | the 24 × 24 dressphere icon from §4.4 centred on a 40 px `#1A0E1E` disc with a 2 px ring in the **job colour** from §4.4's table |
| **Node (worn now)** | ring thickens to 3 px `#FFD9EC`, gains a 5 px outer glow at 50%, and a slow 0.8 Hz breathing scale between 1.00 and 1.04. The girl's 16 × 16 portrait is pinned to its lower-right |
| **Node (reachable — one link away)** | full alpha, ring pulses between the job colour and `#FFD9EC` at 1.2 Hz, and the connecting link animates a 2 px `#FFD9EC` chase dash toward it at 40 px/s. **Reachability is the mechanic**, so it is the loudest thing on the screen |
| **Node (unreachable)** | 45% alpha, ring flat `#5A2A4E`, no animation. It is **visible but not selectable** — the player must be able to see the whole grid to plan a route |
| **Link (untravelled)** | 2 px `#5A2A4E` |
| **Link (travelled this battle)** | **2 px `#4E86C8` blue** — verified: already-travelled lines are drawn blue `[single source]`. Note this is the one place the X-2 palette deliberately uses a **cool blue** rather than the pink chrome; do not "correct" it to pink |
| **Link (the one being traversed)** | 3 px, animated gradient `#FFD9EC` → `#B0489E` sweeping from source to destination at 120 px/s |
| **Gate orb** | **16 × 16 px**, centred on its link: a filled disc in the gate colour with a 1 px `#12060E` outline, a 2 px `#FFFFFF` specular at the upper-left, and a 3 px outer glow at 40% |
| Gate colours | **Red `#D0343C`** · **Green `#4FB05E`** · **Blue `#3A78BE`** · **Yellow `#E3B94A`** `[verified: 2 sources]` for the four-colour set |
| **Gate orb (already passed this battle)** | a 2 px `#FFFFFF` check glyph overlays it and the glow becomes a steady 1 px white ring; its colour stays |
| **Gate orb (on the link you are about to take)** | scales to 20 × 20 and its glow pulses at 2 Hz, and the detail strip names the effect it will grant |
| Cursor | the §4.2 four-point sparkle, 10 × 10 px `#FFD9EC`, orbiting the highlighted node's ring at radius 26 px, 1 rev/s |
| Input | direction keys move to the nearest **reachable** node in that direction; **unreachable nodes are skipped**, never selected-then-rejected |
| Illegal confirm | if the player forces a confirm on an unreachable node: 3-frame `#8E6E84` flash on that node, a 4 px horizontal shake, an error tone, and the help line `Not linked to your current dressphere.` No turn is consumed |

#### 4.5.3 Special Dress Up entry

`ffx2-combat-core.md` §3.15/§6.6: when **every node on the grid has been visited** and **every node is filled**, pressing **L1** offers Special Dress Up — press **R1**, then confirm; the other two girls leave the field. `[single source]`

| Element | Spec |
|---|---|
| Availability cue | when the condition is met, **every** link on the canvas turns blue (it must be, by definition) and a **`R1  SPECIAL DRESS UP`** pill appears at `x24 y264 w376 h20`: fill gradient `#B0489E` → `#F7B6D9` at 70%, 2 px `#FFD9EC` border, 12 px `#FFFFFF` text, 1.5 Hz pulse |
| Node-count hint | to the right of the pill, `NODES 6` in 9 px `#F7B6D9` — because the special dressphere's stats scale with the **node count** of the grid `[single source]`, and the player should see that a bigger grid was worth it |
| Confirm | the grid canvas collapses inward to the centre over 0.25 s, the two other girls' sprites fade from the battle window, and the long transformation plays |

#### 4.5.4 Detail strip and the commit sequence

| Element | Spec |
|---|---|
| Detail strip | `x24 y288 w376 h56`, §4.2 chrome. Left: the highlighted dressphere's **name** 12 px `#FFD9EC` and its **command list** in 9 px `#FBEAF4` (e.g. `Attack · Trigger Happy · Gunplay · Item`). Right: stat deltas versus the worn dressphere, in two columns of `HP MP STR MAG DEF MDEF AGI`, each with a `▲`/`▼` and the delta in `#8BE8B0` / `#C7343C` |
| **Gate preview line** | if the link to the highlighted node carries a gate, a full-width line across the strip's bottom: the gate orb at 12 px, then `GRANTS: Firestrike (this battle)` in 10 px in the gate's colour. If the traversal **completes a combination** (e.g. `G+R` → Use Fira), say so: `COMPLETES G+R → Use Fira`. This is the single most valuable line on the screen and both X-2 chapters' strategy sections depend on it |
| Commit VFX | the grid canvas fades out over 0.12 s; the battle window **scales back up to full frame** over 0.20 s; then the transformation plays on the field — a vertical `#FFFFFF` light column over the girl for 12 frames while 8 `#F7B6D9` petal-motes orbit outward, the new outfit resolving on frame 9, and a `#FFD9EC` ring expanding from her feet to radius 90 px and fading |
| Gate-arrival VFX | if a gate was traversed, its orb's colour **flies from the link to the girl** over 0.25 s and bursts into a ring in that colour; the earned effect's name rises 14 px above her in 10 px in the gate colour; and the new row appears in the gate-buffs panel |
| Cost, made visible | on return, her ATB bar is **empty** and begins refilling — do not skip this frame; it is the price |
| Total cost | grid open → commit → control returned: **≈1.35 s** of presentation, plus one full ATB cycle of game cost |
| Cancel | `△`/back closes the overlay with the reverse slide in 0.14 s and **consumes nothing** |

### 4.6 Chain counter popup

| Property | Value |
|---|---|
| Position | `x430 y70`, anchored top-right of the enemy being chained; follows that enemy's screen position, clamped 16 px inside the viewport |
| Layout | big numeral + the word `CHAIN` beneath it |
| Numeral | 28 px, fill gradient `#FFD9EC` to `#B0489E`, 2 px `#2A0E20` outline |
| `CHAIN` label | 10 px, `#F7B6D9`, letter-spaced +1 px |
| On increment | numeral scale-pops 1.0 to 1.45 to 1.0 over 0.18 s, colour flashes `#FFFFFF` for 2 frames, and a ring of 6 petal-motes bursts outward |
| Escalation | at chain 5 the numeral gains a `#F2C21E` outer glow; at 10 the fill becomes `#FFF0A8` to `#F2712E`; at 20 add a 1-frame full-screen `#FFD9EC` flash at 15% on each increment |
| Decay | if no hit lands within the chain window, the numeral shrinks to 0.6x and fades over 0.4 s |
| Damage-number coupling | chained hits spawn their damage numerals along the same rising diagonal ladder described in 3.6, so the chain reads as one continuous stream |

### 4.7 Command window and damage numbers (X-2 deltas from FFX)

| Element | Difference from FFX |
|---|---|
| Command window | `x16 y206 w172 h140`, X-2 chrome, row height 22. Commands are the dressphere's: e.g. Gunner = **Attack / Trigger Happy / Gunplay / Item / Spherechange**; White Mage has **no Attack** (verified `[single source]`) — render the missing row as an absent row, not a greyed one |
| Ability list | sub-panel `x196 y140 w236 h206`, X-2 chrome |
| Damage numerals | same geometry and bounce as 3.6, but the **fill gradient is `#FFFFFF` to `#F7C8E4`** and the outline is `#2A0E20`; criticals go `#FFF0A8` to `#F2712E` |
| Healing | `#8BE8B0` to `#3FA870`, unchanged |
| MISS | `#F7C8E4` to `#B0489E` |
| Target reticle | a **rotating 6-petal flower** rather than a bracket: 30 px diameter, 2 px `#F7B6D9` strokes, rotating 40 deg/s |

### 4.8 X-2 victory screen

Verified: FFX-2 has its own Battle Results screen `[single source]`, and its Gunner/Warrior/Thief/etc. **victory poses are documented per character per dressphere** — see section 1.14-1.16 for the exact poses. Remember that the **Shuyin fight is the exception: no victory pose at all** `[single source]`.

| Step | Timing | Spec |
|---|---|---|
| 1. Fanfare + poses | 0.0-1.8 s | all three pose simultaneously (X-2 is faster than FFX's stagger) |
| 2. Panel | 1.6 s | slides in from the **right**: `x160 y104 w400 h152`, X-2 chrome |
| 3. Rows | 1.6-2.6 s | per character: dressphere icon, name, `EXP +N`, `AP +N` (dressphere AP), and a `LEVEL UP` / `NEW ABILITY` tag |
| 4. Spoils | 2.8 s | gil and items listed in the lower third of the same panel (X-2 does not need a second screen) |
| 5. Dismiss | input or auto at 6.0 s | |

| Element | Colour |
|---|---|
| Heading `VICTORY` | `#FFD9EC`, 14 px |
| `EXP +N` | `#8BE8B0` |
| `AP +N` | `#F7B6D9` |
| `NEW ABILITY` tag | `#FFF0A8` on a `#5A2A4E` pill |
| `GIL +N` | `#F2D24A` |
| Chain best (`MAX CHAIN N`) | `#F7B6D9`, shown bottom-right as a flourish |

### 4.9 Base UI colour tokens (FFX-2)

| Token | Hex |
|---|---|
| `--x2-win-tl` | `#3A1A4E` |
| `--x2-win-br` | `#12060E` |
| `--x2-sheen` | `#7A2E6E` |
| `--x2-border-outer` | `#F7C8E4` |
| `--x2-border-inner` | `#B0489E` |
| `--x2-corner` | `#F7B6D9` |
| `--x2-text` | `#FBEAF4` |
| `--x2-text-dim` | `#8E6E84` |
| `--x2-text-hi` | `#FFD9EC` |
| `--x2-atb-track` | `#2A1A30` |
| `--x2-atb-lo` | `#B0489E` |
| `--x2-atb-hi` | `#F7B6D9` |
| `--x2-hp` | `#FBEAF4` |
| `--x2-hp-critical` | `#F2D24A` |
| `--x2-mp` | `#8FD0F0` |
| `--x2-chain` | `#FFD9EC` |

**Additional tokens introduced by §4.5, §4.10 and §4.11:**

| Token | Hex | Use |
|---|---|---|
| `--x2-gate-r` | `#D0343C` | Garment Grid Red gate |
| `--x2-gate-g` | `#4FB05E` | Green gate |
| `--x2-gate-b` | `#3A78BE` | Blue gate |
| `--x2-gate-y` | `#E3B94A` | Yellow gate |
| `--x2-link-travelled` | `#4E86C8` | already-travelled grid link (**verified as blue**) |
| `--x2-link-idle` | `#5A2A4E` | untravelled grid link |
| `--x2-mash` | `#FFD9EC` | Trigger Happy mash meter fill |
| `--x2-mash-hot` | `#F2D24A` | Trigger Happy meter above pace |
| `--x2-reel-dud` | `#C7343C` | Lady Luck Dud result |
| `--x2-ctim` | `#B048F0` | charging (CTIM) ATB fill |
| `--x2-haste` | `#C7343C` | Haste ATB fill |
| `--x2-slow` | `#E3B94A` | Slow ATB fill |
| `--x2-stop` | `#FFFFFF` | Stop ATB fill |

> **ATB colour-coding correction to §4.3.** `ffx2-combat-core.md` §6.1 documents the real gauge colour code `[verified: 2 sources]`: **green** = normal fill, **purple** = CTIM (the selected ability is charging), **red** = Haste, **gold** = Slow, **white** = Stop. §4.3's pink-gradient fill is our art direction for the *normal* state only; the four state colours above **override** it whenever that state is active, because they are load-bearing information. Likewise §4.3's HP colouring should follow the documented rule: **white ≥ 33% of max, yellow < 33% ("HP Critical" — she visibly kneels and all `SOS …` passives switch on), red at 0** `[single source]` — not the 50% threshold inherited from FFX.

---

### 4.10 FFX-2 timed-input UIs

X-2 has no Overdrive gauge, but it has two abilities with real-time input that need the same treatment §3.11 gives FFX's. Neither is drawn as a full-screen overlay — X-2's battles keep running underneath, which is the point.

#### 4.10.1 Gunner — Trigger Happy (mash meter)

Mechanic `[verified: 2 sources]` (`ffx2-combat-core.md` §3.1): mash **R1** for **1.8 s** base, **2.2 s** with Trigger Happy Lv. 2, **2.6 s** with Lv. 3; one shot per press, each shot using the **normal Attack** damage constant and able to crit; shots **self-chain**; **Haste shortens the inter-shot delay**; recovery afterwards is `2xRT`; **if two characters are using Trigger Happy at once, one R1 press fires for both**; the player may still issue commands for the other two girls while it runs.

| Element | Spec |
|---|---|
| Placement | a **strip above the acting girl's party-status row**, `x276 y254 w348 h20` — deliberately *not* centre-screen, because the player must keep watching the battle and may be issuing other girls' commands simultaneously |
| Frame | §4.2 chrome at 8 px radius, 0.9 alpha |
| Prompt glyph | a **20 × 20 px `R1` chip** at the strip's left (`x280`), 12 px `--font-numeral` on a `#5A2A4E` pill; it **scale-pops 1.0 → 1.25 → 1.0 over 4 frames on every registered press**, which is the player's confirmation that the input landed |
| **Window bar** | `x306 y260 w300 h8`: track `#2A1A30`, fill draining **right-to-left** over the ability's window (1.8 / 2.2 / 2.6 s), gradient `#F7B6D9` → `#B0489E`. The last **0.4 s** of the bar is drawn in `--x2-mash-hot` `#F2D24A` as a "final burst" cue |
| **Shot counter** | right-aligned at `x618 y256`: the shot count in `--font-numeral` **18 px**, gradient `#FFFFFF` → `#F7C8E4`, 2 px `#2A0E20` outline, incrementing with a 1.0 → 1.3 → 1.0 pop |
| **Pace indicator** | a 1 px `#8E6E84` vertical tick on the window bar marking the shot count an *average* player reaches; when the live count passes it the whole counter switches to `--x2-mash-hot` `#F2D24A`. Gives the mash a target without inventing a score |
| Muzzle feedback | each shot spawns a 6 px `#FFF0A8` muzzle flare at the girl's gun and one damage numeral on the target; the numerals stack along §3.6's rising diagonal ladder so the volley reads as one stream |
| **Chain coupling** | because shots self-chain, the §4.6 chain popup is live the whole time — keep it on screen and let it climb; do not suppress it during the ability |
| **Two-girl case** | if two girls are running Trigger Happy simultaneously, draw **two strips stacked** (`y254` and `y232`), each with its own counter, and put a single shared `R1` chip **between** them with a 1 px `#FFD9EC` bracket linking both — one press, two shots, and the UI must say so |
| Keyboard fallback | any repeated key; the strip's glyph chip shows the bound key instead of `R1` |
| End | the bar empties, the strip holds for 0.3 s showing the final count, then slides down and out over 0.15 s while the `2xRT` recovery begins on the ATB bar |

#### 4.10.2 Lady Luck — the reels

Mechanic `[verified: 2 sources]` (`ffx2-combat-core.md` §3.12): four reel abilities (**Attack / Magic / Item / Random Reels**); the slots begin spinning **in a random order** and the player presses confirm **three times, one press per reel**; **three-of-a-kind** gives the top result, **two-of-a-kind (slots 1+2)** a mid result, **a single Cherry in slot 1** the weakest result, and **anything else is a Dud**. All effects from one spin share a **single charge bar** and fire together. **A Dud deals the whole party special gravity damage equal to 75% of current HP, ignoring defence.**

| Element | Spec |
|---|---|
| Housing | `x196 y128 w248 h84`, §4.2 chrome at 8 px radius, 0.92 alpha, plus a 2 px `#E3B94A` inner rule — the only gold in the X-2 UI, because Lady Luck is the casino dressphere |
| Reels | three, each **72 × 60 px**, 8 px gutter, first at `x204 y140`; three symbols visible per reel, centre at full alpha, neighbours at 45% |
| **Random stop order** | the reels do **not** stop left-to-right. Draw a 12 px `#FFD9EC` `▼` above whichever reel the **next** press will stop, and move it as the order dictates. Without this marker the random order is indistinguishable from a bug |
| Pay line | 1 px `#E3B94A` across all three, with 5 px `#E3B94A` triangles at both housing edges |
| Symbols | **Red 7** `#D0343C` · **BAR** `#FBEAF4` on `#2A1A30` · **Cherry** `#D0343C` with a `#4FB05E` stem · plus the three per-reel-set symbols (Sword/Helmet/Paw for Attack; Skull/Hat/Staff for Magic; Blue Flask/Red Orb/Green Flask for Item; the Random set mixes them). 40 × 40 px each on a `#2A1A30` tile with a 1 px `#B0489E` frame `[verified: 2 sources]` for the symbol sets; art `[estimate]` |
| Stop | 0.18 s ease-out decel, snap to symbol centre, 2-frame `#FFD9EC` flash |
| **Result banner** | `x196 y218 w248 h24`, held 0.8 s before the effects fire: **3-of-a-kind** → the result's name in 14 px `#FFF0A8` with a 3 px `#E3B94A` glow and a 16-mote gold burst · **pair** → 12 px `#F7B6D9` · **Cherry-any-any** → 11 px `#FBEAF4` · **Dud** → `DUD` in 16 px `--x2-reel-dud` `#C7343C` on a `#2A0E20` fill, with a 6 px screen shake and a `#C7343C` full-screen flash at 25% for 2 frames |
| **Dud warning, in advance** | while the reels spin, print `DUD: −75% PARTY HP` in 8 px `#C7343C` along the housing's bottom edge. The downside is severe and non-obvious; state it every time |
| Single charge bar | because all results from one spin share one charge bar `[verified: 2 sources]`, show **one** purple CTIM ATB fill (`--x2-ctim`) on the acting girl for the whole resolution, never one per effect |
| Pause-manipulation | the reels can be lined up by repeatedly pausing `[single source]`. Do not defeat it deliberately; do not advertise it |

---

### 4.11 Scan / Libra panel (FFX-2), and the FFX Sensor equivalent

The X-2 chapters' strategy sections depend on reading enemy resistances (Vegnagun's parts and possessed Bahamut both have exploitable affinities), and nothing in §4 specified where that information appears.

| Element | Spec |
|---|---|
| Trigger | the Scan/Libra ability resolves, **or** the cursor rests on an enemy while a party member has the passive equivalent equipped |
| Panel | `x376 y40 w248 h150`, §4.2 chrome, sliding in from the right over 0.16 s; it **does not pause the battle** (X-2 never pauses) and auto-dismisses 4 s after the cursor leaves the target |
| Header | the enemy's name 12 px `#FFD9EC`, with its **Shinra's Bestiary number** right-aligned in 9 px `#8E6E84` — `#250` — which is the in-fiction framing for this information |
| HP row | `HP 2,840 / 3,000` in `--font-numeral` 12 px, plus a `w216 h6` bar: track `#2A1A30`, fill `#F7B6D9`→`#FFD9EC`, and a 1 px `#C7343C` tick at the Oversoul threshold if one applies |
| MP row | same treatment in `#8FD0F0` |
| **Elemental grid** | six 34 × 20 px cells in two rows — **Fire · Lightning · Water · Ice · Holy · Gravity** (the order `ffx2-combat-core.md` uses). Each cell holds the element's sigil at 12 px and its multiplier as text: `0%` `#6C7B90` (immune) · `50%` `#4FB05E` (resists) · `100%` `#FBEAF4` (neutral) · `200%` `#F2D24A` (weak) · `ABS` `#B048F0` (absorbs). Colour-code the **cell background** too, at 25% alpha, so the weakness is findable without reading |
| Status-immunity row | a row of 10 × 10 px status chips; immune statuses are struck through with a 1 px `#C7343C` diagonal |
| Steal / drop line | `STEAL: Phoenix Down` / `DROP: Mega-Potion` in 9 px `#C8D4E4`; unknown entries show `???` |
| **Telegraph tie-in** | the panel's bottom strip mirrors `ffx2-combat-core.md` §6.5's stance telegraphs `[single source]`: `CHARGING: MAGIC` when an aura surrounds the enemy, `CHARGING: SPECIAL` when its stance changes or it speeds up, blank otherwise — in `--x2-ctim` `#B048F0` and `#E8412E` respectively. This is the X-2 equivalent of §3.13's banner and it is what makes Dismissal, Delay Attack and Silence Grenade meaningful |
| **FFX equivalent (Sensor)** | the same content in §3.3's navy chrome at `x376 y40 w248 h150`, minus the Bestiary number and the Oversoul tick, and with FFX's element set (Fire · Thunder · Water · Ice · Holy). Route its one-line summary through the §3.16 help-window contract as well |

---

## 5. Title screen, chapter select, and pre-battle screen

### 5.1 What the real logos actually are (verified, and what we may NOT copy)

| Fact | Source |
|---|---|
| "The logo of *Final Fantasy X* features **Yuna performing a sending at the Kilika Port** in a variety of **vibrant shades, reminiscent of the iridescence of pyreflies**... It is the **first to officially bear Amano's signature**, visible in the **bottom-right corner**. Like *Final Fantasy V*, the 'X' **strays from the traditional font style**." | FF Wiki, *Logos of Final Fantasy* `[single source]` |
| The **HD Remaster** logo "is almost identical to the original... apart from **a bar done in the style of sunlit water beneath the main title, with silver writing superimposed over it**." | same `[single source]` |
| "The logo of *Final Fantasy X-2* features **Yuna, Rikku, and Paine** with the **reverse colour gradient of its predecessor's**... Amano's signature is visible just to the right of Paine's extended leg." | same `[single source]` |
| The wordmark itself is "**tall, elegant capitals with high contrast between thick and thin strokes and crisp, engraved serifs**" — custom lettering, not a font. | MadeGood Designs `[single source]` |

> **CORRECTION TO THE BRIEF.** The brief describes the FFX title as "Tidus at the Luca sea wall vibe / logo with Yuna in the water". The verified subject of the logo art is **Yuna performing a sending at Kilika Port**, not Luca — Kilika is the village burned by Sin at the start of the game, and the sending is performed on the water at night. Build the homage around **a woman dancing on dark water surrounded by rising motes of light**, which is both the correct reference and, conveniently, an image generic enough to render entirely originally.

**What we ship instead.** An **original lockup**: the words `PYREFLY REPRISE` in Cinzel (or the chosen OFL display face), with an original painted vignette above it. Do not reproduce the Amano artwork, the "X" glyph, or the Square Enix wordmark.

### 5.2 Title screen

**Composition.** A full-screen HD-2D diorama, not a flat image: dark water filling the lower 45% of the frame with a slow specular shimmer, a distant burning silhouette on the horizon, and a lone figure standing on the water at frame-centre-left with one arm raised. Above and behind her, a rising column of pyreflies. The title lockup sits in the upper-right third so the figure and the lockup balance diagonally.

| Layer | z | Spec |
|---|---|---|
| Sky | -40 | vertical gradient `#08101E` (top) to `#2A2244` to `#6E3A4E` at the horizon |
| Horizon fire glow | -35 | `#C9502E` at 40%, additive, 24 px band, breathing at 0.15 Hz |
| Distant island silhouette | -30 | flat `#0B0A12` shape |
| Water plane | -10 to +6 | reflective plane (section 6.5) with a scrolling normal map, specular `#8FBEE0` |
| Dancer | 0 | 64 px pixel sprite, fully rim-lit, arm raised; 8-frame 2 s loop |
| Pyrefly column | +2 | 80 `--pyre-green` / `--pyre-white` motes rising through the frame |
| Foreground water spray | +8 | 20 `#C8E4F4` motes at 30% alpha, blurred by DoF |
| Logo lockup | UI | see below |
| Menu | UI | see below |

**Logo lockup.**

| Element | Spec |
|---|---|
| Wordmark | `PYREFLY` on line 1 at 46 px, `REPRISE` on line 2 at 46 px, right-aligned, letter-spaced +3 px |
| Fill | vertical gradient `#F4F1E8` (top) to `#9FB0C4` (bottom) |
| Edge | 1 px `#E3B94A` inner bevel on the upper-left strokes only, to fake engraving |
| **Water bar** | directly beneath the wordmark, a 220x14 px horizontal bar filled with a **scrolling sunlit-water caustic** texture (`#3FA3D6` base with `#C9F4FF` caustics, scrolling at 8 px/s) and the subtitle `an unofficial fan tribute` in **silver `#C8D4E4`, 11 px, superimposed over it** — this directly homages the documented HD Remaster treatment while using our own words and art |
| Entrance | the lockup fades in from 0 over 1.4 s starting at t=2.0 s, with a 6 px upward drift; a single sweep of `#FFFFFF` at 20% passes left-to-right across the letters once at t=3.2 s |

**Menu.**

| Property | Value |
|---|---|
| Position | centred horizontally, `y = 274`, rows 26 px apart |
| Items | `NEW GAME` / `CONTINUE` / `CHAPTER SELECT` / `OPTIONS` / `CREDITS` |
| Unselected | 14 px, `#9FB0C4`, no background |
| Selected | 14 px, `#FFF0A8`, plus a 200x22 px horizontal gradient bar behind it from transparent to `#2E5A9E` (40%) to transparent |
| Cursor | the **same 13x11 px finger cursor** as the battle menu (section 3.3), 16 px to the left of the selected row, bobbing +/-1 px |
| Unavailable `CONTINUE` | `#4A5568`, refuses confirm with a 2-frame shake and a soft buzz |
| Idle timeout | after 25 s with no input, fade to an attract loop of the five money shots (section 2), 6 s each with cross-dissolves; any input returns |
| Audio | a slow solo-instrument theme; the menu confirm is a single soft chime, cancel a lower one |

### 5.3 Chapter select — five sphere cards

FFX-2 presents its menus as **spheres** (the whole game's fiction is built on spheres: dresspheres, Garment Grids, sphere hunting) `[single source: Dressphere`]. We adopt that directly.

**Layout.** Five sphere cards arranged in a shallow arc across the middle of the screen, the selected one scaled up and brought forward:

```
      (1)        (2)       [ 3 ]       (4)        (5)
   Gagazet   Zanarkand   Dream's   Bevelle   Farplane
                          End      Undergr.
```

| Property | Value |
|---|---|
| Sphere diameter | **96 px** unselected, **136 px** selected |
| Arc | centres at `y = 168` for the selected card, `y = 182` for neighbours, `y = 194` for outer cards; x spacing 116 px |
| Sphere body | a glass ball: radial gradient from the chapter's key colour at 35% opacity (centre) to `#0E0C18` (rim), plus a 1 px `#C8D4E4` rim light, a 14 px `#FFFFFF` specular blob at 35 deg upper-left, and a soft 8 px drop shadow beneath |
| **Thumbnail** | the chapter's money shot, rendered to a 128x128 texture, **circle-masked** and composited *inside* the sphere at 78% of its diameter, with a slight barrel distortion (0.12) so it reads as refracted through glass |
| Selected treatment | scales up over 0.2 s (ease-out-back), gains a rotating 2 px `#F2C21E` ring at radius+6, and 6 pyreflies orbit it |
| Locked chapter | thumbnail desaturated to 0 and darkened 60%, plus a 24 px `#6C7B90` padlock glyph; the sphere's glass goes `#2A2F3A` |
| Completed chapter | a small 16 px `#F2C21E` Yevon-style rosette at the sphere's lower-right, plus a `CLEARED` tag |

**Per-chapter card data:**

| # | Title | Boss(es) | Key colour | Thumbnail = money shot |
|---|---|---|---|---|
| 1 | **The Prominence** | Seymour Flux + Mortiorchis | `#7C8AA6` cold blue-grey | 2.1 shot 2 (silhouette wide, sun band) |
| 2 | **The Lady of the Dome** | Yunalesca (3 forms) | `#C8D8F0` shaft-white on violet | 2.2 shot 1 (symmetric processional) |
| 3 | **Dream's End** | Braska's Final Aeon + Yu Pagodas, then Yu Yevon | `#FF7A2E` ember orange | 2.3 shot 1 (father and son on the causeway) |
| 4 | **Beneath the Holy City** | possessed Bahamut | `#6ED2EE` up-lit cyan | 2.4 shot 2 (Bahamut over the hole) |
| 5 | **The Heart of the Farplane** | Vegnagun (4 parts) then Shuyin | `#F7B6D9` farplane pink | 2.5 shot 1 (arrival wide) |

**Detail rail.** Beneath the arc, a single FFX-chrome window at `x64 y252 w512 h84` showing the highlighted chapter's: title (14 px `#FFF0A8`), one-line premise (10 px `#EDF3FA`), the **boss name(s)**, the **recommended party**, the **battle system** badge (`CTB` in `--ffx-border-inner` or `ATB` in `--x2-border-inner`), and best clear time / rank if any.

### 5.4 Pre-battle "Party & Sphere Grid" screen

FFX's main menu is a **character list on the left, detail on the right**. We reproduce that grammar. The Sphere Grid itself is the game's levelling board `[single source]`, and AP earned in battle converts to **Sphere Levels (S.Lv)** that are spent moving between nodes `[verified: 2 sources]`.

**Layout (640 x 360):**

```
+--------------+---------------------------------------------+
| PARTY  x12   |  DETAIL PANEL  x176 y12 w452 h248            |
| y12 w152     |  [tabs] STATS | SPHERE GRID | ABILITIES |    |
| h248         |         EQUIPMENT | OVERDRIVE               |
|              |                                             |
| [ portrait ] |                                             |
| [ portrait ] |                                             |
| [ portrait ] |                                             |
|   ... x7     |                                             |
+--------------+---------------------------------------------+
|  ACTIVE PARTY (3 slots)  x12 y270 w616 h78                  |
+-------------------------------------------------------------+
```

**Left character list.**

| Property | Value |
|---|---|
| Row | 152 x 34, 7 rows, 2 px gap |
| Contents | 28x28 portrait, name (10 px), `S.Lv` (9 px `#C8D4E4`), a 60x4 px HP bar, a 60x3 px Overdrive bar |
| Selected row | full FFX window chrome around just that row + finger cursor to its left |
| In active party | a 3 px `#F2C21E` vertical tab on the row's left edge |

**Right detail panel — STATS tab.** Two columns. Left column: HP, MP, Strength, Defense, Magic, Magic Def, Agility, Luck, Evasion, Accuracy (FFX's stat set `[single source]`), each as `label ... value` with a 60x4 px bar normalised to 255. Right column: equipped weapon and armour with their auto-ability lists, and the character's Overdrive name (Tidus **Swordplay**, Yuna **Grand Summon**, Auron **Bushido**, Wakka **Slots**, Lulu **Fury**, Kimahri **Ronso Rage**, Rikku **Mix** — all verified from the wiki infoboxes `[single source]`).

**Right detail panel — SPHERE GRID tab.**

| Property | Value |
|---|---|
| Rendering | a pan/zoom node graph on a starfield background (`#08101E` with 1 px `#2E3A56` stars) |
| Node | 10 px circle. Locked/unactivated: ring `#4E5A70`, fill `#141A28`. Activated: fill in the node's stat colour with a 2 px `#FFFFFF` inner dot |
| Node stat colours | HP `#7EE8B0`, MP `#8FD0F0`, Strength `#F28A6A`, Defense `#C8D4E4`, Magic `#B48FE0`, Magic Def `#8FA4BC`, Agility `#F2D24A`, Luck `#FFF0A8`, Ability `#F2C21E`, Lock `#C7343C` |
| Link | 2 px line; travelled links `#F2C21E`, untravelled `#3A4456` |
| Character token | the 24x24 portrait icon sitting on the current node with a `#F2C21E` ring |
| Reachable node | pulses its ring between `#F2C21E` and `#FFF0A8` at 1 Hz |
| Movement | `S.Lv` decrements by 1 per link traversed; the counter in the panel header flashes and rolls |
| Header | `S.Lv NN` in 14 px `#FFF0A8` at the panel's top-right, plus the AP-to-next-level bar |
| Sphere inventory | a 10-item horizontal strip along the panel's bottom (Power/Mana/Speed/Ability/Fortune Sphere etc.), each 20x20 with a quantity tag; selecting one and confirming on the current node activates it |

**Bottom active-party strip.** Three 78 px slots showing the chosen fighters as half-body portraits with name, HP/MP, Overdrive gauge, and Overdrive **mode**. Empty slots show a dashed `#4E5A70` outline. Drag/confirm to assign from the left list. A `START BATTLE` button sits at `x520 y318 w104 h26` in FFX chrome with `#FFF0A8` text; it is disabled until three slots are filled.

**For X-2 chapters**, the same screen swaps to X-2 chrome and replaces the SPHERE GRID tab with a **GARMENT GRID** tab: the grid as a small polygonal node graph (section 4.4) with the character's dressphere loadout and the abilities each dressphere grants, plus an AP-per-dressphere progress bar.

---

## 6. HD-2D technique notes for Three.js

Everything in section 6 is `[estimate]` — it is engineering guidance, not a claim about the original games.

### 6.1 Target resolution and sprite budget

| Asset class | Logical sprite size | Notes |
|---|---|---|
| Party / humanoid NPC | **48 x 64** (Auron/Wakka 56 x 72, Kimahri 64 x 80) | see section 0.4 |
| Small enemy | 48 x 48 | |
| Boss (single-frame) | **96 - 192** tall | see section 0.4 table |
| Colossal boss part (Vegnagun) | 240 - 288 tall, up to 384 wide | streamed as a separate texture, never atlased |
| Prop billboard (rock, banner, cairn) | 32 - 128 | |
| Particle | 1 - 4 px | one 64x64 atlas for all mote shapes |
| UI atlas | 640 x 360 authoring canvas, atlas pages 1024 x 1024 at **2x** | |

**Internal render resolution — corrected; see §3.0.** There is **one** framebuffer: **1280 x 720**. The 3D scene renders into it, the UI atlas is blitted into it at **2x** the 640 x 360 authoring grid, and the whole composite is presented to the display with a **nearest** blit and letterboxing (`object-fit: contain`). At 1080p that presentation scale is 1.5x, giving **3 device px per UI-authoring px** — the figure §0.3 has always quoted.

The older instruction to "draw the UI at native 1080p on top from its own 3x bitmap atlas" is **superseded**: a second, higher-resolution UI pass would make Playwright screenshots (`assets-and-tech.md` §5.3) resolution-dependent and would sit outside the single `EffectComposer` chain in §6.4. Do not render the UI at a different resolution from the scene.

> Note that §3.0's alternative placement — CTB timeline, HP bars and menus as a **DOM overlay** rather than a WebGL layer (`assets-and-tech.md` §2.13 step 8) — remains a legitimate implementation of the same contract, **provided** the DOM layer is sized to the same letterboxed 1280 x 720 box and scaled by the same factor. If you take the DOM route, the UI atlas is unnecessary and the fonts in §3.9 are used live; if you take the WebGL route, use the 2x atlas. Pick one per surface and record it; do not mix within one screen.

### 6.2 Pixel-perfect sprite handling

```js
tex.magFilter = THREE.NearestFilter;
tex.minFilter = THREE.NearestFilter;   // no mips: mips blur pixel art
tex.generateMipmaps = false;
tex.anisotropy = 1;
tex.colorSpace = THREE.SRGBColorSpace;
```

| Rule | Detail |
|---|---|
| **World scale** | 1 logical sprite px = **1/32 world unit**, so a 64 px party sprite is exactly 2.0 m tall. Keep this constant everywhere |
| **Position snapping** | before render, snap each sprite's *screen-space* position to the pixel grid: project to NDC, round to the nearest `1/renderHeight * 3`, unproject. Snapping in world space is wrong — it produces jitter when the camera moves |
| **Camera snapping** | snap the camera's target position to a 1/32 unit grid too, or slow pans will shimmer |
| **No rotation** | never rotate a sprite quad on Z. To tilt a character, author a tilted frame |
| **No non-integer scale** | sprite scale must be an integer multiple of base. If a boss needs to look bigger, draw it bigger |
| **Alpha** | use `alphaTest: 0.5` with `transparent: false` for anything that writes depth (characters, props). Reserve true alpha blending for particles, VFX, and glass |
| **Sorting** | depth-write sprites sort by depth naturally. Blended VFX go on `renderOrder = 10+` and are sorted back-to-front by the renderer |

### 6.3 Camera

**Superseded by §2.0.** The full preset table, with integer texel ratios, lives in **§2.0**; this section keeps only the invariants.

```ts
const cam = new THREE.PerspectiveCamera(35, 16/9, 0.1, 200);   // FOV 35, FIXED
cam.position.set(0, 6.27, 10.90);
cam.lookAt(0, 1.5, 0);                                          // `battle` preset, S = 3
```

| Property | Value |
|---|---|
| Type | **Perspective** (not orthographic) — HD-2D's depth cue comes from real perspective on the diorama |
| FOV | **35 deg, fixed for every preset and every cut.** Never animate it — it changes the texel→pixel ratio and makes sprites shimmer (`assets-and-tech.md` §2.4/§2.5). Dolly instead |
| Pitch | per preset, **−6.1° to −23.9°**, plus one **+10.2°** look-up reveal. The old flat "−14 deg base" is superseded by §2.0's table |
| Roll | 0, always |
| Near / far | 0.1 / 200 |
| Idle drift | positional only: `x += sin(t·0.17)·0.12`, `y += sin(t·0.23 + 1.1)·0.06`, driven from the injected clock so screenshots stay deterministic |
| Snapping | snap the camera's target position to a 1/32 unit grid (§6.2), or slow moves will shimmer |

**Tilt-shift.** Do **not** rotate the camera to get tilt-shift, and — corrected — do **not** get it from depth of field either. §6.4 now produces it with a **screen-space band blur**, which is both cheaper and free of the alpha-test artefacts that depth-based DOF produces around cut-out sprites.

### 6.4 Post-processing chain

> **RESOLVED CONFLICT (was a blocker).** An earlier revision of this section prescribed the **pmndrs `postprocessing`** package with `DepthOfFieldEffect` (`focalLength` 0.06, `bokehScale` 2.4, `focusRange` 0.012), a **32³ 3D LUT** per scene, **ACES filmic** tone mapping at exposure 1.05, and bloom by `luminanceThreshold` 0.78 / `intensity` 0.55–1.15. `assets-and-tech.md` §2.1 formally decides **against** that package, and §2.9 builds the chain from `three/addons` instead: `UnrealBloomPass(strength, radius, threshold)`, a **custom separable tilt-shift** in place of DOF, a **combined grade+vignette shader** in place of a LUT, and `NoToneMapping`.
>
> **The tech document wins**, for its own stated reasons — `postprocessing@6.39.5`'s peer range is `three: ">= 0.168.0 < 0.187.0"` and the project pins `three@0.186.0`, so the package breaks on the very next three release; two of our four passes are custom shaders anyway; and `alphaTest` sprites write depth at the quad plane, so true depth-based DOF blurs *around* cut-out silhouettes incorrectly. The art direction is **not** lost: every per-scene value below has been **converted** into the parameters the `three/addons` chain actually consumes. Bloom parameters are **not** interchangeable between the two libraries, so the conversion is explicit and its assumptions are stated.

**The chain (authoritative; mirrors `assets-and-tech.md` §2.9).** Four passes plus the output pass, in this order:

```
RenderPass
  -> UnrealBloomPass            (selective, via the layer + darken-material technique)
  -> ShaderPass TiltShiftShader (horizontal)
  -> ShaderPass TiltShiftShader (vertical)
  -> ShaderPass GradeVignetteShader   (lift/gain/gamma/saturation + shadow tint + vignette
                                       + flash + grain + optional chromatic aberration)
  -> OutputPass                 (MUST be last: linear -> sRGB)
```

Render targets are `HalfFloatType` with `NearestFilter` on both min and mag, `samples: 0`. `renderer.toneMapping = THREE.NoToneMapping` — we grade by hand; **ACES desaturates flat sprite colours badly** and fights the deliberately saturated HD-2D palette.

#### 6.4.1 Bloom — parameter conversion

The two libraries do not mean the same thing by their arguments:

| pmndrs `BloomEffect` | `UnrealBloomPass` | Why they are not interchangeable |
|---|---|---|
| `luminanceThreshold` (hard cut on relative luminance, softened by `luminanceSmoothing`) | `threshold` (cut with a **fixed soft knee of `0.5 × threshold`**) | UnrealBloom starts blooming at roughly **0.75 × threshold**, so a pmndrs threshold maps to a **higher** UnrealBloom number for the same visual cut-in. Conversion used: `threshold_UB ≈ luminanceThreshold_pm × 0.80` |
| `intensity` (multiplier on the already-normalised blur sum) | `strength` (multiplier on a **5-mip accumulation** with its own internal weights) | UnrealBloom's mip chain sums to more energy. Conversion used: `strength_UB ≈ intensity_pm × 0.85` |
| `radius` in 0–1 over a mipmap blur | `radius` in 0–1 over the same 5-mip chain | closest to equivalent; carried across unchanged |
| `luminanceSmoothing` | **no equivalent** | folded into the threshold conversion |
| `mipmapBlur: true` | always on | n/a |

Both conversion constants are `[estimate]` — they are eyeball-matching factors, not published equivalences. **Tune against a reference frame, then freeze.**

**Per-scene bloom** (`new UnrealBloomPass(new THREE.Vector2(1280, 720), strength, radius, threshold)`) `[estimate]`:

| Scene | `strength` | `radius` | `threshold` | Converted from (old pmndrs value) |
|---|---:|---:|---:|---|
| Default / generic battle | **0.62** | 0.55 | **0.72** | `assets-and-tech.md` §2.9 default, kept verbatim |
| **Mt. Gagazet** (Seymour Flux) | **0.48** | 0.62 | **0.66** | intensity 0.55, threshold 0.78, radius 0.72 |
| **Zanarkand Dome** (Yunalesca) | **0.72** | 0.58 | **0.62** | intensity 0.75 (base), threshold 0.78 |
| **Dream's End** (BFA, Yu Yevon) | **1.15** | 0.75 | **0.50** | intensity 1.15, threshold 0.78, plus the tech doc's "Sin / Final battle, near-blowout" preset |
| **Bevelle Underground** (X-2 Bahamut) | **0.86** | 0.66 | **0.58** | intensity 0.75 + the tech doc's "hard neon edges" note |
| **Farplane** (Vegnagun, Shuyin) | **1.15** | 0.80 | **0.46** | intensity 1.15, threshold 0.78 |
| Pyrefly-heavy dissolve (transient) | current **+0.30**, ramped over 0.8 s | — | current **−0.10** | animate, then restore |

**Selective bloom is mandatory and is not a constructor argument.** `UnrealBloomPass` has no `selective` flag. Use three's documented two-render technique (`webgl_postprocessing_unreal_bloom_selective`):

1. Put pyreflies, glyphs, VFX, damage numerals and self-lit boss features on **`layers = 1`** (the *emissive layer*).
2. Render pass A with the camera's layer mask set to layer 1 only, every other material swapped to a cached black `MeshBasicMaterial`; run the bloom composer on that target.
3. Render pass B normally, then additively combine A's bloom result over B in the grade pass (`uBloomTex`).

Full-scene bloom **destroys pixel art** — it bleeds sprite edges into a smear. If the frame budget cannot afford the second render, **turn bloom off entirely** rather than blooming everything. `[estimate]`

#### 6.4.2 Tilt-shift — replaces depth of field

`assets-and-tech.md` §2.9's separable 9-tap band blur, two `ShaderPass` instances (H then V). Uniform defaults there: `uFocus = 0.56`, `uBand = 0.16`, `uFeather = 0.30`, `uMaxRadius = 3.5`.

The old DOF values do not convert directly — `focusRange 0.012` was a *depth* band, `uBand` is a *screen-Y* band — so the per-scene table below is re-derived from the same art intent ("a narrow sharp band centred on the party plane") `[estimate]`:

| Scene | `uFocus` | `uBand` | `uFeather` | `uMaxRadius` | Intent |
|---|---:|---:|---:|---:|---|
| Default / generic battle | 0.56 | 0.16 | 0.30 | 3.5 | tech-doc default |
| **Mt. Gagazet** | 0.58 | 0.18 | 0.32 | 3.2 | wide ledge; keep the memorial stones semi-legible |
| **Zanarkand Dome** | 0.56 | 0.14 | 0.34 | **4.2** | deep hall, strongest miniature effect, pillars dissolve into dark |
| **Dream's End** | 0.56 | 0.16 | 0.28 | 3.6 | tight, oppressive |
| **Bevelle Underground** | 0.54 | 0.15 | 0.30 | 3.8 | gantries above and below the band |
| **Farplane** | 0.58 | 0.20 | 0.36 | **4.6** | dreamiest; the widest sharp band with the softest falloff |
| `cutscene_low` camera (any scene) | **0.50** | 0.16 | 0.30 | **1.8** | tech-doc override; faces must stay sharp |
| `boss_reveal` camera | 0.44 | 0.22 | 0.26 | 3.0 | the boss's head sits high in frame |

**Acting-character exemption.** The old spec kept the acting character fully in focus during their action. With a screen-space band that cannot be done per-object, so do it with the camera: on every action beat, **lerp `uFocus` to the actor's screen-space Y over 0.15 s** and back afterwards. Same result, one uniform. `[estimate]`

#### 6.4.3 Grade + vignette — replaces the per-scene 3D LUT

`assets-and-tech.md` §2.9's `GradeVignetteShader` takes `uLift`, `uGain`, `uGamma`, `uSaturation`, `uVignette`, `uVigSoft`, `uShadowTint`, `uShadowTintAmt`, `uFlash`, `uFlashColor`. A **32³ LUT is not buildable by this project's toolchain** (there is no image pipeline, and §0.2 forbids shipping authored image assets that could be mistaken for ripped ones), so each scene's LUT direction is expressed as lift/gain/gamma/saturation instead.

**Two uniforms must be added to the tech doc's shader** to absorb the two effects the old chain had as separate passes, keeping the pass count at four `[decision]`:

| New uniform | Default | Purpose |
|---|---|---|
| `uGrain` | **0.03** | animated noise opacity; `hash(vUv + uTime)` applied before the vignette. Stops gradient banding on the half-float target |
| `uAberration` | **0.0** | per-channel UV offset in screen units; set to **0.0006** *only* during the Yu Yevon and Vegnagun phases. Sample R at `vUv + d`, B at `vUv − d`, where `d = (vUv − 0.5) * uAberration` |

**Per-scene grade presets** (`src/render/grades.ts`) `[estimate]` — every row is a translation of the corresponding LUT direction sentence, which is kept in the last column so the intent survives the conversion:

| Scene | `uLift` | `uGain` | `uGamma` | `uSaturation` | `uVignette` | `uVigSoft` | `uShadowTint` | `uShadowTintAmt` | Original LUT direction |
|---|---|---|---:|---:|---:|---:|---|---:|---|
| **Mt. Gagazet** | `(0.010, 0.014, 0.020)` | `(0.98, 1.00, 1.04)` | 1.02 | 0.94 | 0.34 | 0.58 | `(0.40, 0.50, 0.85)` | 0.14 | lift shadows toward `#2A3A56`; crush highlights slightly; desaturate mid greens; **cool, high-key, low contrast** |
| **Zanarkand Dome** | `(0.000, 0.000, 0.000)` | `(1.02, 0.97, 1.08)` | 0.94 | 1.12 | 0.58 | 0.50 | `(0.45, 0.32, 0.90)` | 0.16 | deep blacks, no lift; mids toward violet; **high contrast** |
| **Dream's End** | `(0.015, 0.004, 0.006)` | `(1.14, 0.88, 0.96)` | 0.97 | 1.06 | 0.52 | 0.52 | `(0.70, 0.28, 0.34)` | 0.18 | strong red gain in mids/highs; green cut 12%; shadows toward `#2A0A12`; **hot, oppressive** |
| **Bevelle Underground** | `(0.004, 0.010, 0.017)` | `(0.96, 1.03, 1.07)` | 0.99 | 1.10 | 0.46 | 0.54 | `(0.30, 0.48, 0.80)` | 0.15 | split-tone: shadows toward `#0A1A2A`, highlights toward `#6ED2EE`; **cold-dominant teal-and-orange** |
| **Farplane** | `(0.030, 0.018, 0.034)` | `(1.06, 0.96, 1.05)` | 1.06 | 1.04 | 0.24 | 0.62 | `(0.75, 0.50, 0.85)` | 0.10 | raise the black point noticeably; push toward magenta; reduce contrast; **dreamy, washed, luminous** |

Two directions cannot be expressed by lift/gain/gamma and are therefore **moved into the art**, not the shader `[decision]`:

- **"A single protected warm range for the gold glyphs" (Zanarkand Dome).** A global grade has no hue-range protection. Instead, put the gold glyphs on the **emissive layer** (§6.7) so they are bloomed rather than graded — the bloom adds back exactly the warmth the violet mid-push would have taken, and it is one flag rather than a 3D LUT.
- **"Desaturate mid greens" (Gagazet).** Handled in the palette: §2.1's rock and snow ramps contain no saturated greens to begin with. `uSaturation 0.94` covers the rest.

`uFlash` / `uFlashColor` stay exposed to the battle sim: `#FFFFFF` on crits, `#C7343C` on party KO, a slow `#F2C21E` ramp on Overdrive, `#E8412E` at 25% for 2 frames on a §3.13 stage-2 telegraph, and `#FFD9EC` at 15% on X-2 chain increments past 20. Animate from the injected clock (`assets-and-tech.md` §5.4) so screenshots stay deterministic.

#### 6.4.4 Degradation order

On a frame-budget miss, disable in this order (from `assets-and-tech.md` §6.9's guard-rails, made specific to this chain): **(1)** drop the tilt-shift's vertical pass, halving its cost and leaving a horizontal-only band; **(2)** drop tilt-shift entirely; **(3)** drop bloom's resolution to `Vector2(640, 360)` and let the upscale blur for free; **(4)** drop the selective-bloom second render and disable bloom; **(5)** halve particle counts. The grade+vignette pass is **never** dropped — without it the image is unmatched between scenes.

### 6.5 Scene layering

Every diorama is built in five depth bands. Keep to them rigidly; it is what makes parallax read.

| Band | World z | Contents | Treatment |
|---|---|---|---|
| **Sky** | -80 | a single large quad or skybox | never receives light; fogged to 0 influence |
| **Far parallax** | -60 to -30 | distant peaks, islands, stadium tiers | fog-lerped 60-85% toward the fog colour; may be a static painted plate |
| **Mid set** | -25 to -6 | architecture, pillars, gantries, the big set pieces | real geometry + billboards, receives light and casts shadows |
| **Playfield** | -5 to +5 | the ground plane, characters, enemies | full lighting, full shadows, DoF in focus |
| **Foreground** | +6 to +14 | occluding rocks, cables, petals, snow | heavily DoF-blurred, often silhouetted to near-black |

**Ground plane.** A single subdivided plane (32x32 segments) with a **pixel-art texture at 16 px per world unit**, nearest-filtered, plus a vertex-coloured darkening toward the edges so the diorama fades into the void instead of ending abruptly. **`receiveShadow` is `false`** — corrected; see §6.7. There are no shadow maps in this project, so `receiveShadow` would cost a depth pass and change nothing. Contact shadows are the blob quads described immediately below.

**Contact shadows.** There are no shadow maps at all in this project. Under each sprite, draw a separate **blob-shadow quad**. The authoritative spec is **§6.7.3** — a procedurally generated 64x64 radial-gradient `CanvasTexture`, `depthWrite: false`, `polygonOffset` on, `y = 0.012`, `renderOrder = 1`, radius `spriteWidthTexels / 64 x 0.55` world units, and tinted to the scene's ground colour rather than pure black. Cheap, always readable, and correct for billboards. (The earlier `y = 0.002` / flat `0.75x width` figures here are superseded by §6.7.3.)

**Parallax.** Because the camera is perspective, parallax is free for real geometry. For painted far plates, add a manual `plate.position.x = -camera.position.x * 0.08` to exaggerate it.

### 6.6 Particle systems

One `Points` system per effect with a shared 64x64 mote atlas (soft circle, hard circle, 4-point star, petal, snowflake, ember, scale-flake). All use `AdditiveBlending` except snow and petals (`NormalBlending`).

| System | Count | Size (px) | Colour | Velocity | Life | Notes |
|---|---|---|---|---|---|---|
| **Pyreflies (Spira)** | 40-60 | 2-4 core + 8-12 halo | core `#E9FFF4`, halo `#8BE8B0` | slow bezier wander, 0.15-0.4 m/s | 4-8 s | each has a **4-sample trail**; brightness pulses 0.6-1.0 at 0.7 Hz; **bloom layer** |
| **Pyreflies (Farplane)** | 60 | as above | core `#E9FFF4`, halo `#F7B6D9` | same but net **upward** | 6-10 s | 8-sample trail |
| **Snow (Gagazet)** | 300 | 1-2 | `#E8F0FA` 70% | down 0.4-0.9 m/s, wind +1.2 m/s x | until offscreen | two depth bands for parallax; no bloom |
| **Embers (Dream's End)** | 120 | 2-3 | `#FF7A2E` to `#FFE08A` over life | **up** 0.5-1.1 m/s, lateral 0.2 | 1.5 s | bloom layer; flicker alpha 0.4-1.0 at 6 Hz |
| **Farplane petals** | 200 | 2 | cycle `#F7B6D9`/`#FFD9EC`/`#B8A0F0` | **up** 0.3-0.7 m/s + 0.4 Hz lateral sine | 8-14 s | rotate the quad's UV, not the quad |
| **Steam (Bevelle)** | 4 emitters x 40 | 6-14, growing | `#C8D8E4` 30% | up 1.2 m/s, expanding cone 25 deg | 1.8 s | no bloom |
| **Dust motes (Dome)** | 80 | 1 | `#E8EEFA` 35% | 0.06 m/s random | 20 s | brightness scaled by proximity to the light-shaft volume |
| **Moth scale-flakes (Vegnagun)** | 25 | 3 | `#8E96A8` | slow tumble, 0.2 m/s down | 6 s | |
| **Hit sparks** | burst of 12 | 2-3 | element colour | radial 3-6 m/s, gravity 9 | 0.3 s | spawn at the damage numeral's anchor |
| **Sending motes (victory)** | 30 | 2-4 | `--pyre-green` | up 0.8 m/s accelerating | 0.8 s | spawned from a dying enemy sprite's silhouette pixels |

**Spawning motes from a sprite's silhouette** is worth the effort for deaths and sendings: read the sprite's alpha channel once at load, store the list of opaque pixel coordinates, and sample it randomly for spawn positions. It makes dissolves look authored rather than generic.

### 6.7 Light rigs

> **RESOLVED CONFLICT (was a blocker).** An earlier revision of this section mandated a **four-light rig per scene**, **exactly one shadow-casting `DirectionalLight`** with a 2048 shadow map and bias values, **per-sprite CPU lighting tint plus optional normal-mapped boss sprites**, and a **`receiveShadow = true`** ground plane. `assets-and-tech.md` §2.6 and §2.13 mandate **`MeshBasicMaterial` for all sprites**, state that "**no lights are needed at all**" for them, and replace shadows entirely with **procedural blob quads** (§2.8 there). Those are different material pipelines and different sprite-authoring requirements, and **every §2 location sheet in this document publishes light colours, intensities and directions that the tech doc's renderer has nowhere to consume.**
>
> **Resolution — the rig is kept, its consumers change.** `MeshBasicMaterial` wins for sprites (the alpha rule in `assets-and-tech.md` §2.6 is load-bearing: binary alpha + `alphaTest 0.5` + `transparent:false` puts sprites in the opaque queue and removes all manual sort bookkeeping). Shadow **maps** are dropped entirely; blob quads win. **Normal-mapped boss sprites are dropped** — the sprite pipeline in `assets-and-tech.md` §3 is a text-to-PNG rasteriser that cannot author a normal map, so the option was never buildable. But the four-light rig is **not** deleted, because the §2 location data is real art direction. It is re-pointed at two consumers that both exist in the tech doc's renderer.

#### 6.7.1 What the four-light rig actually drives

Every scene still declares the same **four-slot template**; §2.1–§2.5's per-scene colour/intensity/direction tables are unchanged and are now read by a `SceneLightProfile` object.

| Slot | Three.js object | Lights real geometry? | Feeds the sprite tint? | Casts a shadow map? |
|---|---|---|---|---|
| **Key** | `DirectionalLight` | **yes** — the extruded diorama boxes and any `MeshLambertMaterial` prop | **yes** (colour × NdotL) | **no** — `castShadow = false`, no `shadow.mapSize`, no bias values |
| **Ambient / fill** | `HemisphereLight` | **yes** | **yes** (the whole ambient term) | n/a |
| **Rim** | `DirectionalLight` | yes, marginally | **yes** — drives the additive rim term; **never omit it**, it is what separates sprites from the background | no |
| **Practical(s)** | `PointLight` × N | **yes** | **yes** — distance-attenuated, added to the tint | no |

`assets-and-tech.md` §2.13 is right that sprites need no lights; it is wrong that the *scene* needs none, because step 3 of its own assembly checklist adds "a few extruded boxes for depth parallax" and its own closing note concedes `MeshLambertMaterial` geometry wants an `AmbientLight` + `DirectionalLight`. The rig above **is** that lighting, promoted to four slots so the §2 sheets have somewhere to land.

**Delete from any implementation:** `renderer.shadowMap.enabled`, `castShadow`, `receiveShadow`, `shadow.mapSize`, `shadow.bias`, `shadow.normalBias`. They are not used anywhere in this project.

#### 6.7.2 Lighting sprites — the `MeshBasicMaterial` tint path (the only path)

`MeshBasicMaterial` has a `.color` property that multiplies the map. That is the whole mechanism; no material change, no custom shader, no second pass.

```ts
// src/render/spriteLighting.ts — runs once per sprite per frame on the CPU.
// scratch vectors hoisted to module scope; this must allocate nothing.
export function tintSprite(mesh: THREE.Mesh, p: SceneLightProfile, cam: THREE.Camera) {
  // Billboards are yaw-locked (§6.2), so the facing normal is the camera's
  // horizontal look vector negated — cheap and exact for our case.
  const n = camForwardFlat(cam).negate();

  const ndotl = Math.max(0, n.dot(p.keyDir));
  // hemisphere: sky above, ground below, mixed by the normal's y (always ~0 for a
  // vertical billboard, so this reduces to the midpoint - which is what we want).
  const amb = p.skyColor.clone().lerp(p.groundColor, 0.5).multiplyScalar(p.fillIntensity);

  const c = p.keyColor.clone().multiplyScalar(p.keyIntensity * ndotl).add(amb);

  for (const prac of p.practicals) {                       // usually 0-2
    const d = prac.position.distanceTo(mesh.position);
    if (d < prac.radius) {
      const f = 1 - d / prac.radius;
      c.add(prac.color.clone().multiplyScalar(prac.intensity * f * f));
    }
  }

  (mesh.material as THREE.MeshBasicMaterial).color.copy(clampColor(c, 0.35, 1.45));
}
```

| Rule | Value | Why |
|---|---|---|
| Clamp | tint clamped to **[0.35, 1.45]** per channel | below 0.35 a sprite's palette stops reading; above 1.45 the half-float target pushes it into the bloom threshold and it smears |
| Update rate | **every frame** for the ≤ 8 actors; **on scene load only** for static prop billboards | prop tint never changes; recomputing it is waste |
| Quantisation | round each channel to **1/16** before assigning | prevents a slow, visible tint crawl during camera drift, and keeps Playwright screenshots byte-stable |
| Material sharing | **must not** share a material between two sprites — `.color` is per-material. Clone the material per instance, as §6.8 already requires for the texture | a shared material means one character's lighting applies to all |
| `toneMapped` | **`false`** on every sprite material | sprite colours are already final; three must not re-map them (`assets-and-tech.md` §2.6) |

**Rim light — the one thing the tint cannot do.** A single multiplied colour cannot light only the silhouette edge. Implement it as a **second, additive quad** rather than a normal map:

| Property | Value |
|---|---|
| Geometry | the same `PlaneGeometry` as the sprite, offset **−0.004 world units** along the camera's forward axis (behind the sprite, so it never z-fights) |
| Texture | the sprite atlas's **edge mask**, generated **at load time** by the CPU: for every opaque texel with at least one transparent 4-neighbour, write 255; else 0. One mask per atlas, stored in a single-channel canvas texture. **No hand authoring, no extra art** |
| Material | `MeshBasicMaterial({ map: edgeMask, color: rimColor, blending: AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false })` |
| Opacity | the scene's rim intensity × **0.60** (the §0.3 house rule: "scene rim colour at 60% alpha, 1 px on the key-light-opposite edge") |
| Directionality | the mask is omnidirectional; bias it by offsetting the quad **1 texel toward the key-opposite side** in screen space. One `material.map.offset.x` nudge; cheaper and more legible at 48 px than any per-pixel solution |
| `renderOrder` | 2 — after shadow blobs (1), before FX (10+) |
| Cost | +1 draw call per lit actor, ≤ 8 extra draw calls in the worst frame |

This replaces option 1's "precompute an edge mask into the green channel of a second map" (never specified how) **and** option 2 (normal maps) in one mechanism that the existing pipeline can actually produce.

#### 6.7.3 Contact shadows

No shadow maps. Per actor, one **blob quad** exactly as `assets-and-tech.md` §2.8 builds it — a 64 × 64 procedurally generated radial-gradient `CanvasTexture`, `rgba(0,0,0,0.55)` at centre → `0.34` at 55% → `0` at the rim, `NoColorSpace`, on a `PlaneGeometry` rotated flat, `transparent: true`, `depthWrite: false`, `polygonOffset` on, `y = 0.012`, `renderOrder = 1`, scaled and faded by jump height `scale = clamp(1 − y·0.35, 0.45, 1)`.

Two project-specific additions `[estimate]`:

| Addition | Value |
|---|---|
| **Scene-tinted blobs** | set the blob material's `.color` to the scene's **ground/hemisphere colour × 0.35** instead of pure black, so a shadow on Gagazet's snow is blue-violet and one in Dream's End is oxblood. One line, and it is the single biggest cheap win for scene cohesion |
| **Per-actor radius** | `radius = spriteWidthTexels / 64 × 0.55` world units, so Kimahri's blob is wider than Rikku's and Mortiorchis's is wider still. The §2.8 default 0.55 is correct for a 48 px party sprite |
| **Hovering actors** | Mindy (§1.22.6) and Yu Yevon have no ground contact: blob at **0.55× scale and 0.5× opacity**, offset below them; Yu Yevon gets **none at all** |
| **Memory / projection sprites** | Braska (§1.22.1) and Zaon (§1.22.3) get **no blob** — they are not physically present |

#### 6.7.4 Emissive layer

Put pyreflies, glyphs, VFX, damage numerals, and any self-lit boss feature on **`layers = 1`**. §6.4.1's selective bloom renders only that layer, so pixel-art characters stay sharp while the magic glows. Emissive materials are `MeshBasicMaterial` with `toneMapped: false` and a colour **above 1.0** (the half-float target carries it), which is how they clear the bloom threshold without the rest of the sprite doing so.

The practical `PointLight`s in the rig and the emissive layer are **two separate things for the same object**: the light contributes to the sprite tint of everything *near* the boss, the emissive quad is what actually *glows*. Mortiorchis, for example, has both — a `#8BE8B0` practical at intensity 1.4 with a 6 m radius flickering ±12% (§2.1), and its core drawn on layer 1.

### 6.8 Animation

| Property | Value |
|---|---|
| Frame rate | author at **10 fps** for idles, **12-15 fps** for actions; never interpolate between frames |
| Idle | 4-8 frames, looping, 1-2 px of vertical motion |
| Action clips | 5-8 frames; hold the impact frame for 2 frame-times |
| Hit reaction | a 2-frame flinch plus a 3-frame `#FFFFFF` 60% flash multiply over the sprite |
| Death | 4-frame collapse then a silhouette-mote dissolve (6.6) |
| Atlas | one texture per character containing all frames on a fixed grid; select frames via `texture.offset` / `texture.repeat`, **clone the texture per instance** or offsets will collide |
| Timing source | drive everything from the battle simulation's event queue, not from `requestAnimationFrame` deltas, so animation and CTB order can never desynchronise |

### 6.9 Performance guard-rails

| Budget | Target |
|---|---|
| Draw calls | < 220 per frame |
| Triangles | < 180k |
| Points (all particle systems) | < 1,200 live |
| Shadow-casting lights | **exactly 0** — corrected; there are no shadow maps (§6.7.3). `renderer.shadowMap.enabled` stays `false` |
| Lights total | **4 per scene** (1 key, 1 hemisphere, 1 rim, 0–2 practicals) — they light diorama geometry and drive the sprite tint only |
| Sprite materials | **1 cloned `MeshBasicMaterial` per sprite instance** (required by both the tint in §6.7.2 and the UV animation in §6.8) |
| Extra draw calls for rim quads | ≤ 8 (one per lit actor) |
| Textures resident | < 96 MB |
| Full-screen passes | **4** (bloom, tilt-H, tilt-V, grade+vignette) plus `OutputPass`; +1 render for selective bloom |
| Frame time | 16.6 ms at 1080p on a 2019 integrated GPU; degrade in the order given in **§6.4.4** |

---

## 7. Conflicts, corrections, and open questions

| # | Issue | Resolution |
|---|---|---|
| 1 | Brief says **"Seymour Flux (with Mortibody)"** | **Wrong.** Seymour Flux sits on **Mortiorchis** at Mt. Gagazet; **Mortibody** accompanies **Seymour Natus** at the Bevelle Highbridge. Both share the `Mortibsorption` self-revive, which is likely the source of the confusion. `[verified: 2 sources]` — the two separate wiki boss pages |
| 2 | Brief says the FFX logo is **"Yuna in the water"** with a **"Luca sea wall"** vibe | Partly right. The logo is **Yuna performing a sending at Kilika Port**, not Luca. `[single source]` |
| 3 | Lulu's height | The infobox gives **two** values — 167 cm barefoot, 173 cm in heels — and separately notes **her in-game models have no legs**. Use 167 cm for the sprite and never draw her feet. `[single source]` |
| 4 | Rikku's X-2 Thief bottom | The *Rikku* page says "**yellow g-string bikini and an olive green mini-skirt**"; the *Thief* page says "yellow bikini bottoms under a **green** miniskirt". Same garment, different wording. Use **olive/mid green `#75913A`**. `[verified: 2 sources]`, no real conflict |
| 5 | Auron's eye colour | Infobox says **brown**; the Appearance text says his left eye is **amber**. Use amber `#D9A23A` — it is the more specific claim and matches "the visible eye". Flagged as a genuine internal contradiction in the source. |
| 6 | FFX UI typeface | **Unidentified and unpublished.** A dafont identification thread went unanswered; the wiki only notes "a new typeface" in the HD Remaster. Do not claim a match — use the OFL candidates in section 3.9. `[single source]` |
| 7 | HP-critical threshold colour | One source states FFX turns HP digits **yellow below 50% of max HP**. I could not corroborate it with a second source, so it is `[single source]`. Our `#F28A2E` near-death tier at 12.5% is **our addition**, not from the game. |
| 8 | Mortiorchis visual design | **No published description exists** beyond the name (幻光祈機, "pyre-praying machine") and one weak third-party characterisation. Section 1.8's design is explicitly original and marked `[estimate]`. |
| 9 | Yu Pagoda visual design | Same situation — mechanically documented (heal 1,500 HP via Power Wave), visually undocumented. Section 1.10's design is original. |
| 10 | Every hex value in this document | `[estimate]` unless the row says the *colour name* is verified. Square Enix has published no palette data for either game. |
| 11 | Vegnagun battle-open transition | Verified to differ from every other battle in X-2 (black-hole suck-in vs. screen shatter). Do not let this detail get lost — it is a cheap, distinctive win. `[single source]` |
| 12 | Shuyin victory | Verified: **"The party will not pose upon winning this battle."** Chapter 5's ending must suppress the victory pose and the fanfare. `[single source]` |

### 7.1 Cross-document arbitration (gap-fill pass, 2026-09-15)

Nine conflicts and omissions were raised against this document by an implementation-readiness review. All nine are resolved in place; this table is the index.

| # | Conflict or gap | Severity | Resolution | Where |
|---|---|---|---|---|
| A | **Renderer architecture.** §6.7 mandated a four-light rig, one shadow-casting `DirectionalLight` with a 2048 map and bias values, per-sprite CPU tint **plus optional normal-mapped boss sprites**, and `receiveShadow = true` ground. `assets-and-tech.md` §2.6/§2.13 mandate `MeshBasicMaterial` for all sprites, "no lights are needed at all", and blob quads instead of shadows | **blocker** | **Split the decision.** `MeshBasicMaterial` + `alphaTest 0.5` + `transparent:false` wins for sprites (the opaque-queue sort is load-bearing). **Shadow maps deleted**; blob quads win, now scene-tinted and per-actor sized. **Normal-mapped boss sprites deleted** — the §3 sprite pipeline cannot author a normal map, so the option was never buildable. **The four-light rig is kept** and re-pointed: it lights the extruded diorama geometry *and* feeds a per-sprite `MeshBasicMaterial.color` tint, which is where every §2 location sheet's light colour/intensity/direction now lands. Rim light becomes an **additive edge-mask quad** generated at load time from the sprite's own alpha | §6.7, §6.5, §6.9 |
| B | **Post-processing chain specified twice, incompatibly.** §6.4 prescribed pmndrs `postprocessing` with `DepthOfFieldEffect`, a 32³ LUT per scene, ACES at exposure 1.05, and bloom by `luminanceThreshold`/`intensity`. `assets-and-tech.md` §2.1/§2.9 decides against that package and builds `three/addons` with `UnrealBloomPass`, a custom tilt-shift, a combined grade+vignette shader, and `NoToneMapping` | **blocker** | **`three/addons` wins** (peer-range liability is real: `postprocessing@6.39.5` requires `three < 0.187.0` and we pin 0.186.0). **Every per-scene art value is converted rather than discarded** — an explicit bloom conversion table (`strength ≈ intensity × 0.85`, `threshold ≈ luminanceThreshold × 0.80`, both `[estimate]`), a re-derived per-scene tilt-shift uniform table replacing the DOF values, and a per-scene lift/gain/gamma/saturation table replacing each LUT, with the original LUT sentence preserved in the last column. Two uniforms (`uGrain`, `uAberration`) added to the tech doc's grade shader so pass count stays at four | §6.4 |
| C | **No Overdrive minigame UI existed** for Swordplay, Bushido, Slots, Fury, Mix or Grand Summon, nor for X-2's Trigger Happy and Lady Luck reels | **blocker** | Nine surfaces specified, all built on one shared overlay frame with a common timer ring that **shows the remaining-time damage bonus as a live `+NN%`**. Cursor speeds and zone widths for Swordplay are `[estimate]` (nothing is published) but are derived from the documented difficulty ordering | §3.11, §4.10 |
| D | **No design sheets for the FFX-2 supporting cast** — Leblanc, Logos, Ormi, Nooj, Gippal, Baralai, Brother, Buddy, Shinra | major | Nine sheets added. Six get body sprites; **Brother, Buddy and Shinra get comm portraits only** (40 × 40, X-2 chrome, two-frame mouth cycle) because they never leave the Celsius in either chapter. Every named colour is wiki-verified; hexes are `[estimate]` per §0.1 | §1.23 |
| E | **No design sheets for staged FFX cast** — Braska, the young/living Auron, Zaon, Kelk/Biran/Yenke Ronso, Wantz; and the Magus Sisters were absent from §0.4 | major | Six sheets added plus three §0.4 rows. The Ronso get an explicit **corpse-staging spec with world positions**, because they stage the entire Seymour Flux opening, and the post-fight pyrefly emitters are bound to their transforms. Memory-Auron is specified as a **separate atlas**, not a layer toggle | §1.22, §0.4 |
| F | **§4.5 Spherechange was a radial wheel**, which cannot express adjacency or gate traversal — the actual mechanic | major | Replaced with the documented **full-screen Garment Grid overlay with the live battle minimised to the upper-right**, one-link adjacency, gate orbs on links, travelled links drawn **blue** (verified), a **gate-buffs-earned panel**, and a detail strip whose gate-preview line names the effect and any completed combination. The wheel's claim that spherechange is free is also corrected: it **costs the whole turn** | §4.5, §4.0 |
| G | **Two mutually exclusive font stacks.** §3.9 recommended Jost / Archivo Black / Cinzel / EB Garamond; `assets-and-tech.md` §1.2 recommends Exo 2 / Chakra Petch / Rajdhani / Silkscreen and ships the install list | major | **Tech doc wins for every functional role** (Chakra Petch is the only candidate with a true 700 italic, which §3.6 needs; Rajdhani is the only tabular-condensed numeral face). **Cinzel and EB Garamond survive as additions** for the two roles the tech doc leaves empty (title lockup, chapter cards). A metric-impact table tells implementers where Exo 2's ≈6% wider advance matters | §3.9 |
| H | **Canvas and camera conflict.** §3.0 authored UI at 640 × 360 × 3; §6.1 rendered 3D at 1280 × 720; `assets-and-tech.md` §2.5 declared 1280 × 720 letterboxed; §2.0 used FOV 38 at `(+2.6,+3.1,+6.4)` while §2.4 there fixes FOV 35 at `(0,6.4,11.2)` | major | **Canvas: not actually a conflict** — 640 × 360 is the *authoring* grid, 1280 × 720 is the single composite buffer (the tech doc's own rationale says "integer 2× of 640×360"). UI atlas moves from 3× to **2×**, one framebuffer only. **Camera: FOV 35 fixed wins**, but the tech doc's preset positions are shown not to produce its own stated `S ≈ 2.0` (they give 2.92 / 4.73 / 2.04 / 5.39 / 6.45), so **all six presets are re-derived onto integer `S`** of 2/3/4/5/6 | §3.0, §2.0, §6.1, §6.3 |
| I | **Required UI surfaces had no spec at all**: Trigger Command, the enemy telegraph banner, the shop, item/equipment/customisation, Overdrive Mode selection, X-2 Scan/Libra | major | All specified. The Trigger Command gets both flavours (pre-battle stat-bonus picker; in-battle two-charge counter with the **deliberately inert third appearance kept visible and honest**). The telegraph banner is specified as a reusable two-stage widget with a **persistent CTB pip**, and its single-charge variant after the first Total Annihilation | §3.12–§3.16, §4.11 |

**Cross-document note.** §8's closing line "no prior-research files existed in `D:/Final Fantasy/research/` when this document was written; it is the first file in that directory" is now **stale**. Nine sibling documents exist, and the mechanics documents (`ffx-combat-core.md`, `ffx2-combat-core.md`, the four encounter files) **do** carry UI-behaviour facts — timer durations, reel rules, gate rules, ATB colour codes, HUD element positions, telegraph strings — that this document now cites. Read them before changing anything in §3, §4 or §6.

**Open questions for the art director (not answerable from sources):**

1. Do we draw **8-directional** sprites or **front/back only**? Recommendation: front-facing + a 3/4 turn + a back frame. Battles never need more.
2. Should Yunalesca's three forms be **three sprites** or one sprite with swapped layers? Recommendation: three sprites — the silhouettes are too different to share a rig.
3. Do X-2 chapters reuse the FFX window chrome for the pre-battle menu, or fully swap to pink? Recommendation: fully swap; the tonal shift is half the joke of X-2.
4. Is the damage-numeral font a bitmap atlas or a live-rendered webfont with a shader outline? Recommendation: bitmap atlas — outlines on live text at 3x are expensive and inconsistent.
5. How big is the emissive/bloom layer budget on low-end targets?

---

## 8. Sources

All URLs accessed 2026-09-15.

**Final Fantasy Wiki (finalfantasy.fandom.com)** — character, boss, location, job, and system pages; the Appearance/Profile sections are the source for every verified colour name, garment, and proportion in section 1:

- https://finalfantasy.fandom.com/wiki/Tidus
- https://finalfantasy.fandom.com/wiki/Brotherhood_(weapon)
- https://finalfantasy.fandom.com/wiki/Yuna
- https://finalfantasy.fandom.com/wiki/Auron
- https://finalfantasy.fandom.com/wiki/Wakka
- https://finalfantasy.fandom.com/wiki/Lulu
- https://finalfantasy.fandom.com/wiki/Kimahri_Ronso
- https://finalfantasy.fandom.com/wiki/Ronso
- https://finalfantasy.fandom.com/wiki/Rikku
- https://finalfantasy.fandom.com/wiki/Paine
- https://finalfantasy.fandom.com/wiki/Seymour_Guado
- https://finalfantasy.fandom.com/wiki/Seymour_Flux
- https://finalfantasy.fandom.com/wiki/Mortiorchis
- https://finalfantasy.fandom.com/wiki/Mortibody
- https://finalfantasy.fandom.com/wiki/Yunalesca
- https://finalfantasy.fandom.com/wiki/Yunalesca_(boss)
- https://finalfantasy.fandom.com/wiki/Jecht
- https://finalfantasy.fandom.com/wiki/Braska%27s_Final_Aeon
- https://finalfantasy.fandom.com/wiki/Yu_Yevon
- https://finalfantasy.fandom.com/wiki/Valefor_(Final_Fantasy_X)
- https://finalfantasy.fandom.com/wiki/Ifrit_(Final_Fantasy_X)
- https://finalfantasy.fandom.com/wiki/Ixion_(Final_Fantasy_X)
- https://finalfantasy.fandom.com/wiki/Shiva_(Final_Fantasy_X)
- https://finalfantasy.fandom.com/wiki/Bahamut_(Final_Fantasy_X)
- https://finalfantasy.fandom.com/wiki/Anima_(Final_Fantasy_X)
- https://finalfantasy.fandom.com/wiki/Yojimbo_(Final_Fantasy_X)
- https://finalfantasy.fandom.com/wiki/Bahamut_(Final_Fantasy_X-2)
- https://finalfantasy.fandom.com/wiki/Shuyin
- https://finalfantasy.fandom.com/wiki/Shuyin_(boss)
- https://finalfantasy.fandom.com/wiki/Lenne
- https://finalfantasy.fandom.com/wiki/Vegnagun
- https://finalfantasy.fandom.com/wiki/Vegnagun_(head)
- https://finalfantasy.fandom.com/wiki/Vegnagun_(body)
- https://finalfantasy.fandom.com/wiki/Vegnagun_(leg)
- https://finalfantasy.fandom.com/wiki/Vegnagun_(tail)
- https://finalfantasy.fandom.com/wiki/Dressphere
- https://finalfantasy.fandom.com/wiki/Gunner_(Final_Fantasy_X-2)
- https://finalfantasy.fandom.com/wiki/Warrior_(Final_Fantasy_X-2)
- https://finalfantasy.fandom.com/wiki/Thief_(Final_Fantasy_X-2)
- https://finalfantasy.fandom.com/wiki/White_Mage_(Final_Fantasy_X-2)
- https://finalfantasy.fandom.com/wiki/Black_Mage_(Final_Fantasy_X-2)
- https://finalfantasy.fandom.com/wiki/Dark_Knight_(Final_Fantasy_X-2)
- https://finalfantasy.fandom.com/wiki/Samurai_(Final_Fantasy_X-2)
- https://finalfantasy.fandom.com/wiki/Mt._Gagazet
- https://finalfantasy.fandom.com/wiki/Zanarkand_Dome
- https://finalfantasy.fandom.com/wiki/Dream%27s_End
- https://finalfantasy.fandom.com/wiki/Bevelle_Underground
- https://finalfantasy.fandom.com/wiki/Farplane_(Final_Fantasy_X)
- https://finalfantasy.fandom.com/wiki/Conditional_Turn-Based_Battle
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_battle_system
- https://finalfantasy.fandom.com/wiki/Battle_Results
- https://finalfantasy.fandom.com/wiki/Sphere_Grid
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_stats
- https://finalfantasy.fandom.com/wiki/Scan (Sensor)
- https://finalfantasy.fandom.com/wiki/Logos_of_Final_Fantasy
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_version_differences
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2
- https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_statuses
- https://finalfantasy.fandom.com/wiki/Critical_hit
- https://finalfantasy.fandom.com/wiki/Victory_Fanfare
- https://finalfantasy.fandom.com/wiki/Experience_points

**Guides and UI references:**

- https://jegged.com/Games/Final-Fantasy-X/Tips-and-Tricks/CTB-Window.html — CTB window position, "picture at the top of the list", enemy letter tags, Haste moving entries forward
- https://jegged.com/Games/Final-Fantasy-X/Tips-and-Tricks/Combat.html
- https://jegged.com/Games/Final-Fantasy-X/Walkthrough/28-Zanarkand-Ruins.html
- https://www.gamerguides.com/final-fantasy-x-hd/guide/introduction/gameplay/battle-system — Act List on the right, HP/MP/Overdrive bottom-right, L1/LB party swap
- https://www.gamerguides.com/final-fantasy-x-hd/guide/bestiary/bosses/yunalesca
- https://www.gamerguides.com/final-fantasy-x-hd/guide/bestiary/bosses/seymour-flux
- https://www.gamerguides.com/final-fantasy-x-hd/guide/bestiary/bosses/braskas-final-aeon — confirms Power Wave heals BFA/removes ailments/boosts Overdrive, but does not corroborate the "1,500 HP" figure; also states BFA form 1 = 60,000 HP, form 2 = 120,000 HP (not yet used elsewhere in this doc — candidate for a future combat-mechanics doc)
- https://game8.co/games/Final-Fantasy-X/archives/270768 — Command Window / Status Window / Help Window roles
- https://game8.co/games/Final-Fantasy-X/archives/270672
- https://strategywiki.org/wiki/Final_Fantasy_X-2/Gameplay — ATB gauge under HP/MP, Agility sets bar length, Spherechange halts time and grants immunity
- https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/78927
- https://www.neoseeker.com/final-fantasy-x-x2-hd/faqs/844700-x2-a.html
- https://www.giantbomb.com/conditional-turn-based-battle/3015-2432/
- https://samurai-gamers.com/final-fantasy-x-x2-hd-remaster/yunalesca-boss-guide/
- https://villains.fandom.com/wiki/Lady_Yunalesca — Yunalesca form 2 / form 3 descriptions
- https://finalfantasy.neoseeker.com/wiki/Mortiorchis
- https://en.wikipedia.org/wiki/Final_Fantasy_X
- https://en.wikipedia.org/wiki/Tidus
- https://en.wikipedia.org/wiki/Rikku
- https://en.wikipedia.org/wiki/Lulu_(Final_Fantasy)
- https://en.wikipedia.org/wiki/Seymour_Guado
- https://blakewalden.medium.com/on-final-fantasy-x-the-vibrant-fashions-of-spira-part-2-main-characters-a5d79c8d7d1d — costume analysis

**Typography:**

- https://www.dafont.com/forum/read/273501/final-fantasy-x-original-ps2-subtitles-and-menu-font — the FFX menu/subtitle font identification request, **unanswered**
- https://madegooddesigns.com/final-fantasy-font/ — the FF wordmark is custom engraved lettering, not a font; free stand-ins Cinzel / Cormorant / EB Garamond / Source Sans 3
- https://fonts.google.com/specimen/Open+Sans
- https://fonts.google.com/specimen/Lato
- https://fonts.google.com/specimen/Jost
- https://fonts.google.com/specimen/Fira+Sans+Condensed
- https://fonts.google.com/specimen/Source+Sans+3
- https://fonts.google.com/specimen/Cinzel
- https://fonts.google.com/specimen/EB+Garamond
- https://fonts.google.com/specimen/Archivo+Black
- https://en.wikipedia.org/wiki/Open_Sans
- https://en.wikipedia.org/wiki/Lato_(typeface)

**Modding / asset community (context only, no assets used):**

- https://www.nexusmods.com/finalfantasyxx2hdremaster/mods/348 — FFX PS2 UI overhaul mod, evidence that the HD Remaster UI differs from the PS2 UI
- https://steamcommunity.com/sharedfiles/filedetails/?id=2786311940 — Final Fantasy font modding index
- https://steamcommunity.com/app/359870/discussions/0/364042262881782135/ — FFX-2 HP and ATB gauge display discussion
- https://www.rpgsite.net/feature/11522-how-to-fix-that-awful-font-in-the-final-fantasy-pixel-remaster-games-on-pc

### Sources added by the gap-fill pass (2026-09-15)

**Final Fantasy Wiki — character Appearance/Profile sections** (all accessed 2026-09-15; the `WebFetch` path returns HTTP 402 for this host, so these were read through the browser tool):

- https://finalfantasy.fandom.com/wiki/Lord_Braska — Braska: age 35, blue eyes, red overlapping-petal robe, wide grey sash with connecting-circle pattern and the Yevon "A", dark-blue keffiyeh-like headdress with a blue stone band and two pale-blue tassels, white beaded bracelet, summoner's staff
- https://finalfantasy.fandom.com/wiki/Auron — "Auron was **25 when he died** and became an unsent… he **has aged** since"; the scar/shut right eye/sunglasses are present-day; HD Remaster remodel notes
- https://finalfantasy.fandom.com/wiki/Zaon — "golden knight's armour with **four horn-like ornaments** and a **white cape**"
- https://finalfantasy.fandom.com/wiki/Kelk_Ronso — tall elderly Ronso, white hair and beard, almost-black horn, the **only** Ronso in Yevonite attire, orange maester's robe with the Yevon symbol
- https://finalfantasy.fandom.com/wiki/Biran_Ronso — tall muscular **blond** Ronso whose fur is **more grey than blue**; tribal leather on torso, arms and legs plus a loincloth
- https://finalfantasy.fandom.com/wiki/Yenke_Ronso — tall muscular **light-skinned** Ronso with **brownish** hair; leather on **forearms and chest** only; **dark** horn
- https://finalfantasy.fandom.com/wiki/Wantz — green-and-yellow headband, blue striped shirt, yellow waist bandana, dark fingerless gloves, green baggy trousers, red sandals, light skin, **red hair**, a necklace; Cockney accent
- https://finalfantasy.fandom.com/wiki/Magus_Sisters_(Final_Fantasy_X) — insectoid armour; **Sandy** tall/slim/red/praying mantis, **Cindy** rotund/blue-and-red/ladybug, **Mindy** smallest/orange/bee and **hovers**; fayth are equal height with blonde hair
- https://finalfantasy.fandom.com/wiki/Leblanc — blonde hair, purple eyes, round face; pinkish-purple furisode-sleeved robe exposing chest (heart tattoo) and right thigh; high curved tasselled collar; white crisscross cuff separation; matching thigh-highs; purple ankle boots; blue-and-white triangle/swirl patterns; red-and-silver fan; Lady Luck resemblance
- https://finalfantasy.fandom.com/wiki/Logos_(Final_Fantasy_X-2) — age 26; tall slim; black-and-silver helmet with chin protector tied with a purple strip; blue robe and coat with the Syndicate logo on shoulders and kimono-like sleeves; purple waist sash; ankle wraps; two revolvers
- https://finalfantasy.fandom.com/wiki/Ormi — age 22; short stout; large shield on his back bearing the Syndicate heart; predominantly purple samurai-style attire
- https://finalfantasy.fandom.com/wiki/Nooj — height **188 cm**, age 21; long brown hair in two loops and a ponytail with a red band; blue eyes; blue glasses; red long johns with multiple red and black belts securing the prosthetics; purple fur-topped right-shoulder sleeve; purple boots; silver cane; **left** arm and leg are machina prosthetics
- https://finalfantasy.fandom.com/wiki/Gippal — age 18; Al Bhed, green eyes with spiral pupils, eye-patch over the **right** eye; short spiky blond hair; armour over a blue jumpsuit and purple overalls; indigo boots; machina mortar with a rounded saw blade
- https://finalfantasy.fandom.com/wiki/Baralai — height **176 cm**, age 20; dark-skinned, brown eyes, short silver quiff, blue headband; yellow-trimmed green coat with orange chest panels and glyphs, black-and-white lower panels with glyphs; collar to the chin
- https://finalfantasy.fandom.com/wiki/Brother — age 20 in X-2; green eyes with Al Bhed spiral pupils, **blond mohawk**, multiple earrings, grey pants with blue-and-red suspenders, black gloves with iron buttons and red-and-black cuffs, heavily tattooed chest and arms
- https://finalfantasy.fandom.com/wiki/Buddy — Al Bhed man, dark blond hair, purple shirt, blue pants, **always wearing goggles**
- https://finalfantasy.fandom.com/wiki/Shinra_(Final_Fantasy_X-2) — mask with an **ochre visor**, brown full-body suit with **lime green mittens**, blue collar; face never shown

**Overdrive minigame mechanics (UI behaviour, not geometry):**

- https://jegged.com/Games/Final-Fantasy-X/Overdrives/Swordplay.html — "a cursor scrolls along a horizontal bar with a time limit"; the target is "the highlighted **yellow** centre section of the bar"; "the yellow-highlighted section will be **smaller** for Tidus's more powerful Swordplay abilities"; Spiral Cut has the largest window, Blitz Ace the smallest. **Conflicts with `ffx-combat-core.md` §5.3's "white zone" — recorded in §3.11**
- https://jegged.com/Games/Final-Fantasy-X/Overdrives/Slots.html — "a set of **three** slot machine reels appears on the screen, accompanied by a **20-second timer**"; reels stopped individually with the confirm button; per-set symbols; a three-match is called a "**Jackpot!**"
- https://jegged.com/Games/Final-Fantasy-X/Overdrives/Bushido.html — button sequences and the "enter the sequence within a time limit, faster = more damage" rule; **no UI geometry published**
- https://jegged.com/Games/Final-Fantasy-X/Overdrives/Fury.html — "rotate the right analog stick clockwise as quickly as possible"; "an approximately **4-second** timer will begin"; **no counter UI published**
- https://jegged.com/Games/Final-Fantasy-X/Overdrives/Overdrive-Modes.html — the 17 modes, their triggers and per-character unlock counts, behind §3.11.8

**Sibling project documents (authoritative for mechanics that the UI must express):**

- `D:/Final Fantasy/research/ffx-combat-core.md` — §5.2 timed-input bonus formula and the 3 000 / 4 000 / 20 000 ms timers; §5.3 Swordplay rows; §5.4 Grand Summon temporary-vs-stored gauge; §5.5 Bushido sequences; §5.6 Slots matching rules and reel sets; §5.7 Fury rotation cap of 16; §5.9 Mix pair lookup; §5.1 Overdrive Modes
- `D:/Final Fantasy/research/ffx2-combat-core.md` — §3.1 Trigger Happy windows (1.8 / 2.2 / 2.6 s, one shot per R1, shared press when two girls mash); §3.12 Lady Luck reel rules and the 75%-current-HP Dud; §4.1 Garment Grid node/gate/combination rules and the blue travelled line; §4.2 the one-link adjacency rule and the full-turn cost; §6.1 HUD positions, ATB colour code and HP/MP colour code; §6.5 enemy stance telegraphs; §6.6 the spherechange flow and Special Dress Up
- `D:/Final Fantasy/research/ffx-seymour-flux.md` — §4.5/§4.6 the two-stage "Auto-Attack Mode" → "Ready To Annihilate" telegraph and the single-charge variant; §4.7 Trigger Command bonuses (Kimahri +10 STR, Yuna +10 MDef); §7.7 Wantz's stock
- `D:/Final Fantasy/research/ffx-bfa-yu-yevon.md` — §1.6 the "Talk" Trigger Command: resets the boss Overdrive, lands on the next turn, costs that turn, usable twice, inert third appearance
- `D:/Final Fantasy/research/assets-and-tech.md` — §1.2/§1.4 the font stack and self-hosting decision; §2.1 the `postprocessing`-vs-`three/addons` decision and the peer range; §2.3 `NoToneMapping`; §2.4 the fixed FOV; §2.5 the texel-ratio formula; §2.6 the alpha rule and `MeshBasicMaterial`; §2.8 the shadow blob; §2.9 the composer chain, `UnrealBloomPass` presets, `TiltShiftShader` and `GradeVignetteShader`; §2.13 the assembly checklist

**Three.js reference used for the selective-bloom technique:** `webgl_postprocessing_unreal_bloom_selective` in `mrdoob/three.js/tree/dev/examples` (layer mask + cached darken-material two-render approach). `UnrealBloomPass` signature and default `radius`/`threshold` semantics per https://threejs.org/docs/ .

**Not used, and why:** no decompile-derived source (Grayfox96/FFX-RNG-Tracker, the FFX Battle Mechanics GameFAQs guide, the Ultimania transcriptions) carries visual or UI-layout data — those are damage-formula and RNG sources and belong in the combat-mechanics document, not this one.

> **Corrected 2026-09-15 (gap-fill pass).** The original text here read "No prior-research files existed in `D:/Final Fantasy/research/` when this document was written; it is the first file in that directory." **That is no longer true, and the reasoning around it was wrong.** Nine sibling documents now exist, and the mechanics documents carry a substantial amount of **UI-behaviour** data that this document needs and now cites: Overdrive timer durations, reel rules, the Fury cap, Garment Grid gate rules, the FFX-2 ATB and HP colour codes, HUD element positions, and the exact telegraph strings. Decompile-derived data is still not a *visual* source, but the guide-derived mechanics documents are, for anything the UI has to express.

## 9. Verification log (fact-check pass, 2026-09-15)

Each claim below was checked against an independent second source where possible. No claim was found "contradicted"; one previously single-sourced claim is now confirmed with a second source, and the rest remain unverifiable this session (either the second source didn't state the specific figure, or independent sources were unreachable/blocked).

| # | Claim (doc location) | Verdict | Independent source checked |
|---|---|---|---|
| 1 | Yu Pagodas heal BFA exactly 1,500 HP via Power Wave (§1.10 line 448; Conflicts #9 line 1820) | Unverifiable — mechanic confirmed, HP figure not corroborated | gamerguides.com bestiary/bosses/braskas-final-aeon |
| 2 | Haste/Hastega move a turn forward in the CTB window (§0 table, line 976) | **Confirmed — now `[verified: 2 sources]`** | game8.co/games/Final-Fantasy-X/archives/270672 |
| 3 | Act List sits on the right side of the screen (§3.0 line 971) | Unverifiable this session | game8.co/270672 (confirms turn order, not screen position); other candidates blocked/unreachable |
| 4 | Enemies show a disambiguating letter next to their name (§3.2 line 1018; §3.0 line 973) | Unverifiable this session | No independent source reachable |
| 5 | Bottom-right shows HP/MP + Overdrive bar (§3.0 line 974; §3.4 line 1065) | Unverifiable this session | No independent source reachable |
| 6 | L1/LB opens party-Switch; swapped-in character loses the turn but keeps AP (§3.3 line 1056) | Unverifiable this session | jegged.com/.../Combat.html (silent on this mechanic) |
| 7 | Overkill doubles item drops (§3.6 line 1169) | Unverifiable this session | jegged.com/.../Combat.html (discusses Overkill, no drop-doubling rule) |
| 8 | HP digits turn yellow below 50% max (§3.4 line 1082; Conflicts #7 line 1818) | Unverifiable — remains flagged single-source per doc's own admission | No independent source reachable |
| 9 | Sensor reveals HP/max HP/elemental resistances; works party-wide from one equip (§3.5 line 1133) | Unverifiable this session | finalfantasy.fandom.com returned HTTP 402; other candidates blocked |
| 10 | Sensor ineffective vs. aeons/Dark Aeons/Monster Arena specials/Omega Ruins enemies (§3.5 line 1133) | Unverifiable this session | Same access failures as #9 |
| 11 | Default command set Attack/Item/Defend/Switch + character commands; equip-change costs a turn for all but Seymour (§3.3 line 1042) | Unverifiable this session | No independent source reachable |
| 12 | FFX-2 ATB bar length set by Agility, fill rate fixed (§4.0 line 1308; §4.3 line 1372) | Unverifiable this session | strategywiki.org returned HTTP 403 (also the doc's own sole existing source) |
| 13 | Spherechange: anytime, halts time, grants immunity, allows an action right after (§4.0 line 1312; §1.14 line 548; §4.5 line 1406) | Unverifiable this session | strategywiki.org blocked (same as #12) |
| 14 | White Mage dressphere has no Attack command (§4.7 line 1436) | Unverifiable this session | No independent source reachable |
| 15 | Dressspheres set weapon/base stats/appearance, no separate equipment system (§4.0 line 1310) | Unverifiable this session | No independent source reachable |
| 16 | Vegnagun fight order: tail → leg → body/core → head/main cannon, then Shuyin (§1.18 line 622) | Unverifiable this session | finalfantasy.fandom.com/wiki/Vegnagun returned HTTP 402; others blocked |
| 17 | Vegnagun leg Nodes cycle Red/Yellow/Green (offense/buff/recovery), change color when struck (§1.18 line 622) | Unverifiable this session | Same access failures as #16 |
| 18 | Vegnagun head fight has a countdown timer; expiry = game over (§1.18 line 622) | Unverifiable this session | Same access failures as #16 |
| 19 | Vegnagun battles open with a "black hole" transition instead of the normal shatter (§1.18 line 634; §3.8 line 1196; Conflicts #11 line 1822) | Unverifiable this session | Same access failures as #16 |
| 20 | Possessed Bahamut (Bevelle Underground) counts down 5→0 before Mega Flare (§1.17 line 605) | Unverifiable this session | finalfantasy.fandom.com/wiki/Bahamut_(Final_Fantasy_X-2) returned HTTP 402 |
| 21 | Possessed Bahamut's Impulse hits party for 3/8 remaining HP (§1.17 line 605) | Unverifiable this session | Same access failure as #20 |
| 22 | No victory pose plays after the Shuyin battle (§1.19 line 661; §4.8 line 1445; Conflicts #12 line 1823) | Unverifiable this session | No independent source reachable |
| 23 | Shuyin's Overdrives are recolored Tidus Overdrives (Run & Slash = 6-hit Slice & Dice; Terror of Zanarkand = 9-hit Blitz Ace), with a sword-holding animation error (§1.19 line 661) | Unverifiable this session | No independent source reachable |
| 24 | Published character heights (Tidus 175cm, Auron 183cm, Kimahri 204cm, Wakka 188cm) (§0.4 table, lines 54-66) | Unverifiable — neither confirmed nor contradicted | en.wikipedia.org/wiki/Tidus (no height listed at all) |

No claim in this pass was rated "contradicted"; therefore no CONFLICT notes were added to the body text. One claim (#2) was upgraded to `[verified: 2 sources]` in §3.0, and the GamerGuides Braska's Final Aeon bestiary page was added to §8 Sources as the independent source checked for claim #1 (including its unused BFA HP-pool figures, noted as a candidate for a future combat-mechanics document).

---

## 10. Gap-fill log (2026-09-15)

Nine implementation-blocking gaps were raised against this document; all nine are now filled in place. §7.1 is the resolution index. This log records **what was newly verified**, **what remains an estimate and why**, and **what is still open**.

### 10.1 Newly verified this pass

| # | Claim | Verdict | Source |
|---|---|---|---|
| 1 | Auron was **25 when he died**, and the scar / shut right eye / sunglasses are acquired, not original | **verified** `[single source]` — enables §1.22.2's memory-Auron delta sheet | FF Wiki *Auron* §Appearance |
| 2 | Braska's robe is **red overlapping petals**, sash **grey with connecting circles** bearing the Yevon "A", headdress **dark blue** with a stone band and two pale-blue tassels | **verified** `[single source]` | FF Wiki *Lord Braska* |
| 3 | Zaon wears **golden knight's armour with four horn-like ornaments and a white cape** | **verified** `[single source]` — the horn **count** is the identity | FF Wiki *Zaon* |
| 4 | Kelk is the **only Ronso in Yevonite attire** (orange maester's robe), horn **almost black**; Biran's fur is **more grey than blue** with a **blond** mane; Yenke is **light-skinned** with **brownish** hair, a **dark** horn, and leather on **forearms and chest only** | **verified** `[single source each]` — three visually distinct Ronso, which the corpse staging needs | FF Wiki *Kelk Ronso*, *Biran Ronso*, *Yenke Ronso* |
| 5 | Magus Sisters: **Sandy** tall/slim/**red**/mantis, **Cindy** rotund/**blue-and-red**/ladybug, **Mindy** smallest/**orange**/bee and **hovers in battle** | **verified** `[single source]` — no heights are published anywhere | FF Wiki *Magus Sisters (FFX)* |
| 6 | Nooj is **188 cm**; Baralai is **176 cm**; ages: Logos **26**, Ormi **22**, Gippal **18**, Nooj **21**, Baralai **20**, Brother **20** in X-2 | **verified** `[single source]` (infoboxes) | FF Wiki, respective pages |
| 7 | Nooj's prosthetics are on the **left** arm and leg; Gippal's eye-patch is over the **right** eye | **verified** `[single source each]` — sidedness drives the staging rule in §1.23.4 | FF Wiki *Nooj*, *Gippal* |
| 8 | Shinra's face is **never shown**; **ochre visor**, brown bodysuit, **lime green mittens**, blue collar | **verified** `[single source]` — drives the "no mouth frame, visor pulse instead" portrait rule | FF Wiki *Shinra (FFX-2)* |
| 9 | Wakka's Slots is **three reels + a 20-second timer**, reels stopped individually, and a three-match is called "**Jackpot!**" | **verified** `[verified: 2 sources]` — Jegged plus `ffx-combat-core.md` §5.6 | jegged.com Slots |
| 10 | The FFX-2 ATB gauge colour code is **green / purple (CTIM) / red (Haste) / gold (Slow) / white (Stop)**, and HP is **white ≥ 33%, yellow < 33%, red at 0** | **verified** `[verified: 2 sources]` for the ATB code — supersedes §4.3's FFX-inherited 50% HP threshold | `ffx2-combat-core.md` §6.1 |
| 11 | Spherechange **consumes the whole turn** and is restricted to **one link**; travelled links are drawn **blue** | `[verified: 2 sources]` for turn cost and adjacency; `[single source]` for the blue line — supersedes the old "free action" wheel spec | `ffx2-combat-core.md` §4.1/§4.2 |
| 12 | `postprocessing@6.39.5` peer range is `three: ">= 0.168.0 < 0.187.0"`; the project pins `three@0.186.0` | **verified** `[verified: 2 sources]` — the decisive fact behind conflict B | `assets-and-tech.md` §2.1 |

### 10.2 Contradiction found and recorded

| Claim | Source A | Source B | Handling |
|---|---|---|---|
| The colour of Tidus's Swordplay success zone | `ffx-combat-core.md` §5.3: a **white** zone in the middle of the bar `[single source]` | Jegged Swordplay: "the highlighted **yellow** centre section of the bar" `[single source]` | **Unresolved; both single-sourced, neither decompile-derived.** §3.11.1 implements a **white fill with a 2 px yellow inner border**, which satisfies both readings and is more legible than either. Recorded rather than silently picked |

### 10.3 Derived, not found — and the reasoning

| Value | Why it is `[estimate]` | How it was derived |
|---|---|---|
| Swordplay **zone widths (68 / 44 / 28 / 16 px)** and **cursor speeds (260 / 340 / 430 / 540 px/s)** | Nothing publishes FFX's minigame geometry; Jegged states only that the zone is "smaller" for stronger abilities, and ranks Spiral Cut easiest / Blitz Ace hardest | Chosen so the per-pass window (262 / 129 / 65 / 30 ms) falls monotonically in that published order **and** every ability still permits at least two full sweeps inside the verified 3 000 ms timer |
| Every **pixel rect, hex and duration** in §3.11–§3.16, §4.5, §4.10 and §4.11 | §3.0 and §4.0 already establish that everything outside their small verified-fact tables is our convention | Sized against the 640 × 360 authoring grid and reusing §3.3 / §4.2 chrome, so nothing new is invented visually |
| The bloom conversion constants **×0.85 (strength)** and **×0.80 (threshold)** | No published equivalence exists between pmndrs `BloomEffect` and `UnrealBloomPass`; they use different accumulation and a different knee | Eyeball-matching factors, stated explicitly alongside the reason each argument differs, and flagged "tune against a reference frame, then freeze" |
| The per-scene **tilt-shift uniforms** | `focusRange` was a *depth* band; `uBand` is a *screen-Y* band. There is no arithmetic conversion | Re-derived from the same one-sentence art intent that produced the DOF values |
| The per-scene **grade presets** | A 32³ LUT is not buildable by this toolchain, and §0.2 discourages shipping authored image assets | Each LUT direction sentence translated to lift/gain/gamma/saturation/shadow-tint, with the original sentence preserved in the table so the intent survives the conversion |
| Magus Sisters' **px heights** | No heights published for any of the three | Ranked from the verified "tall and slim / rotund / smallest" wording against the existing aeon band in §0.4 |
| Body heights for **Leblanc, Logos, Ormi, Gippal, Brother, Buddy, Shinra** | Not published | Derived from the wiki's body-type words ("tall slim", "short stout") anchored to the two published X-2 heights, Nooj 188 cm and Baralai 176 cm |
| The **camera preset re-derivation** | The tech doc's presets do not satisfy its own `S ≈ 2.0` assert — they give 2.92 / 4.73 / 2.04 / 5.39 / 6.45 | Every preset's **direction** kept; its **distance** solved from `d = 35.68 / S` so `S` is an integer 2–6 |

### 10.4 Still open

1. **Swordplay zone colour** — white vs yellow, above. Settleable only from a screenshot or a decompile of the minigame's UI data.
2. **Cursor speed and zone width, actual values.** Not published anywhere. A frame-counted capture of each of the four Swordplay abilities would settle it in minutes and is the single highest-value outstanding measurement in this document.
3. **Lulu's Fury rotation-size formula.** `ffx-combat-core.md` §5.7 confirms the requirement grows with Magic and with rotations already made, and that a rotation can become 720°, but no source gives the function. §3.11.4's concentric-arc display is correct for any function; the function itself is unknown.
4. **Whether the original FFX draws the Overdrive minigames over a dimmed scene or a full-screen panel.** §3.11.0 assumes a dimmed scene with a floating overlay. Unverified.
5. **Canonical heights for Leblanc, Logos, Ormi, Gippal, Buddy, Brother and Shinra.** Absent from the wiki infoboxes; the Ultimania may carry them.
6. **The FFX-2 Garment Grid overlay's real on-screen proportions.** The *arrangement* (full screen, battle minimised upper-right) is sourced; the rects in §4.5.1 are ours.
7. **Whether the pre-battle Trigger Command previews its stat bonus in the original.** §3.12.1 shows `STR +10` / `MDEF +10` as a deliberate, flagged deviation, because without it the mechanic is invisible to the player.

### 10.5 Access note

`finalfantasy.fandom.com` returned **HTTP 402 Payment Required** to the plain fetch path throughout this session (the same failure recorded against claims 9, 10, 16–21 in §9). Every wiki citation added in this pass was therefore read through the browser tool instead, and the quoted Appearance text was transcribed from the live page on 2026-09-15. `strategywiki.org` remained blocked (403), so §4.0's two StrategyWiki-sourced rows are still single-sourced — but the spherechange row among them has now been **superseded** by the guide-derived flow in `ffx2-combat-core.md`, which is the better source regardless.
