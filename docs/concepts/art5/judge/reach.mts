import { bevelleBuild } from 'file:///D:/Final%20Fantasy/src/data/ffx2/builds/bevelle.ts';
import { farplaneBuild } from 'file:///D:/Final%20Fantasy/src/data/ffx2/builds/farplane.ts';
import { chateauBuild } from 'file:///D:/Final%20Fantasy/src/data/ffx2/builds/chateau.ts';
import { tremaBuildFor } from 'file:///D:/Final%20Fantasy/src/data/ffx2/builds/via-infinito-kit.ts';
import { TREMA_KIT_OPTION } from 'file:///D:/Final%20Fantasy/src/data/chapter-ffx2-trema.ts';
import { garmentGrid, adjacentNodes } from 'file:///D:/Final%20Fantasy/src/battle/ffx2/garment-grids.ts';
const builds: Record<string, any> = { IV: bevelleBuild, 'V/XI': farplaneBuild, VI: chateauBuild, XIII: tremaBuildFor(TREMA_KIT_OPTION) };
const one = new Map<string,string[]>(), any = new Map<string,string[]>();
const add = (m: Map<string,string[]>, k: string, v: string) => { const a = m.get(k) ?? []; if (!a.includes(v)) a.push(v); m.set(k, a); };
for (const [ch, b] of Object.entries(builds)) {
  for (const m of b.members) {
    const g = garmentGrid(m.garmentGrid.id); const n = g.nodes;
    const ordered = [m.currentDressphere, ...m.owned.filter((d: string) => d !== m.currentDressphere)];
    const nodes: (string|null)[] = new Array(n).fill(null);
    for (let i = 0; i < n && i < ordered.length; i++) nodes[i] = ordered[i];
    const at = m.garmentGrid.nodePosition;
    if (at >= 0 && at < n && nodes[at] !== m.currentDressphere) { const e = nodes.indexOf(m.currentDressphere); if (e >= 0) nodes[e] = nodes[at]; nodes[at] = m.currentDressphere; }
    const adj = adjacentNodes(g, at).map((x) => nodes[x.node]);
    // BFS
    const seen = new Set([at]); const q = [at];
    while (q.length) { const c = q.shift()!; for (const x of adjacentNodes(g, c)) if (!seen.has(x.node)) { seen.add(x.node); q.push(x.node); } }
    const all = [...seen].map((i) => nodes[i]).filter(Boolean) as string[];
    console.log(ch, m.id, m.garmentGrid.id, 'links', JSON.stringify(g.links.map((l: any) => [l.from, l.to])), 'start', m.currentDressphere, 'oneLink', JSON.stringify(adj), 'reach', JSON.stringify(all));
    for (const d of adj) if (d) add(one, `${m.id}-${d}`, ch);
    for (const d of all) add(any, `${m.id}-${d}`, ch);
  }
}
console.log('ONE', JSON.stringify(Object.fromEntries(one)));
console.log('ANY', JSON.stringify(Object.fromEntries(any)));
