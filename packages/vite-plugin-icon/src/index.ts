import { fetchIcon } from "core/fetch";
import { generateTransform } from "core/transform";
import fs from "fs/promises";
import { createFilter, FilterPattern, PluginOption } from "vite";

export interface Options {
  downloadDir?: string;
  tagName?: string;
  // iconAttribute?: string;
  // customElementTagName?: string;
  define?: boolean;
  includes?: FilterPattern;
  excludes?: FilterPattern;
  resolve?: string | false | null;
  // Astro用
  astro?: {
    isPage: (id: string) => boolean;
  };
}

const defaultOptions = {
  downloadDir: "src/assets/icons",
  iconAttribute: "icon",
  tagName: "i",
  customElementTagName: "i-con",
  define: true,
  includes: "**/*.{vue,html,jsx,tsx,svelte,astro}",
};

export default function IconPlugin(options?: Options): PluginOption {
  const {
    downloadDir,
    tagName,
    iconAttribute,
    customElementTagName,
    define,
    includes,
    excludes,
    resolve,
  } = {
    ...defaultOptions,
    ...options,
  };

  const filter = createFilter(includes, excludes, { resolve });

  const virtualModuleId = `virtual:${PACKAGE_NAME}`;

  const transformIcon = generateTransform(
    tagName,
    customElementTagName,
    iconAttribute
  );

  const moduleIcons = new Map<string, Set<string>>();
  const moduleImports = new Map<string, Set<string>>();

  /**
   * 指定のモジュールで使用されているアイコンを再起的に収集する
   * @param id モジュールID
   * @returns アイコン名の配列
   */
  function collectIcons(id: string): string[] {
    return [
      ...(moduleIcons.get(id) ?? []),
      ...[...(moduleImports.get(id) ?? [])].flatMap(collectIcons),
    ];
  }

  function importIcon(icon: string) {
    return `import "${virtualModuleId}/icon?icon=${icon}";`;
  }

  /**
   * コード変換処理
   * @param code コード
   * @param id モジュールID
   * @returns 変換後のコード
   */
  function transform(code: string, id: string): string {
    if (!filter(id) || id.startsWith(virtualModuleId)) {
      return code;
    }

    // アイコン用タグをカスタムエレメントタグに置換する
    let icons: string[];
    [code, icons] = transformIcon(code);

    // アイコンがない場合は変換処理なし
    if (!icons.length) {
      return code;
    }

    // アイコンを追加
    moduleIcons.set(id, new Set([...(moduleIcons.get(id) ?? []), ...icons]));

    const ext = id.split(".").pop()!;

    const imports = [...icons].map(importIcon).join("\n");

    // .html
    if (ext === "html") {
      const scripts = `<script type="module">${imports}</script>`;
      if (/<\/head>/.test(code)) {
        code = code.replace(/<\/head>/, (match) => {
          return `${scripts}\n${match}`;
        });
      } else {
        code = `${scripts}\n${code}`;
      }
    }
    // .jsx .tsx
    else if (ext === "jsx" || ext === "tsx") {
      code = `${imports}\n${code}`;
    }
    // .astro
    else if (ext === "astro") {
      // Astroの場合はルートファイルからまとめてアイコンを読み込む
      if (options?.astro?.isPage(id)) {
        // どこに挿入してもheadに巻き上げられるので、最後に追加する
        code += `<script>import "${virtualModuleId}/icon?${new URLSearchParams({
          importer: id,
          // 末尾が `.astro` で終わると、Astroファイルとして処理されてしまうので、
          // JSの拡張子を付与しておく
          _: ".mjs",
        })}";</script>`;
      }
    }
    // .vue .svelte
    else if (/<script[^<>]*>/.test(code)) {
      code = code.replace(/<script[^<>]*>/, (match) => {
        return `${match}\n${imports}`;
      });
    }
    // .vue .svelte
    else {
      code = `<script>${imports}</script>\n${code}`;
    }

    return code;
  }

  return {
    name: PACKAGE_NAME,
    enforce: "pre",
    async resolveId(source, importer, options) {
      // IDを解決
      const { id } =
        (await this.resolve(source, importer, {
          ...options,
          skipSelf: true,
        })) ?? {};

      // 対象ファイルのインポートマップを作成する
      if (importer && id && filter(id)) {
        if (moduleImports.has(importer)) {
          moduleImports.get(importer)!.add(id);
        } else {
          moduleImports.set(importer, new Set([id]));
        }
      }

      // 仮想モジュール
      if (source.startsWith(virtualModuleId)) {
        return source;
      }
    },
    async load(id) {
      // 仮想アイコンモジュール
      if (id.startsWith(virtualModuleId)) {
        // 接頭辞を除外したIDを取得する
        const vid = id.substring(virtualModuleId.length);

        // クエリパラメータを扱うためURLオブジェクトを生成する
        // baseは使用しないのでダミーの値を指定する
        const url = new URL(vid, "https://localhost");

        // importerが指定されている場合は、
        // インポートされている全てのアイコンを仮想モジュールでインポートする
        if (url.searchParams.has("importer")) {
          return [
            `import { defineIcon } from "${PACKAGE_NAME}/icon";`,
            `defineIcon();`,
            ...[
              ...new Set(collectIcons(url.searchParams.get("importer")!)),
            ].map(importIcon),
          ].join("\n");
        }

        // iconが指定されている場合は、そのアイコンデータを返す
        if (url.searchParams.has("icon")) {
          const iconName = url.searchParams.get("icon")!;
          const iconData = await fetchIcon(iconName, downloadDir);
          if (iconData) {
            const codes = define
              ? [
                  `import { Icon, defineIcon } from "${PACKAGE_NAME}/icon";`,
                  `defineIcon();`,
                ]
              : [`import { Icon } from "${PACKAGE_NAME}/icon";`];

            codes.push(
              `Icon.addIcon("${iconName}", ${JSON.stringify(iconData)});`
            );
            return codes.join("\n");
          }
        }
      }

      // Astroの場合、AstroのViteプラグインが強制的に先頭に差し込まれるため
      // Astroのプラグインより前に変換されるようにloadでtransformを実行する
      if (options?.astro) {
        if (filter(id) && !id.startsWith(virtualModuleId)) {
          const code = await fs.readFile(id, "utf-8");
          return transform(code, id);
        }
      }
    },
    transform: options?.astro ? undefined : transform,
    transformIndexHtml: {
      enforce: "pre",
      order: "pre",
      transform: (html, ctx) => transform(html, ctx.filename),
    },
  };
}
