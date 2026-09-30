// Hand-written copy for the page. Each line is condensed from the research JSON (camera.where,
// height, distance, lens, movement) and kept to what the sources say. Trusted HTML strings only here.

// Shot id -> { cam: one or two sentences, h: short camera-height line }
export const CAM = {
  'co-battle-start': {
    cam: 'A low, tight view of the impact, a petal-burst wipe, then a wide arena shot from the side (from behind and above the party for a boss). The heroes are small in the lower frame and a blur whip hands over to the first command shot.',
    h: 'Ground level for the impact, then about 1.5 to 2.5 m up, level or tipped slightly down',
  },
  'co-command': {
    cam: 'Behind and slightly beside the acting hero, who stands in the left third and fills half to two thirds of the frame height, about 2 to 3 m away. The lens is normal and the camera barely drifts; a whip under half a second brings you into the shot.',
    h: 'Chest to head height of a standing hero, looking level',
  },
  'co-skill-select': {
    cam: 'The same side as the command shot, closer and a little lower, so the hero fills two thirds to three quarters of the frame height at the lower left. A whip of about 0.6 seconds with an ink burst opens the list, then the camera holds.',
    h: 'A little below head height, looking level to slightly up',
  },
  'co-target-select': {
    cam: "A hard cut, in under 0.2 seconds, to a close view of the enemy from the party's side and slightly low. A giant fills the frame from about 3 to 5 m, then the camera drifts slowly while you choose.",
    h: 'Chest to knee height, looking slightly up',
  },
  'co-skill-exec': {
    cam: 'Each skill plays its own run of two to five shots: the caster low and full-body, a close-up with the timing prompt, a whip to the enemy for the hit, then a wide pull-back. Expect cuts, blur, shake, slow motion on the impact and some tilted frames.',
    h: 'Mostly knee to waist height, sometimes ground-level or overhead; the angle swings from about 30 to 170 degrees in one skill',
  },
  'co-free-aim': {
    cam: 'Not found in any official footage we could frame-check. The only remark in print is that Free Aim zooms in and the reticle turns into crosshairs. We have not drawn this shot.',
    h: 'Not found',
  },
  'co-telegraph': {
    cam: 'Either a hard cut to an extreme close-up of the enemy charging, held for 5 to 6 seconds, or, for a jump attack, a low view behind the heroes that tilts up to follow the giant out of frame and snaps down as it lands.',
    h: "The enemy's chest for the close-up; the heroes' knee height for the jump",
  },
  'co-enemy-turn': {
    cam: 'Wide and low, behind the party and looking across the arena. The heroes stand in a loose row in the lower part of the frame and the enemy fills the upper half. The camera mostly holds or drifts, with short cutaways on hits and dodges.',
    h: 'Knee height up to about 2.5 m, level to slightly down; lower as a big hit lands',
  },
  'co-parry-counter': {
    cam: 'The wide view holds while PARRIED floats up. Then a hard cut to a fast, low, close sequence that swings around the enemy and chases the counter, with blur, spins, shake and slow motion on the strongest hit, before settling back to wide.',
    h: 'Near ground level',
  },
  'co-gradient': {
    cam: "The screen dims after a short slow-motion dip, and the wide enemy-turn camera holds while a golden ring swirls around the hero. The Gradient Attack's own cinematic was not seen.",
    h: 'Roughly waist height',
  },
  'co-break': {
    cam: 'No dedicated Break camera was found. A broken enemy gets an extreme low, very close, heavily blurred slash, with a huge damage number and a small BROKEN tag under it, for a second or two.',
    h: 'Very low, near ground level',
  },
  'co-kill': {
    cam: 'The camera drops low and slows down: a wide, side-on view with crystal shards blooming around the enemy in one fight, a close, low view of a giant falling in slow motion in another. One clip runs a much longer finisher of about 14 seconds and ten cuts.',
    h: 'Low, knee to waist height',
  },
  'co-victory': {
    cam: 'Nothing new is staged. The camera holds the last shot, slightly darkened, and the results plate is laid over it about a second after the kill.',
    h: 'Same as the kill shot: low',
  },
  'co-static-wide': {
    cam: 'With the Camera Movement option off, the camera stops following the action and holds a wider, stationary view behind the party. The HUD is the same.',
    h: 'Not found',
  },
  'p5-encounter': {
    cam: "Behind Joker's shoulder on the strike, then a dark leap cut-in, close-ups of the target and a red-glow shot from behind his hip looking up at the enemy. The cuts are hidden behind ink shapes and a shard wipe reveals the command shot; there is no fly-in over the arena.",
    h: 'Waist to chest height; ground-skimming in the leap cut-in',
  },
  'p5-command': {
    cam: 'Behind the acting character, about 50 degrees off the line to the enemy, with the character in the left third and the enemy right of centre. Hip height, tilted slightly up, wide lens, and no camera movement at all: only the menu ring animates.',
    h: 'Hip to waist height, tilted slightly up at the enemy',
  },
  'p5-skill-list': {
    cam: "The camera re-seats low behind the hero's Persona, a huge dark silhouette in the lower-left foreground, with the enemy dimmed right of centre. The list slides in over the left half in under 0.6 seconds, then the frame holds.",
    h: 'Low, looking across the Persona',
  },
  'p5-target': {
    cam: 'The command shot stays exactly as it was. A red reticle hops between enemies and a red-ray flash of about 0.2 seconds confirms the pick. Analyze cuts to a full-screen enemy page and back.',
    h: 'Hip height, as in the command shot',
  },
  'p5-gun': {
    cam: 'Choosing Gun does not move the camera; the ring re-forms with an ammo counter. The shot itself cuts to a close side-on view of the pistol being raised, then a wide with a damage pop, in about one second.',
    h: 'Hip to chest height, close',
  },
  'p5-summon-cast': {
    cam: 'After the confirm flash the camera drops to ground level under the Persona, then swings to a wide three-quarter view with the hero small in the left foreground and the enemy at the centre. Three to five hard cuts in about four seconds, with a short whip on the impact.',
    h: 'Ground level for the Persona; hip height for the impact',
  },
  'p5-melee': {
    cam: 'A low side-on camera near the floor, slightly behind the attacker, who crosses the frame. A black-and-white splash covers the enemy for a few frames on the hit, then the camera settles wide. Two or three cuts, about 1.5 to 2.5 seconds.',
    h: 'Floor to knee height',
  },
  'p5-weakness': {
    cam: 'Not a camera move. The wide command shot stays and graphics stack on top: an eyes-strip cut-in, the hit, a WEAK or CRITICAL burst, the knockdown, a big 1 MORE title, then the ring returns.',
    h: 'Unchanged from the wide shot; the graphics do the work',
  },
  'p5-holdup': {
    cam: "When the last enemy drops, a blurred whip-pan lands behind Joker's left shoulder with his pistol raised. The downed shadows lie at the centre with the other thieves stepped into a ring around them; the camera stays low and tilts slightly during the burst, then levels once the menu is up.",
    h: 'Low, about the waist of the standing thieves',
  },
  'p5-allout': {
    cam: 'The 3D scene is dropped. A comic face card of about a second, a flat red plane of black silhouettes and fast cuts for about four seconds, the leader in profile, then a finish card for that character. It is all flat 2D, so there is no lens.',
    h: 'Not applicable: a flat 2D plane',
  },
  'p5-negotiation': {
    cam: 'No new camera. The Hold Up scene stays behind, dimmed to about a third, with a follow-spot on the shadow. The picture is static; panels and answer boxes slide in over it.',
    h: 'Low, as in Hold Up',
  },
  'p5-baton': {
    cam: "For the choice, a cut to a reverse shot: the camera stands in front of the thieves at eye level, looking back at them. The pass itself is a close two-shot in a black void at hip height, then a title, a radial burst and the receiver's ring.",
    h: 'Eye level for the choice; hip height for the pass',
  },
  'p5-enemy-turn': {
    cam: "Seen only in an unofficial capture. The party HUD stays, the enemy's skill name appears in the top-left banner, and the camera cuts to a front three-quarter close-up of the enemy from the party's side for about two seconds.",
    h: 'Chest height, front three-quarter on the enemy',
  },
  'p5-victory': {
    cam: 'After the last kill the camera drops very low for a tilted portrait of the leader, gun raised, then turning to face the camera. Result cards then pop in over the scene.',
    h: 'Very low, tilted',
  },
  'p5r-showtime': {
    cam: 'Not the battle camera. A hard wipe into a purpose-built stage for the pair, with the HUD off: two-shots, a top-down shot, a portrait framed in a moon-shaped window, tilted action cutaways and blade close-ups for about 16 seconds, then a white flash back to the battle.',
    h: 'Varies per cut: mostly hip to chest, plus a top-down and a tilted shot',
  },
};

// Section 3. Checked against the JSON; see the build notes for the one change.
export const BOTH = [
  'While you choose, <strong>the camera holds a composed shot</strong> of the acting hero in the left third facing the enemy, with the menu attached to the hero instead of a separate panel.',
  '<strong>Every action cuts to a new shot.</strong>',
  'Big moments become <strong>their own set pieces</strong>: short authored films in Clair Obscur, and in Persona mostly flat 2D graphic sequences (cut-ins, comic panels, silhouettes on red), plus Royal’s Showtime scenes.',
];
export const DIFFER = [
  {
    html: 'Clair Obscur’s camera <strong>moves inside its shots</strong> (the lens zooms, the frame shakes, time slows) and it also cues incoming attacks so you can parry.',
    note: 'The cue idea is one outlet’s report of a developer talk; the game’s own Camera Movement option text agrees that some attacks get harder to read with it off.',
  },
  {
    html: 'Persona’s command shot <strong>never moves</strong>; only the menu ring animates. Its flair comes from graphic design: typography, cut-ins and panels.',
    note: 'Measured on frames: the background did not shift by one pixel across four seconds of command select.',
  },
];

// Video id -> short label for the Watch chips.
export const VIDEO = {
  '55rUagD9sVQ': 'First Look',
  GByuD9VPa2I: 'IGN combat clip',
  LCy6vC00O0c: 'Developer_Direct',
  Zae9033XP7A: 'Early-story video',
  SvYgPEIGy0s: 'All-Out Attack short',
  eokDJhLtccU: 'Royal Vol.3',
  '3z-FuxEcAkY': 'Royal Vol.2',
  qhizIJLN1kg: 'Royal Take Over trailer',
  LFzh6T7bQ_M: 'Royal Change The World trailer',
  c1LFJgJZiO4: "Royal Finish 'Em trailer",
  wvpOwQaqRXA: 'PV#03 (2015)',
};

// Side-by-side table. `ours` items: img, name, score (HTML), frame (which chapter the thumbnail shows).
export const SIDE_ROWS = [
  {
    moment: 'Choosing a command',
    co: 'Behind and slightly beside the hero, who stands in the left third; the Battle Wheel hangs in the scene at their side and the shot barely moves.',
    p5: 'Behind the hero, who stands in the left third, with a fan of label plates pinned to their hand; the camera does not move at all. Royal is identical.',
    ours: [
      { img: 'p03-ffx.jpg', name: 'Hero Shoulder', score: '7.5', frame: 'FFX ch. 1' },
      { img: 'p02h-ffx2.jpg', name: 'Over the Shoulder, high', score: '7.5', frame: 'FFX-2 ch. 4' },
    ],
    note: 'Ours keeps today’s menu panel; neither of ours attaches the menu to the hero yet.',
  },
  {
    moment: 'Picking a target',
    co: 'A hard cut, in under 0.2 seconds, to a close view of the enemy, with a card at top left naming the skill.',
    p5: 'The camera stays put; a red reticle hops between enemies and a 0.2 second red-ray flash confirms the pick.',
    none: 'Not in our round yet.',
  },
  {
    moment: 'The action',
    co: 'Each skill is its own film of two to five shots, with tilted frames, shake, slow motion and a timing prompt in the middle.',
    p5: 'A short low cutaway, such as a ground-level Persona and then a wide impact, or a lunge with an ink-splash hit frame, in about two to five seconds.',
    ours: [{ img: 'm4-strip-ffx2.jpg', name: 'Camera cut per action (clip M4)', scores: [['8.8', 'FFX-2'], ['8.5', 'FFX']], frame: 'FFX-2 ch. 4 strip' }],
  },
  {
    moment: 'Weakness, big hits, team attacks',
    co: 'No special Break camera: an extreme low, blurred slash with a huge number and a BROKEN tag. The Gradient Counter dims the screen and rings the hero in gold; the Gradient Attack’s own film was not seen.',
    p5: 'Graphics stacked on the same wide shot: an eyes strip, a WEAK burst, a 1 MORE title. An All-Out Attack drops to a flat red plane of silhouettes; Royal adds Showtime, a staged scene for each pair.',
    ours: [
      { img: 'p14-ffx2.jpg', name: 'Panels', score: '6.8', frame: 'FFX-2 ch. 4' },
      { img: 'p12-ffx.jpg', name: 'Split-Diopter', score: '5.6', frame: 'FFX ch. 1' },
    ],
  },
  {
    moment: 'Enemy turn',
    co: 'Wide, low and behind the party, with cutaways on hits; a close-up of the wind-up shows what is coming so you can parry.',
    p5: 'The enemy’s skill name shows in the top-left banner and the camera cuts to a close front view of the enemy. Seen only in an unofficial capture, so low confidence.',
    ours: [
      { img: 'p04-ffx.jpg', name: 'Reverse Angle', score: '6.7', frame: 'FFX ch. 1' },
      { img: 'p07-ffx2.jpg', name: 'Colossus', score: '6.8', frame: 'FFX-2 ch. 4' },
    ],
  },
  {
    moment: 'Victory',
    co: 'The camera holds the last shot, slightly darkened, and the results plate is laid over it.',
    p5: 'A low, tilted portrait of the leader first, then result cards pop in over the scene.',
    ours: [{ img: 'p22-ffx.jpg', name: 'Hero Poster', score: '7.8', frame: 'FFX ch. 1' }],
  },
];

// Thumbnails (made with PIL from docs/concepts/perspectives-2026-09-27/; sizes as written).
export const OUR = {
  'p03-ffx.jpg': { w: 960, h: 540, alt: 'Our Hero Shoulder mockup, Final Fantasy X chapter 1: the party seen from behind, the command menu at the left and the boss right of centre.' },
  'p02h-ffx2.jpg': { w: 960, h: 540, alt: 'Our Over the Shoulder mockup with a high camera, Final Fantasy X-2 chapter 4.' },
  'm4-strip-ffx2.jpg': { w: 1200, h: 568, alt: 'Six-frame strip of our per-action camera clip M4, Final Fantasy X-2 chapter 4: command over the hero’s shoulder, the hit side-on, the enemy turn, a wind-up, the hit landing and a low victory pose.' },
  'p14-ffx2.jpg': { w: 960, h: 540, alt: 'Our Panels mockup, Final Fantasy X-2 chapter 4.' },
  'p12-ffx.jpg': { w: 960, h: 540, alt: 'Our Split-Diopter mockup, Final Fantasy X chapter 1.' },
  'p04-ffx.jpg': { w: 960, h: 540, alt: 'Our Reverse Angle mockup, Final Fantasy X chapter 1.' },
  'p07-ffx2.jpg': { w: 960, h: 540, alt: 'Our Colossus mockup, Final Fantasy X-2 chapter 4.' },
  'p22-ffx.jpg': { w: 960, h: 540, alt: 'Our Hero Poster mockup, Final Fantasy X chapter 1.' },
};

// "Where the sources are thin", condensed to one line each from the two research notes.
export const THIN_CO = [
  'No camera numbers are published; every height, distance and angle is read off frames.',
  'Free Aim: the aiming camera is not in any official footage we could check; print only says it zooms in.',
  'Final Fantasy X and the battle camera: no source ties them. FFX is credited for party, pacing and story only.',
  'Not seen: the Gradient Attack cinematic and any dedicated Break camera.',
  'Target select with several enemies was seen only as a swing past the hero.',
  'The footage is pre-release (an early build, a March 2025 preview, a January 2025 build), so release details may differ.',
  'Second-hand: the camera-as-cue remark is one outlet’s report of a talk, the Unreal Engine interview came from an archive copy, and option texts come from a how-to page.',
  'Not opened: Steam Community threads (age-gated) and the official Free Aim clip on X (HTTP 402).',
  'Several official uploads were age-gated; Sandfall’s own uploads of the same content were used instead.',
  'Audio was not analysed; the Developer_Direct combat talk was read for footage and captions only.',
];
export const THIN_P5 = [
  'No developer talk on the battle camera itself; only Hashino’s general 2023 remark and Broche’s 2025 description.',
  'No official frame for the negotiation screens, the base-game Baton Pass, a damaging enemy attack, the 1 MORE title, the Analyze page, the Gun ring or a Showtime prompt; these come from unofficial captures or are not found.',
  'Ten official trailers are age-gated and one asked for a bot check; none was viewed and nothing was bypassed.',
  'Blocked pages not read: Megami Tensei Wiki, Fandom, GameFAQs, GameSpot, GodisaGeek, Twinfinite and the Steam store page itself.',
  'Height, angle and lens are eyeballed from frames, and each timing is good to about half a second.',
  'Royal was not observed for the ambush title, negotiation, enemy turns or an ordinary victory; those read “same” only because no source lists a change.',
  'The Japanese and English builds differ in text (Baton Touch and Baton Pass, one button hint); whether that hint changed in Royal is not established.',
];

// Royal changes -> source links. A number is an entry in the Persona source list; "yt:ID@seconds" is a checked video moment.
export const ROYAL_SRC = [
  [/^Showtime/, [['Royal Vol.3 0:31', 'yt:eokDJhLtccU@31'], ['PlayStation.Blog Japan', 11], ['Screen Rant', 15], ['RPG Site', 12], ['TheGamer', 16], ['CBR', 17]]],
  [/^Baton Pass Rank/, [['Royal Vol.3 1:21', 'yt:eokDJhLtccU@81'], ['PlayStation.Blog Japan', 11], ['Push Square', 14], ['TheGamer', 19]]],
  [/^All-Out Attack finish/, [['Royal Vol.2 1:40', 'yt:3z-FuxEcAkY@100'], ['PlayStation.Blog Japan', 11]]],
  [/^Command shot/, [['Early-story video 3:52', 'yt:Zae9033XP7A@232'], ['Royal Vol.3 1:16', 'yt:eokDJhLtccU@76'], ['Royal Vol.2 1:36', 'yt:3z-FuxEcAkY@96'], ['All-Out Attack short 0:08', 'yt:SvYgPEIGy0s@8'], ['Push Square', 14]]],
  [/^Grappling/, [['Royal Vol.2 0:59', 'yt:3z-FuxEcAkY@59']]],
  [/^Guns and shadows/, [['RPG Site', 12], ['PlayStation.Blog Japan', 11], ['Push Square', 14]]],
  [/^Other presentation/, [['Push Square', 14]]],
  [/^Platforms/, [['Push Square', 14], ['RPG Site, 2022', 13]]],
];

// Shots the research marks "same" in Royal only because no source lists a change (Royal not observed).
export const ROYAL_UNSEEN = new Set(['p5-negotiation', 'p5-enemy-turn', 'p5-victory']);

// Settings that touch the battle camera get a tag.
export const CAMERA_SETTING = [/^Camera Movement/, /^Camera Shake/, /^Battle camera/];

// Persona sources with several links or a messy line: clean title and a label for each extra URL.
export const P5_SRC_FIX = {
  35: { title: 'Steam, Persona 5 Royal (app 1687950; ATLUS/SEGA; listed 20 Oct 2022). The store page is age-gated, so its public data was read for the official screenshots', labels: ['store page', 'public data'] },
  36: { title: 'Game UI Database, Persona 5 Royal (id 618) and Persona 5 (id 72), with the Enemy Health and Damage and Skill Use listings. Image pages were not copied', labels: ['Royal', 'base game', 'Enemy Health & Damage', 'Skill Use'] },
  37: { title: 'Can I Play That?, accessibility reviews of Persona 5 (Mike Matlock, 2017-05-25) and Persona 5 Royal (2020-04-02). Neither covers battle camera or effects', labels: ['Persona 5', 'Persona 5 Royal'] },
};
