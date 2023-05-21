# @achamaro/vite-plugin-icon

![npm (scoped)](https://img.shields.io/npm/v/@achamaro/vite-plugin-icon)

[Iconify]: https://iconify.design/

This plugin registers a simple custom element for displaying [Iconify] icons and handles automatic downloading of the icons.

## Installation

```sh
npm i -D @achamaro/vite-plugin-icon
```

## Setting

### Vite

vite.config.ts

```typescript
import icon from "@achamaro/vite-plugin-icon";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    // When using Svelte, it needs to be added before the Svelte plugin
    icon(),
    // When using Vue, you need to set the compilerOption. `i-con` is the default value for `options.customElementTagName`.
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === "i-con",
        },
      },
    }),
  ],
});
```

### Astro

astro.config.mjs

```javascript
import { defineConfig } from "astro/config";
import icon from "@achamaro/vite-plugin-icon/astro-integration";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [icon(), react()],
});
```

## Usage

```html
<i icon="simple-icons:iconify"></i>
```

## TypeScript

Please add a reference to the type definition file for the `icon` attribute for the `i` tag (default) to the `vite-env.d.ts`.

### For React

```ts
/// <reference types="@achamaro/vite-plugin-icon/types/jsx" />
```

### For Svelte

```ts
/// <reference types="@achamaro/vite-plugin-icon/types/svelte-html" />
```

### For Astro

```ts
/// <reference types="@achamaro/vite-plugin-icon/types/astro-html-jsx" />
```

## Options

### downloadDir

- **Type**: `string`
- **Default**: `"src/assets/icons"`

The directory to download icons.

### tagName

- **Type**: `string`
- **Default**: `"i"`

The tag name will be replaced with the customElementTagName value.

### includes

- **Type**: `ReadonlyArray<string | RegExp> | string | RegExp | null`
- **Default**: `"**/*.{vue,html,jsx,tsx,svelte,astro}"`

### excludes

- **Type**: `ReadonlyArray<string | RegExp> | string | RegExp | null`
- **Default**: `undefined`
