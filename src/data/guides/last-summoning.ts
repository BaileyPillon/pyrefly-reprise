/**
 * The hidden Last Summoning (hidden FFX chapter 28; Yu Yevon takes the player's aeons one at a time, in the order the player picks)
 * [research/re-ffx-last-summoning.md "RE section n" (the possession chain's menu, battles, rows and the lock, read from the game's own files), research/ffx-bfa-yu-yevon.md (the Pagodas, the possessed-aeon
 * sequence and Yu Yevon), research/re-ffx-ai-yunalesca-bfa.md (the AI), research/re-ffx-yojimbo-sisters-feasibility.md and the aeon-side note]. Every cite below names one of them in the corpus's own form.
 *
 * Written against the tactic in `src/engine/tactics/last-summoning.ts`: every hint below explains a row that file asks for (or that Chapter III's line, which it delegates every ordinary turn to, asks for in these
 * very fights), so each line says why the command the player is told to press is the right one. Found only on this chapter's own board (`src/engine/tactics/lookup.ts#onLastSummoningBoard`): the possessed aeons and
 * Yu Yevon carry Chapter III's ids, and Chapter III keeps its own card (`./braskas-final-aeon.ts`), which this one stands in front of.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Aeons, Summon, the possession chain, Yojimbo's Pay and the Magus Sisters' orders exist only in FFX.
 *
 * **Jegged's guide does not cover this gauntlet** (the corpus note, `research/jegged-encounter-guides-ffx-a.md` Chapter 3: "the aeon gauntlet is not covered at all"), so every line here stands on the research and the
 * game's own files alone, and the lines about the Pagodas and Yu Yevon repeat Chapter III's, which follow it. **Not modelled in this build, so not promised:** the Sisters' other seven orders (only Combine powers is
 * built, so a Sister without it can only be sent away), the way the second and third Sister enter the real battle (RE section 9.6; all three stand from the first turn here) and a landed Zanmato's effect on a
 * Death-immune target (RE section 8.4).
 */

import type { ChapterGuide, GuideHint } from './types.ts';

/** The eleven enemy ids the chain fields, Chapter III's own (the twins carry the ids of the aeons they copy). Written out here: a guide data module imports no tactic. */
export const LAST_SUMMONING_GUIDE_IDS = [
  'possessed-valefor',
  'possessed-ifrit',
  'possessed-ixion',
  'possessed-shiva',
  'possessed-bahamut',
  'possessed-anima',
  'possessed-yojimbo',
  'possessed-cindy',
  'possessed-sandy',
  'possessed-mindy',
  'yu-yevon',
] as const;

/** The line every swing at a Sister gets: the tactic aims at Cindy while she stands and then at the Sister with the least HP left, so the reason is Cindy's, and then the other two's. */
function sisterHint(targetId: string): GuideHint {
  const cindy = targetId === 'possessed-cindy';
  return {
    when: { kinds: ['attack', 'overdrive'], targetId },
    text: cindy
      ? '{target} first: she mends and drains the others and throws the Delta Attack, so with her down only the Pagodas heal a Sister, and the Delta Attack can never come'
      : '{target} next: with Cindy down nothing but the Pagodas heals her, and with one Sister gone the Delta Attack can never come',
    cite: 'ffx-bfa-yu-yevon §2.2; re-ffx-last-summoning §6.2',
  };
}

export const LAST_SUMMONING_GUIDE: ChapterGuide = {
  id: 'last-summoning',
  title: 'The Last Summoning',
  bossIds: [...LAST_SUMMONING_GUIDE_IDS],

  rules: [
    {
      text: 'Every aeon Yu Yevon takes is fought next, as a copy of your own: the same Strength, Magic, Defense and maximum HP, at full HP. The stronger the aeon you give up, the harder its twin hits.',
      short: 'Each aeon you give up is fought next',
      cite: 'ffx-bfa-yu-yevon §2.2; re-ffx-last-summoning §2, §7',
    },
    {
      text: 'Summon works in every battle, but the aeons already taken are greyed out and the one in front of you is never offered. Nothing heals between battles, and a fallen aeon needs more battles to recover than the chain has left.',
      short: 'Taken aeons are greyed; nothing heals between links',
      cite: 'ffx-bfa-yu-yevon §2.3; re-ffx-last-summoning §2, §5',
    },
    {
      text: "The possessed Yojimbo strikes with Kozuka or Wakizashi, one of you at a time, and when his gauge is full his Zanmato is a flat 9,999 on everyone at the front. Each blow that reaches him charges the gauge, so end him quickly.",
      short: 'His Zanmato is a flat 9,999: end him fast',
      cite: 'ffx-bfa-yu-yevon §2.2; re-ffx-last-summoning §1.4, §6.1',
    },
    {
      text: 'The three Sisters are one battle, and Cindy keeps it going: she mends and drains, and when all three are alive with full gauges she calls the Delta Attack, six hits on everyone. Fell her first; every blow also charges the gauge of the Sister it lands on.',
      short: 'Fell Cindy first: she mends and calls the Delta',
      cite: 'ffx-bfa-yu-yevon §2.2; re-ffx-last-summoning §6.2',
    },
    {
      text: 'Yu Yevon answers every damaging action with a 9,999 Curaga on himself, but his own Gravija takes 75% of his current HP on most turns. Doom from a Candle of Life, or a blow bigger than what he has left, ends him; keep the Pagodas down.',
      short: 'Yu Yevon: Doom, or one blow bigger than his HP',
      cite: 'ffx-bfa-yu-yevon §3.4.1, §3.5; re-ffx-ai-yunalesca-bfa §4.2, §6.2, §6.3',
    },
  ],

  hints: [
    // ---- the player's own Yojimbo (the tactic's Pay row)
    {
      when: { labels: ['Pay'] },
      text: 'Pay for his best command: each doubling of the payment adds the same step to his motivation, and from a motivation of 63 the roll can no longer fall below Wakizashi on all, whatever the monsters’ Zanmato resistance',
      cite: 'ffx-combat-core §6.6; re-ffx-last-summoning §8.1',
    },
    // ---- the player's own Sisters (the tactic's Combine row)
    {
      when: { labels: ['Combine'] },
      text: 'All three Sisters are ready: Cindy throws the Delta Attack, six hits of Magic with no defence against them, on everyone the twin has at the front',
      cite: 'ffx-combat-core §6.3; re-ffx-last-summoning §1.4, §6.2',
    },
    {
      when: { kinds: ['dismiss'] },
      text: 'The Sisters have nothing built to do until all three gauges are full: send them away and call them again with a Grand Summon, which arrives full',
      cite: 'ffx-combat-core §6.2; re-ffx-last-summoning §5; re-ffx-yojimbo-sisters-feasibility §6',
    },
    // ---- the Sisters' fight (the tactic's focus: Cindy while she stands, then the Sister with the least HP)
    sisterHint('possessed-cindy'),
    sisterHint('possessed-sandy'),
    sisterHint('possessed-mindy'),
    // ---- the ordinary turns (Chapter III's line, in these fights)
    {
      when: { labels: ['Phoenix Down', 'Mega Phoenix', 'Life', 'Full-Life'] },
      text: 'Stand {target} up: a KO costs the Haste, the Protect and the Cheer stacks as well as the turn, and nothing heals between battles to make it good',
      cite: 'ffx-bfa-yu-yevon §2.3; re-ffx-last-summoning §2',
    },
    {
      when: { labels: ['Curaga', 'Cura', 'Cure', 'X-Potion', 'Hi-Potion', 'Potion'] },
      text: 'Heal {target} now: whatever is left carries into the next battle, and the Pagodas’ Power Wave puts 1,500 back on the twin every cast',
      cite: 'ffx-bfa-yu-yevon §1.4; re-ffx-last-summoning §2',
    },
    {
      when: { labels: ['Protect'] },
      text: 'Protect halves the physical blows here — Kozuka, Wakizashi, Camisade, Razzia and Passado are all physical — though not the fixed 9,999 of Zanmato or the Delta Attack',
      cite: 'ffx-bfa-yu-yevon §2.2; re-ffx-last-summoning §1.4',
    },
    {
      when: { labels: ['Ether', 'Turbo Ether', 'Elixir'] },
      text: 'Keep the healer’s MP up: nothing refills it between battles, and the chain is up to nine long',
      cite: 'ffx-bfa-yu-yevon §2.3; re-ffx-last-summoning §2',
    },
    {
      when: { bossId: 'yu-yevon', labels: ['Candle of Life'] },
      text: 'Doom kills him in three of his own turns and deals no damage at all, so it never arms the Curaga counter — and the Pagodas’ Power Wave cannot strip it',
      cite: 'ffx-bfa-yu-yevon §3.2, §3.5',
    },
    {
      when: { bossId: 'yu-yevon', labels: ['Defend'] },
      text: 'Idle on purpose: Gravija can never KO anyone (75% of current HP), so with the Pagodas suppressed the party is refusing a race it cannot lose',
      cite: 'ffx-bfa-yu-yevon §3.3, §3.5',
    },
    {
      when: { bossId: 'yu-yevon', kinds: ['attack'] },
      text: 'Keep the Pagodas down, not Yu Yevon — their Power Wave heals him 1,500 a cast, which is more than Gravija takes off him once he is low',
      cite: 'ffx-bfa-yu-yevon §1.4, §3.5',
    },
    {
      when: { kinds: ['overdrive'] },
      text: 'Spend the gauge on the twin: it has the HP of your own aeon, and the Pagodas’ Power Wave heals it 1,500 a cast, so finishing faster beats chasing the Pagodas',
      cite: 'ffx-bfa-yu-yevon §2.2, §1.4',
    },
    {
      when: { kinds: ['attack'] },
      text: 'Swing at the twin, not the Pagodas: it is your own aeon at full HP, and finishing faster is the only answer to the Power Wave',
      cite: 'ffx-bfa-yu-yevon §2.2, §1.4',
    },
  ],

  watch: [],

  phases: [
    {
      bossId: 'possessed-valefor',
      label: 'Possessed Valefor',
      note: 'Sonic Wings on about half its turns, otherwise a plain Attack; at a full gauge its Overdrive (Energy Blast if your Valefor knows it, else Energy Ray) hits everyone at the front. No breaks or statuses take.',
      cite: 'ffx-bfa-yu-yevon §2.2; re-ffx-ai-yunalesca-bfa §5.5',
    },
    {
      bossId: 'possessed-ifrit',
      label: 'Possessed Ifrit',
      note: 'Meteor Strike on about half its turns, otherwise a plain Attack; Hellfire at a full gauge. It absorbs Fire, so leave Fire alone.',
      cite: 'ffx-bfa-yu-yevon §2.2; re-ffx-ai-yunalesca-bfa §5.5; re-ffx-last-summoning §1.2',
    },
    {
      bossId: 'possessed-ixion',
      label: 'Possessed Ixion',
      note: 'Aerospark on about half its turns, otherwise a plain Attack; Thor’s Hammer at a full gauge. It absorbs Lightning, so leave Lightning alone.',
      cite: 'ffx-bfa-yu-yevon §2.2; re-ffx-ai-yunalesca-bfa §5.5; re-ffx-last-summoning §1.2',
    },
    {
      bossId: 'possessed-shiva',
      label: 'Possessed Shiva',
      note: 'Heavenly Strike on about half its turns, otherwise a plain Attack; Diamond Dust at a full gauge. It absorbs Ice, so leave Ice alone.',
      cite: 'ffx-bfa-yu-yevon §2.2; re-ffx-ai-yunalesca-bfa §5.5; re-ffx-last-summoning §1.2',
    },
    {
      bossId: 'possessed-bahamut',
      label: 'Possessed Bahamut',
      note: 'Impulse on everyone at the front on about half its turns, otherwise a plain Attack; Mega Flare at a full gauge.',
      cite: 'ffx-bfa-yu-yevon §2.2; re-ffx-ai-yunalesca-bfa §5.5',
    },
    {
      bossId: 'possessed-anima',
      label: 'Possessed Anima',
      note: 'Pain on one of you every turn, never a plain Attack; Oblivion at a full gauge. Anima can be given up at any point: she has no fixed place in the order.',
      cite: 'ffx-bfa-yu-yevon §2.2; re-ffx-last-summoning §3; re-ffx-ai-yunalesca-bfa §5.5',
    },
    {
      bossId: 'possessed-yojimbo',
      label: 'Possessed Yojimbo',
      note: 'No plain Attack and no Daigoro: Kozuka or Wakizashi on a coin, power 14 either way, and at a full gauge Zanmato, a flat 9,999 on everyone at the front. His gauge gains 0 to 9 a turn and per blow, and 5 more from a Power Wave.',
      cite: 'ffx-bfa-yu-yevon §2.2; re-ffx-last-summoning §6.1',
    },
    {
      bossId: 'possessed-cindy',
      label: 'The Magus Sisters',
      note: 'Cindy mends, drains and calls the Delta Attack when all three gauges are full; Sandy wards Cindy with Reflect and hurries her sisters, then Razzia; Mindy flares through Cindy’s Reflect or flurries. A Pagoda’s Power Wave goes to the lowest gauge. Fell Cindy first.',
      cite: 'ffx-bfa-yu-yevon §2.2; re-ffx-last-summoning §6.2',
    },
    {
      bossId: 'possessed-sandy',
      label: 'The Magus Sisters',
      note: 'Cindy mends, drains and calls the Delta Attack when all three gauges are full; Sandy wards Cindy with Reflect and hurries her sisters, then Razzia; Mindy flares through Cindy’s Reflect or flurries. A Pagoda’s Power Wave goes to the lowest gauge. Fell Cindy first.',
      cite: 'ffx-bfa-yu-yevon §2.2; re-ffx-last-summoning §6.2',
    },
    {
      bossId: 'possessed-mindy',
      label: 'The Magus Sisters',
      note: 'Cindy mends, drains and calls the Delta Attack when all three gauges are full; Sandy wards Cindy with Reflect and hurries her sisters, then Razzia; Mindy flares through Cindy’s Reflect or flurries. A Pagoda’s Power Wave goes to the lowest gauge. Fell Cindy first.',
      cite: 'ffx-bfa-yu-yevon §2.2; re-ffx-last-summoning §6.2',
    },
    {
      bossId: 'yu-yevon',
      label: 'Yu Yevon',
      note: 'Every damaging action he takes is answered by a 9,999 Curaga on himself, but his own Gravija takes 75% of his current HP on most turns, so a blow worth more than what he has left ends him. Doom and Zombie beat him too.',
      cite: 'ffx-bfa-yu-yevon §3.2, §3.4.1, §3.5; re-ffx-ai-yunalesca-bfa §4.2, §6.2, §6.3',
    },
  ],

  linkTitles: {
    'possessed-valefor': 'Possessed Valefor',
    'possessed-ifrit': 'Possessed Ifrit',
    'possessed-ixion': 'Possessed Ixion',
    'possessed-shiva': 'Possessed Shiva',
    'possessed-bahamut': 'Possessed Bahamut',
    'possessed-anima': 'Possessed Anima',
    'possessed-yojimbo': 'Possessed Yojimbo',
    'possessed-cindy': 'The Magus Sisters',
    'possessed-sandy': 'The Magus Sisters',
    'possessed-mindy': 'The Magus Sisters',
    'yu-yevon': 'Yu Yevon',
  },
};

export default LAST_SUMMONING_GUIDE;
