// @vitest-environment jsdom
/**
 * PR-0295 at phone width, option PREP-A "one long page" (Bailey, 2026-10-12, D-781; both games: the prep shell and its
 * eight tab panels are shared, the FFX and FFX-2 tabs differ). The views are pure `data -> HTML` functions
 * (`src/ui/common/prepPhoneKit.ts`, `src/ui/ffx/party-prep/phoneViews.ts`, `src/ui/ffx2/party-prep/phoneViews.ts`), so
 * what they print is checked here against the numbers the engine and the desktop sheet already print: a phone page that
 * says something the desktop sheet does not would be invented game data (hard rule 6). The layout itself is CSS and is
 * checked in a browser (docs/screenshots/r43-prepphone/); `prep-phone-page.test.ts` has the panels, the fold, the keys
 * and the stylesheets.
 */
import { describe, expect, it } from 'vitest';
import type { FFXMemberBuild, FFXPartyBuild } from '../../src/battle/common/types.ts';
import { effectiveStats, type EffectiveStatKey } from '../../src/battle/ffx/effectiveStats.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { isPhonePageTab, luminance, deltaHtml, sectionHtml, statRowHtml, tileHtml } from '../../src/ui/common/prepPhoneKit.ts';
import { itemLabel } from '../../src/ui/common/resultsMath.ts';
import { autoAbilityLabel } from '../../src/ui/ffx/party-prep/autoAbilityLabels.ts';
import { MODE_BLURB, OVERDRIVE_NAME, modeLabel } from '../../src/ui/ffx/party-prep/overdriveText.ts';
import {
  STATS_NOTE,
  ffxEquipmentPhoneHtml,
  ffxItemsPhoneHtml,
  ffxOverdrivePhoneHtml,
  ffxStatsPhoneHtml,
  slotEffectText,
  statBonusText,
} from '../../src/ui/ffx/party-prep/phoneViews.ts';
import {
  X2_ACCESSORY_NOTE,
  X2_STATS_NOTE,
  x2AccessoriesPhoneHtml,
  x2DresspheresPhoneHtml,
  x2ItemsPhoneHtml,
  x2StatsPhoneHtml,
} from '../../src/ui/ffx2/party-prep/phoneViews.ts';

const dom = (html: string): HTMLElement => {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d;
};
const text = (el: Element | null | undefined): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
const open = (el: Element): boolean => el.classList.contains('is-open');

const ffxBuild = CHAPTERS.find((c) => c.id === 'seymour-flux')!.buildRef as FFXPartyBuild;
const tidus: FFXMemberBuild = ffxBuild.members.find((m) => m.id === 'tidus')!;

/** Tidus with the gear the target frames show: Strength +10% on the sword, HP +10% and a no-stat ability on the shield. */
const geared = (): FFXMemberBuild => ({
  ...tidus,
  stats: { ...tidus.stats, hp: 2200, maxHp: 2420 },
  equipment: {
    weapon: { name: 'Baroque Sword', slots: 3, autoAbilities: ['strength-10'] },
    armor: { name: 'Glorious Shield', slots: 3, autoAbilities: ['hp-10', 'zombie-ward'] },
  },
});

describe('the kit', () => {
  it('names the six tab ids that take the stacked page, and never CHAPTER or SPHERE GRID (they have their own)', () => {
    for (const id of ['stats', 'equipment', 'items', 'overdrive', 'dresspheres', 'accessories']) expect(isPhonePageTab(id)).toBe(true);
    for (const id of ['chapter', 'sphere-grid', '', null, undefined]) expect(isPhonePageTab(id)).toBe(false);
  });

  it('a section keeps its key, and its open state and aria-expanded agree', () => {
    const el = dom(sectionHtml({ key: 'k1', label: 'HP', digest: 'HP 1', open: false, body: '<p>b</p>' })).querySelector('[data-fold]')!;
    expect(el.getAttribute('data-fold')).toBe('k1');
    expect(open(el)).toBe(false);
    expect(el.querySelector('[data-fold-head]')!.getAttribute('aria-expanded')).toBe('false');
    const on = dom(sectionHtml({ key: 'k1', label: 'HP', open: true, body: '' })).querySelector('[data-fold]')!;
    expect(open(on)).toBe(true);
    expect(on.querySelector('[data-fold-head]')!.getAttribute('aria-expanded')).toBe('true');
    // The header is a button for a finger.
    expect(on.querySelector('[data-fold-head]')!.getAttribute('role')).toBe('button');
    expect(on.querySelector('[data-fold-head]')!.getAttribute('tabindex')).toBe('0');
  });

  it('escapes plain strings, and passes only the markup the caller built', () => {
    const el = dom(sectionHtml({ key: 'a"b', label: '<b>x</b>', aside: '&', title: '<i>t</i>', digest: '<u>d</u>', open: true, body: '<p class="mine">ok</p>' }));
    expect(el.querySelector('b')).toBeNull();
    expect(el.querySelector('.prph-t i')).toBeNull();
    expect(el.querySelector('u')).toBeNull();
    expect(el.querySelector('.mine')).not.toBeNull();
    expect(el.querySelector('[data-fold]')!.getAttribute('data-fold')).toBe('a"b');
    expect(text(el.querySelector('.prph-k'))).toBe('<b>x</b>');
    expect(text(el.querySelector('.prph-t'))).toBe('<i>t</i>');
    expect(text(el.querySelector('.prph-dg'))).toBe('<u>d</u>');
  });

  it('a stat row prints the before figure only when it is given', () => {
    const plain = dom(statRowHtml({ label: 'MP', value: 115 }));
    expect(plain.querySelector('.prph-base')).toBeNull();
    expect(text(plain.querySelector('.prph-n'))).toBe('115');
    const raised = dom(statRowHtml({ label: 'HP', base: 2200, value: 2420, bonus: '+10%' }));
    expect(text(raised.querySelector('.prph-base'))).toBe('2200');
    expect(text(raised.querySelector('.prph-n'))).toBe('2420');
    expect(text(raised.querySelector('.prph-bonus'))).toBe('+10%');
  });

  it('a dressphere tile writes ivory on a dark job colour and ink on a light one', () => {
    expect(luminance('#000000')).toBe(0);
    expect(luminance('#ffffff')).toBeCloseTo(1, 5);
    expect(luminance('nonsense')).toBe(0);
    expect(tileHtml('BM', '#4b2e83')).toContain('--tile-ink:var(--ig-paper)');
    expect(tileHtml('GN', '#f7b6d9')).toContain('--tile-ink:var(--ig-ink)');
  });

  it('an up or down figure carries its arrow and its sign, and a dash when equal', () => {
    expect(text(dom(deltaHtml(279)))).toBe('▲279');
    expect(text(dom(deltaHtml(-99)))).toBe('▼99');
    expect(text(dom(deltaHtml(0)))).toBe('—');
    expect(dom(deltaHtml(5)).querySelector('.is-up')).not.toBeNull();
    expect(dom(deltaHtml(-5)).querySelector('.is-dn')).not.toBeNull();
    expect(dom(deltaHtml(0)).querySelector('.is-eq')).not.toBeNull();
  });
});

describe('FFX Stats (the same ten rows as the desktop sheet)', () => {
  const stats = effectiveStats(tidus);

  it('groups them HP · MP, ATTACK, DEFENSE, SPEED & AIM: the first two open, the last two folded', () => {
    const root = dom(ffxStatsPhoneHtml(tidus, new Map()));
    const secs = [...root.querySelectorAll('[data-fold]')];
    expect(secs.map((s) => s.getAttribute('data-fold'))).toEqual(['pool', 'attack', 'defense', 'speed']);
    expect(secs.map(open)).toEqual([true, true, false, false]);
    expect(secs.map((s) => text(s.querySelector('.prph-k')))).toEqual(['HP · MP', 'ATTACK', 'DEFENSE', 'SPEED & AIM']);
  });

  it("prints every number from the engine's own rows, in the engine's own order of groups", () => {
    const root = dom(ffxStatsPhoneHtml(tidus, new Map()));
    const got = new Map([...root.querySelectorAll('.prph-row')].map((r) => [text(r.querySelector('.prph-l')), text(r.querySelector('.prph-n'))]));
    expect(got.size).toBe(10);
    for (const row of stats.rows) expect(got.get(row.label.toUpperCase())).toBe(String(row.effective));
  });

  it('a folded section keeps a one-line digest of its numbers', () => {
    const root = dom(ffxStatsPhoneHtml(tidus, new Map()));
    const b = stats.byKey;
    expect(text(root.querySelector('[data-fold="defense"] .prph-dg'))).toBe(`DEF ${b.def.effective} · MDEF ${b.mdef.effective}`);
    expect(text(root.querySelector('[data-fold="speed"] .prph-dg'))).toBe(
      `AGI ${b.agi.effective} · LUCK ${b.luck.effective} · EVA ${b.eva.effective} · ACC ${b.acc.effective}`,
    );
  });

  it('shows the pre-equipment pool beside the raised one only when they differ, and the bonus text the desktop chip prints', () => {
    const member = geared();
    const root = dom(ffxStatsPhoneHtml(member, new Map()));
    const hp = root.querySelector('[data-fold="pool"] .prph-row')!;
    expect(text(hp.querySelector('.prph-base'))).toBe('2200');
    expect(text(hp.querySelector('.prph-n'))).toBe('2420');
    expect(text(hp.querySelector('.prph-bonus'))).toBe('+10%');
    const mp = root.querySelectorAll('[data-fold="pool"] .prph-row')[1]!;
    expect(mp.querySelector('.prph-base')).toBeNull();
    expect(mp.querySelector('.prph-bonus')).toBeNull();
    const str = root.querySelector('[data-fold="attack"] .prph-row')!;
    expect(text(str.querySelector('.prph-bonus'))).toBe('+10% dmg');
  });

  it('statBonusText: pool, damage and mitigation read as the desktop chips do, none reads as nothing', () => {
    const row = (kind: 'pool' | 'damage' | 'mitigation' | 'none', bonusPercent: number) => ({ key: 'str' as EffectiveStatKey, label: 'x', base: 1, effective: 1, bonusPercent, kind });
    expect(statBonusText(row('pool', 10))).toBe('+10%');
    expect(statBonusText(row('damage', 3))).toBe('+3% dmg');
    expect(statBonusText(row('mitigation', 3))).toBe('−3% taken');
    expect(statBonusText(row('none', 0))).toBe('');
  });

  it('keeps what the player folded or opened across a redraw, and falls back to the default for a key it has not seen', () => {
    const root = dom(ffxStatsPhoneHtml(tidus, new Map([['pool', false], ['defense', true]])));
    expect(open(root.querySelector('[data-fold="pool"]')!)).toBe(false);
    expect(open(root.querySelector('[data-fold="defense"]')!)).toBe(true);
    expect(open(root.querySelector('[data-fold="attack"]')!)).toBe(true);
    expect(open(root.querySelector('[data-fold="speed"]')!)).toBe(false);
  });

  it("opens with the member's name, the S.LV label and the archetype, then closes on the desktop sheet's own note", () => {
    const root = dom(ffxStatsPhoneHtml(tidus, new Map()));
    const who = root.querySelector('.prph-who')!;
    expect(text(who.querySelector('em'))).toBe('Tidus');
    expect(text(who)).toContain('S.LV');
    expect(text(who.querySelector('b'))).toBe(String(tidus.sphereGrid.sLv));
    // Character for character (the desktop sheet's thin space before "+%" included).
    expect(root.querySelector('.prph-note')!.textContent).toBe(STATS_NOTE);
  });
});

describe('FFX Equipment', () => {
  it('draws every slot of the weapon and the armour, filled or empty, with the slot count from the build', () => {
    const member = geared();
    const root = dom(ffxEquipmentPhoneHtml(member, new Map()));
    for (const [key, def] of [['weapon', member.equipment.weapon], ['armor', member.equipment.armor]] as const) {
      const sec = root.querySelector(`[data-fold="${key}"]`)!;
      expect(open(sec)).toBe(true);
      expect(text(sec.querySelector('.prph-t'))).toBe(def.name);
      expect(text(sec.querySelector('.prph-ks'))).toBe(`${def.autoAbilities.length} OF ${def.slots} SLOTS`);
      expect(sec.querySelectorAll('.prph-slot.is-on')).toHaveLength(def.autoAbilities.length);
      expect(sec.querySelectorAll('.prph-slot.is-empty')).toHaveLength(def.slots - def.autoAbilities.length);
      expect([...sec.querySelectorAll('.prph-slot.is-on .prph-ab')].map(text)).toEqual(def.autoAbilities.map(autoAbilityLabel));
    }
    // The digest of a folded piece is its ability names.
    expect(text(root.querySelector('[data-fold="armor"] .prph-dg'))).toBe(member.equipment.armor.autoAbilities.map(autoAbilityLabel).join(' · '));
  });

  it('says what an ability does from the same rows the Stats tab prints, and nothing for one that touches no stat', () => {
    const member = geared();
    const root = dom(ffxEquipmentPhoneHtml(member, new Map()));
    const fx = [...root.querySelectorAll('.prph-slot.is-on')].map((s) => text(s.querySelector('.prph-fx')));
    expect(fx).toEqual([`STR ${effectiveStats(member).byKey.str.effective} · +10% dmg`, 'HP 2200 → 2420', '']);
  });

  it('slotEffectText covers the six percentage families and returns undefined for the rest', () => {
    const member: FFXMemberBuild = {
      ...geared(),
      equipment: {
        weapon: { name: 'w', slots: 4, autoAbilities: ['strength-10', 'magic-5'] },
        armor: { name: 'a', slots: 4, autoAbilities: ['defense-5', 'magic-def-3'] },
      },
    };
    const { byKey } = effectiveStats(member);
    expect(slotEffectText(byKey, 'strength-10')).toBe(`STR ${byKey.str.effective} · +10% dmg`);
    expect(slotEffectText(byKey, 'magic-5')).toBe(`MAG ${byKey.mag.effective} · +5% dmg`);
    expect(slotEffectText(byKey, 'defense-5')).toBe(`DEF ${byKey.def.effective} · −5% taken`);
    expect(slotEffectText(byKey, 'magic-def-3')).toBe(`MDEF ${byKey.mdef.effective} · −3% taken`);
    expect(slotEffectText(byKey, 'zombie-ward')).toBeUndefined();
    expect(slotEffectText(byKey, 'sensor')).toBeUndefined();
  });
});

describe('FFX Items and Overdrive', () => {
  it('the bag: one section, one row a kind, named as the results screen names an item, with how many are in it', () => {
    const root = dom(ffxItemsPhoneHtml(ffxBuild, new Map()));
    const kinds = ffxBuild.inventory.length;
    expect(kinds).toBeGreaterThan(5);
    expect([...root.querySelectorAll('.prph-item__name')].map(text)).toEqual(ffxBuild.inventory.map((e) => itemLabel(e.itemId)));
    expect([...root.querySelectorAll('.prph-item__qty')].map(text)).toEqual(ffxBuild.inventory.map((e) => `×${e.count}`));
    expect(text(root.querySelector('.prph-ks'))).toBe(`${kinds} KINDS`);
    expect(text(root.querySelector('.prph-dg'))).toBe(`${ffxBuild.inventory.reduce((n, e) => n + e.count, 0)} IN THE BAG`);
    expect(open(root.querySelector('[data-fold]')!)).toBe(true);
  });

  it('an empty bag says so, in one line, with no section to fold', () => {
    for (const build of [null, { ...ffxBuild, inventory: [] }]) {
      const root = dom(ffxItemsPhoneHtml(build, new Map()));
      expect(root.querySelector('[data-fold]')).toBeNull();
      expect(text(root.querySelector('.prph-empty'))).toBe('No items.');
    }
  });

  it('Overdrive: the move name, one row per unlocked mode with the equipped one marked, and the mode blurb', () => {
    const member: FFXMemberBuild = { ...tidus, overdrive: { ...tidus.overdrive, mode: 'warrior', unlockedModes: ['stoic', 'warrior', 'comrade'] } };
    const root = dom(ffxOverdrivePhoneHtml(member, new Map()));
    expect(text(root.querySelector('.prph-t'))).toBe(OVERDRIVE_NAME['tidus']);
    const rows = [...root.querySelectorAll<HTMLElement>('.prph-mode')];
    expect(rows.map((r) => r.dataset['mode'])).toEqual(['stoic', 'warrior', 'comrade']);
    expect(rows.map((r) => text(r.querySelector('.prph-mode__name')))).toEqual(['Stoic', 'Warrior', 'Comrade']);
    expect(rows.map((r) => r.classList.contains('is-sel'))).toEqual([false, true, false]);
    expect(rows.map((r) => r.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false']);
    expect(text(root.querySelector('.prph-mode.is-sel .prph-mode__tag'))).toBe('EQUIPPED');
    expect(text(root.querySelector('.prph-blurb'))).toBe(MODE_BLURB.warrior);
    expect(text(root.querySelector('.prph-dg'))).toBe(`${modeLabel('warrior')} equipped`);
    expect(text(root.querySelector('.prph-ks'))).toBe('3 MODES');
  });
});

describe('FFX-2 views (the girls, the dresspheres and the bag)', () => {
  const worn = { abbr: 'WM', colour: '#f4f1e8', label: 'White Mage' };

  it('Dresspheres: worn, learned, the Garment Grid and the other spheres she owns, as four sections', () => {
    const html = x2DresspheresPhoneHtml(
      {
        who: { name: 'Yuna', level: 23, dressphere: 'white-mage' },
        worn: { ...worn, commands: ['Pray', 'Vigor', 'White Magic', 'Item'] },
        learned: { names: ['Cure', 'Shell'], total: 16, ap: ['40 AP banked', 'next Life 30 AP'] },
        grid: { name: 'Protection Halo', equip: 'DEF +5, MDEF +5', nodes: 5, here: 2, gates: [{ colour: 'red', passed: true }, { colour: 'blue', passed: false }] },
        owned: [
          { abbr: 'GN', colour: '#f7b6d9', label: 'Gunner' },
          { abbr: 'TH', colour: '#75913a', label: 'Thief' },
        ],
      },
      new Map(),
    );
    const root = dom(html);
    expect([...root.querySelectorAll('[data-fold]')].map((s) => s.getAttribute('data-fold'))).toEqual(['worn', 'learned', 'grid', 'owned']);
    expect([...root.querySelectorAll('[data-fold]')].map(open)).toEqual([true, true, false, false]);
    expect(text(root.querySelector('.prph-who'))).toContain('WHITE MAGE');
    expect(text(root.querySelector('[data-fold="worn"] .prph-dg'))).toBe('Pray · Vigor · White Magic · Item');
    expect(text(root.querySelector('[data-fold="learned"] .prph-ks'))).toBe('2/16');
    expect(text(root.querySelector('[data-fold="learned"] .prph-dg'))).toBe('2/16 · 40 AP banked · next Life 30 AP');
    expect([...root.querySelectorAll('.prph-chip')].map(text)).toEqual(['Cure', 'Shell']);
    expect(root.querySelectorAll('.prph-node')).toHaveLength(5);
    expect(root.querySelector('.prph-node.is-here')).toBe(root.querySelectorAll('.prph-node')[2]);
    expect(root.querySelectorAll('.prph-gate')).toHaveLength(2);
    expect(root.querySelectorAll('.prph-gate.is-passed')).toHaveLength(1);
    expect(text(root.querySelector('[data-fold="grid"] .prph-dg'))).toBe('5 nodes · DEF +5, MDEF +5');
    expect(text(root.querySelector('[data-fold="owned"] .prph-ks'))).toBe('2');
    expect(text(root.querySelector('[data-fold="owned"] .prph-dg'))).toBe('GN · TH');
  });

  it('Dresspheres: a Grid the table has no row for drops its section, and no owned spheres reads "none"', () => {
    const root = dom(
      x2DresspheresPhoneHtml(
        { who: { name: 'Rikku', level: 24, dressphere: 'thief' }, worn: { ...worn, commands: [] }, learned: { names: [], total: 0, ap: [] }, grid: null, owned: [] },
        new Map(),
      ),
    );
    expect(root.querySelector('[data-fold="grid"]')).toBeNull();
    expect(text(root.querySelector('[data-fold="owned"] .prph-dg'))).toBe('none');
    expect(text(root.querySelector('[data-fold="worn"] .prph-dg'))).toBe('—');
  });

  it('Stats: the worn block in two columns, then every other sphere as a folded row with how many stats it raises and lowers', () => {
    const labels = ['HP', 'MP', 'STR', 'MAG', 'DEF', 'MDEF', 'AGI', 'ACC', 'EVA', 'LUCK'];
    const cells = labels.map((label, i) => ({ label, now: 10 * (i + 1), delta: i < 6 ? 5 : i < 8 ? -3 : 0 }));
    const root = dom(
      x2StatsPhoneHtml(
        {
          who: { name: 'Yuna', level: 23, dressphere: 'white-mage' },
          worn: { label: 'White Mage' },
          stats: labels.map((label, i) => ({ label, value: 10 * (i + 1) })),
          others: [{ id: 'gunner', abbr: 'GN', colour: '#f7b6d9', label: 'Gunner', cells }],
        },
        new Map([['s:gunner', true]]),
      ),
    );
    expect([...root.querySelectorAll('[data-fold="worn"] .prph-row')]).toHaveLength(10);
    expect(text(root.querySelector('[data-fold="worn"] .prph-t'))).toBe('White Mage · Lv 23');
    expect(text(root.querySelector('.prph-sub'))).toBe('OTHER DRESSPHERES · 1');
    const g = root.querySelector('[data-fold="s:gunner"]')!;
    expect(open(g)).toBe(true);
    expect(text(g.querySelector('.prph-ud__up'))).toBe('▲6');
    expect(text(g.querySelector('.prph-ud__dn'))).toBe('▼2');
    expect(g.querySelectorAll('.prph-cell')).toHaveLength(10);
    expect([...g.querySelectorAll('.prph-delta')].map(text)).toEqual(['▲5', '▲5', '▲5', '▲5', '▲5', '▲5', '▼3', '▼3', '—', '—']);
    expect(text(root.querySelector('.prph-note'))).toBe(X2_STATS_NOTE);
  });

  it('Accessories: two slots, one row per effect, empty drawn as empty, and the sphere rule under them', () => {
    const root = dom(
      x2AccessoriesPhoneHtml(
        { who: { name: 'Yuna', level: 23, dressphere: 'white-mage' }, slots: [{ name: 'Circlet', parts: ['MAG +10', 'MDEF +10'] }, null] },
        new Map(),
      ),
    );
    const one = root.querySelector('[data-fold="slot1"]')!;
    expect(text(one.querySelector('.prph-t'))).toBe('Circlet');
    expect([...one.querySelectorAll('.prph-row')].map((r) => [text(r.querySelector('.prph-l')), text(r.querySelector('.prph-n'))])).toEqual([
      ['MAG', '+10'],
      ['MDEF', '+10'],
    ]);
    expect(text(one.querySelector('.prph-dg'))).toBe('MAG +10 · MDEF +10');
    expect(text(root.querySelector('[data-fold="slot2"] .prph-ks'))).toBe('EMPTY');
    expect(text(root.querySelector('.prph-note'))).toBe(X2_ACCESSORY_NOTE);
  });

  it('Accessories: an accessory with no modelled effect says so rather than printing an empty plate', () => {
    const root = dom(x2AccessoriesPhoneHtml({ who: { name: 'Paine', level: 25, dressphere: 'warrior' }, slots: [{ name: 'Mystery', parts: [] }, null] }, new Map()));
    expect(text(root.querySelector('[data-fold="slot1"] .prph-line'))).toBe('no modelled effect');
    expect(text(root.querySelector('[data-fold="slot1"] .prph-dg'))).toBe('no modelled effect');
  });

  it('Items: the bag, one row a kind, then the gil with its thousands separator', () => {
    const rows = [{ name: 'Potion', count: 60 }, { name: 'Ether', count: 10 }];
    const root = dom(x2ItemsPhoneHtml(rows, 10000, new Map()));
    expect([...root.querySelectorAll('.prph-item__name')].map(text)).toEqual(['Potion', 'Ether']);
    expect(text(root.querySelector('.prph-ks'))).toBe('2 KINDS');
    expect(text(root.querySelector('.prph-dg'))).toBe('70 IN THE BAG');
    expect(text(root.querySelector('.prph-bar__v'))).toBe((10000).toLocaleString());
    const none = dom(x2ItemsPhoneHtml([], 0, new Map()));
    expect(text(none.querySelector('.prph-empty'))).toBe('No items.');
    expect(none.querySelector('[data-fold]')).toBeNull();
  });
});
