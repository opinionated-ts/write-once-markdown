import { extname } from "node:path";

interface MarkdownHookContext {
  stage: string;
  destination: string;
  source?: { path: string };
  sourceReference?: string;
  text: string;
}

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

  return `${fence}${label}\n${text}\n${fence}`;
}

const markdownFenceHook = {
  id: "markdown-code-fence",
  stage: "pre-write",
  run({ destination, source, sourceReference, text }: MarkdownHookContext) {
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
export function markdownPlugin() {
  return {
    name: "write-once-markdown",
    hooks: [markdownFenceHook] as const,
  };
}
