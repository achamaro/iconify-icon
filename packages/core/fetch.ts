import fs from "fs";
import type { IconifyIcon, IconifyJSON } from "iconify-icon";
import fetch from "node-fetch";
import { resolve } from "path";

import { parseIconifyJSON } from "./util";

const iconUrl = (prefix: string, icon: string) =>
  `https://api.iconify.design/${prefix}.json?icons=${icon}`;

/**
 * アイコンデータを取得する
 * @param name アイコン名
 * @param downloadDir アイコンデータダウンロードディレクトリ
 * @returns アイコンデータ
 */
export async function fetchIcon(
  name: string,
  downloadDir = "src/assets/icons"
): Promise<IconifyIcon | undefined> {
  const [prefix, icon] = name.split(":");
  if (!prefix || !icon) {
    return;
  }

  // ファイルが存在する場合はファイルを読み込んで返す
  const dirname = resolve(downloadDir, prefix);
  const filename = resolve(dirname, `${icon}.json`);
  if (fs.existsSync(filename)) {
    return JSON.parse(fs.readFileSync(filename, "utf-8"));
  }

  // アイコンを取得する
  const url = iconUrl(prefix, icon);
  const data = await fetch(url).then((r) => {
    if (!r.ok) {
      throw new Error(
        `[${PACKAGE_NAME}] Failed to fetch '${url}' ${r.status} ${r.statusText}.`
      );
    }

    return r.json();
  });

  // アイコンデータをパースしてファイルに保存する
  const iconData = parseIconifyJSON(data as IconifyJSON)[icon];
  if (!iconData) {
    throw new Error(`[${PACKAGE_NAME}] '${name}' not found.`);
  }

  if (!fs.existsSync(dirname)) {
    await fs.promises.mkdir(dirname, { recursive: true });
  }

  fs.writeFileSync(filename, JSON.stringify(iconData));

  return iconData;
}
