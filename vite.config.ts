
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/pt-br
// Consulte https://vitejs.dev/config/ para obter mais informações
// Arquivo de configuração do Vite
export default defineConfig(({ mode }) => ({
  base: './',
  server: {
    port: 8080
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
}));
