// Scratch Vite server for the hero-plate composites: port 5880, HMR off, no watcher.
import { createServer } from 'file:///D:/Final%20Fantasy/node_modules/vite/dist/node/index.js';
const server = await createServer({ root: 'D:/Final Fantasy', configFile: 'D:/Final Fantasy/vite.config.ts',
  server: { port: 5880, strictPort: true, hmr: false, watch: null }, clearScreen: false });
await server.listen();
console.log('READY 5880 pid', process.pid);
