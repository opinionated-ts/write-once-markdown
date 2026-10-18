# Markdown integration

`write-once-markdown` is a plugin for [Write Once](https://github.com/opinionated-ts/write-once) that presents extracted source code as fenced code blocks when the destination is Markdown. It uses Write Once's existing marker parser, preparer selection, resolver, extractor, and hook pipeline; it does not introduce a second extraction or marker implementation.

## Install

Install the core CLI and this plugin in the project where you run generation:

```sh
bun add write-once write-once-markdown
# npm install write-once write-once-markdown
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

The plugin factory is passed to `plugins`; Write Once evaluates it while normalizing the configuration. No custom resolver, extractor, or selector is needed for local files.

## Example

Given `src/example.ts`:

```ts
export const answer = 42;
```

And `README.md`:

```md
<!-- fragment source="./src/example.ts" -->

Previous generated content.
<!-- /fragment -->
```

Run the normal core command:

```sh
write-once generate
```

The generated block body becomes:

````md
<!-- fragment source="./src/example.ts" -->

```typescript
export const answer = 42;
```

<!-- /fragment -->
````

Only the fragment body is returned by the hook. Write Once remains responsible for preserving marker delimiters, reconstructing the destination, deciding whether it changed, and writing it.

## Formatting rules

- The destination must have a Markdown extension: `.md`, `.markdown`, `.mdown`, or `.mkd` (case-insensitive).
- Markdown source files are inserted unchanged; non-Markdown sources are fenced.
- The source extension becomes the fence language, normalized to lowercase. Common aliases include `.js`/`.cjs`/`.mjs` → `javascript`, `.ts`/`.mts`/`.cts` → `typescript`, `.py` → `python`, `.sh` → `bash`, and `.yml` → `yaml`.
- Unknown extensions are used as their normalized language labels. Sources without an extension use an unlabeled fence.
- The fence is at least three backticks and longer than the longest backtick run in the content.
- Empty fragments and non-Markdown destinations are unchanged.

## Development and verification

```sh
bun install
bun run test          # builds the distributable, then runs unit and CLI integration tests
bun run check         # formatting, lint, and spelling checks
bun run build         # ESM bundle and TypeScript declarations
bun run pack:check    # inspect the npm package contents without publishing
```

The integration tests invoke the installed `write-once` CLI against temporary projects and verify actual destination output, marker preservation, idempotence, and non-Markdown behavior.
