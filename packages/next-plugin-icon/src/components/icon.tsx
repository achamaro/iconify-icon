"use client";

import { HTMLAttributes } from "react";

export default function Icon(
  props: HTMLAttributes<HTMLElement> & { icon: string }
) {
  const { className, ...attrs } = props;

  if (typeof window !== "undefined") {
    ("ADD_ICON_SCRIPT");
  }

  return <i-con class={className} {...attrs}></i-con>;
}
