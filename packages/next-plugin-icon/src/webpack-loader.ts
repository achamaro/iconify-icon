import { generateTransform } from "core/transform";

import { virtualIconImporter } from "./util";

interface LoaderOptions {
  tagName: string;
  customElementTagName: string;
  iconAttribute: string;
  base: string;
}

interface WebpackLoader {
  getOptions(): LoaderOptions;
  async(): (err: Error | null, source?: string) => void;
}

export default function webpackLoader(this: WebpackLoader, source: string) {
  const { tagName, customElementTagName, iconAttribute, base } =
    this.getOptions();

  const transform = generateTransform(
    tagName,
    customElementTagName,
    iconAttribute
  );

  const [code, icons] = transform(source);

  // アイコンがない場合はそのまま返す
  if (!icons.length) {
    return code;
  }

  // アイコンがある場合はアイコンのimport文を追加する
  const imports =
    icons.map((v) => `import "${virtualIconImporter(v, base)}";`).join("\n") +
    "\n";

  if (/^\s*['"]use[^'"]+['"];?/.test(code)) {
    return code.replace(
      /^\s*['"]use[^'"]+['"];?/,
      (match) => match + "\n" + imports
    );
  } else {
    return imports + code;
  }
}
