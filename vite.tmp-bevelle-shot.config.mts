import { defineConfig } from 'vite';

// TEMPORARY - bevelle-underground scene agent, screenshots only. Deleted at end
// of session. HMR/watch off: other sessions save src/scenes/*.ts every few
// seconds and each reload aborted page.screenshot mid-capture.
export default defineConfig({
  base: '/',
  server: {
    port: 5185,
    strictPort: true,
    host: '127.0.0.1',
    hmr: false,
    watch: { ignored: ['**/*'] },
  },
});
