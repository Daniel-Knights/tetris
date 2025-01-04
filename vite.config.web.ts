import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
  base: "/tetris",
  publicDir: "./public",
  server: {
    port: 3000,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    outDir: "./dist-web",
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
  },
  esbuild: {
    define: {
      "process.env.APP_ENV": "'web'",
    },
  },
}));
