/**
 * Pyrefly Studio (site B): turns one `TurnTrace` plus the `rules.ts`
 * inventory into the `Specimen` the shared explorer stage renders
 * (`docs/plans/learning-sites.md` "B · studio/"). The eight systems are the
 * eight components in `STUDIO_COMPONENTS` order; the pieces are the eight
 * step cards (one per system) plus one inventory tile per rule.
 *
 * Copy and layout here match the target frames in
 * docs/concepts/atlas/b-battle-studio/ (awaiting Bailey's verdict) —
 * `b1-assembled.png`, `b3-inventory.png` — verbatim where they show fixed
 * text — the eyebrow "Pyrefly Studio · Battle system", the title shape and
 * the facts line — so this is porting an already-picked target, not
 * choosing a new one (AGENTS.md hard rule 9).
 */

import {
  type Piece,
  type PieceCard,
  type PieceFact,
  type Specimen,
  type System,
  type SystemInput,
  defineSpecimen,
  definePiece,
  withCounts,
} from '../shared/model.ts';
import { stepBurst, stepHome, tileBurst, tileHome } from './arrange.ts';
import { STUDIO_COMPONENTS, type StudioComponent, type StudioComponentId, type StudioRule, type StudioRuleSize } from './rules.ts';
import type { TurnOrderEntry, TurnStep, TurnTrace } from './trace.ts';
import { statusWord } from '../../src/battle/ffx/intent.ts';

/**
 * Yevon gold, FFX's one Ink & Gold accent
 * (`docs/handoff/presentation-ink-and-gold.md`, quoted in
 * `docs/concepts/atlas/REFERENCE.md`). The target frames in
 * docs/concepts/atlas/b-battle-studio/ (awaiting Bailey's verdict) give every
 * system the same accent and tell them apart by icon glyph, not by hue
 * (`docs/concepts/atlas/b-battle-studio/b.css` `.gl` rules), so every system
 * below shares this one colour rather than each inventing its own.
 */
const FFX_ACCENT = '#E3B94A';

const CARD_SIZE = 4;
const TILE_SIZE_BY_TIER: Record<StudioRuleSize, number> = { L: 1.8, M: 1.3, S: 1 };

function formatOrder(entries: readonly TurnOrderEntry[]): string {
  return entries.map((e) => `${e.name}@${e.tick}`).join('  ');
}

/** One sourced sentence per system for the "How it works" tab, independent of any one turn's numbers. */
const HOW_IT_WORKS: Record<StudioComponentId, string> = {
  turn: 'The lowest CTB counter acts next; Agility sets how many ticks a rank-3 action costs, and the forecast assumes every other actor takes a rank-3 turn (ffx-combat-core §1.1, §1.2, §1.6).',
  command: "Recovery time is the actor's base ticks times the command's rank, from rank 1 (fastest) to rank 10 (slowest) (ffx-combat-core §1.3).",
  hit: "Hit chance reads 40% of Accuracy minus Evasion; critical chance reads the attacker's Luck minus the target's Luck plus the weapon's bonus (ffx-combat-core §2.11, §2.12).",
  damage: 'power × mitigation ÷ 730, then the elemental and status modifiers apply in a fixed 16-step order (ffx-combat-core §2.1 to §2.4).',
  element: 'Weak is ×1.5, resist ×0.5, immune ×0 and absorb ×-1; the single strongest affinity applies, except that two weaknesses multiply together (ffx-combat-core §3).',
  status: 'A status lands when chance minus resistance beats a 0–100 roll; 254 always lands unless immune, and 255 ignores resistance entirely (ffx-combat-core §4.1).',
  overdrive: 'Every mode fills the gauge a different way — Warrior on damage dealt, Comrade on damage an ally takes, Healer on HP restored — and a well-timed input adds up to 50% more (ffx-combat-core §5.1, §5.2).',
  boss: "The AI script is dry-run on a private clone, so reading ahead never changes what actually happens; a scripted rotation reads with full confidence, a weighted one reports the odds it just measured (ffx-seymour-flux §3, §4).",
};

function fact(label: string, value: string): PieceFact {
  return { label, value };
}

/** Builds the one `PieceCard` for a system's step, from that step's own real numbers. */
function cardFor(component: StudioComponent, step: TurnStep, trace: TurnTrace): PieceCard {
  let body: string;
  let facts: PieceFact[];

  switch (step.component) {
    case 'turn': {
      const before = formatOrder(step.before);
      const after = formatOrder(step.after);
      body = `Before ${trace.actorName} acts the queue reads ${before}. After the ${trace.commandLabel} it reads ${after}.`;
      facts = [fact('Before', before), fact('After', after)];
      break;
    }
    case 'command': {
      body = `${trace.actorName} picks ${step.label} (${step.category}), rank ${step.rank}, ${step.mpCost} MP.`;
      facts = [fact('Command', step.label), fact('Rank', String(step.rank)), fact('MP cost', String(step.mpCost))];
      break;
    }
    case 'hit': {
      const hitText = step.hitPercent === null ? 'Never misses' : `${step.hitPercent}%`;
      body = `${hitText} to hit, ${step.critPercent}% to critical. This roll landed ${step.crit ? 'a critical hit' : 'a normal hit'}.`;
      facts = [
        fact('Hit chance', hitText),
        fact('Critical chance', `${step.critPercent}%`),
        fact('This roll', step.crit ? 'Critical hit' : 'Normal hit'),
      ];
      break;
    }
    case 'damage': {
      body = `${trace.commandLabel} dealt ${step.amount} (estimated ${step.min}–${step.max}). ${trace.targetName}'s HP went from ${step.targetHpBefore} to ${step.targetHpAfter}.`;
      facts = [
        fact('Damage dealt', String(step.amount)),
        fact('Estimated range', `${step.min}–${step.max}`),
        fact(`${trace.targetName} HP`, `${step.targetHpBefore} → ${step.targetHpAfter}`),
      ];
      break;
    }
    case 'element': {
      const elementsText = step.elements.length > 0 ? step.elements.join(', ') : 'Non-elemental';
      body = `${trace.commandLabel} is ${elementsText}; ${trace.targetName}'s affinity to it is ${step.affinity}.`;
      facts = [fact('Elements', elementsText), fact('Affinity', step.affinity)];
      break;
    }
    case 'status': {
      if (step.applications.length === 0) {
        body = `${trace.commandLabel} carries no status effects.`;
        facts = [fact('Statuses attempted', 'None')];
      } else {
        body = step.applications
          .map((a) => `${statusWord(a.status)} ${a.percent}%${a.blocked ? ' (blocked)' : ''}`)
          .join(', ');
        facts = step.applications.map((a) =>
          fact(statusWord(a.status), `${a.percent}%${a.blocked ? ' (blocked)' : ''}`),
        );
      }
      break;
    }
    case 'overdrive': {
      body = `${trace.actorName}'s Overdrive gauge went from ${step.before} to ${step.after}, in ${step.mode} mode.`;
      facts = [fact(`${trace.actorName} gauge`, `${step.before} → ${step.after}`), fact('Mode', step.mode)];
      break;
    }
    case 'boss': {
      body = step.description;
      facts = [
        fact('Move', step.moveName),
        fact('Turns away', String(step.turnsAway)),
        fact('Confidence', step.confidence),
      ];
      break;
    }
  }

  return {
    eyebrow: component.name,
    body,
    claimKind: "Engine reading · this turn's real numbers",
    facts,
    cite: step.cite,
    tabs: [
      { id: 'overview', label: 'Overview', body },
      { id: 'how-it-works', label: 'How it works', body: HOW_IT_WORKS[component.id] },
    ],
  };
}

function tileCard(rule: StudioRule, componentName: string): PieceCard {
  return {
    eyebrow: componentName,
    body: rule.line,
    claimKind: 'Sourced rule · research doc citation below',
    facts: [fact('Component', componentName)],
    cite: rule.cite,
    tabs: [{ id: 'overview', label: 'Overview', body: rule.line }],
  };
}

/**
 * Builds the site B specimen for one real turn: eight system cards plus one
 * inventory tile per `rules`. Throws if `trace` is missing a step
 * `STUDIO_COMPONENTS` expects — `runExampleTurn` always returns all eight, so
 * that only fires if the two modules drift apart.
 */
export function buildTurnSpecimen(trace: TurnTrace, rules: readonly StudioRule[]): Specimen {
  const stepByComponent = new Map(trace.steps.map((s) => [s.component, s] as const));

  const systemsInput: SystemInput[] = STUDIO_COMPONENTS.map((c) => ({ id: c.id, name: c.name, colour: FFX_ACCENT }));

  const cardPieces: Piece[] = STUDIO_COMPONENTS.map((component) => {
    const step = stepByComponent.get(component.id);
    if (!step) throw new Error(`buildTurnSpecimen: trace is missing the "${component.id}" step`);
    return definePiece({
      id: `card-${component.id}`,
      systemId: component.id,
      name: component.name,
      kind: 'card',
      size: CARD_SIZE,
      home: stepHome(component.id),
      burst: stepBurst(component.id),
      card: cardFor(component, step, trace),
    });
  });

  const rulesByComponent = new Map<StudioComponentId, StudioRule[]>();
  for (const rule of rules) {
    const list = rulesByComponent.get(rule.component);
    if (list) list.push(rule);
    else rulesByComponent.set(rule.component, [rule]);
  }

  const tilePieces: Piece[] = STUDIO_COMPONENTS.flatMap((component) => {
    const ruleList = rulesByComponent.get(component.id) ?? [];
    return ruleList.map((rule, index) =>
      definePiece({
        id: `tile-${rule.id}`,
        systemId: component.id,
        name: rule.name,
        kind: 'tile',
        size: TILE_SIZE_BY_TIER[rule.size],
        home: tileHome(component.id),
        burst: tileBurst(component.id, index, ruleList.length),
        card: tileCard(rule, component.name),
      }),
    );
  });

  const pieces: Piece[] = [...cardPieces, ...tilePieces];
  const systems: System[] = withCounts(systemsInput, pieces);

  return defineSpecimen({
    id: 'ffx-ch1-seymour-flux-turn',
    title: `${trace.actorName} uses ${trace.commandLabel} on ${trace.targetName}`,
    eyebrow: 'Pyrefly Studio · Battle system',
    factsLine: `${trace.actorName} · ${trace.commandLabel} · ${trace.targetName} — ${rules.length} sourced rules · live engine`,
    game: trace.game,
    systems,
    pieces,
  });
}
