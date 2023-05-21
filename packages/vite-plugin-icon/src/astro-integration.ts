import type { AstroIntegration } from "astro";

import icon from ".";

export default function IconIntegration(): AstroIntegration {
  return {
    name: "@achamaro/vite-plugin-icon/astro-integration",
    hooks: {
      "astro:config:setup": ({ config, updateConfig }) => {
        // ルートファイル判定関数を定義
        const pagesDir = new URL("./pages", config.srcDir).pathname;
        function isPage(id: string) {
          if (!id.startsWith(pagesDir)) {
            return false;
          }

          const parts = id.slice(pagesDir.length + 1).split("/");
          return parts.every((v) => !v.startsWith("_"));
        }

        updateConfig({
          vite: {
            plugins: [
              icon({
                // pageのみdefineを差し込むので各アイコンファイルでのdefineを無効化する
                define: false,
                astro: { isPage },
              }),
            ],
          },
        });
      },
    },
  };
}
