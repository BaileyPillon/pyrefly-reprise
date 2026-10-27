// What else the machine was doing while a measuring tool ran (motion-fluidity pass, lane L5; both games, tooling). PORTED from the pacing lane's pace.mjs.
//
// A pacing number is the game's AND the machine's: a run that shares the GPU with a render, a second browser or a model server reads late frames the game does not make. So a pacing run samples, from outside
// the browser: the GPU's utilisation, clocks and power (nvidia-smi every 2 s), the CPU's busy share (every 2 s), and, before the browser opens and after it closes, the five processes using the 3D engine most
// (typeperf, named by pid): "the other programs". `analyze` reads them back as an average over the run. Nothing here changes the machine.
import { spawn, spawnSync } from 'node:child_process';
import os from 'node:os';

/** Start the samplers; `stop()` returns what they saw. */
export function startMachineSamplers() {
  const smi = { lines: [], proc: null };
  try {
    smi.proc = spawn('nvidia-smi', ['--query-gpu=utilization.gpu,utilization.memory,memory.used,clocks.gr,power.draw,temperature.gpu,pstate', '--format=csv,noheader,nounits', '-l', '2'], { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
    let buf = '';
    smi.proc.stdout.on('data', (d) => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (line) smi.lines.push({ at: Date.now(), v: line.split(',').map((x) => x.trim()) }); } });
    smi.proc.on('error', () => { smi.proc = null; });
  } catch { smi.proc = null; }
  const cpuNow = () => os.cpus().reduce((a, c) => { a.idle += c.times.idle; a.total += c.times.user + c.times.nice + c.times.sys + c.times.idle + c.times.irq; return a; }, { idle: 0, total: 0 });
  const cpu = [];
  let prev = cpuNow();
  const timer = setInterval(() => { const c = cpuNow(); const dt = c.total - prev.total; cpu.push({ at: Date.now(), busy: dt ? Math.round(1000 * (1 - (c.idle - prev.idle) / dt)) / 10 : 0 }); prev = c; }, 2000);
  return { stop() { clearInterval(timer); try { smi.proc?.kill(); } catch { /* gone */ } return { smi: smi.lines, cpu }; } };
}

/** Per-process 3D-engine utilisation for about 3 s (typeperf), the top few, named. Run before the browser opens and after it closes. */
export function gpuByProcess() {
  const r = spawnSync('typeperf', ['\\GPU Engine(*engtype_3D)\\Utilization Percentage', '-sc', '3'], { encoding: 'utf8', timeout: 20000, windowsHide: true });
  const lines = String(r.stdout || '').split(/\r?\n/).filter((l) => l.startsWith('"'));
  if (lines.length < 3) return { note: 'typeperf gave nothing' };
  const header = lines[0].split('","').map((s) => s.replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((l) => l.split('","').map((s) => Number(s.replace(/^"|"$/g, ''))));
  const sums = new Map();
  for (let c = 1; c < header.length; c++) {
    const m = /pid_(\d+)_/.exec(header[c]);
    if (!m) continue;
    const avg = rows.reduce((a, row) => a + (Number.isFinite(row[c]) ? row[c] : 0), 0) / rows.length;
    sums.set(m[1], (sums.get(m[1]) ?? 0) + avg);
  }
  const top = [...sums.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).filter(([, v]) => v > 0.05).map(([pid, v]) => {
    const t = spawnSync('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], { encoding: 'utf8', windowsHide: true });
    return { pid: Number(pid), name: (String(t.stdout || '').split(',')[0] || '').replace(/"/g, '').trim() || '?', pct3d: Math.round(v * 10) / 10 };
  });
  return { total3d: Math.round([...sums.values()].reduce((a, b) => a + b, 0) * 10) / 10, top };
}

/** The samplers' averages over `[from, to]` (epoch ms): GPU utilisation, memory, clock, power, temperature; CPU busy. Pure. */
export function summariseMachine({ smi, cpu }, from, to) {
  const avg = (a) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10 : null);
  const g = smi.filter((l) => l.at >= from && l.at <= to).map((l) => l.v.map(Number));
  const col = (k) => g.map((l) => l[k]).filter(Number.isFinite);
  const c = cpu.filter((x) => x.at >= from && x.at <= to).map((x) => x.busy);
  return {
    gpu: g.length ? { samples: g.length, utilAvg: avg(col(0)), utilMax: Math.max(...col(0)), memUsedMBAvg: avg(col(2)), grClockAvg: avg(col(3)), powerAvgW: avg(col(4)), tempMax: Math.max(...col(5)) } : null,
    cpuBusy: c.length ? { avg: avg(c), max: Math.max(...c) } : null,
  };
}
