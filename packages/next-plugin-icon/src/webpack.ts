import fs from "fs";
import path from "path";
import type { Compiler, WebpackPluginInstance } from "webpack";
import VirtualModulesPlugin from "webpack-virtual-modules";

const injectDefineIcon = path.resolve(
  __dirname,
  "./webpack-loader/inject-define-icon.cjs"
);
const injectIcon = path.resolve(__dirname, "./webpack-loader/inject-icon.cjs");
const iconTemplate = fs.readFileSync(
  path.resolve(__dirname, "./components/icon.js"),
  "utf-8"
);

export type IconPluginOptions = Partial<Options>;

interface Options {
  downloadDir: string;
  customElementTagName: string;
}

const defaultOptions = {
  downloadDir: "src/assets/icons",
  customElementTagName: "i-con",
};

export default class IconPlugin implements WebpackPluginInstance {
  private readonly options: Options;

  constructor(_options: IconPluginOptions = {}) {
    const options = {
      ...defaultOptions,
      ..._options,
    } as Options;

    options.downloadDir = path.resolve(options.downloadDir);

    this.options = options;
  }

  apply(compiler: Compiler) {
    const vm = new VirtualModulesPlugin();
    vm.apply(compiler);

    // 処理済みのモジュールを記録する
    const modifiedModules = new WeakSet();

    compiler.hooks.compilation.tap(PACKAGE_NAME, (compilation) => {
      // 仮想モジュールの解決を行う
      compiler.hooks.normalModuleFactory.tap(
        PACKAGE_NAME,
        (normalModuleFactory) => {
          normalModuleFactory.hooks.beforeResolve.tapPromise(
            PACKAGE_NAME,
            async (resolveData) => {
              if (
                !resolveData.request.startsWith(
                  "@achamaro/next-plugin-icon/components/icon"
                )
              ) {
                return;
              }

              const iconName = resolveData.request
                .replace("@achamaro/next-plugin-icon/components/icon/", "")
                .replace("/", ":");

              const params = new URLSearchParams();
              params.append("downloadDir", this.options.downloadDir);
              params.append(
                "customElementTagName",
                this.options.customElementTagName
              );
              params.append("iconName", iconName);

              resolveData.request = `@achamaro/next-plugin-icon/webpack-loader/import-icon?${params.toString()}!`;
            }
          );

          // normalModuleFactory.hooks.resolve.tapPromise(
          //   PACKAGE_NAME,
          //   async (resolveData) => {
          //     if (
          //       !resolveData.request.startsWith(".@achamaro/next-plugin-icon/")
          //     ) {
          //       return;
          //     }

          //     const iconName = resolveData.request
          //       .replace(".@achamaro/next-plugin-icon/", "")
          //       .replace("/", ":");
          //     const iconJson = JSON.stringify(await fetchIcon(iconName));

          //     const filename =
          //       path.resolve(`"node_modules"`, resolveData.request) + ".js";
          //     const code = iconTemplate.replace(
          //       `"ADD_ICON_SCRIPT"`,
          //       JSON.stringify(
          //         `customElements.get("i-con").addIcon("${iconName}",${iconJson});`
          //       )
          //     );
          //   }
          // );
        }
      );

      // ローダーを追加する
      const normalModuleHooks =
        compiler.webpack.NormalModule.getCompilationHooks(compilation);

      normalModuleHooks.beforeLoaders.tap(
        PACKAGE_NAME,
        (loaders, normalModule) => {
          // 処理済みのモジュールはスキップする
          if (modifiedModules.has(normalModule)) {
            return;
          }
          modifiedModules.add(normalModule);

          // @achamaro/next-plugin-icon/components/define-icon
          if (
            normalModule.resourceResolveData?.descriptionFileData?.name ===
              PACKAGE_NAME &&
            normalModule.resource.includes(`components/define-icon`)
          ) {
            // 後ろから実行されるので、最後に追加する
            loaders.push({
              loader: injectDefineIcon,
              options: {},
              ident: null,
              type: null,
            });
          }

          // // @achamaro/next-plugin-icon/webpack-loader/import-icon
          // if (
          //   normalModule.resourceResolveData?.descriptionFileData?.name ===
          //     PACKAGE_NAME &&
          //   normalModule.resource.includes(`webpack-loader/import-icon`)
          // ) {
          //   console.log(normalModule);
          //   // 後ろから実行されるので、最後に追加する
          //   loaders.push({
          //     loader: injectIcon,
          //     options: {
          //       tag: this.options.customElementTagName,
          //       downloadDir: this.options.downloadDir,
          //       iconName: new URL(
          //         normalModule.resource,
          //         "file://"
          //       ).searchParams.get("icon"),
          //     },
          //     ident: null,
          //     type: null,
          //   });
          // }
        }
      );
    });
  }
}

function resolvePattern<T extends string | string[] | undefined>(
  pattern: T
): T {
  if (pattern == null) {
    return pattern;
  }

  if (Array.isArray(pattern)) {
    return pattern.map((v) => path.resolve(v)) as T;
  }

  return path.resolve(pattern) as T;
}
