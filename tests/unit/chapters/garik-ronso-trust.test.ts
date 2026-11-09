// @vitest-environment jsdom
/**
 * Ronso trust, the one setting of the hidden Garik Ronso chapter (FFX-2 only): the two values, what each names, where it is kept, and the party prep tab that sets it.
 *
 * What it pins: low is the default and names the hostile fight, high the friendly bout; the chapter record's first formation FOLLOWS the setting (a getter), so the battle's own setup does; the choice is kept in a key of its
 * own, never the save and never the experiments' records, the default leaves nothing behind, and a bad stored value or no storage at all reads as the default; the TRUST tab exists for this chapter only, shows both rows with the
 * tooltip, a click or a tap on a row and the Triangle key set the setting, and it takes effect on the formation the battle opens with.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { prepPanelsFor } from '../../../src/app/screens/PartyPrepScreen.ts';
import { SAVE_KEY } from '../../../src/app/SaveData.ts';
import { EXPERIMENTS_KEY } from '../../../src/app/experiments/experimentRecords.ts';
import { FFX2_GARIK_RONSO } from '../../../src/data/chapter-ffx2-garik-ronso.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS } from '../../../src/data/encounters.ts';
import { garikFriendlyGroup, garikHostileGroup } from '../../../src/data/ffx2/enemies/garik-ronso.ts';
import {
  RONSO_TRUSTS,
  RONSO_TRUST_DEFAULT,
  RONSO_TRUST_KEY,
  RONSO_TRUST_TEXT,
  garikFirstGroup,
  garikGroupFor,
  getRonsoTrust,
  otherRonsoTrust,
  setRonsoTrust,
  setRonsoTrustStorageForTests,
  type RonsoTrustStorage,
} from '../../../src/data/garik-ronso-trust.ts';
import { RONSO_TRUST_ACTION, RONSO_TRUST_PANEL_ID, makeRonsoTrustPanel, ronsoTrustHtml } from '../../../src/ui/ffx2/party-prep/ronsoTrustPanel.ts';
import '../../../src/ui/ffx2/party-prep/index.ts'; // registers the FFX-2 prep panels, this chapter's TRUST tab among them

/** An in-memory storage that records what is written. */
function memory(initial: Record<string, string> = {}): RonsoTrustStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, String(v)),
    removeItem: (k) => void data.delete(k),
  };
}

let store: ReturnType<typeof memory>;
beforeEach(() => {
  store = memory();
  setRonsoTrustStorageForTests(store);
});
afterEach(() => {
  setRonsoTrustStorageForTests(undefined);
});

describe('the setting', () => {
  it('has two values, low (the default, the hostile fight) and high (the friendly bout), and each names its formation', () => {
    expect([...RONSO_TRUSTS]).toEqual(['low', 'high']);
    expect(RONSO_TRUST_DEFAULT).toBe('low');
    expect(getRonsoTrust()).toBe('low');
    expect(garikGroupFor('low')).toBe(garikHostileGroup);
    expect(garikGroupFor('high')).toBe(garikFriendlyGroup);
    expect([otherRonsoTrust('low'), otherRonsoTrust('high')]).toEqual(['high', 'low']);
  });

  it('the chapter record\'s first formation follows it, and so does the battle\'s own setup (HP 15,000 with three foes, or 10,940 with two)', () => {
    expect(FFX2_GARIK_RONSO.enemyGroupRef).toBe(garikHostileGroup);
    expect(setupForChapter(FFX2_GARIK_RONSO, 1).enemies).toBe(garikHostileGroup);
    setRonsoTrust('high');
    expect(FFX2_GARIK_RONSO.enemyGroupRef).toBe(garikFriendlyGroup);
    expect(garikFirstGroup()).toBe(garikFriendlyGroup);
    const setup = setupForChapter(FFX2_GARIK_RONSO, 1);
    expect(setup.enemies).toBe(garikFriendlyGroup);
    expect(setup.enemies.enemies.map((e) => e.hp).reduce((a, b) => a + b, 0)).toBe(10_940);
    expect(setup.canEscape).toBe(false);
    setRonsoTrust('low');
    expect(setupForChapter(FFX2_GARIK_RONSO, 1).enemies.enemies.map((e) => e.hp).reduce((a, b) => a + b, 0)).toBe(15_000);
  });

  it('the record is still a plain chapter to every reader: the property is enumerable, a spread and a structured copy of the fields see the group, and EXPERIMENT_CHAPTERS holds it', () => {
    expect(Object.keys(FFX2_GARIK_RONSO)).toContain('enemyGroupRef');
    expect({ ...FFX2_GARIK_RONSO }.enemyGroupRef).toBe(garikHostileGroup);
    expect(EXPERIMENT_CHAPTERS).toContain(FFX2_GARIK_RONSO);
  });

  it('is kept in a key of its own: high writes it, low removes it, and neither the save nor the experiments\' records is touched', () => {
    setRonsoTrust('high');
    expect([...store.data.entries()]).toEqual([[RONSO_TRUST_KEY, 'high']]);
    setRonsoTrust('low');
    expect(store.data.size).toBe(0);
    for (const key of store.data.keys()) expect([SAVE_KEY, EXPERIMENTS_KEY]).not.toContain(key);
    expect(RONSO_TRUST_KEY).not.toBe(SAVE_KEY);
    expect(RONSO_TRUST_KEY).not.toBe(EXPERIMENTS_KEY);
  });

  it('is read back from the key on the first read; a stored value that is not "high" reads as the default', () => {
    setRonsoTrustStorageForTests(memory({ [RONSO_TRUST_KEY]: 'high' }));
    expect(getRonsoTrust()).toBe('high');
    for (const junk of ['', 'HIGH', 'medium', '{"a":1}', 'low']) {
      setRonsoTrustStorageForTests(memory({ [RONSO_TRUST_KEY]: junk }));
      expect(getRonsoTrust(), `stored "${junk}"`).toBe('low');
    }
  });

  it('works with no storage at all, and with storage that throws: the choice holds for the visit and nothing breaks', () => {
    setRonsoTrustStorageForTests(null);
    expect(getRonsoTrust()).toBe('low');
    setRonsoTrust('high');
    expect(getRonsoTrust()).toBe('high');
    const broken: RonsoTrustStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('full');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    setRonsoTrustStorageForTests(broken);
    expect(getRonsoTrust()).toBe('low');
    expect(() => setRonsoTrust('high')).not.toThrow();
    expect(getRonsoTrust()).toBe('high');
    expect(() => setRonsoTrust('low')).not.toThrow();
  });

  it('no other chapter\'s first formation is touched by it', () => {
    const before = [...CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((c) => c.id !== FFX2_GARIK_RONSO.id).map((c) => c.enemyGroupRef.id);
    setRonsoTrust('high');
    const after = [...CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((c) => c.id !== FFX2_GARIK_RONSO.id).map((c) => c.enemyGroupRef.id);
    expect(after).toEqual(before);
  });
});

describe('the TRUST tab of party prep', () => {
  it('is registered for FFX-2 and visible for this chapter only: every other chapter\'s prep keeps the tabs it had', () => {
    const own = prepPanelsFor('ffx2', FFX2_GARIK_RONSO).map((p) => p.id);
    expect(own).toContain(RONSO_TRUST_PANEL_ID);
    expect(own.at(-1)).toBe(RONSO_TRUST_PANEL_ID); // the last tab
    for (const chapter of [...CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((c) => c.game === 'ffx2' && c.id !== FFX2_GARIK_RONSO.id)) {
      expect(prepPanelsFor('ffx2', chapter).map((p) => p.id), chapter.id).not.toContain(RONSO_TRUST_PANEL_ID);
    }
    expect(prepPanelsFor('ffx', CHAPTERS.find((c) => c.game === 'ffx')!).map((p) => p.id)).not.toContain(RONSO_TRUST_PANEL_ID);
  });

  it('shows the label, the tooltip and both rows, low chosen, each row a radio with an action', () => {
    const root = document.createElement('div');
    makeRonsoTrustPanel().mount(root, { chapter: FFX2_GARIK_RONSO, memberId: 'yuna' });
    expect(root.textContent).toContain(RONSO_TRUST_TEXT.label.toUpperCase());
    expect(root.textContent).toContain('In the game this follows how you answered the Ronso on Mt. Gagazet.');
    const rows = [...root.querySelectorAll<HTMLElement>('.rtrust [role="radio"]')];
    expect(rows.map((r) => r.dataset['action'])).toEqual([`${RONSO_TRUST_ACTION}low`, `${RONSO_TRUST_ACTION}high`]);
    expect(rows.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false']);
    expect(rows[0]!.textContent).toContain('The hostile fight');
    expect(rows[1]!.textContent).toContain('The friendly bout');
    expect(ronsoTrustHtml('high')).toContain('chosen');
  });

  it('draws a phone page beside the desktop markup (the prep shell\'s one long page): the same two rows with the same actions, the chosen one marked, redrawn with the setting', () => {
    const root = document.createElement('div');
    const panel = makeRonsoTrustPanel();
    panel.mount(root, { chapter: FFX2_GARIK_RONSO, memberId: 'yuna' });
    const host = root.querySelector<HTMLElement>(':scope > .prph');
    expect(host).not.toBeNull();
    expect(root.lastElementChild).toBe(host); // beside, never inside
    expect(root.querySelectorAll('.prph')).toHaveLength(1);
    const rows = (): HTMLElement[] => [...host!.querySelectorAll<HTMLElement>('[role="radio"]')];
    expect(rows().map((r) => r.dataset['action'])).toEqual([`${RONSO_TRUST_ACTION}low`, `${RONSO_TRUST_ACTION}high`]);
    expect(rows().map((r) => r.classList.contains('is-sel'))).toEqual([true, false]);
    expect(host!.textContent!.toLowerCase()).toContain('the hostile fight');
    expect(host!.textContent!.toLowerCase()).toContain('the friendly bout');
    expect(host!.textContent).toContain('In the game this follows how you answered the Ronso on Mt. Gagazet.');
    const press = (actions: string[], triangle = false): void => {
      panel.handleInput!({ actions, justPressed: (b: string) => triangle && b === 'triangle' } as unknown as Parameters<NonNullable<typeof panel.handleInput>>[0]);
    };
    press([`${RONSO_TRUST_ACTION}high`]); // a tap on the phone row is the same action as a click on the desktop row
    expect(getRonsoTrust()).toBe('high');
    expect(rows().map((r) => r.classList.contains('is-sel'))).toEqual([false, true]);
    press([], true); // Triangle flips it back to low
    expect(getRonsoTrust()).toBe('low');
    expect(rows().map((r) => r.classList.contains('is-sel'))).toEqual([true, false]);
    panel.unmount?.();
  });

  it('an action on a row sets the setting and redraws; the same action twice changes nothing; Triangle flips it and it is consumed', () => {
    const root = document.createElement('div');
    const panel = makeRonsoTrustPanel();
    panel.mount(root, { chapter: FFX2_GARIK_RONSO, memberId: 'yuna' });
    const input = (actions: string[], triangle = false): Parameters<NonNullable<typeof panel.handleInput>>[0] =>
      ({ actions, justPressed: (b: string) => triangle && b === 'triangle' }) as unknown as Parameters<NonNullable<typeof panel.handleInput>>[0];
    expect(panel.handleInput!(input([`${RONSO_TRUST_ACTION}high`]))).toBe(true);
    expect(getRonsoTrust()).toBe('high');
    expect([...root.querySelectorAll('.rtrust [role="radio"]')].map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'true']);
    expect(store.data.get(RONSO_TRUST_KEY)).toBe('high');
    expect(panel.handleInput!(input([`${RONSO_TRUST_ACTION}high`]))).toBe(true);
    expect(getRonsoTrust()).toBe('high');
    expect(panel.handleInput!(input([], true))).toBe(true);
    expect(getRonsoTrust()).toBe('low');
    expect(panel.handleInput!(input([], true))).toBe(true);
    expect(getRonsoTrust()).toBe('high');
    expect(panel.handleInput!(input(['prep:begin']))).toBe(false); // the shell's own actions are not this tab's
    expect(panel.handleInput!(input([]))).toBe(false);
    expect(panel.hint!()).toEqual({ keys: 'Q', label: 'FLIPS THE TRUST', pad: 'Triangle' });
  });

  it('what the tab sets is what the battle opens with', () => {
    const root = document.createElement('div');
    const panel = makeRonsoTrustPanel();
    panel.mount(root, { chapter: FFX2_GARIK_RONSO, memberId: 'yuna' });
    panel.handleInput!({ actions: [`${RONSO_TRUST_ACTION}high`], justPressed: () => false } as never);
    expect(setupForChapter(FFX2_GARIK_RONSO, 5).enemies.enemies.map((e) => e.id)).toEqual(['x2-ronso-youth-bout', 'x2-garik-ronso-bout']);
    panel.handleInput!({ actions: [`${RONSO_TRUST_ACTION}low`], justPressed: () => false } as never);
    expect(setupForChapter(FFX2_GARIK_RONSO, 5).enemies.enemies.map((e) => e.id)).toEqual(['x2-ronso-youth-a', 'x2-ronso-youth-b', 'x2-garik-ronso']);
  });

  it('unmounted, the panel does nothing and does not throw on input', () => {
    const panel = makeRonsoTrustPanel();
    panel.mount(document.createElement('div'), { chapter: FFX2_GARIK_RONSO, memberId: 'yuna' });
    panel.unmount!();
    expect(() => panel.handleInput!({ actions: [`${RONSO_TRUST_ACTION}high`], justPressed: () => false } as never)).not.toThrow();
  });
});
