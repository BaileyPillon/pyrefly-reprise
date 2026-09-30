# Credits the game must show (compiled 2026-09-30)

Compiled from `docs/audio/CREDITS.md` on `main` (770823bc), on branch `music-v2` (7df18384 and later) and on branch
`sfx-v2` (9c572eb9), plus `public/fonts/*/OFL*.txt` and `docs/ART-PIPELINE.md` §8. Nothing here is invented: where a
source did not record a link or an author, the line says so instead of guessing.

**Where each line lives today.** `main` ships the R1 set only. `music-v2` and `sfx-v2` are separate branches that each
add lines; both are Bailey's picks (2026-09-30) and both CREDITS files are still unmerged, so the list below is the
union of the three. Column "on" = the branch that makes the line true (main, music-v2, sfx-v2).

**Tier.** REQUIRED = the licence demands attribution (CC BY, CC Sampling Plus). COURTESY = no obligation; credited
because it is right to (CC0, MIT, Apache, OFL, the tools). The in-game list should show both, REQUIRED first.

**Current state of the credits screen: none exists.** `docs/audio/CREDITS.md` carries a TODO that says the required
lines "must be on it before release". `src/` has no credits data and no credits screen.

## 1. Music libraries and halls

| Work | Author | Licence | Tier | on | Link |
|---|---|---|---|---|---|
| Salamander Grand Piano V3 | Alexander Holm | CC BY 3.0 | REQUIRED | main | https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html |
| Sonatina Symphonic Orchestra (SF2 conversion) | Mattias Westlund; SF2 conversion by "Symphony2" | CC Sampling Plus 1.0 | REQUIRED | main | https://ftp.osuosl.org/pub/musescore/soundfont/ (MuseScore's mirror; no project page recorded) |
| DRSKit 2.1 | DrumGizmo team (Deva, Lars Muldjord) and Jes Eiler of DRSDrums | CC BY 4.0 | REQUIRED | music-v2 | drumgizmo.org (CREDITS.md gives the name only; add `https://`) |
| "The Sound of the Violin's Home: A Higher-Order Room Impulse Response Dataset of the Arvedi Auditorium in Cremona" (hall acoustics, decoded to stereo, direct sound removed) | F. Miotello, G. Greco, P. Ostan, F. Del Gaudio, L. Comanducci, R. Malvermi, M. Pezzoli, F. Antonacci | CC BY 4.0 | REQUIRED | music-v2 | https://doi.org/10.5281/zenodo.20098848 (DOI as recorded: 10.5281/zenodo.20098848) |
| FluidR3 GM/GM2 soundfont | Frank Wen | MIT | courtesy | main | https://ftp.osuosl.org/pub/musescore/soundfont/fluid-soundfont.tar.gz |
| Voxengo free impulse responses ("Direct Cabinet N2" and the room and hall tails) | Aleksey Vaneev (Voxengo) | Voxengo licence: royalty-free for any use, the IR files never redistributed | courtesy (credit line owed since music-v2 and sfx-v2 ship it) | music-v2, sfx-v2 | voxengo.com (no URL recorded in CREDITS.md; confirm before it goes in the game) |
| VSCO 2 Community Edition | Versilian Studios | CC0 | courtesy | music-v2 | no URL recorded in CREDITS.md |
| VCSL, Versilian Community Sample Library | Versilian Studios | CC0 | courtesy | music-v2 | no URL recorded in CREDITS.md |
| Black And Blue Basses, Shinyguitar, Karoryfer x bigcat cello | Karoryfer Samples, bigcat instruments | CC0 | courtesy | music-v2 | no URL recorded in CREDITS.md |
| jRhodes3d | Jeff Learman | music made with it is CC0 (the samples are CC BY-NC only if redistributed, which we never do) | courtesy | music-v2 | no URL recorded in CREDITS.md |
| Surge XT 1.3.4 (synth pads, sub, alarm in the FFX-2 band) | Surge Synth Team | GPL-3 for the synth; its audio output is ours | courtesy | music-v2 | no URL recorded in CREDITS.md |
| sfizz 1.2.3 (renders the Karoryfer and jRhodes programs) | not recorded in CREDITS.md | BSD-2 | none (a tool); leave off the screen | music-v2 | no URL recorded in CREDITS.md |
| ACE-Step v1 3.5B (restyle of the R1 cues: title, pause, chapter select and more) | ACE Studio and StepFun | Apache-2.0 | courtesy | main | `ACE-Step/ACE-Step-v1-3.5B` on Hugging Face |
| ACE-Step 1.5 turbo (2B) and XL turbo (4B) (restyle of five FFX-2 cues, over our own renders only) | ACE Studio and StepFun | MIT | courtesy | music-v2 | no URL recorded in CREDITS.md |

The music itself is original: every note in `src/audio/tracks/` was written for this project. The libraries above are
how it is played, not who wrote it.

## 2. Sound effects (`public/audio/sfx/sprite-v2.mp3`, branch sfx-v2; all sources from official hosts, every file SHA-256 checked on receipt)

The libraries of section 1 (VCSL, VSCO 2 CE, the Sonatina choir, the Voxengo IRs) also play in the effects.

| Work (archive or file) | Author | Licence | Tier | Link |
|---|---|---|---|---|
| Nosferatu thunderclap | Richard Humphries | CC BY 4.0 | REQUIRED | https://commons.wikimedia.org/wiki/File:Nosferatu_thunderclap_-_Richard_Humphries.wav |
| Bonfire ignition (WWS_Bonfireignition) | Work With Sounds / Werstas | CC BY 4.0 | REQUIRED | https://commons.wikimedia.org/wiki/File:WWS_Bonfireignition.ogg |
| Glass breaking | Gravity Sound | CC BY 4.0 | REQUIRED | https://commons.wikimedia.org/wiki/File:Glass_breaking_(Gravity_Sound).wav |
| Impact Sounds | Kenney | CC0 1.0 | courtesy | https://kenney.nl/assets/impact-sounds |
| RPG Audio | Kenney | CC0 1.0 | courtesy | https://kenney.nl/assets/rpg-audio |
| Interface Sounds | Kenney | CC0 1.0 | courtesy | https://kenney.nl/assets/interface-sounds |
| Sci-fi Sounds | Kenney | CC0 1.0 | courtesy | https://kenney.nl/assets/sci-fi-sounds |
| 80 CC0 RPG SFX | rubberduck | CC0 1.0 | courtesy | https://opengameart.org/content/80-cc0-rpg-sfx |
| 75 CC0 breaking / falling / hit SFX | rubberduck | CC0 1.0 | courtesy | https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx |
| 40 CC0 water splash / slime SFX | rubberduck | CC0 1.0 | courtesy | https://opengameart.org/content/40-cc0-water-splash-slime-sfx |
| 100 CC0 SFX | rubberduck | CC0 1.0 | courtesy | https://opengameart.org/content/100-cc0-sfx |
| 25 CC0 bang / firework SFX | rubberduck | CC0 1.0 | courtesy | https://opengameart.org/content/25-cc0-bang-firework-sfx |
| 100 CC0 metal and wood SFX | rubberduck | CC0 1.0 | courtesy | https://opengameart.org/content/100-cc0-metal-and-wood-sfx |
| 100 CC0 SFX #2 | rubberduck | CC0 1.0 | courtesy | https://opengameart.org/content/100-cc0-sfx-2 |
| Swishes Sound Pack | artisticdude | CC0 1.0 | courtesy | https://opengameart.org/content/swishes-sound-pack |
| RPG Sound Pack | artisticdude | CC0 1.0 | courtesy | https://opengameart.org/content/rpg-sound-pack |
| 20 Sword Sound Effects (attacks and clashes) | StarNinjas | CC0 1.0 | courtesy | https://opengameart.org/content/20-sword-sound-effects-attacks-and-clashes |
| Angry tiger (439280_schots) | schots | CC0 | courtesy | https://commons.wikimedia.org/wiki/File:439280_schots_angry-tiger.wav |
| Grizzly bear vocalizations 001 (Yellowstone sound library) | NPS and MSU Acoustic Atlas / Jennifer Jerrett | Public domain | courtesy | https://commons.wikimedia.org/wiki/File:Yellowstone_sound_library_-_Grizzly_Bear_vocalizations_-_001.mp3 |
| Ocean waves on a tropical beach | Jarrod Stanley | CC0 | courtesy | https://commons.wikimedia.org/wiki/File:Ocean_Waves_on_a_Tropical_Beach.ogg |
| Windglockenspiel Koshi | Membeth | CC0 | courtesy | https://commons.wikimedia.org/wiki/File:Windglockenspiel.Koshi.ogg |

Verbatim required lines from `docs/audio/CREDITS.md` on `sfx-v2` (the three CC BY 4.0 recordings):
`Thunderclap by Richard Humphries (Wikimedia Commons) — CC BY 4.0`,
`Bonfire ignition by Work With Sounds / Werstas (Wikimedia Commons) — CC BY 4.0`,
`Glass breaking by Gravity Sound (Wikimedia Commons) — CC BY 4.0`, and `Impulse responses: Voxengo (Aleksey Vaneev)`.

Downloaded but **not used** by any shipped cue, so not credited: Kenney UI Audio and Digital Audio, rubberduck's
creature and sci-fi packs, StarNinjas' sword pack beyond the one archive above, the Magic SFX Preview Pack (CC BY 3.0),
eleven other Commons files. No retail game audio was used as a source or a reference.

## 3. Fonts (every file ships in `public/fonts/`, each folder with its own `OFL.txt`; the OFL asks the licence to travel with the font, which it already does)

| Work | Author (as in its OFL.txt) | Licence | Tier | Link |
|---|---|---|---|---|
| Chakra Petch | The Chakra Petch Project Authors (2018) | SIL OFL 1.1 | courtesy | https://github.com/m4rc1e/Chakra-Petch |
| Cormorant Garamond | The Cormorant Project Authors (2015) | SIL OFL 1.1 | courtesy | https://github.com/CatharsisFonts/Cormorant |
| Exo 2 | The Exo 2 Project Authors (2013) | SIL OFL 1.1 | courtesy | https://github.com/googlefonts/Exo-2.0 |
| Rajdhani | Indian Type Foundry (2014) | SIL OFL 1.1 | courtesy | no URL in its OFL.txt |
| Silkscreen | The Silkscreen Project Authors (2001) | SIL OFL 1.1 | courtesy | https://github.com/googlefonts/silkscreen |
| M PLUS Rounded 1c (FF7 chapters only) | The Rounded M+ Project Authors (2016) | SIL OFL 1.1 | courtesy | no URL in its OFL file |

## 4. Art, models and tools

The painted art is generated locally and kept as images; no model weight ships. All of these live under `D:\Tools\`
outside the repository (`docs/ART-PIPELINE.md` §8).

| Work | Author | Licence | Tier | Link |
|---|---|---|---|---|
| Animagine XL 4.0 Opt (art checkpoint) | not recorded in `docs/ART-PIPELINE.md`; take the name from the publisher's model card | CreativeML Open RAIL++-M (use-based restrictions travel with redistribution of the model, which we do not do) | courtesy | no URL recorded |
| IP-Adapter Plus SDXL ViT-H (h94/IP-Adapter) | h94 | Apache-2.0 | courtesy | https://huggingface.co/h94/IP-Adapter |
| CLIP-ViT-H-14-laion2B-s32B-b79K (image encoder) | LAION | MIT | courtesy | https://huggingface.co/h94/IP-Adapter (`models/image_encoder`) |
| RealESRGAN x4plus (upscaler) | xinntao | BSD-3-Clause | courtesy | https://github.com/xinntao/Real-ESRGAN |
| rembg with isnet-anime weights (cutouts) | danielgatis | as published (licence not recorded in ART-PIPELINE.md; confirm) | courtesy | https://github.com/danielgatis/rembg |
| ComfyUI | ComfyUI authors | GPL-3.0 | courtesy | no URL recorded |
| ComfyUI_IPAdapter_plus | cubiq | GPL-3.0 | courtesy | no URL recorded |
| three.js 0.186.0 (the renderer; `package.json` dependency, shipped inside the bundle) | three.js authors | MIT (the MIT notice must travel with the code; not checked whether the minified bundle keeps it) | courtesy, but verify | https://threejs.org |

## 5. The fan-project disclaimer the game already uses

The only in-game wording today is the title screen's eyebrow, `src/app/screens/frontend/titleMarkup.ts`:

> An unofficial fan tribute

and the page description in `index.html`: "Pyrefly Reprise - an unofficial HD-2D fan tribute to Final Fantasy X and X-2."

The longer text already published is the README's (verbatim, `README.md` line 7):

> Final Fantasy X and X-2, their characters, worlds, and names are the property of Square Enix. This project is a
> non-commercial fan work, unaffiliated with Square Enix. All code, art, music, and writing here are original.

`docs/ART-PIPELINE.md` §8 adds: "This project is an unofficial fan tribute. Final Fantasy characters and settings are
property of Square Enix; generated likenesses inherit that and are not cleared for commercial use."

The mockups use the README paragraph unchanged. Wording for the game is Bailey's call; I wrote no new legal text.

## Open points found while compiling

1. **Merge order.** Three CREDITS files disagree on what is required (main: 2 lines; music-v2: 4; sfx-v2: 2 plus 3
   recordings plus the Voxengo line). The in-game data must be the union. A screen built from `main` alone would be
   short by two CC BY 4.0 lines (DRSKit, Arvedi) and three CC BY 4.0 recordings.
2. **ACE-Step has two lines.** main names v1 3.5B (Apache-2.0, still shipping the R1 cues); music-v2 names 1.5 (MIT).
   music-v2's required-lines block drops the v1 line although title, pause and chapter select still ship it. Credit both.
3. **Missing links.** VSCO 2 CE, VCSL, the Karoryfer packs, jRhodes3d, Surge XT, sfizz, Voxengo, DRSKit's https form and
   ComfyUI have no URL in any repo doc; the Animagine author and rembg's licence are not recorded either. They need
   checking against their official pages before the screen ships (that is a lookup, not a download).
4. **three.js notice.** Not verified that the production bundle keeps the MIT notice.
