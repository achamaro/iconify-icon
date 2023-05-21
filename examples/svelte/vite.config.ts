import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import icon from "@achamaro/vite-plugin-icon";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [icon(), svelte()],
});
