/**
 * Chapter 3 scripts — Braska's Final Aeon -> possessed aeons -> Yu Yevon
 * (Dream's End / Inside Sin). Scene tags E3 **and** E4.
 *
 * Source: `research/writing-bible.md` §3 E3 (the father; the promise kept) and
 * §3 E4 (aftermath, not challenge), §4.1, §5.4.
 *
 * This chapter is one continuous run of battles with no menu between, so the
 * chapter breaks down like this:
 *   - `pre`        Jecht waiting inside Sin (E3 pre-battle).
 *   - `midScripts` everything **inside** the chain: the sword, the answered-with-
 *     silence Talk, **Jecht's death scene** (fired on his KO — it is mid-chain, not a
 *     post-battle scene), the chant, one entrance and one farewell per
 *     possessed aeon, and Yu Yevon's arrival.
 *   - `post`       the ending only: the chanting stops, Auron is sent, Tidus
 *     fades.
 *
 * E4's tone rule [writing-bible §3 E4]: aftermath, not challenge. Yu Yevon
 * never speaks [§1.13] — the party describes it instead, and their confusion
 * and pity *are* its characterisation. The party cannot lose (the fayth's
 * permanent Auto-Life), and the writing must not pretend otherwise — the dread
 * is that it will not stop, not that they will die.
 *
 * **Never fire a victory quip after a loss-shaped victory** — each destroyed
 * aeon is a bereavement, so every aeon KO owns a grief beat in `midScripts`
 * and the tally flourish stays suppressed for those links of the chain
 * [writing-bible §5.4]. The end-of-chapter card is quiet too: `victoryQuips` is
 * empty (PR-0187).
 *
 * Mechanics hooks:
 *   - The in-battle **Talk** trigger: two charges, the effect lands on BFA's
 *     next turn which he then loses, and it is offered a useless third time
 *     [visual-bible §3.12.2]. The beat is characterisation — Tidus calls out,
 *     Jecht answers with a line that is only ("..."). No trigger condition can
 *     count uses, so it fires on the **first** Talk and `once: true` retires
 *     it; the ability id is `'talk'`, the only id the menu marker publishes
 *     [`data/ffx/abilities/special-menu-markers.ts`]. **Known engine gap:** a
 *     `TriggerCommand` emits `action-start` with no `abilityId`
 *     [`battle/ffx/execute.ts` `case 'trigger'`], and `collectSignals` only
 *     records an ability use when `abilityId` is set, so this beat cannot fire
 *     until that emit carries `abilityId: 'talk'`. Neither file is ours.
 *   - Combatant ids in the gauntlet are `possessed-valefor` … `possessed-bahamut`,
 *     not the bare aeon names — the formations are built by
 *     `buildPossessedAeonChain` [`data/ffx/enemies/braskas-final-aeon.ts`].
 *   - `form-change` when he draws the sword out of his own chest.
 *   - One `ko` beat per possessed aeon, and one entrance beat each. The
 *     entrances use `hp-below` at `fraction: 1` because the trigger vocabulary
 *     has no "enters the field" condition — it fires on the first evaluation
 *     after that combatant is in play. Same convention in Chapter 5.
 *   - Only the five mandatory aeons are wired [ffx/ids.ts `MANDATORY_AEON_IDS`].
 *     A trigger for an aeon Yuna never obtained simply never fires.
 *   - Every trigger keeps `id === script`, because the engine emits
 *     `script-trigger` with the **id** and the presenter looks the script up by
 *     that name; and every mid-battle `say` carries an `auto`, because a beat
 *     that waits on a Confirm burns the presenter's 30 s budget and is then
 *     abandoned mid-scene. `src/story/registry.ts` tests both.
 */

import type { ChapterScripts } from '../dsl.ts';
import {
  battleStart,
  beat,
  camera,
  fade,
  fx,
  hideActor,
  music,
  narrate,
  results,
  say,
  setPose,
  sfx,
  shake,
  showActor,
  wait,
} from '../dsl.ts';

export const braskasFinalAeonScripts: ChapterScripts = {
  pre: [
    music('scene-dreams-end', 1400),
    camera('idle', 0),
    fade('clear', 1200),
    // Warm light, wrong light. Something enormous turns toward them.
    shake(4, 1200),
    wait(1600),

    say('jecht', 'Took ya long enough, kid.'),
    say('tidus', '...Dad.'),
    say('jecht', "Whoa. No 'old man'?"),
    say('jecht', 'You did grow up.'),
    say('auron', 'Jecht.'),
    say('jecht', "Hey. You're lookin' well for a dead guy."),

    say('yuna', "You're Sir Jecht. My father's guardian."),
    beat(1600), // He tries to tease her. He can't. Play the failed joke.
    say('jecht', "...Braska's girl. Yeah."),
    say('jecht', "He'd be real proud."),
    say('jecht', "For whatever a guy like me's word is worth."),

    say('jecht', "This thing's got me on a leash."),
    say('jecht', "And it's gettin' short."),
    say('tidus', "There's another way. There's always another—"),
    say('jecht', "Still cryin'. Figures."),
    beat(1400),
    say('jecht', "So don't. Just beat me."),
    say('jecht', 'Beat me properly.'),
    say('jecht', "You're gonna cry."), // [ICONIC QUOTE] — paraphrase-adjacent.
    beat(1300),
    say('jecht', 'You always cry.'),
    say('tidus', 'Not today, old man.', { emotion: 'determined' }),

    music('boss-jecht', 900),
    camera('action', 700),
    battleStart(),
  ],
  post: [
    // The chanting stops. The silence is enormous and nobody enjoys it.
    music(null, 1400),
    camera('victory', 900),
    wait(2600),
    results(),

    // The FFX ending cue. Chapter 5 does the same thing after its own
    // `results()` (`ffx2-vegnagun-shuyin.ts`, the E5-CODA block): the chapter
    // card lands in silence, then the theme comes up under the epilogue rather
    // than over the kill. `ending-ffx` is "Permission to stop"
    // [docs/audio/THEMES.md, cue map row 16] — solo piano first, so it can sit
    // under Auron's sending and still be there when Tidus goes.
    music('ending-ffx', 1800),

    camera('idle', 900),
    say('rikku', 'Is that it? Did we—'),
    say('wakka', "It's quiet. Ya. It's real quiet."),
    say('auron', "It's done."),
    beat(1400),
    say('auron', "That's all 'done' ever sounds like."),

    say('yuna', "Sir Auron. You're—"),
    say('auron', 'Overdue. By ten years.'),
    beat(1400),
    say('auron', 'Yuna. I never said this to your father.'),
    say('auron', 'Thank you. Now send me.'),

    // She dances. He watches Tidus, not her.
    setPose('yuna', 'cast'),
    fx('sending-dance', 'yuna'),
    wait(2200),
    say('auron', "It's been long enough."),
    beat(1300),
    say('auron', 'This is your world now.'), // [ICONIC QUOTE] — 5 words.
    fx('pyreflies-rising', 'auron'),
    hideActor('auron', 1400),

    // He notices before anyone else does.
    beat(1600),
    fx('fading-light', 'tidus'),
    say('tidus', "Hey. Hey, it's okay."),
    say('tidus', "The fayth are waking up. That's all."),
    say('yuna', "Don't. Don't say it's okay.", { emotion: 'pained' }),
    say('tidus', "Then don't say goodbye."),
    say('tidus', 'Say the other thing.'),
    beat(2000), // She doesn't. She runs, and she goes through him.
    setPose('yuna', 'turn-away'),
    fade('black', 1600),

    narrate("That's the end of my story."),
    narrate('I told it the way it happened, mostly.'),
    narrate('I left in the part where she kept walking.'),
    wait(1600),
  ],
  // PR-0187 (Bailey's pick A, decisions-2026-09-25 item 7; FFX only): no
  // victory line. This results card sits between Yu Yevon's death and the FFX
  // ending, and §5.4 says "never fire a victory quip after a story-critical
  // loss-shaped victory (E4's aeon kills)". Our reading: §5.4's table also lists
  // E4 as grim. Same as Chapter IX.
  victoryQuips: {},
  mid: [
    {
      // The useless third Talk. Characterisation, not a mechanic.
      id: 'bfa-talk',
      when: { type: 'ability-used', who: 'tidus', ability: 'talk' },
      once: true,
      script: 'bfa-talk',
    },
    {
      // He pulls the sword out of his own chest. Form indices are 0-based.
      id: 'bfa-sword',
      when: { type: 'form-change', who: 'braskas-final-aeon', form: 1 },
      once: true,
      script: 'bfa-sword',
    },
    {
      id: 'bfa-low',
      when: { type: 'hp-below', who: 'braskas-final-aeon', fraction: 0.2 },
      once: true,
      script: 'bfa-low',
    },
    {
      // Mid-chain, not post-battle: the chapter keeps running straight on.
      id: 'jecht-falls',
      when: { type: 'ko', who: 'braskas-final-aeon' },
      once: true,
      script: 'jecht-falls',
    },
    { id: 'valefor-enters', when: { type: 'hp-below', who: 'possessed-valefor', fraction: 1 }, once: true, script: 'valefor-enters' },
    { id: 'valefor-falls', when: { type: 'ko', who: 'possessed-valefor' }, once: true, script: 'valefor-falls' },
    { id: 'ifrit-enters', when: { type: 'hp-below', who: 'possessed-ifrit', fraction: 1 }, once: true, script: 'ifrit-enters' },
    { id: 'ifrit-falls', when: { type: 'ko', who: 'possessed-ifrit' }, once: true, script: 'ifrit-falls' },
    { id: 'ixion-enters', when: { type: 'hp-below', who: 'possessed-ixion', fraction: 1 }, once: true, script: 'ixion-enters' },
    { id: 'ixion-falls', when: { type: 'ko', who: 'possessed-ixion' }, once: true, script: 'ixion-falls' },
    { id: 'shiva-enters', when: { type: 'hp-below', who: 'possessed-shiva', fraction: 1 }, once: true, script: 'shiva-enters' },
    { id: 'shiva-falls', when: { type: 'ko', who: 'possessed-shiva' }, once: true, script: 'shiva-falls' },
    { id: 'bahamut-enters', when: { type: 'hp-below', who: 'possessed-bahamut', fraction: 1 }, once: true, script: 'bahamut-enters' },
    { id: 'bahamut-falls', when: { type: 'ko', who: 'possessed-bahamut' }, once: true, script: 'bahamut-falls' },
    {
      id: 'yu-yevon-arrives',
      when: { type: 'hp-below', who: 'yu-yevon', fraction: 1 },
      once: true,
      script: 'yu-yevon-arrives',
    },
  ],
  midScripts: {
    'bfa-talk': [
      say('tidus', 'Hey! You still in there?', { auto: 1000 }),
      beat(1600),
      say('jecht', '...', { auto: 1000 }),
    ],
    'bfa-sword': [
      camera('action', 400),
      fx('bfa-draws-sword', 'braskas-final-aeon'),
      shake(10, 700),
      say('jecht', "Ha! Now we're playin'.", { auto: 1000 }),
      say('auron', 'Spread out. One swing takes us all.', { auto: 1200 }),
      camera('idle', 400),
    ],
    'bfa-low': [
      say('jecht', 'Good. Good.', { auto: 1000 }),
      say('jecht', "Don't you dare slow down now.", { auto: 1200 }),
    ],

    // --- The scene the whole chapter is for [writing-bible §3 E3 post] ----
    // Understate at the top, one unguarded line, cut within two.
    //
    // A **chain seam**: the fight is over, the next link has not started, and
    // this is what the chapter was built to reach. It is still a mid-battle
    // script, so it runs against the presenter's 30 s abandon budget — which
    // the first draft of this scene overshot by half a minute, so the last
    // third of Jecht's goodbye was silently dropped every time. Trimmed to the
    // lines that carry it, with `auto` on each so nothing waits on a Confirm.
    'jecht-falls': [
      music(null, 900),
      camera('idle', 900),
      fx('aeon-breaks-apart', 'braskas-final-aeon'),
      hideActor('braskas-final-aeon', 900),
      // A man again, briefly, and smaller than Tidus remembers.
      showActor('jecht', { ms: 1100, facing: -1 }),
      say('jecht', 'Not bad.', { auto: 900 }),
      beat(1200),
      say('jecht', 'You turned out fine, kid.', { auto: 1000 }),
      say('jecht', "I had nothin' to do with it.", { auto: 1000 }),
      say('jecht', "That's the good part.", { auto: 1000 }),
      say('auron', "Jecht. It's finished.", { auto: 900 }),
      say('jecht', 'You were always such a stiff.', { auto: 1000 }),
      say('jecht', "Tell Braska I did somethin' right eventually.", { auto: 1100 }),
      say('yuna', "I'll tell him myself. I promise.", { auto: 1000 }),
      say('jecht', "C'mere, crybaby.", { auto: 1000 }),
      // The embrace holds for exactly one beat. Then pyreflies. Cut.
      setPose('tidus', 'ready'),
      wait(1200),
      fx('pyreflies-rising', 'jecht'),
      hideActor('jecht', 700),
      say('tidus', '...Yeah. Bye, Dad.', { auto: 1200 }),
      say('auron', "Move. It isn't over.", { auto: 900 }),
    ],

    // --- The gauntlet. A funeral with a health bar. -----------------------
    // The second chain seam: the chant starts, and the gauntlet is explained
    // once and never again. Same budget rule as `jecht-falls`.
    'valefor-enters': [
      music(null, 800),
      sfx('yu-yevon-chant'), // Someone praying, too fast, forever.
      camera('idle', 900),
      wait(1400),
      say('rikku', 'What is that noise? Make it stop—', { auto: 1100 }),
      say('auron', 'That is Yu Yevon.', { auto: 900 }),
      say('tidus', 'Saying what?', { auto: 900 }),
      say('auron', 'Nothing.', { auto: 900 }),
      say('auron', 'It stopped meaning anything a long time ago.', { auto: 1200 }),
      beat(1400), // It enters Valefor. The aeon's eyes go wrong.
      say('yuna', '...Oh.', { emotion: 'pained', auto: 1200 }),
      say('lulu', "Yuna. You don't have to be the one who—", { auto: 1000 }),
      say('yuna', 'Yes. I do.', { auto: 1100 }),
      beat(1200),
      say('yuna', 'They came when I called.', { auto: 1000 }),
      say('yuna', "I'll be here when they go.", { auto: 1200 }),
      // Wakka starts the prayer gesture, stops halfway, lets his hands fall.
      setPose('wakka', 'pray'),
      wait(1200),
      setPose('wakka', 'idle'),
      say('yuna', 'Valefor. You always came first.', { auto: 1300 }),
      music('boss-yu-yevon', 1200),
    ],
    'valefor-falls': [
      say('yuna', "Rest now. You've carried enough.", { auto: 1400 }),
      beat(1400),
    ],
    'ifrit-enters': [
      say('yuna', 'Ifrit.', { auto: 1000 }),
      say('yuna', 'I know. I called you anyway.', { auto: 1400 }),
    ],
    'ifrit-falls': [
      beat(1400),
      say('auron', "Don't look away. She isn't.", { auto: 1200 }),
    ],
    'ixion-enters': [
      say('yuna', 'Ixion. I never once had to ask twice.', { auto: 1400 }),
    ],
    'ixion-falls': [
      say('yuna', 'Thank you.', { auto: 1200 }),
      beat(1600),
    ],
    'shiva-enters': [
      say('yuna', 'Shiva. You always came quietly.', { auto: 1400 }),
      beat(1300),
    ],
    'shiva-falls': [
      // Kimahri salutes, Ronso style, and says nothing.
      setPose('kimahri', 'ready'),
      wait(1600),
      setPose('kimahri', 'idle'),
    ],
    'bahamut-enters': [
      say('yuna', 'Bahamut.', { auto: 1000 }),
      beat(1400),
      say('yuna', 'Tell the boy I said thank you.', { auto: 1400 }),
    ],
    'bahamut-falls': [
      camera('idle', 700),
      say('tidus', 'Yuna. Look at me.', { auto: 1100 }),
      say('tidus', 'Just for a second, look at me.', { auto: 1300 }),
      beat(2000), // She doesn't.
    ],
    'yu-yevon-arrives': [
      camera('action', 800),
      fx('yu-yevon-reveal', 'yu-yevon'),
      say('tidus', "That's it? That's what ate the world?", { auto: 1100 }),
      say('auron', 'Something small can eat anything.', { auto: 1000 }),
      say('auron', 'Give it a thousand years.', { auto: 1200 }),
      camera('idle', 600),
    ],
  },
};

export default braskasFinalAeonScripts;
