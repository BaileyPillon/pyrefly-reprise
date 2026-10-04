/**
 * Chapter 3 — Braska's Final Aeon, the possessed aeons and Yu Yevon
 * [research/ffx-bfa-yu-yevon.md].
 *
 * A seven-battle chain that fields a **different boss in every link**, so this
 * guide registers all of them (same reason `src/engine/tactics/index.ts`
 * registers the one tactic under every chain id) and leans on `phases` keyed
 * by `bossId` to say what changed when the board does.
 */

import type { ChapterGuide } from './types.ts';

export const BRASKAS_FINAL_AEON_GUIDE: ChapterGuide = {
  id: 'braskas-final-aeon',
  title: "Braska's Final Aeon",
  bossIds: [
    'braskas-final-aeon',
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
  ],

  rules: [
    {
      text: "Talk is a panic button with two charges. It zeroes his Overdrive gauge and costs him his next turn — save both for form 2, where the Overdrive is Ultimate Jecht Shot or a limit-breaking Triumphant Grasp 2.",
      short: 'Talk has two charges — spend both in form 2',
      cite: 'ffx-bfa-yu-yevon §1.6',
    },
    {
      text: 'Jecht Beam petrifies at 100%, and the next physical shatters the victim permanently — a shatter is not revivable. Carry a Soft, or a Remedy, and spend it before his next turn.',
      short: 'Cure Petrify before the next physical shatters',
      cite: 'ffx-bfa-yu-yevon §1.6',
    },
    {
      text: 'The Yu Pagodas feed his gauge 20% per Power Wave. With both alive he Overdrives about every other turn; killing or slowing them is what makes the two Talk charges enough.',
      short: 'Suppress the Pagodas; they feed his Overdrive',
      cite: 'ffx-bfa-yu-yevon §1.6',
    },
    {
      text: 'Aeons are explicitly allowed here — he has a dedicated anti-aeon Overdrive precisely because the designers expected them. Shield cuts Jecht Bomber to a quarter.',
      short: 'Aeons are allowed — Shield quarters Jecht Bomber',
      cite: 'ffx-bfa-yu-yevon §1.6',
    },
    {
      text: 'Yu Yevon answers every damaging action with a 9,999 Curaga on himself, so do not hit him. Doom him with a Candle of Life, suppress the Pagodas, and let his own Gravija take 75% of his HP a cast.',
      short: 'Never damage Yu Yevon. Doom him instead',
      cite: 'ffx-bfa-yu-yevon §3.4.1, §3.5',
    },
  ],

  hints: [
    {
      when: { labels: ['Talk'] },
      text: 'Spend a Talk: his gauge is nearly full and the Overdrive it buys is party-wide — this resets it to zero and costs him the turn as well',
      cite: 'ffx-bfa-yu-yevon §1.6',
    },
    {
      when: { labels: ['Soft', 'Remedy', 'Esuna'], targetHas: 'petrify' },
      text: 'Unpetrify {target} before his next swing — Left-Arm Strike carries shatter chance 100, and a shattered character is gone for good',
      cite: 'ffx-bfa-yu-yevon §1.6',
    },
    {
      when: { labels: ['Holy Water', 'Remedy'], targetHas: 'zombie' },
      text: 'Triumphant Grasp left {target} zombified, and every heal aimed at a Zombie damages instead',
      cite: 'ffx-bfa-yu-yevon §1.6, ffx-combat-core §4.2',
    },
    {
      when: { labels: ['Haste', 'Hastega'] },
      text: 'Haste is the whole turn economy here: his Overdrive arrives on his clock, and the party only answers it by getting more turns in between',
      cite: 'ffx-bfa-yu-yevon §1.6',
    },
    {
      when: { labels: ['Slow'] },
      text: 'Slow a Pagoda and its Power Wave stops feeding him 20% a turn — two slowed Pagodas roughly halve how often he Overdrives',
      cite: 'ffx-bfa-yu-yevon §1.6',
    },
    {
      when: { labels: ['Protect'] },
      text: 'Blade Blitz is party-wide and physical, and it becomes his default action below half HP in form 2 — Protect halves every copy of it',
      cite: 'ffx-bfa-yu-yevon §1.6',
    },
    {
      when: { labels: ['Cheer'] },
      text: 'Cheer is +1 Strength a stack and physical damage received x(15-stacks)/15, which is exactly the class of damage this fight deals',
      cite: 'ffx-combat-core §2.9',
    },
    {
      when: { labels: ['Curaga', 'Cura', 'Cure', 'X-Potion', 'Hi-Potion'] },
      text: 'Bank the HP before the Overdrive, not after — Ultimate Jecht Shot is ~3,300 on everyone and it arrives between the healer’s turns',
      cite: 'ffx-bfa-yu-yevon §1.5, §1.6',
    },
    {
      when: { labels: ['Mega Phoenix', 'Phoenix Down', 'Life', 'Full-Life'] },
      text: 'Stand {target} up: a KO costs the Haste, the Protect and the Cheer stacks as well as the turn',
      cite: 'ffx-bfa-yu-yevon §1.6',
    },
    {
      when: { labels: ['Ether', 'Turbo Ether', 'Elixir'] },
      text: 'Keep the healer’s MP up — this chain is seven battles long and the party carries its MP across every one of them',
      cite: 'ffx-bfa-yu-yevon §1.7, §2.3',
    },
    {
      when: { labels: ['Candle of Life'] },
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
      when: { kinds: ['summon'] },
      text: 'Summon freely: Yuna may summon throughout both forms, and Shield cuts the anti-aeon Jecht Bomber to a quarter',
      cite: 'ffx-bfa-yu-yevon §1.6',
    },
    {
      when: { kinds: ['overdrive'] },
      text: 'Spend the gauge — the possessed aeons mirror your own roster and the chain gives the gauge back between links',
      cite: 'ffx-bfa-yu-yevon §2.2, §4.3',
    },
    {
      when: { kinds: ['attack'] },
      text: 'Swing at him rather than the Pagodas unless a Pagoda is the one feeding the gauge — form 2 starts at a fresh, full 120,000',
      cite: 'ffx-bfa-yu-yevon §1.6, §1.7',
    },
  ],

  watch: [],

  phases: [
    {
      bossId: 'braskas-final-aeon',
      aboveHpFraction: 0.5,
      label: 'Jecht',
      note: 'Left-Arm Strike by default, Jecht Beam about one turn in four (Petrify at 100%). The Overdrive is Triumphant Grasp: two hits and a Zombie.',
      cite: 'ffx-bfa-yu-yevon §1.6',
    },
    {
      bossId: 'braskas-final-aeon',
      belowHpFraction: 0.5,
      label: 'Jecht, below half',
      note: 'Blade Blitz replaces the normal attack outright, so the shatter follow-up now arrives as a party-wide swing, and the Overdrive becomes Ultimate Jecht Shot.',
      cite: 'ffx-bfa-yu-yevon §1.6',
    },
    {
      bossId: 'yu-yevon',
      label: 'Yu Yevon',
      note: 'Every damaging action he takes is answered by a 9,999 Curaga on himself. Doom, Zombie and attrition all beat him; damage does not.',
      cite: 'ffx-bfa-yu-yevon §3.2, §3.4.1, §3.5',
    },
    {
      bossId: 'possessed-anima',
      label: 'Possessed Anima',
      note: 'Your own aeon, mirrored: the same moveset, the same Overdrive, and the same weaknesses you built it around.',
      cite: 'ffx-bfa-yu-yevon §2.2',
    },
  ],
};
