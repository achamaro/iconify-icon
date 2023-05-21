import { defineConfig } from "astro/config";
import vue from "@astrojs/vue";
import react from "@astrojs/react";
import icon from "@achamaro/vite-plugin-icon/astro-integration";

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [
    vue({
      template: {
        compilerOptions: {
          // treat any tag that starts with ion- as custom elements
          isCustomElement: (tag) => tag.startsWith("i-con"),
        },
      },
    }),
    react(),
    icon(),
  ],
  adapter: node({
    mode: "standalone",
  }),
});
