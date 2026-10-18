import type { GenerationHook, PluginFactory } from "write-once";

import { extname } from "node:path";

const languageByExtension: Readonly<Record<string, string>> = {
  js: "javascript",
  ts: "typescript",
  cjs: "javascript",
  mjs: "javascript",
  mts: "typescript",
  cts: "typescript",
  py: "python",
  sh: "bash",
  yml: "yaml",
};

const markdownExtensions = new Set([".md", ".markdown", ".mdown", ".mkd"]);

function getExtension(path: string | undefined): string {
  return path === undefined ? "" : extname(path).toLowerCase();
}

function getFenceLanguage(path: string | undefined): string {
  const extension = getExtension(path).slice(1);
  return languageByExtension[extension] ?? extension;
}

function createFence(text: string, language: string): string {
  let longestBacktickRun = 0;

  for (const [run] of text.matchAll(/`+/g)) {
    longestBacktickRun = Math.max(longestBacktickRun, run.length);
  }

  const fence = "`".repeat(Math.max(3, longestBacktickRun + 1));
  const label = language ? ` ${language}` : "";

  const separator = text.endsWith("\n") ? "" : "\n";

  return `${fence}${label}\n${text}${separator}${fence}`;
}

const markdownFenceHook: GenerationHook = {
  id: "markdown-code-fence",
  stage: "pre-write",
  run({ destination, source, sourceReference, text }) {
    if (!markdownExtensions.has(getExtension(destination)) || text.length === 0) {
      return { text };
    }

    const sourcePath = source?.path ?? sourceReference;
    const extension = getExtension(sourcePath);

    if (markdownExtensions.has(extension)) {
      return { text };
    }

    return { text: createFence(text, getFenceLanguage(sourcePath)) };
  },
};

/** Creates the Markdown integration, which fences extracted non-Markdown fragments. */
export const markdownPlugin: PluginFactory = () => {
  return {
    name: "write-once-markdown",
    hooks: [markdownFenceHook] as const,
  };
};
