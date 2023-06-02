// define-icon.tsxの `SCRIPT` にカスタムエレメントを定義するスクリプトを注入する

import { fetchIcon } from "core/fetch";
import fs from "fs";
import path from "path";

interface LoaderOptions {
  downloadDir: string;
  customElementTagName: string;
  iconName: string;
}

interface WebpackLoader {
  getOptions(): LoaderOptions;
  async(): (err: Error | null, source?: string) => void;
}

const script = fs.readFileSync(
  path.resolve(__dirname, "../components/icon.js"),
  "utf-8"
);

export default function webpackLoader(this: WebpackLoader) {
  const { downloadDir, customElementTagName, iconName } = this.getOptions();

  const cb = this.async();
  (async () => {
    try {
      const iconJson = JSON.stringify(await fetchIcon(iconName, downloadDir));

      const source = script.replace(
        `"ADD_ICON_SCRIPT"`,
        JSON.stringify(
          `customElements.get("${customElementTagName}").addIcon("${iconName}", ${iconJson});`
        )
      );
      cb(null, source);
    } catch (err) {
      cb(err as Error);
    }
  })();
}
