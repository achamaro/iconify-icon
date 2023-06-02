import type { NextConfig } from "next";

import IconPlugin, { IconPluginOptions } from "./webpack";

export default function WithIconPlugin(pluginOptions: IconPluginOptions = {}) {
  return (nextConfig: NextConfig = {}): NextConfig => {
    const override: Partial<NextConfig> = {
      webpack(config, options) {
        config.plugins.push(new IconPlugin(pluginOptions));

        if (typeof nextConfig.webpack === "function") {
          return nextConfig.webpack(config, options);
        }
        return config;
      },
    };

    return Object.assign({}, nextConfig, override);
  };
}
