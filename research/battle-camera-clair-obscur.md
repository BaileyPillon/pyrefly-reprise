# BATTLE CAMERA — Clair Obscur: Expedition 33 (shot by shot, with frame-checked watch links)

**Target project:** Pyrefly Reprise (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Request (Bailey, relayed 2026-09-30):** after reviewing 25 camera-angle mockups of the battle screen, "Show me more of how Clair Obscur does it." (Persona 5 and Persona 5 Royal are covered in a parallel note; they appear here only where Sandfall cites them.)
**This document is the sourced research only.** It does not propose mockups or recommend a pick (hard rules 9 and 10). No frame, screenshot or clip is stored in the repo (rule 8): frames were viewed once to verify timestamps and then deleted; everything below is words, numbers and links. Sources are paraphrased; the few quotes are under 15 words each.
**Research date:** 2026-09-30. Data twin for the page builder: `research/battle-camera-clair-obscur.json` (same content, `shots[]` keyed `co-*`).
**Game case (AGENTS.md rule 14):** reference for BOTH games. Nothing here is FFX or FFX-2 game data; whether a device fits CTB (FFX) or ATB with free movement (FFX-2) is for the plan to decide from `research/ffx-vs-ffx2-presentation.md`.
**Earlier pass, not redone:** `research/battle-camera-perspectives.md` §C row and §D already list this game from reviews. This note supplements those two rows with first-hand frame checks and the developer statements. **One correction to flag:** that note tags the game "over-the-shoulder / off to the side on the active character [verified: 2 sources]" citing Can I Play That? and The Jimquisition. I read both in full and neither uses those words. The description is true, but it now rests on frames [observed] and on the dev sources below, not on those two reviews.

**Confidence tags:** `[verified: N sources]` N independent written sources; `[single source]`; `[observed: CODE m:ss]` seen by me in a checked frame; `[not found]` searched and absent; `[inference]` my reading, not sourced. Heights, distances and angles are **eyeballed from frames** (no camera parameters are published).

**Footage codes** (all frame-checked headless; never the built-in browser pane or Claude in Chrome):

| Code | Video | Channel | Length | Build |
|---|---|---|---|---|
| FL | [First Look Gameplay](https://www.youtube.com/watch?v=55rUagD9sVQ) | Sandfall Interactive, 2024-08-28 | 6:49 | Early build, watermarked GAME IN DEVELOPMENT (Gamescom 2024). Same footage as IGN's age-gated "Official Gameplay" |
| IGN | [Official Combat Gameplay Clip](https://www.youtube.com/watch?v=GByuD9VPa2I) | IGN, 2025-03-03 | 4:43 | March 2025 preview, one fight vs a Nevron called Eveque, two heroes |
| DD | [Xbox Developer_Direct 2025 segment](https://www.youtube.com/watch?v=LCy6vC00O0c) | Sandfall Interactive, 2025-01-30 | 11:39 | January 2025 build; combat chapter 6:16 to 8:24 presented by Michel Nohra, Lead Game Designer (on-screen caption; audio not analysed, agents cannot hear) |
| STEAM | [Steam store page, app 1903340](https://store.steampowered.com/app/1903340/Clair_Obscur_Expedition_33/) | Official screenshots | | Release UI |

---

## One-screen summary

The game's camera is a **director, not a viewpoint**: each stage of a turn cuts to its own authored shot, and the menu is hung inside the scene beside the hero. Sandfall's own account: the per-action camera was inspired by Persona 5 (Broche); every skill is a small cinematic authored in a sequence editor with animated focal length, shakes and time dilation (Guillermin); camera work is also used as a reaction cue for the enemy turn (Nohra, second-hand). **No source ties the battle camera to Final Fantasy X** (see "Developer statements").

| # | Phase | What the camera does | Confidence | Watch |
|---|---|---|---|---|
| 1 | Battle start | Low hard cut on the impact, petal-burst wipe, then a wide arena establishing shot (side-on, or behind and above for a boss) before any menu | observed | [FL 1:18](https://www.youtube.com/watch?v=55rUagD9sVQ&t=78s), [FL 3:57](https://www.youtube.com/watch?v=55rUagD9sVQ&t=237s) |
| 2 | Command select | Behind and slightly beside the acting hero (hero in the left third, chest height, 2 to 3 m); the Battle Wheel hangs in the scene off the hero's side | observed; Persona lineage verified: 5 | [FL 1:25](https://www.youtube.com/watch?v=55rUagD9sVQ&t=85s), [FL 4:12](https://www.youtube.com/watch?v=55rUagD9sVQ&t=252s) |
| 3 | Skill select | Same side, pushes in and lowers on a 0.6 s whip; skill cards fan out | observed | [FL 1:26](https://www.youtube.com/watch?v=55rUagD9sVQ&t=86s), [DD 6:30](https://www.youtube.com/watch?v=LCy6vC00O0c&t=390s) |
| 4 | Target select | Hard cut (under 0.2 s) to a close, slightly low view of the target; card top-left | observed | [FL 4:15](https://www.youtube.com/watch?v=55rUagD9sVQ&t=255s), [IGN 3:13](https://www.youtube.com/watch?v=GByuD9VPa2I&t=193s) |
| 5 | Skill execution | Authored run of 2 to 5 shots: caster with QTE prompt, impact, pull-back; canted frames, blur, shake, slow motion | verified: 3; observed | [FL 4:16](https://www.youtube.com/watch?v=55rUagD9sVQ&t=256s), [FL 1:36](https://www.youtube.com/watch?v=55rUagD9sVQ&t=96s) |
| 6 | Free Aim | Aim is the first wheel entry; **the aiming view was not found** in any frame-checkable official footage | not found | [DD 6:28](https://www.youtube.com/watch?v=LCy6vC00O0c&t=388s) (wheel only) |
| 7 | Enemy wind-up | Cutaway to a close-up of the charge (5 to 6 s) or a tilt-up following a jump (3 s warning) | observed; camera-as-cue single source | [IGN 3:03](https://www.youtube.com/watch?v=GByuD9VPa2I&t=183s), [FL 4:45](https://www.youtube.com/watch?v=55rUagD9sVQ&t=285s) |
| 8 | Enemy turn | Wide, low, behind the party; heroes small in a row; cutaways on hits | observed | [FL 1:41](https://www.youtube.com/watch?v=55rUagD9sVQ&t=101s), [FL 4:01](https://www.youtube.com/watch?v=55rUagD9sVQ&t=241s) |
| 9 | Parry and counter | PARRIED x3 in the wide view, then a fast, low, close counter mini-cinematic | observed | [FL 4:04](https://www.youtube.com/watch?v=55rUagD9sVQ&t=244s), [FL 4:07](https://www.youtube.com/watch?v=55rUagD9sVQ&t=247s) |
| 10 | Gradient | Dark beat, then a golden ring in the wide camera (Gradient Counter); Gradient Attack is a wheel entry, its cinematic not frame-checked | observed; single source | [FL 6:31](https://www.youtube.com/watch?v=55rUagD9sVQ&t=391s) |
| 11 | Break | No special camera found; BROKEN tag under a huge number on an extreme low, blurred hit | observed | [DD 8:12](https://www.youtube.com/watch?v=LCy6vC00O0c&t=492s) |
| 12 | Kill | Low, slow, either wide side-on or a close fall; IGN shows a 14 s finisher | observed | [FL 1:55](https://www.youtube.com/watch?v=55rUagD9sVQ&t=115s), [IGN 4:21](https://www.youtube.com/watch?v=GByuD9VPa2I&t=261s) |
| 13 | Victory | Results plate laid over the last frame | observed | [FL 5:02](https://www.youtube.com/watch?v=55rUagD9sVQ&t=302s) |
| 14 | Camera Movement off | Stationary wider camera (accessibility option) | verified: 3 | none (no official footage) |

### One hero's turn, shot by shot (FL 4:12 to 4:19, sampled every 0.2 s) [observed]

| Time | Shot | Notes |
|---|---|---|
| 4:12.0 to 4:12.4 | Command: Maelle left third, giant enemy mid-distance | Near static |
| 4:12.6 to 4:13.0 | Whip and ink-and-debris burst | About 0.6 s including settle |
| 4:13.2 to 4:14.0 | Skill cards, hero large lower-left | Hold while browsing |
| 4:14.2 to 4:15.0 | Target: enemy flank fills the frame | Hard cut, held |
| 4:15.2 | Caster, full body, low, seen from the front | Hard cut again |
| 4:15.4 | Whip (wind-up) | |
| 4:15.6 to 4:16.4 | Caster close-up, two A prompts, PERFECT ring | QTE |
| 4:17 to 4:19 | Impact side view, damage number, blur into the next actor | |

Six distinct camera set-ups in about seven seconds, none of them a free camera.

### HUD map (where things sit while the camera moves) [observed: STEAM ss_d3a10809 and ss_ec16f873; FL; DD]

| Element | Position |
|---|---|
| Turn-order strip | Top-left, vertical list of about six portrait chips, current actor first and larger |
| Enemy name and health bar | Top-centre |
| Move caption in the enemy turn | Top-centre under the name (for example "Luster performs a fast combo.") |
| Party HP tiles | Bottom-right, three tiles, the active one enlarged |
| Flee and Skip Turn (command state) | Bottom-left |
| Defence prompts (enemy turn) | Bottom-left stack: Gradient, Parry, Dodge, Jump |
| Character mechanic panel | Mid-right (Stains, Foretell, Overcharge) |
| Gradient Charges meter | Bottom-centre |
| Battle Wheel and skill cards | World space, fanned off the hero's side |
| Damage numbers | World space at the hit, large |

The Game UI Database lists the game as Third Person with HUD sections for Selection and Targeting, Player Vitals, Quick Time Event, Enemy Health and Damage, Combat Log and Weapon Reticles (S30).

---

## 1. Battle start (field to arena)

- **Camera.** Field: the player-controlled exploration camera behind the lead hero. On contact the game cuts to authored shots: a tight, low view of the impact point with a red shock ring, then a petal-burst wipe, then a wide arena establishing shot, taken from the side for a field encounter and from behind and above the party for a boss that follows a cutscene. About 1.5 to 2.5 m up, level or tipped slightly down; wide lens; the heroes are small in the lower part of the frame. [observed: FL 1:18-1:25, 3:57-3:59]
- **Frame and HUD.** No menu yet. The HUD fades in during the reveal: enemy name bar first, party tiles a beat later, turn-order strip last. A "First Strike!" banner appears when the player opened the fight. [observed: FL 1:25]
- **Timing.** Field first strike: about 3.5 s from impact to the petal wipe, then about 2.5 s of arena before the first menu (1:18.0 ring, 1:18.5 to 1:21.0 slow sparks, 1:21.5 petals, 1:22.0 arena, 1:24.0 whip). Boss fight: hard cut to black at 3:57.5, petals at 3:57.8, arena lit by 3:59 (about 1.5 s). [observed]
- **Why it reads as premium.** The petal burst repeats the game's Gommage motif, so the swap from field camera to arena camera is a designed beat rather than a load cut, and the still wide shows the formation before menus arrive [inference]. The Jimquisition singles out how each hero swishes into battle [single source: S28]. Starting a fight by shooting or striking an enemy in the field gives a First Strike [verified: 2 sources: S9, FL 1:25].
- **Watch.** [FL 1:18](https://www.youtube.com/watch?v=55rUagD9sVQ&t=78s): red ring, slow sparks, petals at 1:21.5, arena at 1:22, whip at 1:24. [FL 3:57](https://www.youtube.com/watch?v=55rUagD9sVQ&t=237s): letterboxed cutscene, black cut, petal burst, arena lit by 3:59.

## 2. Command select (the idle "your turn" shot)

- **Camera.** Behind and slightly beside the hero whose turn it is. The hero stands in the left third with their back turned about 20 to 30 degrees toward the enemy; an ally is cropped in the right foreground or stands in the right third; the enemy sits mid-distance, centre to right. Roughly the hero's chest to head height, looking level; the hero fills half to two thirds of the frame height (about 2 to 3 m away). Normal-to-wide lens with strong foreground perspective. [observed: FL 1:25, 4:12; DD 6:28; IGN 3:11; STEAM ss_d3a10809]
- **Frame and HUD.** The Battle Wheel hangs in world space off the hero's side as four or five angled brush-stroke options: Aim, Gradient Attack (once charges exist), Items, Skills, Attack, each with a button glyph. HUD as in the map above. [observed: STEAM ss_d3a10809; DD 6:28] The wheel is described the same way by the Fextralife wiki (S33).
- **Motion and timing.** Open-ended hold with ambient drift. The lead programmer says something is always happening on screen, even while navigating menus [single source: S6]. Entered by a whip-pan under about half a second. [observed]
- **Why it reads as premium.** The menu is inside the picture beside the hero instead of on a separate screen, so the waiting moment is itself a composed frame [inference]. Critics read it as Persona-like: Vice praises menus that emerge from the current focus on screen (S25); Rolling Stone says Persona 5 shares a similar dynamic camera and interface (S26); PC Gamer's writer saw similar camera angles and slick menu animations and asked Broche about it (S11). **Persona lineage [verified: 5 sources: S5, S11, S14, S25, S26].**
- **Watch.** [FL 1:25](https://www.youtube.com/watch?v=55rUagD9sVQ&t=85s), [FL 4:12](https://www.youtube.com/watch?v=55rUagD9sVQ&t=252s), [DD 6:28](https://www.youtube.com/watch?v=LCy6vC00O0c&t=388s) (five-entry wheel, wide beach arena).

## 3. Skill select

- **Camera.** Same side as the command shot, closer and a little lower: the hero grows to fill the lower left (two thirds to three quarters of frame height). A whip of about 0.6 s with an ink-and-debris burst opens the list (FL 4:12.6 to 4:13.2), then it holds. [observed: FL 1:26, 4:14, 4:31, 4:53; DD 6:30; IGN 3:12]
- **Frame.** One or two columns of three angled skill cards to the hero's right, each with cost, hit count and stance tags; the enemy above and behind; Back and Skip Turn bottom-left. [observed]
- **Why it works.** Small reward per menu step, hero kept as the anchor while text appears around them [inference].
- **Watch.** [FL 1:26](https://www.youtube.com/watch?v=55rUagD9sVQ&t=86s), [FL 4:14](https://www.youtube.com/watch?v=55rUagD9sVQ&t=254s), [DD 6:30](https://www.youtube.com/watch?v=LCy6vC00O0c&t=390s) (two columns of cards).

## 4. Target select

- **Camera.** Does it move to the target? Yes. A hard cut, under about 0.2 s (FL 4:14.0 to 4:14.2), to a close view of the highlighted enemy from the party's side and slightly low; a giant fills the frame from roughly 3 to 5 m, a human-sized enemy fills about the left half. Then a slow drift while the player picks. [observed: FL 1:27, 4:15, 4:24, 4:33, 4:55; IGN 3:13; DD 8:08]
- **Frame.** A translucent card top-left reads "Select target" plus the skill text; "Select Target" and "Back" prompts bottom-left; enemy name and bar top-centre; the active hero's stance tag at right. After confirming, a caster shot follows within about 0.2 s. [observed]
- **Several enemies.** Only a transitional swing past the hero was seen (DD 6:31); a held multi-target shot is [not found].
- **Why it works.** Shows the thing you are about to hit at heroic scale and pairs it with the skill text in one frame [inference].
- **Watch.** [FL 1:27](https://www.youtube.com/watch?v=55rUagD9sVQ&t=87s), [FL 4:15](https://www.youtube.com/watch?v=55rUagD9sVQ&t=255s), [IGN 3:13](https://www.youtube.com/watch?v=GByuD9VPa2I&t=193s).

## 5. Attack and skill execution

- **Camera.** Every skill plays its own authored run of 2 to 5 shots: a medium-full shot of the caster (front or three-quarter, low), a close-up with the timing prompt, a whip or push to the enemy for the impact, then a pull-back wide. Mostly knee to waist height, sometimes ground-level or overhead; wide lens; some skills use a canted (tilted) frame; the angle swings from about 30 to 170 degrees inside one skill. Heavy motion blur, shake, slow motion on impact. [observed: FL 1:28-1:32, 1:36-1:38, 4:15-4:19, 4:34-4:36, 4:56-4:59; DD 8:12; STEAM ss_0902af72 low wide side-on, ss_49ba857f and ss_8439c07d canted]
- **Frame.** The caster fills the frame with a diamond "A" prompt and a ring that reads PERFECT when timed well; large world-space damage numbers pop at each hit (24 to 12,437 seen); the menu is gone, the turn-order strip and party tiles stay. [observed]
- **Timing.** About 2 to 5 s per skill (Maelle's Spark about 4 s, Lune's Ice Lance about 3 s); a shot changes every 1 to 1.5 s. [observed]
- **Why it reads as premium.** Authored, not procedural: skills are treated as small cinematics in Unreal's Sequencer with battle actors bound at runtime (S6); the camera's location, rotation and animated focal length, plus shakes and time dilation, are part of each skill and add to a feeling of intensity (S7); the design lead lists the same four tools (S17). PC Gamer's review credits slow motion and particle flourishes with theatrical drama (S27). **[verified: 3 sources: S6, S7, S17]**
- **Watch.** [FL 1:28](https://www.youtube.com/watch?v=55rUagD9sVQ&t=88s) (Gustave), [FL 1:36](https://www.youtube.com/watch?v=55rUagD9sVQ&t=96s) (tilted frame around Lune), [FL 4:16](https://www.youtube.com/watch?v=55rUagD9sVQ&t=256s) (Maelle, low and front-on), [DD 8:12](https://www.youtube.com/watch?v=LCy6vC00O0c&t=492s).

## 6. Free Aim

- **Rules [verified: 3 sources: S5, S9, S33].** Aim is a wheel entry; in battle each shot costs 1 AP and does not end the turn; hitting a weak point deals extra damage; flying enemies are mainly shot down this way. The mode is drawn from third-person shooters (S9). The only camera remark in print is that activating it zooms in and the reticle turns into crosshairs, with unlimited time to aim (Can I Play That?, S18) [single source].
- **Camera.** **[not found]** in any official footage I could frame-check. I sampled FL, IGN and DD at 0.2 to 1 s, and the launch, reveal, release-date, Baguette and Thank You trailers plus the Gustave, Maelle, Lune, Sciel and Monoco character trailers at 1 to 6 s. The diamonds seen in trailers are QTE prompts, not an aiming reticle. Do not draw this shot from these notes.
- **Wheel entry.** Aim is the first option, at the left tip [observed: DD 6:28; STEAM ss_d3a10809].
- **Watch.** [DD 6:28](https://www.youtube.com/watch?v=LCy6vC00O0c&t=388s): the wheel only; the clip does not show the aiming view.

## 7. Enemy turn: how early the wind-up is shown

- **Camera.** Two patterns. IGN clip: a hard cut from the wide, low view to an extreme close-up of the enemy's chest and hands charging, with the caption "Eveque charges up." top-centre, held from 3:03 to 3:08 (5 to 6 s), then back to wide at 3:09. First Look: for a jump attack the camera stays low behind two heroes, the caption "Goblu is about to crush Gustave." appears at 4:45, the view tilts up as the giant leaps out of frame at 4:47, and it crashes at 4:48 (about 3 s of warning). [observed: IGN 3:03-3:09; FL 4:45-4:48]
- **Whose shoulder, which side.** Neither: this is the wide "behind the party" camera (next section) unless a cutaway takes over.
- **Why it works.** The telegraph is also the drama [inference]. Nohra's MIGS 2025 talk, as reported by MobileSyrup, says time dilation, focal length, camera shakes and camera movement punctuate the key moments and give players cues on how to react, and that enemy hit animations are emphasised to nudge the parry **[single source: S17]**. The game itself warns that switching camera movement off makes some attacks harder to read **[verified: 3 sources: S18, S19, S20]**, and PC Gamer describes bosses vanishing skyward while the camera stays behind, which matches the tilt-up seen at FL 4:47.
- **Watch.** [IGN 3:03](https://www.youtube.com/watch?v=GByuD9VPa2I&t=183s), [FL 4:45](https://www.youtube.com/watch?v=55rUagD9sVQ&t=285s).

## 8. Enemy turn: the default camera

- **Camera.** Behind the party, looking across the arena; the heroes stand in a loose row in the lower part of the frame (one fifth to one third of frame height) and the enemy fills the upper half. From knee height up to about 2.5 m, level to slightly down, dropping lower as a big attack lands; wide lens. Held or slowly drifting, with short cutaways on hits and dodges and motion-blur whips between them. Angle roughly 10 to 20 degrees off the party-to-enemy line, up to about 50 in the Steam still. [observed: FL 1:41-1:44, 4:01-4:06, 4:37-4:50; IGN 0:18-0:30; STEAM ss_ec16f873]
- **Frame and HUD.** Defence prompt stack bottom-left, move caption top-centre, floating PARRIED or DODGE text and damage numbers mid-frame.
- **Timing.** A whole enemy sequence lasts about 9 to 13 s (FL 1:40-1:53, 4:01-4:10, 4:37-4:50); single shots 1 to 6 s.
- **Why it works.** Keeps the incoming attack readable while the heroes stay in frame; the low, wide angle makes enemies feel huge [inference]. The other side of the trade: PC Gamer's Kerry Brunskill could not bear watching the busy, zooming camera until finding the option to calm it **[single source: S19]**.
- **Watch.** [FL 1:41](https://www.youtube.com/watch?v=55rUagD9sVQ&t=101s), [FL 4:01](https://www.youtube.com/watch?v=55rUagD9sVQ&t=241s), [FL 4:37](https://www.youtube.com/watch?v=55rUagD9sVQ&t=277s) (higher and farther).

## 9. Parry, and the counterattack after it

- **Camera.** The wide view holds while the PARRIED words float low in the centre (three in a row). Then a hard cut to a fast, low, close sequence around the enemy that swings and chases the counter, with blur, spins and shake; then back to wide. Caption "Expedition 33 performs a Counter." top-centre; damage numbers over 100 shown large. About 4 s. [observed: FL 4:04-4:10, 1:53-1:54, 6:29; DD 0:54-0:55]
- **Why it works.** The most cinematic shot of the turn is the reward for timing [inference]. Guillermin singles out landing a counter after a run of parries as the feeling the team wanted **[single source: S6]**.
- **Watch.** [FL 4:04](https://www.youtube.com/watch?v=55rUagD9sVQ&t=244s), [FL 4:07](https://www.youtube.com/watch?v=55rUagD9sVQ&t=247s).

## 10. Big set-pieces: Gradient

- **Gradient Counter.** The screen darkens and desaturates with white specks at 6:31, then the wide enemy-turn camera catches a golden brush-ring swirl around the hero (caption "Maelle performs a Gradient Counter.", 6:32 to 6:33). [observed: FL 6:31-6:33] Can I Play That? independently says Gradient Counters show time-slowing and screen darkening **[single source: S18]**.
- **Gradient Attack.** A "Gradient Attack" entry joins the top of the wheel once charges exist, with a Gradient Charges meter bottom-centre [observed: DD 6:28]. Its own cinematic was **not frame-checked** [not found].
- **Watch.** [FL 6:31](https://www.youtube.com/watch?v=55rUagD9sVQ&t=391s), [DD 6:28](https://www.youtube.com/watch?v=LCy6vC00O0c&t=388s).

## 11. Big set-pieces: Break

- **Camera.** No dedicated Break camera was found. On a broken enemy the hit is staged as an extreme low, close, heavily blurred slash with a huge damage number (11,062) and a small BROKEN tag beneath it, over about 1 to 2 s. [observed: DD 8:12-8:13] Wikipedia describes Break as a temporary stun **[single source: S29]**.
- **Watch.** [DD 8:12](https://www.youtube.com/watch?v=LCy6vC00O0c&t=492s).

## 12. Kills

- **Camera.** The camera drops low and slows. One fight: a wide, low, side-on view with a crystal shard bloom around the enemy, HUD already gone (FL 1:55-1:56). Another: a close, low view of a giant falling backwards, near-frozen between 5:00 and 5:01 (slow motion or a hold). The IGN clip runs a longer authored finisher of about 14 s and roughly ten cuts (4:21-4:35) with the HUD still on; the clip does not name the skill. [observed]
- **Why it works.** The last hit gets its own beat instead of ending on a health bar [inference].
- **Watch.** [FL 1:55](https://www.youtube.com/watch?v=55rUagD9sVQ&t=115s), [FL 5:00](https://www.youtube.com/watch?v=55rUagD9sVQ&t=300s), [IGN 4:21](https://www.youtube.com/watch?v=GByuD9VPa2I&t=261s).

## 13. Victory and results

- **Camera.** The final shot is held, slightly darkened, and the plate is laid over it. VICTORY in a brush-stroke banner top-left; XP counter top-right counting up (1,472 to 1,600 in FL); battle loot list left; one panel per hero on the right with level and new skills; stats along the bottom (highest damage, damage dealt and received, time, parries, dodges); a Continue prompt bottom-right. Appears about 1 s after the kill. [observed: FL 1:57-1:59, 5:02-5:04; IGN 4:36-4:40]
- **Why it works.** The finished battle stays visible behind the numbers [inference]. Nohra describes an epic victory screen with a juicy freeze frame **[single source: S17]**.
- **Watch.** [FL 5:02](https://www.youtube.com/watch?v=55rUagD9sVQ&t=302s), [IGN 4:36](https://www.youtube.com/watch?v=GByuD9VPa2I&t=276s). UI stills: Interface In Game's result-screen page (S31).

## 14. Camera Movement off (the accessibility fallback)

- **What it does.** Switching the Accessibility option **Camera Movement** off keeps a wider, stationary battle camera instead of following the action; it can obscure the choreography of QTEs but calms the view for players prone to motion sickness (S18). The option text says it primarily affects battle and "makes some attacks harder to read" (S20). PC Gamer's writer describes bosses vanishing skyward while the camera stays behind (S19). **[verified: 3 sources]**
- **Footage.** No official footage with the option off was found. **[not found]**

---

## Settings that touch the camera

| Setting | Effect | Confidence |
|---|---|---|
| **Camera Movement** (Settings, Accessibility) | Default on. Off = wider, stationary battle camera; warns it changes the battle and makes some attacks harder to read | [verified: 3 sources: S18, S19, S20] |
| **Camera Shake** (Accessibility) | Toggle for the shake effects that add dynamic movement in battle | [single source: S21, game text] |
| **Automatic QTE** (Accessibility) | Own-attack QTEs auto-succeed; dodge and parry unaffected. Not a camera option, but changes how long the player just watches execution shots | [verified: 3 sources: S22, S16, S9] |
| Camera sensitivity and invert (Controls) | About 20 steps, camera stick only, plus inverted axes; free camera (exploration, aiming), not the battle camera | [verified: 2 sources: S23, S24] |
| Sprint and aim hold or toggle | Aiming can be toggled | [single source: S23] |
| Field of view | No in-game slider; PCGamingWiki points to mods or ReShade | [single source: S32] |
| Photo Mode (Thank You Update, Dec 2025) | Free camera with unlimited distance, passes through collisions, works in cinematics; separate from the battle camera; use mid-battle [not found] | [verified: 2 sources: S10, S35] |

## Developer statements

**Final Fantasy X and the battle camera [not found].** No source has Sandfall saying the battle camera drew on FFX. What exists: Meurisse calls FFX a masterpiece and "a big inspiration for us", specifically for the party, pacing and narrative, and says the turn-based core was influenced by FF VIII, IX and X (RPG Site, 2025-03-21, S16). Broche says the FF VIII, IX and X era shaped much of the core "not directly" (PC Gamer, 2024-08-28, S11), lists FF VI to X among his influences (S14) and says FF VIII to X shaped many parts, with FF VII to IX becoming the world-map idea, and Sekiro the dodge and parry feel (Automaton JP, 2025-03-13, S15). The camera lineage they name is **Persona 5**.

| Who | What they said (paraphrase) | Source |
|---|---|---|
| **Guillaume Broche**, CEO and creative director | Persona 5 is the best game in the world for battle depiction and UI; he was strongly influenced by the camera cutting dramatically each time the player acts, "making it feel like you're watching a movie"; Expedition 33 turns that into camerawork suited to its own game and the UI is still being refined | Denfaminicogamer 2025-05-23 (S14, Japanese original), Automaton West (S13), PCGamesN (S12). **[verified: 3 sources]** |
| Broche | Studied Persona's camera movements, menus and dynamic construction, then made their own version because the art style differs | PC Gamer 2024-08-28 (S11) |
| Broche | Team loves Persona for UI, rhythm and dynamic camera | PlayStation Blog 2024-07-29 (S5) |
| **Francois Meurisse**, co-founder and producer | FFX for party, pacing and narrative; Persona 5 for UI and how dynamic the battles are | RPG Site 2025-03-21 (S16) |
| **Tom Guillermin**, co-founder and lead programmer | Wanted polish in animation, camera and VFX in battle so something is always happening, even in menus. "treating all skills as small cinematics" in Sequencer with battle actors bound at runtime gives room for epic shots. Arenas are controlled environments; level designers adjust enemy positions case by case; dynamic moves (an enemy jumping at a hero from any position) are handled by exposing properties to the sequence and keyframing them | Unreal Engine interview 2025-03-27, read via Internet Archive (S6) |
| Guillermin, GDC 2026 talk | A skill is authored end to end in Blueprints, including camera location, rotation and animated focal length, shakes and time dilation, for a feeling of intensity | PlayStation Blog 2026-03-11 (S7) |
| **Michel Nohra**, lead game designer | Time dilation, focal length, shakes and camera movement punctuate key moments and cue how to react; enemy hit animations are emphasised to nudge the parry; victory screen built around a juicy freeze frame | MobileSyrup 2025-11-27, second-hand report of his MIGS 2025 talk (S17). **[single source]** |

## Where sources are thin

1. **No camera parameters exist in print.** FOV, distances and heights are eyeballed from 480p to 720p frames.
2. **Free Aim in battle.** The camera during Aim is [not found] in any frame-checkable official footage; the one text remark is "zooms in" (S18).
3. **FFX and the battle camera.** [not found]; general FFX credit only (see above).
4. **Gradient Attack cinematic and a dedicated Break camera** were not seen; only the Gradient Counter and a BROKEN tag.
5. **Multi-enemy target select** was seen only as a transitional swing (DD 6:31).
6. **Pre-release footage.** FL is an early build (GAME IN DEVELOPMENT); IGN is a March 2025 preview; DD is January 2025. The Steam stills show the release UI and match the layout; small details may differ.
7. **Second-hand items.** Nohra's camera-as-cue statement is one outlet's report of a talk. The Unreal Engine page returned HTTP 403 to scripted fetches, so it was read from the Internet Archive copy. The in-game option texts come from a how-to page that transcribes screenshots.
8. **Not opened.** Steam Community threads (age-gated, content not served); the official Free Aim clip on X (HTTP 402). One search summary said players read camera-angle changes as attack telegraphs; that was not verified from a thread, though the option's own warning and FL 4:47 both agree with it.
9. **Age-gated official uploads** (IGN "Official Gameplay" 9hKA7KSvC10, Xbox "Release Date Trailer | Developer_Direct 2025" b6YNycptEzc, IGN "Official Launch Trailer" wWGIakhqr5g) returned LOGIN_REQUIRED to scripted clients and were not used; Sandfall's own uploads of the same content were.
10. **Audio not analysed.** DD 6:16 to 8:24 is Nohra walking through combat; only its footage and caption were read.

## Sources

Access date for every URL: 2026-09-30. S-numbers match `sources[]` in the JSON.

- **S1.** Sandfall Interactive, First Look Gameplay (YouTube, 2024-08-28). https://www.youtube.com/watch?v=55rUagD9sVQ
- **S2.** IGN, Official Combat Gameplay Clip (YouTube, 2025-03-03). https://www.youtube.com/watch?v=GByuD9VPa2I
- **S3.** Sandfall Interactive, Xbox Developer_Direct 2025 segment (YouTube, 2025-01-30). https://www.youtube.com/watch?v=LCy6vC00O0c
- **S4.** Steam store page, app 1903340 (official screenshots; ss_d3a10809 and ss_ec16f873 used for HUD states). https://store.steampowered.com/app/1903340/Clair_Obscur_Expedition_33/
- **S5.** PlayStation Blog, 2024-07-29, Broche interview. https://blog.playstation.com/2024/07/29/clair-obscur-expedition-33-devs-discuss-classic-turn-based-rpg-inspiration-and-real-time-mechanics/
- **S6.** Unreal Engine developer interview with Tom Guillermin, 2025-03-27 (Internet Archive copy). https://web.archive.org/web/20260420221013/https://www.unrealengine.com/developer-interviews/inside-the-development-journey-of-clair-obscur-expedition-33
- **S7.** PlayStation Blog, 2026-03-11, Tom Guillermin GDC write-up. https://blog.playstation.com/2026/03/11/how-the-clair-obscur-expedition-33-dev-process-powered-creative-design-freedom/
- **S8.** Xbox Wire, 2025-01-23, Jeff Rubenstein, Developer_Direct article (describes the camerawork as dynamic; no dev camera remark). https://news.xbox.com/en-us/2025/01/23/clair-obscur-expedition-33-developer-direct-2025/
- **S9.** Xbox Wire, 2025-04-23, 8 Tips to Help You Get Started. https://news.xbox.com/en-us/2025/04/23/tips-to-get-started-clair-obscur-expedition-33/
- **S10.** Expedition 33 Dev Blog: Photo Mode, 2026-02-11. https://www.expedition33.com/post/expedition-33-dev-blog-photo-mode
- **S11.** PC Gamer, Robert Jones, 2024-08-28, creative director interview. https://www.pcgamer.com/games/rpg/clair-obscur-expedition-33-creative-director-speaks-candidly-about-the-new-rpgs-respect-for-final-fantasy-and-persona-we-are-definitely-not-hiding-that-there-are-influences/
- **S12.** PCGamesN, Will Nelson, 2025-05-25, Persona 5 praise. https://www.pcgamesn.com/clair-obscur-expedition-33/persona-5-influence
- **S13.** Automaton West, Amber V, 2025-05-23. https://automaton-media.com/en/news/clair-obscur-expedition-33-lead-says-persona-5-is-the-best-game-in-the-world-when-it-comes-to-ui-and-combat-visuals/
- **S14.** Denfaminicogamer, 2025-05-23 (Japanese original of the Persona 5 remarks). https://news.denfaminicogamer.jp/interview/2505223a
- **S15.** Automaton (Japanese), Daijiro Akiyama, 2025-03-13. https://automaton-media.com/articles/interviewsjp/20250313-331351/
- **S16.** RPG Site, Adam Vitale and James Galizio, 2025-03-21, Meurisse interview. https://www.rpgsite.net/interview/17041-clair-obscur-expedition-33-interview-celebrating-turn-based-games-classic-rpg-influences-in-making-something-new
- **S17.** MobileSyrup, Katya Ryabova, 2025-11-27, report on Michel Nohra's MIGS talk. https://mobilesyrup.com/2025/11/27/clair-obscur-expedition-33-devs-combat-hard-juicy/
- **S18.** Can I Play That?, Mike Matlock, 2025-12-04, accessibility review. https://caniplaythat.com/2025/12/04/clair-obscur-expedition-33-accessibility-review/
- **S19.** PC Gamer, Kerry Brunskill, 2025-05-08, accessibility piece. https://www.pcgamer.com/games/rpg/i-couldnt-have-played-clair-obscur-without-its-accessibility-settings-and-now-it-might-be-my-goty/
- **S20.** Linnet's how-to: Camera Movement (in-game option text). https://linnetshowto.com/how-to-enable-disable-camera-movement-clair-obscur-expedition-33/
- **S21.** Linnet's how-to: Camera Shake. https://linnetshowto.com/how-to-enable-disable-camera-shake-clair-obscur-expedition-33/
- **S22.** Linnet's how-to: Automatic QTE. https://linnetshowto.com/how-to-enable-disable-automatic-qte-clair-obscur-expedition-33/
- **S23.** Capgame accessibility review, Cad, 2025-05-07. https://www.game-lover.org/en/clair-obscur-expedition-33-accessibility-review/
- **S24.** DearGamers accessibility review, 2025-05-15. https://www.deargamers.net/reviews/clair-obscur-expedition-33s-biggest-area-to-improve-accessibility
- **S25.** Vice, Matt Vatankhah, 2025-04-23, review. https://www.vice.com/en/article/clair-obscur-expedition-33-is-the-turn-based-rpg-youve-been-dreaming-about-for-years-review/
- **S26.** Rolling Stone, George Yang, 2025-04-23, review. https://www.rollingstone.com/culture/rs-gaming/clair-obscur-expedition-33-review-1235322810/
- **S27.** PC Gamer, Justin Wagner, 2025-04-23, review. https://www.pcgamer.com/games/rpg/clair-obscur-expedition-33-review/
- **S28.** The Jimquisition, James Stephanie Sterling, 2025-05-13, review. https://www.thejimquisition.com/post/clair-obscur-expedition-33-picture-perfect-review
- **S29.** Wikipedia, Clair Obscur: Expedition 33 (gameplay and development sections; the Persona 5 and Meurisse claims there trace to S11, S12 and S16). https://en.wikipedia.org/wiki/Clair_Obscur:_Expedition_33
- **S30.** Game UI Database, Clair Obscur: Expedition 33 (id 2060). https://www.gameuidatabase.com/gameData.php?id=2060
- **S31.** Interface In Game, Clair Obscur: Expedition 33 (HUD 3 to 6, result screen, accessibility screen linked from the game page). https://interfaceingame.com/games/clair-obscur-expedition-33/
- **S32.** PCGamingWiki, Clair Obscur: Expedition 33. https://www.pcgamingwiki.com/wiki/Clair_Obscur:_Expedition_33
- **S33.** Fextralife wiki, Combat (Battle Wheel entries). https://expedition33.wiki.fextralife.com/Combat
- **S34.** GamesRadar, Broche on Persona and Final Fantasy 8, 9 and 10 (restates S11). https://www.gamesradar.com/games/rpg/dev-of-french-jrpg-that-stunned-at-the-xbox-showcase-not-hiding-influence-of-persona-and-final-fantasy-8-9-and-10-but-wants-to-find-our-own-direction/
- **S35.** PC Gamer, Tyler Wilde, 2026-02-11, photo mode oddities. https://www.pcgamer.com/games/rpg/clair-obscur-photo-mode-oddities/
