import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const projectDirectories: string[] = [];
const packageRoot = join(import.meta.dirname, "../..");
const coreCli = join(packageRoot, "node_modules/write-once/dist/cli.mjs");
const pluginEntry = join(packageRoot, "dist/index.mjs");

async function createProject() {
  const cwd = await mkdtemp(join(tmpdir(), "write-once-markdown-integration-"));
  projectDirectories.push(cwd);
  await writeFile(
    join(cwd, "write-once.config.ts"),
    `import { markdownPlugin } from ${JSON.stringify(pluginEntry)};\nexport default { plugins: [markdownPlugin] };\n`,
  );
  return cwd;
}

function generate(cwd: string) {
  return spawnSync("bun", [coreCli, "generate"], { cwd, encoding: "utf8" });
}

afterEach(async () => {
  await Promise.all(
    projectDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("installed Write Once CLI integration", () => {
  it("loads the packaged plugin and fences real extracted code while preserving marker lines", async () => {
    const cwd = await createProject();
    const destination = join(cwd, "README.md");
    await writeFile(join(cwd, "example.ts"), "export const answer = 42;\n");
    const original = [
      "# Example",
      "",
      '<!-- fragment source="./example.ts" -->',
      "old content",
      "<!-- /fragment -->",
      "",
      "Keep this paragraph untouched.",
      "",
    ].join("\n");
    await writeFile(destination, original);

    const result = generate(cwd);
    expect(result.status, result.stderr).toBe(0);
    expect(await readFile(destination, "utf8")).toBe(
      [
        "# Example",
        "",
        '<!-- fragment source="./example.ts" -->',
        "``` typescript",
        "export const answer = 42;",
        "```",
        "<!-- /fragment -->",
        "",
        "Keep this paragraph untouched.",
        "",
      ].join("\n"),
    );
  });

  it("is idempotent and does not rewrite an already synchronized destination", async () => {
    const cwd = await createProject();
    const destination = join(cwd, "README.md");
    await writeFile(join(cwd, "example.py"), "print('hello')\n");
    await writeFile(
      destination,
      '<!-- fragment source="./example.py" -->\nold\n<!-- /fragment -->\n',
    );

    expect(generate(cwd).status).toBe(0);
    const synchronized = await readFile(destination, "utf8");
    const secondRun = generate(cwd);

    expect(secondRun.status, secondRun.stderr).toBe(0);
    expect(await readFile(destination, "utf8")).toBe(synchronized);
    expect(synchronized).toContain("``` python\nprint('hello')\n```");
  });

  it("does not add fences to a Markdown source or a non-Markdown destination", async () => {
    const cwd = await createProject();
    const markdownDestination = join(cwd, "README.md");
    await writeFile(join(cwd, "source.md"), "A Markdown paragraph.\n");
    await writeFile(
      markdownDestination,
      '<!-- fragment source="./source.md" -->\nold\n<!-- /fragment -->\n',
    );
    await writeFile(
      join(cwd, "output.txt"),
      '<!-- fragment source="./source.ts" -->\nold\n<!-- /fragment -->\n',
    );
    await writeFile(join(cwd, "source.ts"), "const value = 1;\n");

    const result = generate(cwd);
    expect(result.status, result.stderr).toBe(0);
    expect(await readFile(markdownDestination, "utf8")).toContain("\nA Markdown paragraph.\n");
    expect(await readFile(join(cwd, "output.txt"), "utf8")).toContain("\nconst value = 1;\n");
  });
});
