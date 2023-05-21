import type { IconifyIcon, IconifyJSON } from "iconify-icon";

/**
 * iconifyから取得したJSONデータをパースする
 * @param data - iconifyから取得したJSONデータ
 * @returns
 */
export function parseIconifyJSON(
  data: IconifyJSON
): Record<string, IconifyIcon> {
  const { width, height } = data;
  return Object.fromEntries(
    Object.entries(data.icons).map(([name, iconData]) => {
      return [
        name,
        {
          width,
          height,
          ...iconData,
        },
      ];
    })
  );
}
