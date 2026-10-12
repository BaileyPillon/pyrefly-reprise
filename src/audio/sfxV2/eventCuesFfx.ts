/**
 * SFX parity, the FFX hooks (FFX only; AGENTS.md rule 14): one hook per spec row that has a moment in the presenter
 * to answer it. See `eventCues.ts` for the model. A row with no hook is listed in {@link FFX_UNHOOKED} with the
 * reason, and `tests/unit/audio-sfx-parity-events.test.ts` fails when a row is in neither.
 *
 * The hooks only ADD the recorded original's name to a cue the voice already chose (`battleVoice.ts`): `on` names
 * the stand-in the voice picked, so a hook can never contradict it. Order matters, first match wins, so a specific
 * hook (an ability, an actor) comes before the general one (an element, a status).
 *
 * Sources of the selectors (nothing here is game data of ours): the ability ids are the rows' own ids in
 * `src/data/ffx/**` (the tests read each one back from the data); the spell tier is the ability's `sfxKey` through
 * the alias table (`fire-2` is a Fira); the party weapons are `weapons.ts`; the rows are the spec's
 * (`D:/Tools/pyrefly-scratch/2026-10-10/sfx-parity/spec.md` section 1.3).
 */

import { atLanding, atOpening, flow, hook, menu, open, type Hook, type Unhooked } from './eventCues.ts';
import { WEAPON_CUES, type Weapon } from './weapons.ts';

const f = (row: string, cue: string, at: Parameters<typeof hook>[3], more: Parameters<typeof hook>[4] = {}): Hook => hook('ffx', row, cue, at, more);
const landing = (row: string, cue: string, who: Parameters<typeof atLanding>[3], then?: readonly string[]): Hook[] => atLanding('ffx', row, cue, who, then);
const opening = (row: string, cue: string, who: Parameters<typeof atOpening>[3], moments?: Parameters<typeof atOpening>[4]): Hook[] => atOpening('ffx', row, cue, who, moments);

/** FFX party weapons -> the row the spec names them by. */
const WEAPON_ROWS: ReadonlyArray<[Weapon, string]> = [
  ['sword', 'sword'],
  ['katana', 'katana'],
  ['spear', 'spear'],
  ['staff', 'staff'],
  ['blitzball', 'blitz'],
  ['doll', 'doll'],
  ['claw', 'claw'],
];

const weapons: Hook[] = WEAPON_ROWS.flatMap(([w, row]) => [
  f(`ffx.weapon.${row}.swing`, WEAPON_CUES[w].swing, { moment: 'attack', side: 'party', weapon: [w], on: WEAPON_CUES[w].swing }),
  f(`ffx.weapon.${row}.hit`, WEAPON_CUES[w].hit, { moment: 'damage', side: 'party', weapon: [w], on: WEAPON_CUES[w].hit }),
]);

/** The four elemental ladders: tier 3 falls back to 2, then 1 (the stand-in is one cue for all three today). */
const ladders: Hook[] = (['fire', 'ice', 'thunder', 'water'] as const).flatMap((e) => [
  f(`ffx.${e}.t3`, `${e}-3`, { moment: 'damage', on: e, tier: 3 }, { then: [`${e}-2`, e] }),
  f(`ffx.${e}.t2`, `${e}-2`, { moment: 'damage', on: e, tier: 2 }, { then: [e] }),
  f(`ffx.${e}.t1`, e, { moment: 'damage', on: e, tier: 1 }),
]);

/**
 * The Overdrive of each aeon (`category: 'overdrive'`, `animationKey: 'aeon-overdrive-*'` in `data/ffx/aeons`), and the
 * possessed aeon's own version of it (`data/ffx/enemies/braskas-final-aeon-abilities.ts`: the same effect, an enemy's id).
 * The party owns Valefor, Ifrit, Ixion, Shiva and Bahamut in the chapters' builds; Anima, Yojimbo and the Magus Sisters
 * are heard as the possessed aeons of Dream's End.
 */
const AEON_OVERDRIVES: ReadonlyArray<[string, readonly string[]]> = [
  ['valefor', ['energy-ray', 'energy-blast', 'possessed-valefor-energy-ray', 'possessed-valefor-energy-blast']],
  ['ifrit', ['hellfire', 'possessed-ifrit-hellfire']],
  ['ixion', ['thors-hammer', 'possessed-ixion-thors-hammer']],
  ['shiva', ['diamond-dust', 'possessed-shiva-diamond-dust']],
  ['bahamut', ['mega-flare', 'possessed-bahamut-mega-flare']],
  ['anima', ['oblivion', 'possessed-anima-oblivion']],
  ['yojimbo', ['zanmato', 'possessed-yojimbo-zanmato']],
  ['sisters', ['delta-attack', 'possessed-cindy-delta-attack']],
];

/** The hooks, most specific first. */
export const FFX_HOOKS: readonly Hook[] = [
  // ---- Seymour Flux (chapter 1): his moves are single samples; plain attack is a swing and a blow.
  ...opening('ffx.boss.flux.cleave', 'flux-cleave', { ability: ['cross-cleave'] }),
  ...landing('ffx.boss.flux.annihilation', 'flux-annihilation', { ability: ['total-annihilation'] }),
  ...landing('ffx.boss.flux.banish', 'flux-banish', { ability: ['banish'] }),
  f('ffx.boss.flux.attack', 'swing-flux', { moment: 'attack', actor: ['seymour-flux'], command: ['attack'] }),
  f('ffx.boss.flux.attack', 'hit-flux', { moment: 'damage', actor: ['seymour-flux'], command: ['attack'] }, { coveredBy: ['swing-flux'] }),

  // ---- Yunalesca (chapter 2).
  ...landing('ffx.boss.lady.hellbiter', 'lady-hellbiter', { ability: ['hellbiter'] }),
  ...landing('ffx.boss.lady.megadeath', 'lady-megadeath', { ability: ['mega-death'] }),
  ...landing('ffx.boss.lady.mindblast', 'lady-mindblast', { ability: ['mind-blast', 'mind-blast-aeon'] }),
  f('ffx.boss.lady.metamorph', 'lady-metamorph', { moment: 'form-change', actor: ['yunalesca'], on: 'boss-phase-shift' }),

  // ---- Braska's Final Aeon (chapter 3).
  ...landing('ffx.boss.fa.beam', 'fa-beam', { ability: ['jecht-beam'] }),
  ...landing('ffx.boss.fa.bomber', 'fa-bomber', { ability: ['jecht-bomber', 'jecht-bomber-2'] }),
  ...landing('ffx.boss.fa.grasp', 'fa-grasp', { ability: ['triumphant-grasp', 'triumphant-grasp-2'] }),
  ...opening('ffx.boss.fa.sword', 'fa-sword', { ability: ['draws-sword'] }),
  ...landing('ffx.boss.fa.shot', 'fa-shot', { ability: ['ultimate-jecht-shot'] }),
  ...landing('ffx.boss.fa.wave', 'fa-wave', { ability: ['power-wave-bfa', 'power-wave-aeon', 'gravija'] }),

  // ---- Boss reveals (the airship beast, Flux, Yunalesca): `BattleMoments.revealBoss`.
  f('ffx.boss.appear.evrae', 'appear-evrae', { moment: 'appear', actor: ['evrae'] }),
  f('ffx.boss.appear.flux', 'appear-flux', { moment: 'appear', actor: ['seymour-flux'] }),
  f('ffx.boss.appear.lady', 'appear-lady', { moment: 'appear', actor: ['yunalesca'] }),

  // ---- Overdrives: each character's opening (`BattleMoments.overdriveStart`).
  f('ffx.overdrive.tidus', 'overdrive-tidus', { moment: 'overdrive-start', actor: ['tidus'] }),
  f('ffx.overdrive.auron', 'overdrive-auron', { moment: 'overdrive-start', actor: ['auron'] }),
  f('ffx.overdrive.lulu', 'overdrive-lulu', { moment: 'overdrive-start', actor: ['lulu'] }),
  f('ffx.overdrive.wakka', 'overdrive-wakka', { moment: 'overdrive-start', actor: ['wakka'] }),

  // ---- The aeons' Overdrives, at their landing.
  ...AEON_OVERDRIVES.flatMap(([aeon, ids]) => landing(`ffx.aeon.${aeon}`, `aeon-${aeon}`, { ability: ids })),

  // ---- Kimahri's Lore breaths and the self-destruct: one sample at the first landing.
  ...landing('ffx.breath.fire', 'breath-fire', { ability: ['fire-breath'] }),
  ...landing('ffx.breath.stone', 'breath-stone', { ability: ['stone-breath'] }),
  ...landing('ffx.breath.bad', 'breath-bad', { ability: ['bad-breath'] }),
  ...landing('ffx.breath.aqua', 'breath-aqua', { ability: ['aqua-breath'] }),
  ...landing('ffx.explosion', 'explosion', { ability: ['self-destruct'] }),

  // ---- Dark magic, Demi, Ultima and Meteor.
  ...landing('ffx.dark.death', 'death', { ability: ['death', 'death-fury'] }),
  ...landing('ffx.dark.drain', 'drain', { ability: ['drain', 'drain-fury', 'absorb'] }),
  ...landing('ffx.dark.osmose', 'osmose', { ability: ['osmose-spell', 'osmose-fury', 'osmose'] }),
  ...landing('ffx.dark.meteor', 'meteor', { ability: ['meteor-strike'] }, ['flare']),
  ...landing('ffx.demi', 'demi', { ability: ['demi', 'demi-fury'] }, ['flare']),
  ...landing('ffx.ultima', 'ultima', { ability: ['ultima', 'ultima-fury'] }, ['flare']),
  // Flare itself: its stand-in is the family cue `flare`, played on the first blow (then plain hits).
  f('ffx.flare', 'flare', { moment: 'damage', on: 'flare', ability: ['flare', 'flare-fury'], nth: 'first' }),

  // ---- Items: Ether and Remedy have no landing cue, so they answer at the item's opening; Elixir and Grenade at their landing.
  f('ffx.item.ether', 'item-ether', { moment: 'item', item: ['ether'] }),
  f('ffx.item.remedy', 'item-remedy', { moment: 'item', item: ['remedy'] }),
  f('ffx.item.elixir', 'item-elixir', { moment: 'heal', isItem: true, item: ['elixir'], nth: 'first' }),
  f('ffx.item.grenade', 'item-grenade', { moment: 'damage', isItem: true, item: ['grenade'], on: 'explosion', nth: 'first' }, { then: ['explosion'] }),

  // ---- Weapons, one swing and one blow per party weapon.
  ...weapons,

  // ---- Elements by tier, then Holy.
  ...ladders,
  f('ffx.holy', 'holy', { moment: 'damage', on: 'holy' }),

  // ---- Healing: Cure by tier (Curaga has its own cue). Items and ticks (no action on screen) keep the stand-in.
  f('ffx.cure.t3', 'cure-3', { moment: 'heal', on: 'cure-3', isItem: false }),
  f('ffx.cure.t2', 'cure-2', { moment: 'heal', on: 'cure', isItem: false, tier: 2, nth: 'first', bare: false }, { then: ['cure'] }),
  f('ffx.cure.t1', 'cure', { moment: 'heal', on: 'cure', isItem: false, nth: 'first', bare: false }),

  // ---- Life, Full-Life and Phoenix Down (one row serves the spell and the item).
  f('ffx.life.full', 'life-full', { moment: 'revive', on: 'life', ability: ['full-life-spell'] }, { then: ['life'] }),
  f('ffx.life', 'life', { moment: 'revive', on: 'life', ability: ['life'] }),
  f('ffx.life', 'phoenix-down', { moment: 'revive', on: 'phoenix-down', isItem: true }, { then: ['life'] }),

  // ---- Statuses landing. Reflect shares Shell's stand-in, Regen and the dark statuses the generic ones.
  f('ffx.reflect', 'reflect', { moment: 'status', on: 'shell', status: ['reflect'] }, { then: ['shell'] }),
  f('ffx.shell', 'shell', { moment: 'status', on: 'shell', status: ['shell'] }),
  f('ffx.haste', 'haste', { moment: 'status', on: 'haste', status: ['haste'] }),
  f('ffx.slow', 'slow', { moment: 'status', on: 'slow', status: ['slow'] }),
  f('ffx.protect', 'protect', { moment: 'status', on: 'protect', status: ['protect'] }),
  f('ffx.poison', 'poison', { moment: 'status', on: 'poison', status: ['poison'] }),
  f('ffx.sleep', 'sleep', { moment: 'status', on: 'sleep', status: ['sleep'] }),
  f('ffx.silence', 'silence', { moment: 'status', on: 'silence', status: ['silence'] }),
  f('ffx.regen', 'regen', { moment: 'status', on: 'buff-generic', status: ['regen'] }, { then: ['buff-generic'] }),
  f('ffx.buff', 'buff-generic', { moment: 'status', on: 'buff-generic' }),
  f('ffx.darkness', 'darkness', { moment: 'status', on: 'debuff-generic', status: ['darkness'] }, { then: ['debuff-generic'] }),
  f('ffx.enemy.berserk', 'berserk', { moment: 'status', on: 'debuff-generic', status: ['berserk'] }, { then: ['debuff-generic'] }),
  f('ffx.enemy.confuse', 'confuse', { moment: 'status', on: 'debuff-generic', status: ['confuse'] }, { then: ['debuff-generic'] }),
  f('ffx.enemy.curse', 'curse', { moment: 'status', on: 'debuff-generic', status: ['curse'] }, { then: ['debuff-generic'] }),
  f('ffx.dark.doom', 'doom', { moment: 'status', on: 'debuff-generic', status: ['doom'] }, { then: ['debuff-generic'] }),
  f('ffx.debuff', 'debuff-generic', { moment: 'status', on: 'debuff-generic' }),
  f('ffx.scan', 'scan', { moment: 'status', on: 'status-applied', status: ['scan'] }),
  f('ffx.petrify', 'petrify-shatter', { moment: 'petrify-shatter', on: 'petrify-shatter' }),

  // ---- KO, summon.
  f('ffx.ko.party', 'ko-fall', { moment: 'ko', targetSide: 'party', on: 'ko-fall' }),
  f('ffx.ko.fiend', 'dissolve-pyreflies', { moment: 'ko', on: 'dissolve-pyreflies' }),
  f('ffx.summon', 'summon', { moment: 'summon', on: 'summon' }),
];

/**
 * Every FFX row with no battle hook, and why. `menu`: the key is a menu key, played by its own name (`voiceKey`). `flow`: a
 * screen plays it (`flowSlots.ts`). `open`: a moment or a decision it needs does not exist yet, so the original would never
 * be heard (the layout plan does not count it until it is hooked). Held rows (52j) are not listed: `sfx-parity-rows.json`
 * marks them `hold`. `tests/unit/audio-sfx-parity-events.test.ts` fails when a row is in none of the places.
 */
export const FFX_UNHOOKED: Readonly<Record<string, Unhooked>> = {
  'ffx.ui.tick': menu('the cursor and confirm tick plays by its own name (voiceKey, decision 52k)'),
  'ffx.ui.cancel': menu(),
  'ffx.ui.error': menu(),
  'ffx.ui.turn': menu(),
  'ffx.ui.page': menu(),
  'ffx.ui.open': menu(),
  'ffx.flow.shatter': flow('the encounter opening, BattleScreen.enter'),
  'ffx.flow.fadein': flow('the encounter opening, BattleScreen.enter'),
  'ffx.esuna': open('removing a status plays no cue today, so there is no moment for it to answer'),
  'ffx.dispel': open('removing a status plays no cue today, so there is no moment for it to answer'),
  'ffx.steal.ok': open('the presenter raises no moment for the Steal result today (the ability has no effect id in the data)'),
  'ffx.cast.charge': open('Bailey decides whether the wind-up plays for the three characters retail gives it to (spec decision), so it stays shared'),
  'ffx.boss.chant.short': open('nothing ties a boss move to the short chant (retail family 33) in our data'),
  'ffx.boss.chant.long': open('nothing ties a boss move to the long chant (retail families 34 and 35) in our data'),
  'ffx.reels': open('the reels play inside the Overdrive minigame, not at a presenter moment'),
};
