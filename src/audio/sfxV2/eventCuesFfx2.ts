/**
 * SFX parity, the FFX-2 hooks (FFX-2 only; AGENTS.md rule 14): one hook per spec row that has a moment in the
 * presenter to answer it. See `eventCues.ts` for the model and `eventCuesFfx.ts` for the FFX twin. A row with no hook is
 * listed in {@link FFX2_UNHOOKED} with the reason.
 *
 * FFX-2 differences from FFX that the tables follow: the weapon belongs to the girl's dressphere (`weapons.ts`), the
 * spells land by element (the data carries no `sfxKey` and no tiers, so there is one cue per element: Fire, Fira and
 * Firaga share `fire-x2`), a cue with an FFX-2 twin is named with its `-x2` suffix (the name the voice asks for), and
 * the Leblanc chapter's foes each have their own attack sound (the rows `ffx2.lb.*`).
 *
 * The Leblanc chapter plays three acts with these combatants (`src/data/ffx2/enemies/leblanc-syndicate*.ts`): Ormi
 * as `ormi-entrance`, `ormi-logos-room` and `ormi`; Logos as `logos-room` and `logos`; `leblanc`; `dr-goon`;
 * `fem-goon`. The hidden Leblanc chapter plays the same groups.
 */

import { atLanding, atOpening, hook, quiet, type Hook, type Selector } from './eventCues.ts';
import { WEAPON_CUES, type Weapon } from './weapons.ts';

const x = (row: string, cue: string, at: Selector, more: Parameters<typeof hook>[4] = {}): Hook => hook('ffx2', row, cue, at, more);

/** The Leblanc chapter's foes -> their row's name and the combatant ids they fight as. */
const LEBLANC_FOES: ReadonlyArray<[string, string, readonly string[]]> = [
  ['ormi', 'ormi', ['ormi-entrance', 'ormi-logos-room', 'ormi']],
  ['logos', 'logos', ['logos-room', 'logos']],
  ['leblanc', 'leblanc', ['leblanc']],
  ['goon', 'goon', ['dr-goon']],
  ['fgoon', 'fgoon', ['fem-goon']],
];

/**
 * A foe's "attack and blow" is one recorded sample (`ffx2.lb.*.attack`): it plays as the swing, when the foe's
 * attack painting opens, and the blow's own cue (`hit-<name>`, reserved for a separate recording) stands down while
 * the swing's original is the one playing. Only the foe's physical blows (`hit-heavy-enemy`) are the blow.
 */
const foes: Hook[] = LEBLANC_FOES.flatMap(([row, name, ids]) => [
  x(`ffx2.lb.${row}.attack`, `swing-${name}`, { moment: 'attack', actor: ids }),
  x(`ffx2.lb.${row}.attack`, `hit-${name}`, { moment: 'damage', actor: ids, on: 'hit-heavy-enemy' }, { coveredBy: [`swing-${name}`] }),
]);

/** The three girls' weapons -> the row the spec names them by. */
const WEAPON_ROWS: ReadonlyArray<[Weapon, string]> = [
  ['gun', 'gunner'],
  ['dagger', 'thief'],
  ['greatsword', 'warrior'],
];

const weapons: Hook[] = WEAPON_ROWS.flatMap(([w, row]) => [
  x(`ffx2.lb.${row}.swing`, WEAPON_CUES[w].swing, { moment: 'attack', side: 'party', weapon: [w], on: WEAPON_CUES[w].swing }),
  x(`ffx2.lb.${row}.hit`, WEAPON_CUES[w].hit, { moment: 'damage', side: 'party', weapon: [w], on: WEAPON_CUES[w].hit }),
]);

/** An aeon or a machina part that roars at its first warning and at its reveal. */
function roar(row: string, cue: string, actors: readonly string[], on: 'boss-roar-aeon' | 'machina-roar'): Hook[] {
  return [x(row, cue, { moment: 'charge', stage: 1, actor: actors, on }), x(row, cue, { moment: 'appear', actor: actors })];
}

export const FFX2_HOOKS: readonly Hook[] = [
  // ---- The Leblanc chapter (wave 1): each foe's attack, then the girls' weapons.
  ...foes,
  ...weapons,
  x('ffx2.special.trigger', 'gun-burst', { moment: 'attack', on: 'gun-burst' }),

  // ---- Bosses: Bahamut's Impulse, Vegnagun's ray and breath, the aeons' and the machine parts' roars, Shuyin's attack.
  ...atLanding('ffx2', 'ffx2.boss.impulse', 'boss-impulse', { ability: ['x2-bahamut-impulse'] }),
  x('ffx2.boss.ray', 'boss-ray', { moment: 'laser-charge', on: 'laser-charge' }),
  quiet('ffx2', 'ffx2.boss.ray', { moment: 'laser-fire', on: 'laser-fire' }, ['boss-ray']),
  x('ffx2.boss.breath', 'boss-breath', { moment: 'breath-attack', on: 'breath-attack' }),
  ...roar('ffx2.boss.bahamut', 'boss-bahamut', ['bahamut'], 'boss-roar-aeon'),
  ...roar('ffx2.boss.ixion', 'boss-ixion', ['x2-ixion'], 'boss-roar-aeon'),
  ...roar('ffx2.boss.shiva', 'boss-shiva', ['x2-shiva'], 'boss-roar-aeon'),
  ...roar('ffx2.boss.anima', 'boss-anima', ['x2-anima'], 'boss-roar-aeon'),
  ...roar('ffx2.boss.tail', 'boss-tail', ['vegnagun-tail'], 'machina-roar'),
  ...roar('ffx2.boss.leg', 'boss-leg', ['vegnagun-leg'], 'machina-roar'),
  ...roar('ffx2.boss.head', 'boss-head', ['vegnagun-head'], 'machina-roar'),
  ...atOpening('ffx2', 'ffx2.boss.shuyin', 'boss-shuyin', { actor: ['shuyin'] }, ['attack']),
  x('ffx2.boss.machina.ko', 'machina-destroy', { moment: 'ko', on: 'machina-destroy' }),

  // ---- Chants, Specials, items, KO.
  x('ffx2.cast.chant', 'magic-charge-x2', { moment: 'cast', side: 'party', on: 'magic-charge-x2' }),
  x('ffx2.special.dressup', 'special-stinger', { moment: 'spherechange', on: 'special-stinger' }),
  x('ffx2.special.dressup', 'special-stinger', { moment: 'overdrive-start', side: 'party' }),
  x('ffx2.item.use', 'item-use-x2', { moment: 'item', on: 'item-use-x2' }),
  x('ffx2.ko.party', 'ko-fall', { moment: 'ko', targetSide: 'party', on: 'ko-fall' }),

  // ---- Spells land by element (one cue per element; Flare on the first blow of the Flare spell).
  x('ffx2.flare', 'flare-x2', { moment: 'damage', on: 'flare-x2', ability: ['x2-shared-flare'], nth: 'first' }),
  ...(['fire', 'ice', 'thunder', 'water', 'holy'] as const).map((e) => x(`ffx2.${e}`, `${e}-x2`, { moment: 'damage', on: `${e}-x2` })),
  ...atLanding('ffx2', 'ffx2.drain', 'drain', { ability: ['x2-dark-knight-drain'] }),
  ...atLanding('ffx2', 'ffx2.death', 'death', { ability: ['x2-dark-knight-death'] }),

  // ---- Healing and revives: Curaga has its own cue, Cura shares Cure's stand-in; Phoenix Down shares Life's row.
  x('ffx2.curaga', 'cure-3-x2', { moment: 'heal', on: 'cure-3-x2', isItem: false }),
  x('ffx2.cura', 'cura-x2', { moment: 'heal', on: 'cure-x2', isItem: false, ability: /(^|-)cura$/, nth: 'first' }, { then: ['cure-x2'] }),
  x('ffx2.cure', 'cure-x2', { moment: 'heal', on: 'cure-x2', isItem: false, nth: 'first', bare: false }),
  x('ffx2.autolife', 'autolife', { moment: 'revive', on: 'life-x2', bare: true }),
  x('ffx2.life', 'life-x2', { moment: 'revive', on: 'life-x2', bare: false, isItem: false }),
  x('ffx2.life', 'phoenix-down', { moment: 'revive', on: 'phoenix-down', isItem: true }, { then: ['life-x2'] }),

  // ---- Statuses landing: Reflect shares Shell's stand-in.
  x('ffx2.reflect', 'reflect', { moment: 'status', on: 'shell', status: ['reflect'] }, { then: ['shell'] }),
  x('ffx2.shell', 'shell', { moment: 'status', on: 'shell', status: ['shell'] }),
  x('ffx2.haste', 'haste', { moment: 'status', on: 'haste', status: ['haste'] }),
  x('ffx2.slow', 'slow', { moment: 'status', on: 'slow', status: ['slow'] }),
  x('ffx2.protect', 'protect', { moment: 'status', on: 'protect', status: ['protect'] }),
  x('ffx2.sleep', 'sleep', { moment: 'status', on: 'sleep', status: ['sleep'] }),
  x('ffx2.regen', 'regen', { moment: 'status', on: 'buff-generic-x2', status: ['regen'] }),
  x('ffx2.bio', 'bio', { moment: 'status', on: 'poison', ability: ['x2-dark-knight-bio', 'x2-bulwark-left-bio'] }),
];

/** Every FFX-2 row with no hook, and why (see {@link FFX_UNHOOKED} for the three reasons). */
const MENU = 'menu: the key plays by its own name (voiceKey), not at a battle moment';

export const FFX2_UNHOOKED: Readonly<Record<string, string>> = {
  'ffx2.ui.tick': 'menu: the cursor tick plays by its own name (voiceKey)',
  'ffx2.ui.confirm': 'menu: confirm voices to the cursor tick in a chapter (decision 52k)',
  'ffx2.ui.cancel': MENU,
  'ffx2.ui.error': MENU,
  'ffx2.ui.open': MENU,
  'ffx2.ui.close': MENU,
  'ffx2.ui.page': MENU,
  'ffx2.flow.results': 'flow hook: the results tally (flowSlots.ts)',
  'ffx2.flow.stingers': 'flow hook: the results tally (flowSlots.ts)',
  'ffx2.flow.escape': 'open: the presenter plays no cue at the escape beat today; the row is low confidence',
  'ffx2.esuna': 'open: removing a status plays no cue today, so there is no moment for it to answer',
  'ffx2.dispel': 'open: removing a status plays no cue today, so there is no moment for it to answer',
  'ffx2.boss.core': 'open: the spec names a Vegnagun "core" part; which of our combatants it is has not been established',
  'ffx2.lb.sig.leblanc': 'open: the spec says do not wire until a move is tied to the slot (audition only)',
  'ffx2.lb.sig.logos': 'open: the spec says do not wire until a move is tied to the slot (audition only)',
  'ffx2.lb.sig.ormi': 'open: the spec says do not wire until a move is tied to the slot (audition only)',
};
