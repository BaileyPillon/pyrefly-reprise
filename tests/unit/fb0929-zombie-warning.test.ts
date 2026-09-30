// @vitest-environment jsdom
/**
 * fb-0929 (Bailey's friend, 2026-09-29: "Hi potion killed kimahri instead of healing lol during
 * first encounter during encounter with Seymour flux"). **FFX only.**
 *
 * The engine is canon: an engine sweep of Chapter I (400 seeds, 5,589 restoratives) found no item
 * that lowered HP on a non-Zombie, and every drop was a living Zombie, which FFX turns into damage
 * ("Hi-Potion on a Zombie therefore deals exactly 1 000 damage", research/ffx-combat-core.md; Lance
 * of Atrophy is "Zombie @ 100%", research/ffx-seymour-flux.md §5). What the game did not do was
 * tell the player, on the two surfaces a mouse player reads:
 *
 *  * **Kimahri's party plate dropped the Zombie pip.** The plate drew the first six statuses in
 *    insertion order, and the chapter's own opening (Mighty Guard) puts exactly six on him
 *    (Protect, Shell, NulBlaze, NulFrost, NulShock, NulTide), so a Zombie landed after it was the
 *    seventh and never drawn. The documented intent is a Zombie icon (research/visual-bible.md,
 *    "Status icons": Zombie chip `#A8C48A`; Lance of Atrophy "leaving the green Zombie icon").
 *  * **Aiming a restorative at a Zombie ally said nothing.** The documented help contract for "a
 *    party target" is "name, and any statuses spelled out in words" (visual-bible §3.16); the plate
 *    now says "Zombie" and, for anything that would hurt, what it will do: the engine's own preview.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleState, Command, CombatantId, Decision, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { registerFFXAbilities, registerFFXItems } from '../../src/battle/ffx/registry.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { recommendedCommand } from '../../src/engine/tactics/guide.ts';
import { PartyStatusWindow } from '../../src/ui/ffx/PartyStatusWindow.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';

const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

beforeAll(() => {
  // What the app does at boot (`BattleScreenContent.loadFfxContent`).
  registerFFXAbilities(ALL_ABILITIES.filter((a) => a.game === 'ffx'));
  registerFFXItems(Object.values(ITEMS).filter((i) => i.game === 'ffx'));
});

type Input = Extract<Decision, { kind: 'player-input' }>;
const MIGHTY_GUARD = ['protect', 'shell', 'nulblaze', 'nulfrost', 'nulshock', 'nultide'];

/**
 * A real Chapter I board: the guide's own line (Kimahri opens with Mighty Guard) played until
 * Seymour's Lance of Atrophy zombifies Kimahri on top of Mighty Guard's six statuses, and the next
 * party member other than Kimahri is asked for a command.
 */
let board: { state: BattleState; decision: Input; seed: number } | null = null;
function zombieKimahriBoard(): { state: BattleState; decision: Input; seed: number } {
  board ??= findZombieKimahriBoard();
  return JSON.parse(JSON.stringify(board)) as { state: BattleState; decision: Input; seed: number };
}
function findZombieKimahriBoard(): { state: BattleState; decision: Input; seed: number } {
  const chapter = getChapter('seymour-flux')!;
  for (let seed = 1; seed <= 200; seed++) {
    const engine = createFFXEngine({ content, autoResolveMinigames: true });
    engine.setSeed(seed);
    engine.init({ game: 'ffx', party: chapter.buildRef, enemies: ENEMY_GROUPS_BY_ID[chapter.enemyGroupRef.id]!, triggers: [], seed, condition: 'normal', canEscape: false } as never);
    for (let i = 0; i < 400; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const state = engine.state() as BattleState;
      const k = state.combatants['kimahri'] as FFXCombatant | undefined;
      if (k?.alive && k.statuses['zombie'] && MIGHTY_GUARD.every((s) => k.statuses[s as 'zombie']) && d.actorId !== 'kimahri') {
        return { state: JSON.parse(JSON.stringify(state)) as BattleState, decision: d, seed };
      }
      if (state.turn > 40) break;
      engine.submit(recommendedCommand(state, d) ?? ({ kind: 'defend', targets: [] } as Command));
    }
  }
  throw new Error('no seed reached a Zombie Kimahri under Mighty Guard');
}

let cleanup: (() => void) | null = null;
afterEach(() => {
  cleanup?.();
  cleanup = null;
  document.body.innerHTML = '';
});

describe("Kimahri's party plate shows Zombie (FFX only)", () => {
  it("the Zombie icon is drawn even with Mighty Guard's six statuses already on him", () => {
    const { state } = zombieKimahriBoard();
    const k = state.combatants['kimahri']!;
    expect(Object.keys(k.statuses).length).toBeGreaterThan(6);
    const win = new PartyStatusWindow();
    win.render(['tidus', 'yuna', 'kimahri'], state.combatants as Record<CombatantId, FFXCombatant>, null);
    // Status display O3 (Bailey's pick, 2026-09-29) replaced the single-colour pips with round
    // medallions, most alarming first: the Zombie leads the row, in the harm (red) rim.
    const icons = [...win.el.querySelectorAll('[data-actor="kimahri"] .ffx-stat__statuses .sti')];
    expect(icons[0]?.getAttribute('data-status'), icons.map((p) => p.getAttribute('data-status')).join(',')).toBe('zombie');
    expect(icons[0]!.className).toMatch(/sti--harm/);
  });
});

describe('aiming a restorative at a Zombie ally says what it will do (FFX only)', () => {
  function plateNotesFor(label: string): Record<string, string> {
    const { state, decision } = zombieKimahriBoard();
    const row = decision.commands.find((c) => c.label === label && c.enabled) as AvailableCommand | undefined;
    expect(row, `${label} on the menu`).toBeTruthy();
    const root = document.createElement('div');
    document.body.appendChild(root);
    const hud = new FFXBattleHud();
    hud.mount(root);
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 400, y: 300 }));
    hud.sync(state, []);
    void hud.chooseCommand(decision.actorId, [row!], () => []);
    for (let i = 0; i < 3 && !document.querySelector('.ffx-target__plate'); i++) {
      (root.querySelector('.ig-cmd') as HTMLElement | null)?.click();
    }
    const notes: Record<string, string> = {};
    for (let i = 0; i < row!.validTargets.length + 1; i++) {
      const plate = document.querySelector('.ffx-target__plate');
      if (plate) {
        const name = plate.querySelector('.ffx-target__name')?.textContent ?? '';
        // Status display O3 draws a Zombie note as a red ZOMBIE tag; its words ride in the title.
        const note = plate.querySelector('.ffx-target__note');
        notes[name] = note?.getAttribute('title') ?? note?.textContent ?? '';
      }
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
    }
    return notes;
  }

  it('Hi-Potion on the Zombie Kimahri: the plate says Zombie and 1,000 damage', () => {
    const notes = plateNotesFor('Hi-Potion');
    expect(notes['Kimahri'], JSON.stringify(notes)).toMatch(/Zombie/);
    expect(notes['Kimahri']).toMatch(/1,000 damage/);
  });

  it('Hi-Potion on a living non-Zombie ally carries no Zombie note', () => {
    const notes = plateNotesFor('Hi-Potion');
    const others = Object.entries(notes).filter(([n]) => n !== 'Kimahri');
    expect(others.length).toBeGreaterThan(0);
    for (const [, note] of others) expect(note).not.toMatch(/Zombie/);
  });

  it('Phoenix Down on the living Zombie Kimahri: the plate says it KOs him', () => {
    const notes = plateNotesFor('Phoenix Down');
    expect(notes['Kimahri'], JSON.stringify(notes)).toMatch(/Zombie.*KO/);
  });
});

/**
 * The two OPTIONS for Bailey (`zombieWarnOptions.ts`): built, **off by default**, on only with
 * `?zombiewarn=`. Off, nothing changes: a click on the Zombie ally confirms at once, as it did.
 */
describe('fb-0929 options, off by default (FFX only)', () => {
  function openHiPotion(): { hud: FFXBattleHud; pick: Promise<Command> } {
    const { state, decision } = zombieKimahriBoard();
    const row = decision.commands.find((c) => c.label === 'Hi-Potion' && c.enabled)!;
    const root = document.createElement('div');
    document.body.appendChild(root);
    const hud = new FFXBattleHud();
    hud.mount(root);
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 400, y: 300 }));
    hud.sync(state, []);
    const pick = hud.chooseCommand(decision.actorId, [row], () => []);
    for (let i = 0; i < 3 && !document.querySelector('.ffx-target__plate'); i++) {
      (root.querySelector('.ig-cmd') as HTMLElement | null)?.click();
    }
    return { hud, pick };
  }
  const menuOf = (hud: FFXBattleHud) => (hud as unknown as { commandMenu: { tryConfirmTargetById(id: string): boolean } }).commandMenu;
  const settled = async (p: Promise<unknown>): Promise<boolean> =>
    Promise.race([p.then(() => true), new Promise<boolean>((r) => setTimeout(() => r(false), 30))]);

  afterEach(() => window.history.replaceState({}, '', '/'));

  it('off: one click on the Zombie Kimahri confirms the Hi-Potion, and the plate has no word', async () => {
    const { hud, pick } = openHiPotion();
    expect(document.querySelector('.ffx-stat__zombie')).toBeNull();
    menuOf(hud).tryConfirmTargetById('kimahri');
    expect(await settled(pick)).toBe(true);
    expect((await pick).targets).toEqual(['kimahri']);
  });

  it('guard on: the first click only aims (the plate warns), the second confirms', async () => {
    window.history.replaceState({}, '', '/?zombiewarn=guard');
    const { hud, pick } = openHiPotion();
    expect(menuOf(hud).tryConfirmTargetById('kimahri')).toBe(true);
    expect(await settled(pick)).toBe(false);
    // Status display O3: the plate's red ZOMBIE tag keeps the note's words in its title.
    expect(document.querySelector('.ffx-target__plate .ffx-target__note')?.getAttribute('title')).toMatch(/Zombie: 1,000 damage/);
    menuOf(hud).tryConfirmTargetById('kimahri');
    expect(await settled(pick)).toBe(true);
    expect((await pick).targets).toEqual(['kimahri']);
  });

  it('guard on: a click on a non-Zombie ally still confirms at once', async () => {
    window.history.replaceState({}, '', '/?zombiewarn=guard');
    const { hud, pick } = openHiPotion();
    menuOf(hud).tryConfirmTargetById('yuna');
    expect(await settled(pick)).toBe(true);
  });

  it('word on: the party plate spells Zombie out on Kimahri only', () => {
    window.history.replaceState({}, '', '/?zombiewarn=word');
    const { state } = zombieKimahriBoard();
    const win = new PartyStatusWindow();
    win.render(['tidus', 'yuna', 'kimahri'], state.combatants as Record<CombatantId, FFXCombatant>, null);
    const words = [...win.el.querySelectorAll('.ffx-stat__zombie')].map((e) => e.closest('[data-actor]')?.getAttribute('data-actor'));
    expect(words).toEqual(['kimahri']);
  });
});
