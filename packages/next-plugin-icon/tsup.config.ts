import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/icon.ts",
    "src/components/define-icon.tsx",
    "src/components/icon.tsx",
    "src/webpack.ts",
    "src/webpack-loader/inject-define-icon.ts",
    "src/webpack-loader/import-icon.ts",
  ],
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
