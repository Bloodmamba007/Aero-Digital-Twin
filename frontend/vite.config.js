import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Backend port defaults to 8000 (as documented in the README and start scripts).
// Override with VITE_API_PORT in a local .env.local when 8000 is already in use.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiPort = env.VITE_API_PORT || '8000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${apiPort}`,
          changeOrigin: true
        }
      }
    }
  };
});
