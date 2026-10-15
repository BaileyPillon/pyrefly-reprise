/**
 * Angra Mainyu at the Bikanel excavation camp (FFX-2 Chapter 5, the hidden chapter): the line the guide teaches, as the move advisor's tactic. **FFX-2 only** [AGENTS.md rule 14].
 *
 * ATB and dresspheres; the Chapter 5 preset (`data/ffx2/builds/farplane.ts`: Yuna White Mage, Rikku and Paine Dark Knights). Registered under the FFX-2 game in `./lookup.ts`.
 *
 * ## The line
 *
 * It is the **advisor line** the chapter's bench measures (`tests/unit/chapters/angra-mainyu-bench.test.ts`): an input to a measurement, never game data, and nothing in it tunes the boss (hard rule 6).
 * It is the strategy every source describes (`research/ffx2-angra-mainyu.md` §0.4, §5, `[search: 4 sources]`): **two Dark Knights on Darkness**, which reaches all three and passes both arms' immunities
 * (§4.4), so the arms fall again and again and Perdition's Flame, which needs both (§4.1), rarely comes; **a healer the whole fight**, with **Protect** up, which halves each of the Flame's hits (§3.1).
 * Reflect is left out: it would bounce Yuna's own healing spells off the girls. **Shell** (it halves Flare and Zarich's spells) and **Protect kept up while an arm is down** were measured and left out
 * too: over the bench's 40 seeds (bench speed, action time on) they won 22 and 23 fights against this line's 24 (`docs/handoff/ch-angra-mainyu.md`); the Flame, not the spells, is what kills.
 *
 * **Yuna (White Mage)**, in this order (each step measured on the bench; the order is the line's, not the game's):
 * 1. **Revive**: a Mega Phoenix when two girls are down, else a Phoenix Down (else Life) for one.
 * 2. **A Megalixir** when two girls are under {@link MEGALIXIR_UNDER}; **a Mega-Potion** when two are under {@link MEGA_UNDER}.
 * 3. **Herself first** under {@link YUNA_SELF_UNDER}: Curaga (else an X-Potion). Her HP is the party's lowest and nobody else heals.
 * 4. **Protect** while both arms stand and a girl lacks it: the Flame can come, and Protect halves each of its ten hits (each later hit on the same girl lands harder, so the whole cast is what kills).
 * 5. **Esuna** (else a Remedy) for a girl carrying one of Bloody Breath's statuses (§3.2): Confusion first (a confused Dark Knight swings at her friends), then Poison (an eighth of her HP a tick), Darkness
 *    (a blinded Dark Knight's Darkness can miss) and Silence (a silenced White Mage cannot cast). Clearing them before healing the others won more fights on the bench (17 of 24 against 15 of 24).
 * 6. **Curaga** (else Cura) for a girl under {@link CURAGA_UNDER}.
 * 7. **Protect**, whenever a girl lacks it.
 * 8. **A Turbo Ether** (else an Elixir) for herself when her MP runs low.
 * 9. **Cura** for a girl under {@link CURA_UNDER}; else **Pray**.
 *
 * **Rikku and Paine (Dark Knights)**: a Phoenix Down for Yuna when she is down (nobody else heals); an X-Potion (else a Hi-Potion) for herself under {@link DK_DRINK_UNDER} (Darkness costs her own
 * HP); else **Darkness**.
 *
 * Returns `null` (the generic ladder) when Angra Mainyu is not on the field.
 */

import type { AnyCombatant, AvailableCommand, BattleEngine, Command, CombatantId } from '../../battle/common/types.ts';
import { type Tactic, activeParty, has, hpFraction } from './common.ts';

/** The chapter's boss ids: the body first (the guide and the tactic register the same ids; `src/data/angra-mainyu-ids.ts`). The arms are parts of the body's board. */
export const ANGRA_MAINYU_BOSS_IDS: readonly CombatantId[] = ['x2-angra-mainyu'];

/** Heal one girl under this share (Curaga), two under {@link MEGA_UNDER} (a Mega-Potion) or {@link MEGALIXIR_UNDER} (a Megalixir), top up under {@link CURA_UNDER}; a Dark Knight drinks under {@link DK_DRINK_UNDER}. */
export const CURAGA_UNDER = 0.45;
export const MEGA_UNDER = 0.5;
export const MEGALIXIR_UNDER = 0.3;
export const CURA_UNDER = 0.7;
export const DK_DRINK_UNDER = 0.35;
/** Yuna drinks for MP under this much (Curaga is 20, Esuna 10, Protect 12). */
export const YUNA_MP_LOW = 40;
/** Yuna heals herself first under this share: she is the one who keeps the others standing, and her HP is the party's lowest. */
export const YUNA_SELF_UNDER = 0.55;
/** The two arms (`src/data/angra-mainyu-ids.ts`): while both stand, Perdition's Flame can come, so Protect goes up first. */
export const ANGRA_ARM_IDS: readonly CombatantId[] = ['x2-tawrich', 'x2-zarich'];
/** Bloody Breath's statuses, in the order Yuna clears them. */
export const CLEANSE_ORDER = ['confuse', 'poison', 'darkness', 'silence'] as const;

/** The offered row for `kind` + `id`, aimed at `targets`. */
function use(commands: AvailableCommand[], kind: string, id: string, targets: CombatantId[]): Command | null {
  const r = commands.find((c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id);
  return r ? ({ ...r.command, targets } as Command) : null;
}

function yunaTurn(commands: AvailableCommand[], self: AnyCombatant, party: AnyCombatant[], armsStand: boolean): Command | null {
  const down = party.filter((u) => !u.alive);
  if (down.length >= 2) {
    const all = use(commands, 'item', 'x2-mega-phoenix', []);
    if (all) return all;
  }
  if (down[0]) {
    const back = use(commands, 'item', 'x2-phoenix-down', [down[0].id]) ?? use(commands, 'ability', 'x2-white-mage-life', [down[0].id]);
    if (back) return back;
  }
  const living = party.filter((u) => u.alive);
  const lowest = [...living].sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  const under = (f: number): number => living.filter((u) => hpFraction(u) < f).length;
  if (under(MEGALIXIR_UNDER) >= 2) {
    const all = use(commands, 'item', 'x2-megalixir', []);
    if (all) return all;
  }
  if (under(MEGA_UNDER) >= 2) {
    const all = use(commands, 'item', 'x2-mega-potion', []);
    if (all) return all;
  }
  if (hpFraction(self) < YUNA_SELF_UNDER) {
    const own = use(commands, 'ability', 'x2-white-mage-curaga', [self.id]) ?? use(commands, 'item', 'x2-x-potion', [self.id]);
    if (own) return own;
  }
  if (armsStand && living.some((u) => !has(u, 'protect'))) {
    const protect = use(commands, 'ability', 'x2-white-mage-protect', []);
    if (protect) return protect;
  }
  for (const status of CLEANSE_ORDER) {
    const afflicted = living.find((u) => has(u, status));
    if (!afflicted) continue;
    const cure = use(commands, 'ability', 'x2-white-mage-esuna', [afflicted.id]) ?? use(commands, 'item', 'x2-remedy', [afflicted.id]);
    if (cure) return cure;
  }
  if (lowest && hpFraction(lowest) < CURAGA_UNDER) {
    const one = use(commands, 'ability', 'x2-white-mage-curaga', [lowest.id]) ?? use(commands, 'ability', 'x2-white-mage-cura', [lowest.id]);
    if (one) return one;
  }
  if (living.some((u) => !has(u, 'protect'))) {
    const protect = use(commands, 'ability', 'x2-white-mage-protect', []);
    if (protect) return protect;
  }
  if (self.mp < YUNA_MP_LOW) {
    const ether = use(commands, 'item', 'x2-turbo-ether', [self.id]) ?? use(commands, 'item', 'x2-elixir', [self.id]);
    if (ether) return ether;
  }
  if (lowest && hpFraction(lowest) < CURA_UNDER) {
    const cura = use(commands, 'ability', 'x2-white-mage-cura', [lowest.id]);
    if (cura) return cura;
  }
  return use(commands, 'ability', 'x2-white-mage-pray', []);
}

function darkKnightTurn(commands: AvailableCommand[], self: AnyCombatant, party: AnyCombatant[]): Command | null {
  const yuna = party.find((u) => u.id === 'yuna');
  if (yuna && !yuna.alive) {
    const back = use(commands, 'item', 'x2-phoenix-down', [yuna.id]);
    if (back) return back;
  }
  if (hpFraction(self) < DK_DRINK_UNDER) {
    const potion = use(commands, 'item', 'x2-x-potion', [self.id]) ?? use(commands, 'item', 'x2-hi-potion', [self.id]);
    if (potion) return potion;
  }
  return use(commands, 'ability', 'x2-dark-knight-darkness', []);
}

export const ffx2AngraMainyu: Tactic = (actorId, commands, engine: BattleEngine) => {
  const s = engine.state();
  const boss = ANGRA_MAINYU_BOSS_IDS.map((id) => s.combatants[id]).find((c) => c?.side === 'enemy' && c.alive);
  if (!boss) return null;
  const party = activeParty(engine);
  const self = party.find((c) => c.id === actorId);
  if (!self) return null;
  const armsStand = ANGRA_ARM_IDS.every((id) => {
    const arm = s.combatants[id];
    return arm !== undefined && arm.alive && arm.hp > 0;
  });
  if (actorId === 'yuna') return yunaTurn(commands, self, party, armsStand);
  return darkKnightTurn(commands, self, party);
};

export default ffx2AngraMainyu;
