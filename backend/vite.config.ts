import { defineConfig } from "vite";
import { resolve } from "path";
import { builtinModules } from "module";
import { viteStaticCopy } from "vite-plugin-static-copy";
import dts from "vite-plugin-dts";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  // Tell Vite this is a server-side (Node.js) build so it never shims Node builtins.
  ssr: {
    target: "node",
    noExternal: [],
  },
  define: {
    // Bake NODE_ENV at build time — avoids the "not supported in .env" Vite warning.
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: "package.json", dest: "./" },
        { src: ".env", dest: "./" },
        { src: "ecosystem.config.cjs", dest: "./" },
      ],
    }),
    dts({
      entryRoot: "src",
      include: ["src"],
      bundleTypes: true,
      compilerOptions: {
        declarationMap: false,
      },
    }),
  ],
  build: {
    target: "node24",
    emptyOutDir: true,
    outDir: "dist",
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      // Externalize every Node built-in module (bare + node: prefix) plus the
      // installed packages that contain native addons or should stay external.
      external: [
        // All Node built-in modules
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
        // Runtime dependencies
        ...Object.keys(pkg.dependencies),
        ...Object.keys(pkg.devDependencies),
        /^@ganji\//,
      ],
    },
    sourcemap: false,
    minify: "esbuild",
  },
});
