import type { HookContext, MarkerBlock, MarkerToken } from "write-once";

import { describe, expect, it } from "vitest";

import { markdownPlugin } from "@/index";

function getHook() {
  const hook = markdownPlugin().hooks?.[0];
  if (hook === undefined) throw new Error("The Markdown plugin must register its hook.");
  return hook;
}

function createMarkerToken(kind: MarkerToken["kind"]): MarkerToken {
  return {
    kind,
    raw: "",
    attributes: {},
    span: { start: 0, end: 0 },
    lineSpan: { start: 0, end: 0 },
    location: {
      resource: "/project/README.md",
      start: { line: 1, column: 1 },
      end: { line: 1, column: 1 },
    },
  };
}

function createMarker(): MarkerBlock {
  return {
    opening: createMarkerToken("open"),
    closing: createMarkerToken("close"),
    span: { start: 0, end: 0 },
    bodySpan: { start: 0, end: 0 },
  };
}

function runHook({
  destination = "/project/README.md",
  sourcePath,
  sourceReference = sourcePath,
  text = "const answer = 42;",
}: {
  destination?: string;
  sourcePath?: string;
  sourceReference?: string;
  text?: string;
}) {
  const context: HookContext = {
    stage: "pre-write",
    destination,
    marker: createMarker(),
    text,
    fullText: text,
    sourceReference,
    source:
      sourcePath === undefined
        ? undefined
        : {
            id: sourcePath,
            root: "/project",
            path: sourcePath,
            location: sourcePath,
            text,
          },
  };

  return getHook().run(context);
}

describe("markdownPlugin", () => {
  it("contributes only the Markdown presentation hook using Write Once's hook contract", () => {
    const plugin = markdownPlugin();

    expect(plugin.name).toBe("write-once-markdown");
    expect(plugin.hooks).toHaveLength(1);
    expect(plugin.preparers).toBeUndefined();
    expect(plugin.resolvers).toBeUndefined();
    expect(plugin.extractors).toBeUndefined();
    expect(getHook()).toMatchObject({ id: "markdown-code-fence", stage: "pre-write" });
  });

  it("fences common non-Markdown source formats with language labels", () => {
    expect(runHook({ sourcePath: "src/app.ts" })).toMatchObject({
      text: "``` typescript\nconst answer = 42;\n```",
    });
    expect(runHook({ sourcePath: "scripts/build.py" })).toMatchObject({
      text: "``` python\nconst answer = 42;\n```",
    });
    expect(runHook({ sourcePath: "src/app.cjs" })).toMatchObject({
      text: "``` javascript\nconst answer = 42;\n```",
    });
  });

  it("uses normalized unknown extensions as language identifiers", () => {
    expect(runHook({ sourcePath: "source.FOO" })).toMatchObject({
      text: "``` foo\nconst answer = 42;\n```",
    });
  });

  it("uses an unlabeled fence when the source has no extension", () => {
    expect(runHook({ sourcePath: "Dockerfile" })).toMatchObject({
      text: "```\nconst answer = 42;\n```",
    });
  });

  it("handles source and destination extensions case-insensitively", () => {
    expect(runHook({ sourcePath: "src/APP.PY", destination: "/project/README.MD" })).toMatchObject({
      text: "``` python\nconst answer = 42;\n```",
    });
  });

  it("leaves Markdown sources unchanged", () => {
    expect(runHook({ sourcePath: "docs/guide.Md" })).toMatchObject({ text: "const answer = 42;" });
    expect(runHook({ sourcePath: "docs/guide.markdown" })).toMatchObject({
      text: "const answer = 42;",
    });
  });

  it("chooses a fence longer than any backtick run in the content", () => {
    expect(runHook({ sourcePath: "source.ts", text: "const sample = ` ``` `;" })).toMatchObject({
      text: "```` typescript\nconst sample = ` ``` `;\n````",
    });
  });

  it("does not add an extra blank line when source text ends with a newline", () => {
    expect(runHook({ sourcePath: "source.ts", text: "const answer = 42;\n" })).toMatchObject({
      text: "``` typescript\nconst answer = 42;\n```",
    });
  });

  it("does not fence empty content", () => {
    expect(runHook({ sourcePath: "source.ts", text: "" })).toMatchObject({ text: "" });
  });

  it("leaves non-Markdown destinations unchanged", () => {
    expect(runHook({ sourcePath: "source.ts", destination: "/project/output.txt" })).toMatchObject({
      text: "const answer = 42;",
    });
  });

  it("uses the resolved source path when available", () => {
    expect(runHook({ sourcePath: "source.py", sourceReference: "remote:unknown" })).toMatchObject({
      text: "``` python\nconst answer = 42;\n```",
    });
  });

  it("returns only the extracted text so the core retains marker ownership", async () => {
    const output = await runHook({ sourcePath: "source.ts" });

    expect(output).toEqual({ text: "``` typescript\nconst answer = 42;\n```" });
    expect(output).not.toHaveProperty("fullText");
  });
});
