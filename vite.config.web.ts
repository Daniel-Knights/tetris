import react from "@vitejs/plugin-react";
import fs from "node:fs";
import { defineConfig, Plugin } from "vite";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [react(), pwaPlugin],
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

const pwaPlugin = {
  name: "pwa",
  async writeBundle(_, bundle) {
    // TODO: read files from dist-web and use excludes array
    const sw = await fs.promises.readFile("./public/sw.js", "utf-8");

    const injectFilenames = Object.keys(bundle)
      .filter((f) => f !== "index.html")
      .map((f) => `"/${f}"`)
      .join(",\n");

    await fs.promises.writeFile(
      "./dist-web/sw.js",
      sw.replace("/* <INJECTED> */", injectFilenames)
    );
  },
} satisfies Plugin;
