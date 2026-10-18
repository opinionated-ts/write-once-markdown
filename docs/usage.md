# Usage

`write-once-markdown` formats source fragments as fenced code blocks when they are inserted into Markdown destinations. It works with the normal [Write Once](https://github.com/opinionated-ts/write-once) generation command.

## Install

Install both packages as development dependencies in the project where you run generation:

```sh
bun add -d write-once write-once-markdown
# npm install --save-dev write-once write-once-markdown
# pnpm add -D write-once write-once-markdown
```

## Configure

Create `write-once.config.ts` in the project root:

```ts
import { defineConfig } from "write-once";
import { markdownPlugin } from "write-once-markdown";

export default defineConfig({
  plugins: [markdownPlugin],
});
```

## Add a fragment

Given a source file `src/example.ts`:

```ts
export const answer = 42;
```

Add a fragment to `README.md`:

```md
<!-- fragment source="./src/example.ts" -->

Replace this line with generated content.
<!-- /fragment -->
```

Run the generator:

```sh
write-once generate
```

The fragment is synchronized to:

````md
<!-- fragment source="./src/example.ts" -->

```typescript
export const answer = 42;
```

<!-- /fragment -->
````

## Formatting rules

- The destination must use a Markdown extension: `.md`, `.markdown`, `.mdown`, or `.mkd`. Extensions are case-insensitive.
- Non-Markdown source files are wrapped in a fenced code block. Markdown sources are inserted unchanged.
- The source extension determines the language label, normalized to lowercase. Common aliases are `.js`, `.cjs`, and `.mjs` → `javascript`; `.ts`, `.mts`, and `.cts` → `typescript`; `.py` → `python`; `.sh` → `bash`; and `.yml` → `yaml`.
- Unknown extensions are used as language labels. Files without an extension use an unlabeled fence.
- The fence is at least three backticks and longer than any backtick run in the source content.
- Empty fragments and non-Markdown destinations are left unchanged.
