# FINAL FANTASY X vs X-2 — PRESENTATION DIFFERENCES: Implementation Reference

**Target project:** Pyrefly Reprise (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Topic:** every presentation fact that **differs between FFX and FFX-2**, so that each of the twelve approved presentation changes is applied only to the game it is true to.
**Research date:** 2026-09-19
**Revision:** 2 — **revised 2026-09-19 after an independent fact-check.** Seven findings; six upheld outright, one upheld in part. **Four engine instructions in revision 1 were wrong and would have shipped bugs**: "do not kill Anima", "do not write a death animation for Mortiorchis", "FFX-2's ATB gauge is one bar at a fixed rate", and a false dilemma about which Leblanc battle canon allows. **§14 is the fact-check log and should be read before §3 or §4.**
**Commissioned by:** Bailey, 2026-09-19 — "For these changes it should be ffx and ffx-2 aware. Whatever is most true to each specific game… If a change is true to ffx but not ffx-2 then do not apply the changes to ffx-2. if it true to ffx-2 but not ffx then do not apply the change to ffx."
**Scope:** eight chapters — FFX: Seymour + Anima (Macalania Temple), Evrae (airship deck), Seymour Flux (Gagazet), Yunalesca (Zanarkand Dome), Braska's Final Aeon / Yu Yevon (Dream's End). FFX-2: Leblanc Syndicate, Bahamut (Bevelle Underground), Vegnagun + Shuyin (Farplane).

---

## 0. Provenance, method, and how to read this document

### 0.1 Confidence tags

| Tag | Meaning |
|---|---|
| `[verified: 2 sources]` | Two independent sources agree. |
| `[single source]` | One source only. Treat as provisional; §11 lists the ones that matter. |
| `[derived]` | Computed or deduced by me from tagged facts, with the reasoning shown. |
| `[absence]` | **No source found that describes the behaviour, after targeted searching.** This is *not* evidence the behaviour does not exist. It is a standing instruction: do not implement anything that depends on it until someone watches footage. |
| `[estimate]` | Authored design judgement. Not a measured fact. Must be labelled as such in-product. |
| `[ours]` | A Pyrefly Reprise invention with no canon basis at all. Legitimate — but it must never be defended as "faithful". |

### 0.2 What I actually did

1. Read the local research corpus first: `research/visual-bible.md` §3.8 (FFX transitions/victory), §4 (FFX-2 battle UI), §6.6 (particle systems), §2.1–2.5 (location sheets); `research/ffx-seymour-flux.md`; `research/ffx-yunalesca.md`; `research/ffx2-bahamut.md`; `research/assets-and-tech.md` §2A (input mapping, L1 = Switch in FFX / Spherechange in FFX-2). **One prior claim is corrected below** — see §1.2 and §10 conflict P-1.
2. Pulled the Final Fantasy Wiki through its MediaWiki `action=parse&prop=wikitext` API. (The normal HTML endpoint and `WebFetch` both return HTTP 402/403 from this machine; `curl` with a browser User-Agent against `api.php` returns 200. Recorded so the next agent does not rediscover it.)
3. Cross-checked against TV Tropes, Steam community threads for the HD Remaster, PCSX2 issue reports, StrategyWiki and two independent fan reimplementations of the FFX transition shader.
4. **No dialogue was transcribed and no guide prose was pasted.** Story beats and appearance are in my own words throughout, per the project's originality rule.

### 0.3 The one-line answer to the brief

> The pane breaking is **true to both games**, not just FFX — the FF Wiki describes an FFX-2 boss as the exception *to* "the screen shattering and the view switching to battle mode". The changes that really are one-game-only are the **turn-order preview** (FFX only), the **chain counter** (FFX-2 only), the **spherechange sequence** (FFX-2 only), the **short-aeon config** (FFX only), and **positional back-attacks** (FFX-2 only). The change that is least supported in *either* game is the **opening camera sweep of the arena**.

---

## 1. The battle transition

### 1.1 FFX — two different transitions, and we only ever get to use the second one

FFX ships **two** field-to-battle transitions, and which one you see depends on how the battle was entered.

| Entry | Transition | Confidence |
|---|---|---|
| **Random / field encounter** | The screen **shatters like a pane of glass** and the shards fly offscreen, revealing the battle scene. | `[verified: 2 sources — TV Tropes *Fight Woosh*; a Steam HD Remaster thread whose whole subject is "the Shattering Glass screen" between battles; independently corroborated by PCSX2 issue #8936, which names "the screen shatter effect used when starting a battle"]` |
| **Boss battle entered out of a cutscene** | **No shatter.** A **slight blurring**, and the fight is staged **on the same background the characters were already standing on** in the cutscene. | `[single source — TV Tropes *Fight Woosh*]` |

**This matters more to us than to anyone else: every one of our eight chapters is a boss battle entered out of a cutscene.** Taken literally, the canon-faithful FFX transition for *our* content is the blur, not the shatter.

**Shard behaviour** (from two independent fan reimplementations that were built by frame-stepping the real effect — so: observation of the game, not game data):

1. The last field frame is **captured to a texture** and mapped onto a pre-fractured plane.
2. The glass **cracks in place first**, each shard displaced by only a small amount — a held beat before anything falls.
3. The shards then **leave in a right-to-left sweep**: "the glass that start moving first is on the most right and the last is the most left", driven by a collider sweeping across the plane. They spin as they go.
4. A **white flash** at the break, and a **black field behind the glass** which then fades up into the battle scene.

`[single source]` for steps 2–4 (fan reimplementations `cognoscola/screen_break_effect` and `EveraldoSembiring/Final-Fantasy-X-Battle-Transition`); step 3's right-to-left ordering is quoted verbatim from the second repo's README.

> **Implementation note.** The right-to-left sweep is the detail that makes a shatter read as *FFX's* shatter rather than as a generic asset-store shatter. A radially-symmetric burst is the wrong answer. So is shattering every shard on the same frame.

The transition also has a **loud, startling sound** attached to it — distinctive enough that a player opened a Steam thread asking how to mute it separately. `[single source]` Worth knowing when the audio pass reaches this: it should be sharp, but it is the one FFX cue with a documented history of making people flinch, so give it a level that survives a volume slider.

### 1.2 FFX-2 — also a shatter (this corrects a prior assumption)

The FF Wiki's Vegnagun article, describing why that boss is unusual **within FFX-2**, states that battles against Vegnagun's parts have a different battle opening from the rest of the game: **instead of the screen shattering and the view switching to battle mode**, they open with a **black hole sucking in the screen**. `[single source — FF Wiki, *Vegnagun*]`

Read the sentence carefully. It is only meaningful as a contrast if **the rest of FFX-2 opens with the screen shattering and the view switching to battle mode**. So:

- **FFX-2's normal battle opening is a screen shatter too**, followed by a hard switch of view into battle mode. `[single source, by contrast]`
- **Vegnagun's parts are the documented exception**: a radial implosion, the screen pulled into a point. `[single source]`

`visual-bible.md` §3.8 currently specifies FFX's transition as a **swirl** with a shatter as step 3, and treats the Vegnagun note as a contrast against a swirl. That reading is wrong on both halves and is recorded as conflict **P-1** (§10). Nothing in any source describes a polar swirl in either game.

### 1.3 Verdict for the engine

| Chapter | Transition | Why |
|---|---|---|
| Macalania (Seymour + Anima) | **Blur, same background as the cutscene** | FFX boss out of a cutscene `[single source]` |
| Airship deck (Evrae) | **Blur, same background** | as above |
| Gagazet (Seymour Flux) | **Blur, same background** | as above |
| Zanarkand Dome (Yunalesca) | **Blur, same background** | as above |
| Dream's End (BFA / Yu Yevon) | **Blur, same background** | as above |
| Chateau Leblanc (Leblanc Syndicate) | **Shatter → cut to battle view**, ×3 — the chapter is a **three-act mission** with three separate battles (P-3) | FFX-2 default `[single source]` |
| Bevelle Underground (Bahamut) | **Shatter → cut to battle view** | FFX-2 default `[single source]` |
| Farplane (Vegnagun's parts) | **Black-hole implosion** | documented FFX-2 exception `[single source]` |
| Farplane (Shuyin) | **Shatter → cut to battle view** | Shuyin is not a Vegnagun part; the exception is scoped to the parts `[derived]` |

> **Recommendation to Bailey (needs a yes, hard rule 10).** The shatter is the single most recognisable thing in this list and canon puts it on **three** of our eight chapters, none of them FFX. Two options worth mocking up before anyone builds: **(A) strict canon** — blur for all five FFX chapters, shatter for the FFX-2 ones, implosion for Vegnagun; the shatter then becomes a "you are in the sequel now" signature, which is a genuinely good structural gag. **(B) shatter everywhere except Vegnagun** — more immediately satisfying, less true, and it throws away a free way of making the two games feel different. I recommend A and I recommend showing both.

---

## 2. The battle intro

### 2.1 FFX

- The battle camera in FFX is **not player-controllable**, on PS2 or in the HD Remaster. `[verified: 2 sources — a Steam HD Remaster thread asking exactly this, answered "No to both"; a GameFAQs thread on battle camera angles]` Whatever we do with the camera, it is authored, never handed to the player.
- The camera **is** in constant authored motion during combat — it reframes per action rather than sitting on a locked-off master. `[single source]`
- **No source describes a dedicated opening camera sweep or orbit of the arena before the first turn.** `[absence]` And for boss fights the framing is inherited from the cutscene that just ended (§1.1), which argues *against* an orbit: the player has already been shown the room.
- Party members have **victory poses**, and FFX is the first game in the series where **summons** have them too — each aeon has one (Shiva sweeps back her hair; Anima looks up and roars silently). `[single source — FF Wiki, *Final Fantasy X victory poses*]`
- **Characters speak on victory in FFX too.** FFX is the first game in the series with voice acting, "and thus the characters also exclaim various things when they win a battle." **This is not an FFX-2-only behaviour** — see the correction in §14, FC-6. `[single source — FF Wiki, *Final Fantasy X victory poses*]`
- **Haste speeds up the victory-pose animation in FFX** — and in FFX-2 as well (§2.2). Not a difference. `[verified: 2 sources — FF Wiki *Final Fantasy X victory poses*; *Haste (Final Fantasy X-2 status)*]`
- **Poses are tied to the Victory Fanfare**, and are suppressed when multiple characters speak their victory lines. `[single source]`
- **Nobody poses in Zanarkand.** Canon explicitly withholds the victory pose there — party and aeons alike keep their battle stance, because of the solemnity of Yuna's approaching fate. `[single source — FF Wiki, *Final Fantasy X victory poses*]` **This lands directly on our Yunalesca chapter (Zanarkand Dome): no victory pose, no fanfare flourish, hold the battle stance.** Found during the fact-check pass; see §14, FC-6a.

### 2.2 FFX-2

- Battle opens with the shatter and a **switch of view into battle mode** (§1.2) `[single source]`.
- Party members perform **victory poses that depend on the dressphere currently equipped** — each girl has a unique pose per dress. They also **speak a line on victory**, varying by point in the story and by the condition the battle was won in. `[single source — FF Wiki, *Final Fantasy X-2 victory poses*]`

  **What is actually different from FFX** is only the *first* half of that: the pose is **per dressphere** rather than one per character, and the line varies by story point and win condition. Spoken victory lines as such are true to both games (§2.1). `[verified: 2 sources — the two victory-pose pages]`
- **The suppression rules are a genuine FFX-2 difference, and two of them land on our chapters.** A girl does **not** pose if she is speaking a victory quote, if she is already dancing (Songstress), if she is asleep, and sometimes if she is low on HP. And — **directly relevant** — **the girls do not perform a victory pose at all after Bahamut or after Shuyin** (nor after Via Infinito special bosses on first defeat). `[single source — FF Wiki, *Final Fantasy X-2 victory poses*]` **Two of our three FFX-2 chapters therefore end with no victory pose**; only the Leblanc chapter gets one. This is the FFX-2 counterpart of FFX's Zanarkand rule, and both games use the same device: withhold the celebration when the story is grave.
- **Haste speeds a unit's animations generally in FFX-2** — attack animations and *casting* animations, though not the spell animations themselves — **and victory poses**, and it turns that girl's ATB gauge **red**. `[single source — FF Wiki, *Haste (Final Fantasy X-2 status)*]`
- **No source describes an entrance animation or entry pose at the start of an FFX-2 battle.** `[absence]` The entrance is a widely-remembered part of the game's feel, but I could not source it in words, and this document does not guess.

### 2.3 Verdict

An **opening camera sweep of the arena** is `[ours]` in both games. It is not contradicted by anything, and "show me the room before you ask me to fight in it" is a good instinct — but it should be built as **our** flourish, staged differently per game, and it should not be sold to Bailey as fidelity. See §9 row 6 for the shape I recommend.

---

## 3. How the defeated leave the field

This is the section with the most per-encounter traps in it. "Dissolve into pyreflies" is correct for the *majority* of Spiran enemies and **wrong for four of our eight chapters' headline opponents.**

### 3.1 The rule, per class

| Class | FFX | FFX-2 | Confidence |
|---|---|---|---|
| **Fiends** (the ordinary monsters of Spira) | Spirits of the dead that use **pyreflies** to hold a warped physical shape. **Vanquishing a fiend disperses its pyreflies.** | Same — pyreflies are explicitly a fiend's **life force**, and pyreflies became *more* abundant after Sin's destruction broke the cycle of sendings, which is why X-2 has more fiends, not fewer. | `[verified: 2 sources — FF Wiki *Fiend (Final Fantasy X)*; *FFX-2 Ultimania Omega* p.085 as cited on that page]` |
| **Unsent** (Seymour Flux, Yunalesca, Shuyin, Auron, Yunalesca's husband) | A person whose spirit never reached the Farplane; **their pyreflies reconstruct the body**. When an unsent is sent or destroyed, **the body disperses into pyreflies**. | Same. Shuyin is a *special* case: his pyreflies never formed a body at all — they are "imprinted" with his despair and act on their own. | `[verified: 2 sources — FF Wiki *Unsent*; corroborated on the *Seymour Guado* page, where Flux "is again defeated and vanishes"]` |
| **Aeons** | Dreams of the fayth. At Macalania, Seymour's Anima is **defeated normally and her departure is *presented* as a dismissal** — the scripted message is "Seymour dismisses Anima!", and the fight then continues against Seymour. She is a normal, killable enemy: 18,000 HP, an Overkill threshold of 1,400 and an AP payout. **Corrected — see §14, FC-2.** | No aeons in FFX-2's own systems; the possessed aeons fought in the temples are FFX aeons under Shuyin's despair. | `[verified: 2 sources — FF Wiki *Anima (Final Fantasy X boss)* lead ("After she is defeated, the battle against Seymour will continue") and strategy section ("attack until Anima is dismissed"); the same page's stat block carries an Overkill value, which only a defeatable enemy has]` |
| **Machina** | Machines, not spirits. No pyreflies. | Vegnagun and its parts are machina. | `[single source — FF Wiki, *Machina*; *Vegnagun*]` |
| **Living humans who lose a fight** | They lose and the scene continues. Nothing dissolves. | Same. | `[derived]` from the per-encounter rows below |

### 3.2 Per-encounter, for all eight chapters — **the table the engine must obey**

| Chapter | Opponent | What canon does at the end | Do NOT |
|---|---|---|---|
| Macalania | **Two Guado Guardians** | Living Guado bodyguards. They lose. More of their fellows **chase the party out of the temple** immediately afterwards. | pyrefly-dissolve them |
| Macalania | **Anima** | **Defeat her normally** — HP to 0, canonically by Shiva — and then **present the departure as a recall, not a death**: the scripted line is that Seymour dismisses her. The battle continues against Seymour afterwards. She is Overkillable. | dissolve her into pyreflies; play a death throe; **end the battle on her**; make her non-defeatable |
| Macalania | **Seymour (human)** | He **dies and leaves a body**. Tromell and the Guado **carry the corpse away and refuse to let Yuna perform the sending**, which is precisely why he returns as an unsent. | dissolve him into pyreflies — it would break the whole Seymour arc `[verified: 2 sources — FF Wiki *Seymour Guado*; *Macalania Temple*]` |
| Airship deck | **Evrae** | It **falls from the sky, seemingly beaten**. It is not destroyed: it comes back later as the undead **Evrae Altana** in the Via Purifico. | dissolve it; play a death; play a sending `[single source — FF Wiki, *Evrae*]` |
| Gagazet | **Seymour Flux** | Unsent. **Dissolves into pyreflies and vanishes**, unsent, no catharsis. | fade him out `[verified: 2 sources — already recorded in `research/ffx-seymour-flux.md` §story beat 9]` |
| Gagazet | **Mortiorchis** | **It dies repeatedly.** Each time its HP reaches 0 it immediately uses **Mortibsorption**: damage equal to its own current max HP is dealt to Seymour Flux, it heals itself by the same amount, and its max HP then drops by 1,000 for the next cycle (4,000 → 3,000 → 2,000 → 1,000 → 1,000 …, floored at 1,000). So it needs a **repeatable kill → visible drain into Seymour → re-form at the lower max HP** presentation, and that cycle is the single most distinctive recurring visual beat of the fight. **Corrected — see §14, FC-3.** | give it a **terminal** death; remove it from the field; treat it as un-killable and skip the death beat `[verified: 2 sources — `research/ffx-seymour-flux.md` §2.2 correction box + the FF Wiki enemy-ability master table it cites]` |
| Zanarkand Dome | **Yunalesca** | Unsent. **Dissolves upward into a rising pyrefly column**, not an explosion. | `[verified: 2 sources — `research/ffx-yunalesca.md` beat 14]` |
| Dream's End | **Braska's Final Aeon / Jecht** | Jecht is freed and **fades, with pyreflies rising between him and Tidus**. | `[verified: 2 sources — `research/ffx-bfa-yu-yevon.md` beat 9]` |
| Chateau Leblanc | **Leblanc, Logos, Ormi** | All three are **living humans**. Defeated, Leblanc **hands over the sphere and makes peace with the party**, and the Syndicate later allies with the Gullwings. | dissolve, kill, or KO-animate them `[single source — FF Wiki, *Leblanc*]` |
| Bevelle Underground | **Bahamut** | A possessed aeon. | assume a machina death `[see `research/ffx2-bahamut.md`]` |
| Farplane | **Vegnagun's parts** | Machina. | pyreflies `[single source]` |
| Farplane | **Shuyin** | Pyreflies imprinted with despair, given corporeal form. Lenne puts his soul to rest and **they fade away together**. | a violent dissolve — this one is gentle `[single source — FF Wiki, *Final Fantasy X-2*, story summary]` |

### 3.3 Verdict

"Dissolved into pyreflies, not faded out" is **true to both games** — for fiends and unsent. It is **false for four of our eight headline opponents** (Anima, human Seymour, Evrae, the Leblanc Syndicate) and for Vegnagun's parts. The engine needs a **departure kind** on every combatant, not a global dissolve:

```ts
type Departure =
  | 'pyreflies'        // fiends; unsent — Flux, Yunalesca, BFA/Jecht
  | 'pyreflies-gentle' // Shuyin: slow, paired, upward, no burst
  | 'dismissed'        // Anima at Macalania — defeated normally, then RECALLED by her
                       //   summoner rather than dying. Presentation only: she is a
                       //   normal killable enemy with an Overkill threshold.
  | 'body'             // human Seymour at Macalania — he falls and stays fallen
  | 'falls-away'       // Evrae — leaves the frame downward, alive
  | 'machina-wreck'    // Vegnagun's parts
  | 'yields';          // Guado Guardians; Leblanc, Logos, Ormi — beaten, still standing

// Orthogonal to Departure, because it is not a departure at all:
interface Recurrence {
  // Mortiorchis at Gagazet. It dies, drains Seymour, and re-forms — forever.
  // The death animation is REQUIRED and must be replayable; what must never
  // fire is a terminal departure. See §3.2 and §14 FC-3.
  kind: 'dies-and-reforms';
  onDeath: 'drain-into-owner';   // sized to the CURRENT max HP: 4000/3000/2000/1000/1000…
  reformAt: 'next-lower-max-hp'; // floor 1000
}
```

Two rules the type above is trying to make unmissable:

1. **`'dismissed'` is a presentation value, not a combat rule.** Anima's HP goes to 0 like anything else's. Do not implement a non-defeatable actor.
2. **A repeating death is still a death.** Mortiorchis is the only combatant in the eight chapters that needs its kill animation authored for *replay*, and dropping it drops the fight's signature beat.

Anything that has no sourced departure gets `'pyreflies'` **only if it is a fiend or an unsent**, and otherwise gets a `TODO` and a question to Bailey. Hard rule 6 applies to presentation as much as to numbers.

---

## 4. Turn-order display, and the preview

### 4.1 FFX — the Act List, and exactly what the preview promises

- CTB is **not round-based**. Higher Agility means more turns, which makes Agility matter more than in other turn-based systems. The upcoming order is shown as the **Act List** down the **right** side of the screen. `[verified: 2 sources — FF Wiki *Final Fantasy X battle system*; *Rank (Final Fantasy X)*]`
- Every action has a **Rank** (Japanese: 動作時間, "action time"), which sets the recovery before that unit's next turn. Rank is **directly proportional** to delay: a rank 4 action delays twice as much as rank 2 and four times as much as rank 1. `[verified: 2 sources — FF Wiki *Rank*, citing *Final Fantasy X Ultimania Omega* p.396; the same page's ability table sourced to a GameFAQs rank dump]`
- **The preview, stated exactly:** *"The upcoming order of actions persists on the HUD, and moving the cursor over commands reveals how it will change the order… Multiple turns are displayed for all characters and enemies, **this preview assumes everyone else will use a rank 3 action**."* `[single source — FF Wiki, *Rank*]`

  That last clause is the whole specification and it is the thing a naive implementation gets wrong. The preview is **not** a simulation of what the enemy will actually do. It is a projection under the assumption that **every other unit takes a rank-3 action**. Rank 3 is the standard rank — plain Attack is rank 3, and most enemy abilities are rank 3 too. `[single source]`
- Standard ranks worth hard-coding: **Attack 3, Summon 3, Item 2, Defend 2, change Weapon/Armor 1, Escape 1**. **Quick Hit** is a plain Attack at a lower rank — **1** in the original release, **2** in International/HD — for an MP cost. `[single source — FF Wiki, *Rank*]`
- **Haste halves the delay; Slow doubles it**, and the result is **always rounded down**, which produces real inconsistencies at high Agility (two rank-1 actions can cost slightly fewer ticks than one rank-2 action). `[single source]`
- **The preview can lie, canonically.** Rikku's Mix shows on the CTB as rank **5**, but every actual mix is rank **6**. The wiki calls this out as something that "may fool the player". `[single source]` We should reproduce the honest version and not the bug — but it is worth knowing the preview is a projection, not a promise.
- **Ties** resolve in a fixed unit order: Tidus, Yuna, Auron, Kimahri, Wakka, Lulu, Rikku, the player's aeon, Cindy, Sandy, Mindy, enemies, and finally Cid with the lowest priority. Among enemies, a **boss icon with no number ranks highest**, then numbered icons low-to-high, then lettered icons alphabetically. `[single source]` — directly relevant to Evrae, where **Cid appears on the turn list as a unit** and acts on his own turn.
- **Delay** pushes a unit down the Act List. Reviving a KO'd character delays their next turn **as if they had just taken a rank-3 action**. Summoning an aeon **freezes the party's tick counters** until the aeon leaves. `[single source]`

### 4.2 FFX-2 — gauges, charge time, and no preview

- FFX-2 is **ATB, "but faster", and party members act simultaneously**, unlike the one-at-a-time ATB of earlier games. `[verified: 2 sources — FF Wiki *Final Fantasy X-2*; *Active Time Battle*]`
- The **ATB gauge sits under each girl's name, HP and MP** in the lower-right rows. But **it is not one bar with one meaning** — it is a **four-phase pipeline with a state colour**, and the phases are the HUD. **Corrected — see §14, FC-4.** `[verified: 2 sources — FF Wiki *Haste (Final Fantasy X-2 status)* §Mechanics; `research/ffx2-combat-core.md` §1.1 and §9 HUD tables]`

  | Phase | Bar | What it tells the player |
  |---|---|---|
  | **ATB fill** | **green** (→ **red** under Haste, **gold** under Slow, **white** under Stop) | how long until she may act at all. A command may only be issued when it is **completely full**. |
  | **Command input** | — | Active mode: time runs. Wait mode: time freezes on entering a submenu. |
  | **CTIM charge** | **purple** | **the cost of the command she just picked**, running down in front of her. The ability fires when the purple bar fills. |
  | **Execution + recovery** | no bar | animation, then an optional recovery window before the green bar starts refilling. |

- **Agility shortens the bar; it does not speed the fill** — that half of the prior claim is upheld and is in fact better sourced than it was tagged. `[verified: 2 sources — `research/ffx2-combat-core.md` §0, §1.2]` Bar *length* also varies by dressphere, and separate **abilities shorten the ATB gauge** outright.
- **The rate is not fixed, though.** **Haste quickens the ATB charge rate by about 5%** (and speeds that unit's animations); Slow halves it and additionally **doubles the CTIM value**; Stop, Sleep, KO and Petrify freeze it at zero; **any damage taken perturbs the gauge**, for party and enemies alike. `[verified: 2 sources — FF Wiki *Haste (Final Fantasy X-2 status)*; `research/ffx2-combat-core.md` §1.2]`
- **Charge time exists and is already on screen**: "when a character chooses a command, there may be charge time before it's executed", and it is drawn as the purple phase of that girl's own gauge. `[verified: 2 sources — FF Wiki *Final Fantasy X-2*; *Haste (Final Fantasy X-2 status)* ("ATB Purple Bar (charging) time"); corroborated by `research/ffx2-combat-core.md` §1.1, §1.3 and §9, which also notes that spherechange uniquely has "no MP cost and **no charge bar**" — which presupposes that other actions do]` This is the closest thing FFX-2 has to rank, and it is where canon already answers "what is this going to cost me".
- **Wait vs Active**: in Wait mode time pauses while a sub-menu is open; and **regardless of the player's setting the game toggles itself between Wait and Active during certain attacks, showing an indicator on screen**. `[single source — FF Wiki, *Active Time Battle*]` That indicator is a real FFX-2 HUD element and we do not currently have it.
- **There is no Act List and no turn-order queue in FFX-2.** `[derived]` from the above plus `visual-bible.md` §4.1.
- **No source describes any turn-order preview in FFX-2.** `[absence]`

### 4.3 Verdict — "the queue answers before you commit"

**True to FFX. Not true to FFX-2. Do not put a turn-order preview in the FFX-2 chapters.**

The FFX version has a precise spec (§4.1) and we should build exactly that, including the rank-3 assumption, and say so in the help text.

**The FFX-2 equivalent is not something we have to invent — the game already ships it.** `[corrected: see §14, FC-5]` FFX-2 answers "tell me what this costs before I commit" with the **purple CTIM segment on the girl's own ATB gauge**: pick a command, and its charge runs down in front of you, on her bar, in a colour reserved for exactly that. Add the **Wait/Active indicator** — which the game toggles by itself during certain attacks regardless of the player's setting — and the differing bar lengths, and the question is answered in canon's own vocabulary.

So, for the FFX-2 chapters: **build the green/purple/red-gold-white gauge properly and the job is done.** A numeric charge value printed on the highlighted command is `[ours]` — a legitimate garnish on top, and arguably a kind one for a first-timer, but it must be labelled as ours and it must not be described to Bailey as the faithful answer. The faithful answer is the purple bar.

> An earlier revision of this section named the number-on-the-command as "the FFX-2 equivalent… without inventing a system the game does not have". That was exactly the failure this document warns about elsewhere: it invented a HUD element to replace one canon already had, and it under-credited FFX-2 in a document whose job is to get FFX-2 right.

---

## 5. Chain counter, and the two results screens

### 5.1 FFX-2's chain (FFX-2 only — there is no chain in FFX)

| Fact | Value | Confidence |
|---|---|---|
| Display | a **"Chain x1!" message pops on screen while a unit is being hit**; the counter builds from there | `[single source — FF Wiki, *Chain (term)*]` |
| Who can chain | **both** the player party and the enemy party | `[single source]` |
| Window | **2 seconds** after a normal attack; **3 seconds** after a critical hit | `[single source]` |
| Damage | Chain x1 = normal damage **+45%**; every hit that continues the chain adds **+5%** (so "Chain x3!" is +55%) | `[single source]` |
| Ceiling | the bonus multiplier **exceeds 600%** | `[single source]` |
| Second effect | hitting a target still staggered from the previous hit **prevents it evading** and **prevents it acting** — a long enough chain can lock an enemy out entirely | `[single source]` |
| Limit | an enemy already **mid-attack-animation** cannot be interrupted by further chaining; units under **Stop** cannot be chained at all, because they never enter the stagger animation | `[single source]` |
| Best chain builders | **Thief** (fast, attacks twice in succession) and **Gunner's Trigger Happy** | `[single source]` |
| Achievement | Chain x99 unlocks the "Full Chain" trophy in the HD Remaster — i.e. **99 is the meaningful display ceiling** | `[single source]` |

### 5.2 The results screens — the real difference

| | FFX | FFX-2 |
|---|---|---|
| What is shown | **AP** gained; how many **Sphere Levels** each character has and how many they gain; **items, weapons, armor**, and **gil** | **EXP, gil and items** — and level-ups |
| How many screens | AP/sphere-level panel, and **items get a separate screen**; the spoils appear **after the party has done their victory poses and started walking away** | **one screen**. The wiki flags this as unusual: *"Unlike in the other games in the series, gained items and received EXP is displayed on the same screen."* A **second** screen appears only when a new **Garment Grid or dressphere** was acquired |
| Overkill | **Yes** — Overkill exists, doubles AP and item drops (sometimes 1.5× AP), does **not** affect gil or equipment drops. Threshold is generally 1.5× the enemy's HP | **No Overkill concept** |
| Confidence | `[verified: 2 sources — FF Wiki *Battle Results*; *Overkill (Final Fantasy X)*; §3.8 of `visual-bible.md` already has the victory-pose-then-spoils ordering at 2 sources]` | `[single source — FF Wiki, *Battle Results*]` |

### 5.3 Verdict — "a results card that respects your time"

- **Chain counter: FFX-2 only.** It must not appear in any FFX chapter. Place it where the canon describes it — a popup **on the target being hit**, not a persistent corner HUD element. Cap the display at 99.
- **Results card:** both games have one, and the *canon* difference is structural — FFX splits AP/sphere levels from items across two panels; FFX-2 puts everything on one. Build them as two different cards, not one card with a skin.
- **"Brisk" is a departure, and a well-earned one.** The HD Remaster's FFX-2 results screen is a documented community grievance — a Steam thread titled "X-2: After each battle, takes forever to get past summary", with sixteen replies and a mod workaround. `[single source]` So: keep the canon *content and structure*, cut the canon *duration*, and be honest in the notes that the pacing is `[ours]`.
- FFX's Overkill tag belongs on the FFX card only.

---

## 6. Spherechange (FFX-2 only)

| Fact | Detail | Confidence |
|---|---|---|
| What it is | An animation of the character changing clothes that **interrupts the battle**. She **twirls** while the previous outfit disappears and the new garment manifests on her. **Changing into a *special* dressphere has its own unique animation.** | `[single source — FF Wiki, *Dressphere*]` |
| Modelling note | Nude base models are used underneath the transition; skin is visible during it, and the models carry nothing explicit. | `[single source]` Noted only so the art brief does not have to rediscover why the sequence reads the way it does; **our paintings are original and this is not a thing we reproduce.** |
| During the sequence | The party is **immune to enemy attacks** and **time is halted**. A spherechange can be timed to coincide with an enemy blow to survive it unharmed, though the window is tight and it does not work against cinematic attacks. | `[single source]` |
| Config option | **Spherechanges** is one of the FFX-2 Config entries. Full list: **Spherechanges, ATB Mode and Speed, Cursor, Battle Help, Vibration, Subtitles, Subtitle Names, Guide Map, Sound, Screen Position.** | `[single source — FF Wiki, *Menu (Final Fantasy X-2)*]` |
| What "off" actually does | **The first time a given animation would play, it plays in full regardless of the setting.** Only once you have seen a particular transition does it become instant. And it is per **character** and per **pair of dresspheres**, so every girl must watch every pairing once. | `[verified: 2 sources — FF Wiki *Dressphere* ("the first time is always shown in full"); a Steam HD Remaster thread answered by Karifean, the FFX decompiler whose data the rest of our research corpus is built on]` |
| Origin | The sequence is deliberately modelled on the **magical-girl transformation** of Japanese anime. Dresspheres exist *because* X-2 was never going to have summons and the team wanted something that was appealing both visually and mechanically in their place. | `[verified: 2 sources — PlayStation Blog interview with Yoshinori Kitase (2022-01-05); GamesRadar X-2 developer interview]` |
| Turn cost | **CONFLICT.** The FF Wiki says a spherechange "can be implemented at any time". `research/ffx2-combat-core.md` §4.2 says it is available only on a girl's full-ATB turn, is opened with **L1**, **consumes the whole turn**, and can only reach a destination **one link away on the Garment Grid**. | conflict **P-2**, §10 |

### 6.1 Verdict — "the spherechange gets its moment"

**True to FFX-2 only.** It must never appear in an FFX chapter — and note the deeper reason: spherechange exists *because FFX-2 has no summons*. Aeons and spherechange are the two games' answers to the same design question, which makes them a perfect structural rhyme and a terrible thing to cross-contaminate.

Canon hands us the pacing rule for free, and it is exactly the rule Bailey's instinct wants: **full sequence the first time, instant every time after, with the player able to turn it off in config.** Build the three-state option the game has (`full` / `short` / `off` is our naming; canon's own control is a single Spherechanges toggle plus the always-full-first-time rule) and make the *first* one genuinely worth stopping the battle for. The time-halt and attack-immunity are canon and should be visible: freeze the ATB bars and put a visible invulnerability read on the girl.

---

## 7. Summon sequences and the short-aeon option (FFX only)

| Fact | Detail | Confidence |
|---|---|---|
| The summon | Yuna's **Summon** command. The rest of the party **leaves the battle** — even KO'd allies get up and walk off (and collapse again if they re-enter); petrified allies fade out temporarily. | `[single source — FF Wiki, *Aeon (Final Fantasy X)*]` |
| The arrival | A **glyph** briefly appears on the ground or in the air and **the aeon emerges through it**. The glyphs are circular geometric patterns, **one unique glyph per aeon**, and the same patterns appear in the Zanarkand and Baaj Cloisters of Trials. | `[single source]` — a strong, cheap, high-value art note: **paint a distinct glyph per aeon and reuse it in the room's architecture.** |
| Config option | The FFX Config menu lets the player choose **the full summon sequence or the short sequence**. Setting **Aeons** to **Short** plays each aeon's full **summon and Overdrive** animations **once**, then the short version every time after. | `[verified: 2 sources — FF Wiki *Menu (Final Fantasy X)* ("watching the full summon sequence or the short sequence"); a GameFAQs HD Remaster thread on the "Short Aeon feature", corroborated by a Steam thread answered "There is an option in the menu that skips summon animations"]` |
| Limits | **Enemy** aeons' animations cannot be shortened, and **the sequence cannot be removed altogether**. | `[single source]` |
| Turn-order effect | Summoning **freezes all party members' tick counters** until the aeon is dismissed or defeated (§4.1). | `[single source]` |

**Note the symmetry with §6:** both games ship a "play it in full the first time, then abbreviate" setting for their signature transformation. That is a canon-sanctioned pattern and we should adopt it for **both** — FFX's aeon arrivals, FFX-2's spherechanges — using the same code path and the same wording in our options screen.

**Directly relevant to the new Macalania chapter:** the natural answer to Seymour's Anima is Yuna's brand-new **Shiva**, so that chapter is where a full-length aeon arrival earns its keep most. It is also the chapter where the glyph detail pays: Macalania's fayth is female, the temple is an ice palace, and Shiva's glyph can be carved into the floor the fight is staged on.

---

## 8. Ambient particles, per location

The rule: **pyreflies are not atmosphere, they are a statement about the dead.** Putting them in a room where canon does not put them is a lore error, not a mood choice.

| Location | Chapter | What canon supports | Confidence |
|---|---|---|---|
| **Zanarkand Dome** | Yunalesca | Yes — the Dome is described as an enormous accumulation of **pyreflies**: the dead of Zanarkand and a thousand years of layered summoner memories, functioning much like the Farplane. Memories replay as translucent scenes along the corridors. | `[verified: 2 sources — `research/ffx-yunalesca.md` §location]` |
| **Dream's End** | BFA / Yu Yevon | Yes — the space is **saturated with pyreflies** said to reflect Jecht's own memories, which is why Sin's core looks like a warped Zanarkand. Plus **embers** from the burning Abes emblem. | `[verified: 2 sources — `research/ffx-bfa-yu-yevon.md`]` |
| **The Farplane** | Vegnagun, Shuyin | Yes — pyreflies, and canonically **more** of them after Sin's destruction broke the cycle of sendings. Our own art direction adds rising petals. | `[verified: 2 sources — FF Wiki *Fiend (Final Fantasy X)* citing *FFX-2 Ultimania Omega* p.085]` |
| **Mt. Gagazet** | Seymour Flux | **Snow**, wind, high-altitude cold. No pyreflies are attested on the trail. | `[single source — `research/visual-bible.md` §2.1]` |
| **Macalania — the Woods** | *(not our arena)* | Yes — the Woods are "a magical forest filled with **springs infused with pyreflies**". | `[single source — FF Wiki, *Macalania*]` |
| **Macalania Temple** | **Seymour + Anima (new)** | **Not the same room as the Woods.** The Temple is "a magnificent **ice palace**" built primarily of **ice**, sitting atop the **frozen** Lake Macalania; the region's everlasting cold is sustained by the fayth. Canon gives us **ice, cold light and a frozen lake** — it does **not** put pyreflies inside the temple. | `[verified: 2 sources — FF Wiki *Macalania Temple*; *Macalania*]` |
| **The airship deck (*Fahrenheit*)** | **Evrae (new)** | **Open sky.** Nothing pyrefly-like, nothing snow-like. The atmosphere here is **wind, cloud and altitude**, and the fight's whole identity is distance across open air — Cid moves the ship, and Evrae is rendered small and far when the ship pulls back. | `[verified: 2 sources — FF Wiki *Evrae* (the Pull Back trigger command and the "Evrae in the distance" framing); *Fahrenheit*]` |
| **Chateau Leblanc** | **Leblanc Syndicate (new)** | An **interior** — the old Guado manor in Guadosalam, rechristened by Leblanc, decorated to her taste: the Syndicate is associated with the colour **pink** and **heart motifs**. Indoor dust at most. No pyreflies. | `[single source — FF Wiki, *Leblanc Syndicate*]` |
| **Bevelle Underground** | Bahamut | Machina, not spirits. Our art direction uses **steam**, not motes. | `[single source — `research/visual-bible.md` §2.4, §6.6]` |

### 8.1 Verdict — "air in the arena"

**True to both games, but per-location and never globally.** Ambient particles are correct in six of our nine rooms and wrong in three. The three new chapters specifically:

- **Macalania Temple: ice, not pyreflies.** Cold blue light through ice, frost haze, maybe drifting ice crystals. Save pyreflies for the moment Seymour dies and *cannot* be sent — their conspicuous absence there is the point.
- **Airship deck: wind and cloud, nothing else.** Two cloud layers at different parallax speeds and a wind streak pass will do more for that fight than any mote system, because **distance is the mechanic**.
- **Chateau Leblanc: indoor, pink, heart-motifed, no particles.** This is the one comic chapter; resist atmosphere.

---

## 9. The twelve approved changes — the verdict table

> Read "true to X" as: canon in that game supports it, so build it there. "Not true" means **do not build it there**, per Bailey's instruction. `[ours]` means neither game does it, which is allowed — Pyrefly Reprise has its own shell and its own idiom — but it must be presented to Bailey as ours, never as fidelity.

| # | Approved change | FFX | FFX-2 | Verdict and the one thing that matters |
|---:|---|---|---|---|
| 1 | **Parallax title, silhouette chapter cards** | — | — | **`[ours]`, both.** Neither game has a chapter select; FFX's and FFX-2's own title screens are not a model for ours. Build it once in Ink & Gold and use it for both — but give the FFX cards and the FFX-2 cards different card treatments, because §9/2 applies. |
| 2 | **Animated ink-style interface transitions** | — | — | **`[ours]`, both — but the chrome must stay split.** FFX's UI is navy/gold with a finger cursor and an Act List; FFX-2's is pink/violet with **8 px** corners, a **four-point sparkle cursor**, and no Act List at all (`visual-bible.md` §3, §4). One motion language, two skins. Never show FFX-2 chrome in an FFX chapter. |
| 3 | **Turn-order preview before you commit** | **TRUE** | **NOT TRUE** | **FFX only.** Implement the Act List preview exactly as §4.1 specifies, **including the rank-3 assumption for every other unit** — that assumption is the spec, not an approximation. FFX-2 already answers the same question in canon: the **purple CTIM segment on the ATB gauge** plus the Wait/Active indicator (§4.3). Build that, not a number on the command. |
| 4 | **Arena lighting that changes with boss phases** | — | — | **`[ours]`, both, but only on a canon trigger.** No source describes phase lighting in either game. It is a good idea; hang it on beats canon actually has: Flux crossing 50% HP (Reflect goes up), Mortiorchis's charge ladder, Bahamut's countdown, Seymour summoning Anima, Cid moving the ship. Lighting that changes on *our* invented beats is the failure mode. |
| 5 | **Ambient air particles in the arena** | **TRUE** | **TRUE** | **Both — per room, never global.** See §8. Six of nine rooms yes; **Macalania Temple (ice), airship deck (cloud) and Chateau Leblanc (nothing) are no.** |
| 6 | **Opening camera sweep of the arena** | **NOT ATTESTED** | **NOT ATTESTED** | **`[ours]`, and the weakest of the twelve.** FFX's camera is authored and never player-controlled, and FFX boss fights *inherit the cutscene's framing* rather than re-establishing the room — so a sweep actively fights FFX's grammar. Recommended shape: **FFX — no orbit; hold the cutscene's last framing and settle into the battle master, so the fight feels continuous with the scene. FFX-2 — a short, fast, showy reframe on the cut into battle mode**, which is in the spirit of a game that switches view hard. Mock both before building. |
| 7 | **Glass-shatter battle transition** | **TRUE (random encounters)** | **TRUE (default)** | **Both — and this reverses the brief's assumption.** FFX-2's default opening is also a shatter (§1.2). The real split is: **FFX boss fights out of a cutscene blur instead** `[single source]`, and **Vegnagun's parts implode into a black hole**. Get the right-to-left shard sweep right or it won't read as FFX's. §1.3 has the per-chapter table and the A/B decision Bailey owes a yes on. |
| 8 | **Pyrefly dissolve on defeat** | **TRUE (fiends, unsent)** | **TRUE (fiends, unsent)** | **Both — but it is wrong for four of our eight headline opponents.** Anima is *defeated and then dismissed* (killable, Overkillable — the recall is presentation); human Seymour *leaves a body Tromell carries off*; Evrae *falls out of the sky and survives*; Leblanc, Logos and Ormi *make peace*. And **Mortiorchis needs a death animation built for replay**, not none at all. Ship the `Departure` union plus the `Recurrence` case in §3.3, not a global dissolve. |
| 9 | **Chain counter + brisk results card** | **chain: NOT TRUE** | **chain: TRUE** | **Chain: FFX-2 only** — a popup on the struck target, 2 s window (3 s after a crit), +45% then +5% per hit, capped at 99 for display. **Results: both, but two different cards** — FFX splits AP/sphere levels from a separate item screen and carries Overkill; FFX-2 puts EXP, gil and items on one screen and has no Overkill. **The brisk pacing is `[ours]`** and is justified by a documented community grievance, not by canon. **Both games also speak on victory** (§2.1, §2.2) — and both withhold the celebration when the story is grave: **no poses in Zanarkand** (FFX), **no poses after Bahamut or Shuyin** (FFX-2). Wire the results card so a chapter can suppress the pose. |
| 10 | **Spherechange transformation sequence** | **NOT TRUE** | **TRUE** | **FFX-2 only — never in an FFX chapter.** It exists *because* X-2 has no summons; it is the structural counterpart of FFX's aeon arrival, not a sibling of it. Canon's own pacing rule is the one to copy: **full the first time, instant thereafter, togglable in config**; time halts and the party is invulnerable while it runs. |
| 11 | **Layered parallax backdrops** | — | — | **`[ours]`, both.** Both games are real 3D; parallax layers are our HD-2D idiom, not theirs. Harmless and good — but the *content* of the layers is governed by §8, and on the **airship deck** parallax is doing real work, because Cid's Pull Back genuinely changes the distance to Evrae. Build the Evrae backdrop so the far layer can move. |
| 12 | **Face-detail pass on weak close-ups** | — | — | **`[ours]`, both — production quality, no canon axis.** One caveat that is canon: FFX-2 gives **each character a distinct portrait per dressphere**, so a face pass on the X-2 cast is a pass on *sets* of faces, not three faces. Budget accordingly. |

### 9.1 The four other items from Bailey's list, mapped

| Bailey's phrasing | Maps to | Verdict |
|---|---|---|
| "The interface stops cutting and starts moving" | #2 | `[ours]`, both, two skins |
| "The queue answers before you commit" | #3 | **FFX only** |
| "The arena turns when the boss does" | — | **FFX-2 leans further into this than FFX does.** FFX-2 has **free battle positions**: a physical ability performed **behind** a target hits for **double damage** `[single source — FF Wiki, *Active Time Battle*]`. FFX has fixed formations and no positional rule. So: a turning arena is *mechanically* meaningful in FFX-2 and *purely cinematic* in FFX — and in FFX it must not imply a facing rule the engine does not have. |
| "Show me the room before you ask me to fight in it" | #6 | `[ours]`; see the recommended per-game shape |

---

## 10. Conflicts recorded

| ID | Conflict | Resolution |
|---|---|---|
| **P-1** | `visual-bible.md` §3.8 specifies FFX's battle-start transition as a **polar swirl** (tagged `[estimate]`) with the shatter as its third step, and reads the Vegnagun note as a contrast against a swirl. | **The swirl is unsupported.** No source in either game describes one. FFX's attested transitions are a **shatter** (random) and a **blur** (boss out of cutscene); FFX-2's attested default is a **shatter**. `visual-bible.md` §3.8 should be revised — flagged here rather than edited, because this document is only allowed to write one file. |
| **P-2** | Spherechange "can be implemented at any time" (FF Wiki, *Dressphere*) vs. "only on a full-ATB turn, opened with L1, consumes the whole turn, destination one Garment Grid link away" (`research/ffx2-combat-core.md` §4.2, itself `[verified: 2 sources]`). | **Keep `ffx2-combat-core.md`.** It is the more specific and better-sourced claim, and `visual-bible.md` §4 already recorded the same supersession. The wiki's "any time" most likely means "any of her turns, without needing a separate command slot", not "asynchronously". Presentation consequence is nil: either way the sequence halts time and grants invulnerability. |
| **P-3** *(rewritten — the original statement of this conflict was factually wrong; see §14, FC-1)* | The owner's brief describes the Leblanc chapter as "three-on-three… fought at low level with starter dresspheres, so it doubles as the X-2 tutorial chapter". **Canon, corrected:** Leblanc is fought **three** times — **twice** with Logos and Ormi, **once** alone. (1) **Floating Ruins**, Mt. Gagazet, **Chapter 1**, Leblanc **Lv 5** / 120 HP, a true **3-v-3**, her abilities **Love Tap + Sonic Fan**, and Ormi and Logos carry **no special abilities at all**; **no No Love Lost**. (2) **Luca**, **Chapter 1**, Leblanc **alone**, Lv 5, ability **Thunder**. (3) **Chateau Leblanc**, **Chapter 2** (not "Chapter 3-ish"), Leblanc **Lv 23** / 1,380 HP, a **3-v-3** that adds **No Love Lost** on an **[8x − 5]-turn** counter, plus Mach Fan, Not-So-Mighty Guard, Fira, Osmose, White Wind. | **The dilemma I originally posed does not exist.** A genuine 3-v-3 at a genuinely low level *already exists in Chapter 1*; the real trade is **Floating Ruins (low level + 3-v-3, but no signature gag moves)** vs **Chateau (3-v-3 + every gag move + No Love Lost, at Lv 23)**. **Now resolved elsewhere**: `research/ffx2-leblanc-syndicate.md` §1.4 independently reached the corrected canon and chose the **Chateau Last Room, Chapter 2**, as a **three-act mission** (Entrance → Logos' Room → Last Room), on the grounds that the gag moves cannot be back-ported to Chapter 1 without inventing game data, while the "tutorial" goal is recoverable through presentation. **Presentation consequences of that choice, which this document is responsible for:** the arena is the **Chateau interior** (pink, heart motifs, no particles — §8), the canonical party really is the three starter dresspheres, and the chapter needs **three** battle transitions, not one. |

---

## 11. Open questions — things I could not establish, and did not guess

1. **What FFX-2's battle transition looks like in detail.** I have only the FF Wiki's *contrastive* sentence on the Vegnagun page — that the rest of the game opens with "the screen shattering and the view switching to battle mode". I could not find a direct description: **how long it runs, whether the shards behave like FFX's right-to-left sweep or differently, and whether there is a colour/flash treatment distinct from FFX's white flash.** Someone must watch footage before the FFX-2 transition is authored. **[absence]**
2. **Whether FFX-2 has a party entrance animation at the start of battle**, and what it is per dressphere. Victory poses are well documented per dressphere; entrances are not. **[absence]**
3. **Whether FFX has any opening camera move at the start of a battle at all**, and whether boss fights differ from random ones. Only two facts are sourced: the camera is not player-controllable, and it reframes constantly during actions. **[absence]**
4. **Whether the FFX boss "slight blurring" claim survives a second source.** It is the pivot of §1.3 and it currently rests on TV Tropes alone. Worth ten minutes of footage on the Macalania Seymour fight and the Evrae fight specifically, since those are two of the three new chapters. **[single source]**
5. **Exact durations, in seconds, for any of it** — shatter, spherechange (full and short), aeon summon (full and short), results card. Every timing in `visual-bible.md` §3.8 is `[estimate]` and nothing I found upgrades them. If Bailey wants canon-accurate pacing rather than good pacing, these need measuring off footage frame by frame.
6. **Whether Macalania Temple's interior shows any drifting light motes.** Canon gives me ice, a frozen lake and a female fayth, and puts the pyreflies in the Woods' springs — a different location. The temple's own ambience is unattested. Defaulting to ice, per §8. **[absence]**
7. **What the FFX-2 Config "Spherechanges" entry's actual option labels are.** The wiki names the entry but not its values; `full / short / off` in the brief is our naming, and the one behaviour that *is* sourced (always full the first time) is not a third option, it is an override on all of them. **[single source for the entry, absence for the values]**
8. **Whether FFX-2's chain counter has a canonical on-screen position.** Sourced: it pops on screen while a unit is being hit. `visual-bible.md`'s x430/y70 placement is `[estimate]`. **[absence]**
9. **Whether anything in FFX-2 previews action *order*.** Still nothing found, and nothing denying one. Treated as absent — but note this question was previously conflated with "previews action *cost*", which FFX-2 **does** have and which I had wrongly written off: that is the **purple CTIM bar** (§4.2, §4.3). Only the ordering question is open. **[absence]**
10. **P-3 above — resolved elsewhere, and reopened narrowly.** Which Leblanc battle the chapter recreates is settled (`ffx2-leblanc-syndicate.md`: Chateau Last Room, Ch. 2, three-act mission). What remains open *for presentation* is whether the three acts share one arena dressing and one results card or get three, and whether the two non-final acts suppress the victory pose.
11. **Whether the FFX-2 "no victory pose after Bahamut / Shuyin" rule has a visible substitute** — i.e. whether the girls hold a stance, turn away, or the results card simply appears over an unposed party. Canon states the suppression; it does not describe what is shown instead. The FFX Zanarkand rule *is* described ("keep their battle stance"), so we have a model, but applying it to FFX-2 would be `[ours]`. **[absence]**
12. **The exact colour and geometry of the purple CTIM segment** — whether it overlays the green bar, replaces it, or extends it. `ffx2-combat-core.md` gives the colour semantics but not the drawing. Needs footage before the FFX-2 HUD is finalised. **[absence]**

---

## 12. Sources

**Final Fantasy Wiki** (fetched via `https://finalfantasy.fandom.com/api.php?action=parse&page=<title>&prop=wikitext`, 2026-09-19; browser User-Agent required):
*Haste (Final Fantasy X-2 status)* (the four-phase ATB pipeline, the ~5% rate, the red gauge, Haste-sped victory poses) · *Leblanc (boss)* (all three encounters' infoboxes, the three battle sections and the three AI scripts) · *Final Fantasy X battle system* · *Rank (Final Fantasy X)* (which itself cites *Final Fantasy X Ultimania Omega* p.396) · *Active Time Battle* · *Chain (term)* · *Dressphere* · *Menu (Final Fantasy X)* · *Menu (Final Fantasy X-2)* · *Battle Results* · *Overkill (Final Fantasy X)* · *Final Fantasy X victory poses* · *Final Fantasy X-2 victory poses* · *Aeon (Final Fantasy X)* · *Anima (Final Fantasy X boss)* · *Fiend (Final Fantasy X)* (citing *Final Fantasy X-2 Ultimania Omega* p.085) · *Unsent* · *Pyrefly* · *Seymour Guado* · *Macalania Temple* · *Macalania* · *Macalania Woods* · *Evrae* · *Guado Guardian* · *Fahrenheit* · *Leblanc* · *Leblanc Syndicate* · *Vegnagun* · *Machina* · *Final Fantasy X-2*

**Other:**
- TV Tropes, *Fight Woosh* — the two-FFX-transitions claim (shatter for random fights, blur for bosses on the cutscene's own background). https://tvtropes.org/pmwiki/pmwiki.php/Main/FightWoosh
- `cognoscola/screen_break_effect` (GitHub) — a reimplementation of the FFX shatter; two-stage behaviour, white flash, black field behind the glass.
- `EveraldoSembiring/Final-Fantasy-X-Battle-Transition` (GitHub) — the right-to-left shard release, quoted from its README.
- PCSX2 issue #8936, "REGRESSION: Final Fantasy X glitched screen shatter effect" — independent confirmation that the effect is a screenshot-textured shatter at battle start.
- Steam, FFX/X-2 HD Remaster discussions: "Is it possible to get rid of Shattering Glass screen?" (transition + its sound) · "How does one properly disable the dressphere change animation?" (answered by Karifean) · "Summon Animation and other animations." (the short-aeon config option) · "X-2: After each battle, takes forever to get past summary" (results-screen pacing) · "moving camera during combat." (camera is not player-controllable)
- GameFAQs, FFX / X-2 HD Remaster boards: the "Short Aeon feature" thread; the battle-camera-angles thread.
- PlayStation Blog, Yoshinori Kitase on FFX and X-2, 2022-01-05 — the magical-girl origin of the spherechange sequence (cited from the wiki's *Dressphere* references).
- GamesRadar, *Exclusive interview: Final Fantasy X-2* — dresspheres designed to fill the space summons would have occupied.
- Local corpus: `research/visual-bible.md` §2.1–2.5, §3.8, §4, §6.6 · `research/ffx-seymour-flux.md` · `research/ffx-yunalesca.md` · `research/ffx-bfa-yu-yevon.md` · `research/ffx2-bahamut.md` · `research/ffx2-combat-core.md` §4.2 · `research/assets-and-tech.md` §2A.

---

## 13. Verification log

| Claim | How it was checked | Outcome |
|---|---|---|
| FFX battle start shatters | Three independent sources (TV Tropes; Steam thread whose subject *is* the effect; PCSX2 issue naming it) | **Upheld, `[verified: 2 sources]`** |
| FFX boss battles blur instead | Searched for a second source four different ways; every hit traced back to TV Tropes | **`[single source]`, listed as open question 4** |
| FFX-2 also shatters | Derived from the FF Wiki *Vegnagun* sentence's contrastive structure; no direct description found | **`[single source]`, listed as open question 1** |
| `visual-bible.md`'s "swirl" | Searched specifically for a polar/spiral FFX transition; nothing found in any source | **Refuted as unsupported; recorded as conflict P-1** |
| CTB preview assumes rank 3 for everyone else | Quoted verbatim from FF Wiki *Rank*; the page's rank concept cites *Ultimania Omega* p.396 | **Upheld, `[single source]` but high confidence** |
| ~~Anima is dismissed, not killed~~ | Originally read off the ability list alone | **OVERTURNED 2026-09-19.** The same page's lead and strategy section say she *is* defeated, and her stat block carries an Overkill threshold. She is killed; the dismissal is the presentation. See §14, FC-2 |
| Mortiorchis has "no death state" | Originally read from the "never leaves the field" conclusion in `ffx-seymour-flux.md` | **OVERTURNED 2026-09-19.** The cited document says its HP *does* reach 0 and Mortibsorption fires each time. It has a **repeating** death, not none. See §14, FC-3 |
| Spoken victory lines are an FFX-2 thing | Originally inferred from the FFX-2 victory-pose page alone, without reading the FFX one | **OVERTURNED 2026-09-19.** FFX is the series' first voiced game and its characters exclaim on victory too. See §14, FC-6 |
| FFX-2's ATB gauge is one bar at a fixed fill rate | Re-checked against the FF Wiki *Haste (FFX-2 status)* mechanics section and our own `ffx2-combat-core.md` | **PARTLY OVERTURNED 2026-09-19.** "Agility shortens the bar" is upheld and upgraded to `[verified: 2 sources]`; "the rate is fixed" and "it is one bar" are both wrong. See §14, FC-4 |
| Human Seymour leaves a body | Two wiki pages independently describe Tromell carrying the body away and refusing the sending | **Upheld, `[verified: 2 sources]`** |
| Evrae does not die | The *Evrae* page states it falls from the skies "seemingly beaten" and returns later as Evrae Altana | **Upheld** |
| Spherechange-off still plays unseen animations | FF Wiki *Dressphere* and a Steam answer from Karifean agree, independently | **Upheld, `[verified: 2 sources]`** |
| FFX "Aeons: Short" config | Wiki *Menu (Final Fantasy X)* plus two community threads | **Upheld, `[verified: 2 sources]`** |
| Macalania Temple has pyreflies | Checked — the pyrefly-infused springs are in the **Woods**, a different location; the Temple is described only as ice | **Not supported; do not paint pyreflies in the temple** |
| FFX-2 has a turn-order preview | Searched; nothing describes one, and FFX-2 has no Act List | **Treated as absent; do not build.** But note the distinction I originally missed: FFX-2 has no *order* preview, yet it does have a *cost* preview — the purple CTIM bar (§4.2, §4.3, §14 FC-5) |
| Leblanc's encounter list | Re-fetched the *Leblanc (boss)* page in full: lead, three infobox stat blocks, three battle sections, three AI scripts | **Revision 1 was wrong — three encounters, not the two I described; the Floating Ruins 3-v-3 was missed; the Chateau fight is Ch. 2, not 3.** See §14, FC-1 |
| Victory lines and Haste-sped poses are FFX-2 traits | Read both victory-pose pages side by side, which revision 1 did not do | **Both are true of both games.** See §14, FC-6 and FC-7 |

---

## 14. Fact-check log — revision of 2026-09-19

An independent fact-check pass was run against the first revision of this document. **Seven findings were raised; I re-fetched every cited source myself and six were upheld outright, one was upheld in part.** All corrections are applied above. Nothing was corrected on the fact-checker's authority alone — each row below records what I personally read.

| ID | What the document said | Verdict | What it says now | Source I re-read |
|---|---|---|---|---|
| **FC-1** | §10 P-3: the 3-v-3 with No Love Lost is the Chateau fight "(Chapter 3-ish)", the Chapter 1 Luca encounters are Leblanc in disguise with Goons / Ormi + Logos / Leblanc alone — and therefore a true 3-v-3 costs you the low level band. | **UPHELD. Two factual errors and one invented dilemma — the most consequential failure in the document, because it governed the design of a brand-new chapter.** | P-3 rewritten in full. Leblanc is fought **3×**: Floating Ruins (Mt. Gagazet, **Ch. 1, Lv 5**, 3-v-3, Love Tap + Sonic Fan, **no** No Love Lost, Ormi and Logos with no special abilities); Luca (**Ch. 1**, alone, Thunder); Chateau Leblanc (**Ch. 2**, **Lv 23**, 3-v-3, adds No Love Lost on an **[8x − 5]**-turn counter). The Floating Ruins encounter had been missed entirely, and the Chateau fight is Chapter **2**, not 3. **A true low-level 3-v-3 exists in Chapter 1, so the trade I claimed canon imposed is not imposed by canon.** The real trade is mirror-match-with-gag-moves vs mirror-match-at-low-level, and `research/ffx2-leblanc-syndicate.md` §1.4 has since resolved it in favour of the Chateau. | `https://finalfantasy.fandom.com/wiki/Leblanc_(boss)` — lead sentence ("fought three times: twice with Logos and Ormi in the Floating Ruins and Chateau Leblanc, and once on her own in Luca"), all three infobox stat blocks (chapter / level / abilities), the three Battle sections and all three AI scripts. Fetched via `api.php?action=parse&prop=wikitext`, 2026-09-19. |
| **FC-2** | §3.1, §3.2, §9 row 8: Anima at Macalania "is dismissed by Seymour, not killed… She is recalled, not destroyed", with the engine instruction "Do NOT: kill her; dissolve her; end the battle on her." | **UPHELD.** I had overread a single ability-list entry ("Seymour dismisses Anima!") into a mechanical rule the same page contradicts twice. | Anima is **defeated normally** — HP to 0, canonically by Shiva — and the **departure is presented** as a recall rather than a death or a pyrefly dissolve. The `'dismissed'` Departure value survives as a *presentation* value; "do not kill her" is gone, replaced by "defeat normally, present as dismissal, do not end the battle on her". §3.3 now says in the type comments that this is presentation only, because an engine built to the old instruction would ship a non-defeatable actor. | `https://finalfantasy.fandom.com/wiki/Anima_(Final_Fantasy_X_boss)` — lead ("After she is defeated, the battle against Seymour will continue"), Strategy ("one needs simply attack until Anima is dismissed"), and the Macalania stat block, which gives **18,000 HP, Overkill 1,400, 2,500 AP** — values that only exist for a defeatable enemy. |
| **FC-3** | §3.2: Mortiorchis "has no death state in this encounter at all"; "Do NOT write a death animation for it." Tagged `[verified: 2 sources]` against our own Seymour Flux research. | **UPHELD, and it contradicted the document it cited.** Following the old instruction would have deleted the fight's most distinctive recurring beat. | Mortiorchis gets a **repeatable** kill → drain → re-form presentation: when its HP hits 0 it immediately uses **Mortibsorption**, dealing damage equal to its own *current max* HP to Seymour Flux and healing itself by the same amount, after which its max HP drops 1,000 for the next cycle — **4,000 / 3,000 / 2,000 / 1,000 / 1,000 …**, floored at 1,000. What it must **not** have is a *terminal* death. Added as a `Recurrence` case in §3.3. | `D:/Final Fantasy/research/ffx-seymour-flux.md` §2.2 (the Mortibsorption derivation; the correction box; the clamp instruction `maxHp = max(1000, maxHp - 1000)`), which itself cites the FF Wiki *Final Fantasy X enemy abilities* master table ("1,000 HP onward") and *Mortibody* ("caps at 1,000"). |
| **FC-4** | §4.2: "The ATB gauge is a bar under each girl's HP and MP… **Agility sets the bar's length and the fill rate is fixed**." Tagged `[single source — StrategyWiki]`. | **UPHELD IN PART — and the surviving half was under-tagged, not over-tagged.** "Agility shortens the bar rather than speeding the fill" is **correct** and is `[verified: 2 sources]` in our own corpus, so I have upgraded it rather than dropping it. The fact-checker was right that **"the rate is fixed" is wrong** and that **"one bar" is wrong** — and the second error was the expensive one, because it erased three HUD states the FFX-2 chapters need. | §4.2 rewritten as a **four-phase pipeline with a state colour**: green fill (length set by Agility, by dressphere, and by gauge-shortening abilities) → command input → **purple CTIM charge** → execution + optional recovery; the gauge renders **red** under Haste, **gold** under Slow, **white** under Stop. Rate is modifiable: **Haste ≈ +5%**, Slow halves it and doubles CTIM, damage perturbs it. | `https://finalfantasy.fandom.com/wiki/Haste_(Final_Fantasy_X-2_status)` §Mechanics (the "ATB Green Bar" / "ATB Purple Bar (charging)" / execution / "Recovery" sequence; "quickens the ATB charge rate by about 5%"; "abilities that shorten the ATB gauge"; red gauge). Cross-read with `research/ffx2-combat-core.md` §0, §1.1, §1.2 and §9 (the gauge colour table). |
| **FC-5** | §4.3: the FFX-2 equivalent of the turn-order preview "is: show the charge time of the highlighted command on the command itself… That is a smaller promise, and it is the one FFX-2 actually makes." | **UPHELD, and it is the failure mode this document warns about elsewhere.** I invented a HUD element to replace one the game already ships, which both under-credited canon and handed the team an `[ours]` element mislabelled as fidelity. Our own `ffx2-combat-core.md` had the answer the whole time. | The canon FFX-2 answer to "tell me the cost before I commit" is the **purple CTIM segment on the girl's ATB gauge**, plus the **Wait/Active indicator**. Build that. A number printed on the command is optional `[ours]` garnish **on top**, never "the equivalent". §9 row 3 updated to match. | `https://finalfantasy.fandom.com/wiki/Haste_(Final_Fantasy_X-2_status)` (the purple charging phase); `research/ffx2-combat-core.md` §1.1, §1.3 and §4.2 — the last of which notes spherechange has "no MP cost and **no charge bar**", which presupposes that other actions do. |
| **FC-6** | §2.2 listed spoken victory lines under **FFX-2 only**, while §2.1's FFX bullets omitted them. | **UPHELD. A mis-assignment, not a difference** — and under Bailey's rule a mis-assignment withholds a real FFX behaviour from the FFX chapters. | Spoken victory lines are **true to both games**. The genuine FFX-2 differences are that the **pose varies per dressphere** (rather than one per character), that the **line varies by story point and win condition**, and the **suppression rules** — a girl will not pose while speaking a victory quote, while dancing, while asleep, or sometimes at low HP. | `https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_victory_poses` ("the first game in the series to have voice acting, and thus the characters also exclaim various things when they win a battle"); `https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_victory_poses`. |
| **FC-6a** | *(not raised by the fact-checker — found while verifying FC-6 and FC-7)* Neither §2.1 nor §2.2 recorded the cases where canon **withholds** the victory celebration. | **NEW, and it lands on three of our eight chapters.** | **FFX: nobody poses in Zanarkand** — party and aeons keep their battle stance, deliberately, because of Yuna's impending fate. That is our **Yunalesca** chapter. **FFX-2: no victory pose at all after Bahamut or after Shuyin.** Those are two of our three FFX-2 chapters. Both games use the same device — suppress the celebration when the story is grave — so the results card needs a per-chapter "suppress pose" flag, and §9 row 9 now says so. | The same two victory-pose pages: FFX ("When the party arrives at Zanarkand, no one will pose, but keep their battle stance… The aeons also do not pose while in Zanarkand"); FFX-2 (§"When victory poses are not used"). |
| **FC-7** | §2.1, under **FFX**: "If a character has Haste at the end of battle, their victory-pose animation plays sped up — a lovely, cheap fidelity detail." | **UPHELD. Same error shape as FC-6**: a behaviour both games share, filed in one game's column, in a document whose entire purpose is to isolate differences. | Haste-accelerated victory animation is **true to both games**. In FFX-2 it is part of a broader rule: Haste speeds up that unit's animations generally — attack animations and **casting** animations, though **not** the spell animations themselves — and turns her gauge red. | `https://finalfantasy.fandom.com/wiki/Haste_(Final_Fantasy_X-2_status)` ("their animations are sped up, even victory poses"; the casting-vs-spell-animation distinction in §Mechanics); `https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_victory_poses`. |

### 14.1 What this pass changed about how the document should be read

Three of the seven findings (FC-2, FC-6, FC-7) are the same mistake: **reading one line of one page and promoting it to a rule**, in FC-2's case a rule that contradicted the rest of the page it came from. Two more (FC-4, FC-5) are the same mistake in a different direction: **failing to read our own corpus**, which already held the better answer. The document's own confidence tags did not catch any of them, because the errors were not in the sourcing — they were in the inference drawn from a correctly cited source.

Practical consequence for whoever reads this next: **where this document states an engine instruction in the imperative ("Do NOT…"), check that the instruction follows from the quoted fact and not from my gloss on it.** Four of the seven findings were imperatives that outran their evidence.

### 14.2 Tags changed in this revision

| Claim | Before | After |
|---|---|---|
| Anima's departure | `[single source]`, stated as "not killed" | `[verified: 2 sources]`, stated as "defeated, presented as dismissal" |
| Mortiorchis has no death state | `[verified: 2 sources]` (miscited) | **withdrawn**; replaced by the repeating-death cycle, `[verified: 2 sources]` |
| FFX-2 ATB: Agility sets bar length | `[single source — StrategyWiki]` | `[verified: 2 sources]` (`ffx2-combat-core.md` §0, §1.2) |
| FFX-2 ATB: fill rate is fixed | `[single source]` | **withdrawn** — Haste ≈ +5%, Slow halves, damage perturbs |
| FFX-2 charge time is surfaced on the gauge | *(absent — I had it as a gap to fill with an invention)* | `[verified: 2 sources]` |
| Spoken victory lines | implicitly FFX-2 only | **true to both**, `[verified: 2 sources]` |
| Haste speeds the victory pose | `[single source]`, FFX column | **true to both**, `[verified: 2 sources]` |
| Victory poses suppressed in Zanarkand / after Bahamut and Shuyin | *(absent)* | `[single source]` each, both newly added |
| P-3's "either low level or 3-v-3" dilemma | stated as canon | **withdrawn as false**; corrected encounter list `[verified: 2 sources]` |
