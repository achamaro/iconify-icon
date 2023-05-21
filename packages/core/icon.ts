import type { IconifyIcon } from "iconify-icon";

/**
 * アイコンを表示するためのカスタム要素
 */
export class Icon extends HTMLElement {
  public svg: SVGSVGElement;
  public $style: HTMLStyleElement;

  private static icons = new Map<string, IconifyIcon | Promise<IconifyIcon>>();
  private static resolves = new Map<string, (data: IconifyIcon) => void>();

  /**
   * アイコンデータを追加する
   * @param name - アイコン名
   * @param data - アイコンデータ
   */
  public static addIcon(name: string, data: IconifyIcon) {
    // TODO: localStorageオプションを追加する

    if (Icon.resolves.has(name)) {
      // ペンディング状態のPromiseがあれば解決する
      const resolve = Icon.resolves.get(name)!;
      Icon.resolves.delete(name);
      resolve(data);
    }
    Icon.icons.set(name, data);
  }

  /**
   * アイコンデータを取得する
   * @param name - アイコン名
   * @returns アイコンデータ
   */
  public static async getIcon(name: string): Promise<IconifyIcon> {
    if (!Icon.icons.has(name)) {
      // まだデータがセットされていない場合は代わりにデータを返すPromiseをセットする
      Icon.icons.set(
        name,
        new Promise((resolve) => {
          Icon.resolves.set(name, resolve);
        })
      );
    }

    return Icon.icons.get(name)!;
  }

  /**
   * constructor
   */
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });

    this.$style = document.createElement("style");
    this.$style.textContent = this.styleContent();
    shadow.appendChild(this.$style);

    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("viewBox", `0 0 16 16`);
    this.svg.setAttribute("width", "100%");
    this.svg.setAttribute("height", "100%");
    this.svg.setAttribute("role", "img");
    shadow.appendChild(this.svg);

    this.renderIcon();
  }

  /**
   * スタイル文字列を取得する
   * @param width - 幅
   * @param height - 高さ
   * @returns スタイル文字列
   */
  public styleContent(width = 1, height = 1) {
    return `:host{display:inline-flex;aspect-ratio:${width}/${height};height:1em;}`;
  }

  /**
   * アイコン名を指定する属性名
   * @readonly
   * @memberof Icon
   */
  get iconAttribute() {
    return "icon";
  }

  /**
   * アイコン名の変更を監視する
   *
   * @readonly
   * @static
   * @memberof Icon
   */
  static get observedAttributes() {
    return [this.prototype.iconAttribute];
  }

  /**
   * アイコン名が変更されたら再描画する
   */
  attributeChangedCallback() {
    this.renderIcon();
  }

  /**
   * アイコンを描画する
   */
  async renderIcon() {
    const name = this.getAttribute(this.iconAttribute);
    if (!name) {
      return;
    }

    const icon = await Icon.getIcon(name);
    if (name !== this.getAttribute(this.iconAttribute)) {
      return;
    }

    const { left = 0, top = 0, width = 16, height = 16, body } = icon;
    this.$style.textContent = this.styleContent(width, height);
    this.svg.setAttribute("viewBox", `${left} ${top} ${width} ${height}`);
    this.svg.innerHTML = body;
  }
}

export function defineIcon(name = "i-con") {
  customElements.get(name) ?? customElements.define(name, Icon);
}
