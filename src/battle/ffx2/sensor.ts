/**
 * Sensor / Scan — the information action, for FFX-2.
 *
 * X-2 keeps an enemy's HP a secret until it is scanned: the boss strip prints a
 * `SCAN` hint where the numerals go (`src/ui/ffx2/BossGauges.ts`) and only
 * leaves that state when it sees a `'sensor'` {@link BattleEvent}. Nothing used
 * to emit one, so the strip could never leave `SCAN` in real play — Gun Mage's
 * Scan resolved as an ordinary zero-power action and fell out the bottom of
 * `resolveAbility` having done nothing at all.
 *
 * What the research says this action is:
 * - **Scan** (Gun Mage support ability, `init` AP) "reveals target HP, MP,
 *   elemental affinities, status resistances" [ffx2-combat-core §3.7].
 * - **Libra** (Floral Fallal main part, 4 AP) and **Ma'at's Feather** (Full
 *   Throttle sinistral wing, 10 AP) are listed as "Scan-equivalent" / "Libra /
 *   Scan equivalent", as is the Machina Maw right-crusher **Scan**
 *   [ffx2-combat-core §2.9.2].
 * - There is **no Sensor auto-ability and no Sensor accessory in FFX-2**.
 *   `sensor` is an FFX {@link AutoAbilityId} only; the nearest-looking X-2
 *   accessory, Beaded Brooch's "Sense Preserver" [§5.4], is a status-preserver
 *   and has nothing to do with revealing an enemy. The one-line `full: false`
 *   bar therefore has no X-2 source today — it is supported here so the shared
 *   event contract has one implementation, not because X-2 data uses it.
 *
 * Because `src/battle/ffx2/**` imports nothing from `src/data/ffx2/**`
 * (`docs/CONTRACT-CHANGES.md`), the engine has to recognise a scan action from
 * the {@link AbilityDef} shape alone. It does that in
 * {@link sensorKind}: an explicit `extra` marker first, then a name/id fallback
 * that covers the data as it stands.
 */

import type { AbilityDef, CombatantId, ElementId } from '../common/types.ts';
import { ELEMENT_IDS } from '../common/types.ts';
import type { Emit, Ffx2Unit } from './internal.ts';

/** Which panel a reveal opens: the full Scan read-out, or the one-line bar. */
export type SensorKind = 'scan' | 'sensor';

/**
 * The marker a data file should set to make an ability a reveal, ahead of any
 * name matching: `extra: { reveals: 'scan' }`, or the shorthands
 * `extra: { scan: true }` / `extra: { sensor: true }`.
 */
function markedKind(ability: AbilityDef): SensorKind | null {
  const extra = ability.extra;
  if (!extra) return null;
  const reveals = extra['reveals'];
  if (reveals === 'scan' || reveals === 'sensor') return reveals;
  if (extra['scan'] === true) return 'scan';
  if (extra['sensor'] === true) return 'sensor';
  return null;
}

/** `"Ma'at's Feather"` -> `"maats feather"`, `'x2-gun-mage-scan'` -> `'x2 gun mage scan'`. */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** The word-boundary match, so `x2-gun-mage-scan` hits and `scanner` does not. */
function hasWord(text: string, word: string): boolean {
  return text === word || text.startsWith(`${word} `) || text.endsWith(` ${word}`) || text.includes(` ${word} `);
}

/**
 * Whether `ability` is a Scan / Sensor reveal, and which panel it opens.
 *
 * Passives are excluded explicitly: Gun Mage's own **Scan Lv. 2** and
 * **Scan Lv. 3** are support upgrades ("rotate/zoom the model", "may target
 * your own party") [ffx2-combat-core §3.7], not actions, and in this project's
 * data a support upgrade is a `targeting: 'self'` entry carrying
 * `extra.passive`. Neither may reveal anything.
 */
export function sensorKind(ability: AbilityDef): SensorKind | null {
  const marked = markedKind(ability);
  if (marked) return marked;
  if (ability.extra?.['passive'] !== undefined) return null;
  if (ability.targeting === 'self') return null;

  const id = normalise(ability.id);
  const name = normalise(ability.name);
  // `maats feather` is matched whole: it is the only reveal whose name carries
  // neither word [ffx2-combat-core §2.9.2].
  for (const text of [name, id]) {
    if (hasWord(text, 'scan') || hasWord(text, 'libra')) return 'scan';
    if (hasWord(text, 'sensor')) return 'sensor';
    if (text.includes('maats feather')) return 'scan';
  }
  return null;
}

/** Elements the target takes extra damage from, in HUD display order. */
export function weaknessesOf(target: Ffx2Unit): ElementId[] {
  return ELEMENT_IDS.filter((e) => e !== 'none' && target.affinities[e] === 'weak');
}

/**
 * Whether this reveal is allowed to print numbers.
 *
 * `immune-to-sensor` is the contract's "Sensor returns `- - -`" flag and
 * `flags.hideHpBar` is "parts whose HP is a secret" [`battle/common/types.ts`].
 * Either one keeps the numerals hidden; the reveal itself still happens so the
 * panel can show the sensor line.
 */
function numeralsHidden(target: Ffx2Unit): boolean {
  return target.immunityFlags.includes('immune-to-sensor') || target.flags.hideHpBar === true;
}

/**
 * Reveal one target: emit the `'sensor'` event and latch
 * {@link Combatant.revealed} for the rest of the battle.
 *
 * `immune-to-scan` ("Scan fails") blocks a `full` reveal outright and reports
 * it as an `'immune'` miss, which is how every other blocked action in this
 * engine reads on the HUD. A one-line Sensor bar is not a Scan and is not
 * blocked by it.
 *
 * Returns true when the target came out revealed.
 */
export function revealTarget(
  emit: Emit,
  sourceId: CombatantId,
  target: Ffx2Unit,
  kind: SensorKind,
): boolean {
  const full = kind === 'scan';
  if (full && target.immunityFlags.includes('immune-to-scan')) {
    emit({ type: 'miss', targetId: target.id, sourceId, reason: 'immune' });
    return false;
  }

  const text = full
    ? (target.scanText ?? target.sensorText ?? '')
    : (target.sensorText ?? target.scanText ?? '');

  if (numeralsHidden(target)) {
    emit({ type: 'sensor', targetId: target.id, full, text });
    return false;
  }

  target.revealed = true;
  emit({
    type: 'sensor',
    targetId: target.id,
    full,
    text,
    hp: target.hp,
    maxHp: target.stats.maxHp,
    mp: target.mp,
    maxMp: target.stats.maxMp,
    weaknesses: weaknessesOf(target),
  });
  return true;
}

/**
 * Resolve a whole reveal action against an already-resolved target pool.
 *
 * A reveal is a pure information action: no accuracy roll, no crit roll, no
 * step-7 randomiser, so it consumes none of the seeded RNG's draws and cannot
 * shift any replay. (FFX models its own Scan the same way — `canMiss: false`,
 * `src/data/ffx/abilities/special-utility.ts`.)
 */
export function resolveSensor(
  emit: Emit,
  user: Ffx2Unit,
  pool: readonly Ffx2Unit[],
  kind: SensorKind,
): void {
  for (const target of pool) revealTarget(emit, user.id, target, kind);
}
