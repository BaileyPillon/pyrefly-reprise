import { FFXContentRegistry, createFFXEngine } from 'file:///D:/Final%20Fantasy/src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from 'file:///D:/Final%20Fantasy/src/data/ffx/index.ts';
import { yojimboCavernBuild } from 'file:///D:/Final%20Fantasy/src/data/ffx/builds/yojimbo-cavern.ts';
const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES); content.addItems(Object.values(ITEMS));
const counts: Record<string, number> = {};
const bump = (k: string) => { counts[k] = (counts[k] ?? 0) + 1; };
for (const line of ['wrong', 'magic']) for (let seed = 1; seed <= 40; seed++) {
  const engine: any = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: yojimboCavernBuild, enemies: ENEMY_GROUPS_BY_ID['yojimbo-cavern'], triggers: [], seed, condition: 'normal', canEscape: false });
  for (let i = 0; i < 6000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'player-input') {
      const cmds = d.commands;
      // try every enemy target option to see what is targetable
      for (const c of cmds) for (const t of c.validTargets ?? []) if (['ginnem','daigoro','yojimbo'].includes(t)) bump(`targetable:${t}`);
      const st0 = engine.state();
      if (line === 'magic' && st0.aeonId === d.actorId) { const od = cmds.find((c: any) => c.enabled && (c.command.kind === 'overdrive' || c.command.kind === 'ability')); if (od) { engine.submit({ ...od.command, targets: od.validTargets.length ? [od.validTargets[0]] : [] }); bump('aeon-act:' + od.command.id); continue; } }
      if (line === 'magic' && d.actorId === 'yuna') { const sm = cmds.find((c: any) => c.enabled && c.command.kind === 'summon'); if (sm && !st0.aeonId) { engine.submit({ ...sm.command, targets: [] }); continue; } }
      const multi = cmds.find((c: any) => c.enabled && c.command.kind === 'ability' && ['firaga','fira','thundara'].includes(c.command.id));
      const atk = cmds.find((c: any) => c.enabled && c.command.kind === 'attack');
      if (line === 'magic' && multi && multi.validTargets.includes('yojimbo')) engine.submit({ ...multi.command, targets: ['yojimbo'] });
      else if (atk && atk.validTargets.includes('yojimbo')) engine.submit({ kind: 'attack', targets: ['yojimbo'] });
      else engine.submit({ kind: 'defend', targets: [] });
    }
  }
  const st = engine.state();
  const enemyIds = ['yojimbo', 'daigoro', 'ginnem'];
  for (const e of st.log) {
    if (e.type === 'action-start' && enemyIds.includes(e.actorId)) bump(`action:${e.actorId}:${e.command?.kind ?? e.kind}:${e.abilityId ?? ''}`);
    if ((e.type === 'damage' || e.type === 'hp-change' || e.type === 'hit') && enemyIds.includes(e.targetId)) bump(`${e.type}:${e.targetId}`);
    if (e.type === 'ko' && enemyIds.includes(e.targetId ?? e.actorId)) bump(`ko:${e.targetId ?? e.actorId}`);
  }
  bump(`outcome:${st.result?.outcome}`);
}
console.log(JSON.stringify(counts, null, 1));
