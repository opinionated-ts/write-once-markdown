# write-once-markdown

[![CI](https://img.shields.io/github/actions/workflow/status/opinionated-ts/write-once-markdown/check-and-release.yml?label=CI)](https://github.com/opinionated-ts/write-once-markdown/actions/workflows/check-and-release.yml)
[![License](https://img.shields.io/github/license/opinionated-ts/write-once-markdown)](https://github.com/opinionated-ts/write-once-markdown/blob/main/LICENSE)

A Markdown integration plugin for [Write Once](https://github.com/opinionated-ts/write-once). It formats extracted non-Markdown source fragments as fenced code blocks without replacing Write Once's existing preparation, resolution, extraction, selector, or marker pipeline.

## Install

```sh
bun add write-once write-once-markdown
# npm install write-once write-once-markdown
```

## Configure

Create `write-once.config.ts`:

```ts
import { defineConfig } from "write-once";
import { markdownPlugin } from "write-once-markdown";

export default defineConfig({
  plugins: [markdownPlugin],
});
```

Use the normal CLI command to generate destinations:

```sh
write-once generate
```

For a complete example, extension rules, and development instructions, see the [usage guide](docs/usage.md).

## Behavior

- Adds one `pre-write` hook using Write Once's exported `GenerationHook` contract.
- Fences non-Markdown source content only when the destination is Markdown (`.md`, `.markdown`, `.mdown`, `.mkd`; case-insensitive).
- Leaves Markdown sources, empty fragments, and non-Markdown destinations unchanged.
- Uses a normalized source extension as the language label, with aliases for common extensions and an unlabeled fence when no extension exists.
- Chooses a fence longer than any backtick run in the content.
- Returns `{ text }` only; the core remains responsible for marker reconstruction and file writes.

## Development

```sh
bun install
bun run test
bun run check
bun run build
bun run pack:check
```

`bun run test` builds the distributable and runs both unit tests and CLI integration tests against temporary projects. `bun run pack:check` inspects the publishable package contents without publishing.

## Related projects

- [write-once](https://github.com/opinionated-ts/write-once) — core preparation, resolution, extraction, and generation pipeline.
- [Opinionated TS](https://github.com/opinionated-ts) — the ecosystem this package belongs to.
