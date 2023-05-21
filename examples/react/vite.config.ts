import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import icon from "@achamaro/vite-plugin-icon";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [icon(), react()],
});
