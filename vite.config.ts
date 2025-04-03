import { defineConfig, UserConfigExport, ServerOptions, ConfigEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv) => {
  const config: UserConfigExport = {
    base: './',
    server: {
      port: 8080,
      allowedHosts: ["ccf92518-8ebc-4caa-9a0c-a6500ae49816.lovableproject.com"],
      // Add proxy configuration here
      proxy: {
        // Proxy requests from /api/colare to the target API
        '/api/colare': {
          target: 'http://ws.tcm.go.gov.br/api/rest/colareService', // Target API base URL
          changeOrigin: true, // Needed for virtual hosted sites
          rewrite: (path) => path.replace(/^\/api\/colare/, ''), // Remove the /api/colare prefix before forwarding
        },
        // Add proxy for passaporteService
        '/api/passaporte': {
          target: 'http://ws.tcm.go.gov.br/api/rest/passaporteService', // Target API base URL
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/passaporte/, ''), // Remove the /api/passaporte prefix
        },
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks(id) {
            // Split large dependencies into separate chunks
            // if (id.includes('node_modules/react/')) {
            //   return 'vendor-react';
            // }
            // if (id.includes('node_modules/react-dom/')) {
            //   return 'vendor-react-dom';
            // }
            if (id.includes('node_modules/@firebase/')) {
              return 'vendor-firebase';
            }
            if (id.includes('node_modules/@tanstack/react-query/')) {
              return 'vendor-react-query';
            }
            if (id.includes('node_modules/lucide-react/')) {
              return 'vendor-lucide';
            }
            // Group other node_modules into a general vendor chunk
            if (id.includes('node_modules')) {
              return 'vendor-others';
            }
          },
        },
      },
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
  return config;
});
