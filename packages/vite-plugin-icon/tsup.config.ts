import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/icon.ts", "src/astro-integration.ts"],
  format: ["cjs", "esm"],
  dts: {
    resolve: true,
  },
  splitting: false,
  clean: true,
  sourcemap: false,
  esbuildOptions(options) {
    options.define!.PACKAGE_NAME = JSON.stringify(process.env.npm_package_name);
  },
});
