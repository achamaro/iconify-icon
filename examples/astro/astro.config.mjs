import { defineConfig } from "astro/config";
import icon from "@achamaro/vite-plugin-icon/astro-integration";
import react from "@astrojs/react";

import vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
  integrations: [
    icon(),
    react(),
    vue({
      template: {
        compilerOptions: {
          // treat any tag that starts with ion- as custom elements
          isCustomElement: (tag) => tag.startsWith("i-con"),
        },
      },
    }),
  ],
});
