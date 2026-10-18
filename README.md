# write-once-markdown

Markdown integration for [Write Once](https://github.com/opinionated-ts/write-once).

The plugin contributes a `pre-write` hook that wraps extracted non-Markdown source fragments in fenced code blocks when their destination is Markdown. It uses the source extension as the language identifier, normalizes extensions to lowercase, maps common aliases such as `.py` to `python`, and chooses a fence longer than any backtick run in the content. Markdown sources, empty fragments, and non-Markdown destinations are left unchanged.

## Usage

Install `write-once-markdown` alongside `write-once`, then register the plugin in `write-once.config.ts`:

```ts
import { defineConfig } from "write-once";
import { markdownPlugin } from "write-once-markdown";

export default defineConfig({
  plugins: [markdownPlugin],
});
```

The plugin uses Write Once's existing resolution and extraction pipeline. It does not add a resolver, extractor, selector, or marker syntax.

## Development

```sh
bun install
bun run test
bun run check
bun run build
```

## Related projects

- [write-once](https://github.com/opinionated-ts/write-once) — core resource preparation, resolution, and content extraction pipeline.
- [Opinionated TS](https://github.com/opinionated-ts) — the ecosystem this package belongs to.
