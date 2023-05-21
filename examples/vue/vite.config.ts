import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import icon from "@achamaro/vite-plugin-icon";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    icon(),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === "i-con",
        },
      },
    }),
  ],
});
