import { createServer } from 'file:///D:/pyrefly-ch-gippal-ship/node_modules/vite/dist/node/index.js';
const server = await createServer({
  root: 'D:/pyrefly-ch-gippal-ship', configFile: 'D:/pyrefly-ch-gippal-ship/vite.config.ts',
  server: { port: 5821, strictPort: true, hmr: false, watch: null }, clearScreen: false,
});
await server.listen();
console.log('READY 5821 pid', process.pid);
