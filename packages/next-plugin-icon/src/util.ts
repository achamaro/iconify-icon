import path from "path";

const prefix = `__virtual__/${PACKAGE_NAME}/`;
const iconPrefix = `${prefix}icon/`;

/**
 * アイコンを読み込むための仮想モジュールのパスを生成する
 * @param icon - アイコン名
 * @returns アイコンを読み込むための仮想モジュールのパス
 */
export function virtualIconImporter(icon: string, base: string): string {
  return path.join(base, `${iconPrefix}${icon.replace(":", "/")}.jsx`);
}

/**
 * アイコンを読み込む仮想モジュールのパスかどうかを判定する
 * @param id - モジュールパス
 * @returns アイコンを読み込む仮想モジュールのパスかどうか
 */
export function isVirtualIconImporter(id: string): boolean {
  return id.includes(iconPrefix);
}

/**
 * 仮想モジュールパスからアイコン名を取得する
 * @param id - 仮想モジュールパス
 * @returns アイコン名
 */
export function parseVirtualIconImporter(id: string): string {
  return id.split(iconPrefix)[1].slice(0, -4).replace("/", ":");
}
