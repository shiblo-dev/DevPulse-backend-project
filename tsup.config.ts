// import { defineConfig } from "tsup";

// export default defineConfig({
//   outDir: "./dist",
//   clean: true,
//   dts: true,
//   format: ["esm", "cjs"],
//   outExtension: ({ format }) => ({
//     js: format === "cjs" ? ".cjs" : ".mjs",
//   }),
//   cjsInterop: true,
//   entry: {
//     index: "src/server.ts",
//   },
//   sourcemap: true,
//   skipNodeModulesBundle: true,
//   target: "esnext",
//   tsconfig: "./tsconfig.build.json",
//   keepNames: true,
//   bundle: true,
// });
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  outDir: "dist",
  format: ["cjs"],
  clean: true,
  sourcemap: true,
  skipNodeModulesBundle: true,
  target: "es2022",
  // ✅ extension .js রাখুন
  outExtension: () => ({ js: ".js" }),
});
