import { describe, expect, it } from "vitest";

import { markdownPlugin } from "@/index";

const hook = markdownPlugin().hooks[0];

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
  return hook.run({
    stage: "pre-write",
    destination,
    text,
    sourceReference,
    source: sourcePath === undefined ? undefined : { path: sourcePath },
  });
}

describe("markdownPlugin", () => {
  it("contributes only the Markdown presentation hook", () => {
    const plugin = markdownPlugin();

    expect(plugin.name).toBe("write-once-markdown");
    expect(plugin.hooks).toHaveLength(1);
  });

  it("fences common non-Markdown source formats with language labels", () => {
    expect(runHook({ sourcePath: "src/app.ts" })).toEqual({
      text: "``` typescript\nconst answer = 42;\n```",
    });
    expect(runHook({ sourcePath: "scripts/build.py" })).toEqual({
      text: "``` python\nconst answer = 42;\n```",
    });
    expect(runHook({ sourcePath: "src/app.cjs" })).toEqual({
      text: "``` javascript\nconst answer = 42;\n```",
    });
  });

  it("uses normalized unknown extensions as language identifiers", () => {
    expect(runHook({ sourcePath: "source.FOO" })).toEqual({
      text: "``` foo\nconst answer = 42;\n```",
    });
  });

  it("uses an unlabeled fence when the source has no extension", () => {
    expect(runHook({ sourcePath: "Dockerfile" })).toEqual({
      text: "```\nconst answer = 42;\n```",
    });
  });

  it("handles source and destination extensions case-insensitively", () => {
    expect(runHook({ sourcePath: "src/APP.PY", destination: "/project/README.MD" })).toEqual({
      text: "``` python\nconst answer = 42;\n```",
    });
  });

  it("leaves Markdown sources unchanged", () => {
    expect(runHook({ sourcePath: "docs/guide.Md" })).toEqual({ text: "const answer = 42;" });
    expect(runHook({ sourcePath: "docs/guide.markdown" })).toEqual({ text: "const answer = 42;" });
  });

  it("chooses a fence longer than any backtick run in the content", () => {
    expect(runHook({ sourcePath: "source.ts", text: "const sample = ` ``` `;" })).toEqual({
      text: "```` typescript\nconst sample = ` ``` `;\n````",
    });
  });

  it("does not fence empty content", () => {
    expect(runHook({ sourcePath: "source.ts", text: "" })).toEqual({ text: "" });
  });

  it("leaves non-Markdown destinations unchanged", () => {
    expect(runHook({ sourcePath: "source.ts", destination: "/project/output.txt" })).toEqual({
      text: "const answer = 42;",
    });
  });

  it("uses the resolved source path when available", () => {
    expect(runHook({ sourcePath: "source.py", sourceReference: "remote:unknown" })).toEqual({
      text: "``` python\nconst answer = 42;\n```",
    });
  });
});
