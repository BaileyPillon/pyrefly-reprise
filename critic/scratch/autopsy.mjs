/** Autopsy of the captured Yunalesca logs. Read-only. */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const seeds = (process.argv[2] ?? '1,2,3,4').split(',');

for (const seed of seeds) {
  let d;
  try {
    d = JSON.parse(readFileSync(resolve(HERE, `yunalesca-seed${seed}.json`), 'utf8'));
  } catch {
    console.log(`\n### SEED ${seed}: no capture`);
    continue;
  }
  const L = d.log;
  console.log(`\n======================== SEED ${seed} ========================`);
  console.log(`outcome: ${JSON.stringify(d.outcome)}  elapsedMs=${d.elapsedMs} events=${L.length} consoleErrors=${d.consoleErrors.length}`);
  const bs = d.snapshot?.screenState?.battle;
  if (bs) {
    console.log(`final: turn=${bs.turn} ticks=${bs.ticks} result=${JSON.stringify(bs.result)} links=${d.snapshot.screenState.links}`);
    for (const c of bs.combatants ?? []) {
      console.log(`  ${c.id.padEnd(12)} hp=${c.hp}/${c.maxHp} alive=${c.alive} statuses=${JSON.stringify(c.statuses ?? [])} form=${c.formIndex ?? '-'}`);
    }
  }

  // form changes
  const forms = L.filter((e) => e.type === 'form-change');
  console.log(`form-changes: ${forms.length ? forms.map((e) => `seq${e.seq}->form${e.formIndex} (${e.name})`).join(', ') : 'NONE (never left form I)'}`);
  const lastTurn = [...L].reverse().find((e) => e.type === 'turn-start');
  console.log(`turns: ${lastTurn ? lastTurn.turn : 0}`);

  // status tracking
  const zombie = new Set();
  const zombieHistory = [];
  // action context
  let curAction = null;
  const koList = [];
  const megaDeath = [];
  const items = [];
  const healOnZombie = [];
  const missBySource = {};
  const hpTrace = {};

  for (const e of L) {
    if (e.type === 'action-start') {
      curAction = e;
      if (e.command?.kind === 'item') items.push(e);
      if (e.abilityId === 'mega-death') megaDeath.push({ start: e, results: [] });
    }
    if (megaDeath.length && curAction?.abilityId === 'mega-death' && e.type !== 'action-start') {
      const last = megaDeath[megaDeath.length - 1];
      if (curAction.seq === last.start.seq && e.seq > last.start.seq && e.type !== 'action-end') last.results.push(e);
    }
    if (e.type === 'status-add') {
      if (e.status === 'zombie') {
        zombie.add(e.targetId);
        zombieHistory.push(`seq${e.seq} +zombie ${e.targetId} (from ${e.instance?.sourceAbilityId ?? '?'})`);
      }
    }
    if (e.type === 'status-remove' && e.status === 'zombie') {
      zombie.delete(e.targetId);
      zombieHistory.push(`seq${e.seq} -zombie ${e.targetId} (${e.reason})`);
    }
    if (e.type === 'ko') {
      // find the cause: nearest preceding damage/status-add on the victim, plus the action
      const prior = L.slice(Math.max(0, e.seq - 12), e.seq).reverse();
      const dmg = prior.find((p) => (p.type === 'damage' || p.type === 'status-add') && p.targetId === e.targetId);
      koList.push({
        seq: e.seq,
        victim: e.targetId,
        sourceId: e.sourceId,
        action: curAction ? `${curAction.actorId}:${curAction.abilityId ?? curAction.command?.kind}(seq${curAction.seq})` : '?',
        cause: dmg ? `${dmg.type} seq${dmg.seq} ${dmg.type === 'damage' ? `amount=${dmg.amount}` : dmg.status}` : 'none found',
        wasZombie: zombie.has(e.targetId),
      });
    }
    if (e.type === 'heal' || (e.type === 'damage' && e.amount < 0)) {
      const t = e.targetId;
      if (zombie.has(t)) healOnZombie.push(`seq${e.seq} ${e.type} on ZOMBIE ${t} amount=${e.amount} cause=${e.cause ?? curAction?.abilityId ?? '?'}`);
    }
    if (e.type === 'damage' && zombie.has(e.targetId) && curAction && ['curaga', 'cura', 'regen', 'cure'].includes(curAction.abilityId)) {
      healOnZombie.push(`seq${e.seq} ${curAction.abilityId} did ${e.amount} DAMAGE to ZOMBIE ${e.targetId}`);
    }
    if (e.type === 'damage' && zombie.has(e.targetId) && !e.sourceId) {
      healOnZombie.push(`seq${e.seq} sourceless damage ${e.amount} on ZOMBIE ${e.targetId} (regen-as-damage)`);
    }
    if (e.type === 'miss') {
      const k = `${curAction?.abilityId ?? '?'}/${e.reason}`;
      missBySource[k] = (missBySource[k] ?? 0) + 1;
    }
    // party HP trace
    if (e.type === 'damage') {
      hpTrace[e.targetId] = (hpTrace[e.targetId] ?? 0) + e.amount;
    }
  }

  console.log(`\n-- KO events (${koList.length}) --`);
  if (!koList.length) console.log('  NONE — nobody on either side ever reached 0 HP.');
  for (const k of koList) console.log(`  seq${k.seq} KO ${k.victim} by=${k.sourceId ?? '-'} action=${k.action} cause=${k.cause} victimWasZombie=${k.wasZombie}`);

  console.log(`\n-- zombie timeline (${zombieHistory.length}) --`);
  for (const z of zombieHistory.slice(0, 40)) console.log('  ' + z);
  if (zombieHistory.length > 40) console.log(`  ... +${zombieHistory.length - 40} more`);

  console.log(`\n-- mega-death casts (${megaDeath.length}) --`);
  for (const m of megaDeath) {
    console.log(`  seq${m.start.seq} targets=${JSON.stringify(m.start.targets)}`);
    for (const r of m.results) console.log(`     seq${r.seq} ${r.type} ${r.targetId ?? ''} ${r.status ?? ''} ${r.reason ?? ''} ${r.amount ?? ''}`);
  }

  console.log(`\n-- items used (${items.length}) --`);
  for (const i of items) console.log(`  seq${i.seq} ${i.actorId} -> ${JSON.stringify(i.command)} (turn near)`);

  console.log(`\n-- misses by ability --`);
  console.log('  ' + (Object.keys(missBySource).length ? JSON.stringify(missBySource) : 'none'));

  console.log(`\n-- healing-on-zombie events (${healOnZombie.length}) --`);
  for (const h of healOnZombie.slice(0, 30)) console.log('  ' + h);
  if (healOnZombie.length > 30) console.log(`  ... +${healOnZombie.length - 30} more`);

  console.log(`\n-- cumulative signed damage taken (positive = net damage) --`);
  console.log('  ' + JSON.stringify(hpTrace));

  // Yunalesca HP model
  const ySum = L.filter((e) => e.type === 'damage' && e.targetId === 'yunalesca').reduce((a, b) => a + b.amount, 0);
  const yHeal = L.filter((e) => e.type === 'heal' && e.targetId === 'yunalesca').reduce((a, b) => a + b.amount, 0);
  console.log(`  yunalesca: damage dealt to her = ${ySum}, drained back = ${yHeal}, net = ${ySum - yHeal}`);

  // ability usage histogram
  const hist = {};
  for (const e of L) if (e.type === 'action-start') {
    const k = `${e.actorId}:${e.abilityId ?? e.command?.kind}`;
    hist[k] = (hist[k] ?? 0) + 1;
  }
  console.log(`\n-- action histogram --`);
  console.log('  ' + JSON.stringify(hist, null, 1).replace(/\n/g, '\n  '));
}
