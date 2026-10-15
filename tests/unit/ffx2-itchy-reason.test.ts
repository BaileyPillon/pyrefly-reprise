// @vitest-environment jsdom
/**
 * The greyed White Magic row says why (release candidate r50-fixes, live check LV48-1 of release 48; **FFX-2 only**: the FFX
 * command menu has no Itchy rows and its own component).
 *
 * Under Itchy every command of a girl is listed and greyed with "Itchy — spherechange first" (`battle/ffx2/menu.ts`,
 * RC7). On the live build the greyed Attack, Skill and Item rows showed the reason and the greyed WHITE MAGIC row did not:
 *
 * - On screen (desktop): the reason gives way to the name (`ffx2-hud.css`), and "White Magic" is 188 px of a 283 px line at
 *   1600x900 with the group arrow and the cursor after it, so its reason was left 30 px (2 px under the cursor). It now
 *   drops to a line under the name when less than a fifth of it would show (`CommandMenuReason.ts`).
 * - In the top bar (desktop) and the footer line (phone): a greyed group row (White Magic, Skill, Item) read the bare
 *   "Open the White Magic menu." where Attack read "Itchy — spherechange first — Physical damage". It now leads with the reason
 *   the same way (`commandHelp.ts#groupHelpText`).
 *
 * The engine is the real one (`buildCommands`, the real registries), as `parity-ffx2-menu-engine.test.ts` builds it.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { AtbSnapshot, AvailableCommand } from '../../src/battle/common/types.ts';
import { applyStatus } from '../../src/battle/ffx2/index.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import { chainRegistries, defaultAbilities } from '../../src/battle/ffx2/abilities.ts';
import { ITCHY_REASON, buildCommands, type MenuContext } from '../../src/battle/ffx2/menu.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { openCommandMenu } from '../../src/ui/ffx2/CommandMenu.ts';
import { groupHelpText, commandHelpText } from '../../src/ui/ffx2/commandHelp.ts';
import { REASON_BELOW, REASON_FLOOR, reasonStacks, syncReasons } from '../../src/ui/ffx2/CommandMenuReason.ts';

beforeAll(async () => {
  await registerBattleContent();
});

const HUD_CSS = join(process.cwd(), 'src', 'ui', 'ffx2', 'ffx2-hud.css');
const EMPTY_SNAPSHOT: AtbSnapshot = { elapsedMs: 0, bars: [] };

/** Yuna as a White Mage, Itchy, with Escape allowed and a potion in the bag, through the real engine. */
function itchyWhiteMage(): AvailableCommand[] {
  const opts = ffx2EngineOptions();
  const unit = aiUnit('yuna', 'party');
  unit.dresspheres = { current: 'white-mage', owned: ['white-mage'], garmentGrid: { id: 'first-steps', nodePosition: 0, passedGates: [], wornThisBattle: [] }, abilitiesLearned: {} };
  applyStatus(unit, { status: 'itchy', chance: 255, duration: 3 });
  const ctx: MenuContext = {
    units: [unit],
    abilities: chainRegistries(opts.abilities, defaultAbilities),
    dresspheres: opts.dresspheres!,
    canEscape: true,
    items: opts.items!,
    inventory: { 'x2-potion': 3, 'x2-grenade': 2 },
  };
  return buildCommands(unit, ctx);
}

function key(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
}

describe('the engine greys the whole White Magic group with the Itchy reason', () => {
  it('every White Magic row and every Item row is greyed with ITCHY_REASON; Escape stays usable', () => {
    const rows = itchyWhiteMage();
    const white = rows.filter((r) => r.category === 'whitemagic');
    const items = rows.filter((r) => r.command.kind === 'item');
    expect(white.length, 'a White Mage lists several White Magic rows (a group)').toBeGreaterThan(1);
    expect(items.length).toBeGreaterThan(0);
    for (const r of [...white, ...items]) expect([r.label, r.enabled, r.disabledReason]).toEqual([r.label, false, ITCHY_REASON]);
    expect(rows.find((r) => r.command.kind === 'escape')?.enabled).toBe(true);
  });
});

describe('the help sentence of a greyed group row leads with the reason, as a greyed leaf row\'s does', () => {
  it('groupHelpText: reason, a dash, the opener', () => {
    const white = itchyWhiteMage().filter((r) => r.category === 'whitemagic');
    expect(groupHelpText('White Magic', white)).toBe('Itchy — spherechange first — Open the White Magic menu.');
  });

  it('it is the same form as a greyed leaf row: "Itchy — spherechange first — <what it does>"', () => {
    const leaf: AvailableCommand = { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: false, disabledReason: ITCHY_REASON, validTargets: ['b'] };
    expect(commandHelpText(leaf).startsWith(`${ITCHY_REASON} — `)).toBe(true);
    const white = itchyWhiteMage().filter((r) => r.category === 'whitemagic');
    expect(groupHelpText('White Magic', white).startsWith(`${ITCHY_REASON} — `)).toBe(true);
  });

  it('a group with anything enabled in it keeps the bare opener (no reason to give)', () => {
    const white = itchyWhiteMage().filter((r) => r.category === 'whitemagic');
    const one = [{ ...white[0]!, enabled: true }, ...white.slice(1)];
    expect(groupHelpText('White Magic', one)).toBe('Open the White Magic menu.');
  });

  it('a Silenced group (every spell greyed "Silenced") says so the same way', () => {
    const rows: AvailableCommand[] = ['Fire', 'Blizzard'].map((label) => ({ command: { kind: 'ability', id: label, targets: [] }, label, category: 'blackmagic', mpCost: 4, enabled: false, disabledReason: 'Silenced', validTargets: ['b'] }));
    expect(groupHelpText('Black Magic', rows)).toBe('Silenced — Open the Black Magic menu.');
  });
});

describe('the command window feeds that sentence to the top bar and the phone footer', () => {
  let container: HTMLElement;
  let targetLayer: HTMLElement;
  beforeEach(() => {
    container = document.createElement('div');
    targetLayer = document.createElement('div');
    document.body.append(container, targetLayer);
  });
  afterEach(() => {
    container.remove();
    targetLayer.remove();
  });

  it('with the cursor on the greyed White Magic row, onHelp carries the reason; so it does on the greyed Item row', () => {
    const seen: Array<[string, string]> = [];
    void openCommandMenu({
      container,
      targetLayer,
      commands: itchyWhiteMage(),
      previewRank: () => EMPTY_SNAPSHOT,
      project: () => null,
      onPreview: () => {},
      onHelp: (label, text) => seen.push([label, text]),
      actorName: 'Yuna',
    });
    expect(seen.at(-1)).toEqual(['White Magic', 'Itchy — spherechange first — Open the White Magic menu.']);
    const labels = [...container.querySelectorAll('.ffx2cmd__label')].map((e) => e.textContent);
    const item = labels.indexOf('Item');
    expect(item, 'Item is a row of the menu').toBeGreaterThan(0);
    for (let i = 0; i < item; i++) key('ArrowDown');
    expect(seen.at(-1)).toEqual(['Item', 'Itchy — spherechange first — Open the Item menu.']);
  });
});

describe('a reason with no room beside its name moves under it', () => {
  it('reasonStacks: under a fifth of the text showing stacks, a fifth or more does not, and an unmeasured row never does', () => {
    // White Magic at 1600x900 (CSS px): 30.7 of 376 showing. Item 151.2 of 376; Attack with the cursor on it 124 of 376.
    expect(reasonStacks(30.7, 376)).toBe(true);
    expect(reasonStacks(1.9, 376)).toBe(true);
    expect(reasonStacks(151.2, 376)).toBe(false);
    expect(reasonStacks(124, 376)).toBe(false);
    expect(reasonStacks(109.2, 376), 'Skill with the cursor on it, the tightest sibling seen').toBe(false);
    expect(reasonStacks(376 * REASON_FLOOR, 376), 'exactly the floor shows').toBe(false);
    expect(reasonStacks(0, 0), 'jsdom measures nothing').toBe(false);
    expect(reasonStacks(5, 0)).toBe(false);
  });

  /** Row markup as `CommandMenu.ts` writes it, with the two measures a layout engine would give (jsdom gives 0 for both). */
  function box(rows: Array<{ label: string; shown: number; natural: number; cursor?: boolean }>): HTMLElement {
    const el = document.createElement('div');
    el.className = 'ffx2hud__command';
    el.innerHTML = rows
      .map((r) => `<div class="ig-cmd ig-cmd--disabled"><span class="ffx2cmd__label">${r.label}</span><span class="ffx2cmd__reason">${ITCHY_REASON}</span>${r.cursor ? '<svg class="ig-cmd__cursor"></svg>' : ''}</div>`)
      .join('');
    el.querySelectorAll<HTMLElement>('.ffx2cmd__reason').forEach((span, i) => {
      Object.defineProperty(span, 'clientWidth', { configurable: true, get: () => rows[i]!.shown });
      Object.defineProperty(span, 'scrollWidth', { configurable: true, get: () => rows[i]!.natural });
    });
    return el;
  }

  it('syncReasons marks the row that cannot show its reason and leaves its siblings alone', () => {
    const el = box([
      { label: 'White Magic', shown: 30.7, natural: 376 },
      { label: 'Item', shown: 151.2, natural: 376 },
      { label: 'Attack', shown: 124, natural: 376 },
    ]);
    syncReasons(el);
    const rows = [...el.querySelectorAll('.ig-cmd')].map((r) => r.classList.contains(REASON_BELOW));
    expect(rows).toEqual([true, false, false]);
  });

  it('the decision is made without the cursor: it is hidden for the measure and shown again, and a stale mark is cleared', () => {
    const el = box([{ label: 'Skill', shown: 109.2, natural: 376, cursor: true }]);
    const row = el.querySelector<HTMLElement>('.ig-cmd')!;
    row.classList.add(REASON_BELOW); // left over from an earlier render of another list
    const cursor = row.querySelector<SVGElement>('.ig-cmd__cursor')!;
    let shownDuringMeasure: string | null = null;
    const reason = row.querySelector<HTMLElement>('.ffx2cmd__reason')!;
    Object.defineProperty(reason, 'clientWidth', { configurable: true, get: () => ((shownDuringMeasure = cursor.style.display), 109.2) });
    syncReasons(el);
    expect(shownDuringMeasure).toBe('none');
    expect(cursor.style.display).toBe('');
    expect(row.classList.contains(REASON_BELOW)).toBe(false);
  });

  it('the phone layout (which stacks every reason already) is left alone', () => {
    const el = box([{ label: 'White Magic', shown: 2, natural: 376 }]);
    document.documentElement.dataset['phoneBattle'] = 'ffx2';
    try {
      syncReasons(el);
      expect(el.querySelector('.ig-cmd')!.classList.contains(REASON_BELOW)).toBe(false);
    } finally {
      delete document.documentElement.dataset['phoneBattle'];
    }
  });

  describe('through the menu', () => {
    let container: HTMLElement;
    let targetLayer: HTMLElement;
    const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
    beforeEach(() => {
      container = document.createElement('div');
      targetLayer = document.createElement('div');
      document.body.append(container, targetLayer);
      // A layout engine's answer for the reasons of this menu: the White Magic row leaves 2 px, every other row 151.
      Object.defineProperty(proto, 'scrollWidth', { configurable: true, get(this: HTMLElement) { return this.classList.contains('ffx2cmd__reason') ? 376 : 0; } });
      Object.defineProperty(proto, 'clientWidth', {
        configurable: true,
        get(this: HTMLElement) {
          if (!this.classList.contains('ffx2cmd__reason')) return 0;
          return this.closest('.ig-cmd')?.querySelector('.ffx2cmd__label')?.textContent === 'White Magic' ? 2 : 151;
        },
      });
    });
    afterEach(() => {
      delete proto['scrollWidth'];
      delete proto['clientWidth'];
      container.remove();
      targetLayer.remove();
    });

    it('the open menu marks the White Magic row only, on the first render and after the cursor moves', () => {
      void openCommandMenu({ container, targetLayer, commands: itchyWhiteMage(), previewRank: () => EMPTY_SNAPSHOT, project: () => null, onPreview: () => {}, actorName: 'Yuna' });
      const marked = (): string[] => [...container.querySelectorAll('.ig-cmd')].filter((r) => r.classList.contains(REASON_BELOW)).map((r) => r.querySelector('.ffx2cmd__label')!.textContent!);
      expect(marked()).toEqual(['White Magic']);
      key('ArrowDown');
      key('ArrowDown');
      expect(marked(), 'the cursor moving to another row changes nothing').toEqual(['White Magic']);
    });
  });
});

describe('the stylesheet', () => {
  const css = readFileSync(HUD_CSS, 'utf8');

  it('puts a marked row\'s reason on its own line under the name, on the desktop layout only', () => {
    expect(css).toMatch(/html:not\(\[data-phone-battle\]\) \.ffx2hud \.ig-cmd\.ffx2cmd--reason-below \{[^}]*flex-wrap: wrap/);
    expect(css).toMatch(/html:not\(\[data-phone-battle\]\) \.ffx2hud \.ig-cmd\.ffx2cmd--reason-below \.ffx2cmd__reason \{[^}]*order: 1[^}]*flex: 1 0 100%/);
  });

  it('keeps the RC7 rule that the reason gives way to the name for every row that is not marked', () => {
    expect(css).toMatch(/html:not\(\[data-phone-battle\]\) \.ffx2hud \.ffx2cmd__reason \{[^}]*flex: 0 1000000 auto[^}]*text-overflow: ellipsis/);
    expect(REASON_BELOW).toBe('ffx2cmd--reason-below');
  });
});
