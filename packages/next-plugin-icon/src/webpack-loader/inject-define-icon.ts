// define-icon.tsxの `SCRIPT` にカスタムエレメントを定義するスクリプトを注入する

import fs from "fs";
import path from "path";
import { minify } from "terser";

interface WebpackLoader {
  async(): (err: Error | null, source?: string) => void;
}

const scriptPromise = minify(
  fs.readFileSync(path.resolve(__dirname, "../icon.js"), "utf-8")
);

export default function webpackLoader(this: WebpackLoader, source: string) {
  if (!source.includes(`"DEFINE_ICON_SCRIPT"`)) {
    return source;
  }

  const cb = this.async();
  (async () => {
    try {
      const script = await scriptPromise;
      source = source.replace(
        `"DEFINE_ICON_SCRIPT"`,
        JSON.stringify(`(()=>{${script.code!}})();`)
      );
      cb(null, source);
    } catch (err) {
      cb(err as Error);
    }
  })();
}
