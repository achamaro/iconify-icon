// Iconコンポーネントを生成する

import fs from "fs";
import path from "path";

interface WebpackLoader {
  async(): (err: Error | null, source?: string) => void;
}

const script = fs.readFileSync(
  path.resolve(__dirname, "../components/icon.js"),
  "utf-8"
);

export default function webpackLoader(this: WebpackLoader) {
  return script;
}
