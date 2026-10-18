# write-once-markdown

[![CI](https://img.shields.io/github/actions/workflow/status/opinionated-ts/write-once-markdown/check-and-release.yml?label=CI)](https://github.com/opinionated-ts/write-once-markdown/actions/workflows/check-and-release.yml)
[![npm version](https://img.shields.io/npm/v/write-once-markdown)](https://www.npmjs.com/package/write-once-markdown)
[![npm downloads](https://img.shields.io/npm/dm/write-once-markdown)](https://www.npmjs.com/package/write-once-markdown)
[![License](https://img.shields.io/github/license/opinionated-ts/write-once-markdown)](https://github.com/opinionated-ts/write-once-markdown/blob/main/LICENSE)

A [Write Once](https://github.com/opinionated-ts/write-once) plugin that formats extracted source code as fenced code blocks in Markdown files.

## Install

Install the core and plugin as development dependencies in your project:

```sh
bun add -d write-once write-once-markdown
# npm install --save-dev write-once write-once-markdown
# pnpm add -D write-once write-once-markdown
```

## Configure

Create `write-once.config.ts` in your project root:

```ts
import { defineConfig } from "write-once";
import { markdownPlugin } from "write-once-markdown";

export default defineConfig({
  plugins: [markdownPlugin],
});
```

Add a fragment to a Markdown file, for example `README.md`:

```md
<!-- fragment source="./src/example.ts" -->

Previous generated content.
<!-- /fragment -->
```

Run Write Once to synchronize the fragment:

```sh
write-once generate
```

For example, `src/example.ts` containing `export const answer = 42;` is rendered as:

````md
<!-- fragment source="./src/example.ts" -->

```typescript
export const answer = 42;
```

<!-- /fragment -->
````

## Behavior

- Fences non-Markdown source files only when the destination is Markdown (`.md`, `.markdown`, `.mdown`, `.mkd`; case-insensitive).
- Leaves Markdown sources, empty fragments, and non-Markdown destinations unchanged.
- Infers the code language from the source extension. Common aliases include `.js`/`.cjs`/`.mjs` → `javascript`, `.ts`/`.mts`/`.cts` → `typescript`, `.py` → `python`, `.sh` → `bash`, and `.yml` → `yaml`.
- Uses an unlabeled fence when the source has no extension and chooses a fence long enough to safely contain backticks in the content.

See the [usage guide](docs/usage.md) for more details.
