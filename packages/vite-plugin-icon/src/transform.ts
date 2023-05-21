/**
 * アイコン変換処理関数を生成する
 * @param tagName - タグ名
 * @param customElementTagName カスタムエレメントのタグ名
 * @param iconAttribute - アイコン名を指定する属性名
 * @returns アイコン変換処理関数
 */
export function generateTransform(
  tagName: string,
  customElementTagName: string,
  iconAttribute: string
) {
  const tagReg = generateTagReg(tagName);
  const tagNameReg = new RegExp(`^(<)${tagName}|${tagName}(>)$`, "g");
  const getIconName = generateIconNameGetter(tagName, iconAttribute);

  return (code: string): [string, string[]] => {
    const icons = new Set<string>();

    // コードにある指定のタグをすべて処理する
    code = code.replaceAll(tagReg, (substring) => {
      // アイコン名が取得できる場合にアイコンタグとみなす
      const iconName = getIconName(substring);
      if (iconName) {
        substring = substring.replaceAll(
          tagNameReg,
          (_, open, close) =>
            `${open ?? ""}${customElementTagName}${close ?? ""}`
        );

        // アイコン一覧に追加
        icons.add(iconName);
      }

      return substring;
    });

    return [code, [...icons]];
  };
}

/**
 * タグにマッチする正規表現を生成する
 * @param tagName - タグ名
 * @returns タグにマッチする正規表現
 */
const generateTagReg = (tagName: string) =>
  new RegExp(`<${tagName}\\s[^<>]*>(?:\\s*<\\/${tagName}>)?`, "gs");

type IconParser = (substring: string) => string | undefined;

/**
 * アイコンタグ文字列からアイコン名を取得する
 * @param tagName - タグ名
 * @param iconAttribute - アイコン名を指定する属性名
 * @returns アイコン名を取得する関数
 */
function generateIconNameGetter(
  tagName: string,
  iconAttribute: string
): IconParser {
  const iconAttributeReg = new RegExp(
    `${iconAttribute}=['"]([^'"]+?)['"]`,
    "s"
  );

  return (substring: string) => {
    // 閉じタグまで取れていない場合はスキップ
    if (!substring.endsWith(`</${tagName}>`) && !substring.endsWith(`/>`)) {
      return substring;
    }

    return substring.match(iconAttributeReg)?.[1];
  };
}
