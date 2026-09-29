# How FFX and FFX-2 show a status in battle

**What this file is.** Where the player sees each status, and what it looks
like, in *Final Fantasy X* and in *Final Fantasy X-2*: on the battle model
(tint, aura, particles, pose, a mark above the head), in the HP/MP window, in
the target window while aiming, in the help line, in the turn order (FFX CTB)
or on the ATB gauge (FFX-2), or as a sound. It is the source table for the
status-display options round Bailey asked for on 2026-09-29 ("the status
effects in general not noticeable or obvious like in the actual ffx/ffx-2
games. I like how status effects are displayed in the games. That should be
examples."). Our own game's gap against this table is in
`docs/concepts/status-display-0929/CURRENT.md`.

**Rules this file follows.** AGENTS.md rule 6: every claim about the original
games carries a source note, and a claim no source we could read makes is
written **unsourced**, not guessed. Rule 8: **no retail screenshot, icon or
frame is stored anywhere in this repository**; everything below is words.
Rule 14: FFX and FFX-2 are two separate tables. Where a look is the same in
both games, the sources say so explicitly and that is noted.

Researched 2026-09-29 by a sub-agent of the status-display options round.
Mechanics (durations, formulas, cures) are **not** repeated here; they live in
`research/ffx-combat-core.md` §2.10 and §4 and `research/ffx2-combat-core.md`
§2.8 and are only mentioned when they are themselves what the player sees.

## Sources

Fandom pages were read in full as wikitext through the MediaWiki API
(`api.php?action=parse&prop=wikitext`), because WebFetch gets HTTP 402 there.
Revision ids are the ones read.

| Tag | Source | Revision / date |
|---|---|---|
| **W-XS** | Final Fantasy Wiki, *Final Fantasy X statuses* | rev 4030921 |
| **W-X2S** | Final Fantasy Wiki, *Final Fantasy X-2 statuses* | rev 4028042 |
| **W-page** | Final Fantasy Wiki per-status pages, named in the row (for example *Zombie (Final Fantasy X)* rev 4031867, *Poison (Final Fantasy X)* rev 4030957, *Sleep (Final Fantasy X status)* rev 4030962, *Confusion (Final Fantasy X)*, *Berserk (Final Fantasy X status)*, *Curse (Final Fantasy X status)*, *Doom (Final Fantasy X status)*, *Protect (Final Fantasy X status)*, *Auto-Life (Final Fantasy X status)*, *KO (Final Fantasy X)*, *Poison (Final Fantasy X-2)*, *Silence (Final Fantasy X-2 status)*, *Darkness (Final Fantasy X-2 status)*, *Sleep (Final Fantasy X-2 status)*, *Confusion (Final Fantasy X-2)*, *Curse (Final Fantasy X-2 status)*, *Slow/Stop/Haste (Final Fantasy X-2 status)*, *Protect/Reflect (Final Fantasy X-2 status)*, *Petrification (Final Fantasy X-2)*, *Auto-Life (Final Fantasy X-2 status)*) | read 2026-09-29 |
| **W-gen** | Final Fantasy Wiki generic status pages, FFX and FFX-2 sections only (*Poison (status)* rev 4041214, *Zombie (status)* rev 4033100, *Confuse (status)*, *Sleep (status)*, *Slow (status)*, *Stop (status)*, *Haste (status)*, *Doom (status)*, *Petrify (status)*, *Reraise (status)*) | read 2026-09-29 |
| **W-img** | The wiki's category *Final Fantasy X Status Images*: one battle screenshot per status (for example "FFX Silence Status.png", "Rikku with Darkness", "Some party members with Haste", "Shell in effect", "Reflect in effect", "Regen", "Defend", "Guard", "Provoke (HD Remaster)"). **The images are not described in words anywhere we could read**, so these rows only prove that the status has *some* visible look on the model in FFX, not what it is | read 2026-09-29 |
| **W-X2icon** | The FFX-2 statuses page carries a separate **status icon** file for nearly every FFX-2 status ("FFX-2 Poison Icon", "FFX-2 Stop Icon", "FFX-2 DEF Down Icon", …); the FFX page carries none. Proves FFX-2 has an icon per status; the icons' artwork is not described in words | rev 4028042 |
| **STEAM-T** | Steam Community, FINAL FANTASY X/X-2 HD Remaster General Discussions, thread "Can you see the status effects on somewhere?" (`steamcommunity.com/app/359870/discussions/0/1635237606659080285/`). A player answer, so community-grade | read 2026-09-29 |
| **X2-CORE** | `research/ffx2-combat-core.md` §6.1 (help line, ATB colours, HP/MP colours, status inspection); its own confidence tags are carried over | in repo |
| **OBS-X** | `research/observed-ffx-steam-2026-09-26.md` §2.1-2.3 (the driver's own session in the Steam build: the top HELP bar while a target cursor is up) | in repo |
| **FFX-CORE** | `research/ffx-combat-core.md` §4.2 (the status table) | in repo |

GameFAQs (Bailey's preferred source) was checked: bover_87's *Final Fantasy X
Remaster Walkthrough (PC)*, "Status Effects" section (v1.3, 2023-12-17), and
Split_Infinity's *Guide and Walkthrough* (PS2, FAQ 18197). Both describe what
each status **does** and neither describes what it **looks like**, so no row
below cites them. Neoseeker's *Status Effects (FFX)* is the same (mechanics
only, plus "turned to stone"). StrategyWiki returned HTTP 403.

Confidence tags: `[verified: 2 sources]` two independent sources agree;
`[single source]` one source; `[unsourced]` no readable source describes the
look (the status may still have one, see W-img); `[conflict]` sources disagree.

## 1. The two display models, in one paragraph each

**FFX: the battle model is the status display.** FFX draws no standing status
icons in its HP/MP window. A player answer on the Steam forum: statuses show
"next to names when selecting targets for a buff to cast, e.g. when you are
trying to cast Haste you will see who is under which status effect
currently. But it won't display it constantly", and "the game's visuals are
fairly obvious in that respect" `[single source: STEAM-T]`. What stays on
screen is the model itself: a green body with black smoke for Zombie, green
bubbles above the head for Poison, Z's and a hunch for Sleep, two spinning
stars for Confuse, a halo for Auto-Life, a red number over the head for Doom,
a red or brown hue for Berserk and Curse, circling coloured orbs for the Nul
statuses, a blue shield flash when Protect absorbs a hit, yellow HP digits and
a slouch for Critical (§2). The same thread notes FFX rarely stacks many
statuses and clears them all after battle, "probably why they thought they
don't need too many visuals" `[single source: STEAM-T]`.

**FFX-2: the model plus an icon for every status.** FFX-2 keeps FFX's on-model
marks where the sources say it does (Poison's green bubbles are "the same as
in *Final Fantasy X*" `[verified: 2 sources: W-X2S; W-page Poison (FFX-2)]`;
Sleep's Z's; Confuse's two stars; Auto-Life's halo), adds new ones (a black
cloud for Darkness, a speech bubble with an ellipsis for Silence, a darkened
model for Curse, gray stone for Petrify), and gives **every status an icon**
`[single source: W-X2icon]`. The icons are shown in the top help line next to
the name of the unit being targeted `[single source: X2-CORE §6.1]`, and
targeting a girl with a status spell or item swaps her HP/MP row for a white
bar of every status icon on her `[single source: X2-CORE §6.1]`. The ATB gauge
itself changes colour for the three clock statuses: red under Haste, gold
under Slow, and white or gray under Stop (§3; the Stop colour is a
`[conflict]`). The stat Up/Down family has **no** model change at all; only the
icon shows it `[single source: W-X2S, "There are no visual changes to the
battle model when affected", on every Up/Down entry]`.

The two games share one principle: **the status is readable on the figure,
in the field, without reading the HUD.** The HUD icon is FFX-2's addition on
top of it, never a replacement.

## 2. FFX, status by status

| Status | Where the player sees it | What it looks like | Source |
|---|---|---|---|
| **KO** | the model | the character plays its KO animation (certain enemy attacks make a character "perform their KO animation even if they otherwise survive", then get up) | `[single source: W-page KO (FFX)]`; the pose itself is not described in words `[unsourced]` |
| **Zombie** | the model (party and enemies) | "a glowing green body and black smoke clouds around their heads"; "Zombified targets turn sickly green" | `[verified: 2 sources: W-XS / W-gen Zombie (status); W-page Zombie (FFX)]` |
| **Poison** | above the model | "a green icon above them in battle"; FFX-2's pages describe the same mark as "green bubbles above the afflicted target's head (or body for creatures that lack a distinctive head)" and say it is "the same as in *Final Fantasy X*" | `[verified: 2 sources: W-page Poison (FFX); W-X2S + W-page Poison (FFX-2)]` |
| **Petrify** | the model | the unit is "turned to stone" and stays on the field; a physical hit can shatter it (the wiki's captions: "Yuna being shattered and removed from battle", "Tidus being shattered after being petrified") | `[verified: 2 sources: W-page Petrification (FFX); Neoseeker Status Effects (FFX)]`; the stone's colour in FFX is `[unsourced]` |
| **Gradual petrify** | — | **does not exist in FFX**: not in the FFX status list | `[single source: W-XS]` |
| **Silence** | the model; the voice | party members "will also not speak during battle if silenced" (an audible cue); the model has a look (W-img "FFX Silence Status.png") that no source describes in words | voice `[single source: W-page Silence (FFX status)]`; look `[unsourced]` |
| **Darkness** | the model | a look exists (W-img "Rikku with Darkness"); not described in words for FFX. (FFX-2's is a black cloud on the head, §3; not assumed for FFX) | `[unsourced]` |
| **Sleep** | the model | "they appear hunched over and have Z's emerge from their head" | `[single source: W-page Sleep (FFX status)]`; FFX-2 describes the same look (§3) |
| **Confuse** | above the model | "two spinning stars over their head" | `[verified: 2 sources: W-XS; W-page Confusion (FFX)]` |
| **Berserk** | the model | "Targets affected by Berserk turn a red hue" | `[single source: W-page Berserk (FFX status)]` |
| **Slow** | the turn order | turns "come up less often" (the CTB list is where that is read); an on-model look is not described | effect `[verified: 2 sources: W-page Slow (FFX status); FFX-CORE §4.2]`; look `[unsourced]` |
| **Haste** | the turn order; the victory pose | more turns (CTB list); "If a character is Hasted at the end of battle, their victory pose animation is also sped up"; a look exists (W-img "Some party members with Haste") that is not described | victory pose `[verified: 2 sources: W-page Haste (FFX status); research/ffx-vs-ffx2-presentation.md FC-7]`; look `[unsourced]` |
| **Stop** | — | **not an FFX status** (absent from the FFX list) | `[single source: W-XS]` |
| **Protect** | the model, when hit | "When a protected unit is hit with a physical attack, a blue magical shield appears to mitigate it" | `[single source: W-page Protect (FFX status)]`; FFX-2 says the same (§3) |
| **Shell** | the model | a look exists (W-img "Shell in effect"), not described in words | `[unsourced]` |
| **Reflect** | the model | a look exists (W-img "Reflect in effect"), not described in words for FFX | `[unsourced]` |
| **Regen** | the model; HP | a look exists (W-img "Regen"), not described in words | `[unsourced]` |
| **NulBlaze / NulFrost / NulShock / NulTide** | around the model | "represented by a circling red orb" (Blaze), "white orb" (Frost), "yellow orb" (Shock), "blue orb" (Tide) | `[single source: W-XS]` |
| **Auto-Life** | above the model | "a halo above their battle model" / "a halo above their head" | `[verified: 2 sources: W-page Auto-Life (FFX status); W-gen Reraise (status)]` |
| **Doom** | above the model | "a countdown marked in red over the victim's head (or body for creatures without any visible heads)"; decrements on the victim's own turn | `[verified: 2 sources: W-page Doom (FFX status); FFX-CORE §4.2 ("Countdown shown over the head")]` |
| **Curse** | the model; the Overdrive gauge | "Characters under Curse turn a murky brown hue"; the Overdrive gauge stops filling | hue `[single source: W-page Curse (FFX status)]`; gauge `[verified: 2 sources: W-XS; FFX-CORE §4.2]` |
| **Critical (SOS)** | the HP digits; the model | "Their HP digits turn yellow and the character slouches in fatigue, taking an even more exhausted stance when they are under 25% of their HP" | `[single source: W-XS]` |
| **Provoke** | the model | a look exists (W-img "Provoke (HD Remaster)"), not described | `[unsourced]` |
| **Threaten** | — | no source describes a look | `[unsourced]` |
| **Guard / Sentinel / Defend** | the model | Sentinel: "The user will take a defensive stance"; Guard and Defend have images (W-img) but no description | Sentinel `[single source: W-XS]`; others `[unsourced]` |
| **Power / Magic / Armor / Mental Break** | — | no source describes a look on the model or in the HUD | `[unsourced]` |
| **Delay** | the turn order | not a status but a push to the CTB counter, so the only place it shows is the turn list | effect `[verified: 2 sources: FFX-CORE §1.5; W-XS]`; "shows in the turn list" is our inference `[unsourced]` |
| **Eject** | the field | the unit leaves the battle; after petrify, it shatters (captions above) | `[verified: 2 sources: W-XS; W-gen Eject (status)]` |
| **Scan** | the help/sensor text | reveals HP, affinities, immunities; for a Sensor-immune boss the top HELP bar prints "Immune to sensors." | `[verified: 2 sources: W-XS; OBS-X §2.3]` |
| **Overdrive ready** | — | not a status; out of this table's scope. (Curse's effect on the gauge is above.) | — |

**The target window (FFX).** While a target cursor is up, the top HELP bar
names the target (for a boss, "Boss: Spherimorph") `[single source: OBS-X
§2.1]`, and while choosing targets for a buff the statuses show "next to
names" `[single source: STEAM-T]`. Whether enemies' statuses are also listed
while aiming an attack is `[unsourced]`.

## 3. FFX-2, status by status

Every status in this table except Eject, Delay and Action-cancel has its own
icon file on the wiki `[single source: W-X2icon]`; the icon column is not
repeated per row. Where the icon appears: the help line when that unit is
targeted, and the white status bar that replaces a girl's HP/MP row while she
is targeted by a status spell or item `[single source: X2-CORE §6.1]`.

| Status | Where the player sees it | What it looks like | Source |
|---|---|---|---|
| **Death (KO)** | HP number; icon | HP/MP numbers red at 0 ("KO'd or otherwise incapacitated") | `[single source: X2-CORE §6.1]`; the model's pose `[unsourced]` |
| **Poison** | above the model | "green bubbles above the afflicted target's head", "the same as in *Final Fantasy X*" | `[verified: 2 sources: W-X2S; W-page Poison (FFX-2)]` |
| **Petrify** | the model | "turns the target to gray stone and immobilizes them"; shatters on a physical hit ("Yuna being shattered") | `[verified: 2 sources: W-page Petrification (FFX-2); W-gen Petrify (status)]` |
| **Gradual petrify** | — | **does not exist in FFX-2** (absent from the list) | `[single source: W-X2S]` |
| **Silence** | above the model; the voice | "a speech bubble with an ellipsis above their head or body"; silenced girls "do not speak during battle, or say their victory lines" | `[single source: W-page Silence (FFX-2 status)]` + voice `[single source: W-gen Silence (status)]` |
| **Darkness** | above the model | "a black cloud on the affected character's head" | `[single source: W-page Darkness (FFX-2 status)]` |
| **Sleep** | the model | "Their battle model will hunch over and Z's appear above their head" | `[verified: 2 sources: W-X2S; W-page Sleep (FFX-2 status)]` |
| **Confuse** | above the model | "two spinning stars above their heads (or bodies …)" | `[verified: 2 sources: W-X2S; W-page Confusion (FFX-2)]` |
| **Berserk** | icon | no on-model look described | `[unsourced]` for the model |
| **Slow** | the ATB gauge; the model's speed | "slower animations and actions"; "The ATB bar for afflicted party members turns gold for the duration of the effect and fills at half speed" | `[verified: 2 sources: W-X2S; W-page Slow (FFX-2 status); also X2-CORE §6.1 "Gold"]` |
| **Haste** | the ATB gauge; the model's speed | "Hasted party members have red ATB gauges, and their animations are sped up, even victory poses" | `[verified: 2 sources: W-page Haste (FFX-2 status); X2-CORE §6.1 "Red"]` |
| **Stop** | the ATB gauge; the model freezes | "Stop prevents all movement animations" (the unit cannot even be chained, because its stagger does not play); the ATB bar "is turned gray and will not move" | freeze `[verified: 2 sources: W-X2S; W-page Stop (FFX-2 status)]`; **gauge colour `[conflict]`**: the wiki says **gray** (2 pages), `X2-CORE §6.1` says **White** `[verified: 2 sources]` there. Settle in the Steam build before building it |
| **Protect** | the model, when hit | "When a protected unit is hit by a physical attack, a blue shield appears to mitigate the damage" | `[single source: W-page Protect (FFX-2 status)]` |
| **Shell** | icon | no on-model look described | `[unsourced]` for the model |
| **Reflect** | the model, when a spell bounces | "the spell hits a blue magic shield instead of the target and is redirected" | `[single source: W-page Reflect (FFX-2 status)]` |
| **Regen** | icon | no on-model look described | `[unsourced]` for the model |
| **Doom** | icon; a counter | the party's counter starts at 3; whether the count is drawn over the head as in FFX is not stated | counter start `[verified: 2 sources: W-X2S; W-gen Doom (status)]`; placement `[unsourced]` |
| **Curse** | the model; icon | "Cursed party member appears with a darkened battle model"; blocks spherechange | `[single source: W-page Curse (FFX-2 status)]` |
| **Auto-Life** | above the model | "a halo above their head or body when in battle" | `[single source: W-page Auto-Life (FFX-2 status)]` |
| **Critical** | HP number; the model | below a third of max HP: "They will appear tired and hunched over"; HP number turns yellow and the girl "visibly kneels" | `[verified: 2 sources: W-X2S; X2-CORE §6.1]` |
| **STR / MAG / DEF / MDEF / ACCU / EVA / LUCK Up and Down** | icon only | "There are no visual changes to the battle model when affected" (each entry) | `[single source: W-X2S]` |
| **Invincible / Null Magic / Null Physical** | icon | no on-model look described | `[unsourced]` for the model |
| **Spellspring** | icon (the wiki's image is captioned "Spellspring status") | not described | `[unsourced]` for the model |
| **Itchy** | icon | the girl can only spherechange or flee; no model look described | `[unsourced]` for the model |
| **Pointless** | icon; the model | the icon reads "EXP=0"; "The character afflicted will start flashing slowly" | icon text `[verified: 2 sources: research/ffx2-combat-core.md §2.8 table]`; flashing `[single source: W-X2S]` |
| **Eject** | the field | removed from battle; no look described | `[unsourced]` for the look |
| **Delay / Action-cancel** | the ATB gauge | Delay "increases the ATB bar of the character's current pending action"; Action-cancel cancels the pending action | `[single source: W-X2S]` |
| **Pain** | — | **not in FFX or FFX-2** (a *Final Fantasy XIII*-series status; absent from both lists) | `[verified: 2 sources: W-XS; W-X2S]` |
| **Provoke / Threaten / Sentinel / Guard (FFX types)** | — | not statuses in FFX-2's list | `[single source: W-X2S]` |

## 4. What this means for the options round (not a decision)

- **Both games** put the status **on the figure**. A status our game shows
  only in a HUD chip is further from both originals than the chip's size
  suggests. `[inference from §2 and §3]`
- **FFX only**: no standing icons; the model carries it, Doom's red number
  floats over the head, Critical turns the HP digits yellow. Statuses appear
  next to names only while aiming.
- **FFX-2 only**: an icon for every status, shown in the help line for the
  targeted unit and in the white bar while aiming a status spell at a girl;
  the gauge colours (red, gold, white or gray); the Up/Down family is
  icon-only.
- **Both**: Poison's green bubbles, Sleep's Z's and hunch, Confuse's two
  stars, Auto-Life's halo, Protect's blue shield on a hit, stone for Petrify
  with a shatter on a physical hit, the Critical slouch and yellow HP.
- The retail icons' and models' artwork must never be copied (rule 8). An
  option drawn for Bailey is our own glyph and our own particle, keyed to the
  sourced *idea* (bubbles, stars, halo, cloud, hue), not to a traced frame.

## 5. Open questions

1. FFX-2 Stop gauge: gray (wiki) or white (`ffx2-combat-core.md` §6.1)?
   Needs the Steam copy (`research/observed-*` style note; ask Bailey before
   taking over the screen, per the Steam-check memory).
2. FFX's looks for Silence, Darkness, Haste, Slow, Shell, Reflect, Regen,
   Provoke, Guard and Defend exist (W-img) but are described nowhere we could
   read. Only the Steam copy can settle them in words.
3. Does FFX list an **enemy's** statuses while aiming at it? `[unsourced]`.
4. Does FFX-2 draw Doom's count over the head? `[unsourced]`.
