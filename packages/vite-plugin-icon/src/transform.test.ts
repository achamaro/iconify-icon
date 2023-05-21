import dedent from "ts-dedent";
import { describe, expect, it } from "vitest";

import { generateTransform } from "./transform";

describe("transform", () => {
  const transform = generateTransform("i", "i-con", "icon");

  it("replace", () => {
    const before = dedent`
            <i icon="foo"></i>
            <i icon="bar"></i>
            <i
                attr="attr"
                icon="foo"
                attr2="attr2"
            >
            </i>`;
    const after = dedent`
            <i-con icon="foo"></i-con>
            <i-con icon="bar"></i-con>
            <i-con
                attr="attr"
                icon="foo"
                attr2="attr2"
            >
            </i-con>`;

    const [code, icons] = transform(before);
    expect(code).toBe(after);
    expect(icons).toEqual(["foo", "bar"]);
  });
});
