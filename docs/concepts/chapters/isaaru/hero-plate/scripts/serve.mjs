// Scratch Vite server for the hero-plate captures (shared with omnis/hero-plate): port 5840, HMR off, no watcher.
// Stop it by its port (AGENTS.md "Stop the servers you start").
import { createServer } from 'file:///D:/Final%20Fantasy/node_modules/vite/dist/node/index.js';
const server = await createServer({ root: 'D:/Final Fantasy', configFile: 'D:/Final Fantasy/vite.config.ts',
  server: { port: 5840, strictPort: true, hmr: false, watch: null }, clearScreen: false });
await server.listen();
console.log('READY 5840 pid', process.pid);
