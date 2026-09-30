# BATTLE CAMERA — PERSONA 5 and PERSONA 5 ROYAL (Atlus)

**Target project:** Pyrefly Reprise (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Request (relayed by the main session, 2026-09-30):** after reviewing 25 camera-angle mockups of the battle screen, Bailey asked to see in detail how Persona 5 (Atlus, 2016) and Persona 5 Royal (2019; Steam/PC and consoles October 2022) frame their turn-based battles, and what Royal changed or added.
**This document is sourced research only.** It does not pick a camera for Pyrefly and it makes no recommendation (hard rules 9 and 10). No retail frame, screenshot or model is stored in the repo (rule 8); frames were viewed once for verification and deleted.
**Research date:** 2026-09-30. Data twin of this note: `research/battle-camera-persona5.json` (same shots, same tags, for the page builder).
**Game case (AGENTS.md rule 14):** reference material about *other* games' camera solutions. It applies to **both** FFX and FFX-2 decisions equally; nothing here is FFX or FFX-2 game data. The corpus row it refines is `research/battle-camera-perspectives.md` §C ("Persona 5 Royal: party lined up, dynamic angles"): the frames below show the active character alone in the left third, not a lined-up party.

**How to read the tags.** `[verified: N sources]` means N independent sources or observations agree. `[single source]` means one page or one video. `[observed: <video> m:ss]` means I saw the moment in a decoded frame of that upload (1280x720 for most; 640x360 for the Take Over trailer and 854x480 for Change The World). `[derived]` is my reading of observed frames. `[not found]` means searched for and absent. Camera height, angle and lens are eyeballed from frames: **no source publishes Persona 5's battle-camera parameters**.

**Method in one paragraph.** Text claims come from pages I opened (numbered Sources at the end). Camera claims come from official uploads (ATLUS Japan "atlustube", Official ATLUS West), read at 0.2 to 1 s steps with headless Chromium and YouTube storyboards; a frame was drawn through a canvas, viewed, and deleted. Phases that no official upload shows (negotiation screens, the base-game Baton Pass, the 1 MORE title, an enemy skill, the Gun ring) were observed in two **unofficial** captures (S9, S10); those are cited as observation only and are never offered as watch links. Several official trailers are age-gated on YouTube and could not be viewed without signing in (listed in §E).

**Two naming notes.** The Japanese build calls Baton Pass "Baton Touch" (バトンタッチ), All-Out Attack "総攻撃" and Showtime "SHOW TIME". One correction to the request's own wording: the character **eyes strip** is the *weakness cut-in* that plays on the cast (S11, and observed), not the 1 MORE title; 1 MORE is a large white typographic title that follows the knockdown (§A.8).

---

## One-screen summary

**The core idea:** a near-static, low, wide, rear-side poster shot of the acting character (left) facing the enemy (right), with the whole menu pinned to the character as a fan of labels; every commit then hard-cuts to a short cutaway or a flat 2D graphic set piece, so a turn plays like edited anime and manga panels rather than a tracking camera.

| Phase | Where the camera sits and what fills the frame | Hold | Royal | Confidence |
|---|---|---|---|---|
| Battle start (ambush) | Behind Joker's shoulder against the target, dark leap cut-in, red-black ink wipe, shard wipe into the idle shot | about 9 s | changed (grappling-hook strike, same ink wipe) | [observed: S1 3:33-3:49], [single source] for Royal entry |
| Command select | Behind-left of the actor, actor in left third, enemy right of centre, hip height, wide, zero drift; label ring on the actor's hand; HP cards bottom-right | until input | same | [verified: 3 sources] |
| Skill / Persona list | Same scene dimmed, Persona as a huge foreground silhouette lower-left, list over the left half | until input | same | [observed: S1 3:57; S7 0:38] |
| Target select, Analyze | Camera stays; red reticle hops; 0.2 s red-ray confirm flash; Analyze is a desaturated cut to a full-screen enemy page | flash 0.2 s | same | [observed: S1 3:57.4] [unofficial for Analyze] |
| Gun | Camera stays; ring re-forms with an ammo counter; close side-on pistol cutaway | shot about 1 s | same (ammo refills after battle) | [observed: S2 0:06-0:08] [unofficial for the ring] |
| Persona cast | Ground-level Persona in blue flame, then wide three-quarter impact with skill banner top-left | about 4.6 s to first hit | same | [observed: S1 3:57-4:06; S7 0:39] |
| Melee attack | Low side-on lunge, black-and-white ink splash on impact | 1.5 to 2.5 s | same | [observed: S2 0:05; S1 4:20] |
| Weakness / crit / 1 MORE | Eyes-strip cut-in, WEAK burst, knockdown, white 1 MORE title, ring returns with a BATON PASS tag | 8 to 10 s cast to next command | same | [verified: 2 sources] eyes strip; 1 MORE [unofficial] |
| Hold Up | Whip-pan, HOLD UP! typography, thieves ringed around the downed shadows, close to the floor, tilted during the burst | burst 1 s, then until input | same | [verified: 3 sources] |
| All-Out Attack | 3D dropped: comic face card, silhouette brawl on flat red, pose, per-character finish card | about 7 s + 1.3 s card | same (Futaba can finish) | [verified: 4 sources] |
| Negotiation | Hold-up tableau dimmed, follow-spot on the shadow, face crop with slanted answer boxes | until input | same (not observed) | [unofficial], [not found] official |
| Baton Pass | Party-facing reverse shot for the choice, black-void two-shot for the pass, radial burst | pass 2 to 2.5 s | changed (rank card, zero-cost fourth pass) | [verified: 3 sources] |
| Enemy turn | Same skill banner top-left, front close-up of the enemy, navigator comments | about 2 s | same (not observed) | [unofficial], low confidence |
| Victory / results | Low tilted hero portrait, then RESULT / EXP / MONEY / ITEM cards over the scene | pose 4 s, cards 4 s | same (partly observed) | [observed: S1 4:22; S2 0:21] |
| Showtime | A bespoke cutscene stage per pair, pattern borders, HUD off, Options to skip | about 16 s | **new** | [verified: 5 sources] |

---

## Camera grammar (derived from the frames below)

1. **Two modes only.** A stable hero shot that holds indefinitely while the player thinks, and short authored cutaways (about 0.3 to 5 s) on every commit. `[derived]`
2. **While a menu is open the camera does not move; the UI moves.** The ring fans out from the actor's hand, the list slides in, the reticle hops. Background shift across 4 s and 19 s of command select measured 0 px by phase correlation. `[observed: S1 3:52-3:56; S9 1:40-1:59]`
3. **Every cut lands under a graphic beat:** ink wipe, shard wipe, typographic burst (WEAK, 1 MORE, HOLD UP!, BATON PASS!), comic panel. The graphic hides the cut and stands in for a sound effect. `[derived]`
4. **The camera is always on the action's owner or its victim,** never on a neutral master shot; the party cards stay pinned bottom-right through 3D cutaways and vanish only in the 2D sequences and Showtime. `[observed]`
5. **The climaxes leave the 3D scene:** All-Out Attack becomes a flat red plane of silhouettes; Showtime becomes a purpose-built cutscene stage. `[observed]`
6. **Intent, in the makers' and imitators' words:** Hashino describes turn-based battle as something that should fit "part of a cutscene's composition" using the cut-and-paste method of anime and manga (S27); Sandfall's creative director describes what stuck with him as the camera shifting dramatically with each action, like watching a movie (S28, S29).

---

## A. Phase by phase

### A.1 Battle start: ambush, ink wipe, shard reveal  (Royal: changed)

- **Camera.** In the field the camera is third-person behind Joker. On the ambush strike it jams in behind his shoulder against the target, cuts to a dark starfield cut-in of Joker mid-leap (red glove, 3:36-3:38), then to extreme close-ups of the target (3:40-3:42). The battle intro is a red-glow shot from just behind Joker's hip looking up at the boss (3:45-3:48). A white crack and a black-and-white shard wipe (3:48) reveal the normal command shot (3:49). Waist to chest height, wide lens, hard cuts only; there is no fly-in over the arena. `[observed: S1 3:27-3:49]`
- **Frame.** Ink-black and red shapes, the enemy silhouette, the casino's VICTORY sign swinging through the background as a montage element. The party cards are hidden. In the English build the title AMBUSH! bursts over the impact with a red ink splash for about 1 s and the fight is at the command shot 2 s later. `[observed: S9 1:03-1:06, unofficial]`
- **Timing.** About 9 s from strike to command shot (3:40 to 3:49).
- **Why it reads premium.** The transition is graphic design, not camera motion: ink shapes cover the cut, so the player arrives at the stable shot with momentum and never watches a load. `[derived]`
- **Royal.** The grappling hook (new in Royal) lets Joker strike a shadow from range; the ATLUS Japan Royal clip shows a CHANCE! title at 1:04, an ink burst at 1:05-1:06 and the command shot at 1:07. The ink-wipe style is the same. `[observed: S4 0:56-1:07]` `[single source]` for the caption that this is a preemptive strike on distant shadows.
- **Watch.** S1 3:33 (smirk close-up, leap cut-in 3:36); S1 3:42 (ink wipe to shard reveal); S4 0:59 (Royal wire strike).

### A.2 Command select: the rear-side poster shot  (Royal: same)

- **Camera.** Behind and to the left of the acting character, who stands in the left third in three-quarter rear view; the enemy stands right of centre, facing back. About 50 degrees off the party-to-enemy line, hip to waist height, tilted slightly up, wide lens, mid-close (the actor is about half the frame height, the boss taller). **No movement:** the background did not shift by one pixel between 232 s and 236 s, nor between 100 s and 119 s in another capture; only idle animation and UI motion move. `[observed: S1 3:52-3:56; S9 1:40-1:59]`
- **Frame and HUD.** A fan of angled black label plates with red slashes (GUN, PERSONA, ITEM, SWORD, GUARD; ORDER as well when the party has more than one member) hangs off the actor's hand and hip and points at the enemy. A red target marker with a heart icon sits on the enemy. Enemy name-and-level plate top-left; navigator speech bubble with portrait top-right; one to four slanted HP/SP cards bottom-right (a solo fight shows one); five button hints bottom-left (Analyze, Target, turn-order or status check, Rush, Assist) in the same order with the same icons in base and Royal frames. `[observed: S1 3:52; S3 1:16; S4 1:07]`
- **Timing.** Holds until input; no orbit, no drift.
- **Why it reads premium.** The composition is the menu: hero left, enemy right, UI in the space between, so the screen reads as a poster and the eye travels hero to enemy. Because the shot is static the ring, not the camera, does the animating. `[derived]` A design write-up makes the same observation: character left, monster right so the scene is not disturbed by the menu, and every button a long triangle pointing at the acting character. `[single source: S22]`
- **Royal.** Identical framing, ring and HUD placement. `[verified: 3 sources]`
- **Watch.** S1 3:52 (solo, one card); S3 1:16 (four members, ORDER plate).

### A.3 Persona summon and skill select  (Royal: same)

- **Camera.** Choosing PERSONA cuts to a view behind the hero's Persona, drawn as a huge dark-blue silhouette with chains filling the lower-left foreground; the enemy stays right of centre, dimmed to roughly a third of its brightness. Low camera, wide lens; the list slides in over the left half in under 0.6 s and the frame then holds. `[observed: S1 3:57; S7 0:38 (Royal, list over Kamoshida)]`
- **Frame.** PERSONA sticker header with a mask icon top-left, a Persona name box, rows with a red highlight bar and SP or HP costs, help text bottom-left, party card bottom-right. The game flags which listed skills hit a known weakness (S11).
- **Why it reads premium.** The unsummoned Persona is already in the shot as a silhouette, so the menu promises the reveal before it happens. `[derived]`
- **Watch.** S1 3:57; S7 0:38.

### A.4 Target select and Analyze  (Royal: same)

- **Camera.** The command shot stays. Choosing a skill turns the ring into a sub-ring and a red hex reticle with a heart icon hops between enemies; confirming fires a red-ray burst centred on the target for about 0.2 s (3:57.4). Analyze (L1) desaturates the frame and cuts to a full-screen enemy page with a white swoosh band, then returns. `[observed: S1 3:57.4]` `[unofficial for the reticle hop and the Analyze page: S9 1:38-2:00, 7:04-7:20]`
- **A reported transition detail.** A sliding shape on the way from fight to menu is said to carry the eye from the enemy (top-right) to the character (bottom-left). `[single source: S22]`
- **Why it reads premium.** The cursor is a graphic on the enemy, so no camera move is needed to say where the hit will land. `[derived]`
- **Watch.** S1 3:57 (flash at 3:57.4). No official upload found for the Analyze page.

### A.5 Gun  (Royal: same camera, changed mechanics)

- **Camera.** Choosing GUN (up on the d-pad, or the plate) does not move the camera: the ring re-forms into a small gun ring with an AMMO counter while the reticle stays on the enemy. The shot itself cuts to a close side-on view of the pistol being raised, with muzzle flash and a damage pop on the target. `[observed: S2 0:06-0:08]` `[unofficial: S9 1:59-2:10 for the ring with AMMO counter]`
- **Timing.** About 1 s for the shot.
- **A dedicated aim camera** (the brief's "aiming mode"): `[not found]`; the aiming state is a ring change on the same framing.
- **Royal.** Ammo refills after every battle and guns can be customised (S12, S14, S11); the camera is unchanged.
- **Watch.** S2 0:06.

### A.6 Persona cast and skill execution  (Royal: same)

- **Camera.** After the confirm flash the camera drops to ground level under the Persona (blue flames and chains), with a short whip on the impact, then a wide three-quarter view: hero small in the left foreground, boss at centre, a fire column in front. Three to five hard cuts in about 4 s. `[observed: S1 3:57-4:06]`
- **Frame.** Skill-name banner (red-bordered black slant) top-left; damage number with a cyan heart beside it; blue flame and red slash effects; party card bottom-right.
- **Timing.** Confirm (3:57.4) to first damage (4:02) about 4.6 s; the extra-turn action runs 4:03-4:06.
- **Why it reads premium.** Each cast is a small music video: worm's-eye scale on the Persona, then a readable wide shot that shows the result. `[derived]`
- **Watch.** S1 3:58; S1 4:03; S7 0:39 (Royal).

### A.7 Attack (melee)  (Royal: same)

- **Camera.** Low side-on camera near the floor, slightly behind the attacker; on impact a white-and-black splash graphic covers the enemy for a few frames; the camera then settles wide. Attack banner top-left. About 1.5 s in the ATLUS short (0:05-0:06.5) and 2.5 s in the early-story clip (4:19-4:21.5). `[observed: S2 0:05; S1 4:20]`
- **Royal.** The official Steam screenshots show the same Attack banner and low camera (screenshot 8). `[observed: S35]`
- **Watch.** S2 0:05; S1 4:20.

### A.8 Weakness, critical hit, knockdown, 1 MORE  (Royal: same)

- **What happens, in order.** (1) When the chosen skill hits a known weakness a character cut-in plays first: a horizontal jagged strip of the caster's eyes across the middle third of the screen over the Persona aura, about 0.4 to 0.5 s (3:58.2-3:58.6). (2) The hit. (3) A red-and-white **WEAK** burst (or **CRITICAL**) with the damage number and a cyan heart above the target, about 1 s. (4) The target drops; the frame may desaturate for a beat. (5) A large white **1 MORE** title, about 0.5 s. (6) The command ring returns with a BATON PASS tag. Cast to next command: 8 to 10 s. It is graphics on the same wide shot, not a camera move.
- **Evidence.** `[verified: 2 sources]` for the weakness cut-in rule: the Dengeki PlayStation feature on the PlayStation Blog says a weakness skill triggers a character cut-in and that the downed enemy gives the attacker another action (S11); the strip was observed on the first Persona cast (S1 3:58.2-3:58.6) and not on a second Persona skill later in the same fight (S1 4:12-4:13.6; whether that skill hit a weakness is not established, so the rule rests on S11). WEAK burst `[observed: S3 1:27; official Steam screenshot 9]`; the strip in Royal `[observed: S3 1:25]`; CRITICAL `[observed: S2 0:07.5]`. The 1 MORE title `[observed: S9 10:06, unofficial]`; no official frame found `[not found]`.
- **Why it reads premium.** The reward is stated three ways in under two seconds (face, word, title) and the extra turn is signalled by the ring returning, so the player never wonders whether the weakness worked. `[derived]`
- **Watch.** S1 3:58; S3 1:25; S2 0:07.

### A.9 Hold Up  (Royal: same)

- **Camera.** When the last enemy drops a motion-blurred whip-pan lands behind Joker's left shoulder with the pistol raised. The downed shadows lie centre-frame and the other thieves have stepped into a loose ring around them; the camera stays close to the ground, tilted slightly during the burst and level once the menu is up. `[observed: S2 0:08.5-0:11; S4 1:36-1:38]`
- **Frame and HUD.** Giant HOLD UP! typography (about a third of the frame) with the navigator bubble top-right and the enemy plate top-left. Then a three-item menu at the left (All-Out Attack, Talk, Break Formation), an exclamation mark over the targeted enemy and its plea in a speech panel bottom-centre. The HP cards are hidden while the menu is up and return as the All-Out Attack starts.
- **Timing.** Burst 0:08.5-0:09.5 (1 s), then it holds until input.
- **Developer note.** Hashino says the function was inspired by films in which a villain simply holds people at gunpoint (S26) `[single source]`.
- **Why it reads premium.** The frozen tableau of thieves surrounding helpless enemies *is* the shot; the typography plays the sound effect. `[derived]`
- **Watch.** S2 0:08; S2 0:10; S4 1:36 (Royal).

### A.10 All-Out Attack  (Royal: same; Futaba can finish)

- **Camera.** The 3D scene is dropped. (1) A full-screen diagonal comic panel of the party's faces for about 1 s. (2) A flat red plane where the enemies are black silhouettes and the thieves dark cut-outs, with fast cuts and yellow and white impact flashes, about 4 s. (3) The leader rises in profile against a red-and-black split, about 1.5 s. (4) A per-character finish card (Joker: red, white and blue comic art with vertical THE SHOW'S OVER text) for about 1.3 s, which greys into the results. Flat plane, no perspective camera. `[observed: S2 0:11.5-0:24]`
- **Personalisation.** The finishing art differs per character (poses, tea, a cat with a cigar) (S20), and the character who downed the last enemy supplies the cut-in; in Royal Futaba may randomly do the finish (S11).
- **Timing.** About 7 s of sequence plus the card; 0:11.5 to 0:20 in the short.
- **Why it reads premium.** Leaving 3D for a flat graphic plane makes the payoff feel like a different, more expensive medium, and silhouettes remove any need for per-enemy animation. `[derived]`
- **Royal.** Identical staging in the Royal footage. `[observed: S4 1:39-1:47; S5 0:25]`  `[verified: 4 sources]` overall.
- **Watch.** S2 0:12; S2 0:19; S4 1:40; S5 0:25.

### A.11 Negotiation  (Royal: same, not observed)

- **Camera.** No new camera. The Hold Up tableau stays behind, dimmed to about a third, with a follow-spot cone on the shadow. The shadow's line sits in a white-outlined black speech panel bottom-centre; the player's answer is a crop of Joker's masked face at the right edge with three slanted white answer boxes stacked in the middle. Static; the panels slide in. `[unofficial: S9 5:18-5:44]`
- **Timing.** Each exchange holds until input (about 5 to 10 s per turn). A successful negotiation ends with a **PERSONA GET!** cut-in (mask rip, blue flames, close-ups of Joker and Arsene, about 5 s). `[observed: S8 2:29-2:35, pre-release footage]`
- **Official frame of the answer screens:** `[not found]`. Royal not observed.
- **Watch.** S2 0:10 (the Talk option; screens not shown); S8 2:30 (PERSONA GET!).

### A.12 Baton Pass  (Royal: changed)

- **Camera.** *Choice:* a cut to a reverse shot; the camera stands in front of the thieves at their eye level looking back at them, a yellow ring on the receiver and a name banner top-left (base capture, S9 10:40-10:44). Royal adds a Baton Touch Rank card bottom-left; the sampled Royal choice view is higher and wider, which may be the arena rather than a change (S3 1:30). *Pass:* a black-void two-shot at hip height, passer and receiver side by side in profile, the BATON PASS! title top-right (BATON TOUCH! in the Japanese build), a raised-hand hand-off, then a radial burst of cyan and white speed lines, then the receiver's ring returns with an Attack and recovery up! banner. `[observed: S6 1:27-1:29; S3 1:21-1:22.5; S7 0:36-0:37]`
- **Timing.** About 2 to 2.5 s for the pass; the choice view holds until input.
- **Why it reads premium.** Emptying the world to a black void turns the hand-off into one graphic beat, and the receiver arrives already framed for their own command shot. `[derived]`
- **What Royal changed (mechanics and UI, not camera).** A rank raises attack and recovery, restores HP or SP at the pass, and a fourth pass makes the last member's skill cost zero; passing is available from the start; the rank is raised by playing darts in Kichijoji (S11, S14, S19). `[verified: 3 sources]`
- **Base game.** The base pass appears only in an unofficial capture (S9 10:40-10:48) and looks the same. `[unofficial]`
- **Watch.** S6 1:27; S3 1:21; S3 1:30.

### A.13 Enemy turn and incoming attack  (Royal: same, not observed)

- **Camera.** The party cards stay; the enemy's skill name appears in the same top-left banner used for party skills; the camera cuts to a front three-quarter close-up of the enemy from the party side, chest height, while the navigator comments top-right; a hit is covered by a white starburst. About 2 s. `[unofficial: S9 7:45-7:47, an enemy support skill, not a damaging attack]`
- **Confidence.** Low. An official frame of a damaging enemy attack: `[not found]`. Royal not observed.
- **Watch.** None (no official upload found).

### A.14 Victory and results  (Royal: same, partly observed)

- **Camera.** After the last kill the camera drops to a low, dutch-tilted portrait of the leader: pistol raised (4:22, HUD card still visible bottom-right) then turning to camera (4:26, rim-lit, HUD gone). Result cards (RESULT, EXP burst, MONEY, ITEM) then pop over the scene in about 1.5 s and hold; in Mementos the scene is a close-up of Morgana's car after the party walks off; after an All-Out Attack the finish card greys and becomes the backdrop. `[observed: S1 4:22-4:26; S2 0:19-0:24]` `[unofficial: S10 0:57-1:06 ordinary results]`
- **Why it reads premium.** The victory is a portrait, not a tally: a held hero shot first, then the numbers arrive as graphics. `[derived]`
- **Royal.** Yusuke's finish card (S4 1:46) uses the same card style; no Royal ordinary-victory frame was seen.
- **Watch.** S1 4:22; S2 0:21; S4 1:46.

### A.15 Showtime (Royal only)  (new)

- **Staging.** Not the battle camera: a hard wipe (red wave over a gold-leaf folding screen) into a purpose-built stage for the pair, HUD off, a small OPTIONS Skip hint bottom-right, 2D pattern decoration layered over the 3D. In the Panther and Fox Showtime the cuts run: the folding-screen set; a close two-shot with a red-and-white parasol; a top-down parasol; a portrait of Panther framed by a moon window with chrysanthemum borders; action cutaways with dutch angles; a wide of the enemy in a tatami room; blade close-ups; a white cross-flash back to the normal HUD. About 16 s (0:31-0:47). `[observed: S3 0:30-0:47; S5 0:29]`
- **Other pairs and sets.** A Japanese home for Yusuke and Ann, a wrestling ring for Makoto and Haru, a rainy rooftop for Joker and Akechi, a ramen shop for Ryuji and Yusuke (S16); elaborate over-the-top cutscenes in varied settings (S17). `[verified: 3 sources]` that each pair has a unique set; only the Panther-and-Fox stage was frame-checked.
- **Trigger and prompt.** Chance-based; taking critical damage, a downed ally, a Baton Pass or falling below half health raise the chance; a large button prompt appears mid-screen (the touchpad on PS4); it is use-it-or-lose-it; it deals Almighty damage and the animation varies slightly against bosses (S15, S11). Only one of the pair needs to be in the active party (S12, S11). The cutscene can be skipped (S12; the OPTIONS Skip hint is drawn during it).
- **Split screens or comic panels?** Not seen in the sampled Showtime; pattern borders, a wipe and 2D decoration are. `[observed]` Other pairs not frame-checked.
- **Why it reads premium.** The payoff is a character moment, so each pair gets its own set, palette and pose language and the camera is free to be cinematic instead of tactical. `[derived]`
- **Watch.** S3 0:31; S3 0:38; S5 0:29.

---

## B. Persona 5 Royal: what changed, and what is identical

**Identical to the base game** (side-by-side frames, S1 3:52 vs S3 1:16; S2 0:08-0:20 vs S4 1:36-1:47): the rear-side low wide command shot, the label-ring layout (plus ORDER for a party), HP cards bottom-right, five button hints bottom-left in the same order, the enemy plate top-left and navigator bubble top-right, the skill banner, the eyes-strip cut-in, WEAK bursts, the HOLD UP! burst and ring of thieves, the red silhouette All-Out Attack and its ink-wash finish cards. **No source lists a change to the standard battle camera or HUD** (the Push Square change list has no camera or HUD entry, S14). `[verified: 2 sources]`

**Changed or new:**

| Change | Detail | Source |
|---|---|---|
| Showtime | New chance-triggered pair attacks staged as bespoke cutscenes, HUD off, prompt via touchpad, skippable | S3, S11, S12, S15, S16, S17 |
| Baton Pass Rank | Bigger attack and recovery, HP or SP restored at the pass, fourth pass makes the last member's skill cost zero, available from the start, darts raise the rank; camera and staging of the pass otherwise the same | S11, S14, S19, S3 |
| All-Out Attack finish | Futaba can randomly deliver the finish card; staging otherwise identical | S11, S4 |
| Grappling-hook strike (Wire Action) | A new way to open a fight from range, then the same ink burst into the command shot; CHANCE! title observed at 1:04 | S4 (single source) |
| Guns | Ammo refills after each battle; guns can be customised | S12, S14, S11 |
| Disaster Shadows, boss rework | Rare shadows explode when killed and hit the other enemies; palace bosses have extra phases or behaviours | S12, S14, S11 |
| Other presentation | New opening and menu screen, a new dialogue font in the localised build, new effects on some dialogue windows, new portraits (not battle camera) | S14 |
| Platforms | PS5 presentation is described as unchanged from PS4, at 60 fps; on Switch the All-Out Attack art is at a noticeably lower resolution; PC options are slim | S14, S13 |

---

## C. Camera and animation settings

- **Battle camera.** No option found. The battle controls list contains no camera input, whereas the dungeon list gives the right stick for rotating the camera and × to reset it. `[single source: S21, absence]`
- **Rush (auto-battle, OPTIONS).** The party rushes with melee attacks; a reviewer says it speeds up momentum but is not the same thing as a fast-forward. The hint is on screen in both games. `[observed: S3 1:16; S9 1:40]` `[single source: S18]`
- **Showtime skip (Royal).** The cutscene can be skipped, with an OPTIONS Skip hint drawn bottom-right. `[verified: 2 sources: S12, observed S3 0:33-0:46]`
- **Fast-forward for standard battle animations.** Not available in Royal. `[single source: S18]`
- **Reducing UI or effect intensity.** No option found. In 2025 Atlus's lead interface designer said a stripped-down mode is being considered, speaking about Metaphor and the studio's UI in general. `[single source: S32]`
- **Video options on PC and console (Royal).** Frame rate cap 30, 60 or 120, resolution and rendering scale, shadow quality, anti-aliasing, depth of field, separate audio sliders; the reviewer called the PC options slim. `[single source: S13]`
- **Accessibility reviews checked.** The Can I Play That? reviews of Persona 5 (2017) and Royal (2020) contain nothing on battle camera, flashing effects or skipping (S37).

---

## D. Developer statements, and later games

- **Katsura Hashino (Denfaminicogamer, 2023-04-25; translation by Persona Central, S27).** Turn-based battle stays viable if it fits as "part of a cutscene's composition": show the scenes that need showing, use the cut-and-paste method of anime and manga scenes; the team chose turn-based for Persona 5 on that basis and kept attack and Persona summon to one button press so the tempo is not spoiled.
- **Katsura Hashino (Eurogamer, 2017-04-19, S23).** The earliest UI was "aggressively animated" to the point of being hard to read (messages too diagonal), so the animations were calmed and rotations reduced to balance style and usability.
- **Katsura Hashino (4Gamer, 2016-09-08; translation by Persona Central, S26).** Hold Up came from films where a villain holds people at gunpoint; the thieves' movement was built to show they know how cool they look. No camera statement in this interview.
- **Atlus UI team (CEDEC+KYUSHU 2017; Siliconera S24 and Famitsu S25).** Red as the single key colour (no sub-colours except on the HP/SP elements), central lines to guide the eye, a tool that renders a spinning 3D model into a 2D pose; separate designers for the menu and the battle-scene UI, with the battle designer checking every frame with the programmer. The Famitsu report does not discuss the battle camera. `[verified: 2 sources]`
- **Guillaume Broche, Sandfall Interactive (Denfaminicogamer, May 2025; PCGamesN S28 and Automaton West S29).** Calls Persona 5 the best game in the world for UI and combat visuals, and says "the camera shifts dramatically with each action" (S28) in a way that feels like watching a movie and left a huge impression; there is more he wants to bring from Persona 5, especially into the UI. `[verified: 2 outlets, one interview]` This is the one source found that ties a later game's battle camera to Persona 5.
- **Koji Ise, Atlus (GDC 2025; GDC Vault S30, Noisy Pixel S31, PC Gamer S32).** For Metaphor: ReFantazio the team explicitly worked to differentiate its visual identity from Persona; the battle screen uses a bird's-eye view because in the story the king watches from above. `[verified: 3 sources]` **No source found says Metaphor's battle camera derives from Persona 5.**
- **Katsura Hashino on Metaphor (Official Xbox Podcast, October 2024; GamesRadar S33).** Its mix of real-time and command battles aims at "manga and movie-style combat", with the fast/slow tempo balance refined from the team's previous games. `[single source]`
- **Not reproduced.** A claim in `battle-camera-perspectives.md` §D that P5's combat style influenced a Clair Obscur sequel (PSU.com) was searched for and not found; the statement above is what the sources support.

---

## E. Where sources are thin

- **No developer talk on the battle camera itself.** The Persona 5 UI talk (CEDEC+KYUSHU 2017) is about menus and battle UI; the Famitsu report says nothing on the camera. The only intent statements are Hashino's general 2023 remark and Broche's 2025 description.
- **No official frame found for:** the negotiation answer screens, the base-game Baton Pass, a damaging enemy attack, the 1 MORE title, the Analyze page, the Gun ring, a Showtime prompt, Showtime against a boss. These were observed in unofficial captures (S9, S10) or are `[not found]`.
- **Age-gated official uploads not viewable without signing in:** E3 2015 trailer (vjSHjAoQty4), E3 2016 trailer (Xtw4W0H7SbE), Story trailer (AKKXJZii9Pc), Royal release-date trailer (-b2SV5fkQrk), PlayStation Royal E3 2019 (o9QjlLdYK5I), PlayStation Royal release date (dFWXBQH9f5s), Royal Season Reveal (VArlzKwFxNY), PlayStation Royal Accolades (Lpu7q2G93qs), PSX 2016 Story trailer (YRFLo3z3M-o), Protagonist trailer (7vUV0vcvI0A); PV#04 (qKZtJmt85ns) asked for a bot check. Nothing was bypassed.
- **Blocked pages, not read:** Megami Tensei Wiki (Cloudflare challenge), Fandom (HTTP 402), GameFAQs, GameSpot, GodisaGeek, Twinfinite, and the Steam store page proper (age check; its public JSON was read instead). Search-engine snippets were used only to find pages, never as sources.
- **Eyeballed numbers.** Height, angle and lens are read from frames (no engine data), and each timing is good to about half a second.
- **Royal identity not observed** for: the ambush title in the base Japanese build, negotiation, enemy turns, ordinary victory. They are marked "same" only because no source lists a change.
- **Localisation.** The Japanese and English builds differ in text (Baton Touch / Baton Pass; the third bottom-left hint reads "battle situation check" in the Japanese Royal frames and "Next Turn" in the English base capture; whether that is localisation or a Royal change is not established).

---

## Sources (accessed 2026-09-30)

**Official video uploads (frame-checked; watch links point here)**
1. ATLUS Japan (atlustube), ペルソナ５ 物語の序盤紹介映像 (Persona 5 early-story introduction), 2016-07-19, 17:51. https://www.youtube.com/watch?v=Zae9033XP7A
2. ATLUS Japan (atlustube), 『ペルソナ５』ショートムービー【主人公 総攻撃編】 (short movie, Protagonist All-Out Attack), 2016-08-06, 0:31. https://www.youtube.com/watch?v=SvYgPEIGy0s
3. ATLUS Japan (atlustube), 「P5R」のここがロイヤル！ 新要素を駆使して強敵に挑め！（モルガナ通信Vol.3）, 2019-07-11, 2:10. https://www.youtube.com/watch?v=eokDJhLtccU
4. ATLUS Japan (atlustube), 「P5R」のここがロイヤル！ パレス＆バトル（モルガナ通信Vol.2）, 2019-06-13, 1:51. https://www.youtube.com/watch?v=3z-FuxEcAkY
5. Official ATLUS West, Persona 5 Royal — Finish 'Em Trailer, 2022-10-21, 1:59. https://www.youtube.com/watch?v=c1LFJgJZiO4
6. Official ATLUS West, Persona 5 Royal — Take Over Trailer, 2022-09-14, 1:58. https://www.youtube.com/watch?v=qhizIJLN1kg
7. Official ATLUS West, Persona 5 Royal – Change The World Trailer, 2020-03-12, 0:58. https://www.youtube.com/watch?v=LFzh6T7bQ_M
8. ATLUS Japan (atlustube), ペルソナ５ PV#03, 2015-09-17, 3:55 (pre-release footage). https://www.youtube.com/watch?v=wvpOwQaqRXA

**Unofficial captures (observation only; not offered as watch links)**
9. Gameplay Vault, Persona 5 Battle System Explained (Combat Guide), 2017-04-06, 11:32. https://www.youtube.com/watch?v=fl3elI7hqRM
10. Y S, ペルソナ5~戦闘演出動画~, 2017-05-01, 1:07. https://www.youtube.com/watch?v=RSQytLOJ_fU

**Text sources (opened)**
11. PlayStation.Blog Japan (Dengeki PlayStation feature), 考えるほどに爽快感が増す『ペルソナ5 ザ・ロイヤル』の"深化"した戦闘とは？, 2019-10-28. https://blog.ja.playstation.com/2019/10/28/20191028-persona5r/
12. RPG Site, Persona 5 Royal Review (Cullen Black), 2020-03-17. https://www.rpgsite.net/review/9556-persona-5-royal-review
13. RPG Site, Persona 5 Royal: How do the Switch, Xbox, and PC versions stack up? (James Galizio, Cullen Black), 2022-10-17. https://www.rpgsite.net/feature/13367-persona-5-royal-how-do-the-switch-xbox-and-pc-versions-stack-up
14. Push Square, Persona 5 Royal: Changes, All Differences Compared to Persona 5 (Robert Ramsey), 2022-10-20. https://www.pushsquare.com/guides/persona-5-royal-changes-all-differences-compared-to-persona-5
15. Screen Rant, Persona 5 Royal: How To Unlock Showtime Attacks (Kaitlyn Peterson, Jason Nichols), updated 2024-06-10. https://screenrant.com/persona-5-royal-unlock-showtime-attacks/
16. TheGamer, Persona 5 Royal: All Showtimes, Ranked (Kevin Connaughton), 2023-08-27. https://www.thegamer.com/persona-5-royal-best-showtimes-teams/
17. CBR, Persona 5 Royal: Every Showtime Attack, Ranked (Noelle Corbett), 2021-06-07. https://www.cbr.com/persona-5-royal-showtime-attacks/
18. TheGamer, 5 Things They Fixed In Persona 5 Royal (& 5 Things They Didn't) (Tristan Jurkovich), 2020-03-17. https://www.thegamer.com/persona-5-royal-things-fixed/
19. TheGamer, Persona 5 Royal: Guide To Playing Darts And Baton Pass Ranks (Quinton O'Connor), updated 2022-06-14. https://www.thegamer.com/persona-5-royal-playing-darts-baton-pass-rank-guide/
20. RPGFan, Persona 5 Review (Robert Fenner), 2017-05-09. https://www.rpgfan.com/review/persona-5/
21. Samurai Gamers, Persona 5 Royal Basic Game Controls (Rin Tohsaka), 2020-02-05. https://samurai-gamers.com/persona-5/basic-game-controls-3/
22. Jiaxin Wen, The UI Design of Persona 5 (design blog), 2017-04-27. https://jiaxinwen.wordpress.com/2017/04/27/the-ui-design-of-persona-5/
23. Eurogamer, Let's talk about Persona 5's menus (Cassandra Khaw; interview with Hashino), 2017-04-19. https://www.eurogamer.net/lets-talk-about-persona-5s-menus
24. Siliconera, Atlus Reveals The Design Secrets Behind Persona 5's Distinctive UI (Alistair Wong), 2017-11-13. https://www.siliconera.com/atlus-reveals-design-secrets-behind-persona-5s-distinctive-ui/
25. Famitsu, report on the CEDEC+KYUSHU 2017 session on the Persona 5 UI (Japanese), November 2017 (Siliconera's report of 2017-11-13 credits Famitsu). https://www.famitsu.com/news/201711/13145540.html
26. Persona Central, Persona 5 Director Katsura Hashino Interview About Development Process and Themes (translation of a 4Gamer interview), 2016-09-08. https://personacentral.com/persona-5-director-hashino-development-interview/
27. Persona Central, Persona Series Director Discusses Appeal of Turn-Based Gameplay, Process Behind Main Character Creation (translation of a Denfaminicogamer interview, 2023-04-25), 2023-04-30. https://personacentral.com/persona-director-development-interview-turn-based/
28. PCGamesN, Clair Obscur Expedition 33's director heaps praise on Persona 5's style (Will Nelson), 2025-05-25. https://www.pcgamesn.com/clair-obscur-expedition-33/persona-5-influence
29. Automaton West, Clair Obscur: Expedition 33 lead says Persona 5 is the "best game in the world" when it comes to UI and combat visuals (Amber V), 2025-05-24. https://automaton-media.com/en/news/clair-obscur-expedition-33-lead-says-persona-5-is-the-best-game-in-the-world-when-it-comes-to-ui-and-combat-visuals/
30. GDC Vault, From 'Persona' to 'Metaphor: ReFantazio': Creating a Visual Identity for a New Series (Koji Ise, GDC 2025). https://gdcvault.com/play/1035332/From-Persona-to-Metaphor-ReFantazio
31. Noisy Pixel, From Persona To Metaphor: How Atlus Designed A Game-Changing UI (Azario Lopez), 2025-03-22. https://noisypixel.net/persona-metaphor-ui-design-evolution/
32. PC Gamer, Persona and Metaphor: ReFantazio's UI designer is open to accessibility options (Wes Fenlon), 2025-03-21. https://www.pcgamer.com/games/rpg/persona-and-metaphor-refantazios-ui-designer-is-open-to-accessibility-options-for-players-who-find-the-stylish-menus-overstimulating-that-is-something-we-understand-well-need-to-work-on-and-provide-in-the-future/
33. GamesRadar, Metaphor: ReFantazio combines real-time and turn-based battles because its director wanted to integrate "the idea of manga and movie-style combat" (Jordan Gerblick), 2024-10-12. https://www.gamesradar.com/games/jrpg/metaphor-refantazio-combines-real-time-and-turn-based-battles-because-its-director-wanted-to-integrate-the-idea-of-manga-and-movie-style-combat/
34. Wikipedia, Persona 5 (development section; pointed to S23 and S24). https://en.wikipedia.org/wiki/Persona_5
35. Steam, Persona 5 Royal (app 1687950; ATLUS/SEGA; listed 20 Oct 2022; store page is age-gated, so the public appdetails JSON was read for the name, publisher and the nine official 1920x1080 screenshots). https://store.steampowered.com/app/1687950/Persona_5_Royal/ and https://store.steampowered.com/api/appdetails?appids=1687950
36. Game UI Database, Persona 5 Royal (id 618; 178 items with HUD, skill-use and results sections) and Persona 5 (id 72): https://www.gameuidatabase.com/gameData.php?id=618 , https://www.gameuidatabase.com/gameData.php?id=72 ; listings https://www.gameuidatabase.com/index.php?set=1&sort=2&tag=84&series=36&scrn=143 (Enemy Health & Damage) and https://www.gameuidatabase.com/index.php?set=1&sort=2&series=36&scrn=172 (Notification: Skill Use). Image pages were not copied.
37. Can I Play That?, Persona 5 accessibility review (Mike Matlock), 2017-05-25, https://caniplaythat.com/2017/05/25/disability-game-review-persona-5/ ; Persona 5 Royal Deaf/HoH review, 2020-04-02, https://caniplaythat.com/2020/04/02/deaf-hoh-review-persona-5-royal/ . Both checked; neither covers battle camera or effects.
38. Persona Central, Persona 5 Developer Interview About UI Design, Sound Design and... (translation of Famitsu Weekly no. 1449, Sutou and the sound team), 2016. https://personacentral.com/persona-5-interview-ui-design-sound-music/ . Checked; nothing on battle screens or the camera.

**Reference links for a page builder** (in the JSON `referenceLinks`): Game UI Database pages above; the Steam store page; official Steam screenshots 6 (Persona cast), 8 (Attack), 9 (WEAK burst).
