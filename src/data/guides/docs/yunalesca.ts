/**
 * Chapter 2, Lady Yunalesca (Zanarkand Dome): the guide's page for this fight.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Follows the FFX encounter guide for this boss in
 * our own words and in its order (layout: `../doc-types.ts`); `research/jegged-encounter-guides-ffx-a.md`
 * Chapter 2 holds the page and every difference. HP, Steal and Drops are the numbers this game uses;
 * her buff-stripping counter is printed under the name the game gives it.
 *
 * The panel opens at the phase on the field: the header for Form I, then each phase's own stat
 * line (`formIndex` 1 and 2).
 */

import type { GuideDoc } from '../doc-types.ts';

export const YUNALESCA_DOC: GuideDoc = {
  id: 'yunalesca',
  game: 'ffx',
  bossIds: ['yunalesca'],
  blocks: [
    {
      t: 'p',
      text: 'A fight that needs preparing for is ahead. Berserk is off the table now, so take off any armour with Berserk Ward or Berserkproof.',
    },
    {
      t: 'p',
      text: 'What you will meet instead is Darkness, aimed at characters who attack normally, and Silence, aimed at spellcasters.',
    },
    {
      t: 'p',
      text: 'Give the fighters (Tidus, Auron, Wakka and Kimahri) Dark Ward or Darkproof armour, and the casters (Yuna and Lulu) Silence Ward or Silenceproof.',
    },
    { t: 'head', at: ['yunalesca#0'], title: 'Yunalesca', tag: 'Boss Battle' },
    { t: 'p', text: 'Three phases, and a new form for each.' },
    {
      t: 'field',
      label: 'In Game Description',
      value:
        'She heals Zombies with Curaga and Regen, and Holy Water is what cures Zombie. Her counters dispel buffs, and her Mind Blast puts a curse on aeons.',
    },
    { t: 'field', label: 'Phase 1: HP', value: '24,000' },
    {
      t: 'p',
      text: 'Phase 1 gives her two counters. Hit her physically and the attacker is Blinded; hit her with magic and the caster is Silenced.',
    },
    {
      t: 'p',
      text: "Esuna handles both. Items work too: Blind yields to Eye Drops and Silence to Echo Screens, while a Remedy cures either. Rikku's Al Bhed Potions cure Silence and heal in one move.",
    },
    { t: 'field', at: ['yunalesca#1'], label: 'Phase 2: HP', value: '48,000' },
    {
      t: 'p',
      text: 'Now she uses Hellbiter to turn the whole party into Zombies, then casts healing spells that hurt Zombies. Your own healing spells and items hurt them too.',
    },
    {
      t: 'p',
      text: 'Curing everyone just makes her cast Hellbiter again, so leave at least one character a Zombie at all times. Heal with Holy Water when needed, and let Yuna Dispel any Regen she puts on your party.',
    },
    { t: 'field', at: ['yunalesca#2'], label: 'Phase 3: HP', value: '60,000' },
    {
      t: 'p',
      text: 'Her new spell is Mega Death, which KOs anyone who is not a Zombie. That is one more reason never to cure the last Zombie.',
    },
    { t: 'lead', text: 'Additional notes and strategies:' },
    {
      t: 'p',
      text: 'Holy hits her very hard, and Yuna is worth bringing for her Dispel and her healing. If Yuna knows Holy, have her blast away with it for a much easier fight.',
    },
    {
      t: 'p',
      text: "Yuna or Rikku can learn Holy at this point, using a Teleport Sphere or Return Sphere together with a Lv. 3 Key Sphere. It sits right along Rikku's usual route on the Sphere Grid.",
    },
    {
      t: 'p',
      text: 'Reflect on your party bounces the Phase 1 status counters back at her, and her Regen too in Phase 2. If she Regens herself, Dispel it, or she will out-heal you.',
    },
    {
      t: 'p',
      text: 'Dispelling Slap removes every beneficial status except Reflect, which makes Reflect the dependable one. Put it on Yuna first, and Yunalesca cannot silence her.',
    },
    {
      t: 'p',
      text: 'Armour that blocks Silence, Darkness and Confuse is good, but think twice about blocking Zombie: you want at least one character to keep it.',
    },
    { t: 'list', label: 'Steal', items: ['Stamina Tablet (common)', 'Farplane Wind (rare)'] },
    { t: 'list', label: 'Drops', items: ['Lv. 3 Key Sphere'] },
  ],
};
