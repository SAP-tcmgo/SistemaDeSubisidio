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
      allowedHosts: ["ccf92518-8ebc-4caa-9a0c-a6500ae49816.lovableproject.com"]
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
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
