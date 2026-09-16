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
 *   - `midScripts` everything **inside** the chain: the sword, the inert third
 *     Talk, **Jecht's death scene** (fired on his KO — it is mid-chain, not a
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
 * [writing-bible §5.4]. `victoryQuips` below is the end-of-chapter bank only.
 *
 * Mechanics hooks:
 *   - The in-battle **Talk** trigger: two charges, the effect lands on BFA's
 *     next turn which he then loses, and it is offered a useless third time
 *     [visual-bible §3.12.2]. The third, inert Talk is characterisation — it
 *     gets a line ("...") and nothing else. It is wired as its own ability id
 *     (`talk-inert`) because no trigger condition can count uses.
 *   - `form-change` when he draws the sword out of his own chest.
 *   - One `ko` beat per possessed aeon, and one entrance beat each. The
 *     entrances use `hp-below` at `fraction: 1` because the trigger vocabulary
 *     has no "enters the field" condition — it fires on the first evaluation
 *     after that combatant is in play. Same convention in Chapter 5.
 *   - Only the five mandatory aeons are wired [ffx/ids.ts `MANDATORY_AEON_IDS`].
 *     A trigger for an aeon Yuna never obtained simply never fires.
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
  victoryQuips: {
    // §5.4 — end-of-chapter only. The aeon kills serve no quip at all; their
    // grief beats live in `midScripts` below.
    tidus: ['...Okay. Next one.', 'That was for him.'],
    yuna: ['May they rest.', 'Thank you. All of you.'],
    auron: ["It isn't over.", 'Hmph.'],
    wakka: ['...Ya. Okay. Ya.', "Never doin' that again."],
    lulu: ["Don't celebrate yet.", 'Stay standing.'],
    kimahri: ['Kimahri remembers.', 'Kimahri stands with Yuna.'],
    rikku: ['...Can we not do that again?', 'Everybody in one piece?'],
  },
  mid: [
    {
      // The useless third Talk. Characterisation, not a mechanic.
      id: 'bfa-talk-inert',
      when: { type: 'ability-used', who: 'tidus', ability: 'talk-inert' },
      once: true,
      script: 'bfa-talk-inert',
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
      script: 'jecht-farewell',
    },
    { id: 'valefor-enters', when: { type: 'hp-below', who: 'valefor', fraction: 1 }, once: true, script: 'aeon-valefor' },
    { id: 'valefor-falls', when: { type: 'ko', who: 'valefor' }, once: true, script: 'aeon-valefor-falls' },
    { id: 'ifrit-enters', when: { type: 'hp-below', who: 'ifrit', fraction: 1 }, once: true, script: 'aeon-ifrit' },
    { id: 'ifrit-falls', when: { type: 'ko', who: 'ifrit' }, once: true, script: 'aeon-ifrit-falls' },
    { id: 'ixion-enters', when: { type: 'hp-below', who: 'ixion', fraction: 1 }, once: true, script: 'aeon-ixion' },
    { id: 'ixion-falls', when: { type: 'ko', who: 'ixion' }, once: true, script: 'aeon-ixion-falls' },
    { id: 'shiva-enters', when: { type: 'hp-below', who: 'shiva', fraction: 1 }, once: true, script: 'aeon-shiva' },
    { id: 'shiva-falls', when: { type: 'ko', who: 'shiva' }, once: true, script: 'aeon-shiva-falls' },
    { id: 'bahamut-enters', when: { type: 'hp-below', who: 'bahamut', fraction: 1 }, once: true, script: 'aeon-bahamut' },
    { id: 'bahamut-falls', when: { type: 'ko', who: 'bahamut' }, once: true, script: 'aeon-bahamut-falls' },
    {
      id: 'yu-yevon-arrives',
      when: { type: 'hp-below', who: 'yu-yevon', fraction: 1 },
      once: true,
      script: 'yu-yevon-arrives',
    },
  ],
  midScripts: {
    'bfa-talk-inert': [
      say('tidus', 'Hey! You still in there?'),
      beat(1600),
      say('jecht', '...'),
    ],
    'bfa-sword': [
      camera('action', 400),
      fx('bfa-draws-sword', 'braskas-final-aeon'),
      shake(10, 700),
      say('jecht', "Ha! Now we're playin'."),
      say('auron', 'Spread out. One swing takes us all.'),
      camera('idle', 400),
    ],
    'bfa-low': [
      say('jecht', 'Good. Good.'),
      say('jecht', "Don't you dare slow down now."),
    ],

    // --- The scene the whole chapter is for [writing-bible §3 E3 post] ----
    // Understate at the top, one unguarded line, cut within two.
    'jecht-farewell': [
      music(null, 900),
      camera('idle', 900),
      fx('aeon-breaks-apart', 'braskas-final-aeon'),
      hideActor('braskas-final-aeon', 900),
      // A man again, briefly, and smaller than Tidus remembers.
      showActor('jecht', { ms: 1100, facing: -1 }),
      say('jecht', 'Not bad.'),
      beat(1300),
      say('jecht', 'Not bad at all.'),
      say('tidus', "Don't. Don't do the thing where you—"),
      say('jecht', "The thing where I what? Say somethin' nice?"),
      say('jecht', 'You turned out fine, kid.'),
      say('jecht', "I had nothin' to do with it."),
      say('jecht', "That's the good part."),
      say('auron', "Jecht. It's finished."),
      say('jecht', 'Yeah.'),
      beat(1300),
      say('jecht', 'You were always such a stiff.'),
      beat(1600), // Auron almost smiles. He does not answer.
      say('jecht', "Tell Braska I did somethin' right eventually."),
      say('yuna', "I'll tell him myself. I promise."),
      say('jecht', '...Right.'),
      beat(1400),
      say('jecht', "C'mere, crybaby."),
      // The embrace holds for exactly one beat. Then pyreflies. Cut.
      setPose('tidus', 'ready'),
      wait(1400),
      fx('pyreflies-rising', 'jecht'),
      hideActor('jecht', 700),
      say('tidus', '...Yeah. Bye, Dad.'),
      say('auron', "Move. It isn't over."),
    ],

    // --- The gauntlet. A funeral with a health bar. -----------------------
    'aeon-valefor': [
      music(null, 800),
      sfx('yu-yevon-chant'), // Someone praying, too fast, forever.
      camera('idle', 900),
      wait(1600),
      say('rikku', 'What is that noise? Make it stop—'),
      say('auron', 'That is Yu Yevon.'),
      say('auron', 'It has been saying that for a thousand years.'),
      say('tidus', 'Saying what?'),
      say('auron', 'Nothing.'),
      say('auron', 'It stopped meaning anything a long time ago.'),
      beat(1600), // It enters Valefor. The aeon's eyes go wrong.
      say('yuna', '...Oh.', { emotion: 'pained' }),
      say('lulu', "Yuna. You don't have to be the one who—"),
      say('yuna', 'Yes. I do.'),
      beat(1400),
      say('yuna', 'They came when I called.'),
      say('yuna', "I'll be here when they go."),
      // Wakka starts the prayer gesture, stops halfway, lets his hands fall.
      setPose('wakka', 'pray'),
      wait(1200),
      setPose('wakka', 'idle'),
      say('yuna', 'Valefor. You always came first.'),
      music('boss-yu-yevon', 1200),
    ],
    'aeon-valefor-falls': [
      say('yuna', "Rest now. You've carried enough."),
      beat(1400),
    ],
    'aeon-ifrit': [
      say('yuna', 'Ifrit.'),
      say('yuna', 'I know. I called you anyway.'),
    ],
    'aeon-ifrit-falls': [
      beat(1400),
      say('auron', "Don't look away. She isn't."),
    ],
    'aeon-ixion': [
      say('yuna', 'Ixion. I never once had to ask twice.'),
    ],
    'aeon-ixion-falls': [
      say('yuna', 'Thank you.'),
      beat(1600),
    ],
    'aeon-shiva': [
      say('yuna', 'Shiva. You always came quietly.'),
      beat(1300),
    ],
    'aeon-shiva-falls': [
      // Kimahri salutes, Ronso style, and says nothing.
      setPose('kimahri', 'ready'),
      wait(1600),
      setPose('kimahri', 'idle'),
    ],
    'aeon-bahamut': [
      say('yuna', 'Bahamut.'),
      beat(1400),
      say('yuna', 'Tell the boy I said thank you.'),
    ],
    'aeon-bahamut-falls': [
      camera('idle', 700),
      say('tidus', 'Yuna. Look at me.'),
      say('tidus', 'Just for a second, look at me.'),
      beat(2000), // She doesn't.
    ],
    'yu-yevon-arrives': [
      camera('action', 800),
      fx('yu-yevon-reveal', 'yu-yevon'),
      say('tidus', "That's it? That's what ate the world?"),
      say('auron', 'Something small can eat anything.'),
      say('auron', 'Give it a thousand years.'),
      camera('idle', 600),
    ],
  },
};

export default braskasFinalAeonScripts;
