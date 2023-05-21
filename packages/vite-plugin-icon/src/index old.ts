import { fetchIcon } from "core/fetch";
import dedent from "ts-dedent";
import { createFilter, FilterPattern, PluginOption } from "vite";

import { generateTransform } from "./transform";
import { virtualComponentName } from "./util";

export interface Options {
  downloadDir?: string;
  // iconAttribute?: string;
  tagName?: string;
  // componentPrefix?: string;
  // customElementTagName?: string;
  includes?: FilterPattern;
  excludes?: FilterPattern;
  resolve?: string | false | null;
}

const defaultOptions = {
  downloadDir: "src/assets/icons",
  iconAttribute: "icon",
  tagName: "i",
  componentPrefix: "IconifyIcon",
  customElementTagName: "i-con",
  includes: "**/*.{vue,html,jsx,tsx,svelte,astro}",
};

export default function IconPlugin(options?: Options): PluginOption {
  const {
    downloadDir,
    tagName,
    componentPrefix,
    customElementTagName,
    iconAttribute,
    includes,
    excludes,
    resolve,
  } = {
    ...defaultOptions,
    ...options,
  };

  const filter = createFilter(includes, excludes, { resolve });

  const virtualModuleId = `virtual:${PACKAGE_NAME}`;

  const transform = generateTransform(
    tagName,
    componentPrefix,
    customElementTagName,
    iconAttribute,
    virtualModuleId
  );

  return {
    name: "vite:icon",
    enforce: "pre",
    resolveId(id: string) {
      if (id.startsWith(virtualModuleId)) {
        return id;
      }
    },
    async load(id) {
      if (id.startsWith(virtualModuleId)) {
        const parts = id.substring(virtualModuleId.length + 1).split(".");
        const ext = parts.pop();
        const name = parts.join(".");
        const icon = await fetchIcon(name, downloadDir);
        if (!icon) {
          return;
        }

        if (ext === "html") {
          return dedent`
            import { Icon, defineIcon } from "${PACKAGE_NAME}/icon";
            defineIcon();
            Icon.addIcon("${name}", ${JSON.stringify(icon)});
            `;
        }

        const componentName = virtualComponentName(componentPrefix, name);
        const json = JSON.stringify(icon);

        if (ext === "jsx") {
          return dedent`
            import { Icon, defineIcon } from "${PACKAGE_NAME}/icon";
            defineIcon();
            export default function ${componentName}(props) {
              return (
                <script
                  dangerouslySetInnerHTML={{
                    __html: \`Icon.addIcon("${name}", ${json});\`
                  }}
                />
              )
            }
            `;
        }
        return dedent`
          import { Icon, defineIcon } from "${PACKAGE_NAME}/icon";
          defineIcon();
          Icon.addIcon("${name}", ${JSON.stringify(icon)});
          `;
      }
    },
    transform(code, id) {
      if (!filter(id)) {
        return;
      }

      return {
        code: transform(code, id),
      };
    },
    transformIndexHtml: {
      enforce: "pre",
      order: "pre",
      transform: (html, ctx) => transform(html, ctx.filename),
    },
  };
}
