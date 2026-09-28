/**
 * The enemy abilities that draw the `attack` painting, per listed chapter, as
 * `enemy:ability`, read off each row's own `damageType` / `formula` (never its
 * name) by `EnemyActionPose.isPhysicalAction` on 2026-09-26 and pinned for
 * `enemy-action-pose.test.ts`. A data change that moves a row shows up here.
 * FFX chapters read FFX's table, FFX-2 chapters FFX-2's (rule 14).
 */

export const PHYSICAL_BY_CHAPTER: Record<string, string[]> = {
  'seymour-flux': [
    'seymour-flux:lance-of-atrophy',
    'seymour-flux:cross-cleave',
  ],
  'yunalesca': [
    'yunalesca:dispelling-slap',
    'yunalesca:hellbiter',
  ],
  'braskas-final-aeon': [
    'braskas-final-aeon:left-arm-strike',
    'braskas-final-aeon:triumphant-grasp',
    'braskas-final-aeon:jecht-bomber',
    'braskas-final-aeon:left-arm-strike-2',
    'braskas-final-aeon:blade-blitz',
    'braskas-final-aeon:triumphant-grasp-2',
    'braskas-final-aeon:ultimate-jecht-shot',
    'braskas-final-aeon:jecht-bomber-2',
    'possessed-valefor:possessed-valefor-sonic-wings',
    'possessed-ifrit:possessed-ifrit-meteor-strike',
    'possessed-ixion:possessed-ixion-aerospark',
    'possessed-shiva:possessed-shiva-heavenly-strike',
    'possessed-bahamut:possessed-bahamut-impulse',
  ],
  'ffx2-bahamut': [
    'bahamut:x2-bahamut-attack',
  ],
  'ffx2-vegnagun-shuyin': [
    'node-a:x2-node-missile',
    'node-a:x2-node-dies-irae',
    'node-b:x2-node-missile',
    'node-b:x2-node-dies-irae',
    'node-c:x2-node-missile',
    'node-c:x2-node-dies-irae',
    'redoubt-r:x2-redoubt-right-lacrimosa',
    'redoubt-l:x2-redoubt-left-lacrimosa',
    'shuyin:x2-shuyin-attack',
    'shuyin:x2-shuyin-spin-cut',
    'shuyin:x2-shuyin-run-and-slash',
    'shuyin:x2-shuyin-terror-of-zanarkand',
  ],
  'ffx2-leblanc': [
    'ormi-entrance:x2-ormi-shield-bash',
    'dr-goon:x2-goon-strike',
    'fem-goon:x2-leblanc-fan-slap',
    'logos-room:x2-logos-double-shot',
    'ormi-logos-room:x2-ormi-shield-bash',
    'leblanc:x2-leblanc-fan-slap',
    'logos:x2-logos-double-shot',
    'ormi:x2-ormi-shield-bash',
  ],
  'seymour-anima-macalania': [
    'anima-macalania:anima-oblivion',
  ],
  'evrae-airship': [
    'evrae:evrae-attack',
    'evrae:evrae-swooping-scythe',
  ],
  'yojimbo-cavern': [
    'yojimbo:yojimbo-kozuka',
    'yojimbo:yojimbo-wakizashi',
    'daigoro:daigoro-attack',
  ],
  'seymour-natus': [
    'mortibody:mortibody-shattering-claw',
  ],
  'ffx2-fallen-aeons': [
    'x2-shiva:x2-shiva-kick',
    'x2-shiva:x2-shiva-triple-attack',
    'sandy:x2-sandy-attack',
    'cindy:x2-cindy-camisade',
    'x2-anima:x2-anima-oblivion',
  ],
  'seymour-omnis': [
  ],
  'ffx2-trema': [
    'paragon:paragon-os-attack',
    'trema:trema-dying-star',
    'trema:trema-falling-leaf',
    'trema:trema-thundering-wave',
    'trema:trema-choking-mist',
    'trema:trema-beguiling-mire',
  ],
  'isaaru-via-purifico': [
    'grothia:grothia-attack',
    'grothia:grothia-attack-yuna',
    'pterya:pterya-attack',
    'pterya:pterya-attack-yuna',
    'pterya:pterya-sonic-wings',
  ],
  'ffx2-den-of-woe': [
    'shade-baralai:x2-den-baralai-attack',
    'shade-baralai:x2-den-baralai-glint',
    'shade-baralai:x2-den-baralai-triple-attack',
    'shade-gippal:x2-den-gippal-attack',
    'shade-gippal:x2-den-gippal-grinder',
    'shade-gippal:x2-den-gippal-mortar',
    'shade-nooj:x2-den-nooj-attack',
  ],
  // Chapter XVI (FFX-2, listed 2026-09-27): only his Normal Attack is physical (research ffx2-ixion-djose.md §4.1).
  'ffx2-ixion-djose': ['x2-ixion:x2-ixion-attack'],
};
