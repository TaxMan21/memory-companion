import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Remove crossorigin attribute from script/link tags to avoid
// CORS requirement on same-origin static assets
function removeCrossoriginPlugin() {
  return {
    name: 'remove-crossorigin',
    transformIndexHtml(html) {
      return html.replace(/\s+crossorigin(=["']?(anonymous|use-credentials)["']?)?/gi, '');
    }
  };
}

export default defineConfig({
  plugins: [react(), removeCrossoriginPlugin()],
  base: '/',
  build: {
    outDir: '../backend/public',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});
